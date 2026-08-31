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
  Building2,
  RefreshCw,
  Info,
  Check,
  X,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  parseUploadedSpreadsheet,
  validateAndParseProductAndStockImport,
  downloadProductAndStockTemplate,
  exportCurrentCatalogAndStockTemplate,
  ParsedProductAndStockRow,
} from '../../utils/importUtils';

interface ProductCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const ProductCsvImportModal: React.FC<ProductCsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    branches,
    products,
    branchStocks,
    bulkImportProductsWithStocks,
  } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stockImportMode, setStockImportMode] = useState<'SET' | 'ADD'>('SET');
  const [updateExistingProducts, setUpdateExistingProducts] = useState<boolean>(true);
  const [selectedDefaultBranchId, setSelectedDefaultBranchId] = useState<string>(branches[0]?.id || '');

  const [validationResult, setValidationResult] = useState<{
    parsedRows: ParsedProductAndStockRow[];
    totalValid: number;
    totalErrors: number;
    newCount: number;
    updateCount: number;
    totalStockUnits: number;
    detectedBranchColumns: { branchId: string; branchCode: string; branchName: string; colIndex: number; headerName: string }[];
  } | null>(null);

  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [successReport, setSuccessReport] = useState<{
    createdProductsCount: number;
    updatedProductsCount: number;
    updatedStocksCount: number;
    totalStockUnits: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setErrorMessage(null);
    setValidationResult(null);
    setSuccessReport(null);

    try {
      const parsedData = await parseUploadedSpreadsheet(file);
      if (parsedData.rows.length === 0) {
        setErrorMessage('The uploaded file is empty or does not contain any data rows.');
        setIsParsing(false);
        return;
      }

      const result = validateAndParseProductAndStockImport(
        parsedData.headers,
        parsedData.rows,
        products,
        branches,
        branchStocks,
        selectedDefaultBranchId
      );

      setValidationResult(result);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(err.message || 'Failed to read or parse file. Please verify CSV/Excel format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult || validationResult.totalValid === 0) return;

    setIsImporting(true);
    try {
      const validRows = validationResult.parsedRows.filter((r) => r.isValid);

      const itemsToImport = validRows.map((r) => ({
        product: {
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
        },
        stocks: r.branchStocks.map((bs) => ({
          branchId: bs.branchId,
          quantity: bs.quantity,
        })),
      }));

      const res = bulkImportProductsWithStocks(itemsToImport, {
        updateExistingProducts,
        stockMode: stockImportMode,
      });

      setSuccessReport(res);
      if (onSuccess) {
        onSuccess(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during database import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setErrorMessage(null);
    setSuccessReport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500/30 text-blue-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-blue-400/30">
                  Bulk CSV / Excel Engine
                </span>
                <span className="text-blue-200 text-xs flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-Maps Products, Pricing &amp; Stock</span>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Import Multiple Products, Pricing &amp; Branch Stocks
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Template & Quick Actions Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-slate-700 text-xs sm:text-sm">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Need the standard spreadsheet format? Download our pre-configured template with your exact branch locations:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => downloadProductAndStockTemplate(branches, 'xlsx')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => downloadProductAndStockTemplate(branches, 'csv')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportCurrentCatalogAndStockTemplate(products, branches, branchStocks, 'xlsx')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                title="Export all existing products and current stock counts to Excel so you can update them and re-import"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Current Catalog</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successReport && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 shadow-xs animate-in fade-in">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-emerald-900 font-bold text-base">Import Completed Successfully!</h4>
                  <p className="text-emerald-800 text-sm mt-1">{successReport.message}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-white/80 border border-emerald-200 rounded-lg p-2.5 text-center">
                      <span className="text-[11px] text-emerald-700 font-medium uppercase block">New Products</span>
                      <span className="text-lg font-bold text-emerald-900">{successReport.createdProductsCount}</span>
                    </div>
                    <div className="bg-white/80 border border-emerald-200 rounded-lg p-2.5 text-center">
                      <span className="text-[11px] text-emerald-700 font-medium uppercase block">Updated SKUs</span>
                      <span className="text-lg font-bold text-emerald-900">{successReport.updatedProductsCount}</span>
                    </div>
                    <div className="bg-white/80 border border-emerald-200 rounded-lg p-2.5 text-center">
                      <span className="text-[11px] text-emerald-700 font-medium uppercase block">Stock Records</span>
                      <span className="text-lg font-bold text-emerald-900">{successReport.updatedStocksCount}</span>
                    </div>
                    <div className="bg-white/80 border border-emerald-200 rounded-lg p-2.5 text-center">
                      <span className="text-[11px] text-emerald-700 font-medium uppercase block">Total Stock Units</span>
                      <span className="text-lg font-bold text-emerald-900">{successReport.totalStockUnits.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      Import Another File
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-900 font-bold text-sm">File Validation Error</h4>
                <p className="text-red-700 text-xs mt-0.5">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Drop Zone & Controls (hidden when success report is shown) */}
          {!successReport && (
            <>
              {/* Configuration Controls Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Import Preferences &amp; Inventory Rules</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Option 1: Existing SKU Update Policy */}
                  <label className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={updateExistingProducts}
                      onChange={(e) => setUpdateExistingProducts(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Update Existing Products &amp; Prices
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        If SKU code already exists, overwrite cost price, selling price, packaging unit, and reorder thresholds.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Stock Synchronization Mode */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      Branch Stock Update Mode
                    </span>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="stockMode"
                          value="SET"
                          checked={stockImportMode === 'SET'}
                          onChange={() => setStockImportMode('SET')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold">Set / Replace Exact Counts</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="stockMode"
                          value="ADD"
                          checked={stockImportMode === 'ADD'}
                          onChange={() => setStockImportMode('ADD')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold">Add / Increment to Current</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Box */}
              {!validationResult && (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
                    isParsing
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 shadow-2xs'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                      {isParsing ? (
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      ) : (
                        <UploadCloud className="w-7 h-7" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-800">
                        {isParsing
                          ? 'Reading & Validating Spreadsheet...'
                          : 'Click to select or drag & drop CSV or Excel file'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Supports <span className="font-semibold text-slate-700">.CSV</span>,{' '}
                        <span className="font-semibold text-slate-700">.XLSX</span>, and{' '}
                        <span className="font-semibold text-slate-700">.XLS</span> files. Product SKU and Name are required.
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Browse Files</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation & Preview Panel */}
              {validationResult && (
                <div className="space-y-4">
                  {/* File Stats Summary Pill Bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">
                          {selectedFile?.name || 'Uploaded File'}
                        </span>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="text-emerald-700 font-semibold">
                            {validationResult.totalValid} Valid Rows
                          </span>
                          <span>•</span>
                          <span className="text-blue-700 font-semibold">
                            {validationResult.newCount} New SKUs
                          </span>
                          <span>•</span>
                          <span className="text-indigo-700 font-semibold">
                            {validationResult.updateCount} Existing Updates
                          </span>
                          <span>•</span>
                          <span className="text-slate-700 font-semibold">
                            {validationResult.totalStockUnits.toLocaleString()} Total Stock Units
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={handleCommitImport}
                        disabled={validationResult.totalValid === 0 || isImporting}
                        className={`font-bold text-xs sm:text-sm px-5 py-2 rounded-xl flex items-center space-x-2 transition shadow-xs cursor-pointer ${
                          validationResult.totalValid > 0 && !isImporting
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Importing to Database...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Import {validationResult.totalValid} Products &amp; Stocks Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Branch Detection Alert */}
                  {validationResult.detectedBranchColumns.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong className="font-semibold">{validationResult.detectedBranchColumns.length} Branch Stock Columns Mapped:</strong>{' '}
                          {validationResult.detectedBranchColumns
                            .map((c) => `${c.branchName} (${c.branchCode})`)
                            .join(', ')}
                        </span>
                      </div>
                      <span className="bg-blue-200/60 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        Multi-Branch Stock Active
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          No branch-specific columns detected. Initial stock quantities will be assigned to{' '}
                          <strong>{branches.find((b) => b.id === selectedDefaultBranchId)?.name || 'Default Branch'}</strong>.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Parsed Spreadsheet Preview ({validationResult.parsedRows.length} Items)</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Showing all rows from your upload
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">SKU Code</th>
                            <th className="py-2.5 px-3">Product Name</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Unit</th>
                            <th className="py-2.5 px-3 text-right">Cost Price (ZMW)</th>
                            <th className="py-2.5 px-3 text-right">Selling Price (ZMW)</th>
                            <th className="py-2.5 px-3 text-right">Margin %</th>
                            {branches.map((b) => (
                              <th key={b.id} className="py-2.5 px-3 text-right">
                                Stock ({b.code})
                              </th>
                            ))}
                            <th className="py-2.5 px-3 text-center">Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationResult.parsedRows.map((row) => {
                            const margin =
                              row.sellingPrice > 0
                                ? ((row.sellingPrice - row.costPrice) / row.sellingPrice) * 100
                                : 0;

                            return (
                              <tr
                                key={row.rowNumber}
                                className={`hover:bg-slate-50/80 transition ${
                                  !row.isValid ? 'bg-red-50/40' : ''
                                }`}
                              >
                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                                  {row.rowNumber}
                                </td>
                                <td className="py-2 px-3">
                                  {row.isExisting ? (
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                                      ↻ Update SKU
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                                      + New Product
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                  {row.code}
                                </td>
                                <td className="py-2 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                                  {row.name}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      row.category === 'LUBRICANTS'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-cyan-100 text-cyan-800'
                                    }`}
                                  >
                                    {row.category}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{row.unit}</td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  K{row.costPrice.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                  K{row.sellingPrice.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold">
                                  <span
                                    className={
                                      margin >= 20
                                        ? 'text-emerald-700'
                                        : margin > 0
                                        ? 'text-amber-700'
                                        : 'text-red-600'
                                    }
                                  >
                                    {margin.toFixed(1)}%
                                  </span>
                                </td>
                                {branches.map((b) => {
                                  const stockVal =
                                    row.branchStocks.find((bs) => bs.branchId === b.id)?.quantity || 0;
                                  return (
                                    <td
                                      key={b.id}
                                      className="py-2 px-3 text-right font-mono font-bold text-blue-700"
                                    >
                                      {stockVal.toLocaleString()}
                                    </td>
                                  );
                                })}
                                <td className="py-2 px-3 text-center">
                                  {row.isValid ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                                  ) : (
                                    <span
                                      className="text-red-600 inline-flex items-center space-x-1 font-bold text-[11px]"
                                      title={row.issues.map((i) => i.message).join(', ')}
                                    >
                                      <XCircle className="w-4 h-4 text-red-600 inline-block" />
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Enterprise PostgreSQL Synchronization is active.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
