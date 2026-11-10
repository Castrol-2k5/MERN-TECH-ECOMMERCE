import { User } from './user.model.js';
import { Order } from '../orders/order.model.js';
import { WarrantyTicket } from '../warranty/warranty.model.js';
import { AppError } from '../../utils/appError.js';

const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export class CustomerLookupService {
  /**
   * Tra cứu nhanh thông tin CRM khách hàng theo SĐT tại quầy POS (UC-POS-12)
   * Trả về thông tin cơ bản, 5 đơn hàng gần nhất & tổng hợp bảo hành (không lộ thông tin bảo mật).
   */
  static async lookupByPhone(rawPhone = '') {
    const cleanPhone = String(rawPhone).trim();
    if (!cleanPhone || !VN_PHONE_REGEX.test(cleanPhone)) {
      throw new AppError(
        'Số điện thoại không đúng định dạng di động Việt Nam (VD: 0909000005).',
        400,
        'INVALID_PHONE_FORMAT'
      );
    }

    // Chuẩn hóa hỗ trợ cả +84 và 0
    const normalizedLocal = cleanPhone.startsWith('+84')
      ? `0${cleanPhone.slice(3)}`
      : cleanPhone;
    const normalizedIntl = cleanPhone.startsWith('0')
      ? `+84${cleanPhone.slice(1)}`
      : cleanPhone;
    const phoneVariants = [...new Set([cleanPhone, normalizedLocal, normalizedIntl])];

    const user = await User.findOne({ phone: { $in: phoneVariants } })
      .select('fullName phone address addresses createdAt role')
      .lean();

    const orderQuery = user
      ? { $or: [{ customerId: user._id }, { 'customerInfo.phone': { $in: phoneVariants } }] }
      : { 'customerInfo.phone': { $in: phoneVariants } };

    const [recentOrders, completedAgg, warrantyTickets] = await Promise.all([
      Order.find(orderQuery)
        .select('orderCode orderType totalAmount orderStatus createdAt items.productName items.sku customerInfo')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.aggregate([
        { $match: { ...orderQuery, orderStatus: 'COMPLETED' } },
        {
          $group: {
            _id: null,
            totalOrdersCount: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' }
          }
        }
      ]),
      WarrantyTicket.find(
        user
          ? { $or: [{ customerId: user._id }, { 'customerInfo.phone': { $in: phoneVariants } }] }
          : { 'customerInfo.phone': { $in: phoneVariants } }
      )
        .select('ticketCode serialNumber status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    const defaultAddress =
      user?.address ||
      user?.addresses?.find((a) => a.isDefault)?.address ||
      recentOrders.find((o) => o.customerInfo?.address)?.customerInfo?.address ||
      '';

    const resolvedName =
      user?.fullName ||
      recentOrders.find((o) => o.customerInfo?.fullName)?.customerInfo?.fullName ||
      '';

    const found = Boolean(user || recentOrders.length > 0 || warrantyTickets.length > 0);
    const stats = completedAgg[0] || { totalOrdersCount: 0, totalSpent: 0 };

    return {
      found,
      customer: found
        ? {
            fullName: resolvedName,
            phone: user?.phone || normalizedLocal,
            address: defaultAddress,
            isRegisteredAccount: Boolean(user),
            memberSince: user?.createdAt || recentOrders[recentOrders.length - 1]?.createdAt || null
          }
        : null,
      summary: {
        totalCompletedOrders: stats.totalOrdersCount || 0,
        totalSpent: stats.totalSpent || 0,
        recentOrdersCount: recentOrders.length,
        warrantyCount: warrantyTickets.length
      },
      recentOrders: recentOrders.map((o) => ({
        orderCode: o.orderCode,
        orderType: o.orderType,
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        createdAt: o.createdAt,
        firstItemName: o.items?.[0]?.productName || 'Sản phẩm'
      })),
      recentWarranties: warrantyTickets
    };
  }
}

export default CustomerLookupService;
