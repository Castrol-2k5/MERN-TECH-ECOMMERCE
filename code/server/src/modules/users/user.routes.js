import { Router } from 'express';
import { UserController } from './user.controller.js';
import {
  createUserSchema,
  updateUserSchema,
  queryUsersSchema,
  updateUserStatusSchema
} from './user.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from './user.model.js';

import { scopeBranch } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Tất cả các route yêu cầu đăng nhập
router.use(protect);

router.get(
  '/',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  scopeBranch,
  validateDto(queryUsersSchema, 'query'),
  UserController.getAllUsers
);

router.get(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  UserController.getUserById
);

router.post(
  '/',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(createUserSchema),
  UserController.createUser
);

router.put(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(updateUserSchema),
  UserController.updateUser
);

router.patch(
  '/:id/status',
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(updateUserStatusSchema),
  UserController.toggleUserStatus
);

router.delete(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN),
  UserController.deleteUser
);

export default router;
