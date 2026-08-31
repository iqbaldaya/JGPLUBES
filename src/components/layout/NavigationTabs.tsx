import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Package,
  Layers,
  DollarSign,
  Smartphone,
  Truck,
  FileText,
  ClipboardList,
  AlertTriangle,
  Droplets,
  Flame,
  ShieldCheck,
  Store,
  UserCheck,
  X,
  ChevronRight,
  Scale,
  Landmark,
  Wallet,
  CalendarDays,
  Settings,
  Database,
  Receipt,
  LogOut,
} from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  group?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const {
    role,
    setRole,
    branches,
    currentBranchId,
    currentBranch,
    stockTransfers,
    lowStockAlerts,
    totalDiscrepancyCount,
    pendingCashMovementCount,
    unpostedDailySalesCount,
    isDbConnected,
    logout,
  } = useApp();

  // In transit transfers count
  const inTransitTransfersCount = (stockTransfers || []).filter((t) => t.status === 'IN_TRANSIT').length;
  const branchInTransitCount = (stockTransfers || []).filter(
    (t) =>
      t.status === 'IN_TRANSIT' &&
      (t.sourceBranchId === currentBranchId || t.destinationBranchId === currentBranchId)
  ).length;

  // Low stock alerts relevant to current context
  const relevantAlerts =
    role === 'OWNER'
      ? lowStockAlerts
      : lowStockAlerts.filter((a) => a.branchId === currentBranchId);

  const cashBadge =
    pendingCashMovementCount > 0
      ? `${pendingCashMovementCount} Pending`
      : totalDiscrepancyCount > 0
      ? `${totalDiscrepancyCount} Alert`
      : undefined;

  const cashBadgeColor =
    pendingCashMovementCount > 0
      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      : 'bg-red-500/20 text-red-300 border border-red-500/30';

  const ownerTabs: TabItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'Operations' },
    {
      id: 'branch-portals',
      label: 'Branch Portals (All Sites)',
      icon: Store,
      group: 'Operations',
      highlight: true,
      badge: `${branches.length} Portals`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    { id: 'daily-sales', label: 'Daily Sales & POS', icon: ShoppingCart, group: 'Operations' },
    {
      id: 'sales-history',
      label: 'Sales History Log',
      icon: FileText,
      group: 'Operations',
      badge: unpostedDailySalesCount > 0 ? `${unpostedDailySalesCount} Unposted` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'stock-transfers',
      label: 'Inter-Branch Transfers',
      icon: Truck,
      group: 'Operations',
      badge: inTransitTransfersCount > 0 ? `${inTransitTransfersCount} In Transit` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    { id: 'branch-mgr', label: 'Branch Management', icon: Building2, group: 'Operations' },
    { id: 'product-catalog', label: 'Product & Pricing', icon: Package, group: 'Operations' },
    {
      id: 'stock-recon',
      label: 'Stock Reconciliation',
      icon: Layers,
      group: 'Reconciliation',
      badge: relevantAlerts.length > 0 ? `${relevantAlerts.length} Low` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
    },
    {
      id: 'cash-recon',
      label: 'Cash Reconciliation',
      icon: DollarSign,
      group: 'Reconciliation',
      badge: cashBadge,
      badgeColor: cashBadgeColor,
    },
    { id: 'bank-records', label: 'Bank Records (Ledger)', icon: Landmark, group: 'Treasury Ledgers' },
    { id: 'cash-records', label: 'Cash Records (On Hand)', icon: Wallet, group: 'Treasury Ledgers' },
    { id: 'airtel-records', label: 'Airtel Money Records', icon: Smartphone, group: 'Treasury Ledgers' },
    { id: 'debtors', label: 'Debtors (Credit Sales)', icon: UserCheck, group: 'Treasury Ledgers' },
    { id: 'expenses', label: 'Expenses Ledger', icon: Receipt, group: 'Treasury Ledgers' },
    { id: 'supplier-ledger', label: 'Supplier Accounts', icon: Truck, group: 'Reconciliation' },
    { id: 'net-value', label: 'Business Net Value (Debit-Credit)', icon: Scale, group: 'Analytics', highlight: true },
    { id: 'quarterly-reports', label: 'Performance Reports', icon: FileText, group: 'Analytics', highlight: true },
    { id: 'data-import', label: 'Excel / CSV Data Import', icon: Database, group: 'System', highlight: true },
    { id: 'settings', label: 'Settings & Data Backup', icon: Settings, group: 'System' },
  ];

  const branchTabs: TabItem[] = [
    { id: 'branch-overview', label: 'Branch Overview & Stats', icon: LayoutDashboard, group: 'Site Operations' },
    { id: 'branch-sales-records', label: 'Day-to-Day Sales Records', icon: CalendarDays, group: 'Site Operations' },
    { id: 'branch-pos', label: 'Record Shift Sale (POS)', icon: ShoppingCart, group: 'Site Operations' },
    {
      id: 'branch-stock-transfers',
      label: 'Inter-Branch Transfers',
      icon: Truck,
      group: 'Site Operations',
      badge: branchInTransitCount > 0 ? `${branchInTransitCount} In Transit` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'branch-stock',
      label: 'Stock & Products',
      icon: Layers,
      group: 'Site Operations',
      badge: relevantAlerts.length > 0 ? `${relevantAlerts.length} Low` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
    },
    { id: 'branch-cash-recon', label: 'Cash Reconciliation', icon: DollarSign, group: 'Reconciliation' },
    { id: 'branch-stock-recon', label: 'Stock Reconciliation', icon: ClipboardList, group: 'Reconciliation' },
    { id: 'branch-airtel', label: 'Airtel Money Records', icon: Smartphone, group: 'Reconciliation' },
  ];

  const tabs = role === 'OWNER' ? ownerTabs : branchTabs;

  // Group tabs by category
  const groupedTabs: { [group: string]: TabItem[] } = {};
  tabs.forEach((tab) => {
    const groupName = tab.group || 'Navigation';
    if (!groupedTabs[groupName]) {
      groupedTabs[groupName] = [];
    }
    groupedTabs[groupName].push(tab);
  });

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1E293B] text-slate-300 w-64 lg:w-72 border-r border-slate-700/80 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white font-bold shadow-xs shrink-0">
            <div className="flex -space-x-1">
              <Droplets className="w-4 h-4 text-white" />
              <Flame className="w-4 h-4 text-blue-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-tight text-base text-white">
                JGP <span className="text-blue-400">LUBES</span>
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Lubes &amp; LPG Enterprise
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role / Site Switcher Card */}
      <div className="p-3 border-b border-slate-700/60 bg-[#0F172A]/50">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 px-1 flex items-center justify-between">
          <span>Active Portal Mode</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-400 font-mono">
            RBAC
          </span>
        </div>

        <div className="space-y-1.5">
          {/* Owner HQ Button */}
          <button
            id="btn-sidebar-owner-portal"
            onClick={() => setRole('OWNER')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              role === 'OWNER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Master HQ</span>
            </div>
            {role === 'OWNER' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          </button>

          {/* Branch Site Selector */}
          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700 px-2 py-1">
            <Store className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <select
              id="select-sidebar-branch"
              value={role === 'BRANCH_MANAGER' ? currentBranchId || '' : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setRole('BRANCH_MANAGER', e.target.value);
                }
              }}
              className="text-xs font-semibold py-0.5 bg-transparent border-0 text-slate-200 focus:ring-0 w-full cursor-pointer"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Switch to Branch Site...
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {role === 'BRANCH_MANAGER' && currentBranch && (
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="truncate">Champ: <strong className="text-slate-200">{currentBranch.lubesChamp}</strong></span>
            
          </div>
        )}
      </div>

      {/* Navigation Tabs - Left Hand Side List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {Object.entries(groupedTabs).map(([groupName, items]) => (
          <div key={groupName} className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1">
              {groupName}
            </div>
            <div className="space-y-0.5">
              {items.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    } ${tab.highlight && !isActive ? 'text-blue-300' : ''}`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {tab.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white text-blue-700 font-bold' : tab.badgeColor
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer System Context */}
      <div className="p-3 border-t border-slate-700/80 bg-[#0F172A]/70 text-[11px] text-slate-400 space-y-2">
        <button
          id="btn-sidebar-logout"
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 transition text-xs font-semibold"
          title="Lock portal and return to login screen"
        >
          <div className="flex items-center space-x-2">
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
            <span>Lock / Switch User</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Sign Out</span>
        </button>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {isDbConnected ? 'PostgreSQL Live' : 'Offline / Local'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v2.4 Pro</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1E293B] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

