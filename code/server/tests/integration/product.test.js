import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';

setupTestDB();

describe('Product Module Integration Tests', () => {
  let superAdminToken;
  let customerToken;
  let staffToken;
  let categoryLaptop;
  let categoryPhone;

  beforeEach(async () => {
    // 1. Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.prod@techstore.com',
      phone: '0911777888',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.prod@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 2. Customer
    await User.create({
      fullName: 'Customer User',
      email: 'customer.prod@techstore.com',
      phone: '0922777888',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.prod@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;

    // 3. Staff
    await User.create({
      fullName: 'Staff User',
      email: 'staff.prod@techstore.com',
      phone: '0933777888',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      isActive: true
    });
    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.prod@techstore.com',
      password: 'Pass@123'
    });
    staffToken = staffLogin.body.data.accessToken;

    // 4. Seed Category
    categoryLaptop = await Category.create({
      name: 'Laptop & Máy Tính',
      slug: 'laptop-may-tinh',
      attributeKeys: ['cpu', 'ram', 'vga', 'storage'],
      isActive: true
    });

    categoryPhone = await Category.create({
      name: 'Điện Thoại',
      slug: 'dien-thoai',
      attributeKeys: ['screen_size', 'battery'],
      isActive: true
    });
  });

  describe('POST /api/v1/products (Create Product)', () => {
    test('Happy Path: should allow SUPER_ADMIN to create product with valid attributes and SKUs', async () => {
      const payload = {
        name: 'Laptop Asus TUF Gaming F15',
        categoryId: categoryLaptop._id.toString(),
        brand: 'Asus',
        description: 'Laptop gaming hiệu năng cao chip i7',
        isSerialManaged: true,
        attributes: [
          { key: 'cpu', value: 'Intel i7' },
          { key: 'ram', value: '16GB' }
        ],
        options: [
          {
            name: 'Màu sắc',
            displayType: 'button',
            values: ['Xám Mecha', 'Đen']
          }
        ],
        skus: [
          {
            sku: 'ASUS-TUF-F15-01',
            price: 25000000,
            salePrice: 23500000,
            images: ['https://example.com/asus1.jpg'],
            optionValues: [{ optionName: 'Màu sắc', value: 'Xám Mecha' }]
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('Laptop Asus TUF Gaming F15');
      expect(res.body.data.product.slug).toBe('laptop-asus-tuf-gaming-f15');
      expect(res.body.data.product.skus[0].sku).toBe('ASUS-TUF-F15-01');
      expect(res.body.data.product.skus[0].salePrice).toBe(23500000);
      expect(res.body.data.product.attributes).toEqual([
        { key: 'cpu', value: 'Intel i7' },
        { key: 'ram', value: '16GB' }
      ]);

      const dbProduct = await Product.findOne({ slug: 'laptop-asus-tuf-gaming-f15' });
      expect(dbProduct).toBeDefined();
      expect(dbProduct.isSerialManaged).toBe(true);
    });

    test('Negative Path: should reject creation when attribute key is not in Category.attributeKeys', async () => {
      const payload = {
        name: 'Laptop Asus ROG Strix',
        categoryId: categoryLaptop._id.toString(),
        brand: 'Asus',
        attributes: [
          { key: 'cpu', value: 'AMD Ryzen 9' },
          { key: 'memory_fake', value: 'Invalid Value' }
        ],
        skus: [
          {
            sku: 'ROG-STRIX-01',
            price: 45000000,
            salePrice: 42000000
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_ATTRIBUTE_KEY');
      expect(res.body.message).toContain('memory_fake');
    });

    test('Negative Path: should fail validation when salePrice > price in SKU', async () => {
      const payload = {
        name: 'Laptop Dell XPS 13',
        categoryId: categoryLaptop._id.toString(),
        brand: 'Dell',
        attributes: [{ key: 'cpu', value: 'Intel i5' }],
        skus: [
          {
            sku: 'DELL-XPS-01',
            price: 20000000,
            salePrice: 25000000 // Invalid: salePrice > price
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    test('Negative Path: should return 404 when categoryId does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const payload = {
        name: 'Laptop Acer Nitro',
        categoryId: fakeId,
        brand: 'Acer',
        attributes: [{ key: 'cpu', value: 'Intel i5' }],
        skus: [
          {
            sku: 'ACER-NITRO-01',
            price: 18000000
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('CATEGORY_NOT_FOUND');
    });

    test('Security / RBAC: should forbid CUSTOMER and STAFF from creating products', async () => {
      const payload = {
        name: 'Hacked Product',
        categoryId: categoryLaptop._id.toString(),
        brand: 'Generic',
        skus: [{ sku: 'HACK-01', price: 1000 }]
      };

      const resCustomer = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(resCustomer.status).toBe(403);
      expect(resCustomer.body.errorCode).toBe('FORBIDDEN');

      const resStaff = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(payload);

      expect(resStaff.status).toBe(403);
      expect(resStaff.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/products (List, Dynamic Filter Engine, Price Range, Search & Sort)', () => {
    beforeEach(async () => {
      // Seed Product 1: Asus TUF - RAM 16GB, CPU Intel i7, Price 23.5M
      await Product.create({
        name: 'Laptop Asus TUF Gaming A15',
        slug: 'laptop-asus-tuf-gaming-a15',
        categoryId: categoryLaptop._id,
        brand: 'Asus',
        attributes: [
          { key: 'cpu', value: 'Intel i7' },
          { key: 'ram', value: '16GB' }
        ],
        skus: [
          {
            sku: 'ASUS-A15-01',
            price: 25000000,
            salePrice: 23500000,
            isActive: true
          }
        ],
        isActive: true
      });

      // Seed Product 2: MSI Raider - RAM 32GB, CPU Intel i9, Price 45M
      await Product.create({
        name: 'Laptop MSI Raider GE78',
        slug: 'laptop-msi-raider-ge78',
        categoryId: categoryLaptop._id,
        brand: 'MSI',
        attributes: [
          { key: 'cpu', value: 'Intel i9' },
          { key: 'ram', value: '32GB' }
        ],
        skus: [
          {
            sku: 'MSI-GE78-01',
            price: 50000000,
            salePrice: 45000000,
            isActive: true
          }
        ],
        isActive: true
      });

      // Seed Product 3: Phone iPhone 15 Pro Max
      await Product.create({
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        categoryId: categoryPhone._id,
        brand: 'Apple',
        attributes: [
          { key: 'screen_size', value: '6.7 inch' },
          { key: 'battery', value: '4422 mAh' }
        ],
        skus: [
          {
            sku: 'IPHONE-15PM-256',
            price: 32000000,
            salePrice: 29990000,
            isActive: true
          }
        ],
        isActive: true
      });
    });

    test('Happy Path: should return all active products with pagination metadata', async () => {
      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBe(3);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(12);
    });

    test('Happy Path - Dynamic Query Filtering: should filter by single dynamic attribute (?ram=16GB)', async () => {
      const res = await request(app).get('/api/v1/products?ram=16GB');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].slug).toBe('laptop-asus-tuf-gaming-a15');
      expect(res.body.meta.total).toBe(1);
    });

    test('Happy Path - Dynamic Query Filtering: should filter by multiple dynamic attributes (?ram=16GB&cpu=Intel i7)', async () => {
      const res = await request(app).get('/api/v1/products?ram=16GB&cpu=Intel i7');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].slug).toBe('laptop-asus-tuf-gaming-a15');
    });

    test('Happy Path - Dynamic Query Filtering: should return empty list when no product matches dynamic attribute', async () => {
      const res = await request(app).get('/api/v1/products?ram=64GB');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBe(0);
      expect(res.body.meta.total).toBe(0);
    });

    test('Happy Path - Price Range Filtering: should filter products by SKU salePrice range', async () => {
      const res = await request(app).get('/api/v1/products?minPrice=20000000&maxPrice=30000000');

      expect(res.status).toBe(200);
      // Asus (23.5M) and iPhone (29.99M) match; MSI (45M) does not
      expect(res.body.data.products.length).toBe(2);
      const slugs = res.body.data.products.map((p) => p.slug);
      expect(slugs).toContain('laptop-asus-tuf-gaming-a15');
      expect(slugs).toContain('iphone-15-pro-max');
    });

    test('Happy Path - Category & Brand Filtering: should filter by category slug and brand', async () => {
      const resCategory = await request(app).get('/api/v1/products?category=laptop-may-tinh');
      expect(resCategory.status).toBe(200);
      expect(resCategory.body.data.products.length).toBe(2);

      const resBrand = await request(app).get('/api/v1/products?brand=Apple');
      expect(resBrand.status).toBe(200);
      expect(resBrand.body.data.products.length).toBe(1);
      expect(resBrand.body.data.products[0].brand).toBe('Apple');
    });

    test('Happy Path - Keyword Search: should search by text in product name or brand', async () => {
      const res = await request(app).get('/api/v1/products?search=raider');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].slug).toBe('laptop-msi-raider-ge78');
    });

    test('Happy Path - Sorting: should sort correctly by price_asc and price_desc', async () => {
      const resAsc = await request(app).get('/api/v1/products?sortBy=price_asc');
      expect(resAsc.status).toBe(200);
      // Lowest salePrice is Asus 23.5M
      expect(resAsc.body.data.products[0].slug).toBe('laptop-asus-tuf-gaming-a15');

      const resDesc = await request(app).get('/api/v1/products?sortBy=price_desc');
      expect(resDesc.status).toBe(200);
      // Highest salePrice is MSI 45M
      expect(resDesc.body.data.products[0].slug).toBe('laptop-msi-raider-ge78');
    });

    test('Happy Path - Sorting & Facets: should accept sortBy=popular and return availableBrands facets', async () => {
      const resPopular = await request(app).get('/api/v1/products?category=laptop-may-tinh&sortBy=popular');
      expect(resPopular.status).toBe(200);
      expect(resPopular.body.data.products.length).toBe(2);

      // Check availableBrands in meta and data
      expect(resPopular.body.meta.availableBrands).toBeDefined();
      expect(Array.isArray(resPopular.body.meta.availableBrands)).toBe(true);
      const brands = resPopular.body.meta.availableBrands;
      expect(brands).toEqual(
        expect.arrayContaining([
          { brand: 'Asus', count: 1 },
          { brand: 'MSI', count: 1 }
        ])
      );
    });
  });

  describe('GET /api/v1/products/:slug (Product Detail)', () => {
    beforeEach(async () => {
      await Product.create({
        name: 'MacBook Pro M3 Max',
        slug: 'macbook-pro-m3-max',
        categoryId: categoryLaptop._id,
        brand: 'Apple',
        attributes: [{ key: 'cpu', value: 'Apple M3 Max' }],
        skus: [
          {
            sku: 'MBP-M3MAX-01',
            price: 89000000,
            salePrice: 85000000,
            isActive: true
          }
        ],
        isActive: true
      });
    });

    test('Happy Path: should return product detail with populated category and attributeKeys', async () => {
      const res = await request(app).get('/api/v1/products/macbook-pro-m3-max');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('MacBook Pro M3 Max');
      expect(res.body.data.product.categoryId.slug).toBe('laptop-may-tinh');
      expect(res.body.data.product.categoryId.attributeKeys).toBeDefined();
    });

    test('Negative Path: should return 404 when product slug not found', async () => {
      const res = await request(app).get('/api/v1/products/non-existent-product-slug');

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('PUT & DELETE /api/v1/products/:id (Update & Soft Delete)', () => {
    let targetProductId;

    beforeEach(async () => {
      const prod = await Product.create({
        name: 'HP Pavilion 14',
        slug: 'hp-pavilion-14',
        categoryId: categoryLaptop._id,
        brand: 'HP',
        attributes: [{ key: 'cpu', value: 'Intel i5' }],
        skus: [
          {
            sku: 'HP-PAV-14-01',
            price: 16000000,
            salePrice: 15000000,
            isActive: true
          }
        ],
        isActive: true
      });
      targetProductId = prod._id.toString();
    });

    test('Happy Path: should allow SUPER_ADMIN to update product and attributes', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${targetProductId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'HP Pavilion 14 Plus 2024',
          attributes: [
            { key: 'cpu', value: 'Intel i7' },
            { key: 'ram', value: '16GB' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('HP Pavilion 14 Plus 2024');
      expect(res.body.data.product.slug).toBe('hp-pavilion-14-plus-2024');
      expect(res.body.data.product.attributes.length).toBe(2);
    });

    test('Negative Path: should reject update with invalid attribute key', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${targetProductId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          attributes: [{ key: 'invalid_gpu_spec', value: 'RTX 9999' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_ATTRIBUTE_KEY');
    });

    test('Happy Path: should allow SUPER_ADMIN to soft delete product', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${targetProductId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbProd = await Product.findById(targetProductId);
      expect(dbProd.isActive).toBe(false);

      // Verify that public GET returns 404
      const getRes = await request(app).get('/api/v1/products/hp-pavilion-14');
      expect(getRes.status).toBe(404);
    });

    test('Security / RBAC: should block non-admin from updating or deleting product', async () => {
      const putRes = await request(app)
        .put(`/api/v1/products/${targetProductId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Hacked HP' });

      expect(putRes.status).toBe(403);
      expect(putRes.body.errorCode).toBe('FORBIDDEN');

      const delRes = await request(app)
        .delete(`/api/v1/products/${targetProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(delRes.status).toBe(403);
      expect(delRes.body.errorCode).toBe('FORBIDDEN');
    });
  });
});
