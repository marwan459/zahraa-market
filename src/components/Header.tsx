import React from 'react';
import { RefreshCw, Phone, Search, Store, Lock } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cartItems?: CartItem[];
  onOpenCart?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  lastSyncTime: string;
  autoSync: boolean;
  onToggleAutoSync: () => void;
  onOpenSettings: () => void;
  merchantPhone: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSyncNow,
  isSyncing,
  lastSyncTime,
  autoSync,
  onToggleAutoSync,
  onOpenSettings,
  merchantPhone
}) => {

  return (
    <header className="sticky top-0 z-40 bg-[#0d47a1] text-white shadow-md w-full">
      {/* Top Sync & Quick Status Bar */}
      <div className="bg-[#082b64] text-blue-100 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-300"></span>
            </span>
            <span className="font-semibold text-sky-200 truncate max-w-[200px] sm:max-w-none">
              مزامنة مباشرة • سوبر ماركت الزهراء
            </span>
            <span className="hidden sm:inline text-blue-300/40">|</span>
            <span className="hidden md:inline text-blue-200">آخر تحديث: {lastSyncTime || 'الآن'}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-[#1565c0] hover:bg-[#0d47a1] text-white transition-all border border-blue-400/40 disabled:opacity-50 cursor-pointer font-bold"
              title="تحديث الأسعار والمخزون لحظياً"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري...' : 'تحديث'}</span>
            </button>

            <button
              onClick={onToggleAutoSync}
              className={`text-[11px] px-1.5 py-0.5 rounded-sm transition-colors cursor-pointer ${
                autoSync ? 'text-amber-300 font-bold' : 'text-blue-300 hover:text-white'
              }`}
            >
              {autoSync ? '● آلي' : '○ يدوي'}
            </button>

            <button
              onClick={onOpenSettings}
              className="text-[11px] bg-blue-900/80 hover:bg-blue-800 text-yellow-300 hover:text-yellow-200 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-blue-400/30 font-bold shadow-xs"
              title="لوحة تحكم صاحب المحل (محمية برمز مرور)"
            >
              <Lock className="w-3 h-3 text-yellow-300" />
              <span>لوحة الإدارة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo - سوبر ماركت الزهراء */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white truncate leading-tight">
                  سوبر ماركت الزهراء
                </h1>
                <span className="inline-block text-[10px] sm:text-[11px] font-mono font-black tracking-widest text-yellow-300 bg-yellow-400/15 border border-yellow-300/40 px-2 py-0.5 rounded-md uppercase shadow-xs">
                  EL ZAHRAA
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-blue-100/80 truncate">
                أسعار فورية • توصيل سريع للمنزل
              </p>
            </div>
          </div>

          {/* Search Bar Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث في منتجات سوبر ماركت الزهراء..."
                className="w-full pl-8 pr-10 py-2 rounded-xl border border-blue-300/60 bg-[#f0f7ff] text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-[#0d47a1] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                >
                  مسح
                </button>
              )}
            </div>
          </div>

          {/* Hotline Call Button (Vodafone Cash / Direct Phone Order) */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:01029862275"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all shadow-xs"
              title="طلب تليفوني مباشر: 01029862275"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 shrink-0" />
              <div className="text-right">
                <span className="block text-[8px] sm:text-[9px] text-blue-200 leading-tight">طلب تليفوني</span>
                <span className="font-bold text-white text-[11px] sm:text-xs tracking-tight" dir="ltr">01029862275</span>
              </div>
            </a>
          </div>
        </div>

        {/* Mobile Search Bar: responsive for 360px */}
        <div className="mt-2 md:hidden relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث في منتجات سوبر ماركت الزهراء..."
            className="w-full pl-8 pr-9 py-2 rounded-xl border border-blue-200 bg-[#f0f7ff] text-slate-900 placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
          />
          <Search className="w-4 h-4 text-[#0d47a1] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 hover:text-slate-800 font-bold"
            >
              مسح
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
