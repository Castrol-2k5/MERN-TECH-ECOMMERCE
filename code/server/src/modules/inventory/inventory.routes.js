import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { adjustStockSchema, createTransferSchema, receiveTransferSchema } from './inventory.dto.js';
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

export default router;

