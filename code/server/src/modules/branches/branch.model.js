import mongoose from 'mongoose';

const { Schema } = mongoose;

export const BRANCH_REGIONS = {
  HCM: 'HCM',
  HANOI: 'HANOI',
  MIEN_NAM: 'MIEN_NAM',
  MIEN_TRUNG: 'MIEN_TRUNG',
  MIEN_BAC: 'MIEN_BAC',
  KHAC: 'KHAC'
};

const branchSchema = new Schema(
  {
    branchCode: {
      type: String,
      required: [true, 'Mã chi nhánh là bắt buộc'],
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Tên chi nhánh là bắt buộc'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ chi nhánh là bắt buộc'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại chi nhánh là bắt buộc'],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Tọa độ GPS [kinh độ, vĩ độ] là bắt buộc']
      }
    },
    isHeadquarter: {
      type: Boolean,
      default: false
    },
    isWarehouse: {
      type: Boolean,
      default: false
    },
    region: {
      type: String,
      enum: Object.values(BRANCH_REGIONS),
      default: BRANCH_REGIONS.KHAC
    },
    monthlyRevenueTarget: {
      type: Number,
      default: 0,
      min: [0, 'Chỉ tiêu doanh thu tháng không được âm']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'branches'
  }
);

// Indexes
branchSchema.index({ branchCode: 1 }, { unique: true });
branchSchema.index({ location: '2dsphere' });

export const Branch = mongoose.model('Branch', branchSchema);
