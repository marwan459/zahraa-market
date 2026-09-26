import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  RefreshCw,
  Percent,
  Lock
} from 'lucide-react';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { DeliveryModal } from './components/DeliveryModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OwnerDashboardModal } from './components/OwnerDashboardModal';
import { CATEGORIES } from './data/categories';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Product, CartItem, OrderRecord } from './types';
import { 
  getStoredProducts, 
  saveStoredProducts,
  getMerchantPhone, 
  getHiddenProductIds,
  saveHiddenProductIds,
  saveProductCustomization,
  resetProductCustomization,
  syncWithTalabatOfficialCatalog 
} from './services/syncService';

export const App: React.FC = () => {
  // Products state
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  
  // Hidden products state - managed exclusively by the store owner
  const [hiddenProductIds, setHiddenProductIds] = useState<string[]>(getHiddenProductIds);
  
  // Cart state persisted in localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('zahraa_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation & Search Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOffers, setOnlyOffers] = useState(false);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderRecord | null>(null);

  // Store & Sync State
  const [merchantPhone, setMerchantPhone] = useState<string>(getMerchantPhone);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  });
  const [autoSync, setAutoSync] = useState(true);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Toggle hiding a product by the store owner
  const handleToggleHideProduct = (productId: string) => {
    setHiddenProductIds((prev) => {
      const isHidden = prev.includes(productId);
      const updated = isHidden ? prev.filter((id) => id !== productId) : [...prev, productId];
      saveHiddenProductIds(updated);
      return updated;
    });
  };

  // Restore all hidden products
  const handleUnhideAllProducts = () => {
    saveHiddenProductIds([]);
    setHiddenProductIds([]);
  };

  // Update product price by the store owner
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    saveProductCustomization(productId, { price: newPrice });
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p));
      saveStoredProducts(updated);
      return updated;
    });

    // Also update price in active cart items if present
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, product: { ...item.product, price: newPrice } }
          : item
      )
    );
  };

  // Update product image by the store owner
  const handleUpdateProductImage = (productId: string, newImageUrl: string) => {
    saveProductCustomization(productId, { image: newImageUrl });
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, image: newImageUrl } : p));
      saveStoredProducts(updated);
      return updated;
    });

    // Also update image in active cart items if present
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, product: { ...item.product, image: newImageUrl } }
          : item
      )
    );
  };

  // Update product barcode by the store owner
  const handleUpdateProductBarcode = (productId: string, newBarcode: string) => {
    saveProductCustomization(productId, { barcode: newBarcode });
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, barcode: newBarcode } : p));
      saveStoredProducts(updated);
      return updated;
    });
  };

  // Reset product customization to original default
  const handleResetProductCustomization = (productId: string) => {
    resetProductCustomization(productId);
    const canonical = INITIAL_PRODUCTS.find((p) => p.id === productId);
    if (!canonical) return;

    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId
          ? { ...p, price: canonical.price, image: canonical.image, barcode: canonical.barcode }
          : p
      );
      saveStoredProducts(updated);
      return updated;
    });

    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: {
                ...item.product,
                price: canonical.price,
                image: canonical.image,
                barcode: canonical.barcode
              }
            }
          : item
      )
    );
  };

  // Save cart to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('zahraa_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cartItems]);

  // Periodic Auto-Sync with Talabat
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(() => {
      triggerSync(false);
    }, 45000);

    return () => clearInterval(interval);
  }, [autoSync, products]);

  const triggerSync = (manual = true) => {
    setIsSyncing(true);
    setTimeout(async () => {
      try {
        const { updatedProducts, syncTimestamp } = await syncWithTalabatOfficialCatalog(products);
        setProducts(updatedProducts);
        setLastSyncTime(syncTimestamp);
        setIsSyncing(false);

        if (manual) {
          setSyncToast(`تم تحديث أسعار وتوافر منتجات سوبر ماركت الزهراء (${syncTimestamp})`);
          setTimeout(() => setSyncToast(null), 3500);
        }
      } catch (err) {
        console.error(err);
        setIsSyncing(false);
      }
    }, 500);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== product.id);
      }
      return prev.map((item) =>
        item.product.id === product.id ? { ...item, quantity } : item
      );
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleRequestDelivery = () => {
    setIsCartOpen(false);
    setIsDeliveryModalOpen(true);
  };

  const handleOrderSuccess = (order: OrderRecord) => {
    setLastOrder(order);
    setIsDeliveryModalOpen(false);
    setCartItems([]);
    setIsConfirmationOpen(true);
  };

  // Products visible to customers - hidden products are strictly excluded
  const customerVisibleProducts = useMemo(() => {
    return products.filter((product) => !hiddenProductIds.includes(product.id));
  }, [products, hiddenProductIds]);

  // Filtered products list for customers
  const filteredProducts = useMemo(() => {
    return customerVisibleProducts.filter((product) => {
      if (selectedCategoryId && product.categoryId !== selectedCategoryId) {
        return false;
      }
      if (selectedSubcategory && product.subcategory !== selectedSubcategory && product.subcategoryId !== selectedSubcategory) {
        return false;
      }
      if (onlyOffers && !product.isOffer) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const inNameAr = product.nameAr.toLowerCase().includes(query);
        const inName = product.name.toLowerCase().includes(query);
        const inDesc = product.descriptionAr.toLowerCase().includes(query);
        const inSub = product.subcategoryAr.toLowerCase().includes(query);
        return inNameAr || inName || inDesc || inSub;
      }
      return true;
    });
  }, [customerVisibleProducts, selectedCategoryId, selectedSubcategory, onlyOffers, searchQuery]);

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategoryId);
  const activeSubcategory = activeCategory?.subcategories.find((s) => s.id === selectedSubcategory);

  return (
    <div className="min-h-screen bg-[#edf2ee] text-slate-900 flex flex-col font-sans w-full overflow-x-hidden relative" dir="rtl">
      
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a3d1f] text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-bounce">
          <RefreshCw className="w-3.5 h-3.5 text-yellow-300" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Header in Dark Blue */}
      <Header
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSyncNow={() => triggerSync(true)}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        autoSync={autoSync}
        onToggleAutoSync={() => setAutoSync(!autoSync)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        merchantPhone={merchantPhone}
      />

      {/* Category Navigation Bar - Only counts visible products */}
      <CategoryNav
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        selectedSubcategory={selectedSubcategory}
        onSelectSubcategory={setSelectedSubcategory}
        products={customerVisibleProducts}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-4 sm:py-6 pb-28 sm:pb-28">
        
        {/* Banner in Dark Blue */}
        <div className="bg-[#0d47a1] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-6 shadow-md relative overflow-hidden border border-blue-900">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-yellow-300 text-xs font-bold mb-2">
                <Store className="w-3.5 h-3.5 text-yellow-300" />
                <span>سوبر ماركت الزهراء • أسعار وتوصيل فوري</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight mb-1.5 text-white">
                سوبر ماركت الزهراء
              </h1>
              <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed max-w-xl">
                جميع احتياجات منزلك من المخبوزات، الألبان، اللحوم، البقالة، والمنظفات بأسعار معتمدة وتوصيل سريع حتى باب المنزل.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap lg:flex-col gap-2 text-xs text-blue-100">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <Truck className="w-4 h-4 text-yellow-300" />
                <span>توصيل سريع للمنزل (كاش أو إنستاباي)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>مزامنة دورية وتحديث فوري للمنتجات</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                <ShieldCheck className="w-4 h-4 text-yellow-300" />
                <span>إرسال الفاتورة لصاحب المحل بالواتساب فوراً</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Section Bar */}
        <div className="bg-[#bbdefb]/40 backdrop-blur-xs p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-200 mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-[#0d47a1]">
                {activeSubcategory ? activeSubcategory.nameAr : (activeCategory ? activeCategory.nameAr : 'جميع المنتجات')}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
              <span>القسم: <strong className="text-[#0d47a1]">{activeCategory ? activeCategory.nameAr : 'الكل'}</strong></span>
              {activeSubcategory && (
                <>
                  <span>•</span>
                  <span>الفرعي: <strong className="text-[#0d47a1]">{activeSubcategory.nameAr}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Quick Filter: Offers Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyOffers(!onlyOffers)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                onlyOffers
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
                  : 'bg-white border-blue-200 text-[#0d47a1] hover:bg-blue-50'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-red-600" />
              <span>العروض فقط</span>
            </button>

            {(searchQuery || selectedSubcategory || selectedCategoryId) && (
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSelectedSubcategory(null);
                  setSearchQuery('');
                  setOnlyOffers(false);
                }}
                className="text-xs text-[#1565c0] hover:text-[#0d47a1] font-bold underline cursor-pointer"
              >
                عرض الكل
              </button>
            )}
          </div>
        </div>

        {/* Products Grid: grid-cols-2 on mobile, grid-cols-4 on desktop */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-blue-200 max-w-sm mx-auto my-8">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-[#0d47a1] mx-auto mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-800 mb-1">لا توجد نتائج مطابقة</h3>
            <p className="text-xs text-slate-500 mb-4">
              جرب تغيير كلمات البحث أو اختر قسماً آخر من سوبر ماركت الزهراء.
            </p>
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedSubcategory(null);
                setSearchQuery('');
                setOnlyOffers(false);
              }}
              className="px-4 py-2 rounded-xl bg-[#0d47a1] hover:bg-[#1565c0] text-yellow-300 font-bold text-xs cursor-pointer shadow-sm transition-all"
            >
              عرض كل المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
            {filteredProducts.map((product) => {
              const inCart = cartItems.find((item) => item.product.id === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={inCart ? inCart.quantity : 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Floating Sticky Cart for BOTH Desktop and Mobile - follows the user seamlessly when scrolling (matches Photo 2) */}
      {cartTotalItems > 0 ? (
        <div 
          id="floating-cart-bar"
          className="fixed bottom-3 inset-x-3 sm:bottom-6 sm:inset-x-auto sm:left-6 sm:right-auto z-40 max-w-lg mx-auto sm:mx-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white p-3 sm:px-5 sm:py-3.5 shadow-2xl border-2 border-red-400/90 rounded-2xl flex items-center justify-between sm:gap-6 font-bold transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 text-black text-[11px] flex items-center justify-center font-black shadow-md border border-yellow-500 animate-bounce">
                {cartTotalItems}
              </span>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black block leading-tight">سلة المشتريات</span>
              <span className="text-[11px] sm:text-xs text-yellow-300 font-bold">
                {cartSubtotal.toLocaleString()} ج.م ({cartTotalItems} {cartTotalItems === 1 ? 'صنف' : 'أصناف'})
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black cursor-pointer shadow-md border border-yellow-500 transition-all hover:scale-105 shrink-0"
            id="floating-cart-checkout-btn"
          >
            <span>عرض السلة والطلب</span>
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>
        </div>
      ) : (
        /* Floating quick access button when cart is empty - always stays with the user */
        <button
          onClick={() => setIsCartOpen(true)}
          id="floating-empty-cart-btn"
          className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 bg-[#0a3d1f] hover:bg-[#145a32] active:scale-95 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl border-2 border-emerald-400/60 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 group"
          title="عرض سلة المشتريات"
          aria-label="عرض سلة المشتريات"
        >
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 transition-transform group-hover:rotate-12" />
          <span className="text-xs font-black text-white pl-1">السلة</span>
        </button>
      )}

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onRequestDelivery={handleRequestDelivery}
      />

      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        cartItems={cartItems}
        merchantPhone={merchantPhone}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderConfirmationModal
        isOpen={isConfirmationOpen}
        order={lastOrder}
        onClose={() => {
          setIsConfirmationOpen(false);
          setLastOrder(null);
        }}
        merchantPhone={merchantPhone}
      />

      <OwnerDashboardModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        products={products}
        hiddenProductIds={hiddenProductIds}
        onToggleHideProduct={handleToggleHideProduct}
        onUnhideAllProducts={handleUnhideAllProducts}
        onUpdateProductPrice={handleUpdateProductPrice}
        onUpdateProductImage={handleUpdateProductImage}
        onUpdateProductBarcode={handleUpdateProductBarcode}
        onResetProductCustomization={handleResetProductCustomization}
        merchantPhone={merchantPhone}
        onUpdateMerchantPhone={setMerchantPhone}
        onSyncCatalog={() => triggerSync(true)}
        isSyncing={isSyncing}
      />

      {/* Footer in Dark Blue */}
      <footer className="bg-[#0d47a1] text-white text-xs mt-12 border-t border-blue-900 w-full">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-black text-white mb-1.5">سوبر ماركت الزهراء</h3>
              <p className="text-blue-100 text-xs leading-relaxed max-w-sm">
                تطبيق وواجهة سوبر ماركت الزهراء لطلب وتوصيل منتجات السوبر ماركت، بأسعار معتمدة وحساب فوري وإرسال تفاصيل الطلب لصاحب المحل بالواتساب.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">أقسام السوبر ماركت</h4>
              <ul className="space-y-1 text-blue-100 text-xs">
                <li>• المخبوزات والحلويات (Bakery)</li>
                <li>• الألبان والأجبان والبيض (Dairy & Eggs)</li>
                <li>• اللحوم والدواجن (Poultry & Meat)</li>
                <li>• المشروبات والعصائر (Beverages)</li>
                <li>• الفواكه والخضروات الطازجة</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">إدارة المحل والتواصل</h4>
              <p className="text-blue-100 mb-1 text-xs">رقم التليفون وفودافون كاش:</p>
              <div className="font-mono text-yellow-300 font-black text-sm mb-1" dir="ltr">
                01029862275
              </div>
              <p className="text-blue-100 mb-1 text-xs">رقم إنستاباي (InstaPay):</p>
              <div className="font-mono text-white font-bold text-xs mb-2.5" dir="ltr">
                01000490647
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs text-yellow-300 hover:text-white cursor-pointer font-bold flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition-colors w-fit"
                title="لوحة تحكم خاصة بصاحب المحل محمية برمز مرور"
              >
                <Lock className="w-3.5 h-3.5 text-yellow-300" />
                <span>لوحة تحكم صاحب المحل (محمية)</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-800 text-center text-blue-200 text-[11px]">
            © {new Date().getFullYear()} سوبر ماركت الزهراء. كافة الحقوق محفوظة.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
