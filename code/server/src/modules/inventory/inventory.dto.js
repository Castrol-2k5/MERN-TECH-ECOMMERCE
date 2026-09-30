import { z } from 'zod';

export const adjustStockSchema = z
  .object({
    branchId: z
      .string({ required_error: 'Mã chi nhánh (branchId) là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã chi nhánh (branchId) không hợp lệ'),
    productId: z
      .string({ required_error: 'Mã sản phẩm (productId) là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã sản phẩm (productId) không hợp lệ'),
    productSkuId: z
      .string({ required_error: 'Mã biến thể SKU (productSkuId) là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã biến thể SKU (productSkuId) không hợp lệ'),
    quantityDelta: z
      .number({ required_error: 'Số lượng điều chỉnh (quantityDelta) là bắt buộc' })
      .int('Số lượng điều chỉnh phải là số nguyên')
      .refine((val) => val !== 0, {
        message: 'Số lượng điều chỉnh (quantityDelta) phải khác 0'
      }),
    reason: z
      .string({ required_error: 'Lý do điều chỉnh (reason) là bắt buộc' })
      .trim()
      .min(1, 'Lý do điều chỉnh không được để trống')
  })
  .strict();
