import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TRANSFER_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const requestItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSkuId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const transferRequestSchema = new Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    requestingBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    sourceBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    requestedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      fullName: { type: String, required: true }
    },
    items: {
      type: [requestItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Phải có ít nhất 1 mặt hàng trong yêu cầu xin cấp hàng'
      }
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(TRANSFER_REQUEST_STATUS),
      default: TRANSFER_REQUEST_STATUS.PENDING
    },
    reviewedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      fullName: { type: String, default: '' }
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNote: {
      type: String,
      trim: true,
      default: ''
    },
    linkedTransferId: {
      type: Schema.Types.ObjectId,
      ref: 'StockTransfer',
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'transfer_requests'
  }
);

transferRequestSchema.index({ requestingBranchId: 1, createdAt: -1 });
transferRequestSchema.index({ sourceBranchId: 1, status: 1, createdAt: -1 });

export const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
