import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockReconciliation as StockReconciliationType } from '../../types';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Building2,
  Calendar,
  History,
  ShieldCheck,
  Package,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';

interface StockReconciliationProps {
  branchIdFilter?: string | null;
}

export const StockReconciliation: React.FC<StockReconciliationProps> = ({ branchIdFilter }) => {
  const {
    branches,
    products,
    branchStocks,
    stockReconciliations,
    createStockReconciliation,
    deleteStockReconciliation,
    clearStockReconciliations,
    currentBranchId,
  } = useApp();

  const activeBranchId = branchIdFilter || currentBranchId || branches[0]?.id;
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  React.useEffect(() => {
    if (branchIdFilter && branchIdFilter !== selectedBranchId) {
      setSelectedBranchId(branchIdFilter);
    }
  }, [branchIdFilter]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'LUBRICANTS' | 'LPG'>('ALL');
  const [reconcileCounts, setReconcileCounts] = useState<Record<string, { physicalQty: number; reason: string }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Deletion modals state
  const [logToDelete, setLogToDelete] = useState<StockReconciliationType | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Get current stock items for selected branch
  const currentBranchStockItems = products.map((prod) => {
    const stock = branchStocks.find(
      (s) => s.branchId === selectedBranchId && s.productId === prod.id
    );
    const systemQty = stock ? stock.quantity : 0;
    const countEntry = reconcileCounts[prod.id];
    const physicalQty = countEntry !== undefined ? countEntry.physicalQty : systemQty;
    const variance = physicalQty - systemQty;
    const valueVariance = variance * prod.costPrice;

    return {
      product: prod,
      systemQty,
      physicalQty,
      variance,
      valueVariance,
      reason: countEntry?.reason || 'Routine Physical Audit',
    };
  });

  const filteredItems = currentBranchStockItems.filter((item) => {
    const matchesCategory =
      categoryFilter === 'ALL' || item.product.category === categoryFilter;
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const totalPhysicalItemsCounted = Object.keys(reconcileCounts).length;
  const totalVariancesDetected = filteredItems.filter((i) => i.variance !== 0).length;
  const netValueVariance = filteredItems.reduce((sum, i) => sum + i.valueVariance, 0);

  const handlePhysicalCountChange = (productId: string, qty: number) => {
    setReconcileCounts({
      ...reconcileCounts,
      [productId]: {
        physicalQty: Math.max(0, qty),
        reason: reconcileCounts[productId]?.reason || 'Routine Physical Audit',
      },
    });
  };

  const handleReasonChange = (productId: string, reason: string) => {
    const currentQty =
      reconcileCounts[productId]?.physicalQty ??
      (branchStocks.find((s) => s.branchId === selectedBranchId && s.productId === productId)?.quantity || 0);

    setReconcileCounts({
      ...reconcileCounts,
      [productId]: {
        physicalQty: currentQty,
        reason,
      },
    });
  };

  // Reconcile individual item
  const handleReconcileSingleItem = (item: typeof currentBranchStockItems[0]) => {
    createStockReconciliation(
      {
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        date: new Date().toISOString().split('T')[0],
        auditorOrChampName: `${selectedBranch.lubesChamp} (Site Manager)`,
        items: [
          {
            productId: item.product.id,
            productName: item.product.name,
            productCode: item.product.code,
            category: item.product.category,
            unit: item.product.unit,
            systemQty: item.systemQty,
            physicalQty: item.physicalQty,
            varianceQty: item.variance,
            unitCost: item.product.costPrice,
            varianceValue: item.valueVariance,
            reason: 'NORMAL_TOLERANCE',
            notes: item.reason,
          },
        ],
        totalPositiveVarianceQty: item.variance > 0 ? item.variance : 0,
        totalNegativeVarianceQty: item.variance < 0 ? Math.abs(item.variance) : 0,
        netVarianceValue: item.valueVariance,
      },
      true
    );

    // Clear count for this product
    const updated = { ...reconcileCounts };
    delete updated[item.product.id];
    setReconcileCounts(updated);

    setNotification({
      type: 'success',
      message: `Stock for ${item.product.name} reconciled to ${item.physicalQty} ${item.product.unit}.`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Reconcile all adjusted items
  const handleReconcileAllAdjusted = () => {
    const itemsToReconcile = filteredItems.filter(
      (item) => reconcileCounts[item.product.id] !== undefined && item.variance !== 0
    );

    if (itemsToReconcile.length === 0) {
      setNotification({
        type: 'error',
        message: 'No physical count changes or variances detected to adjust.',
      });
      return;
    }

    const reconItems = itemsToReconcile.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productCode: item.product.code,
      category: item.product.category,
      unit: item.product.unit,
      systemQty: item.systemQty,
      physicalQty: item.physicalQty,
      varianceQty: item.variance,
      unitCost: item.product.costPrice,
      varianceValue: item.valueVariance,
      reason: 'NORMAL_TOLERANCE' as const,
      notes: item.reason,
    }));

    const totalPositive = reconItems.reduce(
      (acc, i) => (i.varianceQty > 0 ? acc + i.varianceQty : acc),
      0
    );
    const totalNegative = reconItems.reduce(
      (acc, i) => (i.varianceQty < 0 ? acc + Math.abs(i.varianceQty) : acc),
      0
    );
    const netVariance = reconItems.reduce((acc, i) => acc + i.varianceValue, 0);

    createStockReconciliation(
      {
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        date: new Date().toISOString().split('T')[0],
        auditorOrChampName: `${selectedBranch.lubesChamp} (Site Manager)`,
        items: reconItems,
        totalPositiveVarianceQty: totalPositive,
        totalNegativeVarianceQty: totalNegative,
        netVarianceValue: netVariance,
      },
      true
    );

    setReconcileCounts({});
    setNotification({
      type: 'success',
      message: `Successfully adjusted ${itemsToReconcile.length} inventory items for ${selectedBranch.name}!`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle single log deletion
  const handleConfirmDeleteLog = () => {
    if (!logToDelete) return;
    const res = deleteStockReconciliation(logToDelete.id);
    if (res.success) {
      setNotification({
        type: 'success',
        message: `Stock reconciliation audit log for ${logToDelete.branchName} (${logToDelete.date}) was deleted.`,
      });
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Failed to delete audit log.',
      });
    }
    setLogToDelete(null);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle clearing all logs
  const handleConfirmClearAllLogs = () => {
    clearStockReconciliations();
    setShowClearAllModal(false);
    setNotification({
      type: 'success',
      message: 'All past stock reconciliation audit logs have been deleted.',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Physical Inventory Audit &amp; Control</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Physical Stock Count &amp; Reconciliation
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Conduct periodic physical stock-takes, compare counted stock against live system books, and post authorized ledger adjustments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-reconcile-all-adjusted"
            onClick={handleReconcileAllAdjusted}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Apply All Stock Adjustments</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center space-x-2 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Control Bar & Branch Selector */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-500 font-semibold">Auditing Branch:</span>
            <select
              id="select-stock-reconcile-branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={!!branchIdFilter}
              className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-900 disabled:bg-stone-100"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) - Champ: {b.lubesChamp}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
            {(['ALL', 'LUBRICANTS', 'LPG'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat === 'ALL' ? 'All Products' : cat === 'LUBRICANTS' ? 'Motor Oils' : 'LPG Gas'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search SKU name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg w-60"
          />
        </div>
      </div>

      {/* Audit Form Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">
              Live Stock Count Sheet - {selectedBranch?.name} ({filteredItems.length} SKUs)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Enter physical counted units on shelf
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Product Name &amp; Code</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">System Book Qty</th>
                <th className="py-3 px-4 text-center w-32">Physical Count</th>
                <th className="py-3 px-4 text-right">Variance Qty</th>
                <th className="py-3 px-4 text-right">Variance Value (K)</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-center">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map((item) => {
                const hasVariance = item.variance !== 0;
                const isShortage = item.variance < 0;

                return (
                  <tr
                    key={item.product.id}
                    className={`hover:bg-stone-50 transition ${
                      hasVariance ? (isShortage ? 'bg-red-50/20' : 'bg-blue-50/20') : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{item.product.name}</div>
                      <div className="font-mono text-[11px] text-stone-500">{item.product.code}</div>
                    </td>

                    <td className="py-3 px-4 text-center text-stone-600 text-xs">{item.product.unit}</td>

                    <td className="py-3 px-4 text-right font-bold text-stone-700">
                      {item.systemQty}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.physicalQty}
                        onChange={(e) =>
                          handlePhysicalCountChange(item.product.id, Number(e.target.value))
                        }
                        className={`w-24 px-2.5 py-1.5 border rounded text-center font-black text-sm ${
                          hasVariance
                            ? isShortage
                              ? 'border-red-400 bg-red-50 text-red-900'
                              : 'border-blue-400 bg-blue-50 text-blue-900'
                            : 'border-stone-300 bg-white text-stone-900'
                        }`}
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-full inline-block ${
                          !hasVariance
                            ? 'bg-emerald-100 text-emerald-800'
                            : isShortage
                            ? 'bg-red-100 text-red-800 font-bold'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.variance >= 0 ? `+${item.variance}` : item.variance} {item.product.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-medium">
                      <span
                        className={
                          !hasVariance
                            ? 'text-stone-400'
                            : isShortage
                            ? 'text-red-700 font-bold'
                            : 'text-blue-700 font-bold'
                        }
                      >
                        {item.valueVariance >= 0
                          ? `+K${item.valueVariance.toFixed(2)}`
                          : `-K${Math.abs(item.valueVariance).toFixed(2)}`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {hasVariance ? (
                        <select
                          value={item.reason}
                          onChange={(e) => handleReasonChange(item.product.id, e.target.value)}
                          className="px-2 py-1 border border-stone-300 rounded bg-white text-xs text-stone-800"
                        >
                          <option value="Routine Physical Audit">Routine Physical Audit</option>
                          <option value="Damaged / Leaked Container">Damaged / Leaked Container</option>
                          <option value="Evaporation / Handling Loss">Evaporation / Handling Loss</option>
                          <option value="Unrecorded Shift Sale">Unrecorded Shift Sale</option>
                          <option value="Supplier Delivery Adjustment">Supplier Delivery Adjustment</option>
                          <option value="Miscount Correction">Miscount Correction</option>
                        </select>
                      ) : (
                        <span className="text-xs text-stone-400">Match confirmed</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {hasVariance ? (
                        <button
                          onClick={() => handleReconcileSingleItem(item)}
                          className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold transition shadow-2xs"
                        >
                          Post
                        </button>
                      ) : (
                        <span className="text-emerald-600 text-xs">✓ Synced</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Stock Reconciliation Audit Logs */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">
              Past Stock Reconciliation Audit Logs ({stockReconciliations.length} entries)
            </h3>
          </div>

          {stockReconciliations.length > 0 && (
            <button
              id="btn-clear-all-stock-recon-logs"
              type="button"
              onClick={() => setShowClearAllModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Logs</span>
            </button>
          )}
        </div>

        {stockReconciliations.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            <History className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="font-semibold text-stone-700">No stock reconciliation audit logs found.</p>
            <p className="text-stone-400 mt-0.5">Past audit counts and variance adjustments will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {stockReconciliations.map((rec) => {
              const items = rec.items || [];
              const netVariance = rec.netVarianceValue ?? (rec as any).varianceValue ?? 0;
              const auditor = rec.auditorOrChampName || (rec as any).reconciledBy || 'Site Manager';

              return (
                <div key={rec.id} className="p-4 space-y-2 text-xs hover:bg-stone-50/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-sm">{rec.branchName}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          rec.status === 'APPROVED_ADJUSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status === 'APPROVED_ADJUSTED' ? 'Approved & Adjusted' : rec.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 text-stone-500">
                      <div>
                        Date: <strong>{rec.date}</strong> • Auditor: <strong>{auditor}</strong>
                        {rec.reviewedBy && (
                          <span>
                            {' '}
                            • Reviewed By: <strong>{rec.reviewedBy}</strong>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        id={`btn-delete-stock-log-${rec.id}`}
                        onClick={() => setLogToDelete(rec)}
                        title="Delete this audit log"
                        className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded border border-transparent hover:border-red-200 transition cursor-pointer font-medium text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {items.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {items.map((item, idx) => {
                        const varVal =
                          item.varianceValue ?? item.varianceQty * (item.unitCost || 0) ?? 0;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pl-2 border-l-2 border-stone-200"
                          >
                            <div>
                              <span className="font-semibold text-stone-800">
                                {item.productName}
                              </span>{' '}
                              <span className="font-mono text-stone-500 text-[11px]">
                                ({item.productCode})
                              </span>
                              {item.notes && (
                                <span className="text-stone-400 text-[11px]">
                                  {' '}
                                  — {item.notes}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-right">
                              <span className="text-stone-600">
                                Book: <strong>{item.systemQty}</strong> → Count:{' '}
                                <strong>{item.physicalQty}</strong>
                              </span>
                              <span
                                className={`font-bold ${
                                  item.varianceQty < 0
                                    ? 'text-red-600'
                                    : item.varianceQty > 0
                                    ? 'text-emerald-600'
                                    : 'text-stone-600'
                                }`}
                              >
                                {item.varianceQty >= 0
                                  ? `+${item.varianceQty}`
                                  : item.varianceQty}{' '}
                                {item.unit} (K{(varVal || 0).toFixed(2)})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-stone-900">
                          {(rec as any).productName || 'General Stock Take'}
                        </span>
                        {(rec as any).reason && (
                          <span className="text-stone-500">
                            {' '}
                            — {(rec as any).reason}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-stone-800">
                        Variance: K{(netVariance || 0).toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1 text-[11px] font-bold text-stone-700">
                    Net Variance Value:{' '}
                    <span
                      className={`ml-1 ${
                        netVariance < 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {netVariance >= 0
                        ? `+K${(netVariance || 0).toFixed(2)}`
                        : `-K${Math.abs(netVariance || 0).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Single Log Deletion Modal */}
      {logToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-center text-slate-900 mb-1">
                Delete Audit Log?
              </h3>
              <p className="text-xs text-center text-slate-500 mb-4">
                Are you sure you want to permanently delete this stock reconciliation audit record from history?
              </p>

              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs space-y-1.5 mb-5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Branch:</span>
                  <span className="font-bold text-stone-900">{logToDelete.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Date:</span>
                  <span className="font-semibold text-stone-800">{logToDelete.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Auditor:</span>
                  <span className="text-stone-700">{logToDelete.auditorOrChampName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Items Reconciled:</span>
                  <span className="font-semibold text-stone-800">{logToDelete.items?.length || 1} product(s)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200">
                  <span className="font-bold text-stone-700">Net Variance:</span>
                  <span className="font-bold text-stone-900">
                    K{(logToDelete.netVarianceValue ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-cancel-delete-stock-log"
                  onClick={() => setLogToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-stock-log"
                  onClick={handleConfirmDeleteLog}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Log</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Logs Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-center text-slate-900 mb-1">
                Clear All Audit Logs?
              </h3>
              <p className="text-xs text-center text-slate-500 mb-5">
                This will permanently delete all ({stockReconciliations.length}) past stock reconciliation records. Current branch inventory quantities will remain unchanged.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-cancel-clear-all-stock-logs"
                  onClick={() => setShowClearAllModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-clear-all-stock-logs"
                  onClick={handleConfirmClearAllLogs}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Logs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
