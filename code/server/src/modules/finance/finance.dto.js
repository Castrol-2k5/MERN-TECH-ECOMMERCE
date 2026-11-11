import { z } from 'zod';
import { EXPENSE_CATEGORIES, EXPENSE_STATUS } from './branchExpense.model.js';
import { COMMISSION_RULE_TYPES } from './commissionRule.model.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createExpenseSchema = z
  .object({
    branchId: z
      .string({ required_error: 'Chi nhánh là bắt buộc' })
      .trim()
      .regex(objectIdRegex, 'branchId không hợp lệ'),
    monthKey: z
      .string({ required_error: 'Tháng hạch toán (YYYY-MM) là bắt buộc' })
      .trim()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Định dạng tháng phải là YYYY-MM'),
    category: z.enum(Object.values(EXPENSE_CATEGORIES), {
      required_error: 'Danh mục chi phí không hợp lệ'
    }),
    amount: z
      .number({ required_error: 'Số tiền chi phí là bắt buộc' })
      .min(1000, 'Số tiền chi phí tối thiểu 1.000 ₫'),
    description: z
      .string({ required_error: 'Mô tả chi phí là bắt buộc' })
      .trim()
      .min(2, 'Mô tả tối thiểu 2 ký tự')
      .max(400)
  })
  .strict();

export const reviewExpenseSchema = z
  .object({
    status: z.enum([EXPENSE_STATUS.APPROVED, EXPENSE_STATUS.REJECTED]),
    reviewNote: z.string().trim().max(400).optional().default('')
  })
  .strict();

export const createCommissionRuleSchema = z
  .object({
    name: z
      .string({ required_error: 'Tên quy tắc hoa hồng là bắt buộc' })
      .trim()
      .min(2, 'Tên quy tắc tối thiểu 2 ký tự')
      .max(120),
    categoryId: z
      .string()
      .trim()
      .regex(objectIdRegex, 'categoryId không hợp lệ')
      .nullable()
      .optional()
      .default(null),
    ruleType: z.enum(Object.values(COMMISSION_RULE_TYPES), {
      required_error: 'Loại quy tắc hoa hồng không hợp lệ'
    }),
    value: z.number({ required_error: 'Giá trị hoa hồng là bắt buộc' }).min(0),
    isActive: z.boolean().optional().default(true)
  })
  .strict()
  .refine(
    (data) => data.ruleType !== COMMISSION_RULE_TYPES.PERCENT_OF_REVENUE || data.value <= 100,
    {
      message: 'Tỷ lệ hoa hồng phần trăm không được vượt quá 100%',
      path: ['value']
    }
  );

export const toggleCommissionRuleSchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();
