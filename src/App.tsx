import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UnifiedCalculator from './components/UnifiedCalculator';
import SummaryDashboard from './components/SummaryDashboard';
import PercentageSettingsModal from './components/PercentageSettingsModal';
import { SavedCalculation, FeeSettings, Platform } from './types';
import { initAuth, logout, googleSignIn, User } from './auth';
import { 
  ShoppingBag, Video, Settings, FileSpreadsheet, Info, 
  ChevronRight, Calculator, CheckCircle, Percent, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  isSupabaseConnected, 
  saveToSupabase, 
  deleteFromSupabase, 
  clearSupabaseCalculations 
} from './supabase';


const DEFAULT_FEE_SETTINGS: FeeSettings = {
  shopee: {
    adminFeePct: 6.0,
    gratisOngkirPct: 4.0,
    cashbackPct: 1.4, // representing Promo XTRA
    fixedFee: 0,
    prosesPesananFee: 1250, // Biaya Proses Pesanan Rp 1.250
    campaignFeePct: 1.0, 
    voucherTokoPct: 2.0,
    voucherFollowPct: 1.5,
    flashSalePct: 2.0,
    affiliatePct: 5.0,
    otherFeePct: 0.0,
    otherFeeRp: 0,
    
    // Default enabled/disabled states
    adminFeeEnabled: true,
    gratisOngkirEnabled: true,
    cashbackEnabled: true, // Promo XTRA
    fixedFeeEnabled: false,
    prosesPesananEnabled: true, // Biaya Proses Pesanan enabled
    campaignFeeEnabled: false,
    voucherTokoEnabled: false,
    voucherFollowEnabled: false,
    flashSaleEnabled: false,
    affiliateEnabled: false,
    otherFeeEnabled: false,
    otherFeeRpEnabled: false,
    customFees: [],
  },
  tiktok: {
    adminFeePct: 4.5,
    gratisOngkirPct: 3.0,
    cashbackPct: 1.4, // representing Promo XTRA
    fixedFee: 0,
    prosesPesananFee: 1250, // default Rp 1.250
    campaignFeePct: 1.0,
    voucherTokoPct: 2.0,
    voucherFollowPct: 1.0,
    flashSalePct: 2.0,
    affiliatePct: 5.0,
    otherFeePct: 0.0,
    otherFeeRp: 0,
    
    // Default enabled/disabled states
    adminFeeEnabled: true,
    gratisOngkirEnabled: true,
    cashbackEnabled: false, // Promo XTRA
    fixedFeeEnabled: false,
    prosesPesananEnabled: true, // Biaya Proses Pesanan enabled
    campaignFeeEnabled: false,
    voucherTokoEnabled: false,
    voucherFollowEnabled: false,
    flashSaleEnabled: false,
    affiliateEnabled: false,
    otherFeeEnabled: false,
    otherFeeRpEnabled: false,
    customFees: [],
  }
};

