import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesRecord, SaleItem, PettyCashExpense } from '../../types';
import {
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Smartphone,
  RotateCcw,
  Building2,
  Calendar,
  UserCheck,
  Package,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface SalesAdjustmentModalProps {
  sale: DailySalesRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDeleteRequested?: (sale: DailySalesRecord) => void;
}

export const SalesAdjustmentModal: React.FC<SalesAdjustmentModalProps> = ({
  sale,
  isOpen,
  onClose,
  onSuccess,
  onDeleteRequested,
}) => {
  const { branches, products, branchStocks, adjustDailySale } = useApp();

  // Core Fields
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [shift, setShift] = useState<'Full Day' | 'Morning' | 'Evening'>('Full Day');
  const [lubesChamp, setLubesChamp] = useState<string>('');
  const [items, setItems] = useState<SaleItem[]>([]);

  // Payment Breakdown
  const [cashSales, setCashSales] = useState<number>(0);
  const [airtelDirectSales, setAirtelDirectSales] = useState<number>(0);
  const [bankOrCardSales, setBankOrCardSales] = useState<number>(0);
  const [creditSales, setCreditSales] = useState<number>(0);

  // Cash Reconciliation & Airtel Transfer
    const [actualCashReceived, setActualCashReceived] = useState<number>(0);
  const [cashSentToAirtelMoney, setCashSentToAirtelMoney] = useState<number>(0);
  const [airtelTxRef, setAirtelTxRef] = useState<string>('');
  const [airtelSenderPhone, setAirtelSenderPhone] = useState<string>('');
  const [airtelReceiver, setAirtelReceiver] = useState<string>('');

  // Petty Cash
  const [pettyExpenses, setPettyExpenses] = useState<PettyCashExpense[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);

  // Stock Delta Sync Option & Notes
  const [syncInventoryDelta, setSyncInventoryDelta] = useState<boolean>(true);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const lastLoadedSaleIdRef = useRef<string>('');

  // Load sale data when opened or changed
  useEffect(() => {
    if (isOpen && sale) {
      if (lastLoadedSaleIdRef.current === sale.id) {
        return;
      }
      lastLoadedSaleIdRef.current = sale.id;

      setSelectedBranchId(sale.branchId);
      setDate(sale.date);
      setShift(sale.shift);
      setLubesChamp(sale.lubesChamp);
      setItems(sale.items ? JSON.parse(JSON.stringify(sale.items)) : []);

      setCashSales(sale.paymentBreakdown?.cashSales || 0);
      setAirtelDirectSales(sale.paymentBreakdown?.airtelMoneyDirectSales || 0);
      setBankOrCardSales(sale.paymentBreakdown?.bankOrCardSales || 0);
      setCreditSales(sale.paymentBreakdown?.creditSales || 0);

            setActualCashReceived(sale.actualCashReceived || 0);
      setCashSentToAirtelMoney(sale.cashSentToAirtelMoney || 0);
      setAirtelTxRef(sale.airtelMoneyTxRef || '');
      setAirtelSenderPhone(sale.airtelMoneySenderPhone || '');
      setAirtelReceiver(sale.airtelMoneyReceiver || 'HQ Main Airtel Wallet');

      setPettyExpenses(sale.pettyCashExpenses ? JSON.parse(JSON.stringify(sale.pettyCashExpenses)) : []);
      setNotes(sale.notes || '');
      setAdjustmentReason('');
      setErrorMessage(null);
      setSuccessMessage(null);
    } else if (!isOpen) {
      lastLoadedSaleIdRef.current = '';
    }
  }, [sale, isOpen]);

  if (!isOpen || !sale) return null;

  const currentBranchObj = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Totals calculations
  const totalSalesAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalCostAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const grossProfit = totalSalesAmount - totalCostAmount;
  const totalPaymentEntered = cashSales + airtelDirectSales + bankOrCardSales + creditSales;
  const paymentDiscrepancy = Math.abs(totalPaymentEntered - totalSalesAmount) > 0.01;

  // Expected Cash & Variance
  const expectedCashFromSales = cashSales;
  const cashVariance = actualCashReceived - expectedCashFromSales;
  const totalPettyExpenses = pettyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const closingCashInDrawer =
    actualCashReceived - cashSentToAirtelMoney - totalPettyExpenses;

  // Auto-sync Lubes Champ when branch changes
  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    const branch = branches.find((b) => b.id === newBranchId);
    if (branch) {
      setLubesChamp(branch.lubesChamp);
    }
  };

  // Update item quantity
  const handleUpdateItemQty = (index: number, newQty: number) => {
    const qty = Math.max(0, newQty);
    const updated = [...items];
    const item = updated[index];
    item.quantity = qty;
    item.totalAmount = qty * item.unitPrice;
    item.totalCost = qty * item.costPrice;
    item.profit = item.totalAmount - item.totalCost;
    setItems(updated);
  };

  // Update item unit price
  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice);
    const updated = [...items];
    const item = updated[index];
    item.unitPrice = price;
    item.totalAmount = item.quantity * price;
    item.profit = item.totalAmount - item.totalCost;
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add new item to sale
  const handleAddItem = (productId: string) => {
    if (!productId) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex >= 0) {
      handleUpdateItemQty(existingIndex, items[existingIndex].quantity + 1);
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
    setSelectedProductToAdd('');
  };

  // Auto balance cash payment
  const handleAutoBalanceCash = () => {
    const nonCash = airtelDirectSales + bankOrCardSales + creditSales;
    const balancedCash = Math.max(0, totalSalesAmount - nonCash);
    setCashSales(balancedCash);
    setActualCashReceived(balancedCash);
  };

  // Petty Cash handling
  const handleAddPettyExpense = () => {
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
    setPettyExpenses(pettyExpenses.filter((e) => e.id !== id));
  };

  // Submit adjustments
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (items.length === 0) {
      setErrorMessage('Sales record must contain at least one product line item.');
      return;
    }

    if (cashSentToAirtelMoney > 0 && !airtelTxRef.trim()) {
      setErrorMessage('Please provide an Airtel Transaction Reference for the cash transfer.');
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedNotes = [
        notes.trim(),
        adjustmentReason.trim()
          ? `[Owner Adjustment on ${new Date().toISOString().split('T')[0]}]: ${adjustmentReason.trim()}`
          : `[Owner Adjusted on ${new Date().toISOString().split('T')[0]}]`,
      ]
        .filter(Boolean)
        .join(' | ');

      const adjustedRecord: Omit<DailySalesRecord, 'id' | 'createdAt'> = {
        branchId: selectedBranchId,
        branchName: currentBranchObj?.name || sale.branchName,
        branchCode: currentBranchObj?.code || sale.branchCode,
        lubesChamp: lubesChamp.trim() || currentBranchObj?.lubesChamp || sale.lubesChamp,
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
        openingFloat: 0,
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
        notes: combinedNotes,
        status: Math.abs(cashVariance) > 0.01 ? 'DISCREPANCY_FLAGGED' : 'VERIFIED',
      };

      const result = adjustDailySale(sale.id, adjustedRecord, syncInventoryDelta);

      if (result.success) {
        setSuccessMessage('Daily sale values adjusted and synchronized successfully.');
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        setErrorMessage(result.message || 'Failed to adjust sale values.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving adjustments.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Owner Sales Adjustment &amp; Correction</h3>
                <span className="text-[10px] font-mono bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                  {sale.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Adjust product quantities, prices, payment breakdown, cash counts, and inventory deltas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Status Feedback */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Section 1: Site, Date, Champ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Branch Site *
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 text-xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Sales Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Shift Period
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="Full Day">Full Day</option>
                <option value="Morning">Morning Shift</option>
                <option value="Evening">Evening Shift</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Lubes Champ Name
              </label>
              <input
                type="text"
                value={lubesChamp}
                onChange={(e) => setLubesChamp(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              />
            </div>
          </div>

          {/* Section 2: Products Sold Line Items */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Product Sales Lines &amp; Volumes
                </h4>
              </div>

              {/* Quick Add Product Dropdown */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs max-w-xs"
                >
                  <option value="">+ Add Product SKU to Sale...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - K{p.sellingPrice}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddItem(selectedProductToAdd)}
                  disabled={!selectedProductToAdd}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg disabled:opacity-40 transition"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                    <th className="py-2.5 px-2 text-center">Unit</th>
                    <th className="py-2.5 px-2 text-center w-24">Qty Sold</th>
                    <th className="py-2.5 px-2 text-right w-28">Unit Price (K)</th>
                    <th className="py-2.5 px-2 text-right w-24">Cost (K)</th>
                    <th className="py-2.5 px-3 text-right w-28">Total (K)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {item.productCode} • {item.category}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{item.unit}</td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleUpdateItemQty(idx, e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={item.unitPrice === 0 ? '' : item.unitPrice}
                          onChange={(e) => handleUpdateItemPrice(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-500">
                        K{item.costPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        K{item.totalAmount.toFixed(2)}
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          +K{item.profit.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-700">
                      Total {items.reduce((s, i) => s + i.quantity, 0)} units sold
                    </td>
                    <td colSpan={2} className="py-2.5 px-2 text-right text-slate-600">
                      Gross Profit: <span className="text-emerald-700 font-black">+K{grossProfit.toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-black text-slate-900">
                      K{totalSalesAmount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Payment Split & Cash Auto Balance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Payment Channels Split
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAutoBalanceCash}
                className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Balance Cash with Total Sales (K{totalSalesAmount.toFixed(2)})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cash Sales (K)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={cashSales === 0 ? '' : cashSales}
                  onChange={(e) => setCashSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Smartphone className="w-3.5 h-3.5 text-red-600" />
                  <span>Airtel Direct Till (K)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={airtelDirectSales === 0 ? '' : airtelDirectSales}
                  onChange={(e) => setAirtelDirectSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-red-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank / Card POS (K)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={bankOrCardSales === 0 ? '' : bankOrCardSales}
                  onChange={(e) => setBankOrCardSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit / Account (K)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={creditSales === 0 ? '' : creditSales}
                  onChange={(e) => setCreditSales(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            {paymentDiscrepancy && (
              <div className="text-xs text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Notice: Total payment split (K{totalPaymentEntered.toFixed(2)}) does not equal total sales amount (K{totalSalesAmount.toFixed(2)}). Click "Auto-Balance" to reconcile.
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Cash Drawer Reconciliation & Discrepancy */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                  Cash Reconciliation &amp; Discrepancy Audit
                </h4>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                  Math.abs(cashVariance) < 0.01
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {Math.abs(cashVariance) < 0.01
                  ? '✓ Balanced'
                  : `Discrepancy: ${cashVariance >= 0 ? `+K${cashVariance.toFixed(2)}` : `-K${Math.abs(cashVariance).toFixed(2)}`}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">


              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expected Cash from Sales (K)
                </label>
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800">
                  K{expectedCashFromSales.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Actual Physical Cash Counted (K) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={actualCashReceived === 0 ? '' : actualCashReceived}
                  onChange={(e) => setActualCashReceived(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cash Variance (K)
                </label>
                <div
                  className={`px-3 py-1.5 rounded-lg font-black border ${
                    cashVariance === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  {cashVariance >= 0 ? `+K${cashVariance.toFixed(2)}` : `-K${Math.abs(cashVariance).toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Airtel Money Transfer Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-red-600" />
              <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                Airtel Money Cash-In Transfer
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cash Sent to Airtel (K)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={cashSentToAirtelMoney === 0 ? '' : cashSentToAirtelMoney}
                  onChange={(e) => setCashSentToAirtelMoney(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Airtel Tx Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. AM-TX-992812"
                  value={airtelTxRef}
                  onChange={(e) => setAirtelTxRef(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sending Line Phone Number
                </label>
                <input
                  type="text"
                  value={airtelSenderPhone}
                  onChange={(e) => setAirtelSenderPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Inventory Synchronization Option & Reason */}
          <div className="space-y-4 pt-2">
            <label className="flex items-start space-x-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50 transition">
              <input
                type="checkbox"
                checked={syncInventoryDelta}
                onChange={(e) => setSyncInventoryDelta(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-bold text-blue-900 flex items-center space-x-1">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Synchronize Inventory Stock Differences (Recommended)</span>
                </div>
                <p className="text-slate-600 mt-0.5">
                  Automatically restores stock if quantities are reduced or items removed, and deducts stock if quantities are increased.
                </p>
              </div>
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Adjustment Reason / Audit Trail Note *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Owner corrected quantity count error, price typo, or added omitted LPG cylinder sale"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {onDeleteRequested && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequested(sale);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Sales Record</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Applying Adjustments...' : 'Save & Synchronize Adjustments'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
