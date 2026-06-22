import { jsPDF } from 'jspdf';
import { 
  ProductInput, 
  AdCampaignInput, 
  CalculationResult, 
  ShopeeFeeSettings, 
  TikTokFeeSettings, 
  SavedCalculation 
} from './types';
import { formatIDR } from './sheets';

/**
 * Downloads active platform calculation as CSV.
 */
export const downloadActiveCSV = (
  activePlatform: 'shopee' | 'tiktok',
  product: ProductInput,
  ad: AdCampaignInput,
  activeResult: CalculationResult | null
) => {
  if (!activeResult) return;
  
  const headers = [
    "Platform",
    "Nama Produk",
    "Harga Jual (Rp)",
    "HPP (Rp)",
    "Total Potongan Biasa (Rp)",
    "Total Potongan Biasa (%)",
    "Margin Sebelum Iklan (Rp)",
    "Margin Sebelum Iklan (%)",
    "ROAS BEP (x)",
    "Biaya Iklan (Rp)",
    "Unit Terjual",
    "Revenue/Omset (Rp)",
    "Profit Bersih (Rp)",
    "Profit Bersih (%)"
  ];

  const row = [
    activePlatform === 'shopee' ? "Shopee" : "TikTok Shop",
    `"${(product.name || 'Tanpa Nama').replace(/"/g, '""')}"`,
    product.hargaJual,
    product.hpp,
    activeResult.totalFeesRp,
    activeResult.totalAdminFeePct,
    activeResult.marginBeforeAdsRp,
    activeResult.marginBeforeAdsPct,
    activeResult.breakEvenRoas,
    activeResult.adSpend,
    activeResult.quantitySold,
    activeResult.revenue,
    activeResult.netProfitRp,
    activeResult.netProfitPct
  ];

  const csvContent = "\ufeff" + [headers.join(","), row.join(",")].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Kalkulasi_ROAS_${activePlatform === 'shopee' ? 'Shopee' : 'TikTok'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads active platform calculation as Excel (.xls).
 */
export const downloadActiveExcel = (
  activePlatform: 'shopee' | 'tiktok',
  product: ProductInput,
  activeResult: CalculationResult | null
) => {
  if (!activeResult) return;

  const isShopee = activePlatform === 'shopee';
  const platformName = isShopee ? "Shopee" : "TikTok Shop";

  const excelHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Kalkulasi ROAS</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 10px; text-align: center; }
      td { border: 1px solid #E2E8F0; padding: 8px; font-size: 11px; }
      .header-title { font-size: 16px; font-weight: bold; color: #1E293B; margin-bottom: 5px; }
      .header-date { font-size: 11px; color: #64748B; margin-bottom: 20px; }
      .badge { background-color: ${isShopee ? '#FFEDE5' : '#F1F5F9'}; color: ${isShopee ? '#EA580C' : '#0F172A'}; font-weight: bold; text-align: center; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .text-green { color: #16A34A; }
      .text-rose { color: #DC2626; }
    </style>
  </head>
  <body>
    <div class="header-title">LAPORAN SIMULASI ROAS ${platformName.toUpperCase()}</div>
    <div class="header-date">Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
    
    <table>
      <thead>
        <tr>
          <th>Platform</th>
          <th>Nama Produk</th>
          <th>Harga Jual</th>
          <th>HPP</th>
          <th>Total Biaya Admin Platform</th>
          <th>Margin Sebelum Iklan</th>
          <th>ROAS BEP</th>
          <th>Total Biaya Iklan</th>
          <th>Unit Terjual</th>
          <th>Omset (Revenue)</th>
          <th>Profit Bersih (Rp)</th>
          <th>Profit Bersih (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center badge">${platformName}</td>
          <td class="font-bold">${(product.name || 'Tanpa Nama')}</td>
          <td class="text-right">${product.hargaJual}</td>
          <td class="text-right">${product.hpp}</td>
          <td class="text-right">${activeResult.totalFeesRp} (${activeResult.totalAdminFeePct.toFixed(1)}%)</td>
          <td class="text-right">${activeResult.marginBeforeAdsRp} (${activeResult.marginBeforeAdsPct.toFixed(1)}%)</td>
          <td class="text-center font-bold">${activeResult.breakEvenRoas.toFixed(2)}x</td>
          <td class="text-right">${activeResult.adSpend}</td>
          <td class="text-right">${activeResult.quantitySold} Pcs</td>
          <td class="text-right font-bold">${activeResult.revenue}</td>
          <td class="text-right font-bold">${activeResult.netProfitRp}</td>
          <td class="text-right">${activeResult.netProfitPct.toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Simulasi_${activePlatform === 'shopee' ? 'Shopee' : 'TikTok'}_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads active platform calculation as PDF.
 */
export const downloadActivePDF = (
  activePlatform: 'shopee' | 'tiktok',
  product: ProductInput,
  activeResult: CalculationResult | null,
  shopeeFeeSettings: ShopeeFeeSettings,
  tiktokFeeSettings: TikTokFeeSettings
) => {
  if (!activeResult) return;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const isShopee = activePlatform === 'shopee';
    const platformName = isShopee ? 'Shopee' : 'TikTok Shop';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let y = 15;

    // 1. Header Banner
    const brandColor = isShopee ? [234, 88, 12] : [15, 23, 42]; // Orange vs dark-slate
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(15, y, 180, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PERHITUNGAN ROAS DAN PROFIT PENJUALAN', 20, y + 9);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Kanal: ${platformName.toUpperCase()} | Diunduh langsung`, 20, y + 16);

    y += 28;

    // Print Metadata info
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Waktu Cetak: ${dateStr}`, 15, y);
    doc.text('Status Laporan: Valid sesuai konfigurasi admin', 120, y);

    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y);
    y += 8;

    // 2. Section 1 - Data Produk
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. HARGA JUAL & HPP PRODUK', 15, y);
    y += 5;

    // Background block for product details
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 30, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 23, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Nama Unit Produk:', 20, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const safeCalcProductName = (product.name || 'Produk Tanpa Nama').slice(0, 48) + ((product.name || '').length > 48 ? '...' : '');
    doc.text(safeCalcProductName, 60, y + 7);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('Harga Jual per Unit:', 20, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formatIDR(Number(product.hargaJual)), 60, y + 14);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('HPP (Harga Pokok):', 20, y + 21);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formatIDR(Number(product.hpp)), 60, y + 21);

    y += 30;

    // 3. Section 2 - Potongan Biaya Admin
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`2. RINCIAN POTONGAN BIAYA ADMIN`, 15, y);
    y += 5;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Jenis Potongan Program', 20, y + 5.5);
    doc.text('Nilai Potongan (IDR)', 185, y + 5.5, { align: 'right' });
    y += 8;

    const feesRows: { name: string; val: string }[] = [];
    const hargaJualNum = Number(product.hargaJual) || 0;

    if (isShopee) {
      if (shopeeFeeSettings.adminFeeEnabled !== false) {
        feesRows.push({
          name: `Biaya Admin (${shopeeFeeSettings.adminFeePct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.adminFeePct / 100))
        });
      }
      if (shopeeFeeSettings.gratisOngkirEnabled !== false) {
        feesRows.push({
          name: `Gratis Ongkir Extra (${shopeeFeeSettings.gratisOngkirPct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.gratisOngkirPct / 100))
        });
      }
      if (shopeeFeeSettings.cashbackEnabled !== false) {
        feesRows.push({
          name: `Promo XTRA (${shopeeFeeSettings.cashbackPct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.cashbackPct / 100))
        });
      }
      if (shopeeFeeSettings.campaignFeeEnabled) {
        feesRows.push({
          name: `Campaign Shopee (${shopeeFeeSettings.campaignFeePct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.campaignFeePct / 100))
        });
      }
      if (shopeeFeeSettings.voucherTokoEnabled) {
        feesRows.push({
          name: `Voucher Toko (${shopeeFeeSettings.voucherTokoPct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.voucherTokoPct / 100))
        });
      }
      if (shopeeFeeSettings.flashSaleEnabled) {
        feesRows.push({
          name: `Flashsale Toko (${shopeeFeeSettings.flashSalePct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.flashSalePct / 100))
        });
      }
      if (shopeeFeeSettings.affiliateEnabled) {
        feesRows.push({
          name: `Komisi Affiliate (${shopeeFeeSettings.affiliatePct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.affiliatePct / 100))
        });
      }
      if (shopeeFeeSettings.otherFeeEnabled !== false && shopeeFeeSettings.otherFeePct > 0) {
        feesRows.push({
          name: `PPN (${shopeeFeeSettings.otherFeePct}%)`,
          val: formatIDR(hargaJualNum * (shopeeFeeSettings.otherFeePct / 100))
        });
      }

      if (shopeeFeeSettings.customFees) {
        shopeeFeeSettings.customFees.forEach(fee => {
          if (fee.enabled && fee.type === 'pct') {
            feesRows.push({
              name: `${fee.name} (${fee.value}%)`,
              val: formatIDR(hargaJualNum * (fee.value / 100))
            });
          }
        });
      }

      if (shopeeFeeSettings.prosesPesananEnabled !== false && (shopeeFeeSettings.prosesPesananFee ?? 1250) > 0) {
        feesRows.push({
          name: `Biaya Proses Pesanan (Flat)`,
          val: formatIDR(shopeeFeeSettings.prosesPesananFee ?? 1250)
        });
      }
      if (shopeeFeeSettings.otherFeeRpEnabled && shopeeFeeSettings.otherFeeRp > 0) {
        feesRows.push({
          name: `Biaya Lain-lain (Flat)`,
          val: formatIDR(shopeeFeeSettings.otherFeeRp)
        });
      }

      if (shopeeFeeSettings.customFees) {
        shopeeFeeSettings.customFees.forEach(fee => {
          if (fee.enabled && fee.type === 'rp') {
            feesRows.push({
              name: `${fee.name} (Flat)`,
              val: formatIDR(fee.value)
            });
          }
        });
      }
    } else {
      if (tiktokFeeSettings.adminFeeEnabled !== false) {
        feesRows.push({
          name: `Biaya Admin (${tiktokFeeSettings.adminFeePct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.adminFeePct / 100))
        });
      }
      if (tiktokFeeSettings.gratisOngkirEnabled !== false) {
        feesRows.push({
          name: `Gratis Ongkir Extra (${tiktokFeeSettings.gratisOngkirPct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.gratisOngkirPct / 100))
        });
      }
      if (tiktokFeeSettings.cashbackEnabled !== false) {
        feesRows.push({
          name: `Promo XTRA (${tiktokFeeSettings.cashbackPct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.cashbackPct / 100))
        });
      }
      if (tiktokFeeSettings.campaignFeeEnabled) {
        feesRows.push({
          name: `Biaya Campaign TikTok (${tiktokFeeSettings.campaignFeePct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.campaignFeePct / 100))
        });
      }
      if (tiktokFeeSettings.voucherTokoEnabled) {
        feesRows.push({
          name: `Voucher Toko (${tiktokFeeSettings.voucherTokoPct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.voucherTokoPct / 100))
        });
      }
      if (tiktokFeeSettings.flashSaleEnabled) {
        feesRows.push({
          name: `Flashsale Toko (${tiktokFeeSettings.flashSalePct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.flashSalePct / 100))
        });
      }
      if (tiktokFeeSettings.affiliateEnabled) {
        feesRows.push({
          name: `Komisi Affiliate (${tiktokFeeSettings.affiliatePct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.affiliatePct / 100))
        });
      }
      if (tiktokFeeSettings.otherFeeEnabled !== false && tiktokFeeSettings.otherFeePct > 0) {
        feesRows.push({
          name: `PPN (${tiktokFeeSettings.otherFeePct}%)`,
          val: formatIDR(hargaJualNum * (tiktokFeeSettings.otherFeePct / 100))
        });
      }
      if (tiktokFeeSettings.customFees) {
        tiktokFeeSettings.customFees.forEach(fee => {
          if (fee.enabled && fee.type === 'pct') {
            feesRows.push({
              name: `${fee.name} (${fee.value}%)`,
              val: formatIDR(hargaJualNum * (fee.value / 100))
            });
          }
        });
      }

      if (tiktokFeeSettings.prosesPesananEnabled !== false && (tiktokFeeSettings.prosesPesananFee ?? 1250) > 0) {
        feesRows.push({
          name: `Biaya Proses Pesanan (Flat)`,
          val: formatIDR(tiktokFeeSettings.prosesPesananFee ?? 1250)
        });
      }
      if (tiktokFeeSettings.otherFeeRpEnabled && tiktokFeeSettings.otherFeeRp > 0) {
        feesRows.push({
          name: `Biaya Lain-lain (Flat)`,
          val: formatIDR(tiktokFeeSettings.otherFeeRp)
        });
      }

      if (tiktokFeeSettings.customFees) {
        tiktokFeeSettings.customFees.forEach(fee => {
          if (fee.enabled && fee.type === 'rp') {
            feesRows.push({
              name: `${fee.name} (Flat)`,
              val: formatIDR(fee.value)
            });
          }
        });
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    feesRows.forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 7.5, 'F');
      }
      doc.text(row.name, 20, y + 5);
      doc.text(row.val, 185, y + 5, { align: 'right' });
      y += 7.5;
    });

    // Total Admin row
    doc.setFillColor(254, 243, 199); // light orange amber shading
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('Total Potongan Platform per Unit:', 20, y + 5.5);
    doc.text(`${formatIDR(activeResult.totalFeesRp)} (${activeResult.totalAdminFeePct.toFixed(1)}%)`, 185, y + 5.5, { align: 'right' });
    y += 15;

    // 4. Section 3 - Hasil Keuntungan Kampanye
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. EVALUASI MARGIN KEUNTUNGAN & ESTIMASI CAPAIAN ROAS', 15, y);
    y += 5;

    // Status Banner Box (Kampanye Untung vs Rugi)
    const isProfitable = activeResult.isCampaignProfitable;
    const badgeBg = isProfitable ? [240, 253, 244] : [254, 242, 242];
    const badgeText = isProfitable ? [21, 128, 61] : [185, 28, 28];
    const statusLabel = isProfitable ? 'SIMULASI KAMPANYE: BERPOTENSI UNTUNG' : 'SIMULASI KAMPANYE: BERPOTENSI RUGI / DEFISIT';

    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
    doc.rect(15, y, 180, 9, 'F');
    doc.setDrawColor(isProfitable ? 187 : 254, isProfitable ? 247 : 202, isProfitable ? 208 : 202);
    doc.rect(15, y, 180, 9, 'S');

    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(statusLabel, 20, y + 6);
    y += 14;

    // Metrics Grid (Omset, Iklan, ROAS BEP, ROAS Aktual)
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 20, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 20, 'S');

    // Drawer dividers
    doc.line(60, y, 60, y + 20);
    doc.line(105, y, 105, y + 20);
    doc.line(150, y, 150, y + 20);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('OMSET KOTOR', 37.5, y + 6, { align: 'center' });
    doc.text('TOTAL BIAYA IKLAN', 82.5, y + 6, { align: 'center' });
    doc.text('ROAS BEP (BATAS)', 127.5, y + 6, { align: 'center' });
    doc.text('ROAS IKLAN', 172.5, y + 6, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(formatIDR(activeResult.revenue), 37.5, y + 14, { align: 'center' });
    
    doc.setTextColor(185, 28, 28);
    doc.text(formatIDR(activeResult.adSpend), 82.5, y + 14, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.text(`${activeResult.breakEvenRoas.toFixed(2)}x`, 127.5, y + 14, { align: 'center' });

    doc.setTextColor(isProfitable ? 21 : 185, isProfitable ? 128 : 28, isProfitable ? 61 : 28);
    doc.text(`${activeResult.actualRoas.toFixed(2)}x`, 172.5, y + 14, { align: 'center' });

    y += 26;

    // Final clean Box for Net profit / Net loss
    doc.setFillColor(isProfitable ? 240 : 254, isProfitable ? 253 : 242, isProfitable ? 244 : 242);
    doc.rect(15, y, 180, 14, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ESTIMASI LABA BERSIH KAMPANYE:', 20, y + 9);

    doc.setFontSize(11);
    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
    const profitSign = activeResult.netProfitRp < 0 ? '-' : '';
    doc.text(`${profitSign}${formatIDR(Math.abs(activeResult.netProfitRp))} (${activeResult.netProfitPct.toFixed(1)}%)`, 185, y + 9, { align: 'right' });

    y += 24;

    // Disclaimer footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.text('* Laporan hitungan ini disimulasikan sesuai persentase regulasi biaya admin platform per tanggal simulasi.', 15, y);
    doc.text('Hak Cipta © 2026 Kalkulator ROAS Toko Online. Semua data dikalkulasi lokal & rahasia.', 15, y + 4);

    // Save PDF
    doc.save(`Hasil_Simulasi_${platformName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Gagal membuat PDF. Silahkan ekspor ke Excel (.xls) atau CSV.');
  }
};

/**
 * Downloads full historical logs list as landscape PDF report.
 */
export const downloadHistoryPDF = (calculations: SavedCalculation[]) => {
  if (calculations.length === 0) {
    alert("Belum ada data simulasi untuk diunduh!");
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Landscape A4 size: 297mm width, 210mm height
    let y = 15;

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(15, y, 267, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('REKAPITULASI LAPORAN SIMULASI ROAS & PROFIT MARKETPLACE', 20, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Unduh Riwayat Simulasi | Ekspor Resmi PDF`, 20, y + 14);

    y += 26;

    // Print Metadata info
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 15, y);
    doc.text(`Total Simulasi: ${calculations.length} Item`, 220, y);

    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 282, y);
    y += 8;

    // Table Header Row
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 267, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    
    doc.text('Tanggal', 17, y + 5.5);
    doc.text('Platform', 40, y + 5.5);
    doc.text('Nama Produk', 58, y + 5.5);
    doc.text('Harga Jual', 132, y + 5.5, { align: 'right' });
    doc.text('HPP', 157, y + 5.5, { align: 'right' });
    doc.text('Pot. Admin', 187, y + 5.5, { align: 'right' });
    doc.text('B. Iklan', 212, y + 5.5, { align: 'right' });
    doc.text('Omset', 237, y + 5.5, { align: 'right' });
    doc.text('ROAS BEP', 260, y + 5.5, { align: 'right' });
    doc.text('Laba Bersih', 280, y + 5.5, { align: 'right' });

    y += 8;

    doc.setFont('helvetica', 'normal');
    calculations.forEach((calc, idx) => {
      // Page overflow check (Landscape A4 is 210mm high, so limit around 185mm)
      if (y > 185) {
        doc.addPage();
        y = 15;
        // Redraw header on new page
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(15, y, 267, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('REKAPITULASI LAPORAN SIMULASI ROAS & PROFIT MARKETPLACE (Sambungan)', 20, y + 6.5);
        
        y += 14;

        // Redraw Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 267, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text('Tanggal', 17, y + 5.5);
        doc.text('Platform', 40, y + 5.5);
        doc.text('Nama Produk', 58, y + 5.5);
        doc.text('Harga Jual', 132, y + 5.5, { align: 'right' });
        doc.text('HPP', 157, y + 5.5, { align: 'right' });
        doc.text('Pot. Admin', 187, y + 5.5, { align: 'right' });
        doc.text('B. Iklan', 212, y + 5.5, { align: 'right' });
        doc.text('Omset', 237, y + 5.5, { align: 'right' });
        doc.text('ROAS BEP', 260, y + 5.5, { align: 'right' });
        doc.text('Laba Bersih', 280, y + 5.5, { align: 'right' });
        
        y += 8;
      }

      // Row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 267, 7.5, 'F');
      }

      const r = calc.result;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);

      // Date & Platform
      doc.text(calc.date || '', 17, y + 5);
      
      // Platform Label with color
      if (calc.platform === 'Shopee') {
        doc.setTextColor(234, 88, 12);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
      }
      doc.text(calc.platform || '', 40, y + 5);

      // Name
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const nameTruncated = (r.productName || 'Tanpa Nama').slice(0, 22) + ((r.productName || '').length > 22 ? '...' : '');
      doc.text(nameTruncated, 58, y + 5);

      // Prices - RIGHT ALIGNED WITH SECURE COORDINATES
      doc.text(formatIDR(r.hargaJual), 132, y + 5, { align: 'right' });
      doc.text(formatIDR(r.hpp), 157, y + 5, { align: 'right' });
      doc.text(`${formatIDR(r.totalFeesRp)} (${r.totalAdminFeePct.toFixed(0)}%)`, 187, y + 5, { align: 'right' });
      doc.text(formatIDR(r.adSpend), 212, y + 5, { align: 'right' });
      doc.text(formatIDR(r.revenue), 237, y + 5, { align: 'right' });

      // ROAS BEP - RIGHT ALIGNED
      const roasText = `${r.breakEvenRoas.toFixed(1)}x`;
      doc.text(roasText, 260, y + 5, { align: 'right' });

      // NET PROFIT - RIGHT ALIGNED
      if (r.netProfitRp >= 0) {
        doc.setTextColor(21, 128, 61); // Green
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(185, 28, 28); // Red
        doc.setFont('helvetica', 'bold');
      }
      const profitSign = r.netProfitRp < 0 ? '-' : '';
      doc.text(`${profitSign}${formatIDR(Math.abs(r.netProfitRp))}`, 280, y + 5, { align: 'right' });

      y += 7.5;
    });

    // Disclaimer Footer on the last page
    y += 6;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.text('* Laporan hasil ekspor ringkasan simulasi historis toko online. Hak Cipta © 2026. Rahasia dan Lokal.', 15, y);

    doc.save(`Ringkasan_Laporan_ROAS_Marketplace_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Gagal mendownload PDF rekapitulasi.');
  }
};
