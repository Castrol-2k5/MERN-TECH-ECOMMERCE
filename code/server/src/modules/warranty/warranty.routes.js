import { Router } from 'express';
import { WarrantyController } from './warranty.controller.js';
import {
  createWarrantyTicketSchema,
  getWarrantyTicketsQuerySchema,
  updateWarrantyStatusSchema,
  diagnoseTicketSchema,
  approveQuotationSchema,
  completeRepairSchema,
  handoverTicketSchema,
  trackWarrantyPublicSchema
} from './warranty.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// ==========================================
// Public routes (Tra cứu phiếu RMA & Khách duyệt online)
// ==========================================
router.get(
  '/track',
  validateDto(trackWarrantyPublicSchema, 'query'),
  WarrantyController.trackTicketPublic
);

router.patch(
  '/track/:ticketCode/approve',
  validateDto(approveQuotationSchema),
  WarrantyController.customerApprovePublic
);

// ==========================================
// Protected routes (Nhân viên & Quản lý chi nhánh)
// ==========================================
router.use(protect);
router.use(authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF));
router.use(scopeBranch);

// Tiếp nhận thiết bị bảo hành (Bước 3)
router.post(
  '/',
  validateDto(createWarrantyTicketSchema),
  WarrantyController.createTicket
);

// Tra cứu danh sách phiếu bảo hành
router.get(
  '/',
  validateDto(getWarrantyTicketsQuerySchema, 'query'),
  WarrantyController.getTickets
);

// Chẩn đoán lỗi & Báo giá (Bước 4)
router.patch(
  '/:id/diagnose',
  validateDto(diagnoseTicketSchema),
  WarrantyController.diagnoseTicket
);

// Ghi nhận duyệt/từ chối báo giá của khách (Bước 4)
router.patch(
  '/:id/approve',
  validateDto(approveQuotationSchema),
  WarrantyController.approveQuotation
);

// Hoàn tất sửa chữa, chuyển sẵn sàng trả máy (Bước 5)
router.patch(
  '/:id/complete',
  validateDto(completeRepairSchema),
  WarrantyController.completeRepair
);

// Bàn giao máy cho khách & thu tiền (Bước 5 & 6)
router.patch(
  '/:id/handover',
  validateDto(handoverTicketSchema),
  WarrantyController.handoverTicket
);

// Cập nhật trạng thái thủ công dự phòng
router.patch(
  '/:id/status',
  validateDto(updateWarrantyStatusSchema),
  WarrantyController.updateTicketStatus
);

export default router;
