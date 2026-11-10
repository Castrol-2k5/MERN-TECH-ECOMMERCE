import { z } from 'zod';
import { SHIFT_TYPES } from './workSchedule.model.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const assignShiftSchema = z.object({
  branchId: z.string().regex(objectIdRegex).optional(),
  staffId: z.string().regex(objectIdRegex, 'staffId không hợp lệ'),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày làm việc phải theo định dạng YYYY-MM-DD'),
  shiftType: z.enum(Object.values(SHIFT_TYPES))
});

export const swapRequestSchema = z.object({
  requestedNote: z.string().trim().min(2, 'Vui lòng nhập lý do xin đổi ca / đi muộn').max(300),
  targetStaffId: z.string().regex(objectIdRegex).optional().nullable()
});

export const reviewSwapSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().trim().max(300).optional().default('')
});
