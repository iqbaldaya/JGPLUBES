import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  Droplets,
  Flame,
  Award,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

export const QuarterlyReportGenerator: React.FC = () => {
  const { branches, products, dailySales, suppliers, supplierTransactions, lowStockAlerts } = useApp();

  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  // Determine date ranges for the quarter
  const quarterDateRanges: Record<string, { startMonth: number; endMonth: number; label: string }> = {
    Q1: { startMonth: 1, endMonth: 3, label: 'Quarter 1 (Jan 01 - Mar 31)' },
    Q2: { startMonth: 4, endMonth: 6, label: 'Quarter 2 (Apr 01 - Jun 30)' },
    Q3: { startMonth: 7, endMonth: 9, label: 'Quarter 3 (Jul 01 - Sep 30)' },
    Q4: { startMonth: 10, endMonth: 12, label: 'Quarter 4 (Oct 01 - Dec 31)' },
  };

  const currentQRange = quarterDateRanges[selectedQuarter];

  // Filter sales for the selected quarter and branch
  const filteredSales = dailySales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const saleYear = saleDate.getFullYear();
    const saleMonth = saleDate.getMonth() + 1;

    const matchesPeriod =
      saleYear === selectedYear &&
      saleMonth >= currentQRange.startMonth &&
      saleMonth <= currentQRange.endMonth;

    const matchesBranch = selectedBranchId === 'ALL' || sale.branchId === selectedBranchId;
    return matchesPeriod && matchesBranch;
  });

  // Calculate Aggregates
  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + s.totalCostAmount, 0);
  const totalGrossProfit = filteredSales.reduce((sum, s) => sum + s.grossProfit, 0);
  const grossMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;

  // Volume Aggregates
  let lubesLiters = 0;
  let lubesRevenue = 0;
  let lpgKg = 0;
  let lpgRevenue = 0;

  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.category === 'LUBRICANTS') {
        lubesLiters += item.volumePerUnit * item.quantity;
        lubesRevenue += item.totalAmount;
      } else if (item.category === 'LPG') {
        lpgKg += item.volumePerUnit * item.quantity;
        lpgRevenue += item.totalAmount;
      }
    });
  });

  const totalCashCollected = filteredSales.reduce((sum, s) => sum + s.actualCashReceived, 0);
  const totalAirtelMoney = filteredSales.reduce((sum, s) => sum + s.cashSentToAirtelMoney, 0);
  const totalCashVariance = filteredSales.reduce((sum, s) => sum + s.cashVariance, 0);

  // Branch Performance Table for Report
  const targetBranches = selectedBranchId === 'ALL'
    ? branches
    : branches.filter((b) => b.id === selectedBranchId);

  const branchReportData = targetBranches.map((branch) => {
    const bSales = filteredSales.filter((s) => s.branchId === branch.id);
    const rev = bSales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
    const profit = bSales.reduce((sum, s) => sum + s.grossProfit, 0);
    const oilVol = bSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.category === 'LUBRICANTS')
          .reduce((iSum, i) => iSum + i.volumePerUnit * i.quantity, 0),
      0
    );
    const gasVol = bSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.category === 'LPG')
          .reduce((iSum, i) => iSum + i.volumePerUnit * i.quantity, 0),
      0
    );
    const variance = bSales.reduce((sum, s) => sum + s.cashVariance, 0);

    return {
      branchName: branch.name,
      branchCode: branch.code,
      lubesChamp: branch.lubesChamp,
      revenue: rev,
      profit,
      oilVol,
      gasVol,
      variance,
      quarterTarget: branch.targetMonthlySales * 3,
      targetProgress: branch.targetMonthlySales * 3 > 0 ? (rev / (branch.targetMonthlySales * 3)) * 100 : 0,
    };
  });

  // Export to PDF using jsPDF & autoTable
  const exportQuarterlyPDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor = [28, 25, 23]; // stone-900
      const accentColor = [217, 119, 6]; // amber-600

      // Title & Header Block
      doc.setFillColor(28, 25, 23);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('LUBES & LPG ENTERPRISE OPERATIONS', 14, 14);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(251, 191, 36); // amber-400
      doc.text(
        `QUARTERLY BUSINESS PERFORMANCE REPORT: ${selectedQuarter} ${selectedYear}`,
        14,
        22
      );

      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(
        `Scope: ${
          selectedBranchId === 'ALL' ? 'Consolidated Enterprise (All Branches)' : targetBranches[0]?.name
        }  |  Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        14,
        28
      );

      // Section 1: Executive KPI Summary Box
      let currentY = 40;
      doc.setTextColor(28, 25, 23);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. EXECUTIVE FINANCIAL SUMMARY', 14, currentY);

      currentY += 6;
      autoTable(doc, {
        startY: currentY,
        head: [['Key Metric', 'Performance Value', 'Benchmark / Notes']],
        body: [
          [
            'Gross Sales Revenue',
            `K ${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            'Total verified retail & wholesale receipts',
          ],
          [
            'Cost of Goods Sold (COGS)',
            `K ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            'Procurement cost of sold lubricants & LPG',
          ],
          [
            'Gross Profit & Margin',
            `K ${totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${grossMargin.toFixed(1)}%)`,
            'Net product gross margin',
          ],
          [
            'Motor Oils (Lubes) Volume Sold',
            `${lubesLiters.toLocaleString()} Liters (K ${lubesRevenue.toLocaleString()})`,
            'Synthetic, Heavy Duty Diesel, 2T, Hydraulic',
          ],
          [
            'LPG Cooking Gas Volume Sold',
            `${lpgKg.toLocaleString()} Kg (K ${lpgRevenue.toLocaleString()})`,
            '6kg, 13kg, 38kg, 45kg Refills & Kits',
          ],
          [
            'Cash Deposited to Airtel Money',
            `K ${totalAirtelMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            'Mobile money bank transfers & deposits',
          ],
          [
            'Cumulative Cash Reconciliation Variance',
            `K ${totalCashVariance >= 0 ? '+' : ''}${totalCashVariance.toFixed(2)}`,
            totalCashVariance === 0
              ? 'Balanced (Zero Discrepancy)'
              : 'Variance identified in daily drawer audits',
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [28, 25, 23], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      // Section 2: Branch & Lubes Champ Matrix
      currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(28, 25, 23);
      doc.text('2. BRANCH LOCATIONS & LUBES CHAMPS PERFORMANCE', 14, currentY);

      currentY += 6;
      autoTable(doc, {
        startY: currentY,
        head: [['Site Code', 'Branch Name', 'Lubes Champ', 'Lubes (L)', 'LPG (Kg)', 'Sales (K)', 'Profit (K)', 'Variance (K)']],
        body: branchReportData.map((b) => [
          b.branchCode,
          b.branchName,
          b.lubesChamp,
          b.oilVol.toLocaleString(),
          b.gasVol.toLocaleString(),
          b.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          b.profit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          b.variance.toFixed(2),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.2 },
      });

      // Section 3: Low Stock & Inventory Audit Status
      currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(28, 25, 23);
      doc.text('3. CRITICAL STOCK & REORDER DEFICITS', 14, currentY);

      currentY += 6;
      const relevantAlerts = selectedBranchId === 'ALL'
        ? lowStockAlerts
        : lowStockAlerts.filter((a) => a.branchId === selectedBranchId);

      if (relevantAlerts.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Branch', 'Product Code', 'Product Name', 'Current Stock', 'Safety Level', 'Deficit', 'Severity']],
          body: relevantAlerts.map((a) => [
            a.branchCode,
            a.productCode,
            a.productName,
            `${a.currentStock} ${a.unit}`,
            `${a.reorderThreshold} ${a.unit}`,
            `-${a.deficit}`,
            a.severity,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255] },
          styles: { fontSize: 7.5, cellPadding: 2 },
        });
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('All products at the selected site(s) are currently operating above safety reorder thresholds.', 14, currentY + 4);
      }

      // Footer with Sign-off
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('Authorized by Enterprise Owner / HQ Operations Management', 14, pageHeight - 12);
      doc.text(`Page 1 of 1  •  Confidential Internal Executive Report`, 140, pageHeight - 12);

      // Save PDF
      doc.save(`Quarterly_Performance_Report_${selectedQuarter}_${selectedYear}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Quarterly Performance Analytics &amp; Reporting</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Quarterly Performance Reports (PDF Generator)
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Export comprehensive quarterly audits covering sales volumes, gross profits, Lubes Champ league tables, Airtel Money throughput, and cash variances.
          </p>
        </div>

        <button
          id="btn-export-pdf-report"
          onClick={exportQuarterlyPDF}
          disabled={isGenerating}
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-sm shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>{isGenerating ? 'Compiling PDF...' : 'Download PDF Report'}</span>
        </button>
      </div>

      {/* Control Selector Bar */}
      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quarter Buttons */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-stone-300">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
              <button
                key={q}
                id={`btn-select-quarter-${q}`}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  selectedQuarter === q
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Year Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-500 font-semibold">Year:</span>
            <select
              id="select-report-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-500 font-semibold">Site Scope:</span>
            <select
              id="select-report-branch-filter"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
            >
              <option value="ALL">All Branches (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-stone-500 flex items-center space-x-1.5">
          <Calendar className="w-4 h-4 text-stone-400" />
          <span>Active Period: <strong>{currentQRange.label}, {selectedYear}</strong></span>
        </div>
      </div>

      {/* Printable Report Canvas & Live Preview */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Document Header Preview */}
        <div className="border-b border-stone-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Official Executive Performance Audit
            </div>
            <h3 className="text-2xl font-black text-stone-900">
              {selectedQuarter} {selectedYear} Financial &amp; Operational Statement
            </h3>
            <p className="text-xs text-stone-500">
              Scope: {selectedBranchId === 'ALL' ? 'Consolidated Enterprise Network' : targetBranches[0]?.name}
            </p>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-600 space-y-1">
            <div>Quarter Span: <strong>{currentQRange.label}</strong></div>
            <div>Total Verified Sales Logs: <strong>{filteredSales.length} records</strong></div>
            <div>Sites Audited: <strong>{targetBranches.length} locations</strong></div>
          </div>
        </div>

        {/* Section 1: Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase">Gross Sales Revenue</span>
            <div className="text-xl font-black text-stone-900 mt-1">
              K{totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">
              Gross Profit: K{totalGrossProfit.toLocaleString()} ({grossMargin.toFixed(1)}%)
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="text-xs font-bold text-blue-800 uppercase flex items-center space-x-1">
              <Droplets className="w-3.5 h-3.5" />
              <span>Motor Oils Volume</span>
            </span>
            <div className="text-xl font-black text-blue-950 mt-1">
              {lubesLiters.toLocaleString()} <span className="text-xs font-semibold text-stone-500">Liters</span>
            </div>
            <div className="text-xs text-stone-600 mt-0.5">
              Value: K{lubesRevenue.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <span className="text-xs font-bold text-amber-800 uppercase flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5" />
              <span>LPG Gas Volume</span>
            </span>
            <div className="text-xl font-black text-amber-950 mt-1">
              {lpgKg.toLocaleString()} <span className="text-xs font-semibold text-stone-500">Kg</span>
            </div>
            <div className="text-xs text-stone-600 mt-0.5">
              Value: K{lpgRevenue.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 uppercase">Airtel Money Transferred</span>
            <div className="text-xl font-black text-emerald-950 mt-1">
              K{totalAirtelMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-stone-600 mt-0.5">
              Cash Variance: K{totalCashVariance.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Section 2: Branch & Lubes Champ Table Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Site-by-Site Operational Performance &amp; Lubes Champs
          </h4>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Branch Name</th>
                  <th className="py-3 px-4">Lubes Champ</th>
                  <th className="py-3 px-4 text-right">Lubes Vol</th>
                  <th className="py-3 px-4 text-right">LPG Vol</th>
                  <th className="py-3 px-4 text-right">Sales Revenue</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {branchReportData.map((b) => (
                  <tr key={b.branchCode} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono font-bold text-stone-700">{b.branchCode}</td>
                    <td className="py-3 px-4 font-medium text-stone-900">{b.branchName}</td>
                    <td className="py-3 px-4 text-stone-700 font-semibold">{b.lubesChamp}</td>
                    <td className="py-3 px-4 text-right font-medium text-blue-900">{b.oilVol.toLocaleString()} L</td>
                    <td className="py-3 px-4 text-right font-medium text-amber-900">{b.gasVol.toLocaleString()} Kg</td>
                    <td className="py-3 px-4 text-right font-bold text-stone-900">
                      K{b.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      K{b.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={b.variance !== 0 ? 'text-red-600 font-bold' : 'text-stone-500'}>
                        K{b.variance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Low Stock Deficit Log */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Current Stock Health &amp; Deficit Audit
          </h4>

          {lowStockAlerts.length > 0 ? (
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200">
                  <tr>
                    <th className="py-2.5 px-4">Branch</th>
                    <th className="py-2.5 px-4">SKU Code</th>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4 text-right">Current Stock</th>
                    <th className="py-2.5 px-4 text-right">Safety Threshold</th>
                    <th className="py-2.5 px-4 text-right">Deficit</th>
                    <th className="py-2.5 px-4 text-center">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {lowStockAlerts.map((a) => (
                    <tr key={`${a.branchId}-${a.productId}`}>
                      <td className="py-2.5 px-4 font-medium">{a.branchName}</td>
                      <td className="py-2.5 px-4 font-mono">{a.productCode}</td>
                      <td className="py-2.5 px-4">{a.productName}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-red-600">{a.currentStock} {a.unit}</td>
                      <td className="py-2.5 px-4 text-right text-stone-600">{a.reorderThreshold} {a.unit}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-red-700">-{a.deficit}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {a.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-lg text-xs text-emerald-800 font-medium">
              ✓ All products across audited branches have optimal inventory levels above safety thresholds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
