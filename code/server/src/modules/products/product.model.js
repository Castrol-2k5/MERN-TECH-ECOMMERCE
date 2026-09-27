import mongoose from 'mongoose';

const { Schema } = mongoose;

const dynamicAttributeSchema = new Schema(
  {
    key: {
      type: String,
      required: [true, 'Tên thuộc tính (key) là bắt buộc'],
      trim: true
    },
    value: {
      type: String,
      required: [true, 'Giá trị thuộc tính (value) là bắt buộc'],
      trim: true
    }
  },
  { _id: false }
);

const productOptionSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Tên tùy chọn là bắt buộc'],
    trim: true
  },
  displayType: {
    type: String,
    default: 'button' // e.g., button, color_picker, dropdown
  },
  values: {
    type: [String],
    default: []
  }
});

const skuOptionValueSchema = new Schema(
  {
    optionName: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const productSkuSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  sku: {
    type: String,
    required: [true, 'Mã SKU là bắt buộc'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Giá niêm yết SKU là bắt buộc'],
    min: [0, 'Giá không được âm']
  },
  salePrice: {
    type: Number,
    default: 0,
    min: [0, 'Giá khuyến mãi không được âm']
  },
  images: {
    type: [String],
    default: []
  },
  optionValues: {
    type: [skuOptionValueSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Slug sản phẩm là bắt buộc'],
      lowercase: true,
      trim: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Danh mục sản phẩm là bắt buộc']
    },
    brand: {
      type: String,
      required: [true, 'Thương hiệu là bắt buộc'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    isSerialManaged: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    attributes: {
      type: [dynamicAttributeSchema],
      default: []
    },
    options: {
      type: [productOptionSchema],
      default: []
    },
    skus: {
      type: [productSkuSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

// Indexes
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ categoryId: 1 });
productSchema.index({ brand: 1 });
// Multikey Compound Index for fast dynamic filtering
productSchema.index({ 'attributes.key': 1, 'attributes.value': 1 });
// Single Index on embedded SKU code
productSchema.index({ 'skus.sku': 1 });

export const Product = mongoose.model('Product', productSchema);
