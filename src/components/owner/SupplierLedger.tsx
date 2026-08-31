import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, SupplierTransaction, SupplierItemEntry } from '../../types';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  DollarSign,
  AlertTriangle,
  Receipt,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
} from 'lucide-react';
import { SupplierInvoiceEditModal } from './SupplierInvoiceEditModal';

export const SupplierLedger: React.FC = () => {
  const {
    suppliers,
    supplierTransactions,
    branches,
    products,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierTransaction,
    updateSupplierTransaction,
    deleteSupplierTransaction,
    getSupplierBalance,
  } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<SupplierTransaction | null>(null);
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Record<string, boolean>>({});
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Supplier Form State
  const [newSupplierData, setNewSupplierData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'LUBRICANTS' as 'LUBRICANTS' | 'LPG' | 'BOTH' | 'EQUIPMENT',
    paymentTermsDays: 30,
    taxNumber: '',
  });

  // Edit Supplier Form State
  const [editSupplierData, setEditSupplierData] = useState<Partial<Supplier>>({});

  // New Invoice Form State
  const [newInvoiceData, setNewInvoiceData] = useState<{
    supplierId: string;
    branchId: string;
    referenceNo: string;
    date: string;
    dueDate: string;
    amount: number;
    notes: string;
    autoReplenishStock: boolean;
    items: { productId: string; quantity: number; unitCost: number }[];
  }>({
    supplierId: suppliers[0]?.id || '',
    branchId: branches[0]?.id || '',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: 0,
    notes: '',
    autoReplenishStock: true,
    items: [],
  });

  // New Payment Form State
  const [newPaymentData, setNewPaymentData] = useState<{
    supplierId: string;
    branchId: string;
    referenceNo: string;
    date: string;
    amount: number;
    paymentMethod: 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque';
    paymentRef: string;
    allocatedInvoiceId: string;
    notes: string;
  }>({
    supplierId: suppliers[0]?.id || '',
    branchId: branches[0]?.id || '',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'Bank Transfer',
    paymentRef: '',
    allocatedInvoiceId: '',
    notes: '',
  });

  // Edit Transaction Form State
  const [editTxData, setEditTxData] = useState<Partial<SupplierTransaction>>({});

  // Current active supplier object if an individual account is selected
  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  // Filter transactions
  const filteredTransactions = supplierTransactions.filter((tx) => {
    if (selectedSupplierId !== 'ALL' && tx.supplierId !== selectedSupplierId) {
      return false;
    }
    return true;
  });

  // Overall Payables Across All Separate Supplier Accounts
  let overallInvoiced = 0;
  let overallPaid = 0;
  supplierTransactions.forEach((tx) => {
    if (tx.type === 'INVOICE') overallInvoiced += tx.amount;
    if (tx.type === 'PAYMENT') overallPaid += tx.amount;
    if (tx.type === 'CREDIT_NOTE') overallInvoiced -= tx.amount;
  });
  
  // Total sum of all separate supplier balances (Tallies with Business Net Value)
  const totalAmountOwedToSuppliers = suppliers.reduce((sum, s) => {
    const bal = getSupplierBalance(s.id);
    return sum + Math.max(0, bal.balanceDue);
  }, 0);

  // Handlers
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierData.name.trim() || !newSupplierData.code.trim()) {
      setNotification({ type: 'error', message: 'Supplier name and code are required.' });
      return;
    }

    const created = addSupplier({
      name: newSupplierData.name.trim(),
      code: newSupplierData.code.toUpperCase().trim(),
      contactPerson: newSupplierData.contactPerson.trim(),
      phone: newSupplierData.phone.trim(),
      email: newSupplierData.email.trim(),
      address: newSupplierData.address.trim(),
      category: newSupplierData.category,
      paymentTermsDays: Number(newSupplierData.paymentTermsDays) || 30,
      taxNumber: newSupplierData.taxNumber.trim(),
    });

    setIsAddingSupplier(false);
    setSelectedSupplierId(created.id); // Switch directly to newly created account
    setNewSupplierData({
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      category: 'LUBRICANTS',
      paymentTermsDays: 30,
      taxNumber: '',
    });
    setNotification({ type: 'success', message: `Supplier account for "${created.name}" created successfully!` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePromptDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDeleteSupplier = () => {
    if (!supplierToDelete) return;
    const result = deleteSupplier(supplierToDelete.id);
    if (!result.success) {
      setNotification({
        type: 'error',
        message: result.message || 'Cannot delete supplier account with active transaction history.',
      });
      setTimeout(() => setNotification(null), 6000);
    } else {
      if (selectedSupplierId === supplierToDelete.id) {
        setSelectedSupplierId('ALL');
      }
      setNotification({
        type: 'success',
        message: `Supplier account "${supplierToDelete.name}" was successfully deleted.`,
      });
      setTimeout(() => setNotification(null), 3000);
    }
    setSupplierToDelete(null);
  };

  const handleStartEditSupplier = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setEditSupplierData({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      category: supplier.category,
      paymentTermsDays: supplier.paymentTermsDays,
      taxNumber: supplier.taxNumber,
    });
  };

  const handleSaveEditSupplier = (supplierId: string) => {
    if (!editSupplierData.name?.trim()) {
      setNotification({ type: 'error', message: 'Supplier name cannot be empty.' });
      return;
    }
    updateSupplier(supplierId, editSupplierData);
    setEditingSupplierId(null);
    setNotification({ type: 'success', message: 'Supplier account details updated.' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Item line to New Invoice
  const handleAddInvoiceItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    setNewInvoiceData({
      ...newInvoiceData,
      items: [
        ...newInvoiceData.items,
        { productId: defaultProd.id, quantity: 10, unitCost: defaultProd.costPrice },
      ],
    });
  };

  const handleInvoiceItemChange = (index: number, field: string, value: any) => {
    const updated = [...newInvoiceData.items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        unitCost: prod ? prod.costPrice : updated[index].unitCost,
      };
    } else if (field === 'quantity') {
      updated[index] = {
        ...updated[index],
        quantity: value === '' ? 0 : parseInt(value, 10) || 0,
      };
    } else if (field === 'unitCost') {
      updated[index] = {
        ...updated[index],
        unitCost: value === '' ? 0 : parseFloat(value) || 0,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(value) || 0,
      };
    }

    // Recalculate total invoice amount
    const total = updated.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);

    setNewInvoiceData({
      ...newInvoiceData,
      items: updated,
      amount: total,
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    const updated = newInvoiceData.items.filter((_, i) => i !== index);
    const total = updated.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    setNewInvoiceData({ ...newInvoiceData, items: updated, amount: total });
  };

  const handleOpenAddInvoice = (preSelectedSupplierId?: string) => {
    const targetSuppId = preSelectedSupplierId || (selectedSupplierId !== 'ALL' ? selectedSupplierId : suppliers[0]?.id || '');
    setNewInvoiceData({
      supplierId: targetSuppId,
      branchId: branches[0]?.id || '',
      referenceNo: `INV-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: 0,
      notes: '',
      autoReplenishStock: true,
      items: [],
    });
    setIsAddingInvoice(true);
  };

  const handleOpenAddPayment = (preSelectedSupplierId?: string) => {
    const targetSuppId = preSelectedSupplierId || (selectedSupplierId !== 'ALL' ? selectedSupplierId : suppliers[0]?.id || '');
    setNewPaymentData({
      supplierId: targetSuppId,
      branchId: branches[0]?.id || '',
      referenceNo: `PAY-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'Bank Transfer',
      paymentRef: '',
      allocatedInvoiceId: '',
      notes: '',
    });
    setIsAddingPayment(true);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find((s) => s.id === newInvoiceData.supplierId);
    const branch = branches.find((b) => b.id === newInvoiceData.branchId);
    if (!supp) return;

    if (!newInvoiceData.referenceNo.trim()) {
      setNotification({ type: 'error', message: 'Invoice number is required.' });
      return;
    }
    if (newInvoiceData.amount <= 0) {
      setNotification({ type: 'error', message: 'Invoice amount must be greater than zero.' });
      return;
    }

    const itemEntries: SupplierItemEntry[] = newInvoiceData.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Item',
        productCode: prod ? prod.code : 'SKU',
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
      };
    });

    addSupplierTransaction(
      {
        supplierId: supp.id,
        supplierName: supp.name,
        branchId: branch?.id,
        branchName: branch?.name,
        type: 'INVOICE',
        referenceNo: newInvoiceData.referenceNo.trim(),
        date: newInvoiceData.date,
        dueDate: newInvoiceData.dueDate || undefined,
        amount: Number(newInvoiceData.amount),
        items: itemEntries,
        notes: newInvoiceData.notes.trim(),
        status: 'PENDING',
      },
      newInvoiceData.autoReplenishStock
    );

    setIsAddingInvoice(false);
    setNotification({
      type: 'success',
      message: `Invoice ${newInvoiceData.referenceNo} posted to ${supp.name}'s account. ${
        newInvoiceData.autoReplenishStock ? 'Branch stock replenished automatically!' : ''
      }`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find((s) => s.id === newPaymentData.supplierId);
    const branch = branches.find((b) => b.id === newPaymentData.branchId);
    if (!supp) return;

    if (!newPaymentData.referenceNo.trim()) {
      setNotification({ type: 'error', message: 'Payment receipt / reference number is required.' });
      return;
    }
    if (newPaymentData.amount <= 0) {
      setNotification({ type: 'error', message: 'Payment amount must be greater than zero.' });
      return;
    }

    addSupplierTransaction({
      supplierId: supp.id,
      supplierName: supp.name,
      branchId: branch?.id,
      branchName: branch?.name,
      type: 'PAYMENT',
      referenceNo: newPaymentData.referenceNo.trim(),
      date: newPaymentData.date,
      amount: Number(newPaymentData.amount),
      paymentMethod: newPaymentData.paymentMethod,
      paymentRef: newPaymentData.paymentRef.trim() || newPaymentData.referenceNo.trim(),
      allocatedInvoiceId: newPaymentData.allocatedInvoiceId || undefined,
      notes: newPaymentData.notes.trim(),
      status: 'PAID',
    });

    setIsAddingPayment(false);
    setNotification({
      type: 'success',
      message: `Payment of K${newPaymentData.amount.toLocaleString()} posted to ${supp.name}'s account via ${newPaymentData.paymentMethod}.`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleStartEditTx = (tx: SupplierTransaction) => {
    setEditingTransactionId(tx.id);
    setEditTxData({
      referenceNo: tx.referenceNo,
      date: tx.date,
      dueDate: tx.dueDate,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      paymentRef: tx.paymentRef,
      notes: tx.notes,
      status: tx.status,
    });
  };

  const handleSaveEditTx = (txId: string) => {
    if (!editTxData.referenceNo?.trim()) {
      setNotification({ type: 'error', message: 'Reference number cannot be empty.' });
      return;
    }
    updateSupplierTransaction(txId, {
      referenceNo: editTxData.referenceNo.trim(),
      date: editTxData.date,
      dueDate: editTxData.dueDate,
      amount: Number(editTxData.amount) || 0,
      paymentMethod: editTxData.paymentMethod,
      paymentRef: editTxData.paymentRef?.trim(),
      notes: editTxData.notes?.trim(),
      status: editTxData.status,
    });
    setEditingTransactionId(null);
    setNotification({ type: 'success', message: 'Transaction entry updated successfully.' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Supplier Procurement &amp; Accounts Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Supplier Accounts &amp; Payables
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Keep each supplier account strictly separate, record purchase invoices with auto-stock replenishment, settle payments, and track total payables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-add-supplier-modal"
            onClick={() => setIsAddingSupplier(true)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition border border-stone-300"
          >
            <Plus className="w-4 h-4 text-stone-600" />
            <span>+ New Supplier</span>
          </button>
          <button
            id="btn-record-invoice-modal"
            onClick={() => handleOpenAddInvoice()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>+ Purchase Invoice</span>
          </button>
          <button
            id="btn-record-payment-modal"
            onClick={() => handleOpenAddPayment()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-xs"
          >
            <DollarSign className="w-4 h-4" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards (Tallies with Business Net Value) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Total Invoices Recorded
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1 font-mono">
            K{overallInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">Purchases of Lubes &amp; LPG across all sites</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Total Payments Settled
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            K{overallPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">Paid via Bank, Airtel Money &amp; Cash</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
            <span>Amount Owed to Suppliers</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">Net Value Credit</span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
            K{totalAmountOwedToSuppliers.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Tallies exactly with Business Net Value across {suppliers.length} accounts
          </div>
        </div>
      </div>

      {/* SEPARATE SUPPLIER ACCOUNTS SELECTOR TAB BAR */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-stone-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Supplier Accounts Navigator
            </span>
          </div>
          <span className="text-xs text-stone-400 font-medium">
            Each supplier account is maintained separately
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-all-suppliers"
            onClick={() => setSelectedSupplierId('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              selectedSupplierId === 'ALL'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>All Supplier Accounts (Consolidated)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedSupplierId === 'ALL' ? 'bg-stone-700 text-stone-100' : 'bg-stone-200 text-stone-700'
            }`}>
              {suppliers.length}
            </span>
          </button>

          {suppliers.map((s) => {
            const bal = getSupplierBalance(s.id);
            const isSelected = selectedSupplierId === s.id;
            return (
              <button
                key={s.id}
                id={`tab-supplier-${s.id}`}
                onClick={() => setSelectedSupplierId(s.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                }`}
              >
                <span>{s.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-amber-800 text-amber-100'
                      : bal.balanceDue > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  K{bal.balanceDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* INDIVIDUAL SUPPLIER ACCOUNT DETAIL VIEW (IF SPECIFIC SUPPLIER SELECTED) */}
      {activeSupplier && selectedSupplierId !== 'ALL' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Account Header Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white border-b border-stone-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                    {activeSupplier.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    activeSupplier.category === 'LUBRICANTS'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : activeSupplier.category === 'LPG'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {activeSupplier.category}
                  </span>
                  <span className="text-xs text-stone-400">Separate Supplier Account</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {activeSupplier.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-300">
                  {activeSupplier.contactPerson && (
                    <span>Contact: <strong className="text-white">{activeSupplier.contactPerson}</strong></span>
                  )}
                  {activeSupplier.phone && (
                    <span>Phone: <strong className="text-white font-mono">{activeSupplier.phone}</strong></span>
                  )}
                  {activeSupplier.email && (
                    <span>Email: <strong className="text-white">{activeSupplier.email}</strong></span>
                  )}
                  {activeSupplier.paymentTermsDays && (
                    <span>Terms: <strong className="text-amber-300">{activeSupplier.paymentTermsDays} Days</strong></span>
                  )}
                </div>
              </div>

              {/* Account Level Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenAddInvoice(activeSupplier.id)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>+ Invoice for {activeSupplier.code}</span>
                </button>
                <button
                  onClick={() => handleOpenAddPayment(activeSupplier.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>+ Settle Payment</span>
                </button>
                <button
                  onClick={() => handleStartEditSupplier(activeSupplier)}
                  className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  title="Edit Supplier Account Info"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Info</span>
                </button>
                <button
                  id={`btn-delete-account-${activeSupplier.id}`}
                  onClick={() => handlePromptDeleteSupplier(activeSupplier)}
                  className="px-3 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  title="Delete Supplier Account"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>

            {/* Individual Account Financial Metrics Bar */}
            {(() => {
              const bal = getSupplierBalance(activeSupplier.id);
              const txs = supplierTransactions.filter((t) => t.supplierId === activeSupplier.id);
              return (
                <div className="mt-5 pt-4 border-t border-stone-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700">
                    <span className="text-[11px] text-stone-400 block font-semibold">Total Invoiced</span>
                    <span className="text-lg font-bold font-mono text-white">
                      K{bal.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700">
                    <span className="text-[11px] text-stone-400 block font-semibold">Total Paid</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      K{bal.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700">
                    <span className="text-[11px] text-stone-400 block font-semibold">Current Balance Due</span>
                    <span className={`text-lg font-black font-mono ${bal.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      K{bal.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700">
                    <span className="text-[11px] text-stone-400 block font-semibold">Ledger History</span>
                    <span className="text-lg font-bold font-mono text-stone-200">
                      {txs.length} Entries
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ALL SUPPLIERS DIRECTORY CARDS (WHEN 'ALL' IS SELECTED) */}
      {selectedSupplierId === 'ALL' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-stone-700" />
              <h3 className="font-bold text-stone-900">
                Registered Supplier Accounts ({suppliers.length})
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              Click &quot;View Account&quot; on any supplier to isolate their ledger statement
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supp) => {
              const bal = getSupplierBalance(supp.id);
              const isEditing = editingSupplierId === supp.id;
              const txCount = supplierTransactions.filter((t) => t.supplierId === supp.id).length;

              return (
                <div
                  key={supp.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-stone-50 transition flex flex-col justify-between"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editSupplierData.name || ''}
                        onChange={(e) => setEditSupplierData({ ...editSupplierData, name: e.target.value })}
                        placeholder="Supplier Name"
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={editSupplierData.contactPerson || ''}
                        onChange={(e) => setEditSupplierData({ ...editSupplierData, contactPerson: e.target.value })}
                        placeholder="Contact Person"
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={editSupplierData.phone || ''}
                        onChange={(e) => setEditSupplierData({ ...editSupplierData, phone: e.target.value })}
                        placeholder="Phone Number"
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEditSupplier(supp.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSupplierId(null)}
                          className="px-3 py-1 border border-stone-300 rounded text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                            {supp.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              supp.category === 'LUBRICANTS'
                                ? 'bg-blue-100 text-blue-800'
                                : supp.category === 'LPG'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {supp.category}
                          </span>
                        </div>

                        <h4 className="font-bold text-stone-900 text-sm leading-snug">{supp.name}</h4>
                        <p className="text-xs text-stone-500">Contact: {supp.contactPerson || 'N/A'}</p>
                        <p className="text-xs text-stone-500 font-mono">{supp.phone || 'No phone'}</p>

                        <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                          <span className="text-stone-500">Balance Due:</span>
                          <span
                            className={`font-black font-mono ${
                              bal.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            K{bal.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-stone-200/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedSupplierId(supp.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition cursor-pointer"
                        >
                          View Account ({txCount} Txs)
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartEditSupplier(supp)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded transition cursor-pointer"
                            title="Edit Supplier Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePromptDeleteSupplier(supp)}
                            className={`p-1.5 rounded transition cursor-pointer ${
                              txCount > 0
                                ? 'text-stone-300 hover:text-stone-500'
                                : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              txCount > 0
                                ? `Has ${txCount} transactions (delete transactions first to remove account)`
                                : 'Delete Supplier Account'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Transaction Ledger Table (Isolated per Account or Consolidated) */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900">
              {selectedSupplierId === 'ALL'
                ? `Consolidated Supplier Transactions Ledger (${filteredTransactions.length} entries)`
                : `${activeSupplier?.name} - Statement of Account (${filteredTransactions.length} entries)`}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-500 font-semibold">Account:</span>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800"
            >
              <option value="ALL">All Supplier Accounts</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-stone-200">
          {filteredTransactions.map((tx) => {
            const isEditing = editingTransactionId === tx.id;
            const isInvoice = tx.type === 'INVOICE';
            const isExpanded = !!expandedInvoiceIds[tx.id];
            const hasItems = !!(tx.items && tx.items.length > 0);
            const totalUnits = (tx.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

            return (
              <div key={tx.id} className="p-4 sm:p-5 transition hover:bg-stone-50/60">
                {isEditing ? (
                  /* Quick Edit Mode for Payment */
                  <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <span className="text-xs font-bold text-amber-900 uppercase">
                        Editing {tx.type}: {tx.referenceNo}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingTransactionId(null)}
                          className="px-3 py-1 border border-stone-300 rounded text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditTx(tx.id)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold rounded text-xs cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Reference #
                        </label>
                        <input
                          type="text"
                          value={editTxData.referenceNo || ''}
                          onChange={(e) => setEditTxData({ ...editTxData, referenceNo: e.target.value })}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={editTxData.date || ''}
                          onChange={(e) => setEditTxData({ ...editTxData, date: e.target.value })}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Amount (K)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={editTxData.amount === 0 ? '' : editTxData.amount}
                          onChange={(e) => setEditTxData({ ...editTxData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Status
                        </label>
                        <select
                          value={editTxData.status || 'PAID'}
                          onChange={(e) => setEditTxData({ ...editTxData, status: e.target.value as any })}
                          className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs"
                        >
                          <option value="PAID">PAID</option>
                          <option value="PARTIAL">PARTIAL</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Remarks / Notes
                      </label>
                      <input
                        type="text"
                        value={editTxData.notes || ''}
                        onChange={(e) => setEditTxData({ ...editTxData, notes: e.target.value })}
                        className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  /* Display Transaction Row */
                  <div className="space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                              isInvoice
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            {tx.referenceNo}
                          </span>
                          <span className="text-xs text-stone-300">•</span>
                          <span className="font-bold text-stone-900 text-sm">
                            {tx.supplierName}
                          </span>
                          {tx.branchName && (
                            <span className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium border border-stone-200">
                              {tx.branchName}
                            </span>
                          )}
                          {isInvoice && (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <Package className="w-3 h-3 text-blue-600" />
                              <span>
                                {hasItems
                                  ? `${tx.items?.length} SKU${(tx.items?.length || 0) > 1 ? 's' : ''} (${totalUnits} pcs)`
                                  : 'No items attached'}
                              </span>
                            </span>
                          )}
                        </div>

                        {tx.notes && <p className="text-xs text-stone-600">{tx.notes}</p>}

                        <div className="flex flex-wrap items-center text-xs text-stone-400 gap-x-4 gap-y-1">
                          <span>Date: <strong className="text-stone-700">{tx.date}</strong></span>
                          {tx.dueDate && (
                            <span>Due: <strong className="text-amber-700">{tx.dueDate}</strong></span>
                          )}
                          {tx.paymentMethod && (
                            <span>Method: <strong className="text-stone-700">{tx.paymentMethod}</strong></span>
                          )}
                          {tx.paymentRef && (
                            <span>Ref: <strong className="font-mono text-stone-700">{tx.paymentRef}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-base sm:text-lg font-black ${
                              isInvoice ? 'text-blue-900' : 'text-emerald-700'
                            }`}
                          >
                            {isInvoice ? '+' : '-'}K
                            {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tx.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 border-l border-stone-200 pl-3">
                          {isInvoice ? (
                            <button
                              id={`btn-edit-supp-inv-${tx.id}`}
                              onClick={() => setEditingInvoice(tx)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
                              title="Edit Invoice Details & Products"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Edit Invoice &amp; Products</span>
                            </button>
                          ) : (
                            <button
                              id={`btn-edit-supp-tx-${tx.id}`}
                              onClick={() => handleStartEditTx(tx)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                              title="Edit Transaction Entry"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteSupplierTransaction(tx.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Product Line Items Drawer for Invoices */}
                    {isInvoice && hasItems && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedInvoiceIds((prev) => ({
                              ...prev,
                              [tx.id]: !prev[tx.id],
                            }))
                          }
                          className="text-[11px] font-bold text-stone-600 hover:text-blue-700 inline-flex items-center space-x-1 py-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                              <span>Hide Itemized Products ({tx.items?.length} SKUs)</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Itemized Products ({tx.items?.length} SKUs, {totalUnits} total units)</span>
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                            <div className="px-3 py-1.5 bg-stone-100/90 text-stone-700 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between border-b border-stone-200">
                              <span className="flex items-center space-x-1.5">
                                <Package className="w-3.5 h-3.5 text-blue-600" />
                                <span>Itemized Products &amp; Costs on Invoice {tx.referenceNo}</span>
                              </span>
                              <button
                                onClick={() => setEditingInvoice(tx)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              >
                                Edit Products &amp; Qty
                              </button>
                            </div>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold bg-stone-100/40">
                                  <th className="py-1.5 px-3">Product Name</th>
                                  <th className="py-1.5 px-3">SKU Code</th>
                                  <th className="py-1.5 px-3 text-right">Quantity</th>
                                  <th className="py-1.5 px-3 text-right">Unit Cost</th>
                                  <th className="py-1.5 px-3 text-right">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-200 bg-white">
                                {tx.items?.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-stone-50/50">
                                    <td className="py-2 px-3 font-semibold text-stone-900">
                                      {item.productName}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-stone-600 text-[11px]">
                                      {item.productCode}
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-stone-900">
                                      {item.quantity}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-stone-600">
                                      K{item.unitCost?.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-black text-stone-900 font-mono">
                                      K{(item.quantity * item.unitCost)?.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-500">
              No transactions recorded for this supplier account yet. Click &quot;+ Purchase Invoice&quot; or &quot;+ Record Payment&quot; above.
            </div>
          )}
        </div>
      </div>

      {/* Delete Supplier Confirmation / Warning Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            {(() => {
              const txs = supplierTransactions.filter((t) => t.supplierId === supplierToDelete.id);
              const hasTransactions = txs.length > 0;

              return (
                <div>
                  <div className={`px-6 py-4 text-white flex items-center justify-between ${
                    hasTransactions ? 'bg-amber-600' : 'bg-rose-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-base">
                        {hasTransactions ? 'Account Cannot Be Deleted' : 'Confirm Account Deletion'}
                      </h3>
                    </div>
                    <button onClick={() => setSupplierToDelete(null)} className="text-white/80 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 text-sm text-stone-700">
                    {hasTransactions ? (
                      <div className="space-y-3">
                        <p className="font-medium text-stone-900">
                          Supplier account <strong className="text-amber-900 font-bold">&quot;{supplierToDelete.name}&quot; ({supplierToDelete.code})</strong> has <strong className="text-rose-700 font-bold">{txs.length} transaction(s)</strong> on record.
                        </p>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                          <strong>Accounting Protection:</strong> Under financial safety rules, you cannot delete a supplier account with existing invoices or payments. To remove this supplier, you must first delete or void the {txs.length} transaction entries from their statement.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p>
                          Are you sure you want to delete supplier account <strong className="text-stone-900">&quot;{supplierToDelete.name}&quot; ({supplierToDelete.code})</strong>?
                        </p>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                          ✓ This supplier account has <strong>0 transactions</strong> and can be safely deleted.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end space-x-2">
                    <button
                      onClick={() => setSupplierToDelete(null)}
                      className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      {hasTransactions ? 'Close' : 'Cancel'}
                    </button>
                    {!hasTransactions && (
                      <button
                        onClick={handleConfirmDeleteSupplier}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
                      >
                        Delete Supplier Account
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Add New Supplier */}
      {isAddingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Register New Supplier</h3>
              </div>
              <button onClick={() => setIsAddingSupplier(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Supplier / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oryx Energies Zambia"
                    value={newSupplierData.name}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SUP-ORYX-01"
                    value={newSupplierData.code}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono uppercase text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Key Account Manager"
                    value={newSupplierData.contactPerson}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newSupplierData.category}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  >
                    <option value="LUBRICANTS">Lubricants / Motor Oils</option>
                    <option value="LPG">LPG Cooking Gas</option>
                    <option value="BOTH">Both Lubes &amp; LPG</option>
                    <option value="EQUIPMENT">Safety Equipment / Tanks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+260 211..."
                    value={newSupplierData.phone}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="orders@supplier.com"
                    value={newSupplierData.email}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    value={newSupplierData.paymentTermsDays}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Tax / TPIN Number
                  </label>
                  <input
                    type="text"
                    placeholder="100..."
                    value={newSupplierData.taxNumber}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, taxNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 shadow cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Purchase Invoice */}
      {isAddingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Record Supplier Purchase Invoice</h3>
              </div>
              <button onClick={() => setIsAddingInvoice(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 overflow-y-auto text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={newInvoiceData.supplierId}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-sm font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Destination Branch *
                  </label>
                  <select
                    value={newInvoiceData.branchId}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-sm"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Invoice # / Ref *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-99012"
                    value={newInvoiceData.referenceNo}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={newInvoiceData.date}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 uppercase">
                    Invoice Product Lines &amp; Quantities
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {newInvoiceData.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
                    <select
                      value={item.productId}
                      onChange={(e) => handleInvoiceItemChange(index, 'productId', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-stone-300 rounded bg-white text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>

                    <div className="w-20">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => handleInvoiceItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs text-right font-semibold"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={item.unitCost === 0 ? '' : item.unitCost}
                        onChange={(e) => handleInvoiceItemChange(index, 'unitCost', e.target.value)}
                        className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs text-right"
                      />
                    </div>

                    <div className="w-24 text-right text-xs font-bold text-stone-800">
                      K{((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveInvoiceItem(index)}
                      className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {newInvoiceData.items.length === 0 && (
                  <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 border border-dashed border-stone-300 rounded-lg">
                    No item lines added. Click &quot;Add Item&quot; or type total amount directly below.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Total Invoice Amount (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={newInvoiceData.amount === 0 ? '' : newInvoiceData.amount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-base font-black text-stone-900"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-auto-replenish"
                    checked={newInvoiceData.autoReplenishStock}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, autoReplenishStock: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="chk-auto-replenish" className="text-xs font-medium text-stone-700">
                    Automatically add item quantities to destination branch stock
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Delivery / Invoice Notes
                </label>
                <input
                  type="text"
                  placeholder="Delivery truck registration, driver name, batch number..."
                  value={newInvoiceData.notes}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddingInvoice(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Post Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier Payment */}
      {isAddingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Record Supplier Payment Settlement</h3>
              </div>
              <button onClick={() => setIsAddingPayment(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={newPaymentData.supplierId}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-sm font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={newPaymentData.paymentMethod}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-sm font-medium"
                  >
                    <option value="Airtel Money">Airtel Money (Auto-Logs to Ledger)</option>
                    <option value="Bank Transfer">Bank Transfer (EFT / RTGS)</option>
                    <option value="Cash">Cash Settlement</option>
                    <option value="Cheque">Cheque Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Amount Paid (K) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="0.00"
                    value={newPaymentData.amount === 0 ? '' : newPaymentData.amount}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-base font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={newPaymentData.date}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Payment Ref # / Tx ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AM-TX-88123 or FT2601..."
                    value={newPaymentData.referenceNo}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Allocated Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-TOT-9921"
                    value={newPaymentData.allocatedInvoiceId}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, allocatedInvoiceId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Payment Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Part payment for cylinder refill shipment..."
                  value={newPaymentData.notes}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddingPayment(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Purchase Invoice & Product Lines */}
      {editingInvoice && (
        <SupplierInvoiceEditModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSuccess={(msg) => {
            setNotification({ type: 'success', message: msg });
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}
    </div>
  );
};
