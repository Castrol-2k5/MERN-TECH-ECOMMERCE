import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { posCheckoutSchema, b2cCheckoutSchema } from './order.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect, optionalProtect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// 1. Luồng thanh toán tại quầy Web POS (STAFF, BRANCH_MANAGER, SUPER_ADMIN)
router.post(
  '/pos/checkout',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  scopeBranch,
  validateDto(posCheckoutSchema),
  OrderController.createPosOrder
);

// 2. Luồng đặt hàng B2C trực tuyến (Khách vãng lai hoặc Khách hàng CUSTOMER)
router.post(
  '/b2c/checkout',
  optionalProtect,
  validateDto(b2cCheckoutSchema),
  OrderController.createB2cOrder
);

// 3. Khách hàng xem lịch sử đơn hàng của mình
router.get(
  '/my-orders',
  protect,
  OrderController.getMyOrders
);

router.get(
  '/my-orders/:id',
  protect,
  OrderController.getMyOrderDetail
);

// 4. Quản lý/Nhân viên POS xem danh sách đơn hàng chi nhánh (scopeBranch)
router.get(
  '/branch',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  scopeBranch,
  OrderController.getBranchOrders
);

// 5. Xem chi tiết đơn hàng theo orderCode
router.get(
  '/:orderCode',
  protect,
  OrderController.getOrderByCode
);

export default router;
