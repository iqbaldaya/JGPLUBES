import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Debtor, DebtorTransaction } from '../../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Scale,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  FileText,
  Building2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Landmark,
  Smartphone,
  CreditCard,
  Receipt,
  UserCheck,
  Clock,
  ChevronRight,
  UserPlus,
} from 'lucide-react';

interface DebtorsSectionProps {
  onNavigateTab?: (tab: string) => void;
  standalone?: boolean;
}

export const DebtorsSection: React.FC<DebtorsSectionProps> = ({
  onNavigateTab,
  standalone = true,
}) => {
  const {
    debtors,
    debtorTransactions,
    totalDebtorsBalance,
    addDebtor,
    updateDebtor,
    deleteDebtor,
    addDebtorCreditSale,
    recordDebtorPayment,
    updateDebtorTransaction,
    deleteDebtorTransaction,
    branches,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'CLEARED'>('ALL');
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);

  // Modals
  const [isAddDebtorModalOpen, setIsAddDebtorModalOpen] = useState(false);
  const [isCreditSaleModalOpen, setIsCreditSaleModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
  const [debtorToDelete, setDebtorToDelete] = useState<Debtor | null>(null);
  const [txToDelete, setTxToDelete] = useState<DebtorTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<DebtorTransaction | null>(null);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Forms
  const [debtorForm, setDebtorForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: '',
    paymentTerms: '14 Days' as '7 Days' | '14 Days' | '30 Days' | '60 Days' | 'Immediate',
    notes: '',
  });
  const [debtorFormError, setDebtorFormError] = useState<string | null>(null);

  const [creditSaleForm, setCreditSaleForm] = useState({
    debtorId: debtors[0]?.id || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    invoiceRef: '',
    details: '',
    branchId: branches[0]?.id || '',
  });
  const [creditSaleError, setCreditSaleError] = useState<string | null>(null);

  const [repaymentForm, setRepaymentForm] = useState({
    debtorId: debtors[0]?.id || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    receiptNo: '',
    paymentMethod: 'Cash' as 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque',
    destination: 'CASH' as 'CASH' | 'BANK' | 'AIRTEL',
    notes: '',
  });
  const [repaymentError, setRepaymentError] = useState<string | null>(null);

  const [editTxForm, setEditTxForm] = useState({
    date: '',
    referenceNo: '',
    details: '',
    type: 'CREDIT_SALE' as 'CREDIT_SALE' | 'PAYMENT' | 'OPENING_BALANCE' | 'ADJUSTMENT',
    amount: '',
    branchId: '',
    paymentMethod: 'Cash' as 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque',
    paymentDestination: 'CASH' as 'CASH' | 'BANK' | 'AIRTEL',
    status: 'PAID' as 'PAID' | 'PARTIAL' | 'UNPAID',
  });
  const [editTxError, setEditTxError] = useState<string | null>(null);

  // Filtered Debtors
  const filteredDebtors = useMemo(() => {
    return debtors.filter((debtor) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        debtor.name.toLowerCase().includes(q) ||
        debtor.code.toLowerCase().includes(q) ||
        debtor.phone.toLowerCase().includes(q) ||
        (debtor.email && debtor.email.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = debtor.outstandingBalance > 0;
      } else if (statusFilter === 'CLEARED') {
        matchesStatus = debtor.outstandingBalance === 0;
      } else if (statusFilter === 'OVERDUE') {
        matchesStatus = (debtor.status as string) === 'OVERDUE' || debtor.outstandingBalance > debtor.creditLimit;
      }

      return matchesSearch && matchesStatus;
    });
  }, [debtors, searchQuery, statusFilter]);

  // Selected Debtor Details & Statements
  const activeDebtor = useMemo(() => {
    if (!selectedDebtorId) return debtors[0] || null;
    return debtors.find((d) => d.id === selectedDebtorId) || debtors[0] || null;
  }, [debtors, selectedDebtorId]);

  const activeDebtorTransactions = useMemo(() => {
    if (!activeDebtor) return [];
    return debtorTransactions.filter((tx) => tx.debtorId === activeDebtor.id);
  }, [debtorTransactions, activeDebtor]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCreditGiven = debtors.reduce((sum, d) => sum + (d.totalCreditSales || 0), 0);
    const totalCollected = debtors.reduce((sum, d) => sum + (d.totalPaid || 0), 0);
    const countWithBalance = debtors.filter((d) => d.outstandingBalance > 0).length;

    return {
      totalDebtorsBalance,
      totalCreditGiven,
      totalCollected,
      countWithBalance,
      totalDebtorsCount: debtors.length,
    };
  }, [debtors, totalDebtorsBalance]);

  // Debtor Form Submission
  const handleDebtorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebtorFormError(null);

    if (!debtorForm.name.trim()) {
      setDebtorFormError('Please enter the customer / company name.');
      return;
    }
    if (!debtorForm.phone.trim()) {
      setDebtorFormError('Please provide a contact phone number.');
      return;
    }

    const limit = parseFloat(debtorForm.creditLimit) || 0;

    if (editingDebtor) {
      updateDebtor(editingDebtor.id, {
        name: debtorForm.name.trim(),
        code: debtorForm.code.trim() || editingDebtor.code,
        phone: debtorForm.phone.trim(),
        email: debtorForm.email.trim() || undefined,
        address: debtorForm.address.trim() || undefined,
        creditLimit: limit,
        paymentTerms: debtorForm.paymentTerms,
        notes: debtorForm.notes.trim() || undefined,
      });
      setActionSuccessMessage(`Customer "${debtorForm.name.trim()}" updated successfully.`);
    } else {
      const newD = addDebtor({
        name: debtorForm.name.trim(),
        code: debtorForm.code.trim() || `DEB-${String(debtors.length + 1).padStart(3, '0')}`,
        phone: debtorForm.phone.trim(),
        email: debtorForm.email.trim() || undefined,
        address: debtorForm.address.trim() || undefined,
        creditLimit: limit,
        paymentTerms: debtorForm.paymentTerms,
        notes: debtorForm.notes.trim() || undefined,
        status: 'ACTIVE',
      });
      setSelectedDebtorId(newD.id);
      setActionSuccessMessage(`New Credit Customer "${debtorForm.name.trim()}" registered.`);
    }

    setIsAddDebtorModalOpen(false);
    setEditingDebtor(null);
    setDebtorForm({
      name: '',
      code: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: '',
      paymentTerms: '14 Days',
      notes: '',
    });
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Credit Sale Form Submission
  const handleCreditSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreditSaleError(null);

    const amt = parseFloat(creditSaleForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setCreditSaleError('Please enter a valid credit amount.');
      return;
    }
    if (!creditSaleForm.debtorId) {
      setCreditSaleError('Please select a customer.');
      return;
    }
    if (!creditSaleForm.details.trim()) {
      setCreditSaleError('Please enter product / invoice details.');
      return;
    }

    const branch = branches.find((b) => b.id === creditSaleForm.branchId);

    addDebtorCreditSale(
      creditSaleForm.debtorId,
      amt,
      creditSaleForm.date,
      creditSaleForm.invoiceRef || `INV-CS-${Date.now().toString().slice(-4)}`,
      creditSaleForm.details.trim(),
      creditSaleForm.branchId,
      branch?.name
    );

    setSelectedDebtorId(creditSaleForm.debtorId);
    setActionSuccessMessage(`Credit sale of K${amt.toLocaleString()} recorded for customer.`);
    setIsCreditSaleModalOpen(false);
    setCreditSaleForm({
      debtorId: debtors[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      invoiceRef: '',
      details: '',
      branchId: branches[0]?.id || '',
    });
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Repayment Form Submission
  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRepaymentError(null);

    const amt = parseFloat(repaymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setRepaymentError('Please enter a valid repayment amount.');
      return;
    }
    if (!repaymentForm.debtorId) {
      setRepaymentError('Please select a customer.');
      return;
    }

    const res = recordDebtorPayment(
      repaymentForm.debtorId,
      amt,
      repaymentForm.date,
      repaymentForm.receiptNo || `RCT-${Date.now().toString().slice(-4)}`,
      repaymentForm.paymentMethod,
      repaymentForm.destination,
      repaymentForm.notes.trim() || undefined
    );

    if (!res.success) {
      setRepaymentError(res.message || 'Failed to record repayment.');
      return;
    }

    setSelectedDebtorId(repaymentForm.debtorId);
    setActionSuccessMessage(res.message || `Customer repayment recorded successfully.`);
    setIsRepaymentModalOpen(false);
    setRepaymentForm({
      debtorId: debtors[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      receiptNo: '',
      paymentMethod: 'Cash',
      destination: 'CASH',
      notes: '',
    });
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Edit Debtor Transaction Submission
  const handleEditTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setEditTxError(null);

    const amt = parseFloat(editTxForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setEditTxError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!editTxForm.date) {
      setEditTxError('Please select a date.');
      return;
    }
    if (!editTxForm.referenceNo.trim()) {
      setEditTxError('Please provide a reference / invoice / receipt number.');
      return;
    }
    if (!editTxForm.details.trim()) {
      setEditTxError('Please provide transaction description / details.');
      return;
    }

    const branch = branches.find((b) => b.id === editTxForm.branchId);

    const isCredit = editTxForm.type === 'PAYMENT';
    const debitVal = isCredit ? 0 : amt;
    const creditVal = isCredit ? amt : 0;

    const updates: Partial<DebtorTransaction> = {
      date: editTxForm.date,
      referenceNo: editTxForm.referenceNo.trim(),
      details: editTxForm.details.trim(),
      type: editTxForm.type,
      debit: debitVal,
      credit: creditVal,
      branchId: editTxForm.branchId || undefined,
      branchName: branch?.name || undefined,
      paymentMethod: isCredit ? editTxForm.paymentMethod : undefined,
      paymentDestination: isCredit ? editTxForm.paymentDestination : undefined,
      status: editTxForm.status,
    };

    const res = updateDebtorTransaction(editingTx.id, updates);
    if (res.success) {
      setActionSuccessMessage(`Transaction entry "${editTxForm.referenceNo.trim()}" updated successfully.`);
      setIsEditTxModalOpen(false);
      setEditingTx(null);
    } else {
      setEditTxError(res.message || 'Failed to update transaction.');
    }
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleDeleteDebtorConfirm = () => {
    if (!debtorToDelete) return;
    const res = deleteDebtor(debtorToDelete.id);
    if (res.success) {
      setActionSuccessMessage(`Customer "${debtorToDelete.name}" deleted successfully.`);
      if (selectedDebtorId === debtorToDelete.id) {
        setSelectedDebtorId(null);
      }
    } else {
      alert(res.message);
    }
    setDebtorToDelete(null);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleDeleteTxConfirm = () => {
    if (!txToDelete) return;
    const res = deleteDebtorTransaction(txToDelete.id);
    if (res.success) {
      setActionSuccessMessage(`Transaction entry "${txToDelete.referenceNo}" deleted and balances updated.`);
    }
    setTxToDelete(null);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Export Debtors CSV
  const handleExportCSV = () => {
    const headers = [
      'Customer Code',
      'Name',
      'Phone',
      'Payment Terms',
      'Credit Limit (K)',
      'Total Credit Sales (K)',
      'Total Paid (K)',
      'Outstanding Balance (K)',
      'Status',
    ];
    const rows = filteredDebtors.map((d) => [
      d.code,
      `"${d.name.replace(/"/g, '""')}"`,
      d.phone,
      d.paymentTerms || '14 Days',
      d.creditLimit || 0,
      d.totalCreditSales,
      d.totalPaid,
      d.outstandingBalance,
      d.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Debtors_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Users className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Debtors &amp; Credit Sales Ledger
                </h1>
                <p className="text-xs sm:text-sm text-amber-100/90 font-medium">
                  Track Credit Customers, Outstanding Receivables, Branch Credit Sales &amp; Repayments
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-amber-100/90">
              <span className="bg-white/15 px-3 py-1 rounded-full backdrop-blur border border-white/10 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-200" />
                <span>Integrated in Business Net Value (Debit Column)</span>
              </span>
              <span className="bg-white/15 px-3 py-1 rounded-full backdrop-blur border border-white/10">
                {debtors.length} Registered Debtors
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-add-credit-sale"
              onClick={() => {
                setCreditSaleForm({
                  debtorId: activeDebtor?.id || debtors[0]?.id || '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  invoiceRef: '',
                  details: '',
                  branchId: branches[0]?.id || '',
                });
                setCreditSaleError(null);
                setIsCreditSaleModalOpen(true);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur border border-white/20 flex items-center space-x-2 transition shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>Record Credit Sale</span>
            </button>

            <button
              id="btn-record-debtor-repayment"
              onClick={() => {
                setRepaymentForm({
                  debtorId: activeDebtor?.id || debtors[0]?.id || '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  receiptNo: '',
                  paymentMethod: 'Cash',
                  destination: 'CASH',
                  notes: '',
                });
                setRepaymentError(null);
                setIsRepaymentModalOpen(true);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur border border-white/20 flex items-center space-x-2 transition shadow-sm"
            >
              <Receipt className="w-4 h-4 text-emerald-300" />
              <span>Receive Repayment</span>
            </button>

            <button
              id="btn-add-debtor-customer"
              onClick={() => {
                setEditingDebtor(null);
                setDebtorForm({
                  name: '',
                  code: `DEB-${String(debtors.length + 1).padStart(3, '0')}`,
                  phone: '',
                  email: '',
                  address: '',
                  creditLimit: '10000',
                  paymentTerms: '14 Days',
                  notes: '',
                });
                setDebtorFormError(null);
                setIsAddDebtorModalOpen(true);
              }}
              className="bg-white text-amber-950 hover:bg-amber-50 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-sm ml-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Credit Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Receivables (Debtors)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900">
            K{metrics.totalDebtorsBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-stone-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Debited to Business Net Value</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Credit Sales</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">
            K{metrics.totalCreditGiven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-stone-500">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Cumulative Invoiced Credit</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            K{metrics.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-stone-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Repayments Processed</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Debtors with Balance</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {metrics.countWithBalance} / {metrics.totalDebtorsCount}
          </div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-stone-500">
            <span>Active Credit Accounts</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Customer List (Left) and Customer Statement / Transaction Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Debtors Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-700" />
                <span>Credit Customers Directory</span>
              </h3>
              <button
                onClick={handleExportCSV}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Search & Status Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search customer, phone, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 py-1 rounded-md transition ${
                    statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  All ({debtors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`flex-1 py-1 rounded-md transition ${
                    statusFilter === 'ACTIVE' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Owing ({debtors.filter((d) => d.outstandingBalance > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CLEARED')}
                  className={`flex-1 py-1 rounded-md transition ${
                    statusFilter === 'CLEARED' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Cleared
                </button>
              </div>
            </div>

            {/* Debtor Cards List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredDebtors.length > 0 ? (
                filteredDebtors.map((debtor) => {
                  const isSelected = activeDebtor?.id === debtor.id;
                  const percentUtilized =
                    debtor.creditLimit > 0
                      ? Math.min(100, Math.round((debtor.outstandingBalance / debtor.creditLimit) * 100))
                      : 0;

                  return (
                    <div
                      key={debtor.id}
                      onClick={() => setSelectedDebtorId(debtor.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-stone-900 text-sm">{debtor.name}</span>
                            <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                              {debtor.code}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 flex items-center space-x-2 mt-1">
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{debtor.phone}</span>
                            </span>
                            <span>•</span>
                            <span>{debtor.paymentTerms}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-stone-500 uppercase">Balance</div>
                          <div
                            className={`text-sm font-black ${
                              debtor.outstandingBalance > 0 ? 'text-amber-800' : 'text-emerald-700'
                            }`}
                          >
                            K{debtor.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Credit Utilization Bar */}
                      {debtor.creditLimit > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                          <span>Limit: K{debtor.creditLimit.toLocaleString()}</span>
                          <span
                            className={`font-semibold ${
                              percentUtilized > 90 ? 'text-rose-600' : 'text-stone-600'
                            }`}
                          >
                            {percentUtilized}% utilized
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-stone-400 text-xs">
                  No credit customers found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Debtor Statement Ledger & Profile */}
        <div className="lg:col-span-7 space-y-4">
          {activeDebtor ? (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-5">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-black text-stone-900">{activeDebtor.name}</h2>
                    <span className="font-mono text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                      {activeDebtor.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeDebtor.outstandingBalance > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {activeDebtor.outstandingBalance > 0 ? 'ACTIVE OWING' : 'SETTLED / CLEAR'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1.5">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{activeDebtor.phone}</span>
                    </span>
                    {activeDebtor.email && (
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span>{activeDebtor.email}</span>
                      </span>
                    )}
                    {activeDebtor.address && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{activeDebtor.address}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingDebtor(activeDebtor);
                      setDebtorForm({
                        name: activeDebtor.name,
                        code: activeDebtor.code,
                        phone: activeDebtor.phone,
                        email: activeDebtor.email || '',
                        address: activeDebtor.address || '',
                        creditLimit: activeDebtor.creditLimit.toString(),
                        paymentTerms: (activeDebtor.paymentTerms as any) || '14 Days',
                        notes: activeDebtor.notes || '',
                      });
                      setDebtorFormError(null);
                      setIsAddDebtorModalOpen(true);
                    }}
                    className="p-2 border border-stone-300 hover:bg-stone-50 rounded-lg text-stone-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setDebtorToDelete(activeDebtor)}
                    className={`p-2 border rounded-lg text-xs transition flex items-center space-x-1 ${
                      debtorTransactions.filter((t) => t.debtorId === activeDebtor.id).length > 0
                        ? 'border-stone-200 text-stone-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                        : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                    }`}
                    title={
                      debtorTransactions.filter((t) => t.debtorId === activeDebtor.id).length > 0
                        ? `Has ${debtorTransactions.filter((t) => t.debtorId === activeDebtor.id).length} transaction(s) — delete entries first to remove debtor`
                        : 'Delete customer account (0 transactions)'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Financial Status Summary */}
              <div className="grid grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <div className="text-[11px] text-stone-500 font-bold uppercase">Total Invoiced Credit</div>
                  <div className="text-base font-black text-stone-900 mt-0.5">
                    K{activeDebtor.totalCreditSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500 font-bold uppercase">Total Paid / Cleared</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    K{activeDebtor.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-amber-800 font-bold uppercase">Current Balance Due</div>
                  <div className="text-base font-black text-amber-900 mt-0.5">
                    K{activeDebtor.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Transaction Statement Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                    Customer Statement &amp; Transaction Ledger
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setCreditSaleForm({
                          debtorId: activeDebtor.id,
                          amount: '',
                          date: new Date().toISOString().split('T')[0],
                          invoiceRef: '',
                          details: '',
                          branchId: branches[0]?.id || '',
                        });
                        setCreditSaleError(null);
                        setIsCreditSaleModalOpen(true);
                      }}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition"
                    >
                      + Credit Sale
                    </button>
                    <button
                      onClick={() => {
                        setRepaymentForm({
                          debtorId: activeDebtor.id,
                          amount: '',
                          date: new Date().toISOString().split('T')[0],
                          receiptNo: '',
                          paymentMethod: 'Cash',
                          destination: 'CASH',
                          notes: '',
                        });
                        setRepaymentError(null);
                        setIsRepaymentModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition"
                    >
                      + Repayment
                    </button>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Ref #</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right text-stone-800">Debit (+K)</th>
                        <th className="py-2.5 px-3 text-right text-emerald-800">Credit (-K)</th>
                        <th className="py-2.5 px-3 text-right font-black">Balance (K)</th>
                        <th className="py-2.5 px-3 text-center w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {activeDebtorTransactions.length > 0 ? (
                        activeDebtorTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3 font-mono text-stone-600 whitespace-nowrap">
                              {tx.date}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-stone-700 font-semibold whitespace-nowrap">
                              {tx.referenceNo}
                            </td>
                            <td className="py-2.5 px-3 text-stone-900">
                              <div>{tx.details}</div>
                              {tx.paymentMethod && (
                                <div className="text-[10px] text-stone-500 font-medium">
                                  Method: {tx.paymentMethod} • Settled to {tx.paymentDestination}
                                </div>
                              )}
                              {tx.branchName && (
                                <div className="text-[10px] text-stone-400">
                                  Branch: {tx.branchName}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-stone-900 whitespace-nowrap">
                              {tx.debit > 0 ? `K${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                              {tx.credit > 0 ? `K${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-amber-900 whitespace-nowrap">
                              K{tx.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingTx(tx);
                                    const amt = tx.type === 'CREDIT_SALE' ? tx.debit : (tx.credit || tx.debit || 0);
                                    setEditTxForm({
                                      date: tx.date,
                                      referenceNo: tx.referenceNo,
                                      details: tx.details,
                                      type: tx.type,
                                      amount: amt > 0 ? amt.toString() : '',
                                      branchId: tx.branchId || branches[0]?.id || '',
                                      paymentMethod: tx.paymentMethod || 'Cash',
                                      paymentDestination: tx.paymentDestination || 'CASH',
                                      status: tx.status || 'PAID',
                                    });
                                    setEditTxError(null);
                                    setIsEditTxModalOpen(true);
                                  }}
                                  className="text-stone-400 hover:text-amber-800 p-1 rounded-md hover:bg-stone-100 transition"
                                  title="Edit statement entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setTxToDelete(tx)}
                                  className="text-stone-400 hover:text-red-600 p-1 rounded-md hover:bg-stone-100 transition"
                                  title="Delete statement entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                            No transaction activity logged for this debtor yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
              Select a customer from the left directory to view full credit ledger statement.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add / Edit Credit Customer */}
      {isAddDebtorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  {editingDebtor ? 'Edit Credit Customer Profile' : 'Register New Credit Customer (Debtor)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddDebtorModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {debtorFormError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{debtorFormError}</span>
              </div>
            )}

            <form onSubmit={handleDebtorSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copperbelt Logistics Ltd"
                    value={debtorForm.name}
                    onChange={(e) => setDebtorForm({ ...debtorForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Customer Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DEB-004"
                    value={debtorForm.code}
                    onChange={(e) => setDebtorForm({ ...debtorForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+260 97..."
                    value={debtorForm.phone}
                    onChange={(e) => setDebtorForm({ ...debtorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@client.com"
                    value={debtorForm.email}
                    onChange={(e) => setDebtorForm({ ...debtorForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Approved Credit Limit (K)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="10000"
                    value={debtorForm.creditLimit}
                    onChange={(e) => setDebtorForm({ ...debtorForm, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={debtorForm.paymentTerms}
                    onChange={(e) => setDebtorForm({ ...debtorForm, paymentTerms: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-medium"
                  >
                    <option value="7 Days">7 Days</option>
                    <option value="14 Days">14 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Physical / Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Plot 42, Heavy Industrial Area, Kitwe"
                  value={debtorForm.address}
                  onChange={(e) => setDebtorForm({ ...debtorForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddDebtorModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-lg shadow-sm"
                >
                  {editingDebtor ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Direct Credit Sale */}
      {isCreditSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">Record Credit Sale Invoice</h3>
              </div>
              <button
                onClick={() => setIsCreditSaleModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {creditSaleError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{creditSaleError}</span>
              </div>
            )}

            <form onSubmit={handleCreditSaleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Credit Customer *
                </label>
                <select
                  value={creditSaleForm.debtorId}
                  onChange={(e) => setCreditSaleForm({ ...creditSaleForm, debtorId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-semibold text-stone-900"
                >
                  {debtors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) - Balance: K{d.outstandingBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={creditSaleForm.date}
                    onChange={(e) => setCreditSaleForm({ ...creditSaleForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Credit Amount (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={creditSaleForm.amount}
                    onChange={(e) => setCreditSaleForm({ ...creditSaleForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Invoice / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-904"
                  value={creditSaleForm.invoiceRef}
                  onChange={(e) => setCreditSaleForm({ ...creditSaleForm, invoiceRef: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Product / Shift Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50x Bags Feed (Kitwe Central Branch)"
                  value={creditSaleForm.details}
                  onChange={(e) => setCreditSaleForm({ ...creditSaleForm, details: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreditSaleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-lg shadow-sm"
                >
                  Post Credit Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Receive Debtor Repayment */}
      {isRepaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">Receive Debtor Repayment</h3>
              </div>
              <button
                onClick={() => setIsRepaymentModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {repaymentError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{repaymentError}</span>
              </div>
            )}

            <form onSubmit={handleRepaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Paying Customer *
                </label>
                <select
                  value={repaymentForm.debtorId}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, debtorId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-semibold text-stone-900"
                >
                  {debtors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) - Balance Due: K{d.outstandingBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Repayment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={repaymentForm.date}
                    onChange={(e) => setRepaymentForm({ ...repaymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Amount Paid (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={repaymentForm.amount}
                    onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={repaymentForm.paymentMethod}
                    onChange={(e) => {
                      const method = e.target.value as any;
                      let dest: 'CASH' | 'BANK' | 'AIRTEL' = 'CASH';
                      if (method === 'Airtel Money') dest = 'AIRTEL';
                      else if (method === 'Bank Transfer' || method === 'Cheque') dest = 'BANK';
                      setRepaymentForm({ ...repaymentForm, paymentMethod: method, destination: dest });
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Destination Ledger *
                  </label>
                  <select
                    value={repaymentForm.destination}
                    onChange={(e) =>
                      setRepaymentForm({ ...repaymentForm, destination: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="CASH">Cash Records (Cash Safe)</option>
                    <option value="BANK">Bank Records (Bank Account)</option>
                    <option value="AIRTEL">Airtel Money Float</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Receipt / Transaction #
                </label>
                <input
                  type="text"
                  placeholder="e.g. RCT-884192"
                  value={repaymentForm.receiptNo}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, receiptNo: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-stone-600 text-[11px]">
                ✓ Repayment will be credited to the customer account and debited into the selected <strong>{repaymentForm.destination}</strong> ledger.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsRepaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Debtor Modal */}
      {debtorToDelete && (() => {
        const txCount = debtorTransactions.filter((t) => t.debtorId === debtorToDelete.id).length;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  txCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {txCount > 0 ? <AlertCircle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-stone-900 text-base">
                  {txCount > 0 ? 'Cannot Delete Debtor Account' : 'Delete Debtor Account'}
                </h3>
                <p className="text-xs text-stone-600">
                  {txCount > 0 ? (
                    <span>
                      <strong>{debtorToDelete.name}</strong> currently has{' '}
                      <strong className="text-amber-800 font-bold">{txCount} transaction(s)</strong> in their customer ledger. Under strict financial controls, a debtor account can only be deleted if there are <strong>zero transactions</strong>.
                    </span>
                  ) : (
                    <span>
                      Are you sure you want to permanently delete <strong>{debtorToDelete.name}</strong> ({debtorToDelete.code})? This account has 0 transactions and can be safely removed.
                    </span>
                  )}
                </p>
              </div>

              {txCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Action Required:</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    To remove this debtor account, you must first edit or delete all {txCount} entry(ies) listed under their customer statement ledger.
                  </p>
                </div>
              ) : null}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setDebtorToDelete(null)}
                  className="flex-1 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  {txCount > 0 ? 'Close' : 'Cancel'}
                </button>
                {txCount === 0 && (
                  <button
                    onClick={handleDeleteDebtorConfirm}
                    className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Confirm Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Edit Debtor Transaction */}
      {isEditTxModalOpen && editingTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Edit Debtor Entry</h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    {editingTx.debtorName} • {editingTx.referenceNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditTxModalOpen(false);
                  setEditingTx(null);
                }}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editTxError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editTxError}</span>
              </div>
            )}

            <form onSubmit={handleEditTxSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Entry Type *
                  </label>
                  <select
                    value={editTxForm.type}
                    onChange={(e) => setEditTxForm({ ...editTxForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="CREDIT_SALE">Credit Sale (Debit +)</option>
                    <option value="PAYMENT">Repayment (Credit -)</option>
                    <option value="OPENING_BALANCE">Opening Balance</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={editTxForm.status}
                    onChange={(e) => setEditTxForm({ ...editTxForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="PAID">PAID / SETTLED</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="UNPAID">UNPAID / OWING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editTxForm.date}
                    onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })}
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
                    required
                    placeholder="0.00"
                    value={editTxForm.amount}
                    onChange={(e) => setEditTxForm({ ...editTxForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-904 / RCT-4412"
                  value={editTxForm.referenceNo}
                  onChange={(e) => setEditTxForm({ ...editTxForm, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description / Items Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50x Bags Feed or Customer Bank Deposit"
                  value={editTxForm.details}
                  onChange={(e) => setEditTxForm({ ...editTxForm, details: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              {editTxForm.type === 'PAYMENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={editTxForm.paymentMethod}
                      onChange={(e) => setEditTxForm({ ...editTxForm, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Destination Ledger
                    </label>
                    <select
                      value={editTxForm.paymentDestination}
                      onChange={(e) => setEditTxForm({ ...editTxForm, paymentDestination: e.target.value as any })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white font-semibold"
                    >
                      <option value="CASH">Cash Records</option>
                      <option value="BANK">Bank Records</option>
                      <option value="AIRTEL">Airtel Float</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Branch / Site (Optional)
                </label>
                <select
                  value={editTxForm.branchId}
                  onChange={(e) => setEditTxForm({ ...editTxForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                >
                  <option value="">HQ Central / Unassigned</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTxModalOpen(false);
                    setEditingTx(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white rounded-lg shadow-sm"
                >
                  Save Entry Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Tx Modal */}
      {txToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-stone-900 text-base">Delete Entry</h3>
              <p className="text-xs text-stone-500">
                Delete transaction <strong>{txToDelete.referenceNo}</strong>? Debtor balance and running statement will be recalculated automatically.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTxConfirm}
                className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
