export enum Platform {
  SHOPEE = "Shopee",
  TIKTOK = "TikTok Shop"
}

export interface CustomFee {
  id: string;
  name: string;
  value: number;
  type: 'pct' | 'rp';
  enabled: boolean;
}

export interface ShopeeFeeSettings {
  adminFeePct: number; // Biaya Admin
  gratisOngkirPct: number; // Gratis Ongkir Ekstra
  cashbackPct: number; // Promo XTRA (Cashback / Promo Xtra)
  fixedFee: number; // Biaya Tetap (Rp)
  prosesPesananFee: number; // Biaya Proses Pesanan (Rp) - Default 1.250
  campaignFeePct: number; // Biaya Campaign Shopee (%)
  voucherTokoPct: number; // Voucher Toko (%)
  voucherFollowPct: number; // Voucher Follow Toko (%)
  flashSalePct: number; // Flashsale Toko (%)
  affiliatePct: number; // Biaya Affiliate (%)
  otherFeePct: number; // Biaya Lainnya (%)
  otherFeeRp: number; // Biaya Lainnya (Rp)
  customFees?: CustomFee[]; // Biaya Tambahan Kustom Lainnya
  
  // Toggles (aktifkan/nonaktifkan)
  adminFeeEnabled: boolean;
  gratisOngkirEnabled: boolean;
  cashbackEnabled: boolean; // Promo XTRA Toggle
  fixedFeeEnabled: boolean;
  prosesPesananEnabled: boolean;
  campaignFeeEnabled: boolean;
  voucherTokoEnabled: boolean;
  voucherFollowEnabled: boolean;
  flashSaleEnabled: boolean;
  affiliateEnabled: boolean;
  otherFeeEnabled: boolean; // Biaya Lainnya (%) Toggle
  otherFeeRpEnabled: boolean; // Biaya Lainnya (Rp) Toggle
}

export interface TikTokFeeSettings {
  adminFeePct: number; // Biaya Admin
  gratisOngkirPct: number; // Gratis Ongkir Ekstra
  cashbackPct: number; // Promo XTRA (Cashback / Promo Xtra)
  fixedFee: number; // Biaya Tetap (Rp)
  prosesPesananFee: number; // Biaya Proses Pesanan (Rp) - Default 1.250
  campaignFeePct: number; // Biaya Campaign TikTok (%)
  voucherTokoPct: number; // Voucher Toko (%)
  voucherFollowPct: number; // Voucher Follow Toko (%)
  flashSalePct: number; // Flashsale Toko (%)
  affiliatePct: number; // Biaya Affiliate (%)
  otherFeePct: number; // Biaya Lainnya (%) (yaitu PPN %)
  otherFeeRp: number; // Biaya Lainnya (Rp)
  customFees?: CustomFee[]; // Biaya Tambahan Kustom Lainnya
  
  // Toggles (aktifkan/nonaktifkan)
  adminFeeEnabled: boolean;
  gratisOngkirEnabled: boolean;
  cashbackEnabled: boolean; // Promo XTRA Toggle
  fixedFeeEnabled: boolean;
  prosesPesananEnabled: boolean;
  campaignFeeEnabled: boolean;
  voucherTokoEnabled: boolean;
  voucherFollowEnabled: boolean;
  flashSaleEnabled: boolean;
  affiliateEnabled: boolean;
  otherFeeEnabled: boolean; // PPN % Toggle
  otherFeeRpEnabled: boolean;
}

export interface FeeSettings {
  shopee: ShopeeFeeSettings;
  tiktok: TikTokFeeSettings;
}

export interface ProductInput {
  name: string;
  hpp: number | string; // Cost of Goods Sold / COGS
  hargaJual: number | string; // Selling Price (S)
  targetProfitPct: number | string; // Target Profit % ("perseye jadinya" target)
}

export interface AdCampaignInput {
  adSpend: number | string; // Daily/campaign budget (Rp)
  quantitySold: number | string; // Qty of items sold from ads
  actualRoas: number | string; // Optional actual ROAS achieved (Revenue / Ad Spend)
  useActualRoasInput: boolean; // toggle whether to input direct ROAS or total sales Qty
}

export interface CalculationResult {
  platform: Platform;
  productName: string;
  hpp: number;
  hargaJual: number;
  targetProfitPct: number;
  
  // Admin fees breakdown
  totalAdminFeePct: number;
  totalAdminFeeRp: number;
  fixedFeeRp: number;
  totalFeesRp: number; // Total admin + fixed + other fees
  
  // Margin BEFORE Ads
  marginBeforeAdsRp: number; // S - HPP - TotalFeesRp
  marginBeforeAdsPct: number; // marginBeforeAdsRp / S * 100%
  
  // Break-even and Target Metrics
  breakEvenRoas: number; // S / marginBeforeAdsRp
  targetRoas: number; // S / (marginBeforeAdsRp - (targetProfitPct/100 * S))
  targetRoasFeasible: boolean; // if targetProfitPct < marginBeforeAdsPct
  
  // Campaign Metrics (if ad data is provided)
  adSpend: number;
  quantitySold: number;
  revenue: number; // quantitySold * hargaJual
  actualRoas: number; // revenue / adSpend (or manual actual ROAS)
  totalCostOfGoodsSold: number; // quantitySold * hpp
  totalPlatformFees: number; // quantitySold * totalPlatformFees
  netProfitRp: number; // revenue - totalCostOfGoodsSold - totalPlatformFees - adSpend
  netProfitPct: number; // netProfitRp / revenue * 100%
  isCampaignProfitable: boolean;
}

export interface SavedCalculation {
  id: string;
  date: string;
  platform: Platform;
  productInput: ProductInput;
  adInput: AdCampaignInput;
  result: CalculationResult;
}
