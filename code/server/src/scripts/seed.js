import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  USER_ROLES,
  Branch,
  Category,
  Product,
  BranchInventory,
  Serial,
  SERIAL_STATUS,
  Order,
  ORDER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  ORDER_STATUS,
  WarrantyTicket,
  WARRANTY_STATUS,
  Session
} from '../models/index.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/mern_techstore_dev?replicaSet=rs0&directConnection=true';

async function seed() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  console.log(`✓ Connected to ${mongoose.connection.name}`);

  console.log('🧹 Cleaning up existing data in core collections...');
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    BranchInventory.deleteMany({}),
    Serial.deleteMany({}),
    Order.deleteMany({}),
    WarrantyTicket.deleteMany({}),
    Session.deleteMany({})
  ]);

  // Ensure indexes are properly synced (especially 2dsphere and unique constraints)
  await Promise.all([
    Branch.syncIndexes(),
    User.syncIndexes(),
    Category.syncIndexes(),
    Product.syncIndexes(),
    BranchInventory.syncIndexes(),
    Serial.syncIndexes(),
    Order.syncIndexes(),
    WarrantyTicket.syncIndexes(),
    Session.syncIndexes()
  ]);

  // ==========================================
  // Bước 1: Khởi tạo Danh mục Cửa hàng Chi nhánh (branches)
  // ==========================================
  const branchQ1 = await Branch.create({
    branchCode: 'BR-Q1',
    name: 'Chi nhánh Quận 1 - Flagship Store',
    address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '02839250001',
    location: {
      type: 'Point',
      coordinates: [106.6917, 10.7725]
    },
    isActive: true
  });

  const branchTDuc = await Branch.create({
    branchCode: 'BR-TDUC',
    name: 'Chi nhánh Thủ Đức - Tech Hub',
    address: '45 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '02838960002',
    location: {
      type: 'Point',
      coordinates: [106.7645, 10.8512]
    },
    isActive: true
  });

  // ==========================================
  // Bước 2: Khởi tạo Tài khoản Người dùng Mẫu (users)
  // Mật khẩu chung '123456' được hash tự động qua User pre('save') hook
  // ==========================================
  const [, , staffQ1User, , customerUser] = await User.create([
    {
      fullName: 'Nguyễn Văn Quản Trị',
      email: 'admin@techstore.com',
      phone: '0909000001',
      passwordHash: '123456',
      role: USER_ROLES.SUPER_ADMIN,
      branchId: null,
      isActive: true
    },
    {
      fullName: 'Trần Thị Trưởng Shop Q1',
      email: 'manager.q1@techstore.com',
      phone: '0909000002',
      passwordHash: '123456',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchQ1._id,
      isActive: true
    },
    {
      fullName: 'Lê Thu Ngân Q1',
      email: 'staff.q1@techstore.com',
      phone: '0909000003',
      passwordHash: '123456',
      role: USER_ROLES.STAFF,
      branchId: branchQ1._id,
      isActive: true
    },
    {
      fullName: 'Phạm Thu Ngân Thủ Đức',
      email: 'staff.tduc@techstore.com',
      phone: '0909000004',
      passwordHash: '123456',
      role: USER_ROLES.STAFF,
      branchId: branchTDuc._id,
      isActive: true
    },
    {
      fullName: 'Hoàng Khách Hàng',
      email: 'customer@gmail.com',
      phone: '0909000005',
      passwordHash: '123456',
      role: USER_ROLES.CUSTOMER,
      branchId: null,
      isActive: true
    }
  ]);

  // ==========================================
  // Bước 3: Khởi tạo Danh mục Sản phẩm Phân cấp & Attribute Keys (categories)
  // ==========================================
  const catLaptop = await Category.create({
    name: 'Laptop',
    slug: 'laptop',
    parentId: null,
    attributeKeys: ['cpu', 'ram', 'vga', 'screen_size', 'storage'],
    isActive: true
  });

  const catLaptopGaming = await Category.create({
    name: 'Laptop Gaming',
    slug: 'laptop-gaming',
    parentId: catLaptop._id,
    attributeKeys: ['cpu', 'ram', 'vga', 'refresh_rate', 'screen_size', 'storage'],
    isActive: true
  });

  const catPhoneTablet = await Category.create({
    name: 'Điện thoại & Tablet',
    slug: 'dien-thoai-tablet',
    parentId: null,
    attributeKeys: ['screen_size', 'storage', 'ram', 'camera', 'chipset'],
    isActive: true
  });

  const catIphone = await Category.create({
    name: 'iPhone',
    slug: 'iphone',
    parentId: catPhoneTablet._id,
    attributeKeys: ['screen_size', 'storage', 'color', 'chipset'],
    isActive: true
  });

  const catPhuKien = await Category.create({
    name: 'Bàn phím & Chuột',
    slug: 'phu-kien',
    parentId: null,
    attributeKeys: ['connection_type', 'dpi', 'led_rgb'],
    isActive: true
  });

  // ==========================================
  // Bước 4: Khởi tạo Sản phẩm Mẫu theo Hybrid Schema (products)
  // ==========================================
  const rogSku16Id = new mongoose.Types.ObjectId();
  const rogSku32Id = new mongoose.Types.ObjectId();

  const productRog = await Product.create({
    name: 'Laptop ASUS ROG Strix G16 (2024)',
    slug: 'laptop-asus-rog-strix-g16',
    brand: 'ASUS',
    categoryId: catLaptopGaming._id,
    isSerialManaged: true,
    isActive: true,
    description:
      'Chiến binh gaming cấu hình đỉnh cao trang bị Intel Gen 13 và card đồ họa RTX 40 Series.',
    images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45'],
    attributes: [
      { key: 'cpu', value: 'Intel Core i7-13650HX' },
      { key: 'vga', value: 'NVIDIA GeForce RTX 4060 8GB' },
      { key: 'screen_size', value: '16.0 inch' },
      { key: 'refresh_rate', value: '165Hz' }
    ],
    options: [
      { name: 'Dung lượng RAM', displayType: 'button', values: ['16GB', '32GB'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Eclipse Gray'] }
    ],
    skus: [
      {
        _id: rogSku16Id,
        sku: 'ROG-G16-16GB-GRY',
        price: 36990000,
        salePrice: 34990000,
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45'],
        optionValues: [
          { optionName: 'Dung lượng RAM', value: '16GB' },
          { optionName: 'Màu sắc', value: 'Eclipse Gray' }
        ],
        isActive: true
      },
      {
        _id: rogSku32Id,
        sku: 'ROG-G16-32GB-GRY',
        price: 41990000,
        salePrice: 39990000,
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45'],
        optionValues: [
          { optionName: 'Dung lượng RAM', value: '32GB' },
          { optionName: 'Màu sắc', value: 'Eclipse Gray' }
        ],
        isActive: true
      }
    ]
  });

  const ip15Sku256Id = new mongoose.Types.ObjectId();
  const ip15Sku512Id = new mongoose.Types.ObjectId();

  const productIphone = await Product.create({
    name: 'Điện thoại Apple iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    brand: 'Apple',
    categoryId: catIphone._id,
    isSerialManaged: true,
    isActive: true,
    description:
      'Siêu phẩm iPhone 15 Pro Max khung Titan chuẩn hàng không vũ trụ và chip A17 Pro mạnh mẽ.',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569'],
    attributes: [
      { key: 'chipset', value: 'Apple A17 Pro' },
      { key: 'screen_size', value: '6.7 inch Super Retina XDR' },
      { key: 'camera', value: '48MP + 12MP + 12MP' }
    ],
    options: [
      { name: 'Bộ nhớ trong', displayType: 'button', values: ['256GB', '512GB'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Titan Tự Nhiên', 'Titan Xanh'] }
    ],
    skus: [
      {
        _id: ip15Sku256Id,
        sku: 'IP15PM-256GB-NAT',
        price: 30990000,
        salePrice: 29490000,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569'],
        optionValues: [
          { optionName: 'Bộ nhớ trong', value: '256GB' },
          { optionName: 'Màu sắc', value: 'Titan Tự Nhiên' }
        ],
        isActive: true
      },
      {
        _id: ip15Sku512Id,
        sku: 'IP15PM-512GB-BLU',
        price: 36990000,
        salePrice: 35490000,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569'],
        optionValues: [
          { optionName: 'Bộ nhớ trong', value: '512GB' },
          { optionName: 'Màu sắc', value: 'Titan Xanh' }
        ],
        isActive: true
      }
    ]
  });

  const logiSkuHeroId = new mongoose.Types.ObjectId();

  const productLogitech = await Product.create({
    name: 'Chuột Chơi Game Logitech G502 HERO High Performance',
    slug: 'chuot-logitech-g502-hero',
    brand: 'Logitech',
    categoryId: catPhuKien._id,
    isSerialManaged: false,
    isActive: true,
    description:
      'Chuột chơi game hiệu năng cao trang bị cảm biến HERO 25K và hệ thống tạ tùy biến.',
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
    attributes: [
      { key: 'dpi', value: '25600 DPI' },
      { key: 'connection_type', value: 'Có dây (USB)' },
      { key: 'led_rgb', value: 'LIGHTSYNC RGB' }
    ],
    options: [],
    skus: [
      {
        _id: logiSkuHeroId,
        sku: 'LOGI-G502-HERO',
        price: 1290000,
        salePrice: 990000,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // ==========================================
  // Bước 5: Nạp Tồn Kho Chi Nhánh (branch_inventories) & Serials (serials)
  // Invariant Rule: Tổng serial IN_STOCK tại mỗi branch khớp với branch_inventories.quantity
  // ==========================================
  await BranchInventory.create([
    // Kho Chi nhánh Quận 1 (BR-Q1)
    {
      branchId: branchQ1._id,
      productId: productRog._id,
      productSkuId: rogSku16Id,
      quantity: 3
    },
    {
      branchId: branchQ1._id,
      productId: productRog._id,
      productSkuId: rogSku32Id,
      quantity: 1
    },
    {
      branchId: branchQ1._id,
      productId: productIphone._id,
      productSkuId: ip15Sku256Id,
      quantity: 2
    },
    {
      branchId: branchQ1._id,
      productId: productLogitech._id,
      productSkuId: logiSkuHeroId,
      quantity: 20
    },
    // Kho Chi nhánh Thủ Đức (BR-TDUC)
    {
      branchId: branchTDuc._id,
      productId: productRog._id,
      productSkuId: rogSku16Id,
      quantity: 1
    },
    {
      branchId: branchTDuc._id,
      productId: productIphone._id,
      productSkuId: ip15Sku256Id,
      quantity: 1
    },
    {
      branchId: branchTDuc._id,
      productId: productIphone._id,
      productSkuId: ip15Sku512Id,
      quantity: 0
    }
  ]);

  // Tạo 11 Serial Numbers: 8 IN_STOCK, 2 SOLD, 1 TRANSIT
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const eighteenMonthsAgo = new Date(Date.now() - 540 * 24 * 60 * 60 * 1000);

  const [, , , , , , , , , rogSoldExpiredSerial] = await Serial.create([
    // Q1 - IN_STOCK Serials
    {
      serialNumber: 'ROG16-Q1-001',
      productId: productRog._id,
      productSkuId: rogSku16Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    {
      serialNumber: 'ROG16-Q1-002',
      productId: productRog._id,
      productSkuId: rogSku16Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    {
      serialNumber: 'ROG16-Q1-003',
      productId: productRog._id,
      productSkuId: rogSku16Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    {
      serialNumber: 'ROG32-Q1-001',
      productId: productRog._id,
      productSkuId: rogSku32Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    {
      serialNumber: 'IP15-Q1-001',
      productId: productIphone._id,
      productSkuId: ip15Sku256Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    {
      serialNumber: 'IP15-Q1-002',
      productId: productIphone._id,
      productSkuId: ip15Sku256Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    // Thủ Đức - IN_STOCK Serials
    {
      serialNumber: 'ROG16-TD-001',
      productId: productRog._id,
      productSkuId: rogSku16Id,
      branchId: branchTDuc._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    {
      serialNumber: 'IP15-TD-001',
      productId: productIphone._id,
      productSkuId: ip15Sku256Id,
      branchId: branchTDuc._id,
      status: SERIAL_STATUS.IN_STOCK
    },
    // Serial SOLD - còn hạn bảo hành (e-Warranty screen P-07)
    {
      serialNumber: 'IP15-SOLD-VALID',
      productId: productIphone._id,
      productSkuId: ip15Sku256Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.SOLD,
      soldAt: sixMonthsAgo,
      warrantyEndDate: sixMonthsLater
    },
    // Serial SOLD - hết hạn bảo hành (Cảnh báo quá hạn)
    {
      serialNumber: 'ROG-SOLD-EXPIRED',
      productId: productRog._id,
      productSkuId: rogSku16Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.SOLD,
      soldAt: eighteenMonthsAgo,
      warrantyEndDate: sixMonthsAgo
    },
    // Serial TRANSIT - đang điều chuyển kho (Màn hình P-20)
    {
      serialNumber: 'IP15-TRANSIT-001',
      productId: productIphone._id,
      productSkuId: ip15Sku512Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.TRANSIT
    }
  ]);

  // ==========================================
  // Bước 6: Khởi tạo Đơn hàng Lịch sử & Phiếu Bảo hành Mẫu (orders & warrantytickets)
  // ==========================================
  const posOrderItemId = new mongoose.Types.ObjectId();
  const posOrder = await Order.create({
    orderCode: 'ORD-20261001-0001',
    orderType: ORDER_TYPES.POS_STORE,
    branchId: branchQ1._id,
    staffId: staffQ1User._id,
    customerId: null,
    customerInfo: {
      fullName: 'Lê Văn Thử Nghiệm',
      phone: '0912345678',
      address: 'Quận 1, TP.HCM'
    },
    items: [
      {
        _id: posOrderItemId,
        productId: productRog._id,
        productSkuId: rogSku16Id,
        productName: productRog.name,
        sku: 'ROG-G16-16GB-GRY',
        quantity: 1,
        unitPrice: 34990000,
        subtotal: 34990000,
        serialsAssigned: ['ROG-SOLD-EXPIRED']
      }
    ],
    totalAmount: 34990000,
    paymentMethod: PAYMENT_METHODS.CASH,
    paymentStatus: PAYMENT_STATUS.PAID,
    orderStatus: ORDER_STATUS.COMPLETED
  });

  // Liên kết serial đã bán với POS Order
  await Serial.updateOne(
    { _id: rogSoldExpiredSerial._id },
    { $set: { orderId: posOrder._id, orderItemId: posOrderItemId } }
  );

  const b2cOrderItemId = new mongoose.Types.ObjectId();
  await Order.create({
    orderCode: 'ORD-20261001-0002',
    orderType: ORDER_TYPES.B2C_ONLINE,
    branchId: branchQ1._id,
    customerId: customerUser._id,
    customerInfo: {
      fullName: customerUser.fullName,
      phone: customerUser.phone,
      address: '45 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM'
    },
    staffId: null,
    items: [
      {
        _id: b2cOrderItemId,
        productId: productLogitech._id,
        productSkuId: logiSkuHeroId,
        productName: productLogitech.name,
        sku: 'LOGI-G502-HERO',
        quantity: 1,
        unitPrice: 990000,
        subtotal: 990000,
        serialsAssigned: []
      }
    ],
    totalAmount: 990000,
    paymentMethod: PAYMENT_METHODS.VNPAY,
    paymentStatus: PAYMENT_STATUS.PAID,
    orderStatus: ORDER_STATUS.PROCESSING
  });

  // Seed thêm các đơn hàng đa dạng ngày và kênh cho Analytics BI & Dispatch Testing
  const sampleOrders = [
    {
      orderCode: 'ORD-20261002-0003',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchQ1._id,
      customerId: customerUser._id,
      customerInfo: {
        fullName: 'Nguyễn Hoàng Nam',
        phone: '0901234567',
        address: '124 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM'
      },
      items: [
        {
          productId: productIphone._id,
          productSkuId: ip15Sku256Id,
          productName: productIphone.name,
          sku: 'IP15PM-256-NAT',
          quantity: 1,
          unitPrice: 29490000,
          subtotal: 29490000,
          serialsAssigned: []
        }
      ],
      totalAmount: 29490000,
      paymentMethod: PAYMENT_METHODS.VNPAY,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.PENDING,
      createdAt: new Date(Date.now() - 86400000 * 2)
    },
    {
      orderCode: 'ORD-20261003-0004',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchTDuc._id,
      staffId: staffQ1User._id,
      customerId: null,
      customerInfo: {
        fullName: 'Trần Thị Mai',
        phone: '0988776655',
        address: 'TP. Thủ Đức, TP.HCM'
      },
      items: [
        {
          productId: productRog._id,
          productSkuId: rogSku32Id,
          productName: productRog.name,
          sku: 'ROG-G16-32GB-GRY',
          quantity: 1,
          unitPrice: 42990000,
          subtotal: 42990000,
          serialsAssigned: []
        }
      ],
      totalAmount: 42990000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED,
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      orderCode: 'ORD-20261004-0005',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchTDuc._id,
      customerId: customerUser._id,
      customerInfo: {
        fullName: 'Phạm Thu Hà',
        phone: '0903552211',
        address: '128 CMT8, Quận 3, TP.HCM'
      },
      items: [
        {
          productId: productLogitech._id,
          productSkuId: logiSkuHeroId,
          productName: productLogitech.name,
          sku: 'LOGI-G502-HERO',
          quantity: 2,
          unitPrice: 990000,
          subtotal: 1980000,
          serialsAssigned: []
        }
      ],
      totalAmount: 1980000,
      paymentMethod: PAYMENT_METHODS.STRIPE,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED,
      createdAt: new Date()
    }
  ];

  await Order.insertMany(sampleOrders);

  // Phiếu bảo hành RMA mẫu (sử dụng WARRANTY_STATUS.PROCESSING phù hợp với schema)
  await WarrantyTicket.create({
    ticketCode: 'RMA-20261001-001',
    serialNumber: 'IP15-SOLD-VALID',
    productId: productIphone._id,
    customerId: customerUser._id,
    branchId: branchQ1._id,
    staffId: staffQ1User._id,
    issueDescription: 'Màn hình bị sọc xanh sau khi rơi nhẹ, camera chập chờn',
    status: WARRANTY_STATUS.PROCESSING,
    notes: 'Đã nhận máy kèm cáp sạc'
  });

  // ==========================================
  // Bước 7: Đếm thực tế & In báo cáo thống kê
  // ==========================================
  const [
    branchCount,
    userCount,
    categoryCount,
    productCount,
    inventoryCount,
    serialCount,
    orderCount,
    warrantyCount
  ] = await Promise.all([
    Branch.countDocuments(),
    User.countDocuments(),
    Category.countDocuments(),
    Product.countDocuments(),
    BranchInventory.countDocuments(),
    Serial.countDocuments(),
    Order.countDocuments(),
    WarrantyTicket.countDocuments()
  ]);

  console.log(`
🎉 SEED DATA COMPLETED SUCCESSFULLY!
-----------------------------------------------
✓ Branches:           ${branchCount} locations (GeoJSON Point)
✓ Users:              ${userCount} accounts (1 Admin, 1 Manager, 2 Staffs, 1 Customer)
✓ Categories:         ${categoryCount} items (Hierarchy trees)
✓ Products:           ${productCount} items (Hybrid dynamic specs)
✓ Branch Inventory:   ${inventoryCount} stock records
✓ Serial Numbers:     ${serialCount} serials (IN_STOCK, SOLD, TRANSIT)
✓ Orders:             ${orderCount} sample orders (1 POS, 1 B2C)
✓ Warranty Tickets:   ${warrantyCount} active RMA ticket
-----------------------------------------------
🔐 CREDENTIALS FOR TESTING:
- Super Admin:     admin@techstore.com     / 123456
- Branch Manager:  manager.q1@techstore.com / 123456 (Chi nhánh Q1)
- Staff POS Q1:    staff.q1@techstore.com   / 123456
- Customer:        customer@gmail.com      / 123456
-----------------------------------------------
🎯 TEST SERIAL BARCODES FOR POS CHECKOUT:
- 'ROG16-Q1-001' (Laptop ROG 16GB tại Q1 - Status: IN_STOCK)
- 'IP15-Q1-001'  (iPhone 15 Pro Max tại Q1 - Status: IN_STOCK)
- 'IP15-SOLD-VALID' (Tra cứu bảo hành e-Warranty còn hạn)
- 'ROG-SOLD-EXPIRED' (Tra cứu bảo hành e-Warranty hết hạn)
`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (error) => {
  console.error('❌ SEED DATA FAILED:', error);
  try {
    await mongoose.connection.close();
  } catch {
    // Ignore close error on exit
  }
  process.exit(1);
});
