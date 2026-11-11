import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ');

const cartItemInputSchema = z.object({
  productId: objectIdSchema,
  productSkuId: objectIdSchema,
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').max(50, 'Số lượng tối đa là 50').default(1)
});

export const cartPayloadSchema = z.object({
  items: z.array(cartItemInputSchema).max(50, 'Giỏ hàng tối đa 50 dòng sản phẩm').default([]),
  branchId: objectIdSchema.nullable().optional()
});

export const getCartQuerySchema = z.object({
  branchId: objectIdSchema.optional()
});
