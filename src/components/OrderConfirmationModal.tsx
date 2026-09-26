import React, { useState } from 'react';
import { CheckCircle2, Phone, MessageSquare, Printer, Hash, Calendar, X, Copy, Check, CreditCard } from 'lucide-react';
import { OrderRecord } from '../types';
import { INSTAPAY_NUMBER, VODAFONE_CASH_NUMBER } from '../services/syncService';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  order: OrderRecord | null;
  onClose: () => void;
  merchantPhone: string;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  order,
  onClose,
  merchantPhone
}) => {
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const cleanPhone = merchantPhone.replace(/[^0-9]/g, '');
  const displayPhone = cleanPhone.startsWith('20') ? '0' + cleanPhone.slice(2) : (cleanPhone || '01029862275');

  const getPaymentLabel = (method?: string) => {
    switch (method) {
      case 'instapay':
        return `إنستاباي (${INSTAPAY_NUMBER})`;
      case 'vodafone_cash':
        return `فودافون كاش (${VODAFONE_CASH_NUMBER})`;
      case 'card_on_delivery':
        return 'بطاقة بنكية عند الاستلام';
      case 'cash':
      default:
        return 'الدفع نقداً عند الاستلام (كاش)';
    }
  };

  const handleCallMerchant = () => {
    const telNum = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    
    // Copy number to clipboard for convenience
    if (navigator.clipboard) {
      navigator.clipboard.writeText(displayPhone).catch(() => {});
    }
    
    setPhoneFeedback(`رقم المحل: ${displayPhone} (تم نسخ الرقم)`);
    setTimeout(() => setPhoneFeedback(null), 4000);

    // Trigger phone call
    try {
      window.location.href = `tel:${telNum}`;
    } catch {
      window.open(`tel:${telNum}`, '_self');
    }
  };

  const printReceipt = () => {
    // 1. Try native print
    try {
      window.print();
    } catch {
      // Ignored if blocked in iframe
    }

    // 2. Open printable receipt in popup / new window
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <title>فاتورة - سوبر ماركت الزهراء - ${order.id}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: rtl; max-width: 500px; margin: 0 auto; color: #1e293b; line-height: 1.5; }
              h2 { color: #0d47a1; margin-bottom: 4px; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
              th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
              th { background: #f8fafc; color: #475569; }
              .total { font-size: 18px; font-weight: bold; color: #0d47a1; margin-top: 14px; display: flex; justify-content: space-between; border-top: 2px solid #0d47a1; padding-top: 8px; }
              .btn { background: #0d47a1; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 16px; font-weight: bold; }
              @media print { .btn { display: none; } }
            </style>
          </head>
          <body>
            <h2>سوبر ماركت الزهراء</h2>
            <p>فاتورة شراء رسمية</p>
            <p><strong>رقم الطلب:</strong> ${order.id} | <strong>الوقت:</strong> ${new Date(order.createdAt).toLocaleString('ar-EG')}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 12px 0;" />
            <p><strong>العميل:</strong> ${order.customer.fullName}</p>
            <p><strong>الهاتف:</strong> ${order.customer.phoneNumber}</p>
            <p><strong>العنوان:</strong> ${order.customer.address}</p>
            <p><strong>طريقة الدفع:</strong> ${getPaymentLabel(order.customer.paymentMethod)}</p>
            
            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(i => `
                  <tr>
                    <td>${i.product.nameAr}</td>
                    <td>${i.quantity}</td>
                    <td>${i.product.price} ج.م</td>
                    <td><strong>${i.product.price * i.quantity} ج.م</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <span>المجموع الإجمالي:</span>
              <span>${order.grandTotal} ج.م</span>
            </div>

            <button class="btn" onclick="window.print()">طباعة الفاتورة الآن</button>
            <script>window.onload = function() { window.print(); };</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch {
      // Ignored
    }

    // 3. In all cases, also copy receipt summary to clipboard
    try {
      const receiptText = `فاتورة سوبر ماركت الزهراء\nرقم الطلب: ${order.id}\nالعميل: ${order.customer.fullName}\nالهاتف: ${order.customer.phoneNumber}\nالعنوان: ${order.customer.address}\n\nالأصناف:\n${order.items.map(i => `• ${i.product.nameAr} × ${i.quantity} = ${i.product.price * i.quantity} ج.م`).join('\n')}\n\nالمجموع الإجمالي: ${order.grandTotal} ج.م`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(receiptText).catch(() => {});
      }
    } catch {}

    setPrintFeedback('تم تجهيز الفاتورة للطباعة ونسخ بياناتها');
    setTimeout(() => setPrintFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#082b64]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-blue-200 my-6 z-10">
        
        {/* Success Header */}
        <div className="bg-[#0d47a1] text-white p-5 text-center relative border-b border-blue-900">
          <button
            onClick={onClose}
            className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق والعودة للتسوق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-2.5 text-yellow-300">
            <CheckCircle2 className="w-8 h-8 text-yellow-300" />
          </div>
          <h2 className="text-lg font-black mb-0.5">تم إرسال طلبك بنجاح!</h2>
          <p className="text-xs text-blue-200">
            وصل طلبك إلى سوبر ماركت الزهراء وجاري تجهيزه للتوصيل السريع
          </p>
        </div>

        {/* Invoice Body */}
        <div className="p-4 sm:p-5 space-y-3 text-xs">
          
          {/* Order Details Header */}
          <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-200 space-y-1.5">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Hash className="w-3.5 h-3.5 text-[#1565c0]" />
                رقم الطلب:
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{order.id}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#1565c0]" />
                وقت الطلب:
              </span>
              <span className="text-slate-700">
                {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="border-t border-blue-200 pt-1.5 text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>العميل:</span>
                <span className="font-bold text-slate-900">{order.customer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>الهاتف:</span>
                <span className="font-bold text-slate-900" dir="ltr">{order.customer.phoneNumber}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="shrink-0 ml-2">العنوان:</span>
                <span className="text-slate-800 text-left font-medium">{order.customer.address}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-blue-200/60">
                <span>طريقة الدفع:</span>
                <span className="font-bold text-[#0d47a1]">{getPaymentLabel(order.customer.paymentMethod)}</span>
              </div>
            </div>
          </div>

          {/* Quick transfer details if InstaPay or Vodafone Cash */}
          {order.customer.paymentMethod === 'instapay' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-[#0d47a1] font-bold block">رقم إنستاباي للتحويل:</span>
                <span className="font-mono font-black text-slate-900 text-xs tracking-wider" dir="ltr">{INSTAPAY_NUMBER}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText(INSTAPAY_NUMBER);
                  setCopiedKey('instapay');
                  setTimeout(() => setCopiedKey(null), 2000);
                }}
                className="px-2.5 py-1 bg-[#0d47a1] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#1565c0] transition-colors"
              >
                {copiedKey === 'instapay' ? <Check className="w-3 h-3 text-yellow-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'instapay' ? 'تم النسخ' : 'نسخ الرقم'}</span>
              </button>
            </div>
          )}

          {order.customer.paymentMethod === 'vodafone_cash' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-red-700 font-bold block">رقم فودافون كاش للتحويل:</span>
                <span className="font-mono font-black text-slate-900 text-xs tracking-wider" dir="ltr">{VODAFONE_CASH_NUMBER}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
                  setCopiedKey('vodafone');
                  setTimeout(() => setCopiedKey(null), 2000);
                }}
                className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-red-700 transition-colors"
              >
                {copiedKey === 'vodafone' ? <Check className="w-3 h-3 text-yellow-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'vodafone' ? 'تم النسخ' : 'نسخ الرقم'}</span>
              </button>
            </div>
          )}

          {/* Official SMS Proof Banner & Preview */}
          {order.customer.transferProofImage && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-black text-emerald-900 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  صورة إيصال رسالة الـ SMS الرسمية المعتمدة:
                </span>
                {order.customer.transferRefNumber && (
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold" dir="ltr">
                    كود: {order.customer.transferRefNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={order.customer.transferProofImage}
                  alt="إيصال رسالة الـ SMS"
                  className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-xs shrink-0"
                />
                <p className="text-[10px] text-emerald-800 leading-snug">
                  ✓ تم تسجيل إثبات رسالة الـ SMS بنجاح (ممنوع السكرين شوت العادي). يرجى إرسال الصورة أيضاً في رسالة واتساب لصاحب المحل لتأكيد التجهيز فوراً.
                </p>
              </div>
            </div>
          )}

          {/* Itemized List */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1.5">قائمة الأصناف:</h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-blue-100 rounded-xl p-2.5 bg-white">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-800">
                    {item.product.nameAr} <span className="text-[#1565c0] font-bold">× {item.quantity}</span>
                  </span>
                  <span className="font-black text-[#0d47a1]">
                    {item.product.price * item.quantity} ج.م
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="font-black text-slate-900 text-sm">المجموع الإجمالي:</span>
              <span className="font-black text-[#0d47a1] text-lg">{order.grandTotal} ج.م</span>
            </div>
          </div>

          {/* Feedback alerts */}
          {phoneFeedback && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-2 text-center font-bold text-xs">
              📞 {phoneFeedback}
            </div>
          )}

          {printFeedback && (
            <div className="bg-blue-50 border border-blue-300 text-[#0d47a1] rounded-xl p-2 text-center font-bold text-xs">
              🖨️ {printFeedback}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md border border-yellow-500 text-xs sm:text-sm"
            >
              <MessageSquare className="w-4 h-4 text-black" />
              <span>متابعة الطلب مع المحل عبر واتساب</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCallMerchant}
                className="py-2.5 px-3 rounded-xl bg-[#1565c0] hover:bg-[#0d47a1] text-white font-bold flex items-center justify-center gap-1.5 transition-colors text-center cursor-pointer text-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال بالمحل</span>
              </button>

              <button
                type="button"
                onClick={printReceipt}
                className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0d47a1] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>

            {/* Return to shopping in El Zahraa Supermarket button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              id="return-to-shopping-btn"
            >
              العودة للتسوق في سوبر ماركت الزهراء
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
