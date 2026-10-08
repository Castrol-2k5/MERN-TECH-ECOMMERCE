import { useState } from 'react';

export const ProductImageGallery = ({
  images = [],
  productName = '',
  discountPercentage = 0,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const displayImages =
    images.length > 0
      ? images
      : [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
        ];

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 w-full">
      <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImageIndex(idx)}
            className={`w-16 sm:w-20 aspect-square rounded-xl border-2 p-1 bg-white overflow-hidden transition-all cursor-pointer ${
              activeImageIndex === idx
                ? 'border-blue-600 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
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

      <div className="relative flex-1 aspect-4/3 sm:aspect-square lg:h-[480px] rounded-2xl bg-white border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden shadow-xs">
        {discountPercentage > 0 && (
          <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-white text-xs font-black rounded-lg shadow-sm">
            -{discountPercentage}% • TECH FEST
          </span>
        )}

        <img
          src={displayImages[activeImageIndex]}
          alt={productName}
          className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
