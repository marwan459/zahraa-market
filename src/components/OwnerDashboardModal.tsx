import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Search, 
  Package, 
  ShoppingBag, 
  Phone, 
  Save, 
  Trash2, 
  RefreshCw, 
  KeyRound, 
  CheckCircle2, 
  MessageSquare,
  AlertCircle,
  Pencil,
  Camera,
  Upload,
  RotateCcw,
  Check,
  Tag,
  Barcode,
  Printer,
  FileSpreadsheet,
  FileDown,
  Archive,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { Product, OrderRecord } from '../types';
import { CATEGORIES } from '../data/categories';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { 
  getStoredOrders, 
  clearStoredOrders, 
  saveMerchantPhone, 
  getOwnerPin, 
  saveOwnerPin,
  verifyOwnerPin 
} from '../services/syncService';
import {
  calculateEan13CheckDigit,
  isValidEan13,
  drawBarcodeToCanvas,
  drawProductLabelToCanvas,
  exportProductsToExcel,
  generateBarcodeZipBlob,
  generateLabelsPdf,
  printProductLabelsInBrowser
} from '../utils/barcode';

interface OwnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  hiddenProductIds: string[];
  onToggleHideProduct: (productId: string) => void;
  onUnhideAllProducts: () => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  onUpdateProductImage: (productId: string, newImageUrl: string) => void;
  onUpdateProductBarcode: (productId: string, newBarcode: string) => void;
  onResetProductCustomization: (productId: string) => void;
  merchantPhone: string;
  onUpdateMerchantPhone: (phone: string) => void;
  onSyncCatalog: () => void;
  isSyncing: boolean;
}

