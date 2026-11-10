import { ComplaintService } from './complaint.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class ComplaintController {
  static createComplaint = catchAsync(async (req, res) => {
    const complaint = await ComplaintService.createComplaint(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã tiếp nhận phiếu khiếu nại khách hàng',
      data: { complaint }
    });
  });

  static getComplaints = catchAsync(async (req, res) => {
    const complaints = await ComplaintService.getComplaints(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách khiếu nại thành công',
      data: { complaints }
    });
  });

  static updateComplaint = catchAsync(async (req, res) => {
    const complaint = await ComplaintService.updateComplaint(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật xử lý khiếu nại thành công',
      data: { complaint }
    });
  });

  static getWarrantyWatchlist = catchAsync(async (req, res) => {
    const branchId = req.scopedBranchId || req.query.branchId || null;
    const tickets = await ComplaintService.getWarrantyWatchlist(branchId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách phiếu bảo hành cần theo dõi thành công',
      data: { tickets }
    });
  });
}
