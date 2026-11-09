import { AuditLogService } from './auditLog.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class AuditLogController {
  static getLogs = catchAsync(async (req, res) => {
    const result = await AuditLogService.getLogs(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách nhật ký kiểm toán thành công',
      data: result
    });
  });

  static getStats = catchAsync(async (req, res) => {
    const stats = await AuditLogService.getStats();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thống kê kiểm toán thành công',
      data: stats
    });
  });

  static getLogById = catchAsync(async (req, res) => {
    const log = await AuditLogService.getLogById(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy chi tiết nhật ký kiểm toán thành công',
      data: log
    });
  });

  static getEntityTimeline = catchAsync(async (req, res) => {
    const { model, entityId } = req.params;
    const timeline = await AuditLogService.getEntityTimeline(model, entityId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy dòng thời gian truy vết thực thể thành công',
      data: { timeline }
    });
  });
}

export default AuditLogController;
