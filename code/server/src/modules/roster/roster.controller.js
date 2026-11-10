import { RosterService } from './roster.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class RosterController {
  static getWeeklyRoster = catchAsync(async (req, res) => {
    const schedules = await RosterService.getWeeklyRoster(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy lịch phân ca chi nhánh thành công',
      data: { schedules }
    });
  });

  static assignShift = catchAsync(async (req, res) => {
    const schedule = await RosterService.assignShift(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã xếp ca làm việc cho nhân viên thành công',
      data: { schedule }
    });
  });

  static removeShift = catchAsync(async (req, res) => {
    const result = await RosterService.removeShift(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã xóa lịch ca thành công',
      data: result
    });
  });

  static checkInShift = catchAsync(async (req, res) => {
    const schedule = await RosterService.checkInShift(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Check-in vào ca làm việc thành công',
      data: { schedule }
    });
  });

  static checkOutShift = catchAsync(async (req, res) => {
    const schedule = await RosterService.checkOutShift(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Check-out kết ca thành công',
      data: { schedule }
    });
  });

  static requestSwap = catchAsync(async (req, res) => {
    const schedule = await RosterService.requestSwap(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã gửi yêu cầu đổi ca tới Quản lý chi nhánh',
      data: { schedule }
    });
  });

  static reviewSwap = catchAsync(async (req, res) => {
    const schedule = await RosterService.reviewSwap(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã xử lý yêu cầu đổi ca thành công',
      data: { schedule }
    });
  });
}
