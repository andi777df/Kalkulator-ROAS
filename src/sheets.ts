import { SavedCalculation, FeeSettings } from './types';

// Helper to format IDR currency for Indonesians
export const formatIDR = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

// Helper for percentages
export const formatPercent = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return "0,0%";
  return `${num.toFixed(1).replace('.', ',')}%`;
};

/**
 * Creates a new spreadsheet in the user's Google Drive.
 */
export const createNewSpreadsheet = async (
  accessToken: string,
  title: string,
  folderId?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const body: any = {
    name: title,
    mimeType: "application/vnd.google-apps.spreadsheet"
  };
  
  if (folderId) {
    body.parents = [folderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal membuat spreadsheet baru di Drive: ${errText}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.id,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.id}/edit`
  };
};

/**
 * Populates and formats the ROAS calculation spreadsheet.
 */
export const writeCalculationsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  calculations: SavedCalculation[],
  settings: FeeSettings
): Promise<void> => {
  // First, we fetch the spreadsheet metadata to get the actual first sheet name (usually Sheet1)
  const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  let sheetName = "Sheet1";
  let sheetId = 0;
  if (metaResponse.ok) {
    const metaData = await metaResponse.json();
    if (metaData.sheets && metaData.sheets.length > 0) {
      sheetName = metaData.sheets[0].properties.title || "Sheet1";
      sheetId = metaData.sheets[0].properties.sheetId || 0;
    }
  }

  // Build values matrix
  const values: any[][] = [];

  // Title Block
  values.push(["LAPORAN ANALISIS ROAS & KEUANGAN BISNIS (SHOPEE)"]);
  values.push([`Dihasilkan otomatis oleh Aplikasi ROAS pada: ${new Date().toLocaleString('id-ID')}`]);
  values.push([]); // Empty row
  
  // Settings Summary Tab
  values.push(["RINGKASAN BIAYA ADMIN YANG DISETTING"]);
  values.push(["Platform", "Biaya Admin/Komisi %", "Gratis Ongkir %", "Cashback %", "Komisi Affiliate %", "Biaya Voucher Toko %", "Voucher Follow %", "Biaya Tetap per Produk", "Lain-lain %"]);
  values.push([
    "Shopee", 
    settings.shopee.adminFeeEnabled !== false ? settings.shopee.adminFeePct / 100 : 0, 
    settings.shopee.gratisOngkirEnabled !== false ? settings.shopee.gratisOngkirPct / 100 : 0, 
    settings.shopee.cashbackEnabled !== false ? settings.shopee.cashbackPct / 100 : 0, 
    settings.shopee.affiliateEnabled === true ? settings.shopee.affiliatePct / 100 : 0, 
    settings.shopee.voucherTokoEnabled === true ? (settings.shopee.voucherTokoPct || 0) / 100 : 0, 
    settings.shopee.voucherFollowEnabled === true ? (settings.shopee.voucherFollowPct || 0) / 100 : 0, 
    settings.shopee.fixedFeeEnabled !== false ? settings.shopee.fixedFee : 0, 
    settings.shopee.otherFeeEnabled !== false ? settings.shopee.otherFeePct / 100 : 0
  ]);

  values.push([]); // Empty row
  values.push([]); // Empty row

  // Table Headers
  values.push([
    "No",
    "Tanggal Hitung",
    "Platform",
    "Nama Produk",
    "HPP Produk (Rp)",
    "Harga Jual (Rp)",
    "Target Net Profit (%)",
    "Total Biaya Layanan & Admin (Rp)",
    "Margin Sebelum Iklan (Rp)",
    "Margin Sebelum Iklan (%)",
    "Break-Even ROAS (BEP)",
    "Target ROAS Iklan",
    "Biaya Iklan (Rp)",
    "Qty Produk Terjual",
    "Total Omset (Rp)",
    "Profit Bersih (Rp)",
    "Net Margin Profit (%)"
  ]);

  // Insert records
  calculations.forEach((calc, index) => {
    const r = calc.result;
    values.push([
      index + 1,
      calc.date,
      calc.platform,
      r.productName || "Produk " + (index + 1),
      r.hpp,               
      r.hargaJual,
      r.targetProfitPct / 100,
      r.totalFeesRp,
      r.marginBeforeAdsRp,
      r.marginBeforeAdsPct / 100,
      r.breakEvenRoas,
      r.targetRoasFeasible ? r.targetRoas : "N/A",
      r.adSpend,
      r.quantitySold,
      r.revenue,
      r.netProfitRp,
      r.netProfitPct / 100
    ]);
  });

  // Calculate global summary row dynamically
  const count = calculations.length;
  let sumHpp = 0;
  let sumHargaJual = 0;
  let sumTotalFees = 0;
  let sumMarginBeforeAds = 0;
  let sumAdSpend = 0;
  let sumQty = 0;
  let sumRevenue = 0;
  let sumProfit = 0;

  let sumTargetProfitPct = 0;
  let sumMarginBeforeAdsPct = 0;
  let sumBreakEvenRoas = 0;
  let sumTargetRoas = 0;
  let targetRoasCount = 0;
  let sumNetProfitPct = 0;

  calculations.forEach(calc => {
    const r = calc.result;
    sumHpp += r.hpp;
    sumHargaJual += r.hargaJual;
    sumTotalFees += r.totalFeesRp;
    sumMarginBeforeAds += r.marginBeforeAdsRp;
    sumAdSpend += r.adSpend;
    sumQty += r.quantitySold;
    sumRevenue += r.revenue;
    sumProfit += r.netProfitRp;

    sumTargetProfitPct += r.targetProfitPct;
    sumMarginBeforeAdsPct += r.marginBeforeAdsPct;
    sumBreakEvenRoas += r.breakEvenRoas;
    
    if (r.targetRoasFeasible) {
      sumTargetRoas += r.targetRoas;
      targetRoasCount++;
    }
    sumNetProfitPct += r.netProfitPct;
  });

  const avgHpp = sumHpp / count;
  const avgHargaJual = sumHargaJual / count;
  const avgTargetProfitPct = sumTargetProfitPct / count;
  const avgMarginBeforeAdsPct = sumMarginBeforeAdsPct / count;
  const avgBreakEvenRoas = sumBreakEvenRoas / count;
  const avgTargetRoas = targetRoasCount > 0 ? (sumTargetRoas / targetRoasCount) : 0;
  const avgNetProfitPct = sumNetProfitPct / count;

  // Append summary row
  values.push([
    "TOTAL / RATA-RATA",
    "-",
    "-",
    "-",
    sumHpp,
    sumHargaJual,
    avgTargetProfitPct / 100,
    sumTotalFees,
    sumMarginBeforeAds,
    avgMarginBeforeAdsPct / 100,
    avgBreakEvenRoas,
    avgTargetRoas > 0 ? avgTargetRoas : "N/A",
    sumAdSpend,
    sumQty,
    sumRevenue,
    sumProfit,
    avgNetProfitPct / 100
  ]);

  // Write all rows to the first sheet starting at A1
  const updateRange = `'${sheetName}'!A1:Q${values.length + 10}`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: updateRange,
        majorDimension: "ROWS",
        values: values
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal menulis data ke spreadsheet: ${errText}`);
  }

  // Design beautiful styling and formatting
  const requests: any[] = [
    // 1. Title block merge & presentation (Dark Slate Theme #0F172A)
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 18 },
        mergeType: "MERGE_ALL"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.059, green: 0.09, blue: 0.165 }, // Slate-900 (#0F172A)
            textFormat: { foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, fontSize: 13, bold: true },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE"
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
      }
    },
    // 2. Subtitle block merge & italic format
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 18 },
        mergeType: "MERGE_ALL"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.97, green: 0.98, blue: 0.99 }, // Slate-50 (#F8FAFC)
            textFormat: { foregroundColor: { red: 0.28, green: 0.35, blue: 0.44 }, fontSize: 9, italic: true },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE"
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
      }
    },

    // 3. Settings Summary block formatting
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 9 },
        mergeType: "MERGE_ALL"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.91, green: 0.94, blue: 0.97 }, // Slate-200
            textFormat: { foregroundColor: { red: 0.06, green: 0.1, blue: 0.18 }, fontSize: 10, bold: true },
            horizontalAlignment: "LEFT",
            verticalAlignment: "MIDDLE"
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.94, green: 0.96, blue: 0.98 }, // Slate-100
            textFormat: { foregroundColor: { red: 0.18, green: 0.25, blue: 0.35 }, fontSize: 9, bold: true },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            borders: {
              top: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              bottom: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              left: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              right: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } }
            }
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,borders)"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 5, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            textFormat: { fontSize: 9 },
            verticalAlignment: "MIDDLE",
            borders: {
              top: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              bottom: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              left: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              right: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } }
            }
          }
        },
        fields: "userEnteredFormat(textFormat,verticalAlignment,borders)"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 5, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 1 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "LEFT",
            textFormat: { bold: true }
          }
        },
        fields: "userEnteredFormat(horizontalAlignment,textFormat)"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 5, endRowIndex: 7, startColumnIndex: 1, endColumnIndex: 7 },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: "PERCENT", pattern: "0.0%" },
            horizontalAlignment: "CENTER"
          }
        },
        fields: "userEnteredFormat(numberFormat,horizontalAlignment)"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 5, endRowIndex: 7, startColumnIndex: 8, endColumnIndex: 9 },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: "PERCENT", pattern: "0.0%" },
            horizontalAlignment: "CENTER"
          }
        },
        fields: "userEnteredFormat(numberFormat,horizontalAlignment)"
      }
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 5, endRowIndex: 7, startColumnIndex: 7, endColumnIndex: 8 },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" },
            horizontalAlignment: "RIGHT"
          }
        },
        fields: "userEnteredFormat(numberFormat,horizontalAlignment)"
      }
    },

    // 4. MAIN TABLE HEADER FORMATTING (Row 9, Teal Theme)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 9, endRowIndex: 10, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.059, green: 0.463, blue: 0.431 }, // Teal-700
            textFormat: { foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, bold: true, fontSize: 9.5 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP"
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)"
      }
    }
  ];

  // Alternating row designs for calculations
  for (let i = 0; i < count; i++) {
    const rIdx = 10 + i;
    const isEven = i % 2 === 0;
    const bg = isEven 
      ? { red: 1.0, green: 1.0, blue: 1.0 } 
      : { red: 0.97, green: 0.98, blue: 0.99 }; // Slate-50 (#F8FAFC)

    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: rIdx, endRowIndex: rIdx + 1, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: bg,
            textFormat: { fontSize: 9, color: { red: 0.1, green: 0.1, blue: 0.1 } },
            verticalAlignment: "MIDDLE",
            borders: {
              top: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              bottom: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              left: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } },
              right: { style: "SOLID", color: { red: 0.88, green: 0.91, blue: 0.94 } }
            }
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment,borders)"
      }
    });

    // Color net profits visually (Red for losses, deep green for wins)
    const c = calculations[i].result;
    if (c.netProfitRp < 0) {
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: rIdx, endRowIndex: rIdx + 1, startColumnIndex: 16, endColumnIndex: 17 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.99, green: 0.93, blue: 0.93 }, // Soft red
              textFormat: { foregroundColor: { red: 0.8, green: 0.15, blue: 0.15 }, bold: true }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)"
        }
      });
    } else {
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: rIdx, endRowIndex: rIdx + 1, startColumnIndex: 16, endColumnIndex: 17 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.93, green: 0.98, blue: 0.95 }, // Soft green
              textFormat: { foregroundColor: { red: 0.05, green: 0.45, blue: 0.2 }, bold: true }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)"
        }
      });
    }
  }

  // Column alignment / specific content formats (Data End index covers the total row too)
  const dataEndRow = 11 + count;
  const colFormatting = [
    // Cols 0, 1, 2 Center
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 0, endColumnIndex: 3 },
      userEnteredFormat: { horizontalAlignment: "CENTER" },
      fields: "userEnteredFormat(horizontalAlignment)"
    },
    // Col 3 Left (Nama Produk)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 3, endColumnIndex: 4 },
      userEnteredFormat: { horizontalAlignment: "LEFT" },
      fields: "userEnteredFormat(horizontalAlignment)"
    },
    // Col 4, 5 Currency (HPP, Harga Jual)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 4, endColumnIndex: 6 },
      userEnteredFormat: { horizontalAlignment: "RIGHT", numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 6 Percent (Target Net Profit)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 6, endColumnIndex: 7 },
      userEnteredFormat: { horizontalAlignment: "CENTER", numberFormat: { type: "PERCENT", pattern: "0.0%" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 7, 8 Currency (Fees, Margin sebelum iklan Rp)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 7, endColumnIndex: 9 },
      userEnteredFormat: { horizontalAlignment: "RIGHT", numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 9 Percent (Margin sebelum iklan %)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 9, endColumnIndex: 10 },
      userEnteredFormat: { horizontalAlignment: "CENTER", numberFormat: { type: "PERCENT", pattern: "0.0%" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 10, 11 Numbers (BEP, Target ROAS)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 10, endColumnIndex: 12 },
      userEnteredFormat: { horizontalAlignment: "CENTER", numberFormat: { type: "NUMBER", pattern: "0.00" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 12 Currency (Ad Spend)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 12, endColumnIndex: 13 },
      userEnteredFormat: { horizontalAlignment: "RIGHT", numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 13 Number whole (Qty sold)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 13, endColumnIndex: 14 },
      userEnteredFormat: { horizontalAlignment: "CENTER", numberFormat: { type: "NUMBER", pattern: "#,##0" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 14 Currency (Revenue)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 14, endColumnIndex: 15 },
      userEnteredFormat: { horizontalAlignment: "RIGHT", numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 15 Number (Actual ROAS)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 15, endColumnIndex: 16 },
      userEnteredFormat: { horizontalAlignment: "CENTER", numberFormat: { type: "NUMBER", pattern: "0.00" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 16 Currency (Net profit)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 16, endColumnIndex: 17 },
      userEnteredFormat: { horizontalAlignment: "RIGHT", numberFormat: { type: "CURRENCY", pattern: "\"Rp\"#,##0" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    },
    // Col 17 Percent (Net Profit %)
    {
      range: { sheetId, startRowIndex: 10, endRowIndex: dataEndRow, startColumnIndex: 17, endColumnIndex: 18 },
      userEnteredFormat: { horizontalAlignment: "CENTER", numberFormat: { type: "PERCENT", pattern: "0.0%" } },
      fields: "userEnteredFormat(horizontalAlignment,numberFormat)"
    }
  ];

  colFormatting.forEach(item => {
    requests.push({
      repeatCell: {
        range: item.range,
        cell: { userEnteredFormat: item.userEnteredFormat },
        fields: item.fields
      }
    });
  });

  // 5. Total summary row custom styling (Double Bottom Border Accounting Style)
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 10 + count, endRowIndex: 11 + count, startColumnIndex: 0, endColumnIndex: 18 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.88, green: 0.91, blue: 0.94 }, // Slate-200
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.059, green: 0.09, blue: 0.165 } },
          verticalAlignment: "MIDDLE",
          borders: {
            top: { style: "SOLID", color: { red: 0.1, green: 0.1, blue: 0.1 } },
            bottom: { style: "DOUBLE", color: { red: 0.1, green: 0.1, blue: 0.1 } }
          }
        }
      },
      fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment,borders)"
    }
  });

  // 6. Automatic column widths adjustment to prevent visual text cuts
  requests.push({
    autoResizeDimensions: {
      dimensions: {
        sheetId: sheetId,
        dimension: "COLUMNS",
        startIndex: 0,
        endIndex: 18
      }
    }
  });

  try {
    const formatRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      }
    );
    if (!formatRes.ok) {
      console.warn("Formatting skipped, but data has been written successfully.", await formatRes.text());
    }
  } catch (err) {
    console.error("Kesalahan formatting:", err);
  }
};
