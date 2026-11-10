import { Router } from 'express';
import { ApprovalController } from './approval.controller.js';
import { createApprovalSchema, reviewApprovalSchema } from './approval.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

router.use(protect);
router.use(authorize(USER_ROLES.STAFF, USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN));

router.get(
  '/alerts',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  scopeBranch,
  ApprovalController.getAlerts
);

router.get('/', ApprovalController.getRequests);

router.post('/', validateDto(createApprovalSchema), ApprovalController.createRequest);

router.patch(
  '/:id/approve',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  validateDto(reviewApprovalSchema),
  ApprovalController.approveRequest
);

router.patch(
  '/:id/reject',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  validateDto(reviewApprovalSchema),
  ApprovalController.rejectRequest
);

export default router;
