import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
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

describe('Staff Personal Sales & Performance Analytics (UC-POS-14)', () => {
  let staffA;
  let staffB;
  let staffAToken;
  let customerToken;
  let branch;
  let phoneProduct;

  beforeEach(async () => {
    branch = await Branch.create({
      branchCode: 'BR-PERF-01',
      name: 'Showroom KPI Test',
      address: '100 Nguyễn Huệ, Q1',
      phone: '0908887776',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    staffA = await User.create({
      fullName: 'Thu Ngân A',
      email: 'staff.a.kpi@techstore.com',
      phone: '0909200001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branch._id,
      isActive: true
    });
    const loginA = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.a.kpi@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = loginA.body.data.accessToken;

    staffB = await User.create({
      fullName: 'Thu Ngân B',
      email: 'staff.b.kpi@techstore.com',
      phone: '0909200002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branch._id,
      isActive: true
    });

    await User.create({
      fullName: 'Khách KPI',
      email: 'cust.kpi@techstore.com',
      phone: '0909200003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const loginCust = await request(app).post('/api/v1/auth/login').send({
      identifier: 'cust.kpi@techstore.com',
      password: 'Pass@123'
    });
    customerToken = loginCust.body.data.accessToken;

    const category = await Category.create({
      name: 'Điện thoại Cao Cấp',
      slug: 'dien-thoai-cao-cap',
      isActive: true
    });

    phoneProduct = await Product.create({
      name: 'iPhone 16 Pro Max',
      slug: 'iphone-16-pro-max-kpi',
      brand: 'Apple',
      categoryId: category._id,
      basePrice: 32000000,
      isSerialManaged: true,
      skus: [
        {
          sku: 'IP16PM-KPI-256',
          price: 32000000,
          variantName: '256GB Titan',
          barcode: '893000000111'
        }
      ]
    });

    const skuId = phoneProduct.skus[0]._id;

    // 1. Staff A - Today COMPLETED POS order (32.000.000 - refundedAmount 2.000.000 = 30.000.000 net)
    await Order.create({
      orderCode: 'POS-KPI-A1',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branch._id,
      staffId: staffA._id,
      customerInfo: { fullName: 'Khách 1', phone: '0901111222' },
      items: [
        {
          productId: phoneProduct._id,
          productSkuId: skuId,
          productName: phoneProduct.name,
          sku: 'IP16PM-KPI-256',
          quantity: 1,
          unitPrice: 32000000,
          subtotal: 32000000
        }
      ],
      totalAmount: 32000000,
      refundedAmount: 2000000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.PARTIALLY_RETURNED
    });

    // 2. Staff A - 3 days ago COMPLETED POS order (10.000.000 net)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await Order.create({
      orderCode: 'POS-KPI-A2',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branch._id,
      staffId: staffA._id,
      customerInfo: { fullName: 'Khách 2', phone: '0901111333' },
      items: [
        {
          productId: phoneProduct._id,
          productSkuId: skuId,
          productName: phoneProduct.name,
          sku: 'IP16PM-KPI-256',
          quantity: 1,
          unitPrice: 10000000,
          subtotal: 10000000
        }
      ],
      totalAmount: 10000000,
      paymentMethod: PAYMENT_METHODS.VNPAY,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED,
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo
    });

    // 3. Staff A - CANCELLED order (phải bị loại khỏi doanh thu)
    await Order.create({
      orderCode: 'POS-KPI-A-CANCEL',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branch._id,
      staffId: staffA._id,
      customerInfo: { fullName: 'Khách Hủy', phone: '0901111444' },
      items: [
        {
          productId: phoneProduct._id,
          productSkuId: skuId,
          productName: phoneProduct.name,
          sku: 'IP16PM-KPI-256',
          quantity: 1,
          unitPrice: 32000000,
          subtotal: 32000000
        }
      ],
      totalAmount: 32000000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.CANCELLED
    });

    // 4. Staff B - COMPLETED order (KHÔNG được cộng vào doanh thu Staff A)
    await Order.create({
      orderCode: 'POS-KPI-B1',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branch._id,
      staffId: staffB._id,
      customerInfo: { fullName: 'Khách B', phone: '0901111555' },
      items: [
        {
          productId: phoneProduct._id,
          productSkuId: skuId,
          productName: phoneProduct.name,
          sku: 'IP16PM-KPI-256',
          quantity: 2,
          unitPrice: 32000000,
          subtotal: 64000000
        }
      ],
      totalAmount: 64000000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED
    });

    // 5. Shifts & WarrantyTickets for Staff A & Staff B
    await PosShift.create([
      {
        shiftCode: 'SH-A-01',
        branchId: branch._id,
        cashierId: staffA._id,
        openingBalance: 1000000,
        status: SHIFT_STATUS.OPEN
      },
      {
        shiftCode: 'SH-B-01',
        branchId: branch._id,
        cashierId: staffB._id,
        openingBalance: 1000000,
        status: SHIFT_STATUS.OPEN
      }
    ]);

    await WarrantyTicket.create([
      {
        ticketCode: 'WR-A-01',
        serialNumber: 'SN-WARR-A1',
        productId: phoneProduct._id,
        branchId: branch._id,
        staffId: staffA._id,
        issueDescription: 'Lỗi loa',
        status: WARRANTY_STATUS.RECEIVED
      },
      {
        ticketCode: 'WR-B-01',
        serialNumber: 'SN-WARR-B1',
        productId: phoneProduct._id,
        branchId: branch._id,
        staffId: staffB._id,
        issueDescription: 'Lỗi màn',
        status: WARRANTY_STATUS.RECEIVED
      }
    ]);
  });

  it('STAFF chỉ xem được đúng doanh số, ca trực & bảo hành của chính mình (bỏ qua staffId giả mạo trên query)', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/my-performance?range=7d&staffId=${staffB._id}`)
      .set('Authorization', `Bearer ${staffAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    // 30tr (A1 net) + 10tr (A2) = 40.000.000đ; bỏ qua CANCELLED và Staff B
    expect(data.kpis.totalRevenue).toBe(40000000);
    expect(data.kpis.completedOrders).toBe(2);
    expect(data.kpis.posOrdersCount).toBe(2);
    expect(data.kpis.avgOrderValue).toBe(20000000);
    expect(data.kpis.shiftCount).toBe(1);
    expect(data.kpis.warrantyCount).toBe(1);

    expect(data.categoryBreakdown.length).toBe(1);
    expect(data.categoryBreakdown[0].name).toBe('Điện thoại Cao Cấp');
    expect(data.recentOrders.length).toBe(3); // A1, A2, A-CANCEL (không có B1)
    expect(data.recentOrders.every((o) => o.orderCode !== 'POS-KPI-B1')).toBe(true);
  });

  it('Bộ lọc range=today chỉ tính đơn trong ngày hôm nay', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/my-performance?range=today')
      .set('Authorization', `Bearer ${staffAToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.kpis.totalRevenue).toBe(30000000);
    expect(data.kpis.completedOrders).toBe(1);
  });

  it('Chặn CUSTOMER truy cập API doanh số nhân viên (HTTP 403)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/my-performance')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});
