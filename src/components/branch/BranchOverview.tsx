import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BranchDayToDaySalesSection } from './BranchDayToDaySalesSection';
import { BranchStockSection } from './BranchStockSection';
import {
  Building2,
  UserCheck,
  TrendingUp,
  Droplets,
  Flame,
  DollarSign,
  Smartphone,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  CalendarDays,
} from 'lucide-react';

interface BranchOverviewProps {
  branchId?: string | null;
  onNavigateTab: (tab: any) => void;
}

export const BranchOverview: React.FC<BranchOverviewProps> = ({ branchId, onNavigateTab }) => {
  const {
    branches,
    currentBranch,
    dailySales,
    products,
    branchStocks,
    airtelMoneyRecords,
    airtelRecords,
    lowStockAlerts,
  } = useApp();

  const activeBranch = branchId ? branches.find((b) => b.id === branchId) || currentBranch : currentBranch;

  if (!activeBranch) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
        <Building2 className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <h3 className="font-bold text-stone-800">No Branch Site Selected</h3>
        <p className="text-xs text-stone-500 mt-1">Please select an operating branch from the top switcher.</p>
      </div>
    );
  }

  // Branch-specific data
  const allAirtel = airtelMoneyRecords || airtelRecords || [];
  const branchSales = (dailySales || []).filter((s) => s.branchId === activeBranch.id);
  const branchAirtel = allAirtel.filter((r) => r.branchId === activeBranch.id);
  const branchAlerts = (lowStockAlerts || []).filter((a) => a.branchId === activeBranch.id);

  // Financial aggregates
  const totalSales = branchSales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
  const totalProfit = branchSales.reduce((sum, s) => sum + s.grossProfit, 0);
  const totalAirtelDeposits = branchAirtel.reduce((sum, r) => sum + r.amount, 0);
  const totalVariance = branchSales.reduce((sum, s) => sum + s.cashVariance, 0);

  // Volume metrics
  let oilVolLiters = 0;
  let lpgVolKg = 0;
  branchSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.category === 'LUBRICANTS') oilVolLiters += item.volumePerUnit * item.quantity;
      if (item.category === 'LPG') lpgVolKg += item.volumePerUnit * item.quantity;
    });
  });

  // Target progress
  const targetMonthly = activeBranch.targetMonthlySales || 100000;
  const targetPercent = Math.min(100, Math.round((totalSales / targetMonthly) * 100));

  // Current stock valuation
  const branchStockValuation = branchStocks
    .filter((s) => s.branchId === activeBranch.id)
    .reduce((sum, s) => {
      const prod = products.find((p) => p.id === s.productId);
      return sum + (prod ? s.quantity * prod.sellingPrice : 0);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Site Header Profile Card */}
      <div className="bg-[#1E293B] text-white p-6 rounded-xl border border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
              SITE: {activeBranch.code}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-medium">{activeBranch.city || activeBranch.location}, {activeBranch.address || activeBranch.location}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {activeBranch.name}
          </h1>

          <div className="flex flex-wrap items-center text-xs text-slate-400 gap-x-5 gap-y-1">
            <div className="flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Lubes Champ: <strong className="text-white font-medium">{activeBranch.lubesChamp}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Phone: <strong className="text-slate-200 font-mono">{activeBranch.phone}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Opening Float: <strong className="text-blue-400 font-mono font-bold">K{activeBranch.openingCashFloat}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-branch-record-sale-shortcut"
            onClick={() => onNavigateTab('BRANCH_SALES_ENTRY')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Daily Sales</span>
          </button>
          <button
            onClick={() => onNavigateTab('STOCK_RECONCILIATION')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center space-x-2 transition border border-slate-700"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Stock Count</span>
          </button>
        </div>
      </div>

      {/* Low Stock Banner for this Branch */}
      {branchAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between gap-3 text-red-800">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong>{branchAlerts.length} Products Low on Stock at {activeBranch.name}:</strong>{' '}
              {branchAlerts.map((a) => `${a.productName} (${a.currentStock} ${a.unit} remaining)`).join(', ')}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('STOCK_RECONCILIATION')}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shrink-0 transition"
          >
            Audit Stock
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            K{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-green-600 mt-1 font-semibold flex items-center justify-between">
            <span>Gross Profit:</span>
            <span>+K{totalProfit.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Airtel Remittances</span>
            <Smartphone className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            K{totalAirtelDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Variance:</span>
            <span className={`font-semibold ${totalVariance === 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalVariance === 0 ? 'K0.00 Balanced' : `K${totalVariance.toFixed(2)}`}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Motor Oils Volume</span>
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {oilVolLiters.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Liters</span>
          </div>
          <div className="text-[10px] text-blue-600 mt-1 font-medium">Lubricants catalog</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LPG Gas Volume</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {lpgVolKg.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Kg</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">Refills &amp; Complete Sets</div>
        </div>
      </div>

      {/* Target Progress & Stock Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Branch Target</span>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">Sales Goal Progress</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {targetPercent}% Achieved
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 font-mono">Actual: K{totalSales.toLocaleString()}</span>
              <span className="text-slate-800 font-mono">Target: K{targetMonthly.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${targetPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Stock Valuation</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">
              K{branchStockValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500">Retail value of physical stock in branch warehouse</p>
          </div>

          <button
            onClick={() => onNavigateTab('STOCK_RECONCILIATION')}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-slate-200"
          >
            <span>View Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comprehensive Day-to-Day Sales Records Section (with Liters of Oil and Kgs of LPG) */}
      <BranchDayToDaySalesSection
        branchId={activeBranch.id}
        onRecordSale={() => onNavigateTab('BRANCH_SALES_ENTRY')}
        title={`Day-to-Day Sales Records (${activeBranch.name})`}
        subtitle={`Audit daily shift entries, total liters of motor oil, and total kg of LPG sold at ${activeBranch.name}`}
      />

      {/* Comprehensive Products Section with Current Stock Remaining of Each Product */}
      <BranchStockSection
        branchId={activeBranch.id}
        onAuditStock={() => onNavigateTab('STOCK_RECONCILIATION')}
        onRecordSale={() => onNavigateTab('BRANCH_SALES_ENTRY')}
      />
    </div>
  );
};
