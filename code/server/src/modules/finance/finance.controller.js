import { HqFinanceService } from './hqFinance.service.js';
import { ApprovalService } from '../approvals/approval.service.js';
import { APPROVAL_LEVELS } from '../approvals/approval.model.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class FinanceController {
  static getConsolidatedPnl = catchAsync(async (req, res) => {
    const { startDate, endDate, branchId } = req.query;
    const data = await HqFinanceService.getConsolidatedPnl({ startDate, endDate, branchId });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy báo cáo tài chính hợp nhất & P&L toàn chuỗi thành công',
      data
    });
  });

  static getExpenses = catchAsync(async (req, res) => {
    const data = await HqFinanceService.getExpenses(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách chi phí vận hành chi nhánh thành công',
      data
    });
  });

  static createExpense = catchAsync(async (req, res) => {
    const data = await HqFinanceService.createExpense(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message:
        data.expense.status === 'PENDING_EXECUTIVE'
          ? 'Chi phí vượt hạn mức chi nhánh, đã tự động chuyển lên Phê duyệt Tối cao'
          : 'Ghi nhận chi phí vận hành thành công',
      data
    });
  });

  static reviewExpense = catchAsync(async (req, res) => {
    const expense = await HqFinanceService.reviewExpense(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: `Đã xử lý chi phí ${expense.expenseCode} (${expense.status})`,
      data: { expense }
    });
  });

  static getCommissionRules = catchAsync(async (req, res) => {
    const data = await HqFinanceService.getCommissionRules();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách quy tắc hoa hồng thành công',
      data
    });
  });

  static createCommissionRule = catchAsync(async (req, res) => {
    const rule = await HqFinanceService.createCommissionRule(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tạo quy tắc hoa hồng toàn chuỗi thành công',
      data: { rule }
    });
  });

  static toggleCommissionRule = catchAsync(async (req, res) => {
    const rule = await HqFinanceService.toggleCommissionRule(
      req.params.id,
      req.body.isActive,
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật trạng thái quy tắc hoa hồng thành công',
      data: { rule }
    });
  });

  static getCommissionReport = catchAsync(async (req, res) => {
    const { startDate, endDate, branchId } = req.query;
    const report = await HqFinanceService.calculateCommissionReport({
      startDate,
      endDate,
      branchId
    });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy báo cáo ước tính hoa hồng nhân sự toàn chuỗi thành công',
      data: {
        period: report.period,
        totalCommission: report.totalCommission,
        staffCommissions: report.staffCommissions
      }
    });
  });

  static getExecutiveApprovals = catchAsync(async (req, res) => {
    const data = await ApprovalService.getRequests(
      { ...req.query, approvalLevel: APPROVAL_LEVELS.EXECUTIVE },
      req.user
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách yêu cầu Phê duyệt Tối cao thành công',
      data
    });
  });
}