// Client-side image compression helper to avoid localStorage quota issues
async function compressImage(file: File, maxWidth = 480, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Small Barcode Canvas Thumbnail Component
const BarcodeCanvasPreview: React.FC<{
  barcode: string;
  width?: number;
  height?: number;
  className?: string;
}> = ({ barcode, width = 160, height = 60, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawBarcodeToCanvas(canvasRef.current, barcode, {
        width,
        height,
        showText: true,
      });
    }
  }, [barcode, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded bg-white border border-slate-200 shadow-2xs ${className}`}
    />
  );
};

export const OwnerDashboardModal: React.FC<OwnerDashboardModalProps> = ({
  isOpen,
  onClose,
  products,
  hiddenProductIds,
  onToggleHideProduct,
  onUnhideAllProducts,
  onUpdateProductPrice,
  onUpdateProductImage,
  onUpdateProductBarcode,
  onResetProductCustomization,
  merchantPhone,
  onUpdateMerchantPhone,
  onSyncCatalog,
  isSyncing
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'barcodes' | 'orders' | 'settings'>('products');

  // Products Tab Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden' | 'customized'>('all');

  // Barcode Tab State
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [selectedBarcodeCategory, setSelectedBarcodeCategory] = useState<string>('all');
  const [selectedProductIdsForPrint, setSelectedProductIdsForPrint] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Inline Price Editing State
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [priceInputValue, setPriceInputValue] = useState<string>('');

  // Inline Image Editing State
  const [editingImageProductId, setEditingImageProductId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageUrlInputValue, setImageUrlInputValue] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inline Barcode Editing State
  const [editingBarcodeProductId, setEditingBarcodeProductId] = useState<string | null>(null);
  const [barcodeInputValue, setBarcodeInputValue] = useState<string>('');
  const [barcodeInputError, setBarcodeInputError] = useState<string | null>(null);

  // Preview Label Modal
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Live Barcode Scanner Tester State
  const [scannerTestInput, setScannerTestInput] = useState('');
  const [scannedTestProduct, setScannedTestProduct] = useState<Product | null>(null);
  const [scannerFeedbackMsg, setScannerFeedbackMsg] = useState<string | null>(null);

  const handleLiveScannerInput = (text: string) => {
    setScannerTestInput(text);
    const clean = text.trim().replace(/\D/g, '');
    if (!clean) {
      setScannedTestProduct(null);
      setScannerFeedbackMsg(null);
      return;
    }
    const found = products.find(p => p.barcode === clean);
    if (found) {
      setScannedTestProduct(found);
      setScannerFeedbackMsg(`✅ تم قراءة الباركود بنجاح! هذا الباركود ينتمي إلى: ${found.nameAr}`);
    } else if (clean.length >= 12) {
      setScannedTestProduct(null);
      setScannerFeedbackMsg(`❌ لم يتم العثور على منتج بهذا الباركود (${clean}).`);
    } else {
      setScannedTestProduct(null);
      setScannerFeedbackMsg(null);
    }
  };

  // In-modal Toast
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setDashboardToast(message);
    setTimeout(() => {
      setDashboardToast(null);
    }, 4000);
  };

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  // Settings State
  const [phoneInput, setPhoneInput] = useState(merchantPhone);
  const [newPinInput, setNewPinInput] = useState('');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Canonical Map to check original price/image/barcode
  const canonicalMap = useMemo(() => {
    const map = new Map<string, Product>();
    INITIAL_PRODUCTS.forEach((p) => {
      map.set(p.id, p);
    });
    return map;
  }, []);

  // Helper to check customization status
  const getCustomizationInfo = (product: Product) => {
    const canonical = canonicalMap.get(product.id);
    const isPriceCustomized = canonical ? canonical.price !== product.price : false;
    const isImageCustomized = canonical ? canonical.image !== product.image : false;
    const isBarcodeCustomized = canonical ? canonical.barcode !== product.barcode : false;
    return {
      isPriceCustomized,
      isImageCustomized,
      isBarcodeCustomized,
      isCustomized: isPriceCustomized || isImageCustomized || isBarcodeCustomized,
      originalPrice: canonical ? canonical.price : product.price,
      originalImage: canonical ? canonical.image : product.image,
      originalBarcode: canonical ? canonical.barcode : product.barcode
    };
  };

  // Load orders when tab changes to orders
  useEffect(() => {
    if (activeTab === 'orders' && isOpen) {
      setOrders(getStoredOrders());
    }
  }, [activeTab, isOpen]);

  // Keep phone input in sync
  useEffect(() => {
    setPhoneInput(merchantPhone);
  }, [merchantPhone]);

  // Filtered Products for the Products Table
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const isHidden = hiddenProductIds.includes(product.id);
      const customInfo = getCustomizationInfo(product);
      
      // Visibility filter
      if (visibilityFilter === 'visible' && isHidden) return false;
      if (visibilityFilter === 'hidden' && !isHidden) return false;
      if (visibilityFilter === 'customized' && !customInfo.isCustomized) return false;

      // Category filter
      if (selectedCategoryFilter !== 'all' && product.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Search filter (nameAr, name, subcategory, or barcode)
      if (productSearch.trim()) {
        const query = productSearch.trim().toLowerCase();
        const inNameAr = product.nameAr.toLowerCase().includes(query);
        const inName = product.name.toLowerCase().includes(query);
        const inSub = product.subcategoryAr?.toLowerCase().includes(query) || false;
        const inBarcode = product.barcode?.toLowerCase().includes(query) || false;
        return inNameAr || inName || inSub || inBarcode;
      }

      return true;
    });
  }, [products, hiddenProductIds, visibilityFilter, selectedCategoryFilter, productSearch, canonicalMap]);

  // Filtered Products for the Barcode Station Tab
  const filteredBarcodeProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedBarcodeCategory !== 'all' && product.categoryId !== selectedBarcodeCategory) {
        return false;
      }

      // Search filter
      if (barcodeSearch.trim()) {
        const query = barcodeSearch.trim().toLowerCase();
        const inNameAr = product.nameAr.toLowerCase().includes(query);
        const inName = product.name.toLowerCase().includes(query);
        const inSub = product.subcategoryAr?.toLowerCase().includes(query) || false;
        const inBarcode = product.barcode?.toLowerCase().includes(query) || false;
        return inNameAr || inName || inSub || inBarcode;
      }

      return true;
    });
  }, [products, selectedBarcodeCategory, barcodeSearch]);

  // Statistics
  const totalCount = products.length;
  const hiddenCount = hiddenProductIds.length;
  const visibleCount = Math.max(0, totalCount - hiddenCount);
  const customizedCount = useMemo(() => {
    return products.filter((p) => {
      const canonical = canonicalMap.get(p.id);
      return canonical
        ? canonical.price !== p.price || canonical.image !== p.image || canonical.barcode !== p.barcode
        : false;
    }).length;
  }, [products, canonicalMap]);
  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.grandTotal || 0), 0);

  // If modal closed, early return AFTER all hooks
  if (!isOpen) return null;

  // Handle PIN submit
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifyOwnerPin(enteredPin.trim())) {
      setIsAuthenticated(true);
      setPinError(false);
      setEnteredPin('');
    } else {
      setPinError(true);
    }
  };

  // Handle Clear Orders
  const handleClearOrders = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الطلبات من السجل؟')) {
      clearStoredOrders();
      setOrders([]);
    }
  };

  // Handle Save Phone
  const handleSavePhone = () => {
    const cleaned = phoneInput.replace(/[^0-9]/g, '');
    saveMerchantPhone(cleaned);
    onUpdateMerchantPhone(cleaned);
    setSettingsSuccessMsg('تم حفظ رقم المتجر بنجاح');
    setTimeout(() => setSettingsSuccessMsg(null), 3000);
  };

  // Handle Save New PIN
  const handleSaveNewPin = () => {
    if (newPinInput.trim().length < 4) {
      alert('يرجى إدخال رمز سري مكون من 4 أرقام على الأقل');
      return;
    }
    saveOwnerPin(newPinInput.trim());
    setNewPinInput('');
    setSettingsSuccessMsg('تم تغيير رمز الأمان السري للوحة التحكم بنجاح');
    setTimeout(() => setSettingsSuccessMsg(null), 3000);
  };

  // Price Edit Handlers
  const handleOpenPriceEdit = (prod: Product) => {
    setEditingPriceProductId(prod.id);
    setPriceInputValue(prod.price.toString());
    setEditingImageProductId(null);
    setEditingBarcodeProductId(null);
  };

  const handleApplyPriceStep = (delta: number) => {
    const current = parseFloat(priceInputValue) || 0;
    const nextVal = Math.max(0, current + delta);
    setPriceInputValue(nextVal.toString());
  };

  const handleSavePrice = (prod: Product) => {
    const num = parseFloat(priceInputValue);
    if (isNaN(num) || num < 0) {
      alert('يرجى كتابة سعر صحيح بالأرقام');
      return;
    }
    onUpdateProductPrice(prod.id, num);
    setEditingPriceProductId(null);
    showToast(`تم تغيير سعر "${prod.nameAr}" إلى ${num} ج.م بنجاح`);
  };

  // Image Edit Handlers
  const handleOpenImageEdit = (prod: Product) => {
    setEditingImageProductId(prod.id);
    setImagePreviewUrl(prod.image);
    setImageUrlInputValue(prod.image.startsWith('data:') ? '' : prod.image);
    setEditingPriceProductId(null);
    setEditingBarcodeProductId(null);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressImage(file, 480, 0.82);
      setImagePreviewUrl(compressedDataUrl);
      setImageUrlInputValue('');
    } catch (err) {
      console.error('Error reading/compressing image', err);
      alert('تعذر تحميل الصورة، يرجى تجربة صورة أخرى');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSaveImage = (prod: Product) => {
    const finalImage = imagePreviewUrl.trim() || imageUrlInputValue.trim();
    if (!finalImage) {
      alert('يرجى اختيار صورة أو إدخال رابط صورة أولاً');
      return;
    }
    onUpdateProductImage(prod.id, finalImage);
    setEditingImageProductId(null);
    showToast(`تم تغيير صورة منتج "${prod.nameAr}" بنجاح`);
  };

  // Barcode Edit Handlers
  const handleOpenBarcodeEdit = (prod: Product) => {
    setEditingBarcodeProductId(prod.id);
    setBarcodeInputValue(prod.barcode || '');
    setBarcodeInputError(null);
    setEditingPriceProductId(null);
    setEditingImageProductId(null);
  };

  const handleSaveBarcode = (prod: Product) => {
    let clean = barcodeInputValue.trim().replace(/\D/g, '');
    
    // If user provided 12 digits, calculate the 13th check digit automatically
    if (clean.length === 12) {
      const check = calculateEan13CheckDigit(clean);
      clean = `${clean}${check}`;
    }

    if (clean.length !== 13) {
      setBarcodeInputError('يجب أن يتكون الباركود EAN-13 من 13 رقماً.');
      return;
    }

    if (!isValidEan13(clean)) {
      setBarcodeInputError('رقم التحقق (Check Digit) للباركود غير صحيح. تأكد من صحة الأرقام.');
      return;
    }

    onUpdateProductBarcode(prod.id, clean);
    setEditingBarcodeProductId(null);
    setBarcodeInputError(null);
    showToast(`تم تحديث باركود "${prod.nameAr}" إلى (${clean}) بنجاح`);
  };

  const handleResetProduct = (prod: Product) => {
    onResetProductCustomization(prod.id);
    setEditingPriceProductId(null);
    setEditingImageProductId(null);
    setEditingBarcodeProductId(null);
    showToast(`تمت استعادة السعر الأصلي والصورة والباركود لـ "${prod.nameAr}"`);
  };

  // ==========================================================================
  // BARCODE EXPORT & PRINT ACTIONS
  // ==========================================================================

  // 1. Download PDF Labels (40x25mm)
  const handleDownloadPdf = async (customList?: Product[]) => {
    const list = customList || (selectedProductIdsForPrint.length > 0 
      ? products.filter(p => selectedProductIdsForPrint.includes(p.id))
      : products);

    if (list.length === 0) {
      alert('يرجى اختيار منتجات لطباعة ملصقاتها');
      return;
    }

    setIsGeneratingPdf(true);
    setPdfProgress(0);
    try {
      const blob = await generateLabelsPdf(list, (pct) => {
        setPdfProgress(pct);
      });
      downloadBlob(blob, `ملصقات_باركود_سوبرماركت_الزهراء_40x25mm_${list.length}_منتج.pdf`);
      showToast(`تم تجهيز وتحميل ملف PDF يحتوي على ${list.length} ملصق مقاس 40×25 مم بنجاح!`);
    } catch (err) {
      console.error('PDF generation error', err);
      alert('حدث خطأ أثناء توليد ملف PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Download Excel Backup (.xlsx)
  const handleDownloadExcel = () => {
    try {
      exportProductsToExcel(products, 'كتالوج_سوبرماركت_الزهراء_الباركود.xlsx');
      showToast('تم تحميل ملف Excel كنسخة احتياطية بالباركود والأسعار بنجاح!');
    } catch (err) {
      console.error('Excel export error', err);
      alert('حدث خطأ أثناء تصدير ملف Excel');
    }
  };

  // 3. Download Barcode Images ZIP
  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    setZipProgress(0);
    try {
      const blob = await generateBarcodeZipBlob(products, (pct) => {
        setZipProgress(Math.round(pct));
      });
      downloadBlob(blob, 'صور_باركود_سوبرماركت_الزهراء_PNG.zip');
      showToast('تم تجهيز وتحميل ملف ZIP الذي يحتوي على جميع صور الباركود PNG بنجاح!');
    } catch (err) {
      console.error('ZIP generation error', err);
      alert('حدث خطأ أثناء إنشاء ملف ZIP للصور');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // 4. Print Single or Batch Labels in Browser (Direct thermal printer)
  const handlePrintLabels = (targetList: Product[]) => {
    if (targetList.length === 0) {
      alert('يرجى تحديد منتجات للطباعة');
      return;
    }
    printProductLabelsInBrowser(targetList);
  };

  // Download Single Product Barcode Image
  const handleDownloadSingleBarcodePng = (prod: Product) => {
    const canvas = document.createElement('canvas');
    drawBarcodeToCanvas(canvas, prod.barcode || '2000000000015', { width: 500, height: 200, showText: true });
    canvas.toBlob((blob) => {
      if (blob) {
        const cleanName = (prod.nameAr || 'barcode').replace(/[\\/:*?"<>|]/g, '_').slice(0, 25);
        downloadBlob(blob, `باركود_${prod.barcode}_${cleanName}.png`);
        showToast(`تم تنزيل صورة باركود ${prod.nameAr}`);
      }
    });
  };

  // Toggle selection for batch print
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIdsForPrint((prev) => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredBarcodeProducts.map(p => p.id);
    setSelectedProductIdsForPrint(ids);
  };

  const handleDeselectAll = () => {
    setSelectedProductIdsForPrint([]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#082b64]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-blue-200 my-4 flex flex-col max-h-[92vh]">
        
        {/* ========================================================
            1. LOGIN / PIN LOCK SCREEN FOR OWNER
            ======================================================== */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 text-center flex flex-col items-center justify-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0d47a1] text-yellow-300 flex items-center justify-center shadow-lg border-2 border-yellow-400">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                لوحة تحكم صاحب سوبر ماركت الزهراء
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                هذه اللوحة خاصة بإدارة المحل لتوليد وطباعة الباركود EAN-13، وتغيير الأسعار والصور، وإخفاء/إظهار المنتجات وسجل الطلبات. الزبائن لا يمكنهم الدخول إليها.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                  أدخل رمز المرور السري (PIN):
                </label>
                <input
                  type="password"
                  maxLength={10}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="••••"
                  autoFocus
                  className={`w-full px-4 py-3 rounded-xl border text-center text-xl tracking-widest font-mono font-black focus:outline-none focus:ring-2 bg-[#f0f7ff] ${
                    pinError
                      ? 'border-red-500 focus:ring-red-400 text-red-600'
                      : 'border-blue-200 focus:ring-[#0d47a1] text-slate-900'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>الرمز السري غير صحيح. حاول مجدداً</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#0d47a1] hover:bg-[#1565c0] text-white font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Unlock className="w-4 h-4 text-yellow-300" />
                <span>دخول لوحة التحكم</span>
              </button>
            </form>

            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer pt-2"
            >
              إلغاء والعودة للمتجر
            </button>
          </div>
        ) : (
          /* ========================================================
             2. OWNER CONTROL PANEL INTERFACE
             ======================================================== */
          <>
            {/* Header */}
            <div className="bg-[#0d47a1] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-yellow-300">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg leading-tight">لوحة تحكم صاحب المحل</h2>
                  <p className="text-xs text-blue-200">التحكم في الباركود والأسعار والصور والمنتجات المعروضة وسجل الطلبات</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/20 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-yellow-300" />
                  <span>قفل اللوحة</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-Modal Success Toast */}
            {dashboardToast && (
              <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-black flex items-center justify-between shadow-inner animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{dashboardToast}</span>
                </div>
                <button onClick={() => setDashboardToast(null)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-blue-100 bg-[#f0f7ff] px-3 pt-2 gap-1.5 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-white text-[#0d47a1] border-t-2 border-r border-l border-blue-300 shadow-xs'
                    : 'text-slate-600 hover:text-[#0d47a1] hover:bg-blue-50'
                }`}
              >
                <Tag className="w-4 h-4 text-[#0d47a1]" />
                <span>إدارة المنتجات (الأسعار والصور والإخفاء)</span>
                {customizedCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {customizedCount} معدل
                  </span>
                )}
                {hiddenCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {hiddenCount} مخفي
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('barcodes')}
                className={`py-2 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'barcodes'
                    ? 'bg-white text-emerald-800 border-t-2 border-r border-l border-emerald-300 shadow-xs'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Barcode className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-900 font-black">نظام وطباعة الباركود (EAN-13)</span>
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  848 ملصق
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#0d47a1] border-t-2 border-r border-l border-blue-300 shadow-xs'
                    : 'text-slate-600 hover:text-[#0d47a1] hover:bg-blue-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#1565c0]" />
                <span>سجل الطلبات الواردة ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-white text-[#0d47a1] border-t-2 border-r border-l border-blue-300 shadow-xs'
                    : 'text-slate-600 hover:text-[#0d47a1] hover:bg-blue-50'
                }`}
              >
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>إعدادات المتجر والأمان</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              
              {/* ========================================================
                  TAB 1: PRODUCTS (PRICES, IMAGES & VISIBILITY)
                  ======================================================== */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                    <div className="bg-blue-50 rounded-xl p-2.5 sm:p-3 border border-blue-200">
                      <span className="text-[11px] text-slate-500 block font-bold">إجمالي المنتجات</span>
                      <strong className="text-base sm:text-xl font-black text-[#0d47a1]">{totalCount}</strong>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2.5 sm:p-3 border border-emerald-200">
                      <span className="text-[11px] text-emerald-700 block font-bold">معروض للزباين</span>
                      <strong className="text-base sm:text-xl font-black text-emerald-700">{visibleCount}</strong>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-2.5 sm:p-3 border border-rose-200">
                      <span className="text-[11px] text-rose-700 block font-bold">مخفي عن الزباين</span>
                      <strong className="text-base sm:text-xl font-black text-rose-700">{hiddenCount}</strong>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2.5 sm:p-3 border border-amber-200">
                      <span className="text-[11px] text-amber-800 block font-bold">تم تعديل سعره / صورته</span>
                      <strong className="text-base sm:text-xl font-black text-amber-800">{customizedCount}</strong>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="bg-[#f0f7ff] p-3 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-2.5">
                    {/* Search in products (name or barcode) */}
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو امسح الباركود (مثل: شيبسي أو 2000000000015)..."
                        className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d47a1]"
                      />
                      <Search className="w-3.5 h-3.5 text-[#0d47a1] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {productSearch && (
                        <button
                          onClick={() => setProductSearch('')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d47a1]"
                    >
                      <option value="all">جميع الأقسام</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameAr}
                        </option>
                      ))}
                    </select>

                    {/* Visibility & Customization Status Filter */}
                    <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-blue-200 text-xs font-bold">
                      <button
                        onClick={() => setVisibilityFilter('all')}
                        className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          visibilityFilter === 'all'
                            ? 'bg-[#0d47a1] text-white'
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => setVisibilityFilter('visible')}
                        className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          visibilityFilter === 'visible'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:bg-emerald-50'
                        }`}
                      >
                        اظهار الزباين ({visibleCount})
                      </button>
                      <button
                        onClick={() => setVisibilityFilter('hidden')}
                        className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          visibilityFilter === 'hidden'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:bg-rose-50'
                        }`}
                      >
                        اخفاء عن الزباين ({hiddenCount})
                      </button>
                      <button
                        onClick={() => setVisibilityFilter('customized')}
                        className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          visibilityFilter === 'customized'
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-600 hover:bg-amber-50'
                        }`}
                      >
                        معدل ({customizedCount})
                      </button>
                    </div>

                    {/* Unhide all button if any are hidden */}
                    {hiddenCount > 0 && (
                      <button
                        onClick={onUnhideAllProducts}
                        className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-emerald-300"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>إظهار كل المنتجات للزبائن</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden Global File Input for Image Upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {/* Products List */}
                  <div className="divide-y divide-blue-100 border border-blue-100 rounded-xl overflow-hidden bg-white shadow-xs max-h-[52vh] overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        لا توجد منتجات مطابقة لهذا البحث أو الفلتر
                      </div>
                    ) : (
                      filteredProducts.map((prod) => {
                        const isHidden = hiddenProductIds.includes(prod.id);
                        const customInfo = getCustomizationInfo(prod);
                        const isEditingPrice = editingPriceProductId === prod.id;
                        const isEditingImage = editingImageProductId === prod.id;
                        const isEditingBarcode = editingBarcodeProductId === prod.id;

                        return (
                          <div
                            key={prod.id}
                            className={`p-3 transition-colors ${
                              isHidden
                                ? 'bg-rose-50/50 border-r-4 border-r-rose-500'
                                : customInfo.isCustomized
                                ? 'bg-amber-50/30 border-r-4 border-r-amber-500 hover:bg-amber-50/50'
                                : 'hover:bg-blue-50/40 border-r-4 border-r-emerald-500'
                            }`}
                          >
                            {/* Main Product Row */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                              {/* Product Info & Thumbnail */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative group shrink-0">
                                  <img
                                    src={prod.image}
                                    alt={prod.nameAr}
                                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs bg-slate-50"
                                    loading="lazy"
                                  />
                                  {customInfo.isImageCustomized && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[9px] font-black px-1 rounded shadow-xs">
                                      صورة جديدة
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleOpenImageEdit(prod)}
                                    title="تغيير صورة المنتج"
                                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity cursor-pointer text-[10px] font-bold"
                                  >
                                    <Camera className="w-4 h-4 text-yellow-300" />
                                  </button>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                      {prod.nameAr}
                                    </h4>
                                    {customInfo.isPriceCustomized && (
                                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md">
                                        سعر مخصص (الأصلي: {customInfo.originalPrice} ج)
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                                    <span>{prod.subcategoryAr || prod.name}</span>
                                    <span>•</span>
                                    <span className="font-black text-sm text-[#0d47a1]">
                                      {prod.price} ج.م
                                    </span>
                                    {prod.unitAr && <span>({prod.unitAr})</span>}
                                    <span>•</span>
                                    <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200" dir="ltr">
                                      {prod.barcode || '---'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Edit Price, Change Image, Edit Barcode, Print, Visibility Toggle */}
                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                                {/* Edit Price Button */}
                                <button
                                  onClick={() => handleOpenPriceEdit(prod)}
                                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 border shadow-2xs ${
                                    isEditingPrice
                                      ? 'bg-blue-700 text-white border-blue-800'
                                      : 'bg-white hover:bg-blue-50 text-blue-900 border-blue-200'
                                  }`}
                                  title="تغيير سعر هذا المنتج"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                  <span>السعر</span>
                                </button>

                                {/* Change Image Button */}
                                <button
                                  onClick={() => handleOpenImageEdit(prod)}
                                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 border shadow-2xs ${
                                    isEditingImage
                                      ? 'bg-amber-700 text-white border-amber-800'
                                      : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-200'
                                  }`}
                                  title="تغيير صورة هذا المنتج"
                                >
                                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                                  <span>الصورة</span>
                                </button>

                                {/* Edit Barcode Button */}
                                <button
                                  onClick={() => handleOpenBarcodeEdit(prod)}
                                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 border shadow-2xs ${
                                    isEditingBarcode
                                      ? 'bg-emerald-700 text-white border-emerald-800'
                                      : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-200'
                                  }`}
                                  title="تعديل رقم الباركود لهذا المنتج"
                                >
                                  <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>الباركود</span>
                                </button>

                                {/* Single Print Sticker Button */}
                                <button
                                  onClick={() => handlePrintLabels([prod])}
                                  className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="طباعة ملصق 40×25 مم لهذا المنتج فوراً"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-700" />
                                  <span>ملصق</span>
                                </button>

                                {/* Visibility Toggle Button */}
                                <button
                                  onClick={() => onToggleHideProduct(prod.id)}
                                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 ${
                                    isHidden
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {isHidden ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5 text-white" />
                                      <span>مخفي</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5 text-white" />
                                      <span>ظاهر</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* ===================================================
                                INLINE PRICE EDITOR
                                =================================================== */}
                            {isEditingPrice && (
                              <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs">
                                    <Tag className="w-3.5 h-3.5 text-[#0d47a1]" />
                                    <span>تعديل سعر: {prod.nameAr}</span>
                                  </div>
                                  <button
                                    onClick={() => setEditingPriceProductId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                                  >
                                    إلغاء ✕
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={priceInputValue}
                                      onChange={(e) => setPriceInputValue(e.target.value)}
                                      autoFocus
                                      className="w-28 px-3 py-1.5 text-sm font-black font-mono text-center rounded-lg border border-blue-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d47a1]"
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                      ج.م
                                    </span>
                                  </div>

                                  {/* Quick Step Buttons */}
                                  <div className="flex items-center gap-1 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPriceStep(-1)}
                                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                                      title="إنقاص 1 جنيه"
                                    >
                                      -1ج
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPriceStep(1)}
                                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                                      title="زيادة 1 جنيه"
                                    >
                                      +1ج
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPriceStep(5)}
                                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                                      title="زيادة 5 جنيه"
                                    >
                                      +5ج
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPriceStep(10)}
                                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-pointer"
                                      title="زيادة 10 جنيه"
                                    >
                                      +10ج
                                    </button>
                                  </div>

                                  {/* Save Button */}
                                  <button
                                    onClick={() => handleSavePrice(prod)}
                                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>حفظ السعر</span>
                                  </button>

                                  {/* Reset Button if modified */}
                                  {customInfo.isPriceCustomized && (
                                    <button
                                      onClick={() => handleResetProduct(prod)}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                      title="استعادة السعر الأصلي من الكتالوج"
                                    >
                                      <RotateCcw className="w-3 h-3 text-slate-600" />
                                      <span>استعادة الأصلي ({customInfo.originalPrice} ج)</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ===================================================
                                INLINE IMAGE EDITOR
                                =================================================== */}
                            {isEditingImage && (
                              <div className="mt-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-3 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                                    <span>تغيير صورة منتج: {prod.nameAr}</span>
                                  </div>
                                  <button
                                    onClick={() => setEditingImageProductId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                                  >
                                    إلغاء ✕
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Preview box */}
                                  <div className="relative shrink-0">
                                    <img
                                      src={imagePreviewUrl || prod.image}
                                      alt="معاينة الصورة"
                                      className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400 bg-white shadow-xs"
                                    />
                                    {isProcessingImage && (
                                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white text-[10px] font-bold">
                                        جاري المعالجة...
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 space-y-2 min-w-[200px]">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Trigger Phone Camera or Gallery File Picker */}
                                      <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-lg bg-[#0d47a1] hover:bg-[#1565c0] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                      >
                                        <Camera className="w-3.5 h-3.5 text-yellow-300" />
                                        <span>اختيار صورة من الكاميرا أو الهاتف</span>
                                      </button>

                                      <span className="text-[11px] text-slate-400 font-bold">أو</span>
                                    </div>

                                    {/* Direct URL input */}
                                    <div className="flex gap-2">
                                      <input
                                        type="url"
                                        value={imageUrlInputValue}
                                        onChange={(e) => {
                                          setImageUrlInputValue(e.target.value);
                                          if (e.target.value.trim()) {
                                            setImagePreviewUrl(e.target.value.trim());
                                          }
                                        }}
                                        placeholder="الصق رابط صورة جديدة (URL)..."
                                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Image Actions */}
                                <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                                  <button
                                    onClick={() => handleSaveImage(prod)}
                                    disabled={isProcessingImage}
                                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>حفظ الصورة الجديدة</span>
                                  </button>

                                  {customInfo.isImageCustomized && (
                                    <button
                                      onClick={() => handleResetProduct(prod)}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                      title="استعادة الصورة الأصلية من الكتالوج"
                                    >
                                      <RotateCcw className="w-3 h-3 text-slate-600" />
                                      <span>استعادة الصورة الأصلية</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setEditingImageProductId(null)}
                                    className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ===================================================
                                INLINE BARCODE EDITOR
                                =================================================== */}
                            {isEditingBarcode && (() => {
                              const cleanDigits = barcodeInputValue.replace(/\D/g, '');
                              const is12 = cleanDigits.length === 12;
                              const is13 = cleanDigits.length === 13;
                              const calculatedCheck = cleanDigits.length >= 12 ? calculateEan13CheckDigit(cleanDigits.slice(0, 12)) : null;
                              const isCurrentValid = is13 && isValidEan13(cleanDigits);
                              const checkMismatch = is13 && calculatedCheck !== null && parseInt(cleanDigits[12], 10) !== calculatedCheck;

                              return (
                                <div className="mt-3 p-3 bg-emerald-50/95 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs">
                                      <Barcode className="w-4 h-4 text-emerald-700" />
                                      <span>تعديل باركود: {prod.nameAr}</span>
                                    </div>
                                    <button
                                      onClick={() => setEditingBarcodeProductId(null)}
                                      className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                                    >
                                      إلغاء ✕
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        maxLength={13}
                                        value={barcodeInputValue}
                                        onChange={(e) => {
                                          setBarcodeInputValue(e.target.value.replace(/\D/g, ''));
                                          setBarcodeInputError(null);
                                        }}
                                        autoFocus
                                        placeholder="2000000000015"
                                        className="w-48 px-3 py-1.5 text-sm font-black font-mono text-center rounded-lg border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                      />
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                                        {cleanDigits.length}/13
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => handleSaveBarcode(prod)}
                                      className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>حفظ الباركود</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        const canonical = canonicalMap.get(prod.id);
                                        if (canonical?.barcode) {
                                          setBarcodeInputValue(canonical.barcode);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-xs cursor-pointer hover:bg-emerald-50"
                                      title="استعادة الباركود الأصلي المولّد تلقائياً"
                                    >
                                      <RotateCcw className="w-3 h-3 text-emerald-600 inline ml-1" />
                                      <span>الافتراضي</span>
                                    </button>
                                  </div>

                                  {/* Live Feedback & Auto-Fix */}
                                  {is12 && calculatedCheck !== null && (
                                    <div className="bg-white p-2 rounded-lg border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between gap-2">
                                      <span>
                                        🟢 كتبت 12 رقماً، وتم احتساب رقم التحقق تلقائياً (<strong>{calculatedCheck}</strong>). الباركود المكتمل: <strong className="font-mono">{cleanDigits}{calculatedCheck}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setBarcodeInputValue(`${cleanDigits}${calculatedCheck}`)}
                                        className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                                      >
                                        تثبيت الرقم الأخير
                                      </button>
                                    </div>
                                  )}

                                  {checkMismatch && (
                                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-2">
                                      <span>
                                        ⚠️ رقم التحقق الأخير ({cleanDigits[12]}) غير مطابق للمعادلة. الرقم الصحيح هو (<strong>{calculatedCheck}</strong>).
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setBarcodeInputValue(`${cleanDigits.slice(0, 12)}${calculatedCheck}`)}
                                        className="px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-bold cursor-pointer"
                                      >
                                        تصحيح تلقائي
                                      </button>
                                    </div>
                                  )}

                                  {isCurrentValid && (
                                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>باركود EAN-13 سليم وصالح 100% ويقرأه أي ماسح ضوئي.</span>
                                    </p>
                                  )}

                                  {barcodeInputError && (
                                    <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>{barcodeInputError}</span>
                                    </p>
                                  )}

                                  <div className="text-[11px] text-emerald-900 bg-emerald-100/60 p-2 rounded-lg leading-relaxed">
                                    💡 <strong>طريقة كتابة الباركود:</strong> اكتب أول 12 رقماً (مثلاً <code>200000000001</code>)، وسيقوم النظام بحساب الرقم الـ 13 (Check Digit) وإضافته لك تلقائياً ليصبح صالحاً فوراً.
                                  </div>
                                </div>
                              );
                            })()}

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 2: BARCODE & LABELS STATION (EAN-13 FULL SYSTEM)
                  ======================================================== */}
              {activeTab === 'barcodes' && (
                <div className="space-y-4">
                  {/* Top Barcode Banner & Core Actions */}
                  <div className="bg-gradient-to-r from-[#0d47a1] to-[#1565c0] rounded-2xl p-4 sm:p-5 text-white shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md">
                            نظام باركود EAN-13 رسمي
                          </span>
                          <span className="text-blue-200 text-xs">
                            مقاس الملصق: 40 × 25 مم
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black">
                          مركز طباعة وتصدير ملصقات الباركود
                        </h3>
                        <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                          جميع المنتجات الـ 848 تم توليد باركود فريد وصالح لها يبدأ بـ <strong>2000000</strong> مع رقم التحقق (Check Digit). جاهزة للطباعة على طابعات الملصقات الحرارية والتصدير لـ PDF وإكسل.
                        </p>
                      </div>

                      {/* 4 Core Buttons Requested by the User */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. PDF Download Button */}
                        <button
                          onClick={() => handleDownloadPdf()}
                          disabled={isGeneratingPdf}
                          className="px-3.5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95 disabled:opacity-50"
                          title="تحميل ملف PDF جاهز للطباعة على ورق الملصقات اللاصق (40x25mm)"
                        >
                          <FileDown className="w-4 h-4 text-slate-950" />
                          <span>{isGeneratingPdf ? `جاري التوليد (${pdfProgress}%)...` : 'ملف PDF للملصقات (40×25mm)'}</span>
                        </button>

                        {/* 2. Excel Backup Download Button */}
                        <button
                          onClick={handleDownloadExcel}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95"
                          title="تحميل ملف Excel كنسخة احتياطية بالباركود والأسعار"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-white" />
                          <span>ملف Excel كنسخة احتياطية</span>
                        </button>

                        {/* 3. ZIP of Barcode PNGs Download Button */}
                        <button
                          onClick={handleDownloadZip}
                          disabled={isGeneratingZip}
                          className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer border border-white/20 shadow-md transition-transform active:scale-95 disabled:opacity-50"
                          title="تحميل ملف مضغوط ZIP يحتوي على صور PNG عالية الدقة لجميع الباركودات"
                        >
                          <Archive className="w-4 h-4 text-yellow-300" />
                          <span>{isGeneratingZip ? `جاري الضغط (${zipProgress}%)...` : 'صور الباركود (ملف ZIP)'}</span>
                        </button>

                        {/* 4. Direct Print Button */}
                        <button
                          onClick={() => handlePrintLabels(
                            selectedProductIdsForPrint.length > 0 
                              ? products.filter(p => selectedProductIdsForPrint.includes(p.id)) 
                              : filteredBarcodeProducts
                          )}
                          className="px-3.5 py-2.5 rounded-xl bg-white text-[#0d47a1] hover:bg-blue-50 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95"
                          title="طباعة الملصقات مباشرة عبر المتصفح على طابعة الباركود"
                        >
                          <Printer className="w-4 h-4 text-[#0d47a1]" />
                          <span>
                            طباعة الملصقات {selectedProductIdsForPrint.length > 0 ? `(${selectedProductIdsForPrint.length})` : '(الكل)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Live Barcode Scanner Station */}
                  <div className="bg-white rounded-2xl p-4 border-2 border-emerald-400 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Barcode className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <span>فاحص وقارئ الباركود المباشر (Barcode Scanner Test)</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              متصل بالماسح الضوئي
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            وجّه قارئ الباركود الليزري أو اكتب أي رقم باركود هنا للتجربة الفورية والتحقق من قراءة المنتج وسعره
                          </p>
                        </div>
                      </div>

                      {/* Quick Sample Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                        <span className="text-slate-400 text-[11px]">أمثلة للتجربة:</span>
                        <button
                          type="button"
                          onClick={() => handleLiveScannerInput('2000000000015')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0d47a1] rounded-lg border border-blue-200 cursor-pointer transition-colors"
                        >
                          كيك جوردينا
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const chips = products.find(p => p.nameAr.includes('شيبسي') || p.name.toLowerCase().includes('chipsy'));
                            if (chips?.barcode) {
                              handleLiveScannerInput(chips.barcode);
                            }
                          }}
                          className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 rounded-lg border border-yellow-300 cursor-pointer transition-colors"
                        >
                          شيبسي
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLiveScannerInput('2000000008486')}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg border border-purple-200 cursor-pointer transition-colors"
                        >
                          زيت جونسون
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={scannerTestInput}
                          onChange={(e) => handleLiveScannerInput(e.target.value)}
                          placeholder="وجّه مسدس قارئ الباركود هنا أو اكتب رقم الباركود (13 رقم)..."
                          className="w-full pr-10 pl-3 py-2.5 rounded-xl border-2 border-emerald-300 bg-[#f0fdf4] text-slate-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                        />
                        <Barcode className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {scannerTestInput && (
                        <button
                          type="button"
                          onClick={() => handleLiveScannerInput('')}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer border border-slate-300"
                        >
                          مسح
                        </button>
                      )}
                    </div>

                    {/* Live Scanned Result Display */}
                    {scannedTestProduct && (
                      <div className="bg-emerald-50 rounded-xl p-3.5 border-2 border-emerald-300 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={scannedTestProduct.image}
                            alt={scannedTestProduct.nameAr}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400 bg-white shadow-xs shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-md inline-block">
                              🟢 تم التعرف فوراً على المنتج بالماسح الضوئي (EAN-13 معتمد)
                            </span>
                            <h4 className="font-black text-slate-900 text-sm sm:text-base mt-1 truncate">
                              {scannedTestProduct.nameAr}
                            </h4>
                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-1">
                              <span>السعر: <strong className="text-[#0d47a1] font-black text-base">{scannedTestProduct.price} ج.م</strong></span>
                              <span>•</span>
                              <span>القسم: {scannedTestProduct.subcategoryAr}</span>
                              <span>•</span>
                              <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200" dir="ltr">
                                {scannedTestProduct.barcode}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePrintLabels([scannedTestProduct])}
                            className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                            <span>طباعة ملصق فوري</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(scannedTestProduct)}
                            className="px-3 py-2 rounded-xl bg-white border border-emerald-400 text-emerald-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>معاينة الملصق (40×25 مم)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {scannerFeedbackMsg && !scannedTestProduct && (
                      <p className="text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>{scannerFeedbackMsg}</span>
                      </p>
                    )}
                  </div>

                  {/* Search & Filter Bar for Barcodes */}
                  <div className="bg-[#f0f7ff] p-3 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <input
                        type="text"
                        value={barcodeSearch}
                        onChange={(e) => setBarcodeSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو امسح الباركود مباشرة..."
                        className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d47a1]"
                      />
                      <Search className="w-3.5 h-3.5 text-[#0d47a1] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {barcodeSearch && (
                        <button
                          onClick={() => setBarcodeSearch('')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <select
                      value={selectedBarcodeCategory}
                      onChange={(e) => setSelectedBarcodeCategory(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d47a1]"
                    >
                      <option value="all">جميع الأقسام ({products.length})</option>
                      {CATEGORIES.map((cat) => {
                        const count = products.filter(p => p.categoryId === cat.id).length;
                        return (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameAr} ({count})
                          </option>
                        );
                      })}
                    </select>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <button
                        onClick={handleSelectAllFiltered}
                        className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-900 rounded-lg border border-blue-200 cursor-pointer"
                      >
                        تحديد المعروض ({filteredBarcodeProducts.length})
                      </button>
                      {selectedProductIdsForPrint.length > 0 && (
                        <button
                          onClick={handleDeselectAll}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer"
                        >
                          إلغاء التحديد ({selectedProductIdsForPrint.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barcode Products Grid / Table */}
                  <div className="divide-y divide-blue-100 border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[50vh] overflow-y-auto">
                    {filteredBarcodeProducts.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        لا توجد منتجات مطابقة لهذا البحث
                      </div>
                    ) : (
                      filteredBarcodeProducts.map((prod) => {
                        const isSelected = selectedProductIdsForPrint.includes(prod.id);
                        const isEditingThisBarcode = editingBarcodeProductId === prod.id;

                        return (
                          <div
                            key={prod.id}
                            className={`p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors ${
                              isSelected ? 'bg-blue-50/70 border-r-4 border-r-[#0d47a1]' : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Checkbox & Product Info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectProduct(prod.id)}
                                className="w-4 h-4 rounded text-[#0d47a1] focus:ring-[#0d47a1] cursor-pointer"
                              />

                              <img
                                src={prod.image}
                                alt={prod.nameAr}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                loading="lazy"
                              />

                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                                  {prod.nameAr}
                                </h4>
                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span>{prod.subcategoryAr || prod.name}</span>
                                  <span>•</span>
                                  <strong className="text-[#0d47a1] font-black">{prod.price} ج.م</strong>
                                  {prod.unitAr && <span>({prod.unitAr})</span>}
                                </div>
                              </div>
                            </div>

                            {/* Scannable Barcode Canvas Preview */}
                            <div className="shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                              <BarcodeCanvasPreview
                                barcode={prod.barcode || '2000000000015'}
                                width={150}
                                height={55}
                              />
                            </div>

                            {/* Barcode Number & Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                              {/* Edit Barcode */}
                              <button
                                onClick={() => handleOpenBarcodeEdit(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="تعديل رقم الباركود"
                              >
                                <Pencil className="w-3 h-3 text-slate-600" />
                                <span>تعديل</span>
                              </button>

                              {/* Preview Sticker Modal */}
                              <button
                                onClick={() => setPreviewProduct(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0d47a1] border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="معاينة ملصق 40×25 مم"
                              >
                                <Eye className="w-3 h-3 text-[#0d47a1]" />
                                <span>معاينة</span>
                              </button>

                              {/* Single Thermal Print */}
                              <button
                                onClick={() => handlePrintLabels([prod])}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
                                title="طباعة ملصق 40×25 مم لهذا المنتج"
                              >
                                <Printer className="w-3.5 h-3.5 text-white" />
                                <span>طباعة ملصق</span>
                              </button>

                              {/* Single PNG Download */}
                              <button
                                onClick={() => handleDownloadSingleBarcodePng(prod)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                                title="تحميل صورة الباركود PNG"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Inline Barcode Editor if open */}
                            {isEditingThisBarcode && (
                              <div className="w-full mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-emerald-900">أدخل رقم باركود EAN-13:</span>
                                <input
                                  type="text"
                                  maxLength={13}
                                  value={barcodeInputValue}
                                  onChange={(e) => setBarcodeInputValue(e.target.value.replace(/\D/g, ''))}
                                  className="w-44 px-2 py-1 text-xs font-mono font-black border border-emerald-400 rounded bg-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveBarcode(prod)}
                                  className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-black cursor-pointer hover:bg-emerald-800"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={() => setEditingBarcodeProductId(null)}
                                  className="px-2 py-1 text-slate-500 text-xs font-bold cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 3: ORDERS HISTORY (OWNER ONLY)
                  ======================================================== */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Orders Summary Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f0f7ff] p-3 rounded-xl border border-blue-200">
                    <div>
                      <h3 className="font-black text-sm text-slate-900">سجل طلبات التوصيل المسجلة</h3>
                      <p className="text-xs text-slate-500">
                        إجمالي {orders.length} طلبات • إجمالي المبيعات:{' '}
                        <strong className="text-[#0d47a1]">{totalRevenue.toLocaleString()} ج.م</strong>
                      </p>
                    </div>

                    {orders.length > 0 && (
                      <button
                        onClick={handleClearOrders}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>مسح سجل الطلبات</span>
                      </button>
                    )}
                  </div>

                  {/* Orders List */}
                  {orders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-bold text-sm">لا توجد طلبات مسجلة حالياً</p>
                      <p className="text-xs">عند قيام أي زبون بالطلب ستظهر كافة تفاصيل طلبه هنا فوراً لصاحب المحل.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs space-y-3"
                        >
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-[#0d47a1] bg-blue-100 px-2 py-0.5 rounded-md">
                                #{order.id}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(order.createdAt).toLocaleString('ar-EG')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#0d47a1] bg-yellow-100 text-yellow-900 px-2.5 py-0.5 rounded-full border border-yellow-300">
                                الإجمالي: {order.grandTotal} ج.م
                              </span>
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#f8fbff] p-3 rounded-lg border border-blue-50">
                            <div>
                              <span className="text-slate-400 font-bold block">اسم العميل:</span>
                              <strong className="text-slate-900">{order.customer.fullName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block">رقم الهاتف:</span>
                              <strong className="text-[#0d47a1] font-mono" dir="ltr">
                                {order.customer.phoneNumber}
                              </strong>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 font-bold block">العنوان بالتفصيل:</span>
                              <p className="text-slate-800">
                                {order.customer.address}
                                {order.customer.buildingNo && ` • عمارة: ${order.customer.buildingNo}`}
                                {order.customer.floorNo && ` • دور: ${order.customer.floorNo}`}
                                {order.customer.apartmentNo && ` • شقة: ${order.customer.apartmentNo}`}
                                {order.customer.landmark && ` • علامة مميزة: ${order.customer.landmark}`}
                              </p>
                            </div>
                            {order.customer.notes && (
                              <div className="sm:col-span-2 text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                                <strong>ملاحظات العميل:</strong> {order.customer.notes}
                              </div>
                            )}
                          </div>

                          {/* Ordered Items */}
                          <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1">المنتجات المطلوبة:</span>
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden text-xs">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="p-2 flex items-center justify-between bg-white hover:bg-slate-50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{item.product.nameAr}</span>
                                    <span className="text-slate-400">× {item.quantity}</span>
                                  </div>
                                  <strong className="font-mono text-[#0d47a1]">
                                    {(item.product.price * item.quantity).toFixed(2)} ج.م
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Direct WhatsApp Call/Chat with Customer */}
                          <div className="flex justify-end gap-2 pt-1">
                            <a
                              href={`https://wa.me/2${order.customer.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>مراسلة العميل بالواتساب</span>
                            </a>
                            <a
                              href={`tel:${order.customer.phoneNumber}`}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>اتصال هاتفي</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 4: STORE SETTINGS & PIN SECURITY
                  ======================================================== */}
              {activeTab === 'settings' && (
                <div className="space-y-5 max-w-xl mx-auto">
                  {settingsSuccessMsg && (
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{settingsSuccessMsg}</span>
                    </div>
                  )}

                  {/* Merchant Phone Number for WhatsApp orders */}
                  <div className="bg-white rounded-2xl p-4 border border-blue-200 space-y-3">
                    <div className="flex items-center gap-2 text-[#0d47a1]">
                      <Phone className="w-4 h-4" />
                      <h4 className="font-black text-sm">رقم استقبال الطلبات (واتساب وفودافون كاش)</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      هذا هو الرقم الذي تصل إليه رسائل طلبات الزبائن مباشرة على الواتساب، وأيضاً رقم محفظة فودافون كاش لاستلام المدفوعات.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="201029862275"
                        dir="ltr"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-blue-200 font-mono text-xs sm:text-sm bg-[#f0f7ff] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d47a1]"
                      />
                      <button
                        onClick={handleSavePhone}
                        className="px-4 py-2 rounded-xl bg-[#0d47a1] hover:bg-[#1565c0] text-white font-black text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ الرقم</span>
                      </button>
                    </div>
                  </div>

                  {/* Change Owner PIN code */}
                  <div className="bg-white rounded-2xl p-4 border border-blue-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700">
                      <KeyRound className="w-4 h-4" />
                      <h4 className="font-black text-sm">تغيير رمز المرور السري (PIN)</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      يمكنك تعيين رمز أمان سري جديد من هنا في أي وقت، واحرص على ألا يعرفه أحد سواك لمنع الزبائن من الدخول للوحة.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={10}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="أدخل رمز جديد (أرقام)"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-blue-200 font-mono text-xs sm:text-sm bg-[#f0f7ff] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        onClick={handleSaveNewPin}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>تحديث الرمز</span>
                      </button>
                    </div>
                  </div>

                  {/* Sync Products Catalog */}
                  <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-xs text-[#0d47a1]">مزامنة الكتالوج</h4>
                        <p className="text-[11px] text-slate-500">
                          تحديث قائمة المنتجات مع الحفاظ التام على أي أسعار، صور، أو باركودات قمت بتعديلها.
                        </p>
                      </div>
                      <button
                        onClick={onSyncCatalog}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-[#0d47a1] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </>
        )}

      </div>

      {/* ========================================================
          SINGLE PRODUCT LABEL PREVIEW MODAL (40x25mm)
          ======================================================== */}
      {previewProduct && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-blue-300">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-emerald-700" />
                <span>معاينة ملصق الباركود (40 × 25 مم)</span>
              </h4>
              <button
                onClick={() => setPreviewProduct(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sticker Preview Rendered Live */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-100 rounded-xl">
              <div className="border-2 border-dashed border-slate-300 p-2 bg-white rounded-lg shadow-sm">
                <canvas
                  ref={(canvas) => {
                    if (canvas && previewProduct) {
                      drawProductLabelToCanvas(canvas, previewProduct, { scale: 8 });
                    }
                  }}
                  className="rounded"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-bold mt-2">
                مقاس حقيقي لطابعات الباركود الحرارية (40mm × 25mm)
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
              <p>• <strong>المنتج:</strong> {previewProduct.nameAr}</p>
              <p>• <strong>السعر:</strong> {previewProduct.price} ج.م</p>
              <p>• <strong>الباركود:</strong> <span className="font-mono font-bold" dir="ltr">{previewProduct.barcode}</span></p>
            </div>

            {/* Print & Download Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  handlePrintLabels([previewProduct]);
                  setPreviewProduct(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة هذا الملصق الآن</span>
              </button>

              <button
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  drawProductLabelToCanvas(canvas, previewProduct, { scale: 12 });
                  canvas.toBlob((blob) => {
                    if (blob) {
                      downloadBlob(blob, `ملصق_40x25mm_${previewProduct.barcode}.png`);
                    }
                  });
                }}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer border border-slate-300"
                title="تحميل صورة الملصق PNG"
              >
                <FileDown className="w-4 h-4" />
                <span>تحميل PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
