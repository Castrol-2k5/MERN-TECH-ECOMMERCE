import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Session } from '../../src/modules/auth/session.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { verifyAccessToken } from '../../src/utils/token.js';

// Setup MongoDB in-memory database lifecycle
setupTestDB();

describe('Auth & RBAC Flow Integration Tests (16 AC Matrix)', () => {
  // Common test fixtures
  const validCustomer = {
    fullName: 'Nguyen Van Khach',
    email: 'khachhang@techstore.com',
    phone: '0912345678',
    password: 'Password@123'
  };

  const branchAId = new mongoose.Types.ObjectId();
  const branchBId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    // Seed test branches
    await Branch.create([
      {
        _id: branchAId,
        branchCode: 'BR-Q1',
        name: 'TechStore Quan 1',
        address: '123 Le Loi, Q1, TP.HCM',
        phone: '0281234567',
        location: { type: 'Point', coordinates: [106.6983, 10.7769] },
        isActive: true
      },
      {
        _id: branchBId,
        branchCode: 'BR-Q3',
        name: 'TechStore Quan 3',
        address: '456 Vo Van Tan, Q3, TP.HCM',
        phone: '0287654321',
        location: { type: 'Point', coordinates: [106.6852, 10.7725] },
        isActive: true
      }
    ]);
  });

  // ===========================================================================
  // NHÓM 1: ĐĂNG KÝ TÀI KHOẢN (POST /api/v1/auth/register)
  // ===========================================================================
  describe('Nhóm 1: Đăng ký tài khoản (POST /api/v1/auth/register)', () => {
    test('Case 1 (Happy Path - AC-01.1): Đăng ký hợp lệ -> HTTP 201, nhận token, mật khẩu đã hash bcrypt, role mặc định CUSTOMER', async () => {
      // Act
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validCustomer);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validCustomer.email.toLowerCase());
      expect(res.body.data.user.role).toBe(USER_ROLES.CUSTOMER);

      // Check DB record
      const dbUser = await User.findOne({ email: validCustomer.email.toLowerCase() }).select('+passwordHash');
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe(USER_ROLES.CUSTOMER);
      expect(dbUser.passwordHash).not.toBe(validCustomer.password);
      const isPasswordHashed = await bcrypt.compare(validCustomer.password, dbUser.passwordHash);
      expect(isPasswordHashed).toBe(true);
    });

    test('Case 2 (Negative - Trùng Email): Đăng ký email đã tồn tại -> HTTP 400, errorCode: "USER_EXISTS"', async () => {
      // Arrange
      await request(app).post('/api/v1/auth/register').send(validCustomer);

      // Act
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validCustomer,
          phone: '0987654321' // Different phone, duplicate email
        });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('USER_EXISTS');
    });

    test('Case 3 (Negative - Trùng Phone): Đăng ký SĐT đã tồn tại -> HTTP 400, errorCode: "USER_EXISTS"', async () => {
      // Arrange
      await request(app).post('/api/v1/auth/register').send(validCustomer);

      // Act
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validCustomer,
          email: 'different.email@techstore.com' // Different email, duplicate phone
        });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('USER_EXISTS');
    });

    test('Case 4 (Security / Edge - AC-01.2): Cố tình gửi { "role": "SUPER_ADMIN" } trong body -> Bị chặn, DB không lưu SUPER_ADMIN', async () => {
      // Act
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validCustomer,
          email: 'hacker@techstore.com',
          phone: '0977112233',
          role: 'SUPER_ADMIN'
        });

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');

      // Verify DB has not stored any user with this email
      const dbUser = await User.findOne({ email: 'hacker@techstore.com' });
      expect(dbUser).toBeNull();
    });

    test('Case 5 (Validation Error): Gửi sai format SĐT VN hoặc mật khẩu < 6 ký tự -> HTTP 400 Bad Request kèm chi tiết lỗi validation', async () => {
      // Act: Invalid phone
      const resInvalidPhone = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test.validation@techstore.com',
          phone: '12345678', // Invalid VN phone
          password: 'password123'
        });

      expect(resInvalidPhone.status).toBe(400);
      expect(resInvalidPhone.body.success).toBe(false);
      expect(resInvalidPhone.body.errorCode).toBe('VALIDATION_ERROR');

      // Act: Short password
      const resShortPass = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test.shortpass@techstore.com',
          phone: '0912345678',
          password: '123' // < 6 chars
        });

      expect(resShortPass.status).toBe(400);
      expect(resShortPass.body.success).toBe(false);
      expect(resShortPass.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================================================
  // NHÓM 2: ĐĂNG NHẬP & LÀM MỚI PHIÊN (POST /api/v1/auth/login & /refresh-token)
  // ===========================================================================
  describe('Nhóm 2: Đăng nhập & Làm mới phiên (POST /api/v1/auth/login & /refresh-token)', () => {
    beforeEach(async () => {
      // Create Customer
      await User.create({
        fullName: validCustomer.fullName,
        email: validCustomer.email,
        phone: validCustomer.phone,
        passwordHash: validCustomer.password, // Pre-save will hash
        role: USER_ROLES.CUSTOMER,
        isActive: true
      });

      // Create POS Staff assigned to Branch A
      await User.create({
        fullName: 'Nguyen Van Staff',
        email: 'staff.q1@techstore.com',
        phone: '0988776655',
        passwordHash: 'StaffPassword@123',
        role: USER_ROLES.STAFF,
        branchId: branchAId,
        isActive: true
      });
    });

    test('Case 6 (Happy Path B2C - AC-02.1): Customer đăng nhập thành công -> HTTP 200, Access Token (15m), HttpOnly; SameSite=Strict cookie, session 14 ngày', async () => {
      // Act
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validCustomer.email,
          password: validCustomer.password
        });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = cookies.join(';');
      expect(cookieStr).toContain('refreshToken=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
      expect(cookieStr.toLowerCase()).toContain('samesite=strict');

      // Check Session in DB (expires in approx 14 days)
      const session = await Session.findOne({});
      expect(session).toBeDefined();
      const diffDays = Math.round((session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(14);
    });

    test('Case 7 (Happy Path Staff - AC-02.2): Nhân viên POS đăng nhập -> HTTP 200, Access Token chứa branchId, thời hạn session 8 giờ', async () => {
      // Act
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'staff.q1@techstore.com',
          password: 'StaffPassword@123'
        });

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();

      const decoded = verifyAccessToken(res.body.data.accessToken);
      expect(decoded.role).toBe(USER_ROLES.STAFF);
      expect(decoded.branchId).toBe(branchAId.toString());

      // Check Session duration (approx 8 hours)
      const session = await Session.findOne({ userId: decoded.id });
      expect(session).toBeDefined();
      const diffHours = Math.round((session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
      expect(diffHours).toBe(8);
    });

    test('Case 8 (Negative - Sai mật khẩu): Nhập sai password -> HTTP 401 Unauthorized, errorCode: "INVALID_CREDENTIALS"', async () => {
      // Act
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validCustomer.email,
          password: 'WrongPassword'
        });

      // Assert
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    test('Case 9 (Negative - Khóa tài khoản): Đăng nhập tài khoản có isActive: false -> HTTP 403 Forbidden, errorCode: "ACCOUNT_LOCKED"', async () => {
      // Arrange: lock customer
      await User.updateOne({ email: validCustomer.email }, { isActive: false });

      // Act
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validCustomer.email,
          password: validCustomer.password
        });

      // Assert
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ACCOUNT_LOCKED');
    });

    test('Case 10 (Happy Path - Silent Refresh): Gửi request tới /refresh-token kèm HttpOnly Cookie hợp lệ -> HTTP 200, cấp Access Token mới', async () => {
      // Arrange: Login first to get cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validCustomer.email,
          password: validCustomer.password
        });

      const rawCookie = loginRes.headers['set-cookie'];

      // Act: Silent Refresh
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', rawCookie);

      // Assert
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();
    });
  });

  // ===========================================================================
  // NHÓM 3: ĐĂNG XUẤT & DỌN RÁC SESSION (POST /api/v1/auth/logout & /logout-all)
  // ===========================================================================
  describe('Nhóm 3: Đăng xuất & Dọn rác Session (POST /api/v1/auth/logout & /logout-all)', () => {
    let customerUser;
    let authCookie;
    let accessToken;

    beforeEach(async () => {
      customerUser = await User.create({
        fullName: validCustomer.fullName,
        email: validCustomer.email,
        phone: validCustomer.phone,
        passwordHash: validCustomer.password,
        role: USER_ROLES.CUSTOMER,
        isActive: true
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: validCustomer.email,
          password: validCustomer.password
        });

      authCookie = loginRes.headers['set-cookie'];
      accessToken = loginRes.body.data.accessToken;
    });

    test('Case 11 (Happy Path Single Logout - AC-03.1): Gọi /logout kèm cookie -> HTTP 200, bản ghi session bị xóa khỏi DB, clear cookie', async () => {
      // Act
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', authCookie);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify session was deleted from DB
      const sessions = await Session.find({ userId: customerUser._id });
      expect(sessions.length).toBe(0);

      // Verify clear cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = cookies.join(';');
      expect(cookieStr).toContain('refreshToken=;');
    });

    test('Case 12 (Happy Path Global Logout - AC-03.2): Gọi /logout-all -> HTTP 200, dọn sạch 100% bản ghi sessions của userId đó', async () => {
      // Arrange: create 2 additional sessions for multiple devices
      await Session.create([
        {
          userId: customerUser._id,
          refreshTokenHash: 'hash_device_2',
          expiresAt: new Date(Date.now() + 100000)
        },
        {
          userId: customerUser._id,
          refreshTokenHash: 'hash_device_3',
          expiresAt: new Date(Date.now() + 100000)
        }
      ]);

      const countBefore = await Session.countDocuments({ userId: customerUser._id });
      expect(countBefore).toBe(3);

      // Act: Global Logout with bearer token
      const res = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify all sessions deleted
      const countAfter = await Session.countDocuments({ userId: customerUser._id });
      expect(countAfter).toBe(0);
    });
  });

  // ===========================================================================
  // NHÓM 4: RBAC & DATA SCOPING MIDDLEWARE 3 TẦNG
  // ===========================================================================
  describe('Nhóm 4: RBAC & Data Scoping Middleware 3 Tầng (protect, authorize, scopeBranch)', () => {
    let customerToken;
    let staffToken;
    let superAdminToken;

    beforeEach(async () => {
      // 1. Customer
      await User.create({
        fullName: 'Customer User',
        email: 'customer@techstore.com',
        phone: '0911223344',
        passwordHash: 'Pass@123',
        role: USER_ROLES.CUSTOMER,
        isActive: true
      });
      const customerLogin = await request(app).post('/api/v1/auth/login').send({
        identifier: 'customer@techstore.com',
        password: 'Pass@123'
      });
      customerToken = customerLogin.body.data.accessToken;

      // 2. Staff Branch A
      await User.create({
        fullName: 'Staff Branch A',
        email: 'staff.a@techstore.com',
        phone: '0922334455',
        passwordHash: 'Pass@123',
        role: USER_ROLES.STAFF,
        branchId: branchAId,
        isActive: true
      });
      const staffLogin = await request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.a@techstore.com',
        password: 'Pass@123'
      });
      staffToken = staffLogin.body.data.accessToken;

      // 3. Super Admin
      await User.create({
        fullName: 'HQ Super Admin',
        email: 'superadmin@techstore.com',
        phone: '0933445566',
        passwordHash: 'Pass@123',
        role: USER_ROLES.SUPER_ADMIN,
        isActive: true
      });
      const superAdminLogin = await request(app).post('/api/v1/auth/login').send({
        identifier: 'superadmin@techstore.com',
        password: 'Pass@123'
      });
      superAdminToken = superAdminLogin.body.data.accessToken;
    });

    test('Case 13 (Tầng 1 - Missing Auth Header): Gọi route /api/v1/auth/me không kèm header Bearer -> HTTP 401 Unauthorized, errorCode: "UNAUTHORIZED"', async () => {
      // Act
      const res = await request(app).get('/api/v1/auth/me');

      // Assert
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    test('Case 13b (Tầng 1 - Happy Path Me Profile): Gọi route /api/v1/auth/me kèm token hợp lệ -> HTTP 200, trả về thông tin cá nhân', async () => {
      // Act
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('customer@techstore.com');
    });

    test('Case 14 (Tầng 2 - Sai Role): Dùng token role CUSTOMER gọi endpoint dành riêng cho Admin -> HTTP 403 Forbidden, errorCode: "FORBIDDEN"', async () => {
      // Act: Customer attempts to call admin-only internal route
      const res = await request(app)
        .get('/api/v1/test/admin-only')
        .set('Authorization', `Bearer ${customerToken}`);

      // Assert
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    test('Case 15 (Tầng 3 - Data Scoping Staff - AC-04.1): Token STAFF Chi nhánh A gửi request có ?branchId=chi_nhanh_B -> Middleware scopeBranch ghi đè branchId thành Chi nhánh A', async () => {
      // Act: Staff at Branch A queries with branch B ID
      const res = await request(app)
        .get(`/api/v1/test/scoped-branch?branchId=${branchBId.toString()}`)
        .set('Authorization', `Bearer ${staffToken}`);

      // Assert: Overridden to branch A ID
      expect(res.status).toBe(200);
      expect(res.body.scopedBranchId).toBe(branchAId.toString());
      expect(res.body.branchId).toBe(branchAId.toString());
    });

    test('Case 16 (Tầng 3 - Data Scoping Admin - AC-04.2): Token SUPER_ADMIN gửi request kèm ?branchId=chi_nhanh_B -> Được phép giữ nguyên truy vấn của chi nhánh B', async () => {
      // Act: Super Admin queries with branch B ID
      const res = await request(app)
        .get(`/api/v1/test/scoped-branch?branchId=${branchBId.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      // Assert: Preserved branch B ID
      expect(res.status).toBe(200);
      expect(res.body.scopedBranchId).toBe(branchBId.toString());
    });
  });
});
