import mongoose from 'mongoose';
import {
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
  PosShift,
  SHIFT_STATUS,
  VOUCHER_TYPES,
  Stocktake,
  STOCKTAKE_STATUS,
  TransferRequest,
  TRANSFER_REQUEST_STATUS,
  RmaOutbound,
  ApprovalRequest,
  APPROVAL_TYPES,
  APPROVAL_LEVELS,
  APPROVAL_STATUS,
  Complaint,
  COMPLAINT_STATUS,
  COMPLAINT_SEVERITY,
  WorkSchedule,
  SHIFT_TYPES,
  ATTENDANCE_STATUS,
  SWAP_STATUS,
  Vendor,
  PurchaseOrder,
  PO_STATUS,
  PO_PAYMENT_STATUS,
  BranchExpense,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUS,
  CommissionRule,
  COMMISSION_RULE_TYPES,
  AuditLog,
  AUDIT_ACTIONS,
  AUDIT_SEVERITY
} from '../models/index.js';

function getVnDateStr(offsetDays = 0) {
  const dt = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dt);
}

/**
 * Đổ đầy đủ dữ liệu mở rộng cho 3 tầng nghiệp vụ:
 * 1) POS Thu ngân & Bán hàng (Ca đang mở, Phiếu thu chi, Đơn POS/B2C đa dạng, Bảo hành đang sửa)
 * 2) Quản lý Chi nhánh (Kiểm kho, Xin cấp hàng, RMA, Khiếu nại, Phê duyệt đặc quyền, Lịch ca & Đổi ca)
 * 3) Quản lý Tổng HQ (NCC & PO, Định mức Min/Max, Dead Stock > 30d, P&L OPEX & Hoa hồng, Báo động đỏ)
 */
