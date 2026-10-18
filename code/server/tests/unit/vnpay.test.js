import { describe, it, expect } from '@jest/globals';
import crypto from 'crypto';
import { VnpayService } from '../../src/modules/orders/vnpay.service.js';

describe('Unit Test: VnpayService (HMAC-SHA512 checksum & URL builder)', () => {
  const mockOrder = {
    orderCode: 'ORD-TEST-001',
    totalAmount: 34990000
  };

  it('Happy Path: should generate a valid VNPay sandbox URL with required query params and SHA512 hash', () => {
    const paymentUrl = VnpayService.createPaymentUrl(mockOrder, '127.0.0.1');

    expect(paymentUrl).toBeDefined();
    expect(paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    expect(paymentUrl).toContain('vnp_Amount=3499000000'); // nhân 100
    expect(paymentUrl).toContain('vnp_Command=pay');
    expect(paymentUrl).toContain('vnp_CurrCode=VND');
    expect(paymentUrl).toContain('vnp_SecureHash=');
  });

  it('Happy Path: should verify authentic return params with valid checksum', () => {
    const paymentUrl = VnpayService.createPaymentUrl(mockOrder, '127.0.0.1');
    const urlObj = new URL(paymentUrl);
    const params = Object.fromEntries(urlObj.searchParams.entries());

    // Giả lập VNPay trả về mã thành công '00'
    params.vnp_ResponseCode = '00';
    params.vnp_TransactionNo = '14598001';

    // Tính lại chữ ký cho params vừa thêm
    delete params.vnp_SecureHash;
    const sorted = VnpayService.sortObject(params);
    const signData = Object.entries(sorted)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET || 'SECRETKEYVNPAY2026');
    params.vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const result = VnpayService.verifyReturnUrl(params);
    expect(result.isValid).toBe(true);
    expect(result.isSuccess).toBe(true);
    expect(result.orderCode).toBe('ORD-TEST-001');
    expect(result.transactionNo).toBe('14598001');
  });

  it('Security / Negative: should reject return callback when parameters or hash have been tampered with', () => {
    const tamperedParams = {
      vnp_Amount: '100000',
      vnp_TxnRef: 'ORD-TEST-001_12345',
      vnp_ResponseCode: '00',
      vnp_SecureHash: 'fake_or_tampered_hash_string'
    };

    const result = VnpayService.verifyReturnUrl(tamperedParams);
    expect(result.isValid).toBe(false);
    expect(result.isSuccess).toBe(false);
  });
});
