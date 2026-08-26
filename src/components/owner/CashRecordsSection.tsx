import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CashRecord } from '../../types';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ShieldCheck,
  Building2,
  Vault,
  AlertCircle,
} from 'lucide-react';

interface CashRecordsSectionProps {
  onNavigateTab?: (tab: string) => void;
  standalone?: boolean;
}

export const CashRecordsSection: React.FC<CashRecordsSectionProps> = ({
  onNavigateTab,
  standalone = true,
}) => {
  const {
    cashRecords,
    ownerTreasury,
    addCashRecord,
    updateCashRecord,
    deleteCashRecord,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS'>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<CashRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    details: '',
    txType: 'DEBIT' as 'DEBIT' | 'CREDIT',
    amount: '',
    referenceNo: '',
    category: 'BRANCH_HANDOVER' as NonNullable<CashRecord['category']>,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return cashRecords.filter((rec) => {
      // Search
      const matchesSearch =
        !query ||
        rec.details.toLowerCase().includes(query) ||
        (rec.referenceNo && rec.referenceNo.toLowerCase().includes(query)) ||
        rec.date.includes(query);

      // Category
      const matchesCategory =
        categoryFilter === 'ALL' || rec.category === categoryFilter;

      // Date Range
      let matchesDate = true;
      if (dateRangeFilter === 'THIS_MONTH') {
        matchesDate = rec.date.startsWith(currentMonthStr);
      } else if (dateRangeFilter === 'LAST_30_DAYS') {
        const recDate = new Date(rec.date).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        matchesDate = recDate >= thirtyDaysAgo;
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [cashRecords, searchQuery, categoryFilter, dateRangeFilter]);

  // Aggregate stats
  const totalDebits = useMemo(() => {
    return cashRecords.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  }, [cashRecords]);

  const totalCredits = useMemo(() => {
    return cashRecords.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  }, [cashRecords]);

  const closingBalance = useMemo(() => {
    return cashRecords.length > 0 ? cashRecords[cashRecords.length - 1].balance : ownerTreasury.cashOnHand;
  }, [cashRecords, ownerTreasury.cashOnHand]);

  // Handle Add / Edit Submission
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid positive transaction amount.');
      return;
    }
    if (!formData.details.trim()) {
      setFormError('Please enter transaction details or description.');
      return;
    }

    const debitAmt = formData.txType === 'DEBIT' ? amt : 0;
    const creditAmt = formData.txType === 'CREDIT' ? amt : 0;

    if (editingRecord) {
      updateCashRecord(editingRecord.id, {
        date: formData.date,
        details: formData.details.trim(),
        debit: debitAmt,
        credit: creditAmt,
        referenceNo: formData.referenceNo.trim() || undefined,
        category: formData.category,
      });
    } else {
      addCashRecord({
        date: formData.date,
        details: formData.details.trim(),
        debit: debitAmt,
        credit: creditAmt,
        referenceNo: formData.referenceNo.trim() || undefined,
        category: formData.category,
      });
    }

    setIsAddModalOpen(false);
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      details: '',
      txType: 'DEBIT',
      amount: '',
      referenceNo: '',
      category: 'BRANCH_HANDOVER',
    });
  };

  const handleOpenEdit = (rec: CashRecord) => {
    setEditingRecord(rec);
    const isDebit = (rec.debit || 0) > 0;
    setFormData({
      date: rec.date,
      details: rec.details,
      txType: isDebit ? 'DEBIT' : 'CREDIT',
      amount: String(isDebit ? rec.debit : rec.credit),
      referenceNo: rec.referenceNo || '',
      category: rec.category || 'OTHER',
    });
    setIsAddModalOpen(true);
  };

  const handleRequestDelete = (rec: CashRecord) => {
    setRecordToDelete(rec);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const details = recordToDelete.details;
    deleteCashRecord(recordToDelete.id);
    setSelectedIds((prev) => prev.filter((id) => id !== recordToDelete.id));
    setRecordToDelete(null);
    if (editingRecord?.id === recordToDelete.id) {
      setIsAddModalOpen(false);
      setEditingRecord(null);
    }
    setActionSuccessMessage(`Cash entry "${details}" was permanently deleted and cash balances were updated.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    selectedIds.forEach((id) => {
      deleteCashRecord(id);
    });
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
    setActionSuccessMessage(`${count} physical cash entries were permanently deleted and running balances were recalculated.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['DATE', 'DETAILS', 'REFERENCE', 'CATEGORY', 'DEBIT (K)', 'CREDIT (K)', 'BALANCE (K)'];
    const rows = filteredRecords.map((r) => [
      r.date,
      `"${r.details.replace(/"/g, '""')}"`,
      r.referenceNo || '',
      r.category || '',
      (r.debit || 0).toFixed(2),
      (r.credit || 0).toFixed(2),
      (r.balance || 0).toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cash_records_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="cash-records-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Cash on Hand &amp; Vault Ledger
              </span>
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced with Business Net Value</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-center space-x-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              <span>Cash Records (Cash on Hand)</span>
            </h2>
            <p className="text-emerald-200/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Audited ledger of physical cash kept on hand in the owner vault, drawer, or safe. Displays Date, Details, Debit (Cash Receipts), Credit (Cash Disbursals), and Running Balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingRecord(null);
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  details: '',
                  txType: 'DEBIT',
                  amount: '',
                  referenceNo: '',
                  category: 'BRANCH_HANDOVER',
                });
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Cash Entry</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 flex items-center space-x-1.5 transition cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('net-value')}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-300 font-semibold rounded-xl text-xs sm:text-sm border border-emerald-400/30 flex items-center space-x-1.5 transition cursor-pointer"
                title="Go to Business Net Value"
              >
                <span>View Business Value</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-emerald-800/60">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-medium">
              <span>Total Debits (Cash In)</span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono mt-1.5 text-emerald-300">
              K{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">Branch handovers &amp; cash in</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-medium">
              <span>Total Credits (Cash Out)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono mt-1.5 text-rose-300">
              K{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">Petty cash &amp; cash settlements</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-medium">
              <span>Net Cash Flow</span>
              <Scale className="w-3.5 h-3.5 text-teal-300" />
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono mt-1.5 text-white">
              {totalDebits >= totalCredits ? '+' : ''}
              K{(totalDebits - totalCredits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">Debits minus Credits</div>
          </div>

          <div className="bg-emerald-950/70 rounded-xl p-3.5 border border-emerald-400/50">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
              <span>CASH ON HAND BALANCE</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-1.5 text-emerald-300">
              K{closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-1 font-semibold flex items-center space-x-1">
              <span>✓ Matches Business Net Value Section</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-200 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cash details, voucher#, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="BRANCH_HANDOVER">Branch Handovers</option>
              <option value="PETTY_CASH">Petty Cash &amp; Operations</option>
              <option value="SUPPLIER_PAYMENT">Supplier Settlements</option>
              <option value="INTERNAL_TRANSFER">Internal Transfers</option>
              <option value="DRAWING">Owner Drawings</option>
              <option value="OTHER">Other Entries</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden text-xs"
            >
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium px-2">
            Showing <strong className="text-slate-800">{filteredRecords.length}</strong> of {cashRecords.length} entries
          </span>
        </div>
      </div>

      {/* THE 5-COLUMN CASH LEDGER TABLE (DATE, DETAILS, DEBIT, CREDIT, BALANCE) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="cash-records-table">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-600 bg-slate-800 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    title="Select / Deselect all"
                  />
                </th>
                <th className="py-3.5 px-4 w-32">1. DATE</th>
                <th className="py-3.5 px-4">2. DETAILS</th>
                <th className="py-3.5 px-4 text-right w-36 text-emerald-300">3. DEBIT (K)</th>
                <th className="py-3.5 px-4 text-right w-36 text-rose-300">4. CREDIT (K)</th>
                <th className="py-3.5 px-4 text-right w-44 text-emerald-300">5. BALANCE (K)</th>
                <th className="py-3.5 px-4 text-center w-24">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No cash on hand records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || categoryFilter !== 'ALL'
                        ? 'Try clearing your search or category filters.'
                        : 'Click "Record Cash Entry" above to add your first physical cash transaction.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isDebit = (record.debit || 0) > 0;
                  const isCredit = (record.credit || 0) > 0;
                  const isSelected = selectedIds.includes(record.id);

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-emerald-50/40 transition group ${
                        isSelected ? 'bg-emerald-50/70' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(record.id)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* 1. DATE */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.date}</span>
                        </div>
                      </td>

                      {/* 2. DETAILS */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center space-x-2">
                          <span>{record.details}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {record.referenceNo && (
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-medium border border-slate-200">
                              Ref: {record.referenceNo}
                            </span>
                          )}
                          {record.category && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              record.category === 'BRANCH_HANDOVER'
                                ? 'bg-emerald-100 text-emerald-800'
                                : record.category === 'SUPPLIER_PAYMENT'
                                ? 'bg-rose-100 text-rose-800'
                                : record.category === 'PETTY_CASH'
                                ? 'bg-amber-100 text-amber-800'
                                : record.category === 'INTERNAL_TRANSFER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {record.category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. DEBIT */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {isDebit ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 inline-block">
                            +{(record.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>

                      {/* 4. CREDIT */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {isCredit ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200/60 inline-block">
                            -{(record.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>

                      {/* 5. BALANCE */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                        <span className="text-emerald-900 text-sm">
                          K{(record.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Edit Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRequestDelete(record)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete Cash Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Summary */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-xs font-bold text-slate-800">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 font-black uppercase text-slate-900">
                  Total Cash on Hand Activity &amp; Closing Balance:
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-800">
                  +K{totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-rose-800">
                  -K{totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-950 text-sm bg-emerald-100/70">
                  K{closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-center text-[10px] text-emerald-700 font-bold">
                  ✓ RECONCILED
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Reconciliation Assurance Notice */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Real-Time Business Value Synchronization:</span>
          <p className="text-emerald-800 mt-0.5 leading-relaxed">
            The closing cash on hand balance of <strong>K{closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> is mathematically bound to the <em>Cash on Hand (Physical)</em> debit item on the <strong>Business Net Value</strong> statement. Any changes here are immediately reflected across the entire business financial equity calculation.
          </p>
        </div>
      </div>

      {/* ADD / EDIT TRANSACTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingRecord ? 'Edit Cash on Hand Entry' : 'Record New Cash on Hand Entry'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRecord(null);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Transaction Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entry Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, txType: 'DEBIT' })}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${
                        formData.txType === 'DEBIT'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Debit (Cash In)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, txType: 'CREDIT' })}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${
                        formData.txType === 'CREDIT'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Credit (Cash Out)
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (ZMW / K) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    K
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Details / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical Cash Handover from Kitwe Site Manager"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Reference Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Voucher / Handover Slip #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HO-KTW-00912"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                  >
                    <option value="BRANCH_HANDOVER">Branch Handover</option>
                    <option value="PETTY_CASH">Petty Cash Advance / Exp</option>
                    <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
                    <option value="INTERNAL_TRANSFER">Internal Transfer</option>
                    <option value="DRAWING">Owner Drawing</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <div>
                  {editingRecord && (
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(editingRecord)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entry</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingRecord(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {editingRecord ? 'Save Changes' : 'Record Cash Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE RECORD DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Delete Cash Record</h3>
              </div>
              <button
                onClick={() => setRecordToDelete(null)}
                className="text-rose-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-700 text-sm">
                Are you sure you want to permanently delete this cash on hand entry?
              </p>

              {/* Transaction Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Date:</span>
                  <span className="font-semibold text-slate-800">{recordToDelete.date}</span>
                </div>
                <div className="flex justify-between items-start text-slate-500">
                  <span>Details:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[200px]">
                    {recordToDelete.details}
                  </span>
                </div>
                {recordToDelete.referenceNo && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Voucher / Slip #:</span>
                    <span className="font-mono font-semibold text-slate-800">{recordToDelete.referenceNo}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200">
                  <span>Amount:</span>
                  <span className={`font-mono font-bold text-sm ${
                    (recordToDelete.debit || 0) > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {(recordToDelete.debit || 0) > 0 ? '+' : '-'}K
                    {((recordToDelete.debit || 0) > 0 ? recordToDelete.debit : recordToDelete.credit)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Recalculation:</strong> Running physical cash balances across all subsequent transactions will be automatically recalculated and synchronized to <em>Cash on Hand (Physical)</em> in the <strong>Business Net Value</strong> statement.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Entry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Bulk Delete Cash Records</h3>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-rose-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-700 text-sm">
                Are you sure you want to permanently delete <strong>{selectedIds.length}</strong> selected cash on hand transactions?
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  This will remove all {selectedIds.length} cash records and immediately update the Cash on Hand closing balance in the Business Net Value calculation.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteConfirm}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete {selectedIds.length} Entries</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
