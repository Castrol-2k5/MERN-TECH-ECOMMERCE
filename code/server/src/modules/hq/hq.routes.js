import { Router } from 'express';
import { HqController } from './hq.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Toàn bộ API HQ Hub chỉ dành riêng cho Quản lý tổng toàn chuỗi (SUPER_ADMIN)
router.use(protect);
router.use(authorize(USER_ROLES.SUPER_ADMIN));

router.get('/command-center', HqController.getCommandCenter);

export default router;
