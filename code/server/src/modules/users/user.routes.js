import { Router } from 'express';
import { UserController } from './user.controller.js';
import {
  createUserSchema,
  updateUserSchema,
  queryUsersSchema,
  updateUserStatusSchema,
  updateProfileSchema,
  changePasswordSchema
} from './user.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from './user.model.js';

const router = Router();

// Tất cả các route yêu cầu đăng nhập
router.use(protect);

// Customer & Self-service profile routes (Mọi user đăng nhập đều được dùng)
router.get('/profile/me', UserController.getMyProfile);
router.put('/profile/me', validateDto(updateProfileSchema), UserController.updateMyProfile);
router.put('/profile/change-password', validateDto(changePasswordSchema), UserController.changeMyPassword);

// POS Staff & Managers: Tra cứu nhanh CRM khách hàng theo SĐT (phải đặt trước /:id)
router.get(
  '/lookup-customer',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  UserController.lookupCustomerByPhone
);

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
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(updateUserSchema),
  UserController.updateUser
);

router.patch(
  '/:id/status',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(updateUserStatusSchema),
  UserController.toggleUserStatus
);

router.delete(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN),
  UserController.deleteUser
);

export default router;
