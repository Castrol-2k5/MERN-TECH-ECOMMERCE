import crypto from 'crypto';
import { WarrantyTicket, WARRANTY_STATUS } from './warranty.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { Order } from '../orders/order.model.js';
import { User, USER_ROLES } from '../users/user.model.js';
import { AppError } from '../../utils/appError.js';

export class WarrantyService {
  /**
   * Sinh mã phiếu tiếp nhận bảo hành duy nhất dạng RMA-YYYYMMDD-XXXX
   */
  static generateTicketCode() {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `RMA-${todayStr}-${randomHex}`;
  }

  /**
   * Tạo phiếu tiếp nhận bảo hành thiết bị
   * Quyền: STAFF, BRANCH_MANAGER, SUPER_ADMIN
   */
  static async createTicket(payload, currentUser) {
    const {
      serialNumber,
      issueDescription,
      customerInfo,
      appearanceCondition,
      accessories,
      estimatedReturnDate,
      notes
    } = payload;
    const cleanSerial = serialNumber.trim().toUpperCase();

    // 1. Kiểm tra Serial/IMEI có tồn tại không
    const serial = await Serial.findOne({ serialNumber: cleanSerial });
    if (!serial) {
      throw new AppError('Không tìm thấy mã Serial/IMEI trong hệ thống.', 404, 'SERIAL_NOT_FOUND');
    }

    // 2. Kiểm tra Serial đã được bán chưa
    if (serial.status !== SERIAL_STATUS.SOLD && serial.status !== SERIAL_STATUS.WARRANTY) {
      throw new AppError(
        `Mã Serial/IMEI chưa được xuất bán (Hiện tại: ${serial.status}), không đủ điều kiện tiếp nhận bảo hành.`,
        400,
        'SERIAL_NOT_SOLD'
      );
    }

    // 3. Sinh mã ticketCode không trùng lặp
    let ticketCode;
    let isCodeUnique = false;
    while (!isCodeUnique) {
      ticketCode = this.generateTicketCode();
      const existing = await WarrantyTicket.findOne({ ticketCode }).lean();
      if (!existing) isCodeUnique = true;
    }

    // 4. Xác định chi nhánh tiếp nhận
    const branchId = currentUser.branchId || currentUser.scopedBranchId || payload.branchId || serial.branchId;

    // 5. Xác định khách hàng (từ số điện thoại gửi lên hoặc từ đơn hàng gốc của Serial)
    let customerId = null;
    const phone = customerInfo?.phone?.trim();
    if (phone) {
      const foundUser = await User.findOne({ phone }).lean();
      if (foundUser) customerId = foundUser._id;
    }

    if (!customerId && serial.orderId) {
      const order = await Order.findById(serial.orderId).lean();
      if (order?.customerId) customerId = order.customerId;
    }

    // 6. Tạo bản ghi WarrantyTicket với trạng thái RECEIVED
    const ticket = await WarrantyTicket.create({
      ticketCode,
      serialNumber: cleanSerial,
      productId: serial.productId,
      customerId,
      customerInfo: {
        fullName: customerInfo?.fullName || '',
        phone: customerInfo?.phone || '',
        address: customerInfo?.address || ''
      },
      branchId,
      staffId: currentUser._id || currentUser.id,
      issueDescription,
      appearanceCondition: appearanceCondition || '',
      accessories: Array.isArray(accessories) ? accessories : [],
      estimatedReturnDate: estimatedReturnDate || '',
      status: WARRANTY_STATUS.RECEIVED,
      notes: notes || ''
    });

    // 7. Chuyển trạng thái Serial sang WARRANTY
    await Serial.updateOne({ _id: serial._id }, { status: SERIAL_STATUS.WARRANTY });

    const populatedTicket = await WarrantyTicket.findById(ticket._id)
      .populate('productId', 'name slug images brand')
      .populate('branchId', 'name branchCode')
      .populate('staffId', 'fullName email')
      .lean();

    return populatedTicket || ticket;
  }

  /**
   * Tra cứu danh sách phiếu bảo hành có lọc và phân trang
   */
  static async getTickets(query = {}, currentUser) {
    const filter = {};
    if (currentUser && currentUser.role !== USER_ROLES.SUPER_ADMIN && currentUser.branchId) {
      filter.branchId = currentUser.branchId;
    } else if (query.branchId) {
      filter.branchId = query.branchId;
    }
    if (query.status) filter.status = query.status;
    if (query.serialNumber) filter.serialNumber = query.serialNumber.trim().toUpperCase();
    if (query.ticketCode) filter.ticketCode = query.ticketCode.trim().toUpperCase();

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, tickets] = await Promise.all([
      WarrantyTicket.countDocuments(filter),
      WarrantyTicket.find(filter)
        .populate('productId', 'name slug images brand')
        .populate('branchId', 'name branchCode')
        .populate('staffId', 'fullName email')
        .populate('customerId', 'fullName phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Cập nhật trạng thái phiếu bảo hành (RECEIVED -> PROCESSING -> COMPLETED -> RETURNED)
   * Khi chuyển sang RETURNED, Serial của thiết bị tự động khôi phục về trạng thái SOLD
   */
  static async updateTicketStatus(ticketId, payload, currentUser) {
    const ticket = await WarrantyTicket.findById(ticketId);
    if (!ticket) {
      throw new AppError('Không tìm thấy phiếu bảo hành yêu cầu.', 404, 'WARRANTY_TICKET_NOT_FOUND');
    }

    if (
      currentUser &&
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      currentUser.branchId &&
      ticket.branchId.toString() !== currentUser.branchId.toString()
    ) {
      throw new AppError(
        'Bạn không có quyền cập nhật phiếu bảo hành của chi nhánh khác.',
        403,
        'CROSS_BRANCH_ACCESS_DENIED'
      );
    }

    ticket.status = payload.status;
    if (payload.notes !== undefined) {
      ticket.notes = payload.notes;
    }
    await ticket.save();

    if (payload.status === WARRANTY_STATUS.RETURNED) {
      await Serial.updateOne(
        { serialNumber: ticket.serialNumber },
        { status: SERIAL_STATUS.SOLD }
      );
    } else {
      await Serial.updateOne(
        { serialNumber: ticket.serialNumber },
        { status: SERIAL_STATUS.WARRANTY }
      );
    }

    const populated = await WarrantyTicket.findById(ticket._id)
      .populate('productId', 'name slug images brand')
      .populate('branchId', 'name branchCode')
      .populate('staffId', 'fullName email')
      .lean();

    return populated;
  }
}
