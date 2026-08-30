import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Layers,
  Building2,
  Package,
  ShoppingCart,
  Landmark,
  Wallet,
  Smartphone,
  UserCheck,
  Truck,
  Scale,
  ShieldAlert,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  downloadCsvFile,
  downloadMultiSheetExcelBackup,
  downloadAllIndividualCsvFiles,
  downloadJsonBackup,
  generateConsolidatedMasterCsv,
  generateDailySalesCsv,
  generateProductsCsv,
  generateBranchStocksCsv,
  generateBankRecordsCsv,
  generateCashRecordsCsv,
  generateAirtelRecordsCsv,
  generateDebtorsCsv,
  generateDebtorTransactionsCsv,
  generateSuppliersCsv,
  generateSupplierTransactionsCsv,
  generateStockReconciliationsCsv,
  generateCashMovementsCsv,
  generateBranchesCsv,
  SystemDataExportPayload,
} from '../../utils/csvExport';

interface SettingsSectionProps {
  onNavigateTab?: (tab: string) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ onNavigateTab }) => {
  const {
    branches,
    products,
    branchStocks,
    dailySales,
    bankRecords,
    cashRecords,
    airtelRecords,
    debtors,
    debtorTransactions,
    suppliers,
    supplierTransactions,
    stockReconciliations,
    cashMovements,
    stockTransfers,
    ownerTreasury,
    formatSystemDataToZero,
    resetToDemoData,
    isDbConnected,
    dbSyncError,
    lastDbSyncTime,
    manualSyncWithDatabase,
  } = useApp();

  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmationInput, setFormatConfirmationInput] = useState('');
  const [formatSuccessMessage, setFormatSuccessMessage] = useState<string | null>(null);
  const [isResetDemoModalOpen, setIsResetDemoModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestMessage, setDbTestMessage] = useState<string | null>(null);

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    setDbTestMessage(null);
    try {
      await manualSyncWithDatabase();
      setDbTestMessage('Database connection test complete. State synchronized.');
    } catch (err: any) {
      setDbTestMessage(`Connection test error: ${err?.message || 'Failed'}`);
    } finally {
      setIsTestingDb(false);
    }
  };

  // Consolidated data payload
  const systemPayload: SystemDataExportPayload = {
    branches,
    products,
    branchStocks,
    dailySales,
    bankRecords,
    cashRecords,
    airtelRecords,
    debtors,
    debtorTransactions,
    suppliers,
    supplierTransactions,
    stockReconciliations,
    cashMovements,
    stockTransfers,
    ownerTreasury,
  };

  const showNotification = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => {
      setExportNotice(null);
    }, 4500);
  };

  // Handler for multi-sheet master Excel workbook backup (each section on separate sheet)
  const handleExportMasterMultiSheetWorkbook = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadMultiSheetExcelBackup(systemPayload, `Lubricants_LPG_Enterprise_Master_Backup_${dateStr}.xlsx`);
    showNotification('Master Multi-Sheet Excel Backup downloaded! (Each section saved on a separate sheet)');
  };

  // Handler for consolidated master CSV
  const handleExportConsolidatedMasterCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const content = generateConsolidatedMasterCsv(systemPayload);
    downloadCsvFile(`consolidated_enterprise_master_backup_${dateStr}.csv`, content);
    showNotification('Consolidated Master CSV backup downloaded successfully!');
  };

  // Handler for batch download all individual CSVs
  const handleExportAllIndividualCsvs = () => {
    downloadAllIndividualCsvFiles(systemPayload);
    showNotification('Exporting all 13 CSV data files to your downloads folder...');
  };

  // Handler for JSON full snapshot
  const handleExportJson = () => {
    downloadJsonBackup(systemPayload);
    showNotification('Complete JSON system snapshot downloaded successfully!');
  };

  // Handler for executing format to zero
  const handleExecuteFormatToZero = () => {
    if (formatConfirmationInput.trim().toUpperCase() !== 'FORMAT') {
      return;
    }

    const result = formatSystemDataToZero();
    setIsFormatModalOpen(false);
    setFormatConfirmationInput('');
    setFormatSuccessMessage(result.message);

    setTimeout(() => {
      setFormatSuccessMessage(null);
    }, 8000);
  };

  // Handler for reset to demo data
  const handleExecuteResetToDemo = () => {
    resetToDemoData();
    setIsResetDemoModalOpen(false);
    setFormatSuccessMessage('Restored standard initial demo test dataset.');
    setTimeout(() => {
      setFormatSuccessMessage(null);
    }, 6000);
  };

  const totalStockUnits = branchStocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalSalesRevenue = dailySales.reduce((sum, s) => sum + (Number(s.totalSalesAmount) || 0), 0);

  const modulesList = [
    {
      id: 'daily-sales',
      title: 'Daily Sales & Shift POS Logs',
      description: 'Shift sales records, product line breakdowns, cash/airtel/card/credit splits, drawer balancing',
      count: `${dailySales.length} Shifts / Logs`,
      icon: ShoppingCart,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`daily_sales_records_${dateStr}.csv`, generateDailySalesCsv(dailySales));
        showNotification('Daily Sales CSV downloaded.');
      },
    },
    {
      id: 'products',
      title: 'Product Catalog & Pricing',
      description: 'SKU codes, product names, categories, packaging units, volume in L/kg, cost & selling prices, unit margins',
      count: `${products.length} Products`,
      icon: Package,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`product_catalog_${dateStr}.csv`, generateProductsCsv(products));
        showNotification('Product Catalog CSV downloaded.');
      },
    },
    {
      id: 'stocks',
      title: 'Branch Inventory & Stock Balances',
      description: 'Site-by-site on-hand quantities, total volume remaining in Liters/Kg, inventory valuation at retail & cost',
      count: `${totalStockUnits} Total Units Held`,
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`branch_inventory_stocks_${dateStr}.csv`, generateBranchStocksCsv(branchStocks, branches, products));
        showNotification('Branch Inventory Stocks CSV downloaded.');
      },
    },
    {
      id: 'bank-records',
      title: 'Bank Account Ledger Records',
      description: 'Direct deposits, cheque/transfer credits & debits, running balances, payment categories',
      count: `${bankRecords.length} Bank Entries`,
      icon: Landmark,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`bank_records_ledger_${dateStr}.csv`, generateBankRecordsCsv(bankRecords));
        showNotification('Bank Ledger CSV downloaded.');
      },
    },
    {
      id: 'cash-records',
      title: 'Cash on Hand (Safe & Custodian) Ledger',
      description: 'Cash inflows, operating expenses, cash withdrawals, custodian balances, running cash on hand',
      count: `${cashRecords.length} Cash Entries`,
      icon: Wallet,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`cash_on_hand_records_${dateStr}.csv`, generateCashRecordsCsv(cashRecords));
        showNotification('Cash on Hand CSV downloaded.');
      },
    },
    {
      id: 'airtel-records',
      title: 'Airtel Money Ledger & Direct Collections',
      description: 'Airtel float movements, customer paybill transactions, float conversions to bank/cash, airtel balance',
      count: `${airtelRecords.length} Airtel Records`,
      icon: Smartphone,
      color: 'bg-red-50 text-red-700 border-red-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`airtel_money_records_${dateStr}.csv`, generateAirtelRecordsCsv(airtelRecords));
        showNotification('Airtel Money CSV downloaded.');
      },
    },
    {
      id: 'debtors',
      title: 'Debtors & Customer Credit Directory',
      description: 'Customer profiles, credit limits, total invoiced, payments collected, outstanding balances',
      count: `${debtors.length} Debtors`,
      icon: UserCheck,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`debtors_accounts_${dateStr}.csv`, generateDebtorsCsv(debtors));
        showNotification('Debtors Accounts CSV downloaded.');
      },
    },
    {
      id: 'debtor-tx',
      title: 'Debtor Credit Transactions & Payments',
      description: 'Audit log of individual credit sales, invoice references, receipt vouchers, customer repayments',
      count: `${debtorTransactions.length} Transactions`,
      icon: Scale,
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`debtor_transactions_${dateStr}.csv`, generateDebtorTransactionsCsv(debtorTransactions, debtors));
        showNotification('Debtor Transactions CSV downloaded.');
      },
    },
    {
      id: 'suppliers',
      title: 'Suppliers Directory & Accounts',
      description: 'Supplier contacts, credit terms, total invoiced, total paid, balance due per vendor',
      count: `${suppliers.length} Suppliers`,
      icon: Truck,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`suppliers_directory_${dateStr}.csv`, generateSuppliersCsv(suppliers));
        showNotification('Suppliers Directory CSV downloaded.');
      },
    },
    {
      id: 'supplier-tx',
      title: 'Supplier Invoices & Purchases',
      description: 'Bulk purchase invoices, unit costs, invoice items, payment status, automatic stock replenishment history',
      count: `${supplierTransactions.length} Invoices`,
      icon: FileSpreadsheet,
      color: 'bg-green-50 text-green-700 border-green-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`supplier_invoices_purchases_${dateStr}.csv`, generateSupplierTransactionsCsv(supplierTransactions, suppliers));
        showNotification('Supplier Purchases CSV downloaded.');
      },
    },
    {
      id: 'stock-recons',
      title: 'Physical Stock Reconciliations & Dips',
      description: 'Physical audit counts, system vs actual variance in units and ZMW, auditor sign-offs',
      count: `${stockReconciliations.length} Audits`,
      icon: Layers,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`stock_reconciliations_${dateStr}.csv`, generateStockReconciliationsCsv(stockReconciliations));
        showNotification('Stock Reconciliations CSV downloaded.');
      },
    },
    {
      id: 'cash-movements',
      title: 'Branch Cash Handovers & Remittances',
      description: 'Branch cash transfers to owner safe / bank deposit, review notes, approval timestamps',
      count: `${cashMovements.length} Handovers`,
      icon: Wallet,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`cash_movements_${dateStr}.csv`, generateCashMovementsCsv(cashMovements));
        showNotification('Cash Movements CSV downloaded.');
      },
    },
    {
      id: 'branches',
      title: 'Branches & Site Locations Directory',
      description: 'Branch codes, locations, manager / Lubes Champ contact info, initial float, monthly targets',
      count: `${branches.length} Sites`,
      icon: Building2,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      action: () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        downloadCsvFile(`branches_directory_${dateStr}.csv`, generateBranchesCsv(branches));
        showNotification('Branches Directory CSV downloaded.');
      },
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-3 text-sm font-medium animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {formatSuccessMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl flex items-start space-x-3 text-emerald-900 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-black text-base text-emerald-950">Action Completed Successfully</h4>
            <p className="text-sm text-emerald-800 mt-1">{formatSuccessMessage}</p>
            {onNavigateTab && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigateTab('product-catalog')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition"
                >
                  <span>Go to Product & Pricing Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateTab('overview')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center space-x-1 shadow-xs transition"
                >
                  <span>Go to Executive Dashboard</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-2xl text-white shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Owner Portal • Enterprise Data Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              System Settings &amp; Data Backup
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Export and backup all project data across all branches, products, shift logs, bank &amp; cash ledgers in CSV format, or format all system numerical records to zero.
            </p>
          </div>

          {/* Quick Action Buttons on Banner */}
          <div className="flex flex-wrap gap-3">
            <button
              id="btn-quick-export-master-xlsx"
              onClick={handleExportMasterMultiSheetWorkbook}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition hover:shadow-md cursor-pointer"
              title="Download Master Multi-Sheet Backup (.xlsx) where each section of the project is saved on a different sheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Master Backup (.xlsx Multi-Sheet)</span>
            </button>

            <button
              id="btn-quick-export-master-csv"
              onClick={handleExportConsolidatedMasterCsv}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition hover:shadow-md cursor-pointer border border-slate-600"
              title="Download consolidated master CSV text file containing all project tables"
            >
              <Download className="w-4 h-4" />
              <span>Master CSV</span>
            </button>

            <button
              id="btn-quick-format-system"
              onClick={() => setIsFormatModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition hover:shadow-md cursor-pointer border border-red-400/30"
              title="Format system data: resets all entered values to zero while keeping branches and products"
            >
              <Trash2 className="w-4 h-4" />
              <span>Format System to 0</span>
            </button>
          </div>
        </div>

        {/* Live System Count Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Branches</div>
            <div className="text-lg font-black text-white mt-0.5">{branches.length} Sites</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Catalog Products</div>
            <div className="text-lg font-black text-white mt-0.5">{products.length} SKUs</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Sales Records</div>
            <div className="text-lg font-black text-white mt-0.5">{dailySales.length} Shifts</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Bank Transactions</div>
            <div className="text-lg font-black text-white mt-0.5">{bankRecords.length} Entries</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Debtors / Credit</div>
            <div className="text-lg font-black text-white mt-0.5">{debtors.length} Accounts</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80">
            <div className="text-slate-400 font-medium">Suppliers</div>
            <div className="text-lg font-black text-white mt-0.5">{suppliers.length} Vendors</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: FULL DATA BACKUP & CSV EXPORT */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">Project Data Backup &amp; Multi-Sheet Export</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Download clean, standards-compliant Excel workbooks (with each section on a different sheet) or individual CSV files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-master-multisheet-header"
              onClick={handleExportMasterMultiSheetWorkbook}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              title="Download Master Multi-Sheet Excel Workbook (.xlsx) with every section on a separate tab"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Multi-Sheet Workbook (.xlsx)</span>
            </button>

            <button
              id="btn-export-master-combined-csv"
              onClick={handleExportConsolidatedMasterCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              title="Downloads a single combined master CSV with all tables"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Consolidated CSV</span>
            </button>

            <button
              id="btn-export-all-individual-csvs"
              onClick={handleExportAllIndividualCsvs}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              title="Downloads 13 individual CSV files for every data module"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>All 13 CSVs</span>
            </button>

            <button
              id="btn-export-json-snapshot"
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              title="Download raw JSON snapshot backup"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span>JSON Snapshot</span>
            </button>
          </div>
        </div>

        {/* Real-Time Database Connection & Synchronization Status Card */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border-2 shadow-xs transition ${
            isDbConnected
              ? 'bg-gradient-to-br from-emerald-50/90 to-slate-50 border-emerald-300'
              : 'bg-gradient-to-br from-amber-50/90 to-slate-50 border-amber-300'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span
                  className={`p-2 rounded-xl text-white shadow-xs ${
                    isDbConnected ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <h3 className="font-black text-base sm:text-lg text-slate-900">
                      {isDbConnected
                        ? 'Cloud PostgreSQL Database: Connected & Live'
                        : 'Cloud PostgreSQL Database: LocalStorage Mode'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    Multi-Device Instant Synchronization Engine
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
                {isDbConnected
                  ? 'All 13 data modules (Daily Sales POS, Stock Transfers, Cash Ledgers, Airtel Money, Debtors, Supplier Invoices) are actively synchronized in real-time across every browser and device.'
                  : 'Your application is currently storing changes in browser storage. To synchronize sales and stock across multiple phones, laptops, and tablets in real-time, configure your DATABASE_URL in your Render environment variables.'}
              </p>

              {lastDbSyncTime && (
                <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1.5 pt-1">
                  <span>Last sync:</span>
                  <span className="font-semibold text-slate-700">
                    {lastDbSyncTime.toLocaleTimeString()}
                  </span>
                </div>
              )}

              {dbTestMessage && (
                <div className="text-xs font-medium text-slate-800 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                  {dbTestMessage}
                </div>
              )}

              {dbSyncError && !isDbConnected && (
                <div className="text-[11px] font-mono text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  Error Details: {dbSyncError}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2.5 shrink-0">
              <button
                id="btn-test-db-connection"
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                <span>{isTestingDb ? 'Testing Connection...' : 'Test Connection Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Master Backup Callout Card */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-blue-50/50 to-indigo-50/40 p-5 sm:p-6 rounded-2xl border-2 border-emerald-300/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Multi-Sheet Workbook Structure</span>
                  </div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    Master Backup File (Each Section Saved on a Different Sheet)
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
                When downloading this Master Backup file, <strong>each module is automatically organized onto its own dedicated worksheet tab</strong>: <em>Summary Overview, Branches Directory, Product Catalog, Branch Inventory, Daily Sales Shifts, Bank Ledger, Cash on Hand, Airtel Money, Debtors, Debtor Transactions, Suppliers, Purchases, Stock Audits, and Cash Handovers</em>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2.5 shrink-0">
              <button
                id="btn-download-master-multisheet-hero"
                onClick={handleExportMasterMultiSheetWorkbook}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition hover:shadow-md cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Master Backup (.xlsx)</span>
              </button>

              <button
                id="btn-download-master-csv-hero"
                onClick={handleExportConsolidatedMasterCsv}
                className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Consolidated CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modular CSV Downloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulesList.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg border ${mod.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{mod.title}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 font-mono">{mod.count}</span>
                  <button
                    id={`btn-export-csv-${mod.id}`}
                    onClick={mod.action}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: FORMAT SYSTEM DATA (ZERO OUT ALL VALUES) */}
      <section className="space-y-5 pt-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900">Format System Data (Zero Out All Values)</h2>
        </div>

        <div className="bg-red-50/50 border-2 border-red-200 p-6 rounded-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>System Initialization &amp; Zero Valuation Reset</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Format System Data to K0.00 &amp; Zero Stock
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When pressed, all transaction histories, sales logs, bank records, and inventory quantities across the entire system are formatted such that <strong>all entered values become ZERO (0)</strong>.
              </p>
            </div>

            <button
              id="btn-open-format-modal"
              onClick={() => setIsFormatModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-sm hover:shadow-md transition shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Format System to 0</span>
            </button>
          </div>

          {/* Detailed Preservation Rules Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-red-200/80 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <div className="font-bold text-emerald-900 flex items-center space-x-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What Is Preserved:</span>
              </div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>
                  <strong>Created Branches:</strong> All created branch sites ({branches.length} branches) remain intact with their IDs, names, codes, and managers.
                </li>
                <li>
                  <strong>Product Catalog:</strong> All {products.length} product SKUs and names remain listed in the catalog, but their cost price and selling price are set to <strong>K0.00</strong>.
                </li>
              </ul>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-red-200">
              <div className="font-bold text-red-900 flex items-center space-x-1.5 mb-1.5">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>What Becomes Zero:</span>
              </div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>
                  <strong>Product Valuations:</strong> All product cost prices and retail selling prices become <strong>K0.00</strong>.
                </li>
                <li>
                  <strong>Branch Stock Quantities:</strong> All product inventory at every branch is set to <strong>0 units (0 Liters / 0 Kg)</strong>.
                </li>
                <li>
                  <strong>Ledgers &amp; Transactions:</strong> Daily sales, bank balances, cash on hand, Airtel records, debtor accounts, and supplier purchase invoices are reset to <strong>0</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: DEMO DATA RESTORE (OPTIONAL UTILITY) */}
      <section className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Restore Standard Demo Dataset</span>
          </h4>
          <p className="text-xs text-slate-500">
            Populate sample products with baseline prices, branches (Lusaka, Kitwe, Ndola), sample inventory stocks, and test sales logs for testing.
          </p>
        </div>

        <button
          id="btn-open-reset-demo-modal"
          onClick={() => setIsResetDemoModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset to Demo Data</span>
        </button>
      </section>

      {/* MODAL 1: SAFE TWO-STEP VERIFICATION FOR FORMAT SYSTEM DATA TO 0 */}
      {isFormatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-red-200 animate-scaleIn">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Confirm System Format to Zero (0)
                </h3>
                <p className="text-xs text-slate-500">
                  Please review the formatting terms before confirming this operation.
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs space-y-2.5 text-red-900">
              <p className="font-bold">By formatting the system:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>
                  Your <strong>{branches.length} branches</strong> will be preserved.
                </li>
                <li>
                  Your <strong>{products.length} products</strong> will remain in the catalog, but valued at <strong>K0.00</strong> (cost &amp; selling price = 0).
                </li>
                <li>
                  All inventory stocks across all branches will become <strong>0 units</strong>.
                </li>
                <li>
                  All sales shifts, bank ledgers, cash on hand, Airtel records, and debtor/supplier invoices will be cleared to <strong>0</strong>.
                </li>
              </ul>
            </div>

            {/* Recommendation to Backup First */}
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
              <span className="font-medium">Have you saved a master backup first?</span>
              <button
                type="button"
                id="btn-modal-download-master-backup"
                onClick={handleExportMasterMultiSheetWorkbook}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Master Backup (.xlsx)</span>
              </button>
            </div>

            {/* Confirmation Typing Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                To confirm, type <span className="font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-200">FORMAT</span> in the box below:
              </label>
              <input
                id="input-format-confirmation"
                type="text"
                value={formatConfirmationInput}
                onChange={(e) => setFormatConfirmationInput(e.target.value)}
                placeholder="Type FORMAT"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 font-mono text-sm uppercase tracking-wider"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsFormatModalOpen(false);
                  setFormatConfirmationInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-execute-format"
                type="button"
                onClick={handleExecuteFormatToZero}
                disabled={formatConfirmationInput.trim().toUpperCase() !== 'FORMAT'}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                  formatConfirmationInput.trim().toUpperCase() === 'FORMAT'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Format All Values to Zero</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM RESET TO DEMO DATA */}
      {isResetDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 animate-scaleIn">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Restore Demo Dataset?
                </h3>
                <p className="text-xs text-slate-500">
                  This will reload standard initial sample data for testing.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              This will overwrite current system state with standard demo branches, sample products with demo pricing, and initial test records.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetDemoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-reset-demo"
                type="button"
                onClick={handleExecuteResetToDemo}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
