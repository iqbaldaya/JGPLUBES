import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Package,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupplierTransaction, SupplierItemEntry } from '../../types';

interface SupplierInvoiceEditModalProps {
  invoice: SupplierTransaction;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const SupplierInvoiceEditModal: React.FC<SupplierInvoiceEditModalProps> = ({
  invoice,
  onClose,
  onSuccess,
}) => {
  const {
    suppliers,
    branches,
    products,
    updateSupplierTransaction,
    deleteSupplierTransaction,
  } = useApp();

  // Header Details State
  const [supplierId, setSupplierId] = useState<string>(invoice.supplierId);
  const [branchId, setBranchId] = useState<string>(invoice.branchId || branches[0]?.id || '');
  const [referenceNo, setReferenceNo] = useState<string>(invoice.referenceNo || '');
  const [date, setDate] = useState<string>(invoice.date || '');
  const [dueDate, setDueDate] = useState<string>(invoice.dueDate || '');
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'>(
    (invoice.status as any) || 'PENDING'
  );
  const [notes, setNotes] = useState<string>(invoice.notes || '');

  // Product Line Items State
  const [items, setItems] = useState<SupplierItemEntry[]>(() => {
    if (invoice.items && invoice.items.length > 0) {
      return invoice.items.map((it) => ({ ...it }));
    }
    return [];
  });

  // Total amount state (can be auto-calculated or overridden)
  const [amount, setAmount] = useState<number>(invoice.amount || 0);
  const [autoCalculateTotal, setAutoCalculateTotal] = useState<boolean>(true);

  // Branch Stock Sync Toggle
  const [adjustBranchStock, setAdjustBranchStock] = useState<boolean>(true);

