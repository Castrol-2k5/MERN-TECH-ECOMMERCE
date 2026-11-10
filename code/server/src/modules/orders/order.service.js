import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order, ORDER_TYPES, PAYMENT_STATUS, ORDER_STATUS, PAYMENT_METHODS } from './order.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { Product } from '../products/product.model.js';
import { Branch } from '../branches/branch.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';
import { VnpayService } from './vnpay.service.js';
import { env } from '../../config/environment.js';
import { PosShiftService } from '../shifts/posShift.service.js';
import { SettlementService } from '../accounting/settlement.service.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

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

      // Nghiệp vụ E2: Bắt buộc gán đủ Serial nếu sản phẩm có quản lý Serial/IMEI
      const isSerialManaged = sku.isSerialManaged ?? product.isSerialManaged ?? true;
      if (isSerialManaged) {
        if (!cleanSerials || cleanSerials.length !== item.quantity) {
          throw new AppError(
            `Sản phẩm '${product.name}' (${sku.sku}) yêu cầu quản lý Serial/IMEI. Số lượng Serial gán (${cleanSerials.length}) không khớp với số lượng mua (${item.quantity}).`,
            400,
            'SERIAL_COUNT_MISMATCH'
          );
        }
      }

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

    if (order.paymentMethod === PAYMENT_METHODS.CASH) {
      try {
        await PosShiftService.recordCashSale(branchId, currentUser.id || currentUser._id, calculatedTotal);
      } catch (shiftErr) {
        console.warn('Could not record cash sale to POS shift:', shiftErr.message);
      }
    }

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.ORDER_POS_CHECKOUT,
      target: {
        model: 'Order',
        entityId: order._id,
        code: order.orderCode,
        name: `Đơn bán POS ${order.orderCode}`
      },
      changes: {
        after: {
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          itemsCount: order.items?.length || 0,
          status: order.orderStatus
        }
      },
      context: {
        notes: `Bán hàng tại quầy chi nhánh: ${order.totalAmount?.toLocaleString('vi-VN')} đ`
      }
    });

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
    if (query.search && String(query.search).trim()) {
      const q = String(query.search).trim();
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { orderCode: regex },
        { 'customerInfo.fullName': regex },
        { 'customerInfo.phone': regex }
      ];
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
   * API nhẹ lấy cảnh báo đơn B2C Online mới/đang xử lý tại chi nhánh (UC-OMNI-01)
   */
  static async getBranchAlerts(targetBranchId) {
    const baseFilter = {
      orderType: ORDER_TYPES.B2C_ONLINE,
      orderStatus: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING] }
    };

    if (targetBranchId) {
      baseFilter.branchId = targetBranchId;
    }

    const [pendingCount, newCount, processingCount, alerts] = await Promise.all([
      Order.countDocuments(baseFilter),
      Order.countDocuments({ ...baseFilter, orderStatus: ORDER_STATUS.PENDING }),
      Order.countDocuments({ ...baseFilter, orderStatus: ORDER_STATUS.PROCESSING }),
      Order.find(baseFilter)
        .select('orderCode orderStatus paymentStatus paymentMethod totalAmount customerInfo branchId items.productName items.quantity items.sku createdAt')
        .populate('branchId', 'name branchCode')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    return {
      pendingCount,
      newCount,
      processingCount,
      alerts
    };
  }

  /**
   * Lấy dữ liệu in Phiếu Nhặt Hàng & Đóng Gói kèm vị trí quầy kệ (UC-OMNI-02)
   */
  static async getPickPackSlip(orderId, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError('Mã ID đơn hàng không hợp lệ.', 400, 'INVALID_ID');
    }

    const order = await Order.findById(orderId)
      .populate('branchId', 'name branchCode address phone')
      .populate('staffId', 'fullName phone')
      .lean();

    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng yêu cầu.', 404, 'ORDER_NOT_FOUND');
    }

    if (currentUser && (currentUser.role === USER_ROLES.STAFF || currentUser.role === USER_ROLES.BRANCH_MANAGER)) {
      const orderBranchId = order.branchId?._id?.toString() || order.branchId?.toString();
      if (orderBranchId !== currentUser.branchId?.toString()) {
        throw new AppError('Bạn không có quyền truy cập phiếu nhặt hàng của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
    }

    const branchObjId = order.branchId?._id || order.branchId;
    const skuIds = (order.items || []).map((it) => it.productSkuId).filter(Boolean);

    let shelfMap = new Map();
    if (branchObjId && skuIds.length > 0) {
      const inventories = await BranchInventory.find({
        branchId: branchObjId,
        productSkuId: { $in: skuIds }
      })
        .select('productSkuId shelfLocation quantity')
        .lean();

      shelfMap = new Map(inventories.map((inv) => [inv.productSkuId.toString(), inv]));
    }

    const items = (order.items || []).map((item) => {
      const inv = item.productSkuId ? shelfMap.get(item.productSkuId.toString()) : null;
      return {
        ...item,
        shelfLocation: inv?.shelfLocation || 'Quầy / Kho chung',
        branchStock: typeof inv?.quantity === 'number' ? inv.quantity : null
      };
    });

    return {
      ...order,
      items
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

  /**
   * Điều phối / Phân bổ đơn hàng B2C sang chi nhánh xử lý
   * Quyền: SUPER_ADMIN, BRANCH_MANAGER
   * Thực thi: Nếu đổi chi nhánh xử lý, kiểm tra & chuyển giữ tồn kho từ chi nhánh cũ sang chi nhánh mới
   */
/**
   * Tra cứu đơn hàng công khai (Public Order Tracking)
   * Không yêu cầu đăng nhập, bảo mật bằng cặp khóa: orderCode + phone
   */
  static async trackOrderPublic(orderCode, phone) {
    if (!orderCode || !phone) {
      throw new AppError('Vui lòng cung cấp mã đơn hàng và số điện thoại đặt hàng.', 400, 'VALIDATION_ERROR');
    }

    const cleanOrderCode = orderCode.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const standardInputPhone = cleanPhone.startsWith('+84') ? '0' + cleanPhone.substring(3) : cleanPhone;

    const order = await Order.findOne({ orderCode: cleanOrderCode })
      .populate('branchId', 'name branchCode address phone')
      .lean();

    if (!order) {
      throw new AppError('Không tìm thấy thông tin đơn hàng với mã và số điện thoại đã cung cấp.', 404, 'ORDER_NOT_FOUND');
    }

    const orderPhone = (order.customerInfo?.phone || '').trim().replace(/\s+/g, '');
    const standardOrderPhone = orderPhone.startsWith('+84') ? '0' + orderPhone.substring(3) : orderPhone;

    if (standardOrderPhone !== standardInputPhone) {
      throw new AppError('Số điện thoại không khớp với thông tin đơn hàng đã đặt.', 404, 'ORDER_NOT_FOUND');
    }

    const rawPhone = order.customerInfo?.phone || '';
    const maskedPhone =
      rawPhone.length >= 10
        ? `${rawPhone.substring(0, 3)}****${rawPhone.slice(-3)}`
        : rawPhone;

    return {
      orderCode: order.orderCode,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      customerInfo: {
        fullName: order.customerInfo?.fullName || 'Khách hàng',
        phone: maskedPhone,
        address: order.customerInfo?.address || ''
      },
      branch: order.branchId
        ? {
            name: order.branchId.name,
            branchCode: order.branchId.branchCode,
            address: order.branchId.address,
            phone: order.branchId.phone
          }
        : null,
      items: (order.items || []).map((it) => ({
        productId: it.productId,
        productSkuId: it.productSkuId,
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        serialsAssigned: Array.isArray(it.serialsAssigned) ? it.serialsAssigned : []
      })),
      completedAt: order.completedAt || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  static async allocateOrder(orderId, branchId, _currentUser) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần điều phối.', 404, 'ORDER_NOT_FOUND');
    }

    const branch = await Branch.findById(branchId).lean();
    if (!branch || !branch.isActive) {
      throw new AppError('Chi nhánh điều phối không tồn tại hoặc đã tạm dừng hoạt động.', 404, 'BRANCH_NOT_FOUND');
    }

    const oldBranchId = order.branchId?.toString();
    const newBranchId = branchId.toString();

    if (oldBranchId && oldBranchId !== newBranchId && Array.isArray(order.items) && order.items.length > 0) {
      const deductedNew = [];
      try {
        for (const item of order.items) {
          const targetInv = await BranchInventory.findOne({
            branchId: newBranchId,
            productSkuId: item.productSkuId
          }).lean();

          if (targetInv) {
            const updateRes = await BranchInventory.updateOne(
              {
                branchId: newBranchId,
                productSkuId: item.productSkuId,
                quantity: { $gte: item.quantity }
              },
              { $inc: { quantity: -item.quantity } }
            );

            if (updateRes.modifiedCount === 0) {
              throw new AppError(
                `Sản phẩm '${item.productName}' (${item.sku}) không đủ tồn kho tại chi nhánh điều phối mới.`,
                409,
                'PRODUCT_OUT_OF_STOCK'
              );
            }
            deductedNew.push({ branchId: newBranchId, productSkuId: item.productSkuId, quantity: item.quantity });
          }
        }

        // Hoàn trả tồn kho cho chi nhánh cũ (nếu có bản ghi BranchInventory tại chi nhánh cũ)
        for (const item of order.items) {
          await BranchInventory.updateOne(
            { branchId: oldBranchId, productSkuId: item.productSkuId },
            { $inc: { quantity: item.quantity } }
          );
        }
      } catch (err) {
        for (const d of deductedNew) {
          await BranchInventory.updateOne(
            { branchId: d.branchId, productSkuId: d.productSkuId },
            { $inc: { quantity: d.quantity } }
          );
        }
        throw err;
      }
    }

    order.branchId = branchId;
    order.orderStatus = ORDER_STATUS.PROCESSING;
    await order.save();

    return order;
  }

  /**
   * Đóng gói & Gán serials cho đơn B2C dispatch
   * Kích hoạt bảo hành điện tử (e-warranty) cho serials gán vào đơn
   * Quyền: SUPER_ADMIN, BRANCH_MANAGER, STAFF
   */
  static async dispatchOrder(orderId, payload, currentUser) {
    const { serials, orderStatus } = payload;
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần đóng gói.', 404, 'ORDER_NOT_FOUND');
    }

    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      const orderBranchId = order.branchId?.toString();
      if (orderBranchId && orderBranchId !== currentUser.branchId?.toString()) {
        throw new AppError('Bạn không có quyền đóng gói đơn hàng thuộc chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
    }

    if (Array.isArray(serials) && serials.length > 0) {
      const cleanSerials = serials.map((s) => String(s).trim().toUpperCase()).filter(Boolean);

      if (new Set(cleanSerials).size !== cleanSerials.length) {
        throw new AppError('Danh sách Serial gán vào đơn chứa mã trùng lặp.', 400, 'VALIDATION_ERROR');
      }

      const foundSerials = await Serial.find({ serialNumber: { $in: cleanSerials } }).lean();
      if (foundSerials.length !== cleanSerials.length) {
        throw new AppError('Một số mã Serial/IMEI không tồn tại trong hệ thống kho.', 400, 'SERIAL_NOT_FOUND');
      }

      const orderBranchId = order.branchId?.toString();
      for (const s of foundSerials) {
        if (s.status !== SERIAL_STATUS.IN_STOCK) {
          throw new AppError(
            `Mã Serial '${s.serialNumber}' không ở trạng thái khả dụng trong kho (Trạng thái: ${s.status}).`,
            400,
            'INVALID_SERIAL_STATUS'
          );
        }
        if (orderBranchId && s.branchId?.toString() !== orderBranchId) {
          throw new AppError(
            `Mã Serial '${s.serialNumber}' không thuộc kho của chi nhánh được giao xử lý đơn hàng này.`,
            400,
            'CROSS_BRANCH_ACCESS_DENIED'
          );
        }
      }

      // Gán serials vào các items theo đúng productSkuId hoặc phân bổ tuần tự theo quantity
      if (order.items && order.items.length > 0) {
        const serialBySkuMap = new Map();
        for (const s of foundSerials) {
          const skuKey = s.productSkuId?.toString();
          if (!serialBySkuMap.has(skuKey)) {
            serialBySkuMap.set(skuKey, []);
          }
          serialBySkuMap.get(skuKey).push(s.serialNumber);
        }

        let offset = 0;
        for (const item of order.items) {
          const skuKey = item.productSkuId?.toString();
          const matchedForSku = serialBySkuMap.get(skuKey) || [];
          if (matchedForSku.length > 0) {
            item.serialsAssigned = matchedForSku.splice(0, item.quantity || 1);
          } else {
            item.serialsAssigned = cleanSerials.slice(offset, offset + (item.quantity || 1));
            offset += item.quantity || 1;
          }
        }
      }

      // Cập nhật trạng thái Serial sang SOLD và kích hoạt bảo hành
      const now = new Date();
      const warrantyEndDate = new Date(now);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);

      await Serial.updateMany(
        { serialNumber: { $in: cleanSerials } },
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

    order.orderStatus = orderStatus || ORDER_STATUS.READY_FOR_SHIPPING;
    await order.save();

    return order;
  }

  /**
   * Tạo URL thanh toán VNPay Sandbox cho đơn hàng
   */
  /**
   * Bàn giao máy và hoàn tất đơn hàng Click & Collect tại quầy
   * Quyền: SUPER_ADMIN, BRANCH_MANAGER, STAFF
   */
  static async completeOrder(orderId, payload = {}, currentUser) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần bàn giao.', 404, 'ORDER_NOT_FOUND');
    }

    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      const orderBranchId = order.branchId?.toString();
      if (orderBranchId && orderBranchId !== currentUser.branchId?.toString()) {
        throw new AppError('Bạn không có quyền bàn giao đơn hàng thuộc chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
    }

    if (order.orderStatus === ORDER_STATUS.COMPLETED) {
      throw new AppError('Đơn hàng đã được hoàn tất trước đó.', 400, 'ORDER_ALREADY_COMPLETED');
    }

    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw new AppError('Không thể hoàn tất đơn hàng đã bị hủy.', 400, 'ORDER_ALREADY_CANCELLED');
    }

    const { serials, paymentMethod } = payload;
    if (Array.isArray(serials) && serials.length > 0) {
      const cleanSerials = serials.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
      const foundSerials = await Serial.find({ serialNumber: { $in: cleanSerials } });

      if (foundSerials.length !== cleanSerials.length) {
        throw new AppError('Một số mã Serial/IMEI không tồn tại trong hệ thống kho.', 400, 'SERIAL_NOT_FOUND');
      }

      for (const s of foundSerials) {
        if (s.status !== SERIAL_STATUS.IN_STOCK && s.orderId?.toString() !== order._id.toString()) {
          throw new AppError(`Mã Serial '${s.serialNumber}' không khả dụng để xuất bán.`, 400, 'INVALID_SERIAL_STATUS');
        }
      }

      let offset = 0;
      for (const item of order.items) {
        item.serialsAssigned = cleanSerials.slice(offset, offset + (item.quantity || 1));
        offset += item.quantity || 1;
      }
    }

    const allAssignedSerials = (order.items || []).flatMap((it) => it.serialsAssigned || []);
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

    order.orderStatus = ORDER_STATUS.COMPLETED;
    order.paymentStatus = PAYMENT_STATUS.PAID;
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    order.staffId = currentUser.id || currentUser._id;
    order.completedAt = new Date();
    await order.save();

    try {
      await SettlementService.recordOrderSettlement(order);
    } catch (settleErr) {
      console.warn('Could not record order settlement:', settleErr.message);
    }

    const populated = await Order.findById(order._id)
      .populate('branchId', 'name branchCode address phone')
      .populate('staffId', 'fullName email phone')
      .lean();

    return populated || order;
  }

  /**
   * Hủy đơn giữ hàng Click & Collect / B2C và tự động hoàn trả tồn kho & Serial
   * Quyền: SUPER_ADMIN, BRANCH_MANAGER
   */
  static async cancelOrder(orderId, payload, currentUser) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần hủy.', 404, 'ORDER_NOT_FOUND');
    }

    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      const orderBranchId = order.branchId?.toString();
      if (orderBranchId && orderBranchId !== currentUser.branchId?.toString()) {
        throw new AppError('Bạn không có quyền hủy đơn hàng thuộc chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
    }

    if (order.orderStatus === ORDER_STATUS.COMPLETED) {
      throw new AppError('Không thể hủy đơn hàng đã hoàn tất bàn giao.', 400, 'CANNOT_CANCEL_COMPLETED_ORDER');
    }

    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw new AppError('Đơn hàng này đã bị hủy trước đó.', 400, 'ORDER_ALREADY_CANCELLED');
    }

    for (const item of order.items || []) {
      await BranchInventory.updateOne(
        { branchId: order.branchId, productSkuId: item.productSkuId },
        { $inc: { quantity: item.quantity } }
      );
    }

    const allAssignedSerials = (order.items || []).flatMap((it) => it.serialsAssigned || []);
    if (allAssignedSerials.length > 0) {
      await Serial.updateMany(
        { serialNumber: { $in: allAssignedSerials } },
        {
          $set: {
            status: SERIAL_STATUS.IN_STOCK,
            soldAt: null,
            warrantyEndDate: null,
            orderId: null
          }
        }
      );
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancellationReason = payload.reason || 'Khách không đến nhận hoặc yêu cầu hủy';
    order.cancelledBy = currentUser.id || currentUser._id;
    order.cancelledAt = new Date();
    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.ORDER_CANCEL,
      target: {
        model: 'Order',
        entityId: order._id,
        code: order.orderCode,
        name: `Đơn hàng ${order.orderCode}`
      },
      changes: {
        before: { orderStatus: ORDER_STATUS.PENDING },
        after: { orderStatus: ORDER_STATUS.CANCELLED }
      },
      context: {
        reason: order.cancellationReason,
        notes: 'Hủy đơn hàng và hoàn lại tồn kho/Serial'
      }
    });
    await order.save();

    return order;
  }

  /**
   * Hủy hóa đơn POS đã COMPLETED (Chỉ thực thi qua Quản lý duyệt hoặc Admin/Manager trực tiếp) (UC-BM-04)
   */
  static async voidCompletedPosOrder(orderId, payload, currentUser, options = {}) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần hủy.', 404, 'ORDER_NOT_FOUND');
    }

    if (
      !options.bypassApproval &&
      (!currentUser || ![USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN].includes(currentUser.role))
    ) {
      throw new AppError(
        'Hủy hóa đơn POS đã hoàn tất bắt buộc phải có Quản lý Chi nhánh phê duyệt.',
        403,
        'APPROVAL_REQUIRED'
      );
    }

    if (currentUser?.role === USER_ROLES.BRANCH_MANAGER) {
      const orderBranchId = order.branchId?.toString();
      if (orderBranchId && orderBranchId !== currentUser.branchId?.toString()) {
        throw new AppError('Bạn không có quyền hủy hóa đơn của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
    }

    if (order.orderType !== ORDER_TYPES.POS_STORE) {
      throw new AppError('Chỉ áp dụng hủy hóa đơn POS cho đơn bán tại quầy.', 400, 'INVALID_ORDER_TYPE');
    }

    if (order.orderStatus !== ORDER_STATUS.COMPLETED) {
      throw new AppError(
        `Chỉ có thể hủy hóa đơn POS đang ở trạng thái COMPLETED (hiện tại: ${order.orderStatus}).`,
        400,
        'INVALID_ORDER_STATUS'
      );
    }

    for (const item of order.items || []) {
      await BranchInventory.updateOne(
        { branchId: order.branchId, productSkuId: item.productSkuId },
        { $inc: { quantity: item.quantity } }
      );
    }

    const allAssignedSerials = (order.items || []).flatMap((it) => it.serialsAssigned || []);
    if (allAssignedSerials.length > 0) {
      await Serial.updateMany(
        { serialNumber: { $in: allAssignedSerials } },
        {
          $set: {
            status: SERIAL_STATUS.IN_STOCK,
            soldAt: null,
            warrantyEndDate: null,
            orderId: null,
            orderItemId: null
          }
        }
      );
    }

    let shiftAdjusted = false;
    if (order.paymentMethod === PAYMENT_METHODS.CASH && order.totalAmount > 0) {
      const actorId = currentUser?.id || currentUser?._id || order.staffId;
      const updatedShift = await PosShiftService.recordCashRefund(
        order.branchId,
        actorId,
        Number(order.totalAmount)
      );
      shiftAdjusted = Boolean(updatedShift);
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    order.refundedAmount = Number(order.totalAmount || 0);
    order.cancellationReason = payload.reason || 'Hủy hóa đơn POS đã hoàn tất theo phê duyệt Quản lý';
    order.cancelledBy = currentUser?.id || currentUser?._id || null;
    order.cancelledAt = new Date();
    await order.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.ORDER_VOID,
      target: {
        model: 'Order',
        entityId: order._id,
        code: order.orderCode,
        name: `Hủy hóa đơn POS ${order.orderCode}`
      },
      changes: {
        before: { orderStatus: ORDER_STATUS.COMPLETED, paymentStatus: PAYMENT_STATUS.PAID },
        after: {
          orderStatus: ORDER_STATUS.CANCELLED,
          paymentStatus: PAYMENT_STATUS.REFUNDED,
          refundedAmount: order.refundedAmount
        }
      },
      context: {
        reason: order.cancellationReason,
        notes: `Hoàn kho ${order.items?.length || 0} dòng sản phẩm & ${allAssignedSerials.length} Serial${shiftAdjusted ? ' | Đã trừ quỹ tiền mặt ca POS' : ''}`
      }
    });

    return { order, shiftAdjusted };
  }

  /**
   * Đổi SKU / Đổi máy tại quầy cho đơn hàng Click & Collect hoặc đơn chi nhánh
   * Quyền: STAFF, BRANCH_MANAGER, SUPER_ADMIN
   */
  static async exchangeSku(orderId, payload, currentUser) {
    const { oldProductSkuId, newProductSkuId, newSerialNumber, paymentMethod = 'CASH', note } = payload;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần đổi SKU.', 404, 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus === ORDER_STATUS.COMPLETED || order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw new AppError(
        `Không thể đổi SKU cho đơn hàng ở trạng thái ${order.orderStatus}.`,
        400,
        'INVALID_ORDER_STATUS'
      );
    }

    // 1. Kiểm tra item cũ trong đơn
    const itemIndex = (order.items || []).findIndex(
      (it) => it.productSkuId.toString() === oldProductSkuId.toString()
    );
    if (itemIndex === -1) {
      throw new AppError('SKU cũ không tồn tại trong đơn hàng này.', 404, 'OLD_SKU_NOT_IN_ORDER');
    }
    const oldItem = order.items[itemIndex];

    // 2. Tìm sản phẩm và SKU mới
    const targetProduct = await Product.findOne({ 'skus._id': newProductSkuId }).lean();
    if (!targetProduct) {
      throw new AppError('Không tìm thấy sản phẩm chứa SKU mới yêu cầu.', 404, 'TARGET_SKU_NOT_FOUND');
    }
    const targetSku = targetProduct.skus.find((s) => s._id.toString() === newProductSkuId.toString());
    if (!targetSku) {
      throw new AppError('Không tìm thấy SKU mới trong hệ thống.', 404, 'TARGET_SKU_NOT_FOUND');
    }

    // 3. Kiểm tra tồn kho SKU mới tại chi nhánh
    const branchId = order.branchId;
    if (!branchId) {
      throw new AppError('Đơn hàng chưa được gắn với chi nhánh cụ thể.', 400, 'ORDER_NO_BRANCH');
    }

    const newInventory = await BranchInventory.findOne({ branchId, productSkuId: newProductSkuId });
    if (!newInventory || newInventory.quantity < oldItem.quantity) {
      throw new AppError(
        `Chi nhánh hiện không đủ tồn kho SKU mới (${targetSku.sku}). Số lượng tồn khả dụng: ${newInventory?.quantity || 0}.`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    // 4. Hoàn trả tồn kho và Serial của SKU cũ
    await BranchInventory.updateOne(
      { branchId, productSkuId: oldItem.productSkuId },
      { $inc: { quantity: oldItem.quantity } }
    );

    if (oldItem.serialsAssigned && oldItem.serialsAssigned.length > 0) {
      await Serial.updateMany(
        { serialNumber: { $in: oldItem.serialsAssigned } },
        {
          $set: {
            status: SERIAL_STATUS.IN_STOCK,
            orderId: null,
            orderItemId: null,
            soldAt: null,
            warrantyEndDate: null
          }
        }
      );
    }

    // 5. Trừ tồn kho SKU mới
    await BranchInventory.updateOne(
      { branchId, productSkuId: newProductSkuId },
      { $inc: { quantity: -oldItem.quantity } }
    );

    // 6. Xử lý mã Serial mới nếu nhân viên quét tại quầy
    let newSerials = [];
    if (newSerialNumber && newSerialNumber.trim()) {
      const cleanSerial = newSerialNumber.trim().toUpperCase();
      const serialDoc = await Serial.findOne({
        serialNumber: cleanSerial,
        productSkuId: newProductSkuId,
        branchId
      });
      if (!serialDoc) {
        throw new AppError(
          `Mã Serial/IMEI ${cleanSerial} không tồn tại hoặc không thuộc chi nhánh này.`,
          400,
          'INVALID_SERIAL'
        );
      }
      if (serialDoc.status !== SERIAL_STATUS.IN_STOCK) {
        throw new AppError(
          `Mã Serial ${cleanSerial} đang ở trạng thái ${serialDoc.status}, không thể gán.`,
          400,
          'SERIAL_NOT_AVAILABLE'
        );
      }
      await Serial.updateOne(
        { _id: serialDoc._id },
        {
          $set: {
            status: SERIAL_STATUS.RESERVED,
            orderId: order._id,
            orderItemId: oldItem._id
          }
        }
      );
      newSerials = [cleanSerial];
    }

    // 7. Tính toán chênh lệch giá
    const oldTotal = Number(oldItem.unitPrice || 0) * Number(oldItem.quantity || 1);
    const newUnitPrice = Number(targetSku.salePrice || targetSku.price || 0);
    const newTotal = newUnitPrice * Number(oldItem.quantity || 1);
    const priceDifference = newTotal - oldTotal;

    // 8. Cập nhật order.items
    order.items[itemIndex] = {
      productId: targetProduct._id,
      productSkuId: targetSku._id,
      productName: `${targetProduct.name} - ${targetSku.sku}`,
      sku: targetSku.sku,
      quantity: oldItem.quantity,
      unitPrice: newUnitPrice,
      subtotal: newTotal,
      serialsAssigned: newSerials
    };

    order.totalAmount = Math.max(0, Number(order.totalAmount || 0) + priceDifference);

    // 9. Ghi vết lịch sử đổi SKU
    if (!order.exchangeHistory) order.exchangeHistory = [];
    order.exchangeHistory.push({
      exchangedAt: new Date(),
      exchangedBy: currentUser?.id || currentUser?._id,
      oldProductSkuId: oldItem.productSkuId,
      oldSku: oldItem.sku,
      oldProductName: oldItem.productName,
      newProductSkuId: targetSku._id,
      newSku: targetSku.sku,
      newProductName: `${targetProduct.name} - ${targetSku.sku}`,
      oldUnitPrice: oldItem.unitPrice,
      newUnitPrice,
      priceDifference,
      paymentMethod,
      note: note || 'Đổi SKU theo yêu cầu của khách tại quầy'
    });

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('branchId', 'name branchCode address phone')
      .populate('staffId', 'fullName email')
      .populate('exchangeHistory.exchangedBy', 'fullName email')
      .lean();

    return {
      order: populated || order,
      priceDifference,
      actionRequired: priceDifference > 0 ? 'COLLECT_MORE' : priceDifference < 0 ? 'REFUND_CUSTOMER' : 'EQUAL_EXCHANGE'
    };
  }

  static async createVnpayPaymentUrl(orderId, ipAddr) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Không tìm thấy đơn hàng cần thanh toán.', 404, 'ORDER_NOT_FOUND');
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new AppError('Đơn hàng này đã được thanh toán hoàn tất trước đó.', 400, 'ORDER_ALREADY_PAID');
    }

    const paymentUrl = VnpayService.createPaymentUrl(order, ipAddr);
    return paymentUrl;
  }

  /**
   * Xử lý callback return từ cổng VNPay sau khi khách thực hiện thanh toán
   */
  static async handleVnpayReturn(queryParams) {
    const verification = VnpayService.verifyReturnUrl(queryParams);

    if (!verification.orderCode) {
      return `${env.CLIENT_URL}/checkout/success?error=invalid_order`;
    }

    const order = await Order.findOne({ orderCode: verification.orderCode });
    if (!order) {
      return `${env.CLIENT_URL}/checkout/success?orderCode=${verification.orderCode}&error=order_not_found`;
    }

    if (verification.isSuccess) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.paymentMethod = PAYMENT_METHODS.VNPAY;
      if (order.orderStatus === ORDER_STATUS.PENDING) {
        order.orderStatus = ORDER_STATUS.PROCESSING;
      }
      await order.save();

      return `${env.CLIENT_URL}/checkout/success?orderCode=${order.orderCode}&vnp_ResponseCode=00&vnp_TransactionNo=${verification.transactionNo}&vnp_BankCode=${verification.bankCode}&vnp_Amount=${verification.amount}`;
    } else {
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();

      return `${env.CLIENT_URL}/checkout/success?orderCode=${order.orderCode}&vnp_ResponseCode=${verification.responseCode || '99'}&vnp_TransactionNo=${verification.transactionNo}`;
    }
  }
}