export default function App() {
  const [chosenPlatform, setChosenPlatform] = useState<'shopee' | 'tiktok' | null>(null);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSettings>(DEFAULT_FEE_SETTINGS);
  const [activePlatform, setActivePlatform] = useState<'shopee' | 'tiktok'>('shopee');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedCalcs = localStorage.getItem('roas_saved_calcs');
      if (storedCalcs) {
        setCalculations(JSON.parse(storedCalcs));
      }

      const storedSettings = localStorage.getItem('roas_fee_settings');
      if (storedSettings) {
        setFeeSettings(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.error("Gagal memuat data lokal dari browser:", e);
    }

    // Initialize Firebase auto listeners
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save changes to localStorage helper
  const saveCalculations = (newCalcs: SavedCalculation[]) => {
    setCalculations(newCalcs);
    localStorage.setItem('roas_saved_calcs', JSON.stringify(newCalcs));
  };

  const handleUpdateSettings = (newSettings: FeeSettings) => {
    setFeeSettings(newSettings);
    localStorage.setItem('roas_fee_settings', JSON.stringify(newSettings));
  };

  const handleSaveResult = async (newCalc: Omit<SavedCalculation, 'id' | 'date'>) => {
    const freshRecord: SavedCalculation = {
      ...newCalc,
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    const updated = [freshRecord, ...calculations];
    saveCalculations(updated);

    // Sync to Supabase in background if connected
    if (isSupabaseConnected()) {
      try {
        await saveToSupabase(freshRecord, user?.email || undefined);
      } catch (err) {
        console.error('Failed to sync new calculation to Supabase in real-time:', err);
      }
    }
  };

  const handleDeleteCalculation = async (id: string) => {
    const updated = calculations.filter(c => c.id !== id);
    saveCalculations(updated);

    // Sync deletion to Supabase
    if (isSupabaseConnected()) {
      try {
        await deleteFromSupabase(id);
      } catch (err) {
        console.error('Failed to delete calculation from Supabase in real-time:', err);
      }
    }
  };

  const handleClearAllCalculations = async () => {
    const confirmClear = window.confirm ? window.confirm('Apakah Anda yakin ingin menghapus/mengosongkan seluruh riwayat kalkulasi?') : true;
    if (!confirmClear) return;

    saveCalculations([]);

    // Sync truncation to Supabase
    if (isSupabaseConnected()) {
      try {
        await clearSupabaseCalculations(user?.email || undefined);
      } catch (err) {
        console.error('Failed to clear calculations from Supabase in real-time:', err);
      }
    }
  };

  const handleImportCalculations = (imported: SavedCalculation[]) => {
    const existingIds = new Set(calculations.map(c => c.id));
    const merged = [...calculations];
    
    imported.forEach(item => {
      if (!existingIds.has(item.id)) {
        merged.push(item);
      }
    });

    saveCalculations(merged);
  };


  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error("Gagal login:", err);
      if (window.alert) {
        window.alert(`Gagal terhubung ke Google: ${err.message || err}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAuthSuccess = (currentUser: User, token: string) => {
    setUser(currentUser);
    setNeedsAuth(false);
  };

  const getShopeeAccumulatedPct = () => {
    let sum = 0;
    if (feeSettings.shopee.adminFeeEnabled !== false) sum += feeSettings.shopee.adminFeePct || 0;
    if (feeSettings.shopee.gratisOngkirEnabled !== false) sum += feeSettings.shopee.gratisOngkirPct || 0;
    if (feeSettings.shopee.cashbackEnabled !== false) sum += feeSettings.shopee.cashbackPct || 0;
    if (feeSettings.shopee.campaignFeeEnabled === true) sum += feeSettings.shopee.campaignFeePct || 0;
    if (feeSettings.shopee.voucherTokoEnabled === true) sum += feeSettings.shopee.voucherTokoPct || 0;
    if (feeSettings.shopee.voucherFollowEnabled === true) sum += feeSettings.shopee.voucherFollowPct || 0;
    if (feeSettings.shopee.flashSaleEnabled === true) sum += feeSettings.shopee.flashSalePct || 0;
    if (feeSettings.shopee.affiliateEnabled === true) sum += feeSettings.shopee.affiliatePct || 0;
    if (feeSettings.shopee.otherFeeEnabled !== false) sum += feeSettings.shopee.otherFeePct || 0;
    
    if (feeSettings.shopee.customFees) {
      feeSettings.shopee.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'pct') {
          sum += fee.value || 0;
        }
      });
    }
    return parseFloat(sum.toFixed(2));
  };

  const getShopeeAccumulatedFixed = () => {
    let sum = 0;
    if (feeSettings.shopee.prosesPesananEnabled !== false) sum += feeSettings.shopee.prosesPesananFee !== undefined ? feeSettings.shopee.prosesPesananFee : 1250;
    if (feeSettings.shopee.otherFeeRpEnabled === true) sum += feeSettings.shopee.otherFeeRp || 0;
    
    if (feeSettings.shopee.customFees) {
      feeSettings.shopee.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'rp') {
          sum += fee.value || 0;
        }
      });
    }
    return sum;
  };

  const getTikTokAccumulatedPct = () => {
    let sum = 0;
    if (feeSettings.tiktok.adminFeeEnabled !== false) sum += feeSettings.tiktok.adminFeePct || 0;
    if (feeSettings.tiktok.gratisOngkirEnabled !== false) sum += feeSettings.tiktok.gratisOngkirPct || 0;
    if (feeSettings.tiktok.cashbackEnabled !== false) sum += feeSettings.tiktok.cashbackPct || 0;
    if (feeSettings.tiktok.campaignFeeEnabled === true) sum += feeSettings.tiktok.campaignFeePct || 0;
    if (feeSettings.tiktok.voucherTokoEnabled === true) sum += feeSettings.tiktok.voucherTokoPct || 0;
    if (feeSettings.tiktok.voucherFollowEnabled === true) sum += feeSettings.tiktok.voucherFollowPct || 0;
    if (feeSettings.tiktok.flashSaleEnabled === true) sum += feeSettings.tiktok.flashSalePct || 0;
    if (feeSettings.tiktok.affiliateEnabled === true) sum += feeSettings.tiktok.affiliatePct || 0;
    if (feeSettings.tiktok.otherFeeEnabled !== false) sum += feeSettings.tiktok.otherFeePct || 0;
    
    if (feeSettings.tiktok.customFees) {
      feeSettings.tiktok.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'pct') {
          sum += fee.value || 0;
        }
      });
    }
    return parseFloat(sum.toFixed(2));
  };

  const getTikTokAccumulatedFixed = () => {
    let sum = 0;
    if (feeSettings.tiktok.prosesPesananEnabled !== false) sum += feeSettings.tiktok.prosesPesananFee !== undefined ? feeSettings.tiktok.prosesPesananFee : 1250;
    if (feeSettings.tiktok.otherFeeRpEnabled === true) sum += feeSettings.tiktok.otherFeeRp || 0;
    
    if (feeSettings.tiktok.customFees) {
      feeSettings.tiktok.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'rp') {
          sum += fee.value || 0;
        }
      });
    }
    return sum;
  };

  // Filter calculations based on modern workspace chosen
  const filteredCalculations = calculations.filter(c => {
    if (!chosenPlatform) return true;
    return c.platform === (chosenPlatform === 'shopee' ? Platform.SHOPEE : Platform.TIKTOK);
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        isLoggingIn={isLoggingIn} 
        chosenPlatform={chosenPlatform}
        onBackToLanding={() => setChosenPlatform(null)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {chosenPlatform === null ? (
            <motion.div
              key="landing-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-4xl mx-auto py-8 sm:py-12 space-y-10"
            >
              <div className="text-center space-y-3">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                  Pilih Platform Penjualan Anda
                </h2>
                <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-medium">
                  Atur biaya admin secara akurat dan hitung target ROAS iklan Anda secara terpisah untuk setiap marketplace.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {/* Shopee Card */}
                <button
                  type="button"
                  onClick={() => {
                    setChosenPlatform('shopee');
                    setActivePlatform('shopee');
                  }}
                  className="group text-left bg-white rounded-3xl border border-slate-200/85 p-8 shadow-sm hover:shadow-xl hover:border-orange-350 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-96 relative overflow-hidden cursor-pointer outline-none"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-orange-500/10 transition-all duration-300" />
                  
                  <div className="space-y-6">
                    <div className="inline-flex p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-all duration-300">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-slate-800">Kalkulator Shopee</h3>
                        <span className="text-[10px] font-black tracking-widest uppercase bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
                          Shopee Fee
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Hitung komisi admin utama, gratis ongkir ekstra, cashback ekstra, biaya tetap, voucher toko, dan rate affiliate Shopee.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                        <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>Biaya Admin Terkini ({getShopeeAccumulatedPct()}%)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                        <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>Pembatasan Target & Break-even ROAS</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-orange-600 font-black text-sm">
                    <span>Masuk ke Kalkulator Shopee</span>
                    <ChevronRight className="w-4.5 h-4.5 transform group-hover:translate-x-1.5 transition-transform text-orange-555 text-orange-500" />
                  </div>
                </button>

                {/* TikTok Shop Card */}
                <button
                  type="button"
                  onClick={() => {
                    setChosenPlatform('tiktok');
                    setActivePlatform('tiktok');
                  }}
                  className="group text-left bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-md hover:shadow-2xl hover:border-slate-800 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-96 relative overflow-hidden text-white cursor-pointer outline-none"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-teal-400/10 transition-all duration-300" />
                  
                  <div className="space-y-6">
                    <div className="inline-flex p-4 bg-slate-800 text-teal-400 rounded-2xl group-hover:scale-110 transition-all duration-300">
                      <Video className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold">Kalkulator TikTok Shop</h3>
                        <span className="text-[10px] font-black tracking-widest uppercase bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full">
                          TikTok Fee
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Analisis margin komisi penjualan TikTok, biaya transaksi, program gratis ongkir, komisi affiliate toko/kreator, dan biaya flat.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold">
                        <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>Biaya Admin Terkini ({getTikTokAccumulatedPct()}%)</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold">
                        <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>Estimasi Laba Bersih & Campaign ROAS</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-teal-400 font-black text-sm">
                    <span>Masuk ke Kalkulator TikTok Shop</span>
                    <ChevronRight className="w-4.5 h-4.5 transform group-hover:translate-x-1.5 transition-transform text-teal-400" />
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="platform-workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Navigation Back and Platform Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <button
                  type="button"
                  onClick={() => setChosenPlatform(null)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-black text-xs rounded-xl transition cursor-pointer self-start border border-slate-250 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ArrowLeft size={14} className="text-slate-500 shrink-0" />
                  Ganti / Pilih Platform Lain
                </button>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Platform Terpilih:</span>
                  <span className={`font-black uppercase px-2.5 py-1 rounded-full text-[10px] tracking-wider border ${
                    chosenPlatform === 'shopee' 
                      ? 'bg-orange-50 text-orange-700 border-orange-200/60' 
                      : 'bg-slate-900 text-teal-400 border-slate-800'
                  }`}>
                    {chosenPlatform === 'shopee' ? 'Shopee Active' : 'TikTok Shop Active'}
                  </span>
                </div>
              </div>

              {/* Info Banner / Guide */}
              <div className={`border p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                chosenPlatform === 'shopee'
                  ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100 text-slate-800'
                  : 'bg-gradient-to-r from-slate-900 to-slate-950 border-slate-800 text-white'
              }`}>
                <div className="flex gap-3 items-start">
                  <span className={`p-2 rounded-xl shrink-0 mt-0.5 sm:mt-0 font-bold text-sm ${
                    chosenPlatform === 'shopee' ? 'bg-orange-500/10 text-orange-700' : 'bg-teal-500/20 text-teal-300'
                  }`}>
                    💡
                  </span>
                  <div>
                    <h4 className={`font-bold text-sm ${chosenPlatform === 'shopee' ? 'text-orange-700' : 'text-teal-400'}`}>
                      Panduan Kalkulator ROAS {chosenPlatform === 'shopee' ? 'Shopee' : 'TikTok Shop'}
                    </h4>
                    <p className={`text-xs mt-1 ${chosenPlatform === 'shopee' ? 'text-slate-500 font-medium' : 'text-slate-350'}`}>
                      {chosenPlatform === 'shopee'
                        ? "Masukkan modal HPP, target profit, dan harga penjualan Anda harian/kampanye di Shopee. Program hitung otomatis akan menyesuaikan potongan admin utama, gratis ongkir, cashback ekstra, dan komisi affiliate Shopee secara akurat."
                        : "Masukkan modal HPP, target profit, dan harga penjualan Anda harian/kampanye di TikTok Shop. Program hitung otomatis akan menyesuaikan komisi admin, program gratis ongkir, komisi affiliate kreator, dan pajak PPN secara presisi."
                      }
                    </p>
                  </div>
                </div>
                {activeTab !== 'history' && filteredCalculations.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition whitespace-nowrap self-end sm:self-auto flex items-center gap-1 cursor-pointer ${
                      chosenPlatform === 'shopee'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-teal-500 hover:bg-teal-650 text-slate-950 font-black'
                    }`}
                  >
                    Lihat Riwayat ({filteredCalculations.length})
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>

              {/* Interactive Active Fee Configuration Overview Banner */}
              <div className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all ${
                chosenPlatform === 'shopee' ? 'border-orange-200/70 hover:border-orange-350' : 'border-slate-300 hover:border-teal-400'
              }`}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                    chosenPlatform === 'shopee' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-800'
                  }`}>
                    <Percent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    {/* Active Selected platform details */}
                    {chosenPlatform === 'shopee' ? (
                      <div className="flex-1 sm:flex-initial text-left px-5 py-3 rounded-xl border border-orange-200 bg-orange-50 flex items-center gap-3.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Platform Aktif</div>
                          <div className="text-sm font-black text-orange-650">
                            Shopee ({getShopeeAccumulatedPct()}% {getShopeeAccumulatedFixed() > 0 ? `+ Rp${getShopeeAccumulatedFixed().toLocaleString()}` : ''})
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 sm:flex-initial text-left px-5 py-3 rounded-xl border border-teal-250 bg-teal-500/5 flex items-center gap-3.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Platform Aktif</div>
                          <div className="text-sm font-black text-teal-850">
                            TikTok Shop ({getTikTokAccumulatedPct()}% {getTikTokAccumulatedFixed() > 0 ? `+ Rp${getTikTokAccumulatedFixed().toLocaleString()}` : ''})
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className={`w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:shadow hover:scale-[1.01] active:scale-[0.99] shrink-0 ${
                    chosenPlatform === 'shopee'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-950 text-teal-400 border border-slate-800'
                  }`}
                >
                  <Settings size={14} className="animate-spin-slow" />
                  Atur Biaya {chosenPlatform === 'shopee' ? 'Shopee' : 'TikTok'} (Pop-up)
                </button>
              </div>

              {/* Tab Navigation Menu */}
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'calculator'
                      ? (chosenPlatform === 'shopee' ? 'bg-orange-500 text-white shadow-md font-bold' : 'bg-slate-900 text-teal-400 shadow-md font-bold')
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-850'
                  }`}
                >
                  <Calculator size={18} className={activeTab === 'calculator' ? 'text-white' : 'text-slate-400'} />
                  Kalkulator ROAS {chosenPlatform === 'shopee' ? 'Shopee' : 'TikTok Shop'}
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all relative cursor-pointer ${
                    activeTab === 'history'
                      ? (chosenPlatform === 'shopee' ? 'bg-orange-500 text-white shadow-md font-bold' : 'bg-slate-900 text-teal-400 shadow-md font-bold')
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-850'
                  }`}
                >
                  <FileSpreadsheet size={18} className={activeTab === 'history' ? 'text-white' : 'text-slate-400'} />
                  Riwayat & Ekspor ({filteredCalculations.length})
                </button>
              </div>

              {/* Tab Workspaces */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'calculator' && (
                    <motion.div
                      key="calculator-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <UnifiedCalculator 
                        shopeeFeeSettings={feeSettings.shopee} 
                        tiktokFeeSettings={feeSettings.tiktok}
                        onSaveResult={handleSaveResult}
                        activePlatform={activePlatform}
                        onPlatformChange={setActivePlatform}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div
                      key="history-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SummaryDashboard 
                        calculations={filteredCalculations}
                        onDelete={handleDeleteCalculation}
                        onClearAll={handleClearAllCalculations}
                        feeSettings={feeSettings}
                        user={user}
                        needsAuth={needsAuth}
                        onAuthSuccess={handleAuthSuccess}
                        onLogout={handleLogout}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <PercentageSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={feeSettings}
        onUpdateSettings={handleUpdateSettings}
        defaultPlatform={chosenPlatform || 'shopee'}
      />

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-center text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>© 2026 Kalkulator ROAS Shopee & TikTok Shop terintegrasi Google API.</p>
          <p className="text-[11px] text-slate-600">
            Seluruh data persentase admin dapat diatur secara manual melalui tombol Pengaturan Biaya di atas untuk akurasi laporan keuangan.
          </p>
        </div>
      </footer>
    </div>
  );
}
