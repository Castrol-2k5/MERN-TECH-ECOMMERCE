import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ORDER_TYPES = {
  B2C_ONLINE: 'B2C_ONLINE',
  POS_STORE: 'POS_STORE'
};

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  VNPAY: 'VNPAY',
  STRIPE: 'STRIPE'
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const orderItemSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Mã sản phẩm (productId) là bắt buộc']
  },
  productSkuId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Mã SKU biến thể (productSkuId) là bắt buộc']
  },
  productName: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc']
  },
  sku: {
    type: String,
    required: [true, 'Mã SKU là bắt buộc']
  },
  quantity: {
    type: Number,
    required: [true, 'Số lượng là bắt buộc'],
    min: [1, 'Số lượng phải từ 1 trở lên']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Đơn giá là bắt buộc'],
    min: [0, 'Đơn giá không được âm']
  },
  subtotal: {
    type: Number,
    required: [true, 'Thành tiền (subtotal) là bắt buộc'],
    min: [0, 'Thành tiền không được âm']
  },
  serialsAssigned: {
    type: [String],
    default: []
  }
});

const orderSchema = new Schema(
  {
    orderCode: {
      type: String,
      required: [true, 'Mã đơn hàng là bắt buộc'],
      uppercase: true,
      trim: true
    },
    orderType: {
      type: String,
      enum: {
        values: Object.values(ORDER_TYPES),
        message: 'Loại đơn hàng không hợp lệ'
      },
      required: [true, 'Loại đơn hàng là bắt buộc']
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
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
    items: {
      type: [orderItemSchema],
      required: [true, 'Danh sách mặt hàng không được để trống'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Đơn hàng phải chứa ít nhất 1 sản phẩm'
      }
    },
    totalAmount: {
      type: Number,
      required: [true, 'Tổng tiền đơn hàng là bắt buộc'],
      min: [0, 'Tổng tiền không được âm']
    },
    paymentMethod: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Phương thức thanh toán không hợp lệ'
      },
      required: [true, 'Phương thức thanh toán là bắt buộc']
    },
    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: 'Trạng thái thanh toán không hợp lệ'
      },
      default: PAYMENT_STATUS.PENDING
    },
    orderStatus: {
      type: String,
      enum: {
        values: Object.values(ORDER_STATUS),
        message: 'Trạng thái đơn hàng không hợp lệ'
      },
      default: ORDER_STATUS.PENDING
    }
  },
  {
    timestamps: true,
    collection: 'orders'
  }
);

// Indexes
orderSchema.index({ orderCode: 1 }, { unique: true });
orderSchema.index({ branchId: 1, createdAt: -1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderStatus: 1 });

export const Order = mongoose.model('Order', orderSchema);
