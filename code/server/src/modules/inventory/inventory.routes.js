import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { InventoryControlController } from './inventoryControl.controller.js';
import { adjustStockSchema, createTransferSchema, receiveTransferSchema } from './inventory.dto.js';
import {
  createStocktakeSchema,
  scanStocktakeSchema,
  completeStocktakeSchema,
  createTransferRequestSchema,
  reviewTransferRequestSchema,
  createRmaOutboundSchema
} from './inventoryControl.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Public: Find branches with available stock for a specific SKU (Storefront B2C)
router.get('/sku/:productSkuId', InventoryController.getInventoryBySku);

// Protected: Get branch inventory (scoped for STAFF and BRANCH_MANAGER, unrestricted for SUPER_ADMIN)
router.get(
  '/branch/:branchId',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  scopeBranch,
  InventoryController.getInventoryByBranch
);

// Protected: Manual stock adjustment (SUPER_ADMIN and BRANCH_MANAGER of assigned branch)
router.post(
  '/adjust',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(adjustStockSchema),
  InventoryController.adjustStock
);

// Protected: Điều chuyển tồn kho liên chi nhánh (Stock Transfers)
router.post(
  '/transfers',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(createTransferSchema),
  InventoryController.createTransfer
);

router.get(
  '/transfers',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  InventoryController.getTransfers
);

router.patch(
  '/transfers/:id/receive',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  validateDto(receiveTransferSchema),
  InventoryController.receiveTransfer
);

// ==========================================
// Kiểm kho định kỳ theo Serial/IMEI (UC-BM-05)
// ==========================================
router.get(
  '/stocktakes',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  InventoryControlController.getStocktakes
);

router.post(
  '/stocktakes',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(createStocktakeSchema),
  InventoryControlController.createStocktake
);

router.get(
  '/stocktakes/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  InventoryControlController.getStocktakeDetail
);

router.post(
  '/stocktakes/:id/scan',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  validateDto(scanStocktakeSchema),
  InventoryControlController.scanStocktakeSerials
);

router.patch(
  '/stocktakes/:id/complete',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(completeStocktakeSchema),
  InventoryControlController.completeStocktake
);

// ==========================================
// Yêu cầu xin cấp hàng (Pull Transfer - UC-BM-06)
// ==========================================
router.get(
  '/transfer-requests',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  InventoryControlController.getTransferRequests
);

router.post(
  '/transfer-requests',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(createTransferRequestSchema),
  InventoryControlController.createTransferRequest
);

router.patch(
  '/transfer-requests/:id/approve',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(reviewTransferRequestSchema),
  InventoryControlController.approveTransferRequest
);

router.patch(
  '/transfer-requests/:id/reject',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(reviewTransferRequestSchema),
  InventoryControlController.rejectTransferRequest
);

// ==========================================
// Quản lý & Xuất gom lô hàng lỗi RMA (UC-BM-06)
// ==========================================
router.get(
  '/rma-outbound/defective-serials',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  scopeBranch,
  InventoryControlController.getDefectiveSerials
);

router.get(
  '/rma-outbound',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  InventoryControlController.getRmaOutbounds
);

router.post(
  '/rma-outbound',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(createRmaOutboundSchema),
  InventoryControlController.createRmaOutbound
);

export default router;
