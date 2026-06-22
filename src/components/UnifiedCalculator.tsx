import React, { useState, useEffect } from 'react';
import { ProductInput, AdCampaignInput, ShopeeFeeSettings, TikTokFeeSettings, CalculationResult, SavedCalculation, Platform } from '../types';
import { calculateShopeeMetrics, calculateTikTokMetrics } from '../utils';
import { formatIDR } from '../sheets';
import { ShoppingBag, Video, RotateCcw, TrendingUp, Info, Check, Save, ArrowRight, Sparkles, Percent, FileDown, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  downloadActiveCSV as exportCSV, 
  downloadActiveExcel as exportExcel, 
  downloadActivePDF as exportPDF 
} from '../exportUtils';

interface UnifiedCalculatorProps {
  shopeeFeeSettings: ShopeeFeeSettings;
  tiktokFeeSettings: TikTokFeeSettings;
  onSaveResult: (save: Omit<SavedCalculation, 'id' | 'date'>) => void;
  activePlatform: 'shopee' | 'tiktok';
  onPlatformChange: (platform: 'shopee' | 'tiktok') => void;
}

export default function UnifiedCalculator({ 
  shopeeFeeSettings, 
  tiktokFeeSettings, 
  onSaveResult,
  activePlatform,
  onPlatformChange
}: UnifiedCalculatorProps) {
  // Saved states feedback
  const [saveFeedback, setSaveFeedback] = useState<'shopee' | 'tiktok' | null>(null);

  // Unified product state
  const [product, setProduct] = useState<ProductInput>({
    name: '',
    hpp: 30000,
    hargaJual: 85000,
    targetProfitPct: 20
  });

  // Unified ad action state
  const [ad, setAd] = useState<AdCampaignInput>({
    adSpend: 150000,
    quantitySold: 10,
    actualRoas: 4,
    useActualRoasInput: false
  });

  // Computed results state for both platforms
  const [shopeeResult, setShopeeResult] = useState<CalculationResult | null>(null);
  const [tiktokResult, setTiktokResult] = useState<CalculationResult | null>(null);

  // Re-calculate whenever inputs or fee settings change
  useEffect(() => {
    const shopeeCalc = calculateShopeeMetrics(product, ad, shopeeFeeSettings);
    const tiktokCalc = calculateTikTokMetrics(product, ad, tiktokFeeSettings);
    setShopeeResult(shopeeCalc);
    setTiktokResult(tiktokCalc);
  }, [product, ad, shopeeFeeSettings, tiktokFeeSettings]);

  const handleProductChange = (field: keyof ProductInput, value: string | number) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleAdChange = (field: keyof AdCampaignInput, value: number | string | boolean) => {
    setAd(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveToPlatform = (platform: 'shopee' | 'tiktok') => {
    const activeResult = platform === 'shopee' ? shopeeResult : tiktokResult;
    if (!activeResult) return;

    onSaveResult({
      platform: platform === 'shopee' ? Platform.SHOPEE : Platform.TIKTOK,
      productInput: product,
      adInput: ad,
      result: activeResult
    });

    setSaveFeedback(platform);
    setTimeout(() => {
      setSaveFeedback(null);
    }, 2000);
  };

  const downloadActiveCSV = () => {
    const isShopee = activePlatform === 'shopee';
    const activeResult = isShopee ? shopeeResult : tiktokResult;
    exportCSV(activePlatform, product, ad, activeResult);
  };

  const downloadActiveExcel = () => {
    const isShopee = activePlatform === 'shopee';
    const activeResult = isShopee ? shopeeResult : tiktokResult;
    exportExcel(activePlatform, product, activeResult);
  };

  const resetForm = () => {
    setProduct({
      name: '',
      hpp: 30000,
      hargaJual: 85000,
      targetProfitPct: 20
    });
    setAd({
      adSpend: 150000,
      quantitySold: 10,
      actualRoas: 4,
      useActualRoasInput: false
    });
  };

  const downloadActivePDF = () => {
    const isShopee = activePlatform === 'shopee';
    const activeResult = isShopee ? shopeeResult : tiktokResult;
    exportPDF(activePlatform, product, activeResult, shopeeFeeSettings, tiktokFeeSettings);
  };

  // Computation variables for both platforms simultaneously
  const totalUnitValue = product.hargaJual;
  const hppUnitValue = product.hpp;

  const shopeePlatformFeesUnit = shopeeResult ? shopeeResult.totalFeesRp : 0;
  const shopeeAdSpendUnitValue = shopeeResult 
    ? (shopeeResult.quantitySold > 0 
        ? (shopeeResult.adSpend / shopeeResult.quantitySold) 
        : (shopeeResult.actualRoas > 0 ? (shopeeResult.hargaJual / shopeeResult.actualRoas) : 0))
    : 0;

  const tiktokPlatformFeesUnit = tiktokResult ? tiktokResult.totalFeesRp : 0;
  const tiktokAdSpendUnitValue = tiktokResult 
    ? (tiktokResult.quantitySold > 0 
        ? (tiktokResult.adSpend / tiktokResult.quantitySold) 
        : (tiktokResult.actualRoas > 0 ? (tiktokResult.hargaJual / tiktokResult.actualRoas) : 0))
    : 0;

  const shopeeHppPct = totalUnitValue > 0 ? (hppUnitValue / totalUnitValue) * 100 : 0;
  const shopeePlatformPct = totalUnitValue > 0 ? (shopeePlatformFeesUnit / totalUnitValue) * 100 : 0;
  const shopeeAdPct = totalUnitValue > 0 ? (shopeeAdSpendUnitValue / totalUnitValue) * 100 : 0;
  const shopeeNetProfitUnit = shopeeResult ? Math.round(totalUnitValue - hppUnitValue - shopeePlatformFeesUnit - shopeeAdSpendUnitValue) : 0;
  const shopeeProfitPct = totalUnitValue > 0 ? (shopeeNetProfitUnit / totalUnitValue) * 100 : 0;

  const tiktokHppPct = totalUnitValue > 0 ? (hppUnitValue / totalUnitValue) * 100 : 0;
  const tiktokPlatformPct = totalUnitValue > 0 ? (tiktokPlatformFeesUnit / totalUnitValue) * 100 : 0;
  const tiktokAdPct = totalUnitValue > 0 ? (tiktokAdSpendUnitValue / totalUnitValue) * 100 : 0;
  const tiktokNetProfitUnit = tiktokResult ? Math.round(totalUnitValue - hppUnitValue - tiktokPlatformFeesUnit - tiktokAdSpendUnitValue) : 0;
  const tiktokProfitPct = totalUnitValue > 0 ? (tiktokNetProfitUnit / totalUnitValue) * 100 : 0;

  const shopeeHppWidth = `${Math.max(4, shopeeHppPct)}%`;
  const shopeePlatformWidth = `${Math.max(4, shopeePlatformPct)}%`;
  const shopeeAdWidth = `${Math.max(4, shopeeAdPct)}%`;
  const shopeeProfitWidth = `${Math.max(4, Math.abs(shopeeProfitPct))}%`;

  const tiktokHppWidth = `${Math.max(4, tiktokHppPct)}%`;
  const tiktokPlatformWidth = `${Math.max(4, tiktokPlatformPct)}%`;
  const tiktokAdWidth = `${Math.max(4, tiktokAdPct)}%`;
  const tiktokProfitWidth = `${Math.max(4, Math.abs(tiktokProfitPct))}%`;

  // Active platform calculation mapping
  const isShopee = activePlatform === 'shopee';
  const activeResult = isShopee ? shopeeResult : tiktokResult;

  const platformFeesUnit = isShopee ? shopeePlatformFeesUnit : tiktokPlatformFeesUnit;
  const adSpendUnitValue = isShopee ? shopeeAdSpendUnitValue : tiktokAdSpendUnitValue;
  const hppPct = isShopee ? shopeeHppPct : tiktokHppPct;
  const platformPct = isShopee ? shopeePlatformPct : tiktokPlatformPct;
  const adPct = isShopee ? shopeeAdPct : tiktokAdPct;
  const netProfitUnit = isShopee ? shopeeNetProfitUnit : tiktokNetProfitUnit;
  const profitPct = isShopee ? shopeeProfitPct : tiktokProfitPct;

  const hppWidth = isShopee ? shopeeHppWidth : tiktokHppWidth;
  const platformWidth = isShopee ? shopeePlatformWidth : tiktokPlatformWidth;
  const adWidth = isShopee ? shopeeAdWidth : tiktokAdWidth;
  const profitWidth = isShopee ? shopeeProfitWidth : tiktokProfitWidth;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Inputs Form Section (Left column/s) */}
      <div className="xl:col-span-5 space-y-6">
        {/* Unified Product Details Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShoppingBag size={18} />
            </span>
            <h3 className="font-bold text-slate-850 text-base">Detail Produk & Harga Jual</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="un-prod-name" className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Produk (Opsional / untuk laporan)
              </label>
              <input
                id="un-prod-name"
                type="text"
                placeholder="Contoh: Hijab Premium Velvet, Kaos Oversize"
                value={product.name}
                onChange={(e) => handleProductChange('name', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-250 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="un-hpp" className="block text-xs font-semibold text-slate-600 mb-1">
                  HPP Produk (Harian/Modal Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    id="un-hpp"
                    type="number"
                    min="0"
                    value={product.hpp}
                    onChange={(e) => handleProductChange('hpp', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
 
              <div>
                <label htmlFor="un-harga-jual" className="block text-xs font-semibold text-slate-600 mb-1">
                  Harga Jual Umum (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">Rp</span>
                  <input
                    id="un-harga-jual"
                    type="number"
                    min="0"
                    value={product.hargaJual}
                    onChange={(e) => handleProductChange('hargaJual', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="un-qty-sold" className="block text-xs font-semibold text-slate-600 mb-1">
                Jumlah Produk Terjual (Pcs)
              </label>
              <input
                id="un-qty-sold"
                type="number"
                min="0"
                value={ad.quantitySold}
                onChange={(e) => handleAdChange('quantitySold', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                placeholder="Contoh: 10"
              />
            </div>
          </div>
        </div>
         {/* Unified Ads & Campaign Performance Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={18} />
            </span>
            <h3 className="font-bold text-slate-850 text-base">Biaya Iklan</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="un-ad-spend" className="block text-xs font-semibold text-slate-600 mb-1">
                Biaya Pengeluaran Iklan (Satu Hari/Periode Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">Rp</span>
                <input
                  id="un-ad-spend"
                  type="number"
                  min="0"
                  value={ad.adSpend}
                  onChange={(e) => handleAdChange('adSpend', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-250 rounded-lg text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reset and Save options - Buttons to save to active platform */}
        <div className="space-y-2.5">
          {isShopee ? (
            <button
              onClick={() => handleSaveToPlatform('shopee')}
              disabled={saveFeedback === 'shopee'}
              className={`w-full flex items-center justify-center gap-1.5 py-3 text-xs font-black rounded-xl text-white shadow-md transition-all cursor-pointer ${
                saveFeedback === 'shopee' 
                  ? 'bg-emerald-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {saveFeedback === 'shopee' ? (
                <>
                  <Check size={14} className="animate-bounce" />
                  Disimpan ke Laporan Shopee!
                </>
              ) : (
                <>
                  <Save size={13} />
                  Simpan Laporan ke Shopee
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleSaveToPlatform('tiktok')}
              disabled={saveFeedback === 'tiktok'}
              className={`w-full flex items-center justify-center gap-1.5 py-3 text-xs font-black rounded-xl text-white shadow-md transition-all cursor-pointer ${
                saveFeedback === 'tiktok'
                  ? 'bg-emerald-600'
                  : 'bg-slate-900 hover:bg-slate-950'
              }`}
            >
              {saveFeedback === 'tiktok' ? (
                <>
                  <Check size={14} className="animate-bounce" />
                  Disimpan ke Laporan TikTok!
                </>
              ) : (
                <>
                  <Save size={13} />
                  Simpan Laporan ke TikTok Shop
                </>
              )}
            </button>
          )}

          <button
            onClick={resetForm}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            Kosongkan & Reset Input Form
          </button>
        </div>
      </div>

      {/* Comparative Results Area (Right 7 columns) */}
      <div className="xl:col-span-7 space-y-6">
        {activeResult ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-3.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles size={16} className={`${isShopee ? 'text-orange-500' : 'text-teal-400'} animate-pulse`} />
                Hasil Keuntungan Kampanye ({isShopee ? 'Shopee' : 'TikTok Shop'})
              </span>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${isShopee ? 'bg-orange-100 text-orange-700' : 'bg-slate-900 text-teal-400'}`}>
                {isShopee ? 'SHOPEE' : 'TIKTOK SHOP'}
              </span>
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className={`p-5 rounded-xl flex flex-col justify-between ${isShopee ? 'bg-orange-50/50 border border-orange-100/70' : 'bg-slate-900 border border-slate-800 text-white shadow-md'}`}>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isShopee ? 'bg-orange-500' : 'bg-teal-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isShopee ? 'text-slate-500' : 'text-slate-400'}`}>Laba Bersih Setelah Potongan & Iklan</span>
                  </div>
                  <div className={`text-3xl font-black ${isShopee ? 'text-orange-600' : 'text-teal-400'}`}>
                    {activeResult.isCampaignProfitable ? '+' : ''}{formatIDR(activeResult.netProfitRp)}
                  </div>
                </div>
                <div className={`text-[11px] mt-4 pt-3 border-t font-semibold flex justify-between items-center ${isShopee ? 'border-orange-200/40 text-slate-500' : 'border-slate-800 text-slate-350'}`}>
                  <div>Net Margin: <strong className={activeResult.isCampaignProfitable ? (isShopee ? 'text-emerald-650' : 'text-teal-400') : 'text-rose-600'}>{activeResult.netProfitPct.toFixed(1)}%</strong></div>
                  <div>BEP ROAS: <strong className={isShopee ? 'text-slate-700' : 'text-slate-200'}>{activeResult.breakEvenRoas === 9999 ? '∞' : `${activeResult.breakEvenRoas.toFixed(2)}x`}</strong></div>
                </div>
              </div>
            </div>

            {/* Quick Export Tools for this active calculation */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Unduh Analisa Ini:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadActiveExcel}
                  className="px-2.5 py-1.5 border bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300 text-amber-800 font-extrabold text-[10px] rounded-lg flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                  title="Unduh Excel (.xls)"
                >
                  <FileDown size={12} className="text-amber-650" />
                  Excel (.xls)
                </button>
                <button
                  type="button"
                  onClick={downloadActiveCSV}
                  className="px-2.5 py-1.5 border bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-705 font-extrabold text-[10px] rounded-lg flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                  title="Unduh CSV"
                >
                  <FileDown size={12} className="text-slate-550" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={downloadActivePDF}
                  className="px-2.5 py-1.5 border bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-750 font-extrabold text-[10px] rounded-lg flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                  title="Unduh PDF"
                >
                  <Printer size={12} className="text-rose-650" />
                  Download PDF 📄
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeResult ? (
          <div className="space-y-6">
            {/* Scorecard Metrics section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Break-Even ROAS Card */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-150">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">BEP ROAS (Titik Impas)</span>
                <div className="bg-slate-50 px-2.5 py-2.5 rounded-xl border border-slate-200/40 text-center font-black text-slate-900">
                  {activeResult.breakEvenRoas === 9999 ? "∞" : `${activeResult.breakEvenRoas.toFixed(2)}x`}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-medium">Laba bersih 0% (kembali modal)</p>
              </div>

              {/* ROAS Iklan Card */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-150">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">ROAS Iklan</span>
                <div className={`bg-slate-50 px-2.5 py-2.5 rounded-xl border border-slate-200/40 text-center font-black ${activeResult.actualRoas >= activeResult.breakEvenRoas ? 'text-emerald-650' : 'text-rose-650'}`}>
                  {activeResult.actualRoas.toFixed(2)}x
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-medium">Rasio omset terhadap biaya iklan</p>
              </div>

              {/* Net Profit per Item */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-150">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Profit Bersih / Unit</span>
                <div className={`bg-slate-50 px-2.5 py-2.5 rounded-xl border border-slate-200/40 text-center font-black ${netProfitUnit >= 0 ? "text-emerald-650" : "text-rose-600"}`}>
                  {netProfitUnit < 0 ? '-' : ''}{formatIDR(Math.abs(netProfitUnit))}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-medium">Sisa margin setelah ongkos & iklan</p>
              </div>
            </div>

            {/* Breakdown progress structure bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-150 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Proporsi Alokasi Harga {isShopee ? 'Shopee' : 'TikTok Shop'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pembagian nilai dari Harga Jual per 1 unit produk terjual</p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                  H. Jual: {formatIDR(product.hargaJual)}
                </span>
              </div>

              <div className="space-y-4">
                {/* Unified active Platform Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-650">
                    <span>{isShopee ? 'Shopee' : 'TikTok Shop'}</span>
                    <span>100% Harga Jual</span>
                  </div>
                  <div className="h-5 w-full flex rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                    <div className="h-full bg-indigo-500 transition-all flex items-center justify-center text-[9px] text-white font-bold" style={{ width: hppWidth }} title={`HPP: ${hppPct.toFixed(1)}%`}>
                      {hppPct > 12 && 'HPP'}
                    </div>
                    <div className="h-full bg-slate-400 transition-all flex items-center justify-center text-[9px] text-slate-705 font-bold" style={{ width: platformWidth }} title={`Platform: ${platformPct.toFixed(1)}%`}>
                      {platformPct > 12 && 'Admin'}
                    </div>
                    <div className="h-full bg-amber-400 transition-all flex items-center justify-center text-[9px] text-slate-805 font-bold" style={{ width: adWidth }} title={`Iklan: ${adPct.toFixed(1)}%`}>
                      {adPct > 12 && 'Iklan'}
                    </div>
                    <div className={`h-full transition-all flex items-center justify-center text-[9px] text-white font-bold ${netProfitUnit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: profitWidth }} title={`Profit: ${profitPct.toFixed(1)}%`}>
                      {Math.abs(profitPct) > 12 && 'Laba'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded mr-2" />
                      <span className="text-slate-500 font-semibold font-medium">HPP (Modal Produk)</span>
                    </div>
                    <span className="font-extrabold text-slate-700">{formatIDR(hppUnitValue)} ({hppPct.toFixed(1)}%)</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex flex-col text-left">
                      <span className="text-slate-500 font-semibold font-medium">Biaya Layanan Admin</span>
                    </div>
                    <span className="font-extrabold text-slate-700">
                      {formatIDR(platformFeesUnit)} ({platformPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex flex-col text-left">
                      <span className="text-slate-500 font-semibold font-medium">Biaya Iklan per Unit</span>
                    </div>
                    <span className="font-extrabold text-slate-700">
                      {formatIDR(adSpendUnitValue)} ({adPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-650">Laba Bersih per Unit</span>
                    </div>
                    <span className={`font-black ${netProfitUnit >= 0 ? "text-emerald-650" : "text-rose-600"}`}>
                      {formatIDR(netProfitUnit)} ({profitPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Specific Rincian */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm">
              <h4 className={`font-bold text-xs mb-3.5 flex items-center justify-between p-2.5 rounded-xl ${isShopee ? 'bg-orange-50 text-orange-850' : 'bg-slate-900 text-white'}`}>
                <span>Rincian Potongan Admin & Program {isShopee ? 'Shopee' : 'TikTok Shop'}</span>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${isShopee ? 'bg-orange-100 text-orange-700' : 'bg-slate-800 text-teal-400'}`}>
                  {isShopee ? 'SHOPEE' : 'TIKTOK SHOP'}
                </span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[11px] text-slate-650">
                {isShopee ? (
                  <>
                    {shopeeFeeSettings.adminFeeEnabled !== false && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Biaya Admin ({shopeeFeeSettings.adminFeePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.adminFeePct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.gratisOngkirEnabled !== false && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Gratis Ongkir Extra ({shopeeFeeSettings.gratisOngkirPct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.gratisOngkirPct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.cashbackEnabled !== false && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Promo XTRA ({shopeeFeeSettings.cashbackPct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.cashbackPct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.campaignFeeEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Campaign Shopee ({shopeeFeeSettings.campaignFeePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.campaignFeePct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.voucherTokoEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Voucher Toko ({shopeeFeeSettings.voucherTokoPct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.voucherTokoPct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.flashSaleEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Flashsale Toko ({shopeeFeeSettings.flashSalePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.flashSalePct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.affiliateEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Komisi Affiliate ({shopeeFeeSettings.affiliatePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.affiliatePct / 100))}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.otherFeeEnabled !== false && shopeeFeeSettings.otherFeePct > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">PPN ({shopeeFeeSettings.otherFeePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (shopeeFeeSettings.otherFeePct / 100))}</span>
                      </div>
                    )}

                    {shopeeFeeSettings.prosesPesananEnabled !== false && (shopeeFeeSettings.prosesPesananFee ?? 1250) > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Biaya Proses Pesanan</span>
                        <span className="font-bold text-slate-800">{formatIDR(shopeeFeeSettings.prosesPesananFee ?? 1250)}</span>
                      </div>
                    )}
                    {shopeeFeeSettings.otherFeeRpEnabled && shopeeFeeSettings.otherFeeRp > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium font-semibold text-orange-600">Biaya Lainnya (Rp)</span>
                        <span className="font-bold text-slate-800">{formatIDR(shopeeFeeSettings.otherFeeRp)}</span>
                      </div>
                    )}
                    <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 flex justify-between font-black text-orange-600 text-xs">
                      <span>Total Biaya Admin Platform</span>
                      <span>{formatIDR(shopeeResult.totalFeesRp)} ({shopeeResult.totalAdminFeePct.toFixed(1)}%)</span>
                    </div>
                  </>
                ) : (
                  <>
                    {tiktokFeeSettings.adminFeeEnabled !== false && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Biaya Admin ({tiktokFeeSettings.adminFeePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.adminFeePct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.gratisOngkirEnabled !== false && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Gratis Ongkir Extra ({tiktokFeeSettings.gratisOngkirPct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.gratisOngkirPct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.cashbackEnabled !== false && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Promo XTRA ({tiktokFeeSettings.cashbackPct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.cashbackPct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.campaignFeeEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Biaya Campaign TikTok ({tiktokFeeSettings.campaignFeePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.campaignFeePct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.voucherTokoEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Voucher Toko ({tiktokFeeSettings.voucherTokoPct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.voucherTokoPct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.flashSaleEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Flashsale Toko ({tiktokFeeSettings.flashSalePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.flashSalePct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.affiliateEnabled && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">Komisi Affiliate ({tiktokFeeSettings.affiliatePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.affiliatePct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.otherFeeEnabled !== false && tiktokFeeSettings.otherFeePct > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">PPN ({tiktokFeeSettings.otherFeePct}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (tiktokFeeSettings.otherFeePct / 100))}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.customFees && tiktokFeeSettings.customFees.map(fee => fee.enabled && fee.type === 'pct' && (
                      <div key={fee.id} className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">{fee.name} ({fee.value}%)</span>
                        <span className="font-bold text-slate-800">{formatIDR(product.hargaJual * (fee.value / 100))}</span>
                      </div>
                    ))}

                    {tiktokFeeSettings.prosesPesananEnabled !== false && (tiktokFeeSettings.prosesPesananFee ?? 1250) > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium font-semibold text-indigo-650">Biaya Proses Pesanan</span>
                        <span className="font-bold text-slate-800">{formatIDR(tiktokFeeSettings.prosesPesananFee ?? 1250)}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.otherFeeRpEnabled && tiktokFeeSettings.otherFeeRp > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium font-semibold text-indigo-650">Biaya Lainnya (Rp)</span>
                        <span className="font-bold text-slate-800">{formatIDR(tiktokFeeSettings.otherFeeRp)}</span>
                      </div>
                    )}
                    {tiktokFeeSettings.customFees && tiktokFeeSettings.customFees.map(fee => fee.enabled && fee.type === 'rp' && (
                      <div key={fee.id} className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-550 font-medium">{fee.name} (Flat)</span>
                        <span className="font-bold text-slate-800">{formatIDR(fee.value)}</span>
                      </div>
                    ))}
                    <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 flex justify-between font-black text-rose-600 text-xs">
                      <span>Total Biaya Admin Platform</span>
                      <span>{formatIDR(tiktokResult.totalFeesRp)} ({tiktokResult.totalAdminFeePct.toFixed(1)}%)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Campaign Metrics Details Card */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm">
              <h4 className="font-bold text-slate-850 text-xs mb-3.5">Estimasi Keuangan Realisasi Kampanye Iklan</h4>

              <div className="grid grid-cols-1 gap-4">
                <div className={`p-4 rounded-xl border ${isShopee ? 'border-orange-100 bg-orange-50/10' : 'border-slate-200 bg-slate-50/10'} space-y-3`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${isShopee ? 'text-orange-700' : 'text-slate-800'}`}>Estimasi Hasil Kampanye ({isShopee ? 'Shopee' : 'TikTok Shop'})</span>
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${activeResult.isCampaignProfitable ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-rose-100 text-rose-800'}`}>
                      {activeResult.isCampaignProfitable ? 'KAMPANYE UNTUNG ✅' : 'KAMPANYE RUGI ⚠️'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-650 bg-white/80 p-3 rounded-xl border border-slate-100">
                    <div>Omset Kotor: <strong className="text-slate-850 block mt-0.5">{formatIDR(activeResult.revenue)}</strong></div>
                    <div>Biaya Iklan: <strong className="text-slate-850 block mt-0.5">{formatIDR(activeResult.adSpend)}</strong></div>
                    <div>Terjual (Qty): <strong className="text-slate-850 block mt-0.5">{activeResult.quantitySold} Pcs</strong></div>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-semibold text-slate-500">Estimasi Bersih Setelah Potongan, HPP, & Iklan:</span>
                    <strong className={`text-lg font-black ${activeResult.isCampaignProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {activeResult.netProfitRp < 0 ? '-' : ''}{formatIDR(Math.abs(activeResult.netProfitRp))} ({activeResult.netProfitPct.toFixed(1)}%)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tips comparison footer */}
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100/50 flex gap-2 items-start text-[11px] text-amber-800">
                <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-amber-900">Margin Bersih Sebelum Iklan di {isShopee ? 'Shopee' : 'TikTok Shop'}</div>
                  <p className="mt-0.5">
                    Platform {isShopee ? 'Shopee' : 'TikTok Shop'} menyisakan profit sebelum pengeluaran iklan sebesar <strong>{formatIDR(activeResult.marginBeforeAdsRp)} ({activeResult.marginBeforeAdsPct.toFixed(1)}%)</strong> per unit produk. Gunakan data batas margin ini sebagai acuan maksimal bidding atau target biaya akuisisi per order (CPA) Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Printable container for single calculator simulation */}
      <div id="print-simulator-report" className="">
        <style dangerouslySetInnerHTML={{ __html: `
          #print-simulator-report {
            display: none !important;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body.print-mode-simulator * {
              visibility: hidden !important;
            }
            body.print-mode-simulator #print-simulator-report, 
            body.print-mode-simulator #print-simulator-report * {
              visibility: visible !important;
            }
            body.print-mode-simulator #print-simulator-report {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 30px !important;
              font-family: Arial, sans-serif !important;
            }
            .border-print {
              border: 1px solid #CBD5E1 !important;
            }
            .bg-print {
              background-color: #F8FAFC !important;
            }
          }
        `}} />
        
        <div className="font-sans text-black bg-white p-6 max-w-3xl mx-auto border-2 border-slate-200 rounded-2xl">
          <div className="flex border-b-2 border-slate-800 pb-4 justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-850 tracking-tight uppercase">SIMULASI TARGET ROAS & PROFIT PENJUALAN</h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Kanal Penjualan: <span className="font-extrabold text-slate-800 uppercase">{isShopee ? 'Shopee' : 'TikTok Shop'}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block">Waktu Cetak</span>
              <span className="text-[10px] text-slate-500 block">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="my-6 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">1. Data Produk & Komparasi Awal</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Nama Produk</span>
                <span className="text-sm font-bold text-slate-850">{product.name || 'Produk Tanpa Nama'}</span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Harga Jual per Unit</span>
                <span className="text-sm font-bold text-slate-850">{formatIDR(product.hargaJual)}</span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">HPP per Unit</span>
                <span className="text-sm font-bold text-slate-850">{formatIDR(product.hpp)}</span>
              </div>
            </div>
          </div>

          <div className="my-6 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">2. Rincian Potongan Biaya Admin</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold">
                  <th className="py-2">Jenis Potongan / Biaya</th>
                  <th className="py-2 text-right">Nilai Potongan</th>
                </tr>
              </thead>
              <tbody>
                {isShopee ? (
                  <>
                    {shopeeFeeSettings.adminFeeEnabled !== false && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Biaya Admin ({shopeeFeeSettings.adminFeePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.adminFeePct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.gratisOngkirEnabled !== false && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Gratis Ongkir Extra ({shopeeFeeSettings.gratisOngkirPct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.gratisOngkirPct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.cashbackEnabled !== false && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Promo XTRA ({shopeeFeeSettings.cashbackPct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.cashbackPct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.campaignFeeEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Campaign Shopee ({shopeeFeeSettings.campaignFeePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.campaignFeePct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.voucherTokoEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Voucher Toko ({shopeeFeeSettings.voucherTokoPct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.voucherTokoPct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.flashSaleEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Flashsale Toko ({shopeeFeeSettings.flashSalePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.flashSalePct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.affiliateEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Komisi Affiliate ({shopeeFeeSettings.affiliatePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.affiliatePct / 100))}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.otherFeeEnabled !== false && shopeeFeeSettings.otherFeePct > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">PPN ({shopeeFeeSettings.otherFeePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (shopeeFeeSettings.otherFeePct / 100))}</td>
                      </tr>
                    )}

                    {shopeeFeeSettings.customFees && shopeeFeeSettings.customFees.map(fee => fee.enabled && (
                      <tr key={fee.id} className="border-b border-slate-100">
                        <td className="py-2">{fee.name} {fee.type === 'pct' ? `(${fee.value}%)` : '(Flat)'}</td>
                        <td className="py-2 text-right font-semibold">
                          {fee.type === 'pct' ? formatIDR(product.hargaJual * (fee.value / 100)) : formatIDR(fee.value)}
                        </td>
                      </tr>
                    ))}

                    {shopeeFeeSettings.prosesPesananEnabled !== false && (shopeeFeeSettings.prosesPesananFee ?? 1250) > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Biaya Proses Pesanan</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(shopeeFeeSettings.prosesPesananFee ?? 1250)}</td>
                      </tr>
                    )}
                    {shopeeFeeSettings.otherFeeRpEnabled && shopeeFeeSettings.otherFeeRp > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Biaya Lainnya (Rp)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(shopeeFeeSettings.otherFeeRp)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-200 font-bold bg-slate-50">
                      <td className="py-2.5 px-1">Total Potongan Admin + Biaya Tetap</td>
                      <td className="py-2.5 px-1 text-right text-orange-600">{formatIDR(activeResult ? activeResult.totalFeesRp : 0)} ({activeResult ? activeResult.totalAdminFeePct.toFixed(1) : 0}%)</td>
                    </tr>
                  </>
                ) : (
                  <>
                    {tiktokFeeSettings.adminFeeEnabled !== false && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Biaya Admin ({tiktokFeeSettings.adminFeePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.adminFeePct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.gratisOngkirEnabled !== false && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Gratis Ongkir Extra ({tiktokFeeSettings.gratisOngkirPct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.gratisOngkirPct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.cashbackEnabled !== false && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Promo XTRA ({tiktokFeeSettings.cashbackPct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.cashbackPct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.campaignFeeEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Biaya Campaign TikTok ({tiktokFeeSettings.campaignFeePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.campaignFeePct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.voucherTokoEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Voucher Toko ({tiktokFeeSettings.voucherTokoPct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.voucherTokoPct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.flashSaleEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Flashsale Toko ({tiktokFeeSettings.flashSalePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.flashSalePct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.affiliateEnabled && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">Komisi Affiliate ({tiktokFeeSettings.affiliatePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.affiliatePct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.otherFeeEnabled !== false && tiktokFeeSettings.otherFeePct > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2">PPN ({tiktokFeeSettings.otherFeePct}%)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(product.hargaJual * (tiktokFeeSettings.otherFeePct / 100))}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.customFees && tiktokFeeSettings.customFees.map(fee => fee.enabled && fee.type === 'pct' && (
                      <tr key={fee.id} className="border-b border-slate-100">
                        <td className="py-2">{fee.name} ({fee.value}%)</td>
                        <td className="py-2 text-right font-semibold">
                          {formatIDR(product.hargaJual * (fee.value / 100))}
                        </td>
                      </tr>
                    ))}

                    {tiktokFeeSettings.prosesPesananEnabled !== false && (tiktokFeeSettings.prosesPesananFee ?? 1250) > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2 text-indigo-650 font-semibold">Biaya Proses Pesanan</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(tiktokFeeSettings.prosesPesananFee ?? 1250)}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.otherFeeRpEnabled && tiktokFeeSettings.otherFeeRp > 0 && (
                      <tr className="border-b border-slate-100">
                        <td className="py-2 text-indigo-650 font-semibold">Biaya Lainnya (Rp)</td>
                        <td className="py-2 text-right font-semibold">{formatIDR(tiktokFeeSettings.otherFeeRp)}</td>
                      </tr>
                    )}
                    {tiktokFeeSettings.customFees && tiktokFeeSettings.customFees.map(fee => fee.enabled && fee.type === 'rp' && (
                      <tr key={fee.id} className="border-b border-slate-100">
                        <td className="py-2">{fee.name} (Flat)</td>
                        <td className="py-2 text-right font-semibold">
                          {formatIDR(fee.value)}
                        </td>
                      </tr>
                    ))}

                    <tr className="border-b border-slate-200 font-bold bg-slate-50">
                      <td className="py-2.5 px-1">Total Potongan Admin + Biaya Tetap</td>
                      <td className="py-2.5 px-1 text-right text-rose-600">{formatIDR(activeResult ? activeResult.totalFeesRp : 0)} ({activeResult ? activeResult.totalAdminFeePct.toFixed(1) : 0}%)</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="my-6 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">3. Hasil Analisis & Laba Bersih Kampanye</h3>
            {activeResult && (
              <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/50 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800">Evaluasi Margin Bersih</span>
                  <span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${activeResult.isCampaignProfitable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {activeResult.isCampaignProfitable ? 'KAMPANYE UNTUNG' : 'KAMPANYE RUGI'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center py-2 bg-white rounded-lg border">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Omset Kotor</span>
                    <span className="font-bold">{formatIDR(activeResult.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Biaya Iklan</span>
                    <span className="font-bold text-rose-600">{formatIDR(activeResult.adSpend)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ROAS BEP</span>
                    <span className="font-bold">{activeResult.breakEvenRoas.toFixed(2)}x</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ROAS Iklan</span>
                    <span className={`font-bold ${activeResult.actualRoas >= activeResult.breakEvenRoas ? "text-emerald-650" : "text-rose-650"}`}>{activeResult.actualRoas.toFixed(2)}x</span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold text-sm pt-2">
                  <span>ESTIMASI KEUNTUNGAN BERSIH:</span>
                  <span className={activeResult.isCampaignProfitable ? 'text-emerald-700' : 'text-rose-700'}>
                    {activeResult.netProfitRp < 0 ? '-' : ''}{formatIDR(Math.abs(activeResult.netProfitRp))} ({activeResult.netProfitPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-300 mt-12 pt-4 flex justify-between items-center text-[10px] text-slate-450">
            <span>* Laporan hasil hitungan ini dianalisa sesuai regulasi persentase biaya admin platform per tanggal tercantum.</span>
            <span className="italic">Kalkulator ROAS Toko Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
