import React from 'react';
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
  } = useApp();

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
    </header>
  );
};
