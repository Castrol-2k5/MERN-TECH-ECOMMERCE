import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Truck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import B2COrderDispatchTable from '../../features/orders/components/B2COrderDispatchTable';
import BranchAllocationModal from '../../features/orders/components/BranchAllocationModal';
import OrderSerialAssignDrawer from '../../features/orders/components/OrderSerialAssignDrawer';
import PickPackSlipModal from '../../features/orders/components/PickPackSlipModal';
import { orderService } from '../../features/orders/services/orderService.js';
import branchService from '../../features/branches/services/branchService.js';
import inventoryService from '../../features/inventory/services/inventoryService.js';

export const OrderDispatchPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [candidateBranches, setCandidateBranches] = useState([]);
  const [allocationOrder, setAllocationOrder] = useState(null);
  const [serialAssignOrder, setSerialAssignOrder] = useState(null);
  const [pickPackOrder, setPickPackOrder] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchLiveOrders = useCallback(async () => {
    try {
      const [liveList, branchList] = await Promise.all([
        orderService.getBranchOrders({ orderType: 'B2C_ONLINE', limit: 100 }),
        branchService.getBranches()
      ]);

      const retailBranches = (branchList || []).filter((b) => !b.isHeadquarter && b.branchCode !== 'BR-HQ');
      setBranches(retailBranches.length > 0 ? retailBranches : branchList || []);

      const mapped = (liveList || []).map((o) => {
        const rawItems = Array.isArray(o.items) ? o.items : [];
        const totalQty = rawItems.reduce((sum, it) => sum + Number(it.quantity || 1), 0) || 1;
        const allSerials = rawItems.flatMap((it) => it.serialsAssigned || []);
        const firstItem = rawItems[0] || {};
        const summaryName =
          rawItems.length > 1
            ? `${firstItem.productName || 'Thiết bị'} (+${rawItems.length - 1} SP khác)`
            : firstItem.productName || 'Thiết bị công nghệ';

        return {
          _id: o._id,
          orderCode: o.orderCode || o._id,
          customerName: o.shippingAddress?.fullName || o.customerInfo?.fullName || 'Khách Hàng',
          phone: o.shippingAddress?.phone || o.customerInfo?.phone || '',
          shippingAddress: o.shippingAddress?.address || o.customerInfo?.address || 'Tại chi nhánh',
          slaRemaining: '01:30:00',
          fulfillmentType: o.orderType === 'POS_STORE' ? 'Tại quầy' : 'Giao tiêu chuẩn',
          totalAmount: o.totalAmount || 0,
          status: o.orderStatus || 'PENDING',
          branchId: o.branchId?._id || o.branchId || '',
          assignedBranchName: o.branchId?.name || o.branchId?.branchName || 'Chưa phân bổ',
          items: rawItems,
          productId: firstItem.productId || '',
          productSkuId: firstItem.productSkuId || '',
          productName: summaryName,
          sku: firstItem.sku || '',
          quantity: totalQty,
          serials: allSerials
        };
      });
      setOrders(mapped);
    } catch (err) {
      setOrders([]);
      setToastMsg({
        type: 'error',
        message: 'Không thể tải danh sách đơn hàng B2C: ' + (err.response?.data?.message || err.message)
      });
    }
  }, []);

  useEffect(() => {
    if (!allocationOrder) return;
    let ignore = false;

    const loadStockForOrder = async () => {
      const skuId = allocationOrder.productSkuId;
      if (!skuId) {
        setCandidateBranches(branches);
        return;
      }
      try {
        const stockList = await inventoryService.getBranchesWithSkuStock(skuId);
        if (!ignore) {
          const stockMap = new Map(stockList.map((s) => [String(s.branchId), s.quantity]));
          const enriched = branches.map((b) => ({
            ...b,
            stockAvailable: stockMap.has(String(b._id)) ? stockMap.get(String(b._id)) : 0
          }));
          setCandidateBranches(enriched);
        }
      } catch {
        if (!ignore) setCandidateBranches(branches);
      }
    };

    loadStockForOrder();
    return () => {
      ignore = true;
    };
  }, [allocationOrder, branches]);

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
      if (target?._id) {
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
      if (target?._id) {
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

      <B2COrderDispatchTable
        orders={orders}
        userRole={authUser?.role}
        onOpenAllocationModal={(order) => setAllocationOrder(order)}
        onOpenSerialDrawer={(order) => setSerialAssignOrder(order)}
        onOpenPickPackModal={(order) => setPickPackOrder(order)}
      />

      <BranchAllocationModal
        isOpen={Boolean(allocationOrder)}
        onClose={() => setAllocationOrder(null)}
        order={allocationOrder}
        branches={candidateBranches.length > 0 ? candidateBranches : branches}
        onConfirmAllocation={handleConfirmAllocation}
      />

      <PickPackSlipModal
        isOpen={Boolean(pickPackOrder)}
        onClose={() => setPickPackOrder(null)}
        order={pickPackOrder}
      />

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
