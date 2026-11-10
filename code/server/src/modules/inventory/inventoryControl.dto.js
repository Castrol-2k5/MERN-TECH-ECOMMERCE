import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createStocktakeSchema = z.object({
  branchId: z.string().regex(objectIdRegex, 'Mã chi nhánh không hợp lệ').optional(),
  note: z.string().trim().max(400).optional().default('')
});

export const scanStocktakeSchema = z.object({
  serialNumber: z.string().trim().optional(),
  serialNumbers: z.array(z.string().trim()).optional()
});

export const completeStocktakeSchema = z.object({
  note: z.string().trim().max(500).optional().default('')
});

export const createTransferRequestSchema = z.object({
  requestingBranchId: z.string().regex(objectIdRegex, 'Mã chi nhánh yêu cầu không hợp lệ').optional(),
  sourceBranchId: z.string().regex(objectIdRegex, 'Mã chi nhánh xuất hàng không hợp lệ'),
  items: z
    .array(
      z.object({
        productId: z.string().regex(objectIdRegex),
        productSkuId: z.string().regex(objectIdRegex),
        quantity: z.coerce.number().int().min(1)
      })
    )
    .min(1, 'Cần ít nhất 1 sản phẩm'),
  reason: z.string().trim().min(2, 'Vui lòng nhập lý do xin cấp hàng').max(400)
});

export const reviewTransferRequestSchema = z.object({
  reviewNote: z.string().trim().max(400).optional().default(''),
  dispatchTransfer: z.boolean().optional().default(false),
  serialsMap: z.record(z.array(z.string().trim())).optional().default({})
});

export const createRmaOutboundSchema = z.object({
  branchId: z.string().regex(objectIdRegex).optional(),
  destinationType: z.enum(['HQ_CENTER', 'BRAND_SERVICE']).optional().default('HQ_CENTER'),
  destinationName: z.string().trim().min(2, 'Vui lòng nhập tên nơi tiếp nhận RMA').max(200),
  trackingNumber: z.string().trim().max(100).optional().default(''),
  reason: z.string().trim().min(2, 'Vui lòng nhập ghi chú/lý do xuất trả RMA').max(400),
  serialNumbers: z.array(z.string().trim().min(1)).min(1, 'Cần chọn ít nhất 1 mã Serial lỗi')
});
