import { WarrantyService } from './warranty.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class WarrantyController {
  static createTicket = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.createTicket(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tiếp nhận thiết bị bảo hành thành công',
      data: ticket
    });
  });

  static getTickets = catchAsync(async (req, res) => {
    const result = await WarrantyService.getTickets(req.query, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách phiếu bảo hành thành công',
      data: result.tickets,
      meta: { pagination: result.pagination }
    });
  });
}
