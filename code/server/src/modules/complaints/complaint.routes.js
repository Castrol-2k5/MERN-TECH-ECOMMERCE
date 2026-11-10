import { Router } from 'express';
import { ComplaintController } from './complaint.controller.js';
import { createComplaintSchema, updateComplaintSchema } from './complaint.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

router.use(protect);
router.use(authorize(USER_ROLES.STAFF, USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN));

router.get('/warranty-watchlist', scopeBranch, ComplaintController.getWarrantyWatchlist);

router.get('/', scopeBranch, ComplaintController.getComplaints);

router.post('/', scopeBranch, validateDto(createComplaintSchema), ComplaintController.createComplaint);

router.patch(
  '/:id',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  validateDto(updateComplaintSchema),
  ComplaintController.updateComplaint
);

export default router;
