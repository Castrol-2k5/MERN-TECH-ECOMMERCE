import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PO_STATUS = {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

export const PO_PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID'
};

const poItemSchema = new Schema(
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
    isSerialManaged: {
      type: Boolean,
      default: true
    },
    orderedQty: {
      type: Number,
      required: true,
      min: 1
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    serials: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const poPaymentEntrySchema = new Schema(
  {
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: Date.now },
    paidById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    paidByName: { type: String, default: '' }
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  {
    poCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Nhà cung cấp là bắt buộc']
    },
    warehouseBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Kho nhận hàng là bắt buộc']
    },
    items: {
      type: [poItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Phiếu nhập phải có ít nhất 1 mặt hàng'
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(PO_STATUS),
      default: PO_STATUS.ORDERED
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PO_PAYMENT_STATUS),
      default: PO_PAYMENT_STATUS.UNPAID
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      fullName: { type: String, required: true, trim: true }
    },
    receivedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      fullName: { type: String, default: '' }
    },
    receivedAt: {
      type: Date,
      default: null
    },
    payments: {
      type: [poPaymentEntrySchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'purchase_orders'
  }
);

purchaseOrderSchema.index({ vendorId: 1, createdAt: -1 });
purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ warehouseBranchId: 1, status: 1 });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
