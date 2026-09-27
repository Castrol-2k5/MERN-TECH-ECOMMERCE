import mongoose from 'mongoose';

const { Schema } = mongoose;

export const WARRANTY_STATUS = {
  RECEIVED: 'RECEIVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  RETURNED: 'RETURNED'
};

const warrantyTicketSchema = new Schema(
  {
    ticketCode: {
      type: String,
      required: [true, 'Mã phiếu bảo hành là bắt buộc'],
      uppercase: true,
      trim: true
    },
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
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Khách hàng (customerId) là bắt buộc']
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh tiếp nhận (branchId) là bắt buộc']
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Nhân viên tiếp nhận (staffId) là bắt buộc']
    },
    issueDescription: {
      type: String,
      required: [true, 'Mô tả lỗi/sự cố là bắt buộc'],
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: Object.values(WARRANTY_STATUS),
        message: 'Trạng thái bảo hành không hợp lệ'
      },
      default: WARRANTY_STATUS.RECEIVED
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'warrantytickets'
  }
);

// Indexes
warrantyTicketSchema.index({ ticketCode: 1 }, { unique: true });
warrantyTicketSchema.index({ serialNumber: 1 });
warrantyTicketSchema.index({ customerId: 1 });

export const WarrantyTicket = mongoose.model('WarrantyTicket', warrantyTicketSchema);
