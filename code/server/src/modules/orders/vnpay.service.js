import crypto from 'crypto';
import { env } from '../../config/environment.js';

export class VnpayService {
  /**
   * Sắp xếp các tham số URL theo thứ tự từ điển A-Z theo quy chuẩn của VNPay
   */
  static sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
      }
    }
    return sorted;
  }

  /**
   * Tạo URL thanh toán chuyển hướng sang cổng VNPay Sandbox
   * @param {Object} order - Đơn hàng cần thanh toán
   * @param {String} ipAddr - Địa chỉ IP của client
   */
  static createPaymentUrl(order, ipAddr = '127.0.0.1') {
    const tmnCode = env.VNPAY_TMN_CODE;
    const secretKey = env.VNPAY_HASH_SECRET;
    const vnpUrl = env.VNPAY_URL;
    const returnUrl = env.VNPAY_RETURN_URL;

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const createDate = `${vnTime.getUTCFullYear()}${pad(vnTime.getUTCMonth() + 1)}${pad(vnTime.getUTCDate())}${pad(vnTime.getUTCHours())}${pad(vnTime.getUTCMinutes())}${pad(vnTime.getUTCSeconds())}`;

    // Clean IP Address
    const cleanIp =
      !ipAddr || ipAddr === '::1' || ipAddr === 'localhost'
        ? '127.0.0.1'
        : String(ipAddr).replace('::ffff:', '');

    // Đơn hàng thanh toán VNPay nhân 100 theo quy định VNPay
    const amount = Math.round(Number(order.totalAmount || 0) * 100);

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: `${order.orderCode}_${Date.now()}`,
      vnp_OrderInfo: `Thanh toan don hang ${order.orderCode} tai TechStore`,
      vnp_OrderType: 'other',
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: cleanIp,
      vnp_CreateDate: createDate
    };

    vnp_Params = this.sortObject(vnp_Params);

    const signData = Object.entries(vnp_Params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
    return paymentUrl;
  }

  /**
   * Xác thực chữ ký phản hồi từ VNPay khi redirect về
   * @param {Object} vnp_Params - Query parameters từ VNPay GET return
   */
  static verifyReturnUrl(vnp_Params = {}) {
    const secureHash = vnp_Params.vnp_SecureHash;
    const secretKey = env.VNPAY_HASH_SECRET;

    const cleanParams = { ...vnp_Params };
    delete cleanParams.vnp_SecureHash;
    delete cleanParams.vnp_SecureHashType;

    const sorted = this.sortObject(cleanParams);
    const signData = Object.entries(sorted)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // So sánh chữ ký (không phân biệt hoa thường)
    const isChecksumValid =
      String(secureHash).toLowerCase() === String(calculatedHash).toLowerCase();

    // Lấy lại orderCode gốc (loại bỏ phần timestamp sau dấu _)
    const txnRef = vnp_Params.vnp_TxnRef || '';
    const orderCode = txnRef.includes('_') ? txnRef.split('_')[0] : txnRef;

    return {
      isValid: isChecksumValid,
      orderCode,
      isSuccess: isChecksumValid && vnp_Params.vnp_ResponseCode === '00',
      responseCode: vnp_Params.vnp_ResponseCode,
      transactionNo: vnp_Params.vnp_TransactionNo || '',
      bankCode: vnp_Params.vnp_BankCode || '',
      amount: vnp_Params.vnp_Amount ? Number(vnp_Params.vnp_Amount) / 100 : 0
    };
  }
}
