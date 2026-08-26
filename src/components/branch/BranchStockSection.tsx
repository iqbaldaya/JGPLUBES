import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCategory } from '../../types';
import {
  Layers,
  Search,
  Droplets,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Package,
  Building2,
  TrendingDown,
  Scale,
  DollarSign,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface BranchStockSectionProps {
  branchId: string;
  onAuditStock?: () => void;
  onRecordSale?: () => void;
}

export const BranchStockSection: React.FC<BranchStockSectionProps> = ({
  branchId,
  onAuditStock,
  onRecordSale,
}) => {
  const { products, branchStocks, branches, lowStockAlerts } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  const currentBranch = branches.find((b) => b.id === branchId) || branches[0];

  // Calculate stock metrics for this branch
  const branchProductsWithStock = useMemo(() => {
    return products.map((product) => {
      const stockEntry = branchStocks.find(
        (s) => s.branchId === branchId && s.productId === product.id
      );
      const remainingQty = stockEntry ? stockEntry.quantity : 0;
      const volumePerUnit = product.volumeLitersOrKg || (product.unit.includes('4L') ? 4 : product.unit.includes('5L') ? 5 : product.unit.includes('6kg') ? 6 : product.unit.includes('12kg') ? 12 : 1);
      const totalVolume = remainingQty * volumePerUnit;
      const retailValue = remainingQty * product.sellingPrice;
      const costValue = remainingQty * product.costPrice;

      const isOutOfStock = remainingQty <= 0;
      const isLowStock = remainingQty > 0 && remainingQty <= product.reorderThreshold;
      const isHealthyStock = remainingQty > product.reorderThreshold;

      return {
        product,
        remainingQty,
        volumePerUnit,
        totalVolume,
        retailValue,
        costValue,
        isOutOfStock,
        isLowStock,
        isHealthyStock,
      };
    });
  }, [products, branchStocks, branchId]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return branchProductsWithStock.filter(({ product, remainingQty, isOutOfStock, isLowStock }) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.unit.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;

      let matchesStatus = true;
      if (stockStatusFilter === 'IN_STOCK') matchesStatus = remainingQty > 0;
      if (stockStatusFilter === 'LOW_STOCK') matchesStatus = isLowStock;
      if (stockStatusFilter === 'OUT_OF_STOCK') matchesStatus = isOutOfStock;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [branchProductsWithStock, searchQuery, selectedCategory, stockStatusFilter]);

  // Overall KPIs for this branch
  const totalItemsCount = branchProductsWithStock.reduce((sum, item) => sum + item.remainingQty, 0);
  const totalOilLitersRemaining = branchProductsWithStock
    .filter((item) => item.product.category === 'LUBRICANTS')
    .reduce((sum, item) => sum + item.totalVolume, 0);
  const totalLpgKgRemaining = branchProductsWithStock
    .filter((item) => item.product.category === 'LPG')
    .reduce((sum, item) => sum + item.totalVolume, 0);
  const totalStockRetailValue = branchProductsWithStock.reduce((sum, item) => sum + item.retailValue, 0);
  const lowStockCount = branchProductsWithStock.filter((item) => item.isLowStock).length;
  const outOfStockCount = branchProductsWithStock.filter((item) => item.isOutOfStock).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
              Live Site Inventory
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-300 font-medium">{currentBranch?.name}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Current Stock Remaining of Each Product</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Real-time physical stock balances, remaining liters of motor oil, remaining kg of LPG cylinders, and safety threshold alerts for this branch.
          </p>
        </div>

        {onAuditStock && (
          <button
            onClick={onAuditStock}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Audit / Reconcile Physical Dips</span>
          </button>
        )}
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/70 border-b border-slate-200">
        <div className="p-4 space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
            <span>Motor Oil Stock Remaining</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {totalOilLitersRemaining.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
            <span className="text-xs font-bold text-blue-700">Liters</span>
          </div>
          <div className="text-[11px] text-slate-500">Total volume on site</div>
        </div>

        <div className="p-4 space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>LPG Gas Stock Remaining</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {totalLpgKgRemaining.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
            <span className="text-xs font-bold text-amber-700">Kg</span>
          </div>
          <div className="text-[11px] text-slate-500">In cylinders &amp; refills</div>
        </div>

        <div className="p-4 space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Package className="w-3.5 h-3.5 text-slate-600" />
            <span>Total Units on Site</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {totalItemsCount.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">Packs/Cylinders</span>
          </div>
          <div className="text-[11px] text-slate-500">{products.length} distinct SKUs</div>
        </div>

        <div className="p-4 space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock Asset Value</span>
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            K{totalStockRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] flex items-center space-x-2">
            {lowStockCount > 0 && (
              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                {lowStockCount} Low Stock
              </span>
            )}
            {outOfStockCount > 0 && (
              <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200 text-[10px]">
                {outOfStockCount} Out of Stock
              </span>
            )}
            {lowStockCount === 0 && outOfStockCount === 0 && (
              <span className="text-emerald-700 font-semibold text-[10px]">All Levels Optimal</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search product SKU, name, pack size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedCategory('LUBRICANTS')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 transition cursor-pointer ${
                selectedCategory === 'LUBRICANTS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3 h-3 text-blue-600" />
              <span>Motor Oil</span>
            </button>
            <button
              onClick={() => setSelectedCategory('LPG')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center space-x-1 transition cursor-pointer ${
                selectedCategory === 'LPG'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-600" />
              <span>LPG Gas</span>
            </button>
          </div>

          {/* Stock Level Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 0)</option>
            <option value="LOW_STOCK">Low Stock (≤ Threshold)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0 Units)</option>
          </select>
        </div>
      </div>

      {/* Product Stock Table / List */}
      <div className="divide-y divide-slate-200">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No products match your search/filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the search query or category filters.</p>
          </div>
        ) : (
          filteredProducts.map(({ product, remainingQty, volumePerUnit, totalVolume, retailValue, isOutOfStock, isLowStock, isHealthyStock }) => {
            return (
              <div
                key={product.id}
                className={`p-4 sm:p-5 transition hover:bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isOutOfStock ? 'bg-red-50/20' : isLowStock ? 'bg-amber-50/20' : ''
                }`}
              >
                {/* Left Product Metadata */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                      {product.code}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
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

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Packaging Size: <strong className="text-slate-700">{volumePerUnit} {product.category === 'LUBRICANTS' ? 'L' : 'kg'} / unit</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Reorder Threshold: <strong className="text-amber-800">{product.reorderThreshold} {product.unit}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Retail Price: <strong className="text-slate-800">K{product.sellingPrice.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Side: Current Stock Remaining & Status Badges */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 shrink-0">
                  {/* Stock Remaining Primary Block */}
                  <div className="text-left sm:text-right bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200 min-w-[200px]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center sm:justify-end space-x-1">
                      <Layers className="w-3 h-3 text-blue-600" />
                      <span>Current Stock Remaining</span>
                    </div>

                    <div className="flex items-baseline sm:justify-end space-x-1.5 mt-0.5">
                      <span className={`text-xl sm:text-2xl font-black font-mono ${
                        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {remainingQty}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {product.unit}
                      </span>
                    </div>

                    {/* Converted Liters / Kg Remaining */}
                    <div className="text-xs font-semibold mt-0.5 flex items-center sm:justify-end space-x-1">
                      {product.category === 'LUBRICANTS' ? (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                          {totalVolume.toFixed(1)} Liters of Oil
                        </span>
                      ) : (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                          {totalVolume.toFixed(1)} Kg of LPG
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 sm:text-right font-mono">
                      Stock Value: K{retailValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  <div className="w-32 flex flex-col items-end justify-center">
                    {isOutOfStock ? (
                      <span className="w-full text-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center justify-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        <span>0 In Stock</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="w-full text-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Low Stock</span>
                      </span>
                    ) : (
                      <span className="w-full text-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>In Stock</span>
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1">
                      {isLowStock ? `Below ${product.reorderThreshold} target` : isOutOfStock ? 'Needs replenishment' : 'Adequate supply'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
