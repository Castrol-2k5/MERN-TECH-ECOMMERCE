import { HqCommandService } from './hqCommand.service.js';
import { SupplyChainService } from './supplyChain.service.js';
import { HqBiService } from './hqBi.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class HqController {
  static getCommandCenter = catchAsync(async (req, res) => {
    const data = await HqCommandService.getCommandCenter();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy dữ liệu Trung tâm Điều hành HQ thành công',
      data
    });
  });

  static getThresholds = catchAsync(async (req, res) => {
    const data = await SupplyChainService.getThresholds(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy bảng định mức tồn kho Min/Max thành công',
      data
    });
  });

  static updateThresholds = catchAsync(async (req, res) => {
    const data = await SupplyChainService.updateThresholds(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật định mức tồn kho Min/Max thành công',
      data
    });
  });

  static getReplenishmentSuggestions = catchAsync(async (req, res) => {
    const data = await SupplyChainService.getReplenishmentSuggestions();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách gợi ý cấp hàng tự động thành công',
      data
    });
  });

  static executeAutoReplenishment = catchAsync(async (req, res) => {
    const transfer = await SupplyChainService.executeAutoReplenishment(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã tạo lệnh xuất điều chuyển cấp hàng từ Kho Tổng HQ',
      data: { transfer }
    });
  });

  static getDeadStockSuggestions = catchAsync(async (req, res) => {
    const data = await SupplyChainService.getDeadStockBalancingSuggestions(req.query.agedDays);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách gợi ý luân chuyển hàng tồn chậm thành công',
      data
    });
  });

  static executeDeadStockRebalance = catchAsync(async (req, res) => {
    const transfer = await SupplyChainService.executeDeadStockRebalance(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã tạo lệnh luân chuyển hàng tồn chậm liên chi nhánh',
      data: { transfer }
    });
  });

  static getDemandForecast = catchAsync(async (req, res) => {
    const { daysWindow, targetCoverDays } = req.query;
    const data = await HqBiService.getDemandForecast({ daysWindow, targetCoverDays });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy báo cáo dự báo nhu cầu nhập hàng thành công',
      data
    });
  });
}
