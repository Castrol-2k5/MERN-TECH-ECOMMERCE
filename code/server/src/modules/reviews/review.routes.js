import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { createReviewSchema, queryBranchReviewsSchema } from './review.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize, scopeBranch } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

router.use(protect);

router.post('/', validateDto(createReviewSchema), ReviewController.createReview);
router.get('/my-reviews', ReviewController.getMyReviews);
router.get(
  '/branch',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  scopeBranch,
  validateDto(queryBranchReviewsSchema, 'query'),
  ReviewController.getBranchReviews
);

export default router;
