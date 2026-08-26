import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BankRecordsSection } from './BankRecordsSection';
import { CashRecordsSection } from './CashRecordsSection';
import { AirtelMoneyRecordsSection } from './AirtelMoneyRecordsSection';
import { DebtorsSection } from './DebtorsSection';
import {
  Landmark,
  Wallet,
  Smartphone,
  UserCheck,
  ArrowRightLeft,
  Scale,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface TreasuryLedgersViewProps {
  onNavigateTab?: (tab: string) => void;
  initialLedger?: 'BANK' | 'CASH' | 'AIRTEL' | 'DEBTORS';
}

export const TreasuryLedgersView: React.FC<TreasuryLedgersViewProps> = ({
  onNavigateTab,
  initialLedger = 'BANK',
}) => {
  const { ownerTreasury, totalDebtorsBalance, transferOwnerFunds } = useApp();
  const [activeLedger, setActiveLedger] = useState<'BANK' | 'CASH' | 'AIRTEL' | 'DEBTORS'>(initialLedger);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sourceAccount, setSourceAccount] = useState<'BANK' | 'OWNER_CASH' | 'AIRTEL_MONEY'>('BANK');
  const [destAccount, setDestAccount] = useState<'BANK' | 'OWNER_CASH' | 'AIRTEL_MONEY'>('OWNER_CASH');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferStatus, setTransferStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus(null);
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferStatus({ success: false, message: 'Please enter a valid transfer amount.' });
      return;
    }

    const res = transferOwnerFunds(sourceAccount, destAccount, amt, transferNotes);
    if (res.success) {
      setTransferStatus({ success: true, message: res.message || 'Transfer completed successfully.' });
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferAmount('');
        setTransferNotes('');
        setTransferStatus(null);
      }, 1500);
    } else {
      setTransferStatus({ success: false, message: res.message || 'Transfer failed.' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="treasury-ledgers-hub">
      {/* Top Level Account Summary Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Treasury &amp; Account Ledgers
              </h2>
              <p className="text-xs text-slate-500">
                Individual chronological ledgers for Bank Accounts, Cash on Hand, Airtel Money, and Debtors
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Internal Transfer</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('net-value')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>Business Net Value</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveLedger('BANK')}
              className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeLedger === 'BANK'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className={`w-3.5 h-3.5 ${activeLedger === 'BANK' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Bank Records</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeLedger === 'BANK' ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                K{ownerTreasury.cashInBank.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setActiveLedger('CASH')}
              className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeLedger === 'CASH'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className={`w-3.5 h-3.5 ${activeLedger === 'CASH' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Cash Records</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeLedger === 'CASH' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                K{ownerTreasury.cashOnHand.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setActiveLedger('AIRTEL')}
              className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeLedger === 'AIRTEL'
                  ? 'bg-white text-red-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${activeLedger === 'AIRTEL' ? 'text-red-600' : 'text-slate-400'}`} />
              <span>Airtel Money Records</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeLedger === 'AIRTEL' ? 'bg-red-100 text-red-800 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                K{ownerTreasury.cashOnAirtelMoney.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setActiveLedger('DEBTORS')}
              className={`flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeLedger === 'DEBTORS'
                  ? 'bg-white text-purple-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${activeLedger === 'DEBTORS' ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>Debtors</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeLedger === 'DEBTORS' ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                K{totalDebtorsBalance.toLocaleString()}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center space-x-1 sm:justify-end">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>All accounts reconcile with the Business Net Value balance sheet</span>
          </div>
        </div>
      </div>

      {/* Render Active Ledger */}
      {activeLedger === 'BANK' && <BankRecordsSection onNavigateTab={onNavigateTab} />}
      {activeLedger === 'CASH' && <CashRecordsSection onNavigateTab={onNavigateTab} />}
      {activeLedger === 'AIRTEL' && <AirtelMoneyRecordsSection onNavigateTab={onNavigateTab} />}
      {activeLedger === 'DEBTORS' && <DebtorsSection onNavigateTab={onNavigateTab} />}

      {/* Internal Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Transfer Treasury Funds</h3>
              </div>
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferStatus(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4">
              {transferStatus && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  transferStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {transferStatus.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Source Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    From Account
                  </label>
                  <select
                    value={sourceAccount}
                    onChange={(e) => setSourceAccount(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="BANK">Cash at Bank (K{ownerTreasury.cashInBank.toLocaleString()})</option>
                    <option value="OWNER_CASH">Cash on Hand (K{ownerTreasury.cashOnHand.toLocaleString()})</option>
                    <option value="AIRTEL_MONEY">Airtel Float (K{ownerTreasury.cashOnAirtelMoney.toLocaleString()})</option>
                  </select>
                </div>

                {/* Destination Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To Account
                  </label>
                  <select
                    value={destAccount}
                    onChange={(e) => setDestAccount(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="OWNER_CASH">Cash on Hand (K{ownerTreasury.cashOnHand.toLocaleString()})</option>
                    <option value="BANK">Cash at Bank (K{ownerTreasury.cashInBank.toLocaleString()})</option>
                    <option value="AIRTEL_MONEY">Airtel Float (K{ownerTreasury.cashOnAirtelMoney.toLocaleString()})</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transfer Amount (K)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    K
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Transfer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transfer Reference / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank cash withdrawal for site petty cash float"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
