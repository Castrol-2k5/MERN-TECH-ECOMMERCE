import { z } from 'zod';
import { APPROVAL_TYPES } from './approval.model.js';

export const createApprovalSchema = z.object({
  type: z.enum(Object.values(APPROVAL_TYPES), {
    required_error: 'Loại yêu cầu phê duyệt là bắt buộc'
  }),
  targetId: z
    .string({ required_error: 'targetId là bắt buộc' })
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'targetId không hợp lệ'),
  reason: z
    .string({ required_error: 'Lý do gửi phê duyệt là bắt buộc' })
    .trim()
    .min(2, 'Lý do phải có ít nhất 2 ký tự')
    .max(400, 'Lý do tối đa 400 ký tự'),
  payload: z.record(z.any()).optional().default({})
});

export const reviewApprovalSchema = z.object({
  reviewNote: z.string().trim().max(400).optional().default('')
});
