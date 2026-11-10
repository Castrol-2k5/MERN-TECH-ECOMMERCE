import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { PosShift } from '../../src/modules/shifts/posShift.model.js';
import { InterBranchSettlement, SETTLEMENT_STATUS, SETTLEMENT_TYPE } from '../../src/modules/accounting/interBranchSettlement.model.js';
import { Order, ORDER_TYPES, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/modules/orders/order.model.js';

setupTestDB();

describe('POS Shifts & Inter-Branch Settlement Integration Tests', () => {
  let adminToken;
  let cashierToken;
  let branchQ1;
  let branchTD;
  let cashierUser;
  let adminUser;

  beforeEach(async () => {
    // 1. Tạo chi nhánh
    branchQ1 = await Branch.create({
      branchCode: 'BR-SHIFT-Q1',
      name: 'Chi Nhánh Quận 1',
      address: '100 Nguyễn Huệ, Q1, TP.HCM',
      phone: '0901234567',
      isHeadquarter: true,
      location: { type: 'Point', coordinates: [106.7, 10.7] }
    });

    branchTD = await Branch.create({
      branchCode: 'BR-SHIFT-TD',
      name: 'Chi Nhánh Thủ Đức',
      address: '50 Võ Văn Ngân, TP.Thủ Đức',
      phone: '0907654321',
      isHeadquarter: false,
      location: { type: 'Point', coordinates: [106.75, 10.85] }
    });

    // 2. Tạo User Super Admin
    adminUser = await User.create({
      fullName: 'Super Admin',
      email: 'admin.shift@techstore.com',
      phone: '0901000999',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.shift@techstore.com',
      password: 'Pass@123'
    });
    adminToken = adminLogin.body.data.accessToken;

    // 3. Tạo User Cashier Staff tại chi nhánh Thủ Đức
    cashierUser = await User.create({
      fullName: 'Thu Ngân Thủ Đức',
      email: 'cashier.td@techstore.com',
      phone: '0902000888',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchTD._id,
      isActive: true
    });

    const cashierLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'cashier.td@techstore.com',
      password: 'Pass@123'
    });
    cashierToken = cashierLogin.body.data.accessToken;
  });

  describe('1. POS Cash Drawer Shift Lifecycle', () => {
    it('Mở ca thu ngân thành công với số tiền lẻ ban đầu', async () => {
      const res = await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          openingBalance: 1000000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shift).toBeDefined();
      expect(res.body.data.shift.status).toBe('OPEN');
      expect(res.body.data.shift.openingBalance).toBe(1000000);
      expect(res.body.data.shift.expectedEndingBalance).toBe(1000000);
    });

    it('Lấy ca thu ngân đang mở (current shift)', async () => {
      // Mở ca
      await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ openingBalance: 500000 });

      const res = await request(app)
        .get('/api/v1/shifts/current')
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shift).toBeDefined();
      expect(res.body.data.shift.openingBalance).toBe(500000);
    });

    it('Rút tiền nộp két an toàn (Cash Drop) và Chốt ca đếm tiền phát hiện chênh lệch', async () => {
      // Mở ca với 1.000.000đ
      const openRes = await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ openingBalance: 1000000 });
      const shiftId = openRes.body.data.shift._id;

      // Rút 300.000đ nộp két sắt giữa ca
      const dropRes = await request(app)
        .post(`/api/v1/shifts/${shiftId}/drop`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          amount: 300000,
          reason: 'Nộp két sắt ca trưa'
        });

      expect(dropRes.status).toBe(200);
      expect(dropRes.body.data.shift.expectedEndingBalance).toBe(700000);

      // Chốt ca: Thực tế đếm được 680.000đ (lệch thiếu 20.000đ)
      const closeRes = await request(app)
        .post(`/api/v1/shifts/${shiftId}/close`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          actualEndingBalance: 680000,
          discrepancyNote: 'Thối nhầm tiền lẻ cho khách đơn lẻ'
        });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.shift.status).toBe('CLOSED');
      expect(closeRes.body.data.shift.discrepancy).toBe(-20000);
      expect(closeRes.body.data.shift.discrepancyNote).toBe('Thối nhầm tiền lẻ cho khách đơn lẻ');
    });

    it('Lập Phiếu Thu / Chi nội bộ (UC-POS-10) tính lại số dư két và chặn chi vượt mức', async () => {
      const openRes = await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ openingBalance: 500000 });
      const shiftId = openRes.body.data.shift._id;

      // 1. Lập phiếu chi 100.000đ mua nước
      const outRes = await request(app)
        .post(`/api/v1/shifts/${shiftId}/vouchers`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'OUT',
          category: 'Văn phòng phẩm / Tiếp khách',
          amount: 100000,
          reason: 'Mua 2 thùng nước suối tiếp khách'
        });

      expect(outRes.status).toBe(200);
      expect(outRes.body.data.shift.cashOutTotal).toBe(100000);
      expect(outRes.body.data.shift.expectedEndingBalance).toBe(400000);
      expect(outRes.body.data.shift.cashVouchers.length).toBe(1);

      // 2. Lập phiếu thu 250.000đ bồi thường
      const inRes = await request(app)
        .post(`/api/v1/shifts/${shiftId}/vouchers`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'IN',
          category: 'Thu tiền bồi thường / Đền bù',
          amount: 250000,
          reason: 'Thu bồi thường làm trầy phụ kiện mẫu'
        });

      expect(inRes.status).toBe(200);
      expect(inRes.body.data.shift.cashInTotal).toBe(250000);
      expect(inRes.body.data.shift.expectedEndingBalance).toBe(650000);

      // 3. Chặn lập phiếu chi 700.000đ (> 650.000đ hiện có trong két)
      const failRes = await request(app)
        .post(`/api/v1/shifts/${shiftId}/vouchers`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'OUT',
          category: 'Chi phí khác',
          amount: 700000,
          reason: 'Chi vượt số dư két'
        });

      expect(failRes.status).toBe(400);
      expect(failRes.body.errorCode).toBe('INSUFFICIENT_DRAWER_CASH');
    });
  });

  describe('2. Inter-Branch Settlement & Clearing', () => {
    it('Lấy danh sách đối soát và Super Admin xác nhận thanh toán bù trừ tiền cho chi nhánh', async () => {
      // Tạo một đơn hàng Click & Collect
      const dummyProdId = new mongoose.Types.ObjectId();
      const dummySkuId = new mongoose.Types.ObjectId();

      const order = await Order.create({
        orderCode: 'ORD-TEST-SETTLE',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branchTD._id,
        items: [{
          productId: dummyProdId,
          productSkuId: dummySkuId,
          productName: 'MacBook Air M3',
          sku: 'MAC-AIR-M3',
          quantity: 1,
          unitPrice: 30000000,
          subtotal: 30000000
        }],
        totalAmount: 30000000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      });

      // Tạo bản ghi đối soát
      const settlement = await InterBranchSettlement.create({
        settlementCode: 'STL-20261109-TEST',
        type: SETTLEMENT_TYPE.CLICK_AND_COLLECT_PAYOUT,
        orderId: order._id,
        orderCode: order.orderCode,
        sourceBranchId: branchQ1._id, // HQ
        fulfillingBranchId: branchTD._id, // Chi nhánh Thủ Đức xuất hàng
        orderAmount: 30000000,
        cogsAmount: 25500000,
        fulfillmentFee: 900000,
        totalPayableToBranch: 26400000,
        status: SETTLEMENT_STATUS.PENDING_CLEARING
      });

      // 1. Kiểm tra danh sách đối soát
      const listRes = await request(app)
        .get('/api/v1/settlements')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.settlements.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.data.summary.totalPendingPayable).toBeGreaterThanOrEqual(26400000);

      // 2. Super Admin thanh toán bù trừ
      const settleRes = await request(app)
        .post(`/api/v1/settlements/${settlement._id}/settle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankTransferRef: 'VCB-FT-999888777',
          notes: 'Đã hoàn trả giá vốn và hoa hồng showroom tháng 11'
        });

      expect(settleRes.status).toBe(200);
      expect(settleRes.body.data.settlement.status).toBe('SETTLED');
      expect(settleRes.body.data.settlement.bankTransferRef).toBe('VCB-FT-999888777');
    });
  });
});
