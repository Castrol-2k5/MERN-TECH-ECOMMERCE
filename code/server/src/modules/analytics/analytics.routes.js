import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Protected: Personal Sales & Shift Performance for POS Cashier / Staff (UC-POS-14)
router.get(
  '/my-performance',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  AnalyticsController.getMyPerformance
);

// Protected: Branch Staff KPI Ranking & Team Sales (UC-BM-02)
router.get(
  '/branch-staff-kpi',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  scopeBranch,
  AnalyticsController.getBranchStaffKpi
);

// Protected: View Business Intelligence Overview (SUPER_ADMIN, BRANCH_MANAGER)
router.get(
  '/overview',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  AnalyticsController.getOverview
);

export default router;
