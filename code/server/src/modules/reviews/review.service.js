import mongoose from 'mongoose';
import { OrderReview } from './orderReview.model.js';
import { Order, ORDER_STATUS } from '../orders/order.model.js';
import { User } from '../users/user.model.js';
import { OrderService } from '../orders/order.service.js';
import { AppError } from '../../utils/appError.js';

const REVIEWABLE_STATUSES = [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED];

export class ReviewService {
  /**
   * Khách hàng đánh giá đơn hàng đã hoàn thành & nhân viên phục vụ (1-5 sao)
   */
  static async createReview(customerId, payload) {
    const { orderId, rating, comment = '', tags = [] } = payload;

    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng để đánh giá.', 404, 'ORDER_NOT_FOUND');
    }

    // Kiểm tra quyền sở hữu đơn (khớp customerId hoặc SĐT chuẩn hóa cho đơn POS)
    let isOwner = order.customerId && String(order.customerId) === String(customerId);
    if (!isOwner && order.customerInfo?.phone) {
      const customer = await User.findById(customerId).select('phone').lean();
      const userVariants = OrderService.buildPhoneVariants(customer?.phone);
      const orderPhoneVariants = OrderService.buildPhoneVariants(order.customerInfo.phone);
      isOwner = userVariants.some((p) => orderPhoneVariants.includes(p));
    }

    if (!isOwner) {
      throw new AppError('Bạn không có quyền đánh giá đơn hàng này.', 403, 'FORBIDDEN_ORDER_REVIEW');
    }

    if (!REVIEWABLE_STATUSES.includes(order.orderStatus)) {
      throw new AppError(
        'Chỉ có thể gửi đánh giá sau khi đơn hàng đã hoàn tất.',
        400,
        'ORDER_NOT_COMPLETED'
      );
    }

    const existing = await OrderReview.findOne({ orderId: order._id }).lean();
    if (existing) {
      throw new AppError('Đơn hàng này đã được đánh giá trước đó.', 409, 'REVIEW_ALREADY_EXISTS');
    }

    const cleanTags = Array.from(new Set((tags || []).map((t) => String(t).trim()).filter(Boolean)));

    try {
      const review = await OrderReview.create({
        orderId: order._id,
        orderCode: order.orderCode,
        branchId: order.branchId,
        staffId: order.staffId || null,
        customerId,
        rating,
        tags: cleanTags,
        comment: comment || ''
      });

      return OrderReview.findById(review._id)
        .populate('staffId', 'fullName role')
        .populate('branchId', 'name branchCode')
        .lean();
    } catch (err) {
      if (err?.code === 11000) {
        throw new AppError('Đơn hàng này đã được đánh giá trước đó.', 409, 'REVIEW_ALREADY_EXISTS');
      }
      throw err;
    }
  }

  /**
   * Khách hàng xem danh sách đánh giá đã gửi
   */
  static async getMyReviews(customerId) {
    const reviews = await OrderReview.find({ customerId })
      .populate('staffId', 'fullName role')
      .populate('branchId', 'name branchCode')
      .sort({ createdAt: -1 })
      .lean();

    return { reviews };
  }

  /**
   * Quản lý Chi nhánh / HQ xem đánh giá khách hàng tại chi nhánh
   */
  static async getBranchReviews(targetBranchId = null, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (targetBranchId) {
      filter.branchId = new mongoose.Types.ObjectId(String(targetBranchId));
    }
    if (query.rating) {
      filter.rating = Number(query.rating);
    }

    const [total, reviews, summaryAgg] = await Promise.all([
      OrderReview.countDocuments(filter),
      OrderReview.find(filter)
        .populate('customerId', 'fullName phone')
        .populate('staffId', 'fullName role')
        .populate('branchId', 'name branchCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderReview.aggregate([
        { $match: targetBranchId ? { branchId: new mongoose.Types.ObjectId(String(targetBranchId)) } : {} },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            fiveStarCount: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            avgRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    const s = summaryAgg[0] || { totalReviews: 0, fiveStarCount: 0, avgRating: 0 };

    return {
      reviews,
      summary: {
        totalReviews: s.totalReviews,
        fiveStarCount: s.fiveStarCount,
        avgRating: s.totalReviews > 0 ? Number(Number(s.avgRating || 0).toFixed(1)) : 0
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
}
