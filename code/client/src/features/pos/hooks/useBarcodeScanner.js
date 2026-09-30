import { useEffect, useRef } from 'react';

/**
 * Hook xử lý máy quét mã vạch chuyên dụng và các phím tắt POS:
 * - Barcode Scanner (hardware): Tốc độ gõ siêu nhanh (< 50ms/ký tự) kết thúc bằng phím Enter.
 * - F2: Focus ô quét mã vạch / tìm sản phẩm
 * - F4: Focus ô nhập khách hàng
 * - F8: Focus ô giảm giá / chiết khấu
 * - F9: Kích hoạt thanh toán
 * - Escape: Đóng modal / hủy thao tác
 */
export const useBarcodeScanner = ({
  onScan,
  onF2,
  onF4,
  onF8,
  onF9,
  onEscape,
  enabled = true
} = {}) => {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // 1. Bắt các phím tắt chức năng POS
      if (e.key === 'F2') {
        e.preventDefault();
        onF2?.();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        onF4?.();
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        onF8?.();
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        onF9?.();
        return;
      }
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      // 2. Barcode scanner detection
      // Nếu người dùng đang gõ trong input/textarea thông thường, chỉ nhận diện nếu tốc độ quét mã siêu nhanh (< 50ms)
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3 && timeDiff < 100) {
          e.preventDefault();
          const barcode = bufferRef.current.trim();
          bufferRef.current = '';
          onScan?.(barcode);
          return;
        }
        bufferRef.current = '';
        return;
      }

      // Chỉ thu thập các ký tự in được (độ dài ký tự === 1)
      if (e.key.length === 1) {
        if (timeDiff > 80 && bufferRef.current.length > 0) {
          // Khoảng cách quá dài -> người dùng gõ tay -> reset buffer barcode
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onScan, onF2, onF4, onF8, onF9, onEscape]);
};

export default useBarcodeScanner;
