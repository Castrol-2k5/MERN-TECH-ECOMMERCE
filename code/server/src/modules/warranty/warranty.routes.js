import { Router } from 'express';
import { WarrantyController } from './warranty.controller.js';
import { createWarrantyTicketSchema, getWarrantyTicketsQuerySchema } from './warranty.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Protected: Tiếp nhận thiết bị bảo hành (STAFF, BRANCH_MANAGER, SUPER_ADMIN)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  scopeBranch,
  validateDto(createWarrantyTicketSchema),
  WarrantyController.createTicket
);

// Protected: Tra cứu danh sách phiếu bảo hành (STAFF, BRANCH_MANAGER, SUPER_ADMIN)
router.get(
  '/',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  scopeBranch,
  validateDto(getWarrantyTicketsQuerySchema, 'query'),
  WarrantyController.getTickets
);

export default router;
