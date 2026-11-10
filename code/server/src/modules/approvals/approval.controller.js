import { ApprovalService } from './approval.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class ApprovalController {
  static createRequest = catchAsync(async (req, res) => {
    const requestDoc = await ApprovalService.createRequest(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã gửi yêu cầu phê duyệt tới Quản lý chi nhánh',
      data: { request: requestDoc }
    });
  });

  static getRequests = catchAsync(async (req, res) => {
    const result = await ApprovalService.getRequests(req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách yêu cầu phê duyệt thành công',
      data: result
    });
  });

  static getAlerts = catchAsync(async (req, res) => {
    const targetBranchId = req.scopedBranchId || req.query.branchId || null;
    const data = await ApprovalService.getAlerts(targetBranchId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thông báo chờ duyệt thành công',
      data
    });
  });

  static approveRequest = catchAsync(async (req, res) => {
    const requestDoc = await ApprovalService.approveRequest(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã phê duyệt và tự động thực thi nghiệp vụ thành công',
      data: { request: requestDoc }
    });
  });

  static rejectRequest = catchAsync(async (req, res) => {
    const requestDoc = await ApprovalService.rejectRequest(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã từ chối yêu cầu phê duyệt',
      data: { request: requestDoc }
    });
  });
}
