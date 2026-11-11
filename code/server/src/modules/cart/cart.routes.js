import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { cartPayloadSchema, getCartQuerySchema } from './cart.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect, optionalProtect } from '../../middlewares/auth.middleware.js';

const router = Router();

// Preview live prices & branch stock (available for both Guest and authenticated Customer)
router.post(
  '/preview',
  optionalProtect,
  validateDto(cartPayloadSchema),
  CartController.previewCart
);

// Authenticated customer cart sync endpoints
router.get(
  '/',
  protect,
  validateDto(getCartQuerySchema, 'query'),
  CartController.getMyCart
);

router.post(
  '/merge',
  protect,
  validateDto(cartPayloadSchema),
  CartController.mergeCart
);

router.put(
  '/',
  protect,
  validateDto(cartPayloadSchema),
  CartController.syncCart
);

export default router;
