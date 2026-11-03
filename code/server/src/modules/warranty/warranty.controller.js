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

  static updateTicketStatus = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.updateTicketStatus(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật trạng thái phiếu bảo hành thành công',
      data: ticket
    });
  });

  static diagnoseTicket = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.diagnoseTicket(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lưu kết quả chẩn đoán và báo giá thành công',
      data: ticket
    });
  });

  static approveQuotation = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.approveQuotation(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Ghi nhận xác nhận phương án sửa chữa thành công',
      data: ticket
    });
  });

  static completeRepair = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.completeRepair(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Hoàn tất sửa chữa và chuyển trạng thái sẵn sàng trả máy',
      data: ticket
    });
  });

  static handoverTicket = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.handoverTicket(req.params.id, req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Bàn giao thiết bị cho khách hàng thành công',
      data: ticket
    });
  });

  static trackTicketPublic = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.trackTicketPublic(req.query.ticketCode, req.query.phone);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tra cứu phiếu bảo hành thành công',
      data: ticket
    });
  });

  static customerApprovePublic = catchAsync(async (req, res) => {
    const ticket = await WarrantyService.approveQuotation(req.params.ticketCode, req.body, null);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Khách hàng xác nhận phương án sửa chữa thành công',
      data: ticket
    });
  });
}
