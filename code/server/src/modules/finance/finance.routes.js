import { Router } from 'express';
import { FinanceController } from './finance.controller.js';
import {
  createExpenseSchema,
  reviewExpenseSchema,
  createCommissionRuleSchema,
  toggleCommissionRuleSchema
} from './finance.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

router.use(protect);

// Báo cáo P&L hợp nhất toàn chuỗi (chỉ SUPER_ADMIN)
router.get('/pnl', authorize(USER_ROLES.SUPER_ADMIN), FinanceController.getConsolidatedPnl);

// Chi phí vận hành chi nhánh (BRANCH_MANAGER tạo/xem CN mình; SUPER_ADMIN toàn quyền & duyệt)
router.get(
  '/expenses',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  FinanceController.getExpenses
);
router.post(
  '/expenses',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  validateDto(createExpenseSchema),
  FinanceController.createExpense
);
router.patch(
  '/expenses/:id/review',
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(reviewExpenseSchema),
  FinanceController.reviewExpense
);

// Chính sách hoa hồng & Báo cáo thưởng (chỉ SUPER_ADMIN cấu hình & xem toàn chuỗi)
router.get(
  '/commissions/rules',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  FinanceController.getCommissionRules
);
router.post(
  '/commissions/rules',
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(createCommissionRuleSchema),
  FinanceController.createCommissionRule
);
router.patch(
  '/commissions/rules/:id',
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(toggleCommissionRuleSchema),
  FinanceController.toggleCommissionRule
);
router.get(
  '/commissions/report',
  authorize(USER_ROLES.SUPER_ADMIN),
  FinanceController.getCommissionReport
);

// Danh sách yêu cầu Phê duyệt Tối cao (Executive Approvals)
router.get(
  '/executive-approvals',
  authorize(USER_ROLES.SUPER_ADMIN),
  FinanceController.getExecutiveApprovals
);

export default router;
