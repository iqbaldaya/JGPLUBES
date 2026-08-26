import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesRecord } from '../../types';
import {
  Trash2,
  AlertTriangle,
  X,
  RotateCcw,
  Smartphone,
  Package,
  Calendar,
  Building2,
  UserCheck,
} from 'lucide-react';

interface SalesDeleteModalProps {
  sale: DailySalesRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SalesDeleteModal: React.FC<SalesDeleteModalProps> = ({
  sale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { deleteDailySale } = useApp();
  const [restoreStock, setRestoreStock] = useState<boolean>(true);
  const [removeAirtel, setRemoveAirtel] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const totalItemsCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);

  const handleDelete = () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = deleteDailySale(sale.id, restoreStock, removeAirtel);
      if (result.success) {
        setIsDeleting(false);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.message || 'Failed to delete record.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while deleting.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-red-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-700/60 rounded-xl">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Delete Daily Sales Record</h3>
              <p className="text-xs text-red-100">Permanent removal with optional inventory restoration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-red-200 hover:text-white rounded-lg hover:bg-red-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Record Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-900 text-sm">{sale.branchName}</span>
                <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                  {sale.branchCode}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">{sale.date}</span>
                <span className="text-slate-400">({sale.shift})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Champ: <strong className="text-slate-800">{sale.lubesChamp}</strong></span>
              </div>
              <div>
                Total Sold: <strong className="text-slate-900">{totalItemsCount} units</strong> ({sale.items.length} SKUs)
              </div>
              <div>
                Revenue: <strong className="text-slate-900 font-black">K{sale.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div>
                Gross Profit: <strong className="text-emerald-700 font-bold">+K{sale.grossProfit.toFixed(2)}</strong>
              </div>
            </div>

            {sale.cashSentToAirtelMoney > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center space-x-1.5 text-red-700">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Linked Airtel Transfer: <strong>K{sale.cashSentToAirtelMoney}</strong> ({sale.airtelMoneyTxRef || 'No ref'})</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Deletion Impact &amp; Ledger Reversal
            </div>

            <label className="flex items-start space-x-3 p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl cursor-pointer hover:bg-blue-50 transition">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-bold text-blue-900 flex items-center space-x-1">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Restore Inventory Stock at {sale.branchName}</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Automatically adds the {totalItemsCount} sold units back to physical stock quantities for this branch.
                </p>
              </div>
            </label>

            {sale.cashSentToAirtelMoney > 0 && (
              <label className="flex items-start space-x-3 p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl cursor-pointer hover:bg-amber-50 transition">
                <input
                  type="checkbox"
                  checked={removeAirtel}
                  onChange={(e) => setRemoveAirtel(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-amber-900 flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reverse Linked Airtel Money Deposit Record</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Removes the automatic cash deposit entry of K{sale.cashSentToAirtelMoney} from the Airtel Money ledger.
                  </p>
                </div>
              </label>
            )}
          </div>

          <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              <strong>Owner Security Warning:</strong> This action cannot be undone. All shift metrics, cash variances, and customer logs for this entry will be erased.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-300 text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Confirm & Delete Sales Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
