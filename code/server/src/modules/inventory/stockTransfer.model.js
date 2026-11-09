import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TRANSFER_STATUS = {
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const transferItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productSkuId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Số lượng mặt hàng tối thiểu là 1']
    },
    serialNumbers: {
      type: [String],
      default: []
    },
    receivedQuantity: {
      type: Number,
      default: 0
    },
    receivedSerials: {
      type: [String],
      default: []
    },
    discrepancyCount: {
      type: Number,
      default: 0
    },
    discrepancyReason: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const carrierInfoSchema = new Schema(
  {
    carrierName: { type: String, default: 'Vận chuyển nội bộ TechOne' },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    trackingNumber: { type: String, default: '' }
  },
  { _id: false }
);

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
    // Hỗ trợ chuyển nhiều mặt hàng trên 1 phiếu (Multi-SKU Manifest)
    items: {
      type: [transferItemSchema],
      default: []
    },
    // Thông tin vận chuyển logistics
    carrierInfo: {
      type: carrierInfoSchema,
      default: () => ({})
    },
    // Trường tương thích ngược đơn sản phẩm (Single SKU)
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    productSkuId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    sku: {
      type: String,
      uppercase: true,
      trim: true,
      default: ''
    },
    productName: {
      type: String,
      trim: true,
      default: ''
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
    hasDiscrepancy: {
      type: Boolean,
      default: false
    },
    discrepancyReport: {
      type: String,
      default: ''
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
