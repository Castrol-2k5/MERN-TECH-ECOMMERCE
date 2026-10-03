/**
 * Order Adapter: Chuẩn hóa payload đơn hàng POS và B2C gửi lên Backend API
 * Tuân thủ Zod strict() schema của Server (Single Source of Truth)
 */

/**
 * Chuẩn hóa payload cho POS Store Checkout (POST /api/v1/orders/pos/checkout)
 * @param {Object} cartState - Redux posCart state (items, customerInfo, paymentMethod, branchId)
 * @param {string} userBranchId - Chi nhánh gán của nhân viên đang đăng nhập
 */
export const toPosCheckoutPayload = (cartState = {}, userBranchId) => {
  const branchId = userBranchId || cartState.branchId || undefined;
  const paymentMethod = cartState.paymentMethod || 'CASH';

  // 1. Chỉ trích xuất các trường Server yêu cầu trong items
  const items = (cartState.items || []).map((it) => {
    const cleanSerials = Array.isArray(it.serialsAssigned)
      ? it.serialsAssigned
          .filter((s) => typeof s === 'string' && s.trim().length > 0)
          .map((s) => s.trim().toUpperCase())
      : [];

    return {
      productId: it.productId || it._id,
      productSkuId: it.productSkuId || it.skuId,
      quantity: Number(it.quantity || 1),
      serialsAssigned: cleanSerials,
    };
  });

  const payload = {
    items,
    paymentMethod,
  };

  if (branchId) {
    payload.branchId = branchId;
  }

  // 2. Xử lý customerInfo:
  // Nếu có số điện thoại hợp lệ -> gửi customerInfo
  // Nếu là khách vãng lai (không có SĐT hoặc rỗng) -> không gửi customerInfo để tránh lỗi regex
  const phone = cartState.customerInfo?.phone?.trim();
  const fullName = cartState.customerInfo?.fullName?.trim();
  const address = cartState.customerInfo?.address?.trim() || '';

  if (phone) {
    payload.customerInfo = {
      fullName: fullName || 'Khách vãng lai',
      phone,
      address,
    };
  } else if (fullName) {
    payload.customerInfo = {
      fullName,
      phone: '',
      address,
    };
  }

  // Tuyệt đối không gửi subtotal, tax, discount, change, totalAmount...
  return payload;
};

/**
 * Chuẩn hóa payload cho B2C Online Checkout (POST /api/v1/orders/b2c/checkout)
 * @param {Object} cartState - Giỏ hàng Storefront (items, selectedBranchId)
 * @param {Object} shippingForm - Form thông tin nhận hàng và thanh toán
 */
export const toB2cCheckoutPayload = (cartState = {}, shippingForm = {}) => {
  const branchId = shippingForm.branchId || cartState.selectedBranchId;
  const paymentMethod = shippingForm.paymentMethod || 'CASH';

  // Items chỉ bao gồm productId, productSkuId, quantity (loại bỏ unitPrice)
  const items = (cartState.items || []).map((it) => ({
    productId: it.productId || it._id,
    productSkuId: it.productSkuId || it.skuId,
    quantity: Number(it.quantity || 1),
  }));

  const shippingAddress = {
    fullName: (shippingForm.fullName || '').trim(),
    phone: (shippingForm.phone || '').trim(),
    address: (shippingForm.address || '').trim(),
  };

  return {
    branchId,
    items,
    shippingAddress,
    paymentMethod,
  };
};

export default {
  toPosCheckoutPayload,
  toB2cCheckoutPayload,
};
