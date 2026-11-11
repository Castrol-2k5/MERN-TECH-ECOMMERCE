import { ReviewService } from './review.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class ReviewController {
  static createReview = catchAsync(async (req, res) => {
    const review = await ReviewService.createReview(req.user.id, req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Cảm ơn bạn đã gửi đánh giá trải nghiệm mua hàng!',
      data: { review }
    });
  });

  static getMyReviews = catchAsync(async (req, res) => {
    const result = await ReviewService.getMyReviews(req.user.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách đánh giá cá nhân thành công',
      data: result
    });
  });

  static getBranchReviews = catchAsync(async (req, res) => {
    const targetBranchId = req.scopedBranchId || req.query.branchId || null;
    const result = await ReviewService.getBranchReviews(targetBranchId, req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách đánh giá chi nhánh thành công',
      data: {
        reviews: result.reviews,
        summary: result.summary
      },
      meta: result.pagination
    });
  });
}
