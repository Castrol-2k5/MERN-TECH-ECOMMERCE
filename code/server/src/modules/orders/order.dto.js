import { z } from 'zod';
import { PAYMENT_METHODS } from './order.model.js';

const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const posOrderItemSchema = z
  .object({
    productId: z
      .string({ required_error: 'Mã sản phẩm (productId) là bắt buộc' })
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã sản phẩm (productId) không hợp lệ'),
    productSkuId: z
      .string({ required_error: 'Mã SKU biến thể (productSkuId) là bắt buộc' })
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã SKU biến thể (productSkuId) không hợp lệ'),
    quantity: z
      .number({ required_error: 'Số lượng mua là bắt buộc' })
      .int('Số lượng phải là số nguyên')
      .min(1, 'Số lượng mua tối thiểu là 1'),
    serialsAssigned: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Mã Serial không được để trống')
      )
      .optional()
      .default([])
  })
  .strict()
  .refine(
    (item) => {
      if (item.serialsAssigned && item.serialsAssigned.length > 0) {
        return item.serialsAssigned.length === item.quantity;
      }
      return true;
    },
    {
      message: 'Số lượng mã Serial gán vào phải bằng đúng số lượng mua (quantity)',
      path: ['serialsAssigned']
    }
  );

export const posCheckoutSchema = z
  .object({
    branchId: z
      .string()
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ')
      .optional(),
    items: z
      .array(posOrderItemSchema, { required_error: 'Danh sách sản phẩm là bắt buộc' })
      .min(1, 'Đơn hàng POS phải chứa ít nhất 1 sản phẩm'),
    paymentMethod: z
      .enum([PAYMENT_METHODS.CASH, PAYMENT_METHODS.VNPAY], {
        errorMap: () => ({ message: 'Phương thức thanh toán POS chỉ chấp nhận CASH hoặc VNPAY' })
      })
      .optional()
      .default(PAYMENT_METHODS.CASH),
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
  })
  .strict();

const b2cOrderItemSchema = z
  .object({
    productId: z
      .string({ required_error: 'Mã sản phẩm (productId) là bắt buộc' })
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã sản phẩm (productId) không hợp lệ'),
    productSkuId: z
      .string({ required_error: 'Mã SKU biến thể (productSkuId) là bắt buộc' })
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã SKU biến thể (productSkuId) không hợp lệ'),
    quantity: z
      .number({ required_error: 'Số lượng mua là bắt buộc' })
      .int('Số lượng phải là số nguyên')
      .min(1, 'Số lượng mua tối thiểu là 1')
  })
  .strict();

export const b2cCheckoutSchema = z
  .object({
    branchId: z
      .string({ required_error: 'Chi nhánh xuất/nhận hàng (branchId) là bắt buộc' })
      .trim()
      .regex(OBJECT_ID_REGEX, 'Mã chi nhánh (branchId) không hợp lệ'),
    items: z
      .array(b2cOrderItemSchema, { required_error: 'Danh sách sản phẩm là bắt buộc' })
      .min(1, 'Giỏ hàng B2C phải chứa ít nhất 1 sản phẩm'),
    shippingAddress: z
      .object({
        fullName: z.string({ required_error: 'Họ tên người nhận là bắt buộc' }).trim().min(1, 'Họ tên người nhận không được để trống'),
        phone: z
          .string({ required_error: 'Số điện thoại người nhận là bắt buộc' })
          .trim()
          .regex(VIETNAMESE_PHONE_REGEX, 'Số điện thoại người nhận không đúng định dạng di động Việt Nam'),
        address: z.string({ required_error: 'Địa chỉ giao hàng là bắt buộc' }).trim().min(1, 'Địa chỉ giao hàng không được để trống')
      })
      .strict(),
    paymentMethod: z.enum([PAYMENT_METHODS.CASH, PAYMENT_METHODS.VNPAY, PAYMENT_METHODS.STRIPE], {
      errorMap: () => ({ message: 'Phương thức thanh toán B2C phải là CASH, VNPAY hoặc STRIPE' })
    })
  })
  .strict();

