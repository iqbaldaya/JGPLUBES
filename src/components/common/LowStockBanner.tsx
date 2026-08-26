import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, AlertCircle, PackageCheck, ChevronRight, X } from 'lucide-react';

interface LowStockBannerProps {
  branchId?: string | null;
}

export const LowStockBanner: React.FC<LowStockBannerProps> = ({ branchId }) => {
  const { lowStockAlerts } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Filter alerts if viewing a specific branch portal
  const filteredAlerts = branchId
    ? lowStockAlerts.filter((a) => a.branchId === branchId)
    : lowStockAlerts;

  if (filteredAlerts.length === 0 || dismissed) {
    return null;
  }

  const criticalCount = filteredAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = filteredAlerts.filter((a) => a.severity === 'WARNING').length;

  return (
    <>
      {/* Top Banner Alert Bar */}
      <div
        id="low-stock-alert-bar"
        className={`w-full px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs sm:text-sm transition-colors border-b ${
          criticalCount > 0
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center space-x-2 shrink-0">
            {criticalCount > 0 ? (
              <span className="flex items-center space-x-1.5 bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-red-600"></span>
                <span>{criticalCount} Critical</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                <span>Stock Warning</span>
              </span>
            )}
          </div>

          <p className="truncate text-xs">
            {branchId ? (
              <span>
                <strong>{filteredAlerts.length} items</strong> below reorder threshold at this site (
                {criticalCount > 0 && <span className="font-semibold">{criticalCount} Critical</span>}
                {criticalCount > 0 && warningCount > 0 && ', '}
                {warningCount > 0 && <span>{warningCount} Warning</span>})
              </span>
            ) : (
              <span>
                <strong>{filteredAlerts.length} items</strong> across branches require replenishment (
                {criticalCount} Critical, {warningCount} Warning)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="btn-view-stock-alerts"
            onClick={() => setIsOpen(true)}
            className="text-xs font-semibold px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 transition flex items-center space-x-1 shadow-2xs"
          >
            <span>Inspect Alerts</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            id="btn-dismiss-stock-alert-banner"
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-800 transition"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stock Alerts Detail Modal */}
      {isOpen && (
        <div
          id="stock-alerts-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Real-Time Low Stock &amp; Replenishment Monitor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live branch-level alerts triggered when current stock falls at or below safety reorder threshold
                  </p>
                </div>
              </div>
              <button
                id="btn-close-stock-modal"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Alerts */}
            <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
              {filteredAlerts.map((alert) => (
                <div
                  key={`${alert.branchId}-${alert.productId}`}
                  className="pt-3 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {alert.productCode}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          alert.category === 'LUBRICANTS'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {alert.category}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm">
                      {alert.productName} ({alert.unit})
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span className="font-medium text-slate-700">{alert.branchName}</span>
                      <span>•</span>
                      <span>Lubes Champ: <strong>{alert.lubesChamp}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current</div>
                      <div
                        className={`text-base font-bold font-mono ${
                          alert.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        {alert.currentStock} {alert.unit}
                      </div>
                    </div>
                    <div className="text-slate-300">/</div>
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reorder</div>
                      <div className="text-sm font-semibold font-mono text-slate-700">
                        {alert.reorderThreshold} {alert.unit}
                      </div>
                    </div>
                    <div className="pl-2 border-l border-slate-200 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded">
                      Deficit: -{alert.deficit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1.5">
                <PackageCheck className="w-4 h-4 text-slate-400" />
                <span>To replenish, record a supplier purchase invoice or transfer stock from central depot.</span>
              </div>
              <button
                id="btn-dismiss-stock-modal"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded text-xs hover:bg-blue-700 transition"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
