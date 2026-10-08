import { Router } from 'express';
import { BranchController } from './branch.controller.js';
import { createBranchSchema, updateBranchSchema, nearbyBranchSchema } from './branch.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Public routes
// Note: /nearby MUST be declared before /:id to avoid router treating 'nearby' as an ID parameter
router.get('/nearby', validateDto(nearbyBranchSchema, 'query'), BranchController.getNearbyBranches);
router.get('/', BranchController.getAllBranches);
router.get('/:id', BranchController.getBranchById);

// Admin-only management routes (SUPER_ADMIN)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(createBranchSchema),
  BranchController.createBranch
);

router.put(
  '/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(updateBranchSchema),
  BranchController.updateBranch
);

router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  BranchController.deleteBranch
);

export default router;
