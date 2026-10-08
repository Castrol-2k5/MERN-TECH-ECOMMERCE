import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';

setupTestDB();

describe('Serial/IMEI Module Integration Tests', () => {
  let superAdminToken;
  let branchManagerAToken;
  let staffAToken;
  let staffBToken;
  let customerToken;

  let branchA;
  let branchB;
  let productMacbook;
  let skuMacbook;

  beforeEach(async () => {
    // 1. Create Branches
    branchA = await Branch.create({
      branchCode: 'BR-POS-Q1',
      name: 'TechStore Chi Nhánh Quận 1 POS',
      address: '123 Lê Lợi, Q1, TP.HCM',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.6983, 10.7719] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-POS-Q3',
      name: 'TechStore Chi Nhánh Quận 3 POS',
      address: '789 CMT8, Q3, TP.HCM',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.6789, 10.7812] },
      isActive: true
    });

    // 2. Create Category & Product
    const category = await Category.create({
      name: 'Laptops',
      slug: 'laptops',
      attributeKeys: ['cpu', 'ram', 'ssd'],
      isActive: true
    });

    skuMacbook = {
      _id: new mongoose.Types.ObjectId(),
      sku: 'MBA-M3-16-512-SLV',
      price: 34990000,
      salePrice: 32990000,
      images: ['https://cdn.techstore.vn/macbook-air-m3.jpg'],
      optionValues: [
        { optionName: 'ram', value: '16GB' },
        { optionName: 'ssd', value: '512GB' }
      ],
      isActive: true
    };

    productMacbook = await Product.create({
      name: 'MacBook Air 15 M3 2024',
      slug: 'macbook-air-15-m3-2024',
      categoryId: category._id,
      brand: 'Apple',
      description: 'MacBook Air chip Apple Silicon M3',
      images: ['https://cdn.techstore.vn/mba-m3.jpg'],
      attributes: [
        { key: 'cpu', value: 'Apple M3' },
        { key: 'ram', value: '16GB' },
        { key: 'ssd', value: '512GB' }
      ],
      options: [
        { name: 'ram', displayType: 'button', values: ['16GB'] },
        { name: 'ssd', displayType: 'button', values: ['512GB'] }
      ],
      skus: [skuMacbook],
      isActive: true
    });

    // 3. Create Users
    // 3.1 Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.serial@techstore.com',
      phone: '0911555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.serial@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 3.2 Branch Manager at Branch A
    await User.create({
      fullName: 'Manager Branch A',
      email: 'manager.serial.a@techstore.com',
      phone: '0922555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    const managerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'manager.serial.a@techstore.com',
      password: 'Pass@123'
    });
    branchManagerAToken = managerLogin.body.data.accessToken;

    // 3.3 Staff at Branch A
    await User.create({
      fullName: 'Staff Branch A',
      email: 'staff.serial.a@techstore.com',
      phone: '0933555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const staffALogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.serial.a@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = staffALogin.body.data.accessToken;

    // 3.4 Staff at Branch B
    await User.create({
      fullName: 'Staff Branch B',
      email: 'staff.serial.b@techstore.com',
      phone: '0944555777',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchB._id,
      isActive: true
    });
    const staffBLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.serial.b@techstore.com',
      password: 'Pass@123'
    });
    staffBToken = staffBLogin.body.data.accessToken;

    // 3.5 Customer
    await User.create({
      fullName: 'Customer User',
      email: 'customer.serial@techstore.com',
      phone: '0955555888',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.serial@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;
  });

  describe('POST /api/v1/serials/import (Batch Serial Import & Stock Increment)', () => {
    test('Happy Path - Import: should create 3 IN_STOCK serials and atomically increment inventory quantity to 3', async () => {
      const payload = {
        branchId: branchA._id.toString(),
        productId: productMacbook._id.toString(),
        productSkuId: skuMacbook._id.toString(),
        serials: ['C02G1234MD6R', 'C02G1235MD6R', 'C02G1236MD6R']
      };

      const res = await request(app)
        .post('/api/v1/serials/import')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.importedCount).toBe(3);
      expect(res.body.data.serials.length).toBe(3);

      // Verify Serial records created with IN_STOCK status
      const serialsInDb = await Serial.find({ branchId: branchA._id });
      expect(serialsInDb.length).toBe(3);
      serialsInDb.forEach((s) => {
        expect(s.status).toBe(SERIAL_STATUS.IN_STOCK);
        expect(s.productSkuId.toString()).toBe(skuMacbook._id.toString());
      });

      // Verify BranchInventory quantity atomically incremented to 3
      const inventory = await BranchInventory.findOne({
        branchId: branchA._id,
        productSkuId: skuMacbook._id
      });
      expect(inventory).toBeDefined();
      expect(inventory.quantity).toBe(3);
    });

    test('Duplicate Serial Error: should reject import when serial already exists in database with HTTP 400', async () => {
      // 1. Seed existing serial
      await Serial.create({
        serialNumber: 'C02EXISTING01',
        productId: productMacbook._id,
        productSkuId: skuMacbook._id,
        branchId: branchA._id,
        status: SERIAL_STATUS.IN_STOCK
      });

      // 2. Attempt importing duplicate
      const res = await request(app)
        .post('/api/v1/serials/import')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productMacbook._id.toString(),
          productSkuId: skuMacbook._id.toString(),
          serials: ['C02EXISTING01', 'C02NEWSERIAL02']
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('DUPLICATE_SERIAL');
    });

    test('Validation Error: should reject batch containing internal duplicate serials', async () => {
      const res = await request(app)
        .post('/api/v1/serials/import')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productMacbook._id.toString(),
          productSkuId: skuMacbook._id.toString(),
          serials: ['C02DUP001', 'c02dup001'] // same case-insensitive duplicate
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    test('Cross-Branch Security: should forbid BRANCH_MANAGER from importing serials to another branch', async () => {
      const res = await request(app)
        .post('/api/v1/serials/import')
        .set('Authorization', `Bearer ${branchManagerAToken}`)
        .send({
          branchId: branchB._id.toString(), // Manager of Branch A imports into Branch B
          productId: productMacbook._id.toString(),
          productSkuId: skuMacbook._id.toString(),
          serials: ['C02CROSSBRANCH01']
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('CROSS_BRANCH_ACCESS_DENIED');
    });
  });

  describe('GET /api/v1/serials/scan/:serialNumber (POS Barcode / QR Scan)', () => {
    beforeEach(async () => {
      // Seed serials in Branch A and Branch B
      await Serial.create([
        {
          serialNumber: 'MBA-VALID-A',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchA._id,
          status: SERIAL_STATUS.IN_STOCK
        },
        {
          serialNumber: 'MBA-VALID-B',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchB._id,
          status: SERIAL_STATUS.IN_STOCK
        },
        {
          serialNumber: 'MBA-SOLD-01',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchA._id,
          status: SERIAL_STATUS.SOLD,
          soldAt: new Date(),
          warrantyEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ]);
    });

    test('POS Barcode Scan: should return product and SKU info with HTTP 200 for valid IN_STOCK serial at staff branch', async () => {
      const res = await request(app)
        .get('/api/v1/serials/scan/MBA-VALID-A')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serialNumber).toBe('MBA-VALID-A');
      expect(res.body.data.status).toBe(SERIAL_STATUS.IN_STOCK);
      expect(res.body.data.product).toBeDefined();
      expect(res.body.data.product.name).toBe('MacBook Air 15 M3 2024');
      expect(res.body.data.sku).toBeDefined();
      expect(res.body.data.sku.sku).toBe('MBA-M3-16-512-SLV');
      expect(res.body.data.sku.price).toBe(34990000);

      // Verify Staff B can also scan serial at Branch B
      const resB = await request(app)
        .get('/api/v1/serials/scan/MBA-VALID-B')
        .set('Authorization', `Bearer ${staffBToken}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data.serialNumber).toBe('MBA-VALID-B');
    });

    test('Scan Serial Sai Chi Nhánh: should reject scan with HTTP 403 when serial belongs to another branch', async () => {
      // Staff of Branch A tries to scan device assigned to Branch B
      const res = await request(app)
        .get('/api/v1/serials/scan/MBA-VALID-B')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('CROSS_BRANCH_ACCESS_DENIED');
    });

    test('Scan Serial Đã Bán: should reject scan with HTTP 400 when serial status is SOLD', async () => {
      const res = await request(app)
        .get('/api/v1/serials/scan/MBA-SOLD-01')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_SERIAL_STATUS');
    });

    test('Negative Path: should return HTTP 404 when serial does not exist', async () => {
      const res = await request(app)
        .get('/api/v1/serials/scan/NON-EXISTENT-SERIAL')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('SERIAL_NOT_FOUND');
    });

    test('Security / RBAC: should forbid CUSTOMER from accessing POS scan endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/serials/scan/MBA-VALID-A')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/serials/verify/:serialNumber (Public e-Warranty Lookup)', () => {
    const soldDate = new Date('2025-01-15T10:00:00.000Z');
    const futureWarranty = new Date('2027-01-15T10:00:00.000Z');
    const expiredWarranty = new Date('2024-01-15T10:00:00.000Z');

    beforeEach(async () => {
      await Serial.create([
        {
          serialNumber: 'MBA-ACTIVE-WAR',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchA._id,
          status: SERIAL_STATUS.SOLD,
          soldAt: soldDate,
          warrantyEndDate: futureWarranty
        },
        {
          serialNumber: 'MBA-EXPIRED-WAR',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchA._id,
          status: SERIAL_STATUS.SOLD,
          soldAt: new Date('2023-01-15T10:00:00.000Z'),
          warrantyEndDate: expiredWarranty
        }
      ]);
    });

    test('Public e-Warranty Lookup: should return 100% accurate warranty info for active warranty device', async () => {
      const res = await request(app).get('/api/v1/serials/verify/MBA-ACTIVE-WAR');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serialNumber).toBe('MBA-ACTIVE-WAR');
      expect(res.body.data.productName).toBe('MacBook Air 15 M3 2024');
      expect(res.body.data.sku).toBe('MBA-M3-16-512-SLV');
      expect(res.body.data.status).toBe(SERIAL_STATUS.SOLD);
      expect(new Date(res.body.data.warrantyEndDate).toISOString()).toBe(futureWarranty.toISOString());
      expect(res.body.data.isExpired).toBe(false);
    });

    test('Public e-Warranty Lookup: should correctly identify expired warranty (isExpired = true)', async () => {
      const res = await request(app).get('/api/v1/serials/verify/MBA-EXPIRED-WAR');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isExpired).toBe(true);
    });

    test('Negative Path: should return HTTP 404 for unknown serial number', async () => {
      const res = await request(app).get('/api/v1/serials/verify/UNKNOWN-SERIAL-999');

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('SERIAL_NOT_FOUND');
    });
  });

  describe('GET /api/v1/serials (List & Filter with Scope)', () => {
    beforeEach(async () => {
      await Serial.create([
        {
          serialNumber: 'SN-TEST-BRANCH-A-1',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchA._id,
          status: SERIAL_STATUS.IN_STOCK
        },
        {
          serialNumber: 'SN-TEST-BRANCH-A-2',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchA._id,
          status: SERIAL_STATUS.SOLD
        },
        {
          serialNumber: 'SN-TEST-BRANCH-B-1',
          productId: productMacbook._id,
          productSkuId: skuMacbook._id,
          branchId: branchB._id,
          status: SERIAL_STATUS.IN_STOCK
        }
      ]);
    });

    test('Happy Path: Super Admin có thể lọc serial theo branchId, productSkuId, status', async () => {
      const res = await request(app)
        .get(`/api/v1/serials?branchId=${branchA._id}&status=IN_STOCK&productSkuId=${skuMacbook._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].serialNumber).toBe('SN-TEST-BRANCH-A-1');
      expect(res.body.meta.pagination.total).toBe(1);
    });

    test('Data Scoping: Staff tại Chi nhánh A tự động bị scope về Chi nhánh A', async () => {
      // Dù cố tình truyền query ?branchId=branchB, middleware scopeBranch vẫn ghi đè thành branchA
      const res = await request(app)
        .get(`/api/v1/serials?branchId=${branchB._id}`)
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const serialNumbers = res.body.data.map((s) => s.serialNumber);
      expect(serialNumbers).toContain('SN-TEST-BRANCH-A-1');
      expect(serialNumbers).not.toContain('SN-TEST-BRANCH-B-1');
    });

    test('Security / RBAC: Customer không được phép truy cập danh sách Serial', async () => {
      const res = await request(app)
        .get('/api/v1/serials')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });
});

