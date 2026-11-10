import { AnalyticsService } from './analytics.service.js';
import { StaffAnalyticsService } from './staffAnalytics.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class AnalyticsController {
  static getOverview = catchAsync(async (req, res) => {
    const { branchId, startDate, endDate } = req.query;
    const overview = await AnalyticsService.getOverview({ branchId, startDate, endDate });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy dữ liệu tổng quan phân tích kinh doanh thành công',
      data: overview
    });
  });

  static getMyPerformance = catchAsync(async (req, res) => {
    const { range } = req.query;
    const performance = await StaffAnalyticsService.getMyPerformance(req.user.id, range);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy báo cáo doanh số & hiệu suất cá nhân thành công',
      data: performance
    });
  });
}
