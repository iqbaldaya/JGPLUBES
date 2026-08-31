import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BranchOverview } from '../branch/BranchOverview';
import { BranchDayToDaySalesSection } from '../branch/BranchDayToDaySalesSection';
import { DailySalesForm } from '../sales/DailySalesForm';
import { CashReconciliationView } from '../reconciliation/CashReconciliationView';
import { StockReconciliation } from '../stock/StockReconciliation';
import { AirtelMoneyLedger } from '../airtel/AirtelMoneyLedger';
import { StockTransfersSection } from '../stock/StockTransfersSection';
import {
  Building2,
  UserCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Layers,
  FileSpreadsheet,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Eye,
  Edit3,
  CalendarDays,
  Droplets,
  Flame,
  Truck,
  ShoppingCart,
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react';

type BranchPortalSection = 'OVERVIEW' | 'DAY_TO_DAY_SALES' | 'SALES_ENTRY' | 'STOCK_TRANSFERS' | 'CASH_RECON' | 'STOCK_RECON' | 'AIRTEL_LEDGER';

export const BranchPortalsHub: React.FC = () => {
  const {
    branches,
    dailySales,
    branchStocks,
    products,
    cashMovements,
    airtelMoneyRecords,
    airtelRecords,
    lowStockAlerts,
  } = useApp();

  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [activeSection, setActiveSection] = useState<BranchPortalSection>('OVERVIEW');

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  if (!selectedBranch) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm">
        <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-stone-800">No Operating Branches Found</h2>
        <p className="text-sm text-stone-500 mt-1">Please register branch operating sites in the settings.</p>
      </div>
    );
  }

  // Branch Specific Metrics Calculations
  const allAirtel = airtelMoneyRecords || airtelRecords || [];
  const branchDailySales = dailySales.filter((s) => s.branchId === selectedBranch.id);
  const branchCashMoves = cashMovements.filter((m) => m.branchId === selectedBranch.id);
  const branchAirtelRecs = allAirtel.filter((r) => r.branchId === selectedBranch.id);
  const branchLowAlerts = lowStockAlerts.filter((a) => a.branchId === selectedBranch.id);

  const totalBranchRevenue = branchDailySales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
  const totalBranchProfit = branchDailySales.reduce((sum, s) => sum + s.grossProfit, 0);
  const unpostedShiftsCount = branchDailySales.filter((s) => s.postingStatus === 'UNPOSTED').length;
  const discrepancyShiftsCount = branchDailySales.filter((s) => s.status === 'DISCREPANCY_FLAGGED').length;
  const pendingCashMovesCount = branchCashMoves.filter((m) => m.status === 'PENDING_APPROVAL').length;

  const branchStockValuation = branchStocks
    .filter((s) => s.branchId === selectedBranch.id)
    .reduce((sum, s) => {
      const p = products.find((prod) => prod.id === s.productId);
      return sum + (p ? s.quantity * p.sellingPrice : 0);
    }, 0);

  const handleInternalNavigate = (targetTab: string) => {
    if (targetTab === 'BRANCH_SALES_ENTRY' || targetTab === 'DAILY_SALES') {
      setActiveSection('SALES_ENTRY');
    } else if (targetTab === 'CASH_RECONCILIATION' || targetTab === 'CASH_RECON') {
      setActiveSection('CASH_RECON');
    } else if (targetTab === 'STOCK_RECONCILIATION' || targetTab === 'STOCK_RECON') {
      setActiveSection('STOCK_RECON');
    } else if (targetTab === 'AIRTEL_MONEY' || targetTab === 'AIRTEL_LEDGER') {
      setActiveSection('AIRTEL_LEDGER');
    } else {
      setActiveSection('OVERVIEW');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Super-Admin / Executive Operations Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Branch Portals Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Directly view, audit, and modify any branch portal site in real-time. Edit daily sales shifts, alter cash reconciliation records &amp; physical drawer counts, reconcile stocks, and verify Airtel remittances across all branch locations.
            </p>
          </div>

          {/* Quick Global Branch Summary */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center divide-x divide-white/10 text-xs shrink-0">
            <div className="px-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Branches</div>
              <div className="text-xl font-bold font-mono text-white">{branches.length} Sites</div>
            </div>
            <div className="px-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Unposted Shifts</div>
              <div className={`text-xl font-bold font-mono ${dailySales.filter(s => s.postingStatus === 'UNPOSTED').length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {dailySales.filter(s => s.postingStatus === 'UNPOSTED').length}
              </div>
            </div>
            <div className="px-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Cash Discrepancies</div>
              <div className={`text-xl font-bold font-mono ${dailySales.filter(s => s.status === 'DISCREPANCY_FLAGGED').length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {dailySales.filter(s => s.status === 'DISCREPANCY_FLAGGED').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Selection Cards Carousel / Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <span>Select Operating Branch Site to View &amp; Edit</span>
          </h2>
          <span className="text-[11px] text-stone-400">
            Click any branch card below to switch operational view
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {branches.map((b) => {
            const isSelected = b.id === selectedBranch.id;
            const bSales = dailySales.filter((s) => s.branchId === b.id);
            const bRevenue = bSales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
            const bUnposted = bSales.filter((s) => s.postingStatus === 'UNPOSTED').length;
            const bDiscrepancies = bSales.filter((s) => s.status === 'DISCREPANCY_FLAGGED').length;
            const bAlerts = lowStockAlerts.filter((a) => a.branchId === b.id).length;

            return (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`p-4 rounded-xl text-left transition-all relative overflow-hidden border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-600 shadow-md ring-2 ring-blue-500 ring-offset-2'
                    : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Site</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-blue-800 text-blue-200' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {b.code}
                  </span>
                  <span className="text-xs font-semibold truncate">
                    {b.city || b.location}
                  </span>
                </div>

                <div className="mt-2">
                  <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                    {b.name}
                  </h3>
                  <div className={`text-[11px] mt-0.5 flex items-center space-x-1 ${isSelected ? 'text-blue-200' : 'text-stone-500'}`}>
                    <UserCheck className="w-3 h-3 shrink-0" />
                    <span className="truncate">{b.lubesChamp}</span>
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs font-mono ${
                  isSelected ? 'border-blue-800/80 text-blue-100' : 'border-stone-100 text-stone-600'
                }`}>
                  <div>
                    <span className="text-[9px] block text-stone-400 uppercase font-sans">Gross Sales</span>
                    <strong className={`text-xs ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                      K{bRevenue.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] block text-stone-400 uppercase font-sans">Shift Logs</span>
                    <strong className={`text-xs ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                      {bSales.length} shifts
                    </strong>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {bUnposted > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded">
                      {bUnposted} Unposted
                    </span>
                  )}
                  {bDiscrepancies > 0 && (
                    <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded">
                      {bDiscrepancies} Variance
                    </span>
                  )}
                  {bAlerts > 0 && (
                    <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded">
                      {bAlerts} Low Stock
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Branch Portal Frame & Sub-Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Active Branch Control Bar */}
        <div className="p-5 bg-stone-900 text-white border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded">
                PORTAL: {selectedBranch.code}
              </span>
              <span className="text-stone-400 text-xs">•</span>
              <span className="text-stone-300 text-xs flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>{selectedBranch.city || selectedBranch.location}, {selectedBranch.address || selectedBranch.location}</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>{selectedBranch.name}</span>
              <span className="text-xs font-normal text-stone-400">(Executive Live Editing Enabled)</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 font-medium">
              <span>Lubes Champ: <strong className="text-stone-200">{selectedBranch.lubesChamp}</strong></span>
              <span>Phone: <strong className="text-stone-200 font-mono">{selectedBranch.phone}</strong></span>
              
              <span>Airtel Till: <strong className="text-red-400 font-mono">{selectedBranch.airtelMerchantNumber || 'N/A'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-stone-800/90 rounded-xl border border-stone-700 text-right">
              <div className="text-[10px] uppercase text-stone-400 font-medium">Branch Sales Valuation</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                K{totalBranchRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
          {/* Site Operations */}
          <button
            onClick={() => setActiveSection('OVERVIEW')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'OVERVIEW'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Branch Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveSection('DAY_TO_DAY_SALES')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'DAY_TO_DAY_SALES'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Day-to-Day Sales Records</span>
          </button>

          <button
            onClick={() => setActiveSection('SALES_ENTRY')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'SALES_ENTRY'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Shift Sale (POS)</span>
            {unpostedShiftsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                {unpostedShiftsCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveSection('STOCK_TRANSFERS')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'STOCK_TRANSFERS'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Inter-Branch Transfers</span>
          </button>
          
          <button
            onClick={() => setActiveSection('STOCK_RECON')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'STOCK_RECON'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Stock & Products</span>
            {branchLowAlerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-800 rounded-full text-[10px]">
                {branchLowAlerts.length}
              </span>
            )}
          </button>

          {/* Reconciliation */}
          <button
            onClick={() => setActiveSection('CASH_RECON')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'CASH_RECON'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cash Reconciliation</span>
            {(discrepancyShiftsCount > 0 || pendingCashMovesCount > 0) && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-800 rounded-full text-[10px]">
                {discrepancyShiftsCount + pendingCashMovesCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveSection('AIRTEL_LEDGER')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeSection === 'AIRTEL_LEDGER'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Airtel Money Records</span>
          </button>
        </div>
        {/* Active Section Content Container */}
        <div className="p-6 bg-stone-50/50">
          {activeSection === 'OVERVIEW' && (
            <BranchOverview
              branchId={selectedBranch.id}
              onNavigateTab={handleInternalNavigate}
            />
          )}

          {activeSection === 'DAY_TO_DAY_SALES' && (
            <BranchDayToDaySalesSection
              branchId={selectedBranch.id}
              onRecordSale={() => setActiveSection('SALES_ENTRY')}
              
            />
          )}

          {activeSection === 'SALES_ENTRY' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 text-xs">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Owner Direct Sales Editor:</strong> Submitting or approving shift records here for <strong>{selectedBranch.name}</strong> will directly update sales ledgers, inventory balances, and branch targets.
                  </span>
                </div>
              </div>

              <DailySalesForm
                defaultBranchId={selectedBranch.id}
                onSuccess={() => {}}
              />
            </div>
          )}

          {activeSection === 'STOCK_TRANSFERS' && (
            <div className="space-y-6">
              <StockTransfersSection branchViewOnlyId={selectedBranch.id} />
            </div>
          )}

          {activeSection === 'CASH_RECON' && (
            <div className="space-y-6">
              <CashReconciliationView
                branchIdFilter={selectedBranch.id}
              />
            </div>
          )}

          {activeSection === 'STOCK_RECON' && (
            <div className="space-y-6">
              <StockReconciliation
                branchIdFilter={selectedBranch.id}
              />
            </div>
          )}

          {activeSection === 'AIRTEL_LEDGER' && (
            <div className="space-y-6">
              <AirtelMoneyLedger
                branchIdFilter={selectedBranch.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
