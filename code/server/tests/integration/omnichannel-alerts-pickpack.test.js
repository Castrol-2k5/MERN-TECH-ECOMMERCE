import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';

setupTestDB();

describe('Omnichannel Alerts & Pick/Pack Integration Tests (UC-OMNI-01 & UC-OMNI-02)', () => {
  let superAdminToken;
  let staffAToken;
  let customerToken;
  let branchA;
  let branchB;
  let skuWithShelf;
  let skuNoShelf;
  let branchAOnlineOrder;
  let branchBOnlineOrder;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-OMNI-A',
      name: 'Showroom Quận 1',
      address: '123 Minh Khai, Q1, TP.HCM',
      phone: '0901112223',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-OMNI-B',
      name: 'Showroom Thủ Đức',
      address: '45 Võ Văn Ngân, Thủ Đức, TP.HCM',
      phone: '0904445556',
      location: { type: 'Point', coordinates: [106.76, 10.85] },
      isActive: true
    });

    await User.create({
      fullName: 'Super Admin Omni',
      email: 'admin.omni@techstore.com',
      phone: '0909100001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.omni@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    await User.create({
      fullName: 'Staff Omni Q1',
      email: 'staff.omni@techstore.com',
      phone: '0909100002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.omni@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = staffLogin.body.data.accessToken;

    await User.create({
      fullName: 'Customer Omni',
      email: 'cust.omni@techstore.com',
      phone: '0909100003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const custLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'cust.omni@techstore.com',
      password: 'Pass@123'
    });
    customerToken = custLogin.body.data.accessToken;

    const fakeProdA = new mongoose.Types.ObjectId();
    const fakeProdB = new mongoose.Types.ObjectId();
    skuWithShelf = new mongoose.Types.ObjectId();
    skuNoShelf = new mongoose.Types.ObjectId();

    await BranchInventory.create([
      {
        branchId: branchA._id,
        productId: fakeProdA,
        productSkuId: skuWithShelf,
        quantity: 8,
        shelfLocation: 'Kệ A2 - Tầng 1'
      },
      {
        branchId: branchA._id,
        productId: fakeProdB,
        productSkuId: skuNoShelf,
        quantity: 12,
        shelfLocation: ''
      }
    ]);

    // 2 B2C active alerts in Branch A (PENDING & PROCESSING), plus non-alert COMPLETED & POS_STORE
    branchAOnlineOrder = await Order.create({
      orderCode: 'ORD-OMNI-A1',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchA._id,
      customerInfo: { fullName: 'Nguyễn Bảo An', phone: '0903334445', address: '88 Pasteur, Q1' },
      items: [
        {
          productId: fakeProdA,
          productSkuId: skuWithShelf,
          productName: 'iPhone 16 Pro Max 256GB',
          sku: 'IP16PM-256',
          quantity: 1,
          unitPrice: 32000000,
          subtotal: 32000000,
          serialsAssigned: ['SN-IP16-001']
        },
        {
          productId: fakeProdB,
          productSkuId: skuNoShelf,
          productName: 'Ốp lưng MagSafe',
          sku: 'CASE-MAG',
          quantity: 1,
          unitPrice: 500000,
          subtotal: 500000,
          serialsAssigned: []
        }
      ],
      totalAmount: 32500000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING
    });

    await Order.create([
      {
        orderCode: 'ORD-OMNI-A2',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branchA._id,
        customerInfo: { fullName: 'Lê Cẩm Tú', phone: '0907778889', address: '12 Lê Lợi, Q1' },
        items: [
          {
            productId: fakeProdA,
            productSkuId: skuWithShelf,
            productName: 'iPhone 16 Pro Max 256GB',
            sku: 'IP16PM-256',
            quantity: 1,
            unitPrice: 32000000,
            subtotal: 32000000
          }
        ],
        totalAmount: 32000000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.PROCESSING
      },
      {
        orderCode: 'ORD-OMNI-A-DONE',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branchA._id,
        customerInfo: { fullName: 'Đã xong', phone: '0907770000', address: 'Q1' },
        items: [
          {
            productId: fakeProdA,
            productSkuId: skuWithShelf,
            productName: 'iPhone 16',
            sku: 'IP16',
            quantity: 1,
            unitPrice: 20000000,
            subtotal: 20000000
          }
        ],
        totalAmount: 20000000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'ORD-POS-A-IGNORE',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        customerInfo: { fullName: 'POS Khach', phone: '0901110000', address: '' },
        items: [
          {
            productId: fakeProdB,
            productSkuId: skuNoShelf,
            productName: 'Phụ kiện',
            sku: 'ACC-1',
            quantity: 1,
            unitPrice: 100000,
            subtotal: 100000
          }
        ],
        totalAmount: 100000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      }
    ]);

    // 1 B2C active alert in Branch B
    branchBOnlineOrder = await Order.create({
      orderCode: 'ORD-OMNI-B1',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchB._id,
      customerInfo: { fullName: 'Khách Thủ Đức', phone: '0906667778', address: 'Thủ Đức' },
      items: [
        {
          productId: fakeProdA,
          productSkuId: skuWithShelf,
          productName: 'Laptop Gaming',
          sku: 'LAP-1',
          quantity: 1,
          unitPrice: 25000000,
          subtotal: 25000000
        }
      ],
      totalAmount: 25000000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING
    });
  });

  describe('GET /api/v1/orders/branch/alerts (UC-OMNI-01)', () => {
    it('STAFF chỉ nhận cảnh báo B2C PENDING/PROCESSING đúng chi nhánh của mình kể cả khi truyền branchId khác', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/branch/alerts?branchId=${branchB._id}`)
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.pendingCount).toBe(2);
      expect(data.newCount).toBe(1);
      expect(data.processingCount).toBe(1);
      expect(data.alerts.length).toBe(2);
      expect(data.alerts.every((a) => String(a.branchId._id) === String(branchA._id))).toBe(true);
    });

    it('SUPER_ADMIN xem được toàn chuỗi và lọc được theo ?branchId=', async () => {
      const resAll = await request(app)
        .get('/api/v1/orders/branch/alerts')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resAll.status).toBe(200);
      expect(resAll.body.data.pendingCount).toBe(3);

      const resB = await request(app)
        .get(`/api/v1/orders/branch/alerts?branchId=${branchB._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.pendingCount).toBe(1);
      expect(resB.body.data.alerts[0].orderCode).toBe('ORD-OMNI-B1');
    });

    it('Chặn CUSTOMER truy cập API cảnh báo (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/orders/branch/alerts')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/orders/:id/pick-pack (UC-OMNI-02)', () => {
    it('Trả về dữ liệu Pick & Pack kèm shelfLocation từ BranchInventory và fallback Quầy / Kho chung', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${branchAOnlineOrder._id}/pick-pack`)
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      const slipOrder = res.body.data.order;
      expect(slipOrder.orderCode).toBe('ORD-OMNI-A1');
      expect(slipOrder.items[0].shelfLocation).toBe('Kệ A2 - Tầng 1');
      expect(slipOrder.items[0].serialsAssigned).toEqual(['SN-IP16-001']);
      expect(slipOrder.items[1].shelfLocation).toBe('Quầy / Kho chung');
    });

    it('Chặn STAFF chi nhánh A xem phiếu Pick & Pack của chi nhánh B (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${branchBOnlineOrder._id}/pick-pack`)
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('CROSS_BRANCH_ACCESS_DENIED');
    });

    it('Chặn CUSTOMER xem phiếu Pick & Pack (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${branchAOnlineOrder._id}/pick-pack`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
