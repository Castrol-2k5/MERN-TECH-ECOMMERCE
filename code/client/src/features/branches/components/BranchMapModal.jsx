import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Navigation,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Store,
  Compass,
} from 'lucide-react';
import { useState } from 'react';
import {
  extractBranchCoordinates,
  calculateDistanceKm,
  formatDistance,
  estimateTravelTime,
  getGoogleMapsDirectionsUrl,
} from '../utils/geoUtils.js';

export const BranchMapModal = ({ isOpen, onClose, branch, userCoords, onSelectBranch }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const branchCoords = extractBranchCoordinates(branch);
  const userLat = userCoords?.lat;
  const userLng = userCoords?.lng;

  const distanceKm =
    branchCoords && userLat && userLng
      ? calculateDistanceKm(userLat, userLng, branchCoords.lat, branchCoords.lng)
      : null;

  const handleCopyAddress = () => {
    if (branch?.address) {
      navigator.clipboard.writeText(branch.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current || !branchCoords) return;

    // Destroy existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { lat, lng } = branchCoords;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom Red Pin for Store
    const branchIcon = L.divIcon({
      className: 'custom-branch-marker',
      html: `
        <div style="
          background-color: #ef4444;
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg style="transform: rotate(45deg); width: 18px; height: 18px; fill: none; stroke: #ffffff; stroke-width: 2.2;" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    const branchMarker = L.marker([lat, lng], { icon: branchIcon }).addTo(map);
    branchMarker
      .bindPopup(
        `<div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <b style="color: #1e3a8a; font-size: 14px;">${branch.branchName || branch.name}</b><br/>
          <span style="color: #475569;">${branch.address}</span>
        </div>`
      )
      .openPopup();

    // If User Coordinates are available, place a Blue Pin and draw route line
    if (userLat && userLng) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            background-color: #3b82f6;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.35), 0 3px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
      userMarker.bindPopup(
        `<div style="font-family: inherit; font-size: 12px; font-weight: bold; color: #2563eb;">
          📍 Vị trí hiện tại của bạn
        </div>`
      );

      // Draw polyline connecting user to branch
      const latlngs = [
        [userLat, userLng],
        [lat, lng],
      ];
      const polyline = L.polyline(latlngs, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      // Fit bounds to show both user and branch with padding
      const bounds = L.latLngBounds([
        [userLat, userLng],
        [lat, lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    // Force map to re-calculate container size after modal animation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, branchCoords, userLat, userLng, branch]);

  if (!isOpen || !branch) return null;

  const googleMapsUrl = getGoogleMapsDirectionsUrl({
    destLat: branchCoords?.lat,
    destLng: branchCoords?.lng,
    destAddress: branch.address,
    userLat,
    userLng,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {branch.branchName || branch.name}
                </h3>
                {branch.isHeadquarter && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Trụ sở chính
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Bản đồ vị trí &amp; Chỉ đường showroom</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Đóng bản đồ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Body */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] w-full bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Floating Distance Badge on Map */}
          {distanceKm !== null && (
            <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-slate-800">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>{formatDistance(distanceKm)}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-bold">{estimateTravelTime(distanceKm)}</span>
            </div>
          )}
        </div>

        {/* Footer Details & Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-4 shrink-0">
          {/* Full Address Display */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-slate-700 leading-relaxed font-medium">
                <span className="font-bold text-slate-900 block sm:inline mr-1">Địa chỉ đầy đủ:</span>
                <span className="select-all">{branch.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sao chép địa chỉ"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
              {branch.phone && (
                <a
                  href={`tel:${branch.phone}`}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{branch.phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-400">
              {userLat && userLng ? (
                <span className="text-emerald-600 font-medium">
                  ✓ Đã định vị chính xác vị trí xuất phát của bạn
                </span>
              ) : (
                <span>Bật định vị GPS để tính khoảng cách và lộ trình chính xác nhất</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {onSelectBranch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectBranch(branch);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Chọn chi nhánh này
                </button>
              )}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Mở Google Maps chỉ đường</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchMapModal;
