import mongoose from 'mongoose';

const { Schema } = mongoose;

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
