import { z } from 'zod';
import { WARRANTY_STATUS } from './warranty.model.js';

const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const createWarrantyTicketSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    serialNumber: z
      .string({ required_error: 'Mã Serial/IMEI là bắt buộc' })
      .trim()
      .min(1, 'Mã Serial/IMEI không được để trống')
      .transform((val) => val.toUpperCase()),
    issueDescription: z
      .string({ required_error: 'Mô tả sự cố/lỗi là bắt buộc' })
      .trim()
      .min(1, 'Mô tả sự cố/lỗi không được để trống'),
    customerInfo: z
      .object({
        fullName: z.string().trim().optional().default(''),
        phone: z
          .string()
          .trim()
          .refine((val) => !val || VIETNAMESE_PHONE_REGEX.test(val), {
            message: 'Số điện thoại không đúng định dạng di động Việt Nam'
          })
          .optional()
          .default(''),
        address: z.string().trim().optional().default('')
      })
      .optional()
      .default({ fullName: '', phone: '', address: '' }),
    appearanceCondition: z.string().trim().optional().default(''),
    devicePassword: z.string().trim().optional().default(''),
    powerStatus: z.string().trim().optional().default('Lên nguồn bình thường'),
    accessories: z.array(z.string().trim()).optional().default([]),
    estimatedReturnDate: z.string().trim().optional().default(''),
    notes: z.string().trim().optional().default('')
  })
  .strict();

export const diagnoseTicketSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    technicianNotes: z
      .string({ required_error: 'Kết luận chẩn đoán lỗi của kỹ thuật viên là bắt buộc' })
      .trim()
      .min(1, 'Kết luận chẩn đoán không được để trống'),
    isUnderWarranty: z.boolean({ required_error: 'Xác định diện bảo hành là bắt buộc' }),
    partsDescription: z.string().trim().optional().default(''),
    partsCost: z.coerce.number().min(0, 'Chi phí linh kiện không hợp lệ').optional().default(0),
    laborCost: z.coerce.number().min(0, 'Chi phí công sửa chữa không hợp lệ').optional().default(0)
  })
  .strict();

export const approveQuotationSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    approved: z.boolean({ required_error: 'Trạng thái xác nhận (approved) là bắt buộc' }),
    approvedVia: z.enum(['ONLINE', 'PHONE', 'IN_PERSON']).optional().default('PHONE'),
    note: z.string().trim().optional().default(''),
    phone: z.string().trim().optional()
  })
  .strict();

export const completeRepairSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    repairNotes: z
      .string({ required_error: 'Ghi chú kết quả sửa chữa là bắt buộc' })
      .trim()
      .min(1, 'Ghi chú kết quả sửa chữa không được để trống'),
    partsReplaced: z.array(z.string().trim()).optional().default([])
  })
  .strict();

export const handoverTicketSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    paymentMethod: z.enum(['NONE', 'CASH', 'TRANSFER', 'VNPAY', 'CARD']).optional().default('NONE'),
    amountPaid: z.coerce.number().min(0, 'Số tiền thanh toán không hợp lệ').optional().default(0),
    customerNotes: z.string().trim().optional().default('')
  })
  .strict();

export const trackWarrantyPublicSchema = z.object({
  ticketCode: z
    .string({ required_error: 'Mã phiếu bảo hành là bắt buộc' })
    .trim()
    .min(1, 'Mã phiếu không được để trống')
    .transform((v) => v.toUpperCase()),
  phone: z
    .string({ required_error: 'Số điện thoại khách hàng là bắt buộc' })
    .trim()
    .min(1, 'Số điện thoại không được để trống')
});

export const updateWarrantyStatusSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    status: z.enum(Object.values(WARRANTY_STATUS), {
      required_error: 'Trạng thái bảo hành mới (status) là bắt buộc'
    }),
    notes: z.string().trim().optional()
  })
  .strict();

export const getWarrantyTicketsQuerySchema = z.object({
  serialNumber: z.string().trim().optional(),
  ticketCode: z.string().trim().optional(),
  status: z.enum(Object.values(WARRANTY_STATUS)).optional(),
  branchId: z
    .string()
    .trim()
    .regex(OBJECT_ID_REGEX, 'Mã chi nhánh không hợp lệ')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
});
