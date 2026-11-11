import mongoose from 'mongoose';

const { Schema } = mongoose;

const vendorSchema = new Schema(
  {
    vendorCode: {
      type: String,
      required: [true, 'Mã nhà cung cấp là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Tên nhà cung cấp là bắt buộc'],
      trim: true
    },
    taxCode: {
      type: String,
      trim: true,
      default: ''
    },
    contactName: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại liên hệ là bắt buộc'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    paymentTermDays: {
      type: Number,
      default: 30,
      min: 0
    },
    totalPurchased: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    outstandingDebt: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'vendors'
  }
);

vendorSchema.index({ name: 1, isActive: 1 });

export const Vendor = mongoose.model('Vendor', vendorSchema);
