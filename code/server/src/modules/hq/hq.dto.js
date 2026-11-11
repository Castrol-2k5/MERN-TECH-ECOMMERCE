import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const updateThresholdsSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            branchId: z.string().trim().regex(objectIdRegex, 'branchId không hợp lệ'),
            productId: z.string().trim().regex(objectIdRegex, 'productId không hợp lệ'),
            productSkuId: z.string().trim().regex(objectIdRegex, 'productSkuId không hợp lệ'),
            minStock: z.number().int().min(0, 'minStock không được âm'),
            maxStock: z.number().int().min(0, 'maxStock không được âm')
          })
          .refine((it) => it.maxStock === 0 || it.maxStock >= it.minStock, {
            message: 'Định mức tối đa (maxStock) phải lớn hơn hoặc bằng tối thiểu (minStock)',
            path: ['maxStock']
          })
      )
      .min(1, 'Danh sách cấu hình định mức không được trống')
  })
  .strict();

export const executeSupplyTransferSchema = z
  .object({
    sourceBranchId: z.string().trim().regex(objectIdRegex, 'sourceBranchId không hợp lệ').optional(),
    destinationBranchId: z
      .string({ required_error: 'Chi nhánh đích là bắt buộc' })
      .trim()
      .regex(objectIdRegex, 'destinationBranchId không hợp lệ'),
    productId: z
      .string({ required_error: 'Sản phẩm là bắt buộc' })
      .trim()
      .regex(objectIdRegex, 'productId không hợp lệ'),
    productSkuId: z
      .string({ required_error: 'SKU là bắt buộc' })
      .trim()
      .regex(objectIdRegex, 'productSkuId không hợp lệ'),
    quantity: z.number().int().min(1, 'Số lượng điều chuyển tối thiểu 1'),
    serialNumbers: z.array(z.string().trim().min(1)).optional().default([]),
    notes: z.string().trim().max(300).optional().default('')
  })
  .strict();

export const executeDeadStockRebalanceSchema = executeSupplyTransferSchema.extend({
  sourceBranchId: z
    .string({ required_error: 'Chi nhánh nguồn là bắt buộc' })
    .trim()
    .regex(objectIdRegex, 'sourceBranchId không hợp lệ')
});
