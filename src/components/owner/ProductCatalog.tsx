import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { ProductWacModal } from './ProductWacModal';
import { ProductCsvImportModal } from './ProductCsvImportModal';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Droplets,
  Flame,
  Search,
  AlertTriangle,
  Lock,
  Layers,
  Building2,
  ShieldAlert,
  Calculator,
  Receipt,
  RefreshCw,
  Info,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  UploadCloud,
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const {
    products,
    branchStocks,
    branches,
    addProduct,
    updateProduct,
    deleteProduct,
    syncProductCostPricesWithInvoices,
    getProductInvoiceHistory,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'ZERO_STOCK'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [restrictedDeleteProduct, setRestrictedDeleteProduct] = useState<{
    product: Product;
    totalStock: number;
    breakdown: { branchName: string; branchCode: string; quantity: number }[];
  } | null>(null);
  const [expandedStockProductId, setExpandedStockProductId] = useState<string | null>(null);
  const [selectedWacProduct, setSelectedWacProduct] = useState<Product | null>(null);
  const [syncResultModal, setSyncResultModal] = useState<{
    updatedCount: number;
    message: string;
    details: {
      productId: string;
      productCode: string;
      productName: string;
      oldCost: number;
      newCost: number;
      purchaseCount: number;
      currentStock: number;
      formulaUsed: string;
    }[];
  } | null>(null);

  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Product Form State - with category selector for Motor Oil or LPG
  const [newProductData, setNewProductData] = useState<{
    code: string;
    name: string;
    category: ProductCategory;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    reorderThreshold: number;
    isActive: boolean;
  }>({
    code: '',
    name: '',
    category: 'LUBRICANTS', // Motor Oil
    unit: '5L Can',
    costPrice: 320,
    sellingPrice: 450,
    reorderThreshold: 15,
    isActive: true,
  });

  // Initial stock quantities per branch when creating product
  const [initialStocks, setInitialStocks] = useState<{ [branchId: string]: number }>({});

  // Helper to get total stock & per branch breakdown for a product
  const getProductStockInfo = (productId: string) => {
    const stockEntries = branchStocks.filter((s) => s.productId === productId);
    const totalStock = stockEntries.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const branchBreakdown = branches.map((b) => {
      const entry = stockEntries.find((s) => s.branchId === b.id);
      return {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        quantity: entry ? entry.quantity : 0,
      };
    });

    const activeBranchEntry = branchFilter === 'ALL'
      ? null
      : branchBreakdown.find((b) => b.branchId === branchFilter);

    const relevantStock = branchFilter === 'ALL'
      ? totalStock
      : (activeBranchEntry ? activeBranchEntry.quantity : 0);

    return { totalStock, relevantStock, branchBreakdown };
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    const { totalStock, relevantStock } = getProductStockInfo(p.id);
    const isLow = relevantStock > 0 && relevantStock <= p.reorderThreshold;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = relevantStock > 0;
    if (stockFilter === 'LOW_STOCK') matchesStock = isLow;
    if (stockFilter === 'ZERO_STOCK') matchesStock = relevantStock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const zeroStockCount = products.filter((p) => getProductStockInfo(p.id).relevantStock === 0).length;
  const inStockCount = products.filter((p) => getProductStockInfo(p.id).relevantStock > 0).length;
  const lowStockCount = products.filter((p) => {
    const { relevantStock } = getProductStockInfo(p.id);
    return relevantStock > 0 && relevantStock <= p.reorderThreshold;
  }).length;

  // Enterprise / Selected Branch Volume Totals Remaining
  let totalOilLitersRemaining = 0;
  let totalLpgKgRemaining = 0;
  let totalStockValuation = 0;

  products.forEach((p) => {
    const { relevantStock } = getProductStockInfo(p.id);
    const volumePerUnit = p.volumeLitersOrKg || (p.unit.includes('4L') ? 4 : p.unit.includes('5L') ? 5 : p.unit.includes('6kg') ? 6 : p.unit.includes('12kg') ? 12 : 1);
    if (p.category === 'LUBRICANTS') {
      totalOilLitersRemaining += relevantStock * volumePerUnit;
    } else if (p.category === 'LPG') {
      totalLpgKgRemaining += relevantStock * volumePerUnit;
    }
    totalStockValuation += relevantStock * p.sellingPrice;
  });

  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setEditFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderThreshold: product.reorderThreshold,
      isActive: product.isActive,
    });
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditFormData({});
    setErrorMsg(null);
  };

  const handleSaveEdit = (productId: string) => {
    if (!editFormData.name?.trim()) {
      setErrorMsg('Product name cannot be empty.');
      return;
    }
    if (!editFormData.code?.trim()) {
      setErrorMsg('Product code cannot be empty.');
      return;
    }

    // Check code uniqueness
    const codeConflict = products.some(
      (p) => p.id !== productId && p.code.toLowerCase() === editFormData.code?.toLowerCase().trim()
    );
    if (codeConflict) {
      setErrorMsg(`Product code "${editFormData.code}" already belongs to another SKU.`);
      return;
    }

    updateProduct(productId, {
      name: editFormData.name.trim(),
      code: editFormData.code.toUpperCase().trim(),
      category: editFormData.category || 'LUBRICANTS',
      unit: editFormData.unit?.trim() || '',
      costPrice: Number(editFormData.costPrice) || 0,
      sellingPrice: Number(editFormData.sellingPrice) || 0,
      reorderThreshold: Number(editFormData.reorderThreshold) || 5,
      isActive: editFormData.isActive ?? true,
    });

    setEditingProductId(null);
    setSuccessMsg('Product details and pricing updated successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSelectCategory = (cat: ProductCategory) => {
    setNewProductData((prev) => ({
      ...prev,
      category: cat,
      unit: cat === 'LUBRICANTS' ? '5L Can' : '6kg Cylinder',
      code: prev.code ? prev.code : cat === 'LUBRICANTS' ? 'LUB-' : 'LPG-',
    }));
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductData.name.trim() || !newProductData.code.trim()) {
      setErrorMsg('Product name and SKU code are required.');
      return;
    }

    const codeConflict = products.some(
      (p) => p.code.toLowerCase() === newProductData.code.toLowerCase().trim()
    );
    if (codeConflict) {
      setErrorMsg(`Product code "${newProductData.code}" is already in use.`);
      return;
    }

    addProduct(
      {
        code: newProductData.code.toUpperCase().trim(),
        name: newProductData.name.trim(),
        category: newProductData.category,
        subCategory: newProductData.category === 'LUBRICANTS' ? 'Motor Oil' : 'LPG',
        unit: newProductData.unit.trim(),
        volumeLitersOrKg: 1, // standard default
        costPrice: Number(newProductData.costPrice) || 0,
        sellingPrice: Number(newProductData.sellingPrice) || 0,
        reorderThreshold: Number(newProductData.reorderThreshold) || 10,
        isActive: true,
      },
      initialStocks
    );

    setIsAddingProduct(false);
    setNewProductData({
      code: '',
      name: '',
      category: 'LUBRICANTS',
      unit: '5L Can',
      costPrice: 320,
      sellingPrice: 450,
      reorderThreshold: 15,
      isActive: true,
    });
    setInitialStocks({});

    setSuccessMsg(`New product "${newProductData.code.toUpperCase().trim()}" successfully added to master catalog!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleRequestDelete = (product: Product) => {
    const { totalStock, branchBreakdown } = getProductStockInfo(product.id);

    // Strict rule: A product can ONLY be deleted if quantity is zero
    if (totalStock > 0) {
      setRestrictedDeleteProduct({
        product,
        totalStock,
        breakdown: branchBreakdown.filter((b) => b.quantity > 0),
      });
    } else {
      setProductToDelete(product);
    }
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;

    const result = deleteProduct(productToDelete.id);
    if (result.success) {
      setSuccessMsg(`Product "${productToDelete.code} - ${productToDelete.name}" successfully deleted from catalog.`);
      setProductToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(result.message || 'Failed to delete product.');
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
            <Package className="w-4 h-4" />
            <span>Master Enterprise Catalog (Owner Only)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Motor Oils &amp; LPG Product Management
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Add new products under Motor Oil or LPG, configure buying and selling prices, set safety thresholds, and delete obsolete SKUs (allowed only when total physical stock is 0).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="btn-import-products-csv"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-xs cursor-pointer"
            title="Import multiple products, pricing and branch stock items from CSV or Excel file"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            id="btn-sync-wac-costs"
            onClick={() => {
              const res = syncProductCostPricesWithInvoices();
              setSyncResultModal(res);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-2xs cursor-pointer"
            title="Recalculate and synchronize all product cost prices with supplier purchase invoices using Weighted Average Cost (WAC)"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Sync Invoice Costs (WAC)</span>
          </button>

          <button
            id="btn-add-product-modal"
            onClick={() => {
              setIsAddingProduct(true);
              setErrorMsg(null);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product SKU</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stat Pills - Detailed Stock Remaining Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog SKUs</div>
            <div className="text-2xl font-black text-slate-900">{products.length} Products</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {inStockCount} active • {zeroStockCount} zero stock
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Droplets className="w-3 h-3 text-blue-600" />
              <span>Motor Oil Stock Remaining</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalOilLitersRemaining.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-bold text-blue-600">Liters</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {branchFilter === 'ALL' ? 'Total network volume' : 'Volume at selected branch'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Flame className="w-3 h-3 text-amber-600" />
              <span>LPG Gas Stock Remaining</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalLpgKgRemaining.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-bold text-amber-600">Kg</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {branchFilter === 'ALL' ? 'Total gas in cylinders' : 'Gas at selected branch'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Total Stock Asset Value</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              K{totalStockValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-medium flex items-center space-x-1.5">
              {lowStockCount > 0 ? (
                <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                  {lowStockCount} Reorder Alerts
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold text-[10px]">Stock levels healthy</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar with Branch Selection */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-search-products"
              type="text"
              placeholder="Search by SKU code, name, pack size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Branch Location Stock Filter */}
          <div className="relative w-full sm:w-60">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">🏢 All Branches (Enterprise Total)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setSelectedCategory('LUBRICANTS')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1 cursor-pointer ${
                selectedCategory === 'LUBRICANTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Droplets className="w-3 h-3" />
              <span>Motor Oils</span>
            </button>
            <button
              onClick={() => setSelectedCategory('LPG')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1 cursor-pointer ${
                selectedCategory === 'LPG'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-600'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>LPG Gas</span>
            </button>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('ZERO_STOCK')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                stockFilter === 'ZERO_STOCK'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              0 Stock ({zeroStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add New Product Form */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Add New SKU to Master Catalog</h3>
                  <p className="text-slate-400 text-xs">Select Category, define product name, SKU code, and pricing</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingProduct(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-5 overflow-y-auto text-sm">
              {/* Product Category Dropdown & SKU Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="select-new-prod-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    id="select-new-prod-category"
                    value={newProductData.category}
                    onChange={(e) => handleSelectCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="LUBRICANTS">Motor Oil</option>
                    <option value="LPG">LPG</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="input-new-prod-code" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKU / Product Code *
                  </label>
                  <input
                    id="input-new-prod-code"
                    type="text"
                    required
                    placeholder={
                      newProductData.category === 'LUBRICANTS' ? 'e.g. LUB-HLX-5W40-5L' : 'e.g. LPG-6KG-REFILL'
                    }
                    value={newProductData.code}
                    onChange={(e) => setNewProductData({ ...newProductData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm uppercase font-bold"
                  />
                </div>
              </div>

              {/* Product Name and Packaging Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-new-prod-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    id="input-new-prod-name"
                    type="text"
                    required
                    placeholder={
                      newProductData.category === 'LUBRICANTS'
                        ? 'e.g. Helix Ultra 5W-40 Synthetic'
                        : 'e.g. 6kg LPG Gas Cylinder Refill'
                    }
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="input-new-prod-unit" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Packaging / Pack Size
                  </label>
                  <input
                    id="input-new-prod-unit"
                    type="text"
                    placeholder={
                      newProductData.category === 'LUBRICANTS'
                        ? 'e.g. 5L Can, 1L Bottle, 20L Pail'
                        : 'e.g. 6kg Cylinder, 13kg Cylinder'
                    }
                    value={newProductData.unit}
                    onChange={(e) => setNewProductData({ ...newProductData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Pricing & Reorder Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="input-new-prod-cost" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wholesale Cost (K) *
                  </label>
                  <input
                    id="input-new-prod-cost"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={newProductData.costPrice}
                    onChange={(e) => setNewProductData({ ...newProductData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="input-new-prod-price" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Retail Price (K) *
                  </label>
                  <input
                    id="input-new-prod-price"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={newProductData.sellingPrice}
                    onChange={(e) => setNewProductData({ ...newProductData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label htmlFor="input-new-prod-threshold" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    id="input-new-prod-threshold"
                    type="number"
                    min="0"
                    value={newProductData.reorderThreshold}
                    onChange={(e) => setNewProductData({ ...newProductData, reorderThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-amber-700"
                  />
                </div>
              </div>

              {/* Profit Margin Preview */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Estimated Gross Margin per Unit:</span>
                <span className="font-bold text-emerald-700">
                  +K{(newProductData.sellingPrice - newProductData.costPrice).toFixed(2)} (
                  {newProductData.sellingPrice > 0
                    ? (((newProductData.sellingPrice - newProductData.costPrice) / newProductData.sellingPrice) * 100).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>

              {/* Optional: Initial Stock Per Branch */}
              <div className="border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Initial Physical Stock Allocation (Optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {branches.map((b) => (
                    <div key={b.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[11px] font-semibold text-slate-700 truncate">{b.name}</div>
                      <div className="flex items-center space-x-1 mt-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={initialStocks[b.id] ?? 0}
                          onChange={(e) =>
                            setInitialStocks({
                              ...initialStocks,
                              [b.id]: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                        />
                        <span className="text-[10px] text-slate-400">units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs sm:text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-new-product"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Product to Master Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Product (Allowed when stock is 0) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Delete Product from Catalog</h3>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="text-red-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start space-x-2 text-emerald-900 text-xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Stock Verified: 0 Units across all branches.</span>
                  <p className="text-emerald-700 mt-0.5">
                    This product currently has zero inventory in all retail sites and is eligible for deletion.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {productToDelete.code}
                  </span>
                  <span className="font-bold text-slate-900">{productToDelete.name}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Category: <strong className="text-slate-700">{productToDelete.category === 'LUBRICANTS' ? 'Motor Oil' : 'LPG'}</strong> • Pack: {productToDelete.unit}
                </div>
                <div className="text-xs text-slate-500">
                  Retail Price: <strong className="text-slate-800">K{productToDelete.sellingPrice.toFixed(2)}</strong> | Cost: K{productToDelete.costPrice.toFixed(2)}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently remove this product SKU from the master enterprise catalog?
              </p>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-product"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-xs text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Delete Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Restricted Deletion (Blocked because stock > 0) */}
      {restrictedDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold text-base">Product Deletion Restricted</h3>
              </div>
              <button
                onClick={() => setRestrictedDeleteProduct(null)}
                className="text-amber-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-start space-x-3 text-amber-900 text-xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm block">Quantity must be 0 to delete</span>
                  <p className="text-amber-800 mt-1 leading-relaxed">
                    Under enterprise inventory management rules, a product SKU <strong>cannot be deleted</strong> while active stock units remain in branches. This prevents inventory ledger desynchronization.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {restrictedDeleteProduct.product.code}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Total Network Stock: <span className="text-red-600">{restrictedDeleteProduct.totalStock} {restrictedDeleteProduct.product.unit}</span>
                  </div>
                </div>
                <div className="font-bold text-slate-800 text-xs">{restrictedDeleteProduct.product.name}</div>
              </div>

              {/* Branch breakdown table */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Branches Holding Stock:</span>
                </div>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  {restrictedDeleteProduct.breakdown.map((b) => (
                    <div key={b.branchName} className="p-2.5 bg-white flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{b.branchName}</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {b.quantity} {restrictedDeleteProduct.product.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">
                To delete this product, ensure all remaining units are sold via Daily Sales or written off/adjusted to 0 in <strong>Stock Reconciliation</strong>.
              </p>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRestrictedDeleteProduct(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900">
              Master Catalog SKUs ({filteredProducts.length} items)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Click &apos;Delete&apos; to remove zero-stock SKUs or &apos;Edit&apos; to adjust rates
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No products match the selected filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your search query or filter selection.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredProducts.map((product) => {
              const isEditing = editingProductId === product.id;
              const margin = product.sellingPrice - product.costPrice;
              const marginPct = product.sellingPrice > 0 ? (margin / product.sellingPrice) * 100 : 0;
              const { totalStock, relevantStock, branchBreakdown } = getProductStockInfo(product.id);
              const isExpandedStock = expandedStockProductId === product.id;
              const canDelete = totalStock === 0;

              const volumePerUnit = product.volumeLitersOrKg || (product.unit.includes('4L') ? 4 : product.unit.includes('5L') ? 5 : product.unit.includes('6kg') ? 6 : product.unit.includes('12kg') ? 12 : 1);
              const totalVolumeRemaining = relevantStock * volumePerUnit;
              const isLowStock = relevantStock > 0 && relevantStock <= product.reorderThreshold;
              const isOutOfStock = relevantStock === 0;

              return (
                <div key={product.id} className={`p-5 transition hover:bg-slate-50/60 ${isOutOfStock ? 'bg-red-50/10' : isLowStock ? 'bg-amber-50/15' : ''}`}>
                  {isEditing ? (
                    /* Edit Mode Form */
                    <div className="space-y-4 bg-blue-50/40 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Editing SKU: {product.code} - {product.name}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            id={`btn-cancel-edit-prod-${product.id}`}
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-white flex items-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                          <button
                            id={`btn-save-edit-prod-${product.id}`}
                            onClick={() => handleSaveEdit(product.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Category *
                          </label>
                          <select
                            value={editFormData.category || 'LUBRICANTS'}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                category: e.target.value as ProductCategory,
                              })
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-semibold"
                          >
                            <option value="LUBRICANTS">Motor Oil</option>
                            <option value="LPG">LPG</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Product Code / SKU *
                          </label>
                          <input
                            type="text"
                            value={editFormData.code || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono uppercase text-sm font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            value={editFormData.name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Packaging / Pack Size
                          </label>
                          <input
                            type="text"
                            value={editFormData.unit || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Cost Price (K) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editFormData.costPrice || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, costPrice: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Selling Price (K) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editFormData.sellingPrice || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-bold text-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Low Stock Alert Level
                          </label>
                          <input
                            type="number"
                            value={editFormData.reorderThreshold || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, reorderThreshold: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-bold text-amber-800"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Row */
                    <div className="space-y-3.5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                              {product.code}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900">
                              {product.name}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                                product.category === 'LUBRICANTS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {product.category === 'LUBRICANTS' ? (
                                <>
                                  <Droplets className="w-2.5 h-2.5 text-blue-600" />
                                  <span>Motor Oil</span>
                                </>
                              ) : (
                                <>
                                  <Flame className="w-2.5 h-2.5 text-amber-600" />
                                  <span>LPG</span>
                                </>
                              )}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">({product.unit})</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                              Packaging Unit: <strong className="text-slate-700">{volumePerUnit} {product.category === 'LUBRICANTS' ? 'L' : 'kg'} / pack</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Reorder Alert Level: <strong className="text-amber-800">{product.reorderThreshold} {product.unit}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Unit Margin: <strong className="text-emerald-700">+K{margin.toFixed(2)} ({marginPct.toFixed(0)}%)</strong>
                            </span>
                          </div>
                        </div>

                        {/* Middle & Right: Current Stock Remaining & Price */}
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* CURRENT STOCK REMAINING BADGE */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 min-w-[210px] text-left sm:text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center sm:justify-end space-x-1">
                              <Layers className="w-3 h-3 text-blue-600" />
                              <span>Current Stock Remaining</span>
                            </div>

                            <div className="flex items-baseline sm:justify-end space-x-1 mt-0.5">
                              <span className={`text-xl font-black font-mono ${
                                isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                              }`}>
                                {relevantStock}
                              </span>
                              <span className="text-xs font-bold text-slate-600">
                                {product.unit}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({branchFilter === 'ALL' ? 'Total' : 'Branch'})
                              </span>
                            </div>

                            {/* Total Volume Remaining in Liters or Kg */}
                            <div className="text-xs font-semibold mt-0.5 flex items-center sm:justify-end">
                              {product.category === 'LUBRICANTS' ? (
                                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono text-[11px]">
                                  {totalVolumeRemaining.toFixed(1)} Liters of Oil
                                </span>
                              ) : (
                                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono text-[11px]">
                                  {totalVolumeRemaining.toFixed(1)} Kg of LPG
                                </span>
                              )}
                            </div>

                            {/* Stock Health Status */}
                            <div className="mt-1 flex items-center sm:justify-end">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                  <span>0 Units (Deletable)</span>
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Low Stock Alert</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>In Stock</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price Breakdown with WAC Badge */}
                          <div className="text-right min-w-[110px]">
                            <div className="text-[11px] text-slate-500">Retail Price</div>
                            <div className="text-base font-black text-slate-900 font-mono">
                              K{product.sellingPrice.toFixed(2)}
                            </div>
                            <button
                              onClick={() => setSelectedWacProduct(product)}
                              className="mt-1 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer font-medium text-[10px]"
                              title="Click to view Weighted Average Cost breakdown"
                            >
                              <Calculator className="w-2.5 h-2.5 text-blue-600" />
                              <span>WAC: K{product.costPrice.toFixed(2)}</span>
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1.5">
                            {/* WAC & Invoice History Button */}
                            <button
                              id={`btn-wac-prod-${product.id}`}
                              onClick={() => setSelectedWacProduct(product)}
                              className="p-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 transition shadow-2xs cursor-pointer"
                              title="View Weighted Average Cost formula valuation & supplier purchase invoice history"
                            >
                              <Receipt className="w-4 h-4 text-blue-600" />
                            </button>

                            <button
                              id={`btn-edit-prod-${product.id}`}
                              onClick={() => handleStartEdit(product)}
                              className="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                              title="Edit SKU"
                            >
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </button>

                            {/* Delete Product Button with Tooltip / Security */}
                            <button
                              id={`btn-delete-prod-${product.id}`}
                              onClick={() => handleRequestDelete(product)}
                              className={`p-2 rounded-lg transition shadow-2xs cursor-pointer ${
                                canDelete
                                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                              }`}
                              title={
                                canDelete
                                  ? 'Delete this zero-stock product from catalog'
                                  : `Cannot delete: Product has ${totalStock} units in stock across branches`
                              }
                            >
                              {canDelete ? (
                                <Trash2 className="w-4 h-4 text-red-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Direct Branch Stock Breakdown Badges */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>Branch Stocks:</span>
                        </span>
                        {branchBreakdown.map((b) => {
                          const isSelectedBranch = branchFilter === b.branchId;
                          const isBranchLow = b.quantity > 0 && b.quantity <= product.reorderThreshold;
                          const isBranchZero = b.quantity === 0;

                          return (
                            <span
                              key={b.branchId}
                              className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center space-x-1 ${
                                isSelectedBranch
                                  ? 'bg-blue-100 text-blue-900 border-blue-300 ring-1 ring-blue-400 font-bold'
                                  : isBranchZero
                                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                                  : isBranchLow
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                              }`}
                            >
                              <span className="text-slate-500">{b.branchName}:</span>
                              <span className={`font-mono font-bold ${isBranchZero ? 'text-slate-400' : isBranchLow ? 'text-amber-700' : 'text-slate-900'}`}>
                                {b.quantity} {product.unit}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: WAC Valuation & Invoice History */}
      {selectedWacProduct && (
        <ProductWacModal
          product={selectedWacProduct}
          onClose={() => setSelectedWacProduct(null)}
        />
      )}

      {/* Modal: Bulk WAC Sync Result Summary */}
      {syncResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Cost Price & WAC Synchronization</h3>
                  <p className="text-slate-400 text-xs">{syncResultModal.message}</p>
                </div>
              </div>
              <button
                onClick={() => setSyncResultModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-900 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Weighted Average Cost (WAC) Applied:</p>
                  <p className="text-blue-800">
                    All recorded purchase invoices under Supplier Accounts were scanned chronologically.
                    Where subsequent purchases occurred at varying invoice unit costs, the product cost price in the master catalog was updated based on the remaining inventory stock.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <th className="p-2.5">SKU / Product</th>
                      <th className="p-2.5 text-right">Invoices Found</th>
                      <th className="p-2.5 text-right">Stock</th>
                      <th className="p-2.5 text-right">Old Cost</th>
                      <th className="p-2.5 text-right">New WAC Cost</th>
                      <th className="p-2.5">Calculation Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {syncResultModal.details.map((d) => {
                      const changed = Math.abs(d.oldCost - d.newCost) > 0.001;
                      return (
                        <tr key={d.productId} className={`hover:bg-slate-50 ${changed ? 'bg-emerald-50/40' : ''}`}>
                          <td className="p-2.5 font-medium">
                            <span className="font-mono font-bold text-slate-900 block">{d.productCode}</span>
                            <span className="text-slate-500 text-[11px]">{d.productName}</span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-700">
                            {d.purchaseCount}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {d.currentStock}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            K{d.oldCost.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-900">
                            K{d.newCost.toFixed(2)}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                              {d.formulaUsed}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSyncResultModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV / Excel Bulk Product & Stock Import Modal */}
      <ProductCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />
    </div>
  );
};
