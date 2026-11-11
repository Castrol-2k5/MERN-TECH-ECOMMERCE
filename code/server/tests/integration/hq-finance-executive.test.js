import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch, BRANCH_REGIONS } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Order, ORDER_STATUS, ORDER_TYPES, PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/modules/orders/order.model.js';
import { PosShift, SHIFT_STATUS, VOUCHER_TYPES } from '../../src/modules/shifts/posShift.model.js';
import { APPROVAL_LEVELS, APPROVAL_TYPES, APPROVAL_STATUS } from '../../src/modules/approvals/approval.model.js';
import { EXPENSE_CATEGORIES, EXPENSE_STATUS } from '../../src/modules/finance/branchExpense.model.js';
import { COMMISSION_RULE_TYPES } from '../../src/modules/finance/commissionRule.model.js';
import { AuditLog, AUDIT_ACTIONS } from '../../src/modules/audit/auditLog.model.js';

setupTestDB();

describe('HQ Chain Director Wave 4: Consolidated P&L, OPEX, Executive Approvals & Commissions', () => {
  let branchQ1;
  let category;
  let product;
  let skuId;
  let staffUser;
  let adminToken;
  let managerToken;

  beforeEach(async () => {
    branchQ1 = await Branch.create({
      branchCode: 'BR-Q1-W4',
      name: 'Showroom Q1 W4',
      address: '128 Nguyễn Thị Minh Khai',
      phone: '02839250001',
      location: { type: 'Point', coordinates: [106.69, 10.77] },
      region: BRANCH_REGIONS.HCM,
      isActive: true
    });

    category = await Category.create({
      name: 'Điện thoại W4',
      slug: 'dien-thoai-w4',
      attributeKeys: ['ram'],
      isActive: true
    });

    await User.create({
      fullName: 'CEO W4',
      email: 'ceo.w4@techstore.com',
      phone: '0909830001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    adminToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'ceo.w4@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Manager Q1 W4',
      email: 'mgr.w4@techstore.com',
      phone: '0909830002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchQ1._id,
      isActive: true
    });
    managerToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w4@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    staffUser = await User.create({
      fullName: 'Sales Cashier W4',
      email: 'staff.w4@techstore.com',
      phone: '0909830003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchQ1._id,
      isActive: true
    });

    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'iPhone 16 Pro W4',
        categoryId: category._id.toString(),
        brand: 'Apple',
        isSerialManaged: true,
        skus: [
          {
            sku: 'IP16P-W4',
            price: 34000000,
            salePrice: 32000000,
            costPrice: 27000000
          }
        ]
      });
    product = prodRes.body.data.product;
    skuId = product.skus[0]._id;
  });

  test('UC-HQ-08, UC-HQ-09 & UC-HQ-10: Phê duyệt tối cao chi phí lớn, Hoa hồng & Công thức P&L hợp nhất chính xác', async () => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Quản lý chi nhánh gửi chi phí mặt bằng 15.000.000 ₫ (>= 5tr -> tự động PENDING_EXECUTIVE + ApprovalRequest EXECUTIVE)
    const expRes = await request(app)
      .post('/api/v1/hq/finance/expenses')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        branchId: branchQ1._id.toString(),
        monthKey,
        category: EXPENSE_CATEGORIES.RENT,
        amount: 15000000,
        description: 'Tiền thuê mặt bằng tháng hiện tại'
      });
    expect(expRes.status).toBe(201);
    const expense = expRes.body.data.expense;
    const approvalReq = expRes.body.data.approvalRequest;
    expect(expense.status).toBe(EXPENSE_STATUS.PENDING_EXECUTIVE);
    expect(approvalReq).toBeTruthy();
    expect(approvalReq.approvalLevel).toBe(APPROVAL_LEVELS.EXECUTIVE);
    expect(approvalReq.type).toBe(APPROVAL_TYPES.EXECUTIVE_EXPENSE);

    // 2. Quản lý chi nhánh KHÔNG được tự duyệt yêu cầu cấp EXECUTIVE (403)
    const mgrApprove = await request(app)
      .patch(`/api/v1/approvals/${approvalReq._id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reviewNote: 'Tự duyệt' });
    expect(mgrApprove.status).toBe(403);
    expect(mgrApprove.body.errorCode).toBe('EXECUTIVE_APPROVAL_REQUIRED');

    // 3. SUPER_ADMIN duyệt Phê duyệt Tối cao -> cả ApprovalRequest & BranchExpense chuyển sang APPROVED
    const adminApprove = await request(app)
      .patch(`/api/v1/approvals/${approvalReq._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reviewNote: 'CEO đồng ý chi mặt bằng' });
    expect(adminApprove.status).toBe(200);
    expect(adminApprove.body.data.request.status).toBe(APPROVAL_STATUS.APPROVED);
    expect(adminApprove.body.data.request.executionResult.status).toBe(EXPENSE_STATUS.APPROVED);

    // 4. Tạo quy tắc hoa hồng 200.000 ₫ / máy cho danh mục Điện thoại W4
    const ruleRes = await request(app)
      .post('/api/v1/hq/finance/commissions/rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hoa hồng bán Smartphone',
        categoryId: category._id.toString(),
        ruleType: COMMISSION_RULE_TYPES.FIXED_PER_UNIT,
        value: 200000
      });
    expect(ruleRes.status).toBe(201);

    // 5. Tạo 1 đơn hàng COMPLETED (32.000.000 doanh thu, 27.000.000 giá vốn -> GP 5.000.000) + 1 phiếu chi quầy 500.000
    await Order.create({
      orderCode: 'ORD-W4-PNL-01',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchQ1._id,
      staffId: staffUser._id,
      orderStatus: ORDER_STATUS.COMPLETED,
      paymentMethod: PAYMENT_METHODS.VNPAY,
      paymentStatus: PAYMENT_STATUS.PAID,
      totalAmount: 32000000,
      items: [
        {
          productId: product._id,
          productSkuId: skuId,
          productName: product.name,
          sku: 'IP16P-W4',
          quantity: 1,
          unitPrice: 32000000,
          costPrice: 27000000,
          subtotal: 32000000
        }
      ]
    });

    await PosShift.create({
      shiftCode: 'SH-W4-01',
      branchId: branchQ1._id,
      cashierId: staffUser._id,
      openingBalance: 1000000,
      status: SHIFT_STATUS.CLOSED,
      openedAt: now,
      closedAt: now,
      cashVouchers: [
        {
          voucherCode: 'VCH-W4-01',
          type: VOUCHER_TYPES.OUT,
          category: 'Văn phòng phẩm',
          amount: 500000,
          reason: 'Mua giấy in bill'
        }
      ]
    });

    // 6. Kiểm tra Báo cáo P&L hợp nhất & Hoa hồng
    const pnlRes = await request(app)
      .get('/api/v1/hq/finance/pnl')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pnlRes.status).toBe(200);
    const { totals, paymentBreakdown, branchPnl } = pnlRes.body.data;
    expect(totals.netRevenue).toBe(32000000);
    expect(totals.cogs).toBe(27000000);
    expect(totals.grossProfit).toBe(5000000);
    expect(totals.totalOpex).toBe(15500000); // 15tr mặt bằng + 500k phiếu chi quầy
    expect(totals.estimatedCommission).toBe(200000);
    expect(totals.netProfit).toBe(-10700000);
    expect(paymentBreakdown.VNPAY).toBe(32000000);
    expect(branchPnl[0].branchCode).toBe('BR-Q1-W4');

    const commRes = await request(app)
      .get('/api/v1/hq/finance/commissions/report')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(commRes.status).toBe(200);
    expect(commRes.body.data.totalCommission).toBe(200000);
    expect(commRes.body.data.staffCommissions[0].commissionAmount).toBe(200000);

    await new Promise((r) => setTimeout(r, 50));
    const logs = await AuditLog.find({
      action: { $in: [AUDIT_ACTIONS.EXPENSE_CREATE, AUDIT_ACTIONS.COMMISSION_RULE_CHANGE, AUDIT_ACTIONS.APPROVAL_REQUEST_APPROVE] }
    }).lean();
    expect(logs.length).toBeGreaterThanOrEqual(3);
  });
});
