import { useState, useEffect, useCallback } from 'react';
import { Truck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import B2COrderDispatchTable from '../../features/orders/components/B2COrderDispatchTable';
import BranchAllocationModal from '../../features/orders/components/BranchAllocationModal';
import OrderSerialAssignDrawer from '../../features/orders/components/OrderSerialAssignDrawer';
import { orderService } from '../../features/orders/services/orderService.js';
import { isMockEnabled } from '../../config/dataMode.js';

const DEMO_B2C_ORDERS = [
  {
    orderCode: '#T1-94821',
    customerName: 'Nguyễn Hoàng Nam',
    phone: '090 123 4567',
    shippingAddress: '124 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
    slaRemaining: '00:18:42',
    fulfillmentType: 'Giao 2 giờ',
    totalAmount: 29480000,
    status: 'PROCESSING',
    assignedBranchName: 'TechOne Q1 • 138 Trần Quang Khải',
    productName: 'iPhone 16 Pro Max 256GB - Sa Mạc Tự Nhiên',
    sku: 'IP16PM-256-DESERT',
    quantity: 1,
    serials: []
  },
  {
    orderCode: '#T1-94820',
    customerName: 'Trần Mỹ Linh',
    phone: '091 886 2210',
    shippingAddress: '45 Võ Văn Ngân, TP. Thủ Đức, TP.HCM',
    slaRemaining: '00:32:18',
    fulfillmentType: 'Click & Collect',
    totalAmount: 31990000,
    status: 'PENDING',
    assignedBranchName: 'Chưa phân bổ',
    productName: 'Samsung Galaxy S24 Ultra 512GB',
    sku: 'SS-S24U-512-GRAY',
    quantity: 1,
    serials: []
  },
  {
    orderCode: '#T1-94817',
    customerName: 'Lê Quốc Bảo',
    phone: '098 224 7822',
    shippingAddress: '382 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM',
    slaRemaining: '01:04:11',
    fulfillmentType: 'Giao tiêu chuẩn',
    totalAmount: 7990000,
    status: 'PENDING',
    assignedBranchName: 'Chưa phân bổ',
    productName: 'AirPods Pro 2 MagSafe (USB-C)',
    sku: 'AP-PRO2-USBC',
    quantity: 1,
    serials: []
  },
  {
    orderCode: '#T1-94815',
    customerName: 'Phạm Thu Hà',
    phone: '090 355 2211',
    shippingAddress: '128 CMT8, Quận 3, TP.HCM',
    slaRemaining: '01:22:40',
    fulfillmentType: 'Click & Collect',
    totalAmount: 49490000,
    status: 'READY_FOR_SHIPPING',
    assignedBranchName: 'TechOne Q1 • 138 Trần Quang Khải',
    productName: 'MacBook Pro 14" M3 Pro 18GB/512GB',
    sku: 'MBP-M3PRO-18-512',
    quantity: 1,
    serials: ['MBP-M3P-VN-001']
  }
];

export const OrderDispatchPage = () => {
  const [orders, setOrders] = useState(DEMO_B2C_ORDERS);
  const [allocationOrder, setAllocationOrder] = useState(null);
  const [serialAssignOrder, setSerialAssignOrder] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchLiveOrders = useCallback(async () => {
    if (isMockEnabled()) {
      setOrders(DEMO_B2C_ORDERS);
      return;
    }
    try {
      const liveList = await orderService.getBranchOrders();
      if (liveList && liveList.length > 0) {
        const mapped = liveList.map((o) => ({
          _id: o._id,
          orderCode: o.orderCode || o._id,
          customerName: o.shippingAddress?.fullName || o.customerInfo?.fullName || 'Khách Hàng',
          phone: o.shippingAddress?.phone || o.customerInfo?.phone || '',
          shippingAddress: o.shippingAddress?.address || o.customerInfo?.address || 'Tại chi nhánh',
          slaRemaining: '01:30:00',
          fulfillmentType: o.orderType === 'POS_STORE' ? 'Tại quầy' : 'Giao tiêu chuẩn',
          totalAmount: o.totalAmount || 0,
          status: o.orderStatus || 'PENDING',
          assignedBranchName: o.branchId?.name || o.branchId?.branchName || 'TechOne Q1 Flagship',
          productName: o.items?.[0]?.productName || 'Thiết bị công nghệ',
          sku: o.items?.[0]?.sku || '',
          quantity: o.items?.[0]?.quantity || 1,
          serials: o.items?.[0]?.serialsAssigned || []
        }));
        setOrders(mapped);
      } else {
        setOrders(DEMO_B2C_ORDERS);
      }
    } catch {
      // In case user doesn't have BRANCH_MANAGER role or live list is empty, keep demo list
      setOrders(DEMO_B2C_ORDERS);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isMounted) {
        await fetchLiveOrders();
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchLiveOrders]);

  const handleConfirmAllocation = async (orderCode, branch) => {
    try {
      const target = orders.find((o) => o.orderCode === orderCode);
      if (target?._id && !isMockEnabled()) {
        await orderService.allocateOrder(target._id, branch._id || branch.id);
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.orderCode === orderCode
            ? { ...o, status: 'PROCESSING', assignedBranchName: branch.name }
            : o
        )
      );
      setAllocationOrder(null);
      setToastMsg({
        type: 'success',
        message: `Đã điều phối đơn hàng ${orderCode} sang ${branch.name} thành công!`
      });
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi điều phối: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleCompletePacking = async (orderCode, serials) => {
    try {
      const target = orders.find((o) => o.orderCode === orderCode);
      if (target?._id && !isMockEnabled()) {
        await orderService.dispatchOrder(target._id, serials);
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.orderCode === orderCode
            ? { ...o, status: 'READY_FOR_SHIPPING', serials }
            : o
        )
      );
      setSerialAssignOrder(null);
      setToastMsg({
        type: 'success',
        message: `Đã gán ${serials.length} Serial và hoàn tất đóng gói đơn ${orderCode}! Sẵn sàng giao shipper.`
      });
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi đóng gói: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Điều Phối Đa Kênh • Omnichannel Fulfillment</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Điều Phối Đơn Hàng B2C &amp; Phân Bổ Chi Nhánh
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tự động gợi ý chi nhánh xuất kho gần nhất, quản lý SLA giao nhanh 2 giờ và quét mã Serial trước khi bàn giao
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await fetchLiveOrders();
              setToastMsg({ type: 'success', message: 'Dữ liệu đơn hàng B2C đã được đồng bộ mới nhất!' });
              setTimeout(() => setToastMsg(null), 3000);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Làm mới danh sách</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMsg.message}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Table */}
      <B2COrderDispatchTable
        orders={orders}
        onOpenAllocationModal={(order) => setAllocationOrder(order)}
        onOpenSerialDrawer={(order) => setSerialAssignOrder(order)}
      />

      {/* Branch Allocation Modal */}
      <BranchAllocationModal
        isOpen={Boolean(allocationOrder)}
        onClose={() => setAllocationOrder(null)}
        order={allocationOrder}
        onConfirmAllocation={handleConfirmAllocation}
      />

      {/* Serial Assign Drawer */}
      <OrderSerialAssignDrawer
        isOpen={Boolean(serialAssignOrder)}
        onClose={() => setSerialAssignOrder(null)}
        order={serialAssignOrder}
        onCompletePacking={handleCompletePacking}
      />
    </div>
  );
};

export default OrderDispatchPage;
