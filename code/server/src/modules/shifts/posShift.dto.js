import { z } from 'zod';

export const openShiftSchema = z.object({
  branchId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Mã chi nhánh (branchId) không hợp lệ')
    .optional(),
  openingBalance: z
    .number({ required_error: 'Số tiền mặt đầu ca là bắt buộc' })
    .min(0, 'Số tiền đầu ca không được âm')
    .default(0)
});

export const closeShiftSchema = z.object({
  actualEndingBalance: z
    .number({ required_error: 'Số tiền thực tế kiểm đếm là bắt buộc' })
    .min(0, 'Số tiền kiểm đếm không được âm'),
  denominations: z
    .array(
      z.object({
        denomination: z.number().positive('Mệnh giá phải là số dương'),
        count: z.number().int().min(0, 'Số tờ tiền không được âm')
      })
    )
    .optional()
    .default([]),
  discrepancyNote: z.string().trim().optional().default('')
});

export const cashDropSchema = z.object({
  amount: z
    .number({ required_error: 'Số tiền rút két là bắt buộc' })
    .positive('Số tiền rút phải lớn hơn 0'),
  reason: z.string().trim().optional().default('Nộp két an toàn giữa ca')
});

export const cashVoucherSchema = z.object({
  type: z.enum(['IN', 'OUT'], {
    required_error: 'Loại phiếu thu/chi (IN hoặc OUT) là bắt buộc'
  }),
  category: z.string().trim().min(1).max(100).optional().default('Chi phí vận hành quầy'),
  amount: z.coerce
    .number({ required_error: 'Số tiền phiếu thu/chi là bắt buộc' })
    .min(1000, 'Số tiền phiếu thu/chi tối thiểu 1.000 ₫'),
  reason: z
    .string({ required_error: 'Lý do thu/chi là bắt buộc' })
    .trim()
    .min(2, 'Vui lòng nhập lý do thu/chi (tối thiểu 2 ký tự)')
    .max(300, 'Lý do tối đa 300 ký tự')
});

export const resolveDiscrepancySchema = z.object({
  resolutionType: z.enum(['DEDUCT_STAFF', 'BRANCH_EXPENSE', 'FOUND_LATER', 'CONFIRMED'], {
    required_error: 'Hình thức xử lý chênh lệch là bắt buộc'
  }),
  note: z
    .string({ required_error: 'Ghi chú xử lý chênh lệch là bắt buộc' })
    .trim()
    .min(3, 'Vui lòng nhập ghi chú xử lý (tối thiểu 3 ký tự)')
    .max(500, 'Ghi chú tối đa 500 ký tự')
});
