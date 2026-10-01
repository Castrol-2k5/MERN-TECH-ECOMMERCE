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

export const createTransferSchema = z
  .object({
    sourceBranchId: z
      .string({ required_error: 'Chi nhánh xuất chuyển là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Chi nhánh xuất chuyển không hợp lệ'),
    destinationBranchId: z
      .string({ required_error: 'Chi nhánh tiếp nhận là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Chi nhánh tiếp nhận không hợp lệ'),
    productId: z
      .string({ required_error: 'Mã sản phẩm là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã sản phẩm không hợp lệ'),
    productSkuId: z
      .string({ required_error: 'Mã biến thể SKU là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã biến thể SKU không hợp lệ'),
    quantity: z
      .number({ required_error: 'Số lượng điều chuyển là bắt buộc' })
      .int()
      .min(1, 'Số lượng tối thiểu là 1'),
    serialNumbers: z
      .array(z.string().trim().toUpperCase())
      .default([]),
    notes: z.string().trim().optional().default('')
  })
  .refine((data) => data.sourceBranchId !== data.destinationBranchId, {
    message: 'Chi nhánh nhận phải khác chi nhánh xuất chuyển',
    path: ['destinationBranchId']
  });

export const receiveTransferSchema = z
  .object({
    scannedSerials: z
      .array(z.string().trim().toUpperCase())
      .optional()
      .default([])
  })
  .strict();

