import mongoose from 'mongoose';

const { Schema } = mongoose;

export const COMMISSION_RULE_TYPES = {
  FIXED_PER_UNIT: 'FIXED_PER_UNIT',
  PERCENT_OF_REVENUE: 'PERCENT_OF_REVENUE'
};

const commissionRuleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên quy tắc hoa hồng là bắt buộc'],
      trim: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    ruleType: {
      type: String,
      enum: Object.values(COMMISSION_RULE_TYPES),
      required: true
    },
    value: {
      type: Number,
      required: [true, 'Giá trị hoa hồng là bắt buộc'],
      min: [0, 'Giá trị hoa hồng không được âm']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      fullName: { type: String, default: '' }
    }
  },
  {
    timestamps: true,
    collection: 'commission_rules'
  }
);

commissionRuleSchema.index({ categoryId: 1, isActive: 1 });

export const CommissionRule = mongoose.model('CommissionRule', commissionRuleSchema);
