import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { LowStockBanner } from './components/common/LowStockBanner';

// Owner Components
import { OwnerOverview } from './components/owner/OwnerOverview';
import { BranchPortalsHub } from './components/owner/BranchPortalsHub';
import { BranchManager } from './components/owner/BranchManager';
import { ProductCatalog } from './components/owner/ProductCatalog';
import { SupplierLedger } from './components/owner/SupplierLedger';
import { QuarterlyReportGenerator } from './components/owner/QuarterlyReportGenerator';
import { BusinessNetValueSection } from './components/owner/BusinessNetValueSection';
import { BankRecordsSection } from './components/owner/BankRecordsSection';
import { CashRecordsSection } from './components/owner/CashRecordsSection';
import { AirtelMoneyRecordsSection } from './components/owner/AirtelMoneyRecordsSection';
import { AirtelMoneyLedger } from './components/airtel/AirtelMoneyLedger';
import { DebtorsSection } from './components/owner/DebtorsSection';
import ExpensesLedger from './components/owner/ExpensesLedger';
import { TreasuryLedgersView } from './components/owner/TreasuryLedgersView';
import { SettingsSection } from './components/owner/SettingsSection';
import { StockTransfersSection } from './components/stock/StockTransfersSection';
import { DataImportSection } from './components/import/DataImportSection';

// Sales & Branch Components
import { DailySalesForm } from './components/sales/DailySalesForm';
import { SalesHistory } from './components/sales/SalesHistory';
import { CashReconciliationView } from './components/reconciliation/CashReconciliationView';
import { StockReconciliation } from './components/stock/StockReconciliation';
import { BranchOverview } from './components/branch/BranchOverview';
import { BranchDayToDaySalesSection } from './components/branch/BranchDayToDaySalesSection';
import { LoginPage } from './components/auth/LoginPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AuthenticatedApp: React.FC = () => {
  const { role, currentBranchId } = useApp();
  const [activeTab, setActiveTab] = useState<string>(() => (role === 'OWNER' ? 'overview' : 'branch-pos'));
  const [salesSubView, setSalesSubView] = useState<'FORM' | 'LOGS'>('FORM');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Reset default tab when switching roles
  useEffect(() => {
    if (role === 'OWNER') {
      setActiveTab((prev) => (prev.startsWith('branch-') && prev !== 'branch-portals' && prev !== 'branch-mgr' ? 'overview' : prev));
    } else {
      setActiveTab((prev) => (prev === 'overview' || prev === 'branch-portals' || prev === 'branch-mgr' ? 'branch-pos' : prev));
    }
  }, [role, currentBranchId]);

  const renderContent = () => {
    if (role === 'OWNER') {
      switch (activeTab) {
        case 'overview':
          return <OwnerOverview onNavigateTab={setActiveTab} />;

        case 'branch-portals':
        case 'all-branch-portals':
          return <BranchPortalsHub />;

        case 'daily-sales':
          return (
            <div className="space-y-6">
              {/* Sales Sub-navigation toggle */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-2">
                  Daily Sales Operations
                </span>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setSalesSubView('FORM')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      salesSubView === 'FORM'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Log Daily Shift Sale
                  </button>
                  <button
                    onClick={() => setSalesSubView('LOGS')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      salesSubView === 'LOGS'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Sales History &amp; Audits
                  </button>
                </div>
              </div>

              {salesSubView === 'FORM' ? (
                <DailySalesForm onSuccess={() => setSalesSubView('LOGS')} />
              ) : (
                <SalesHistory />
              )}
            </div>
          );

        case 'sales-history':
          return <SalesHistory />;

        case 'stock-transfers':
          return <StockTransfersSection />;

        case 'branch-mgr':
          return <BranchManager />;

        case 'product-catalog':
          return <ProductCatalog />;

        case 'stock-recon':
          return <StockReconciliation />;

        case 'cash-recon':
          return <CashReconciliationView />;

        case 'bank-records':
          return <BankRecordsSection onNavigateTab={setActiveTab} />;

        case 'cash-records':
          return <CashRecordsSection onNavigateTab={setActiveTab} />;

        case 'airtel-records':
        case 'airtel-money':
          return <AirtelMoneyRecordsSection onNavigateTab={setActiveTab} />;

        case 'debtors':
          return <DebtorsSection onNavigateTab={setActiveTab} />;
        case 'expenses':
          return <ExpensesLedger />;

        case 'treasury-ledgers':
          return <TreasuryLedgersView onNavigateTab={setActiveTab} />;

        case 'supplier-ledger':
          return <SupplierLedger />;

        case 'net-value':
          return (
            <div className="space-y-6">
              <BusinessNetValueSection onNavigateTab={setActiveTab} />
            </div>
          );

        case 'quarterly-reports':
          return <QuarterlyReportGenerator />;

        case 'data-import':
          return <DataImportSection />;

        case 'settings':
          return <SettingsSection onNavigateTab={setActiveTab} />;

        default:
          return <OwnerOverview onNavigateTab={setActiveTab} />;
      }
    } else {
      // BRANCH MANAGER PORTAL (Strictly site-specific scope)
      switch (activeTab) {
        case 'branch-overview':
          return (
            <BranchOverview
              branchId={currentBranchId}
              onNavigateTab={(tab) => {
                if (tab === 'BRANCH_SALES_ENTRY') setActiveTab('branch-pos');
                else if (tab === 'STOCK_RECONCILIATION') setActiveTab('branch-stock-recon');
              }}
            />
          );

        case 'branch-sales-records':
          return (
            <BranchDayToDaySalesSection
              branchId={currentBranchId}
              onRecordSale={() => setActiveTab('branch-pos')}
            />
          );

        case 'branch-pos':
          return (
            <div className="space-y-6">
              <DailySalesForm
                defaultBranchId={currentBranchId}
                onSuccess={() => setActiveTab('branch-sales-records')}
              />
            </div>
          );

        case 'branch-stock-transfers':
          return <StockTransfersSection branchViewOnlyId={currentBranchId || undefined} />;

        case 'branch-stock':
          return <StockReconciliation branchIdFilter={currentBranchId} />;

        case 'branch-cash-recon':
          return <CashReconciliationView branchIdFilter={currentBranchId} />;

        case 'branch-stock-recon':
          return <StockReconciliation branchIdFilter={currentBranchId} />;

        case 'branch-airtel':
          return <AirtelMoneyLedger branchIdFilter={currentBranchId} />;

        default:
          return (
            <BranchOverview
              branchId={currentBranchId}
              onNavigateTab={(tab) => {
                if (tab === 'BRANCH_SALES_ENTRY') setActiveTab('branch-pos');
                else if (tab === 'STOCK_RECONCILIATION') setActiveTab('branch-stock-recon');
              }}
            />
          );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col md:flex-row selection:bg-blue-600 selection:text-white font-sans">
      {/* Left Hand Side Navigation Tabs / Sidebar */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
        />
        <LowStockBanner />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {renderContent()}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="font-semibold text-slate-700">Lubes &amp; LPG Enterprise Network</span>
              <span className="text-slate-400">— Multi-Site Operations Engine</span>
            </div>
            <div className="text-slate-600">
              RBAC Mode: <strong className="text-slate-800">{role === 'OWNER' ? 'Executive Owner (Unrestricted HQ Access)' : 'Branch Site Manager (Restricted Scope)'}</strong>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
