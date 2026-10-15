import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Order, ORDER_TYPES, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/modules/orders/order.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { Product } from '../../src/modules/products/product.model.js';

setupTestDB();

describe('Order Dispatch & Fulfillment Integration Tests (UC-BM-04 -> UC-BM-06)', () => {
  let superAdminToken;
  let managerToken;
  let branchQ1;
  let branchTD;
  let testProduct;
  let testSkuId;
  let testSerial;

  beforeEach(async () => {
    // 1. Tạo 2 chi nhánh
    branchQ1 = await Branch.create({
      branchCode: 'BR-DISPATCH-Q1',
      name: 'Chi Nhánh Dispatch Q1',
      address: '100 Lê Lợi, Q1, TP.HCM',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.7] }
    });

    branchTD = await Branch.create({
      branchCode: 'BR-DISPATCH-TD',
      name: 'Chi Nhánh Dispatch Thủ Đức',
      address: '200 Võ Văn Ngân, Thủ Đức, TP.HCM',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.75, 10.85] }
    });

    // 2. Tạo Admin và Manager
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.dispatch@techstore.com',
      phone: '0901000001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.dispatch@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    await User.create({
      fullName: 'Manager Q1',
      email: 'manager.dispatch@techstore.com',
      phone: '0901000002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchQ1._id,
      isActive: true
    });
    const managerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'manager.dispatch@techstore.com',
      password: 'Pass@123'
    });
    managerToken = managerLogin.body.data.accessToken;

    // 3. Tạo Product & Sku
    testSkuId = new mongoose.Types.ObjectId();
    testProduct = await Product.create({
      name: 'iPhone 16 Pro Max 256GB',
      slug: 'iphone-16-pro-max-256gb-dispatch',
      brand: 'Apple',
      categoryId: new mongoose.Types.ObjectId(),
      price: 34990000,
      specs: { screen: '6.9 inch' },
      skus: [
        {
          _id: testSkuId,
          sku: 'IP16PM-256-TEST',
          price: 34990000,
          inventoryTracking: true,
          attributes: { color: 'Titanium' }
        }
      ]
    });

    // 4. Tạo Serial IN_STOCK
    testSerial = await Serial.create({
      serialNumber: 'SN-TEST-DISPATCH-001',
      productId: testProduct._id,
      productSkuId: testSkuId,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK,
      warrantyMonths: 12
    });
  });

  it('PATCH /api/v1/orders/:id/allocate - Điều phối đơn hàng sang chi nhánh', async () => {
    // Tạo đơn B2C PENDING
    const order = await Order.create({
      orderCode: 'ORD-DISPATCH-001',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchQ1._id,
      customerInfo: { fullName: 'Khách Test', phone: '0909000999', address: 'HCM' },
      items: [
        {
          productId: testProduct._id,
          productSkuId: testSkuId,
          productName: testProduct.name,
          sku: 'IP16PM-256-TEST',
          quantity: 1,
          unitPrice: 34990000,
          subtotal: 34990000
        }
      ],
      totalAmount: 34990000,
      paymentMethod: PAYMENT_METHODS.VNPAY,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.PENDING
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${order._id}/allocate`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ branchId: branchTD._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.branchId.toString()).toBe(branchTD._id.toString());
    expect(res.body.data.order.orderStatus).toBe(ORDER_STATUS.PROCESSING);
  });

  it('PATCH /api/v1/orders/:id/dispatch - Gán serial và kích hoạt bảo hành điện tử', async () => {
    const order = await Order.create({
      orderCode: 'ORD-DISPATCH-002',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchQ1._id,
      customerInfo: { fullName: 'Khách Test 2', phone: '0909000888', address: 'HCM' },
      items: [
        {
          productId: testProduct._id,
          productSkuId: testSkuId,
          productName: testProduct.name,
          sku: 'IP16PM-256-TEST',
          quantity: 1,
          unitPrice: 34990000,
          subtotal: 34990000
        }
      ],
      totalAmount: 34990000,
      paymentMethod: PAYMENT_METHODS.VNPAY,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.PROCESSING
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${order._id}/dispatch`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        serials: [testSerial.serialNumber],
        orderStatus: ORDER_STATUS.READY_FOR_SHIPPING
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order.orderStatus).toBe(ORDER_STATUS.READY_FOR_SHIPPING);

    // Kiểm tra serial đã chuyển sang SOLD và kích hoạt bảo hành
    const updatedSerial = await Serial.findOne({ serialNumber: testSerial.serialNumber });
    expect(updatedSerial.status).toBe(SERIAL_STATUS.SOLD);
    expect(updatedSerial.soldAt).toBeDefined();
    expect(updatedSerial.warrantyEndDate).toBeDefined();
  });
});
