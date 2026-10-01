import { z } from 'zod';

// Vietnam phone number regex: starts with 0 or +84 followed by 3, 5, 7, 8, 9 and 8 digits
export const VN_PHONE_REGEX = /^(0|\+84)[35789][0-9]{8}$/;

export const registerSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Họ và tên là bắt buộc' })
      .trim()
      .min(2, 'Họ và tên tối thiểu 2 ký tự')
      .max(100, 'Họ và tên tối đa 100 ký tự'),
    email: z
      .string({ required_error: 'Email là bắt buộc' })
      .trim()
      .toLowerCase()
      .email('Email không đúng định dạng'),
    phone: z
      .string({ required_error: 'Số điện thoại là bắt buộc' })
      .trim()
      .regex(VN_PHONE_REGEX, 'Số điện thoại không đúng định dạng di động Việt Nam (VD: 0912345678 hoặc +84912345678)'),
    password: z
      .string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(6, 'Mật khẩu tối thiểu 6 ký tự')
  })
  .strict({
    message: 'Yêu cầu chứa trường không được phép (Tuyệt đối không được chỉ định role hoặc quyền hạn khi đăng ký)'
  });

export const loginSchema = z
  .object({
    identifier: z
      .string({ required_error: 'Email hoặc Số điện thoại là bắt buộc' })
      .trim()
      .min(1, 'Email hoặc Số điện thoại không được để trống')
      .refine(
        (val) => {
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          const isPhone = VN_PHONE_REGEX.test(val);
          return isEmail || isPhone;
        },
        {
          message: 'Tài khoản đăng nhập phải là Email hợp lệ hoặc Số điện thoại Việt Nam hợp lệ'
        }
      ),
    password: z
      .string({ required_error: 'Mật khẩu là bắt buộc' })
      .min(1, 'Mật khẩu không được để trống')
  })
export const forgotPasswordSchema = z
  .object({
    identifier: z
      .string({ required_error: 'Email hoặc Số điện thoại là bắt buộc' })
      .trim()
      .min(1, 'Email hoặc Số điện thoại không được để trống')
      .refine(
        (val) => {
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          const isPhone = VN_PHONE_REGEX.test(val);
          return isEmail || isPhone;
        },
        {
          message: 'Tài khoản phải là Email hợp lệ hoặc Số điện thoại Việt Nam hợp lệ'
        }
      )
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'Mã xác thực token là bắt buộc' })
      .trim()
      .min(1, 'Mã xác thực token không được để trống'),
    newPassword: z
      .string({ required_error: 'Mật khẩu mới là bắt buộc' })
      .min(6, 'Mật khẩu mới tối thiểu 6 ký tự')
  })
  .strict();
