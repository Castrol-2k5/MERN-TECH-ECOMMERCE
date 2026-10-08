import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TRANSFER_STATUS = {
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const stockTransferSchema = new Schema(
  {
    transferCode: {
      type: String,
      required: [true, 'Mã phiếu điều chuyển là bắt buộc'],
      uppercase: true,
      trim: true
    },
    sourceBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh xuất chuyển là bắt buộc']
    },
    destinationBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh tiếp nhận là bắt buộc']
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm là bắt buộc']
    },
    productSkuId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Mã biến thể SKU là bắt buộc']
    },
    sku: {
      type: String,
      required: [true, 'Mã SKU là bắt buộc'],
      uppercase: true,
      trim: true
    },
    productName: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng điều chuyển là bắt buộc'],
      min: [1, 'Số lượng điều chuyển tối thiểu là 1']
    },
    serialNumbers: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TRANSFER_STATUS),
        message: 'Trạng thái phiếu điều chuyển không hợp lệ'
      },
      default: TRANSFER_STATUS.IN_TRANSIT
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người tạo phiếu là bắt buộc']
    },
    receivedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    receivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'stock_transfers'
  }
);

stockTransferSchema.index({ transferCode: 1 }, { unique: true });
stockTransferSchema.index({ sourceBranchId: 1, createdAt: -1 });
stockTransferSchema.index({ destinationBranchId: 1, createdAt: -1 });
stockTransferSchema.index({ status: 1 });

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
