import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderReviewSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Mã đơn hàng (orderId) là bắt buộc'],
      unique: true
    },
    orderCode: {
      type: String,
      required: [true, 'Mã đơn hàng (orderCode) là bắt buộc'],
      uppercase: true,
      trim: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh (branchId) là bắt buộc']
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Khách hàng (customerId) là bắt buộc']
    },
    rating: {
      type: Number,
      required: [true, 'Điểm đánh giá (rating) là bắt buộc'],
      min: [1, 'Đánh giá tối thiểu 1 sao'],
      max: [5, 'Đánh giá tối đa 5 sao']
    },
    tags: {
      type: [String],
      default: []
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Nhận xét tối đa 1000 ký tự'],
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'order_reviews'
  }
);

orderReviewSchema.index({ staffId: 1, createdAt: -1 });
orderReviewSchema.index({ branchId: 1, createdAt: -1 });
orderReviewSchema.index({ customerId: 1, createdAt: -1 });

export const OrderReview = mongoose.model('OrderReview', orderReviewSchema);
