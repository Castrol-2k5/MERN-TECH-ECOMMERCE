import { AnalyticsService } from './analytics.service.js';
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
}
