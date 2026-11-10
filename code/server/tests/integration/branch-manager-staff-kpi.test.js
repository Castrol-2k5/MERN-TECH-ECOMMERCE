import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Session } from '../../src/modules/auth/session.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';
import { PosShift, SHIFT_STATUS } from '../../src/modules/shifts/posShift.model.js';
import { WarrantyTicket, WARRANTY_STATUS } from '../../src/modules/warranty/warranty.model.js';

setupTestDB();

describe('Branch Manager Staff Management & Team KPI Ranking (Wave 1 - UC-BM-01 & UC-BM-02)', () => {
  let branchA;
  let branchB;
  let superAdmin;
  let managerA;
  let staffA1;
  let staffA2;
  let staffB1;
  let managerAToken;
  let staffAToken;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-BM-Q1',
      name: 'Showroom Q1 Test',
      address: '123 Minh Khai, Q1',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-BM-TDUC',
      name: 'Showroom Thủ Đức Test',
      address: '45 Võ Văn Ngân',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.76, 10.85] },
      isActive: true
    });

    superAdmin = await User.create({
      fullName: 'HQ Admin',
      email: 'hq.bmtest@techstore.com',
      phone: '0909300001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });

    managerA = await User.create({
      fullName: 'Quản Lý Q1',
      email: 'mgr.q1@techstore.com',
      phone: '0909300002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    const mgrLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'mgr.q1@techstore.com',
      password: 'Pass@123'
    });
    managerAToken = mgrLogin.body.data.accessToken;

    staffA1 = await User.create({
      fullName: 'Thu Ngân Top 1',
      email: 'staff.a1@techstore.com',
      phone: '0909300003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.a1@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = staffLogin.body.data.accessToken;

    staffA2 = await User.create({
      fullName: 'Thu Ngân Top 2',
      email: 'staff.a2@techstore.com',
      phone: '0909300004',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });

    staffB1 = await User.create({
      fullName: 'Thu Ngân Chi Nhánh B',
      email: 'staff.b1@techstore.com',
      phone: '0909300005',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchB._id,
      isActive: true
    });
  });

  describe('UC-BM-01: Quản lý tài khoản STAFF trong phạm vi chi nhánh', () => {
    it('BRANCH_MANAGER cập nhật & khóa tài khoản STAFF cùng chi nhánh -> thu hồi Session ngay', async () => {
      const sessionsBefore = await Session.countDocuments({ userId: staffA1._id });
      expect(sessionsBefore).toBeGreaterThanOrEqual(1);

      const updateRes = await request(app)
        .put(`/api/v1/users/${staffA1._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ fullName: 'Thu Ngân Q1 Đã Sửa' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.user.fullName).toBe('Thu Ngân Q1 Đã Sửa');

      const lockRes = await request(app)
        .patch(`/api/v1/users/${staffA1._id}/status`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });

      expect(lockRes.status).toBe(200);
      expect(lockRes.body.data.user.isActive).toBe(false);

      const sessionsAfter = await Session.countDocuments({ userId: staffA1._id });
      expect(sessionsAfter).toBe(0);
    });

    it('Chặn BRANCH_MANAGER thao tác lên STAFF chi nhánh khác hoặc leo thang role SUPER_ADMIN (HTTP 403)', async () => {
      const crossBranchRes = await request(app)
        .patch(`/api/v1/users/${staffB1._id}/status`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });
      expect(crossBranchRes.status).toBe(403);
      expect(crossBranchRes.body.errorCode).toBe('CROSS_BRANCH_FORBIDDEN');

      const touchAdminRes = await request(app)
        .patch(`/api/v1/users/${superAdmin._id}/status`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });
      expect(touchAdminRes.status).toBe(403);

      const escalateRes = await request(app)
        .put(`/api/v1/users/${staffA1._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ role: USER_ROLES.SUPER_ADMIN });
      expect(escalateRes.status).toBe(403);
    });
  });

  describe('UC-BM-02: Bảng xếp hạng KPI đội ngũ chi nhánh', () => {
    beforeEach(async () => {
      const fakeProdId = new mongoose.Types.ObjectId();
      const fakeSkuId = new mongoose.Types.ObjectId();

      // Staff A1: 50tr - 5tr hoàn = 45tr net (1 đơn partially_returned)
      await Order.create({
        orderCode: 'ORD-RANK-A1',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        staffId: staffA1._id,
        customerInfo: { fullName: 'Khách 1', phone: '0901110001' },
        items: [
          {
            productId: fakeProdId,
            productSkuId: fakeSkuId,
            productName: 'MacBook Pro',
            sku: 'MBP-16',
            quantity: 1,
            unitPrice: 50000000,
            subtotal: 50000000
          }
        ],
        totalAmount: 50000000,
        refundedAmount: 5000000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.PARTIALLY_RETURNED
      });

      // Staff A2: 20tr COMPLETED
      await Order.create({
        orderCode: 'ORD-RANK-A2',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        staffId: staffA2._id,
        customerInfo: { fullName: 'Khách 2', phone: '0901110002' },
        items: [
          {
            productId: fakeProdId,
            productSkuId: fakeSkuId,
            productName: 'iPad Air',
            sku: 'IPAD-AIR',
            quantity: 1,
            unitPrice: 20000000,
            subtotal: 20000000
          }
        ],
        totalAmount: 20000000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      });

      // Staff B1 ở chi nhánh khác (99tr) -> PHẢI BỊ LOẠI khỏi bảng xếp hạng của Manager A
      await Order.create({
        orderCode: 'ORD-RANK-B1',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchB._id,
        staffId: staffB1._id,
        customerInfo: { fullName: 'Khách B', phone: '0901110003' },
        items: [
          {
            productId: fakeProdId,
            productSkuId: fakeSkuId,
            productName: 'Gaming Laptop',
            sku: 'LAP-B',
            quantity: 1,
            unitPrice: 99000000,
            subtotal: 99000000
          }
        ],
        totalAmount: 99000000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      });

      await PosShift.create({
        shiftCode: 'SH-BM-01',
        branchId: branchA._id,
        cashierId: staffA1._id,
        openingBalance: 1000000,
        status: SHIFT_STATUS.OPEN
      });

      await WarrantyTicket.create({
        ticketCode: 'WR-BM-01',
        serialNumber: 'SN-BM-001',
        productId: fakeProdId,
        branchId: branchA._id,
        staffId: staffA2._id,
        issueDescription: 'Kiểm tra sạc',
        status: WARRANTY_STATUS.RECEIVED
      });
    });

    it('BRANCH_MANAGER lấy đúng Bảng xếp hạng KPI của chi nhánh mình kể cả khi truyền branchId khác', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/branch-staff-kpi?range=7d&branchId=${branchB._id}`)
        .set('Authorization', `Bearer ${managerAToken}`);

      expect(res.status).toBe(200);
      const { summary, ranking } = res.body.data;

      expect(summary.totalTeamRevenue).toBe(65000000);
      expect(summary.totalTeamOrders).toBe(2);
      expect(summary.topPerformer.fullName).toBe('Thu Ngân Top 1');
      expect(ranking.some((r) => String(r.staffId) === String(staffB1._id))).toBe(false);

      const rank1 = ranking[0];
      expect(rank1.rank).toBe(1);
      expect(rank1.netRevenue).toBe(45000000);
      expect(rank1.shiftCount).toBe(1);
      expect(rank1.returnRate).toBe(100);

      const rank2 = ranking.find((r) => String(r.staffId) === String(staffA2._id));
      expect(rank2.rank).toBe(2);
      expect(rank2.netRevenue).toBe(20000000);
      expect(rank2.warrantyCount).toBe(1);
      expect(rank2.returnRate).toBe(0);
    });

    it('Chặn STAFF thường xem bảng xếp hạng KPI chi nhánh (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/branch-staff-kpi')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(403);
    });
  });
});
