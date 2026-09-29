import { Router } from 'express';
import { ProductController } from './product.controller.js';
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema
} from './product.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Public routes
router.get('/', validateDto(queryProductSchema, 'query'), ProductController.getAllProducts);
router.get('/:slug', ProductController.getProductBySlug);

// Admin-only management routes (SUPER_ADMIN)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(createProductSchema),
  ProductController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(updateProductSchema),
  ProductController.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  ProductController.deleteProduct
);

export default router;
