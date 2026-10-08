import { z } from 'zod';
import { USER_ROLES } from './user.model.js';

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().trim().email('Địa chỉ email không hợp lệ').toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không đúng định dạng di động Việt Nam'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.enum([USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF, USER_ROLES.CUSTOMER]),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Mã chi nhánh không hợp lệ').optional().nullable(),
  isActive: z.boolean().optional().default(true)
}).refine(
  (data) => {
    if (data.role === USER_ROLES.STAFF || data.role === USER_ROLES.BRANCH_MANAGER) {
      return Boolean(data.branchId);
    }
    return true;
  },
  {
    message: 'Chi nhánh là bắt buộc đối với nhân viên (STAFF) và quản lý chi nhánh (BRANCH_MANAGER)',
    path: ['branchId']
  }
);

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ và tên phải có ít nhất 2 ký tự').optional(),
  email: z.string().trim().email('Địa chỉ email không hợp lệ').toLowerCase().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không đúng định dạng di động Việt Nam')
    .optional(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  role: z.enum([USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF, USER_ROLES.CUSTOMER]).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Mã chi nhánh không hợp lệ').optional().nullable(),
  isActive: z.boolean().optional()
});

export const queryUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  role: z.enum([USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF, USER_ROLES.CUSTOMER]).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Mã chi nhánh không hợp lệ').optional(),
  isActive: z.enum(['true', 'false']).optional()
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'Trạng thái hoạt động là bắt buộc' })
});
