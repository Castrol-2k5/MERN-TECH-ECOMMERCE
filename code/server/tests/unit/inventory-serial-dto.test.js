import { adjustStockSchema } from '../../src/modules/inventory/inventory.dto.js';
import { importSerialsSchema, verifySerialSchema } from '../../src/modules/serials/serial.dto.js';

describe('Inventory & Serial DTO Unit Tests (Zod)', () => {
  const validObjectId = '650c1f2e1234567890abcdef';

  describe('adjustStockSchema', () => {
    test('Happy Path: should validate successfully with positive quantityDelta', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        quantityDelta: 10,
        reason: 'Restock'
      };

      const result = adjustStockSchema.parse(payload);
      expect(result.quantityDelta).toBe(10);
      expect(result.reason).toBe('Restock');
    });

    test('Happy Path: should validate successfully with negative quantityDelta', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        quantityDelta: -5,
        reason: 'Damage deduction'
      };

      const result = adjustStockSchema.parse(payload);
      expect(result.quantityDelta).toBe(-5);
    });

    test('Negative Path: should fail when quantityDelta is 0', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        quantityDelta: 0,
        reason: 'Zero delta'
      };

      expect(() => adjustStockSchema.parse(payload)).toThrow();
    });

    test('Negative Path: should fail when reason is missing or empty', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        quantityDelta: 5,
        reason: '   '
      };

      expect(() => adjustStockSchema.parse(payload)).toThrow();
    });

    test('Negative Path: should fail when branchId is invalid ObjectId', () => {
      const payload = {
        branchId: 'invalid-id',
        productId: validObjectId,
        productSkuId: validObjectId,
        quantityDelta: 5,
        reason: 'Valid reason'
      };

      expect(() => adjustStockSchema.parse(payload)).toThrow();
    });
  });

  describe('importSerialsSchema', () => {
    test('Happy Path: should parse and uppercase valid serial numbers', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        serials: ['sn-001', 'sn-002', 'sn-003']
      };

      const result = importSerialsSchema.parse(payload);
      expect(result.serials).toEqual(['SN-001', 'SN-002', 'SN-003']);
    });

    test('Negative Path: should reject empty serials array', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        serials: []
      };

      expect(() => importSerialsSchema.parse(payload)).toThrow();
    });

    test('Negative Path: should reject duplicates within serials array', () => {
      const payload = {
        branchId: validObjectId,
        productId: validObjectId,
        productSkuId: validObjectId,
        serials: ['SN-001', 'sn-001']
      };

      expect(() => importSerialsSchema.parse(payload)).toThrow();
    });
  });

  describe('verifySerialSchema', () => {
    test('Happy Path: should validate non-empty serial number', () => {
      const result = verifySerialSchema.parse({ serialNumber: 'ABC123456' });
      expect(result.serialNumber).toBe('ABC123456');
    });

    test('Negative Path: should reject empty serial number', () => {
      expect(() => verifySerialSchema.parse({ serialNumber: '   ' })).toThrow();
    });
  });
});
