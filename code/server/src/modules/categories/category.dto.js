import { z } from 'zod';

export const createCategorySchema = z
  .object({
    name: z
      .string({ required_error: 'Tên danh mục là bắt buộc' })
      .trim()
      .min(2, 'Tên danh mục tối thiểu 2 ký tự')
      .max(100, 'Tên danh mục tối đa 100 ký tự'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .optional(),
    parentId: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine(
        (val) => val === null || val === undefined || /^[0-9a-fA-F]{24}$/.test(val),
        {
          message: 'Mã danh mục cha (parentId) phải là ObjectId hợp lệ hoặc null'
        }
      ),
    attributeKeys: z
      .array(z.string().trim().toLowerCase())
      .optional()
      .default([]),
    isActive: z.boolean().optional().default(true)
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().optional(),
    parentId: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine(
        (val) => val === null || val === undefined || /^[0-9a-fA-F]{24}$/.test(val),
        {
          message: 'Mã danh mục cha (parentId) phải là ObjectId hợp lệ hoặc null'
        }
      ),
    attributeKeys: z.array(z.string().trim().toLowerCase()).optional(),
    isActive: z.boolean().optional()
  })
  .strict();
