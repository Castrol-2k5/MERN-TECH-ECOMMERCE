import {
  User,
  Session,
  Branch,
  Category,
  Product,
  BranchInventory,
  Serial,
  Order,
  WarrantyTicket
} from '../../src/models/index.js';

describe('MongoDB Models & Indexing Verification', () => {
  test('User model: should define required single and unique indexes', () => {
    const indexes = User.schema.indexes();
    const indexFields = indexes.map(([spec]) => spec);

    expect(indexFields).toEqual(
      expect.arrayContaining([
        { email: 1 },
        { phone: 1 },
        { role: 1 },
        { branchId: 1 }
      ])
    );

    // Verify unique constraints
    const emailIndex = indexes.find(([spec]) => spec.email === 1);
    expect(emailIndex[1]?.unique).toBe(true);

    const phoneIndex = indexes.find(([spec]) => spec.phone === 1);
    expect(phoneIndex[1]?.unique).toBe(true);
  });

  test('Session model: should define Compound Index and TTL Index', () => {
    const indexes = Session.schema.indexes();

    // Compound Index: { userId: 1, refreshTokenHash: 1 }
    const compoundIndex = indexes.find(
      ([spec]) => spec.userId === 1 && spec.refreshTokenHash === 1
    );
    expect(compoundIndex).toBeDefined();

    // TTL Index on expiresAt: { expireAfterSeconds: 0 }
    const ttlIndex = indexes.find(([spec]) => spec.expiresAt === 1);
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex[1]?.expireAfterSeconds).toBe(0);
  });

  test('Branch model: should define Unique branchCode and 2dsphere GPS location Index', () => {
    const indexes = Branch.schema.indexes();

    const branchCodeIndex = indexes.find(([spec]) => spec.branchCode === 1);
    expect(branchCodeIndex).toBeDefined();
    expect(branchCodeIndex[1]?.unique).toBe(true);

    const locationIndex = indexes.find(([spec]) => spec.location === '2dsphere');
    expect(locationIndex).toBeDefined();
  });

  test('Category model: should define Unique slug and Single parentId Index', () => {
    const indexes = Category.schema.indexes();

    const slugIndex = indexes.find(([spec]) => spec.slug === 1);
    expect(slugIndex).toBeDefined();
    expect(slugIndex[1]?.unique).toBe(true);

    const parentIdIndex = indexes.find(([spec]) => spec.parentId === 1);
    expect(parentIdIndex).toBeDefined();
  });

  test('Product model: should define Multikey Compound Index on attributes and single index on skus.sku', () => {
    const indexes = Product.schema.indexes();

    // Multikey compound index on dynamic attributes: { "attributes.key": 1, "attributes.value": 1 }
    const dynamicAttrIndex = indexes.find(
      ([spec]) => spec['attributes.key'] === 1 && spec['attributes.value'] === 1
    );
    expect(dynamicAttrIndex).toBeDefined();

    // Single index on embedded sku
    const skuIndex = indexes.find(([spec]) => spec['skus.sku'] === 1);
    expect(skuIndex).toBeDefined();

    // Category and Brand indexes
    expect(indexes.find(([spec]) => spec.categoryId === 1)).toBeDefined();
    expect(indexes.find(([spec]) => spec.brand === 1)).toBeDefined();
  });

  test('BranchInventory model: should define Compound Unique Index on branchId and productSkuId', () => {
    const indexes = BranchInventory.schema.indexes();

    const compoundUnique = indexes.find(
      ([spec]) => spec.branchId === 1 && spec.productSkuId === 1
    );
    expect(compoundUnique).toBeDefined();
    expect(compoundUnique[1]?.unique).toBe(true);

    const productIndex = indexes.find(([spec]) => spec.productId === 1);
    expect(productIndex).toBeDefined();
  });

  test('Serial model: should define Unique serialNumber and Compound POS Index', () => {
    const indexes = Serial.schema.indexes();

    const serialNumIndex = indexes.find(([spec]) => spec.serialNumber === 1);
    expect(serialNumIndex).toBeDefined();
    expect(serialNumIndex[1]?.unique).toBe(true);

    // Compound POS Index: { branchId: 1, status: 1, productSkuId: 1 }
    const posIndex = indexes.find(
      ([spec]) => spec.branchId === 1 && spec.status === 1 && spec.productSkuId === 1
    );
    expect(posIndex).toBeDefined();
  });

  test('Order model: should define Unique orderCode, Compound Sales Index, customerId and orderStatus', () => {
    const indexes = Order.schema.indexes();

    const orderCodeIndex = indexes.find(([spec]) => spec.orderCode === 1);
    expect(orderCodeIndex).toBeDefined();
    expect(orderCodeIndex[1]?.unique).toBe(true);

    // Compound Sales Index: { branchId: 1, createdAt: -1 }
    const salesIndex = indexes.find(
      ([spec]) => spec.branchId === 1 && spec.createdAt === -1
    );
    expect(salesIndex).toBeDefined();

    expect(indexes.find(([spec]) => spec.customerId === 1)).toBeDefined();
    expect(indexes.find(([spec]) => spec.orderStatus === 1)).toBeDefined();
  });

  test('WarrantyTicket model: should define Unique ticketCode, serialNumber and customerId Index', () => {
    const indexes = WarrantyTicket.schema.indexes();

    const ticketCodeIndex = indexes.find(([spec]) => spec.ticketCode === 1);
    expect(ticketCodeIndex).toBeDefined();
    expect(ticketCodeIndex[1]?.unique).toBe(true);

    expect(indexes.find(([spec]) => spec.serialNumber === 1)).toBeDefined();
    expect(indexes.find(([spec]) => spec.customerId === 1)).toBeDefined();
  });
});
