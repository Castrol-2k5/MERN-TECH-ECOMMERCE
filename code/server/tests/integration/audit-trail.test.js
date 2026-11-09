import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { AuditLog, AUDIT_ACTIONS, AUDIT_SEVERITY } from '../../src/modules/audit/auditLog.model.js';
import { generateAccessToken } from '../../src/utils/token.js';

setupTestDB();

describe('Audit Trail & Activity Tracking Integration Tests', () => {
  let superAdminToken;
  let staffToken;
  let testBranch;
  let testProduct;
  let testSkuId;
  let adminUser;
  let staffUser;

  beforeEach(async () => {
    // 1. Tạo chi nhánh kiểm thử
    testBranch = await Branch.create({
      branchCode: 'BR-TEST-AUDIT',
      name: 'Chi nhánh Kiểm toán Test',
      address: '100 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM',
      phone: '02838440001',
      location: { type: 'Point', coordinates: [106.6789, 10.795] },
      isHeadquarter: false,
      isActive: true
    });

    // 2. Tạo Super Admin & Staff
    adminUser = await User.create({
      fullName: 'Super Admin Audit',
      email: 'admin.audit@techone.vn',
      phone: '0909001001',
      passwordHash: 'Password123!',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    superAdminToken = generateAccessToken({
      id: adminUser._id.toString(),
      role: adminUser.role,
      branchId: null
    });

    staffUser = await User.create({
      fullName: 'Nhân viên Audit',
      email: 'staff.audit@techone.vn',
      phone: '0909002002',
      passwordHash: 'Password123!',
      role: USER_ROLES.STAFF,
      branchId: testBranch._id,
      isActive: true
    });
    staffToken = generateAccessToken({
      id: staffUser._id.toString(),
      role: staffUser.role,
      branchId: testBranch._id.toString()
    });

    // 3. Tạo danh mục & sản phẩm
    const category = await Category.create({
      name: 'Laptop Audit',
      slug: 'laptop-audit',
      isActive: true
    });

    testSkuId = new mongoose.Types.ObjectId();
    testProduct = await Product.create({
      name: 'MacBook Pro 16 M3 Max Audit Test',
      slug: 'macbook-pro-16-m3-max-audit',
      categoryId: category._id,
      brand: 'Apple',
      isActive: true,
      skus: [
        {
          _id: testSkuId,
          sku: 'MBP16-M3MAX-AUDIT',
          barcode: '893899990001',
          price: 85000000,
          salePrice: 79900000,
          status: 'IN_STOCK'
        }
      ]
    });
  });

  describe('1. Security & RBAC Access Control', () => {
    it('Chặn nhân viên STAFF truy cập API nhật ký kiểm toán với HTTP 403', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });

    it('Cho phép SUPER_ADMIN truy cập danh sách nhật ký kiểm toán với HTTP 200', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('2. Tự động ghi vết khi Điều chỉnh tồn kho (Stock Adjustment)', () => {
    it('Thực hiện adjustStock -> Tự động sinh AuditLog STOCK_ADJUST với đầy đủ Snapshot Before/After', async () => {
      // 1. Thực hiện tăng tồn kho (+10 máy)
      const adjustRes = await request(app)
        .post('/api/v1/inventory/adjust')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          branchId: testBranch._id.toString(),
          productId: testProduct._id.toString(),
          productSkuId: testSkuId.toString(),
          quantityDelta: 10,
          reason: 'Nhập lô hàng ban đầu phục vụ kiểm toán'
        });

      expect(adjustRes.status).toBe(200);

      // Đợi ngắn để đảm bảo tiến trình ngầm hoàn tất
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Tra cứu nhật ký Audit Log
      const auditRes = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ action: AUDIT_ACTIONS.STOCK_ADJUST });

      expect(auditRes.status).toBe(200);
      const stockLogs = auditRes.body.data.logs;
      expect(stockLogs.length).toBeGreaterThanOrEqual(1);

      const targetLog = stockLogs.find(
        (l) => l.target.code === 'MBP16-M3MAX-AUDIT' && l.action === AUDIT_ACTIONS.STOCK_ADJUST
      );
      expect(targetLog).toBeDefined();
      expect(targetLog.actor.fullName).toBe('Super Admin Audit');
      expect(targetLog.target.model).toBe('BranchInventory');
      expect(targetLog.changes.diff.quantityPhysical).toBe(10);
      expect(targetLog.context.reason).toBe('Nhập lô hàng ban đầu phục vụ kiểm toán');
    });
  });

  describe('3. Tự động ghi vết vòng đời Ca Thu Ngân POS (Shift Lifecycle)', () => {
    it('Luồng ca POS: Mở ca -> Rút tiền két -> Chốt ca lệch tiền tự động sinh đủ 3 Audit Logs', async () => {
      // Bước 1: Mở ca thu ngân 1.500.000đ
      const openRes = await request(app)
        .post('/api/v1/shifts/open')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          branchId: testBranch._id.toString(),
          openingBalance: 1500000
        });

      expect(openRes.status).toBe(201);
      const activeShiftId = openRes.body.data?.shift?._id || openRes.body.data?._id;

      // Bước 2: Rút tiền nộp két an toàn 500.000đ
      const dropRes = await request(app)
        .post(`/api/v1/shifts/${activeShiftId}/drop`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          amount: 500000,
          reason: 'Nộp két sắt đợt 1'
        });

      expect(dropRes.status).toBe(200);

      // Bước 3: Chốt ca thu ngân: expected = 1.000.000đ, đếm được 900.000đ (lệch -100.000đ)
      const closeRes = await request(app)
        .post(`/api/v1/shifts/${activeShiftId}/close`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          actualEndingBalance: 900000,
          discrepancyNote: 'Nghi ngờ thối nhầm tiền thừa cho khách'
        });

      expect(closeRes.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Bước 4: Kiểm tra đầy đủ 3 bản ghi Audit Log được sinh ra
      const logRes = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(logRes.status).toBe(200);
      const shiftLogs = logRes.body.data.logs.filter(
        (l) => String(l.target.entityId) === String(activeShiftId)
      );

      expect(shiftLogs.length).toBe(3);

      const openLog = shiftLogs.find((l) => l.action === AUDIT_ACTIONS.POS_SHIFT_OPEN);
      expect(openLog).toBeDefined();
      expect(openLog.changes.after.openingBalance).toBe(1500000);

      const dropLog = shiftLogs.find((l) => l.action === AUDIT_ACTIONS.POS_SHIFT_CASH_DROP);
      expect(dropLog).toBeDefined();
      expect(dropLog.changes.diff.dropAmount).toBe(-500000);

      const closeLog = shiftLogs.find((l) => l.action === AUDIT_ACTIONS.POS_SHIFT_CLOSE);
      expect(closeLog).toBeDefined();
      expect(closeLog.severity).toBe(AUDIT_SEVERITY.CRITICAL);
      expect(closeLog.changes.after.discrepancy).toBe(-100000);
    });
  });

  describe('4. Tính Bất Biến của Sổ Kiểm Toán (Tamper-Proof Immutability)', () => {
    it('Chặn mọi hành vi sửa (updateOne) hoặc xóa (deleteOne) nhật ký kiểm toán', async () => {
      const log = await AuditLog.create({
        actor: { fullName: 'Nhân viên A', role: 'STAFF' },
        action: AUDIT_ACTIONS.STOCK_ADJUST,
        target: { model: 'BranchInventory', code: 'SKU-TEST', name: 'Sản phẩm test' },
        changes: { diff: { quantity: 1 } },
        context: { reason: 'Test bất biến' }
      });

      expect(log).toBeDefined();

      // Cố tình update qua model
      await expect(
        AuditLog.updateOne({ _id: log._id }, { $set: { status: 'FAILURE' } })
      ).rejects.toThrow('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm chỉnh sửa dữ liệu.');

      // Cố tình delete qua model
      await expect(
        AuditLog.deleteOne({ _id: log._id })
      ).rejects.toThrow('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm xóa dữ liệu.');
    });
  });

  describe('5. API Thống kê & Dòng thời gian Thực thể (Stats & Entity Timeline)', () => {
    it('GET /api/v1/audit-logs/stats và /entity/:model/:entityId hoạt động chính xác', async () => {
      const entityId = new mongoose.Types.ObjectId();
      await AuditLog.create([
        {
          actor: { fullName: 'Super Admin' },
          action: AUDIT_ACTIONS.STOCK_ADJUST,
          severity: AUDIT_SEVERITY.WARNING,
          target: { model: 'Product', entityId, code: 'TEST-SKU-1' }
        },
        {
          actor: { fullName: 'Thu ngân A' },
          action: AUDIT_ACTIONS.POS_SHIFT_CLOSE,
          severity: AUDIT_SEVERITY.CRITICAL,
          target: { model: 'Product', entityId, code: 'TEST-SKU-1' },
          changes: { after: { discrepancy: -50000 } }
        }
      ]);

      // 1. Kiểm tra thống kê
      const statsRes = await request(app)
        .get('/api/v1/audit-logs/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.totalToday).toBeGreaterThanOrEqual(2);
      expect(statsRes.body.data.criticalToday).toBeGreaterThanOrEqual(1);

      // 2. Kiểm tra timeline theo entity
      const timelineRes = await request(app)
        .get(`/api/v1/audit-logs/entity/Product/${entityId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(timelineRes.status).toBe(200);
      expect(Array.isArray(timelineRes.body.data.timeline)).toBe(true);
      expect(timelineRes.body.data.timeline.length).toBe(2);
    });
  });
});
