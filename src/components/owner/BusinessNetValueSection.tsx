import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Landmark,
  Wallet,
  Smartphone,
  Droplets,
  Flame,
  Truck,
  TrendingUp,
  Scale,
  Building2,
  HelpCircle,
  ArrowRight,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface BusinessNetValueSectionProps {
  onNavigateTab?: (tab: string) => void;
  compact?: boolean;
}

export const BusinessNetValueSection: React.FC<BusinessNetValueSectionProps> = ({
  onNavigateTab,
  compact = false,
}) => {
  const {
    branches,
    products,
    branchStocks,
    ownerTreasury,
    bankRecords,
    cashRecords,
    airtelRecords,
    debtors,
    totalDebtorsBalance,
    suppliers,
    supplierTransactions,
    getSupplierBalance,
  } = useApp();

  const [valuationMode, setValuationMode] = useState<'COST' | 'SELLING'>('COST');
  const [expandedSection, setExpandedSection] = useState<'LUBES' | 'LPG' | 'SUPPLIERS' | 'CASH_ON_HAND' | 'CASH_IN_BANK' | 'AIRTEL' | 'DEBTORS' | 'NONE'>('NONE');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');

  // 1. DEBIT SIDE: Liquid Cash
  const cashOnHand = ownerTreasury.cashOnHand || 0;
  const cashInBank = ownerTreasury.cashInBank || 0;
  const cashOnAirtelMoney = ownerTreasury.cashOnAirtelMoney || 0;
  const totalLiquidCash = cashOnHand + cashInBank + cashOnAirtelMoney;

  // 2. DEBIT SIDE: Site Stock Values for Lubes and LPG
  const siteStockData = useMemo(() => {
    return branches.map((branch) => {
      const branchStockEntries = branchStocks.filter((s) => s.branchId === branch.id);

      let lubesUnits = 0;
      let lubesLiters = 0;
      let lubesCostValue = 0;
      let lubesSellingValue = 0;

      let lpgUnits = 0;
      let lpgKg = 0;
      let lpgCostValue = 0;
      let lpgSellingValue = 0;

      branchStockEntries.forEach((stock) => {
        const prod = products.find((p) => p.id === stock.productId);
        if (!prod || stock.quantity <= 0) return;

        if (prod.category === 'LUBRICANTS') {
          lubesUnits += stock.quantity;
          lubesLiters += (prod.volumeLitersOrKg || 0) * stock.quantity;
          lubesCostValue += (prod.costPrice || 0) * stock.quantity;
          lubesSellingValue += (prod.sellingPrice || 0) * stock.quantity;
        } else if (prod.category === 'LPG') {
          lpgUnits += stock.quantity;
          lpgKg += (prod.volumeLitersOrKg || 0) * stock.quantity;
          lpgCostValue += (prod.costPrice || 0) * stock.quantity;
          lpgSellingValue += (prod.sellingPrice || 0) * stock.quantity;
        }
      });

      const totalBranchCostValue = lubesCostValue + lpgCostValue;
      const totalBranchSellingValue = lubesSellingValue + lpgSellingValue;

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        lubesChamp: branch.lubesChamp,
        lubesUnits,
        lubesLiters,
        lubesCostValue,
        lubesSellingValue,
        lubesValue: valuationMode === 'COST' ? lubesCostValue : lubesSellingValue,
        lpgUnits,
        lpgKg,
        lpgCostValue,
        lpgSellingValue,
        lpgValue: valuationMode === 'COST' ? lpgCostValue : lpgSellingValue,
        totalCostValue: totalBranchCostValue,
        totalSellingValue: totalBranchSellingValue,
        totalStockValue: valuationMode === 'COST' ? totalBranchCostValue : totalBranchSellingValue,
      };
    });
  }, [branches, branchStocks, products, valuationMode]);

  // Aggregate Lubes & LPG stock values across all sites
  const totalLubesStockValue = useMemo(() => {
    return siteStockData.reduce((sum, site) => sum + site.lubesValue, 0);
  }, [siteStockData]);

  const totalLpgStockValue = useMemo(() => {
    return siteStockData.reduce((sum, site) => sum + site.lpgValue, 0);
  }, [siteStockData]);

  const totalStockInventoryValue = totalLubesStockValue + totalLpgStockValue;

  // TOTAL DEBITS = Liquid Cash + Lubes Inventory + LPG Inventory + Debtors (Credit Receivables)
  const totalDebits = totalLiquidCash + totalLubesStockValue + totalLpgStockValue + totalDebtorsBalance;

  // 3. CREDIT SIDE: Amounts Owed to Suppliers
  const supplierBalances = useMemo(() => {
    return suppliers.map((supplier) => {
      const balanceInfo = getSupplierBalance(supplier.id);
      return {
        ...supplier,
        invoiced: balanceInfo.totalInvoiced,
        paid: balanceInfo.totalPaid,
        balanceDue: Math.max(0, balanceInfo.balanceDue),
      };
    });
  }, [suppliers, supplierTransactions, getSupplierBalance]);

  const totalSupplierOwed = useMemo(() => {
    return supplierBalances.reduce((sum, s) => sum + s.balanceDue, 0);
  }, [supplierBalances]);

  // TOTAL CREDITS
  const totalCredits = totalSupplierOwed;

  // 4. NET VALUE / PROFIT OF THE BUSINESS = DEBITS - CREDITS
  const netBusinessValue = totalDebits - totalCredits;
  const isSolvent = netBusinessValue >= 0;
  const debtCoverageRatio = totalCredits > 0 ? (totalDebits / totalCredits) : 999;

  const handlePrintStatement = () => {
    window.print();
  };

  const toggleAccordion = (section: 'LUBES' | 'LPG' | 'SUPPLIERS') => {
    setExpandedSection((prev) => (prev === section ? 'NONE' : section));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="business-net-value-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 border-b border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Scale className="w-3.5 h-3.5" />
              <span>Owner Financial Position &amp; Net Worth</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Business Profit &amp; Net Value</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Consolidated real-time valuation calculated strictly as{' '}
              <strong className="text-emerald-400 font-mono">DEBITS − CREDITS</strong>. Integrates physical vault cash,
              bank deposits, Airtel Money float, site-by-site motor oil &amp; LPG stock inventory, minus supplier payables.
            </p>
          </div>

          {/* Controls & Valuation Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setValuationMode('COST')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  valuationMode === 'COST'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Cost Price (Asset Standard)
              </button>
              <button
                type="button"
                onClick={() => setValuationMode('SELLING')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  valuationMode === 'SELLING'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Retail / Selling Price
              </button>
            </div>

            <button
              onClick={handlePrintStatement}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Print Net Worth Statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Export</span>
            </button>
          </div>
        </div>

        {/* Master Net Value Display */}
        <div className="mt-6 pt-5 border-t border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Net Value Result */}
          <div className="md:col-span-1 bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Net Business Value (Equity)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSolvent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {isSolvent ? 'Solvent / Positive Net Worth' : 'Deficit / High Payables'}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono mt-2 text-emerald-400">
                K{netBusinessValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center space-x-1">
              <span>Formula:</span>
              <strong className="text-slate-200">K{totalDebits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              <span>(Debits) −</span>
              <strong className="text-rose-300">K{totalCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              <span>(Credits)</span>
            </div>
          </div>

          {/* Total Debits Quick Card */}
          <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span className="uppercase tracking-wider text-[11px]">TOTAL DEBIT SIDE</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-200 rounded-full font-mono font-bold">
                  + Assets &amp; Inventory
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-emerald-300">
                K{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-2 flex items-center justify-between">
              <span>Liquid: K{totalLiquidCash.toLocaleString()}</span>
              <span>Stocks: K{totalStockInventoryValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Total Credits Quick Card */}
          <div className="bg-rose-950/40 rounded-xl p-4 border border-rose-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
                <span className="uppercase tracking-wider text-[11px]">TOTAL CREDIT SIDE</span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-200 rounded-full font-mono font-bold">
                  − Liabilities
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-2 text-rose-300">
                K{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-[11px] text-rose-300/90 mt-2 flex items-center justify-between">
              <span>Supplier Balance Due</span>
              <span>{supplierBalances.filter((s) => s.balanceDue > 0).length} Suppliers Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN BALANCE SHEET / T-ACCOUNT LEDGER */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50">
        
        {/* ===================== LEFT: DEBIT SIDE ===================== */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-950 text-sm sm:text-base">
                  DEBIT SIDE (Assets &amp; Stocks)
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Cash on Hand, Bank, Airtel Float &amp; Site-by-Site Stocks
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Debits</span>
              <span className="text-base sm:text-lg font-black text-emerald-900 font-mono">
                +K{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* 1, 2, 3: LIQUID CASH ACCOUNTS */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200/80 pb-2">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  <span>Liquid Cash &amp; Bank Treasury</span>
                </span>
                <span className="font-mono text-emerald-700 font-bold">
                  Subtotal: K{totalLiquidCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. Cash on Hand */}
                <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                  <div
                    onClick={() => setExpandedSection(expandedSection === 'CASH_ON_HAND' ? 'NONE' : 'CASH_ON_HAND')}
                    className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-emerald-50/50 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-emerald-100 text-emerald-800">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">1. Cash on Hand (Physical)</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                            {cashRecords.length} Entries
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">Physical drawer/vault cash in Owner safe</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        K{cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {expandedSection === 'CASH_ON_HAND' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Mini-Ledger Preview for Cash on Hand */}
                  {expandedSection === 'CASH_ON_HAND' && (
                    <div className="p-3 bg-emerald-50/30 border-t border-slate-200 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cash on Hand Ledger Records</span>
                        </span>
                        {onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('cash-records')}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 underline cursor-pointer"
                          >
                            <span>Open Full Cash Records</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded border border-emerald-200 bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-emerald-900 text-white font-bold uppercase">
                            <tr>
                              <th className="p-1.5 w-20">1. DATE</th>
                              <th className="p-1.5">2. DETAILS</th>
                              <th className="p-1.5 text-right text-emerald-300 w-24">3. DEBIT (K)</th>
                              <th className="p-1.5 text-right text-rose-300 w-24">4. CREDIT (K)</th>
                              <th className="p-1.5 text-right text-emerald-200 w-28">5. BALANCE (K)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {cashRecords.slice(-5).map((r) => (
                              <tr key={r.id} className="hover:bg-emerald-50/50">
                                <td className="p-1.5 text-slate-600 font-sans">{r.date}</td>
                                <td className="p-1.5 text-slate-800 font-sans font-medium truncate max-w-xs">{r.details}</td>
                                <td className="p-1.5 text-right text-emerald-700 font-bold">
                                  {r.debit > 0 ? `+${r.debit.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-1.5 text-right text-rose-700 font-bold">
                                  {r.credit > 0 ? `-${r.credit.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-1.5 text-right font-black text-emerald-950 bg-emerald-50/50">
                                  K{r.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-emerald-100/70 border-t border-emerald-200 font-bold">
                            <tr>
                              <td colSpan={4} className="p-1.5 text-emerald-950 font-sans uppercase text-[10px]">
                                Current Cash on Hand Balance:
                              </td>
                              <td className="p-1.5 text-right text-emerald-950 font-black">
                                K{cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Cash at Bank */}
                <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                  <div
                    onClick={() => setExpandedSection(expandedSection === 'CASH_IN_BANK' ? 'NONE' : 'CASH_IN_BANK')}
                    className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-blue-50/50 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-blue-100 text-blue-800">
                        <Landmark className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">2. Cash at Bank</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">
                            {bankRecords.length} Entries
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">Operating bank accounts (Zanaco, Stanbic, etc.)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        K{cashInBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {expandedSection === 'CASH_IN_BANK' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Mini-Ledger Preview for Cash at Bank */}
                  {expandedSection === 'CASH_IN_BANK' && (
                    <div className="p-3 bg-blue-50/30 border-t border-slate-200 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Bank Account Ledger Records</span>
                        </span>
                        {onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('bank-records')}
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 underline cursor-pointer"
                          >
                            <span>Open Full Bank Records</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded border border-blue-200 bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-900 text-white font-bold uppercase">
                            <tr>
                              <th className="p-1.5 w-20">1. DATE</th>
                              <th className="p-1.5">2. DETAILS</th>
                              <th className="p-1.5 text-right text-emerald-300 w-24">3. DEBIT (K)</th>
                              <th className="p-1.5 text-right text-rose-300 w-24">4. CREDIT (K)</th>
                              <th className="p-1.5 text-right text-blue-200 w-28">5. BALANCE (K)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {bankRecords.slice(-5).map((r) => (
                              <tr key={r.id} className="hover:bg-blue-50/50">
                                <td className="p-1.5 text-slate-600 font-sans">{r.date}</td>
                                <td className="p-1.5 text-slate-800 font-sans font-medium truncate max-w-xs">{r.details}</td>
                                <td className="p-1.5 text-right text-emerald-700 font-bold">
                                  {r.debit > 0 ? `+${r.debit.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-1.5 text-right text-rose-700 font-bold">
                                  {r.credit > 0 ? `-${r.credit.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-1.5 text-right font-black text-blue-950 bg-blue-50/50">
                                  K{r.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-blue-100/70 border-t border-blue-200 font-bold">
                            <tr>
                              <td colSpan={4} className="p-1.5 text-blue-950 font-sans uppercase text-[10px]">
                                Current Bank Balance:
                              </td>
                              <td className="p-1.5 text-right text-blue-950 font-black">
                                K{cashInBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Cash in Airtel Money */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded bg-red-100 text-red-800">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">3. Cash in Airtel Money</span>
                      <p className="text-[10px] text-slate-500">Corporate float wallet balance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      K{cashOnAirtelMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('airtel-records')}
                        className="text-[10px] text-red-600 hover:text-red-800 underline font-semibold cursor-pointer"
                        title="View Airtel Records"
                      >
                        Records
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. VALUE FOR LUBES IN STOCK FOR EACH SITE */}
            <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50/20">
              <div
                onClick={() => toggleAccordion('LUBES')}
                className="p-3.5 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-blue-950 text-xs sm:text-sm">
                        4. Value for Lubes in Stock (Each Site)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-200 text-blue-900 rounded-full font-bold">
                        {branches.length} Sites
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-800">
                      {valuationMode === 'COST' ? 'Valued at Cost Price' : 'Valued at Selling Price'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm sm:text-base font-black text-blue-950 font-mono">
                    K{totalLubesStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  {expandedSection === 'LUBES' ? (
                    <ChevronUp className="w-4 h-4 text-blue-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-700" />
                  )}
                </div>
              </div>

              {/* Lubes Site by Site List */}
              <div className="p-3 space-y-2 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siteStockData.map((site) => (
                    <div
                      key={site.branchId}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{site.branchName}</span>
                          <span className="text-[10px] font-mono text-slate-400">Code: {site.branchCode}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {site.lubesLiters.toLocaleString()} L
                        </span>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {site.lubesUnits} units
                        </span>
                        <span className="text-xs font-bold text-blue-950 font-mono">
                          K{site.lubesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. VALUE FOR LPG IN STOCK FOR EACH SITE */}
            <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/20">
              <div
                onClick={() => toggleAccordion('LPG')}
                className="p-3.5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-amber-950 text-xs sm:text-sm">
                        5. Value for LPG in Stock (Each Site)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold">
                        {branches.length} Sites
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-800">
                      {valuationMode === 'COST' ? 'Valued at Cost Price' : 'Valued at Selling Price'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm sm:text-base font-black text-amber-950 font-mono">
                    K{totalLpgStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  {expandedSection === 'LPG' ? (
                    <ChevronUp className="w-4 h-4 text-amber-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-amber-700" />
                  )}
                </div>
              </div>

              {/* LPG Site by Site List */}
              <div className="p-3 space-y-2 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siteStockData.map((site) => (
                    <div
                      key={site.branchId}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-amber-50/40 transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{site.branchName}</span>
                          <span className="text-[10px] font-mono text-slate-400">Code: {site.branchCode}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {site.lpgKg.toLocaleString()} Kg
                        </span>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {site.lpgUnits} cylinders
                        </span>
                        <span className="text-xs font-bold text-amber-950 font-mono">
                          K{site.lpgValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. DEBTORS (CREDIT SALES / RECEIVABLES) - ONLY ONE TOTAL VALUE */}
            <div className="border border-purple-200 rounded-xl p-3.5 bg-purple-50/40 hover:bg-purple-50/70 transition flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-purple-700 text-white shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-purple-950 text-xs sm:text-sm">
                      6. Debtors (Credit Sales Receivables)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded-full font-bold">
                      {debtors.filter((d) => d.outstandingBalance > 0).length} Accounts Owing
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    Consolidated outstanding balance due from credit customers
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm sm:text-base font-black text-purple-950 font-mono block">
                  K{totalDebtorsBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('debtors')}
                    className="text-[10px] text-purple-700 hover:text-purple-900 font-bold underline inline-flex items-center space-x-0.5 cursor-pointer mt-0.5"
                  >
                    <span>View Debtors</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Debit Subtotal Footer */}
          <div className="p-3.5 bg-emerald-50/40 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">Total Debit Value (Sum of 1 through 6)</span>
            <span className="font-black text-emerald-900 font-mono text-sm">
              K{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* ===================== RIGHT: CREDIT SIDE ===================== */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-rose-50/80 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-rose-950 text-sm sm:text-base">
                  CREDIT SIDE (Liabilities &amp; Payables)
                </h3>
                <p className="text-[11px] text-rose-800">
                  Amount Owed to Registered Fuel &amp; Gas Suppliers
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Credits</span>
              <span className="text-base sm:text-lg font-black text-rose-900 font-mono">
                −K{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* 1. AMOUNT OWED TO SUPPLIERS - ONLY ONE TOTAL VALUE */}
            <div className="border border-rose-200 rounded-xl p-3.5 bg-rose-50/40 hover:bg-rose-50/70 transition flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-rose-700 text-white shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-rose-950 text-xs sm:text-sm">
                      1. Amount Owed to Suppliers (Payables)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded-full font-bold">
                      {suppliers.filter((s) => getSupplierBalance(s.id).balanceDue > 0).length} Suppliers Due
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Consolidated payables balance due across all {suppliers.length} supplier accounts
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm sm:text-base font-black text-rose-950 font-mono block">
                  K{totalSupplierOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('supplier-ledger')}
                    className="text-[10px] text-rose-700 hover:text-rose-900 font-bold underline inline-flex items-center space-x-0.5 cursor-pointer mt-0.5"
                  >
                    <span>Supplier Accounts</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Solvency & Debt Ratio Metric Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Financial Solvency &amp; Debt Coverage</span>
                </span>
                <span className="font-bold text-emerald-700">
                  {totalCredits > 0 ? `${debtCoverageRatio.toFixed(1)}x Assets/Debt` : '100% Debt Free'}
                </span>
              </div>

              {/* Visual Coverage Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: totalDebits + totalCredits > 0
                        ? `${Math.min(100, (totalDebits / (totalDebits + totalCredits)) * 100)}%`
                        : '50%',
                    }}
                    title="Debits (Assets)"
                  ></div>
                  <div
                    className="bg-rose-500 h-full"
                    style={{
                      width: totalDebits + totalCredits > 0
                        ? `${Math.min(100, (totalCredits / (totalDebits + totalCredits)) * 100)}%`
                        : '50%',
                    }}
                    title="Credits (Liabilities)"
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="text-emerald-700 font-semibold">● Assets &amp; Stocks ({((totalDebits / (totalDebits + totalCredits || 1)) * 100).toFixed(0)}%)</span>
                  <span className="text-rose-700 font-semibold">● Supplier Debt ({((totalCredits / (totalDebits + totalCredits || 1)) * 100).toFixed(0)}%)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Total liquid funds and physical site stocks exceed supplier payables by{' '}
                <strong className="text-emerald-700 font-mono">
                  K{netBusinessValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
                . The business retains strong positive equity.
              </p>
            </div>
          </div>

          {/* Credit Subtotal Footer */}
          <div className="p-3.5 bg-rose-50/40 border-t border-rose-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-900">Total Credit Value (Amount Owed to Suppliers)</span>
            <span className="font-black text-rose-900 font-mono text-sm">
              K{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* CONSOLIDATED SITE MATRIX TABLE (ALL SITES DEBIT BREAKDOWN) */}
      <div className="p-5 sm:p-6 border-t border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Consolidated Site-by-Site Stock Valuation Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of Lubes and LPG inventory value across all active retail &amp; wholesale sites.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Valuation:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {valuationMode === 'COST' ? 'Cost Price (ZMW)' : 'Retail Selling Price (ZMW)'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Site / Code</th>
                <th className="py-3 px-4">Lubes Champ</th>
                <th className="py-3 px-4 text-right">Lubes Qty (Liters)</th>
                <th className="py-3 px-4 text-right">Lubes Value (ZMW)</th>
                <th className="py-3 px-4 text-right">LPG Qty (Kg)</th>
                <th className="py-3 px-4 text-right">LPG Value (ZMW)</th>
                <th className="py-3 px-4 text-right">Total Site Stock Value</th>
                <th className="py-3 px-4 text-right">% of Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siteStockData.map((site) => {
                const pctOfTotal = totalStockInventoryValue > 0 ? (site.totalStockValue / totalStockInventoryValue) * 100 : 0;
                return (
                  <tr key={site.branchId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>
                        <span className="font-bold text-slate-800">{site.branchName}</span>
                        <br />
                        <span className="text-[10px] font-mono text-slate-400">{site.branchCode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {site.lubesChamp}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {site.lubesUnits} units ({site.lubesLiters.toLocaleString()} L)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-blue-900">
                      K{site.lubesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {site.lpgUnits} cyl ({site.lpgKg.toLocaleString()} Kg)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-900">
                      K{site.lpgValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      K{site.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold">
                        {pctOfTotal.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 text-slate-900 font-bold border-t border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-4 uppercase text-xs">
                  Grand Inventory Totals
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs">
                  {siteStockData.reduce((s, x) => s + x.lubesLiters, 0).toLocaleString()} Liters
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-900 text-xs font-bold">
                  K{totalLubesStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs">
                  {siteStockData.reduce((s, x) => s + x.lpgKg, 0).toLocaleString()} Kg
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-900 text-xs font-bold">
                  K{totalLpgStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-900 text-sm font-black">
                  K{totalStockInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs">
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
