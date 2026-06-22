import React, { useState, useEffect } from 'react';
import { SavedCalculation, FeeSettings } from '../types';
import { formatIDR, formatPercent, createNewSpreadsheet, writeCalculationsToSheet } from '../sheets';
import { googleSignIn, logout, getAccessToken, User } from '../auth';
import { 
  History, Trash2, FileSpreadsheet, LogIn, LogOut, CheckCircle, 
  ChevronRight, BarChart3, TrendingUp, DollarSign, Loader2, AlertCircle, 
  HelpCircle, ExternalLink, Copy, Settings,
  FileDown, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadHistoryPDF } from '../exportUtils';

interface SummaryDashboardProps {
  calculations: SavedCalculation[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  feeSettings: FeeSettings;
  user: User | null;
  needsAuth: boolean;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
}

export default function SummaryDashboard({
  calculations,
  onDelete,
  onClearAll,
  feeSettings,
  user,
  needsAuth,
  onAuthSuccess,
  onLogout
}: SummaryDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [successSheet, setSuccessSheet] = useState<{ id: string; url: string } | null>(() => {
    try {
      const saved = localStorage.getItem('roas_last_success_sheet');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);


  // Stats calculation
  const totalOmset = calculations.reduce((acc, c) => acc + c.result.revenue, 0);
  const totalAdSpend = calculations.reduce((acc, c) => acc + c.result.adSpend, 0);
  const totalProfit = calculations.reduce((acc, c) => acc + c.result.netProfitRp, 0);
  const avgRoas = totalAdSpend > 0 ? totalOmset / totalAdSpend : 0;

  const handleDownloadCSV = () => {
    if (calculations.length === 0) return;
    
    const headers = [
      "Tanggal",
      "Kanal",
      "Nama Produk",
      "Harga Jual (Rp)",
      "HPP (Rp)",
      "Total Potongan Biasa (%)",
      "Total Potongan Biasa (Rp)",
      "Biaya Tetap (Rp)",
      "Total Biaya Admin/Platform (Rp)",
      "Margin Sebelum Iklan (Rp)",
      "Margin Sebelum Iklan (%)",
      "ROAS BEP (x)",
      "ROAS Iklan (x)",
      "Biaya Iklan (Rp)",
      "Unit Terjual",
      "Revenue/Omset (Rp)",
      "Profit Bersih (Rp)",
      "Profit Bersih (%)"
    ];
    
    const rows = calculations.map(calc => {
      const r = calc.result;
      return [
        calc.date,
        calc.platform,
        `"${(r.productName || '').replace(/"/g, '""')}"`,
        r.hargaJual,
        r.hpp,
        r.totalAdminFeePct,
        r.totalAdminFeeRp,
        r.fixedFeeRp,
        r.totalFeesRp,
        r.marginBeforeAdsRp,
        r.marginBeforeAdsPct,
        r.breakEvenRoas,
        r.actualRoas,
        r.adSpend,
        r.quantitySold,
        r.revenue,
        r.netProfitRp,
        r.netProfitPct
      ];
    });
    
    // Adding standard UTF-8 BOM so Excel opens it with proper encoding
    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_ROAS_Marketplace_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    if (calculations.length === 0) return;

    let excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan ROAS</x:Name>
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
        th { background-color: #4F46E5; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 10px; text-align: center; }
        td { border: 1px solid #E2E8F0; padding: 8px; font-size: 11px; }
        .header-title { font-size: 16px; font-weight: bold; color: #1E293B; margin-bottom: 5px; }
        .header-date { font-size: 11px; color: #64748B; margin-bottom: 20px; }
        .shopee-badge { background-color: #FFEDE5; color: #EA580C; font-weight: bold; text-align: center; }
        .tiktok-badge { background-color: #F1F5F9; color: #0F172A; font-weight: bold; text-align: center; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-green { color: #16A34A; }
        .text-rose { color: #DC2626; }
        .text-amber { color: #D97706; }
        .summary-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; }
        .summary-value { font-size: 14px; font-weight: bold; color: #0F172A; }
        .summary-label { font-size: 10px; color: #64748B; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="header-title">LAPORAN BIAYA & ROAS MARKETPLACE</div>
      <div class="header-date">Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      
      <table>
        <tr>
          <td colspan="4" class="summary-card">
            <span class="summary-label">Total Omset</span><br/>
            <span class="summary-value">${formatIDR(totalOmset)}</span>
          </td>
          <td colspan="4" class="summary-card">
            <span class="summary-label">Total Biaya Iklan</span><br/>
            <span class="summary-value">${formatIDR(totalAdSpend)}</span>
          </td>
          <td colspan="4" class="summary-card">
            <span class="summary-label">ROAS Rata-rata</span><br/>
            <span class="summary-value">${avgRoas.toFixed(2)}x</span>
          </td>
          <td colspan="5" class="summary-card">
            <span class="summary-label">Total Profit Bersih</span><br/>
            <span class="summary-value">${formatIDR(totalProfit)}</span>
          </td>
        </tr>
      </table>
      <br/>

      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Platform</th>
            <th>Nama Produk</th>
            <th>Harga Jual</th>
            <th>HPP</th>
            <th>Biaya Admin Potongan</th>
            <th>Biaya Tetap</th>
            <th>Total Biaya Admin</th>
            <th>Margin Sebelum Iklan (%)</th>
            <th>ROAS BEP</th>
            <th>ROAS Iklan</th>
            <th>Biaya Iklan</th>
            <th>Unit Terjual</th>
            <th>Omset (Revenue)</th>
            <th>Profit Bersih (Rp)</th>
            <th>Profit Bersih (%)</th>
          </tr>
        </thead>
        <tbody>
    `;

    calculations.forEach(calc => {
      const r = calc.result;
      const isShopee = calc.platform === 'Shopee';
      const profitClass = r.netProfitRp >= 0 ? 'text-green' : 'text-rose';
      const actualRoasClass = r.actualRoas >= r.breakEvenRoas ? 'text-green' : 'text-rose';

      excelHtml += `
        <tr>
          <td class="text-center">${calc.date}</td>
          <td class="text-center"><span class="${isShopee ? 'shopee-badge' : 'tiktok-badge'}">${calc.platform}</span></td>
          <td class="font-bold">${r.productName || 'Tanpa Nama'}</td>
          <td class="text-right">${r.hargaJual}</td>
          <td class="text-right">${r.hpp}</td>
          <td class="text-right">${r.totalAdminFeeRp} (${r.totalAdminFeePct.toFixed(1)}%)</td>
          <td class="text-right">${r.fixedFeeRp}</td>
          <td class="text-right font-bold">${r.totalFeesRp}</td>
          <td class="text-right font-bold">${r.marginBeforeAdsRp} (${r.marginBeforeAdsPct.toFixed(1)}%)</td>
          <td class="text-center font-bold text-amber">${r.breakEvenRoas.toFixed(2)}x</td>
          <td class="text-center font-bold ${actualRoasClass}">${r.actualRoas.toFixed(2)}x</td>
          <td class="text-right">${r.adSpend}</td>
          <td class="text-center">${r.quantitySold}</td>
          <td class="text-right font-bold">${r.revenue}</td>
          <td class="text-right font-bold ${profitClass}">${r.netProfitRp}</td>
          <td class="text-right ${profitClass}">${r.netProfitPct.toFixed(1)}%</td>
        </tr>
      `;
    });

    excelHtml += `
        </tbody>
      </table>
    </body>
    </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_ROAS_Marketplace_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    downloadHistoryPDF(calculations);
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block mb-1">Total Omset</span>
            <span className="text-xl font-extrabold text-slate-800">{formatIDR(totalOmset)}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block mb-1">Total Biaya Iklan</span>
            <span className="text-xl font-extrabold text-slate-800">{formatIDR(totalAdSpend)}</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block mb-1">ROAS Rata-rata</span>
            <span className={`text-xl font-extrabold ${avgRoas >= 3 ? 'text-emerald-600' : 'text-slate-800'}`}>
              {avgRoas.toFixed(2)}x
            </span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <BarChart3 size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block mb-1">Total Profit Bersih</span>
            <span className={`text-xl font-extrabold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalProfit < 0 ? '-' : ''}{formatIDR(Math.abs(totalProfit))}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Historical List Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Riwayat Perhitungan & Analisis</h3>
              <p className="text-xs text-slate-400">Total {calculations.length} simulasi tersimpan di sesi browser lokal ini.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {calculations.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="px-3 py-2 border bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300 text-amber-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                  title="Unduh format Excel (.xls)"
                >
                  <FileDown size={13} />
                  Excel (.xls)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-3 py-2 border bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                  title="Unduh format CSV (.csv)"
                >
                  <FileDown size={13} />
                  CSV
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-3 py-2 border bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-300 text-rose-750 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                  title="Download Ringkasan Laporan PDF"
                >
                  <FileDown size={13} className="text-rose-600" />
                  Download PDF 📄
                </button>
              </>
            )}

            {calculations.length > 0 && (
              <div className="flex items-center gap-2">
                {isConfirmingClear ? (
                  <div className="flex items-center gap-1.5 bg-rose-50/85 p-1 rounded-lg border border-rose-100 shadow-sm animate-pulse-once">
                    <span className="text-[10px] text-rose-700 font-extrabold px-1">Hapus?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setIsConfirmingClear(false);
                      }}
                      className="text-[10px] text-white font-black px-2.5 py-1 bg-rose-600 hover:bg-rose-700 rounded-md transition cursor-pointer shadow-sm active:scale-95"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClear(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 font-extrabold px-2 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={13} />
                    Kosongkan Semua
                  </button>
                )}
              </div>
            )}
          </div>
        </div>


        {errorText && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-800">Gagal Melakukan Ekspor</h4>
              <p className="text-xs text-rose-600 mt-1">{errorText}</p>
            </div>
          </div>
        )}

        {successSheet && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800">Ekspor Berhasil & Sukses Ditulis!</h4>
                <p className="text-xs text-emerald-600 mt-1">Laporan keuangan & analisa ROAS telah berhasil dilapisi ke target Google Sheets.</p>
              </div>
            </div>
            <a 
              href={successSheet.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition whitespace-nowrap shadow-sm text-center active:scale-95 duration-100"
            >
              Buka Google Sheets ↗
            </a>
          </div>
        )}

        {calculations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <History size={20} />
            </div>
            <h4 className="text-slate-700 font-bold text-sm">Belum ada riwayat tersimpan</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Silakan isi form HPP & ROAS di tab Shopee, lalu klik button "Simpan Hitungan" untuk menjadikannya laporan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="saved-simulations-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-2">Kanal / Produk</th>
                  <th className="py-3 px-2 text-right">Harga Jual / HPP</th>
                  <th className="py-3 px-2 text-center">Admin Pot.</th>
                  <th className="py-3 px-2 text-center">B. Iklan / Qty</th>
                  <th className="py-3 px-2 text-center">ROAS BEP</th>
                  <th className="py-3 px-2 text-center">ROAS Iklan</th>
                  <th className="py-3 px-2 text-right">Profit Bersih</th>
                  <th className="py-3 px-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc) => {
                  const r = calc.result;
                  const isProfitable = r.isCampaignProfitable;
                  return (
                    <tr key={calc.id} className="border-b border-slate-50 text-xs hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${calc.platform === 'Shopee' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-900 text-white'}`}>
                            {calc.platform}
                          </span>
                          <span className="text-[10px] text-slate-400">{calc.date}</span>
                        </div>
                        <span className="font-bold text-slate-800 block mt-1">
                          {r.productName || "Produk Tanpa Nama"}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 text-right">
                        <span className="font-bold text-slate-800 block">{formatIDR(r.hargaJual)}</span>
                        <span className="text-[10px] text-slate-400 block">HPP: {formatIDR(r.hpp)}</span>
                      </td>

                      <td className="py-3.5 px-2 text-center font-bold text-slate-600">
                        {formatIDR(r.totalFeesRp)}
                        <span className="text-[9px] text-slate-400 block font-normal">({r.totalAdminFeePct.toFixed(1)}%)</span>
                      </td>

                      <td className="py-3.5 px-2 text-center font-bold text-slate-700">
                        {formatIDR(r.adSpend)}
                        <span className="text-[9px] text-slate-400 block font-normal">Qty: {r.quantitySold} Pcs</span>
                      </td>

                      <td className="py-3.5 px-2 text-center font-extrabold text-amber-600">
                        {r.breakEvenRoas.toFixed(2)}x
                      </td>

                      <td className="py-3.5 px-2 text-center font-black">
                        <span className={r.actualRoas >= r.breakEvenRoas ? 'text-emerald-600' : 'text-rose-500'}>
                          {r.actualRoas.toFixed(2)}x
                        </span>
                      </td>

                      <td className={`py-3.5 px-2 text-right font-black ${isProfitable ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {r.netProfitRp < 0 ? '-' : ''}{formatIDR(Math.abs(r.netProfitRp))}
                        <span className="text-[9px] block font-normal">({r.netProfitPct.toFixed(1)}%)</span>
                      </td>

                      <td className="py-3.5 px-2 text-center">
                        <button
                          onClick={() => onDelete(calc.id)}
                          className="p-1 px-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* printable container - only visible during print window */}
      <div id="print-report-container" className="">
        <style dangerouslySetInnerHTML={{ __html: `
          #print-report-container {
            display: none !important;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body.print-mode-dashboard * {
              visibility: hidden !important;
            }
            body.print-mode-dashboard #print-report-container, 
            body.print-mode-dashboard #print-report-container * {
              visibility: visible !important;
            }
            body.print-mode-dashboard #print-report-container {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
            }
            tr { page-break-inside: avoid !important; }
          }
        `}} />
        
        <div className="font-sans text-black bg-white p-6 md:p-8 max-w-4xl mx-auto">
          <div className="flex border-b-2 border-slate-800 pb-4 justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">LAPORAN BIAYA & ROAS MARKETPLACE</h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Dihasilkan secara otomatis oleh Aplikasi ROAS Marketplace
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block">Tanggal Laporan</span>
              <span className="text-[11px] text-slate-500 block">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 my-6">
            <div className="border border-slate-300 p-3 rounded-lg bg-slate-50">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Total Omset</span>
              <span className="text-base font-extrabold text-slate-800">{formatIDR(totalOmset)}</span>
            </div>
            <div className="border border-slate-300 p-3 rounded-lg bg-slate-50">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Total B. Iklan</span>
              <span className="text-base font-extrabold text-slate-800">{formatIDR(totalAdSpend)}</span>
            </div>
            <div className="border border-slate-300 p-3 rounded-lg bg-slate-50">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Avg ROAS</span>
              <span className="text-base font-extrabold text-slate-800">{avgRoas.toFixed(2)}x</span>
            </div>
            <div className="border border-slate-300 p-3 rounded-lg bg-slate-50">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Total Profit</span>
              <span className="text-base font-extrabold text-slate-800">{formatIDR(totalProfit)}</span>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-black border-b border-slate-300 pb-2 mb-3 text-slate-800 uppercase tracking-widest">Detail Perhitungan</h3>
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase">
                  <th className="py-2">Tanggal / Platform</th>
                  <th className="py-2">Nama Produk</th>
                  <th className="py-2 text-right">Harga Jual</th>
                  <th className="py-2 text-right">HPP</th>
                  <th className="py-2 text-center">B. Admin</th>
                  <th className="py-2 text-center">B. Iklan</th>
                  <th className="py-2 text-center">ROAS BEP</th>
                  <th className="py-2 text-center">ROAS Akt.</th>
                  <th className="py-2 text-right">Profit Bersih</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc, idx) => {
                  const r = calc.result;
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-2 pr-2">
                        <span className="font-bold">{calc.platform}</span>
                        <span className="text-[8px] text-slate-500 block">{calc.date}</span>
                      </td>
                      <td className="py-2 font-medium">{r.productName || 'Tanpa Nama'}</td>
                      <td className="py-2 text-right font-medium">{formatIDR(r.hargaJual)}</td>
                      <td className="py-2 text-right font-medium">{formatIDR(r.hpp)}</td>
                      <td className="py-2 text-center font-medium">{formatIDR(r.totalFeesRp)}</td>
                      <td className="py-2 text-center font-medium">{formatIDR(r.adSpend)}</td>
                      <td className="py-2 text-center font-bold text-amber-700">{r.breakEvenRoas.toFixed(2)}x</td>
                      <td className="py-2 text-center font-black text-slate-800">{r.actualRoas.toFixed(2)}x</td>
                      <td className="py-2 text-right font-black">{formatIDR(r.netProfitRp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-300 mt-10 pt-4 flex justify-between items-center text-[9px] text-slate-400">
            <span>* Biaya admin platform dihitung sesuai regulasi Shopee yang beraliansi pada masing-masing tab kalkulasi.</span>
            <span className="italic">Dicetak pada {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
