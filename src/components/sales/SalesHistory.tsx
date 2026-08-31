import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesRecord, DailySalesPostingStatus } from '../../types';
import { DayByDaySalesView } from './DayByDaySalesView';
import { ProductByProductSalesView } from './ProductByProductSalesView';
import { SalesAdjustmentModal } from './SalesAdjustmentModal';
import { SalesDeleteModal } from './SalesDeleteModal';
import {
  Receipt,
  Search,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Smartphone,
  ChevronDown,
  ChevronUp,
  UserCheck,
  CalendarDays,
  Package,
  ListFilter,
  Edit3,
  Trash2,
  CheckCheck,
  Lock,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';

interface SalesHistoryProps {
  branchIdFilter?: string | null;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ branchIdFilter }) => {
  const {
    dailySales,
    branches,
    role,
    unpostedDailySales,
    unpostedDailySalesCount,
    approveAndPostDailySale,
    rejectDailySale,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'DAY_BY_DAY' | 'PRODUCT_BY_PRODUCT' | 'ALL_LOGS'>('DAY_BY_DAY');
  const [selectedBranch, setSelectedBranch] = useState<string>(branchIdFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPOSTED' | 'POSTED_APPROVED' | 'DRAFT' | 'DISCREPANCIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Modals for adjustments & deletions
  const [editingSale, setEditingSale] = useState<DailySalesRecord | null>(null);
  const [deletingSale, setDeletingSale] = useState<DailySalesRecord | null>(null);

  // Reject modal state
  const [rejectingSale, setRejectingSale] = useState<DailySalesRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const filteredSales = dailySales.filter((sale) => {
    const matchesBranch =
      selectedBranch === 'ALL' || sale.branchId === selectedBranch;

    let matchesStatus = true;
    if (statusFilter === 'UNPOSTED') {
      matchesStatus = sale.postingStatus === 'UNPOSTED';
    } else if (statusFilter === 'POSTED_APPROVED') {
      matchesStatus = sale.postingStatus === 'POSTED_APPROVED';
    } else if (statusFilter === 'DRAFT') {
      matchesStatus = sale.postingStatus === 'DRAFT';
    } else if (statusFilter === 'DISCREPANCIES') {
      matchesStatus = Math.abs(sale.cashVariance) > 0.01;
    }

    const matchesQuery =
      sale.lubesChamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.airtelMoneyTxRef && sale.airtelMoneyTxRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sale.date.includes(searchQuery) ||
      sale.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesBranch && matchesStatus && matchesQuery;
  });

  const handleApprove = (saleId: string) => {
    const res = approveAndPostDailySale(saleId, 'Executive Owner');
    setActionFeedback({
      type: 'success',
      text: res.message,
    });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleConfirmReject = () => {
    if (!rejectingSale) return;
    if (!rejectReason.trim()) {
      alert('Please enter a note explaining why this shift is being returned to the branch.');
      return;
    }
    const res = rejectDailySale(rejectingSale.id, rejectReason.trim());
    setRejectingSale(null);
    setRejectReason('');
    setActionFeedback({
      type: 'info',
      text: res.message,
    });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <RotateCcw className="w-5 h-5 text-amber-600" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)}>
            <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
          </button>
        </div>
      )}

      {/* UNPOSTED BRANCH SUBMISSIONS AWAITING OWNER APPROVAL BANNER */}
      {unpostedDailySalesCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 rounded-2xl p-5 shadow-xs space-y-4 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                  <span>Branch Shifts Awaiting Owner Approval ({unpostedDailySalesCount})</span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Branches have posted these daily shifts. Review and click "Approve" to commit transactions to Bank, Cash, Airtel, Debtors, and Inventory.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {unpostedDailySales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      {sale.branchCode}
                    </span>
                    <strong className="text-slate-900 text-sm">{sale.branchName}</strong>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-700">{sale.date}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {sale.shift}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Lubes Champ: <strong>{sale.lubesChamp}</strong></span>
                    <span>Items: <strong>{sale.items.length} SKUs ({sale.items.reduce((s, i) => s + i.quantity, 0)} units)</strong></span>
                    <span>Revenue: <strong className="text-slate-900 font-black">K{sale.totalSalesAmount.toLocaleString()}</strong></span>
                    <span>Counted Cash: <strong>K{sale.actualCashReceived.toLocaleString()}</strong></span>
                    {sale.cashSentToAirtelMoney > 0 && (
                      <span className="text-red-700">Airtel Float: <strong>K{sale.cashSentToAirtelMoney}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingSale(sale)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Review &amp; Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRejectingSale(sale)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(sale.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Approve &amp; Post to Ledgers</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perspective Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('DAY_BY_DAY')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'DAY_BY_DAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Day-by-Day View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRODUCT_BY_PRODUCT')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'PRODUCT_BY_PRODUCT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product-by-Product View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL_LOGS')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'ALL_LOGS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>All Shift Logs ({dailySales.length})</span>
          </button>
        </div>

        {role === 'OWNER' && (
          <div className="text-xs text-slate-500 flex items-center space-x-1.5 bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-semibold text-blue-950">Executive Owner Portal:</span>
            <span>Restricted log &amp; ledger management</span>
          </div>
        )}
      </div>

      {/* Render Active View */}
      {activeTab === 'DAY_BY_DAY' && (
        <DayByDaySalesView branchIdFilter={branchIdFilter} />
      )}

      {activeTab === 'PRODUCT_BY_PRODUCT' && (
        <ProductByProductSalesView branchIdFilter={branchIdFilter} />
      )}

      {activeTab === 'ALL_LOGS' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4" />
                <span>Sales &amp; Cash Reconciliation History</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Daily Sales Logs &amp; Audit Trail
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Shift sales records, item volume breakdowns, payment channels, cash discrepancies, and mobile money deposits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Lubes Champ, Tx Ref, Date, Product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-64 focus:bg-white"
                />
              </div>

              {!branchIdFilter && (
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
              )}
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Records ({dailySales.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('UNPOSTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                statusFilter === 'UNPOSTED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>Pending Approval</span>
              <span className="bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">
                {dailySales.filter((s) => s.postingStatus === 'UNPOSTED').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('POSTED_APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                statusFilter === 'POSTED_APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>Approved &amp; Posted</span>
              <span className="bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px]">
                {dailySales.filter((s) => s.postingStatus === 'POSTED_APPROVED').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'DRAFT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Drafts ({dailySales.filter((s) => s.postingStatus === 'DRAFT').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISCREPANCIES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'DISCREPANCIES'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              With Discrepancies ({dailySales.filter((s) => Math.abs(s.cashVariance) > 0.01).length})
            </button>
          </div>

          {/* Sales Records List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Recorded Shift Sales Logs ({filteredSales.length} records)
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Click any entry to inspect items breakdown &amp; cash reconciliations
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const hasVariance = Math.abs(sale.cashVariance) > 0.01;

                  return (
                    <div key={sale.id} className="p-5 transition hover:bg-slate-50/50">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Info clickable */}
                        <div
                          onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                          className="space-y-1.5 cursor-pointer flex-1"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                              {sale.branchCode}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{sale.branchName}</h4>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-700 font-semibold">{sale.date}</span>
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded font-medium">
                              {sale.shift}
                            </span>

                            {/* Posting Status Badge */}
                            {sale.postingStatus === 'POSTED_APPROVED' ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>Approved &amp; Posted</span>
                              </span>
                            ) : sale.postingStatus === 'UNPOSTED' ? (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pending Approval (Unposted)</span>
                              </span>
                            ) : sale.postingStatus === 'REJECTED' ? (
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <RotateCcw className="w-3 h-3 text-rose-600" />
                                <span>Returned for Revision</span>
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Draft
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center text-xs text-slate-500 gap-x-4 gap-y-1">
                            <div className="flex items-center space-x-1">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lubes Champ: <strong>{sale.lubesChamp}</strong></span>
                            </div>
                            <span>
                              Items Sold: <strong>{sale.items.length} SKUs ({sale.items.reduce((s, i) => s + i.quantity, 0)} units)</strong>
                            </span>
                            {sale.cashSentToAirtelMoney > 0 && (
                              <div className="flex items-center space-x-1 text-red-700">
                                <Smartphone className="w-3 h-3" />
                                <span>Sent Airtel: <strong>K{sale.cashSentToAirtelMoney}</strong> ({sale.airtelMoneyTxRef || 'No ref'})</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Metrics & Action Buttons */}
                        <div className="flex items-center justify-between lg:justify-end space-x-5 border-t lg:border-t-0 pt-3 lg:pt-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total Sales Revenue</div>
                            <div className="text-base sm:text-lg font-black text-slate-900">
                              K{sale.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-bold">
                              Gross Profit: +K{sale.grossProfit.toFixed(2)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-500">Cash Variance</div>
                            <div
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                hasVariance
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {hasVariance
                                ? `${sale.cashVariance < 0 ? `-K${Math.abs(sale.cashVariance)}` : `+K${sale.cashVariance}`}`
                                : '✓ Balanced'}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
                            {sale.postingStatus === 'UNPOSTED' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(sale.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                                title="Approve and post to ledgers"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingSale(sale)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-blue-200"
                              title="Adjust / Edit Sales Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Adjust</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingSale(sale)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition border border-red-200"
                              title="Delete Sales Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-xl">
                          {/* Item lines */}
                          <div>
                            <h5 className="text-xs font-bold text-slate-700 uppercase mb-2">
                              Product Volume &amp; SKU Lines
                            </h5>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2 px-3">Product Name</th>
                                    <th className="py-2 px-3">SKU</th>
                                    <th className="py-2 px-3">Category</th>
                                    <th className="py-2 px-3 text-center">Unit</th>
                                    <th className="py-2 px-3 text-center">Qty</th>
                                    <th className="py-2 px-3 text-right">Unit Price</th>
                                    <th className="py-2 px-3 text-right">Total</th>
                                    <th className="py-2 px-3 text-right">Profit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {sale.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-2 px-3 font-medium text-slate-900">{item.productName}</td>
                                      <td className="py-2 px-3 font-mono text-slate-500">{item.productCode}</td>
                                      <td className="py-2 px-3">{item.category}</td>
                                      <td className="py-2 px-3 text-center">{item.unit}</td>
                                      <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                                      <td className="py-2 px-3 text-right">K{item.unitPrice.toFixed(2)}</td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-900">K{item.totalAmount.toFixed(2)}</td>
                                      <td className="py-2 px-3 text-right text-emerald-700 font-semibold">+K{item.profit.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Reconciliation Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                            <div>
                              <div className="font-semibold text-slate-500">Payment Breakdown:</div>
                              <div className="mt-1 space-y-0.5">
                                <div>Cash: <strong>K{sale.paymentBreakdown.cashSales}</strong></div>
                                <div>Airtel Direct Till: <strong>K{sale.paymentBreakdown.airtelMoneyDirectSales}</strong></div>
                                <div>Bank/Card: <strong>K{sale.paymentBreakdown.bankOrCardSales}</strong></div>
                                <div>Credit: <strong>K{sale.paymentBreakdown.creditSales || 0}</strong> {sale.creditDebtorName ? `(${sale.creditDebtorName})` : ''}</div>
                              </div>
                            </div>

                            <div>
                              <div className="font-semibold text-slate-500">Cash Reconciliation:</div>
                              <div className="mt-1 space-y-0.5">
                                <div>Expected Cash: <strong>K{sale.expectedCashFromSales}</strong></div>
                                <div>Actual Cash Counted: <strong>K{sale.actualCashReceived}</strong></div>
                                <div>Variance: <strong className={hasVariance ? 'text-red-600' : 'text-emerald-600'}>{sale.cashVariance >= 0 ? `+K${sale.cashVariance}` : `-K${Math.abs(sale.cashVariance)}`}</strong></div>
                              </div>
                            </div>

                            <div>
                              <div className="font-semibold text-slate-500">Drawer Position:</div>
                              <div className="mt-1 space-y-0.5">
                                
                                <div>Airtel Deposit: <strong>K{sale.cashSentToAirtelMoney}</strong></div>
                                <div>Petty Cash: <strong>K{sale.totalPettyExpenses}</strong></div>
                                <div>Closing Drawer: <strong>K{sale.closingCashInDrawer}</strong></div>
                              </div>
                            </div>
                          </div>

                          {sale.notes && (
                            <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                              Shift Notes / Audit History: &quot;{sale.notes}&quot;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No sales shift records found matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center space-x-2 text-rose-700">
                <RotateCcw className="w-5 h-5" />
                <span>Return Shift to {rejectingSale.branchName}</span>
              </h3>
              <button
                onClick={() => setRejectingSale(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the revision instructions for the branch manager for the shift on <strong>{rejectingSale.date}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correction Instructions *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please check cash count and Airtel remittance slip..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingSale(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

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
