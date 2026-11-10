import mongoose from 'mongoose';

const { Schema } = mongoose;

export const COMPLAINT_SEVERITY = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const COMPLAINT_STATUS = {
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

const complaintSchema = new Schema(
  {
    complaintCode: {
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
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    orderCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    warrantyTicketId: {
      type: Schema.Types.ObjectId,
      ref: 'WarrantyTicket',
      default: null
    },
    customerInfo: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true }
    },
    severity: {
      type: String,
      enum: Object.values(COMPLAINT_SEVERITY),
      default: COMPLAINT_SEVERITY.HIGH
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.OPEN
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    reportedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      fullName: { type: String, required: true }
    },
    assignedManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: ''
    },
    compensationNote: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'complaints'
  }
);

complaintSchema.index({ branchId: 1, status: 1, createdAt: -1 });
complaintSchema.index({ 'customerInfo.phone': 1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
