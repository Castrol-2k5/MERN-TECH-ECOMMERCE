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
      devicePassword,
      powerStatus,
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
      devicePassword: devicePassword || '',
      powerStatus: powerStatus || 'Lên nguồn bình thường',
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

  /**
   * Bước 4: Kỹ thuật viên chẩn đoán lỗi & đưa ra phương án/báo giá
   */
  static async diagnoseTicket(ticketId, payload, currentUser) {
    const ticket = await WarrantyTicket.findById(ticketId);
    if (!ticket) {
      throw new AppError('Không tìm thấy phiếu bảo hành.', 404, 'WARRANTY_TICKET_NOT_FOUND');
    }

    const {
      technicianNotes,
      isUnderWarranty,
      partsDescription = '',
      partsCost = 0,
      laborCost = 0
    } = payload;

    const totalCost = isUnderWarranty ? 0 : Number(partsCost || 0) + Number(laborCost || 0);

    ticket.diagnosis = {
      technicianNotes,
      diagnosedAt: new Date(),
      diagnosedBy: currentUser?._id || currentUser?.id
    };

    ticket.quotation = {
      isUnderWarranty: Boolean(isUnderWarranty),
      partsDescription,
      partsCost: isUnderWarranty ? 0 : partsCost,
      laborCost: isUnderWarranty ? 0 : laborCost,
      totalCost
    };

    if (isUnderWarranty) {
      // Bảo hành chính hãng miễn phí -> Tự động duyệt sang REPAIRING
      ticket.customerApproval = {
        status: 'APPROVED',
        approvedVia: 'AUTO_UNDER_WARRANTY',
        note: 'Sản phẩm đủ điều kiện bảo hành chính hãng miễn phí.',
        decidedAt: new Date()
      };
      ticket.status = WARRANTY_STATUS.REPAIRING;
    } else {
      // Có tính phí sửa chữa -> Chờ khách duyệt
      ticket.customerApproval = {
        status: 'PENDING',
        approvedVia: 'NONE',
        note: '',
        decidedAt: null
      };
      ticket.status = WARRANTY_STATUS.QUOTATION_PENDING;
    }

    await ticket.save();

    return WarrantyTicket.findById(ticket._id)
      .populate('productId', 'name slug images brand')
      .populate('branchId', 'name branchCode')
      .populate('staffId', 'fullName email')
      .populate('diagnosis.diagnosedBy', 'fullName email')
      .lean();
  }

  /**
   * Bước 4 (Duyệt báo giá): Khách hàng hoặc Nhân viên ghi nhận Đồng ý / Từ chối
   */
  static async approveQuotation(idOrCode, payload, currentUser = null) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
    const query = isObjectId ? { _id: idOrCode } : { ticketCode: idOrCode.toUpperCase() };
    const ticket = await WarrantyTicket.findOne(query);
    if (!ticket) {
      throw new AppError('Không tìm thấy phiếu bảo hành.', 404, 'WARRANTY_TICKET_NOT_FOUND');
    }

    const { approved, approvedVia = 'PHONE', note = '', phone = '' } = payload;

    // Nếu khách tự duyệt trực tuyến (guest), kiểm tra số điện thoại
    if (!currentUser && phone) {
      const cleanPhone = phone.trim();
      const ticketPhone = (ticket.customerInfo?.phone || '').trim();
      if (!ticketPhone || cleanPhone !== ticketPhone) {
        throw new AppError('Số điện thoại xác nhận không khớp với thông tin trên phiếu bảo hành.', 403, 'PHONE_MISMATCH');
      }
    }

    if (approved) {
      ticket.customerApproval = {
        status: 'APPROVED',
        approvedVia: currentUser ? (approvedVia || 'PHONE') : 'ONLINE',
        note: note || 'Khách hàng đồng ý phương án và chi phí sửa chữa.',
        decidedAt: new Date()
      };
      ticket.status = WARRANTY_STATUS.REPAIRING;
    } else {
      ticket.customerApproval = {
        status: 'REJECTED',
        approvedVia: currentUser ? (approvedVia || 'PHONE') : 'ONLINE',
        note: note || 'Khách hàng từ chối phương án sửa chữa. Hoàn trả nguyên trạng thiết bị.',
        decidedAt: new Date()
      };
      // Khi từ chối, chuyển sang REPAIR_REJECTED và chuẩn bị máy trả khách
      ticket.status = WARRANTY_STATUS.REPAIR_REJECTED;
    }

    await ticket.save();

    return WarrantyTicket.findById(ticket._id)
      .populate('productId', 'name slug images brand')
      .populate('branchId', 'name branchCode')
      .populate('staffId', 'fullName email')
      .lean();
  }

  /**
   * Bước 5: Kỹ thuật viên hoàn tất sửa chữa -> Chuyển sang READY_FOR_PICKUP
   */
  static async completeRepair(ticketId, payload, currentUser) {
    const ticket = await WarrantyTicket.findById(ticketId);
    if (!ticket) {
      throw new AppError('Không tìm thấy phiếu bảo hành.', 404, 'WARRANTY_TICKET_NOT_FOUND');
    }

    const { repairNotes, partsReplaced = [] } = payload;

    ticket.resolution = {
      repairNotes,
      partsReplaced: Array.isArray(partsReplaced) ? partsReplaced : [],
      repairedBy: currentUser?._id || currentUser?.id,
      completedAt: new Date()
    };
    ticket.status = WARRANTY_STATUS.READY_FOR_PICKUP;

    await ticket.save();

    return WarrantyTicket.findById(ticket._id)
      .populate('productId', 'name slug images brand')
      .populate('branchId', 'name branchCode')
      .populate('staffId', 'fullName email')
      .populate('resolution.repairedBy', 'fullName email')
      .lean();
  }

  /**
   * Bước 5 & 6: Bàn giao máy cho khách tại quầy -> Thu tiền nếu có -> Đóng phiếu RETURNED
   */
  static async handoverTicket(ticketId, payload, currentUser) {
    const ticket = await WarrantyTicket.findById(ticketId);
    if (!ticket) {
      throw new AppError('Không tìm thấy phiếu bảo hành.', 404, 'WARRANTY_TICKET_NOT_FOUND');
    }

    const {
      paymentMethod = 'NONE',
      amountPaid = 0,
      customerNotes = ''
    } = payload;

    ticket.handover = {
      returnedAt: new Date(),
      staffId: currentUser?._id || currentUser?.id,
      paymentMethod,
      amountPaid: Number(amountPaid || 0),
      customerNotes
    };
    ticket.status = WARRANTY_STATUS.RETURNED;

    await ticket.save();

    // Khôi phục Serial về trạng thái SOLD
    await Serial.updateOne(
      { serialNumber: ticket.serialNumber },
      { status: SERIAL_STATUS.SOLD }
    );

    return WarrantyTicket.findById(ticket._id)
      .populate('productId', 'name slug images brand')
      .populate('branchId', 'name branchCode')
      .populate('staffId', 'fullName email')
      .populate('handover.staffId', 'fullName email')
      .lean();
  }

  /**
   * Tra cứu công khai phiếu bảo hành bằng ticketCode + phone
   */
  static async trackTicketPublic(ticketCode, phone) {
    const cleanCode = ticketCode.trim().toUpperCase();
    const cleanPhone = phone.trim();

    const ticket = await WarrantyTicket.findOne({ ticketCode: cleanCode })
      .populate('productId', 'name slug images brand skus')
      .populate('branchId', 'name branchCode address phone')
      .populate('staffId', 'fullName email')
      .populate('diagnosis.diagnosedBy', 'fullName')
      .populate('resolution.repairedBy', 'fullName')
      .populate('handover.staffId', 'fullName')
      .lean();

    if (!ticket) {
      throw new AppError('Không tìm thấy phiếu bảo hành với mã được cung cấp.', 404, 'TICKET_NOT_FOUND');
    }

    const ticketPhone = (ticket.customerInfo?.phone || '').trim();
    if (ticketPhone && cleanPhone !== ticketPhone && !ticketPhone.endsWith(cleanPhone)) {
      throw new AppError('Số điện thoại xác thực không khớp với phiếu tiếp nhận.', 403, 'PHONE_MISMATCH');
    }

    return ticket;
  }
}
