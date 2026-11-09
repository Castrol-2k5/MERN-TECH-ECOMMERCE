import { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Clock,
  CheckCircle2,
  MapPin,
  Navigation,
  Compass,
  Loader2,
  AlertCircle
} from 'lucide-react';
import inventoryService from '../services/inventoryService.js';
import useUserLocation from '../../branches/hooks/useUserLocation.js';
import BranchMapModal from '../../branches/components/BranchMapModal.jsx';
import {
  extractBranchCoordinates,
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl
} from '../../branches/utils/geoUtils.js';

export const MultiBranchStockBox = ({
  skuId,
  selectedBranchId,
  onSelectBranch,
  onStockSummaryChange,
}) => {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMapBranch, setActiveMapBranch] = useState(null);

  // Geolocation integration: auto-detect on storefront
  const {
    userCoords,
    loading: geoLoading,
    permissionStatus,
    requestLocation
  } = useUserLocation(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStock = async () => {
      setLoading(true);
      const data = await inventoryService.getBranchesWithSkuStock(skuId || 'default-sku');
      if (!isMounted) return;
      const list = Array.isArray(data) ? data : [];
      setStockList(list);
      setLoading(false);

      const totalStock = list.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
      if (onStockSummaryChange) {
        onStockSummaryChange({ totalStock, branches: list });
      }
    };
    fetchStock();
    return () => {
      isMounted = false;
    };
  }, [skuId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute distance and sort branches intelligently
  const enrichedAndSortedBranches = useMemo(() => {
    const enriched = stockList.map((branch) => {
      const coords = extractBranchCoordinates(branch);
      const distanceKm =
        userCoords && coords
          ? calculateDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
          : null;
      return {
        ...branch,
        coords,
        distanceKm,
      };
    });

    // Sorting rule:
    // 1. Available in-stock branches first (quantity > 0)
    // 2. If user coords exist, sort by distance ascending (nearest first)
    // 3. Out-of-stock branches at the bottom
    return enriched.sort((a, b) => {
      const aAvail = a.quantity > 0 ? 1 : 0;
      const bAvail = b.quantity > 0 ? 1 : 0;
      if (aAvail !== bAvail) return bAvail - aAvail;

      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });
  }, [stockList, userCoords]);

  // Auto-select nearest available branch if none selected yet
  useEffect(() => {
    if (!selectedBranchId && enrichedAndSortedBranches.length > 0 && onSelectBranch) {
      const firstAvail = enrichedAndSortedBranches.find((b) => b.quantity > 0);
      if (firstAvail) {
        onSelectBranch(firstAvail);
      }
    }
  }, [enrichedAndSortedBranches, selectedBranchId, onSelectBranch]);

  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const totalAvailable = stockList.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 mb-3.5">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            Tồn kho thực tế tại Showroom
          </h4>
        </div>

        {/* Location prompt / status */}
        <div className="flex items-center gap-2">
          {userCoords ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đã định vị vị trí của bạn</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={requestLocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-colors cursor-pointer"
              title="Cấp quyền vị trí để tự động xếp chi nhánh gần bạn nhất"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Đang định vị...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3 h-3 text-blue-600" />
                  <span>📍 Tìm chi nhánh gần nhất</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Thời gian thực</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang kiểm tra tồn kho đa chi nhánh...</span>
        </div>
      ) : stockList.length === 0 || totalAvailable === 0 ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Tạm thời hết hàng trên toàn hệ thống showroom</span>
          </div>
          {enrichedAndSortedBranches.map((branch) => (
            <div
              key={branch.branchId}
              className="p-3.5 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-60 bg-slate-50/50"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{branch.branchName}</span>
                  {branch.distanceKm !== null && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {formatDistance(branch.distanceKm)}
                    </span>
                  )}
                </div>
                {/* Full address display - no truncation */}
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{branch.address}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 bg-rose-50 text-rose-700 border-rose-200 self-start sm:self-auto">
                {branch.statusLabel || 'Hết hàng'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {enrichedAndSortedBranches.map((branch) => {
            const isAvailable = branch.quantity > 0;
            const isSelected = selectedBranchId && String(selectedBranchId) === String(branch.branchId);

            return (
              <div
                key={branch.branchId}
                onClick={() => isAvailable && onSelectBranch && onSelectBranch(branch)}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-600/20 cursor-pointer'
                    : isAvailable
                      ? 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 cursor-pointer'
                      : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                {/* Branch Info & Full Address */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {branch.branchName}
                    </span>

                    {/* Nearest Badge */}
                    {branch.distanceKm !== null && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        <Navigation className="w-2.5 h-2.5 rotate-45" />
                        {formatDistance(branch.distanceKm)}
                      </span>
                    )}

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-md shadow-xs">
                        <CheckCircle2 className="w-3 h-3" /> Đang chọn nhận máy
                      </span>
                    )}
                  </div>

                  {/* Complete Address without line-clamp truncation */}
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-normal">{branch.address}</span>
                  </div>

                  {branch.phone && (
                    <div className="text-[11px] text-slate-400 ml-5">
                      Hotline showroom: <span className="text-slate-600 font-medium">{branch.phone}</span>
                    </div>
                  )}
                </div>

                {/* Right Actions: Stock Badge + Map Button */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                      badgeStyles[branch.badgeVariant] || badgeStyles.success
                    }`}
                  >
                    {branch.statusLabel}
                  </span>

                  {/* Map Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMapBranch(branch);
                    }}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Xem vị trí trên bản đồ &amp; chỉ đường"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Bản đồ</span>
                  </button>

                  {/* Direct Google Maps Navigation */}
                  <a
                    href={getGoogleMapsDirectionsUrl({
                      destLat: branch.coords?.lat,
                      destLng: branch.coords?.lng,
                      destAddress: branch.address,
                      userLat: userCoords?.lat,
                      userLng: userCoords?.lng,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                    title="Mở chỉ đường Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Map Modal */}
      <BranchMapModal
        isOpen={Boolean(activeMapBranch)}
        onClose={() => setActiveMapBranch(null)}
        branch={activeMapBranch}
        userCoords={userCoords}
        onSelectBranch={(b) => {
          if (onSelectBranch) onSelectBranch(b);
        }}
      />
    </div>
  );
};

export default MultiBranchStockBox;
