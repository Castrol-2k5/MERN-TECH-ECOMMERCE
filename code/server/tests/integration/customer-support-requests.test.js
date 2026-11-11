import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';

setupTestDB();

describe('Customer Omnichannel Wave 4: Self-Service Warranty / Return / Complaint Requests', () => {
  let branchA;
  let branchB;
  let managerA;
  let managerB;
  let customer;
  let otherCustomer;
  let managerAToken;
  let managerBToken;
  let customerToken;
  let otherCustomerToken;
  let posOrder;

  beforeEach(async () => {
    [branchA, branchB] = await Branch.create([
      {
        branchCode: 'BR-SUP-A',
        name: 'Showroom Q1 Support',
        address: '10 Nguyễn Huệ, Q1',
        phone: '0901444555',
        location: { type: 'Point', coordinates: [106.7, 10.77] },
        isActive: true
      },
      {
        branchCode: 'BR-SUP-B',
        name: 'Showroom Q7 Support',
        address: '20 Nguyễn Văn Linh, Q7',
        phone: '0901444666',
        location: { type: 'Point', coordinates: [106.71, 10.74] },
        isActive: true
      }
    ]);

    const cat = await Category.create({ name: 'Laptop Sup', slug: 'laptop-sup', isActive: true });
    const prod = await Product.create({
      name: 'MacBook Air M4 Support Test',
      slug: 'macbook-air-m4-support-test',
      categoryId: cat._id,
      brand: 'Apple',
      isActive: true,
      skus: [{ sku: 'MBA-SUP-16', price: 29990000, isActive: true }]
    });

    [managerA, managerB, customer, otherCustomer] = await User.create([
      {
        fullName: 'Manager A',
        email: 'mgrA.sup@techstore.com',
        phone: '0903000111',
        passwordHash: 'Pass@123',
        role: USER_ROLES.BRANCH_MANAGER,
        branchId: branchA._id,
        isActive: true
      },
      {
        fullName: 'Manager B',
        email: 'mgrB.sup@techstore.com',
        phone: '0903000222',
        passwordHash: 'Pass@123',
        role: USER_ROLES.BRANCH_MANAGER,
        branchId: branchB._id,
        isActive: true
      },
      {
        fullName: 'Khách Hậu Mãi',
        email: 'cus.sup@test.com',
        phone: '0909888777',
        passwordHash: 'Pass@123',
        role: USER_ROLES.CUSTOMER,
        isActive: true
      },
      {
        fullName: 'Khách Lạ',
        email: 'other.sup@test.com',
        phone: '0901999888',
        passwordHash: 'Pass@123',
        role: USER_ROLES.CUSTOMER,
        isActive: true
      }
    ]);

    const [mARes, mBRes, cRes, oRes] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ identifier: 'mgrA.sup@techstore.com', password: 'Pass@123' }),
      request(app).post('/api/v1/auth/login').send({ identifier: 'mgrB.sup@techstore.com', password: 'Pass@123' }),
      request(app).post('/api/v1/auth/login').send({ identifier: 'cus.sup@test.com', password: 'Pass@123' }),
      request(app).post('/api/v1/auth/login').send({ identifier: 'other.sup@test.com', password: 'Pass@123' })
    ]);

    managerAToken = mARes.body.data.accessToken;
    managerBToken = mBRes.body.data.accessToken;
    customerToken = cRes.body.data.accessToken;
    otherCustomerToken = oRes.body.data.accessToken;

    posOrder = await Order.create({
      orderCode: 'ORD-SUP-POS1',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchA._id,
      customerId: null,
      customerInfo: { fullName: 'Khách Hậu Mãi', phone: '+84909888777' },
      items: [
        {
          productId: prod._id,
          productSkuId: prod.skus[0]._id,
          productName: prod.name,
          sku: 'MBA-SUP-16',
          quantity: 1,
          unitPrice: 29990000,
          subtotal: 29990000,
          serialsAssigned: ['SN-MBA-SUP-001']
        }
      ],
      totalAmount: 29990000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED
    });

    await Serial.create({
      serialNumber: 'SN-MBA-SUP-001',
      productId: prod._id,
      productSkuId: prod.skus[0]._id,
      branchId: branchA._id,
      orderId: posOrder._id,
      status: SERIAL_STATUS.SOLD
    });
  });

  it('routes customer warranty/support requests to the order branch manager and lets customer track resolution', async () => {
    // 1. Customer submits a remote warranty request using orderCode + serialNumber
    const createRes = await request(app)
      .post('/api/v1/complaints/customer')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        requestType: 'WARRANTY_REQUEST',
        orderCode: posOrder.orderCode,
        serialNumber: 'sn-mba-sup-001',
        description: 'Màn hình bị nhấp nháy nhẹ khi mở máy 20 phút'
      });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.body.data.complaint;
    expect(created.requestType).toBe('WARRANTY_REQUEST');
    expect(created.serialNumber).toBe('SN-MBA-SUP-001');
    expect(created.status).toBe('OPEN');
    expect(String(created.branchId._id || created.branchId)).toBe(String(branchA._id));

    // 2. Other customer cannot hijack this orderCode
    const hijackRes = await request(app)
      .post('/api/v1/complaints/customer')
      .set('Authorization', `Bearer ${otherCustomerToken}`)
      .send({
        requestType: 'RETURN_REQUEST',
        orderCode: posOrder.orderCode,
        description: 'Thử gửi yêu cầu vào đơn người khác'
      });
    expect(hijackRes.statusCode).toBe(403);

    // 3. Branch A manager sees the request, Branch B manager does NOT
    const listARes = await request(app)
      .get('/api/v1/complaints')
      .set('Authorization', `Bearer ${managerAToken}`);
    expect(listARes.statusCode).toBe(200);
    expect(listARes.body.data.complaints.some((c) => c.complaintCode === created.complaintCode)).toBe(true);

    const listBRes = await request(app)
      .get('/api/v1/complaints')
      .set('Authorization', `Bearer ${managerBToken}`);
    expect(listBRes.statusCode).toBe(200);
    expect(listBRes.body.data.complaints.some((c) => c.complaintCode === created.complaintCode)).toBe(false);

    // 4. Branch A manager resolves the request with resolution + compensation note
    const resolveRes = await request(app)
      .patch(`/api/v1/complaints/${created._id}`)
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        status: 'RESOLVED',
        resolutionNote: 'Đã đặt lịch tiếp nhận kiểm tra màn hình tại Showroom Q1 miễn phí',
        compensationNote: 'Tặng phiếu vệ sinh & dán màn hình'
      });
    expect(resolveRes.statusCode).toBe(200);

    // 5. Customer queries GET /api/v1/complaints/my-requests and sees the resolution
    const myRes = await request(app)
      .get('/api/v1/complaints/my-requests')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(myRes.statusCode).toBe(200);
    const mine = myRes.body.data.requests.find((r) => r.complaintCode === created.complaintCode);
    expect(mine).toBeDefined();
    expect(mine.status).toBe('RESOLVED');
    expect(mine.resolutionNote).toContain('Showroom Q1');
    expect(mine.compensationNote).toContain('dán màn hình');
  });
});
