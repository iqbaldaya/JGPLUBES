import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleItem, PettyCashExpense, DailySalesRecord, DailySalesPostingStatus } from '../../types';
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Smartphone,
  Droplets,
  Flame,
  Building2,
  UserCheck,
  Receipt,
  X,
  Lock,
  Unlock,
  Send,
  Save,
  CheckCheck,
  RotateCcw,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface DailySalesFormProps {
  onSuccess?: () => void;
  defaultBranchId?: string | null;
}

export const DailySalesForm: React.FC<DailySalesFormProps> = ({ onSuccess, defaultBranchId }) => {
  const {
    branches,
    products,
    branchStocks,
    dailySales,
    debtors,
    saveOrUpdateDailySale,
    postDailySaleToSystem,
    approveAndPostDailySale,
    rejectDailySale,
    role,
    currentBranchId,
  } = useApp();

  const activeBranchId = defaultBranchId || currentBranchId || branches[0]?.id;
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  useEffect(() => {
    if (defaultBranchId && defaultBranchId !== selectedBranchId) {
      setSelectedBranchId(defaultBranchId);
    }
  }, [defaultBranchId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [shift, setShift] = useState<'Full Day' | 'Morning' | 'Evening'>('Full Day');
  const [items, setItems] = useState<SaleItem[]>([]);

  // Payment Breakdown
  const [cashSales, setCashSales] = useState<number>(0);
  const [airtelDirectSales, setAirtelDirectSales] = useState<number>(0);
  const [bankOrCardSales, setBankOrCardSales] = useState<number>(0);
  const [creditSales, setCreditSales] = useState<number>(0);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('');

  // Cash Reconciliation & Airtel Transfer
  const [openingFloat, setOpeningFloat] = useState<number>(selectedBranch?.openingCashFloat || 1000);
  const [actualCashReceived, setActualCashReceived] = useState<number>(0);
  const [cashSentToAirtelMoney, setCashSentToAirtelMoney] = useState<number>(0);
  const [airtelTxRef, setAirtelTxRef] = useState<string>('');
  const [airtelSenderPhone, setAirtelSenderPhone] = useState<string>(selectedBranch?.phone || '');
  const [airtelReceiver, setAirtelReceiver] = useState<string>('HQ Main Airtel Wallet (+260 97 9990000)');

  // Petty Cash Expenses
  const [pettyExpenses, setPettyExpenses] = useState<PettyCashExpense[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);

  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success modal state
  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    status: 'UNPOSTED' | 'POSTED_APPROVED';
    branchName: string;
    date: string;
    totalAmount: number;
    itemsCount: number;
    actualCash: number;
    airtelSent: number;
  } | null>(null);

  // Rejection modal state for Owner
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Find existing record for (selectedBranchId, date)
  const existingRecord: DailySalesRecord | undefined = useMemo(() => {
    return dailySales.find(
      (s) => s.branchId === selectedBranchId && s.date === date
    );
  }, [dailySales, selectedBranchId, date]);

  // Determine lock state: Branch manager is locked if record is UNPOSTED or POSTED_APPROVED
  const isLockedForBranch = Boolean(
    role === 'BRANCH_MANAGER' &&
    existingRecord &&
    (existingRecord.postingStatus === 'UNPOSTED' || existingRecord.postingStatus === 'POSTED_APPROVED')
  );

  const lastLoadedKeyRef = useRef<string>('');
  const hasManuallyEditedCashRef = useRef<boolean>(false);
  const hasManuallyEditedActualCashRef = useRef<boolean>(false);

  // Sync state ONLY when selectedBranchId or date changes (or on initial load)
  // This ensures background database polling doesn't wipe in-progress user data
  useEffect(() => {
    const currentKey = `${selectedBranchId}__${date}`;
    if (lastLoadedKeyRef.current === currentKey) {
      return;
    }
    lastLoadedKeyRef.current = currentKey;

    if (existingRecord) {
      // Load saved day data
      setShift(existingRecord.shift || 'Full Day');
      setItems(existingRecord.items || []);
      setCashSales(existingRecord.paymentBreakdown?.cashSales || 0);
      setAirtelDirectSales(existingRecord.paymentBreakdown?.airtelMoneyDirectSales || 0);
      setBankOrCardSales(existingRecord.paymentBreakdown?.bankOrCardSales || 0);
      setCreditSales(existingRecord.paymentBreakdown?.creditSales || 0);
      setSelectedDebtorId(existingRecord.creditDebtorId || (debtors[0]?.id || ''));
      setOpeningFloat(existingRecord.openingFloat ?? (selectedBranch?.openingCashFloat || 1000));
      setActualCashReceived(existingRecord.actualCashReceived || 0);
      setCashSentToAirtelMoney(existingRecord.cashSentToAirtelMoney || 0);
      setAirtelTxRef(existingRecord.airtelMoneyTxRef || '');
      setAirtelSenderPhone(existingRecord.airtelMoneySenderPhone || selectedBranch?.phone || '');
      setAirtelReceiver(existingRecord.airtelMoneyReceiver || 'HQ Main Airtel Wallet (+260 97 9990000)');
      setPettyExpenses(existingRecord.pettyCashExpenses || []);
      setNotes(existingRecord.notes || '');
      hasManuallyEditedCashRef.current = true;
      hasManuallyEditedActualCashRef.current = true;
    } else {
      // Blank day initial state
      setShift('Full Day');
      setItems([]);
      setCashSales(0);
      setAirtelDirectSales(0);
      setBankOrCardSales(0);
      setCreditSales(0);
      setSelectedDebtorId(debtors[0]?.id || '');
      setOpeningFloat(selectedBranch?.openingCashFloat || 1000);
      setActualCashReceived(0);
      setCashSentToAirtelMoney(0);
      setAirtelTxRef('');
      setAirtelSenderPhone(selectedBranch?.phone || '');
      setAirtelReceiver('HQ Main Airtel Wallet (+260 97 9990000)');
      setPettyExpenses([]);
      setNotes('');
      hasManuallyEditedCashRef.current = false;
      hasManuallyEditedActualCashRef.current = false;
    }
  }, [selectedBranchId, date, existingRecord, selectedBranch, debtors]);

  // Calculate totals from items
  const totalSalesAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCostAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
  const grossProfit = totalSalesAmount - totalCostAmount;

  // Auto-sync cash sales when items change (ONLY if user hasn't manually edited the cash figure)
  useEffect(() => {
    if (!isLockedForBranch && (!existingRecord || existingRecord.postingStatus === 'DRAFT' || existingRecord.postingStatus === 'REJECTED')) {
      if (!hasManuallyEditedCashRef.current) {
        const nonCash = airtelDirectSales + bankOrCardSales + creditSales;
        const computedCash = Math.max(0, totalSalesAmount - nonCash);
        setCashSales(computedCash);
        if (!hasManuallyEditedActualCashRef.current) {
          setActualCashReceived(computedCash);
        }
      }
    }
  }, [totalSalesAmount, airtelDirectSales, bankOrCardSales, creditSales, isLockedForBranch, existingRecord]);

  // Expected Cash & Variance
  const expectedCashFromSales = cashSales;
  const cashVariance = actualCashReceived - expectedCashFromSales;
  const totalPettyExpenses = pettyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const closingCashInDrawer =
    openingFloat + actualCashReceived - cashSentToAirtelMoney - totalPettyExpenses;

  // Handle adding an item to the sale
  const handleAddItem = (productId: string) => {
    if (isLockedForBranch) return;

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        totalAmount: newQty * prod.sellingPrice,
        totalCost: newQty * prod.costPrice,
        profit: newQty * (prod.sellingPrice - prod.costPrice),
      };
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          category: prod.category,
          unit: prod.unit,
          volumePerUnit: prod.volumeLitersOrKg,
          quantity: 1,
          unitPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          totalAmount: prod.sellingPrice,
          totalCost: prod.costPrice,
          profit: prod.sellingPrice - prod.costPrice,
        },
      ]);
    }
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    if (isLockedForBranch) return;
    const updated = [...items];
    const newQty = Math.max(0, qty);
    const item = updated[index];
    updated[index] = {
      ...item,
      quantity: newQty,
      totalAmount: newQty * item.unitPrice,
      totalCost: newQty * item.costPrice,
      profit: newQty * (item.unitPrice - item.costPrice),
    };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (isLockedForBranch) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddPettyExpense = () => {
    if (isLockedForBranch) return;
    if (!newExpenseDesc.trim() || newExpenseAmount <= 0) return;
    setPettyExpenses([
      ...pettyExpenses,
      {
        id: `pe-${Date.now()}`,
        description: newExpenseDesc.trim(),
        amount: Number(newExpenseAmount),
      },
    ]);
    setNewExpenseDesc('');
    setNewExpenseAmount(0);
  };

  const handleRemovePettyExpense = (id: string) => {
    if (isLockedForBranch) return;
    setPettyExpenses(pettyExpenses.filter((e) => e.id !== id));
  };

  // Helper to compile record payload
  const compilePayload = () => {
    const selectedDebtor = debtors.find((d) => d.id === selectedDebtorId);
    return {
      id: existingRecord?.id,
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      branchCode: selectedBranch.code,
      lubesChamp: selectedBranch.lubesChamp,
      date,
      shift,
      items,
      totalSalesAmount,
      totalCostAmount,
      grossProfit,
      paymentBreakdown: {
        cashSales,
        airtelMoneyDirectSales: airtelDirectSales,
        bankOrCardSales,
        creditSales,
      },
      creditDebtorId: creditSales > 0 ? selectedDebtorId : undefined,
      creditDebtorName: creditSales > 0 ? selectedDebtor?.name : undefined,
      openingFloat,
      expectedCashFromSales,
      actualCashReceived,
      cashVariance,
      cashSentToAirtelMoney,
      airtelMoneyTxRef: airtelTxRef.trim(),
      airtelMoneySenderPhone: airtelSenderPhone.trim(),
      airtelMoneyReceiver: airtelReceiver.trim(),
      pettyCashExpenses: pettyExpenses,
      totalPettyExpenses,
      closingCashInDrawer,
      notes: notes.trim(),
      status: (Math.abs(cashVariance) > 0.01 ? 'DISCREPANCY_FLAGGED' : 'VERIFIED') as 'DISCREPANCY_FLAGGED' | 'VERIFIED',
    };
  };

  // Validate inputs
  const validateForm = () => {
    if (items.length === 0) {
      const msg = 'Please add at least one product (Lubricants or LPG) sold during this shift before saving or posting.';
      setValidationError(msg);
      setFeedback({ type: 'error', message: msg });
      const el = document.getElementById('section-products-sold');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (cashSentToAirtelMoney > 0 && !airtelTxRef.trim()) {
      const msg = 'Airtel Money Transaction Reference ID is required when transferring cash to Airtel Float.';
      setValidationError(msg);
      setFeedback({ type: 'error', message: msg });
      const el = document.getElementById('input-airtel-tx-ref');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    setValidationError(null);
    return true;
  };

  // 1. Action: Save as Draft (Saved on this date, not locked, can edit or view any time)
  const handleSaveDraft = () => {
    if (!validateForm()) return;
    const payload = compilePayload();
    saveOrUpdateDailySale(payload, false);

    setFeedback({
      type: 'success',
      message: `Daily shift transactions saved as DRAFT for ${date}. You can switch dates or return anytime to continue editing before posting.`,
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 2. Action: Post Transactions to System (Locks branch editing, sends to Owner as Unposted)
  const handlePostToSystem = () => {
    if (!validateForm()) return;
    const payload = compilePayload();
    // Save and mark as UNPOSTED
    const saved = saveOrUpdateDailySale(payload, true);

    setFeedback({
      type: 'success',
      message: `Daily sales for ${date} have been POSTED to the system! This record is now locked for branch editing and sent to the Owner's Portal for verification & ledger approval.`,
    });

    setSuccessModalData({
      isOpen: true,
      title: 'Transactions Posted to System!',
      description: `Daily shift transactions for ${selectedBranch?.name || 'Branch'} (${date}) have been successfully posted to the central system. The record is now locked against branch modifications and submitted for Executive Owner ledger approval.`,
      status: 'UNPOSTED',
      branchName: selectedBranch?.name || 'Branch',
      date,
      totalAmount: totalSalesAmount,
      itemsCount: items.reduce((s, i) => s + i.quantity, 0),
      actualCash: actualCashReceived,
      airtelSent: cashSentToAirtelMoney,
    });

    setTimeout(() => setFeedback(null), 6000);
  };

  // 3. Action: Owner Approves & Posts directly to all ledgers
  const handleOwnerApprove = () => {
    if (items.length === 0) {
      const msg = 'Cannot approve an empty shift. Please add at least one product sold.';
      setValidationError(msg);
      setFeedback({ type: 'error', message: msg });
      return;
    }

    setValidationError(null);
    const payload = compilePayload();
    const res = approveAndPostDailySale(payload, 'Executive Owner');

    setFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });

    if (res.success) {
      setSuccessModalData({
        isOpen: true,
        title: 'Transactions Approved & Posted to Ledgers!',
        description: `Daily shift transactions for ${selectedBranch?.name || 'Branch'} (${date}) have been verified and posted into Bank, Cash, Airtel, Debtors, and Inventory ledgers.`,
        status: 'POSTED_APPROVED',
        branchName: selectedBranch?.name || 'Branch',
        date,
        totalAmount: totalSalesAmount,
        itemsCount: items.reduce((s, i) => s + i.quantity, 0),
        actualCash: actualCashReceived,
        airtelSent: cashSentToAirtelMoney,
      });
    }

    setTimeout(() => setFeedback(null), 6000);
  };

  // 4. Action: Owner Returns/Rejects to Branch with revision note
  const handleOwnerReject = () => {
    if (!existingRecord) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please enter a note explaining why this shift record is being returned to the branch.');
      return;
    }
    const res = rejectDailySale(existingRecord.id, rejectionReasonInput.trim());
    setIsRejectModalOpen(false);
    setRejectionReasonInput('');
    setFeedback({
      type: 'info',
      message: res.message,
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Quick Date Jump Helper
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  // Find other saved dates for this branch to display status chips
  const branchRecentRecords = useMemo(() => {
    return dailySales
      .filter((s) => s.branchId === selectedBranchId)
      .slice(0, 5);
  }, [dailySales, selectedBranchId]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl mx-auto space-y-0">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShoppingCart className="w-4 h-4" />
            <span>Site Daily Sales &amp; Shift Register</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Daily Sales Entry &amp; System Posting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Record motor oil &amp; LPG volumes, track cash reconciliation, and post daily transactions to the system for Owner ledger approval.
          </p>
        </div>

        {/* Branch Context Info */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Branch: <strong className="text-white">{selectedBranch?.name}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lubes Champ: <strong className="text-white">{selectedBranch?.lubesChamp}</strong></span>
          </div>
        </div>
      </div>

      {/* Date Navigation & Status Bar */}
      <div className="bg-slate-100/80 p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector & Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Selected Date:</span>
            <input
              id="input-sale-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-black text-slate-900 border-none bg-transparent focus:ring-0 cursor-pointer p-0"
            />
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                date === todayStr
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="px-2.5 py-1.5 rounded-lg font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(2)}
              className="px-2.5 py-1.5 rounded-lg font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition hidden sm:inline-block"
            >
              2 Days Ago
            </button>
          </div>
        </div>

        {/* Current Date Record Status Badge */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold">Status for {date}:</span>
          {!existingRecord ? (
            <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-bold">
              New / Not Saved
            </span>
          ) : existingRecord.postingStatus === 'POSTED_APPROVED' ? (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approved &amp; Posted to System</span>
            </span>
          ) : existingRecord.postingStatus === 'UNPOSTED' ? (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Posted to System (Pending Owner Approval)</span>
            </span>
          ) : existingRecord.postingStatus === 'REJECTED' ? (
            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Returned by Owner for Revision</span>
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>Saved Draft (Not Posted)</span>
            </span>
          )}
        </div>
      </div>

      {/* Lock Notice Banner for Branch Manager */}
      {isLockedForBranch && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-bold text-sm">
              {existingRecord?.postingStatus === 'POSTED_APPROVED'
                ? '✅ Record Approved & Posted to System Ledgers'
                : '🔒 Record Posted to System (Pending Executive Owner Approval)'}
            </div>
            <p className="text-amber-800">
              {existingRecord?.postingStatus === 'POSTED_APPROVED'
                ? `Transactions for ${date} have been verified and approved by ${existingRecord.approvedByOwnerName || 'Owner'}. Stock, Bank, Cash, and Airtel ledgers have been updated. Editing is locked for branch managers.`
                : `Transactions for ${date} have been posted by the branch and are now awaiting Owner approval. The form is locked against branch modifications. You can view all saved shift numbers below.`}
            </p>
          </div>
        </div>
      )}

      {/* Rejection notice if record was returned by owner */}
      {existingRecord?.postingStatus === 'REJECTED' && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-bold text-sm text-rose-950">
              ⚠️ Attention: Returned by Owner for Corrections
            </div>
            <p className="text-rose-800">
              <strong>Owner Note:</strong> "{existingRecord.rejectionReason || 'Please review item quantities and cash breakdown.'}"
            </p>
            <p className="text-rose-700">
              You may edit the entries below and click <strong>"Post Transactions to System"</strong> when corrected.
            </p>
          </div>
        </div>
      )}

      {/* Owner Quick Approval Bar if Unposted */}
      {role === 'OWNER' && existingRecord?.postingStatus === 'UNPOSTED' && (
        <div className="p-4 bg-blue-50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-blue-950 text-xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Executive Review Mode:</span>
              <span className="ml-1 text-slate-600">
                This branch shift is unposted. Approving it will post transactions to Bank, Cash, Airtel, Debtors, and deduct Stock.
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg transition"
            >
              Return to Branch
            </button>
            <button
              type="button"
              onClick={handleOwnerApprove}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center space-x-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve &amp; Post to Ledgers</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 border-b text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <Info className="w-4 h-4 text-blue-600" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-6 space-y-6 text-sm">
        {/* Step 1: Branch and Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Site / Branch *
            </label>
            <select
              id="select-sale-branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={role === 'BRANCH_MANAGER'}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-900 disabled:bg-slate-100"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) - {b.lubesChamp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Shift / Period
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              disabled={isLockedForBranch}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold disabled:bg-slate-100"
            >
              <option value="Full Day">Full Day (Standard Shift)</option>
              <option value="Morning">Morning Shift (07:00 - 14:00)</option>
              <option value="Evening">Evening Shift (14:00 - 21:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Opening Cash Float (K)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={openingFloat === 0 ? '' : openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              disabled={isLockedForBranch}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Step 2: Product SKU Quick Selector & Active Sale Lines */}
        <div id="section-products-sold" className="space-y-3 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Products Sold (Motor Oils &amp; LPG Gas)</span>
            </h3>
            {!isLockedForBranch && (
              <span className="text-xs text-slate-500 font-medium">
                Click any product below to add to sales
              </span>
            )}
          </div>

          {/* Quick Product Buttons */}
          {!isLockedForBranch && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {products.map((prod) => {
                const stock = branchStocks.find(
                  (s) => s.branchId === selectedBranchId && s.productId === prod.id
                );
                const availableQty = stock ? stock.quantity : 0;
                const isLow = availableQty <= prod.reorderThreshold;

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddItem(prod.id)}
                    className="p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition flex flex-col justify-between shadow-2xs hover:border-blue-400 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{prod.code}</span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded ${
                            prod.category === 'LUBRICANTS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prod.category === 'LUBRICANTS' ? 'OIL' : 'LPG'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700">
                        {prod.name}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">K{prod.sellingPrice}</span>
                      <span
                        className={`text-[10px] ${
                          isLow ? 'text-amber-700 font-bold' : 'text-slate-500'
                        }`}
                      >
                        Stock: {availableQty}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Table of Selected Items */}
          {items.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">SKU / Product</th>
                    <th className="py-2.5 px-4 text-center">Unit</th>
                    <th className="py-2.5 px-4 text-center w-28">Qty Sold</th>
                    <th className="py-2.5 px-4 text-right">Price (K)</th>
                    <th className="py-2.5 px-4 text-right">Total (K)</th>
                    {!isLockedForBranch && <th className="py-2.5 px-4 text-center w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={`${item.productId}-${index}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{item.productCode}</div>
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600">{item.unit}</td>
                      <td className="py-2.5 px-4 text-center">
                        {isLockedForBranch ? (
                          <span className="font-black text-sm text-slate-900">{item.quantity}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => handleUpdateItemQty(index, e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold text-xs bg-white text-slate-900"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-700">K{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        K{item.totalAmount.toFixed(2)}
                      </td>
                      {!isLockedForBranch && (
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right text-slate-700">
                      Total Sales Revenue:
                    </td>
                    <td className="py-3 px-4 text-right text-base font-black text-blue-900">
                      K{totalSalesAmount.toFixed(2)}
                    </td>
                    {!isLockedForBranch && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              No products recorded for {date}. {!isLockedForBranch && 'Click on any product above to start logging sales.'}
            </div>
          )}
        </div>

        {/* Step 3: Payment Breakdown */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Payment Breakdown (Must Equal Total Sales: K{totalSalesAmount.toFixed(2)})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cash Sales (K)
              </label>
              <input
                id="input-sale-cash"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={cashSales === 0 ? '' : cashSales}
                disabled={isLockedForBranch}
                onChange={(e) => {
                  hasManuallyEditedCashRef.current = true;
                  setCashSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-red-500" />
                <span>Airtel Direct Till (K)</span>
              </label>
              <input
                id="input-sale-airtel-direct"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={airtelDirectSales === 0 ? '' : airtelDirectSales}
                disabled={isLockedForBranch}
                onChange={(e) => setAirtelDirectSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-red-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Bank / Card POS (K)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={bankOrCardSales === 0 ? '' : bankOrCardSales}
                disabled={isLockedForBranch}
                onChange={(e) => setBankOrCardSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Credit / Account Sales (K)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={creditSales === 0 ? '' : creditSales}
                disabled={isLockedForBranch}
                onChange={(e) => setCreditSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-amber-900 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* If credit sales occur, allow debtor selection */}
          {creditSales > 0 && (
            <div className="pt-2 border-t border-slate-200 flex items-center space-x-3">
              <label className="text-xs font-bold text-amber-900">
                Credit Customer / Debtor:
              </label>
              <select
                value={selectedDebtorId}
                disabled={isLockedForBranch}
                onChange={(e) => setSelectedDebtorId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 disabled:bg-slate-100"
              >
                {debtors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code}) - Balance: K{d.outstandingBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 4: Cash Drawer Reconciliation */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Cash Drawer Reconciliation &amp; Audit
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                Math.abs(cashVariance) < 0.01
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {Math.abs(cashVariance) < 0.01
                ? '✓ 100% Balanced'
                : `⚠ Discrepancy: ${cashVariance < 0 ? `-K${Math.abs(cashVariance)} (Shortage)` : `+K${cashVariance} (Surplus)`}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expected Cash from Sales (K)
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs">
                K{expectedCashFromSales.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Actual Physical Cash Counted (K) *
              </label>
              <input
                id="input-actual-cash-received"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={actualCashReceived === 0 ? '' : actualCashReceived}
                disabled={isLockedForBranch}
                onChange={(e) => {
                  hasManuallyEditedActualCashRef.current = true;
                  setActualCashReceived(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cash Variance (K)
              </label>
              <div
                className={`px-3 py-2 rounded-xl font-black text-xs border ${
                  cashVariance === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                {cashVariance >= 0 ? `+K${cashVariance.toFixed(2)}` : `-K${Math.abs(cashVariance).toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Cash Sent to Airtel Money */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Cash Deposited / Sent to Airtel Float
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Sent to Airtel Float (K)
              </label>
              <input
                id="input-cash-to-airtel"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={cashSentToAirtelMoney === 0 ? '' : cashSentToAirtelMoney}
                disabled={isLockedForBranch}
                onChange={(e) => setCashSentToAirtelMoney(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Airtel Transaction ID / Ref #
              </label>
              <input
                id="input-airtel-tx-ref"
                type="text"
                placeholder="e.g. AM-TX-8829103"
                value={airtelTxRef}
                disabled={isLockedForBranch}
                onChange={(e) => setAirtelTxRef(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs uppercase disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sending Phone Number
              </label>
              <input
                type="text"
                value={airtelSenderPhone}
                disabled={isLockedForBranch}
                onChange={(e) => setAirtelSenderPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Step 6: Petty Cash Expenses */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            Petty Cash Expenses Paid from Drawer (Optional)
          </label>
          {!isLockedForBranch && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Expense description (e.g. receipt rolls, bulbs, cleaning)"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Amount (K)"
                value={newExpenseAmount === 0 ? '' : newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-right font-semibold"
              />
              <button
                type="button"
                onClick={handleAddPettyExpense}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
              >
                + Add
              </button>
            </div>
          )}

          {pettyExpenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span>{exp.description}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">K{exp.amount.toFixed(2)}</span>
                {!isLockedForBranch && (
                  <button
                    type="button"
                    onClick={() => handleRemovePettyExpense(exp.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Lubes Champ / Shift Notes
          </label>
          <input
            id="input-sale-notes"
            type="text"
            placeholder="Special orders, customer credit notes, weather or site observations..."
            value={notes}
            disabled={isLockedForBranch}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs disabled:bg-slate-100"
          />
        </div>

        {/* Bottom Validation Alert (if any error triggered) */}
        {validationError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center justify-between space-x-2 animate-shake">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Drawer Summary & Action Buttons */}
        <div className="pt-5 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 space-y-0.5">
            <div>
              Closing Drawer Cash: <strong className="text-slate-900 font-bold">K{closingCashInDrawer.toFixed(2)}</strong>
            </div>
            <div>
              (Opening Float K{openingFloat} + Counted Cash K{actualCashReceived} - Airtel K{cashSentToAirtelMoney} - Petty K{totalPettyExpenses})
            </div>
          </div>

          {/* Action Buttons based on Role & State */}
          <div className="flex flex-wrap items-center gap-2.5">
            {role === 'BRANCH_MANAGER' ? (
              isLockedForBranch ? (
                <div className="text-xs font-semibold text-slate-500 italic flex items-center space-x-1 bg-slate-100 px-3 py-2 rounded-xl">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Posted &amp; locked. Edits can only be performed by Owner.</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                    <span>Save Draft (Keep for {date})</span>
                  </button>

                  <button
                    id="btn-submit-daily-sale"
                    type="button"
                    onClick={handlePostToSystem}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Transactions to System</span>
                  </button>
                </>
              )
            ) : (
              /* OWNER PORTAL ACTIONS */
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Save Changes</span>
                </button>

                {existingRecord?.postingStatus !== 'POSTED_APPROVED' && (
                  <button
                    type="button"
                    onClick={handleOwnerApprove}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Approve &amp; Post to Ledgers</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successModalData?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${successModalData.status === 'POSTED_APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {successModalData.status === 'POSTED_APPROVED' ? <CheckCheck className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {successModalData.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {successModalData.branchName} &bull; {successModalData.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {successModalData.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Gross Sales</span>
                <span className="font-black text-slate-900">K{successModalData.totalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Units Sold</span>
                <span className="font-black text-slate-900">{successModalData.itemsCount} units</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Physical Cash</span>
                <span className="font-black text-emerald-700">K{successModalData.actualCash.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Airtel Float</span>
                <span className="font-black text-red-700">K{successModalData.airtelSent.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold">
                {successModalData.status === 'POSTED_APPROVED' ? (
                  <span className="text-emerald-700 flex items-center space-x-1">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Posted to All Ledgers</span>
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked (Pending Owner Review)</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  if (onSuccess) onSuccess();
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Done / Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center space-x-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <span>Return Shift Sale to Branch</span>
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the corrections required. The branch manager will see this note, unlock their entry form, make fixes, and re-post.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Correction Instructions / Reason *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Please check LPG 6kg quantity sold vs cash collected..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOwnerReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
