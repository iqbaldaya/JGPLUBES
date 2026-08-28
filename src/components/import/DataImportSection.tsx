import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Layers,
  Users,
  Building2,
  RefreshCw,
  ArrowRight,
  Info,
  Check,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  parseUploadedSpreadsheet,
  validateAndParseProductsImport,
  validateAndParseStockCountsImport,
  validateAndParseDebtorsImport,
  validateAndParseSuppliersImport,
  downloadProductsTemplate,
  downloadStockCountsTemplate,
  downloadDebtorsTemplate,
  downloadSuppliersTemplate,
  ParsedProductRow,
  ParsedStockCountRow,
  ParsedDebtorRow,
  ParsedSupplierRow,
  ImportValidationIssue,
} from '../../utils/importUtils';

type ImportType = 'PRODUCTS' | 'BRANCH_STOCKS' | 'DEBTORS' | 'SUPPLIERS';

export const DataImportSection: React.FC = () => {
  const {
    branches,
    products,
    branchStocks,
    debtors,
    suppliers,
    bulkImportProducts,
    bulkImportBranchStocks,
    bulkImportDebtors,
    bulkImportSuppliers,
  } = useApp();

  const [activeType, setActiveType] = useState<ImportType>('PRODUCTS');
  const [stockImportMode, setStockImportMode] = useState<'SET' | 'ADD'>('SET');
  const [updateExistingProducts, setUpdateExistingProducts] = useState<boolean>(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed validation states
  const [productValidation, setProductValidation] = useState<{
    parsedRows: ParsedProductRow[];
    totalValid: number;
    totalErrors: number;
    newCount: number;
    updateCount: number;
  } | null>(null);

  const [stockValidation, setStockValidation] = useState<{
    parsedRows: ParsedStockCountRow[];
    totalValid: number;
    totalErrors: number;
  } | null>(null);

  const [debtorValidation, setDebtorValidation] = useState<{
    parsedRows: ParsedDebtorRow[];
    totalValid: number;
    totalErrors: number;
    newCount: number;
    updateCount: number;
  } | null>(null);

  const [supplierValidation, setSupplierValidation] = useState<{
    parsedRows: ParsedSupplierRow[];
    totalValid: number;
    totalErrors: number;
    newCount: number;
    updateCount: number;
  } | null>(null);

  const [commitSummary, setCommitSummary] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear states when switching tabs
  const handleTabChange = (type: ImportType) => {
    setActiveType(type);
    setSelectedFile(null);
    setErrorMessage(null);
    setProductValidation(null);
    setStockValidation(null);
    setDebtorValidation(null);
    setSupplierValidation(null);
    setCommitSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download template handlers
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    switch (activeType) {
      case 'PRODUCTS':
        downloadProductsTemplate(format);
        break;
      case 'BRANCH_STOCKS':
        downloadStockCountsTemplate(branches, products, format);
        break;
      case 'DEBTORS':
        downloadDebtorsTemplate(format);
        break;
      case 'SUPPLIERS':
        downloadSuppliersTemplate(format);
        break;
    }
  };

  // Handle File Upload Change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
    setCommitSummary(null);
    setErrorMessage(null);
    await processFile(file);
  };

  // Process and parse file
  const processFile = async (file: File) => {
    setIsParsing(true);
    setErrorMessage(null);
    setProductValidation(null);
    setStockValidation(null);
    setDebtorValidation(null);
    setSupplierValidation(null);

    try {
      const { headers, rows } = await parseUploadedSpreadsheet(file);

      if (rows.length === 0) {
        throw new Error('Spreadsheet has no valid data rows or empty sheet.');
      }

      switch (activeType) {
        case 'PRODUCTS': {
          const res = validateAndParseProductsImport(headers, rows, products);
          setProductValidation(res);
          break;
        }
        case 'BRANCH_STOCKS': {
          const res = validateAndParseStockCountsImport(headers, rows, branches, products, branchStocks);
          setStockValidation(res);
          break;
        }
        case 'DEBTORS': {
          const res = validateAndParseDebtorsImport(headers, rows, debtors);
          setDebtorValidation(res);
          break;
        }
        case 'SUPPLIERS': {
          const res = validateAndParseSuppliersImport(headers, rows, suppliers);
          setSupplierValidation(res);
          break;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process spreadsheet file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Commit valid records
  const handleCommitImport = () => {
    switch (activeType) {
      case 'PRODUCTS': {
        if (!productValidation || productValidation.totalValid === 0) return;
        const validItems = productValidation.parsedRows
          .filter((r) => r.isValid)
          .map((r) => ({
            code: r.code,
            name: r.name,
            category: r.category,
            subCategory: r.subCategory,
            unit: r.unit,
            volumeLitersOrKg: r.volumeLitersOrKg,
            costPrice: r.costPrice,
            sellingPrice: r.sellingPrice,
            reorderThreshold: r.reorderThreshold,
            description: r.description,
          }));

        const res = bulkImportProducts(validItems, updateExistingProducts);
        setCommitSummary(res.message);
        setProductValidation(null);
        break;
      }

      case 'BRANCH_STOCKS': {
        if (!stockValidation || stockValidation.totalValid === 0) return;
        const validItems = stockValidation.parsedRows
          .filter((r) => r.isValid)
          .map((r) => ({
            branchId: r.branchId,
            productId: r.productId,
            quantity: r.newQuantity,
          }));

        const res = bulkImportBranchStocks(validItems, stockImportMode);
        setCommitSummary(res.message);
        setStockValidation(null);
        break;
      }

      case 'DEBTORS': {
        if (!debtorValidation || debtorValidation.totalValid === 0) return;
        const validItems = debtorValidation.parsedRows
          .filter((r) => r.isValid)
          .map((r) => ({
            code: r.code,
            name: r.name,
            contactPerson: r.contactPerson,
            phone: r.phone,
            email: r.email,
            address: r.address,
            creditLimit: r.creditLimit,
            notes: r.notes,
          }));

        const res = bulkImportDebtors(validItems);
        setCommitSummary(res.message);
        setDebtorValidation(null);
        break;
      }

      case 'SUPPLIERS': {
        if (!supplierValidation || supplierValidation.totalValid === 0) return;
        const validItems = supplierValidation.parsedRows
          .filter((r) => r.isValid)
          .map((r) => ({
            code: r.code,
            name: r.name,
            contactPerson: r.contactPerson,
            phone: r.phone,
            email: r.email,
            address: r.address,
            category: r.category,
            paymentTermsDays: r.paymentTermsDays,
            taxNumber: r.taxNumber,
          }));

        const res = bulkImportSuppliers(validItems);
        setCommitSummary(res.message);
        setSupplierValidation(null);
        break;
      }
    }

    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Active validation stats
  const activeValidCount =
    activeType === 'PRODUCTS'
      ? productValidation?.totalValid ?? 0
      : activeType === 'BRANCH_STOCKS'
      ? stockValidation?.totalValid ?? 0
      : activeType === 'DEBTORS'
      ? debtorValidation?.totalValid ?? 0
      : supplierValidation?.totalValid ?? 0;

  const activeErrorCount =
    activeType === 'PRODUCTS'
      ? productValidation?.totalErrors ?? 0
      : activeType === 'BRANCH_STOCKS'
      ? stockValidation?.totalErrors ?? 0
      : activeType === 'DEBTORS'
      ? debtorValidation?.totalErrors ?? 0
      : supplierValidation?.totalErrors ?? 0;

  const activeTotalRows =
    activeType === 'PRODUCTS'
      ? productValidation?.parsedRows.length ?? 0
      : activeType === 'BRANCH_STOCKS'
      ? stockValidation?.parsedRows.length ?? 0
      : activeType === 'DEBTORS'
      ? debtorValidation?.parsedRows.length ?? 0
      : supplierValidation?.parsedRows.length ?? 0;

  return (
    <div id="data-import-engine-section" className="space-y-6">
      {/* SECTION HEADER */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shrink-0">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Excel &amp; CSV Data Import Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                Production Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bulk populate products, branch stock counts, debtors, and suppliers from Microsoft Excel or CSV files.
            </p>
          </div>
        </div>

        {/* TEMPLATE DOWNLOAD DROPDOWN / BUTTONS */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            id="download-template-xlsx-btn"
            onClick={() => handleDownloadTemplate('xlsx')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Download Excel Template (.xlsx)
          </button>
          <button
            id="download-template-csv-btn"
            onClick={() => handleDownloadTemplate('csv')}
            className="inline-flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Download CSV format template"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            CSV
          </button>
        </div>
      </div>

      {/* COMMIT SUCCESS MESSAGE */}
      {commitSummary && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start space-x-3.5 text-emerald-950 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-emerald-950">Import Successfully Applied</h3>
            <p className="text-xs text-emerald-800 mt-0.5">{commitSummary}</p>
          </div>
          <button
            onClick={() => setCommitSummary(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-900 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-rose-950">Spreadsheet Parsing Error</h4>
            <p className="text-xs text-rose-800 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* IMPORT CATEGORY SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            id: 'PRODUCTS' as ImportType,
            label: '1. Product Catalog',
            desc: 'Lubricants & LPG SKUs, cost prices, selling prices, packaging units',
            icon: Package,
            badge: `${products.length} In Catalog`,
          },
          {
            id: 'BRANCH_STOCKS' as ImportType,
            label: '2. Branch Stock Counts',
            desc: 'Physical inventory levels per branch & SKU (Overwrite or Add)',
            icon: Layers,
            badge: `${branches.length} Branches`,
          },
          {
            id: 'DEBTORS' as ImportType,
            label: '3. Debtors & Credit Accounts',
            desc: 'Corporate & retail credit customers, phone numbers & credit limits',
            icon: Users,
            badge: `${debtors.length} Debtors`,
          },
          {
            id: 'SUPPLIERS' as ImportType,
            label: '4. Suppliers Directory',
            desc: 'Wholesale refineries, gas vendors, contact details & credit terms',
            icon: Building2,
            badge: `${suppliers.length} Suppliers`,
          },
        ].map((tab) => {
          const active = activeType === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                active
                  ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      active ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                    {tab.badge}
                  </span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">{tab.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tab.desc}</div>
              </div>

              {active && (
                <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] font-bold text-blue-700">
                  <span>Selected Module</span>
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* UPLOAD & SETTINGS CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DRAG & DROP UPLOAD ZONE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Upload {activeType.replace('_', ' ')} Spreadsheet
              </h2>
              <span className="text-xs text-slate-500 font-medium">Supports .xlsx, .xls, .csv</span>
            </div>

            {/* DROPZONE */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <div className="inline-flex p-3 bg-white rounded-full shadow-xs border border-slate-200 text-blue-600 mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>

              {selectedFile ? (
                <div>
                  <div className="font-bold text-sm text-emerald-950">{selectedFile.name}</div>
                  <div className="text-xs text-emerald-700 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose a different file
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-sm text-slate-800">
                    Click to select or drag and drop your spreadsheet
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Download the template first to match expected columns
                  </div>
                </div>
              )}
            </div>

            {/* IMPORT OPTIONS */}
            {activeType === 'PRODUCTS' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Existing Products Handling:</span>
                  <p className="text-slate-500 mt-0.5">
                    Update cost price, selling price, and reorder levels if product SKU code is already present
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={updateExistingProducts}
                    onChange={(e) => setUpdateExistingProducts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}

            {activeType === 'BRANCH_STOCKS' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <span className="font-bold text-slate-800 block">Stock Update Mode:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                      stockImportMode === 'SET'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stockImportMode"
                      value="SET"
                      checked={stockImportMode === 'SET'}
                      onChange={() => setStockImportMode('SET')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs">Exact Overwrite (SET)</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Sets branch inventory count to the exact physical quantity in the spreadsheet
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                      stockImportMode === 'ADD'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stockImportMode"
                      value="ADD"
                      checked={stockImportMode === 'ADD'}
                      onChange={() => setStockImportMode('ADD')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs">Incremental (ADD)</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Adds spreadsheet quantity to current existing branch inventory balances
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INSTRUCTIONS & SHORTCUTS */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5 text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Column Guidelines</span>
            </div>

            {activeType === 'PRODUCTS' && (
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>Product Code:</strong> Unique SKU (e.g. <code>LUB-15W40-5L</code>, <code>LPG-REF-6KG</code>).
                </p>
                <p>
                  <strong>Category:</strong> <code>LUBRICANTS</code> or <code>LPG</code>.
                </p>
                <p>
                  <strong>Cost &amp; Selling:</strong> Numerical price in Zambian Kwacha (e.g. <code>320.00</code>).
                </p>
                <p>
                  <strong>Volume:</strong> Liters for oil (e.g. <code>5</code>) or Kg for LPG (e.g. <code>6</code>).
                </p>
              </div>
            )}

            {activeType === 'BRANCH_STOCKS' && (
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>Branch Code or Name:</strong> Matches system branch code (e.g. <code>HQ-01</code>, <code>CH-02</code>).
                </p>
                <p>
                  <strong>Product SKU:</strong> Existing product SKU code (e.g. <code>LUB-15W40-5L</code>).
                </p>
                <p>
                  <strong>Stock Quantity:</strong> Integer physical stock count (e.g. <code>40</code>).
                </p>
              </div>
            )}

            {activeType === 'DEBTORS' && (
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>Customer Name:</strong> Company or client title (e.g. <code>Copperbelt Mining Fleet</code>).
                </p>
                <p>
                  <strong>Credit Limit:</strong> Maximum credit in ZMW (e.g. <code>50000</code>).
                </p>
                <p>
                  <strong>Phone Number:</strong> Primary contact phone for SMS/calls.
                </p>
              </div>
            )}

            {activeType === 'SUPPLIERS' && (
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>Supplier Name:</strong> Refinery or vendor (e.g. <code>TotalEnergies Zambia</code>).
                </p>
                <p>
                  <strong>Supply Category:</strong> <code>LUBRICANTS</code>, <code>LPG</code>, <code>BOTH</code>, or <code>EQUIPMENT</code>.
                </p>
                <p>
                  <strong>Terms:</strong> Standard credit window in days (e.g. <code>30</code>).
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => handleDownloadTemplate('xlsx')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Sample .xlsx
              </button>
              <button
                onClick={() => handleDownloadTemplate('csv')}
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              >
                .csv
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PARSING SPINNER */}
      {isParsing && (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-800">Reading &amp; Validating Spreadsheet...</div>
          <div className="text-xs text-slate-500 mt-1">Checking column mapping, business rules &amp; duplicates</div>
        </div>
      )}

      {/* PREVIEW CONTAINER */}
      {(productValidation || stockValidation || debtorValidation || supplierValidation) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Validation &amp; Preview Matrix
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-700">
                  {activeType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review parsed items below. Only valid rows will be committed to your database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 bg-slate-100 rounded-lg font-medium text-slate-700">
                  Total: <strong>{activeTotalRows}</strong>
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                  Valid: {activeValidCount}
                </span>
                {activeErrorCount > 0 && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold">
                    Errors: {activeErrorCount}
                  </span>
                )}
              </div>

              <button
                id="commit-import-to-db-btn"
                disabled={activeValidCount === 0}
                onClick={handleCommitImport}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Commit {activeValidCount} Records to Database
              </button>
            </div>
          </div>

          {/* TABLE FOR PRODUCTS */}
          {activeType === 'PRODUCTS' && productValidation && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">SKU Code</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Unit / Vol</th>
                      <th className="py-2.5 px-3 text-right">Cost (ZMW)</th>
                      <th className="py-2.5 px-3 text-right">Selling (ZMW)</th>
                      <th className="py-2.5 px-3 text-center">Status / Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {productValidation.parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={!r.isValid ? 'bg-rose-50/50' : r.isExisting ? 'bg-blue-50/30' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">#{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{r.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{r.name}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.category === 'LPG'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {r.unit} ({r.volumeLitersOrKg} {r.category === 'LPG' ? 'Kg' : 'L'})
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">K{r.costPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          K{r.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            r.isExisting ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                <span>Update Existing</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <span>New Product</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{r.issues[0]?.message || 'Invalid row'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE FOR BRANCH STOCKS */}
          {activeType === 'BRANCH_STOCKS' && stockValidation && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Product SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-center">Current Stock</th>
                      <th className="py-2.5 px-3 text-center">Spreadsheet Count</th>
                      <th className="py-2.5 px-3 text-center">Resulting Count ({stockImportMode})</th>
                      <th className="py-2.5 px-3 text-center">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stockValidation.parsedRows.map((r, idx) => (
                      <tr key={idx} className={!r.isValid ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">#{r.rowNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{r.branchName || r.branchCode}</td>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{r.productCode}</td>
                        <td className="py-2 px-3 text-slate-700">{r.productName}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{r.currentStock} units</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {r.newQuantity} units
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                          {stockImportMode === 'SET' ? r.newQuantity : r.currentStock + r.newQuantity} units
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{r.issues[0]?.message || 'Invalid'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE FOR DEBTORS */}
          {activeType === 'DEBTORS' && debtorValidation && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Customer Code</th>
                      <th className="py-2.5 px-3">Debtor / Company Name</th>
                      <th className="py-2.5 px-3">Contact Person</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-right">Credit Limit (ZMW)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {debtorValidation.parsedRows.map((r, idx) => (
                      <tr key={idx} className={!r.isValid ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">#{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{r.code}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 text-slate-600">{r.contactPerson || '-'}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{r.phone}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          K{r.creditLimit.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            r.isExisting ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                Update
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                New Account
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              {r.issues[0]?.message || 'Invalid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE FOR SUPPLIERS */}
          {activeType === 'SUPPLIERS' && supplierValidation && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Supplier Code</th>
                      <th className="py-2.5 px-3">Vendor / Refinery Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3 text-center">Terms (Days)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {supplierValidation.parsedRows.map((r, idx) => (
                      <tr key={idx} className={!r.isValid ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">#{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{r.code}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 font-medium text-slate-700">{r.category}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{r.phone}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {r.paymentTermsDays}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            r.isExisting ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                Update
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                New Supplier
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              {r.issues[0]?.message || 'Invalid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
