import mongoose from 'mongoose';

const { Schema } = mongoose;

export const WARRANTY_STATUS = {
  RECEIVED: 'RECEIVED',                       // Bước 3: Đã tiếp nhận tại quầy
  DIAGNOSING: 'DIAGNOSING',                   // Bước 4: Kỹ thuật đang kiểm tra đánh giá
  QUOTATION_PENDING: 'QUOTATION_PENDING',     // Bước 4: Chờ khách duyệt báo giá/phương án
  REPAIRING: 'REPAIRING',                     // Bước 5: Đang sửa chữa / thay linh kiện
  REPAIR_REJECTED: 'REPAIR_REJECTED',         // Bước 4: Khách từ chối báo giá, hoàn trả máy
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',       // Bước 5: Đã sửa xong / chuẩn bị xong, chờ khách nhận
  RETURNED: 'RETURNED'                        // Bước 5/6: Đã bàn giao lại cho khách & đóng phiếu
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
      default: null
    },
    customerInfo: {
      fullName: {
        type: String,
        trim: true,
        default: ''
      },
      phone: {
        type: String,
        trim: true,
        default: ''
      },
      address: {
        type: String,
        trim: true,
        default: ''
      }
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
    appearanceCondition: {
      type: String,
      default: ''
    },
    devicePassword: {
      type: String,
      trim: true,
      default: ''
    },
    powerStatus: {
      type: String,
      default: 'Lên nguồn bình thường'
    },
    accessories: {
      type: [String],
      default: []
    },
    estimatedReturnDate: {
      type: String,
      default: ''
    },
    diagnosis: {
      technicianNotes: { type: String, trim: true, default: '' },
      diagnosedAt: { type: Date, default: null },
      diagnosedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
    },
    quotation: {
      isUnderWarranty: { type: Boolean, default: true },
      partsDescription: { type: String, trim: true, default: '' },
      partsCost: { type: Number, default: 0, min: 0 },
      laborCost: { type: Number, default: 0, min: 0 },
      totalCost: { type: Number, default: 0, min: 0 }
    },
    customerApproval: {
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
      },
      approvedVia: {
        type: String,
        enum: ['ONLINE', 'PHONE', 'IN_PERSON', 'AUTO_UNDER_WARRANTY', 'NONE'],
        default: 'NONE'
      },
      note: { type: String, trim: true, default: '' },
      decidedAt: { type: Date, default: null }
    },
    resolution: {
      repairNotes: { type: String, trim: true, default: '' },
      partsReplaced: { type: [String], default: [] },
      repairedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      completedAt: { type: Date, default: null }
    },
    handover: {
      returnedAt: { type: Date, default: null },
      staffId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      paymentMethod: { type: String, default: 'NONE' },
      amountPaid: { type: Number, default: 0, min: 0 },
      customerNotes: { type: String, trim: true, default: '' }
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
