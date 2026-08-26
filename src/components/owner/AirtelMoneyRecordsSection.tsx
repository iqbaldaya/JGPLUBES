import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AirtelRecord } from '../../types';
import {
  Smartphone,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  FileText,
  Building2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  ArrowRightLeft,
  DollarSign,
  Landmark,
  Truck,
  Receipt,
} from 'lucide-react';

interface AirtelMoneyRecordsSectionProps {
  onNavigateTab?: (tab: string) => void;
  standalone?: boolean;
}

type ConversionModalType = 'NONE' | 'CONVERT_CASH' | 'CONVERT_BANK' | 'PAY_SUPPLIER' | 'PAY_EXPENSE';

export const AirtelMoneyRecordsSection: React.FC<AirtelMoneyRecordsSectionProps> = ({
  onNavigateTab,
  standalone = true,
}) => {
  const {
    airtelRecords,
    ownerTreasury,
    suppliers,
    addAirtelRecord,
    updateAirtelRecord,
    deleteAirtelRecord,
    bulkDeleteAirtelRecords,
    convertAirtelToCash,
    convertAirtelToBank,
    paySupplierFromAirtel,
    payExpenseFromAirtel,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS'>('ALL');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [conversionModal, setConversionModal] = useState<ConversionModalType>('NONE');
  const [editingRecord, setEditingRecord] = useState<AirtelRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AirtelRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // General Record Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    details: '',
    txType: 'DEBIT' as 'DEBIT' | 'CREDIT',
    amount: '',
    referenceNo: '',
    recipientOrSender: '',
    category: 'BRANCH_SALES' as NonNullable<AirtelRecord['category']>,
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Conversion / Payment form states
  const [conversionAmount, setConversionAmount] = useState<string>('');
  const [conversionDate, setConversionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [conversionRef, setConversionRef] = useState<string>('');
  const [conversionNotes, setConversionNotes] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return airtelRecords.filter((record) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        record.details.toLowerCase().includes(query) ||
        (record.referenceNo && record.referenceNo.toLowerCase().includes(query)) ||
        (record.recipientOrSender && record.recipientOrSender.toLowerCase().includes(query)) ||
        (record.branchName && record.branchName.toLowerCase().includes(query));

      // Category match
      const matchesCategory =
        categoryFilter === 'ALL' || record.category === categoryFilter;

      // Date match
      let matchesDate = true;
      if (dateRangeFilter === 'THIS_MONTH') {
        const recordDate = new Date(record.date);
        const now = new Date();
        matchesDate =
          recordDate.getFullYear() === now.getFullYear() &&
          recordDate.getMonth() === now.getMonth();
      } else if (dateRangeFilter === 'LAST_30_DAYS') {
        const recordDate = new Date(record.date).getTime();
        const thirtyDaysAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        matchesDate = recordDate >= thirtyDaysAgo;
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [airtelRecords, searchQuery, categoryFilter, dateRangeFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalDebit = airtelRecords.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalCredit = airtelRecords.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
    const currentBalance = airtelRecords.length > 0 ? airtelRecords[airtelRecords.length - 1].balance : 0;
    const monthlyRecords = airtelRecords.filter((r) => {
      const d = new Date(r.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyDebit = monthlyRecords.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const monthlyCredit = monthlyRecords.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);

    return {
      currentBalance,
      totalDebit,
      totalCredit,
      monthlyDebit,
      monthlyCredit,
      totalTransactions: airtelRecords.length,
    };
  }, [airtelRecords]);

  // Form Submissions
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid positive number for the amount.');
      return;
    }

    if (!formData.details.trim()) {
      setFormError('Please provide transaction details / narrative.');
      return;
    }

    const debit = formData.txType === 'DEBIT' ? amt : 0;
    const credit = formData.txType === 'CREDIT' ? amt : 0;

    if (editingRecord) {
      updateAirtelRecord(editingRecord.id, {
        date: formData.date,
        details: formData.details.trim(),
        debit,
        credit,
        referenceNo: formData.referenceNo.trim() || undefined,
        recipientOrSender: formData.recipientOrSender.trim() || undefined,
        category: formData.category,
        notes: formData.notes.trim() || undefined,
      });
      setActionSuccessMessage(`Transaction "${formData.details.trim()}" updated successfully.`);
    } else {
      addAirtelRecord({
        date: formData.date,
        details: formData.details.trim(),
        debit,
        credit,
        referenceNo: formData.referenceNo.trim() || `AM-TX-${Math.floor(100000 + Math.random() * 900000)}`,
        recipientOrSender: formData.recipientOrSender.trim() || undefined,
        category: formData.category,
        notes: formData.notes.trim() || undefined,
      });
      setActionSuccessMessage(`New Airtel transaction added successfully.`);
    }

    setIsAddModalOpen(false);
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      details: '',
      txType: 'DEBIT',
      amount: '',
      referenceNo: '',
      recipientOrSender: '',
      category: 'BRANCH_SALES',
      notes: '',
    });
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleEditClick = (record: AirtelRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      details: record.details,
      txType: record.debit > 0 ? 'DEBIT' : 'CREDIT',
      amount: (record.debit > 0 ? record.debit : record.credit).toString(),
      referenceNo: record.referenceNo || '',
      recipientOrSender: record.recipientOrSender || '',
      category: record.category || 'BRANCH_SALES',
      notes: record.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;
    const res = deleteAirtelRecord(recordToDelete.id);
    if (res.success) {
      setActionSuccessMessage('Airtel Money transaction deleted and running balance recalculated.');
      setSelectedIds((prev) => prev.filter((id) => id !== recordToDelete.id));
    }
    setRecordToDelete(null);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedIds.length === 0) return;
    const res = bulkDeleteAirtelRecords(selectedIds);
    if (res.success) {
      setActionSuccessMessage(`Successfully deleted ${selectedIds.length} Airtel Money transactions.`);
      setSelectedIds([]);
    }
    setIsBulkDeleteModalOpen(false);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Conversions & Payment submissions
  const handleExecuteConversion = (e: React.FormEvent) => {
    e.preventDefault();
    setConversionError(null);

    const amt = parseFloat(conversionAmount);
    if (isNaN(amt) || amt <= 0) {
      setConversionError('Please enter a valid amount.');
      return;
    }

    if (conversionModal === 'CONVERT_CASH') {
      const res = convertAirtelToCash(amt, conversionDate, conversionRef, conversionNotes);
      if (!res.success) {
        setConversionError(res.message || 'Conversion failed.');
        return;
      }
      setActionSuccessMessage(res.message || 'Successfully converted Airtel Money to Cash.');
    } else if (conversionModal === 'CONVERT_BANK') {
      const res = convertAirtelToBank(amt, conversionDate, conversionRef, conversionNotes);
      if (!res.success) {
        setConversionError(res.message || 'Conversion failed.');
        return;
      }
      setActionSuccessMessage(res.message || 'Successfully converted Airtel Money to Bank Account.');
    } else if (conversionModal === 'PAY_SUPPLIER') {
      if (!selectedSupplierId) {
        setConversionError('Please select a supplier.');
        return;
      }
      const res = paySupplierFromAirtel(selectedSupplierId, amt, conversionDate, conversionRef, conversionNotes);
      if (!res.success) {
        setConversionError(res.message || 'Supplier payment failed.');
        return;
      }
      setActionSuccessMessage(res.message || 'Supplier settlement processed.');
    } else if (conversionModal === 'PAY_EXPENSE') {
      if (!expenseDescription.trim()) {
        setConversionError('Please provide an expense description.');
        return;
      }
      const res = payExpenseFromAirtel(amt, conversionDate, expenseDescription.trim(), conversionRef);
      if (!res.success) {
        setConversionError(res.message || 'Expense payment failed.');
        return;
      }
      setActionSuccessMessage(res.message || 'Expense recorded.');
    }

    setConversionModal('NONE');
    setConversionAmount('');
    setConversionRef('');
    setConversionNotes('');
    setExpenseDescription('');
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Details',
      'Category',
      'Reference / Till #',
      'Recipient / Sender',
      'Debit (+K)',
      'Credit (-K)',
      'Running Balance (K)',
    ];
    const rows = filteredRecords.map((r) => [
      r.date,
      `"${r.details.replace(/"/g, '""')}"`,
      r.category || 'BRANCH_SALES',
      r.referenceNo || '',
      r.recipientOrSender ? `"${r.recipientOrSender.replace(/"/g, '""')}"` : '',
      r.debit || 0,
      r.credit || 0,
      r.balance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Airtel_Money_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-800 via-rose-800 to-red-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Smartphone className="w-6 h-6 text-red-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Airtel Money Corporate Records
                </h1>
                <p className="text-xs sm:text-sm text-red-100/90 font-medium">
                  General Float Ledger, Merchant Remittances, Cash Conversions &amp; Direct Settlements
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-red-100/90">
              <span className="bg-white/15 px-3 py-1 rounded-full backdrop-blur border border-white/10 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-200" />
                <span>Synchronized with Business Net Value</span>
              </span>
              <span className="bg-white/15 px-3 py-1 rounded-full backdrop-blur border border-white/10">
                {airtelRecords.length} Total Ledger Records
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Conversion Buttons */}
            <button
              id="btn-airtel-convert-cash"
              onClick={() => {
                setConversionModal('CONVERT_CASH');
                setConversionAmount('');
                setConversionError(null);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur border border-white/20 flex items-center space-x-2 transition shadow-sm"
            >
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>Convert to Cash</span>
            </button>

            <button
              id="btn-airtel-convert-bank"
              onClick={() => {
                setConversionModal('CONVERT_BANK');
                setConversionAmount('');
                setConversionError(null);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur border border-white/20 flex items-center space-x-2 transition shadow-sm"
            >
              <Landmark className="w-4 h-4 text-blue-300" />
              <span>Convert to Bank</span>
            </button>

            <button
              id="btn-airtel-pay-supplier"
              onClick={() => {
                setConversionModal('PAY_SUPPLIER');
                setConversionAmount('');
                setConversionError(null);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur border border-white/20 flex items-center space-x-2 transition shadow-sm"
            >
              <Truck className="w-4 h-4 text-purple-300" />
              <span>Pay Supplier</span>
            </button>

            <button
              id="btn-airtel-pay-expense"
              onClick={() => {
                setConversionModal('PAY_EXPENSE');
                setConversionAmount('');
                setConversionError(null);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur border border-white/20 flex items-center space-x-2 transition shadow-sm"
            >
              <Receipt className="w-4 h-4 text-emerald-300" />
              <span>Pay Expense</span>
            </button>

            <button
              id="btn-add-airtel-record"
              onClick={() => {
                setEditingRecord(null);
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  details: '',
                  txType: 'DEBIT',
                  amount: '',
                  referenceNo: '',
                  recipientOrSender: '',
                  category: 'BRANCH_SALES',
                  notes: '',
                });
                setFormError(null);
                setIsAddModalOpen(true);
              }}
              className="bg-white text-red-900 hover:bg-red-50 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-sm ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Record Inflow / Outflow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Airtel Float Balance</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-700">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            K{metrics.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-stone-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Corporate Wallet Active</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Inflows (Debits)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            K{metrics.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-stone-500">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sales &amp; Float Deposits</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Outflows (Credits)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            K{metrics.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-stone-500">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>Conversions &amp; Settlements</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Net Position</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            K{(metrics.totalDebit - metrics.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-emerald-700 font-medium">
            <span>Reconciles 100% with Float</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by details, reference number, sender/recipient, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="BRANCH_SALES">Branch Sales</option>
              <option value="CUSTOMER_PAYMENT">Customer Payments</option>
              <option value="CONVERSION_CASH">Conversion to Cash</option>
              <option value="CONVERSION_BANK">Conversion to Bank</option>
              <option value="SUPPLIER_PAYMENT">Supplier Settlements</option>
              <option value="EXPENSE_PAYMENT">Direct Expenses</option>
              <option value="FLOAT_TOPUP">Float Top-ups</option>
              <option value="DEBTOR_PAYMENT">Debtor Repayments</option>
              <option value="OTHER">Other Adjustments</option>
            </select>

            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="ALL">All Dates</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs font-semibold text-stone-700 flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Selected Items Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-red-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'record' : 'records'} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-2 py-1"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Airtel Records Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredRecords.length > 0 &&
                      selectedIds.length === filteredRecords.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Details &amp; Narrative</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Reference / Tx #</th>
                <th className="py-3 px-3">Sender / Recipient</th>
                <th className="py-3 px-4 text-right text-emerald-800">Debit (+K)</th>
                <th className="py-3 px-4 text-right text-rose-800">Credit (-K)</th>
                <th className="py-3 px-4 text-right">Running Balance (K)</th>
                <th className="py-3 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-stone-50 transition ${
                        isSelected ? 'bg-red-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(record.id)}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap text-xs">
                        {record.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{record.details}</div>
                        {record.branchName && (
                          <div className="text-[11px] text-stone-500 flex items-center space-x-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-stone-400" />
                            <span>{record.branchName}</span>
                          </div>
                        )}
                        {record.notes && (
                          <div className="text-[11px] text-stone-500 italic mt-0.5">
                            {record.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            record.category === 'BRANCH_SALES'
                              ? 'bg-blue-100 text-blue-800'
                              : record.category === 'CONVERSION_CASH'
                              ? 'bg-amber-100 text-amber-800'
                              : record.category === 'CONVERSION_BANK'
                              ? 'bg-indigo-100 text-indigo-800'
                              : record.category === 'SUPPLIER_PAYMENT'
                              ? 'bg-purple-100 text-purple-800'
                              : record.category === 'EXPENSE_PAYMENT'
                              ? 'bg-rose-100 text-rose-800'
                              : record.category === 'DEBTOR_PAYMENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {record.category?.replace(/_/g, ' ') || 'BRANCH SALES'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {record.referenceNo || '—'}
                      </td>
                      <td className="py-3 px-3 text-stone-700 text-xs whitespace-nowrap">
                        {record.recipientOrSender || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {record.debit > 0
                          ? `+K${record.debit.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700 whitespace-nowrap">
                        {record.credit > 0
                          ? `-K${record.credit.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-stone-900 whitespace-nowrap">
                        K{record.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(record)}
                            title="Edit transaction"
                            className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            title="Delete transaction"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-stone-400 text-sm">
                    No Airtel Money transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right text-stone-700">
                    Filtered Totals:
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-800">
                    +K{filteredRecords
                      .reduce((sum, r) => sum + (Number(r.debit) || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-800">
                    -K{filteredRecords
                      .reduce((sum, r) => sum + (Number(r.credit) || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-stone-900">
                    K{filteredRecords[filteredRecords.length - 1]?.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL: Record Inflow / Outflow (Debit or Credit) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  {editingRecord ? 'Edit Airtel Money Transaction' : 'Record Airtel Money Inflow / Outflow'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Flow Type *
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, txType: 'DEBIT' })}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${
                        formData.txType === 'DEBIT'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Debit (+ Inflow)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, txType: 'CREDIT' })}
                      className={`py-1.5 text-xs font-bold rounded-md transition ${
                        formData.txType === 'CREDIT'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Credit (- Outflow)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Amount (ZMW) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Details / Narrative *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Branch Daily Sales Float Remittance - Kitwe Hub"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-medium"
                  >
                    <option value="BRANCH_SALES">Branch Sales</option>
                    <option value="CUSTOMER_PAYMENT">Customer Payments</option>
                    <option value="CONVERSION_CASH">Conversion to Cash</option>
                    <option value="CONVERSION_BANK">Conversion to Bank</option>
                    <option value="SUPPLIER_PAYMENT">Supplier Settlement</option>
                    <option value="EXPENSE_PAYMENT">Expense Payment</option>
                    <option value="FLOAT_TOPUP">Float Top-up</option>
                    <option value="DEBTOR_PAYMENT">Debtor Repayment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Airtel Reference / Tx #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AM-TX-994821"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Sender / Recipient / Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mwansa Chileshe (+260 97 2345678)"
                  value={formData.recipientOrSender}
                  onChange={(e) => setFormData({ ...formData, recipientOrSender: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg shadow-sm"
                >
                  {editingRecord ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Conversion / Payment (Cash, Bank, Supplier, Expense) */}
      {conversionModal !== 'NONE' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold">
                  {conversionModal === 'CONVERT_CASH' && <DollarSign className="w-4 h-4 text-amber-700" />}
                  {conversionModal === 'CONVERT_BANK' && <Landmark className="w-4 h-4 text-blue-700" />}
                  {conversionModal === 'PAY_SUPPLIER' && <Truck className="w-4 h-4 text-purple-700" />}
                  {conversionModal === 'PAY_EXPENSE' && <Receipt className="w-4 h-4 text-emerald-700" />}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    {conversionModal === 'CONVERT_CASH' && 'Convert Airtel Money to Physical Cash'}
                    {conversionModal === 'CONVERT_BANK' && 'Convert Airtel Money to Bank Account'}
                    {conversionModal === 'PAY_SUPPLIER' && 'Pay Supplier from Airtel Money Float'}
                    {conversionModal === 'PAY_EXPENSE' && 'Pay Direct Expense from Airtel Money Float'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Available Float: <span className="font-bold text-stone-900">K{metrics.currentBalance.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConversionModal('NONE')}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conversionError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{conversionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteConversion} className="space-y-3">
              {conversionModal === 'PAY_SUPPLIER' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-semibold text-stone-900"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {s.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {conversionModal === 'PAY_EXPENSE' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Expense Narrative / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Station generator diesel top-up / ZESCO tokens"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={conversionDate}
                    onChange={(e) => setConversionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Amount (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={metrics.currentBalance}
                    required
                    placeholder="0.00"
                    value={conversionAmount}
                    onChange={(e) => setConversionAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reference / Till / Receipt #
                </label>
                <input
                  type="text"
                  placeholder="e.g. AM-WD-88194"
                  value={conversionRef}
                  onChange={(e) => setConversionRef(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional notes..."
                  value={conversionNotes}
                  onChange={(e) => setConversionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              {/* Explanatory Banner */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-600 text-[11px] leading-relaxed">
                {conversionModal === 'CONVERT_CASH' && (
                  <span>
                    ✓ Deducts from <strong>Airtel Float</strong> and adds to <strong>Cash Records (Cash on Hand)</strong> with matching reference.
                  </span>
                )}
                {conversionModal === 'CONVERT_BANK' && (
                  <span>
                    ✓ Deducts from <strong>Airtel Float</strong> and adds to <strong>Bank Operating Account</strong> records automatically.
                  </span>
                )}
                {conversionModal === 'PAY_SUPPLIER' && (
                  <span>
                    ✓ Deducts from <strong>Airtel Float</strong> and debits the <strong>Supplier Account</strong>, decreasing supplier balance due.
                  </span>
                )}
                {conversionModal === 'PAY_EXPENSE' && (
                  <span>
                    ✓ Deducts from <strong>Airtel Float</strong> as an operating expense outflow.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setConversionModal('NONE')}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-lg shadow-sm"
                >
                  Confirm &amp; Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-stone-900 text-base">Delete Transaction</h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to delete this Airtel Money record? Running balances and owner treasury will automatically recompute.
              </p>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 mt-2 text-xs text-left">
                <div className="font-semibold text-stone-900">{recordToDelete.details}</div>
                <div className="text-stone-500 font-mono text-[11px]">
                  {recordToDelete.date} • {recordToDelete.debit > 0 ? `+K${recordToDelete.debit}` : `-K${recordToDelete.credit}`}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-stone-900 text-base">
                Delete {selectedIds.length} Transactions
              </h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to permanently delete all {selectedIds.length} selected transactions?
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete All Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
