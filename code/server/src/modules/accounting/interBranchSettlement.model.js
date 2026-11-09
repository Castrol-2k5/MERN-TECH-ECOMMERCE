import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SETTLEMENT_TYPE = {
  CLICK_AND_COLLECT_PAYOUT: 'CLICK_AND_COLLECT_PAYOUT', // Khách trả trước cho HQ, chi nhánh xuất hàng nhận lại giá vốn + phí
  CROSS_BRANCH_DISPATCH: 'CROSS_BRANCH_DISPATCH',       // Đơn online phân bổ chi nhánh xuất giao hộ
  CROSS_BRANCH_EXCHANGE: 'CROSS_BRANCH_EXCHANGE'        // Đổi máy tại chi nhánh khác đơn gốc
};

export const SETTLEMENT_STATUS = {
  PENDING_CLEARING: 'PENDING_CLEARING', // Chờ đối soát thanh toán
  SETTLED: 'SETTLED',                   // Đã thanh toán bù trừ
  CANCELLED: 'CANCELLED'                // Hủy bỏ (do đơn hoàn trả/hủy)
};

const interBranchSettlementSchema = new Schema(
  {
    settlementCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(SETTLEMENT_TYPE),
      required: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderCode: {
      type: String,
      required: true
    },
    // Chi nhánh thu/giữ tiền ban đầu (thường là HQ nếu thanh toán online)
    sourceBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    // Chi nhánh phục vụ / xuất kho bàn giao hàng
    fulfillingBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    orderAmount: {
      type: Number,
      required: true,
      min: 0
    },
    // Giá vốn hàng bán (COGS) hoàn trả cho chi nhánh xuất kho
    cogsAmount: {
      type: Number,
      required: true,
      min: 0
    },
    // Phí dịch vụ showroom / hoa hồng bàn giao cho chi nhánh (ví dụ 3% doanh thu)
    fulfillmentFee: {
      type: Number,
      required: true,
      min: 0
    },
    // Tổng số tiền Trụ sở cần chuyển hoàn cho Chi nhánh = cogsAmount + fulfillmentFee
    totalPayableToBranch: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(SETTLEMENT_STATUS),
      default: SETTLEMENT_STATUS.PENDING_CLEARING
    },
    clearedAt: {
      type: Date,
      default: null
    },
    clearedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    bankTransferRef: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'inter_branch_settlements'
  }
);

interBranchSettlementSchema.index({ sourceBranchId: 1, status: 1 });
interBranchSettlementSchema.index({ fulfillingBranchId: 1, status: 1 });
interBranchSettlementSchema.index({ orderId: 1 });
interBranchSettlementSchema.index({ createdAt: -1 });

export const InterBranchSettlement = mongoose.model('InterBranchSettlement', interBranchSettlementSchema);
