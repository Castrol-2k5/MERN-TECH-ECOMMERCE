import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SHIFT_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};

const denominationSchema = new Schema(
  {
    denomination: { type: Number, required: true }, // e.g. 500000, 200000, 100000, 50000...
    count: { type: Number, required: true, default: 0 } // Số tờ tiền
  },
  { _id: false }
);

const cashDropSchema = new Schema(
  {
    amount: { type: Number, required: true, min: [1000, 'Số tiền rút tối thiểu 1.000 ₫'] },
    reason: { type: String, default: 'Nộp két sắt an toàn giữa ca' },
    performedAt: { type: Date, default: Date.now },
    performedById: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const posShiftSchema = new Schema(
  {
    shiftCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh là bắt buộc']
    },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Thu ngân là bắt buộc']
    },
    openedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    closedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: Object.values(SHIFT_STATUS),
      default: SHIFT_STATUS.OPEN
    },
    // Tiền lẻ thối đầu ca
    openingBalance: {
      type: Number,
      required: [true, 'Số tiền mặt đầu ca là bắt buộc'],
      min: [0, 'Số tiền đầu ca không thể âm'],
      default: 0
    },
    // Tổng tiền mặt thu từ các đơn POS trong ca
    cashSales: {
      type: Number,
      default: 0,
      min: 0
    },
    // Tiền hoàn lại cho khách bằng tiền mặt
    cashRefunds: {
      type: Number,
      default: 0,
      min: 0
    },
    // Các lần rút tiền nộp quỹ giữa ca
    cashDrops: {
      type: [cashDropSchema],
      default: []
    },
    // Tiền lý thuyết trong két = openingBalance + cashSales - cashRefunds - sum(cashDrops)
    expectedEndingBalance: {
      type: Number,
      default: 0
    },
    // Tiền kiểm đếm thực tế khi chốt ca
    actualEndingBalance: {
      type: Number,
      default: null
    },
    // Chênh lệch = actualEndingBalance - expectedEndingBalance
    discrepancy: {
      type: Number,
      default: 0
    },
    // Chi tiết đếm từng mệnh giá tiền
    denominations: {
      type: [denominationSchema],
      default: []
    },
    // Ghi chú giải trình chênh lệch
    discrepancyNote: {
      type: String,
      trim: true,
      default: ''
    },
    // Quản lý duyệt chốt ca
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    totalOrdersCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'pos_shifts'
  }
);

posShiftSchema.index({ branchId: 1, status: 1 });
posShiftSchema.index({ cashierId: 1, status: 1 });
posShiftSchema.index({ createdAt: -1 });

export const PosShift = mongoose.model('PosShift', posShiftSchema);
