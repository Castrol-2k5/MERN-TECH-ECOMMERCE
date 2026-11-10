import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SHIFT_TYPES = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  SPLIT: 'SPLIT'
};

export const SHIFT_TIME_RULES = {
  MORNING: { label: 'Ca Sáng (08:00 - 14:00)', startMinutes: 8 * 60, endMinutes: 14 * 60 },
  AFTERNOON: { label: 'Ca Chiều (14:00 - 22:00)', startMinutes: 14 * 60, endMinutes: 22 * 60 },
  SPLIT: { label: 'Ca Gãy (10:00 - 20:00)', startMinutes: 10 * 60, endMinutes: 20 * 60 }
};

export const ATTENDANCE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CHECKED_IN: 'CHECKED_IN',
  LATE: 'LATE',
  COMPLETED: 'COMPLETED',
  ABSENT: 'ABSENT'
};

export const SWAP_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const workScheduleSchema = new Schema(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dateStr: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD']
    },
    shiftType: {
      type: String,
      enum: Object.values(SHIFT_TYPES),
      required: true
    },
    attendanceStatus: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.SCHEDULED
    },
    actualCheckInAt: {
      type: Date,
      default: null
    },
    actualCheckOutAt: {
      type: Date,
      default: null
    },
    assignedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    swapRequest: {
      status: {
        type: String,
        enum: Object.values(SWAP_STATUS),
        default: SWAP_STATUS.NONE
      },
      requestedNote: { type: String, trim: true, default: '' },
      targetStaffId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedById: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewNote: { type: String, trim: true, default: '' }
    }
  },
  {
    timestamps: true,
    collection: 'work_schedules'
  }
);

workScheduleSchema.index(
  { branchId: 1, staffId: 1, dateStr: 1, shiftType: 1 },
  { unique: true }
);
workScheduleSchema.index({ branchId: 1, dateStr: 1 });

export const WorkSchedule = mongoose.model('WorkSchedule', workScheduleSchema);
