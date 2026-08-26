import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesRecord, SaleItem } from '../../types';
import { SalesAdjustmentModal } from '../sales/SalesAdjustmentModal';
import { SalesDeleteModal } from '../sales/SalesDeleteModal';
import {
  Calendar,
  CalendarDays,
  Droplets,
  Flame,
  DollarSign,
  Smartphone,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Clock,
  Edit3,
  Trash2,
  TrendingUp,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

interface BranchDayToDaySalesSectionProps {
  branchId: string;
  onRecordSale?: () => void;
  title?: string;
  subtitle?: string;
}

interface DaySummary {
  date: string;
  dayLabel: string;
  sales: DailySalesRecord[];
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  oilLiters: number;
  lpgKg: number;
  oilUnits: number;
  lpgUnits: number;
  cashReceived: number;
  airtelSent: number;
  airtelDirect: number;
  bankOrCard: number;
  creditSales: number;
  cashVariance: number;
  items: {
    productId: string;
    productName: string;
    productCode: string;
    category: 'LUBRICANTS' | 'LPG';
    unit: string;
    volumePerUnit: number;
    quantity: number;
    totalVolume: number;
    totalAmount: number;
    profit: number;
  }[];
}

export const BranchDayToDaySalesSection: React.FC<BranchDayToDaySalesSectionProps> = ({
  branchId,
  onRecordSale,
  title,
  subtitle,
}) => {
  const { branches, dailySales } = useApp();

  const activeBranch = branches.find((b) => b.id === branchId) || branches[0];

  // Filters State
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'LUBRICANTS' | 'LPG'>('ALL');
  const [viewMode, setViewMode] = useState<'DAY_BY_DAY' | 'SHIFTS_LIST' | 'PRODUCT_VOLUMES'>('DAY_BY_DAY');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedSaleIds, setExpandedSaleIds] = useState<Record<string, boolean>>({});

  // Modals for editing and deleting shift sales
  const [editingSale, setEditingSale] = useState<DailySalesRecord | null>(null);
  const [deletingSale, setDeletingSale] = useState<DailySalesRecord | null>(null);

  // Get all sales for this specific branch
  const branchSales = useMemo(() => {
    return (dailySales || []).filter((s) => s.branchId === branchId);
  }, [dailySales, branchId]);

  // Apply filters
  const filteredSales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = yesterdayObj.toISOString().split('T')[0];

    const sevenDaysAgoObj = new Date();
    sevenDaysAgoObj.setDate(sevenDaysAgoObj.getDate() - 7);
    const sevenDaysAgo = sevenDaysAgoObj.toISOString().split('T')[0];

    const currentMonthPrefix = new Date().toISOString().substring(0, 7);

    return branchSales.filter((sale) => {
      // Date filter
      if (dateFilter === 'TODAY' && sale.date !== today) return false;
      if (dateFilter === 'YESTERDAY' && sale.date !== yesterday) return false;
      if (dateFilter === 'LAST_7' && sale.date < sevenDaysAgo) return false;
      if (dateFilter === 'THIS_MONTH' && !sale.date.startsWith(currentMonthPrefix)) return false;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && sale.date < customStartDate) return false;
        if (customEndDate && sale.date > customEndDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = sale.date.includes(q);
        const matchesChamp = (sale.lubesChamp || '').toLowerCase().includes(q);
        const matchesShift = (sale.shift || '').toLowerCase().includes(q);
        const matchesRef = (sale.airtelMoneyTxRef || '').toLowerCase().includes(q);
        const matchesItem = (sale.items || []).some(
          (item) =>
            item.productName.toLowerCase().includes(q) ||
            item.productCode.toLowerCase().includes(q)
        );
        if (!matchesDate && !matchesChamp && !matchesShift && !matchesRef && !matchesItem) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const hasCategoryItem = (sale.items || []).some((i) => i.category === categoryFilter);
        if (!hasCategoryItem) return false;
      }

      return true;
    });
  }, [branchSales, dateFilter, customStartDate, customEndDate, searchQuery, categoryFilter]);

  // Compute Overall Totals for filtered sales
  const totals = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let oilLiters = 0;
    let lpgKg = 0;
    let oilUnitsCount = 0;
    let lpgUnitsCount = 0;
    let cash = 0;
    let airtel = 0;
    let variance = 0;

    filteredSales.forEach((sale) => {
      revenue += sale.totalSalesAmount || 0;
      cost += sale.totalCostAmount || 0;
      profit += sale.grossProfit || 0;
      cash += sale.actualCashReceived || 0;
      airtel += (sale.cashSentToAirtelMoney || 0) + (sale.paymentBreakdown?.airtelMoneyDirectSales || 0);
      variance += sale.cashVariance || 0;

      (sale.items || []).forEach((item) => {
        const qty = item.quantity || 0;
        const volPerUnit = item.volumePerUnit || 1;
        const vol = qty * volPerUnit;

        if (item.category === 'LUBRICANTS') {
          oilLiters += vol;
          oilUnitsCount += qty;
        } else if (item.category === 'LPG') {
          lpgKg += vol;
          lpgUnitsCount += qty;
        }
      });
    });

    return {
      revenue,
      cost,
      profit,
      oilLiters,
      lpgKg,
      oilUnitsCount,
      lpgUnitsCount,
      cash,
      airtel,
      variance,
      shiftsCount: filteredSales.length,
    };
  }, [filteredSales]);

  // Aggregate Day-by-Day
  const daySummaries = useMemo<DaySummary[]>(() => {
    const map = new Map<string, DailySalesRecord[]>();

    filteredSales.forEach((sale) => {
      const list = map.get(sale.date) || [];
      list.push(sale);
      map.set(sale.date, list);
    });

    const dates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return dates.map((dateStr) => {
      const salesOnDay = map.get(dateStr)!;
      let dayRev = 0;
      let dayCost = 0;
      let dayProfit = 0;
      let dayOilLiters = 0;
      let dayLpgKg = 0;
      let dayOilUnits = 0;
      let dayLpgUnits = 0;
      let dayCash = 0;
      let dayAirtelSent = 0;
      let dayAirtelDirect = 0;
      let dayBank = 0;
      let dayCredit = 0;
      let dayVariance = 0;

      const itemMap = new Map<string, DaySummary['items'][0]>();

      salesOnDay.forEach((sale) => {
        dayRev += sale.totalSalesAmount || 0;
        dayCost += sale.totalCostAmount || 0;
        dayProfit += sale.grossProfit || 0;
        dayCash += sale.actualCashReceived || 0;
        dayAirtelSent += sale.cashSentToAirtelMoney || 0;
        dayAirtelDirect += sale.paymentBreakdown?.airtelMoneyDirectSales || 0;
        dayBank += sale.paymentBreakdown?.bankOrCardSales || 0;
        dayCredit += sale.paymentBreakdown?.creditSales || 0;
        dayVariance += sale.cashVariance || 0;

        (sale.items || []).forEach((item) => {
          const qty = item.quantity || 0;
          const volPerUnit = item.volumePerUnit || 1;
          const vol = qty * volPerUnit;

          if (item.category === 'LUBRICANTS') {
            dayOilLiters += vol;
            dayOilUnits += qty;
          } else if (item.category === 'LPG') {
            dayLpgKg += vol;
            dayLpgUnits += qty;
          }

          if (itemMap.has(item.productId)) {
            const existing = itemMap.get(item.productId)!;
            existing.quantity += qty;
            existing.totalVolume += vol;
            existing.totalAmount += item.totalAmount || 0;
            existing.profit += item.profit || 0;
          } else {
            itemMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              category: item.category,
              unit: item.unit,
              volumePerUnit: volPerUnit,
              quantity: qty,
              totalVolume: vol,
              totalAmount: item.totalAmount || 0,
              profit: item.profit || 0,
            });
          }
        });
      });

      // Format human-friendly day label
      let dayLabel = dateStr;
      try {
        const d = new Date(dateStr + 'T00:00:00');
        dayLabel = d.toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch (e) {
        dayLabel = dateStr;
      }

      return {
        date: dateStr,
        dayLabel,
        sales: salesOnDay,
        totalRevenue: dayRev,
        totalCost: dayCost,
        grossProfit: dayProfit,
        oilLiters: dayOilLiters,
        lpgKg: dayLpgKg,
        oilUnits: dayOilUnits,
        lpgUnits: dayLpgUnits,
        cashReceived: dayCash,
        airtelSent: dayAirtelSent,
        airtelDirect: dayAirtelDirect,
        bankOrCard: dayBank,
        creditSales: dayCredit,
        cashVariance: dayVariance,
        items: Array.from(itemMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      };
    });
  }, [filteredSales]);

  // Toggle date expansion
  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  // Toggle shift expansion
  const toggleSale = (id: string) => {
    setExpandedSaleIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Expand or collapse all
  const toggleAllDates = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    daySummaries.forEach((d) => {
      next[d.date] = expand;
    });
    setExpandedDates(next);
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {title || `Day-to-Day Sales Records & Volume Analytics`}
                </h2>
                <p className="text-xs text-slate-500">
                  {subtitle || `Detailed daily sales performance, Liters of Motor Oil, and KGs of LPG Gas sold at ${activeBranch?.name || 'this branch'}`}
                </p>
              </div>
            </div>
          </div>

          {onRecordSale && (
            <button
              onClick={onRecordSale}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Daily Shift Sale</span>
            </button>
          )}
        </div>

        {/* VOLUME & REVENUE KPI METRICS RIBBON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: TOTAL LITERS OF OIL SOLD */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-xl border border-blue-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-blue-900 tracking-wider">
                Total Motor Oil Sold
              </span>
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono mt-2">
              {totals.oilLiters.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-sm font-bold text-blue-700">Liters</span>
            </div>
            <div className="text-xs text-blue-800/80 mt-1 font-medium flex items-center justify-between">
              <span>Packs Sold:</span>
              <span className="font-bold font-mono">{totals.oilUnitsCount} units</span>
            </div>
          </div>

          {/* Card 2: TOTAL KGS OF LPG SOLD */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-xl border border-amber-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-amber-900 tracking-wider">
                Total LPG Gas Sold
              </span>
              <div className="p-2 bg-amber-600 text-white rounded-lg shadow-2xs">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono mt-2">
              {totals.lpgKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
              <span className="text-sm font-bold text-amber-700">Kg</span>
            </div>
            <div className="text-xs text-amber-800/80 mt-1 font-medium flex items-center justify-between">
              <span>Cylinders Sold:</span>
              <span className="font-bold font-mono">{totals.lpgUnitsCount} cylinders</span>
            </div>
          </div>

          {/* Card 3: GROSS SALES REVENUE */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-emerald-900 tracking-wider">
                Total Sales Revenue
              </span>
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-2">
              K{totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-800/80 mt-1 font-medium flex items-center justify-between">
              <span>Gross Profit:</span>
              <span className="font-bold font-mono text-emerald-700">
                +K{totals.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 4: CASH & AIRTEL SUMMARY */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                Collections &amp; Variance
              </span>
              <div className="p-2 bg-slate-700 text-white rounded-lg shadow-2xs">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs space-y-1.5 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cash Collected:</span>
                <span className="font-bold font-mono text-slate-900">
                  K{totals.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Airtel Remittances:</span>
                <span className="font-bold font-mono text-slate-900">
                  K{totals.airtel.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Drawer Variance:</span>
                <span
                  className={`font-bold font-mono ${
                    Math.abs(totals.variance) < 0.01 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {Math.abs(totals.variance) < 0.01 ? 'K0.00 (Balanced)' : `K${totals.variance.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & TOOLBAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD), Lubes Champ, product SKU, shift..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preset Date Range Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                dateFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                dateFilter === 'TODAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('YESTERDAY')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                dateFilter === 'YESTERDAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateFilter('LAST_7')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                dateFilter === 'LAST_7'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateFilter('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                dateFilter === 'THIS_MONTH'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                dateFilter === 'CUSTOM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Range Inputs */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-semibold">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-slate-800"
            />
            <span className="text-slate-600 font-semibold">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-slate-800"
            />
          </div>
        )}

        {/* View Mode & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Category filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All ({branchSales.length})
            </button>
            <button
              onClick={() => setCategoryFilter('LUBRICANTS')}
              className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 cursor-pointer ${
                categoryFilter === 'LUBRICANTS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-blue-50 text-blue-700'
              }`}
            >
              <Droplets className="w-3 h-3" />
              <span>Motor Oil Only</span>
            </button>
            <button
              onClick={() => setCategoryFilter('LPG')}
              className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 cursor-pointer ${
                categoryFilter === 'LPG'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 hover:bg-amber-50 text-amber-700'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>LPG Gas Only</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('DAY_BY_DAY')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'DAY_BY_DAY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day-by-Day Grouped
            </button>
            <button
              onClick={() => setViewMode('SHIFTS_LIST')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'SHIFTS_LIST'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Shift Logs ({filteredSales.length})
            </button>
          </div>
        </div>
      </div>

      {/* DAY-TO-DAY SALES RECORDS TABLE / CARDS */}
      {daySummaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Sales Records Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No daily shift sales match the selected date filters at {activeBranch?.name}.
          </p>
          {onRecordSale && (
            <button
              onClick={onRecordSale}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Shift Sale</span>
            </button>
          )}
        </div>
      ) : viewMode === 'DAY_BY_DAY' ? (
        /* DAY-BY-DAY AGGREGATED VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium">
              Showing <strong>{daySummaries.length} days</strong> of sales records ({filteredSales.length} shifts)
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleAllDates(true)}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Expand All Days
              </button>
              <span>•</span>
              <button
                onClick={() => toggleAllDates(false)}
                className="text-slate-600 hover:underline font-semibold cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {daySummaries.map((day) => {
            const isExpanded = !!expandedDates[day.date];

            return (
              <div
                key={day.date}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Day Header Summary Row */}
                <div
                  onClick={() => toggleDate(day.date)}
                  className="p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-100/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-base text-slate-900 font-mono">{day.date}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                          {day.dayLabel.split(',')[0]}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({day.sales.length} {day.sales.length === 1 ? 'shift' : 'shifts'})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {day.dayLabel} • {day.items.length} product SKUs sold
                      </div>
                    </div>
                  </div>

                  {/* Volume Highlights & Revenue */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* Liters of Oil */}
                    <div className="bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-lg text-right">
                      <div className="text-[10px] uppercase font-bold text-blue-900 flex items-center justify-end space-x-1">
                        <Droplets className="w-3 h-3 text-blue-600" />
                        <span>Oil Volume</span>
                      </div>
                      <div className="font-mono font-black text-sm sm:text-base text-blue-950">
                        {day.oilLiters.toFixed(1)} <span className="text-[11px] font-bold text-blue-700">L</span>
                      </div>
                    </div>

                    {/* Kgs of LPG */}
                    <div className="bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 rounded-lg text-right">
                      <div className="text-[10px] uppercase font-bold text-amber-900 flex items-center justify-end space-x-1">
                        <Flame className="w-3 h-3 text-amber-600" />
                        <span>LPG Mass</span>
                      </div>
                      <div className="font-mono font-black text-sm sm:text-base text-amber-950">
                        {day.lpgKg.toFixed(1)} <span className="text-[11px] font-bold text-amber-700">Kg</span>
                      </div>
                    </div>

                    {/* Total Day Revenue */}
                    <div className="bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-right min-w-[120px]">
                      <div className="text-[10px] uppercase font-bold text-emerald-900">Day Revenue</div>
                      <div className="font-mono font-black text-sm sm:text-base text-emerald-950">
                        K{day.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Expand Arrow */}
                    <div className="p-1 text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DAY DETAILS */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 space-y-5 bg-white">
                    {/* Shift records for this date */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Shift Records on {day.date}</span>
                      </h4>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {day.sales.map((sale) => {
                          const saleOilLiters = (sale.items || [])
                            .filter((i) => i.category === 'LUBRICANTS')
                            .reduce((sum, i) => sum + (i.quantity || 0) * (i.volumePerUnit || 1), 0);
                          const saleLpgKg = (sale.items || [])
                            .filter((i) => i.category === 'LPG')
                            .reduce((sum, i) => sum + (i.quantity || 0) * (i.volumePerUnit || 1), 0);

                          return (
                            <div key={sale.id} className="p-3 sm:p-4 bg-white hover:bg-slate-50/50 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                    {sale.shift}
                                  </span>
                                  <span className="text-slate-600 flex items-center space-x-1">
                                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Lubes Champ: <strong>{sale.lubesChamp}</strong></span>
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500 font-medium">
                                    {sale.items.length} line items
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingSale(sale)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-xs font-semibold flex items-center space-x-1 border border-slate-200 transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit Shift</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingSale(sale)}
                                    className="p-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded text-xs border border-slate-200 transition cursor-pointer"
                                    title="Delete Shift Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Shift Volume & Payment Breakdown Chips */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                                <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                  <span className="text-[10px] text-blue-700 block font-medium">Oil Liters</span>
                                  <span className="font-mono font-bold text-blue-900 text-xs">
                                    {saleOilLiters.toFixed(1)} L
                                  </span>
                                </div>

                                <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                                  <span className="text-[10px] text-amber-700 block font-medium">LPG Mass</span>
                                  <span className="font-mono font-bold text-amber-900 text-xs">
                                    {saleLpgKg.toFixed(1)} Kg
                                  </span>
                                </div>

                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                  <span className="text-[10px] text-slate-500 block font-medium">Cash / Airtel</span>
                                  <span className="font-mono font-bold text-slate-800 text-xs">
                                    K{sale.actualCashReceived} / K{sale.cashSentToAirtelMoney}
                                  </span>
                                </div>

                                <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                  <span className="text-[10px] text-emerald-700 block font-medium">Shift Revenue</span>
                                  <span className="font-mono font-bold text-emerald-900 text-xs">
                                    K{sale.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {/* Itemized Line Items Table */}
                              <div className="mt-2 overflow-x-auto">
                                <table className="w-full text-[11px] text-left">
                                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="py-1.5 px-2">SKU / Product</th>
                                      <th className="py-1.5 px-2">Category</th>
                                      <th className="py-1.5 px-2 text-center">Unit Size</th>
                                      <th className="py-1.5 px-2 text-center">Qty</th>
                                      <th className="py-1.5 px-2 text-right">Total Volume</th>
                                      <th className="py-1.5 px-2 text-right">Unit Rate</th>
                                      <th className="py-1.5 px-2 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono">
                                    {sale.items.map((item, idx) => {
                                      const itemVol = item.quantity * item.volumePerUnit;
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50/40">
                                          <td className="py-1.5 px-2 font-sans font-medium text-slate-900">
                                            {item.productName}{' '}
                                            <span className="text-[10px] text-slate-400 font-mono">({item.productCode})</span>
                                          </td>
                                          <td className="py-1.5 px-2">
                                            <span
                                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                item.category === 'LUBRICANTS'
                                                  ? 'bg-blue-50 text-blue-700'
                                                  : 'bg-amber-50 text-amber-700'
                                              }`}
                                            >
                                              {item.category === 'LUBRICANTS' ? 'Oil' : 'LPG'}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2 text-center text-slate-600 font-sans">
                                            {item.unit}
                                          </td>
                                          <td className="py-1.5 px-2 text-center font-bold text-slate-900">
                                            {item.quantity}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-bold text-blue-900">
                                            {itemVol.toFixed(1)}{' '}
                                            <span className="text-[10px] text-slate-400">
                                              {item.category === 'LUBRICANTS' ? 'L' : 'Kg'}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2 text-right text-slate-600">
                                            K{item.unitPrice}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-bold text-emerald-700">
                                            K{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
          })}
        </div>
      ) : (
        /* FLAT SHIFT-BY-SHIFT LOGS LIST */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Shift Sales Logs ({filteredSales.length} records)
            </span>
            <span className="text-slate-500 font-mono">
              Oil: {totals.oilLiters.toFixed(1)} L • LPG: {totals.lpgKg.toFixed(1)} Kg
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSales.map((sale) => {
              const isExpanded = !!expandedSaleIds[sale.id];
              const saleOilLiters = (sale.items || [])
                .filter((i) => i.category === 'LUBRICANTS')
                .reduce((sum, i) => sum + (i.quantity || 0) * (i.volumePerUnit || 1), 0);
              const saleLpgKg = (sale.items || [])
                .filter((i) => i.category === 'LPG')
                .reduce((sum, i) => sum + (i.quantity || 0) * (i.volumePerUnit || 1), 0);

              return (
                <div key={sale.id} className="p-4 hover:bg-slate-50/50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">{sale.date}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
                          {sale.shift}
                        </span>
                        <span className="text-slate-500 font-medium">({sale.items.length} items)</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-700">Lubes Champ: <strong>{sale.lubesChamp}</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-mono">
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          Oil: {saleOilLiters.toFixed(1)} Liters
                        </span>
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                          LPG: {saleLpgKg.toFixed(1)} Kg
                        </span>
                        <span>Cash: K{sale.actualCashReceived}</span>
                        <span>Airtel: K{sale.cashSentToAirtelMoney}</span>
                        <span
                          className={sale.cashVariance !== 0 ? 'text-red-500 font-bold' : 'text-emerald-700 font-bold'}
                        >
                          Var: {sale.cashVariance === 0 ? 'K0.00 (Balanced)' : `K${sale.cashVariance.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-base text-slate-900 font-mono">
                          K{sale.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Profit: +K{sale.grossProfit.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => toggleSale(sale.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          {isExpanded ? 'Hide' : 'Items'}
                        </button>
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs transition cursor-pointer"
                          title="Edit Shift"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingSale(sale)}
                          className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs transition cursor-pointer"
                          title="Delete Shift Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items Table for flat list */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-1 px-2">Product Name</th>
                            <th className="py-1 px-2">SKU</th>
                            <th className="py-1 px-2 text-center">Unit</th>
                            <th className="py-1 px-2 text-center">Qty</th>
                            <th className="py-1 px-2 text-right">Volume</th>
                            <th className="py-1 px-2 text-right">Unit Price</th>
                            <th className="py-1 px-2 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {sale.items.map((i, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-1 px-2 font-sans font-medium text-slate-900">{i.productName}</td>
                              <td className="py-1 px-2 text-slate-500">{i.productCode}</td>
                              <td className="py-1 px-2 text-center font-sans">{i.unit}</td>
                              <td className="py-1 px-2 text-center font-bold text-slate-900">{i.quantity}</td>
                              <td className="py-1 px-2 text-right font-bold text-blue-900">
                                {(i.quantity * i.volumePerUnit).toFixed(1)} {i.category === 'LUBRICANTS' ? 'L' : 'Kg'}
                              </td>
                              <td className="py-1 px-2 text-right">K{i.unitPrice}</td>
                              <td className="py-1 px-2 text-right font-bold text-emerald-700">
                                K{i.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingSale && (
        <SalesAdjustmentModal
          sale={editingSale}
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
          onSuccess={() => {
            setEditingSale(null);
          }}
        />
      )}

      {/* DELETE MODAL */}
      {deletingSale && (
        <SalesDeleteModal
          sale={deletingSale}
          isOpen={!!deletingSale}
          onClose={() => setDeletingSale(null)}
          onSuccess={() => {
            setDeletingSale(null);
          }}
        />
      )}
    </div>
  );
};
