import { SettlementService } from './settlement.service.js';
import { settlePaymentSchema } from './settlement.dto.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class SettlementController {
  static getSettlements = catchAsync(async (req, res) => {
    const result = await SettlementService.getSettlements(req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách đối soát bù trừ liên chi nhánh thành công',
      data: result
    });
  });

  static settlePayment = catchAsync(async (req, res) => {
    const validated = settlePaymentSchema.parse(req.body);
    const settlement = await SettlementService.settlePayment(req.params.id, validated, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Xác nhận thanh toán bù trừ liên chi nhánh thành công',
      data: { settlement }
    });
  });
}
