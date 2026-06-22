import React, { useState, useEffect } from 'react';
import { FeeSettings, ShopeeFeeSettings, TikTokFeeSettings } from '../types';
import { 
  X, Settings, Percent, DollarSign, RefreshCw, Check, CheckCircle, ShoppingBag, Video, Save, PercentSquare, Plus, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PercentageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FeeSettings;
  onUpdateSettings: (newSettings: FeeSettings) => void;
  defaultPlatform?: 'shopee' | 'tiktok';
}

export default function PercentageSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  defaultPlatform
}: PercentageSettingsModalProps) {
  const [activePlatform, setActivePlatform] = useState<'shopee' | 'tiktok'>('shopee');
  const [shopeeState, setShopeeState] = useState<any>({ ...settings.shopee });
  const [tiktokState, setTiktokState] = useState<any>({ ...settings.tiktok });
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync state with settings when modal is opened or updated
  useEffect(() => {
    if (isOpen) {
      setShopeeState({ ...settings.shopee });
      setTiktokState({ ...settings.tiktok });
      setShowSuccess(false);
      if (defaultPlatform) {
        setActivePlatform(defaultPlatform);
      }
    }
  }, [isOpen, settings, defaultPlatform]);

  if (!isOpen) return null;

  const handleShopeeChange = (field: string, value: any) => {
    setShopeeState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTikTokChange = (field: string, value: any) => {
    setTiktokState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addShopeeCustomFee = () => {
    const newFee = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Biaya Tambahan ${((shopeeState.customFees || []).length + 1)}`,
      value: 0,
      type: 'pct' as const,
      enabled: true
    };
    setShopeeState(prev => ({
      ...prev,
      customFees: [...(prev.customFees || []), newFee]
    }));
  };

  const updateShopeeCustomFee = (id: string, updates: Partial<typeof shopeeState['customFees'][0]>) => {
    setShopeeState(prev => ({
      ...prev,
      customFees: (prev.customFees || []).map(fee => fee.id === id ? { ...fee, ...updates } : fee)
    }));
  };

  const removeShopeeCustomFee = (id: string) => {
    setShopeeState(prev => ({
      ...prev,
      customFees: (prev.customFees || []).filter(fee => fee.id !== id)
    }));
  };

  const addTikTokCustomFee = () => {
    const newFee = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Biaya Tambahan ${((tiktokState.customFees || []).length + 1)}`,
      value: 0,
      type: 'pct' as const,
      enabled: true
    };
    setTiktokState(prev => ({
      ...prev,
      customFees: [...(prev.customFees || []), newFee]
    }));
  };

  const updateTikTokCustomFee = (id: string, updates: Partial<typeof tiktokState['customFees'][0]>) => {
    setTiktokState(prev => ({
      ...prev,
      customFees: (prev.customFees || []).map(fee => fee.id === id ? { ...fee, ...updates } : fee)
    }));
  };

  const removeTikTokCustomFee = (id: string) => {
    setTiktokState(prev => ({
      ...prev,
      customFees: (prev.customFees || []).filter(fee => fee.id !== id)
    }));
  };

  const resetShopeeDefaults = () => {
    setShopeeState({
      adminFeePct: 6.0,
      gratisOngkirPct: 4.0,
      cashbackPct: 1.4,
      fixedFee: 0,
      prosesPesananFee: 1250,
      campaignFeePct: 1.0,
      voucherTokoPct: 2.0,
      voucherFollowPct: 1.5,
      flashSalePct: 2.0,
      affiliatePct: 5.0,
      otherFeePct: 0.0,
      otherFeeRp: 0,
      adminFeeEnabled: true,
      gratisOngkirEnabled: true,
      cashbackEnabled: true,
      fixedFeeEnabled: false,
      prosesPesananEnabled: true,
      campaignFeeEnabled: false,
      voucherTokoEnabled: false,
      voucherFollowEnabled: false,
      flashSaleEnabled: false,
      affiliateEnabled: false,
      otherFeeEnabled: false,
      otherFeeRpEnabled: false,
    });
  };

  const resetTikTokDefaults = () => {
    setTiktokState({
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
    });
  };

  const handleSave = () => {
    const cleanShopee = {
      ...shopeeState,
      adminFeePct: shopeeState.adminFeePct === '' ? 0 : Number(shopeeState.adminFeePct) || 0,
      gratisOngkirPct: shopeeState.gratisOngkirPct === '' ? 0 : Number(shopeeState.gratisOngkirPct) || 0,
      cashbackPct: shopeeState.cashbackPct === '' ? 0 : Number(shopeeState.cashbackPct) || 0,
      fixedFee: shopeeState.fixedFee === '' ? 0 : Number(shopeeState.fixedFee) || 0,
      prosesPesananFee: shopeeState.prosesPesananFee === '' ? 1250 : Number(shopeeState.prosesPesananFee) || 0,
      campaignFeePct: shopeeState.campaignFeePct === '' ? 0 : Number(shopeeState.campaignFeePct) || 0,
      voucherTokoPct: shopeeState.voucherTokoPct === '' ? 0 : Number(shopeeState.voucherTokoPct) || 0,
      voucherFollowPct: shopeeState.voucherFollowPct === '' ? 0 : Number(shopeeState.voucherFollowPct) || 0,
      flashSalePct: shopeeState.flashSalePct === '' ? 0 : Number(shopeeState.flashSalePct) || 0,
      affiliatePct: shopeeState.affiliatePct === '' ? 0 : Number(shopeeState.affiliatePct) || 0,
      otherFeePct: shopeeState.otherFeePct === '' ? 0 : Number(shopeeState.otherFeePct) || 0,
      otherFeeRp: shopeeState.otherFeeRp === '' ? 0 : Number(shopeeState.otherFeeRp) || 0,
      customFees: shopeeState.customFees?.map((f: any) => ({
        ...f,
        value: f.value === '' ? 0 : Number(f.value) || 0
      }))
    };

    const cleanTiktok = {
      ...tiktokState,
      adminFeePct: tiktokState.adminFeePct === '' ? 0 : Number(tiktokState.adminFeePct) || 0,
      gratisOngkirPct: tiktokState.gratisOngkirPct === '' ? 0 : Number(tiktokState.gratisOngkirPct) || 0,
      cashbackPct: tiktokState.cashbackPct === '' ? 0 : Number(tiktokState.cashbackPct) || 0,
      fixedFee: tiktokState.fixedFee === '' ? 0 : Number(tiktokState.fixedFee) || 0,
      prosesPesananFee: tiktokState.prosesPesananFee === '' ? 1250 : Number(tiktokState.prosesPesananFee) || 0,
      campaignFeePct: tiktokState.campaignFeePct === '' ? 0 : Number(tiktokState.campaignFeePct) || 0,
      voucherTokoPct: tiktokState.voucherTokoPct === '' ? 0 : Number(tiktokState.voucherTokoPct) || 0,
      voucherFollowPct: tiktokState.voucherFollowPct === '' ? 0 : Number(tiktokState.voucherFollowPct) || 0,
      flashSalePct: tiktokState.flashSalePct === '' ? 0 : Number(tiktokState.flashSalePct) || 0,
      affiliatePct: tiktokState.affiliatePct === '' ? 0 : Number(tiktokState.affiliatePct) || 0,
      otherFeePct: tiktokState.otherFeePct === '' ? 0 : Number(tiktokState.otherFeePct) || 0,
      otherFeeRp: tiktokState.otherFeeRp === '' ? 0 : Number(tiktokState.otherFeeRp) || 0,
      customFees: tiktokState.customFees?.map((f: any) => ({
        ...f,
        value: f.value === '' ? 0 : Number(f.value) || 0
      }))
    };

    onUpdateSettings({
      shopee: cleanShopee,
      tiktok: cleanTiktok
    });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1000);
  };

  // Calculate quick sum of active percentages
  const getShopeeTotalPct = () => {
    let sum = 0;
    if (shopeeState.adminFeeEnabled !== false) sum += Number(shopeeState.adminFeePct) || 0;
    if (shopeeState.gratisOngkirEnabled !== false) sum += Number(shopeeState.gratisOngkirPct) || 0;
    if (shopeeState.cashbackEnabled !== false) sum += Number(shopeeState.cashbackPct) || 0;
    if (shopeeState.campaignFeeEnabled === true) sum += Number(shopeeState.campaignFeePct) || 0;
    if (shopeeState.voucherTokoEnabled === true) sum += Number(shopeeState.voucherTokoPct) || 0;
    if (shopeeState.voucherFollowEnabled === true) sum += Number(shopeeState.voucherFollowPct) || 0;
    if (shopeeState.flashSaleEnabled === true) sum += Number(shopeeState.flashSalePct) || 0;
    if (shopeeState.affiliateEnabled === true) sum += Number(shopeeState.affiliatePct) || 0;
    if (shopeeState.otherFeeEnabled !== false) sum += Number(shopeeState.otherFeePct) || 0;
    
    if (shopeeState.customFees) {
      shopeeState.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'pct') {
          sum += Number(fee.value) || 0;
        }
      });
    }
    return parseFloat(sum.toFixed(2));
  };

  const getShopeeTotalFixed = () => {
    let sum = 0;
    if (shopeeState.prosesPesananEnabled !== false) sum += shopeeState.prosesPesananFee !== undefined ? (Number(shopeeState.prosesPesananFee) || 0) : 1250;
    if (shopeeState.otherFeeRpEnabled === true) sum += Number(shopeeState.otherFeeRp) || 0;
    
    if (shopeeState.customFees) {
      shopeeState.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'rp') {
          sum += Number(fee.value) || 0;
        }
      });
    }
    return sum;
  };

  const getTikTokTotalPct = () => {
    let sum = 0;
    if (tiktokState.adminFeeEnabled !== false) sum += Number(tiktokState.adminFeePct) || 0;
    if (tiktokState.gratisOngkirEnabled !== false) sum += Number(tiktokState.gratisOngkirPct) || 0;
    if (tiktokState.cashbackEnabled !== false) sum += Number(tiktokState.cashbackPct) || 0;
    if (tiktokState.campaignFeeEnabled === true) sum += Number(tiktokState.campaignFeePct) || 0;
    if (tiktokState.voucherTokoEnabled === true) sum += Number(tiktokState.voucherTokoPct) || 0;
    if (tiktokState.voucherFollowEnabled === true) sum += Number(tiktokState.voucherFollowPct) || 0;
    if (tiktokState.flashSaleEnabled === true) sum += Number(tiktokState.flashSalePct) || 0;
    if (tiktokState.affiliateEnabled === true) sum += Number(tiktokState.affiliatePct) || 0;
    if (tiktokState.otherFeeEnabled !== false) sum += Number(tiktokState.otherFeePct) || 0;
    
    if (tiktokState.customFees) {
      tiktokState.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'pct') {
          sum += Number(fee.value) || 0;
        }
      });
    }
    return parseFloat(sum.toFixed(2));
  };

  const getTikTokTotalFixed = () => {
    let sum = 0;
    if (tiktokState.prosesPesananEnabled !== false) sum += tiktokState.prosesPesananFee !== undefined ? (Number(tiktokState.prosesPesananFee) || 0) : 1250;
    if (tiktokState.otherFeeRpEnabled === true) sum += Number(tiktokState.otherFeeRp) || 0;
    
    if (tiktokState.customFees) {
      tiktokState.customFees.forEach(fee => {
        if (fee.enabled && fee.type === 'rp') {
          sum += Number(fee.value) || 0;
        }
      });
    }
    return sum;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Dialog Body */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden font-sans"
      >
        {/* Header decoration banner */}
        <div className={`bg-gradient-to-r ${
          activePlatform === 'shopee' 
            ? 'from-orange-500 to-orange-600' 
            : 'from-slate-800 to-slate-950'
        } px-6 py-5 text-white flex justify-between items-center transition-all`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Settings className="w-5 h-5 animate-spin-slow text-white/90" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Biaya Shopee</h3>
              <p className="text-xs text-white/80">Kalkulasikan potongan biaya promosi & admin secara presisi untuk Shopee</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 px-1.5 bg-black/10 hover:bg-black/20 text-white rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Choice between Shopee and TikTok (Only shown if no defaultPlatform is forced) */}
          {!defaultPlatform && (
            <div className="flex gap-2.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => setActivePlatform('shopee')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition ${
                  activePlatform === 'shopee'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <ShoppingBag size={14} />
                Platform Shopee
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform('tiktok')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition ${
                  activePlatform === 'tiktok'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <Video size={14} />
                Platform TikTok
              </button>
            </div>
          )}

          {/* Shopee panel */}
          {activePlatform === 'shopee' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-400">Parameter Shopee</span>
                <button
                  type="button"
                  onClick={resetShopeeDefaults}
                  className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 transition-all"
                >
                  <RefreshCw size={12} />
                  Gunakan Default Shopee
                </button>
              </div>

              {/* Total percentage indicator banner */}
              <div className="bg-orange-50 rounded-2xl border border-orange-100/80 p-4 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold text-orange-850 uppercase tracking-wide">Simulasi Total Ongkos Potongan</div>
                  <div className="text-xl font-black text-orange-600 mt-0.5">
                    {getShopeeTotalPct()}% + Rp{(getShopeeTotalFixed()).toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-orange-500 max-w-[280px] text-right font-medium">
                  Total akumulasi persentase biaya administrasi dan biaya tetap (flat Rp) yang diaktifkan di bawah ini.
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mr-0.5">
                {/* Admin Fee Utama */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Biaya Admin</span>
                      <span className="text-[10px] text-slate-400 font-medium">Potongan komisi dasar Shopee</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.adminFeeEnabled !== false}
                      onChange={(e) => handleShopeeChange('adminFeeEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.adminFeeEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.adminFeePct}
                        onChange={(e) => handleShopeeChange('adminFeePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Promo XTRA (Cashback Extra) */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Promo XTRA</span>
                      <span className="text-[10px] text-slate-400 font-medium">Beban keikutsertaan Promo XTRA</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.cashbackEnabled !== false}
                      onChange={(e) => handleShopeeChange('cashbackEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.cashbackEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.cashbackPct}
                        onChange={(e) => handleShopeeChange('cashbackPct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Gratis Ongkir Extra */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Gratis Ongkir Extra</span>
                      <span className="text-[10px] text-slate-400 font-medium">Beban program Gratis Ongkir Extra</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.gratisOngkirEnabled !== false}
                      onChange={(e) => handleShopeeChange('gratisOngkirEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.gratisOngkirEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.gratisOngkirPct}
                        onChange={(e) => handleShopeeChange('gratisOngkirPct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Biaya Proses Pesanan */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Biaya Proses Pesanan</span>
                      <span className="text-[10px] text-slate-400 font-medium font-semibold text-orange-600">Default Rp 1.250 per pesanan</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.prosesPesananEnabled !== false}
                      onChange={(e) => handleShopeeChange('prosesPesananEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.prosesPesananEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={shopeeState.prosesPesananFee !== undefined ? shopeeState.prosesPesananFee : ''}
                        onChange={(e) => handleShopeeChange('prosesPesananFee', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Biaya Campaign Shopee */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Biaya Campaign Shopee</span>
                      <span className="text-[10px] text-slate-400 font-medium font-serif italic">Ikut serta Mega/Double Date Campaign</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.campaignFeeEnabled === true}
                      onChange={(e) => handleShopeeChange('campaignFeeEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.campaignFeeEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.campaignFeePct}
                        onChange={(e) => handleShopeeChange('campaignFeePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Voucher Toko */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Voucher Toko</span>
                      <span className="text-[10px] text-slate-400 font-medium">Voucher & subsidi toko terpakai</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.voucherTokoEnabled === true}
                      onChange={(e) => handleShopeeChange('voucherTokoEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.voucherTokoEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.voucherTokoPct}
                        onChange={(e) => handleShopeeChange('voucherTokoPct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Flashsale Toko */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Flashsale Toko</span>
                      <span className="text-[10px] text-slate-400 font-medium">Beban promosi diskon eksklusif Flash Sale</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.flashSaleEnabled === true}
                      onChange={(e) => handleShopeeChange('flashSaleEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.flashSaleEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.flashSalePct}
                        onChange={(e) => handleShopeeChange('flashSalePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Affiliate */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Komisi Affiliate</span>
                      <span className="text-[10px] text-slate-400 font-medium">Pembagian hasil affiliate produk</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.affiliateEnabled === true}
                      onChange={(e) => handleShopeeChange('affiliateEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.affiliateEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.affiliatePct}
                        onChange={(e) => handleShopeeChange('affiliatePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* PPN (%) */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">PPN (%)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Pajak Pertambahan Nilai (PPN)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shopeeState.otherFeeEnabled !== false}
                      onChange={(e) => handleShopeeChange('otherFeeEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${shopeeState.otherFeeEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={shopeeState.otherFeePct}
                        onChange={(e) => handleShopeeChange('otherFeePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Custom Fees rendered as standard cards in the grid */}
                {shopeeState.customFees && shopeeState.customFees.map((fee) => (
                  <div key={fee.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between relative group/fee transition-all duration-200">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={fee.name}
                          onChange={(e) => updateShopeeCustomFee(fee.id, { name: e.target.value })}
                          placeholder="Nama Biaya Kustom"
                          className="w-full text-xs font-bold text-slate-700 bg-transparent border-b border-dashed border-slate-300 hover:border-orange-400 focus:border-orange-500 focus:outline-none focus:ring-0 pb-0.5"
                        />
                        <span className="text-[9px] text-slate-400 font-medium block mt-1 font-sans">Biaya Tambahan Kustom</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={fee.enabled !== false}
                          onChange={(e) => updateShopeeCustomFee(fee.id, { enabled: e.target.checked })}
                          className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => removeShopeeCustomFee(fee.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus Biaya"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className={`transition-all ${fee.enabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div className="flex gap-1.5 items-center">
                        <div className="relative flex-1 font-sans">
                          {fee.type === 'rp' && (
                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-450">Rp</span>
                          )}
                          <input
                            type="number"
                            min="0"
                            value={fee.value}
                            onChange={(e) => updateShopeeCustomFee(fee.id, { value: e.target.value })}
                            className={`w-full py-2 text-xs font-mono font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-orange-550/20 focus:border-orange-500 ${fee.type === 'rp' ? 'pl-8 pr-3' : 'pl-3 pr-8'}`}
                          />
                          {fee.type === 'pct' && (
                            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                          )}
                        </div>
                        {/* Type Toggle switcher */}
                        <div className="flex rounded-xl border border-slate-250 overflow-hidden bg-white shrink-0">
                          <button
                            type="button"
                            onClick={() => updateShopeeCustomFee(fee.id, { type: 'pct' })}
                            className={`px-2.5 py-2 text-[10px] font-black transition-all ${fee.type === 'pct' ? 'bg-orange-500 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => updateShopeeCustomFee(fee.id, { type: 'rp' })}
                            className={`px-2.5 py-2 text-[10px] font-black transition-all ${fee.type === 'rp' ? 'bg-orange-500 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                          >
                            Rp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grid card to add new custom fee in Shopee */}
                <button
                  type="button"
                  onClick={addShopeeCustomFee}
                  className="border-2 border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50/15 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group/add cursor-pointer min-h-[110px] text-slate-500 hover:text-orange-600 bg-white/20"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover/add:bg-orange-50 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-slate-500 group-hover/add:text-orange-500 transition-colors group-hover/add:scale-110 duration-200" />
                  </div>
                  <span className="text-xs font-bold">Tambah Biaya Kustom</span>
                  <span className="text-[10px] text-slate-400 font-sans group-hover/add:text-orange-450">Tambah parameter baru (Rp atau %)</span>
                </button>
              </div>
            </div>
          )}

          {/* TikTok panel */}
          {activePlatform === 'tiktok' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-400">Parameter TikTok</span>
                <button
                  type="button"
                  onClick={resetTikTokDefaults}
                  className="text-slate-800 hover:text-slate-905 font-bold flex items-center gap-1 transition-all"
                >
                  <RefreshCw size={12} />
                  Gunakan Default TikTok
                </button>
              </div>

              {/* Total percentage indicator banner */}
              <div className="bg-slate-900 rounded-2xl p-4 flex justify-between items-center text-white">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Simulasi Total Potongan TikTok</div>
                  <div className="text-xl font-black text-teal-400 mt-0.5">
                    {getTikTokTotalPct()}% + Rp{getTikTokTotalFixed().toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 max-w-[280px] text-right font-medium">
                  Total akumulasi persentase biaya administrasi dan biaya tetap (flat Rp) yang diaktifkan di bawah ini.
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mr-0.5">
                {/* Admin Fee Utama */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Biaya Admin</span>
                      <span className="text-[10px] text-slate-400 font-medium">Potongan komisi dasar TikTok</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.adminFeeEnabled !== false}
                      onChange={(e) => handleTikTokChange('adminFeeEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.adminFeeEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.adminFeePct}
                        onChange={(e) => handleTikTokChange('adminFeePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Promo XTRA (Cashback Extra) */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Promo XTRA</span>
                      <span className="text-[10px] text-slate-400 font-medium">Beban keikutsertaan Promo XTRA</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.cashbackEnabled !== false}
                      onChange={(e) => handleTikTokChange('cashbackEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.cashbackEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.cashbackPct}
                        onChange={(e) => handleTikTokChange('cashbackPct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Gratis Ongkir Extra */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Gratis Ongkir Extra</span>
                      <span className="text-[10px] text-slate-400 font-medium">Beban program Gratis Ongkir Extra</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.gratisOngkirEnabled !== false}
                      onChange={(e) => handleTikTokChange('gratisOngkirEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.gratisOngkirEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.gratisOngkirPct}
                        onChange={(e) => handleTikTokChange('gratisOngkirPct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Biaya Proses Pesanan */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Biaya Proses Pesanan</span>
                      <span className="text-[10px] text-slate-400 font-medium font-semibold text-indigo-600">Default Rp 1.250 per pesanan</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.prosesPesananEnabled !== false}
                      onChange={(e) => handleTikTokChange('prosesPesananEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.prosesPesananEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={tiktokState.prosesPesananFee !== undefined ? tiktokState.prosesPesananFee : ''}
                        onChange={(e) => handleTikTokChange('prosesPesananFee', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Biaya Campaign TikTok */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Biaya Campaign TikTok</span>
                      <span className="text-[10px] text-slate-400 font-medium font-serif italic">Ikut serta Campaign Megasites / Double Dates</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.campaignFeeEnabled === true}
                      onChange={(e) => handleTikTokChange('campaignFeeEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.campaignFeeEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.campaignFeePct}
                        onChange={(e) => handleTikTokChange('campaignFeePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Voucher Toko */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Voucher Toko</span>
                      <span className="text-[10px] text-slate-400 font-medium">Voucher & subsidi toko terpakai</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.voucherTokoEnabled === true}
                      onChange={(e) => handleTikTokChange('voucherTokoEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.voucherTokoEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.voucherTokoPct}
                        onChange={(e) => handleTikTokChange('voucherTokoPct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Flashsale Toko */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Flashsale Toko</span>
                      <span className="text-[10px] text-slate-400 font-medium">Beban promosi diskon eksklusif Flash Sale</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.flashSaleEnabled === true}
                      onChange={(e) => handleTikTokChange('flashSaleEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.flashSaleEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.flashSalePct}
                        onChange={(e) => handleTikTokChange('flashSalePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* Affiliate */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Komisi Affiliate</span>
                      <span className="text-[10px] text-slate-400 font-medium">Pembagian hasil affiliate produk</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.affiliateEnabled === true}
                      onChange={(e) => handleTikTokChange('affiliateEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.affiliateEnabled === true ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.affiliatePct}
                        onChange={(e) => handleTikTokChange('affiliatePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>

                {/* PPN (%) */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">PPN (%)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Pajak Pertambahan Nilai (PPN)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={tiktokState.otherFeeEnabled !== false}
                      onChange={(e) => handleTikTokChange('otherFeeEnabled', e.target.checked)}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 accent-slate-905 cursor-pointer"
                    />
                  </div>
                  <div className={`transition-all ${tiktokState.otherFeeEnabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tiktokState.otherFeePct}
                        onChange={(e) => handleTikTokChange('otherFeePct', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                    </div>
                  </div>
                </div>
                {/* Custom Fees rendered as standard cards in the grid */}
                {tiktokState.customFees && tiktokState.customFees.map((fee) => (
                  <div key={fee.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex flex-col justify-between relative group/fee transition-all duration-200">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={fee.name}
                          onChange={(e) => updateTikTokCustomFee(fee.id, { name: e.target.value })}
                          placeholder="Nama Biaya Kustom"
                          className="w-full text-xs font-bold text-slate-705 bg-transparent border-b border-dashed border-slate-350 hover:border-slate-500 focus:border-slate-800 focus:outline-none focus:ring-0 pb-0.5"
                        />
                        <span className="text-[9px] text-slate-400 font-medium block mt-1 font-sans">Biaya Tambahan Kustom</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={fee.enabled !== false}
                          onChange={(e) => updateTikTokCustomFee(fee.id, { enabled: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-slate-700 accent-slate-905 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => removeTikTokCustomFee(fee.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus Biaya"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className={`transition-all ${fee.enabled !== false ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div className="flex gap-1.5 items-center">
                        <div className="relative flex-1 font-sans">
                          {fee.type === 'rp' && (
                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-450">Rp</span>
                          )}
                          <input
                            type="number"
                            min="0"
                            value={fee.value}
                            onChange={(e) => updateTikTokCustomFee(fee.id, { value: e.target.value })}
                            className={`w-full py-2 text-xs font-mono font-bold rounded-xl bg-white border border-slate-250 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 ${fee.type === 'rp' ? 'pl-8 pr-3' : 'pl-3 pr-8'}`}
                          />
                          {fee.type === 'pct' && (
                            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450">%</span>
                          )}
                        </div>
                        {/* Type Toggle switcher */}
                        <div className="flex rounded-xl border border-slate-250 overflow-hidden bg-white shrink-0">
                          <button
                            type="button"
                            onClick={() => updateTikTokCustomFee(fee.id, { type: 'pct' })}
                            className={`px-2.5 py-2 text-[10px] font-black transition-all ${fee.type === 'pct' ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTikTokCustomFee(fee.id, { type: 'rp' })}
                            className={`px-2.5 py-2 text-[10px] font-black transition-all ${fee.type === 'rp' ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                          >
                            Rp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grid card to add new custom fee in TikTok */}
                <button
                  type="button"
                  onClick={addTikTokCustomFee}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-800 hover:bg-slate-50/15 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group/add cursor-pointer min-h-[110px] text-slate-500 hover:text-slate-900 bg-white/20"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover/add:bg-slate-50 flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-slate-500 group-hover/add:text-slate-900 transition-colors group-hover/add:scale-110 duration-200" />
                  </div>
                  <span className="text-xs font-bold">Tambah Biaya Kustom</span>
                  <span className="text-[10px] text-slate-400 font-sans group-hover/add:text-slate-800">Tambah parameter baru (Rp atau %)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-250 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={showSuccess}
            className={`flex items-center gap-1.5 px-5 py-2 hover:opacity-90 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-white ${
              showSuccess 
                ? 'bg-emerald-600' 
                : activePlatform === 'shopee'
                  ? 'bg-orange-600'
                  : 'bg-slate-900'
            }`}
          >
            {showSuccess ? (
              <>
                <CheckCircle size={14} className="animate-bounce" />
                Kredensial Tersimpan!
              </>
            ) : (
              <>
                <Save size={14} />
                Simpan Potongan Biaya
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
