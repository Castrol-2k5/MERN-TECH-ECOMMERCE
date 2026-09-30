import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';

setupTestDB();

describe('Inventory Module Integration Tests', () => {
  let superAdminToken;
  let branchManagerAToken;
  let staffAToken;
  let customerToken;

  let branchA;
  let branchB;
  let productIphone;
  let sku1;
  let sku2;

  beforeEach(async () => {
    // 1. Create Branches
    branchA = await Branch.create({
      branchCode: 'BR-TEST-Q1',
      name: 'TechStore Chi Nhánh Quận 1',
      address: '123 Lê Lợi, Q1, TP.HCM',
      phone: '0901000001',
      location: { type: 'Point', coordinates: [106.6983, 10.7719] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-TEST-Q7',
      name: 'TechStore Chi Nhánh Quận 7',
      address: '456 Nguyễn Thị Thập, Q7, TP.HCM',
      phone: '0901000002',
      location: { type: 'Point', coordinates: [106.7218, 10.7324] },
      isActive: true
    });

    // 2. Create Category & Product with SKUs
    const category = await Category.create({
      name: 'Smartphones',
      slug: 'smartphones',
      attributeKeys: ['storage', 'color'],
      isActive: true
    });

    sku1 = {
      _id: new mongoose.Types.ObjectId(),
      sku: 'IP15P-128-BLK',
      price: 28990000,
      salePrice: 27990000,
      images: ['https://cdn.techstore.vn/ip15p-blk.jpg'],
      optionValues: [
        { optionName: 'storage', value: '128GB' },
        { optionName: 'color', value: 'Black Titanium' }
      ],
      isActive: true
    };

    sku2 = {
      _id: new mongoose.Types.ObjectId(),
      sku: 'IP15P-256-WHT',
      price: 31990000,
      salePrice: 30990000,
      images: ['https://cdn.techstore.vn/ip15p-wht.jpg'],
      optionValues: [
        { optionName: 'storage', value: '256GB' },
        { optionName: 'color', value: 'White Titanium' }
      ],
      isActive: true
    };

    productIphone = await Product.create({
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      categoryId: category._id,
      brand: 'Apple',
      description: 'Flagship Apple A17 Pro',
      images: ['https://cdn.techstore.vn/ip15-cover.jpg'],
      attributes: [
        { key: 'storage', value: '128GB' },
        { key: 'color', value: 'Black' }
      ],
      options: [
        { name: 'storage', displayType: 'button', values: ['128GB', '256GB'] },
        { name: 'color', displayType: 'color_picker', values: ['Black Titanium', 'White Titanium'] }
      ],
      skus: [sku1, sku2],
      isActive: true
    });

    // 3. Create Users
    // 3.1 Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.inv@techstore.com',
      phone: '0911222333',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.inv@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 3.2 Branch Manager at Branch A
    await User.create({
      fullName: 'Manager Branch A',
      email: 'manager.a@techstore.com',
      phone: '0922333444',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    const managerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'manager.a@techstore.com',
      password: 'Pass@123'
    });
    branchManagerAToken = managerLogin.body.data.accessToken;

    // 3.3 Staff at Branch A
    await User.create({
      fullName: 'Staff Branch A',
      email: 'staff.a@techstore.com',
      phone: '0933444555',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.a@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = staffLogin.body.data.accessToken;

    // 3.4 Customer
    await User.create({
      fullName: 'Customer User',
      email: 'customer.inv@techstore.com',
      phone: '0944555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.inv@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;
  });

  describe('GET /api/v1/inventory/branch/:branchId (Branch Inventory)', () => {
    beforeEach(async () => {
      // Seed inventory for Branch A and Branch B
      await BranchInventory.create([
        {
          branchId: branchA._id,
          productId: productIphone._id,
          productSkuId: sku1._id,
          quantity: 15
        },
        {
          branchId: branchB._id,
          productId: productIphone._id,
          productSkuId: sku2._id,
          quantity: 8
        }
      ]);
    });

    test('Happy Path: should allow SUPER_ADMIN to view branch inventory with populated product and skus', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/branch/${branchA._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.inventories)).toBe(true);
      expect(res.body.data.inventories.length).toBe(1);

      const inv = res.body.data.inventories[0];
      expect(inv.branchId.toString()).toBe(branchA._id.toString());
      expect(inv.quantity).toBe(15);
      expect(inv.productId).toBeDefined();
      expect(inv.productId.name).toBe('iPhone 15 Pro Max');
      expect(inv.productId.skus).toBeDefined();
      expect(inv.productId.skus.length).toBe(2);
    });

    test('Data Scoping Test: Staff of Branch A attempting to query Branch B is automatically scoped to Branch A', async () => {
      // Staff A attempts to query Branch B
      const res = await request(app)
        .get(`/api/v1/inventory/branch/${branchB._id}`)
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventories.length).toBe(1);
      // Data returned is strictly Branch A's inventory
      expect(res.body.data.inventories[0].branchId.toString()).toBe(branchA._id.toString());
      expect(res.body.data.inventories[0].quantity).toBe(15);
    });

    test('Security / RBAC: should forbid CUSTOMER from accessing branch inventory endpoint', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/branch/${branchA._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    test('Negative Path: should return 400 for malformed branchId format', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/branch/invalid-object-id')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_BRANCH_ID');
    });
  });

  describe('GET /api/v1/inventory/sku/:productSkuId (Public Storefront Stock Check)', () => {
    beforeEach(async () => {
      await BranchInventory.create([
        {
          branchId: branchA._id,
          productId: productIphone._id,
          productSkuId: sku1._id,
          quantity: 5
        },
        {
          branchId: branchB._id,
          productId: productIphone._id,
          productSkuId: sku1._id,
          quantity: 12
        }
      ]);
    });

    test('Happy Path: should publicly return all active branches that currently have stock for the SKU', async () => {
      const res = await request(app).get(`/api/v1/inventory/sku/${sku1._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availableBranches.length).toBe(2);

      const branchCodes = res.body.data.availableBranches.map((item) => item.branch.branchCode);
      expect(branchCodes).toContain('BR-TEST-Q1');
      expect(branchCodes).toContain('BR-TEST-Q7');
    });

    test('Happy Path: should return empty list when no branches have available stock', async () => {
      const res = await request(app).get(`/api/v1/inventory/sku/${sku2._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availableBranches).toEqual([]);
    });
  });

  describe('POST /api/v1/inventory/adjust (Manual Stock Adjustment & Atomic OCC)', () => {
    test('Happy Path: should allow SUPER_ADMIN to adjust stock upwards (initial import/restock)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productIphone._id.toString(),
          productSkuId: sku1._id.toString(),
          quantityDelta: 20,
          reason: 'Nhập kho ban đầu từ nhà phân phối'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.quantity).toBe(20);

      const recordInDb = await BranchInventory.findOne({
        branchId: branchA._id,
        productSkuId: sku1._id
      });
      expect(recordInDb.quantity).toBe(20);
    });

    test('OCC/Atomic Check: should accurately reduce stock with negative quantityDelta', async () => {
      // 1. Seed initial stock: 10
      await BranchInventory.create({
        branchId: branchA._id,
        productId: productIphone._id,
        productSkuId: sku1._id,
        quantity: 10
      });

      // 2. Reduce stock by 4
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productIphone._id.toString(),
          productSkuId: sku1._id.toString(),
          quantityDelta: -4,
          reason: 'Xuất kho trả hàng bảo hành cho hãng'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inventory.quantity).toBe(6);

      const recordInDb = await BranchInventory.findOne({
        branchId: branchA._id,
        productSkuId: sku1._id
      });
      expect(recordInDb.quantity).toBe(6);
    });

    test('Race Condition / Zero Overselling Prevention: should reject reduction when stock is insufficient', async () => {
      // Stock is only 3
      await BranchInventory.create({
        branchId: branchA._id,
        productId: productIphone._id,
        productSkuId: sku1._id,
        quantity: 3
      });

      // Attempt to deduct 5
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productIphone._id.toString(),
          productSkuId: sku1._id.toString(),
          quantityDelta: -5,
          reason: 'Kiểm kê kho sai sót'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('PRODUCT_OUT_OF_STOCK');

      // Verify stock in DB remains 3 unchanged
      const recordInDb = await BranchInventory.findOne({
        branchId: branchA._id,
        productSkuId: sku1._id
      });
      expect(recordInDb.quantity).toBe(3);
    });

    test('Cross-Branch Security: should forbid BRANCH_MANAGER from adjusting stock at another branch', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${branchManagerAToken}`)
        .send({
          branchId: branchB._id.toString(), // Manager of Branch A attempts to adjust Branch B
          productId: productIphone._id.toString(),
          productSkuId: sku1._id.toString(),
          quantityDelta: 5,
          reason: 'Cố tình can thiệp kho chi nhánh khác'
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('CROSS_BRANCH_ACCESS_DENIED');
    });

    test('Security / RBAC: should forbid STAFF and CUSTOMER from adjusting stock', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productIphone._id.toString(),
          productSkuId: sku1._id.toString(),
          quantityDelta: 5,
          reason: 'Nhân viên không có quyền kiểm kê'
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    test('Validation Error: should reject quantityDelta of 0 with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: branchA._id.toString(),
          productId: productIphone._id.toString(),
          productSkuId: sku1._id.toString(),
          quantityDelta: 0,
          reason: 'Delta bằng 0 không hợp lệ'
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });
});
