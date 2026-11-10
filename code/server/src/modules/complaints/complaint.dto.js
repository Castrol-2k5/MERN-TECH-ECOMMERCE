import { z } from 'zod';
import { COMPLAINT_SEVERITY, COMPLAINT_STATUS } from './complaint.model.js';

export const createComplaintSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  orderCode: z.string().trim().max(50).optional().default(''),
  customerName: z.string().trim().min(2, 'Tên khách hàng tối thiểu 2 ký tự'),
  customerPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ''))
    .refine((v) => /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(v), 'Số điện thoại không đúng định dạng VN'),
  severity: z.enum(Object.values(COMPLAINT_SEVERITY)).optional().default(COMPLAINT_SEVERITY.HIGH),
  description: z.string().trim().min(5, 'Vui lòng mô tả nội dung khiếu nại (tối thiểu 5 ký tự)').max(1000)
});

export const updateComplaintSchema = z.object({
  status: z.enum(Object.values(COMPLAINT_STATUS)),
  resolutionNote: z.string().trim().min(3, 'Vui lòng nhập phương án xử lý').max(1000),
  compensationNote: z.string().trim().max(400).optional().default('')
});
