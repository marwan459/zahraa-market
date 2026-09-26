import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (product: any, quantity: number) => void;
  onClearCart: () => void;
  onRequestDelivery: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onClearCart,
  onRequestDelivery
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const grandTotal = subtotal;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#082b64]/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-blue-900 flex items-center justify-between bg-[#0d47a1] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-yellow-300 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-white text-base">سلة طلباتك</h2>
                <p className="text-xs text-blue-200">
                  {cartItems.length} {cartItems.length === 1 ? 'صنف مختار' : 'أصناف مختارة'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cartItems.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="p-2 text-blue-200 hover:text-red-300 rounded-lg transition-colors cursor-pointer text-xs"
                  title="تفريغ السلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-blue-50">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-[#0d47a1] mb-4">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">السلة فارغة حالياً</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  تصفح أقسام سوبر ماركت الزهراء واختر ما يناسبك لإضافته للسلة مباشرة.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs cursor-pointer shadow-md border border-yellow-500"
                >
                  بدء التسوق الآن
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.product.id} className="py-3 flex items-center gap-3">
                  {/* Thumb */}
                  <div className="w-14 h-14 bg-white rounded-lg border border-blue-100 p-1 shrink-0 flex items-center justify-center">
                    <img
                      src={item.product.image}
                      alt={item.product.nameAr}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {item.product.nameAr}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      {item.product.price} ج.م × {item.quantity} = <span className="font-black text-[#0d47a1]">{item.product.price * item.quantity} ج.م</span>
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center border border-yellow-500 rounded-lg bg-yellow-400 p-0.5 shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-yellow-300 text-black flex items-center justify-center hover:bg-yellow-200 cursor-pointer border border-yellow-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-black text-yellow-300 font-black flex items-center justify-center hover:bg-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onUpdateQuantity(item.product, 0)}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-blue-100 bg-blue-50/50 space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>مجموع الأصناف المختارة:</span>
                  <span className="font-bold text-slate-900">{subtotal.toLocaleString()} ج.م</span>
                </div>

                <div className="pt-2 border-t border-blue-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-base text-slate-900 block">المجموع الإجمالي:</span>
                    <span className="text-[10px] text-slate-400">شامل كافة الأصناف</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#0d47a1]">
                      {grandTotal.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-700 mr-1">ج.م</span>
                  </div>
                </div>
              </div>

              {/* Request Delivery Service Button in Yellow */}
              <button
                onClick={onRequestDelivery}
                className="w-full py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-yellow-500"
                id="cart-checkout-delivery-btn"
              >
                <span>متابعة الطلب وإرساله</span>
                <ArrowLeft className="w-4 h-4 mr-auto text-black" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
