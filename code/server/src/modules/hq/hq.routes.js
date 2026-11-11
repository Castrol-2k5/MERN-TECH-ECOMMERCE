import { Router } from 'express';
import { HqController } from './hq.controller.js';
import {
  updateThresholdsSchema,
  executeSupplyTransferSchema,
  executeDeadStockRebalanceSchema
} from './hq.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Toàn bộ API HQ Hub chỉ dành riêng cho Quản lý tổng toàn chuỗi (SUPER_ADMIN)
router.use(protect);
router.use(authorize(USER_ROLES.SUPER_ADMIN));

router.get('/command-center', HqController.getCommandCenter);

// Supply Chain: Min/Max Auto-Replenishment & Dead Stock Balancing (UC-HQ-06 & UC-HQ-07)
router.get('/supply-chain/thresholds', HqController.getThresholds);
router.patch(
  '/supply-chain/thresholds',
  validateDto(updateThresholdsSchema),
  HqController.updateThresholds
);
router.get('/supply-chain/replenishment-suggestions', HqController.getReplenishmentSuggestions);
router.post(
  '/supply-chain/replenish',
  validateDto(executeSupplyTransferSchema),
  HqController.executeAutoReplenishment
);
router.get('/supply-chain/dead-stock-suggestions', HqController.getDeadStockSuggestions);
router.post(
  '/supply-chain/rebalance',
  validateDto(executeDeadStockRebalanceSchema),
  HqController.executeDeadStockRebalance
);

export default router;
