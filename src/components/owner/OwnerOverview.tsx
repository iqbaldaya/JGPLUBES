import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashMovementDestination } from '../../types';
import { BusinessNetValueSection } from './BusinessNetValueSection';
import {
  TrendingUp,
  Droplets,
  Flame,
  Building2,
  DollarSign,
  Smartphone,
  Truck,
  Award,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Calendar,
  Wallet,
  Landmark,
  ArrowRightLeft,
  Check,
  X,
  Clock,
  CheckCircle2,
  Sliders,
  Sparkles,
  ShieldAlert,
  Scale,
  Settings,
  Database,
} from 'lucide-react';

interface OwnerOverviewProps {
  onNavigate?: (tab: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OwnerOverview: React.FC<OwnerOverviewProps> = ({ onNavigate, onNavigateTab }) => {
  const navigate = onNavigateTab || onNavigate || (() => {});
  const {
    branches,
    products,
    dailySales,
    airtelMoneyRecords,
    suppliers,
    supplierTransactions,
    stockTransfers,
    lowStockAlerts,
    totalDiscrepancyCount,
    cashMovements,
    ownerTreasury,
    pendingCashMovementCount,
    approveCashMovement,
    rejectCashMovement,
    transferOwnerFunds,
    updateOwnerTreasury,
  } = useApp();

  // Internal Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSource, setTransferSource] = useState<CashMovementDestination>('OWNER_CASH');
  const [transferDest, setTransferDest] = useState<CashMovementDestination>('BANK');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Adjust Balance Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editCashOnHand, setEditCashOnHand] = useState<string>(ownerTreasury.cashOnHand.toString());
  const [editCashInBank, setEditCashInBank] = useState<string>(ownerTreasury.cashInBank.toString());
  const [editCashOnAirtel, setEditCashOnAirtel] = useState<string>(ownerTreasury.cashOnAirtelMoney.toString());

  // Aggregate Sales Figures
  const totalSalesRevenue = dailySales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
  const totalCost = dailySales.reduce((sum, s) => sum + s.totalCostAmount, 0);
  const totalGrossProfit = dailySales.reduce((sum, s) => sum + s.grossProfit, 0);
  const overallMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;

  // Aggregate Volume Metrics
  let totalLubesLitersSold = 0;
  let totalLpgKgSold = 0;
  let lubesRevenue = 0;
  let lpgRevenue = 0;

  dailySales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.category === 'LUBRICANTS') {
        totalLubesLitersSold += item.volumePerUnit * item.quantity;
        lubesRevenue += item.totalAmount;
      } else if (item.category === 'LPG') {
        totalLpgKgSold += item.volumePerUnit * item.quantity;
        lpgRevenue += item.totalAmount;
      }
    });
  });

  // Cash and Airtel Collections
  const totalCashCollected = dailySales.reduce((sum, s) => sum + s.actualCashReceived, 0);
  const totalCashSentToAirtel = dailySales.reduce((sum, s) => sum + s.cashSentToAirtelMoney, 0);
  const totalNetCashVariance = dailySales.reduce((sum, s) => sum + s.cashVariance, 0);

  // Treasury Total
  const totalLiquidTreasury =
    ownerTreasury.cashOnHand + ownerTreasury.cashInBank + ownerTreasury.cashOnAirtelMoney;

  // Pending Cash Movements
  const pendingMovements = cashMovements.filter((m) => m.status === 'PENDING_APPROVAL');

  // Supplier Payables
  let totalSupplierInvoiced = 0;
  let totalSupplierPaid = 0;
  supplierTransactions.forEach((tx) => {
    if (tx.type === 'INVOICE') totalSupplierInvoiced += tx.amount;
    if (tx.type === 'PAYMENT') totalSupplierPaid += tx.amount;
    if (tx.type === 'CREDIT_NOTE') totalSupplierInvoiced -= tx.amount;
  });
  const totalOutstandingSupplierPayables = Math.max(0, totalSupplierInvoiced - totalSupplierPaid);

  // Branch Performance Analysis
  const branchPerformance = branches.map((branch) => {
    const branchSales = dailySales.filter((s) => s.branchId === branch.id);
    const branchRevenue = branchSales.reduce((sum, s) => sum + s.totalSalesAmount, 0);
    const branchProfit = branchSales.reduce((sum, s) => sum + s.grossProfit, 0);
    const branchLubesLiters = branchSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.category === 'LUBRICANTS')
          .reduce((iSum, i) => iSum + i.volumePerUnit * i.quantity, 0),
      0
    );
    const branchLpgKg = branchSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.category === 'LPG')
          .reduce((iSum, i) => iSum + i.volumePerUnit * i.quantity, 0),
      0
    );
    const branchVariance = branchSales.reduce((sum, s) => sum + s.cashVariance, 0);
    const hasDiscrepancy = branchSales.some((s) => Math.abs(s.cashVariance) > 0.01);
    const lowStockCount = lowStockAlerts.filter((a) => a.branchId === branch.id).length;

    return {
      ...branch,
      totalRevenue: branchRevenue,
      totalProfit: branchProfit,
      lubesLiters: branchLubesLiters,
      lpgKg: branchLpgKg,
      cashVariance: branchVariance,
      hasDiscrepancy,
      lowStockCount,
      targetProgressPct: branch.targetMonthlySales > 0 ? (branchRevenue / branch.targetMonthlySales) * 100 : 0,
    };
  });

  // Sort Lubes Champs by total revenue generated
  const lubesChampLeaderboard = [...branchPerformance].sort((a, b) => b.totalRevenue - a.totalRevenue);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }
    const res = transferOwnerFunds(transferSource, transferDest, amt, transferNotes);
    if (!res.success) {
      setTransferError(res.message || 'Transfer failed.');
      return;
    }
    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNotes('');
    setTransferError(null);
  };

  const handleSaveAdjustedTreasury = (e: React.FormEvent) => {
    e.preventDefault();
    const hand = parseFloat(editCashOnHand) || 0;
    const bank = parseFloat(editCashInBank) || 0;
    const airtel = parseFloat(editCashOnAirtel) || 0;

    updateOwnerTreasury({
      cashOnHand: hand,
      cashInBank: bank,
      cashOnAirtelMoney: airtel,
    });
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Overview */}
      <div className="bg-[#1E293B] text-white rounded-xl p-6 sm:p-8 shadow-xs border border-slate-700/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Owner Portal Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Global Operations &amp; Liquidity Treasury
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Consolidated real-time monitoring across all {branches.length} branches. Track Motor Oil &amp; LPG volumes,
              Lubes Champ performance, Owner Liquid Treasury (Cash on Hand, Airtel Float, Bank), and branch cash movements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-owner-sales-adjustments"
              onClick={() => navigate('daily-sales')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded text-xs transition flex items-center space-x-2 shadow-xs"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Day-by-Day Sales</span>
            </button>
            <button
              id="btn-owner-cash-recon"
              onClick={() => navigate('cash-recon')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded border border-slate-700 transition flex items-center space-x-2 text-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Cash Reconciliation</span>
            </button>
            <button
              id="btn-owner-pdf-report"
              onClick={() => navigate('quarterly-reports')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded border border-slate-700 transition flex items-center space-x-2 text-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Performance Reports</span>
            </button>
            <button
              id="btn-owner-settings-backup"
              onClick={() => navigate('settings')}
              className="bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-semibold px-4 py-2 rounded border border-indigo-700/80 transition flex items-center space-x-2 text-xs shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings &amp; Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* OWNER LIQUID TREASURY CARD SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>Owner Liquid Treasury Portfolio</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Available Liquid Funds: <span className="font-mono text-emerald-600">K{totalLiquidTreasury.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setTransferError(null);
                setTransferAmount('');
                setIsTransferModalOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition border border-blue-200"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Internal Transfer</span>
            </button>
            <button
              onClick={() => {
                setEditCashOnHand(ownerTreasury.cashOnHand.toString());
                setEditCashInBank(ownerTreasury.cashInBank.toString());
                setEditCashOnAirtel(ownerTreasury.cashOnAirtelMoney.toString());
                setIsAdjustModalOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition border border-slate-200"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust Opening</span>
            </button>
          </div>
        </div>

        {/* 3 Categories: Cash on Hand, Airtel Money, Bank */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {/* Cash on Hand */}
          <div
            onClick={() => navigate('cash-records')}
            className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 hover:bg-emerald-100/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <Wallet className="w-4 h-4" />
                <span>1. Cash on Hand (Physical)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1 group-hover:bg-emerald-200">
                <span>View Ledger</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-2">
              K{ownerTreasury.cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Physical cash collected &amp; in Owner safe • Click to view ledger
            </p>
          </div>

          {/* Cash on Airtel Money */}
          <div
            onClick={() => navigate('airtel-records')}
            className="p-4 rounded-xl bg-red-50/50 border border-red-200/80 hover:bg-red-100/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-800 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>2. Cash on Airtel Money</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center space-x-1 group-hover:bg-red-200">
                <span>View Records</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-2xl font-black text-red-950 font-mono mt-2">
              K{ownerTreasury.cashOnAirtelMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-red-700 mt-1">
              Corporate Airtel Money ledger balance • Click to view records
            </p>
          </div>

          {/* Cash in Bank */}
          <div
            onClick={() => navigate('bank-records')}
            className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 hover:bg-blue-100/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs">
                <Landmark className="w-4 h-4" />
                <span>3. Cash in Bank Accounts</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1 group-hover:bg-blue-200">
                <span>View Ledger</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-950 font-mono mt-2">
              K{ownerTreasury.cashInBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              Commercial bank operating deposits • Click to view ledger
            </p>
          </div>
        </div>
      </div>

      {/* PENDING CASH MOVEMENTS APPROVAL SECTION (IF ANY PENDING) */}
      {pendingMovements.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-200 text-amber-900 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                  Action Required: {pendingMovements.length} Branch Cash Movement{pendingMovements.length > 1 ? 's' : ''} Awaiting Your Approval
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Approve to credit your Cash on Hand, Bank Accounts, or Airtel Float.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('cash-recon')}
              className="text-xs font-bold text-amber-900 underline hover:text-amber-950 shrink-0"
            >
              View in Cash Reconciliation Hub →
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {pendingMovements.map((movement) => (
              <div
                key={movement.id}
                className="bg-white p-3.5 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {movement.branchName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({movement.branchCode})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600">
                      By {movement.submittedBy}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-slate-500 font-semibold">
                      Ref: {movement.referenceNumber}
                    </span>
                    <span className="text-slate-300">•</span>
                    {movement.destination === 'AIRTEL_MONEY' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        <Smartphone className="w-3 h-3" />
                        <span>To Airtel Float</span>
                      </span>
                    )}
                    {movement.destination === 'BANK' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        <Landmark className="w-3 h-3" />
                        <span>To Bank Deposit</span>
                      </span>
                    )}
                    {movement.destination === 'OWNER_CASH' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Wallet className="w-3 h-3" />
                        <span>To Owner (Cash on Hand)</span>
                      </span>
                    )}
                    {movement.notes && (
                      <span className="text-slate-400 italic text-[11px]">
                        "{movement.notes}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-base font-black text-slate-900 font-mono">
                    K{movement.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => approveCashMovement(movement.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectCashMovement(movement.id, 'Declined by Owner')}
                      className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUSINESS PROFIT & NET VALUE SECTION (DEBIT - CREDIT) */}
      <BusinessNetValueSection onNavigateTab={navigate} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Daily Global Sales
            </p>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            K{totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-green-600 mt-1 font-semibold flex items-center space-x-1">
            <span>+K{totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} profit</span>
            <span>({overallMargin.toFixed(1)}% margin)</span>
          </p>
        </div>

        {/* Lubes (Motor Oils) Volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Motor Oils (Lubricants)
            </p>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            {totalLubesLitersSold.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Liters</span>
          </p>
          <p className="text-[10px] text-blue-600 mt-1 font-semibold">
            Sales Value: K{lubesRevenue.toLocaleString()}
          </p>
        </div>

        {/* LPG Gas Volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              LPG Gas Sold
            </p>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            {totalLpgKgSold.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Kg</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Sales Value: <strong className="text-slate-800">K{lpgRevenue.toLocaleString()}</strong>
          </p>
        </div>

        {/* Total Physical Cash Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Shift Drawer Collections
            </p>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
            K{totalCashCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] mt-1 flex items-center space-x-1">
            <span className="text-slate-400">Net Shift Variance:</span>
            <span
              className={`font-semibold ${
                Math.abs(totalNetCashVariance) > 0 ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {totalNetCashVariance === 0
                ? 'K0.00 Balanced'
                : `${totalNetCashVariance >= 0 ? '+' : ''}K${totalNetCashVariance}`}
            </span>
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supplier Outstanding Payables */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Supplier Accounts Balance Due
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              K{totalOutstandingSupplierPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500">
              {suppliers.length} active registered suppliers
            </div>
          </div>
          <button
            onClick={() => navigate('supplier-ledger')}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-slate-100"
          >
            <span>Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Low Stock Watch */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Low Stock Level Alerts
            </div>
            <div className={`text-xl font-bold font-mono ${lowStockAlerts.length > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {lowStockAlerts.length} Products Low
            </div>
            <div className="text-[11px] text-slate-500">
              Across all branch locations
            </div>
          </div>
          <button
            onClick={() => navigate('stock-recon')}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-slate-100"
          >
            <span>Audit Stocks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cash Reconciliation Discrepancy Health */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Daily Discrepancy Health
            </div>
            <div className={`text-xl font-bold font-mono ${totalDiscrepancyCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {totalDiscrepancyCount > 0 ? `${totalDiscrepancyCount} Discrepancies` : '100% Balanced'}
            </div>
            <div className="text-[11px] text-slate-500">
              {totalDiscrepancyCount > 0 ? 'Requires supervisor audit' : 'All sites balanced'}
            </div>
          </div>
          <button
            onClick={() => navigate('cash-recon')}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition border border-slate-100"
          >
            <span>Reconciliation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Site Logistics & Enterprise Data Import Hub Quick Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inter-Branch Logistics Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-xs border border-slate-700 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 text-blue-400 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Inter-Branch Stock Transfers</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Site-to-site stock dispatch, logistics manifests &amp; verified intake.
                </p>
              </div>
            </div>
            {((stockTransfers || []).filter((t) => t.status === 'IN_TRANSIT').length > 0) && (
              <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full animate-pulse">
                {(stockTransfers || []).filter((t) => t.status === 'IN_TRANSIT').length} In Transit
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Total Logged Consignments: <strong className="text-white font-mono">{(stockTransfers || []).length}</strong>
            </div>
            <button
              id="owner-goto-transfers-btn"
              onClick={() => navigate('stock-transfers')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>Manage Logistics Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Excel / CSV Bulk Data Import Card */}
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-xl p-5 shadow-xs border border-emerald-900/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600/30 border border-emerald-400/30 text-emerald-400 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Excel / CSV Data Import Engine</h3>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Bulk upload products, branch inventory counts, debtors, and suppliers.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full uppercase tracking-wider">
              Ready
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-900/60 flex items-center justify-between">
            <div className="text-xs text-emerald-300/80">
              Auto-validates schemas &bull; Pre-built templates
            </div>
            <button
              id="owner-goto-data-import-btn"
              onClick={() => navigate('data-import')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>Open Import Engine</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lubes Champs Leaderboard & Branch Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Operations & Performance Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Branch Performance &amp; Cash Reconciliation
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('branch-portals')}
                className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition flex items-center space-x-1"
              >
                <span>Branch Portals Hub (View & Edit All) →</span>
              </button>
              <button
                onClick={() => navigate('branch-mgr')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Settings
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Branch / Code</th>
                  <th className="py-3 px-4">Lubes Champ</th>
                  <th className="py-3 px-4 text-right">Lubes Vol</th>
                  <th className="py-3 px-4 text-right">LPG Vol</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchPerformance.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>
                        <span className="font-bold text-slate-800">{b.name}</span>
                        <br />
                        <span className="text-[10px] font-mono text-slate-400">{b.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium text-slate-800">{b.lubesChamp}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{b.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 font-mono">
                      {b.lubesLiters.toLocaleString()} L
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 font-mono">
                      {b.lpgKg.toLocaleString()} Kg
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      K{b.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {b.cashVariance === 0 ? (
                        <span className="text-green-600">K0.00</span>
                      ) : (
                        <span className="text-red-500 font-semibold">{b.cashVariance < 0 ? `-K${Math.abs(b.cashVariance).toFixed(2)}` : `+K${b.cashVariance.toFixed(2)}`}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.cashVariance === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                          Balanced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                          Discrepancy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lubes Champs Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Lubes Champs Leaderboard
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Champs</span>
          </div>

          <div className="p-4 space-y-2 divide-y divide-slate-100 flex-1 overflow-y-auto">
            {lubesChampLeaderboard.map((champ, index) => (
              <div
                key={champ.id}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      index === 0
                        ? 'bg-blue-600 text-white'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">{champ.lubesChamp}</div>
                    <div className="text-[10px] text-slate-400">{champ.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 text-xs font-mono">
                    K{champ.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {champ.lubesLiters}L | {champ.lpgKg}Kg
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
            Performance calculated from live shift logs.
          </div>
        </div>
      </div>

      {/* INTERNAL TREASURY TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Owner Treasury Transfer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Move funds between Cash on Hand, Airtel Float, and Bank
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 pt-4">
              {transferError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer From (Source)
                  </label>
                  <select
                    value={transferSource}
                    onChange={(e) => setTransferSource(e.target.value as CashMovementDestination)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="OWNER_CASH">
                      Cash on Hand (K{ownerTreasury.cashOnHand.toLocaleString()})
                    </option>
                    <option value="BANK">
                      Cash in Bank (K{ownerTreasury.cashInBank.toLocaleString()})
                    </option>
                    <option value="AIRTEL_MONEY">
                      Airtel Money Float (K{ownerTreasury.cashOnAirtelMoney.toLocaleString()})
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer To (Destination)
                  </label>
                  <select
                    value={transferDest}
                    onChange={(e) => setTransferDest(e.target.value as CashMovementDestination)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="BANK">Cash in Bank</option>
                    <option value="OWNER_CASH">Cash on Hand</option>
                    <option value="AIRTEL_MONEY">Airtel Money Float</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transfer Amount (ZMW / K) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">K</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transfer Memo / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank deposit from Cash on Hand"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-2"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Execute Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST OPENING BALANCES MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Adjust Liquid Treasury Balances
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calibrate initial opening figures across accounts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustedTreasury} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Cash on Hand (ZMW)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCashOnHand}
                  onChange={(e) => setEditCashOnHand(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Cash on Airtel Money Float (ZMW)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCashOnAirtel}
                  onChange={(e) => setEditCashOnAirtel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Cash in Bank Accounts (ZMW)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCashInBank}
                  onChange={(e) => setEditCashInBank(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
                >
                  Save Treasury Balances
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
