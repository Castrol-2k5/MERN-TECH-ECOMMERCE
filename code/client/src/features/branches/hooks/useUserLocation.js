import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const STORAGE_KEY = 'techone_cached_user_location';

export const useUserLocation = (autoRequest = false) => {
  const authUser = useSelector((state) => state.auth?.user);
  const [userCoords, setUserCoords] = useState(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.lat && parsed?.lng) return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'

  // Check initial permission status if Permission API is available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state);
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        })
        .catch(() => {
          // Permissions API query not supported or failed
        });
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionStatus('unsupported');
      setError('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserCoords(coords);
        setPermissionStatus('granted');
        setLoading(false);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        } catch {
          // ignore
        }
      },
      (err) => {
        setLoading(false);
        let msg = 'Không thể lấy vị trí hiện tại.';
        if (err.code === 1) {
          setPermissionStatus('denied');
          msg = 'Bạn đã từ chối chia sẻ vị trí. Vui lòng cho phép trong cài đặt trình duyệt để tìm chi nhánh gần nhất.';
        } else if (err.code === 2) {
          msg = 'Tín hiệu GPS yếu hoặc không khả dụng.';
        } else if (err.code === 3) {
          msg = 'Quá thời gian yêu cầu vị trí.';
        }
        setError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  useEffect(() => {
    if (autoRequest && !userCoords && permissionStatus !== 'denied') {
      requestLocation();
    }
  }, [autoRequest, userCoords, permissionStatus, requestLocation]);

  return {
    userCoords,
    loading,
    error,
    permissionStatus,
    requestLocation,
    userAddress: authUser?.address || authUser?.customerInfo?.address || null,
  };
};

export default useUserLocation;
