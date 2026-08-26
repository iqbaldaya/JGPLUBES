import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesRecord, Product } from '../../types';
import { SalesAdjustmentModal } from './SalesAdjustmentModal';
import { SalesDeleteModal } from './SalesDeleteModal';
import {
  Package,
  Droplets,
  Flame,
  Search,
  Filter,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductByProductSalesViewProps {
  branchIdFilter?: string | null;
}

interface ProductSalesAggregate {
  product: Product;
  totalQuantity: number;
  totalVolumeLitersOrKg: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  salesCount: number;
  currentStockTotal: number;
  branchBreakdown: Record<string, number>;
  transactions: {
    saleId: string;
    date: string;
    branchId: string;
    branchName: string;
    branchCode: string;
    shift: string;
    lubesChamp: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    totalAmount: number;
    profit: number;
    fullSale: DailySalesRecord;
  }[];
}

export const ProductByProductSalesView: React.FC<ProductByProductSalesViewProps> = ({
  branchIdFilter,
}) => {
  const { products, dailySales, branchStocks, branches } = useApp();

  const [selectedBranch, setSelectedBranch] = useState<string>(branchIdFilter || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LUBRICANTS' | 'LPG'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [editingSale, setEditingSale] = useState<DailySalesRecord | null>(null);
  const [deletingSale, setDeletingSale] = useState<DailySalesRecord | null>(null);

  // Filter Sales records by date and branch
  const filteredSales = useMemo(() => {
    return dailySales.filter((sale) => {
      if (selectedBranch !== 'ALL' && sale.branchId !== selectedBranch) return false;

      if (dateFilter === 'TODAY') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (sale.date !== todayStr) return false;
      } else if (dateFilter === 'LAST_7') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
        if (sale.date < sevenDaysStr) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        const currentMonthPrefix = new Date().toISOString().substring(0, 7);
        if (!sale.date.startsWith(currentMonthPrefix)) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && sale.date < customStartDate) return false;
        if (customEndDate && sale.date > customEndDate) return false;
      }

      return true;
    });
  }, [dailySales, selectedBranch, dateFilter, customStartDate, customEndDate]);

  // Aggregate Product Performance
  const productAggregates = useMemo<ProductSalesAggregate[]>(() => {
    return products
      .filter((prod) => {
        if (selectedCategory !== 'ALL' && prod.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = prod.name.toLowerCase().includes(q);
          const matchesCode = prod.code.toLowerCase().includes(q);
          const matchesSub = prod.subCategory?.toLowerCase().includes(q);
          if (!matchesName && !matchesCode && !matchesSub) return false;
        }
        return true;
      })
      .map((prod) => {
        let totalQuantity = 0;
        let totalRevenue = 0;
        let totalCost = 0;
        let salesCount = 0;
        const branchBreakdown: Record<string, number> = {};
        const transactions: ProductSalesAggregate['transactions'] = [];

        filteredSales.forEach((sale) => {
          sale.items.forEach((item) => {
            if (item.productId === prod.id) {
              totalQuantity += item.quantity;
              totalRevenue += item.totalAmount;
              totalCost += item.totalCost;
              salesCount += 1;
              branchBreakdown[sale.branchId] = (branchBreakdown[sale.branchId] || 0) + item.quantity;

              transactions.push({
                saleId: sale.id,
                date: sale.date,
                branchId: sale.branchId,
                branchName: sale.branchName,
                branchCode: sale.branchCode,
                shift: sale.shift,
                lubesChamp: sale.lubesChamp,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                costPrice: item.costPrice,
                totalAmount: item.totalAmount,
                profit: item.profit,
                fullSale: sale,
              });
            }
          });
        });

        // Current physical stock remaining
        let currentStockTotal = 0;
        branchStocks.forEach((stock) => {
          if (stock.productId === prod.id) {
            if (selectedBranch === 'ALL' || stock.branchId === selectedBranch) {
              currentStockTotal += stock.quantity;
            }
          }
        });

        const grossProfit = totalRevenue - totalCost;
        const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const totalVolumeLitersOrKg = totalQuantity * (prod.volumeLitersOrKg || 1);

        // Sort transactions descending by date
        transactions.sort((a, b) => b.date.localeCompare(a.date));

        return {
          product: prod,
          totalQuantity,
          totalVolumeLitersOrKg,
          totalRevenue,
          totalCost,
          grossProfit,
          marginPercent,
          salesCount,
          currentStockTotal,
          branchBreakdown,
          transactions,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by highest revenue
  }, [products, filteredSales, branchStocks, selectedCategory, searchQuery, selectedBranch]);

  // Toggle expand
  const toggleProduct = (productId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Grand summary
  const grandTotalRevenue = productAggregates.reduce((sum, p) => sum + p.totalRevenue, 0);
  const grandTotalProfit = productAggregates.reduce((sum, p) => sum + p.grossProfit, 0);
  const grandTotalUnits = productAggregates.reduce((sum, p) => sum + p.totalQuantity, 0);

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Package className="w-4 h-4" />
              <span>Owner Sales Portal • Product by Product</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Product SKU Sales Matrix &amp; Performance
            </h2>
            <p className="text-xs text-slate-500">
              Analyze product movement, unit volume sales, revenue contribution, profit margins, active inventory, and drill into individual sales.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All SKUs
            </button>
            <button
              onClick={() => setSelectedCategory('LUBRICANTS')}
              className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                selectedCategory === 'LUBRICANTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Motor Oils &amp; Lubes</span>
            </button>
            <button
              onClick={() => setSelectedCategory('LPG')}
              className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                selectedCategory === 'LPG'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>LPG Gas &amp; Kits</span>
            </button>
          </div>
        </div>

        {/* Filter Details & Search Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, code (e.g. 20W-50, 13KG, ATF)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white transition"
            />
          </div>

          {!branchIdFilter && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All Branch Sites</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Period Presets */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Filtered Revenue</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            K{grandTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
            Gross Profit: +K{grandTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Total Product Units Sold</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {grandTotalUnits.toLocaleString()} Units
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across {productAggregates.length} active SKUs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Top Performing SKU</div>
          <div className="text-base font-black text-slate-900 mt-1 truncate">
            {productAggregates[0]?.product.name || 'No Sales Yet'}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
            {productAggregates[0]
              ? `K${productAggregates[0].totalRevenue.toLocaleString()} (${productAggregates[0].totalQuantity} units)`
              : '-'}
          </div>
        </div>
      </div>

      {/* Product by Product List / Matrix */}
      <div className="space-y-4">
        {productAggregates.length > 0 ? (
          productAggregates.map((item) => {
            const isExpanded = !!expandedProductIds[item.product.id];
            const isLowStock = item.currentStockTotal <= item.product.reorderThreshold;

            return (
              <div
                key={item.product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Product Header Row */}
                <div
                  onClick={() => toggleProduct(item.product.id)}
                  className="p-5 bg-gradient-to-r from-slate-50 to-white hover:from-blue-50/40 hover:to-white cursor-pointer border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div
                      className={`p-3 rounded-xl text-center shrink-0 ${
                        item.product.category === 'LUBRICANTS'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {item.product.category === 'LUBRICANTS' ? (
                        <Droplets className="w-5 h-5 mx-auto" />
                      ) : (
                        <Flame className="w-5 h-5 mx-auto" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                          {item.product.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{item.product.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.product.category === 'LUBRICANTS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.product.unit}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>{item.product.category === 'LUBRICANTS' ? 'Motor Oil' : 'LPG'}</span>
                        <span>•</span>
                        <span>
                          Standard Price: <strong>K{item.product.sellingPrice}</strong> (Cost: K{item.product.costPrice})
                        </span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            isLowStock ? 'text-red-700' : 'text-slate-600'
                          }`}
                        >
                          Stock in Network: <strong>{item.currentStockTotal} units</strong>
                          {isLowStock && ' ⚠️ Low Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Summary on Right */}
                  <div className="flex items-center justify-between lg:justify-end space-x-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Volume Sold</div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {item.totalQuantity} units
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ({item.totalVolumeLitersOrKg} {item.product.category === 'LUBRICANTS' ? 'Liters' : 'Kg'})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total Sales Revenue</div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        K{item.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Profit: +K{item.grossProfit.toFixed(2)} ({item.marginPercent.toFixed(1)}%)
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Transactions Log for this Product */}
                {isExpanded && (
                  <div className="p-5 space-y-4 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Sales Transaction History for {item.product.name} ({item.transactions.length} entries)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Click "Adjust Sale" or "Delete Sale" on any entry to modify
                      </span>
                    </div>

                    {item.transactions.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Branch Site</th>
                              <th className="py-2.5 px-2">Shift</th>
                              <th className="py-2.5 px-2">Lubes Champ</th>
                              <th className="py-2.5 px-2 text-center font-bold">Qty Sold</th>
                              <th className="py-2.5 px-2 text-right">Unit Price</th>
                              <th className="py-2.5 px-3 text-right">Total (K)</th>
                              <th className="py-2.5 px-3 text-right">Profit (K)</th>
                              <th className="py-2.5 px-3 text-center w-28">Owner Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.transactions.map((tx, idx) => (
                              <tr key={`${tx.saleId}-${idx}`} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.date}</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-900">{tx.branchName}</span>
                                  <span className="font-mono text-[10px] text-slate-500 ml-1">({tx.branchCode})</span>
                                </td>
                                <td className="py-2.5 px-2 text-slate-600">{tx.shift}</td>
                                <td className="py-2.5 px-2 text-slate-700 font-medium">{tx.lubesChamp}</td>
                                <td className="py-2.5 px-2 text-center font-black text-slate-900 text-sm">
                                  {tx.quantity}
                                </td>
                                <td className="py-2.5 px-2 text-right text-slate-700">K{tx.unitPrice.toFixed(2)}</td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                  K{tx.totalAmount.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                  +K{tx.profit.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSale(tx.fullSale)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition border border-blue-200"
                                      title="Adjust / Edit this Daily Sale"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingSale(tx.fullSale)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition border border-red-200"
                                      title="Delete this Daily Sale Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        No sales recorded for this product in the selected period.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Products Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No product SKUs match the current search or category filter.
            </p>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      <SalesAdjustmentModal
        sale={editingSale}
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        onDeleteRequested={(s) => {
          setEditingSale(null);
          setDeletingSale(s);
        }}
      />

      {/* Delete Modal */}
      <SalesDeleteModal
        sale={deletingSale}
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
      />
    </div>
  );
};
