import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';
import { Cart } from '../../src/modules/cart/cart.model.js';

setupTestDB();

describe('Customer Omnichannel Wave 1: Order Sync (POS+Online) & Hybrid Cart', () => {
  let branchA;
  let branchB;
  let category;
  let product;
  let skuA;
  let skuB;
  let customerUser;
  let otherCustomer;
  let customerToken;
  let otherCustomerToken;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-CUS-01',
      name: 'Showroom Q1 Test',
      address: '123 Nguyễn Huệ, Q1',
      phone: '0901000111',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-CUS-02',
      name: 'Showroom Q7 Test',
      address: '456 Nguyễn Thị Thập, Q7',
      phone: '0901000222',
      location: { type: 'Point', coordinates: [106.71, 10.74] },
      isActive: true
    });

    category = await Category.create({
      name: 'Laptop Test',
      slug: 'laptop-test',
      isActive: true
    });

    product = await Product.create({
      name: 'MacBook Pro M4 Test',
      slug: 'macbook-pro-m4-test',
      categoryId: category._id,
      brand: 'Apple',
      images: ['https://example.com/mbp.jpg'],
      isActive: true,
      skus: [
        {
          sku: 'MBP-M4-16-512',
          price: 45000000,
          salePrice: 42500000,
          costPrice: 36000000,
          isActive: true,
          optionValues: [{ optionName: 'RAM', value: '16GB' }]
        },
        {
          sku: 'MBP-M4-32-1TB',
          price: 55000000,
          salePrice: 0,
          costPrice: 44000000,
          isActive: true,
          optionValues: [{ optionName: 'RAM', value: '32GB' }]
        }
      ]
    });

    skuA = product.skus[0];
    skuB = product.skus[1];

    await BranchInventory.create([
      {
        branchId: branchA._id,
        productId: product._id,
        productSkuId: skuA._id,
        quantity: 2
      },
      {
        branchId: branchB._id,
        productId: product._id,
        productSkuId: skuA._id,
        quantity: 5
      },
      {
        branchId: branchA._id,
        productId: product._id,
        productSkuId: skuB._id,
        quantity: 4
      }
    ]);

    customerUser = await User.create({
      fullName: 'Khách Hàng Omnichannel',
      email: 'omni.customer@test.com',
      phone: '0909888777',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });

    otherCustomer = await User.create({
      fullName: 'Khách Hàng Khác',
      email: 'other.customer@test.com',
      phone: '0901111222',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'omni.customer@test.com',
      password: 'Pass@123'
    });
    customerToken = loginRes.body.data.accessToken;

    const otherLoginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'other.customer@test.com',
      password: 'Pass@123'
    });
    otherCustomerToken = otherLoginRes.body.data.accessToken;
  });

  describe('UC-CUS-01: Đồng bộ lịch sử đơn POS + Online theo SĐT', () => {
    it('returns Online orders (customerId) AND POS orders matching normalized phone (+84 / 0)', async () => {
      await Order.create([
        {
          orderCode: 'ORD-ONLINE-001',
          orderType: ORDER_TYPES.B2C_ONLINE,
          branchId: branchA._id,
          customerId: customerUser._id,
          customerInfo: { fullName: 'Khách Hàng Omnichannel', phone: '0909888777' },
          items: [
            {
              productId: product._id,
              productSkuId: skuA._id,
              productName: product.name,
              sku: skuA.sku,
              quantity: 1,
              unitPrice: 42500000,
              subtotal: 42500000
            }
          ],
          totalAmount: 42500000,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentStatus: PAYMENT_STATUS.PAID,
          orderStatus: ORDER_STATUS.COMPLETED
        },
        {
          orderCode: 'ORD-POS-84',
          orderType: ORDER_TYPES.POS_STORE,
          branchId: branchB._id,
          customerId: null,
          customerInfo: { fullName: 'Khách Vãng Lai Quầy', phone: '+84909888777' },
          items: [
            {
              productId: product._id,
              productSkuId: skuB._id,
              productName: product.name,
              sku: skuB.sku,
              quantity: 1,
              unitPrice: 55000000,
              subtotal: 55000000,
              serialsAssigned: ['SN-POS-84-001']
            }
          ],
          totalAmount: 55000000,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentStatus: PAYMENT_STATUS.PAID,
          orderStatus: ORDER_STATUS.COMPLETED
        },
        {
          orderCode: 'ORD-OTHER-001',
          orderType: ORDER_TYPES.POS_STORE,
          branchId: branchA._id,
          customerId: otherCustomer._id,
          customerInfo: { fullName: 'Khách Khác', phone: '0901111222' },
          items: [
            {
              productId: product._id,
              productSkuId: skuA._id,
              productName: product.name,
              sku: skuA.sku,
              quantity: 1,
              unitPrice: 42500000,
              subtotal: 42500000
            }
          ],
          totalAmount: 42500000,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentStatus: PAYMENT_STATUS.PAID,
          orderStatus: ORDER_STATUS.COMPLETED
        }
      ]);

      const listRes = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.meta.total).toBe(2);
      const codes = listRes.body.data.orders.map((o) => o.orderCode);
      expect(codes).toContain('ORD-ONLINE-001');
      expect(codes).toContain('ORD-POS-84');
      expect(codes).not.toContain('ORD-OTHER-001');

      // Detail access for POS +84 order
      const detailRes = await request(app)
        .get('/api/v1/orders/my-orders/ORD-POS-84')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(detailRes.statusCode).toBe(200);
      expect(detailRes.body.data.order.items[0].serialsAssigned).toContain('SN-POS-84-001');

      // Other customer cannot view ORD-POS-84
      const deniedRes = await request(app)
        .get('/api/v1/orders/my-orders/ORD-POS-84')
        .set('Authorization', `Bearer ${otherCustomerToken}`);
      expect(deniedRes.statusCode).toBe(404);
    });
  });

  describe('UC-CUS-02: Hybrid Cart Sync & Real-time Stock Check', () => {
    it('previews cart for guest with live salePrice, branch stock flags, and never exposes costPrice', async () => {
      const res = await request(app)
        .post('/api/v1/cart/preview')
        .send({
          branchId: String(branchA._id),
          items: [
            {
              productId: String(product._id),
              productSkuId: String(skuA._id),
              quantity: 3 // branchA only has 2!
            }
          ]
        });

      expect(res.statusCode).toBe(200);
      const { cart } = res.body.data;
      expect(cart.hasStockIssue).toBe(true);
      expect(cart.totalQuantity).toBe(3);
      expect(cart.totalAmount).toBe(42500000 * 3);
      expect(cart.items[0].unitPrice).toBe(42500000);
      expect(cart.items[0].availableStock).toBe(2);
      expect(cart.items[0].totalNetworkStock).toBe(7);
      expect(cart.items[0].isExceedingStock).toBe(true);
      expect(cart.items[0].stockStatus).toBe('EXCEEDS_STOCK');
      expect(JSON.stringify(res.body)).not.toContain('costPrice');
    });

    it('merges guest localStorage cart into DB Cart on login and syncs updates across sessions', async () => {
      // Seed existing DB cart for customer with 1x skuA
      await Cart.create({
        customerId: customerUser._id,
        selectedBranchId: branchB._id,
        items: [
          {
            productId: product._id,
            productSkuId: skuA._id,
            quantity: 1
          }
        ]
      });

      // Guest added 1x skuA + 1x skuB before logging in
      const mergeRes = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { productId: String(product._id), productSkuId: String(skuA._id), quantity: 1 },
            { productId: String(product._id), productSkuId: String(skuB._id), quantity: 1 }
          ]
        });

      expect(mergeRes.statusCode).toBe(200);
      const mergedCart = mergeRes.body.data.cart;
      expect(mergedCart.totalQuantity).toBe(3);
      expect(mergedCart.items).toHaveLength(2);
      const mergedSkuA = mergedCart.items.find((i) => i.productSkuId === String(skuA._id));
      expect(mergedSkuA.quantity).toBe(2);
      expect(mergedCart.selectedBranchId).toBe(String(branchB._id));

      // PUT /api/v1/cart updates quantity and branch
      const syncRes = await request(app)
        .put('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchId: String(branchA._id),
          items: [{ productId: String(product._id), productSkuId: String(skuB._id), quantity: 2 }]
        });

      expect(syncRes.statusCode).toBe(200);
      expect(syncRes.body.data.cart.totalQuantity).toBe(2);
      expect(syncRes.body.data.cart.hasStockIssue).toBe(false);

      // GET /api/v1/cart persists synced state
      const getRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data.cart.items).toHaveLength(1);
      expect(getRes.body.data.cart.items[0].quantity).toBe(2);
      expect(getRes.body.data.cart.selectedBranchId).toBe(String(branchA._id));

      // Unauthenticated GET /api/v1/cart rejected
      const unauthRes = await request(app).get('/api/v1/cart');
      expect(unauthRes.statusCode).toBe(401);
    });
  });
});
