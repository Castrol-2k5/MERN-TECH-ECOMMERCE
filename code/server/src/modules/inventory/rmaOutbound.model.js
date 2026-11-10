import mongoose from 'mongoose';

const { Schema } = mongoose;

const rmaItemSchema = new Schema(
  {
    serialNumber: { type: String, required: true, uppercase: true, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSkuId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, default: '' },
    productName: { type: String, default: '' }
  },
  { _id: false }
);

const rmaOutboundSchema = new Schema(
  {
    rmaCode: {
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
    destinationType: {
      type: String,
      enum: ['HQ_CENTER', 'BRAND_SERVICE'],
      default: 'HQ_CENTER'
    },
    destinationName: {
      type: String,
      required: true,
      trim: true
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: ''
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [rmaItemSchema],
      required: true
    },
    shippedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'rma_outbounds'
  }
);

rmaOutboundSchema.index({ branchId: 1, createdAt: -1 });

export const RmaOutbound = mongoose.model('RmaOutbound', rmaOutboundSchema);
