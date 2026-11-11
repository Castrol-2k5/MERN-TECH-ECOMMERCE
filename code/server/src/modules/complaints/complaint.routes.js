import { Router } from 'express';
import { ComplaintController } from './complaint.controller.js';
import {
  createComplaintSchema,
  updateComplaintSchema,
  createCustomerSupportRequestSchema
} from './complaint.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

router.use(protect);

// Luồng Khách hàng gửi & theo dõi Yêu cầu Bảo hành / Đổi trả / Khiếu nại
router.post(
  '/customer',
  validateDto(createCustomerSupportRequestSchema),
  ComplaintController.createCustomerRequest
);
router.get('/my-requests', ComplaintController.getMyRequests);

// Luồng nội bộ Thu ngân / Quản lý chi nhánh
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