  // Status & Error
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmDeleteStock, setConfirmDeleteStock] = useState<boolean>(true);

  // Calculate items sum
  const calculatedItemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
    0
  );

  // When items change and autoCalculate is on, sync amount
  useEffect(() => {
    if (autoCalculateTotal && items.length > 0) {
      setAmount(calculatedItemsTotal);
    }
  }, [items, autoCalculateTotal, calculatedItemsTotal]);

  // Add a new product line item
  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;

    const newItem: SupplierItemEntry = {
      productId: firstProd.id,
      productName: firstProd.name,
      productCode: firstProd.code,
      quantity: 1,
      unitCost: firstProd.costPrice || 0,
      totalCost: firstProd.costPrice || 0,
    };

    setItems([...items, newItem]);
  };

  // Remove a product line item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof SupplierItemEntry, val: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === val);
      if (prod) {
        current.productId = prod.id;
        current.productName = prod.name;
        current.productCode = prod.code;
        // If current cost is 0 or matches previous prod cost, update with new prod cost
        current.unitCost = prod.costPrice || 0;
        current.totalCost = (current.quantity || 1) * current.unitCost;
      }
    } else if (field === 'quantity') {
      const qty = val === '' ? 0 : parseInt(val, 10) || 0;
      current.quantity = Math.max(0, qty);
      current.totalCost = current.quantity * (current.unitCost || 0);
    } else if (field === 'unitCost') {
      const cost = val === '' ? 0 : parseFloat(val) || 0;
      current.unitCost = Math.max(0, cost);
      current.totalCost = (current.quantity || 0) * current.unitCost;
    }

    updated[index] = current;
    setItems(updated);
  };

  // Submit edits
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!referenceNo.trim()) {
      setError('Invoice Reference Number / Invoice # is required.');
      return;
    }

    if (amount <= 0 && items.length === 0) {
      setError('Invoice must have product line items or a valid total amount.');
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const selectedBranch = branches.find((b) => b.id === branchId);

    const updates: Partial<SupplierTransaction> = {
      supplierId,
      supplierName: selectedSupplier?.name || invoice.supplierName,
      branchId,
      branchName: selectedBranch?.name || invoice.branchName,
      referenceNo: referenceNo.trim(),
      date,
      dueDate,
      amount: Number(amount) || calculatedItemsTotal,
      status,
      notes: notes.trim(),
      items: items.map((it) => ({
        ...it,
        totalCost: (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
      })),
    };

    const res = updateSupplierTransaction(invoice.id, updates, {
      adjustBranchStock,
      previousTx: invoice,
    });

    if (res.success) {
      if (onSuccess) onSuccess(res.message);
      onClose();
    } else {
      setError(res.message || 'Failed to update supplier invoice.');
    }
  };

  // Delete invoice handler
  const handleDelete = () => {
    const res = deleteSupplierTransaction(invoice.id, {
      reverseBranchStock: confirmDeleteStock,
    });
    if (res.success) {
      if (onSuccess) onSuccess('Supplier invoice deleted successfully.');
      onClose();
    } else {
      setError(res.message || 'Failed to delete invoice.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-stone-200 overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg text-stone-100">
                  Edit Supplier Purchase Invoice
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-400 text-stone-900">
                  {invoice.referenceNo || 'INVOICE'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Modify invoice metadata, destination branch, and itemized product line quantities &amp; prices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1 text-sm bg-stone-50/50">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Invoice Header Details */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
              <Building2 className="w-4 h-4 text-stone-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                1. Invoice Overview &amp; Destination
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Supplier Account *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Branch */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Destination Branch *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference # */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Invoice Ref / # *
                </label>
                <input
                  type="text"
                  required
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. INV-TOT-9921"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs uppercase font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Payment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PENDING">PENDING (Unpaid)</option>
                  <option value="PARTIAL">PARTIAL (Partially Paid)</option>
                  <option value="PAID">PAID (Settled)</option>
                  <option value="OVERDUE">OVERDUE (Payment Late)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Invoice Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Delivery / Consignment Notes
                </label>
                <input
                  type="text"
                  placeholder="Truck reg, batch #, driver, consignment remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Itemized Products & Quantities */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-stone-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  2. Product Line Items &amp; Purchase Costs ({items.length} SKUs)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product Line</span>
              </button>
            </div>

            {items.length > 0 ? (
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100/80 text-stone-700 uppercase text-[11px] font-black border-b border-stone-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product / SKU Selection</th>
                      <th className="py-2.5 px-3 w-28 text-right">Quantity</th>
                      <th className="py-2.5 px-3 w-32 text-right">Unit Cost (K)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Line Total (K)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {items.map((item, index) => {
                      const matchedProd = products.find((p) => p.id === item.productId);
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);

                      return (
                        <tr key={index} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-stone-400 font-bold text-[11px]">
                            {index + 1}
                          </td>

                          {/* Product Selection */}
                          <td className="py-2 px-3">
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — [{p.code}] ({p.unit})
                                </option>
                              ))}
                            </select>
                            {matchedProd && (
                              <div className="flex items-center space-x-2 mt-1 text-[10px] text-stone-500">
                                <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                  {matchedProd.code}
                                </span>
                                <span>Unit: {matchedProd.unit}</span>
                                <span>Cat: {matchedProd.category}</span>
                              </div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-right text-stone-900 bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Unit Cost */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={item.unitCost === 0 ? '' : item.unitCost}
                              onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-mono text-right text-stone-900 bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2 px-3 text-right font-black text-stone-900 font-mono text-xs">
                            K{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Delete Item */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove item line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-stone-50 border border-dashed border-stone-300 rounded-xl space-y-2">
                <Package className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">
                  No product line items currently attached to this invoice.
                </p>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-500 shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Product Line</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Financial Summary & Stock Synchronization */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
              <DollarSign className="w-4 h-4 text-stone-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                3. Total Invoice Amount &amp; Stock Sync Options
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Totals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Product Lines Sum:</span>
                  <span className="font-mono font-bold text-stone-900">
                    K{calculatedItemsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 uppercase">Total Invoice Payable (K) *</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-calc"
                      checked={autoCalculateTotal}
                      onChange={(e) => {
                        setAutoCalculateTotal(e.target.checked);
                        if (e.target.checked) setAmount(calculatedItemsTotal);
                      }}
                      className="w-3.5 h-3.5 text-amber-600 rounded"
                    />
                    <label htmlFor="auto-calc" className="text-[11px] text-stone-500 cursor-pointer">
                      Auto-sync from items
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-bold">
                    K
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    placeholder="0.00"
                    value={amount === 0 ? '' : amount}
                    disabled={autoCalculateTotal && items.length > 0}
                    onChange={(e) => setAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 border border-stone-300 rounded-xl text-lg font-black text-stone-900 bg-white disabled:bg-stone-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Right Column: Inventory Stock Sync Toggle */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="chk-sync-stock"
                    checked={adjustBranchStock}
                    onChange={(e) => setAdjustBranchStock(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="chk-sync-stock" className="text-xs font-bold text-amber-950 cursor-pointer block">
                      Synchronize Branch Inventory Stock
                    </label>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Automatically reconciles destination branch inventory on hand by adjusting stock quantities to reflect the modified product lines on this invoice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Danger Zone */}
          {isDeleting ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-red-800 font-bold text-xs uppercase">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Confirm Invoice Deletion</span>
              </div>
              <p className="text-xs text-red-700">
                Are you sure you want to delete invoice <strong className="font-mono">{invoice.referenceNo}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="del-reverse-stock"
                  checked={confirmDeleteStock}
                  onChange={(e) => setConfirmDeleteStock(e.target.checked)}
                  className="w-3.5 h-3.5 text-red-600 rounded"
                />
                <label htmlFor="del-reverse-stock" className="text-xs font-medium text-red-800">
                  Also deduct / reverse this invoice&apos;s item quantities from branch stock
                </label>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Yes, Permanently Delete Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200 shrink-0">
            <div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Invoice</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-100 transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-md transition-all text-xs flex items-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Invoice &amp; Products</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
