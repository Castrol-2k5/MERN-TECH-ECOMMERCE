import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Slug danh mục là bắt buộc'],
      lowercase: true,
      trim: true
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    attributeKeys: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'categories'
  }
);

// Indexes
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });

export const Category = mongoose.model('Category', categorySchema);
