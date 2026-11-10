import { Router } from 'express';
import { RosterController } from './roster.controller.js';
import { assignShiftSchema, swapRequestSchema, reviewSwapSchema } from './roster.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

router.use(protect);
router.use(authorize(USER_ROLES.STAFF, USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN));

router.get('/', scopeBranch, RosterController.getWeeklyRoster);

router.post(
  '/',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  validateDto(assignShiftSchema),
  RosterController.assignShift
);

router.delete(
  '/:id',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  RosterController.removeShift
);

router.post('/:id/check-in', RosterController.checkInShift);
router.post('/:id/check-out', RosterController.checkOutShift);
router.post('/:id/swap-request', validateDto(swapRequestSchema), RosterController.requestSwap);

router.patch(
  '/:id/swap-review',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  validateDto(reviewSwapSchema),
  RosterController.reviewSwap
);

export default router;
