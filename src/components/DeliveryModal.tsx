import React, { useState } from 'react';
import { X, Send, MapPin, User, Phone, CheckCircle2, MessageSquare, ShoppingCart, Copy, Check, Upload, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CartItem, CustomerOrderInfo, OrderRecord } from '../types';
import { saveNewOrder, INSTAPAY_NUMBER, VODAFONE_CASH_NUMBER } from '../services/syncService';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  merchantPhone: string;
  onOrderSuccess: (order: OrderRecord) => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  merchantPhone,
  onOrderSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay' | 'vodafone_cash'>('cash');
  const [smsProofImage, setSmsProofImage] = useState<string | null>(null);
  const [smsRefNumber, setSmsRefNumber] = useState('');
  const [isConfirmedSmsOnly, setIsConfirmedSmsOnly] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = 0;
  const grandTotal = subtotal;

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSmsProofImage(result);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.smsProof;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'يرجى كتابة الاسم';
    if (!phoneNumber.trim()) {
      errs.phoneNumber = 'يرجى كتابة رقم الهاتف';
    } else if (phoneNumber.trim().length < 8) {
      errs.phoneNumber = 'يرجى كتابة رقم هاتف صحيح';
    }
    if (!address.trim()) errs.address = 'يرجى كتابة العنوان بالتفصيل';

    // Strict validation for Vodafone Cash and InstaPay
    if (paymentMethod === 'vodafone_cash' || paymentMethod === 'instapay') {
      if (!smsProofImage) {
        errs.smsProof = paymentMethod === 'vodafone_cash'
          ? '❌ خطأ: لازم جداً إرفاق صورة إيصال التحويل من رسالة الـ SMS الرسمية لفودافون كاش (غير مسموح بالسكرين شوت العادي)!'
          : '❌ خطأ: لازم جداً إرفاق صورة إيصال التحويل من رسالة الـ SMS الرسمية أو الإشعار البنكي لإنستاباي (غير مسموح بالسكرين شوت العادي)!';
      }
      if (!isConfirmedSmsOnly) {
        errs.isConfirmedSmsOnly = '❌ خطأ: يجب تأكيد أن الصورة من رسالة SMS الرسمية للتحويل وليست سكرين شوت عادي من التطبيق.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const generateWhatsAppMessage = () => {
    const paymentLabels = {
      cash: 'الدفع نقداً عند الاستلام (كاش)',
      instapay: `تحويل إنستاباي (InstaPay) على الرقم: ${INSTAPAY_NUMBER}`,
      vodafone_cash: `تحويل فودافون كاش على الرقم: ${VODAFONE_CASH_NUMBER}`
    };

    let msg = `🛒 *طلب جديد من سوبر ماركت الزهراء*\n\n`;
    msg += `👤 *بيانات العميل:*\n`;
    msg += `• الاسم: ${fullName.trim()}\n`;
    msg += `• رقم الهاتف: ${phoneNumber.trim()}\n`;
    msg += `• العنوان: ${address.trim()}\n`;
    if (landmark.trim()) msg += `• علامة مميزة: ${landmark.trim()}\n`;
    if (notes.trim()) msg += `• ملاحظات: ${notes.trim()}\n`;
    msg += `• طريقة الدفع: ${paymentLabels[paymentMethod]}\n`;

    if (paymentMethod === 'vodafone_cash' || paymentMethod === 'instapay') {
      msg += `• إثبات التحويل: ✅ مرفق صورة إيصال رسالة الـ SMS الرسمية للتحويل (ممنوع السكرين شوت العادي)\n`;
      if (smsRefNumber.trim()) {
        msg += `• رقم/كود العملية من الرسالة: ${smsRefNumber.trim()}\n`;
      }
      msg += `• تنبيه: سأرسل صورة رسالة الـ SMS الرسمية الآن في هذه المحادثة لمطابقتها فورا.\n`;
    }
    msg += `\n`;

    msg += `📋 *قائمة المشتريات:*\n`;
    cartItems.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.product.nameAr} × ${item.quantity} = ${item.product.price * item.quantity} ج.م\n`;
    });

    msg += `\n💰 *الحساب الإجمالي:*\n`;
    msg += `• مجموع الأصناف: ${subtotal} ج.م\n`;
    msg += `• *المجموع الإجمالي المطلوب: ${grandTotal} ج.م*\n\n`;
    msg += `⏰ تم إرسال الطلب عبر نظام سوبر ماركت الزهراء الإلكتروني. يرجى تأكيد استلام الطلب والبدء في التجهيز.`;

    return encodeURIComponent(msg);
  };

  const handleSendViaWhatsApp = () => {
    if (!validate()) return;

    const customerInfo: CustomerOrderInfo = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
      notes: notes.trim(),
      paymentMethod,
      transferProofImage: smsProofImage || undefined,
      transferRefNumber: smsRefNumber.trim() || undefined,
      isSmsReceiptConfirmed: isConfirmedSmsOnly
    };

    const newOrder: OrderRecord = {
      id: `ZHR-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: cartItems,
      subtotal,
      deliveryFee,
      grandTotal,
      customer: customerInfo,
      status: 'pending'
    };

    saveNewOrder(newOrder);

    const rawPhone = merchantPhone.replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('01') ? `2${rawPhone}` : (rawPhone || '201029862275');
    const encoded = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
    onOrderSuccess(newOrder);
  };

  const handleConfirmDirect = () => {
    if (!validate()) return;

    const customerInfo: CustomerOrderInfo = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
      notes: notes.trim(),
      paymentMethod,
      transferProofImage: smsProofImage || undefined,
      transferRefNumber: smsRefNumber.trim() || undefined,
      isSmsReceiptConfirmed: isConfirmedSmsOnly
    };

    const newOrder: OrderRecord = {
      id: `ZHR-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: cartItems,
      subtotal,
      deliveryFee,
      grandTotal,
      customer: customerInfo,
      status: 'pending'
    };

    saveNewOrder(newOrder);
    onOrderSuccess(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#082b64]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-200 my-6">
        
        {/* Modal Header */}
        <div className="bg-[#0d47a1] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-yellow-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">طلب خدمة التوصيل للمنازل</h3>
              <p className="text-xs text-blue-200">سوبر ماركت الزهراء</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Cost Strip */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#0d47a1]" />
            <span className="text-xs text-slate-700 font-medium">
              عدد الأصناف: <strong>{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 ml-1">الإجمالي:</span>
            <span className="text-xl font-black text-[#0d47a1]">{grandTotal}</span>
            <span className="text-xs font-bold text-slate-700 mr-1">ج.م</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4 sm:p-6 space-y-3.5">
          <p className="text-xs text-slate-600">
            أدخل الاسم والعنوان بالتفصيل لإرسال طلبك لصاحب المحل لتجهيزه وتوصيله فوراً:
          </p>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#1565c0]" />
              <span>الاسم بالكامل: <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              placeholder="مثال: محمد علي أحمد"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1565c0] ${
                errors.fullName ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-[#f0f7ff]'
              }`}
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#1565c0]" />
              <span>رقم التليفون / واتساب: <span className="text-red-500">*</span></span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
              }}
              placeholder="مثال: 01012345678"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1565c0] ${
                errors.phoneNumber ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-[#f0f7ff]'
              }`}
            />
            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1565c0]" />
              <span>العنوان بالتفصيل: <span className="text-red-500">*</span></span>
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              placeholder="اسم الشارع، رقم العمارة، الدور، رقم الشقة..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1565c0] ${
                errors.address ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-[#f0f7ff]'
              }`}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          {/* Landmark & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                علامة مميزة (اختياري):
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="بجوار مسجد... أو صيدلية..."
                className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-[#f0f7ff] text-xs focus:outline-none focus:ring-2 focus:ring-[#1565c0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ملاحظات إضافية للمحل:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: رن الجرس..."
                className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-[#f0f7ff] text-xs focus:outline-none focus:ring-2 focus:ring-[#1565c0]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              طريقة الدفع:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Cash option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center flex sm:flex-col items-center justify-between sm:justify-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'border-[#0d47a1] bg-[#0d47a1] text-white ring-2 ring-blue-300'
                    : 'border-blue-200 bg-blue-50/40 text-[#0d47a1] hover:bg-blue-100'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:justify-center">
                  <span>💵</span>
                  <span>نقداً (كاش)</span>
                </div>
                <div className={`text-[10px] font-normal ${paymentMethod === 'cash' ? 'text-blue-100' : 'text-slate-500'}`}>
                  عند الاستلام
                </div>
              </button>

              {/* InstaPay option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('instapay')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center flex sm:flex-col items-center justify-between sm:justify-center gap-1 ${
                  paymentMethod === 'instapay'
                    ? 'border-[#0d47a1] bg-[#0d47a1] text-white ring-2 ring-blue-300'
                    : 'border-blue-200 bg-blue-50/40 text-[#0d47a1] hover:bg-blue-100'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:justify-center">
                  <span>📱</span>
                  <span>إنستاباي</span>
                </div>
                <div className={`text-[11px] font-mono font-black ${paymentMethod === 'instapay' ? 'text-yellow-300' : 'text-slate-700'}`} dir="ltr">
                  {INSTAPAY_NUMBER}
                </div>
              </button>

              {/* Vodafone Cash option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('vodafone_cash')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center flex sm:flex-col items-center justify-between sm:justify-center gap-1 ${
                  paymentMethod === 'vodafone_cash'
                    ? 'border-[#0d47a1] bg-[#0d47a1] text-white ring-2 ring-blue-300'
                    : 'border-blue-200 bg-blue-50/40 text-[#0d47a1] hover:bg-blue-100'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:justify-center">
                  <span>🔴</span>
                  <span>فودافون كاش</span>
                </div>
                <div className={`text-[11px] font-mono font-black ${paymentMethod === 'vodafone_cash' ? 'text-yellow-300' : 'text-slate-700'}`} dir="ltr">
                  {VODAFONE_CASH_NUMBER}
                </div>
              </button>
            </div>

            {/* InstaPay Details Box */}
            {paymentMethod === 'instapay' && (
              <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border-2 border-[#1565c0]/40 text-xs flex items-center justify-between animate-in fade-in">
                <div>
                  <span className="font-bold text-[#0d47a1] block">رقم التحويل عبر إنستاباي (InstaPay):</span>
                  <span className="font-mono font-black text-slate-900 text-sm tracking-wider" dir="ltr">{INSTAPAY_NUMBER}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(INSTAPAY_NUMBER, 'instapay')}
                  className="px-3 py-1.5 bg-[#0d47a1] hover:bg-[#1565c0] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copiedKey === 'instapay' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-yellow-300" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Vodafone Cash Details Box */}
            {paymentMethod === 'vodafone_cash' && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-50 border-2 border-red-300 text-xs flex items-center justify-between animate-in fade-in">
                <div>
                  <span className="font-bold text-red-700 block">رقم محفظة فودافون كاش للتحويل:</span>
                  <span className="font-mono font-black text-slate-900 text-sm tracking-wider" dir="ltr">{VODAFONE_CASH_NUMBER}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(VODAFONE_CASH_NUMBER, 'vodafone')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copiedKey === 'vodafone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-yellow-300" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Strict SMS Official Receipt Requirement Section */}
            {(paymentMethod === 'vodafone_cash' || paymentMethod === 'instapay') && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-amber-200 text-amber-900 shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4 text-amber-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-amber-950 text-xs sm:text-sm">
                        إثبات التحويل الرسمي (مطلوب إلزامي)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                        ممنوع السكرين شوت العادي 🚫
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed mt-1">
                      ⚠️ <strong>شرط قبول الطلب:</strong> بعد تحويل المبلغ، يجب إرفاق صورة واضحة من <strong>رسالة الـ SMS الرسمية</strong> المستلمة على هاتفك (أو إشعار التحويل البنكي الرسمي برقم العملية). <strong>لن يتم قبول أي سكرين شوت عادي من التطبيق وسيعتبر لاغياً.</strong>
                    </p>
                  </div>
                </div>

                {/* Upload Box */}
                <div>
                  {!smsProofImage ? (
                    <label
                      htmlFor="sms-receipt-upload"
                      className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        errors.smsProof ? 'border-red-500 bg-red-50/80 ring-2 ring-red-200' : 'border-amber-400 bg-white hover:bg-amber-100/60'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-amber-600 mb-1" />
                      <span className="font-bold text-amber-950 text-xs text-center">
                        اضغط هنا لرفع صورة إيصال رسالة الـ SMS الرسمية
                      </span>
                      <span className="text-[10px] text-amber-700 mt-0.5">
                        (تصوير بالكاميرا أو اختيار صورة من الهاتف)
                      </span>
                      <input
                        id="sms-receipt-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="bg-white border-2 border-emerald-400 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={smsProofImage}
                          alt="إيصال رسالة الـ SMS"
                          className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <span className="text-emerald-800 font-black text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            تم إرفاق صورة رسالة الـ SMS بنجاح
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            صورة الإيصال معتمدة وجاهزة للتأكيد
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSmsProofImage(null)}
                        className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold border border-red-200 transition-colors shrink-0 cursor-pointer"
                      >
                        حذف / تغيير
                      </button>
                    </div>
                  )}

                  {errors.smsProof && (
                    <div className="mt-1.5 p-2 rounded-lg bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold flex items-center gap-1.5 animate-shake">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{errors.smsProof}</span>
                    </div>
                  )}
                </div>

                {/* SMS Reference / Transaction Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    كود أو رقم العملية بالرسالة (اختياري لتسريع التنفيذ):
                  </label>
                  <input
                    type="text"
                    value={smsRefNumber}
                    onChange={(e) => setSmsRefNumber(e.target.value)}
                    placeholder="مثال: رقم العملية 847291... أو كود التحويل"
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                {/* Mandatory Acknowledgment Checkbox */}
                <label className="flex items-start gap-2 cursor-pointer pt-0.5 select-none">
                  <input
                    type="checkbox"
                    checked={isConfirmedSmsOnly}
                    onChange={(e) => {
                      setIsConfirmedSmsOnly(e.target.checked);
                      if (e.target.checked && errors.isConfirmedSmsOnly) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.isConfirmedSmsOnly;
                          return next;
                        });
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-amber-400 text-[#0d47a1] focus:ring-amber-400 cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-950 font-bold leading-tight">
                    أؤكد أن الصورة المرفقة هي من <strong>رسالة الـ SMS الرسمية للتحويل</strong> أو الإشعار البنكي المعتمد برقم العملية وليست سكرين شوت عادي.
                  </span>
                </label>
                {errors.isConfirmedSmsOnly && (
                  <div className="p-2 rounded-lg bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{errors.isConfirmedSmsOnly}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleSendViaWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-yellow-500"
              id="submit-order-whatsapp-btn"
            >
              <MessageSquare className="w-5 h-5 text-black" />
              <span>إرسال الطلب لصاحب المحل عبر واتساب</span>
            </button>

            <button
              onClick={handleConfirmDirect}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1565c0] hover:bg-[#0d47a1] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-yellow-300" />
              <span>تأكيد وحفظ الطلب مباشرة</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            🔒 يتم توجيه الطلب إلى إدارة سوبر ماركت الزهراء (01029862275) للتنفيذ الفوري.
          </p>
        </div>

      </div>
    </div>
  );
};
