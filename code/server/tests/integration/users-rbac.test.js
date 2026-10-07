import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';

setupTestDB();

describe('Users & RBAC Integration Tests (UC-SA-01 -> UC-SA-03)', () => {
  let superAdminToken;
  let managerToken;
  let staffToken;
  let branchA;
  let branchB;

  beforeEach(async () => {
    // 1. Tạo 2 chi nhánh
    branchA = await Branch.create({
      branchCode: 'BR-TEST-A',
      name: 'Chi Nhánh Test A',
      address: '100 Nguyễn Huệ, Q1, TP.HCM',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.7] }
    });

    branchB = await Branch.create({
      branchCode: 'BR-TEST-B',
      name: 'Chi Nhánh Test B',
      address: '200 Võ Văn Ngân, Thủ Đức, TP.HCM',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.75, 10.85] }
    });

    // 2. Tạo Super Admin
    await User.create({
      fullName: 'Super Admin User',
      email: 'admin.rbac@techstore.com',
      phone: '0901000001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.rbac@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 3. Tạo Branch Manager ở Branch A
    await User.create({
      fullName: 'Manager Branch A',
      email: 'manager.a@techstore.com',
      phone: '0901000002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    const managerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'manager.a@techstore.com',
      password: 'Pass@123'
    });
    managerToken = managerLogin.body.data.accessToken;

    // 4. Tạo Staff ở Branch A
    await User.create({
      fullName: 'Staff Branch A',
      email: 'staff.a@techstore.com',
      phone: '0901000003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.a@techstore.com',
      password: 'Pass@123'
    });
    staffToken = staffLogin.body.data.accessToken;
  });

  describe('GET /api/v1/users (Danh sách tài khoản & Scoping)', () => {
    it('SUPER_ADMIN xem được tất cả nhân sự toàn chuỗi', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
    });

    it('BRANCH_MANAGER chỉ thấy nhân viên thuộc chi nhánh của mình', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Manager A chỉ thấy nhân sự branch A, không thấy Super Admin không thuộc branch
      res.body.data.users.forEach((u) => {
        expect(u.branchId?._id?.toString() || u.branchId?.toString()).toBe(branchA._id.toString());
      });
    });

    it('STAFF bị từ chối quyền truy cập (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/users (Tạo nhân sự mới)', () => {
    it('SUPER_ADMIN tạo nhân viên thành công với mật khẩu ban đầu', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Nhân Viên Mới Q1',
          email: 'new.staff@techstore.com',
          phone: '0903333333',
          password: 'InitialPassword123',
          role: USER_ROLES.STAFF,
          branchId: branchA._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('new.staff@techstore.com');
      expect(res.body.data.user.role).toBe(USER_ROLES.STAFF);

      // Đăng nhập bằng tài khoản mới vừa tạo
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        identifier: 'new.staff@techstore.com',
        password: 'InitialPassword123'
      });
      expect(loginRes.status).toBe(200);
    });

    it('BRANCH_MANAGER chỉ được phép tạo STAFF cho chính chi nhánh mình', async () => {
      // Cố tạo cho branch B -> Phải bị từ chối
      const failRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fullName: 'Nhân Viên Branch B',
          email: 'staff.b@techstore.com',
          phone: '0904444444',
          password: 'InitialPassword123',
          role: USER_ROLES.STAFF,
          branchId: branchB._id.toString()
        });
      expect(failRes.status).toBe(403);

      // Tạo đúng branch A -> Thành công
      const successRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fullName: 'Nhân Viên Branch A',
          email: 'staff.a2@techstore.com',
          phone: '0905555555',
          password: 'InitialPassword123',
          role: USER_ROLES.STAFF,
          branchId: branchA._id.toString()
        });
      expect(successRes.status).toBe(201);
    });
  });

  describe('PUT /api/v1/users/:id (Cập nhật nhân sự)', () => {
    it('SUPER_ADMIN có thể cập nhật trạng thái hoạt động hoặc chi nhánh', async () => {
      const user = await User.findOne({ email: 'staff.a@techstore.com' });
      const res = await request(app)
        .put(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Staff Branch A Renamed',
          isActive: false
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.fullName).toBe('Staff Branch A Renamed');
      expect(res.body.data.user.isActive).toBe(false);
    });
  });
});
