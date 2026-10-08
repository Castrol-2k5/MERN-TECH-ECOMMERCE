import { z } from 'zod';

export const importSerialsSchema = z
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
    serials: z
      .array(
        z
          .string({ required_error: 'Mã Serial/IMEI là bắt buộc' })
          .trim()
          .min(1, 'Mã Serial/IMEI không được để trống')
          .transform((val) => val.toUpperCase())
      )
      .min(1, 'Danh sách serials phải có tối thiểu 1 mã Serial/IMEI')
      .refine(
        (items) => {
          const uppers = items.map((s) => s.trim().toUpperCase());
          return new Set(uppers).size === uppers.length;
        },
        {
          message: 'Danh sách serials không được chứa mã trùng lặp'
        }
      )
  })
  .strict();

export const verifySerialSchema = z
  .object({
    serialNumber: z
      .string({ required_error: 'Mã Serial/IMEI là bắt buộc' })
      .trim()
      .min(1, 'Mã Serial/IMEI không được để trống')
  })
  .strict();

export const getSerialsQuerySchema = z.object({
  branchId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Mã chi nhánh (branchId) không hợp lệ')
    .optional(),
  productId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Mã sản phẩm (productId) không hợp lệ')
    .optional(),
  productSkuId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Mã biến thể SKU (productSkuId) không hợp lệ')
    .optional(),
  status: z
    .enum(['IN_STOCK', 'RESERVED', 'SOLD', 'WARRANTY', 'TRANSIT'], {
      errorMap: () => ({ message: 'Trạng thái Serial không hợp lệ' })
    })
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
});
