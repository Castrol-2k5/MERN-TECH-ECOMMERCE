import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';

setupTestDB();

describe('Branch Module Integration Tests', () => {
  let superAdminToken;
  let staffToken;
  let customerToken;

  const validBranchPayload = {
    branchCode: 'BR-Q1-FLAGSHIP',
    name: 'TechStore Chi Nhánh Quận 1 Flagship',
    address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '0912345678',
    location: {
      type: 'Point',
      coordinates: [106.6983, 10.7719] // [lng, lat] Ben Thanh Market
    }
  };

  beforeEach(async () => {
    // 1. Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.branch@techstore.com',
      phone: '0911000111',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.branch@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 2. Staff
    await User.create({
      fullName: 'Staff User',
      email: 'staff.branch@techstore.com',
      phone: '0922000222',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.branch@techstore.com',
      password: 'Pass@123'
    });
    staffToken = staffLogin.body.data.accessToken;

    // 3. Customer
    await User.create({
      fullName: 'Customer User',
      email: 'customer.branch@techstore.com',
      phone: '0933000333',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.branch@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;
  });

  describe('POST /api/v1/branches (Create Branch)', () => {
    test('Happy Path: should allow SUPER_ADMIN to create a new branch successfully', async () => {
      const res = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validBranchPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branch.branchCode).toBe('BR-Q1-FLAGSHIP');
      expect(res.body.data.branch.location.coordinates).toEqual([106.6983, 10.7719]);
      expect(res.body.data.branch.isActive).toBe(true);

      // Verify in DB
      const dbBranch = await Branch.findOne({ branchCode: 'BR-Q1-FLAGSHIP' });
      expect(dbBranch).toBeDefined();
      expect(dbBranch.name).toBe(validBranchPayload.name);
    });

    test('Negative Path: should reject duplicate branchCode with HTTP 400', async () => {
      // Seed first
      await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validBranchPayload);

      // Attempt duplicate
      const res = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validBranchPayload,
          name: 'Different Name But Same Code'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('BRANCH_EXISTS');
    });

    test('Negative Path: should fail validation on invalid GPS coordinates', async () => {
      const res = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ...validBranchPayload,
          location: {
            type: 'Point',
            coordinates: [200, 95] // Out of range bounds
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    test('Security / RBAC: should forbid CUSTOMER and STAFF from creating branches with HTTP 403', async () => {
      const customerRes = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validBranchPayload);

      expect(customerRes.status).toBe(403);
      expect(customerRes.body.errorCode).toBe('FORBIDDEN');

      const staffRes = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(validBranchPayload);

      expect(staffRes.status).toBe(403);
      expect(staffRes.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/branches (List & Detail)', () => {
    let createdBranchId;

    beforeEach(async () => {
      const branch = await Branch.create(validBranchPayload);
      createdBranchId = branch._id.toString();
    });

    test('Happy Path: should allow public access to list active branches', async () => {
      const res = await request(app).get('/api/v1/branches');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.branches)).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.branches[0].branchCode).toBe('BR-Q1-FLAGSHIP');
    });

    test('Happy Path: should allow public access to get branch detail by ID', async () => {
      const res = await request(app).get(`/api/v1/branches/${createdBranchId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branch._id).toBe(createdBranchId);
      expect(res.body.data.branch.name).toBe(validBranchPayload.name);
    });

    test('Negative Path: should return 404 for non-existent branch ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/branches/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('BRANCH_NOT_FOUND');
    });
  });

  describe('GET /api/v1/branches/nearby (GeoSpatial 2dsphere $near)', () => {
    beforeEach(async () => {
      // Ensure 2dsphere index is created in in-memory mongo
      await Branch.createIndexes();

      // Branch 1: District 1 (close to user location)
      await Branch.create({
        branchCode: 'BR-D1-CLOSE',
        name: 'Chi Nhánh Quận 1 - Chợ Bến Thành',
        address: 'Quận 1, TP.HCM',
        phone: '0911112222',
        location: {
          type: 'Point',
          coordinates: [106.6983, 10.7719] // ~200m from query point
        },
        isActive: true
      });

      // Branch 2: Thu Duc (further away)
      await Branch.create({
        branchCode: 'BR-TD-FAR',
        name: 'Chi Nhánh Thủ Đức',
        address: 'Võ Văn Ngân, Thủ Đức, TP.HCM',
        phone: '0933334444',
        location: {
          type: 'Point',
          coordinates: [106.7719, 10.8499] // ~13km away
        },
        isActive: true
      });
    });

    test('Happy Path: should return branches sorted by proximity to user coordinates', async () => {
      // User is at Ben Thanh Roundabout: [106.6990, 10.7725]
      const res = await request(app)
        .get('/api/v1/branches/nearby?lng=106.6990&lat=10.7725&distance=5000');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branches.length).toBe(1);
      expect(res.body.data.branches[0].branchCode).toBe('BR-D1-CLOSE');
    });

    test('Negative Path: should fail validation when coordinates are missing or invalid', async () => {
      const res = await request(app).get('/api/v1/branches/nearby?lng=invalid&lat=10.7725');

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT & DELETE /api/v1/branches/:id (Update & Soft Delete)', () => {
    let branchId;

    beforeEach(async () => {
      const branch = await Branch.create(validBranchPayload);
      branchId = branch._id.toString();
    });

    test('Happy Path: should allow SUPER_ADMIN to update branch details', async () => {
      const res = await request(app)
        .put(`/api/v1/branches/${branchId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'TechStore Chi Nhánh Quận 1 (Cập Nhật)',
          phone: '0987654321'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branch.name).toBe('TechStore Chi Nhánh Quận 1 (Cập Nhật)');
      expect(res.body.data.branch.phone).toBe('0987654321');
    });

    test('Happy Path: should allow SUPER_ADMIN to soft delete branch', async () => {
      const res = await request(app)
        .delete(`/api/v1/branches/${branchId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete in DB
      const dbBranch = await Branch.findById(branchId);
      expect(dbBranch.isActive).toBe(false);

      // Excluded from active list
      const listRes = await request(app).get('/api/v1/branches');
      expect(listRes.body.data.total).toBe(0);
    });

    test('Security / RBAC: should forbid non-admin from updating or deleting branch', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/branches/${branchId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Hacked Branch' });

      expect(updateRes.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`/api/v1/branches/${branchId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(deleteRes.status).toBe(403);
    });
  });
});
