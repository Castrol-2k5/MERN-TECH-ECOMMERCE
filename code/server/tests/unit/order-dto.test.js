import { posCheckoutSchema, b2cCheckoutSchema } from '../../src/modules/orders/order.dto.js';
import { PAYMENT_METHODS } from '../../src/modules/orders/order.model.js';

describe('Order DTO Unit Tests (Zod)', () => {
  const validObjectId = '650c1f2e1234567890abcdef';

  describe('posCheckoutSchema', () => {
    test('Happy Path: should validate valid POS checkout with serials', () => {
      const payload = {
        branchId: validObjectId,
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 2,
            serialsAssigned: ['SN-001', 'SN-002']
          }
        ],
        paymentMethod: PAYMENT_METHODS.CASH,
        customerInfo: {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          address: 'TP.HCM'
        }
      };

      const result = posCheckoutSchema.parse(payload);
      expect(result.items.length).toBe(1);
      expect(result.paymentMethod).toBe('CASH');
      expect(result.customerInfo.phone).toBe('0912345678');
    });

    test('Happy Path: should validate POS checkout without customerInfo and default CASH', () => {
      const payload = {
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1,
            serialsAssigned: ['SN-001']
          }
        ]
      };

      const result = posCheckoutSchema.parse(payload);
      expect(result.paymentMethod).toBe('CASH');
    });

    test('Negative Path: should reject when serial count does not match quantity', () => {
      const payload = {
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 2,
            serialsAssigned: ['SN-001'] // only 1 serial for 2 qty
          }
        ]
      };

      expect(() => posCheckoutSchema.parse(payload)).toThrow();
    });

    test('Negative Path: should reject empty items array', () => {
      const payload = {
        items: []
      };

      expect(() => posCheckoutSchema.parse(payload)).toThrow();
    });

    test('Negative Path: should reject invalid phone in customerInfo', () => {
      const payload = {
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1
          }
        ],
        customerInfo: {
          fullName: 'Test',
          phone: '12345'
        }
      };

      expect(() => posCheckoutSchema.parse(payload)).toThrow();
    });

    test('Happy Path: should validate walk-in customer with empty or missing phone', () => {
      const payload = {
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1
          }
        ],
        customerInfo: {
          fullName: 'Khách Vãng Lai',
          phone: ''
        }
      };

      const result = posCheckoutSchema.parse(payload);
      expect(result.customerInfo.fullName).toBe('Khách Vãng Lai');
      expect(result.customerInfo.phone).toBe('');
    });
  });

  describe('b2cCheckoutSchema', () => {
    test('Happy Path: should validate valid B2C checkout', () => {
      const payload = {
        branchId: validObjectId,
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Tran Thi B',
          phone: '0987654321',
          address: '123 Nguyen Hue, Q1, TP.HCM'
        },
        paymentMethod: PAYMENT_METHODS.VNPAY
      };

      const result = b2cCheckoutSchema.parse(payload);
      expect(result.branchId).toBe(validObjectId);
      expect(result.paymentMethod).toBe('VNPAY');
    });

    test('Happy Path: should validate B2C checkout with CASH (COD)', () => {
      const payload = {
        branchId: validObjectId,
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Tran Thi B',
          phone: '0987654321',
          address: '123 Nguyen Hue, Q1, TP.HCM'
        },
        paymentMethod: PAYMENT_METHODS.CASH
      };

      const result = b2cCheckoutSchema.parse(payload);
      expect(result.paymentMethod).toBe('CASH');
    });


    test('Negative Path: should reject when branchId is missing or invalid', () => {
      const payload = {
        branchId: 'invalid-id',
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Tran Thi B',
          phone: '0987654321',
          address: '123 Nguyen Hue'
        },
        paymentMethod: PAYMENT_METHODS.VNPAY
      };

      expect(() => b2cCheckoutSchema.parse(payload)).toThrow();
    });

    test('Negative Path: should reject invalid payment method for B2C', () => {
      const payload = {
        branchId: validObjectId,
        items: [
          {
            productId: validObjectId,
            productSkuId: validObjectId,
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Tran Thi B',
          phone: '0987654321',
          address: '123 Nguyen Hue'
        },
        paymentMethod: 'BITCOIN'
      };

      expect(() => b2cCheckoutSchema.parse(payload)).toThrow();
    });
  });
});
