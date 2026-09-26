import React, { useState } from 'react';
import { Plus, Minus, ZoomIn, X, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (product: Product, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity
}) => {
  const [imageError, setImageError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isZoomedInModal, setIsZoomedInModal] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';

  const handleAdd = () => {
    onAddToCart(product);
  };

  const handleIncrement = () => {
    onUpdateQuantity(product, quantityInCart + 1);
  };

  return (
    <>
      <div 
        id={`product-card-${product.id}`}
        className="group bg-[#0a3d1f] rounded-2xl border border-[#145a32] shadow-md hover:shadow-xl hover:shadow-emerald-950/30 hover:border-emerald-400 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
      >
        {/* Top Badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
          {product.isOffer && (
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-red-600 text-white shadow-xs">
              عرض خاص
            </span>
          )}
        </div>

        {/* Product Image Section with Touch / Hover Zoom */}
        <div 
          onClick={() => setShowModal(true)}
          className="relative aspect-square w-full bg-white flex items-center justify-center p-2.5 sm:p-3 cursor-zoom-in group/img border-b border-emerald-900/40"
          title="اضغط لتكبير الصورة ومعاينتها"
        >
          <img
            src={imageError ? fallbackImage : product.image}
            alt={product.nameAr}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 group-hover/img:scale-105 select-none"
          />

          {/* Zoom hint icon */}
          <div className="absolute top-2 left-2 bg-[#0a3d1f]/90 hover:bg-[#0a3d1f] text-white p-1 rounded-lg transition-all opacity-0 group-hover/img:opacity-100 flex items-center gap-1 shadow-xs border border-emerald-600">
            <ZoomIn className="w-3 h-3 text-yellow-300" />
            <span className="text-[9px] hidden sm:inline px-0.5 font-bold">تكبير</span>
          </div>

          {/* Unit pill */}
          <div className="absolute bottom-1.5 left-1.5 bg-[#0a3d1f]/90 px-1.5 py-0.5 rounded text-[9px] text-emerald-200 font-bold border border-emerald-700">
            {product.unitAr}
          </div>
        </div>

        {/* Product Information in Dark Green Box */}
        <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between bg-[#0a3d1f] text-white">
          <div>
            {/* Category tag */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
              <span className="font-semibold text-emerald-300 truncate max-w-[110px]">
                {product.subcategoryAr}
              </span>
              <span className="text-emerald-200 font-bold bg-[#062c15] px-1.5 py-0.5 rounded border border-[#145a32] text-[9px] shrink-0">
                متوفر
              </span>
            </div>

            {/* Product Name */}
            <h3 className="font-black text-white text-xs sm:text-sm leading-snug line-clamp-2 mb-1 group-hover:text-yellow-300 transition-colors">
              {product.nameAr}
            </h3>

            <p className="text-emerald-200/70 text-[10px] sm:text-[11px] line-clamp-1 mb-1.5 font-sans" dir="ltr">
              {product.name}
            </p>
          </div>

          {/* Price & Action Area */}
          <div className="pt-2 border-t border-emerald-800/80">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-xl font-black text-yellow-400 tracking-tight">
                  {product.price}
                </span>
                <span className="text-xs sm:text-xs font-black text-yellow-400">ج.م</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] text-emerald-300/60 line-through mr-1">
                    {product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Yellow Add-to-cart button that remains yellow when items are added - unified mobile & desktop */}
            {quantityInCart > 0 ? (
              <div className="flex items-center justify-between bg-yellow-400 border border-yellow-500 rounded-xl p-1 shadow-sm text-black">
                <button
                  id={`btn-minus-${product.id}`}
                  onClick={() => onUpdateQuantity(product, quantityInCart - 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-300 hover:bg-yellow-200 text-black flex items-center justify-center transition-colors cursor-pointer font-black border border-yellow-500"
                  aria-label="إنقاص الكمية"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="font-black text-xs sm:text-sm text-black px-1.5">
                  {quantityInCart} بالسلة
                </span>

                <button
                  id={`btn-plus-${product.id}`}
                  onClick={handleIncrement}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-300 hover:bg-yellow-200 text-black flex items-center justify-center transition-colors cursor-pointer font-black border border-yellow-500"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id={`btn-add-${product.id}`}
                onClick={handleAdd}
                className="w-full py-2 sm:py-2.5 px-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md border border-yellow-500 group/btn"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-black transition-transform group-hover/btn:scale-110 shrink-0" />
                <span>إضافة للسلة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Image Lightbox Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => {
            setShowModal(false);
            setIsZoomedInModal(false);
          }}
        >
          <div 
            className="bg-[#0a3d1f] text-white rounded-2xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-600 relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-start justify-between border-b border-emerald-800 bg-[#072d17]">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-300 bg-[#0a3d1f] px-2.5 py-0.5 rounded-full border border-emerald-700">
                  {product.subcategoryAr}
                </span>
                <h3 className="text-sm sm:text-lg font-black text-white mt-1.5">
                  {product.nameAr}
                </h3>
                <p className="text-[11px] text-emerald-300/80 font-sans" dir="ltr">
                  {product.name}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsZoomedInModal(false);
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 mr-2"
                aria-label="إغلاق المعاينة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enlarged Image */}
            <div 
              onClick={() => setIsZoomedInModal(!isZoomedInModal)}
              className="relative w-full h-64 sm:h-72 bg-white flex items-center justify-center p-4 overflow-hidden cursor-zoom-in border-b border-emerald-800"
              title="اضغط للتكبير الإضافي"
            >
              <img
                src={imageError ? fallbackImage : product.image}
                alt={product.nameAr}
                referrerPolicy="no-referrer"
                className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                  isZoomedInModal ? 'scale-150 cursor-zoom-out' : 'scale-100'
                }`}
              />

              <div className="absolute bottom-2 right-2 bg-[#0a3d1f]/90 text-white px-2 py-1 rounded text-[10px] font-bold border border-emerald-600 flex items-center gap-1 shadow-xs pointer-events-none">
                <ZoomIn className="w-3 h-3 text-yellow-300" />
                <span>{isZoomedInModal ? 'تصغير' : 'تكبير إضافي'}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-[#072d17]">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-yellow-400">{product.price}</span>
                  <span className="text-xs font-bold text-yellow-300">ج.م</span>
                </div>
                <span className="text-[10px] text-emerald-300">{product.unitAr}</span>
              </div>

              <button
                onClick={handleAdd}
                className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm shadow-md border border-yellow-500 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <ShoppingCart className="w-4 h-4 text-black" />
                <span>{quantityInCart > 0 ? `إضافة أخرى (${quantityInCart})` : 'إضافة للسلة'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
