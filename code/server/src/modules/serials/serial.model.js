import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SERIAL_STATUS = {
  IN_STOCK: 'IN_STOCK',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  WARRANTY: 'WARRANTY',
  TRANSIT: 'TRANSIT'
};

const serialSchema = new Schema(
  {
    serialNumber: {
      type: String,
      required: [true, 'Mã Serial/IMEI là bắt buộc'],
      uppercase: true,
      trim: true
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm (productId) là bắt buộc']
    },
    productSkuId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Mã SKU biến thể (productSkuId) là bắt buộc']
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh (branchId) là bắt buộc']
    },
    status: {
      type: String,
      enum: {
        values: Object.values(SERIAL_STATUS),
        message: 'Trạng thái Serial không hợp lệ'
      },
      default: SERIAL_STATUS.IN_STOCK
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    orderItemId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    soldAt: {
      type: Date,
      default: null
    },
    warrantyEndDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'serials'
  }
);

// Indexes
serialSchema.index({ serialNumber: 1 }, { unique: true });
// Compound Index for POS scanner fast availability check
serialSchema.index({ branchId: 1, status: 1, productSkuId: 1 });

export const Serial = mongoose.model('Serial', serialSchema);
