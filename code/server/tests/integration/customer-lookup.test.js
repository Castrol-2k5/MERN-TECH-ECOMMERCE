import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';
import { WarrantyTicket, WARRANTY_STATUS } from '../../src/modules/warranty/warranty.model.js';

setupTestDB();

describe('POS CRM Quick Customer Lookup (UC-POS-12)', () => {
  let staffToken;
  let customerToken;
  let branch;
  let staffUser;
  let registeredCustomer;

  beforeEach(async () => {
    branch = await Branch.create({
      branchCode: 'BR-CRM-01',
      name: 'Showroom CRM Test',
      address: '10 Lê Lợi, Q1, TP.HCM',
      phone: '0901222333',
      location: { type: 'Point', coordinates: [106.7, 10.7] }
    });

    staffUser = await User.create({
      fullName: 'Cashier Staff',
      email: 'cashier.crm@techstore.com',
      phone: '0901000010',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branch._id,
      isActive: true
    });

    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'cashier.crm@techstore.com',
      password: 'Pass@123'
    });
    staffToken = staffLogin.body.data.accessToken;

    registeredCustomer = await User.create({
      fullName: 'Nguyễn Minh Tuấn',
      email: 'tuan.crm@techstore.com',
      phone: '0909000005',
      address: '250 Hai Bà Trưng, Q3, TP.HCM',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });

    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'tuan.crm@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;

    const fakeProductId = new mongoose.Types.ObjectId();
    const fakeSkuId = new mongoose.Types.ObjectId();

    await Order.create([
      {
        orderCode: 'POS-CRM-001',
        orderType: ORDER_TYPES.POS_STORE,
        customerId: registeredCustomer._id,
        customerInfo: {
          fullName: registeredCustomer.fullName,
          phone: '0909000005',
          address: registeredCustomer.address
        },
        branchId: branch._id,
        staffId: staffUser._id,
        items: [
          {
            productId: fakeProductId,
            productSkuId: fakeSkuId,
            productName: 'iPhone 16 Pro Max 256GB',
            sku: 'IP16PM-256',
            quantity: 1,
            unitPrice: 32000000,
            subtotal: 32000000
          }
        ],
        totalAmount: 32000000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'POS-CRM-002',
        orderType: ORDER_TYPES.POS_STORE,
        customerId: registeredCustomer._id,
        customerInfo: {
          fullName: registeredCustomer.fullName,
          phone: '0909000005',
          address: registeredCustomer.address
        },
        branchId: branch._id,
        staffId: staffUser._id,
        items: [
          {
            productId: fakeProductId,
            productSkuId: fakeSkuId,
            productName: 'Ốp lưng MagSafe',
            sku: 'CASE-MAG',
            quantity: 1,
            unitPrice: 500000,
            subtotal: 500000
          }
        ],
        totalAmount: 500000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.CANCELLED
      }
    ]);

    await WarrantyTicket.create({
      ticketCode: 'WR-CRM-001',
      serialNumber: 'SN-IPHONE-999',
      productId: fakeProductId,
      customerId: registeredCustomer._id,
      customerInfo: {
        fullName: registeredCustomer.fullName,
        phone: '0909000005',
        address: registeredCustomer.address
      },
      branchId: branch._id,
      staffId: staffUser._id,
      issueDescription: 'Kiểm tra pin',
      status: WARRANTY_STATUS.RETURNED
    });
  });

  it('STAFF tra cứu được thông tin CRM khách hàng đăng ký theo SĐT nội địa và ẩn trường nhạy cảm', async () => {
    const res = await request(app)
      .get('/api/v1/users/lookup-customer?phone=0909000005')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.found).toBe(true);
    expect(data.customer.fullName).toBe('Nguyễn Minh Tuấn');
    expect(data.customer.phone).toBe('0909000005');
    expect(data.customer.address).toBe('250 Hai Bà Trưng, Q3, TP.HCM');
    expect(data.customer.isRegisteredAccount).toBe(true);
    expect(data.customer.passwordHash).toBeUndefined();
    expect(data.customer.email).toBeUndefined();

    // Chỉ tính đơn COMPLETED vào tổng chi tiêu (32.000.000, bỏ qua đơn CANCELLED)
    expect(data.summary.totalCompletedOrders).toBe(1);
    expect(data.summary.totalSpent).toBe(32000000);
    expect(data.summary.recentOrdersCount).toBe(2);
    expect(data.summary.warrantyCount).toBe(1);
    expect(data.recentOrders[0].orderCode).toBeDefined();
  });

  it('Hỗ trợ chuẩn hóa đầu số +84 khi tra cứu', async () => {
    const res = await request(app)
      .get('/api/v1/users/lookup-customer')
      .query({ phone: '+84909000005' })
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.customer.fullName).toBe('Nguyễn Minh Tuấn');
  });

  it('Tra cứu được khách vãng lai chưa có tài khoản nhưng từng mua tại quầy POS', async () => {
    await Order.create({
      orderCode: 'POS-GUEST-01',
      orderType: ORDER_TYPES.POS_STORE,
      customerId: null,
      customerInfo: {
        fullName: 'Khách Lẻ Trần An',
        phone: '0912345678',
        address: '99 Cách Mạng Tháng 8'
      },
      branchId: branch._id,
      staffId: staffUser._id,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          productSkuId: new mongoose.Types.ObjectId(),
          productName: 'Chuột Logitech MX Master 3S',
          sku: 'MX-3S',
          quantity: 1,
          unitPrice: 2400000,
          subtotal: 2400000
        }
      ],
      totalAmount: 2400000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED
    });

    const res = await request(app)
      .get('/api/v1/users/lookup-customer?phone=0912345678')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.customer.fullName).toBe('Khách Lẻ Trần An');
    expect(res.body.data.customer.address).toBe('99 Cách Mạng Tháng 8');
    expect(res.body.data.customer.isRegisteredAccount).toBe(false);
    expect(res.body.data.summary.totalCompletedOrders).toBe(1);
    expect(res.body.data.summary.totalSpent).toBe(2400000);
  });

  it('Trả về found = false với SĐT hợp lệ nhưng chưa có lịch sử', async () => {
    const res = await request(app)
      .get('/api/v1/users/lookup-customer?phone=0988777666')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.found).toBe(false);
    expect(res.body.data.customer).toBeNull();
    expect(res.body.data.summary.totalCompletedOrders).toBe(0);
  });

  it('Từ chối SĐT không hợp lệ với HTTP 400 INVALID_PHONE_FORMAT', async () => {
    const res = await request(app)
      .get('/api/v1/users/lookup-customer?phone=12345')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_PHONE_FORMAT');
  });

  it('Chặn CUSTOMER tự tra cứu endpoint POS CRM (HTTP 403)', async () => {
    const res = await request(app)
      .get('/api/v1/users/lookup-customer?phone=0909000005')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});
