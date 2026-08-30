import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  ShieldCheck,
  Building2,
  UserCheck,
  AlertTriangle,
  PlusCircle,
  Clock,
  Settings,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleMobileSidebar?: () => void;
  onOpenSaleModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onToggleMobileSidebar,
  onOpenSaleModal,
}) => {
  const {
    role,
    currentBranch,
    lowStockAlerts,
    totalDiscrepancyCount,
    isDbConnected,
    dbSyncError,
    lastDbSyncTime,
    manualSyncWithDatabase,
    logout,
  } = useApp();

  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await manualSyncWithDatabase();
    } finally {
      setIsSyncing(false);
    }
  };

  // Tab label helper for breadcrumb
  const getTabLabel = (id: string) => {
    switch (id) {
      case 'overview':
        return 'Executive Overview & KPIs';
      case 'daily-sales':
        return 'Daily Sales & Shift POS';
      case 'branch-mgr':
        return 'Branch & Champ Management';
      case 'product-catalog':
        return 'Products & Unit Margins';
      case 'stock-recon':
        return 'Physical Stock Reconciliation';
      case 'cash-recon':
        return 'Cash & Remittance Reconciliation';
      case 'bank-records':
        return 'Bank Records (Ledger)';
      case 'cash-records':
        return 'Cash Records (On Hand)';
      case 'airtel-records':
      case 'airtel-money':
        return 'Airtel Money Records';
      case 'debtors':
        return 'Debtors & Credit Customers';
      case 'supplier-ledger':
        return 'Supplier Accounts & Invoices';
      case 'net-value':
        return 'Business Net Value (Debit-Credit)';
      case 'quarterly-reports':
        return 'Quarterly Executive Reports';
      case 'settings':
        return 'System Settings & Data Backup';
      case 'branch-pos':
        return 'Site Shift Sales Entry';
      case 'branch-stock':
        return 'Site Stock Valuation & Alerts';
      case 'branch-sales-history':
        return 'Shift Sales Log & Receipts';
      case 'branch-cash-recon':
        return 'Daily Cash Balancing';
      case 'branch-stock-recon':
        return 'Physical Inventory Count';
      case 'branch-airtel':
        return 'Airtel Float Remittance Log';
      default:
        return 'Operations Portal';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Toggle + Breadcrumb */}
          <div className="flex items-center space-x-3">
            {onToggleMobileSidebar && (
              <button
                id="btn-toggle-mobile-sidebar"
                onClick={onToggleMobileSidebar}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                {role === 'OWNER' ? (
                  <span className="flex items-center space-x-1 font-semibold text-blue-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Owner Portal (HQ)</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 font-semibold text-blue-600">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Site: {currentBranch?.name} ({currentBranch?.code})</span>
                  </span>
                )}
                <span>/</span>
                <span className="text-slate-700 font-medium">{getTabLabel(activeTab)}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight mt-0.5">
                {getTabLabel(activeTab)}
              </h1>
            </div>
          </div>

          {/* Right: Alerts & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Real-Time Database Connection Badge */}
            <button
              id="btn-header-db-status"
              onClick={() => setIsDbModalOpen(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                isDbConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to view Database Connection Diagnostics & Real-Time Sync Status"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isDbConnected ? 'PostgreSQL Live' : 'Database Offline / Local'}
              </span>
              <span className="sm:hidden">
                {isDbConnected ? 'Live' : 'Local'}
              </span>
            </button>

            {/* Live date stamp */}
            <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDate}</span>
            </div>

            {/* Discrepancy Alert Flag */}
            {totalDiscrepancyCount > 0 && (
              <button
                id="btn-header-discrepancy-badge"
                onClick={() => setActiveTab(role === 'OWNER' ? 'cash-recon' : 'branch-cash-recon')}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
                title={`${totalDiscrepancyCount} shift records with cash variances`}
              >
                <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                <span>{totalDiscrepancyCount} Variance{totalDiscrepancyCount > 1 ? 's' : ''}</span>
              </button>
            )}

            {/* Low Stock Counter */}
            {lowStockAlerts.length > 0 && (
              <button
                id="btn-header-stock-alert"
                onClick={() => setActiveTab(role === 'OWNER' ? 'stock-recon' : 'branch-stock')}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium hover:bg-amber-100 transition"
                title="Low stock items alert"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold">{lowStockAlerts.length} Low Stock</span>
              </button>
            )}

            {/* Settings & Backup Button (Owner Only) */}
            {role === 'OWNER' && (
              <button
                id="btn-header-settings"
                onClick={() => setActiveTab('settings')}
                className={`p-1.5 rounded-lg border transition ${
                  activeTab === 'settings'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                }`}
                title="System Settings & Data Backup"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Lock / Sign Out Button */}
            <button
              id="btn-header-logout"
              onClick={logout}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
              title="Lock Portal / Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Quick Action: Log Sale Button */}
            <button
              id="btn-header-quick-sale"
              onClick={() => {
                if (onOpenSaleModal) {
                  onOpenSaleModal();
                } else {
                  setActiveTab(role === 'OWNER' ? 'daily-sales' : 'branch-pos');
                }
              }}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Record Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Header Context Bar for Branch Specifics */}
      {role === 'BRANCH_MANAGER' && currentBranch && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Lubes Champ: <strong className="text-slate-900">{currentBranch.lubesChamp}</strong></span>
            </div>
            <span>•</span>
            <span>Till: <strong className="text-slate-700 font-mono">{currentBranch.airtelMerchantNumber}</strong></span>
            <span>•</span>
            <span>Opening Cash Float: <strong className="text-slate-700 font-mono">K{currentBranch.openingCashFloat}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Site ID: {currentBranch.id}
          </span>
        </div>
      )}
      {/* Database Connection Diagnostic Modal */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    isDbConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Cloud PostgreSQL Database</h3>
                  <p className="text-xs text-slate-400">Multi-Device Synchronization Diagnostics</p>
                </div>
              </div>
              <button
                onClick={() => setIsDbModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                  isDbConnected
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-300 text-amber-950'
                }`}
              >
                {isDbConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">
                    {isDbConnected ? 'PostgreSQL Backend Connected' : 'Running in Offline / LocalStorage Mode'}
                  </div>
                  <p className="leading-relaxed">
                    {isDbConnected
                      ? 'Every sale, stock update, debtor entry, and cash remittance is syncing in real-time across all connected devices and browsers.'
                      : 'Changes are currently stored in this browser only. To sync across all phones, tablets, and computers, connect your database.'}
                  </p>
                  {lastDbSyncTime && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      Last sync timestamp: {lastDbSyncTime.toLocaleTimeString()}
                    </div>
                  )}
                  {dbSyncError && !isDbConnected && (
                    <div className="mt-2 p-2 bg-red-100/80 border border-red-200 rounded text-red-700 font-mono text-[11px] break-all">
                      {dbSyncError}
                    </div>
                  )}
                </div>
              </div>

              {/* Render Environment Configuration Guide */}
              {!isDbConnected && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>How to enable PostgreSQL Live on Render:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-600">
                    <li>
                      In your <strong>Render Dashboard</strong>, navigate to your <strong>Web Service</strong> (and your <strong>Render PostgreSQL</strong> database).
                    </li>
                    <li>
                      Go to <strong>Environment</strong> &rarr; <strong>Environment Variables</strong>.
                    </li>
                    <li>
                      Add <strong>DATABASE_URL</strong> and paste your Render PostgreSQL <em>Internal Database URL</em> (or <em>External Database URL</em>).
                    </li>
                    <li>
                      Save changes to redeploy with live database synchronization.
                    </li>
                  </ol>
                </div>
              )}

              {/* Manual Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Checking Backend...' : 'Test Connection Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDbModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
