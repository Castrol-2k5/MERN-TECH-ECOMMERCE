import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { createCategorySchema, updateCategorySchema } from './category.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Public routes
router.get('/', CategoryController.getAllCategories);
router.get('/:slug', CategoryController.getCategoryBySlug);

// Admin-only management routes (SUPER_ADMIN)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(createCategorySchema),
  CategoryController.createCategory
);

router.put(
  '/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  validateDto(updateCategorySchema),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN),
  CategoryController.deleteCategory
);

export default router;
