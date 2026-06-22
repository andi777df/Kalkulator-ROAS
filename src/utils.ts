import { 
  Platform, 
  ProductInput, 
  AdCampaignInput, 
  CalculationResult, 
  ShopeeFeeSettings, 
  TikTokFeeSettings 
} from './types';

/**
 * Calculates complete ROAS and profitability metrics for Shopee
 */
export const calculateShopeeMetrics = (
  product: ProductInput,
  ad: AdCampaignInput,
  fees: ShopeeFeeSettings
): CalculationResult => {
  const { name, hpp: rawHpp, hargaJual: rawHargaJual, targetProfitPct: rawTargetProfitPct } = product;
  const { adSpend: rawAdSpend, quantitySold: rawQuantitySold, actualRoas: rawActualRoas, useActualRoasInput } = ad;

  const hpp = Number(rawHpp) || 0;
  const hargaJual = Number(rawHargaJual) || 0;
  const targetProfitPct = Number(rawTargetProfitPct) || 0;

  const adSpend = Number(rawAdSpend) || 0;
  const quantitySold = Number(rawQuantitySold) || 0;
  const actualRoas = Number(rawActualRoas) || 0;

  // Percentage calculations
  let totalAdminFeePct = 0;
  if (fees.adminFeeEnabled !== false) totalAdminFeePct += Number(fees.adminFeePct) || 0;
  if (fees.gratisOngkirEnabled !== false) totalAdminFeePct += Number(fees.gratisOngkirPct) || 0;
  if (fees.cashbackEnabled !== false) totalAdminFeePct += Number(fees.cashbackPct) || 0;
  if (fees.campaignFeeEnabled === true) totalAdminFeePct += Number(fees.campaignFeePct) || 0;
  if (fees.voucherTokoEnabled === true) totalAdminFeePct += Number(fees.voucherTokoPct) || 0;
  if (fees.voucherFollowEnabled === true) totalAdminFeePct += Number(fees.voucherFollowPct) || 0;
  if (fees.flashSaleEnabled === true) totalAdminFeePct += Number(fees.flashSalePct) || 0;
  if (fees.affiliateEnabled === true) totalAdminFeePct += Number(fees.affiliatePct) || 0;
  if (fees.otherFeeEnabled !== false) totalAdminFeePct += Number(fees.otherFeePct) || 0;

  if (fees.customFees) {
    fees.customFees.forEach(fee => {
      if (fee.enabled && fee.type === 'pct') {
        totalAdminFeePct += Number(fee.value) || 0;
      }
    });
  }

  const totalAdminFeeRp = hargaJual * (totalAdminFeePct / 100);
  
  let fixedFeeRp = 0;
  if (fees.prosesPesananEnabled !== false) fixedFeeRp += fees.prosesPesananFee !== undefined ? (Number(fees.prosesPesananFee) || 0) : 1250;
  if (fees.otherFeeRpEnabled === true) fixedFeeRp += Number(fees.otherFeeRp) || 0;

  if (fees.customFees) {
    fees.customFees.forEach(fee => {
      if (fee.enabled && fee.type === 'rp') {
        fixedFeeRp += Number(fee.value) || 0;
      }
    });
  }

  const totalFeesRp = totalAdminFeeRp + fixedFeeRp;

  // Margin Sebelum Iklan
  const marginBeforeAdsRp = hargaJual - hpp - totalFeesRp;
  const marginBeforeAdsPct = hargaJual > 0 ? (marginBeforeAdsRp / hargaJual) * 100 : 0;

  // Break-even ROAS = S / MarginSebelumIklan
  const breakEvenRoas = marginBeforeAdsRp > 0 ? hargaJual / marginBeforeAdsRp : 9999;

  // Target ROAS based on target net profit margin %
  // Target ROAS = S / (MarginSebelumIklan - (targetProfit/100 * S))
  const marginTargetS = marginBeforeAdsRp - (targetProfitPct / 100) * hargaJual;
  const targetRoasFeasible = marginTargetS > 0;
  const targetRoas = targetRoasFeasible ? hargaJual / marginTargetS : 9999;

  // Campaign performance calculations
  let calculatedQty = quantitySold;
  let calculatedRevenue = quantitySold * hargaJual;
  let calculatedActualRoas = actualRoas;

  if (useActualRoasInput) {
    // If the user inputs direct Actual ROAS instead of Qty sold:
    // ROAS = Revenue / AdSpend  => Revenue = ROAS * AdSpend
    calculatedRevenue = actualRoas * adSpend;
    // Quantity sold = Revenue / Selling Price
    calculatedQty = hargaJual > 0 ? Math.round(calculatedRevenue / hargaJual) : 0;
    // Re-adjust revenue to match discrete items sold
    calculatedRevenue = calculatedQty * hargaJual;
  } else {
    // Standard input: user inputs Qty Sold or AdSpend
    calculatedActualRoas = adSpend > 0 ? calculatedRevenue / adSpend : 0;
  }

  const totalCostOfGoodsSold = calculatedQty * hpp;
  const totalPlatformFees = calculatedQty * totalFeesRp;
  
  // Net Profit Rp = Revenue - COGS - PlatformFees - AdSpend
  const netProfitRp = calculatedRevenue - totalCostOfGoodsSold - totalPlatformFees - adSpend;
  const netProfitPct = calculatedRevenue > 0 ? (netProfitRp / calculatedRevenue) * 100 : 0;
  const isCampaignProfitable = netProfitRp > 0;

  return {
    platform: Platform.SHOPEE,
    productName: name,
    hpp,
    hargaJual,
    targetProfitPct,
    totalAdminFeePct,
    totalAdminFeeRp,
    fixedFeeRp,
    totalFeesRp,
    marginBeforeAdsRp,
    marginBeforeAdsPct,
    breakEvenRoas,
    targetRoas,
    targetRoasFeasible,
    adSpend,
    quantitySold: calculatedQty,
    revenue: calculatedRevenue,
    actualRoas: calculatedActualRoas,
    totalCostOfGoodsSold,
    totalPlatformFees,
    netProfitRp,
    netProfitPct,
    isCampaignProfitable
  };
};

