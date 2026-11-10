import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';
import { PosShift, SHIFT_STATUS } from '../../src/modules/shifts/posShift.model.js';
import { APPROVAL_TYPES, APPROVAL_STATUS } from '../../src/modules/approvals/approval.model.js';

setupTestDB();

describe('Branch Manager Wave 2: Cash Monitor, Discrepancy Resolution & Privilege Approvals (UC-BM-03 & UC-BM-04)', () => {
  let branchA;
  let branchB;
  let managerA;
  let staffA;
  let managerAToken;
  let managerBToken;
  let staffAToken;
  let openShift;
  let closedDiscrepancyShift;
  let posOrderHigh;
  let skuId;
  let prodId;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-W2-A',
      name: 'Showroom Q1 Wave 2',
      address: '100 Lê Lợi, Q1',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-W2-B',
      name: 'Showroom Thủ Đức Wave 2',
      address: '50 Võ Văn Ngân',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.76, 10.85] },
      isActive: true
    });

    managerA = await User.create({
      fullName: 'Quản Lý Q1',
      email: 'mgr.w2.a@techstore.com',
      phone: '0909400001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    const loginMgrA = await request(app).post('/api/v1/auth/login').send({
      identifier: 'mgr.w2.a@techstore.com',
      password: 'Pass@123'
    });
    managerAToken = loginMgrA.body.data.accessToken;

    await User.create({
      fullName: 'Quản Lý Thủ Đức',
      email: 'mgr.w2.b@techstore.com',
      phone: '0909400002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchB._id,
      isActive: true
    });
    const loginMgrB = await request(app).post('/api/v1/auth/login').send({
      identifier: 'mgr.w2.b@techstore.com',
      password: 'Pass@123'
    });
    managerBToken = loginMgrB.body.data.accessToken;

    staffA = await User.create({
      fullName: 'Thu Ngân Q1',
      email: 'staff.w2.a@techstore.com',
      phone: '0909400003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const loginStaffA = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.w2.a@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = loginStaffA.body.data.accessToken;

    prodId = new mongoose.Types.ObjectId();
    skuId = new mongoose.Types.ObjectId();

    await BranchInventory.create({
      branchId: branchA._id,
      productId: prodId,
      productSkuId: skuId,
      quantity: 2
    });

    openShift = await PosShift.create({
      shiftCode: 'SHF-W2-OPEN',
      branchId: branchA._id,
      cashierId: staffA._id,
      status: SHIFT_STATUS.OPEN,
      openingBalance: 2000000,
      cashSales: 30000000,
      expectedEndingBalance: 32000000
    });

    closedDiscrepancyShift = await PosShift.create({
      shiftCode: 'SHF-W2-DIFF',
      branchId: branchA._id,
      cashierId: staffA._id,
      status: SHIFT_STATUS.CLOSED,
      openingBalance: 1000000,
      cashSales: 5000000,
      expectedEndingBalance: 6000000,
      actualEndingBalance: 5900000,
      discrepancy: -100000,
      discrepancyNote: 'Thối dư tiền lẻ',
      closedAt: new Date()
    });

    const itemId = new mongoose.Types.ObjectId();
    posOrderHigh = await Order.create({
      orderCode: 'POS-W2-001',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchA._id,
      staffId: staffA._id,
      customerInfo: { fullName: 'Nguyễn Minh Quân', phone: '0911223344' },
      items: [
        {
          _id: itemId,
          productId: prodId,
          productSkuId: skuId,
          productName: 'MacBook Pro 14 M3',
          sku: 'MBP14-M3',
          quantity: 1,
          unitPrice: 28000000,
          subtotal: 28000000,
          serialsAssigned: ['SN-W2-MBP01']
        }
      ],
      totalAmount: 28000000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED
    });

    await Serial.create({
      serialNumber: 'SN-W2-MBP01',
      productId: prodId,
      productSkuId: skuId,
      branchId: branchA._id,
      status: SERIAL_STATUS.SOLD,
      orderId: posOrderHigh._id,
      orderItemId: itemId,
      soldAt: new Date()
    });
  });

  describe('UC-BM-03: Giám sát két tiền & Biên bản xử lý lệch tiền cuối ca', () => {
    it('BRANCH_MANAGER xem được két tiền trực tiếp và xử lý ca bị lệch tiền', async () => {
      const monitorRes = await request(app)
        .get('/api/v1/shifts/monitor')
        .set('Authorization', `Bearer ${managerAToken}`);

      expect(monitorRes.status).toBe(200);
      expect(monitorRes.body.data.openShiftsCount).toBe(1);
      expect(monitorRes.body.data.totalLiveCashInDrawers).toBe(32000000);
      expect(monitorRes.body.data.unresolvedDiscrepancyCount).toBe(1);

      // Chặn STAFF tự gọi /monitor hoặc /resolve-discrepancy
      const staffMonitor = await request(app)
        .get('/api/v1/shifts/monitor')
        .set('Authorization', `Bearer ${staffAToken}`);
      expect(staffMonitor.status).toBe(403);

      // Manager xử lý lệch tiền ca CLOSED
      const resolveRes = await request(app)
        .patch(`/api/v1/shifts/${closedDiscrepancyShift._id}/resolve-discrepancy`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({
          resolutionType: 'DEDUCT_STAFF',
          note: 'Đã đối chiếu camera và khấu trừ quỹ ca nhân viên'
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.shift.discrepancyResolution.status).toBe('RESOLVED');
      expect(resolveRes.body.data.shift.discrepancyResolution.resolutionType).toBe('DEDUCT_STAFF');

      const monitorAfter = await request(app)
        .get('/api/v1/shifts/monitor')
        .set('Authorization', `Bearer ${managerAToken}`);
      expect(monitorAfter.body.data.unresolvedDiscrepancyCount).toBe(0);
    });
  });

  describe('UC-BM-04: Phê duyệt đặc quyền (Hoàn tiền > 5tr, Chi két > 1tr, Hủy đơn POS)', () => {
    it('Chặn STAFF tự hoàn tiền > 5tr và tự chi két > 1tr (HTTP 403 APPROVAL_REQUIRED)', async () => {
      const rtnRes = await request(app)
        .post(`/api/v1/orders/${posOrderHigh._id}/return`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          items: [
            {
              productSkuId: skuId.toString(),
              quantity: 1,
              condition: 'GOOD',
              serialsReturned: ['SN-W2-MBP01']
            }
          ],
          refundMethod: 'CASH',
          reason: 'Khách đổi sang bản RAM cao hơn'
        });
      expect(rtnRes.status).toBe(403);
      expect(rtnRes.body.errorCode).toBe('APPROVAL_REQUIRED');

      const vchRes = await request(app)
        .post(`/api/v1/shifts/${openShift._id}/vouchers`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          type: 'OUT',
          category: 'Điện nước / Thuê ngoài',
          amount: 2500000,
          reason: 'Thanh toán tiền điện tháng này'
        });
      expect(vchRes.status).toBe(403);
      expect(vchRes.body.errorCode).toBe('APPROVAL_REQUIRED');
    });

    it('STAFF gửi yêu cầu hoàn tiền 28tr -> Manager Q1 bấm Duyệt -> Tự động hoàn kho, Serial & trừ két ca', async () => {
      const createRes = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          type: APPROVAL_TYPES.HIGH_VALUE_RETURN,
          targetId: posOrderHigh._id.toString(),
          reason: 'Khách muốn trả MacBook 28tr hoàn tiền mặt',
          payload: {
            refundMethod: 'CASH',
            items: [
              {
                productSkuId: skuId.toString(),
                quantity: 1,
                condition: 'GOOD',
                serialsReturned: ['SN-W2-MBP01']
              }
            ]
          }
        });

      expect(createRes.status).toBe(201);
      const approvalId = createRes.body.data.request._id;
      expect(createRes.body.data.request.estimatedAmount).toBe(28000000);

      // Chặn Manager chi nhánh khác duyệt (HTTP 403)
      const crossApprove = await request(app)
        .patch(`/api/v1/approvals/${approvalId}/approve`)
        .set('Authorization', `Bearer ${managerBToken}`)
        .send({ reviewNote: 'Duyệt nhầm' });
      expect(crossApprove.status).toBe(403);

      // Chặn STAFF tự duyệt yêu cầu của mình (HTTP 403)
      const selfApprove = await request(app)
        .patch(`/api/v1/approvals/${approvalId}/approve`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({});
      expect(selfApprove.status).toBe(403);

      // Manager Q1 duyệt -> Tự động thực thi OrderReturnService
      const approveRes = await request(app)
        .patch(`/api/v1/approvals/${approvalId}/approve`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ reviewNote: 'Đã kiểm tra máy nguyên vẹn, đồng ý hoàn tiền' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.request.status).toBe(APPROVAL_STATUS.APPROVED);
      expect(approveRes.body.data.request.executionResult.orderStatus).toBe(ORDER_STATUS.RETURNED);

      const inv = await BranchInventory.findOne({ branchId: branchA._id, productSkuId: skuId }).lean();
      expect(inv.quantity).toBe(3);

      const sn = await Serial.findOne({ serialNumber: 'SN-W2-MBP01' }).lean();
      expect(sn.status).toBe(SERIAL_STATUS.IN_STOCK);

      const shiftAfter = await PosShift.findById(openShift._id).lean();
      expect(shiftAfter.cashRefunds).toBe(28000000);
      expect(shiftAfter.expectedEndingBalance).toBe(4000000);
    });

    it('STAFF gửi yêu cầu chi két 2.5tr -> Manager duyệt -> Tự động trừ két; Và luồng Từ chối hủy hóa đơn POS', async () => {
      // 1. Large cash-out approval
      const cashReq = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          type: APPROVAL_TYPES.LARGE_CASH_OUT,
          targetId: openShift._id.toString(),
          reason: 'Thanh toán phí bảo trì máy lạnh',
          payload: { category: 'Bảo trì cửa hàng', amount: 2500000 }
        });
      expect(cashReq.status).toBe(201);

      const alertsRes = await request(app)
        .get('/api/v1/approvals/alerts')
        .set('Authorization', `Bearer ${managerAToken}`);
      expect(alertsRes.status).toBe(200);
      expect(alertsRes.body.data.pendingCount).toBe(1);

      const cashApprove = await request(app)
        .patch(`/api/v1/approvals/${cashReq.body.data.request._id}/approve`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ reviewNote: 'Đồng ý chi' });
      expect(cashApprove.status).toBe(200);

      const shiftAfter = await PosShift.findById(openShift._id).lean();
      expect(shiftAfter.cashOutTotal).toBe(2500000);
      expect(shiftAfter.expectedEndingBalance).toBe(29500000);

      // 2. Reject VOID_POS_ORDER -> Order vẫn giữ nguyên COMPLETED
      const voidReq = await request(app)
        .post('/api/v1/approvals')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          type: APPROVAL_TYPES.VOID_POS_ORDER,
          targetId: posOrderHigh._id.toString(),
          reason: 'Xin hủy hóa đơn do khách đổi ý'
        });
      expect(voidReq.status).toBe(201);

      const rejectRes = await request(app)
        .patch(`/api/v1/approvals/${voidReq.body.data.request._id}/reject`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ reviewNote: 'Đơn đã giao máy, chuyển sang quy trình trả hàng nếu cần' });
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.request.status).toBe(APPROVAL_STATUS.REJECTED);

      const ordStillCompleted = await Order.findById(posOrderHigh._id).lean();
      expect(ordStillCompleted.orderStatus).toBe(ORDER_STATUS.COMPLETED);
    });
  });
});
