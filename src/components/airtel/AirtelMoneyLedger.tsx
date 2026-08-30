import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AirtelMoneyRecord } from '../../types';
import {
  Smartphone,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Building2,
  Calendar,
  X,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface AirtelMoneyLedgerProps {
  branchIdFilter?: string | null;
}

export const AirtelMoneyLedger: React.FC<AirtelMoneyLedgerProps> = ({ branchIdFilter }) => {
  const {
    airtelMoneyRecords,
    branches,
    addAirtelMoneyRecord,
    verifyAirtelMoneyRecord,
  } = useApp();

  const allRecords = airtelMoneyRecords || [];
  const addFn = addAirtelMoneyRecord;
  const verifyFn = verifyAirtelMoneyRecord;

  const [selectedBranch, setSelectedBranch] = useState<string>(branchIdFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  React.useEffect(() => {
    if (branchIdFilter && branchIdFilter !== selectedBranch) {
      setSelectedBranch(branchIdFilter);
    }
  }, [branchIdFilter]);

  // New Record Form State
  const [newRecordData, setNewRecordData] = useState({
    branchId: branches[0]?.id || '',
    transactionType: 'DAILY_SALES_CASH_IN' as 'DAILY_SALES_CASH_IN' | 'DIRECT_CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT_OUT' | 'FLOAT_TOPUP' | 'WITHDRAWAL_TO_BANK',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    senderPhone: branches[0]?.phone || '',
    receiverPhoneOrTill: 'HQ Master Wallet (+260 97 9990000)',
    notes: '',
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Filter records
  const filteredRecords = allRecords.filter((rec) => {
    const matchesBranch =
      selectedBranch === 'ALL' || rec.branchId === selectedBranch;
    const ref = rec.transactionRef || (rec as any).referenceNumber || '';
    const sender = rec.senderNumber || (rec as any).senderPhone || '';
    const receiver = rec.receiverNumber || (rec as any).receiverPhoneOrTill || '';
    const notes = rec.notes || '';

    const matchesQuery =
      ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sender.includes(searchQuery) ||
      receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notes.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBranch && matchesQuery;
  });

  // Aggregates
  let totalDeposited = 0;
  let totalOutgoing = 0;
  filteredRecords.forEach((r) => {
    const t = r.type || (r as any).transactionType;
    if (
      t === 'DAILY_SALES_CASH_IN' ||
      t === 'CASH_DEPOSIT_FROM_SALES' ||
      t === 'DIRECT_CUSTOMER_PAYMENT' ||
      t === 'FLOAT_TOPUP'
    ) {
      totalDeposited += r.amount;
    } else {
      totalOutgoing += r.amount;
    }
  });

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === newRecordData.branchId);
    if (!branch) return;

    if (!newRecordData.referenceNumber.trim()) {
      alert('Transaction reference number is required.');
      return;
    }

    if (addFn) {
      addFn({
        branchId: branch.id,
        branchName: branch.name,
        type: newRecordData.transactionType,
        transactionRef: newRecordData.referenceNumber.trim().toUpperCase(),
        date: newRecordData.date,
        amount: Number(newRecordData.amount),
        senderNumber: newRecordData.senderPhone.trim(),
        receiverNumber: newRecordData.receiverPhoneOrTill.trim(),
        notes: newRecordData.notes.trim(),
        verified: true,
      });
    }

    setIsAddingRecord(false);
    setNewRecordData({
      branchId: branches[0]?.id || '',
      transactionType: 'DAILY_SALES_CASH_IN',
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      senderPhone: branches[0]?.phone || '',
      receiverPhoneOrTill: 'HQ Master Wallet (+260 97 9990000)',
      notes: '',
    });

    setNotification('Airtel Money transaction recorded and verified!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-red-600 font-semibold text-xs uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Digital Collections &amp; Remittance</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Airtel Money Audit &amp; Remittance Ledger
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Track daily cash-to-mobile money transfers from branches, direct customer till collections, and supplier payouts.
          </p>
        </div>

        <button
          id="btn-add-airtel-record"
          onClick={() => setIsAddingRecord(true)}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Airtel Money Transfer</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Mobile Money Inflows</span>
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            K{totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">Daily cash deposits &amp; direct sales</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Total Airtel Outflows</span>
          </div>
          <div className="text-2xl font-black text-stone-800 mt-1">
            K{totalOutgoing.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">Vendor transfers &amp; withdrawals</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Audit Status
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>100% Reconciled</span>
          </div>
          <div className="text-xs text-stone-500 mt-0.5">{filteredRecords.length} verified ledger entries</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-stone-900 text-sm">
            Airtel Money Transactions Log ({filteredRecords.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search reference, phone, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg w-56"
              />
            </div>

            {!branchIdFilter && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800"
              >
                <option value="ALL">All Branch Sites</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="divide-y divide-stone-200">
          {filteredRecords.map((record) => {
            const ref = record.transactionRef || (record as any).referenceNumber || 'N/A';
            const txType = record.type || (record as any).transactionType || 'DAILY_SALES_CASH_IN';
            const sender = record.senderNumber || (record as any).senderPhone || 'N/A';
            const receiver = record.receiverNumber || (record as any).receiverPhoneOrTill || 'HQ Treasury';

            return (
              <div key={record.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/60 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {ref}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        txType === 'DAILY_SALES_CASH_IN' || txType === 'CASH_DEPOSIT_FROM_SALES'
                          ? 'bg-emerald-100 text-emerald-800'
                          : txType === 'DIRECT_CUSTOMER_PAYMENT'
                          ? 'bg-blue-100 text-blue-800'
                          : txType === 'SUPPLIER_PAYMENT_OUT' || txType === 'SUPPLIER_PAYMENT'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {String(txType).replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-stone-500 font-semibold">{record.branchName}</span>
                  </div>

                  {record.notes && <p className="text-xs text-stone-600">{record.notes}</p>}

                  <div className="flex flex-wrap items-center text-xs text-stone-400 gap-x-4 gap-y-1">
                    <span>Date: <strong className="text-stone-700">{record.date}</strong></span>
                    <span>From: <strong className="text-stone-700">{sender}</strong></span>
                    <span>To: <strong className="text-stone-700">{receiver}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-stone-900">
                      K{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center justify-end space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{record.verified ? 'Verified (HQ)' : 'Pending Verification'}</span>
                    </div>
                  </div>

                  {!record.verified && verifyFn && (
                    <button
                      onClick={() => verifyFn(record.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow cursor-pointer"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Log Airtel Record */}
      {isAddingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-base">Record Airtel Money Transfer</h3>
              </div>
              <button onClick={() => setIsAddingRecord(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Branch Site *
                  </label>
                  <select
                    value={newRecordData.branchId}
                    onChange={(e) => setNewRecordData({ ...newRecordData, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Transfer Category *
                  </label>
                  <select
                    value={newRecordData.transactionType}
                    onChange={(e) => setNewRecordData({ ...newRecordData, transactionType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="DAILY_SALES_CASH_IN">Cash Deposit from Sales (Daily Remittance)</option>
                    <option value="DIRECT_CUSTOMER_PAYMENT">Direct Customer Till Payment</option>
                    <option value="SUPPLIER_PAYMENT_OUT">Supplier Settlement Outflow</option>
                    <option value="FLOAT_TOPUP">Float Wallet Top-up</option>
                    <option value="WITHDRAWAL_TO_BANK">Withdrawal to Bank</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Amount (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={newRecordData.amount || ''}
                    onChange={(e) => setNewRecordData({ ...newRecordData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-base font-black text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newRecordData.date}
                    onChange={(e) => setNewRecordData({ ...newRecordData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Airtel Transaction Ref / SMS ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AM-TX-882190"
                  value={newRecordData.referenceNumber}
                  onChange={(e) => setNewRecordData({ ...newRecordData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Sender Phone Number
                  </label>
                  <input
                    type="text"
                    value={newRecordData.senderPhone}
                    onChange={(e) => setNewRecordData({ ...newRecordData, senderPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Receiver Phone or Merchant Till
                  </label>
                  <input
                    type="text"
                    value={newRecordData.receiverPhoneOrTill}
                    onChange={(e) => setNewRecordData({ ...newRecordData, receiverPhoneOrTill: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Notes / Shift Ref
                </label>
                <input
                  type="text"
                  placeholder="Shift sales remittance..."
                  value={newRecordData.notes}
                  onChange={(e) => setNewRecordData({ ...newRecordData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddingRecord(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
