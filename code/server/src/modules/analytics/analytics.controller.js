import { AnalyticsService } from './analytics.service.js';
import { StaffAnalyticsService } from './staffAnalytics.service.js';
import { BranchStrategyAnalyticsService } from './branchStrategyAnalytics.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class AnalyticsController {
  static getOverview = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const branchId = req.scopedBranchId || req.query.branchId;
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

  static getBranchStaffKpi = catchAsync(async (req, res) => {
    const targetBranchId = req.scopedBranchId || req.query.branchId || null;
    const { range } = req.query;
    const report = await StaffAnalyticsService.getBranchStaffKpi(targetBranchId, range);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy bảng xếp hạng KPI nhân sự chi nhánh thành công',
      data: report
    });
  });

  static getBranchStrategy = catchAsync(async (req, res) => {
    const targetBranchId = req.scopedBranchId || req.query.branchId || null;
    const { days } = req.query;
    const strategy = await BranchStrategyAnalyticsService.getBranchStrategy(targetBranchId, days);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy báo cáo chiến lược chi nhánh thành công',
      data: strategy
    });
  });
}
