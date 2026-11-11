import { Router } from 'express';
import { ProcurementController } from './procurement.controller.js';
import {
  upsertVendorSchema,
  updateVendorSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  receivePurchaseOrderSchema,
  recordVendorPaymentSchema
} from './procurement.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Toàn bộ nghiệp vụ Nhà cung cấp & Nhập hàng Kho Tổng chỉ dành cho SUPER_ADMIN
router.use(protect);
router.use(authorize(USER_ROLES.SUPER_ADMIN));

// Vendors & Công nợ NCC
router.get('/vendors', ProcurementController.getVendors);
router.post('/vendors', validateDto(upsertVendorSchema), ProcurementController.createVendor);
router.put('/vendors/:id', validateDto(updateVendorSchema), ProcurementController.updateVendor);
router.post(
  '/vendors/:id/payments',
  validateDto(recordVendorPaymentSchema),
  ProcurementController.recordVendorPayment
);

// Purchase Orders (Phiếu nhập kho HQ)
router.get('/purchase-orders', ProcurementController.getPurchaseOrders);
router.post(
  '/purchase-orders',
  validateDto(createPurchaseOrderSchema),
  ProcurementController.createPurchaseOrder
);
router.patch(
  '/purchase-orders/:id/status',
  validateDto(updatePurchaseOrderStatusSchema),
  ProcurementController.updatePurchaseOrderStatus
);
router.post(
  '/purchase-orders/:id/receive',
  validateDto(receivePurchaseOrderSchema),
  ProcurementController.receivePurchaseOrder
);

export default router;
