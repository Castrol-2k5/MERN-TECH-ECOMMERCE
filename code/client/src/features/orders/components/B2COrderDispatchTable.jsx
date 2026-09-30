import { useState } from 'react';
import { 
  Package, 
  Clock, 
  MapPin, 
  Send, 
  Search, 
  QrCode,
  Truck
} from 'lucide-react';

export const B2COrderDispatchTable = ({
  orders = [],
  onSelectOrder,
  onOpenAllocationModal,
  onOpenSerialDrawer
}) => {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'PACKING' | 'READY'
  const [searchTerm, setSearchTerm] = useState('');

  const formatVnd = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const packingCount = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PACKING').length;
  const readyCount = orders.filter((o) => o.status === 'READY_FOR_SHIPPING').length;

  const filteredOrders = orders.filter((o) => {
    const matchTab =
      activeTab === 'ALL' ||
      (activeTab === 'PENDING' && o.status === 'PENDING') ||
      (activeTab === 'PACKING' && (o.status === 'PROCESSING' || o.status === 'PACKING')) ||
      (activeTab === 'READY' && o.status === 'READY_FOR_SHIPPING');

    const matchSearch =
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone?.includes(searchTerm);

    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-4 text-slate-100">
      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Đơn Chờ Xử Lý &amp; Điều Phối</p>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1">{pendingCount}</p>
            <p className="text-[10px] text-slate-500">Cần phân bổ chi nhánh xuất kho</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Đang Đóng Gói Tại Chi Nhánh</p>
            <p className="text-2xl font-black font-mono text-blue-400 mt-1">{packingCount}</p>
            <p className="text-[10px] text-blue-400">2 đơn cần quét gán mã Serial</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Sẵn Sàng Giao Hàng</p>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{readyCount}</p>
            <p className="text-[10px] text-emerald-400">3 đơn Click &amp; Collect nhận tại shop</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Toolbar & Tabs */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Chờ xử lý ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PACKING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PACKING'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Đang đóng gói ({packingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('READY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'READY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Sẵn sàng giao ({readyCount})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã đơn, tên khách..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">SLA Giao</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Chi nhánh gán</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-500">
                    Không có đơn hàng B2C nào trong danh mục này
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isUrgent = order.slaRemaining?.startsWith('00:1') || order.slaRemaining?.startsWith('00:0');

                  return (
                    <tr
                      key={order.orderCode}
                      onClick={() => onSelectOrder?.(order)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {order.orderCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{order.phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.slaRemaining || '01:30:00'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {order.fulfillmentType || 'Giao 2 giờ'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <span>{order.assignedBranchName || 'Chưa gán'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        {formatVnd(order.totalAmount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {order.status === 'PENDING' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Chờ điều phối
                          </span>
                        )}
                        {(order.status === 'PROCESSING' || order.status === 'PACKING') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Đang đóng gói
                          </span>
                        )}
                        {order.status === 'READY_FOR_SHIPPING' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Sẵn sàng giao
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAllocationModal(order);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Phân bổ</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSerialDrawer(order);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>Quét Serial</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default B2COrderDispatchTable;
