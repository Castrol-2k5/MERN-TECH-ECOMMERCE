import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';
import { WarrantyTicket, WARRANTY_STATUS } from '../../src/modules/warranty/warranty.model.js';
import { COMPLAINT_STATUS, COMPLAINT_SEVERITY } from '../../src/modules/complaints/complaint.model.js';

setupTestDB();

describe('Branch Manager Wave 4: Strategy Analytics & Complaints Escalation (UC-BM-07 & UC-BM-08)', () => {
  let branchA;
  let branchB;
  let managerAToken;
  let managerBToken;
  let staffAToken;
  let prodHot;
  let prodAged;
  let skuHotId;
  let skuAgedId;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-W4-A',
      name: 'Showroom Q1 Strategy',
      address: '123 Lê Lợi',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-W4-B',
      name: 'Showroom Q7 Strategy',
      address: '456 Nguyễn Thị Thập',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.72, 10.73] },
      isActive: true
    });

    await User.create({
      fullName: 'Manager Q1 W4',
      email: 'mgr.w4.a@techstore.com',
      phone: '0909600001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    managerAToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w4.a@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Manager Q7 W4',
      email: 'mgr.w4.b@techstore.com',
      phone: '0909600002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchB._id,
      isActive: true
    });
    managerBToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w4.b@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const staffA = await User.create({
      fullName: 'Staff Q1 W4',
      email: 'staff.w4.a@techstore.com',
      phone: '0909600003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    staffAToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.w4.a@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const cat = await Category.create({ name: 'Tech W4', slug: 'tech-w4', isActive: true });
    prodHot = await Product.create({
      name: 'iPhone 16 Pro Hot',
      slug: 'iphone-16-hot-w4',
      brand: 'Apple',
      categoryId: cat._id,
      basePrice: 30000000,
      isSerialManaged: true,
      skus: [{ sku: 'HOT-IP16', price: 30000000 }]
    });
    skuHotId = prodHot.skus[0]._id;

    prodAged = await Product.create({
      name: 'Tablet Tồn Kho Lâu',
      slug: 'tablet-aged-w4',
      brand: 'Samsung',
      categoryId: cat._id,
      basePrice: 12000000,
      isSerialManaged: true,
      skus: [{ sku: 'AGED-TAB', price: 12000000 }]
    });
    skuAgedId = prodAged.skus[0]._id;

    await BranchInventory.create([
      { branchId: branchA._id, productId: prodHot._id, productSkuId: skuHotId, quantity: 2 },
      { branchId: branchA._id, productId: prodAged._id, productSkuId: skuAgedId, quantity: 1 }
    ]);

    // Serial tồn kho > 35 ngày tại branchA
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    await Serial.collection.insertOne({
      serialNumber: 'SN-AGED-40D',
      productId: prodAged._id,
      productSkuId: skuAgedId,
      branchId: branchA._id,
      status: SERIAL_STATUS.IN_STOCK,
      createdAt: fortyDaysAgo,
      updatedAt: fortyDaysAgo
    });

    // Đơn POS + B2C tại Branch A (loại trừ Branch B)
    await Order.create([
      {
        orderCode: 'ORD-W4-POS1',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        staffId: staffA._id,
        customerInfo: { fullName: 'Khách POS', phone: '0901112233' },
        items: [
          {
            productId: prodHot._id,
            productSkuId: skuHotId,
            productName: prodHot.name,
            sku: 'HOT-IP16',
            quantity: 3,
            unitPrice: 30000000,
            subtotal: 90000000
          }
        ],
        totalAmount: 90000000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'ORD-W4-B2C1',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branchA._id,
        customerInfo: { fullName: 'Khách Online', phone: '0904445566' },
        items: [
          {
            productId: prodHot._id,
            productSkuId: skuHotId,
            productName: prodHot.name,
            sku: 'HOT-IP16',
            quantity: 1,
            unitPrice: 30000000,
            subtotal: 30000000
          }
        ],
        totalAmount: 30000000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'ORD-W4-B-OTHER',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchB._id,
        customerInfo: { fullName: 'Khách B', phone: '0907778899' },
        items: [
          {
            productId: prodHot._id,
            productSkuId: skuHotId,
            productName: prodHot.name,
            sku: 'HOT-IP16',
            quantity: 1,
            unitPrice: 30000000,
            subtotal: 30000000
          }
        ],
        totalAmount: 30000000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      }
    ]);

    await WarrantyTicket.create({
      ticketCode: 'WR-W4-WATCH',
      serialNumber: 'SN-W4-TEST',
      productId: prodHot._id,
      branchId: branchA._id,
      staffId: staffA._id,
      customerInfo: { fullName: 'Khách Bảo Hành', phone: '0903332211' },
      issueDescription: 'Chờ duyệt báo giá thay pin',
      status: WARRANTY_STATUS.QUOTATION_PENDING
    });
  });

  it('UC-BM-07: BRANCH_MANAGER xem báo cáo chiến lược chi nhánh (Omnichannel, Peak Hours, Sales Velocity, Aging Stock > 30d)', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/branch-strategy?days=30&branchId=${branchB._id}`)
      .set('Authorization', `Bearer ${managerAToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Đã bị scope về Branch A: 90tr POS + 30tr B2C = 120tr (không cộng 30tr Branch B)
    expect(data.omnichannel.totalRevenue).toBe(120000000);
    expect(data.omnichannel.posRevenue).toBe(90000000);
    expect(data.omnichannel.onlineRevenue).toBe(30000000);
    expect(data.omnichannel.posSharePercent).toBe(75);
    expect(data.peakHours.length).toBe(15); // 08:00 -> 22:00

    expect(data.salesVelocity.length).toBe(1);
    expect(data.salesVelocity[0].sku).toBe('HOT-IP16');
    expect(data.salesVelocity[0].unitsSold).toBe(4);
    expect(data.salesVelocity[0].restockAlert).toBe(true); // tồn còn 2 <= 2

    expect(data.agingStock.length).toBe(1);
    expect(data.agingStock[0].sku).toBe('AGED-TAB');
    expect(data.agingStock[0].ageDays).toBeGreaterThanOrEqual(39);

    // Chặn STAFF xem báo cáo chiến lược
    const staffDeny = await request(app)
      .get('/api/v1/analytics/branch-strategy')
      .set('Authorization', `Bearer ${staffAToken}`);
    expect(staffDeny.status).toBe(403);
  });

  it('UC-BM-08: Tiếp nhận khiếu nại Escalation, Quản lý xử lý & Danh sách bảo hành cần chú ý', async () => {
    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${staffAToken}`)
      .send({
        orderCode: 'ORD-W4-POS1',
        customerName: 'Nguyễn Thanh Long',
        customerPhone: '0905123456',
        severity: COMPLAINT_SEVERITY.CRITICAL,
        description: 'Khách phản ánh máy nóng và yêu cầu Quản lý làm việc trực tiếp'
      });

    expect(createRes.status).toBe(201);
    const cmpId = createRes.body.data.complaint._id;

    // Chặn STAFF tự đóng/xử lý khiếu nại & chặn Manager chi nhánh B
    const staffPatch = await request(app)
      .patch(`/api/v1/complaints/${cmpId}`)
      .set('Authorization', `Bearer ${staffAToken}`)
      .send({ status: COMPLAINT_STATUS.RESOLVED, resolutionNote: 'Tự xử lý' });
    expect(staffPatch.status).toBe(403);

    const crossPatch = await request(app)
      .patch(`/api/v1/complaints/${cmpId}`)
      .set('Authorization', `Bearer ${managerBToken}`)
      .send({ status: COMPLAINT_STATUS.RESOLVED, resolutionNote: 'Xử lý chéo' });
    expect(crossPatch.status).toBe(403);

    // Manager A xử lý xong khiếu nại
    const resolveRes = await request(app)
      .patch(`/api/v1/complaints/${cmpId}`)
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        status: COMPLAINT_STATUS.RESOLVED,
        resolutionNote: 'Đã gọi xin lỗi khách và hỗ trợ kiểm tra bảo hành 1 đổi 1 theo chính sách',
        compensationNote: 'Miễn phí dán cường lực bảo vệ'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.complaint.status).toBe(COMPLAINT_STATUS.RESOLVED);

    // Watchlist bảo hành
    const watchRes = await request(app)
      .get('/api/v1/complaints/warranty-watchlist')
      .set('Authorization', `Bearer ${managerAToken}`);

    expect(watchRes.status).toBe(200);
    expect(watchRes.body.data.tickets.length).toBe(1);
    expect(watchRes.body.data.tickets[0].ticketCode).toBe('WR-W4-WATCH');
    expect(watchRes.body.data.tickets[0].needsAttention).toBe(true);
  });
});
