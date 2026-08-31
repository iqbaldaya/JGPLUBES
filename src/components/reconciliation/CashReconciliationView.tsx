import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashMovementDestination, DailySalesRecord, BranchCashMovement } from '../../types';
import { SalesDeleteModal } from '../sales/SalesDeleteModal';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Building2,
  Calendar,
  Search,
  Filter,
  ShieldAlert,
  Smartphone,
  Landmark,
  UserCheck,
  ArrowRightLeft,
  Plus,
  Clock,
  XCircle,
  Check,
  X,
  FileText,
  Wallet,
  BadgePercent,
  ChevronRight,
  Sparkles,
  Pencil,
  Trash2,
  Edit2,
  Save,
} from 'lucide-react';

interface CashReconciliationViewProps {
  branchIdFilter?: string | null;
}

export const CashReconciliationView: React.FC<CashReconciliationViewProps> = ({
  branchIdFilter,
}) => {
  const {
    role,
    dailySales,
    branches,
    currentBranch,
    updateDailySale,
    cashMovements,
    ownerTreasury,
    createCashMovement,
    updateCashMovement,
    approveCashMovement,
    rejectCashMovement,
    deleteCashMovement,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'MOVEMENTS' | 'DAILY_SHIFTS'>('MOVEMENTS');
  const [selectedBranch, setSelectedBranch] = useState<string>(branchIdFilter || 'ALL');
  const [filterDiscrepanciesOnly, setFilterDiscrepanciesOnly] = useState(false);
  const [movementStatusFilter, setMovementStatusFilter] = useState<string>('ALL');
  const [movementDestFilter, setMovementDestFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal State for New Cash Movement
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [modalBranchId, setModalBranchId] = useState<string>(
    branchIdFilter || (branches[0]?.id || '')
  );
  const [destination, setDestination] = useState<CashMovementDestination>('AIRTEL_MONEY');
  const [amount, setAmount] = useState<string>('');
  const [moveDate, setMoveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submittedBy, setSubmittedBy] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [recipientDetails, setRecipientDetails] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Review / Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingMovementId, setRejectingMovementId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Edit Shift Cash Reconciliation Modal State
  const [editingSale, setEditingSale] = useState<DailySalesRecord | null>(null);
  const [editActualCash, setEditActualCash] = useState<string>('');
  const [editExpectedCash, setEditExpectedCash] = useState<string>('');
  const [editAirtelSent, setEditAirtelSent] = useState<string>('');
  const [editAirtelRef, setEditAirtelRef] = useState<string>('');
  const [editAirtelSenderPhone, setEditAirtelSenderPhone] = useState<string>('');
    const [editPettyExpenses, setEditPettyExpenses] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'SUBMITTED' | 'VERIFIED' | 'DISCREPANCY_FLAGGED'>('VERIFIED');
  const [editShiftError, setEditShiftError] = useState<string | null>(null);

  // Edit Cash Movement Modal State
  const [editingMovement, setEditingMovement] = useState<BranchCashMovement | null>(null);
  const [editMoveAmount, setEditMoveAmount] = useState<string>('');
  const [editMoveDate, setEditMoveDate] = useState<string>('');
  const [editMoveDest, setEditMoveDest] = useState<CashMovementDestination>('AIRTEL_MONEY');
  const [editMoveRef, setEditMoveRef] = useState<string>('');
  const [editMoveSubmittedBy, setEditMoveSubmittedBy] = useState<string>('');
  const [editMoveRecipient, setEditMoveRecipient] = useState<string>('');
  const [editMoveNotes, setEditMoveNotes] = useState<string>('');
  const [editMoveStatus, setEditMoveStatus] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('PENDING_APPROVAL');
  const [editMoveReviewNotes, setEditMoveReviewNotes] = useState<string>('');
  const [editMoveError, setEditMoveError] = useState<string | null>(null);

  // Deletion Modal States
  const [deletingSale, setDeletingSale] = useState<DailySalesRecord | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<BranchCashMovement | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Auto populate submitter based on chosen branch
  const chosenBranch = branches.find((b) => b.id === modalBranchId) || branches[0];

  const handleOpenMoveModal = () => {
    const targetBranch = branchIdFilter
      ? branches.find((b) => b.id === branchIdFilter) || branches[0]
      : selectedBranch !== 'ALL'
      ? branches.find((b) => b.id === selectedBranch) || branches[0]
      : branches[0];

    if (targetBranch) {
      setModalBranchId(targetBranch.id);
      setSubmittedBy(`${targetBranch.lubesChamp} (Lubes Champ)`);
      if (destination === 'AIRTEL_MONEY') {
        setRecipientDetails('HQ Corporate Airtel Float (+260 97 9990000)');
      } else if (destination === 'BANK') {
        setRecipientDetails('Zanaco Corporate A/C #104928374');
      } else {
        setRecipientDetails('Handed directly to Owner / Managing Director');
      }
    }
    setAmount('');
    setReferenceNumber('');
    setNotes('');
    setFormError(null);
    setIsMoveModalOpen(true);
  };

  const handleDestinationChange = (newDest: CashMovementDestination) => {
    setDestination(newDest);
    if (newDest === 'AIRTEL_MONEY') {
      setRecipientDetails('HQ Corporate Airtel Float (+260 97 9990000)');
      if (!referenceNumber || referenceNumber.startsWith('DEP-') || referenceNumber.startsWith('CH-')) {
        setReferenceNumber(`AM-TX-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } else if (newDest === 'BANK') {
      setRecipientDetails('Zanaco Corporate Operations A/C #104928374');
      if (!referenceNumber || referenceNumber.startsWith('AM-') || referenceNumber.startsWith('CH-')) {
        setReferenceNumber(`DEP-ZNCO-${Math.floor(10000 + Math.random() * 90000)}`);
      }
    } else {
      setRecipientDetails('Handed directly to Owner (Cash on Hand)');
      if (!referenceNumber || referenceNumber.startsWith('AM-') || referenceNumber.startsWith('DEP-')) {
        setReferenceNumber(`CH-RCV-${Math.floor(10000 + Math.random() * 90000)}`);
      }
    }
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setFormError('Please enter a valid transfer amount greater than 0.');
      return;
    }
    if (!referenceNumber.trim()) {
      setFormError('Please provide a reference / receipt / voucher number.');
      return;
    }
    if (!submittedBy.trim()) {
      setFormError('Please specify who is submitting / handing over this cash.');
      return;
    }

    const branch = branches.find((b) => b.id === modalBranchId);
    if (!branch) {
      setFormError('Invalid branch selected.');
      return;
    }

    createCashMovement({
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code,
      amount: numAmount,
      destination,
      date: moveDate,
      submittedBy: submittedBy.trim(),
      referenceNumber: referenceNumber.trim().toUpperCase(),
      recipientDetails: recipientDetails.trim(),
      notes: notes.trim(),
    });

    setIsMoveModalOpen(false);
  };

  const handleApprove = (id: string) => {
    approveCashMovement(id);
  };

  const handleRejectClick = (id: string) => {
    setRejectingMovementId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (rejectingMovementId) {
      rejectCashMovement(rejectingMovementId, rejectReason.trim() || 'Rejected during audit review');
      setRejectModalOpen(false);
      setRejectingMovementId(null);
    }
  };

  // Open Edit Shift Reconciliation Modal
  const handleOpenEditShiftModal = (sale: DailySalesRecord) => {
    setEditingSale(sale);
    setEditActualCash(String(sale.actualCashReceived ?? '0'));
    setEditExpectedCash(String(sale.expectedCashFromSales ?? '0'));
    setEditAirtelSent(String(sale.cashSentToAirtelMoney ?? '0'));
    setEditAirtelRef(sale.airtelMoneyTxRef || '');
    setEditAirtelSenderPhone(sale.airtelMoneySenderPhone || '');
        setEditPettyExpenses(String(sale.totalPettyExpenses ?? '0'));
    setEditNotes(sale.notes || '');
    setEditStatus(sale.status || 'VERIFIED');
    setEditShiftError(null);
  };

  // Save Shift Reconciliation Edits
  const handleSaveEditShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    const actual = parseFloat(editActualCash) || 0;
    const expected = parseFloat(editExpectedCash) || 0;
    const airtel = parseFloat(editAirtelSent) || 0;
        const petty = parseFloat(editPettyExpenses) || 0;

    const computedVariance = actual - expected;
    const computedClosing = opening + actual - airtel - petty;

    updateDailySale(editingSale.id, {
      actualCashReceived: actual,
      expectedCashFromSales: expected,
      cashVariance: computedVariance,
      cashSentToAirtelMoney: airtel,
      airtelMoneyTxRef: editAirtelRef.trim(),
      airtelMoneySenderPhone: editAirtelSenderPhone.trim(),
      openingFloat: 0,
      totalPettyExpenses: petty,
      closingCashInDrawer: computedClosing,
      notes: editNotes.trim(),
      status: editStatus,
    });

    triggerToast(`✓ Shift cash reconciliation for ${editingSale.branchName} (${editingSale.date}) updated successfully.`);
    setEditingSale(null);
  };

  // Open Edit Cash Movement Modal
  const handleOpenEditMovementModal = (m: BranchCashMovement) => {
    setEditingMovement(m);
    setEditMoveAmount(String(m.amount));
    setEditMoveDate(m.date);
    setEditMoveDest(m.destination);
    setEditMoveRef(m.referenceNumber);
    setEditMoveSubmittedBy(m.submittedBy);
    setEditMoveRecipient(m.recipientDetails);
    setEditMoveNotes(m.notes || '');
    setEditMoveStatus(m.status);
    setEditMoveReviewNotes(m.reviewNotes || '');
    setEditMoveError(null);
  };

  // Save Cash Movement Edits
  const handleSaveEditMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;

    const numAmount = parseFloat(editMoveAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setEditMoveError('Please enter a valid positive transfer amount.');
      return;
    }
    if (!editMoveRef.trim()) {
      setEditMoveError('Please enter a reference / voucher number.');
      return;
    }

    const res = updateCashMovement(editingMovement.id, {
      amount: numAmount,
      date: editMoveDate,
      destination: editMoveDest,
      referenceNumber: editMoveRef.trim(),
      submittedBy: editMoveSubmittedBy.trim(),
      recipientDetails: editMoveRecipient.trim(),
      notes: editMoveNotes.trim(),
      status: editMoveStatus,
      reviewNotes: editMoveReviewNotes.trim(),
    });

    if (res && !res.success) {
      setEditMoveError(res.message || 'Failed to update cash movement.');
      return;
    }

    triggerToast(`✓ Cash movement record (${editMoveRef.trim()}) updated successfully.`);
    setEditingMovement(null);
  };

  // Delete Cash Movement
  const handleDeleteMovementClick = (m: BranchCashMovement) => {
    setDeletingMovement(m);
  };

  // Filter Cash Movements
  const filteredMovements = cashMovements.filter((m) => {
    const matchesBranch = selectedBranch === 'ALL' || m.branchId === selectedBranch;
    const matchesStatus = movementStatusFilter === 'ALL' || m.status === movementStatusFilter;
    const matchesDest = movementDestFilter === 'ALL' || m.destination === movementDestFilter;
    const matchesQuery =
      m.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.date.includes(searchQuery);

    return matchesBranch && matchesStatus && matchesDest && matchesQuery;
  });

  // Filter Daily Sales Audits
  const filteredSales = dailySales.filter((sale) => {
    const matchesBranch = selectedBranch === 'ALL' || sale.branchId === selectedBranch;
    const matchesDiscrepancy = !filterDiscrepanciesOnly || Math.abs(sale.cashVariance) > 0.01;
    const matchesQuery =
      sale.lubesChamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.date.includes(searchQuery);

    return matchesBranch && matchesDiscrepancy && matchesQuery;
  });

  // Calculate Cash Movement Metrics
  let approvedToAirtel = 0;
  let approvedToBank = 0;
  let approvedToOwnerCash = 0;
  let pendingApprovalAmount = 0;
  let pendingApprovalCount = 0;

  cashMovements.forEach((m) => {
    const isTargetBranch = selectedBranch === 'ALL' || m.branchId === selectedBranch;
    if (isTargetBranch) {
      if (m.status === 'APPROVED') {
        if (m.destination === 'AIRTEL_MONEY') approvedToAirtel += m.amount;
        if (m.destination === 'BANK') approvedToBank += m.amount;
        if (m.destination === 'OWNER_CASH') approvedToOwnerCash += m.amount;
      } else if (m.status === 'PENDING_APPROVAL') {
        pendingApprovalAmount += m.amount;
        pendingApprovalCount++;
      }
    }
  });

  // Calculate Shift Audit Metrics
  let totalCashCollected = 0;
  let totalExpectedCash = 0;
  let totalShortages = 0;
  let totalSurpluses = 0;
  let discrepancyCount = 0;

  filteredSales.forEach((sale) => {
    totalCashCollected += sale.actualCashReceived;
    totalExpectedCash += sale.expectedCashFromSales;
    if (sale.cashVariance < -0.01) {
      totalShortages += Math.abs(sale.cashVariance);
      discrepancyCount++;
    } else if (sale.cashVariance > 0.01) {
      totalSurpluses += sale.cashVariance;
      discrepancyCount++;
    }
  });

  const netVariance = totalCashCollected - totalExpectedCash;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Branch Cash Reconciliation &amp; Liquidity Transfers</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Cash Reconciliation &amp; Fund Movement Hub
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 max-w-3xl">
            Reconcile daily physical cash drawer collections and transfer surplus cash to <strong>Airtel Money Float</strong>, <strong>Commercial Bank Accounts</strong>, or <strong>Direct Cash Handover to Owner</strong> with Owner approval governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-move-cash"
            onClick={handleOpenMoveModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>+ Move Cash (Airtel / Bank / Owner)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Sub Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="tab-cash-movements"
            onClick={() => setActiveSubTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'MOVEMENTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Cash Movements &amp; Handovers</span>
            {pendingApprovalCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
                {pendingApprovalCount}
              </span>
            )}
          </button>

          <button
            id="tab-daily-shifts"
            onClick={() => setActiveSubTab('DAILY_SHIFTS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'DAILY_SHIFTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Daily Shift Drawer Audits</span>
            {discrepancyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black">
                {discrepancyCount}
              </span>
            )}
          </button>
        </div>

        {/* Global Branch Filter */}
        {!branchIdFilter && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
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
      </div>

      {/* SUB-VIEW 1: CASH MOVEMENTS & HANDOVERS */}
      {activeSubTab === 'MOVEMENTS' && (
        <div className="space-y-6">
          {/* Destination KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cash Given to Owner */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Cash Given to Owner
                </p>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
                K{approvedToOwnerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center space-x-1">
                <span>Direct Cash on Hand handovers</span>
              </p>
            </div>

            {/* Moved to Airtel Money */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Moved to Airtel Money
                </p>
                <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
                K{approvedToAirtel.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-red-600 mt-1 font-semibold">
                Transferred to Corporate Float
              </p>
            </div>

            {/* Moved to Bank */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Deposited in Bank
                </p>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">
                K{approvedToBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-blue-600 mt-1 font-semibold">
                Commercial Bank Accounts
              </p>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Pending Owner Approval
                </p>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-700 font-mono">
                K{pendingApprovalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                {pendingApprovalCount} transfer{pendingApprovalCount !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
          </div>

          {/* Pending Approval Callout for Owner */}
          {role === 'OWNER' && pendingApprovalCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {pendingApprovalCount} Cash Movement{pendingApprovalCount > 1 ? 's' : ''} Requiring Your Approval
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Branch Lubes Champs have initiated transfers of physical cash. Approving will automatically update your liquid accounts (Cash on Hand, Airtel Money Float, or Bank Accounts).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMovementStatusFilter('PENDING_APPROVAL')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shrink-0 transition"
              >
                Review Pending ({pendingApprovalCount})
              </button>
            </div>
          )}

          {/* Movements Filter & Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cash Movement &amp; Handover Requests ({filteredMovements.length})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ref, champ, branch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg w-48"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={movementStatusFilter}
                  onChange={(e) => setMovementStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                {/* Destination Filter */}
                <select
                  value={movementDestFilter}
                  onChange={(e) => setMovementDestFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Destinations</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="BANK">Bank Deposit</option>
                  <option value="OWNER_CASH">Cash Given to Owner</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Submitter</th>
                    <th className="py-3 px-4">Branch Site</th>
                    <th className="py-3 px-4">Destination Option</th>
                    <th className="py-3 px-4">Reference &amp; Recipient</th>
                    <th className="py-3 px-4 text-right">Amount (K)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Owner Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No cash movement records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((movement) => {
                      const isPending = movement.status === 'PENDING_APPROVAL';
                      const isApproved = movement.status === 'APPROVED';
                      const isRejected = movement.status === 'REJECTED';

                      return (
                        <tr
                          key={movement.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isPending ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{movement.date}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              <span>{movement.submittedBy}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{movement.branchName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{movement.branchCode}</div>
                          </td>

                          <td className="py-3 px-4">
                            {movement.destination === 'AIRTEL_MONEY' && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                <Smartphone className="w-3 h-3" />
                                <span>Airtel Money</span>
                              </span>
                            )}
                            {movement.destination === 'BANK' && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Landmark className="w-3 h-3" />
                                <span>Bank Deposit</span>
                              </span>
                            )}
                            {movement.destination === 'OWNER_CASH' && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Wallet className="w-3 h-3" />
                                <span>Cash to Owner</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono text-xs font-bold text-slate-800">
                              {movement.referenceNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {movement.recipientDetails || 'N/A'}
                            </div>
                            {movement.notes && (
                              <div className="text-[10px] text-slate-400 italic truncate max-w-xs">
                                "{movement.notes}"
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-black text-sm text-slate-900">
                              K{movement.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {isPending && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {isApproved && (
                              <div>
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approved</span>
                                </span>
                                {movement.reviewedBy && (
                                  <div className="text-[9px] text-slate-400 mt-0.5">
                                    {movement.reviewedBy}
                                  </div>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <div>
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                                  <XCircle className="w-3 h-3" />
                                  <span>Rejected</span>
                                </span>
                                {movement.reviewNotes && (
                                  <div className="text-[9px] text-red-600 mt-0.5 italic">
                                    "{movement.reviewNotes}"
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {isPending && role === 'OWNER' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(movement.id)}
                                    title="Approve Cash Transfer"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(movement.id)}
                                    title="Reject Cash Transfer"
                                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleOpenEditMovementModal(movement)}
                                title="Edit Cash Movement Entry"
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center space-x-1 border border-blue-200 transition cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteMovementClick(movement)}
                                title="Delete Cash Movement Entry"
                                className="p-1.5 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded text-xs transition cursor-pointer border border-stone-200"
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
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DAILY SHIFT DRAWER AUDITS */}
      {activeSubTab === 'DAILY_SHIFTS' && (
        <div className="space-y-6">
          {/* Discrepancy KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Expected Cash
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                K{totalExpectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">From registered cash sales</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Physical Cash Counted
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                K{totalCashCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Actual drawer collections</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Cumulative Shortages</span>
              </div>
              <div className="text-2xl font-black text-red-700 mt-1 font-mono">
                -K{totalShortages.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-red-600 mt-0.5 font-medium">
                {discrepancyCount} shifts with variances
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Net Reconciliation Position
              </div>
              <div
                className={`text-2xl font-black mt-1 font-mono ${
                  netVariance < 0
                    ? 'text-red-700'
                    : netVariance > 0
                    ? 'text-blue-700'
                    : 'text-emerald-700'
                }`}
              >
                {netVariance >= 0 ? `+K${netVariance.toFixed(2)}` : `-K${Math.abs(netVariance).toFixed(2)}`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {netVariance === 0 ? 'Perfectly balanced' : 'Net audit variance'}
              </div>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-slate-700" />
                <span>Daily Cash Shift Audit Trail ({filteredSales.length} records)</span>
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition border border-slate-300 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={filterDiscrepanciesOnly}
                    onChange={(e) => setFilterDiscrepanciesOnly(e.target.checked)}
                    className="w-3.5 h-3.5 text-red-600 rounded"
                  />
                  <span>Show Discrepancies Only</span>
                </label>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Champ, Date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-lg w-48"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date / Shift</th>
                    <th className="py-3 px-4">Branch Site</th>
                    <th className="py-3 px-4">Lubes Champ</th>
                    <th className="py-3 px-4 text-right">Expected Cash (K)</th>
                    <th className="py-3 px-4 text-right">Counted Cash (K)</th>
                    <th className="py-3 px-4 text-right">Discrepancy (K)</th>
                    <th className="py-3 px-4 text-right">Sent to Airtel (K)</th>
                    <th className="py-3 px-4 text-right">Closing Drawer (K)</th>
                    <th className="py-3 px-4 text-center">Audit Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const hasVariance = Math.abs(sale.cashVariance) > 0.01;
                    const isShortage = sale.cashVariance < -0.01;

                    return (
                      <tr
                        key={sale.id}
                        className={`hover:bg-slate-50 transition ${
                          hasVariance ? (isShortage ? 'bg-red-50/30' : 'bg-blue-50/20') : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{sale.date}</div>
                          <div className="text-[11px] text-slate-500">{sale.shift}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{sale.branchName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{sale.branchCode}</div>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center space-x-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sale.lubesChamp}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          K{sale.expectedCashFromSales.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          K{sale.actualCashReceived.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-full inline-block ${
                              !hasVariance
                                ? 'bg-emerald-100 text-emerald-800'
                                : isShortage
                                ? 'bg-red-100 text-red-800 ring-1 ring-red-300'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sale.cashVariance >= 0
                              ? `+K${sale.cashVariance.toFixed(2)}`
                              : `-K${Math.abs(sale.cashVariance).toFixed(2)}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-800">
                          K{sale.cashSentToAirtelMoney.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          K{sale.closingCashInDrawer.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sale.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sale.status === 'DISCREPANCY_FLAGGED'
                                ? 'bg-red-100 text-red-800 font-bold'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sale.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {sale.status === 'DISCREPANCY_FLAGGED' && (
                              <button
                                onClick={() => updateDailySale(sale.id, { status: 'VERIFIED' })}
                                title="Mark Discrepancy as Resolved"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow-2xs cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditShiftModal(sale)}
                              title="Edit Shift Cash Reconciliation Entries"
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center space-x-1 border border-blue-200 transition cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit Recon</span>
                            </button>
                            <button
                              onClick={() => setDeletingSale(sale)}
                              title="Delete Shift Cash Reconciliation Entry"
                              className="p-1.5 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded text-xs transition cursor-pointer border border-stone-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOVE CASH (AIRTEL / BANK / OWNER) */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Move Cash from Branch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer physical drawer cash to Airtel Money, Bank Deposit, or Handover to Owner
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Source Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Source Branch Site
                </label>
                <select
                  value={modalBranchId}
                  onChange={(e) => {
                    setModalBranchId(e.target.value);
                    const b = branches.find((item) => item.id === e.target.value);
                    if (b) setSubmittedBy(`${b.lubesChamp} (Lubes Champ)`);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) — Champ: {b.lubesChamp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Option (3 Selectable Cards) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choose Destination
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Airtel Money */}
                  <button
                    type="button"
                    onClick={() => handleDestinationChange('AIRTEL_MONEY')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col items-start cursor-pointer ${
                      destination === 'AIRTEL_MONEY'
                        ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-red-100 text-red-700 mb-2">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 block">Airtel Money</span>
                    <span className="text-[10px] text-slate-500">HQ Float Wallet</span>
                  </button>

                  {/* Bank Deposit */}
                  <button
                    type="button"
                    onClick={() => handleDestinationChange('BANK')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col items-start cursor-pointer ${
                      destination === 'BANK'
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 mb-2">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 block">Bank Account</span>
                    <span className="text-[10px] text-slate-500">Commercial Bank</span>
                  </button>

                  {/* Cash to Owner */}
                  <button
                    type="button"
                    onClick={() => handleDestinationChange('OWNER_CASH')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col items-start cursor-pointer ${
                      destination === 'OWNER_CASH'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 mb-2">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 block">Cash to Owner</span>
                    <span className="text-[10px] text-slate-500">Physical Handover</span>
                  </button>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer / Handover Date *
                  </label>
                  <input
                    type="date"
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Reference & Submitter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {destination === 'AIRTEL_MONEY'
                      ? 'Airtel Transaction ID *'
                      : destination === 'BANK'
                      ? 'Bank Deposit Slip / Ref No *'
                      : 'Handover Voucher / Slip No *'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AM-TX-882199, DEP-ZNCO-001"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Submitted / Handed Over By *
                  </label>
                  <input
                    type="text"
                    placeholder="Name & Title"
                    value={submittedBy}
                    onChange={(e) => setSubmittedBy(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Recipient Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Account / Phone / Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zanaco A/C #104928374 or +260 97 9990000"
                  value={recipientDetails}
                  onChange={(e) => setRecipientDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Handover Memo (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily shift cash takings transferred to corporate account."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-2"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Submit Cash Movement Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REASON */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 text-red-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Reject Cash Movement Request
              </h3>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Please specify a reason for rejecting this cash movement request. The submitting branch champion will see this feedback.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Reference number mismatch on bank statement or slip illegible."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DAILY SHIFT CASH RECONCILIATION */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Shift Cash Reconciliation
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingSale.branchName} • {editingSale.date} ({editingSale.shift} Shift)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditShift} className="space-y-4 pt-4">
              {editShiftError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editShiftError}</span>
                </div>
              )}

              {/* Real-time calculated live summary preview */}
              {(() => {
                const act = parseFloat(editActualCash) || 0;
                const exp = parseFloat(editExpectedCash) || 0;
                const air = parseFloat(editAirtelSent) || 0;
                                const pet = parseFloat(editPettyExpenses) || 0;
                const variance = act - exp;
                const closing = opn + act - air - pet;

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Expected Cash:</span>
                      <div className="font-mono font-bold text-slate-800">K{exp.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Counted Cash:</span>
                      <div className="font-mono font-bold text-blue-700">K{act.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Shift Variance:</span>
                      <div className={`font-mono font-bold ${variance === 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {variance === 0 ? 'K0.00 Balanced' : `${variance < 0 ? '-' : '+'}K${Math.abs(variance).toFixed(2)}`}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Closing in Drawer:</span>
                      <div className="font-mono font-bold text-emerald-700">K{closing.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Counted Physical Cash */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Counted Physical Cash in Drawer (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editActualCash}
                    onChange={(e) => setEditActualCash(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Actual cash handed over by champ</span>
                </div>

                {/* Expected Cash from Sales */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Cash from Sales (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editExpectedCash}
                    onChange={(e) => setEditExpectedCash(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Cash billed on sales receipts</span>
                </div>

                {/* Cash Sent to Airtel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cash Sent to Airtel Float (K)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editAirtelSent}
                    onChange={(e) => setEditAirtelSent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Airtel Transaction Ref */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Airtel Money Tx Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AM-TX-984210"
                    value={editAirtelRef}
                    onChange={(e) => setEditAirtelRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Airtel Sender Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Airtel Sender Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +260 97 1234567"
                    value={editAirtelSenderPhone}
                    onChange={(e) => setEditAirtelSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>


                {/* Petty Cash Expenses */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Petty Cash Expenses (K)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editPettyExpenses}
                    onChange={(e) => setEditPettyExpenses(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Audit Reconciliation Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Audit Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="VERIFIED">VERIFIED (Balanced / Approved)</option>
                    <option value="DISCREPANCY_FLAGGED">DISCREPANCY FLAGGED (Under Review)</option>
                    <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                  </select>
                </div>
              </div>

              {/* Audit Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Audit Notes & Explanations
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Count verified by Owner during site visit. Discrepancy rectified."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingSale;
                    setEditingSale(null);
                    setDeletingSale(target);
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs transition border border-red-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Shift Entry</span>
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Cash Reconciliation</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CASH MOVEMENT ENTRY */}
      {editingMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Cash Movement Record
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingMovement.branchName} • Ref: {editingMovement.referenceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingMovement(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMovement} className="space-y-4 pt-4">
              {editMoveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editMoveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Destination */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer Destination *
                  </label>
                  <select
                    value={editMoveDest}
                    onChange={(e) => setEditMoveDest(e.target.value as CashMovementDestination)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="AIRTEL_MONEY">📱 Airtel Money Float</option>
                    <option value="BANK">🏦 Bank Corporate Deposit</option>
                    <option value="OWNER_CASH">👑 Owner Physical Handover</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (ZMW) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editMoveAmount}
                    onChange={(e) => setEditMoveAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Handover *
                  </label>
                  <input
                    type="date"
                    value={editMoveDate}
                    onChange={(e) => setEditMoveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    required
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference / Slip / Voucher No *
                  </label>
                  <input
                    type="text"
                    value={editMoveRef}
                    onChange={(e) => setEditMoveRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                    required
                  />
                </div>

                {/* Submitted By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Submitted By (Staff Member)
                  </label>
                  <input
                    type="text"
                    value={editMoveSubmittedBy}
                    onChange={(e) => setEditMoveSubmittedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={editMoveStatus}
                    onChange={(e) => setEditMoveStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                    <option value="APPROVED">APPROVED (Reconciled)</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Recipient Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Account / Phone / Details
                </label>
                <input
                  type="text"
                  value={editMoveRecipient}
                  onChange={(e) => setEditMoveRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Handover Memo
                </label>
                <textarea
                  rows={2}
                  value={editMoveNotes}
                  onChange={(e) => setEditMoveNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Audit / Review Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank slip confirmed against Zanaco e-statement."
                  value={editMoveReviewNotes}
                  onChange={(e) => setEditMoveReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingMovement;
                    setEditingMovement(null);
                    setDeletingMovement(target);
                  }}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs transition border border-red-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Entry</span>
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingMovement(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Update Cash Movement</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE CASH MOVEMENT */}
      {deletingMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Cash Movement Entry</h3>
                <p className="text-xs text-slate-500">Permanent record removal</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-700 font-medium">
                Are you sure you want to permanently delete this cash movement / handover record?
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Branch Site:</span>
                  <span className="font-bold text-slate-900">{deletingMovement.branchName} ({deletingMovement.branchCode})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transfer Amount:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">K{deletingMovement.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-800">{deletingMovement.destination.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Reference / Slip:</span>
                  <span className="font-bold font-mono text-slate-800">{deletingMovement.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-700">{deletingMovement.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Submitter:</span>
                  <span className="text-slate-700">{deletingMovement.submittedBy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
                    {deletingMovement.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span className="text-[11px]">
                  This entry will be permanently removed from branch records and cash reconciliation ledgers.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingMovement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteCashMovement(deletingMovement.id);
                  setDeletingMovement(null);
                  triggerToast(res?.message || '✓ Cash movement record deleted successfully.');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE DAILY SHIFT CASH RECONCILIATION */}
      <SalesDeleteModal
        sale={deletingSale}
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
        onSuccess={() => {
          triggerToast('✓ Shift cash reconciliation record deleted successfully.');
          setDeletingSale(null);
        }}
      />

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
