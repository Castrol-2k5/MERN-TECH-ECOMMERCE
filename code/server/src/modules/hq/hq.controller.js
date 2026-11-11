import { HqCommandService } from './hqCommand.service.js';
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
}
