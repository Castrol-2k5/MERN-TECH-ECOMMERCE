import mongoose from 'mongoose';

const { Schema } = mongoose;

const branchInventorySchema = new Schema(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh (branchId) là bắt buộc']
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm (productId) là bắt buộc']
    },
    productSkuId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Mã SKU biến thể (productSkuId) là bắt buộc']
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng tồn kho là bắt buộc'],
      min: [0, 'Số lượng tồn kho không được âm'],
      default: 0
    },
    minStock: {
      type: Number,
      default: 0,
      min: [0, 'Định mức tồn tối thiểu không được âm']
    },
    maxStock: {
      type: Number,
      default: 0,
      min: [0, 'Định mức tồn tối đa không được âm']
    },
    shelfLocation: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'branch_inventories'
  }
);

// Compound Unique Index: prevents duplicate inventory record for the same SKU at the same branch
branchInventorySchema.index({ branchId: 1, productSkuId: 1 }, { unique: true });

// Single Index: productId
branchInventorySchema.index({ productId: 1 });

export const BranchInventory = mongoose.model('BranchInventory', branchInventorySchema);
