import mongoose from 'mongoose';

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId là bắt buộc']
    },
    refreshTokenHash: {
      type: String,
      required: [true, 'RefreshTokenHash là bắt buộc']
    },
    deviceInfo: {
      type: String,
      default: 'Unknown Device'
    },
    ipAddress: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      required: [true, 'expiresAt là bắt buộc']
    }
  },
  {
    timestamps: true,
    collection: 'user_sessions'
  }
);

// Compound Index: userId + refreshTokenHash
sessionSchema.index({ userId: 1, refreshTokenHash: 1 });

// TTL Index: expiresAt (MongoDB auto cleans up expired sessions)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
