import mongoose from 'mongoose';

const { Schema } = mongoose;

export const STOCKTAKE_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

const expectedSerialSchema = new Schema(
  {
    serialNumber: { type: String, required: true, uppercase: true, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSkuId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, default: '' },
    productName: { type: String, default: '' }
  },
  { _id: false }
);

const stocktakeSchema = new Schema(
  {
    stocktakeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      fullName: { type: String, required: true }
    },
    completedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      fullName: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: Object.values(STOCKTAKE_STATUS),
      default: STOCKTAKE_STATUS.IN_PROGRESS
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    expectedSerials: {
      type: [expectedSerialSchema],
      default: []
    },
    scannedSerials: {
      type: [String],
      default: []
    },
    missingSerials: {
      type: [String],
      default: []
    },
    surplusSerials: {
      type: [String],
      default: []
    },
    summary: {
      expectedCount: { type: Number, default: 0 },
      scannedCount: { type: Number, default: 0 },
      matchedCount: { type: Number, default: 0 },
      missingCount: { type: Number, default: 0 },
      surplusCount: { type: Number, default: 0 }
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'stocktakes'
  }
);

stocktakeSchema.index({ branchId: 1, createdAt: -1 });
stocktakeSchema.index({ status: 1 });

export const Stocktake = mongoose.model('Stocktake', stocktakeSchema);
