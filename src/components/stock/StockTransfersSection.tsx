import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockTransfer, StockTransferItem, StockTransferStatus } from '../../types';
import {
  Truck,
  ArrowRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer,
  ChevronRight,
  Package,
  AlertTriangle,
  Layers,
  Calendar,
  User,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { generateStockTransfersCsv, downloadCsvFile } from '../../utils/csvExport';

interface StockTransfersSectionProps {
  branchViewOnlyId?: string; // If provided, locks or filters view for branch manager
}

interface NewTransferItemRow {
  productId: string;
  quantity: number;
}

export const StockTransfersSection: React.FC<StockTransfersSectionProps> = ({ branchViewOnlyId }) => {
  const {
    branches,
    products,
    branchStocks,
    stockTransfers,
    createStockTransfer,
    receiveStockTransfer,
    cancelStockTransfer,
    deleteStockTransfer,
    role,
    currentBranch,
  } = useApp();

  // Filters and UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceBranchFilter, setSourceBranchFilter] = useState<string>(branchViewOnlyId || 'ALL');
  const [destinationBranchFilter, setDestinationBranchFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransferForView, setSelectedTransferForView] = useState<StockTransfer | null>(null);
  const [selectedTransferForReceive, setSelectedTransferForReceive] = useState<StockTransfer | null>(null);
  const [selectedTransferForCancel, setSelectedTransferForCancel] = useState<StockTransfer | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Create Form State
  const [sourceBranchId, setSourceBranchId] = useState<string>(
    branchViewOnlyId || branches[0]?.id || ''
  );
  const [destinationBranchId, setDestinationBranchId] = useState<string>(
    branches.find((b) => b.id !== (branchViewOnlyId || branches[0]?.id))?.id || ''
  );
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dispatchedBy, setDispatchedBy] = useState<string>(
    role === 'BRANCH_MANAGER' ? currentBranch?.lubesChamp || 'Branch Dispatcher' : 'Owner Dispatch'
  );
  const [driverName, setDriverName] = useState('');
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [waybillNo, setWaybillNo] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [itemRows, setItemRows] = useState<NewTransferItemRow[]>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Receive Form State
  const [receivedByName, setReceivedByName] = useState(
    role === 'BRANCH_MANAGER' ? currentBranch?.lubesChamp || 'Branch Receiver' : 'Operations Manager'
  );
  const [receivingNotes, setReceivingNotes] = useState('');
  const [receiptItemQuantities, setReceiptItemQuantities] = useState<{
    [productId: string]: { received: number; damaged: number; missing: number };
  }>({});

  // Reset Create Form
  const resetCreateForm = () => {
    const defaultSrc = branchViewOnlyId || branches[0]?.id || '';
    setSourceBranchId(defaultSrc);
    setDestinationBranchId(branches.find((b) => b.id !== defaultSrc)?.id || '');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setDispatchedBy(
      role === 'BRANCH_MANAGER' ? currentBranch?.lubesChamp || 'Branch Dispatcher' : 'Owner Dispatch'
    );
    setDriverName('');
    setVehicleRegNo('');
    setWaybillNo('');
    setTransferNotes('');
    setItemRows([{ productId: products[0]?.id || '', quantity: 1 }]);
    setFormError(null);
  };

  // Open Receive Modal Helper
  const handleOpenReceiveModal = (transfer: StockTransfer) => {
    setSelectedTransferForReceive(transfer);
    setReceivedByName(
      role === 'BRANCH_MANAGER' ? currentBranch?.lubesChamp || 'Branch Receiver' : 'Operations Manager'
    );
    setReceivingNotes('');
    const initialReceipts: {
      [productId: string]: { received: number; damaged: number; missing: number };
    } = {};
    transfer.items.forEach((item) => {
      initialReceipts[item.productId] = {
        received: item.quantity,
        damaged: 0,
        missing: 0,
      };
    });
    setReceiptItemQuantities(initialReceipts);
  };

  // Helper to find available stock at selected source branch
  const getSourceAvailableStock = (bId: string, pId: string): number => {
    const stock = branchStocks.find((s) => s.branchId === bId && s.productId === pId);
    return stock ? stock.quantity : 0;
  };

  // Filtered transfers list
  const filteredTransfers = useMemo(() => {
    return stockTransfers.filter((t) => {
      // If branch view mode, show transfers where this branch is either source OR destination
      if (branchViewOnlyId) {
        if (t.sourceBranchId !== branchViewOnlyId && t.destinationBranchId !== branchViewOnlyId) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceBranchFilter !== 'ALL' && t.sourceBranchId !== sourceBranchFilter) {
        return false;
      }

      // Destination filter
      if (destinationBranchFilter !== 'ALL' && t.destinationBranchId !== destinationBranchFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNum = t.transferNumber.toLowerCase().includes(query);
        const matchWaybill = (t.waybillOrRefNo || '').toLowerCase().includes(query);
        const matchDriver = (t.driverOrCourierName || '').toLowerCase().includes(query);
        const matchVehicle = (t.vehicleRegNo || '').toLowerCase().includes(query);
        const matchSrc = t.sourceBranchName.toLowerCase().includes(query);
        const matchDst = t.destinationBranchName.toLowerCase().includes(query);
        const matchItems = t.items.some(
          (i) =>
            i.productName.toLowerCase().includes(query) || i.productCode.toLowerCase().includes(query)
        );

        if (
          !matchNum &&
          !matchWaybill &&
          !matchDriver &&
          !matchVehicle &&
          !matchSrc &&
          !matchDst &&
          !matchItems
        ) {
          return false;
        }
      }

      return true;
    });
  }, [stockTransfers, branchViewOnlyId, statusFilter, sourceBranchFilter, destinationBranchFilter, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const relevant = branchViewOnlyId
      ? stockTransfers.filter(
          (t) => t.sourceBranchId === branchViewOnlyId || t.destinationBranchId === branchViewOnlyId
        )
      : stockTransfers;

    const inTransit = relevant.filter((t) => t.status === 'IN_TRANSIT');
    const received = relevant.filter((t) => t.status === 'RECEIVED');
    const cancelled = relevant.filter((t) => t.status === 'CANCELLED');

    const inTransitQty = inTransit.reduce((sum, t) => sum + t.totalQuantity, 0);
    const inTransitValuation = inTransit.reduce((sum, t) => sum + t.totalValuation, 0);
    const totalReceivedValuation = received.reduce((sum, t) => sum + t.totalValuation, 0);

    return {
      inTransitCount: inTransit.length,
      inTransitQty,
      inTransitValuation,
      receivedCount: received.length,
      totalReceivedValuation,
      cancelledCount: cancelled.length,
      totalCount: relevant.length,
    };
  }, [stockTransfers, branchViewOnlyId]);

  // Handle Add Item Row in Create Modal
  const handleAddItemRow = () => {
    const availableProduct =
      products.find((p) => !itemRows.some((r) => r.productId === p.id)) || products[0];
    if (availableProduct) {
      setItemRows([...itemRows, { productId: availableProduct.id, quantity: 1 }]);
    }
  };

  // Handle Remove Item Row
  const handleRemoveItemRow = (idx: number) => {
    if (itemRows.length > 1) {
      setItemRows(itemRows.filter((_, i) => i !== idx));
    }
  };

  // Handle Item Row Change
  const handleItemRowChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...itemRows];
    if (field === 'productId') {
      updated[index].productId = value;
      // Auto-set quantity to 1
      updated[index].quantity = 1;
    } else if (field === 'quantity') {
      updated[index].quantity = Math.max(1, Number(value) || 1);
    }
    setItemRows(updated);
  };

  // Handle Submit New Transfer
  const handleSubmitCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (sourceBranchId === destinationBranchId) {
      setFormError('Source and Destination branches must be different locations.');
      return;
    }

    if (itemRows.length === 0) {
      setFormError('Please add at least one product to transfer.');
      return;
    }

    // Check stock availability for all items
    for (const row of itemRows) {
      const avail = getSourceAvailableStock(sourceBranchId, row.productId);
      const prod = products.find((p) => p.id === row.productId);
      if (row.quantity <= 0) {
        setFormError(`Transfer quantity for ${prod?.name || 'product'} must be greater than 0.`);
        return;
      }
      if (row.quantity > avail) {
        setFormError(
          `Insufficient stock for "${prod?.name}". Available on site: ${avail} units, Requested: ${row.quantity} units.`
        );
        return;
      }
    }

    const res = createStockTransfer({
      sourceBranchId,
      destinationBranchId,
      transferDate,
      dispatchedBy,
      driverOrCourierName: driverName.trim() || undefined,
      vehicleRegNo: vehicleRegNo.trim() || undefined,
      waybillOrRefNo: waybillNo.trim() || undefined,
      notes: transferNotes.trim() || undefined,
      items: itemRows.map((r) => ({
        productId: r.productId,
        quantity: r.quantity,
      })),
    });

    if (res.success) {
      setShowCreateModal(false);
      resetCreateForm();
    } else {
      setFormError(res.message);
    }
  };

  // Handle Submit Receive Transfer
  const handleSubmitReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferForReceive) return;

    const itemReceipts = selectedTransferForReceive.items.map((item) => {
      const entry = receiptItemQuantities[item.productId] || {
        received: item.quantity,
        damaged: 0,
        missing: 0,
      };
      return {
        productId: item.productId,
        receivedQty: entry.received,
        damagedQty: entry.damaged,
        missingQty: entry.missing,
      };
    });

    const res = receiveStockTransfer(selectedTransferForReceive.id, {
      receivedBy: receivedByName.trim() || 'Branch Receiving Team',
      receivingNotes: receivingNotes.trim() || undefined,
      itemReceipts,
    });

    if (res.success) {
      setSelectedTransferForReceive(null);
    } else {
      alert(res.message);
    }
  };

  // Handle Submit Cancel Transfer
  const handleSubmitCancel = () => {
    if (!selectedTransferForCancel) return;
    const res = cancelStockTransfer(selectedTransferForCancel.id, cancelReason);
    if (res.success) {
      setSelectedTransferForCancel(null);
      setCancelReason('');
    } else {
      alert(res.message);
    }
  };

  // Export Transfers CSV
  const handleExportCsv = () => {
    const csvContent = generateStockTransfersCsv(filteredTransfers);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`stock_transfers_log_${dateStr}.csv`, csvContent);
  };

  // Calculations for current creation modal
  const createModalTotals = useMemo(() => {
    let totalQty = 0;
    let totalValuation = 0;
    let totalVolume = 0;

    itemRows.forEach((r) => {
      const prod = products.find((p) => p.id === r.productId);
      if (prod) {
        totalQty += r.quantity;
        totalValuation += r.quantity * (prod.costPrice || 0);
        totalVolume += r.quantity * (prod.volumeLitersOrKg || 1);
      }
    });

    return { totalQty, totalValuation, totalVolume };
  }, [itemRows, products]);

  return (
    <div id="stock-transfers-section" className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inter-Branch Stock Transfers & Logistics
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Dispatch, track in-transit consignments, and verify physical delivery between branch sites.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="export-transfers-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Log (.CSV)
          </button>

          <button
            id="dispatch-stock-transfer-btn"
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Stock Dispatch
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* IN TRANSIT */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              In Transit
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{metrics.inTransitCount}</div>
            <div className="text-xs text-amber-800 mt-0.5 font-medium">
              {metrics.inTransitQty.toLocaleString()} units on the road
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Valuation: <strong className="text-slate-800">K{metrics.inTransitValuation.toLocaleString()}</strong>
          </div>
        </div>

        {/* COMPLETED TRANSFERS */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Completed / Received
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{metrics.receivedCount}</div>
            <div className="text-xs text-emerald-700 mt-0.5 font-medium">
              Transfers verified on site
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Received Valuation: <strong className="text-slate-800">K{metrics.totalReceivedValuation.toLocaleString()}</strong>
          </div>
        </div>

        {/* TOTAL CONSIGNMENTS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Total Logged
            </span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{metrics.totalCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Consignments across all branches
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Cancelled / Diverted: <strong className="text-slate-700">{metrics.cancelledCount}</strong>
          </div>
        </div>

        {/* ACTIVE NETWORK BRANCHES */}
        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Active Logistics Network
            </span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{branches.length}</div>
            <div className="text-xs text-indigo-700 mt-0.5 font-medium">
              Inter-connected branch depots
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
            Catalog Products: <strong className="text-slate-800">{products.length} SKUs</strong>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Transfers', count: stockTransfers.length },
              { id: 'IN_TRANSIT', label: 'In Transit', count: metrics.inTransitCount, badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'RECEIVED', label: 'Received', count: metrics.receivedCount, badgeColor: 'bg-emerald-100 text-emerald-800' },
              { id: 'CANCELLED', label: 'Cancelled', count: metrics.cancelledCount, badgeColor: 'bg-rose-100 text-rose-800' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      active ? 'bg-blue-800 text-blue-100' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transfer #, driver, waybill, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Branch Filters */}
        {!branchViewOnlyId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Source Branch (Dispatched From)</label>
              <select
                value={sourceBranchFilter}
                onChange={(e) => setSourceBranchFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Source Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Destination Branch (Receiving At)</label>
              <select
                value={destinationBranchFilter}
                onChange={(e) => setDestinationBranchFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Destination Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TRANSFERS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTransfers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 bg-slate-100 rounded-full text-slate-400 mb-3">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No stock transfers found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter to see transfer records.'
                : 'Initiate a new stock transfer to move lubricants or LPG inventory from one branch to another.'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Dispatch First Consignment
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transfer # & Date</th>
                  <th className="py-3 px-4">Logistics Route</th>
                  <th className="py-3 px-4">Dispatched Items</th>
                  <th className="py-3 px-4 text-right">Total Qty & Valuation</th>
                  <th className="py-3 px-4">Courier / Waybill</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransfers.map((transfer) => {
                  const isInTransit = transfer.status === 'IN_TRANSIT';
                  const isReceived = transfer.status === 'RECEIVED';
                  const isCancelled = transfer.status === 'CANCELLED';

                  return (
                    <tr key={transfer.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* TRANSFER # & DATE */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{transfer.transferNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {transfer.transferDate}
                        </div>
                      </td>

                      {/* ROUTE */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {transfer.sourceBranchName}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                            {transfer.destinationBranchName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Dispatched by: <span className="text-slate-600">{transfer.dispatchedBy}</span>
                        </div>
                      </td>

                      {/* ITEMS */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {transfer.items.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-slate-800">
                              <span className="font-semibold text-blue-700">{item.quantity}x</span>
                              <span className="truncate max-w-[180px]">{item.productName}</span>
                            </div>
                          ))}
                          {transfer.items.length > 2 && (
                            <div className="text-[10px] text-slate-500 font-medium italic">
                              +{transfer.items.length - 2} more item(s)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* TOTAL QTY & VALUATION */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {transfer.totalQuantity.toLocaleString()} Units
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700">
                          K{transfer.totalValuation.toLocaleString()}
                        </div>
                        {transfer.totalVolumeLitersOrKg > 0 && (
                          <div className="text-[10px] text-slate-400">
                            {transfer.totalVolumeLitersOrKg.toFixed(1)} L/Kg total
                          </div>
                        )}
                      </td>

                      {/* COURIER / WAYBILL */}
                      <td className="py-3.5 px-4">
                        {transfer.driverOrCourierName || transfer.waybillOrRefNo ? (
                          <div className="space-y-0.5">
                            {transfer.driverOrCourierName && (
                              <div className="font-medium text-slate-800 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {transfer.driverOrCourierName}
                              </div>
                            )}
                            {transfer.vehicleRegNo && (
                              <div className="text-[10px] text-slate-500">
                                Reg: <span className="font-mono text-slate-700">{transfer.vehicleRegNo}</span>
                              </div>
                            )}
                            {transfer.waybillOrRefNo && (
                              <div className="text-[10px] text-blue-600 font-mono">
                                WB #{transfer.waybillOrRefNo}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Self-transport</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 text-center">
                        {isInTransit && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" />
                            In Transit
                          </span>
                        )}
                        {isReceived && (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Received
                            </span>
                            {transfer.receivedBy && (
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                By {transfer.receivedBy}
                              </span>
                            )}
                          </div>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* RECEIVE BUTTON (If in transit) */}
                          {isInTransit && (
                            <button
                              id={`receive-transfer-btn-${transfer.id}`}
                              onClick={() => handleOpenReceiveModal(transfer)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
                              title="Confirm Physical Stock Receipt at Destination"
                            >
                              Receive Stock
                            </button>
                          )}

                          {/* VIEW WAYBILL */}
                          <button
                            id={`view-waybill-btn-${transfer.id}`}
                            onClick={() => setSelectedTransferForView(transfer)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="View / Print Consignment Note & Waybill"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* CANCEL BUTTON (If in transit and user has permission) */}
                          {isInTransit && (
                            <button
                              id={`cancel-transfer-btn-${transfer.id}`}
                              onClick={() => {
                                setSelectedTransferForCancel(transfer);
                                setCancelReason('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Cancel Transfer & Return Stock to Source"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* DELETE BUTTON (For Owner or clean up) */}
                          {role === 'OWNER' && (
                            <button
                              id={`delete-transfer-btn-${transfer.id}`}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to permanently delete transfer record ${transfer.transferNumber}?`
                                  )
                                ) {
                                  deleteStockTransfer(transfer.id, false);
                                }
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Transfer Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW INTER-BRANCH STOCK DISPATCH                                   */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatch Inter-Branch Stock Consignment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deducts inventory from source branch immediately and sets status to In Transit.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateTransfer} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ROUTE SELECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Source Branch (Dispatching From) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sourceBranchId}
                    onChange={(e) => {
                      setSourceBranchId(e.target.value);
                      if (e.target.value === destinationBranchId) {
                        const alt = branches.find((b) => b.id !== e.target.value);
                        if (alt) setDestinationBranchId(alt.id);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) - {b.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination Branch (Receiving At) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={destinationBranchId}
                    onChange={(e) => setDestinationBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {branches
                      .filter((b) => b.id !== sourceBranchId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) - {b.location}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* DISPATCH METADATA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transfer Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dispatched By (Officer Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lubes Champion / Dispenser"
                    value={dispatchedBy}
                    onChange={(e) => setDispatchedBy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Waybill / Consignment Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WB-9921"
                    value={waybillNo}
                    onChange={(e) => setWaybillNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* TRANSPORTER LOGISTICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Driver / Transporter Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kelvin Phiri (Direct Freight)"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vehicle Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BAF 4402 ZM / Canter Truck"
                    value={vehicleRegNo}
                    onChange={(e) => setVehicleRegNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* LINE ITEMS TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Consignment Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product Description</th>
                        <th className="py-2.5 px-3 text-center">Available on Site</th>
                        <th className="py-2.5 px-3 text-center w-28">Quantity to Move</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Line Valuation</th>
                        <th className="py-2.5 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemRows.map((row, idx) => {
                        const selectedProduct = products.find((p) => p.id === row.productId);
                        const available = getSourceAvailableStock(sourceBranchId, row.productId);
                        const unitCost = selectedProduct?.costPrice || 0;
                        const lineValuation = row.quantity * unitCost;
                        const isOverStock = row.quantity > available;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            {/* PRODUCT SELECTOR */}
                            <td className="p-2.5">
                              <select
                                value={row.productId}
                                onChange={(e) => handleItemRowChange(idx, 'productId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                              >
                                {products.map((p) => {
                                  const stockOnHand = getSourceAvailableStock(sourceBranchId, p.id);
                                  return (
                                    <option key={p.id} value={p.id}>
                                      {p.code} - {p.name} ({p.unit}) [Stock: {stockOnHand}]
                                    </option>
                                  );
                                })}
                              </select>
                            </td>

                            {/* AVAILABLE STOCK */}
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                                  available > 0
                                    ? 'bg-slate-100 text-slate-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {available} units
                              </span>
                            </td>

                            {/* QUANTITY INPUT */}
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="1"
                                max={available > 0 ? available : 9999}
                                value={row.quantity}
                                onChange={(e) => handleItemRowChange(idx, 'quantity', e.target.value)}
                                className={`w-24 px-2 py-1.5 text-center font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                  isOverStock
                                    ? 'bg-rose-50 border-rose-400 text-rose-700'
                                    : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </td>

                            {/* UNIT COST */}
                            <td className="p-2.5 text-right font-medium text-slate-600">
                              K{unitCost.toLocaleString()}
                            </td>

                            {/* LINE VALUATION */}
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              K{lineValuation.toLocaleString()}
                            </td>

                            {/* REMOVE BUTTON */}
                            <td className="p-2.5 text-center">
                              {itemRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* TOTALS SUMMARY BAR */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-4 text-slate-600">
                    <span>
                      Items Count: <strong className="text-slate-900">{itemRows.length}</strong>
                    </span>
                    <span>
                      Physical Volume:{' '}
                      <strong className="text-slate-900">{createModalTotals.totalVolume.toFixed(1)} L/Kg</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600">
                      Total Units: <strong className="text-slate-900 text-sm">{createModalTotals.totalQty}</strong>
                    </span>
                    <span className="text-slate-600">
                      Total Valuation:{' '}
                      <strong className="text-emerald-700 text-sm">
                        K{createModalTotals.totalValuation.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Instructions / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Urgent stock replenishment for weekend demand. All drums verified sealed."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm & Dispatch Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM PHYSICAL STOCK RECEIPT AT DESTINATION                      */}
      {/* ========================================================================= */}
      {selectedTransferForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Verify & Receive Stock Consignment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer #{selectedTransferForReceive.transferNumber} &bull; Destination:{' '}
                    <strong>{selectedTransferForReceive.destinationBranchName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransferForReceive(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceive} className="p-6 space-y-5">
              {/* ROUTE SUMMARY BANNER */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500">Dispatched From:</span>{' '}
                  <strong>{selectedTransferForReceive.sourceBranchName}</strong>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500">Receiving Site:</span>{' '}
                  <strong className="text-emerald-700">
                    {selectedTransferForReceive.destinationBranchName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Dispatched Date:</span>{' '}
                  <strong>{selectedTransferForReceive.transferDate}</strong>
                </div>
              </div>

              {/* RECEIVER INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Received By (Staff / Manager Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receivedByName}
                    onChange={(e) => setReceivedByName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Condition / Receiving Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. All cans received intact, seals verified"
                    value={receivingNotes}
                    onChange={(e) => setReceivingNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* ITEMS VERIFICATION TABLE */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Physical Stock Count Verification
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product Description</th>
                        <th className="py-2.5 px-3 text-center">Dispatched</th>
                        <th className="py-2.5 px-3 text-center w-28">Good Qty Received</th>
                        <th className="py-2.5 px-3 text-center w-24">Damaged / Leaking</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTransferForReceive.items.map((item) => {
                        const receipt = receiptItemQuantities[item.productId] || {
                          received: item.quantity,
                          damaged: 0,
                          missing: 0,
                        };

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50/60">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{item.productName}</div>
                              <div className="text-[10px] text-slate-500">
                                SKU: {item.productCode} &bull; {item.unit}
                              </div>
                            </td>

                            <td className="p-2.5 text-center font-bold text-slate-800">
                              {item.quantity}
                            </td>

                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={receipt.received}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setReceiptItemQuantities({
                                    ...receiptItemQuantities,
                                    [item.productId]: {
                                      ...receipt,
                                      received: val,
                                      missing: Math.max(0, item.quantity - val - receipt.damaged),
                                    },
                                  });
                                }}
                                className="w-24 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded-lg text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>

                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                value={receipt.damaged}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setReceiptItemQuantities({
                                    ...receiptItemQuantities,
                                    [item.productId]: {
                                      ...receipt,
                                      damaged: val,
                                    },
                                  });
                                }}
                                className="w-20 px-2 py-1 text-center font-semibold bg-white border border-slate-300 rounded-lg text-rose-600 focus:ring-2 focus:ring-rose-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTransferForReceive(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Stock Receipt & Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINTABLE CONSIGNMENT NOTE & WAYBILL                              */}
      {/* ========================================================================= */}
      {selectedTransferForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 print:shadow-none print:border-none">
            <div className="flex items-center justify-between p-4 bg-slate-100 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Inter-Branch Transfer Note #{selectedTransferForView.transferNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Note
                </button>
                <button
                  onClick={() => setSelectedTransferForView(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOCUMENT PRINT BODY */}
            <div className="p-8 space-y-6 text-slate-800 text-xs">
              {/* HEADER */}
              <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    LUBRICANTS & LPG ENTERPRISE
                  </h2>
                  <p className="text-slate-600 font-medium mt-0.5">
                    Official Inter-Branch Stock Transfer & Consignment Waybill
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Republic of Zambia &bull; Energy & Lubricant Logistics
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-bold text-blue-900">
                    {selectedTransferForView.transferNumber}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Date: <strong>{selectedTransferForView.transferDate}</strong>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                        selectedTransferForView.status === 'RECEIVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedTransferForView.status === 'IN_TRANSIT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Status: {selectedTransferForView.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ROUTE & LOGISTICS GRID */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Dispatched From (Source)
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedTransferForView.sourceBranchName}
                  </div>
                  <div className="text-slate-600">Branch Code: {selectedTransferForView.sourceBranchCode}</div>
                  <div className="text-slate-600">Dispatched by: {selectedTransferForView.dispatchedBy}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Consigned To (Destination)
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedTransferForView.destinationBranchName}
                  </div>
                  <div className="text-slate-600">Branch Code: {selectedTransferForView.destinationBranchCode}</div>
                  {selectedTransferForView.receivedBy && (
                    <div className="text-emerald-800 font-semibold">
                      Received by: {selectedTransferForView.receivedBy}
                    </div>
                  )}
                </div>
              </div>

              {/* TRANSPORTER DETAILS */}
              {(selectedTransferForView.driverOrCourierName ||
                selectedTransferForView.vehicleRegNo ||
                selectedTransferForView.waybillOrRefNo) && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Driver / Transporter:</span>
                    <strong className="text-slate-900">
                      {selectedTransferForView.driverOrCourierName || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Vehicle Reg No:</span>
                    <strong className="text-slate-900">
                      {selectedTransferForView.vehicleRegNo || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Waybill / Ref No:</span>
                    <strong className="text-slate-900 font-mono">
                      {selectedTransferForView.waybillOrRefNo || 'N/A'}
                    </strong>
                  </div>
                </div>
              )}

              {/* ITEMS TABLE */}
              <div>
                <table className="w-full border border-slate-300 text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-left border-r border-slate-300">#</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">SKU / Code</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">Product Description</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300">Packaging Unit</th>
                      <th className="py-2 px-3 text-center border-r border-slate-300">Qty Dispatched</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300">Unit Cost (ZMW)</th>
                      <th className="py-2 px-3 text-right">Total Valuation (ZMW)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedTransferForView.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold">
                          {item.productCode}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-medium">
                          {item.productName}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-600">
                          {item.unit}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                          K{item.unitCost.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          K{item.totalCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">
                        TOTAL CONSIGNMENT:
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-900 font-black">
                        {selectedTransferForView.totalQuantity} Units
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {selectedTransferForView.totalVolumeLitersOrKg.toFixed(1)} L/Kg
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-800 font-black">
                        K{selectedTransferForView.totalValuation.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* REMARKS */}
              {selectedTransferForView.notes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-700">Remarks:</span> {selectedTransferForView.notes}
                </div>
              )}

              {/* SIGNATURES */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-center text-[11px]">
                <div className="space-y-4">
                  <div className="border-b border-slate-400 h-10"></div>
                  <div>
                    <strong>Dispatched By (Source)</strong>
                    <div className="text-slate-500">{selectedTransferForView.dispatchedBy}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-400 h-10"></div>
                  <div>
                    <strong>Driver / Courier Handover</strong>
                    <div className="text-slate-500">
                      {selectedTransferForView.driverOrCourierName || 'Transporter Signature'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-400 h-10"></div>
                  <div>
                    <strong>Received & Verified (Destination)</strong>
                    <div className="text-slate-500">
                      {selectedTransferForView.receivedBy || 'Pending Receipt'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CANCEL TRANSFER CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {selectedTransferForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Stock Transfer?</h3>
                <p className="text-xs text-slate-500">Transfer #{selectedTransferForCancel.transferNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling this transfer will immediately refund all{' '}
              <strong>{selectedTransferForCancel.totalQuantity} units</strong> back to the source branch inventory (
              <strong>{selectedTransferForCancel.sourceBranchName}</strong>).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vehicle breakdown / Driver diverted"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTransferForCancel(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Keep In Transit
              </button>
              <button
                type="button"
                onClick={handleSubmitCancel}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Cancellation & Return Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
