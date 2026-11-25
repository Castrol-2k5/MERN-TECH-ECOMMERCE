import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ProductImageGallery = ({
  images = [],
  productName = '',
  discountPercentage = 0,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const firstImg = images?.[0] || '';
  const [prevFirstImg, setPrevFirstImg] = useState(firstImg);

  if (firstImg !== prevFirstImg) {
    setPrevFirstImg(firstImg);
    setActiveImageIndex(0);
  }

  const displayImages =
    images.length > 0
      ? images
      : [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        ];

  const safeIndex = activeImageIndex < displayImages.length ? activeImageIndex : 0;

  const handlePrev = () => {
    setActiveImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleNext = () => {
    setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative group w-full aspect-4/3 sm:aspect-square lg:h-[460px] rounded-2xl bg-white border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden shadow-xs">
        {discountPercentage > 0 && (
          <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-white text-xs font-black rounded-lg shadow-sm">
            -{discountPercentage}% • TECH FEST
          </span>
        )}

        <img
          src={displayImages[safeIndex]}
          alt={`${productName} (${safeIndex + 1}/${displayImages.length})`}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh tiếp theo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[11px] font-bold">
              {safeIndex + 1} / {displayImages.length}
            </span>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl border-2 p-1 bg-white overflow-hidden transition-all cursor-pointer ${
                safeIndex === idx
                  ? 'border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
