import crypto from 'crypto';
import mongoose from 'mongoose';
import { BranchExpense, EXPENSE_STATUS } from './branchExpense.model.js';
import { CommissionRule, COMMISSION_RULE_TYPES } from './commissionRule.model.js';
import { Branch } from '../branches/branch.model.js';
import { Category } from '../categories/category.model.js';
import { Product } from '../products/product.model.js';
import { Order, ORDER_STATUS, ORDER_TYPES } from '../orders/order.model.js';
import { PosShift, VOUCHER_TYPES } from '../shifts/posShift.model.js';
import { User, USER_ROLES } from '../users/user.model.js';
import {
  ApprovalRequest,
  APPROVAL_TYPES,
  APPROVAL_LEVELS,
  APPROVAL_STATUS,
  APPROVAL_THRESHOLDS
} from '../approvals/approval.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';
import { AppError } from '../../utils/appError.js';

const PNL_ORDER_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.PARTIALLY_RETURNED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.READY_FOR_SHIPPING
];

export class HqFinanceService {
  static generateExpenseCode() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `EXP-${dateStr}-${rand}`;
  }

  static resolvePeriod(startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
      start.setDate(start.getDate() - 29);
    }
    start.setHours(0, 0, 0, 0);

    const monthKeys = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endMonth) {
      monthKeys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { start, end, monthKeys };
  }

  // ==========================================
  // 1. CHI PHÍ VẬN HÀNH CHI NHÁNH & PHÊ DUYỆT TỐI CAO (UC-HQ-08 & UC-HQ-09)
  // ==========================================
  static async createExpense(dto, currentUser) {
    if (
      currentUser.role === USER_ROLES.BRANCH_MANAGER &&
      currentUser.branchId &&
      currentUser.branchId.toString() !== dto.branchId.toString()
    ) {
      throw new AppError(
        'Quản lý chi nhánh chỉ được khai báo chi phí cho chi nhánh của mình.',
        403,
        'CROSS_BRANCH_ACCESS_DENIED'
      );
    }

    const branch = await Branch.findOne({ _id: dto.branchId, isActive: true }).lean();
    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh.', 404, 'BRANCH_NOT_FOUND');
    }

    const requiresExecutiveApproval =
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      Number(dto.amount) >= APPROVAL_THRESHOLDS.EXECUTIVE_EXPENSE_VND;

    const status = requiresExecutiveApproval
      ? EXPENSE_STATUS.PENDING_EXECUTIVE
      : EXPENSE_STATUS.APPROVED;

    const expense = await BranchExpense.create({
      expenseCode: this.generateExpenseCode(),
      branchId: branch._id,
      monthKey: dto.monthKey,
      category: dto.category,
      amount: dto.amount,
      description: dto.description,
      status,
      createdBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Nhân sự quản lý',
        role: currentUser.role
      },
      ...(status === EXPENSE_STATUS.APPROVED
        ? {
            reviewedBy: {
              userId: currentUser.id,
              fullName: currentUser.fullName || 'Hệ thống'
            },
            reviewedAt: new Date(),
            reviewNote:
              currentUser.role === USER_ROLES.SUPER_ADMIN
                ? 'Tạo & duyệt trực tiếp bởi Quản lý tổng'
                : 'Trong hạn mức tự duyệt chi nhánh'
          }
        : {})
    });

    let approvalRequest = null;
    if (requiresExecutiveApproval) {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
      approvalRequest = await ApprovalRequest.create({
        requestCode: `APR-${dateStr}-${rand}`,
        branchId: branch._id,
        type: APPROVAL_TYPES.EXECUTIVE_EXPENSE,
        approvalLevel: APPROVAL_LEVELS.EXECUTIVE,
        status: APPROVAL_STATUS.PENDING,
        requestedBy: {
          userId: currentUser.id,
          fullName: currentUser.fullName || 'Quản lý chi nhánh',
          role: currentUser.role
        },
        targetModel: 'BranchExpense',
        targetId: expense._id,
        targetCode: expense.expenseCode,
        estimatedAmount: expense.amount,
        reason: dto.description,
        payload: {
          category: expense.category,
          monthKey: expense.monthKey,
          amount: expense.amount
        }
      });
    }

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.EXPENSE_CREATE,
      target: {
        model: 'BranchExpense',
        entityId: expense._id,
        code: expense.expenseCode,
        name: `${branch.branchCode} - ${expense.category}`
      },
      changes: {
        after: { amount: expense.amount, status: expense.status, monthKey: expense.monthKey }
      },
      context: {
        notes: requiresExecutiveApproval
          ? `Tạo chi phí ${expense.expenseCode} vượt hạn mức -> đẩy lên Phê duyệt Tối cao`
          : `Ghi nhận chi phí ${expense.expenseCode}`
      }
    });

    return { expense, approvalRequest };
  }

  static async getExpenses(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role === USER_ROLES.BRANCH_MANAGER) {
      filter.branchId = currentUser.branchId;
    } else if (query.branchId && query.branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new mongoose.Types.ObjectId(query.branchId);
    }

    if (query.monthKey) filter.monthKey = query.monthKey;
    if (query.status && query.status !== 'ALL') filter.status = query.status;

    const expenses = await BranchExpense.find(filter)
      .populate('branchId', 'branchCode name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return { expenses, total: expenses.length };
  }

  static async reviewExpense(expenseId, { status, reviewNote = '' }, currentUser) {
    const expense = await BranchExpense.findById(expenseId);
    if (!expense) {
      throw new AppError('Không tìm thấy phiếu chi phí.', 404, 'EXPENSE_NOT_FOUND');
    }
    if (expense.status !== EXPENSE_STATUS.PENDING_EXECUTIVE) {
      throw new AppError('Phiếu chi phí đã được xử lý trước đó.', 400, 'EXPENSE_ALREADY_REVIEWED');
    }

    expense.status = status;
    expense.reviewedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản trị viên HQ'
    };
    expense.reviewedAt = new Date();
    expense.reviewNote = reviewNote;
    await expense.save();

    // Đồng bộ ApprovalRequest liên quan (nếu có)
    await ApprovalRequest.updateMany(
      {
        targetModel: 'BranchExpense',
        targetId: expense._id,
        status: APPROVAL_STATUS.PENDING
      },
      {
        $set: {
          status: status === EXPENSE_STATUS.APPROVED ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.REJECTED,
          reviewedBy: expense.reviewedBy,
          reviewedAt: expense.reviewedAt,
          reviewNote: reviewNote || `Executive ${status}`
        }
      }
    );

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.EXPENSE_REVIEW,
      target: {
        model: 'BranchExpense',
        entityId: expense._id,
        code: expense.expenseCode,
        name: `${expense.category} (${expense.monthKey})`
      },
      changes: {
        before: { status: EXPENSE_STATUS.PENDING_EXECUTIVE },
        after: { status: expense.status, reviewNote }
      }
    });

    return expense;
  }

  // ==========================================
  // 2. QUY TẮC HOA HỒNG TOÀN CHUỖI (UC-HQ-10)
  // ==========================================
  static async getCommissionRules() {
    const rules = await CommissionRule.find()
      .populate('categoryId', 'name slug')
      .sort({ categoryId: -1, createdAt: -1 })
      .lean();
    return { rules, total: rules.length };
  }

  static async createCommissionRule(dto, currentUser) {
    if (dto.categoryId) {
      const cat = await Category.findById(dto.categoryId).lean();
      if (!cat) {
        throw new AppError('Không tìm thấy danh mục sản phẩm.', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const rule = await CommissionRule.create({
      name: dto.name,
      categoryId: dto.categoryId || null,
      ruleType: dto.ruleType,
      value: dto.value,
      isActive: dto.isActive !== false,
      updatedBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Quản trị viên HQ'
      }
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.COMMISSION_RULE_CHANGE,
      target: {
        model: 'CommissionRule',
        entityId: rule._id,
        name: rule.name
      },
      changes: {
        after: {
          ruleType: rule.ruleType,
          value: rule.value,
          categoryId: rule.categoryId,
          isActive: rule.isActive
        }
      }
    });

    return rule;
  }

  static async toggleCommissionRule(ruleId, isActive, currentUser) {
    const rule = await CommissionRule.findByIdAndUpdate(
      ruleId,
      {
        $set: {
          isActive,
          updatedBy: {
            userId: currentUser.id,
            fullName: currentUser.fullName || 'Quản trị viên HQ'
          }
        }
      },
      { new: true }
    ).lean();

    if (!rule) {
      throw new AppError('Không tìm thấy quy tắc hoa hồng.', 404, 'RULE_NOT_FOUND');
    }

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.COMMISSION_RULE_CHANGE,
      target: {
        model: 'CommissionRule',
        entityId: rule._id,
        name: rule.name
      },
      changes: { after: { isActive: rule.isActive } }
    });

    return rule;
  }

  static computeItemCommission(item, productCategoryId, rulesByCategory, defaultRule) {
    const keptQty = Math.max(0, Number(item.quantity || 0) - Number(item.returnedQuantity || 0));
    if (keptQty <= 0) return 0;

    const specificRule = productCategoryId ? rulesByCategory.get(String(productCategoryId)) : null;
    const rule = specificRule || defaultRule;
    if (!rule) return 0;

    if (rule.ruleType === COMMISSION_RULE_TYPES.FIXED_PER_UNIT) {
      return keptQty * Number(rule.value || 0);
    }
    const keptRevenue = keptQty * Number(item.unitPrice || 0);
    return Math.round((keptRevenue * Number(rule.value || 0)) / 100);
  }

  static async calculateCommissionReport({ startDate, endDate, branchId } = {}) {
    const { start, end } = this.resolvePeriod(startDate, endDate);
    const orderFilter = {
      createdAt: { $gte: start, $lte: end },
      orderStatus: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED] },
      staffId: { $ne: null }
    };
    if (branchId && branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(branchId)) {
      orderFilter.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const [orders, activeRules] = await Promise.all([
      Order.find(orderFilter).select('branchId staffId items').lean(),
      CommissionRule.find({ isActive: true }).sort({ updatedAt: -1 }).lean()
    ]);

    const rulesByCategory = new Map();
    let defaultRule = null;
    for (const r of activeRules) {
      if (!r.categoryId) {
        if (!defaultRule) defaultRule = r;
      } else if (!rulesByCategory.has(String(r.categoryId))) {
        rulesByCategory.set(String(r.categoryId), r);
      }
    }

    const productIds = Array.from(
      new Set(orders.flatMap((o) => (o.items || []).map((it) => String(it.productId))))
    );
    const staffIds = Array.from(new Set(orders.map((o) => String(o.staffId)).filter(Boolean)));

    const [products, staffUsers, branches] = await Promise.all([
      productIds.length
        ? Product.find({ _id: { $in: productIds } }).select('categoryId').lean()
        : [],
      staffIds.length
        ? User.find({ _id: { $in: staffIds } }).select('fullName email branchId').lean()
        : [],
      Branch.find().select('branchCode name').lean()
    ]);

    const prodCatMap = new Map(products.map((p) => [p._id.toString(), p.categoryId]));
    const staffMap = new Map(staffUsers.map((u) => [u._id.toString(), u]));
    const branchMap = new Map(branches.map((b) => [b._id.toString(), b]));

    const byStaff = new Map();
    const byBranch = new Map();
    let totalCommission = 0;

    for (const ord of orders) {
      let ordCommission = 0;
      let ordNetRev = 0;
      for (const it of ord.items || []) {
        const keptQty = Math.max(0, Number(it.quantity || 0) - Number(it.returnedQuantity || 0));
        ordNetRev += keptQty * Number(it.unitPrice || 0);
        const catId = prodCatMap.get(String(it.productId));
        ordCommission += this.computeItemCommission(it, catId, rulesByCategory, defaultRule);
      }
      totalCommission += ordCommission;

      const sKey = String(ord.staffId);
      const staffRec = byStaff.get(sKey) || {
        staffId: ord.staffId,
        fullName: staffMap.get(sKey)?.fullName || 'Nhân viên POS',
        branchCode: branchMap.get(String(ord.branchId))?.branchCode || '',
        ordersCount: 0,
        netRevenue: 0,
        commissionAmount: 0
      };
      staffRec.ordersCount += 1;
      staffRec.netRevenue += ordNetRev;
      staffRec.commissionAmount += ordCommission;
      byStaff.set(sKey, staffRec);

      const bKey = String(ord.branchId);
      byBranch.set(bKey, (byBranch.get(bKey) || 0) + ordCommission);
    }

    return {
      period: { start, end },
      totalCommission,
      staffCommissions: Array.from(byStaff.values()).sort(
        (a, b) => b.commissionAmount - a.commissionAmount
      ),
      commissionByBranchMap: byBranch
    };
  }

  // ==========================================
  // 3. HỢP NHẤT TÀI CHÍNH & BÁO CÁO P&L TOÀN CHUỖI (UC-HQ-08)
  // ==========================================
  static async getConsolidatedPnl({ startDate, endDate, branchId } = {}) {
    const { start, end, monthKeys } = this.resolvePeriod(startDate, endDate);

    const branchQuery = { isActive: true };
    if (branchId && branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(branchId)) {
      branchQuery._id = new mongoose.Types.ObjectId(branchId);
    }

    const orderFilter = {
      createdAt: { $gte: start, $lte: end },
      orderStatus: { $in: PNL_ORDER_STATUSES },
      ...(branchId && branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(branchId)
        ? { branchId: new mongoose.Types.ObjectId(branchId) }
        : {})
    };

    const expenseFilter = {
      monthKey: { $in: monthKeys },
      status: EXPENSE_STATUS.APPROVED,
      ...(branchId && branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(branchId)
        ? { branchId: new mongoose.Types.ObjectId(branchId) }
        : {})
    };

    const shiftFilter = {
      openedAt: { $gte: start, $lte: end },
      ...(branchId && branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(branchId)
        ? { branchId: new mongoose.Types.ObjectId(branchId) }
        : {})
    };

    const [branches, orders, expenses, shifts, products, commissionReport] = await Promise.all([
      Branch.find(branchQuery).sort({ isHeadquarter: 1, createdAt: 1 }).lean(),
      Order.find(orderFilter)
        .select('branchId orderType paymentMethod totalAmount refundedAmount items')
        .lean(),
      BranchExpense.find(expenseFilter).select('branchId amount').lean(),
      PosShift.find(shiftFilter).select('branchId cashVouchers').lean(),
      Product.find().select('skus._id skus.costPrice').lean(),
      this.calculateCommissionReport({ startDate: start, endDate: end, branchId })
    ]);

    const skuCostFallbackMap = new Map();
    for (const p of products) {
      for (const s of p.skus || []) {
        skuCostFallbackMap.set(String(s._id), Number(s.costPrice || 0));
      }
    }

    const expenseByBranch = new Map();
    for (const e of expenses) {
      const key = String(e.branchId);
      expenseByBranch.set(key, (expenseByBranch.get(key) || 0) + Number(e.amount || 0));
    }

    const shiftVoucherOutByBranch = new Map();
    for (const sh of shifts) {
      const key = String(sh.branchId);
      const outSum = (sh.cashVouchers || [])
        .filter((v) => v.type === VOUCHER_TYPES.OUT)
        .reduce((s, v) => s + Number(v.amount || 0), 0);
      shiftVoucherOutByBranch.set(key, (shiftVoucherOutByBranch.get(key) || 0) + outSum);
    }

    const branchAccum = new Map();
    for (const b of branches) {
      branchAccum.set(String(b._id), {
        branchId: b._id,
        branchCode: b.branchCode,
        branchName: b.name,
        isHeadquarter: Boolean(b.isHeadquarter || b.branchCode === 'BR-HQ'),
        ordersCount: 0,
        grossRevenue: 0,
        refundedAmount: 0,
        netRevenue: 0,
        posRevenue: 0,
        onlineRevenue: 0,
        cogs: 0
      });
    }

    const paymentBreakdown = { CASH: 0, VNPAY: 0, STRIPE: 0 };

    for (const ord of orders) {
      const bKey = String(ord.branchId);
      const acc = branchAccum.get(bKey);
      if (!acc) continue;

      const gross = Number(ord.totalAmount || 0);
      const refund = Number(ord.refundedAmount || 0);
      const net = Math.max(0, gross - refund);

      acc.ordersCount += 1;
      acc.grossRevenue += gross;
      acc.refundedAmount += refund;
      acc.netRevenue += net;
      if (ord.orderType === ORDER_TYPES.POS_STORE) acc.posRevenue += net;
      else acc.onlineRevenue += net;

      const pm = ord.paymentMethod || 'CASH';
      paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + net;

      for (const it of ord.items || []) {
        const keptQty = Math.max(0, Number(it.quantity || 0) - Number(it.returnedQuantity || 0));
        const unitCost =
          Number(it.costPrice || 0) > 0
            ? Number(it.costPrice)
            : skuCostFallbackMap.get(String(it.productSkuId)) || 0;
        acc.cogs += keptQty * unitCost;
      }
    }

    const branchPnl = Array.from(branchAccum.values()).map((b) => {
      const bKey = String(b.branchId);
      const approvedExpenses = expenseByBranch.get(bKey) || 0;
      const posCashOut = shiftVoucherOutByBranch.get(bKey) || 0;
      const totalOpex = approvedExpenses + posCashOut;
      const estimatedCommission = commissionReport.commissionByBranchMap.get(bKey) || 0;
      const grossProfit = b.netRevenue - b.cogs;
      const grossMarginPct = b.netRevenue > 0 ? Math.round((grossProfit / b.netRevenue) * 1000) / 10 : 0;
      const netProfit = grossProfit - totalOpex - estimatedCommission;

      return {
        ...b,
        grossProfit,
        grossMarginPct,
        approvedExpenses,
        posCashOut,
        totalOpex,
        estimatedCommission,
        netProfit
      };
    });

    const totals = branchPnl.reduce(
      (acc, r) => ({
        ordersCount: acc.ordersCount + r.ordersCount,
        grossRevenue: acc.grossRevenue + r.grossRevenue,
        refundedAmount: acc.refundedAmount + r.refundedAmount,
        netRevenue: acc.netRevenue + r.netRevenue,
        posRevenue: acc.posRevenue + r.posRevenue,
        onlineRevenue: acc.onlineRevenue + r.onlineRevenue,
        cogs: acc.cogs + r.cogs,
        grossProfit: acc.grossProfit + r.grossProfit,
        totalOpex: acc.totalOpex + r.totalOpex,
        estimatedCommission: acc.estimatedCommission + r.estimatedCommission,
        netProfit: acc.netProfit + r.netProfit
      }),
      {
        ordersCount: 0,
        grossRevenue: 0,
        refundedAmount: 0,
        netRevenue: 0,
        posRevenue: 0,
        onlineRevenue: 0,
        cogs: 0,
        grossProfit: 0,
        totalOpex: 0,
        estimatedCommission: 0,
        netProfit: 0
      }
    );

    totals.grossMarginPct =
      totals.netRevenue > 0 ? Math.round((totals.grossProfit / totals.netRevenue) * 1000) / 10 : 0;

    return {
      period: { start, end, monthKeys },
      totals,
      paymentBreakdown,
      branchPnl: branchPnl.sort((a, b) => b.netProfit - a.netProfit)
    };
  }
}
