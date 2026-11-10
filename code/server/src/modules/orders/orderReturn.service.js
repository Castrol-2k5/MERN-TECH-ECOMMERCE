import crypto from 'crypto';
import mongoose from 'mongoose';
import { Order, ORDER_STATUS, PAYMENT_STATUS } from './order.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';
import { PosShiftService } from '../shifts/posShift.service.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

export class OrderReturnService {
  /**
   * Xử lý Trả hàng & Hoàn tiền tại quầy (UC-ORD-12)
   * Tự động kiểm tra Serial, hoàn kho (nếu GOOD) hoặc chuyển Serial sang DEFECTIVE (nếu hàng lỗi),
   * cập nhật trạng thái đơn hàng, cập nhật cashRefunds trong Ca POS và ghi Audit Log.
   */
  static async processReturn(orderId, payload, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError('Mã đơn hàng không hợp lệ.', 400, 'INVALID_ORDER_ID');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần trả.', 404, 'ORDER_NOT_FOUND');
    }

    // 1. Bảo mật chi nhánh (Cross-branch isolation)
    if (
      currentUser &&
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      currentUser.branchId &&
      order.branchId.toString() !== currentUser.branchId.toString()
    ) {
      throw new AppError(
        'Bạn không có quyền xử lý trả hàng cho đơn thuộc chi nhánh khác.',
        403,
        'CROSS_BRANCH_ACCESS_DENIED'
      );
    }

    // 2. Chỉ cho phép trả hàng từ đơn COMPLETED hoặc PARTIALLY_RETURNED
    if (![ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED].includes(order.orderStatus)) {
      throw new AppError(
        `Chỉ có thể trả hàng cho đơn đã hoàn tất (COMPLETED). Trạng thái hiện tại: ${order.orderStatus}.`,
        400,
        'INVALID_ORDER_STATUS'
      );
    }

    const previousStatus = order.orderStatus;
    const previousRefunded = Number(order.refundedAmount || 0);
    const requestedItems = payload.items || [];

    // 3. Validate toàn bộ items & serials trước khi sửa dữ liệu (All-or-nothing pre-flight check)
    const validatedOperations = [];
    const seenOrderItemIds = new Set();
    let totalRefundAmount = 0;

    for (const reqItem of requestedItems) {
      const orderItem = (order.items || []).find((it) => {
        if (reqItem.orderItemId) {
          return it._id.toString() === reqItem.orderItemId.toString();
        }
        return it.productSkuId.toString() === reqItem.productSkuId.toString();
      });

      if (!orderItem) {
        throw new AppError('Sản phẩm yêu cầu trả không tồn tại trong đơn hàng này.', 404, 'ORDER_ITEM_NOT_FOUND');
      }

      const itemKey = orderItem._id.toString();
      if (seenOrderItemIds.has(itemKey)) {
        throw new AppError('Không được gửi trùng lặp cùng một sản phẩm trong một lần trả hàng.', 400, 'DUPLICATE_RETURN_ITEM');
      }
      seenOrderItemIds.add(itemKey);

      const qtyToReturn = Number(reqItem.quantity);
      const alreadyReturnedQty = Number(orderItem.returnedQuantity || 0);
      const remainingQty = Number(orderItem.quantity) - alreadyReturnedQty;

      if (qtyToReturn <= 0 || qtyToReturn > remainingQty) {
        throw new AppError(
          `Số lượng trả cho '${orderItem.productName}' (${qtyToReturn}) vượt quá số lượng còn lại có thể trả (${remainingQty}).`,
          400,
          'RETURN_QUANTITY_EXCEEDED'
        );
      }

      const assignedList = Array.isArray(orderItem.serialsAssigned) ? orderItem.serialsAssigned : [];
      const alreadyReturnedSerialSet = new Set(
        (orderItem.returnedSerials || []).map((s) => s.trim().toUpperCase())
      );
      const activeSerialSet = new Set(
        assignedList.map((s) => s.trim().toUpperCase()).filter((s) => !alreadyReturnedSerialSet.has(s))
      );

      let cleanSerials = [];
      if (activeSerialSet.size > 0) {
        cleanSerials = (reqItem.serialsReturned || []).map((s) => s.trim().toUpperCase()).filter(Boolean);

        if (cleanSerials.length !== qtyToReturn) {
          throw new AppError(
            `Sản phẩm '${orderItem.productName}' quản lý theo Serial. Vui lòng chọn đúng ${qtyToReturn} mã Serial cần trả.`,
            400,
            'RETURN_SERIAL_COUNT_MISMATCH'
          );
        }

        if (new Set(cleanSerials).size !== cleanSerials.length) {
          throw new AppError('Danh sách mã Serial trả lại chứa mã trùng lặp.', 400, 'DUPLICATE_RETURN_SERIAL');
        }

        for (const sn of cleanSerials) {
          if (!activeSerialSet.has(sn)) {
            throw new AppError(
              `Mã Serial '${sn}' không thuộc đơn hàng này hoặc đã được hoàn trả trước đó.`,
              400,
              'INVALID_RETURN_SERIAL'
            );
          }
        }

        const dbSerials = await Serial.find({ serialNumber: { $in: cleanSerials } }).lean();
        if (dbSerials.length !== cleanSerials.length) {
          throw new AppError('Một số mã Serial không tồn tại trong kho dữ liệu.', 404, 'SERIAL_NOT_FOUND');
        }

        for (const dbSer of dbSerials) {
          if (dbSer.status !== SERIAL_STATUS.SOLD) {
            throw new AppError(
              `Mã Serial '${dbSer.serialNumber}' đang ở trạng thái ${dbSer.status} (không thể hoàn trả trực tiếp).`,
              400,
              'SERIAL_NOT_ELIGIBLE_FOR_RETURN'
            );
          }
        }
      }

      const subtotalRefund = Number(orderItem.unitPrice || 0) * qtyToReturn;
      totalRefundAmount += subtotalRefund;

      validatedOperations.push({
        orderItem,
        qtyToReturn,
        condition: reqItem.condition || 'GOOD',
        cleanSerials,
        subtotalRefund
      });
    }

