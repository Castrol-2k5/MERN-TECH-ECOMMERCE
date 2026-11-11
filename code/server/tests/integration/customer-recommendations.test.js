import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';

setupTestDB();

describe('Customer Omnichannel Wave 2: Accessory Cross-sell Recommendations', () => {
  let branch;
  let laptopCat;
  let accessoryCat;
  let audioCat;
  let laptopProd;
  let mouseProd;
  let headsetProd;
  let outOfStockCable;

  beforeEach(async () => {
    branch = await Branch.create({
      branchCode: 'BR-REC-01',
      name: 'Showroom Q1 Rec Test',
      address: '100 Đồng Khởi, Q1',
      phone: '0901333444',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    [laptopCat, accessoryCat, audioCat] = await Category.create([
      { name: 'Laptop', slug: 'laptop', isActive: true },
      { name: 'Phụ kiện', slug: 'phu-kien', isActive: true },
      { name: 'Âm thanh', slug: 'am-thanh', isActive: true }
    ]);

    laptopProd = await Product.create({
      name: 'Laptop Ultrabook X1',
      slug: 'laptop-ultrabook-x1',
      categoryId: laptopCat._id,
      brand: 'Lenovo',
      isActive: true,
      skus: [{ sku: 'LTP-X1', price: 32000000, salePrice: 0, costPrice: 25000000, isActive: true }]
    });

    mouseProd = await Product.create({
      name: 'Chuột Logitech MX Master 3S',
      slug: 'chuot-logitech-mx-master-3s',
      categoryId: accessoryCat._id,
      brand: 'Logitech',
      isActive: true,
      skus: [{ sku: 'ACC-MX3S', price: 2490000, salePrice: 2190000, costPrice: 1600000, isActive: true }]
    });

    headsetProd = await Product.create({
      name: 'Tai nghe Sony WH-1000XM5',
      slug: 'tai-nghe-sony-wh-1000xm5',
      categoryId: audioCat._id,
      brand: 'Sony',
      isActive: true,
      skus: [{ sku: 'AUD-XM5', price: 7990000, salePrice: 0, costPrice: 5500000, isActive: true }]
    });

    outOfStockCable = await Product.create({
      name: 'Cáp USB-C Thunderbolt (Hết hàng)',
      slug: 'cap-usb-c-tb4',
      categoryId: accessoryCat._id,
      brand: 'Anker',
      isActive: true,
      skus: [{ sku: 'ACC-CABLE-0', price: 590000, salePrice: 0, costPrice: 300000, isActive: true }]
    });

    // Inactive accessory must be excluded
    await Product.create({
      name: 'Chuột Ngừng Bán',
      slug: 'chuot-ngung-ban',
      categoryId: accessoryCat._id,
      brand: 'Generic',
      isActive: false,
      skus: [{ sku: 'ACC-DEAD', price: 200000, isActive: true }]
    });

    await BranchInventory.create([
      {
        branchId: branch._id,
        productId: mouseProd._id,
        productSkuId: mouseProd.skus[0]._id,
        quantity: 12
      },
      {
        branchId: branch._id,
        productId: headsetProd._id,
        productSkuId: headsetProd.skus[0]._id,
        quantity: 6
      },
      {
        branchId: branch._id,
        productId: outOfStockCable._id,
        productSkuId: outOfStockCable.skus[0]._id,
        quantity: 0
      }
    ]);
  });

  it('recommends in-stock accessories/audio for a Laptop, excludes seed product, and hides costPrice', async () => {
    const res = await request(app)
      .get('/api/v1/products/recommendations')
      .query({ productIds: String(laptopProd._id), limit: 3 });

    expect(res.statusCode).toBe(200);
    const { products, strategy } = res.body.data;
    expect(strategy).toBe('ACCESSORY_CROSS_SELL');
    expect(products).toHaveLength(3);

    const slugs = products.map((p) => p.slug);
    expect(slugs).not.toContain('laptop-ultrabook-x1');
    expect(slugs).not.toContain('chuot-ngung-ban');
    // Top 2 must be the in-stock accessories
    expect(slugs.slice(0, 2)).toContain('chuot-logitech-mx-master-3s');
    expect(slugs.slice(0, 2)).toContain('tai-nghe-sony-wh-1000xm5');
    expect(products[0].availableStock).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).not.toContain('costPrice');
  });

  it('excludes viewed accessory and switches strategy to COMPLEMENTARY_ACCESSORY', async () => {
    const res = await request(app)
      .get('/api/v1/products/recommendations')
      .query({ productIds: String(mouseProd._id), limit: 4, branchId: String(branch._id) });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.strategy).toBe('COMPLEMENTARY_ACCESSORY');
    const ids = res.body.data.products.map((p) => String(p._id));
    expect(ids).not.toContain(String(mouseProd._id));
    expect(ids).toContain(String(headsetProd._id));
  });
});
