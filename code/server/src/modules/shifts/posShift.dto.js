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
