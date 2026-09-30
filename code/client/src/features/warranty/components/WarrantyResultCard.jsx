import { ShieldCheck, Calendar, MapPin, Clock, CheckCircle } from 'lucide-react';

export const WarrantyResultCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
      {/* Device Summary Card (Figma #21:28117) */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trạng thái thiết bị
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{data.statusLabel || '✓ Còn hạn bảo hành'}</span>
            </span>
          </div>

          <div className="w-full h-48 rounded-2xl bg-slate-50 flex items-center justify-center p-4 mb-4 border border-slate-100">
            <img
              src={data.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'}
              alt={data.productName}
              className="max-h-full object-contain"
            />
          </div>

          <h3 className="text-lg font-black text-slate-900 leading-snug">
            {data.productName}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {data.skuCode || 'MBA-M4-16-256'}</p>

          <div className="mt-5 space-y-3 divide-y divide-slate-50 text-xs">
            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Mã Serial / IMEI:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {data.serialNumber}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày bán kích hoạt:
              </span>
              <span className="font-bold text-slate-900">{data.saleDate}</span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Ngày hết hạn:
              </span>
              <span className="font-bold text-slate-900">{data.warrantyEndDate}</span>
            </div>

            <div className="pt-2 flex justify-between items-start">
              <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Showroom mua:
              </span>
              <span className="font-bold text-slate-900 text-right max-w-[220px]">
                {data.branchPurchased}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 bg-blue-50/50 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-slate-700">Thời gian bảo hành còn lại:</span>
          </div>
          <span className="text-sm font-black text-blue-600">
            {data.daysRemaining || 360} ngày
          </span>
        </div>
      </div>

      {/* Warranty History Timeline (Figma #21:28139) */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <span>Lịch sử tiếp nhận & Bảo hành</span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {data.history?.length || 0} sự kiện
          </span>
        </h3>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {(data.history || []).map((event, idx) => (
            <div key={event.id || idx} className="relative flex flex-col gap-1">
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-4 border-white shadow-xs flex items-center justify-center ${
                  idx === 0 ? 'bg-blue-600' : 'bg-emerald-500'
                }`}
              />

              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{event.title}</h4>
                <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  {event.date}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                {event.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WarrantyResultCard;
