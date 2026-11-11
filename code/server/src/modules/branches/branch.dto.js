import { z } from 'zod';
import { BRANCH_REGIONS } from './branch.model.js';

// Chấp nhận SĐT di động VN (03,05,07,08,09), số máy bàn cố định (02x) và tổng đài (1800/1900)
export const BRANCH_PHONE_REGEX = /^((0|\+84)[235789][0-9]{8,9}|1[89]00[0-9]{4,6})$/;

export const createBranchSchema = z
  .object({
    branchCode: z
      .string({ required_error: 'Mã chi nhánh là bắt buộc' })
      .trim()
      .min(2, 'Mã chi nhánh tối thiểu 2 ký tự')
      .max(50, 'Mã chi nhánh tối đa 50 ký tự')
      .transform((val) => val.toUpperCase()),
    name: z
      .string({ required_error: 'Tên chi nhánh là bắt buộc' })
      .trim()
      .min(2, 'Tên chi nhánh tối thiểu 2 ký tự')
      .max(100, 'Tên chi nhánh tối đa 100 ký tự'),
    address: z
      .string({ required_error: 'Địa chỉ chi nhánh là bắt buộc' })
      .trim()
      .min(5, 'Địa chỉ tối thiểu 5 ký tự')
      .max(255, 'Địa chỉ tối đa 255 ký tự'),
    phone: z
      .string({ required_error: 'Số điện thoại chi nhánh là bắt buộc' })
      .trim()
      .transform((val) => val.replace(/[\s.-]/g, ''))
      .refine((val) => BRANCH_PHONE_REGEX.test(val), {
        message: 'Số điện thoại không đúng định dạng số điện thoại Việt Nam (di động hoặc máy bàn)'
      }),
    location: z.object(
      {
        type: z.literal('Point').default('Point'),
        coordinates: z
          .array(z.number(), { required_error: 'Tọa độ GPS [kinh độ, vĩ độ] là bắt buộc' })
          .length(2, 'Tọa độ GPS phải chứa đúng 2 số: [kinh độ (longitude), vĩ độ (latitude)]')
          .refine(
            ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
            {
              message: 'Tọa độ kinh độ phải từ -180 đến 180, vĩ độ phải từ -90 đến 90'
            }
          )
      },
      { required_error: 'Vị trí địa lý (location) là bắt buộc' }
    ),
    isHeadquarter: z.boolean().optional().default(false),
    isWarehouse: z.boolean().optional().default(false),
    region: z.enum(Object.values(BRANCH_REGIONS)).optional().default(BRANCH_REGIONS.KHAC),
    monthlyRevenueTarget: z.number().min(0, 'Chỉ tiêu doanh thu tháng không được âm').optional().default(0),
    bootstrapInventory: z.boolean().optional().default(false),
    bootstrapFromBranchId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID chi nhánh mẫu không hợp lệ')
      .nullable()
      .optional(),
    isActive: z.boolean().optional().default(true)
  })
  .strict();

export const updateBranchSchema = createBranchSchema.partial();

export const nearbyBranchSchema = z.object({
  lng: z
    .string({ required_error: 'Kinh độ (lng) là bắt buộc' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: 'Kinh độ (lng) phải là số từ -180 đến 180'
    }),
  lat: z
    .string({ required_error: 'Vĩ độ (lat) là bắt buộc' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: 'Vĩ độ (lat) phải là số từ -90 đến 90'
    }),
  distance: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10000))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Khoảng cách tìm kiếm (distance) phải lớn hơn 0 mét'
    })
});
