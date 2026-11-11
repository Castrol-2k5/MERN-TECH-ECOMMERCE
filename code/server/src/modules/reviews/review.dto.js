import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ');

export const createReviewSchema = z.object({
  orderId: objectIdSchema,
  rating: z.coerce
    .number({ required_error: 'Số sao đánh giá là bắt buộc' })
    .int('Số sao phải là số nguyên từ 1 đến 5')
    .min(1, 'Đánh giá tối thiểu 1 sao')
    .max(5, 'Đánh giá tối đa 5 sao'),
  comment: z.string().trim().max(1000, 'Nhận xét tối đa 1000 ký tự').optional().default(''),
  tags: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([])
});

export const queryBranchReviewsSchema = z.object({
  branchId: objectIdSchema.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
