import { Router } from 'express';
import { SettlementController } from './settlement.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Yêu cầu đăng nhập nhân sự quản lý hoặc Super Admin
router.use(protect);
router.use(authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN));

router.get('/', SettlementController.getSettlements);
router.post('/:id/settle', authorize(USER_ROLES.SUPER_ADMIN), SettlementController.settlePayment);

export default router;