    // 4. Thực thi hoàn kho & cập nhật trạng thái Serial
    const historyItems = [];
    for (const op of validatedOperations) {
      const { orderItem, qtyToReturn, condition, cleanSerials, subtotalRefund } = op;

      orderItem.returnedQuantity = Number(orderItem.returnedQuantity || 0) + qtyToReturn;
      if (cleanSerials.length > 0) {
        orderItem.returnedSerials = [...(orderItem.returnedSerials || []), ...cleanSerials];
      }

      if (condition === 'GOOD') {
        await BranchInventory.findOneAndUpdate(
          { branchId: order.branchId, productSkuId: orderItem.productSkuId },
          {
            $inc: { quantity: qtyToReturn },
            $setOnInsert: { productId: orderItem.productId }
          },
          { upsert: true }
        );

        if (cleanSerials.length > 0) {
          await Serial.updateMany(
            { serialNumber: { $in: cleanSerials } },
            {
              $set: {
                status: SERIAL_STATUS.IN_STOCK,
                branchId: order.branchId,
                orderId: null,
                orderItemId: null,
                soldAt: null,
                warrantyEndDate: null
              }
            }
          );
        }
      } else {
        // DEFECTIVE: Không cộng lại tồn kho bán ngay để tránh bán nhầm hàng lỗi cho khách khác
        if (cleanSerials.length > 0) {
          await Serial.updateMany(
            { serialNumber: { $in: cleanSerials } },
            {
              $set: {
                status: SERIAL_STATUS.DEFECTIVE,
                branchId: order.branchId,
                orderId: null,
                orderItemId: null
              }
            }
          );
        }
      }

      historyItems.push({
        orderItemId: orderItem._id,
        productSkuId: orderItem.productSkuId,
        sku: orderItem.sku,
        productName: orderItem.productName,
        quantity: qtyToReturn,
        unitPrice: orderItem.unitPrice,
        subtotalRefund,
        condition,
        serialsReturned: cleanSerials
      });
    }

    // 5. Cập nhật trạng thái Order & lưu lịch sử trả hàng
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const returnCode = `RTN-${dateStr}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const refundMethod = payload.refundMethod || 'CASH';
    const returnRecord = {
      returnCode,
      returnedAt: now,
      processedById: currentUser?.id || currentUser?._id || null,
      processedByName: currentUser?.fullName || 'Nhân sự TechOne',
      refundMethod,
      refundAmount: totalRefundAmount,
      reason: payload.reason || 'Khách yêu cầu trả hàng tại quầy',
      items: historyItems
    };

    order.refundedAmount = previousRefunded + totalRefundAmount;
    const isFullyReturned = (order.items || []).every(
      (it) => Number(it.returnedQuantity || 0) >= Number(it.quantity || 1)
    );

    order.orderStatus = isFullyReturned ? ORDER_STATUS.RETURNED : ORDER_STATUS.PARTIALLY_RETURNED;
    if (isFullyReturned) {
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    }
    order.returnHistory = [...(order.returnHistory || []), returnRecord];

    await order.save();

    // 6. Ghi nhận giảm quỹ tiền mặt vào Ca POS đang mở (nếu hoàn tiền mặt)
    let shiftAdjusted = false;
    if (refundMethod === 'CASH') {
      try {
        const updatedShift = await PosShiftService.recordCashRefund(
          order.branchId,
          currentUser?.id || currentUser?._id,
          totalRefundAmount
        );
        shiftAdjusted = Boolean(updatedShift);
      } catch (err) {
        console.warn('Could not record cash refund to POS shift:', err.message);
      }
    }

    // 7. Ghi Audit Log
    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.ORDER_RETURN,
      target: {
        model: 'Order',
        entityId: order._id,
        code: order.orderCode,
        name: `Trả hàng đơn ${order.orderCode} (${returnCode})`
      },
      changes: {
        before: { orderStatus: previousStatus, refundedAmount: previousRefunded },
        after: { orderStatus: order.orderStatus, refundedAmount: order.refundedAmount, returnCode },
        diff: { refundAmount: totalRefundAmount }
      },
      context: {
        reason: payload.reason,
        notes: `Hoàn ${totalRefundAmount.toLocaleString('vi-VN')} ₫ (${refundMethod}) | ${historyItems.length} mặt hàng`
      }
    });

    const populated = await Order.findById(order._id)
      .populate('branchId', 'name branchCode address phone')
      .populate('staffId', 'fullName email')
      .populate('customerId', 'fullName email phone')
      .lean();

    return {
      order: populated,
      returnRecord,
      shiftAdjusted
    };
  }
}

export default OrderReturnService;
