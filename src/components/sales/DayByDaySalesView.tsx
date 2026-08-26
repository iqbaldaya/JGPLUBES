import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesRecord, SaleItem } from '../../types';
import { SalesAdjustmentModal } from './SalesAdjustmentModal';
import { SalesDeleteModal } from './SalesDeleteModal';
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Building2,
  UserCheck,
  Package,
  Droplets,
  Flame,
  DollarSign,
  Smartphone,
  Edit3,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface DayByDaySalesViewProps {
  branchIdFilter?: string | null;
}

interface DayAggregate {
  date: string;
  sales: DailySalesRecord[];
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  oilLiters: number;
  lpgKg: number;
  totalUnitsSold: number;
  actualCash: number;
  airtelSent: number;
  airtelDirect: number;
  cashVariance: number;
  hasDiscrepancy: boolean;
  productBreakdown: {
    productId: string;
    productName: string;
    productCode: string;
    category: 'LUBRICANTS' | 'LPG';
    unit: string;
    quantity: number;
    volumeLitersOrKg: number;
    totalAmount: number;
    totalCost: number;
    profit: number;
  }[];
}

export const DayByDaySalesView: React.FC<DayByDaySalesViewProps> = ({ branchIdFilter }) => {
  const { dailySales, branches } = useApp();

  const [selectedBranch, setSelectedBranch] = useState<string>(branchIdFilter || 'ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Modals state
  const [editingSale, setEditingSale] = useState<DailySalesRecord | null>(null);
  const [deletingSale, setDeletingSale] = useState<DailySalesRecord | null>(null);

  // Filter Sales
  const filteredSales = useMemo(() => {
    return dailySales.filter((sale) => {
      // Branch filter
      if (selectedBranch !== 'ALL' && sale.branchId !== selectedBranch) return false;

      // Date presets filter
      if (dateFilter === 'TODAY') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (sale.date !== todayStr) return false;
      } else if (dateFilter === 'LAST_7') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
        if (sale.date < sevenDaysStr) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        const currentMonthPrefix = new Date().toISOString().substring(0, 7);
        if (!sale.date.startsWith(currentMonthPrefix)) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && sale.date < customStartDate) return false;
        if (customEndDate && sale.date > customEndDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = sale.date.includes(q);
        const matchesBranch = sale.branchName.toLowerCase().includes(q) || sale.branchCode.toLowerCase().includes(q);
        const matchesChamp = sale.lubesChamp.toLowerCase().includes(q);
        const matchesProduct = sale.items.some((item) =>
          item.productName.toLowerCase().includes(q) || item.productCode.toLowerCase().includes(q)
        );
        if (!matchesDate && !matchesBranch && !matchesChamp && !matchesProduct) return false;
      }

      return true;
    });
  }, [dailySales, selectedBranch, dateFilter, customStartDate, customEndDate, searchQuery]);

  // Group by Day
  const dayAggregates = useMemo<DayAggregate[]>(() => {
    const map = new Map<string, DailySalesRecord[]>();

    filteredSales.forEach((sale) => {
      if (!map.has(sale.date)) {
        map.set(sale.date, []);
      }
      map.get(sale.date)!.push(sale);
    });

    // Sort dates descending
    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((dateStr) => {
      const salesForDay = map.get(dateStr)!;

      let totalRevenue = 0;
      let totalCost = 0;
      let oilLiters = 0;
      let lpgKg = 0;
      let totalUnitsSold = 0;
      let actualCash = 0;
      let airtelSent = 0;
      let airtelDirect = 0;
      let cashVariance = 0;

      const prodMap = new Map<string, any>();

      salesForDay.forEach((sale) => {
        totalRevenue += sale.totalSalesAmount;
        totalCost += sale.totalCostAmount;
        actualCash += sale.actualCashReceived;
        airtelSent += sale.cashSentToAirtelMoney;
        airtelDirect += sale.paymentBreakdown?.airtelMoneyDirectSales || 0;
        cashVariance += sale.cashVariance;

        sale.items.forEach((item) => {
          totalUnitsSold += item.quantity;
          if (item.category === 'LUBRICANTS') {
            oilLiters += (item.volumePerUnit || 1) * item.quantity;
          } else if (item.category === 'LPG') {
            lpgKg += (item.volumePerUnit || 6) * item.quantity;
          }

          if (!prodMap.has(item.productId)) {
            prodMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              category: item.category,
              unit: item.unit,
              quantity: 0,
              volumeLitersOrKg: 0,
              totalAmount: 0,
              totalCost: 0,
              profit: 0,
            });
          }

          const existing = prodMap.get(item.productId)!;
          existing.quantity += item.quantity;
          existing.volumeLitersOrKg += (item.volumePerUnit || 1) * item.quantity;
          existing.totalAmount += item.totalAmount;
          existing.totalCost += item.totalCost;
          existing.profit += item.profit;
        });
      });

      const productBreakdown = Array.from(prodMap.values()).sort(
        (a, b) => b.totalAmount - a.totalAmount
      );

      return {
        date: dateStr,
        sales: salesForDay,
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
        oilLiters,
        lpgKg,
        totalUnitsSold,
        actualCash,
        airtelSent,
        airtelDirect,
        cashVariance,
        hasDiscrepancy: Math.abs(cashVariance) > 0.01,
        productBreakdown,
      };
    });
  }, [filteredSales]);

  // Toggle accordion expand
  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Summary figures across current filter
  const grandTotalRevenue = dayAggregates.reduce((sum, d) => sum + d.totalRevenue, 0);
  const grandTotalProfit = dayAggregates.reduce((sum, d) => sum + d.grossProfit, 0);
  const grandTotalOilLiters = dayAggregates.reduce((sum, d) => sum + d.oilLiters, 0);
  const grandTotalLpgKg = dayAggregates.reduce((sum, d) => sum + d.lpgKg, 0);

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <CalendarDays className="w-4 h-4" />
              <span>Owner Sales Portal • Daily Aggregates</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Day-by-Day Sales &amp; Reconciliation Journal
            </h2>
            <p className="text-xs text-slate-500">
              Inspect daily enterprise revenues, volume breakdowns, shift cash reconciliations, and perform authorized adjustments or removals.
            </p>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Days ({dayAggregates.length})
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'TODAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('LAST_7')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'LAST_7'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateFilter('THIS_MONTH')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'THIS_MONTH'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('CUSTOM')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'CUSTOM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Filter Details & Search Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by date, product SKU, Lubes Champ, site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white transition"
            />
          </div>

          {!branchIdFilter && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Branch Sites</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Period Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            K{grandTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Gross Profit: +K{grandTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Lubes Volume Sold</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {grandTotalOilLiters.toLocaleString()} Liters
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all engine &amp; gear oils</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>LPG Gas Volume Sold</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {grandTotalLpgKg.toLocaleString()} Kg
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Refills &amp; Complete Starter Kits</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Logged Daily Entries</span>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {dayAggregates.length} Days
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {filteredSales.length} Total Shift Records
          </div>
        </div>
      </div>

      {/* Day by Day List */}
      <div className="space-y-4">
        {dayAggregates.length > 0 ? (
          dayAggregates.map((day) => {
            const isExpanded = expandedDates[day.date] ?? true; // expanded by default for easy viewing
            const dateObj = new Date(`${day.date}T00:00:00`);
            const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={day.date}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Day Header Accordion */}
                <div
                  onClick={() => toggleDate(day.date)}
                  className="p-5 bg-gradient-to-r from-slate-50 to-white hover:from-blue-50/40 hover:to-white cursor-pointer border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className="p-3 bg-blue-600 text-white rounded-xl text-center min-w-[58px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider leading-none">
                        {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xl font-black leading-tight">{dateObj.getDate()}</div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-base">{dayOfWeek}, {formattedDate}</h3>
                        <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {day.date}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>{day.sales.length} Site Shift {day.sales.length === 1 ? 'Record' : 'Records'}</span>
                        <span>•</span>
                        <span>{day.totalUnitsSold} Total Units Sold</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-blue-700 font-semibold">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{day.oilLiters}L Oil</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{day.lpgKg}kg Gas</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end space-x-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Day Total Sales</div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        K{day.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Profit: +K{day.grossProfit.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Cash Status</div>
                      <div
                        className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                          day.hasDiscrepancy
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {day.hasDiscrepancy
                          ? `Variance: ${day.cashVariance < 0 ? `-K${Math.abs(day.cashVariance)}` : `+K${day.cashVariance}`}`
                          : '✓ Balanced'}
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Day Details Drawer */}
                {isExpanded && (
                  <div className="p-5 space-y-6 bg-slate-50/40">
                    {/* 1. Products Sold on this Day (Summary Table) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Products Sold on {formattedDate} (Aggregated SKUs)</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {day.productBreakdown.length} distinct products sold across branches
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Product SKU &amp; Name</th>
                              <th className="py-2.5 px-2">Category</th>
                              <th className="py-2.5 px-2 text-center">Unit</th>
                              <th className="py-2.5 px-2 text-center font-bold">Total Qty Sold</th>
                              <th className="py-2.5 px-2 text-center">Volume (L/Kg)</th>
                              <th className="py-2.5 px-3 text-right">Revenue (K)</th>
                              <th className="py-2.5 px-3 text-right">Gross Profit (K)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {day.productBreakdown.map((item) => (
                              <tr key={item.productId} className="hover:bg-slate-50">
                                <td className="py-2 px-3">
                                  <div className="font-bold text-slate-900">{item.productName}</div>
                                  <div className="font-mono text-[10px] text-slate-500">{item.productCode}</div>
                                </td>
                                <td className="py-2 px-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      item.category === 'LUBRICANTS'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {item.category === 'LUBRICANTS' ? 'LUBRICANT' : 'LPG GAS'}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-center text-slate-600">{item.unit}</td>
                                <td className="py-2 px-2 text-center font-black text-slate-900 text-sm">
                                  {item.quantity}
                                </td>
                                <td className="py-2 px-2 text-center font-medium text-slate-600">
                                  {item.volumeLitersOrKg} {item.category === 'LUBRICANTS' ? 'L' : 'Kg'}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-slate-900">
                                  K{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                  +K{item.profit.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Shift Sales Records for this day (with Adjustment and Delete capabilities) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Building2 className="w-4 h-4 text-slate-600" />
                          <span>Branch Shift Sales Logs &amp; Reconciliations</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Click "Adjust" to correct quantities/prices or "Delete" to purge
                        </span>
                      </div>

                      <div className="space-y-3">
                        {day.sales.map((sale) => {
                          const hasVariance = Math.abs(sale.cashVariance) > 0.01;

                          return (
                            <div
                              key={sale.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                                      {sale.branchCode}
                                    </span>
                                    <h5 className="font-bold text-slate-900 text-sm">{sale.branchName}</h5>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                      {sale.shift}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <div className="flex items-center space-x-1">
                                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Champ: <strong className="text-slate-700">{sale.lubesChamp}</strong></span>
                                    </div>
                                    <span>
                                      Items Sold: <strong>{sale.items.length} SKUs ({sale.items.reduce((s, i) => s + i.quantity, 0)} units)</strong>
                                    </span>
                                    {sale.cashSentToAirtelMoney > 0 && (
                                      <span className="flex items-center space-x-1 text-red-700">
                                        <Smartphone className="w-3 h-3" />
                                        <span>Airtel Deposit: <strong>K{sale.cashSentToAirtelMoney}</strong> ({sale.airtelMoneyTxRef})</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Numbers & Actions */}
                                <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-2 md:pt-0">
                                  <div className="text-right">
                                    <div className="text-xs text-slate-500">Shift Total</div>
                                    <div className="font-black text-slate-900 text-sm sm:text-base">
                                      K{sale.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs text-slate-500">Cash Variance</div>
                                    <span
                                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        hasVariance
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {hasVariance
                                        ? `${sale.cashVariance < 0 ? `-K${Math.abs(sale.cashVariance)}` : `+K${sale.cashVariance}`}`
                                        : 'Balanced'}
                                    </span>
                                  </div>

                                  {/* Authorized Owner Action Buttons */}
                                  <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSale(sale)}
                                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-blue-200"
                                      title="Adjust / Edit Sales Record"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Adjust</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setDeletingSale(sale)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition border border-red-200"
                                      title="Delete Sales Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Items list inside shift */}
                              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                                {sale.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-700"
                                  >
                                    <strong>{item.quantity}x</strong> {item.productName} (K{item.totalAmount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Sales Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No sales records match the selected date preset or branch site filter. Adjust your filter criteria or record a new shift sale.
            </p>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      <SalesAdjustmentModal
        sale={editingSale}
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        onDeleteRequested={(s) => {
          setEditingSale(null);
          setDeletingSale(s);
        }}
      />

      {/* Delete Modal */}
      <SalesDeleteModal
        sale={deletingSale}
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
      />
    </div>
  );
};
