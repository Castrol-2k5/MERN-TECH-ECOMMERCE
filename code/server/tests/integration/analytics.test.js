import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Order, ORDER_TYPES, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/modules/orders/order.model.js';
import { Product } from '../../src/modules/products/product.model.js';

setupTestDB();

describe('Analytics & Business Intelligence Integration Tests (UC-SA-04 -> UC-SA-06)', () => {
  let superAdminToken;
  let branchQ1;

  beforeEach(async () => {
    // 1. Tạo Chi nhánh
    branchQ1 = await Branch.create({
      branchCode: 'BR-BI-Q1',
      name: 'Chi Nhánh BI Q1',
      address: '100 Lê Lợi, Q1, TP.HCM',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.7] }
    });

    // 2. Tạo Admin
    await User.create({
      fullName: 'Super Admin BI',
      email: 'admin.bi@techstore.com',
      phone: '0901000001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.bi@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 3. Tạo Product
    const skuId = new mongoose.Types.ObjectId();
    const product = await Product.create({
      name: 'MacBook Air M4',
      slug: 'macbook-air-m4-bi',
      brand: 'Apple',
      categoryId: new mongoose.Types.ObjectId(),
      price: 26490000,
      specs: {},
      skus: [{ _id: skuId, sku: 'MBA-M4-BI', price: 26490000, inventoryTracking: true }]
    });

    // 4. Tạo 2 orders (1 POS và 1 B2C)
    await Order.create([
      {
        orderCode: 'ORD-BI-001',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchQ1._id,
        items: [{ productId: product._id, productSkuId: skuId, productName: product.name, sku: 'MBA-M4-BI', quantity: 1, unitPrice: 26490000, subtotal: 26490000 }],
        totalAmount: 26490000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'ORD-BI-002',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branchQ1._id,
        items: [{ productId: product._id, productSkuId: skuId, productName: product.name, sku: 'MBA-M4-BI', quantity: 2, unitPrice: 26490000, subtotal: 52980000 }],
        totalAmount: 52980000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.PROCESSING
      }
    ]);
  });

  it('GET /api/v1/analytics/overview - Trả về đầy đủ KPIs, biểu đồ và top sản phẩm', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { kpis, revenueOverTime, channelData, branchSales, topProducts } = res.body.data;
    expect(kpis).toBeDefined();
    expect(revenueOverTime).toBeDefined();
    expect(channelData).toBeDefined();
    expect(branchSales).toBeDefined();
    expect(topProducts).toBeDefined();

    // Kiểm tra top products chứa MacBook Air M4
    expect(topProducts.length).toBeGreaterThan(0);
    expect(topProducts[0].sku).toBe('MBA-M4-BI');
    expect(topProducts[0].quantity).toBe('3 chiếc');
  });
});
