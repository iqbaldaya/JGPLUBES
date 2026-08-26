import React, { useState } from 'react';
import { Product, BranchStock } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Calculator,
  Receipt,
  History,
  TrendingUp,
  Layers,
  Building2,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Calendar,
  Truck,
  Sparkles,
} from 'lucide-react';

interface ProductWacModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductWacModal: React.FC<ProductWacModalProps> = ({ product, onClose }) => {
  const { branchStocks, branches, getProductInvoiceHistory, calculateWeightedAverageCost } = useApp();

  // Invoice History for this product
  const invoiceHistory = getProductInvoiceHistory(product.id);

  // Total current network stock across branches
  const totalStock = branchStocks
    .filter((s) => s.productId === product.id)
    .reduce((sum, s) => sum + (s.quantity || 0), 0);

  // Branch breakdown
  const branchBreakdown = branches.map((branch) => {
    const stock = branchStocks.find((s) => s.branchId === branch.id && s.productId === product.id);
    return {
      branchId: branch.id,
      branchName: branch.name,
      quantity: stock ? stock.quantity : 0,
    };
  });

  // Current valuation
  const inventoryValuation = totalStock * product.costPrice;
  const currentMargin = product.sellingPrice - product.costPrice;
  const currentMarginPct = product.sellingPrice > 0 ? (currentMargin / product.sellingPrice) * 100 : 0;

  // Simulator State for "What-If" incoming purchase
  const [simQty, setSimQty] = useState<number>(20);
  const [simUnitCost, setSimUnitCost] = useState<number>(
    invoiceHistory.length > 0 ? invoiceHistory[0].unitCost : product.costPrice
  );

  const simulatedWac = calculateWeightedAverageCost(totalStock, product.costPrice, simQty, simUnitCost);
  const simulatedTotalUnits = totalStock + (Number(simQty) || 0);
  const simulatedValuation = simulatedTotalUnits * simulatedWac;
  const simulatedMargin = product.sellingPrice - simulatedWac;
  const simulatedMarginPct = product.sellingPrice > 0 ? (simulatedMargin / product.sellingPrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-400/20 text-blue-300 font-bold">
                  {product.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">({product.unit})</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">{product.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Top Key Valuation Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                <span>Catalog Cost (WAC)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
                K{product.costPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">
                {invoiceHistory.length > 0
                  ? `Based on ${invoiceHistory.length} invoice purchase${invoiceHistory.length > 1 ? 's' : ''}`
                  : 'Default catalog cost'}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Selling Price & Margin</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                K{product.sellingPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">
                +K{currentMargin.toFixed(2)} ({currentMarginPct.toFixed(1)}% profit)
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total Remaining Stock</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">
                {totalStock} <span className="text-xs font-normal text-indigo-700">{product.unit}</span>
              </div>
              <div className="text-[10px] text-indigo-700 mt-0.5">
                Across {branches.length} branch location{branches.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>Inventory Asset Value</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                K{inventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                {totalStock} units × K{product.costPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Mathematical WAC Rule Explanation Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>How Weighted Average Cost (WAC) Is Calculated</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                    Automatic Rule
                  </span>
                </h4>
                <p>
                  Whenever a purchase invoice is recorded from a supplier, the cost price of the product is updated.
                  If there is existing stock remaining in inventory and new units are purchased at a different price,
                  the system calculates the <strong>Weighted Average Cost</strong> across the remaining stock:
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1 shadow-2xs">
                  <div className="font-bold text-blue-900">
                    New Cost Price = [ (Remaining Stock × Current Cost) + (Invoice Purchase Qty × Invoice Unit Cost) ] ÷ [ Remaining Stock + Invoice Purchase Qty ]
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    * If current remaining stock is 0, the new cost price directly reflects the latest invoice price.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Branch Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Current Stock Distribution Across Branches</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {branchBreakdown.map((b) => (
                <div key={b.branchId} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="text-slate-600 font-medium truncate">{b.branchName}</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                    {b.quantity} <span className="text-[10px] text-slate-500 font-normal">{product.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Valuation: K{(b.quantity * product.costPrice).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recorded Purchase Invoices Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span>Recorded Supplier Purchase Invoices ({invoiceHistory.length})</span>
              </h4>
              {invoiceHistory.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  Most recent: <strong className="text-slate-800">{invoiceHistory[0].date}</strong>
                </span>
              )}
            </div>

            {invoiceHistory.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No purchase invoices recorded yet for this SKU.</p>
                <p className="mt-1">
                  When you record purchase invoices under <strong>Supplier Accounts</strong>, each invoice price will
                  automatically reflect here and update the Weighted Average Cost.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="p-3">Invoice Date</th>
                      <th className="p-3">Invoice Ref</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Branch Received</th>
                      <th className="p-3 text-right">Units</th>
                      <th className="p-3 text-right">Invoice Unit Cost</th>
                      <th className="p-3 text-right">Line Total</th>
                      <th className="p-3 text-right">Variance vs Selling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoiceHistory.map((inv, idx) => {
                      const lineMargin = product.sellingPrice - inv.unitCost;
                      const isLatest = idx === 0;

                      return (
                        <tr
                          key={inv.transactionId + idx}
                          className={`hover:bg-slate-50 transition ${isLatest ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="p-3 font-medium text-slate-700 flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.date}</span>
                            {isLatest && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                                Latest
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceRef}</td>
                          <td className="p-3 font-medium text-slate-700">{inv.supplierName}</td>
                          <td className="p-3 text-slate-600">{inv.branchName}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {inv.quantity} {product.unit}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-blue-900">
                            K{inv.unitCost.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            K{inv.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-700">
                            +K{lineMargin.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive "What-If" WAC Simulator */}
          <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 border border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Interactive WAC & Margin Simulator
                </h4>
              </div>
              <span className="text-[11px] text-slate-300">Simulate incoming order impact before purchasing</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Simulated Purchase Quantity ({product.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={simQty}
                    onChange={(e) => setSimQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-600 rounded-lg text-white font-mono font-bold text-sm focus:outline-hidden focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Simulated Invoice Unit Cost (K)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={simUnitCost}
                    onChange={(e) => setSimUnitCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-900/90 border border-slate-600 rounded-lg text-white font-mono font-bold text-sm focus:outline-hidden focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Resulting Weighted Average Cost:</div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      K{simulatedWac.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400">
                      (from K{product.costPrice.toFixed(2)})
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">New Total Stock:</span>
                    <span className="font-mono font-bold text-white">
                      {simulatedTotalUnits} {product.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">New Gross Margin:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +K{simulatedMargin.toFixed(2)} ({simulatedMarginPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-slate-400 block text-[10px]">New Combined Asset Value:</span>
                    <span className="font-mono font-bold text-blue-300">
                      K{simulatedValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>Cost price will recalculate automatically when you record new supplier invoices.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
