import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Vai trò người dùng không hợp lệ'
      },
      default: USER_ROLES.CUSTOMER
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      validate: {
        validator: function (value) {
          if (this.role === USER_ROLES.STAFF || this.role === USER_ROLES.BRANCH_MANAGER) {
            return value != null;
          }
          return true;
        },
        message: 'Chi nhánh là bắt buộc đối với nhân viên (STAFF) và quản lý chi nhánh (BRANCH_MANAGER)'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ branchId: 1 });

// Pre-save hook: Hash password with bcryptjs
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
