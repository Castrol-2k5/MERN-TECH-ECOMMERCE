import { z } from 'zod';

const skuOptionValueSchema = z
  .object({
    optionName: z.string({ required_error: 'Tên tùy chọn biến thể là bắt buộc' }).trim().min(1),
    value: z.string({ required_error: 'Giá trị tùy chọn biến thể là bắt buộc' }).trim().min(1)
  })
  .strict();

export const skuSchema = z
  .object({
    _id: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID biến thể SKU không hợp lệ')
      .optional(),
    sku: z
      .string({ required_error: 'Mã SKU là bắt buộc' })
      .trim()
      .min(1, 'Mã SKU không được để trống')
      .transform((val) => val.toUpperCase()),
    price: z
      .number({ required_error: 'Giá niêm yết SKU là bắt buộc' })
      .min(0, 'Giá niêm yết không được âm'),
    salePrice: z
      .number()
      .min(0, 'Giá khuyến mãi không được âm')
      .optional(),
    images: z.array(z.string().trim()).optional().default([]),
    optionValues: z.array(skuOptionValueSchema).optional().default([]),
    isActive: z.boolean().optional().default(true)
  })
  .strict()
  .refine(
    (data) => data.salePrice === undefined || data.salePrice <= data.price,
    {
      message: 'Giá khuyến mãi (salePrice) không được lớn hơn giá niêm yết (price)',
      path: ['salePrice']
    }
  );

export const dynamicAttributeSchema = z
  .object({
    key: z
      .string({ required_error: 'Tên thuộc tính (key) là bắt buộc' })
      .trim()
      .min(1, 'Tên thuộc tính không được để trống'),
    value: z
      .string({ required_error: 'Giá trị thuộc tính (value) là bắt buộc' })
      .trim()
      .min(1, 'Giá trị thuộc tính không được để trống')
  })
  .strict();

export const productOptionSchema = z
  .object({
    name: z.string({ required_error: 'Tên nhóm tùy chọn là bắt buộc' }).trim().min(1),
    displayType: z.string().trim().optional().default('button'),
    values: z.array(z.string().trim()).optional().default([])
  })
  .strict();

export const createProductSchema = z
  .object({
    name: z
      .string({ required_error: 'Tên sản phẩm là bắt buộc' })
      .trim()
      .min(2, 'Tên sản phẩm tối thiểu 2 ký tự')
      .max(200, 'Tên sản phẩm tối đa 200 ký tự'),
    slug: z.string().trim().toLowerCase().optional(),
    categoryId: z
      .string({ required_error: 'Danh mục sản phẩm là bắt buộc' })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã danh mục (categoryId) phải là ObjectId hợp lệ'),
    brand: z
      .string({ required_error: 'Thương hiệu là bắt buộc' })
      .trim()
      .min(1, 'Thương hiệu không được để trống'),
    description: z.string().optional().default(''),
    images: z.array(z.string().trim()).optional().default([]),
    isSerialManaged: z.boolean().optional().default(true),
    isActive: z.boolean().optional().default(true),
    attributes: z.array(dynamicAttributeSchema).optional().default([]),
    options: z.array(productOptionSchema).optional().default([]),
    skus: z
      .array(skuSchema, { required_error: 'Danh sách SKUs là bắt buộc' })
      .min(1, 'Sản phẩm phải có ít nhất 1 biến thể SKU')
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z.string().trim().toLowerCase().optional(),
    categoryId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Mã danh mục (categoryId) phải là ObjectId hợp lệ')
      .optional(),
    brand: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    images: z.array(z.string().trim()).optional(),
    isSerialManaged: z.boolean().optional(),
    isActive: z.boolean().optional(),
    attributes: z.array(dynamicAttributeSchema).optional(),
    options: z.array(productOptionSchema).optional(),
    skus: z.array(skuSchema).min(1, 'Nếu cập nhật SKUs, cần ít nhất 1 biến thể SKU').optional()
  })
  .strict();

export const queryProductSchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(12),
    category: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    minPrice: z.coerce.number().min(0, 'Giá tối thiểu không được âm').optional(),
    maxPrice: z.coerce.number().min(0, 'Giá tối đa không được âm').optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'oldest']).optional().default('newest')
  })
  .passthrough();
