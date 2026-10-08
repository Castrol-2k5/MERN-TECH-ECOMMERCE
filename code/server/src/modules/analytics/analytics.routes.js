import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Protected: View Business Intelligence Overview (SUPER_ADMIN, BRANCH_MANAGER)
router.get(
  '/overview',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  AnalyticsController.getOverview
);

export default router;
