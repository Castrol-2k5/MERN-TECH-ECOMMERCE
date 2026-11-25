import { useState, useRef } from 'react';
import { Upload, Link2, Trash2, Star, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import productService from '../services/productService.js';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1200;

/**
 * Tiền xử lý ảnh phía Client bằng Canvas API:
 * - Resize cạnh dài tối đa 1200px
 * - Nén sang JPEG/WebP chất lượng 0.85 để đồng nhất kích thước & tốc độ tải
 */
const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Không thể đọc tệp "${file.name}"`));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Tệp "${file.name}" không phải hình ảnh hợp lệ`));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressed = new File([blob], file.name, {
              type: targetMime,
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          targetMime,
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export const ProductImageUploader = ({ images = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setErrorMsg('');

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm.`);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const selectedFiles = files.slice(0, remainingSlots);
    const invalidFile = selectedFiles.find(
      (f) => !validTypes.includes(f.type) || f.size > MAX_FILE_SIZE
    );
    if (invalidFile) {
      setErrorMsg(
        `Tệp "${invalidFile.name}" không hợp lệ (chỉ nhận JPG/PNG/WebP và dung lượng tối đa 5MB).`
      );
      return;
    }

    setIsUploading(true);
    try {
      const processedFiles = await Promise.all(selectedFiles.map(compressImageFile));
      const uploadedUrls = await productService.uploadImages(processedFiles);
      onChange?.([...images, ...uploadedUrls].slice(0, MAX_IMAGES));
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || 'Lỗi tải ảnh lên máy chủ.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const clean = urlInput.trim();
    if (!clean) return;
    setErrorMsg('');
    if (images.length >= MAX_IMAGES) {
      setErrorMsg(`Đã đạt giới hạn tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm.`);
      return;
    }
    if (images.includes(clean)) {
      setErrorMsg('Đường dẫn ảnh này đã tồn tại trong danh sách.');
      return;
    }
    onChange?.([...images, clean]);
    setUrlInput('');
  };

  const handleSetCover = (idx) => {
    if (idx === 0) return;
    const target = images[idx];
    const next = [target, ...images.filter((_, i) => i !== idx)];
    onChange?.(next);
  };

  const handleRemove = (idx) => {
    onChange?.(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Thư viện Ảnh Sản phẩm ({images.length}/{MAX_IMAGES})</span>
        </label>
        <span className="text-[11px] text-slate-400">
          Tự động nén &amp; resize tối đa 1200px • Ảnh đầu tiên là ảnh bìa
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Dropzone & URL Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isUploading || images.length >= MAX_IMAGES}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/60 hover:bg-slate-900 text-slate-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-xs font-semibold text-blue-300">Đang xử lý &amp; tải ảnh lên...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold">Chọn ảnh từ máy tính (JPG, PNG, WebP)</span>
              <span className="text-[11px] text-slate-500">Hỗ trợ chọn nhiều ảnh cùng lúc (≤ 5MB/ảnh)</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        <div className="flex flex-col justify-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Hoặc dán đường dẫn ảnh (URL) bên ngoài:
          </span>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
            >
              Thêm URL
            </button>
          </div>
        </div>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
          {images.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className={`relative group rounded-xl border overflow-hidden aspect-square bg-white ${
                idx === 0 ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700'
              }`}
            >
              <img
                src={imgUrl}
                alt={`Product ${idx + 1}`}
                className="w-full h-full object-contain p-1"
              />
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold shadow">
                  Ảnh bìa
                </span>
              )}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    title="Đặt làm ảnh bìa"
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  title="Xóa ảnh"
                  className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
