import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { WarrantyTicket, WARRANTY_STATUS } from '../../src/modules/warranty/warranty.model.js';

setupTestDB();

describe('Warranty Module Integration Tests', () => {
  let superAdminToken;
  let staffAToken;
  let staffBToken;
  let customerToken;

  let branchA;
  let branchB;
  let productIphone;
  let skuIphone;
  let soldSerial;
  let inStockSerial;

  beforeEach(async () => {
    // 1. Create Branches
    branchA = await Branch.create({
      branchCode: 'BR-WAR-Q1',
      name: 'TechStore Chi Nhánh Quận 1',
      address: '123 Lê Lợi, Q1, TP.HCM',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.6983, 10.7719] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-WAR-Q3',
      name: 'TechStore Chi Nhánh Quận 3',
      address: '789 CMT8, Q3, TP.HCM',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.6789, 10.7812] },
      isActive: true
    });

    // 2. Create Users
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.war@techstore.com',
      phone: '0900000001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });

    await User.create({
      fullName: 'Staff Branch A',
      email: 'staff.a.war@techstore.com',
      phone: '0900000002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });

    await User.create({
      fullName: 'Staff Branch B',
      email: 'staff.b.war@techstore.com',
      phone: '0900000003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchB._id,
      isActive: true
    });

    await User.create({
      fullName: 'Customer Test',
      email: 'customer.war@techstore.com',
      phone: '0900000004',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });

    // Login tokens
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.war@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    const staffALogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.a.war@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = staffALogin.body.data.accessToken;

    const staffBLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.b.war@techstore.com',
      password: 'Pass@123'
    });
    staffBToken = staffBLogin.body.data.accessToken;

    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.war@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;

    // 3. Category & Product
    const category = await Category.create({
      name: 'Phones',
      slug: 'phones',
      attributeKeys: ['screen', 'storage'],
      isActive: true
    });

    skuIphone = {
      _id: new mongoose.Types.ObjectId(),
      sku: 'IP15-128-BLK',
      price: 22990000,
      salePrice: 20990000,
      images: ['https://cdn.techstore.vn/ip15.jpg'],
      optionValues: [{ optionName: 'storage', value: '128GB' }],
      isActive: true
    };

    productIphone = await Product.create({
      name: 'iPhone 15 128GB Black',
      slug: 'iphone-15-128gb-black',
      categoryId: category._id,
      brand: 'Apple',
      description: 'iPhone 15 tiêu chuẩn',
      images: ['https://cdn.techstore.vn/ip15.jpg'],
      attributes: [
        { key: 'screen', value: '6.1 inch' },
        { key: 'storage', value: '128GB' }
      ],
      options: [{ name: 'storage', displayType: 'button', values: ['128GB'] }],
      skus: [skuIphone],
      isActive: true
    });

    // 4. Create Serials
    soldSerial = await Serial.create({
      serialNumber: 'IP15-SOLD-SN-001',
      productId: productIphone._id,
      productSkuId: skuIphone._id,
      branchId: branchA._id,
      status: SERIAL_STATUS.SOLD,
      soldAt: new Date(),
      warrantyEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    inStockSerial = await Serial.create({
      serialNumber: 'IP15-STOCK-SN-002',
      productId: productIphone._id,
      productSkuId: skuIphone._id,
      branchId: branchA._id,
      status: SERIAL_STATUS.IN_STOCK
    });
  });

  describe('POST /api/v1/warranty (Tiếp nhận bảo hành)', () => {
    test('Happy Path: Tiếp nhận bảo hành thành công -> HTTP 201, sinh ticketCode RMA-YYYYMMDD-XXXX, status RECEIVED, Serial đổi sang WARRANTY', async () => {
      const payload = {
        serialNumber: soldSerial.serialNumber,
        issueDescription: 'Màn hình không lên nguồn, sạc không báo tín hiệu',
        customerInfo: {
          fullName: 'Trần Văn Khách',
          phone: '0912345678'
        },
        notes: 'Máy xước viền nhẹ'
      };

      const res = await request(app)
        .post('/api/v1/warranty')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketCode).toMatch(/^RMA-\d{8}-[A-F0-9]{4}$/);
      expect(res.body.data.status).toBe(WARRANTY_STATUS.RECEIVED);
      expect(res.body.data.serialNumber).toBe(soldSerial.serialNumber);
      expect(res.body.data.issueDescription).toBe(payload.issueDescription);

      // Kiểm tra Serial trong DB chuyển sang trạng thái WARRANTY
      const updatedSerial = await Serial.findById(soldSerial._id);
      expect(updatedSerial.status).toBe(SERIAL_STATUS.WARRANTY);
    });

    test('Negative Path: Không tìm thấy Serial/IMEI trong hệ thống -> HTTP 404 SERIAL_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/api/v1/warranty')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          serialNumber: 'NON-EXISTENT-SERIAL-999',
          issueDescription: 'Hỏng mic'
        });

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('SERIAL_NOT_FOUND');
    });

    test('Negative Path: Serial chưa được bán (IN_STOCK) -> HTTP 400 SERIAL_NOT_SOLD', async () => {
      const res = await request(app)
        .post('/api/v1/warranty')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          serialNumber: inStockSerial.serialNumber,
          issueDescription: 'Máy không sạc được'
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('SERIAL_NOT_SOLD');
    });

    test('Security / RBAC: Khách hàng CUSTOMER không có quyền tạo phiếu bảo hành -> HTTP 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/warranty')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serialNumber: soldSerial.serialNumber,
          issueDescription: 'Hỏng loa ngoài'
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/warranty (Tra cứu danh sách bảo hành)', () => {
    beforeEach(async () => {
      // Seed tickets
      await WarrantyTicket.create([
        {
          ticketCode: 'RMA-20261003-AA01',
          serialNumber: soldSerial.serialNumber,
          productId: productIphone._id,
          branchId: branchA._id,
          staffId: new mongoose.Types.ObjectId(),
          issueDescription: 'Lỗi loa',
          status: WARRANTY_STATUS.RECEIVED
        },
        {
          ticketCode: 'RMA-20261003-BB02',
          serialNumber: 'IP15-SOLD-SN-BRANCH-B',
          productId: productIphone._id,
          branchId: branchB._id,
          staffId: new mongoose.Types.ObjectId(),
          issueDescription: 'Lỗi cảm ứng',
          status: WARRANTY_STATUS.PROCESSING
        }
      ]);
    });

    test('Happy Path: Super Admin xem được danh sách phiếu bảo hành toàn chuỗi', async () => {
      const res = await request(app)
        .get('/api/v1/warranty')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.pagination.total).toBe(2);
    });

    test('Data Scoping: Staff Chi nhánh A và B chỉ xem được phiếu bảo hành tại đúng chi nhánh của mình', async () => {
      const resA = await request(app)
        .get('/api/v1/warranty')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].ticketCode).toBe('RMA-20261003-AA01');

      const resB = await request(app)
        .get('/api/v1/warranty')
        .set('Authorization', `Bearer ${staffBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
      expect(resB.body.data.length).toBe(1);
      expect(resB.body.data[0].ticketCode).toBe('RMA-20261003-BB02');
    });
  });
});

