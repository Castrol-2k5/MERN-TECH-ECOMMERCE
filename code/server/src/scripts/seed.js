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
  Session,
  StockTransfer,
  TRANSFER_STATUS,
  PosShift,
  SHIFT_STATUS,
  InterBranchSettlement,
  SETTLEMENT_TYPE,
  SETTLEMENT_STATUS,
  AuditLog,
  AUDIT_ACTIONS,
  AUDIT_SEVERITY
} from '../models/index.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/mern_techstore_dev?replicaSet=rs0&directConnection=true';

async function seed() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  console.log(`✓ Connected to ${mongoose.connection.name}`);

  console.log('🧹 Cleaning up existing data in all collections...');
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    BranchInventory.deleteMany({}),
    StockTransfer.deleteMany({}),
    Serial.deleteMany({}),
    Order.deleteMany({}),
    WarrantyTicket.deleteMany({}),
    Session.deleteMany({}),
    PosShift.deleteMany({}),
    InterBranchSettlement.deleteMany({}),
    AuditLog.collection.drop().catch(() => {})
  ]);

  // Ensure indexes are properly synced (especially 2dsphere and unique constraints)
  await Promise.all([
    Branch.syncIndexes(),
    User.syncIndexes(),
    Category.syncIndexes(),
    Product.syncIndexes(),
    BranchInventory.syncIndexes(),
    StockTransfer.syncIndexes(),
    Serial.syncIndexes(),
    Order.syncIndexes(),
    WarrantyTicket.syncIndexes(),
    Session.syncIndexes(),
    PosShift.syncIndexes(),
    InterBranchSettlement.syncIndexes(),
    AuditLog.syncIndexes()
  ]);

  // ==========================================
  // Bước 1: Khởi tạo Kho Trung Tâm (BR-HQ) & Cửa hàng Chi nhánh (branches)
  // ==========================================
  console.log('📦 Seeding branches...');
  const branchHQ = await Branch.create({
    branchCode: 'BR-HQ',
    name: 'Kho Trung Tâm Trụ Sở Chính (HQ)',
    address: 'Tòa nhà TechOne Tower, 01 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '02838226868',
    location: {
      type: 'Point',
      coordinates: [106.7009, 10.7829]
    },
    isHeadquarter: true,
    isActive: true
  });

  const branchQ1 = await Branch.create({
    branchCode: 'BR-Q1',
    name: 'Chi nhánh Quận 1 - Flagship Store',
    address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '02839250001',
    location: {
      type: 'Point',
      coordinates: [106.6917, 10.7725]
    },
    isHeadquarter: false,
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
    isHeadquarter: false,
    isActive: true
  });

  // ==========================================
  // Bước 2: Khởi tạo Tài khoản Người dùng Mẫu (users)
  // ==========================================
  console.log('👤 Seeding users...');
  const [adminUser, managerQ1User, managerTDucUser, staffQ1User, staffTDucUser, customerUser] = await User.create([
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
      fullName: 'Võ Minh Trưởng Shop Thủ Đức',
      email: 'manager.tduc@techstore.com',
      phone: '0909000006',
      passwordHash: '123456',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchTDuc._id,
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
  console.log('📂 Seeding 5 main categories...');
  // 1. Laptop & MacBook
  const catLaptop = await Category.create({
    name: 'Laptop & MacBook',
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

  const catLaptopOffice = await Category.create({
    name: 'Laptop Văn Phòng & Doanh Nhân',
    slug: 'laptop-van-phong',
    parentId: catLaptop._id,
    attributeKeys: ['cpu', 'ram', 'screen_size', 'storage', 'weight'],
    isActive: true
  });

  // 2. Smartphone & Tablet
  const catPhoneTablet = await Category.create({
    name: 'Điện thoại & Tablet',
    slug: 'dien-thoai-tablet',
    parentId: null,
    attributeKeys: ['screen_size', 'storage', 'ram', 'camera', 'chipset'],
    isActive: true
  });

  const catIphone = await Category.create({
    name: 'iPhone (Apple)',
    slug: 'iphone',
    parentId: catPhoneTablet._id,
    attributeKeys: ['screen_size', 'storage', 'color', 'chipset'],
    isActive: true
  });

  const catAndroid = await Category.create({
    name: 'Điện thoại Android',
    slug: 'dien-thoai-android',
    parentId: catPhoneTablet._id,
    attributeKeys: ['screen_size', 'storage', 'ram', 'chipset', 'camera'],
    isActive: true
  });

  const catTablet = await Category.create({
    name: 'Máy tính bảng (Tablet)',
    slug: 'tablet',
    parentId: catPhoneTablet._id,
    attributeKeys: ['screen_size', 'storage', 'chipset', 'connectivity'],
    isActive: true
  });

  // 3. Màn hình máy tính (Monitors)
  const catMonitors = await Category.create({
    name: 'Màn hình máy tính',
    slug: 'man-hinh',
    parentId: null,
    attributeKeys: ['screen_size', 'resolution', 'panel_type', 'refresh_rate'],
    isActive: true
  });

  // 4. Thiết bị Âm thanh (Audio)
  const catAudio = await Category.create({
    name: 'Thiết bị Âm thanh',
    slug: 'am-thanh',
    parentId: null,
    attributeKeys: ['audio_type', 'connection_type', 'battery_life', 'anc'],
    isActive: true
  });

  // 5. Phụ kiện & Gaming Gear
  const catGamingGear = await Category.create({
    name: 'Bàn phím & Chuột Gaming',
    slug: 'phu-kien',
    parentId: null,
    attributeKeys: ['connection_type', 'dpi', 'switch_type', 'led_rgb'],
    isActive: true
  });

  // ==========================================
  // Bước 4: Khởi tạo 25 Sản phẩm Đa dạng Ngành hàng & Nhãn hiệu (products)
  // ==========================================
  console.log('💻 Seeding 25 diverse products with multi-SKUs...');

  const productsData = [];

  // ----------------------------------------------------
  // NHÓM 1: LAPTOP & MACBOOK (5 Sản phẩm: Apple, ASUS, Dell, Lenovo, Acer)
  // ----------------------------------------------------
  // P1: MacBook Pro 16 M3 Max
  const p1Sku1Id = new mongoose.Types.ObjectId();
  const p1Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Apple MacBook Pro 16 inch M3 Max (2024)',
    slug: 'macbook-pro-16-m3-max',
    brand: 'Apple',
    categoryId: catLaptopOffice._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Đỉnh cao sức mạnh đồ họa chuyên nghiệp với chip Apple M3 Max, màn hình Liquid Retina XDR 120Hz.',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'],
    attributes: [
      { key: 'cpu', value: 'Apple M3 Max 16-Core' },
      { key: 'ram', value: '36GB Unified' },
      { key: 'vga', value: '40-Core GPU' },
      { key: 'screen_size', value: '16.2 inch Liquid Retina XDR' },
      { key: 'storage', value: '1TB SSD' }
    ],
    options: [
      { name: 'Dung lượng RAM', displayType: 'button', values: ['36GB', '48GB'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Silver', 'Space Black'] }
    ],
    skus: [
      {
        _id: p1Sku1Id,
        sku: 'MBP16-M3MAX-36GB-SLV',
        price: 89990000,
        salePrice: 86990000,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'],
        optionValues: [
          { optionName: 'Dung lượng RAM', value: '36GB' },
          { optionName: 'Màu sắc', value: 'Silver' }
        ],
        isActive: true
      },
      {
        _id: p1Sku2Id,
        sku: 'MBP16-M3MAX-48GB-BLK',
        price: 102990000,
        salePrice: 99990000,
        images: ['https://images.unsplash.com/photo-1629654297299-c8506221ca97'],
        optionValues: [
          { optionName: 'Dung lượng RAM', value: '48GB' },
          { optionName: 'Màu sắc', value: 'Space Black' }
        ],
        isActive: true
      }
    ]
  });

  // P2: ASUS ROG Strix G16
  const p2Sku1Id = new mongoose.Types.ObjectId();
  const p2Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Laptop ASUS ROG Strix G16 (2024)',
    slug: 'laptop-asus-rog-strix-g16',
    brand: 'ASUS',
    categoryId: catLaptopGaming._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Chiến binh gaming cấu hình đỉnh cao trang bị Intel Core i7-13650HX và card đồ họa RTX 4060 8GB.',
    images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45'],
    attributes: [
      { key: 'cpu', value: 'Intel Core i7-13650HX' },
      { key: 'ram', value: '16GB DDR5' },
      { key: 'vga', value: 'NVIDIA GeForce RTX 4060 8GB' },
      { key: 'screen_size', value: '16.0 inch' },
      { key: 'refresh_rate', value: '165Hz' },
      { key: 'storage', value: '512GB SSD NVMe' }
    ],
    options: [
      { name: 'Dung lượng RAM', displayType: 'button', values: ['16GB', '32GB'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Eclipse Gray'] }
    ],
    skus: [
      {
        _id: p2Sku1Id,
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
        _id: p2Sku2Id,
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

  // P3: Dell XPS 13 9340
  const p3Sku1Id = new mongoose.Types.ObjectId();
  const p3Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Laptop Dell XPS 13 9340 Intel Core Ultra 7',
    slug: 'laptop-dell-xps-13-9340',
    brand: 'Dell',
    categoryId: catLaptopOffice._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Thiết kế nhôm nguyên khối tương lai siêu nhẹ 1.19kg, bàn phím vô cực và vi xử lý Intel Core Ultra AI.',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'],
    attributes: [
      { key: 'cpu', value: 'Intel Core Ultra 7 155H' },
      { key: 'ram', value: '16GB LPDDR5x' },
      { key: 'screen_size', value: '13.4 inch FHD+ InfinityEdge' },
      { key: 'storage', value: '512GB SSD PCIe 4.0' },
      { key: 'weight', value: '1.19 kg' }
    ],
    options: [
      { name: 'Dung lượng RAM', displayType: 'button', values: ['16GB', '32GB'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Platinum', 'Graphite'] }
    ],
    skus: [
      {
        _id: p3Sku1Id,
        sku: 'DELL-XPS13-16GB-PLT',
        price: 45990000,
        salePrice: 43990000,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'],
        optionValues: [
          { optionName: 'Dung lượng RAM', value: '16GB' },
          { optionName: 'Màu sắc', value: 'Platinum' }
        ],
        isActive: true
      },
      {
        _id: p3Sku2Id,
        sku: 'DELL-XPS13-32GB-GRA',
        price: 52990000,
        salePrice: 49990000,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'],
        optionValues: [
          { optionName: 'Dung lượng RAM', value: '32GB' },
          { optionName: 'Màu sắc', value: 'Graphite' }
        ],
        isActive: true
      }
    ]
  });

  // P4: Lenovo ThinkPad X1 Carbon Gen 12
  const p4Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Laptop Lenovo ThinkPad X1 Carbon Gen 12',
    slug: 'lenovo-thinkpad-x1-carbon-gen-12',
    brand: 'Lenovo',
    categoryId: catLaptopOffice._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Chuẩn mực laptop doanh nhân toàn cầu với độ bền chuẩn quân sự MIL-STD 810H và bàn phím gõ êm ái.',
    images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef'],
    attributes: [
      { key: 'cpu', value: 'Intel Core Ultra 7 155U' },
      { key: 'ram', value: '32GB LPDDR5x' },
      { key: 'screen_size', value: '14.0 inch 2.8K OLED 120Hz' },
      { key: 'storage', value: '1TB SSD' },
      { key: 'weight', value: '1.09 kg' }
    ],
    options: [
      { name: 'Cấu hình', displayType: 'button', values: ['32GB/1TB'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Deep Black'] }
    ],
    skus: [
      {
        _id: p4Sku1Id,
        sku: 'THINKPAD-X1-32GB-BLK',
        price: 56990000,
        salePrice: 53990000,
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef'],
        optionValues: [
          { optionName: 'Cấu hình', value: '32GB/1TB' },
          { optionName: 'Màu sắc', value: 'Deep Black' }
        ],
        isActive: true
      }
    ]
  });

  // P5: Acer Predator Helios 16
  const p5Sku1Id = new mongoose.Types.ObjectId();
  const p5Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Laptop Acer Predator Helios 16 Gaming',
    slug: 'laptop-acer-predator-helios-16',
    brand: 'Acer',
    categoryId: catLaptopGaming._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Quái thú tản nhiệt kim loại lỏng với card đồ họa RTX 4070/4080 sẵn sàng cân mọi tựa game AAA.',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302'],
    attributes: [
      { key: 'cpu', value: 'Intel Core i9-14900HX' },
      { key: 'ram', value: '16GB DDR5' },
      { key: 'vga', value: 'NVIDIA GeForce RTX 4070 8GB' },
      { key: 'screen_size', value: '16.0 inch WQXGA 240Hz' },
      { key: 'storage', value: '1TB SSD' }
    ],
    options: [
      { name: 'Card đồ họa', displayType: 'button', values: ['RTX 4070', 'RTX 4080 (Out of stock test)'] },
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Abyssal Black'] }
    ],
    skus: [
      {
        _id: p5Sku1Id,
        sku: 'PREDATOR-H16-4070-BLK',
        price: 49990000,
        salePrice: 46990000,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302'],
        optionValues: [
          { optionName: 'Card đồ họa', value: 'RTX 4070' },
          { optionName: 'Màu sắc', value: 'Abyssal Black' }
        ],
        isActive: true
      },
      {
        _id: p5Sku2Id,
        sku: 'PREDATOR-H16-4080-BLK',
        price: 59990000,
        salePrice: 56990000,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302'],
        optionValues: [
          { optionName: 'Card đồ họa', value: 'RTX 4080 (Out of stock test)' },
          { optionName: 'Màu sắc', value: 'Abyssal Black' }
        ],
        isActive: true
      }
    ]
  });

  // ----------------------------------------------------
  // NHÓM 2: SMARTPHONE & TABLET (6 Sản phẩm: Apple, Samsung, Xiaomi)
  // ----------------------------------------------------
  // P6: iPhone 16 Pro Max
  const p6Sku1Id = new mongoose.Types.ObjectId();
  const p6Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Điện thoại Apple iPhone 16 Pro Max',
    slug: 'iphone-16-pro-max',
    brand: 'Apple',
    categoryId: catIphone._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Siêu phẩm công nghệ đột phá với chip A18 Pro, nút điều khiển camera chuyên biệt và khung viền Titan Desert.',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569'],
    attributes: [
      { key: 'chipset', value: 'Apple A18 Pro 3nm' },
      { key: 'screen_size', value: '6.9 inch Super Retina XDR 120Hz' },
      { key: 'camera', value: '48MP Fusion + 48MP Ultra-wide + 12MP Tele 5x' },
      { key: 'storage', value: '256GB' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Titan Sa Mạc', 'Titan Tự Nhiên'] },
      { name: 'Bộ nhớ trong', displayType: 'button', values: ['256GB'] }
    ],
    skus: [
      {
        _id: p6Sku1Id,
        sku: 'IP16PM-256GB-DESERT',
        price: 34990000,
        salePrice: 33490000,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569'],
        optionValues: [
          { optionName: 'Màu sắc', value: 'Titan Sa Mạc' },
          { optionName: 'Bộ nhớ trong', value: '256GB' }
        ],
        isActive: true
      },
      {
        _id: p6Sku2Id,
        sku: 'IP16PM-256GB-NAT',
        price: 34990000,
        salePrice: 33490000,
        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569'],
        optionValues: [
          { optionName: 'Màu sắc', value: 'Titan Tự Nhiên' },
          { optionName: 'Bộ nhớ trong', value: '256GB' }
        ],
        isActive: true
      }
    ]
  });

  // P7: iPhone 15 128GB
  const p7Sku1Id = new mongoose.Types.ObjectId();
  const p7Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Điện thoại Apple iPhone 15',
    slug: 'iphone-15',
    brand: 'Apple',
    categoryId: catIphone._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Dynamic Island thời thượng, camera chính 48MP và cổng kết nối USB-C tiện dụng.',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab'],
    attributes: [
      { key: 'chipset', value: 'Apple A16 Bionic' },
      { key: 'screen_size', value: '6.1 inch Super Retina XDR' },
      { key: 'camera', value: '48MP + 12MP' },
      { key: 'storage', value: '128GB' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Xanh Dương Pastel', 'Hồng Pastel'] }
    ],
    skus: [
      {
        _id: p7Sku1Id,
        sku: 'IP15-128GB-BLU',
        price: 19990000,
        salePrice: 18490000,
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Xanh Dương Pastel' }],
        isActive: true
      },
      {
        _id: p7Sku2Id,
        sku: 'IP15-128GB-PNK',
        price: 19990000,
        salePrice: 18490000,
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Hồng Pastel' }],
        isActive: true
      }
    ]
  });

  // P8: Samsung Galaxy S24 Ultra 5G
  const p8Sku1Id = new mongoose.Types.ObjectId();
  const p8Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Điện thoại Samsung Galaxy S24 Ultra 5G',
    slug: 'samsung-galaxy-s24-ultra',
    brand: 'Samsung',
    categoryId: catAndroid._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Quyền năng Galaxy AI đỉnh cao, bút S-Pen tích hợp và camera cảm biến 200MP siêu zoom.',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf'],
    attributes: [
      { key: 'chipset', value: 'Snapdragon 8 Gen 3 for Galaxy' },
      { key: 'screen_size', value: '6.8 inch Dynamic AMOLED 2X 120Hz' },
      { key: 'camera', value: '200MP + 50MP + 12MP + 10MP' },
      { key: 'storage', value: '256GB' },
      { key: 'ram', value: '12GB' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Titan Gray', 'Titan Black'] }
    ],
    skus: [
      {
        _id: p8Sku1Id,
        sku: 'SS-S24U-256GB-GRY',
        price: 31990000,
        salePrice: 27990000,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Titan Gray' }],
        isActive: true
      },
      {
        _id: p8Sku2Id,
        sku: 'SS-S24U-256GB-BLK',
        price: 31990000,
        salePrice: 27990000,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Titan Black' }],
        isActive: true
      }
    ]
  });

  // P9: Samsung Galaxy Z Fold6 5G
  const p9Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Điện thoại Gập Samsung Galaxy Z Fold6 5G',
    slug: 'samsung-galaxy-z-fold6',
    brand: 'Samsung',
    categoryId: catAndroid._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Kiệt tác màn hình gập mỏng nhẹ nhất dòng Fold, tối ưu hóa đa nhiệm mạnh mẽ cùng Galaxy AI.',
    images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505'],
    attributes: [
      { key: 'chipset', value: 'Snapdragon 8 Gen 3' },
      { key: 'screen_size', value: '7.6 inch Foldable Dynamic AMOLED 2X' },
      { key: 'storage', value: '256GB' },
      { key: 'ram', value: '12GB' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Silver Shadow'] }
    ],
    skus: [
      {
        _id: p9Sku1Id,
        sku: 'SS-ZFOLD6-256GB-SLV',
        price: 43990000,
        salePrice: 40990000,
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Silver Shadow' }],
        isActive: true
      }
    ]
  });

  // P10: Xiaomi 14 Ultra (Leica Optics)
  const p10Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Điện thoại Xiaomi 14 Ultra 5G (Ống Kính Leica)',
    slug: 'xiaomi-14-ultra-5g',
    brand: 'Xiaomi',
    categoryId: catAndroid._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Chuyên gia nhiếp ảnh di động với cụm 4 camera Leica 50MP cảm biến 1-inch và sạc siêu nhanh 90W.',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'],
    attributes: [
      { key: 'chipset', value: 'Snapdragon 8 Gen 3' },
      { key: 'screen_size', value: '6.73 inch LTPO AMOLED 120Hz' },
      { key: 'camera', value: 'Quad Leica 50MP OIS' },
      { key: 'storage', value: '512GB' },
      { key: 'ram', value: '16GB' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Black Vegan Leather'] }
    ],
    skus: [
      {
        _id: p10Sku1Id,
        sku: 'MI14U-512GB-BLK',
        price: 32990000,
        salePrice: 29990000,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Black Vegan Leather' }],
        isActive: true
      }
    ]
  });

  // P11: Apple iPad Pro M4 11 inch
  const p11Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Máy tính bảng Apple iPad Pro 11 inch M4 (2024)',
    slug: 'ipad-pro-11-m4-2024',
    brand: 'Apple',
    categoryId: catTablet._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Mỏng chỉ 5.3mm với màn hình Ultra Retina XDR Tandem OLED đột phá và sức mạnh vô song của chip M4.',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0'],
    attributes: [
      { key: 'chipset', value: 'Apple M4 9-Core' },
      { key: 'screen_size', value: '11.0 inch Ultra Retina XDR OLED 120Hz' },
      { key: 'storage', value: '256GB' },
      { key: 'connectivity', value: 'Wi-Fi 6E' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Space Black'] }
    ],
    skus: [
      {
        _id: p11Sku1Id,
        sku: 'IPAD-M4-11-256-BLK',
        price: 28990000,
        salePrice: 27490000,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Space Black' }],
        isActive: true
      }
    ]
  });

  // ----------------------------------------------------
  // NHÓM 3: MÀN HÌNH MÁY TÍNH - MONITORS (4 Sản phẩm: LG, Dell, Samsung, ASUS)
  // ----------------------------------------------------
  // P12: LG UltraGear 27GR95QE-B OLED 240Hz
  const p12Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Màn hình Gaming LG UltraGear 27 inch OLED 240Hz 0.03ms',
    slug: 'man-hinh-lg-ultragear-27gr95qe-oled',
    brand: 'LG',
    categoryId: catMonitors._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Màn hình OLED đầu tiên trên thế giới tần số quét 240Hz và tốc độ phản hồi siêu tốc 0.03ms GtG.',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'],
    attributes: [
      { key: 'screen_size', value: '27.0 inch' },
      { key: 'resolution', value: '2K QHD (2560 x 1440)' },
      { key: 'panel_type', value: 'OLED' },
      { key: 'refresh_rate', value: '240Hz' }
    ],
    options: [],
    skus: [
      {
        _id: p12Sku1Id,
        sku: 'LG-27GR95QE-OLED',
        price: 21900000,
        salePrice: 19990000,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // P13: Dell UltraSharp U2724D 2K IPS Black
  const p13Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Màn hình Đồ Họa Dell UltraSharp 27 inch U2724D 2K 120Hz',
    slug: 'man-hinh-dell-ultrasharp-u2724d',
    brand: 'Dell',
    categoryId: catMonitors._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Tấm nền IPS Black độ tương phản 2000:1, chuẩn màu 98% DCI-P3 chuyên dụng cho thiết kế đồ họa.',
    images: ['https://images.unsplash.com/photo-1586210579191-33b45e38fa2c'],
    attributes: [
      { key: 'screen_size', value: '27.0 inch' },
      { key: 'resolution', value: '2K QHD (2560 x 1440)' },
      { key: 'panel_type', value: 'IPS Black' },
      { key: 'refresh_rate', value: '120Hz' }
    ],
    options: [],
    skus: [
      {
        _id: p13Sku1Id,
        sku: 'DELL-U2724D-IPS',
        price: 11500000,
        salePrice: 10490000,
        images: ['https://images.unsplash.com/photo-1586210579191-33b45e38fa2c'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // P14: Samsung Odyssey G9 OLED 49 inch
  const p14Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Màn hình Cong Siêu Rộng Samsung Odyssey OLED G9 49 inch',
    slug: 'man-hinh-samsung-odyssey-oled-g9-49',
    brand: 'Samsung',
    categoryId: catMonitors._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Tỷ lệ 32:9 choáng ngợp tương đương hai màn hình 27 inch ghép lại, trang bị vi xử lý Neo Quantum Pro.',
    images: ['https://images.unsplash.com/photo-1547082299-de196ea013d6'],
    attributes: [
      { key: 'screen_size', value: '49.0 inch Cong 1800R' },
      { key: 'resolution', value: 'Dual QHD (5120 x 1440)' },
      { key: 'panel_type', value: 'QD-OLED' },
      { key: 'refresh_rate', value: '240Hz' }
    ],
    options: [],
    skus: [
      {
        _id: p14Sku1Id,
        sku: 'SS-ODYSSEY-G9-OLED',
        price: 39990000,
        salePrice: 35990000,
        images: ['https://images.unsplash.com/photo-1547082299-de196ea013d6'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // P15: ASUS ROG Swift OLED PG32UCDM 4K 240Hz
  const p15Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Màn hình Gaming ASUS ROG Swift OLED PG32UCDM 32 inch 4K 240Hz',
    slug: 'man-hinh-asus-rog-swift-pg32ucdm-4k',
    brand: 'ASUS',
    categoryId: catMonitors._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Độ phân giải 4K sắc nét trên tấm nền QD-OLED thế hệ 3, tích hợp tản nhiệt buồng hơi graphene cao cấp.',
    images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f'],
    attributes: [
      { key: 'screen_size', value: '32.0 inch' },
      { key: 'resolution', value: '4K UHD (3840 x 2160)' },
      { key: 'panel_type', value: 'QD-OLED' },
      { key: 'refresh_rate', value: '240Hz' }
    ],
    options: [],
    skus: [
      {
        _id: p15Sku1Id,
        sku: 'ASUS-PG32UCDM-4K',
        price: 38900000,
        salePrice: 36900000,
        images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // ----------------------------------------------------
  // NHÓM 4: THIẾT BỊ ÂM THANH - AUDIO (5 Sản phẩm: Sony, Apple, Marshall, Sennheiser)
  // ----------------------------------------------------
  // P16: Sony WH-1000XM5
  const p16Sku1Id = new mongoose.Types.ObjectId();
  const p16Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Tai nghe Chống ồn Không dây Sony WH-1000XM5',
    slug: 'tai-nghe-sony-wh-1000xm5',
    brand: 'Sony',
    categoryId: catAudio._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Công nghệ chống ồn hàng đầu ngành âm thanh với 8 micro và 2 bộ xử lý âm thanh độc quyền V1 & QN1.',
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b'],
    attributes: [
      { key: 'audio_type', value: 'Over-ear Chống ồn' },
      { key: 'connection_type', value: 'Bluetooth 5.2 / Cắm dây 3.5mm' },
      { key: 'battery_life', value: '30 giờ (bật ANC)' },
      { key: 'anc', value: 'Chống ồn chủ động thích ứng' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Đen Huyền Bí', 'Bạc Bạch Kim'] }
    ],
    skus: [
      {
        _id: p16Sku1Id,
        sku: 'SONY-WH1000XM5-BLK',
        price: 8490000,
        salePrice: 6990000,
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Đen Huyền Bí' }],
        isActive: true
      },
      {
        _id: p16Sku2Id,
        sku: 'SONY-WH1000XM5-SLV',
        price: 8490000,
        salePrice: 6990000,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Bạc Bạch Kim' }],
        isActive: true
      }
    ]
  });

  // P17: Apple AirPods Max (USB-C)
  const p17Sku1Id = new mongoose.Types.ObjectId();
  const p17Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Tai nghe Chụp tai Apple AirPods Max (Cổng USB-C)',
    slug: 'apple-airpods-max-usbc',
    brand: 'Apple',
    categoryId: catAudio._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Âm thanh chất lượng cao trung thực, tính năng Âm thanh không gian cá nhân hóa và cổng sạc USB-C.',
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90'],
    attributes: [
      { key: 'audio_type', value: 'Over-ear Cao cấp' },
      { key: 'connection_type', value: 'Bluetooth 5.3 / USB-C Lossless' },
      { key: 'battery_life', value: '20 giờ' },
      { key: 'anc', value: 'Chống ồn chủ động chuẩn Apple' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Midnight', 'Starlight'] }
    ],
    skus: [
      {
        _id: p17Sku1Id,
        sku: 'AIRPODS-MAX-MIDNIGHT',
        price: 13990000,
        salePrice: 13190000,
        images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Midnight' }],
        isActive: true
      },
      {
        _id: p17Sku2Id,
        sku: 'AIRPODS-MAX-STARLIGHT',
        price: 13990000,
        salePrice: 13190000,
        images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Starlight' }],
        isActive: true
      }
    ]
  });

  // P18: Marshall Stanmore III
  const p18Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Loa Bluetooth Để Bàn Marshall Stanmore III',
    slug: 'loa-marshall-stanmore-iii',
    brand: 'Marshall',
    categoryId: catAudio._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Âm thanh stereo tràn ngập không gian với chất âm đặc trưng của huyền thoại nhạc rock Marshall.',
    images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d'],
    attributes: [
      { key: 'audio_type', value: 'Loa cắm điện để bàn' },
      { key: 'connection_type', value: 'Bluetooth 5.2 / AUX 3.5mm / RCA' },
      { key: 'battery_life', value: 'Cắm điện trực tiếp 220V' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Black & Brass'] }
    ],
    skus: [
      {
        _id: p18Sku1Id,
        sku: 'MARSHALL-STAN3-BLK',
        price: 9990000,
        salePrice: 8990000,
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Black & Brass' }],
        isActive: true
      }
    ]
  });

  // P19: Sennheiser Momentum 4 Wireless
  const p19Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Tai nghe Không dây Sennheiser Momentum 4 Wireless',
    slug: 'tai-nghe-sennheiser-momentum-4',
    brand: 'Sennheiser',
    categoryId: catAudio._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Chất âm Audiophile danh tiếng đến từ Đức kết hợp thời lượng pin kỷ lục lên tới 60 giờ liên tục.',
    images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944'],
    attributes: [
      { key: 'audio_type', value: 'Over-ear Chống ồn' },
      { key: 'connection_type', value: 'Bluetooth 5.2 aptX Adaptive' },
      { key: 'battery_life', value: '60 giờ' },
      { key: 'anc', value: 'Adaptive ANC' }
    ],
    options: [],
    skus: [
      {
        _id: p19Sku1Id,
        sku: 'SENN-MOMENTUM4-BLK',
        price: 9490000,
        salePrice: 7990000,
        images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // P20: Sony WF-1000XM5 True Wireless
  const p20Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Tai nghe True Wireless Sony WF-1000XM5 Chống Ồn',
    slug: 'tai-nghe-sony-wf-1000xm5',
    brand: 'Sony',
    categoryId: catAudio._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Thiết kế công thái học siêu nhỏ gọn, màng loa Dynamic Driver X tái tạo âm thanh chi tiết hoàn hảo.',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df'],
    attributes: [
      { key: 'audio_type', value: 'In-ear True Wireless' },
      { key: 'connection_type', value: 'Bluetooth 5.3 LDAC' },
      { key: 'battery_life', value: '24 giờ (kèm hộp sạc)' },
      { key: 'anc', value: 'Dual Processor ANC' }
    ],
    options: [],
    skus: [
      {
        _id: p20Sku1Id,
        sku: 'SONY-WF1000XM5-BLK',
        price: 6990000,
        salePrice: 5490000,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // ----------------------------------------------------
  // NHÓM 5: PHỤ KIỆN & GAMING GEAR (5 Sản phẩm: Logitech, Razer, Keychron, Corsair)
  // ----------------------------------------------------
  // P21: Logitech G502 HERO (Phụ kiện - không quản lý serial)
  const p21Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Chuột Chơi Game Logitech G502 HERO High Performance',
    slug: 'chuot-logitech-g502-hero',
    brand: 'Logitech',
    categoryId: catGamingGear._id,
    isSerialManaged: false,
    isActive: true,
    description: 'Chuột chơi game hiệu năng cao trang bị cảm biến HERO 25K và hệ thống tạ tùy biến trọng lượng.',
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
    attributes: [
      { key: 'dpi', value: '25600 DPI' },
      { key: 'connection_type', value: 'Có dây (USB)' },
      { key: 'led_rgb', value: 'LIGHTSYNC RGB' }
    ],
    options: [],
    skus: [
      {
        _id: p21Sku1Id,
        sku: 'LOGI-G502-HERO',
        price: 1290000,
        salePrice: 990000,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // P22: Razer DeathAdder V3 Pro (Phụ kiện cao cấp - quản lý serial)
  const p22Sku1Id = new mongoose.Types.ObjectId();
  const p22Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Chuột Không Dây Siêu Nhẹ Razer DeathAdder V3 Pro 63g',
    slug: 'chuot-razer-deathadder-v3-pro',
    brand: 'Razer',
    categoryId: catGamingGear._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Trọng lượng siêu nhẹ chỉ 63g, cảm biến quang học Focus Pro 30K và công nghệ không dây HyperSpeed.',
    images: ['https://images.unsplash.com/photo-1626218174358-7769486c4b79'],
    attributes: [
      { key: 'dpi', value: '30000 DPI Focus Pro' },
      { key: 'connection_type', value: 'Wireless HyperSpeed / Type-C' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['White Edition', 'Black Edition'] }
    ],
    skus: [
      {
        _id: p22Sku1Id,
        sku: 'RAZER-DAV3-PRO-WHT',
        price: 3890000,
        salePrice: 3390000,
        images: ['https://images.unsplash.com/photo-1626218174358-7769486c4b79'],
        optionValues: [{ optionName: 'Màu sắc', value: 'White Edition' }],
        isActive: true
      },
      {
        _id: p22Sku2Id,
        sku: 'RAZER-DAV3-PRO-BLK',
        price: 3890000,
        salePrice: 3390000,
        images: ['https://images.unsplash.com/photo-1626218174358-7769486c4b79'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Black Edition' }],
        isActive: true
      }
    ]
  });

  // P23: Bàn phím cơ Keychron Q1 Pro
  const p23Sku1Id = new mongoose.Types.ObjectId();
  const p23Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Bàn phím cơ Không dây Keychron Q1 Pro Nhôm Nguyên Khối',
    slug: 'ban-phim-co-keychron-q1-pro',
    brand: 'Keychron',
    categoryId: catGamingGear._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Vỏ nhôm CNC 6063 cao cấp, kết nối Bluetooth 5.1 đa thiết bị, hotswap và hỗ trợ QMK/VIA tùy biến.',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3'],
    attributes: [
      { key: 'connection_type', value: 'Bluetooth 5.1 / Type-C' },
      { key: 'switch_type', value: 'Keychron K Pro Mechanical' },
      { key: 'led_rgb', value: 'RGB Mạch Xuôi (South-facing)' }
    ],
    options: [
      { name: 'Loại Switch', displayType: 'button', values: ['Red Switch (Linear)', 'Brown Switch (Tactile)'] }
    ],
    skus: [
      {
        _id: p23Sku1Id,
        sku: 'KEYCHRON-Q1PRO-RED',
        price: 4890000,
        salePrice: 4490000,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3'],
        optionValues: [{ optionName: 'Loại Switch', value: 'Red Switch (Linear)' }],
        isActive: true
      },
      {
        _id: p23Sku2Id,
        sku: 'KEYCHRON-Q1PRO-BRN',
        price: 4890000,
        salePrice: 4490000,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3'],
        optionValues: [{ optionName: 'Loại Switch', value: 'Brown Switch (Tactile)' }],
        isActive: true
      }
    ]
  });

  // P24: Bàn phím cơ Corsair K70 MAX RGB
  const p24Sku1Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Bàn phím cơ Từ tính Corsair K70 MAX RGB Magnetic-Mechanical',
    slug: 'ban-phim-corsair-k70-max-rgb',
    brand: 'Corsair',
    categoryId: catGamingGear._id,
    isSerialManaged: true,
    isActive: true,
    description: 'Switch từ tính Corsair MGX có thể tùy chỉnh điểm nhận phím từ 0.4mm đến 3.6mm và tính năng Rapid Trigger.',
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212'],
    attributes: [
      { key: 'connection_type', value: 'Dây bện USB Type-C tháo rời' },
      { key: 'switch_type', value: 'Corsair MGX Magnetic Switches' },
      { key: 'led_rgb', value: 'Per-key RGB iCUE' }
    ],
    options: [],
    skus: [
      {
        _id: p24Sku1Id,
        sku: 'CORSAIR-K70-MAX',
        price: 5690000,
        salePrice: 4990000,
        images: ['https://images.unsplash.com/photo-1595225476474-87563907a212'],
        optionValues: [],
        isActive: true
      }
    ]
  });

  // P25: Chuột Không dây Logitech MX Master 3S
  const p25Sku1Id = new mongoose.Types.ObjectId();
  const p25Sku2Id = new mongoose.Types.ObjectId();
  productsData.push({
    name: 'Chuột Không dây Công thái học Logitech MX Master 3S',
    slug: 'chuot-logitech-mx-master-3s',
    brand: 'Logitech',
    categoryId: catGamingGear._id,
    isSerialManaged: false,
    isActive: true,
    description: 'Biểu tượng chuột văn phòng chuyên nghiệp: Click êm ái Quiet Clicks, con lăn điện từ MagSpeed 1000 dòng/giây.',
    images: ['https://images.unsplash.com/photo-1605774337664-7a846e9cdf17'],
    attributes: [
      { key: 'dpi', value: '8000 DPI Darkfield' },
      { key: 'connection_type', value: 'Bluetooth / Logi Bolt USB' }
    ],
    options: [
      { name: 'Màu sắc', displayType: 'color_picker', values: ['Graphite', 'Pale Gray'] }
    ],
    skus: [
      {
        _id: p25Sku1Id,
        sku: 'LOGI-MX3S-GRAPHITE',
        price: 2490000,
        salePrice: 2190000,
        images: ['https://images.unsplash.com/photo-1605774337664-7a846e9cdf17'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Graphite' }],
        isActive: true
      },
      {
        _id: p25Sku2Id,
        sku: 'LOGI-MX3S-PALEGRAY',
        price: 2490000,
        salePrice: 2190000,
        images: ['https://images.unsplash.com/photo-1605774337664-7a846e9cdf17'],
        optionValues: [{ optionName: 'Màu sắc', value: 'Pale Gray' }],
        isActive: true
      }
    ]
  });

  const createdProducts = await Product.create(productsData);
  console.log(`✓ Inserted ${createdProducts.length} products.`);

  // Map nhanh ID sản phẩm
  const pMap = {};
  for (const p of createdProducts) {
    pMap[p.slug] = p;
  }

  // ==========================================
  // Bước 5: Nạp Tồn Kho Trung Tâm & Chi Nhánh (branch_inventories)
  // Phân bổ đa dạng: có hàng đủ, chỉ có 1 branch, và SKU hết hàng (totalStock=0)
  // ==========================================
  console.log('📊 Seeding branch inventories...');
  const inventoryList = [];

  // Hàm tiện ích tạo bản ghi inventory
  const addInv = (branchId, productSlug, skuId, quantity) => {
    const prod = pMap[productSlug];
    if (prod) {
      inventoryList.push({
        branchId,
        productId: prod._id,
        productSkuId: skuId,
        quantity
      });
    }
  };

  // 1. MacBook Pro M3 Max
  addInv(branchHQ._id, 'macbook-pro-16-m3-max', p1Sku1Id, 3);
  addInv(branchQ1._id, 'macbook-pro-16-m3-max', p1Sku1Id, 2);
  addInv(branchTDuc._id, 'macbook-pro-16-m3-max', p1Sku1Id, 1);
  addInv(branchQ1._id, 'macbook-pro-16-m3-max', p1Sku2Id, 1);

  // 2. ASUS ROG Strix G16
  addInv(branchHQ._id, 'laptop-asus-rog-strix-g16', p2Sku1Id, 4);
  addInv(branchQ1._id, 'laptop-asus-rog-strix-g16', p2Sku1Id, 3);
  addInv(branchTDuc._id, 'laptop-asus-rog-strix-g16', p2Sku1Id, 2);
  addInv(branchQ1._id, 'laptop-asus-rog-strix-g16', p2Sku2Id, 2);

  // 3. Dell XPS 13
  addInv(branchHQ._id, 'laptop-dell-xps-13-9340', p3Sku1Id, 2);
  addInv(branchQ1._id, 'laptop-dell-xps-13-9340', p3Sku1Id, 2);
  addInv(branchTDuc._id, 'laptop-dell-xps-13-9340', p3Sku2Id, 1);

  // 4. ThinkPad X1 Carbon
  addInv(branchHQ._id, 'lenovo-thinkpad-x1-carbon-gen-12', p4Sku1Id, 2);
  addInv(branchQ1._id, 'lenovo-thinkpad-x1-carbon-gen-12', p4Sku1Id, 2);

  // 5. Acer Predator Helios 16: SKU 4070 có hàng, SKU 4080 hết hàng trên toàn hệ thống (Test Out-of-stock)
  addInv(branchHQ._id, 'laptop-acer-predator-helios-16', p5Sku1Id, 2);
  addInv(branchQ1._id, 'laptop-acer-predator-helios-16', p5Sku1Id, 1);
  addInv(branchHQ._id, 'laptop-acer-predator-helios-16', p5Sku2Id, 0); // Out of stock
  addInv(branchQ1._id, 'laptop-acer-predator-helios-16', p5Sku2Id, 0); // Out of stock
  addInv(branchTDuc._id, 'laptop-acer-predator-helios-16', p5Sku2Id, 0); // Out of stock

  // 6. iPhone 16 Pro Max
  addInv(branchHQ._id, 'iphone-16-pro-max', p6Sku1Id, 5);
  addInv(branchQ1._id, 'iphone-16-pro-max', p6Sku1Id, 4);
  addInv(branchTDuc._id, 'iphone-16-pro-max', p6Sku1Id, 2);
  addInv(branchQ1._id, 'iphone-16-pro-max', p6Sku2Id, 3);

  // 7. iPhone 15
  addInv(branchHQ._id, 'iphone-15', p7Sku1Id, 4);
  addInv(branchQ1._id, 'iphone-15', p7Sku1Id, 3);
  addInv(branchTDuc._id, 'iphone-15', p7Sku2Id, 2);

  // 8. Galaxy S24 Ultra
  addInv(branchHQ._id, 'samsung-galaxy-s24-ultra', p8Sku1Id, 3);
  addInv(branchQ1._id, 'samsung-galaxy-s24-ultra', p8Sku1Id, 3);
  addInv(branchTDuc._id, 'samsung-galaxy-s24-ultra', p8Sku2Id, 2);

  // 9. Galaxy Z Fold6
  addInv(branchHQ._id, 'samsung-galaxy-z-fold6', p9Sku1Id, 2);
  addInv(branchQ1._id, 'samsung-galaxy-z-fold6', p9Sku1Id, 1);

  // 10. Xiaomi 14 Ultra
  addInv(branchHQ._id, 'xiaomi-14-ultra-5g', p10Sku1Id, 2);
  addInv(branchQ1._id, 'xiaomi-14-ultra-5g', p10Sku1Id, 2);

  // 11. iPad Pro M4
  addInv(branchHQ._id, 'ipad-pro-11-m4-2024', p11Sku1Id, 3);
  addInv(branchQ1._id, 'ipad-pro-11-m4-2024', p11Sku1Id, 2);
  addInv(branchTDuc._id, 'ipad-pro-11-m4-2024', p11Sku1Id, 1);

  // 12-15: Màn hình Monitors
  addInv(branchHQ._id, 'man-hinh-lg-ultragear-27gr95qe-oled', p12Sku1Id, 3);
  addInv(branchQ1._id, 'man-hinh-lg-ultragear-27gr95qe-oled', p12Sku1Id, 2);

  addInv(branchHQ._id, 'man-hinh-dell-ultrasharp-u2724d', p13Sku1Id, 4);
  addInv(branchQ1._id, 'man-hinh-dell-ultrasharp-u2724d', p13Sku1Id, 3);
  addInv(branchTDuc._id, 'man-hinh-dell-ultrasharp-u2724d', p13Sku1Id, 2);

  addInv(branchHQ._id, 'man-hinh-samsung-odyssey-oled-g9-49', p14Sku1Id, 1);
  addInv(branchQ1._id, 'man-hinh-samsung-odyssey-oled-g9-49', p14Sku1Id, 1);

  addInv(branchHQ._id, 'man-hinh-asus-rog-swift-pg32ucdm-4k', p15Sku1Id, 2);
  addInv(branchQ1._id, 'man-hinh-asus-rog-swift-pg32ucdm-4k', p15Sku1Id, 1);

  // 16-20: Thiết bị Âm thanh (Audio)
  addInv(branchHQ._id, 'tai-nghe-sony-wh-1000xm5', p16Sku1Id, 4);
  addInv(branchQ1._id, 'tai-nghe-sony-wh-1000xm5', p16Sku1Id, 3);
  addInv(branchTDuc._id, 'tai-nghe-sony-wh-1000xm5', p16Sku2Id, 2);

  addInv(branchHQ._id, 'apple-airpods-max-usbc', p17Sku1Id, 2);
  addInv(branchQ1._id, 'apple-airpods-max-usbc', p17Sku1Id, 2);
  addInv(branchQ1._id, 'apple-airpods-max-usbc', p17Sku2Id, 1);

  addInv(branchHQ._id, 'loa-marshall-stanmore-iii', p18Sku1Id, 3);
  addInv(branchQ1._id, 'loa-marshall-stanmore-iii', p18Sku1Id, 2);

  addInv(branchHQ._id, 'tai-nghe-sennheiser-momentum-4', p19Sku1Id, 3);
  addInv(branchQ1._id, 'tai-nghe-sennheiser-momentum-4', p19Sku1Id, 1);

  addInv(branchHQ._id, 'tai-nghe-sony-wf-1000xm5', p20Sku1Id, 5);
  addInv(branchQ1._id, 'tai-nghe-sony-wf-1000xm5', p20Sku1Id, 4);
  addInv(branchTDuc._id, 'tai-nghe-sony-wf-1000xm5', p20Sku1Id, 3);

  // 21-25: Phụ kiện Gaming Gear (Chuột & Bàn phím)
  addInv(branchHQ._id, 'chuot-logitech-g502-hero', p21Sku1Id, 50);
  addInv(branchQ1._id, 'chuot-logitech-g502-hero', p21Sku1Id, 30);
  addInv(branchTDuc._id, 'chuot-logitech-g502-hero', p21Sku1Id, 20);

  addInv(branchHQ._id, 'chuot-razer-deathadder-v3-pro', p22Sku1Id, 5);
  addInv(branchQ1._id, 'chuot-razer-deathadder-v3-pro', p22Sku1Id, 3);
  addInv(branchTDuc._id, 'chuot-razer-deathadder-v3-pro', p22Sku2Id, 2);

  addInv(branchHQ._id, 'ban-phim-co-keychron-q1-pro', p23Sku1Id, 4);
  addInv(branchQ1._id, 'ban-phim-co-keychron-q1-pro', p23Sku1Id, 3);
  addInv(branchTDuc._id, 'ban-phim-co-keychron-q1-pro', p23Sku2Id, 2);

  addInv(branchHQ._id, 'ban-phim-corsair-k70-max-rgb', p24Sku1Id, 3);
  addInv(branchQ1._id, 'ban-phim-corsair-k70-max-rgb', p24Sku1Id, 2);

  addInv(branchHQ._id, 'chuot-logitech-mx-master-3s', p25Sku1Id, 25);
  addInv(branchQ1._id, 'chuot-logitech-mx-master-3s', p25Sku1Id, 15);
  addInv(branchTDuc._id, 'chuot-logitech-mx-master-3s', p25Sku2Id, 10);

  await BranchInventory.create(inventoryList);
  console.log(`✓ Inserted ${inventoryList.length} branch inventory records.`);

  // ==========================================
  // Bước 6: Khởi tạo Serials (serials)
  // Đảm bảo số lượng serial IN_STOCK khớp đúng với quantity trong branch_inventories
  // ==========================================
  console.log('🏷️ Seeding Serials for isSerialManaged products...');
  const serialsData = [];

  const addSerials = (snPrefix, productSlug, skuId, branchId, count) => {
    const prod = pMap[productSlug];
    if (!prod || !prod.isSerialManaged) return;
    for (let i = 1; i <= count; i++) {
      const idxStr = String(i).padStart(3, '0');
      serialsData.push({
        serialNumber: `${snPrefix}-${idxStr}`,
        productId: prod._id,
        productSkuId: skuId,
        branchId,
        status: SERIAL_STATUS.IN_STOCK
      });
    }
  };

  // 1. MacBook Pro M3 Max
  addSerials('MBP16-HQ', 'macbook-pro-16-m3-max', p1Sku1Id, branchHQ._id, 3);
  addSerials('MBP16-Q1', 'macbook-pro-16-m3-max', p1Sku1Id, branchQ1._id, 2);
  addSerials('MBP16-TD', 'macbook-pro-16-m3-max', p1Sku1Id, branchTDuc._id, 1);
  addSerials('MBP16-48-Q1', 'macbook-pro-16-m3-max', p1Sku2Id, branchQ1._id, 1);

  // 2. ASUS ROG Strix G16
  addSerials('ROG16-HQ', 'laptop-asus-rog-strix-g16', p2Sku1Id, branchHQ._id, 4);
  addSerials('ROG16-Q1', 'laptop-asus-rog-strix-g16', p2Sku1Id, branchQ1._id, 3);
  addSerials('ROG16-TD', 'laptop-asus-rog-strix-g16', p2Sku1Id, branchTDuc._id, 2);
  addSerials('ROG32-Q1', 'laptop-asus-rog-strix-g16', p2Sku2Id, branchQ1._id, 2);

  // 3. Dell XPS 13
  addSerials('DELL13-HQ', 'laptop-dell-xps-13-9340', p3Sku1Id, branchHQ._id, 2);
  addSerials('DELL13-Q1', 'laptop-dell-xps-13-9340', p3Sku1Id, branchQ1._id, 2);
  addSerials('DELL13-TD', 'laptop-dell-xps-13-9340', p3Sku2Id, branchTDuc._id, 1);

  // 4. ThinkPad X1 Carbon
  addSerials('THINK-HQ', 'lenovo-thinkpad-x1-carbon-gen-12', p4Sku1Id, branchHQ._id, 2);
  addSerials('THINK-Q1', 'lenovo-thinkpad-x1-carbon-gen-12', p4Sku1Id, branchQ1._id, 2);

  // 5. Acer Predator Helios 16
  addSerials('ACER-H16-HQ', 'laptop-acer-predator-helios-16', p5Sku1Id, branchHQ._id, 2);
  addSerials('ACER-H16-Q1', 'laptop-acer-predator-helios-16', p5Sku1Id, branchQ1._id, 1);

  // 6. iPhone 16 Pro Max
  addSerials('IP16-HQ', 'iphone-16-pro-max', p6Sku1Id, branchHQ._id, 5);
  addSerials('IP16-Q1', 'iphone-16-pro-max', p6Sku1Id, branchQ1._id, 4);
  addSerials('IP16-TD', 'iphone-16-pro-max', p6Sku1Id, branchTDuc._id, 2);
  addSerials('IP16-NAT-Q1', 'iphone-16-pro-max', p6Sku2Id, branchQ1._id, 3);

  // 7. iPhone 15
  addSerials('IP15-BLU-HQ', 'iphone-15', p7Sku1Id, branchHQ._id, 4);
  addSerials('IP15-BLU-Q1', 'iphone-15', p7Sku1Id, branchQ1._id, 3);
  addSerials('IP15-PNK-TD', 'iphone-15', p7Sku2Id, branchTDuc._id, 2);

  // 8. Galaxy S24 Ultra
  addSerials('S24U-HQ', 'samsung-galaxy-s24-ultra', p8Sku1Id, branchHQ._id, 3);
  addSerials('S24U-Q1', 'samsung-galaxy-s24-ultra', p8Sku1Id, branchQ1._id, 3);
  addSerials('S24U-TD', 'samsung-galaxy-s24-ultra', p8Sku2Id, branchTDuc._id, 2);

  // 9. Galaxy Z Fold6
  addSerials('ZFOLD6-HQ', 'samsung-galaxy-z-fold6', p9Sku1Id, branchHQ._id, 2);
  addSerials('ZFOLD6-Q1', 'samsung-galaxy-z-fold6', p9Sku1Id, 1);

  // 10. Xiaomi 14 Ultra
  addSerials('MI14U-HQ', 'xiaomi-14-ultra-5g', p10Sku1Id, branchHQ._id, 2);
  addSerials('MI14U-Q1', 'xiaomi-14-ultra-5g', p10Sku1Id, branchQ1._id, 2);

  // 11. iPad Pro M4
  addSerials('IPAD-M4-HQ', 'ipad-pro-11-m4-2024', p11Sku1Id, branchHQ._id, 3);
  addSerials('IPAD-M4-Q1', 'ipad-pro-11-m4-2024', p11Sku1Id, branchQ1._id, 2);
  addSerials('IPAD-M4-TD', 'ipad-pro-11-m4-2024', p11Sku1Id, branchTDuc._id, 1);

  // 12-15: Monitors
  addSerials('LG-OLED-HQ', 'man-hinh-lg-ultragear-27gr95qe-oled', p12Sku1Id, branchHQ._id, 3);
  addSerials('LG-OLED-Q1', 'man-hinh-lg-ultragear-27gr95qe-oled', p12Sku1Id, branchQ1._id, 2);

  addSerials('DELL-U27-HQ', 'man-hinh-dell-ultrasharp-u2724d', p13Sku1Id, branchHQ._id, 4);
  addSerials('DELL-U27-Q1', 'man-hinh-dell-ultrasharp-u2724d', p13Sku1Id, branchQ1._id, 3);
  addSerials('DELL-U27-TD', 'man-hinh-dell-ultrasharp-u2724d', p13Sku1Id, branchTDuc._id, 2);

  addSerials('SS-G9-HQ', 'man-hinh-samsung-odyssey-oled-g9-49', p14Sku1Id, branchHQ._id, 1);
  addSerials('SS-G9-Q1', 'man-hinh-samsung-odyssey-oled-g9-49', p14Sku1Id, branchQ1._id, 1);

  addSerials('ASUS-4K-HQ', 'man-hinh-asus-rog-swift-pg32ucdm-4k', p15Sku1Id, branchHQ._id, 2);
  addSerials('ASUS-4K-Q1', 'man-hinh-asus-rog-swift-pg32ucdm-4k', p15Sku1Id, branchQ1._id, 1);

  // 16-20: Audio
  addSerials('SONY-XM5-HQ', 'tai-nghe-sony-wh-1000xm5', p16Sku1Id, branchHQ._id, 4);
  addSerials('SONY-XM5-Q1', 'tai-nghe-sony-wh-1000xm5', p16Sku1Id, branchQ1._id, 3);
  addSerials('SONY-XM5-TD', 'tai-nghe-sony-wh-1000xm5', p16Sku2Id, branchTDuc._id, 2);

  addSerials('AP-MAX-HQ', 'apple-airpods-max-usbc', p17Sku1Id, branchHQ._id, 2);
  addSerials('AP-MAX-Q1', 'apple-airpods-max-usbc', p17Sku1Id, branchQ1._id, 2);
  addSerials('AP-MAX-TD', 'apple-airpods-max-usbc', p17Sku2Id, branchQ1._id, 1);

  addSerials('MARSHALL-HQ', 'loa-marshall-stanmore-iii', p18Sku1Id, branchHQ._id, 3);
  addSerials('MARSHALL-Q1', 'loa-marshall-stanmore-iii', p18Sku1Id, branchQ1._id, 2);

  addSerials('SENN-M4-HQ', 'tai-nghe-sennheiser-momentum-4', p19Sku1Id, branchHQ._id, 3);
  addSerials('SENN-M4-Q1', 'tai-nghe-sennheiser-momentum-4', p19Sku1Id, branchQ1._id, 1);

  addSerials('WF-XM5-HQ', 'tai-nghe-sony-wf-1000xm5', p20Sku1Id, branchHQ._id, 5);
  addSerials('WF-XM5-Q1', 'tai-nghe-sony-wf-1000xm5', p20Sku1Id, branchQ1._id, 4);
  addSerials('WF-XM5-TD', 'tai-nghe-sony-wf-1000xm5', p20Sku1Id, branchTDuc._id, 3);

  // 22-24: Gaming Gear quản lý serial
  addSerials('RAZER-V3-HQ', 'chuot-razer-deathadder-v3-pro', p22Sku1Id, branchHQ._id, 5);
  addSerials('RAZER-V3-Q1', 'chuot-razer-deathadder-v3-pro', p22Sku1Id, branchQ1._id, 3);
  addSerials('RAZER-V3-TD', 'chuot-razer-deathadder-v3-pro', p22Sku2Id, branchTDuc._id, 2);

  addSerials('KEYCHRON-HQ', 'ban-phim-co-keychron-q1-pro', p23Sku1Id, branchHQ._id, 4);
  addSerials('KEYCHRON-Q1', 'ban-phim-co-keychron-q1-pro', p23Sku1Id, branchQ1._id, 3);
  addSerials('KEYCHRON-TD', 'ban-phim-co-keychron-q1-pro', p23Sku2Id, branchTDuc._id, 2);

  addSerials('CORSAIR-HQ', 'ban-phim-corsair-k70-max-rgb', p24Sku1Id, branchHQ._id, 3);
  addSerials('CORSAIR-Q1', 'ban-phim-corsair-k70-max-rgb', p24Sku1Id, branchQ1._id, 2);

  // ----------------------------------------------------
  // Các Serial đặc biệt để test các màn hình chuyên biệt:
  // 1) IP16-SOLD-VALID: Máy đã bán, còn hạn bảo hành (test e-Warranty)
  // 2) ROG-SOLD-EXPIRED: Máy đã bán, hết hạn bảo hành (test e-Warranty quá hạn)
  // 3) IP15-TRANSIT-001: Máy đang chuyển kho TRANSIT (test màn hình chuyển kho P-20)
  // 4) MBA-M4-SOLD-VALID: Máy MacBook đã bán, còn hạn bảo hành
  // ----------------------------------------------------
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const sixMonthsLater = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const eighteenMonthsAgo = new Date(Date.now() - 540 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const elevenMonthsLater = new Date(Date.now() + 335 * 24 * 60 * 60 * 1000);

  serialsData.push(
    {
      serialNumber: 'IP16-SOLD-VALID',
      productId: pMap['iphone-16-pro-max']._id,
      productSkuId: p6Sku1Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.SOLD,
      soldAt: oneMonthAgo,
      warrantyEndDate: elevenMonthsLater
    },
    {
      serialNumber: 'ROG-SOLD-EXPIRED',
      productId: pMap['laptop-asus-rog-strix-g16']._id,
      productSkuId: p2Sku1Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.SOLD,
      soldAt: eighteenMonthsAgo,
      warrantyEndDate: sixMonthsAgo
    },
    {
      serialNumber: 'IP15-TRANSIT-001',
      productId: pMap['iphone-15']._id,
      productSkuId: p7Sku1Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.TRANSIT
    },
    {
      serialNumber: 'MBA-M4-SOLD-VALID',
      productId: pMap['macbook-pro-16-m3-max']._id,
      productSkuId: p1Sku1Id,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.SOLD,
      soldAt: sixMonthsAgo,
      warrantyEndDate: sixMonthsLater
    }
  );

  const createdSerials = await Serial.create(serialsData);
  console.log(`✓ Inserted ${createdSerials.length} serial numbers.`);

  // ==========================================
  // Bước 7: Khởi tạo Đơn hàng Lịch sử & Phiếu Bảo hành Mẫu
  // ==========================================
  console.log('🧾 Seeding sample orders and warranty tickets...');
  const rogExpiredSerial = createdSerials.find((s) => s.serialNumber === 'ROG-SOLD-EXPIRED');
  const ip16ValidSerial = createdSerials.find((s) => s.serialNumber === 'IP16-SOLD-VALID');

  // Đơn hàng POS
  const posOrderItemId = new mongoose.Types.ObjectId();
  const posOrder = await Order.create({
    orderCode: 'ORD-POS-261020-001',
    orderType: ORDER_TYPES.POS_STORE,
    branchId: branchQ1._id,
    staffId: staffQ1User._id,
    customerId: null,
    customerInfo: {
      fullName: 'Trần Văn Khang',
      phone: '0912345678',
      address: 'Phường Bến Thành, Quận 1, TP.HCM'
    },
    items: [
      {
        _id: posOrderItemId,
        productId: pMap['laptop-asus-rog-strix-g16']._id,
        productSkuId: p2Sku1Id,
        productName: pMap['laptop-asus-rog-strix-g16'].name,
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

  if (rogExpiredSerial) {
    await Serial.updateOne(
      { _id: rogExpiredSerial._id },
      { $set: { orderId: posOrder._id, orderItemId: posOrderItemId } }
    );
  }

  // Đơn hàng B2C Online của Hoàng Khách Hàng
  const b2cOrderItemId1 = new mongoose.Types.ObjectId();
  const b2cOrderItemId2 = new mongoose.Types.ObjectId();
  const b2cOrder = await Order.create({
    orderCode: 'ORD-B2C-261028-088',
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
        _id: b2cOrderItemId1,
        productId: pMap['iphone-16-pro-max']._id,
        productSkuId: p6Sku1Id,
        productName: pMap['iphone-16-pro-max'].name,
        sku: 'IP16PM-256GB-DESERT',
        quantity: 1,
        unitPrice: 33490000,
        subtotal: 33490000,
        serialsAssigned: ['IP16-SOLD-VALID']
      },
      {
        _id: b2cOrderItemId2,
        productId: pMap['chuot-logitech-g502-hero']._id,
        productSkuId: p21Sku1Id,
        productName: pMap['chuot-logitech-g502-hero'].name,
        sku: 'LOGI-G502-HERO',
        quantity: 1,
        unitPrice: 990000,
        subtotal: 990000,
        serialsAssigned: []
      }
    ],
    totalAmount: 34480000,
    paymentMethod: PAYMENT_METHODS.VNPAY,
    paymentStatus: PAYMENT_STATUS.PAID,
    orderStatus: ORDER_STATUS.READY_FOR_SHIPPING
  });

  if (ip16ValidSerial) {
    await Serial.updateOne(
      { _id: ip16ValidSerial._id },
      { $set: { orderId: b2cOrder._id, orderItemId: b2cOrderItemId1 } }
    );
  }

  // Phiếu bảo hành mẫu
  await WarrantyTicket.create({
    ticketCode: 'BH-Q1-261015-001',
    branchId: branchQ1._id,
    staffId: staffQ1User._id,
    serialNumber: 'ROG-SOLD-EXPIRED',
    productId: pMap['laptop-asus-rog-strix-g16']._id,
    productSkuId: p2Sku1Id,
    customerId: null,
    customerInfo: {
      fullName: 'Trần Văn Khang',
      phone: '0912345678',
      address: 'Quận 1, TP.HCM'
    },
    issueDescription: 'Máy không lên nguồn sau khi sấm sét, quạt tản nhiệt không quay',
    appearanceCondition: 'Máy trầy xước nhẹ ở mặt A, nguyên tem ốc đáy',
    accessories: ['Thân máy', 'Củ sạc zin 280W'],
    status: WARRANTY_STATUS.RETURNED,
    estimatedReturnDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    resolution: {
      repairNotes: 'Đã thay thế tụ nguồn bo mạch chủ và vệ sinh tra keo tản nhiệt mới',
      partsReplaced: ['Tụ nguồn bo mạch chủ', 'Keo tản nhiệt Thermal Grizzly'],
      repairedBy: staffQ1User._id,
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    }
  });

  // ==========================================
  // Bước 8: Khởi tạo Dữ liệu Chuyển kho, Ca POS, Đối soát & Audit Log Mẫu
  // ==========================================
  console.log('🚚 Seeding transfers, POS shifts, settlements & audit logs...');

  const transferTransit = await StockTransfer.create({
    transferCode: 'TRF-20261109-001',
    sourceBranchId: branchQ1._id,
    destinationBranchId: branchTDuc._id,
    items: [
      {
        productId: pMap['iphone-15']._id,
        productSkuId: p7Sku1Id,
        sku: 'IP15-128GB-BLU',
        productName: pMap['iphone-15'].name,
        quantity: 1,
        serialNumbers: ['IP15-TRANSIT-001']
      }
    ],
    carrierInfo: {
      carrierName: 'Giao hàng nội bộ TechOne Express',
      driverName: 'Nguyễn Minh Tài',
      driverPhone: '0909888777',
      trackingNumber: 'TO-EXP-8891'
    },
    productId: pMap['iphone-15']._id,
    productSkuId: p7Sku1Id,
    sku: 'IP15-128GB-BLU',
    productName: pMap['iphone-15'].name,
    quantity: 1,
    serialNumbers: ['IP15-TRANSIT-001'],
    status: TRANSFER_STATUS.IN_TRANSIT,
    createdById: managerQ1User._id,
    notes: 'Điều chuyển bổ sung iPhone 15 Xanh sang chi nhánh Thủ Đức đang hết hàng'
  });

  const shiftYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const shiftQ1 = await PosShift.create({
    shiftCode: 'SHF-20261109-Q1',
    branchId: branchQ1._id,
    cashierId: staffQ1User._id,
    openedAt: new Date(shiftYesterday.getTime() - 8 * 60 * 60 * 1000),
    closedAt: shiftYesterday,
    status: SHIFT_STATUS.CLOSED,
    openingBalance: 2000000,
    cashSales: 34990000,
    cashRefunds: 0,
    cashDrops: [
      {
        amount: 30000000,
        reason: 'Nộp két sắt an toàn cuối ngày',
        performedAt: new Date(shiftYesterday.getTime() - 60 * 60 * 1000),
        performedById: staffQ1User._id
      }
    ],
    expectedEndingBalance: 6990000,
    actualEndingBalance: 6990000,
    discrepancy: 0,
    discrepancyNote: '',
    approvedById: managerQ1User._id,
    totalOrdersCount: 1
  });

  const shiftTDuc = await PosShift.create({
    shiftCode: 'SHF-20261109-TD',
    branchId: branchTDuc._id,
    cashierId: staffTDucUser._id,
    openedAt: new Date(shiftYesterday.getTime() - 8 * 60 * 60 * 1000),
    closedAt: shiftYesterday,
    status: SHIFT_STATUS.CLOSED,
    openingBalance: 1500000,
    cashSales: 4500000,
    cashRefunds: 0,
    cashDrops: [
      {
        amount: 4000000,
        reason: 'Nộp tiền doanh thu ca chiều vào két',
        performedAt: new Date(shiftYesterday.getTime() - 2 * 60 * 60 * 1000),
        performedById: staffTDucUser._id
      }
    ],
    expectedEndingBalance: 2000000,
    actualEndingBalance: 1950000,
    discrepancy: -50000,
    discrepancyNote: 'Thối nhầm 50.000đ tiền lẻ cho khách mua phụ kiện',
    approvedById: managerTDucUser._id,
    totalOrdersCount: 2
  });

  const cogsAmt = Math.round(b2cOrder.totalAmount * 0.85);
  const feeAmt = Math.round(b2cOrder.totalAmount * 0.03);
  await InterBranchSettlement.create({
    settlementCode: 'STL-20261109-001',
    type: SETTLEMENT_TYPE.CROSS_BRANCH_DISPATCH,
    orderId: b2cOrder._id,
    orderCode: b2cOrder.orderCode,
    sourceBranchId: branchHQ._id,
    fulfillingBranchId: branchQ1._id,
    orderAmount: b2cOrder.totalAmount,
    cogsAmount: cogsAmt,
    fulfillmentFee: feeAmt,
    totalPayableToBranch: cogsAmt + feeAmt,
    status: SETTLEMENT_STATUS.PENDING_CLEARING,
    notes: 'Đơn online khách đã thanh toán VNPay về Trụ sở HQ, chi nhánh Q1 xuất kho giao hàng'
  });

  await AuditLog.create([
    {
      actor: {
        userId: managerQ1User._id,
        fullName: managerQ1User.fullName,
        email: managerQ1User.email,
        role: managerQ1User.role,
        branchId: branchQ1._id,
        branchCode: branchQ1.branchCode
      },
      action: AUDIT_ACTIONS.TRANSFER_CREATE,
      severity: AUDIT_SEVERITY.INFO,
      target: {
        model: 'StockTransfer',
        entityId: transferTransit._id,
        code: transferTransit.transferCode,
        name: `Phiếu chuyển kho ${transferTransit.transferCode}`
      },
      changes: {
        after: {
          transferCode: transferTransit.transferCode,
          itemsCount: 1,
          totalQuantity: 1,
          status: TRANSFER_STATUS.IN_TRANSIT
        }
      },
      context: {
        ipAddress: '127.0.0.1',
        notes: 'Từ chi nhánh BR-Q1 đến BR-TDUC'
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      actor: {
        userId: staffTDucUser._id,
        fullName: staffTDucUser.fullName,
        email: staffTDucUser.email,
        role: staffTDucUser.role,
        branchId: branchTDuc._id,
        branchCode: branchTDuc.branchCode
      },
      action: AUDIT_ACTIONS.POS_SHIFT_CLOSE,
      severity: AUDIT_SEVERITY.CRITICAL,
      target: {
        model: 'PosShift',
        entityId: shiftTDuc._id,
        code: shiftTDuc.shiftCode,
        name: `Ca thu ngân ${shiftTDuc.shiftCode}`
      },
      changes: {
        before: { status: SHIFT_STATUS.OPEN },
        after: {
          status: SHIFT_STATUS.CLOSED,
          expectedEndingBalance: 2000000,
          actualEndingBalance: 1950000,
          discrepancy: -50000
        },
        diff: { discrepancy: -50000 }
      },
      context: {
        ipAddress: '127.0.0.1',
        reason: 'Chốt ca cuối ngày Thủ Đức',
        notes: 'Chốt ca lệch -50.000 đ: Thối nhầm 50.000đ tiền lẻ cho khách mua phụ kiện'
      },
      timestamp: shiftYesterday
    },
    {
      actor: {
        userId: adminUser._id,
        fullName: adminUser.fullName,
        email: adminUser.email,
        role: adminUser.role,
        branchId: null,
        branchCode: 'BR-HQ'
      },
      action: AUDIT_ACTIONS.STOCK_ADJUST,
      severity: AUDIT_SEVERITY.WARNING,
      target: {
        model: 'BranchInventory',
        entityId: branchHQ._id,
        code: 'IP16PM-256GB-DESERT',
        name: `${pMap['iphone-16-pro-max'].name} (IP16PM-256GB-DESERT)`
      },
      changes: {
        before: { quantity: 6 },
        after: { quantity: 5 },
        diff: { quantityPhysical: -1, quantityAvailable: -1 }
      },
      context: {
        ipAddress: '127.0.0.1',
        reason: 'Chuyển 1 máy làm hàng trưng bày tại Flagship Q1',
        notes: 'Chi nhánh BR-HQ: delta -1'
      },
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    }
  ]);

  console.log('\n======================================================');
  console.log('🎉 SEEDING DATA HOÀN TẤT THÀNH CÔNG VỚI DỮ LIỆU ĐA DẠNG!');
  console.log(`- Chi nhánh: 3 (HQ, Q1 Flagship, Thủ Đức Hub)`);
  console.log(`- Danh mục: 5 nhóm ngành hàng (Laptop, Smartphone, Màn hình, Âm thanh, Gear)`);
  console.log(`- Nhãn hiệu: Apple, ASUS, Dell, Lenovo, Acer, Samsung, Xiaomi, LG, Sony, Marshall, Sennheiser, Logitech, Razer, Keychron, Corsair`);
  console.log(`- Sản phẩm: ${createdProducts.length} sản phẩm, hàng chục biến thể SKU`);
  console.log(`- Tồn kho: ${inventoryList.length} bản ghi tồn kho chi nhánh (có cả SKU hết hàng để test)`);
  console.log(`- Mã Serial/IMEI: ${createdSerials.length} mã máy (IN_STOCK, SOLD còn hạn, SOLD hết hạn, TRANSIT)`);
  console.log(`- Đơn hàng mẫu: POS Completed, B2C Online READY_FOR_SHIPPING`);
  console.log(`- Phiếu chuyển kho: 1 phiếu IN_TRANSIT (BR-Q1 -> BR-TDUC, IP15-TRANSIT-001)`);
  console.log(`- Ca thu ngân lịch sử: 2 ca CLOSED (Q1 cân đối, Thủ Đức lệch -50.000đ)`);
  console.log(`- Đối soát công nợ: 1 phiếu PENDING_CLEARING (${b2cOrder.orderCode})`);
  console.log(`- Audit Logs: 3 bản ghi mẫu (TRANSFER_CREATE, POS_SHIFT_CLOSE, STOCK_ADJUST)`);
  console.log(`- Tài khoản test:`);
  console.log(`  * Super Admin: admin@techstore.com / 123456`);
  console.log(`  * Branch Manager: manager.q1@techstore.com, manager.tduc@techstore.com / 123456`);
  console.log(`  * POS Staff: staff.q1@techstore.com, staff.tduc@techstore.com / 123456`);
  console.log(`  * Customer B2C: customer@gmail.com / 123456`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Lỗi khi chạy Seeding:', err);
  process.exit(1);
});
