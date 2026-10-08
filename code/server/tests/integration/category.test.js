import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Category } from '../../src/modules/categories/category.model.js';

setupTestDB();

describe('Category Module Integration Tests', () => {
  let superAdminToken;
  let customerToken;
  let staffToken;

  beforeEach(async () => {
    // 1. Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.cat@techstore.com',
      phone: '0911555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.cat@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 2. Customer
    await User.create({
      fullName: 'Customer User',
      email: 'customer.cat@techstore.com',
      phone: '0922555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.cat@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;

    // 3. Staff
    await User.create({
      fullName: 'Staff User',
      email: 'staff.cat@techstore.com',
      phone: '0933555666',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.cat@techstore.com',
      password: 'Pass@123'
    });
    staffToken = staffLogin.body.data.accessToken;
  });

  describe('POST /api/v1/categories (Create Category)', () => {
    test('Happy Path: should allow SUPER_ADMIN to create root category with dynamic attributeKeys', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Laptop & Máy Tính Xách Tay',
          attributeKeys: ['CPU', 'RAM', 'VGA', 'Storage']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.slug).toBe('laptop-may-tinh-xach-tay');
      expect(res.body.data.category.parentId).toBeNull();
      expect(res.body.data.category.attributeKeys).toEqual(['cpu', 'ram', 'vga', 'storage']);

      // Check DB
      const dbCat = await Category.findOne({ slug: 'laptop-may-tinh-xach-tay' });
      expect(dbCat).toBeDefined();
    });

    test('Happy Path: should create child category with parentId', async () => {
      // 1. Create root category
      const rootRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Laptop' });

      const parentId = rootRes.body.data.category._id;

      // 2. Create sub-category
      const childRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Laptop Gaming',
          parentId,
          attributeKeys: ['gpu_wattage', 'refresh_rate']
        });

      expect(childRes.status).toBe(201);
      expect(childRes.body.data.category.parentId).toBe(parentId);
      expect(childRes.body.data.category.slug).toBe('laptop-gaming');
    });

    test('Negative Path: should reject duplicate category slug with HTTP 400', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Điện Thoại' });

      const duplicateRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Điện Thoại' }); // Will produce same slug 'dien-thoai'

      expect(duplicateRes.status).toBe(400);
      expect(duplicateRes.body.errorCode).toBe('CATEGORY_EXISTS');
    });

    test('Negative Path: should return 404 when parentId does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Phụ Kiện Điện Thoại',
          parentId: fakeId
        });

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('PARENT_CATEGORY_NOT_FOUND');
    });

    test('Security / RBAC: should forbid non-admin from creating category', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Hacked Category' });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/categories (List & Tree & Slug)', () => {
    let laptopId;

    beforeEach(async () => {
      const rootCat = await Category.create({
        name: 'Laptop',
        slug: 'laptop',
        attributeKeys: ['cpu', 'ram'],
        isActive: true
      });
      laptopId = rootCat._id;

      await Category.create({
        name: 'Laptop Gaming',
        slug: 'laptop-gaming',
        parentId: laptopId,
        attributeKeys: ['vga', 'screen_hz'],
        isActive: true
      });
    });

    test('Happy Path: should return flat list of categories by default', async () => {
      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBe(2);
    });

    test('Happy Path: should return nested hierarchical tree when ?tree=true', async () => {
      const res = await request(app).get('/api/v1/categories?tree=true');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBe(1); // Only root category at top level

      const root = res.body.data.categories[0];
      expect(root.slug).toBe('laptop');
      expect(root.children.length).toBe(1);
      expect(root.children[0].slug).toBe('laptop-gaming');
    });

    test('Happy Path: should return category detail with attributeKeys when queried by slug', async () => {
      const res = await request(app).get('/api/v1/categories/laptop-gaming');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe('Laptop Gaming');
      expect(res.body.data.category.attributeKeys).toEqual(['vga', 'screen_hz']);
      expect(res.body.data.category.parentId.slug).toBe('laptop');
    });

    test('Negative Path: should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/v1/categories/non-existent-slug');

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('PUT & DELETE /api/v1/categories/:id (Update & Soft Delete)', () => {
    let categoryId;

    beforeEach(async () => {
      const cat = await Category.create({
        name: 'Linh Kiện',
        slug: 'linh-kien',
        attributeKeys: ['brand'],
        isActive: true
      });
      categoryId = cat._id.toString();
    });

    test('Happy Path: should allow SUPER_ADMIN to update category and attributeKeys', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Linh Kiện Máy Tính',
          attributeKeys: ['brand', 'warranty_months']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe('Linh Kiện Máy Tính');
      expect(res.body.data.category.slug).toBe('linh-kien-may-tinh');
      expect(res.body.data.category.attributeKeys).toEqual(['brand', 'warranty_months']);
    });

    test('Negative Path: should prevent category from setting itself as parent', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          parentId: categoryId
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_PARENT_CATEGORY');
    });

    test('Happy Path: should allow SUPER_ADMIN to soft delete category', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const dbCat = await Category.findById(categoryId);
      expect(dbCat.isActive).toBe(false);

      // Subsequent get by slug returns 404
      const getRes = await request(app).get('/api/v1/categories/linh-kien');
      expect(getRes.status).toBe(404);
    });

    test('Security / RBAC: should forbid STAFF and CUSTOMER from updating or deleting category', async () => {
      const putRes = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Hacked' });

      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(delRes.status).toBe(403);
    });
  });
});
