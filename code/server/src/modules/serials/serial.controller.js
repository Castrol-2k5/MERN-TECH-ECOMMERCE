import { SerialService } from './serial.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class SerialController {
  static importSerials = catchAsync(async (req, res) => {
    const result = await SerialService.importSerials(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Nhập danh sách Serial/IMEI vào kho thành công',
      data: result
    });
  });

  static scanSerial = catchAsync(async (req, res) => {
    const { serialNumber } = req.params;
    const result = await SerialService.scanSerial(serialNumber, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Quét mã Serial/IMEI thành công',
      data: result
    });
  });

  static verifySerial = catchAsync(async (req, res) => {
    const { serialNumber } = req.params;
    const result = await SerialService.verifySerial(serialNumber);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tra cứu thông tin bảo hành thành công',
      data: result
    });
  });
}
