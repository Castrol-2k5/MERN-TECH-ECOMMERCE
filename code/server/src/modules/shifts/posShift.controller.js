import { PosShiftService } from './posShift.service.js';
import {
  openShiftSchema,
  closeShiftSchema,
  cashDropSchema,
  cashVoucherSchema,
  resolveDiscrepancySchema
} from './posShift.dto.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class PosShiftController {
  static openShift = catchAsync(async (req, res) => {
    const validated = openShiftSchema.parse(req.body);
    const shift = await PosShiftService.openShift(validated, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Mở ca thu ngân thành công',
      data: { shift }
    });
  });

  static getCurrentShift = catchAsync(async (req, res) => {
    const shift = await PosShiftService.getCurrentShift(req.user, req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thông tin ca làm việc hiện tại thành công',
      data: { shift }
    });
  });

  static recordCashDrop = catchAsync(async (req, res) => {
    const validated = cashDropSchema.parse(req.body);
    const shift = await PosShiftService.recordCashDrop(req.params.id, validated, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Ghi nhận rút tiền mặt nộp két an toàn thành công',
      data: { shift }
    });
  });

  static recordCashVoucher = catchAsync(async (req, res) => {
    const validated = cashVoucherSchema.parse(req.body);
    const shift = await PosShiftService.recordCashVoucher(req.params.id, validated, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: `Lập phiếu ${validated.type === 'IN' ? 'thu' : 'chi'} nội bộ thành công`,
      data: { shift }
    });
  });

  static closeShift = catchAsync(async (req, res) => {
    const validated = closeShiftSchema.parse(req.body);
    const shift = await PosShiftService.closeShift(req.params.id, validated, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Chốt ca thu ngân và bàn giao két tiền thành công',
      data: { shift }
    });
  });

  static getShiftHistory = catchAsync(async (req, res) => {
    const result = await PosShiftService.getShiftHistory(req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy lịch sử ca thu ngân thành công',
      data: result
    });
  });

  static getLiveCashMonitor = catchAsync(async (req, res) => {
    const data = await PosShiftService.getLiveCashMonitor(req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy dữ liệu giám sát két tiền trực tiếp thành công',
      data
    });
  });

  static resolveDiscrepancy = catchAsync(async (req, res) => {
    const validated = resolveDiscrepancySchema.parse(req.body);
    const shift = await PosShiftService.resolveDiscrepancy(req.params.id, validated, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã lưu biên bản xử lý chênh lệch két tiền cuối ca',
      data: { shift }
    });
  });
}
