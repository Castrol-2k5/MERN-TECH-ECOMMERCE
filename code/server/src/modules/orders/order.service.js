import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order, ORDER_TYPES, PAYMENT_STATUS, ORDER_STATUS, PAYMENT_METHODS } from './order.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { Product } from '../products/product.model.js';
import { Branch } from '../branches/branch.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';

export class OrderService {
  /**
   * Sinh mã đơn hàng chuẩn format: ORD-YYYYMMDD-XXXX
   */
  static generateOrderCode() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();

    return `ORD-${year}${month}${day}-${randomSuffix}`;
  }

  /**
   * Luồng thanh toán tại quầy Web POS (POS Checkout)
   * Quyền: STAFF, BRANCH_MANAGER, SUPER_ADMIN
   * Thực thi: Xác thực Serial -> Trừ tồn kho Atomic -> Chuyển Serial sang SOLD & kích hoạt BH -> Tạo Order
   */
  static async createPosOrder(payload, currentUser) {
    let branchId = payload.branchId;

    if (currentUser.role === USER_ROLES.STAFF || currentUser.role === USER_ROLES.BRANCH_MANAGER) {
      if (!currentUser.branchId) {
        throw new AppError('Nhân sự chưa được gắn với chi nhánh nào.', 403, 'BRANCH_NOT_ASSIGNED');
      }
      branchId = currentUser.branchId.toString();
    }

    if (!branchId) {
      throw new AppError('Chi nhánh bán hàng (branchId) là bắt buộc.', 400, 'VALIDATION_ERROR');
    }

    // Xác thực chi nhánh tồn tại
    const branch = await Branch.findById(branchId).lean();
    if (!branch || !branch.isActive) {
      throw new AppError('Chi nhánh không tồn tại hoặc đã tạm dừng hoạt động.', 404, 'BRANCH_NOT_FOUND');
    }

    const enrichedItems = [];
    const allAssignedSerials = [];
    let calculatedTotal = 0;

    // 1. Kiểm tra tính hợp lệ của từng Item và Serial/IMEI trước khi trừ kho
    for (const item of payload.items) {
      const product = await Product.findById(item.productId).lean();
      if (!product || !product.isActive) {
        throw new AppError('Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.', 404, 'PRODUCT_NOT_FOUND');
      }

      const sku = product.skus?.find((s) => s._id.toString() === item.productSkuId.toString());
      if (!sku || !sku.isActive) {
        throw new AppError('Biến thể SKU không tồn tại hoặc đã ngừng kinh doanh.', 400, 'SKU_NOT_FOUND');
      }

      const unitPrice = sku.salePrice > 0 ? sku.salePrice : sku.price;
      const subtotal = unitPrice * item.quantity;
      calculatedTotal += subtotal;

      const cleanSerials = (item.serialsAssigned || []).map((s) => s.trim().toUpperCase());

      if (cleanSerials.length > 0) {
        // Kiểm tra trùng lặp nội bộ trong danh sách serial
        if (new Set(cleanSerials).size !== cleanSerials.length) {
          throw new AppError('Danh sách Serial/IMEI chứa mã trùng lặp.', 400, 'VALIDATION_ERROR');
        }

        // Truy vấn collection serials kiểm tra tính khả dụng
        const foundSerials = await Serial.find({ serialNumber: { $in: cleanSerials } }).lean();

        if (foundSerials.length !== cleanSerials.length) {
          throw new AppError('Một số mã Serial/IMEI không tồn tại trên hệ thống.', 400, 'SERIAL_NOT_FOUND');
        }

        for (const s of foundSerials) {
          if (s.status !== SERIAL_STATUS.IN_STOCK) {
            throw new AppError(
              `Mã Serial/IMEI '${s.serialNumber}' không ở trạng thái khả dụng để bán (Hiện tại: ${s.status}).`,
              400,
              'INVALID_SERIAL_STATUS'
            );
          }

          if (s.branchId.toString() !== branchId.toString()) {
            throw new AppError(
              `Mã Serial/IMEI '${s.serialNumber}' thuộc chi nhánh khác, không được phép xuất bán tại quầy này.`,
              400,
              'CROSS_BRANCH_ACCESS_DENIED'
            );
          }
        }

        allAssignedSerials.push(...cleanSerials);
      }

      enrichedItems.push({
        productId: product._id,
        productSkuId: sku._id,
        productName: product.name,
        sku: sku.sku,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        serialsAssigned: cleanSerials
      });
    }

    // 2. Trừ tồn kho Atomic cho toàn bộ Items (Chống Race Condition & Overselling)
    const deductedItems = [];
    try {
      for (const item of enrichedItems) {
        const updateRes = await BranchInventory.updateOne(
          {
            branchId,
            productSkuId: item.productSkuId,
            quantity: { $gte: item.quantity }
          },
          {
            $inc: { quantity: -item.quantity }
          }
        );

        if (updateRes.modifiedCount === 0) {
          throw new AppError(
            `Sản phẩm '${item.productName}' (${item.sku}) không đủ số lượng tồn kho tại chi nhánh.`,
            409,
            'PRODUCT_OUT_OF_STOCK'
          );
        }

        deductedItems.push({ branchId, productSkuId: item.productSkuId, quantity: item.quantity });
      }
    } catch (err) {
      // Rollback hoàn trả lại số lượng nếu có 1 sản phẩm bị thiếu hàng
      for (const d of deductedItems) {
        await BranchInventory.updateOne(
          { branchId: d.branchId, productSkuId: d.productSkuId },
          { $inc: { quantity: d.quantity } }
        );
      }
      throw err;
    }

    // 3. Khởi tạo mã đơn và tạo bản ghi Order
    let orderCode;
    let isCodeUnique = false;
    while (!isCodeUnique) {
      orderCode = this.generateOrderCode();
      const existing = await Order.findOne({ orderCode }).lean();
      if (!existing) isCodeUnique = true;
    }

    const order = await Order.create({
      orderCode,
      orderType: ORDER_TYPES.POS_STORE,
      branchId,
      staffId: currentUser.id || currentUser._id,
      customerId: null,
      customerInfo: payload.customerInfo || {},
      items: enrichedItems,
      totalAmount: calculatedTotal,
      paymentMethod: payload.paymentMethod || PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED
    });

    // 4. Cập nhật vòng đời Serial sang SOLD và kích hoạt bảo hành 12 tháng
    if (allAssignedSerials.length > 0) {
      const now = new Date();
      const warrantyEndDate = new Date(now);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);

      await Serial.updateMany(
        { serialNumber: { $in: allAssignedSerials } },
        {
          $set: {
            status: SERIAL_STATUS.SOLD,
            soldAt: now,
            warrantyEndDate,
            orderId: order._id
          }
        }
      );
    }

    return order;
  }

  /**
   * Luồng Đặt hàng B2C trực tuyến (B2C Checkout)
   * Quyền: CUSTOMER hoặc Khách vãng lai
   * Thực thi: Atomic Virtual Holding (giữ tồn kho) -> Khởi tạo Order PENDING
   */
  static async createB2cOrder(payload, currentUser) {
    const { branchId, items, shippingAddress, paymentMethod } = payload;

    const branch = await Branch.findById(branchId).lean();
    if (!branch || !branch.isActive) {
      throw new AppError('Chi nhánh nhận đơn không tồn tại hoặc đã tạm dừng hoạt động.', 404, 'BRANCH_NOT_FOUND');
    }

    const enrichedItems = [];
    let calculatedTotal = 0;

    // Trừ tồn kho trước (Atomic Reservation / Virtual Holding)
    const deductedItems = [];
    try {
      for (const item of items) {
        const product = await Product.findById(item.productId).lean();
        if (!product || !product.isActive) {
          throw new AppError('Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.', 404, 'PRODUCT_NOT_FOUND');
        }

        const sku = product.skus?.find((s) => s._id.toString() === item.productSkuId.toString());
        if (!sku || !sku.isActive) {
          throw new AppError('Biến thể SKU không tồn tại hoặc đã ngừng kinh doanh.', 400, 'SKU_NOT_FOUND');
        }

        const unitPrice = sku.salePrice > 0 ? sku.salePrice : sku.price;
        const subtotal = unitPrice * item.quantity;
        calculatedTotal += subtotal;

        const updateRes = await BranchInventory.updateOne(
          {
            branchId,
            productSkuId: item.productSkuId,
            quantity: { $gte: item.quantity }
          },
          {
            $inc: { quantity: -item.quantity }
          }
        );

        if (updateRes.modifiedCount === 0) {
          throw new AppError(
            `Sản phẩm '${product.name}' vừa có người đặt hết tại chi nhánh đã chọn.`,
            409,
            'PRODUCT_OUT_OF_STOCK'
          );
        }

        deductedItems.push({ branchId, productSkuId: item.productSkuId, quantity: item.quantity });

        enrichedItems.push({
          productId: product._id,
          productSkuId: sku._id,
          productName: product.name,
          sku: sku.sku,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          serialsAssigned: []
        });
      }
    } catch (err) {
      // Rollback hoàn trả kho nếu có bất kỳ sản phẩm nào không đủ
      for (const d of deductedItems) {
        await BranchInventory.updateOne(
          { branchId: d.branchId, productSkuId: d.productSkuId },
          { $inc: { quantity: d.quantity } }
        );
      }
      throw err;
    }

    let orderCode;
    let isCodeUnique = false;
    while (!isCodeUnique) {
      orderCode = this.generateOrderCode();
      const existing = await Order.findOne({ orderCode }).lean();
      if (!existing) isCodeUnique = true;
    }

    const order = await Order.create({
      orderCode,
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId,
      customerId: currentUser?.id || currentUser?._id || null,
      customerInfo: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address: shippingAddress.address
      },
      items: enrichedItems,
      totalAmount: calculatedTotal,
      paymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING
    });

    return order;
  }

  /**
   * Khách hàng xem lịch sử đơn hàng của mình
   */
  static async getMyOrders(customerId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { customerId };
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('branchId', 'name branchCode address phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Khách hàng xem chi tiết 1 đơn hàng của mình kèm mảng items.serialsAssigned
   */
  static async getMyOrderDetail(orderIdOrCode, customerId) {
    if (!orderIdOrCode) {
      throw new AppError('Mã đơn hàng hoặc ID không được để trống.', 400, 'VALIDATION_ERROR');
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(orderIdOrCode);
    const query = { customerId };
    if (isMongoId) {
      query.$or = [{ _id: orderIdOrCode }, { orderCode: orderIdOrCode.toUpperCase() }];
    } else {
      query.orderCode = orderIdOrCode.toUpperCase();
    }

    const order = await Order.findOne(query)
      .populate('branchId', 'name branchCode address phone')
      .lean();

    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng của bạn.', 404, 'ORDER_NOT_FOUND');
    }

    return order;
  }

  /**
   * Quản lý/Thu ngân xem danh sách đơn hàng chi nhánh
   * scopeBranch middleware bảo đảm STAFF/BRANCH_MANAGER chỉ thấy chi nhánh mình
   */
  static async getBranchOrders(targetBranchId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (targetBranchId) {
      filter.branchId = targetBranchId;
    }
    if (query.orderStatus) {
      filter.orderStatus = query.orderStatus;
    }
    if (query.orderType) {
      filter.orderType = query.orderType;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('branchId', 'name branchCode address')
      .populate('staffId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Xem chi tiết đơn hàng qua orderCode kèm kiểm soát quyền truy cập
   */
  static async getOrderByCode(orderCode, currentUser) {
    if (!orderCode) {
      throw new AppError('Mã đơn hàng không được để trống.', 400, 'VALIDATION_ERROR');
    }

    const order = await Order.findOne({ orderCode: orderCode.trim().toUpperCase() })
      .populate('branchId', 'name branchCode address phone')
      .populate('staffId', 'fullName email phone')
      .lean();

    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng yêu cầu.', 404, 'ORDER_NOT_FOUND');
    }

    if (currentUser) {
      if (currentUser.role === USER_ROLES.CUSTOMER) {
        if (order.customerId && order.customerId.toString() !== currentUser.id.toString()) {
          throw new AppError('Bạn không có quyền xem đơn hàng này.', 403, 'FORBIDDEN');
        }
      } else if (currentUser.role === USER_ROLES.STAFF || currentUser.role === USER_ROLES.BRANCH_MANAGER) {
        const orderBranchId = order.branchId?._id?.toString() || order.branchId?.toString();
        if (orderBranchId !== currentUser.branchId?.toString()) {
          throw new AppError('Bạn không có quyền xem đơn hàng của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
        }
      }
    }

    return order;
  }
}
