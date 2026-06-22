import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, X, Info, LogIn, LogOut } from 'lucide-react';
import { User } from '../auth';

interface HeaderProps {
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  isLoggingIn?: boolean;
  chosenPlatform?: 'shopee' | 'tiktok' | null;
  onBackToLanding?: () => void;
}

export default function Header({ 
  user, 
  onLogin, 
  onLogout, 
  isLoggingIn = false,
  chosenPlatform = null,
  onBackToLanding
}: HeaderProps) {
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  return (
    <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-8 py-4 bg-white border-b border-slate-200 relative">
      <div className="flex items-center space-x-3 mb-3 sm:mb-0">
        <div>
          <span
            onClick={onBackToLanding}
            className="text-xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition block"
            style={{ color: '#1e3a5f' }}
          >
            Digifolium
          </span>
          <p className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase mt-0.5">
            {chosenPlatform === 'shopee' && "Kalkulator ROAS Shopee"}
            {chosenPlatform === 'tiktok' && "Kalkulator ROAS TikTok Shop"}
            {chosenPlatform === null && "Kalkulator ROAS Shopee & TikTok"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center px-3 py-1.5 bg-green-50 rounded-full border border-green-200 shadow-sm">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-green-700 uppercase tracking-tight">
                Google Connected: {user.email}
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer outline-none shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogOut size={12} />
                Logout
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 shadow-sm">
              <div className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-2"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-tight">
                Belum Terkoneksi Google Sheets
              </span>
            </div>
            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-[10px] sm:text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow active:scale-95 cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoggingIn ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
                ) : (
                  <LogIn size={13} className="shrink-0" />
                )}
                <span>{isLoggingIn ? "Menghubungkan..." : "Hubungkan Google 🔌"}</span>
              </button>
            )}
          </div>
        )}

        <div className="relative flex items-center gap-3 text-xs text-slate-500 font-semibold bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-[11px] text-slate-600 font-semibold">Secure Connection</span>
          </div>
          <div className="h-3 w-px bg-slate-200"></div>
          <button 
            type="button"
            className="flex items-center gap-1 hover:text-indigo-600 hover:opacity-85 transition cursor-pointer font-semibold outline-none" 
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
          >
            <HelpCircle size={14} className="text-indigo-500" />
            <span className="text-[11px] text-slate-600">Cara Hitung</span>
          </button>

          {/* Elegant Popover Dialog for Formula Info */}
          {showFormulaInfo && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 text-left space-y-3 animate-fade-in text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <Info size={13} className="text-indigo-600" /> Formulas & Mekanisme ROAS
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowFormulaInfo(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="text-[11px] space-y-2 leading-relaxed">
                <p>
                  Aplikasi ini menghitung <strong>Break-Even ROAS</strong> berdasarkan formula dasar keuangan:
                </p>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-center text-indigo-700 font-bold">
                  BEP ROAS = Harga Jual / Margin Bersih Sebelum Iklan
                </div>
                <p>
                  Di mana <span className="font-semibold text-slate-800">Margin Bersih Sebelum Iklan</span> dihitung dari 
                  harga jual dikurangi HPP produk dan dikurangi total biaya potongan administrasi e-commerce (Shopee).
                </p>
                <div className="h-px bg-slate-100 my-1.5" />
                <p>
                  Sedangkan <span className="font-semibold text-teal-600">Target ROAS</span> merupakan rasio efisiensi iklan minimum yang 
                  harus dipenuhi agar target margin bersih yang Anda rancang dapat tercapai.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