export async function seedExpansionData({
  branches: { branchHQ, branchQ1, branchTDuc },
  users: { adminUser, managerQ1User, staffQ1User, staff2Q1User, staffTDucUser, customerUser },
  categories: { catGamingGear },
  pMap,
  skuIds: { p1Sku1Id, p4Sku1Id, p6Sku1Id, p21Sku1Id },
  posOrder
}) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // ----------------------------------------------------
  // 1. Định mức Min/Max cho Auto-Replenishment & Dead Stock Rebalance
  // ----------------------------------------------------
  // BR-TDUC có IP16PM = 2 < minStock = 5 (trong khi BR-HQ có 5) -> Gợi ý cấp hàng Min/Max
  await BranchInventory.updateOne(
    { branchId: branchTDuc._id, productSkuId: p6Sku1Id },
    { $set: { minStock: 5, maxStock: 8 } }
  );
  await BranchInventory.updateOne(
    { branchId: branchQ1._id, productSkuId: p6Sku1Id },
    { $set: { minStock: 3, maxStock: 6 } }
  );
  // BR-TDUC hết ThinkPad X1 Carbon (quantity: 0, minStock: 2) trong khi BR-Q1 đang tồn 2 máy > 40 ngày
  await BranchInventory.updateOne(
    { branchId: branchTDuc._id, productId: pMap['lenovo-thinkpad-x1-carbon-gen-12']._id, productSkuId: p4Sku1Id },
    { $set: { quantity: 0, minStock: 2, maxStock: 4 } },
    { upsert: true }
  );
  await BranchInventory.updateOne(
    { branchId: branchQ1._id, productSkuId: p4Sku1Id },
    { $set: { minStock: 1, maxStock: 3 } }
  );

  // Làm già ngày tạo của 2 Serial ThinkPad X1 Carbon tại Q1 > 42 ngày -> kích hoạt Dead Stock Balancing & Red Alert
  await Serial.collection.updateMany(
    {
      branchId: branchQ1._id,
      productSkuId: p4Sku1Id,
      status: SERIAL_STATUS.IN_STOCK
    },
    { $set: { createdAt: daysAgo(42), updatedAt: daysAgo(42) } }
  );

  // Thêm 1 Serial lỗi DEFECTIVE để test xuất RMA Outbound tại Q1
  await Serial.create({
    serialNumber: 'DEF-IP16-Q1-001',
    productId: pMap['iphone-16-pro-max']._id,
    productSkuId: p6Sku1Id,
    branchId: branchQ1._id,
    status: SERIAL_STATUS.DEFECTIVE
  });

  // ----------------------------------------------------
  // 2. Đơn hàng đa kênh & nhiều kỳ để BI + Store Ranking + Demand Forecast ra số thật
  // ----------------------------------------------------
  const ip16Sku = pMap['iphone-16-pro-max'].skus.find((s) => String(s._id) === String(p6Sku1Id));
  const mbpSku = pMap['macbook-pro-16-m3-max'].skus.find((s) => String(s._id) === String(p1Sku1Id));
  const g502Sku = pMap['chuot-logitech-g502-hero'].skus.find((s) => String(s._id) === String(p21Sku1Id));

  // Đơn kỳ trước (38 ngày trước) để tính Growth % thật
  await Order.collection.insertOne({
    orderCode: 'ORD-POS-PREV-001',
    orderType: ORDER_TYPES.POS_STORE,
    branchId: branchQ1._id,
    staffId: staffQ1User._id,
    customerInfo: { fullName: 'Nguyễn Minh Quân', phone: '0911223344', address: 'Quận 1, TP.HCM' },
    items: [
      {
        _id: new mongoose.Types.ObjectId(),
        productId: pMap['iphone-16-pro-max']._id,
        productSkuId: p6Sku1Id,
        productName: pMap['iphone-16-pro-max'].name,
        sku: ip16Sku.sku,
        quantity: 2,
        unitPrice: ip16Sku.salePrice,
        costPrice: ip16Sku.costPrice,
        subtotal: ip16Sku.salePrice * 2,
        serialsAssigned: []
      }
    ],
    totalAmount: ip16Sku.salePrice * 2,
    refundedAmount: 0,
    paymentMethod: PAYMENT_METHODS.CASH,
    paymentStatus: PAYMENT_STATUS.PAID,
    orderStatus: ORDER_STATUS.COMPLETED,
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38)
  });

  // Đơn POS gần đây cho Nhân viên 2 Q1 + Đơn B2C đang giữ chỗ (PENDING) + Đơn hoàn tại Thủ Đức
  const recentOrders = await Order.create([
    {
      orderCode: 'ORD-POS-Q1-002',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchQ1._id,
      staffId: staff2Q1User._id,
      customerInfo: { fullName: 'Lê Hoàng Anh', phone: '0908112233', address: 'Quận 3, TP.HCM' },
      items: [
        {
          productId: pMap['macbook-pro-16-m3-max']._id,
          productSkuId: p1Sku1Id,
          productName: pMap['macbook-pro-16-m3-max'].name,
          sku: mbpSku.sku,
          quantity: 1,
          unitPrice: mbpSku.salePrice,
          costPrice: mbpSku.costPrice,
          subtotal: mbpSku.salePrice,
          serialsAssigned: ['MBA-M4-SOLD-VALID']
        },
        {
          productId: pMap['chuot-logitech-g502-hero']._id,
          productSkuId: p21Sku1Id,
          productName: pMap['chuot-logitech-g502-hero'].name,
          sku: g502Sku.sku,
          quantity: 4,
          unitPrice: g502Sku.salePrice,
          costPrice: g502Sku.costPrice,
          subtotal: g502Sku.salePrice * 4,
          serialsAssigned: []
        }
      ],
      totalAmount: mbpSku.salePrice + g502Sku.salePrice * 4,
      paymentMethod: PAYMENT_METHODS.VNPAY,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED,
      completedAt: daysAgo(2)
    },
    {
      orderCode: 'ORD-B2C-Q1-PICKUP',
      orderType: ORDER_TYPES.B2C_ONLINE,
      branchId: branchQ1._id,
      customerId: customerUser._id,
      customerInfo: {
        fullName: customerUser.fullName,
        phone: customerUser.phone,
        address: 'Nhận tại cửa hàng Quận 1'
      },
      items: [
        {
          productId: pMap['iphone-16-pro-max']._id,
          productSkuId: p6Sku1Id,
          productName: pMap['iphone-16-pro-max'].name,
          sku: ip16Sku.sku,
          quantity: 1,
          unitPrice: ip16Sku.salePrice,
          costPrice: ip16Sku.costPrice,
          subtotal: ip16Sku.salePrice,
          serialsAssigned: []
        }
      ],
      totalAmount: ip16Sku.salePrice,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PROCESSING
    },
    {
      orderCode: 'ORD-POS-TD-OK01',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchTDuc._id,
      staffId: staffTDucUser._id,
      customerInfo: { fullName: 'Phạm Hữu Nghĩa', phone: '0977665544', address: 'Thủ Đức' },
      items: [
        {
          productId: pMap['iphone-16-pro-max']._id,
          productSkuId: p6Sku1Id,
          productName: pMap['iphone-16-pro-max'].name,
          sku: ip16Sku.sku,
          quantity: 3,
          unitPrice: ip16Sku.salePrice,
          costPrice: ip16Sku.costPrice,
          subtotal: ip16Sku.salePrice * 3,
          serialsAssigned: []
        }
      ],
      totalAmount: ip16Sku.salePrice * 3,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED,
      completedAt: daysAgo(1)
    },
    {
      orderCode: 'ORD-POS-TD-RET01',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchTDuc._id,
      staffId: staffTDucUser._id,
      customerInfo: { fullName: 'Trương Tấn Đạt', phone: '0988776655', address: 'Thủ Đức' },
      items: [
        {
          productId: pMap['iphone-16-pro-max']._id,
          productSkuId: p6Sku1Id,
          productName: pMap['iphone-16-pro-max'].name,
          sku: ip16Sku.sku,
          quantity: 1,
          unitPrice: ip16Sku.salePrice,
          costPrice: ip16Sku.costPrice,
          subtotal: ip16Sku.salePrice,
          returnedQuantity: 1,
          serialsAssigned: []
        }
      ],
      totalAmount: ip16Sku.salePrice,
      refundedAmount: ip16Sku.salePrice,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.REFUNDED,
      orderStatus: ORDER_STATUS.RETURNED
    }
  ]);

  // ----------------------------------------------------
  // 3. Ca POS đang MỞ (OPEN) tại Q1 (kèm phiếu thu chi) + Bảo hành đang sửa
  // ----------------------------------------------------
  const activeShiftQ1 = await PosShift.create({
    shiftCode: 'SHF-TODAY-Q1-OPEN',
    branchId: branchQ1._id,
    cashierId: staffQ1User._id,
    openedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    status: SHIFT_STATUS.OPEN,
    openingBalance: 2000000,
    cashSales: 12500000,
    cashInTotal: 500000,
    cashOutTotal: 250000,
    cashVouchers: [
      {
        voucherCode: 'VCH-IN-001',
        type: VOUCHER_TYPES.IN,
        category: 'Nạp tiền lẻ bổ sung',
        amount: 500000,
        reason: 'Bổ sung tiền thối đầu ca sáng',
        performedById: staffQ1User._id,
        performedByName: staffQ1User.fullName
      },
      {
        voucherCode: 'VCH-OUT-001',
        type: VOUCHER_TYPES.OUT,
        category: 'Văn phòng phẩm quầy',
        amount: 250000,
        reason: 'Mua 5 cuộn giấy in bill nhiệt POS',
        performedById: staffQ1User._id,
        performedByName: staffQ1User.fullName
      }
    ],
    expectedEndingBalance: 14750000,
    totalOrdersCount: 2
  });

  const activeWarranty = await WarrantyTicket.create({
    ticketCode: 'BH-Q1-TODAY-002',
    branchId: branchQ1._id,
    staffId: staffQ1User._id,
    serialNumber: 'MBA-M4-SOLD-VALID',
    productId: pMap['macbook-pro-16-m3-max']._id,
    productSkuId: p1Sku1Id,
    customerInfo: {
      fullName: 'Lê Hoàng Anh',
      phone: '0908112233',
      address: 'Quận 3, TP.HCM'
    },
    issueDescription: 'Loa bên phải hơi rè khi mở âm lượng trên 80%',
    appearanceCondition: 'Máy đẹp 99%, không cấn móp',
    accessories: ['Thân máy MacBook', 'Sạc MagSafe 140W'],
    status: WARRANTY_STATUS.REPAIRING,
    estimatedReturnDate: getVnDateStr(3)
  });

  // ----------------------------------------------------
  // 4. Nghiệp vụ Quản lý Chi nhánh (Stocktake, TransferRequest, RMA, Complaints, Roster)
  // ----------------------------------------------------
  await Stocktake.create({
    stocktakeCode: 'STK-Q1-INPROG-01',
    branchId: branchQ1._id,
    createdBy: { userId: managerQ1User._id, fullName: managerQ1User.fullName },
    status: STOCKTAKE_STATUS.IN_PROGRESS,
    note: 'Kiểm kho định kỳ tuần này khu vực Apple Q1',
    expectedSerials: [
      {
        serialNumber: 'IP16PM-Q1-001',
        productId: pMap['iphone-16-pro-max']._id,
        productSkuId: p6Sku1Id,
        sku: ip16Sku.sku,
        productName: pMap['iphone-16-pro-max'].name
      },
      {
        serialNumber: 'IP16PM-Q1-002',
        productId: pMap['iphone-16-pro-max']._id,
        productSkuId: p6Sku1Id,
        sku: ip16Sku.sku,
        productName: pMap['iphone-16-pro-max'].name
      }
    ],
    scannedSerials: ['IP16PM-Q1-001'],
    summary: { expectedCount: 2, scannedCount: 1, matchedCount: 1, missingCount: 1, surplusCount: 0 }
  });

  await TransferRequest.create({
    requestCode: 'REQ-TDUC-HQ-001',
    requestingBranchId: branchTDuc._id,
    sourceBranchId: branchHQ._id,
    requestedBy: { userId: staffTDucUser._id, fullName: staffTDucUser.fullName },
    items: [
      {
        productId: pMap['macbook-pro-16-m3-max']._id,
        productSkuId: p1Sku1Id,
        sku: mbpSku.sku,
        productName: pMap['macbook-pro-16-m3-max'].name,
        quantity: 2
      }
    ],
    reason: 'Khách doanh nghiệp Thủ Đức đặt cọc 2 máy MacBook M3 Max',
    status: TRANSFER_REQUEST_STATUS.PENDING
  });

  await RmaOutbound.create({
    rmaCode: 'RMA-Q1-261110-01',
    branchId: branchQ1._id,
    createdBy: { userId: managerQ1User._id, fullName: managerQ1User.fullName },
    destinationType: 'BRAND_SERVICE',
    destinationName: 'TTBH Apple Care Việt Nam - Q1',
    trackingNumber: 'APPLE-RMA-9981',
    reason: 'Xuất bảo hành hãng lỗi màn hình sọc xanh',
    items: [
      {
        serialNumber: 'DEF-IP16-Q1-001',
        productId: pMap['iphone-16-pro-max']._id,
        productSkuId: p6Sku1Id,
        sku: ip16Sku.sku,
        productName: pMap['iphone-16-pro-max'].name
      }
    ]
  });

  await Complaint.create([
    {
      complaintCode: 'CMP-Q1-OPEN-001',
      branchId: branchQ1._id,
      orderId: recentOrders[0]._id,
      orderCode: recentOrders[0].orderCode,
      warrantyTicketId: activeWarranty._id,
      customerInfo: { fullName: 'Lê Hoàng Anh', phone: '0908112233' },
      severity: COMPLAINT_SEVERITY.HIGH,
      status: COMPLAINT_STATUS.OPEN,
      description: 'Khách phản ánh chờ bảo hành MacBook lâu hơn cam kết ban đầu',
      reportedBy: { userId: staffQ1User._id, fullName: staffQ1User.fullName }
    },
    {
      complaintCode: 'CMP-Q1-DONE-002',
      branchId: branchQ1._id,
      orderId: posOrder._id,
      orderCode: posOrder.orderCode,
      customerInfo: { fullName: 'Trần Văn Khang', phone: '0912345678' },
      severity: COMPLAINT_SEVERITY.NORMAL,
      status: COMPLAINT_STATUS.RESOLVED,
      description: 'Khách hỏi lại chính sách vệ sinh laptop miễn phí định kỳ',
      reportedBy: { userId: staffQ1User._id, fullName: staffQ1User.fullName },
      assignedManagerId: managerQ1User._id,
      resolutionNote: 'Quản lý Q1 đã gọi điện giải thích và tặng lượt vệ sinh máy miễn phí',
      compensationNote: 'Miễn phí vệ sinh + tra keo tản nhiệt 1 lần',
      resolvedAt: daysAgo(1)
    }
  ]);

  const yesterdayStr = getVnDateStr(-1);
  const todayStr = getVnDateStr(0);
  const tomorrowStr = getVnDateStr(1);

  await WorkSchedule.create([
    {
      branchId: branchQ1._id,
      staffId: staffQ1User._id,
      dateStr: yesterdayStr,
      shiftType: SHIFT_TYPES.MORNING,
      attendanceStatus: ATTENDANCE_STATUS.LATE,
      actualCheckInAt: daysAgo(1),
      actualCheckOutAt: new Date(daysAgo(1).getTime() + 6 * 60 * 60 * 1000),
      assignedById: managerQ1User._id
    },
    {
      branchId: branchQ1._id,
      staffId: staffQ1User._id,
      dateStr: todayStr,
      shiftType: SHIFT_TYPES.MORNING,
      attendanceStatus: ATTENDANCE_STATUS.SCHEDULED,
      assignedById: managerQ1User._id
    },
    {
      branchId: branchQ1._id,
      staffId: staff2Q1User._id,
      dateStr: todayStr,
      shiftType: SHIFT_TYPES.AFTERNOON,
      attendanceStatus: ATTENDANCE_STATUS.SCHEDULED,
      assignedById: managerQ1User._id
    },
    {
      branchId: branchQ1._id,
      staffId: staffQ1User._id,
      dateStr: tomorrowStr,
      shiftType: SHIFT_TYPES.SPLIT,
      attendanceStatus: ATTENDANCE_STATUS.SCHEDULED,
      assignedById: managerQ1User._id,
      swapRequest: {
        status: SWAP_STATUS.PENDING,
        requestedNote: 'Xin đổi ca gãy ngày mai cho Nguyễn Bảo do bận việc gia đình',
        targetStaffId: staff2Q1User._id
      }
    }
  ]);

  // ----------------------------------------------------
  // 5. HQ Procurement (Vendors & Purchase Orders) + Finance (Expenses, Executive Approval, Commissions)
  // ----------------------------------------------------
  const [vendorFpt, vendorApple] = await Vendor.create([
    {
      vendorCode: 'NPP-SYNNEX-FPT',
      name: 'Công ty Phân Phối Synnex FPT',
      taxCode: '0102938475',
      contactName: 'Anh Nam Kinh Doanh',
      phone: '02873008888',
      email: 'b2b@synnexfpt.com',
      address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
      paymentTermDays: 30,
      totalPurchased: 250000000,
      totalPaid: 150000000,
      outstandingDebt: 100000000,
      isActive: true
    },
    {
      vendorCode: 'NPP-APPLE-VN',
      name: 'Apple Authorized Distributor Vietnam',
      taxCode: '0309988776',
      contactName: 'Chị Hương Key Account',
      phone: '02838239999',
      email: 'orders@apple-dist.vn',
      address: 'Quận 1, TP.HCM',
      paymentTermDays: 45,
      totalPurchased: 0,
      totalPaid: 0,
      outstandingDebt: 0,
      isActive: true
    }
  ]);

  await PurchaseOrder.create([
    {
      poCode: 'PO-20261105-001',
      vendorId: vendorFpt._id,
      warehouseBranchId: branchHQ._id,
      status: PO_STATUS.RECEIVED,
      paymentStatus: PO_PAYMENT_STATUS.PARTIAL,
      totalAmount: 250000000,
      paidAmount: 150000000,
      notes: 'Nhập lô iPhone 16 Pro Max đợt đầu tháng',
      createdBy: { userId: adminUser._id, fullName: adminUser.fullName },
      receivedBy: { userId: adminUser._id, fullName: adminUser.fullName },
      receivedAt: daysAgo(5),
      items: [
        {
          productId: pMap['iphone-16-pro-max']._id,
          productSkuId: p6Sku1Id,
          sku: ip16Sku.sku,
          productName: pMap['iphone-16-pro-max'].name,
          isSerialManaged: true,
          orderedQty: 10,
          receivedQty: 10,
          unitCost: 25000000,
          subtotal: 250000000,
          serials: []
        }
      ],
      payments: [
        {
          amount: 150000000,
          note: 'Thanh toán đợt 1 (60%)',
          paidAt: daysAgo(3),
          paidById: adminUser._id,
          paidByName: adminUser.fullName
        }
      ]
    },
    {
      poCode: 'PO-20261111-002',
      vendorId: vendorApple._id,
      warehouseBranchId: branchHQ._id,
      status: PO_STATUS.ORDERED,
      paymentStatus: PO_PAYMENT_STATUS.UNPAID,
      totalAmount: 3 * 67000000,
      paidAmount: 0,
      notes: 'Đơn đặt bổ sung MacBook Pro 16 M3 Max về Kho HQ (sẵn sàng bấm Nhận hàng)',
      createdBy: { userId: adminUser._id, fullName: adminUser.fullName },
      items: [
        {
          productId: pMap['macbook-pro-16-m3-max']._id,
          productSkuId: p1Sku1Id,
          sku: mbpSku.sku,
          productName: pMap['macbook-pro-16-m3-max'].name,
          isSerialManaged: true,
          orderedQty: 3,
          receivedQty: 0,
          unitCost: 67000000,
          subtotal: 3 * 67000000,
          serials: []
        }
      ]
    }
  ]);

  const [, , pendingTdExpense] = await BranchExpense.create([
    {
      expenseCode: 'EXP-Q1-RENT-01',
      branchId: branchQ1._id,
      monthKey,
      category: EXPENSE_CATEGORIES.RENT,
      amount: 22000000,
      description: 'Thuê mặt bằng Flagship Q1 tháng hiện tại',
      status: EXPENSE_STATUS.APPROVED,
      createdBy: { userId: adminUser._id, fullName: adminUser.fullName, role: adminUser.role },
      reviewedBy: { userId: adminUser._id, fullName: adminUser.fullName },
      reviewedAt: daysAgo(2)
    },
    {
      expenseCode: 'EXP-Q1-UTIL-02',
      branchId: branchQ1._id,
      monthKey,
      category: EXPENSE_CATEGORIES.UTILITIES,
      amount: 3500000,
      description: 'Tiền điện, điều hòa & internet cáp quang Q1',
      status: EXPENSE_STATUS.APPROVED,
      createdBy: { userId: managerQ1User._id, fullName: managerQ1User.fullName, role: managerQ1User.role },
      reviewedBy: { userId: managerQ1User._id, fullName: managerQ1User.fullName },
      reviewedAt: daysAgo(1)
    },
    {
      expenseCode: 'EXP-TD-RENT-03',
      branchId: branchTDuc._id,
      monthKey,
      category: EXPENSE_CATEGORIES.RENT,
      amount: 15000000,
      description: 'Đề xuất thanh toán thuê mặt bằng Thủ Đức tháng hiện tại (>= 5tr chờ CEO duyệt)',
      status: EXPENSE_STATUS.PENDING_EXECUTIVE,
      createdBy: { userId: staffTDucUser._id, fullName: staffTDucUser.fullName, role: 'BRANCH_MANAGER' }
    }
  ]);

  await ApprovalRequest.create([
    {
      requestCode: 'APR-BM-Q1-001',
      branchId: branchQ1._id,
      type: APPROVAL_TYPES.LARGE_CASH_OUT,
      approvalLevel: APPROVAL_LEVELS.BRANCH_MANAGER,
      status: APPROVAL_STATUS.PENDING,
      requestedBy: { userId: staffQ1User._id, fullName: staffQ1User.fullName, role: staffQ1User.role },
      targetModel: 'PosShift',
      targetId: activeShiftQ1._id,
      targetCode: activeShiftQ1.shiftCode,
      estimatedAmount: 1800000,
      reason: 'Chi tiền mặt gấp mua thêm tủ kính trưng bày phụ kiện quầy Q1',
      payload: { category: 'Trang thiết bị quầy', amount: 1800000 }
    },
    {
      requestCode: 'APR-HQ-EXEC-001',
      branchId: branchTDuc._id,
      type: APPROVAL_TYPES.EXECUTIVE_EXPENSE,
      approvalLevel: APPROVAL_LEVELS.EXECUTIVE,
      status: APPROVAL_STATUS.PENDING,
      requestedBy: { userId: staffTDucUser._id, fullName: 'Võ Minh Trưởng Shop Thủ Đức', role: 'BRANCH_MANAGER' },
      targetModel: 'BranchExpense',
      targetId: pendingTdExpense._id,
      targetCode: pendingTdExpense.expenseCode,
      estimatedAmount: 15000000,
      reason: pendingTdExpense.description,
      payload: { category: EXPENSE_CATEGORIES.RENT, monthKey, amount: 15000000 }
    }
  ]);

  await CommissionRule.create([
    {
      name: 'Hoa hồng mặc định bán máy toàn chuỗi',
      categoryId: null,
      ruleType: COMMISSION_RULE_TYPES.FIXED_PER_UNIT,
      value: 150000,
      isActive: true,
      updatedBy: { userId: adminUser._id, fullName: adminUser.fullName }
    },
    {
      name: 'Hoa hồng Phụ kiện & Gaming Gear 10%',
      categoryId: catGamingGear._id,
      ruleType: COMMISSION_RULE_TYPES.PERCENT_OF_REVENUE,
      value: 10,
      isActive: true,
      updatedBy: { userId: adminUser._id, fullName: adminUser.fullName }
    }
  ]);

  await AuditLog.create([
    {
      actor: {
        userId: adminUser._id,
        fullName: adminUser.fullName,
        email: adminUser.email,
        role: adminUser.role,
        branchId: null,
        branchCode: 'BR-HQ'
      },
      action: AUDIT_ACTIONS.PO_RECEIVE,
      severity: AUDIT_SEVERITY.INFO,
      target: {
        model: 'PurchaseOrder',
        code: 'PO-20261105-001',
        name: 'Nhận kho PO-20261105-001'
      },
      changes: {
        after: { status: PO_STATUS.RECEIVED, totalAmount: 250000000 }
      },
      context: { ipAddress: '127.0.0.1', notes: 'Nhập lô 10 iPhone 16 Pro Max từ Synnex FPT vào Kho HQ' },
      timestamp: daysAgo(5)
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
      action: AUDIT_ACTIONS.COMMISSION_RULE_CHANGE,
      severity: AUDIT_SEVERITY.WARNING,
      target: {
        model: 'CommissionRule',
        code: 'COMM-GLOBAL',
        name: 'Hoa hồng mặc định 150k/máy & Phụ kiện 10%'
      },
      changes: { after: { fixedPerUnit: 150000, accessoriesPct: 10 } },
      context: { ipAddress: '127.0.0.1', notes: 'Thiết lập chính sách hoa hồng toàn chuỗi' },
      timestamp: daysAgo(2)
    }
  ]);
}