/**
 * Calculates complete ROAS and profitability metrics for TikTok Shop
 */
export const calculateTikTokMetrics = (
  product: ProductInput,
  ad: AdCampaignInput,
  fees: TikTokFeeSettings
): CalculationResult => {
  const { name, hpp: rawHpp, hargaJual: rawHargaJual, targetProfitPct: rawTargetProfitPct } = product;
  const { adSpend: rawAdSpend, quantitySold: rawQuantitySold, actualRoas: rawActualRoas, useActualRoasInput } = ad;

  const hpp = Number(rawHpp) || 0;
  const hargaJual = Number(rawHargaJual) || 0;
  const targetProfitPct = Number(rawTargetProfitPct) || 0;

  const adSpend = Number(rawAdSpend) || 0;
  const quantitySold = Number(rawQuantitySold) || 0;
  const actualRoas = Number(rawActualRoas) || 0;

  // Percentage calculations
  let totalAdminFeePct = 0;
  if (fees.adminFeeEnabled !== false) totalAdminFeePct += Number(fees.adminFeePct) || 0;
  if (fees.gratisOngkirEnabled !== false) totalAdminFeePct += Number(fees.gratisOngkirPct) || 0;
  if (fees.cashbackEnabled !== false) totalAdminFeePct += Number(fees.cashbackPct) || 0;
  if (fees.campaignFeeEnabled === true) totalAdminFeePct += Number(fees.campaignFeePct) || 0;
  if (fees.voucherTokoEnabled === true) totalAdminFeePct += Number(fees.voucherTokoPct) || 0;
  if (fees.voucherFollowEnabled === true) totalAdminFeePct += Number(fees.voucherFollowPct) || 0;
  if (fees.flashSaleEnabled === true) totalAdminFeePct += Number(fees.flashSalePct) || 0;
  if (fees.affiliateEnabled === true) totalAdminFeePct += Number(fees.affiliatePct) || 0;
  if (fees.otherFeeEnabled !== false) totalAdminFeePct += Number(fees.otherFeePct) || 0;

  if (fees.customFees) {
    fees.customFees.forEach(fee => {
      if (fee.enabled && fee.type === 'pct') {
        totalAdminFeePct += Number(fee.value) || 0;
      }
    });
  }

  const totalAdminFeeRp = hargaJual * (totalAdminFeePct / 100);
  
  let fixedFeeRp = 0;
  if (fees.prosesPesananEnabled !== false) fixedFeeRp += fees.prosesPesananFee !== undefined ? (Number(fees.prosesPesananFee) || 0) : 1250;
  if (fees.otherFeeRpEnabled === true) fixedFeeRp += Number(fees.otherFeeRp) || 0;

  if (fees.customFees) {
    fees.customFees.forEach(fee => {
      if (fee.enabled && fee.type === 'rp') {
        fixedFeeRp += Number(fee.value) || 0;
      }
    });
  }

  const totalFeesRp = totalAdminFeeRp + fixedFeeRp;

  // Margin Sebelum Iklan
  const marginBeforeAdsRp = hargaJual - hpp - totalFeesRp;
  const marginBeforeAdsPct = hargaJual > 0 ? (marginBeforeAdsRp / hargaJual) * 100 : 0;

  // Break-even ROAS = S / MarginSebelumIklan
  const breakEvenRoas = marginBeforeAdsRp > 0 ? hargaJual / marginBeforeAdsRp : 9999;

  // Target ROAS based on target net profit margin %
  const marginTargetS = marginBeforeAdsRp - (targetProfitPct / 100) * hargaJual;
  const targetRoasFeasible = marginTargetS > 0;
  const targetRoas = targetRoasFeasible ? hargaJual / marginTargetS : 9999;

  // Campaign performance calculations
  let calculatedQty = quantitySold;
  let calculatedRevenue = quantitySold * hargaJual;
  let calculatedActualRoas = actualRoas;

  if (useActualRoasInput) {
    calculatedRevenue = actualRoas * adSpend;
    calculatedQty = hargaJual > 0 ? Math.round(calculatedRevenue / hargaJual) : 0;
    calculatedRevenue = calculatedQty * hargaJual;
  } else {
    calculatedActualRoas = adSpend > 0 ? calculatedRevenue / adSpend : 0;
  }

  const totalCostOfGoodsSold = calculatedQty * hpp;
  const totalPlatformFees = calculatedQty * totalFeesRp;
  
  const netProfitRp = calculatedRevenue - totalCostOfGoodsSold - totalPlatformFees - adSpend;
  const netProfitPct = calculatedRevenue > 0 ? (netProfitRp / calculatedRevenue) * 100 : 0;
  const isCampaignProfitable = netProfitRp > 0;

  return {
    platform: Platform.TIKTOK,
    productName: name,
    hpp,
    hargaJual,
    targetProfitPct,
    totalAdminFeePct,
    totalAdminFeeRp,
    fixedFeeRp,
    totalFeesRp,
    marginBeforeAdsRp,
    marginBeforeAdsPct,
    breakEvenRoas,
    targetRoas,
    targetRoasFeasible,
    adSpend,
    quantitySold: calculatedQty,
    revenue: calculatedRevenue,
    actualRoas: calculatedActualRoas,
    totalCostOfGoodsSold,
    totalPlatformFees,
    netProfitRp,
    netProfitPct,
    isCampaignProfitable
  };
};
