import { z } from 'zod';
import { PO_STATUS } from './purchaseOrder.model.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const upsertVendorSchema = z
  .object({
    vendorCode: z
      .string({ required_error: 'Mã nhà cung cấp là bắt buộc' })
      .trim()
      .min(2, 'Mã nhà cung cấp tối thiểu 2 ký tự')
      .max(40, 'Mã nhà cung cấp tối đa 40 ký tự')
      .transform((v) => v.toUpperCase()),
    name: z
      .string({ required_error: 'Tên nhà cung cấp là bắt buộc' })
      .trim()
      .min(2, 'Tên nhà cung cấp tối thiểu 2 ký tự')
      .max(150),
    taxCode: z.string().trim().max(40).optional().default(''),
    contactName: z.string().trim().max(100).optional().default(''),
    phone: z
      .string({ required_error: 'Số điện thoại liên hệ là bắt buộc' })
      .trim()
      .min(8, 'Số điện thoại tối thiểu 8 ký tự')
      .max(20),
    email: z.string().trim().email('Email không hợp lệ').or(z.literal('')).optional().default(''),
    address: z.string().trim().max(255).optional().default(''),
    paymentTermDays: z.number().int().min(0).max(365).optional().default(30),
    notes: z.string().trim().max(500).optional().default(''),
    isActive: z.boolean().optional().default(true)
  })
  .strict();

export const updateVendorSchema = upsertVendorSchema.partial();

export const createPurchaseOrderSchema = z
  .object({
    vendorId: z
      .string({ required_error: 'Nhà cung cấp là bắt buộc' })
      .trim()
      .regex(objectIdRegex, 'vendorId không hợp lệ'),
    warehouseBranchId: z
      .string()
      .trim()
      .regex(objectIdRegex, 'warehouseBranchId không hợp lệ')
      .optional(),
    status: z.enum([PO_STATUS.DRAFT, PO_STATUS.ORDERED]).optional().default(PO_STATUS.ORDERED),
    notes: z.string().trim().max(500).optional().default(''),
    items: z
      .array(
        z.object({
          productId: z.string().trim().regex(objectIdRegex, 'productId không hợp lệ'),
          productSkuId: z.string().trim().regex(objectIdRegex, 'productSkuId không hợp lệ'),
          orderedQty: z.number().int().min(1, 'Số lượng đặt tối thiểu 1'),
          unitCost: z.number().min(0, 'Giá nhập không được âm')
        })
      )
      .min(1, 'Phiếu nhập phải có ít nhất 1 mặt hàng')
  })
  .strict();

export const updatePurchaseOrderStatusSchema = z
  .object({
    status: z.enum([PO_STATUS.ORDERED, PO_STATUS.CANCELLED])
  })
  .strict();

export const receivePurchaseOrderSchema = z
  .object({
    notes: z.string().trim().max(500).optional().default(''),
    items: z
      .array(
        z.object({
          productSkuId: z.string().trim().regex(objectIdRegex, 'productSkuId không hợp lệ'),
          receivedQty: z.number().int().min(1).optional(),
          serials: z.array(z.string().trim().min(1)).optional().default([])
        })
      )
      .optional()
      .default([])
  })
  .strict();

export const recordVendorPaymentSchema = z
  .object({
    amount: z
      .number({ required_error: 'Số tiền thanh toán là bắt buộc' })
      .min(1000, 'Số tiền thanh toán tối thiểu 1.000 ₫'),
    purchaseOrderId: z
      .string()
      .trim()
      .regex(objectIdRegex, 'purchaseOrderId không hợp lệ')
      .optional(),
    note: z.string().trim().max(300).optional().default('')
  })
  .strict();
