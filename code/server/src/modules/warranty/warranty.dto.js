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
          .default('')
      })
      .optional()
      .default({ fullName: '', phone: '' }),
    notes: z.string().trim().optional().default('')
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
