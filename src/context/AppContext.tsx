import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Branch,
  Product,
  BranchStock,
  DailySalesRecord,
  DailySalesPostingStatus,
  AirtelMoneyRecord,
  AirtelRecord,
  Debtor,
  DebtorTransaction,
  Supplier,
  SupplierTransaction,
  StockReconciliation,
  LowStockAlert,
  UserRole,
  BranchCashMovement,
  OwnerTreasury,
  CashMovementDestination,
  CashMovementStatus,
  BankRecord,
  CashRecord,
  StockTransfer,
  StockTransferItem,
  StockTransferStatus,
} from '../types';
import {
  INITIAL_BRANCHES,
  INITIAL_PRODUCTS,
  INITIAL_BRANCH_STOCK,
  INITIAL_DAILY_SALES,
  INITIAL_AIRTEL_MONEY_RECORDS,
  INITIAL_AIRTEL_RECORDS,
  INITIAL_DEBTORS,
  INITIAL_DEBTOR_TRANSACTIONS,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_TRANSACTIONS,
  INITIAL_STOCK_RECONCILIATIONS,
  INITIAL_CASH_MOVEMENTS,
  INITIAL_OWNER_TREASURY,
  INITIAL_BANK_RECORDS,
  INITIAL_CASH_RECORDS,
  INITIAL_STOCK_TRANSFERS,
} from '../data/initialData';
import { api } from '../lib/api';

interface AppContextType {
  // Auth & Portal State
  role: UserRole;
  currentBranchId: string | null;
  currentBranch: Branch | null;
  setRole: (role: UserRole, branchId?: string | null) => void;
  isAuthenticated: boolean;
  ownerPassword: string;
  setOwnerPassword: (newPassword: string) => void;
  login: (role: UserRole, branchId: string | null, password: string) => { success: boolean; message?: string };
  logout: () => void;

  // Master Entities
  branches: Branch[];
  products: Product[];
  branchStocks: BranchStock[];
  dailySales: DailySalesRecord[];
  airtelMoneyRecords: AirtelMoneyRecord[];
  airtelRecords: AirtelRecord[];
  debtors: Debtor[];
  debtorTransactions: DebtorTransaction[];
  totalDebtorsBalance: number;
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  stockReconciliations: StockReconciliation[];
  cashMovements: BranchCashMovement[];
  ownerTreasury: OwnerTreasury;
  bankRecords: BankRecord[];
  cashRecords: CashRecord[];
  stockTransfers: StockTransfer[];

  // Alerts
  lowStockAlerts: LowStockAlert[];
  totalDiscrepancyCount: number;
  pendingCashMovementCount: number;

  // Branch CRUD & Operations
  addBranch: (branchData: Omit<Branch, 'id' | 'createdAt'>) => Branch;
  updateBranch: (branchId: string, updates: Partial<Branch>) => void;
  deleteBranch: (branchId: string) => { success: boolean; message?: string };

  // Product Catalog CRUD (Owner only)
  addProduct: (productData: Omit<Product, 'id'>, initialStocks?: { [branchId: string]: number }) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => { success: boolean; message?: string };

  // Inventory & Stock Management
  updateStockQuantity: (branchId: string, productId: string, newQuantity: number) => void;
  getStockForBranch: (branchId: string) => (Product & { quantity: number; isLowStock: boolean; deficit: number })[];

  // Daily Sales & POS Workflow
  addDailySale: (
    record: Omit<DailySalesRecord, 'id' | 'createdAt'> & {
      creditDebtorId?: string;
      creditDebtorName?: string;
    }
  ) => DailySalesRecord;
  saveOrUpdateDailySale: (
    record: Omit<DailySalesRecord, 'id' | 'createdAt' | 'postingStatus'> & {
      id?: string;
      creditDebtorId?: string;
      creditDebtorName?: string;
    },
    postImmediately?: boolean
  ) => DailySalesRecord;
  postDailySaleToSystem: (saleId: string) => { success: boolean; message: string };
  approveAndPostDailySale: (
    saleIdOrRecord:
      | string
      | DailySalesRecord
      | (Omit<DailySalesRecord, 'id' | 'createdAt' | 'postingStatus'> & {
          id?: string;
          creditDebtorId?: string;
          creditDebtorName?: string;
        }),
    ownerName?: string
  ) => { success: boolean; message: string; record?: DailySalesRecord };
  rejectDailySale: (saleId: string, reason: string) => { success: boolean; message: string };
  updateDailySale: (id: string, updates: Partial<DailySalesRecord>) => void;
  deleteDailySale: (saleId: string, restoreStock?: boolean, removeAirtel?: boolean) => { success: boolean; message?: string };
  adjustDailySale: (
    saleId: string,
    adjustedRecord: Omit<DailySalesRecord, 'id' | 'createdAt'>,
    adjustStockDifferences?: boolean
  ) => { success: boolean; message?: string; record?: DailySalesRecord };
  unpostedDailySales: DailySalesRecord[];
  unpostedDailySalesCount: number;

  // Stock Reconciliation
  createStockReconciliation: (recon: Omit<StockReconciliation, 'id' | 'createdAt' | 'status'>, applyInventoryAdjustment?: boolean) => StockReconciliation;
  approveStockReconciliation: (reconId: string, notes?: string) => void;
  rejectStockReconciliation: (reconId: string, notes?: string) => void;
  deleteStockReconciliation: (reconId: string) => { success: boolean; message?: string };
  clearStockReconciliations: (branchId?: string) => void;

  // Cash Movement & Branch Cash Handover
  createCashMovement: (movementData: Omit<BranchCashMovement, 'id' | 'requestedAt' | 'status'>) => BranchCashMovement;
  updateCashMovement: (id: string, updates: Partial<BranchCashMovement>) => { success: boolean; message?: string };
  approveCashMovement: (movementId: string, reviewNotes?: string) => { success: boolean; message?: string };
  rejectCashMovement: (movementId: string, reviewNotes?: string) => { success: boolean; message?: string };
  deleteCashMovement: (movementId: string) => { success: boolean; message?: string };
  transferOwnerFunds: (source: CashMovementDestination, destination: CashMovementDestination, amount: number, notes?: string) => { success: boolean; message?: string };
  updateOwnerTreasury: (treasury: Partial<OwnerTreasury>) => void;

  // Bank & Cash Ledger Operations (Direct Debits, Credits & Running Balances)
  addBankRecord: (record: Omit<BankRecord, 'id' | 'createdAt' | 'balance'>) => BankRecord;
  updateBankRecord: (id: string, updates: Partial<BankRecord>) => void;
  deleteBankRecord: (id: string) => { success: boolean; message?: string };
  bulkDeleteBankRecords: (ids: string[]) => { success: boolean; message?: string };

  addCashRecord: (record: Omit<CashRecord, 'id' | 'createdAt' | 'balance'>) => CashRecord;
  updateCashRecord: (id: string, updates: Partial<CashRecord>) => void;
  deleteCashRecord: (id: string) => { success: boolean; message?: string };
  bulkDeleteCashRecords: (ids: string[]) => { success: boolean; message?: string };

  // Airtel Money Ledger Operations & Conversions
  addAirtelRecord: (record: Omit<AirtelRecord, 'id' | 'createdAt' | 'balance'>) => AirtelRecord;
  updateAirtelRecord: (id: string, updates: Partial<AirtelRecord>) => void;
  deleteAirtelRecord: (id: string) => { success: boolean; message?: string };
  bulkDeleteAirtelRecords: (ids: string[]) => { success: boolean; message?: string };
  convertAirtelToCash: (amount: number, date: string, refNo?: string, notes?: string) => { success: boolean; message?: string };
  convertAirtelToBank: (amount: number, date: string, refNo?: string, notes?: string) => { success: boolean; message?: string };
  paySupplierFromAirtel: (supplierId: string, amount: number, date: string, invoiceRef?: string, notes?: string) => { success: boolean; message?: string };
  payExpenseFromAirtel: (amount: number, date: string, expenseDetails: string, refNo?: string) => { success: boolean; message?: string };

  // Debtors / Credit Customers Operations
  addDebtor: (debtorData: Omit<Debtor, 'id' | 'createdAt' | 'totalCreditSales' | 'totalPaid' | 'outstandingBalance'>) => Debtor;
  updateDebtor: (id: string, updates: Partial<Debtor>) => void;
  deleteDebtor: (id: string) => { success: boolean; message: string };
  addDebtorCreditSale: (debtorId: string, amount: number, date: string, invoiceRef: string, details: string, branchId?: string, branchName?: string) => DebtorTransaction;
  recordDebtorPayment: (
    debtorId: string,
    amount: number,
    date: string,
    receiptNo: string,
    paymentMethod: 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque',
    destination: 'CASH' | 'BANK' | 'AIRTEL',
    notes?: string
  ) => { success: boolean; message?: string; transaction?: DebtorTransaction };
  updateDebtorTransaction: (id: string, updates: Partial<DebtorTransaction>) => { success: boolean; message?: string };
  deleteDebtorTransaction: (id: string) => { success: boolean; message?: string };
  getDebtorBalance: (debtorId: string) => { totalCreditSales: number; totalPaid: number; outstandingBalance: number };

  // Supplier Account Management
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (supplierId: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (supplierId: string) => { success: boolean; message?: string };
  addSupplierTransaction: (txData: Omit<SupplierTransaction, 'id' | 'createdAt'>, autoReplenishStock?: boolean) => SupplierTransaction;
  updateSupplierTransaction: (
    txId: string,
    updates: Partial<SupplierTransaction>,
    options?: {
      adjustBranchStock?: boolean;
      previousTx?: SupplierTransaction;
    }
  ) => { success: boolean; message: string };
  deleteSupplierTransaction: (
    txId: string,
    options?: { reverseBranchStock?: boolean }
  ) => { success: boolean; message: string };
  getSupplierBalance: (supplierId: string) => { totalInvoiced: number; totalPaid: number; balanceDue: number };
  calculateWeightedAverageCost: (currentStock: number, currentCost: number, newPurchaseQty: number, newPurchaseUnitCost: number) => number;
  getProductInvoiceHistory: (productId: string) => {
    transactionId: string;
    invoiceRef: string;
    date: string;
    supplierName: string;
    branchName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  syncProductCostPricesWithInvoices: () => {
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
  };

  // Legacy Airtel Float helpers (backward compatibility)
  addAirtelMoneyRecord: (record: Omit<AirtelMoneyRecord, 'id' | 'createdAt'>) => AirtelMoneyRecord;
  verifyAirtelMoneyRecord: (recordId: string) => void;
  verifyAirtelRecord: (recordId: string) => void;

  // Inter-Branch Stock Transfers (Site-to-Site Logistics)
  createStockTransfer: (data: {
    sourceBranchId: string;
    destinationBranchId: string;
    transferDate: string;
    dispatchedBy: string;
    driverOrCourierName?: string;
    vehicleRegNo?: string;
    waybillOrRefNo?: string;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }) => { success: boolean; message: string; transfer?: StockTransfer };
  receiveStockTransfer: (
    transferId: string,
    receiptData: {
      receivedBy: string;
      receivingNotes?: string;
      itemReceipts?: {
        productId: string;
        receivedQty: number;
        damagedQty?: number;
        missingQty?: number;
      }[];
    }
  ) => { success: boolean; message: string };
  cancelStockTransfer: (transferId: string, reason?: string) => { success: boolean; message: string };
  deleteStockTransfer: (transferId: string, reverseStocks?: boolean) => { success: boolean; message: string };

  // Excel / CSV Bulk Data Import Engine
  bulkImportProducts: (
    productsData: {
      code: string;
      name: string;
      category: 'LUBRICANTS' | 'LPG';
      subCategory?: string;
      unit?: string;
      volumeLitersOrKg?: number;
      costPrice: number;
      sellingPrice: number;
      reorderThreshold?: number;
      description?: string;
    }[],
    updateExisting?: boolean
  ) => { success: boolean; createdCount: number; updatedCount: number; message: string };

  bulkImportBranchStocks: (
    stocksData: { branchId: string; productId: string; quantity: number }[],
    mode?: 'SET' | 'ADD'
  ) => { success: boolean; updatedCount: number; message: string };

  bulkImportDebtors: (
    debtorsData: {
      code?: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      creditLimit?: number;
      notes?: string;
    }[]
  ) => { success: boolean; createdCount: number; updatedCount: number; message: string };

  bulkImportSuppliers: (
    suppliersData: {
      code?: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      category?: 'LUBRICANTS' | 'LPG' | 'BOTH' | 'EQUIPMENT';
      paymentTermsDays?: number;
      taxNumber?: string;
    }[]
  ) => { success: boolean; createdCount: number; updatedCount: number; message: string };

  // Utilities
  resetToDemoData: () => void;
  formatSystemDataToZero: () => {
    success: boolean;
    message: string;
    branchesCount: number;
    productsCount: number;
  };

  // Database Connection & Real-Time Sync Status
  isDbConnected: boolean;
  dbSyncError: string | null;
  lastDbSyncTime: Date | null;
  manualSyncWithDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'lubes_lpg_enterprise_data_v1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY}_authenticated`) === 'true';
  });

  const [ownerPassword, setOwnerPasswordState] = useState<string>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY}_owner_password`) || 'admin123';
  });

  const setOwnerPassword = (newPassword: string) => {
    setOwnerPasswordState(newPassword);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_owner_password`, newPassword);
  };

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_role`);
    return saved === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER' : 'OWNER';
  });

  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_KEY}_branchId`) || 'branch-1';
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_branches`);
    if (saved) {
      try {
        const parsed: Branch[] = JSON.parse(saved);
        return parsed.map((b) => {
          if (!b.password) {
            const initMatch = INITIAL_BRANCHES.find((ib) => ib.id === b.id);
            return {
              ...b,
              password: initMatch?.password || '123456',
            };
          }
          return b;
        });
      } catch {
        return INITIAL_BRANCHES;
      }
    }
    return INITIAL_BRANCHES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [branchStocks, setBranchStocks] = useState<BranchStock[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_stocks`);
    return saved ? JSON.parse(saved) : INITIAL_BRANCH_STOCK;
  });

  const [dailySales, setDailySales] = useState<DailySalesRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_sales`);
    return saved ? JSON.parse(saved) : INITIAL_DAILY_SALES;
  });

  const [airtelMoneyRecords, setAirtelMoneyRecords] = useState<AirtelMoneyRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_airtel`);
    return saved ? JSON.parse(saved) : INITIAL_AIRTEL_MONEY_RECORDS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_suppliers`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_supplier_tx`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_TRANSACTIONS;
  });

  const [stockReconciliations, setStockReconciliations] = useState<StockReconciliation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reconciliations`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_RECONCILIATIONS;
  });

  const [cashMovements, setCashMovements] = useState<BranchCashMovement[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cash_movements`);
    return saved ? JSON.parse(saved) : INITIAL_CASH_MOVEMENTS;
  });

  const [bankRecords, setBankRecords] = useState<BankRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_bank_records`);
    return saved ? JSON.parse(saved) : INITIAL_BANK_RECORDS;
  });

  const [cashRecords, setCashRecords] = useState<CashRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cash_records`);
    return saved ? JSON.parse(saved) : INITIAL_CASH_RECORDS;
  });

  const [airtelRecords, setAirtelRecords] = useState<AirtelRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_airtel_records`);
    return saved ? JSON.parse(saved) : INITIAL_AIRTEL_RECORDS;
  });

  const [debtors, setDebtors] = useState<Debtor[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debtors`);
    return saved ? JSON.parse(saved) : INITIAL_DEBTORS;
  });

  const [debtorTransactions, setDebtorTransactions] = useState<DebtorTransaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debtor_tx`);
    return saved ? JSON.parse(saved) : INITIAL_DEBTOR_TRANSACTIONS;
  });

  const [ownerTreasury, setOwnerTreasury] = useState<OwnerTreasury>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_owner_treasury`);
    return saved ? JSON.parse(saved) : INITIAL_OWNER_TREASURY;
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_stock_transfers`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
  });

  // Total Debtors Outstanding Balance across business
  const totalDebtorsBalance = useMemo(() => {
    return debtors.reduce((sum, d) => sum + (Number(d.outstandingBalance) || 0), 0);
  }, [debtors]);

  // Real-Time Database Connection Tracking
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbSyncError, setDbSyncError] = useState<string | null>(null);
  const [lastDbSyncTime, setLastDbSyncTime] = useState<Date | null>(null);

  // Load and continuously sync state from PostgreSQL Backend (e.g. Render PostgreSQL)
  const syncWithDatabase = async () => {
    try {
      const data = await api.bootstrap();
      if (data && data.connected) {
        setIsDbConnected(true);
        setDbSyncError(null);
        setLastDbSyncTime(new Date());

        if (Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
        }
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
        if (Array.isArray(data.stocks) && data.stocks.length > 0) {
          setBranchStocks(data.stocks);
        } else if (Array.isArray(data.branchStocks) && data.branchStocks.length > 0) {
          setBranchStocks(data.branchStocks);
        }
        if (Array.isArray(data.dailySales)) {
          setDailySales(data.dailySales);
        }
        if (Array.isArray(data.debtors)) {
          setDebtors(data.debtors);
        }
        if (Array.isArray(data.debtorTransactions)) {
          setDebtorTransactions(data.debtorTransactions);
        }
        if (Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers);
        }
        if (Array.isArray(data.supplierTransactions)) {
          setSupplierTransactions(data.supplierTransactions);
        }
        if (Array.isArray(data.stockReconciliations)) {
          setStockReconciliations(data.stockReconciliations);
        }
        if (Array.isArray(data.cashMovements)) {
          setCashMovements(data.cashMovements);
        }
        if (data.treasury) {
          setOwnerTreasury(data.treasury);
        } else if (data.ownerTreasury) {
          setOwnerTreasury(data.ownerTreasury);
        }
        if (Array.isArray(data.bankRecords)) {
          setBankRecords(data.bankRecords);
        }
        if (Array.isArray(data.cashRecords)) {
          setCashRecords(data.cashRecords);
        }
        if (Array.isArray(data.airtelRecords)) {
          setAirtelRecords(data.airtelRecords);
        }
        if (Array.isArray(data.airtelMoneyRecords)) {
          setAirtelMoneyRecords(data.airtelMoneyRecords);
        }
        if (Array.isArray(data.stockTransfers)) {
          setStockTransfers(data.stockTransfers);
        }
      } else if (data && !data.connected) {
        setIsDbConnected(false);
        if (data.isConfigured && data.error) {
          setDbSyncError(data.error);
        } else {
          setDbSyncError(null);
        }
      }
    } catch (err: any) {
      setIsDbConnected(false);
      // Only show error if unexpected failure
      setDbSyncError(err?.message || 'Database connection offline');
    }
  };

  useEffect(() => {
    syncWithDatabase();
    const interval = setInterval(syncWithDatabase, 4000);
    const handleFocus = () => syncWithDatabase();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithDatabase();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Save to LocalStorage whenever state updates
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, role);
    if (currentBranchId) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_branchId`, currentBranchId);
    }
  }, [role, currentBranchId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_branches`, JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_stocks`, JSON.stringify(branchStocks));
  }, [branchStocks]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_sales`, JSON.stringify(dailySales));
  }, [dailySales]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_airtel`, JSON.stringify(airtelMoneyRecords));
  }, [airtelMoneyRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_airtel_records`, JSON.stringify(airtelRecords));
  }, [airtelRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debtors`, JSON.stringify(debtors));
  }, [debtors]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debtor_tx`, JSON.stringify(debtorTransactions));
  }, [debtorTransactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_supplier_tx`, JSON.stringify(supplierTransactions));
  }, [supplierTransactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_reconciliations`, JSON.stringify(stockReconciliations));
  }, [stockReconciliations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cash_movements`, JSON.stringify(cashMovements));
  }, [cashMovements]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_bank_records`, JSON.stringify(bankRecords));
  }, [bankRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cash_records`, JSON.stringify(cashRecords));
  }, [cashRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_owner_treasury`, JSON.stringify(ownerTreasury));
  }, [ownerTreasury]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_stock_transfers`, JSON.stringify(stockTransfers));
  }, [stockTransfers]);

  // Login authentication handler
  const login = (
    selectedRole: UserRole,
    selectedBranchId: string | null,
    enteredPassword: string
  ): { success: boolean; message?: string } => {
    if (!enteredPassword || !enteredPassword.trim()) {
      return { success: false, message: 'Please enter your login password.' };
    }

    const trimmedPassword = enteredPassword.trim();

    if (selectedRole === 'OWNER') {
      const activeOwnerPass = ownerPassword || 'admin123';
      if (trimmedPassword !== activeOwnerPass) {
        return {
          success: false,
          message: 'Invalid Owner HQ master password. Please verify your credentials and try again.',
        };
      }
      setRoleState('OWNER');
      setCurrentBranchIdState(null);
      setIsAuthenticated(true);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_authenticated`, 'true');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, 'OWNER');
      return { success: true };
    } else {
      // BRANCH_MANAGER
      if (!selectedBranchId) {
        return { success: false, message: 'Please select a branch location from the dropdown.' };
      }
      const branch = branches.find((b) => b.id === selectedBranchId);
      if (!branch) {
        return { success: false, message: 'Selected branch location could not be found.' };
      }
      if (branch.status === 'INACTIVE') {
        return {
          success: false,
          message: `Branch "${branch.name}" is currently marked as INACTIVE. Access to this portal is suspended.`,
        };
      }
      const branchPass = branch.password || '123456';
      if (trimmedPassword !== branchPass) {
        return {
          success: false,
          message: `Incorrect password for ${branch.name} (${branch.code}). Please check your password or contact the business owner.`,
        };
      }
      setRoleState('BRANCH_MANAGER');
      setCurrentBranchIdState(selectedBranchId);
      setIsAuthenticated(true);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_authenticated`, 'true');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, 'BRANCH_MANAGER');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_branchId`, selectedBranchId);
      return { success: true };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_authenticated`);
  };

  // Set Role and Branch
  const setRole = (newRole: UserRole, branchId?: string | null) => {
    setRoleState(newRole);
    if (newRole === 'OWNER') {
      setCurrentBranchIdState(branchId || null);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, 'OWNER');
    } else {
      const bId = branchId || branches[0]?.id || 'branch-1';
      setCurrentBranchIdState(bId);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_role`, 'BRANCH_MANAGER');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_branchId`, bId);
    }
  };

  const currentBranch = useMemo(() => {
    if (role === 'OWNER' && !currentBranchId) return null;
    return branches.find((b) => b.id === currentBranchId) || branches[0] || null;
  }, [branches, currentBranchId, role]);

  // Calculate Real-Time Low Stock Alerts
  const lowStockAlerts = useMemo<LowStockAlert[]>(() => {
    const alerts: LowStockAlert[] = [];
    branches.forEach((branch) => {
      products.forEach((product) => {
        const stockEntry = branchStocks.find(
          (s) => s.branchId === branch.id && s.productId === product.id
        );
        const currentStock = stockEntry ? stockEntry.quantity : 0;
        if (currentStock <= product.reorderThreshold) {
          const deficit = product.reorderThreshold - currentStock;
          const severity = currentStock <= Math.floor(product.reorderThreshold / 2) ? 'CRITICAL' : 'WARNING';
          alerts.push({
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            lubesChamp: branch.lubesChamp,
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            category: product.category,
            unit: product.unit,
            currentStock,
            reorderThreshold: product.reorderThreshold,
            deficit: Math.max(deficit, 0),
            severity,
          });
        }
      });
    });
    return alerts;
  }, [branches, products, branchStocks]);

  // Discrepancy Count (Sales Cash Variance != 0)
  const totalDiscrepancyCount = useMemo(() => {
    return dailySales.filter((sale) => Math.abs(sale.cashVariance) > 0.01).length;
  }, [dailySales]);

  // Pending Cash Movement Approvals (For Owner Portal)
  const pendingCashMovementCount = useMemo(() => {
    return cashMovements.filter((cm) => cm.status === 'PENDING_APPROVAL').length;
  }, [cashMovements]);

  // Unposted Daily Sales Pending Owner Approval
  const unpostedDailySales = useMemo(() => {
    return dailySales.filter((sale) => sale.postingStatus === 'UNPOSTED');
  }, [dailySales]);

  const unpostedDailySalesCount = useMemo(() => {
    return unpostedDailySales.length;
  }, [unpostedDailySales]);

  // Branch CRUD
  const addBranch = (branchData: Omit<Branch, 'id' | 'createdAt'>): Branch => {
    const newId = `branch-${Date.now()}`;
    const newBranch: Branch = {
      ...branchData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBranches((prev) => [...prev, newBranch]);

    // Persist to PostgreSQL Database
    api.createBranch(newBranch).catch(console.error);

    // Initialize stock for all active products for the new branch with 0 quantity
    const newStockEntries: BranchStock[] = products.map((prod) => ({
      branchId: newId,
      productId: prod.id,
      quantity: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    }));

    setBranchStocks((prev) => [...prev, ...newStockEntries]);
    return newBranch;
  };

  const updateBranch = (branchId: string, updates: Partial<Branch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, ...updates } : b))
    );
    api.updateBranch(branchId, updates).catch(console.error);
  };

  const deleteBranch = (branchId: string): { success: boolean; message?: string } => {
    // Check if branch exists
    const targetBranch = branches.find((b) => b.id === branchId);
    if (!targetBranch) {
      return { success: false, message: 'Branch location not found.' };
    }

    // Guard against deleting when only 1 branch remains
    if (branches.length <= 1) {
      return {
        success: false,
        message: 'Cannot delete the only remaining branch. At least one operational branch site is required.',
      };
    }

    // Clean up local state
    setBranches((prev) => prev.filter((b) => b.id !== branchId));
    setBranchStocks((prev) => prev.filter((s) => s.branchId !== branchId));
    setDailySales((prev) => prev.filter((s) => s.branchId !== branchId));
    setCashMovements((prev) => prev.filter((m) => m.branchId !== branchId));
    setAirtelRecords((prev) => prev.filter((r) => r.branchId !== branchId));
    setAirtelMoneyRecords((prev) => prev.filter((r) => r.branchId !== branchId));
    setStockReconciliations((prev) => prev.filter((r) => r.branchId !== branchId));
    setStockTransfers((prev) =>
      prev.filter((t) => t.sourceBranchId !== branchId && t.destinationBranchId !== branchId)
    );

    // If current selected branch was deleted, fall back to another available branch
    if (currentBranchId === branchId) {
      const remainingBranch = branches.find((b) => b.id !== branchId);
      setCurrentBranchIdState(remainingBranch?.id || null);
    }

    // Persist delete to backend database
    api.deleteBranch(branchId).catch(console.error);

    return {
      success: true,
      message: `Branch "${targetBranch.name}" (${targetBranch.code}) has been permanently deleted.`,
    };
  };

  // Product CRUD
  const addProduct = (
    productData: Omit<Product, 'id'>,
    initialStocks?: { [branchId: string]: number }
  ): Product => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
    };
    setProducts((prev) => [...prev, newProduct]);

    // Persist to PostgreSQL Database
    api.createProduct(newProduct).catch(console.error);

    // Add stock records for all branches
    const newStocks: BranchStock[] = branches.map((b) => {
      const qty = Math.max(
        0,
        initialStocks && typeof initialStocks[b.id] === 'number' ? Number(initialStocks[b.id]) : 0
      );
      if (qty > 0) {
        api.upsertStock(b.id, newId, qty).catch(console.error);
      }
      return {
        branchId: b.id,
        productId: newId,
        quantity: qty,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    });
    setBranchStocks((prev) => [...prev, ...newStocks]);

    return newProduct;
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
    api.updateProduct(productId, updates).catch(console.error);
  };

  const deleteProduct = (productId: string): { success: boolean; message?: string } => {
    // Check total stock across all branches - strictly allowed ONLY if quantity is zero
    const stockEntries = branchStocks.filter((s) => s.productId === productId);
    const totalStock = stockEntries.reduce((sum, s) => sum + (s.quantity || 0), 0);

    if (totalStock > 0) {
      const branchesWithStock = stockEntries
        .filter((s) => (s.quantity || 0) > 0)
        .map((s) => {
          const b = branches.find((br) => br.id === s.branchId);
          return `${b ? b.name : s.branchId} (${s.quantity} units)`;
        });

      return {
        success: false,
        message: `Cannot delete product. Stock quantity must be 0 before deletion. Currently has ${totalStock} units in physical stock (${branchesWithStock.join(', ')}).`,
      };
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setBranchStocks((prev) => prev.filter((s) => s.productId !== productId));
    api.deleteProduct(productId).catch(console.error);
    return { success: true, message: 'Product successfully deleted from catalog.' };
  };

  // Stock Management
  const updateStockQuantity = (branchId: string, productId: string, newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    api.upsertStock(branchId, productId, qty).catch(console.error);
    setBranchStocks((prev) => {
      const exists = prev.find((s) => s.branchId === branchId && s.productId === productId);
      if (exists) {
        return prev.map((s) =>
          s.branchId === branchId && s.productId === productId
            ? { ...s, quantity: qty, lastUpdated: new Date().toISOString().split('T')[0] }
            : s
        );
      } else {
        return [
          ...prev,
          {
            branchId,
            productId,
            quantity: qty,
            lastUpdated: new Date().toISOString().split('T')[0],
          },
        ];
      }
    });
  };

  const getStockForBranch = (branchId: string) => {
    return products.map((product) => {
      const stockEntry = branchStocks.find(
        (s) => s.branchId === branchId && s.productId === product.id
      );
      const quantity = stockEntry ? stockEntry.quantity : 0;
      const isLowStock = quantity <= product.reorderThreshold;
      const deficit = Math.max(0, product.reorderThreshold - quantity);
      return {
        ...product,
        quantity,
        isLowStock,
        deficit,
      };
    });
  };

  // Post Daily Sale internal routine (executed only when Owner approves)
  const postDailySaleInternal = (sale: DailySalesRecord) => {
    // 1. Decrement inventory for sold items at the branch
    if (sale.items && sale.items.length > 0) {
      setBranchStocks((prev) => {
        const updated = [...prev];
        sale.items.forEach((item) => {
          const index = updated.findIndex(
            (s) => s.branchId === sale.branchId && s.productId === item.productId
          );
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              quantity: Math.max(0, updated[index].quantity - item.quantity),
              lastUpdated: sale.date,
            };
          } else {
            updated.push({
              branchId: sale.branchId,
              productId: item.productId,
              quantity: 0,
              lastUpdated: sale.date,
            });
          }
        });
        return updated;
      });
    }

    // 2. Route to Bank Record if Bank/Card sales occurred
    const bankSales = Number(sale.paymentBreakdown?.bankOrCardSales) || 0;
    if (bankSales > 0) {
      addBankRecord({
        date: sale.date,
        details: `Daily POS & Card Sales - ${sale.branchName} (${sale.shift})`,
        debit: bankSales,
        credit: 0,
        referenceNo: `POS-${sale.branchCode || 'BR'}-${Date.now().toString().slice(-4)}`,
        category: 'BRANCH_SALES',
        branchId: sale.branchId,
        branchName: sale.branchName,
      });
    }

    // 3. Route to Cash Records if Cash was received or petty expenses/remittances occurred
    const actualCash = Number(sale.actualCashReceived) || 0;
    const pettyExp = Number(sale.totalPettyExpenses) || 0;
    const airtelRemittance = Number(sale.cashSentToAirtelMoney) || 0;

    if (actualCash > 0) {
      addCashRecord({
        date: sale.date,
        details: `Daily Sales Cash Inflow - ${sale.branchName} (${sale.shift})`,
        debit: actualCash,
        credit: 0,
        referenceNo: `CSH-SALE-${sale.branchCode || 'BR'}-${Date.now().toString().slice(-4)}`,
        category: 'BRANCH_SALES',
        branchId: sale.branchId,
        branchName: sale.branchName,
      });
    }

    if (pettyExp > 0) {
      addCashRecord({
        date: sale.date,
        details: `Daily Petty Expenses - ${sale.branchName} (${sale.shift})`,
        debit: 0,
        credit: pettyExp,
        referenceNo: `EXP-${sale.branchCode || 'BR'}-${Date.now().toString().slice(-4)}`,
        category: 'PETTY_CASH',
        branchId: sale.branchId,
        branchName: sale.branchName,
      });
    }

    if (airtelRemittance > 0) {
      addCashRecord({
        date: sale.date,
        details: `Cash Remittance to Airtel Float - ${sale.branchName} (${sale.shift})`,
        debit: 0,
        credit: airtelRemittance,
        referenceNo: sale.airtelMoneyTxRef || `AM-DEP-${Date.now().toString().slice(-4)}`,
        category: 'CONVERSION_AIRTEL',
        branchId: sale.branchId,
        branchName: sale.branchName,
      });
    }

    // 4. Route to Airtel Records if Airtel Direct or Cash Sent to Airtel occurred
    const directAirtel = Number(sale.paymentBreakdown?.airtelMoneyDirectSales) || 0;
    const totalAirtelFromSale = directAirtel + airtelRemittance;
    if (totalAirtelFromSale > 0) {
      addAirtelRecord({
        date: sale.date,
        details: `Branch Sales Remittance & Till - ${sale.branchName} (${sale.shift})`,
        debit: totalAirtelFromSale,
        credit: 0,
        referenceNo: sale.airtelMoneyTxRef || `AM-SALES-${Date.now().toString().slice(-4)}`,
        category: 'BRANCH_SALES',
        branchId: sale.branchId,
        branchName: sale.branchName,
        recipientOrSender: sale.airtelMoneySenderPhone || sale.branchName,
      });
    }

    // 5. Route to Debtors if Credit Sales occurred
    const creditSalesAmt = Number(sale.paymentBreakdown?.creditSales) || 0;
    if (creditSalesAmt > 0) {
      const targetDebtorId = sale.creditDebtorId || (debtors.length > 0 ? debtors[0].id : undefined);
      if (targetDebtorId) {
        addDebtorCreditSale(
          targetDebtorId,
          creditSalesAmt,
          sale.date,
          `INV-SALE-${Date.now().toString().slice(-4)}`,
          `Credit Sale on Daily Shift: ${sale.branchName} (${sale.shift})`,
          sale.branchId,
          sale.branchName
        );
      }
    }

    // 6. Airtel Money Records backward compatibility
    if (airtelRemittance > 0) {
      const airtelRec: AirtelMoneyRecord = {
        id: `am-${Date.now()}`,
        branchId: sale.branchId,
        branchName: sale.branchName,
        date: sale.date,
        type: 'DAILY_SALES_CASH_IN',
        amount: airtelRemittance,
        transactionRef: sale.airtelMoneyTxRef || `AM-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        senderNumber: sale.airtelMoneySenderPhone || 'Branch Champ Phone',
        receiverNumber: sale.airtelMoneyReceiver || 'HQ Airtel Float Wallet',
        verified: true,
        notes: `Daily sales cash deposit from ${sale.branchName}. Shift: ${sale.shift}`,
        createdAt: new Date().toISOString(),
      };
      setAirtelMoneyRecords((prev) => [airtelRec, ...prev]);
    }

    if (directAirtel > 0) {
      const directAirtelRec: AirtelMoneyRecord = {
        id: `am-dir-${Date.now()}`,
        branchId: sale.branchId,
        branchName: sale.branchName,
        date: sale.date,
        type: 'DIRECT_CUSTOMER_PAYMENT',
        amount: directAirtel,
        transactionRef: `AM-DIR-${Math.floor(100000 + Math.random() * 900000)}`,
        senderNumber: 'Walk-in Customers',
        receiverNumber: sale.branchCode,
        verified: true,
        notes: `Direct customer till payments for daily sales on ${sale.date}`,
        createdAt: new Date().toISOString(),
      };
      setAirtelMoneyRecords((prev) => [directAirtelRec, ...prev]);
    }
  };

  // Save or Update Daily Sale (Draft or Post to System)
  const saveOrUpdateDailySale = (
    recordData: Omit<DailySalesRecord, 'id' | 'createdAt' | 'postingStatus'> & {
      id?: string;
      creditDebtorId?: string;
      creditDebtorName?: string;
    },
    postImmediately: boolean = false
  ): DailySalesRecord => {
    const now = new Date().toISOString();
    const existingIndex = dailySales.findIndex(
      (s) =>
        (recordData.id && s.id === recordData.id) ||
        (s.branchId === recordData.branchId && s.date === recordData.date)
    );

    let resultRecord: DailySalesRecord;

    if (existingIndex >= 0) {
      const existing = dailySales[existingIndex];
      const newPostingStatus: DailySalesPostingStatus = postImmediately
        ? 'UNPOSTED'
        : existing.postingStatus === 'REJECTED'
        ? 'DRAFT'
        : existing.postingStatus || 'DRAFT';

      resultRecord = {
        ...existing,
        ...recordData,
        id: existing.id,
        postingStatus: newPostingStatus,
        postedByBranchAt: postImmediately ? now : existing.postedByBranchAt,
        rejectionReason: postImmediately ? undefined : existing.rejectionReason,
      };

      setDailySales((prev) => {
        const updated = [...prev];
        updated[existingIndex] = resultRecord;
        return updated;
      });

      api.updateDailySale(existing.id, resultRecord).catch(console.error);
    } else {
      const newId = recordData.id || `sale-${Date.now()}`;
      resultRecord = {
        ...recordData,
        id: newId,
        postingStatus: postImmediately ? 'UNPOSTED' : 'DRAFT',
        postedByBranchAt: postImmediately ? now : undefined,
        createdAt: now,
      };

      setDailySales((prev) => [resultRecord, ...prev]);
      api.createDailySale(resultRecord).catch(console.error);
    }

    return resultRecord;
  };

  // Branch calls this to post existing draft sale to the system
  const postDailySaleToSystem = (saleId: string) => {
    const sale = dailySales.find((s) => s.id === saleId);
    if (!sale) {
      return { success: false, message: 'Sales record not found.' };
    }

    const now = new Date().toISOString();
    setDailySales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              postingStatus: 'UNPOSTED',
              postedByBranchAt: now,
              rejectionReason: undefined,
            }
          : s
      )
    );

    api.updateDailySale(saleId, {
      postingStatus: 'UNPOSTED',
      postedByBranchAt: now,
      rejectionReason: undefined,
    }).catch(console.error);

    return {
      success: true,
      message: `Daily sales for ${sale.date} have been posted to the system. Transactions are now locked from branch edits and awaiting Owner approval.`,
    };
  };

  // Owner approves unposted daily sales -> posts to Stock, Bank, Cash, Airtel, Debtors
  const approveAndPostDailySale = (
    saleIdOrRecord:
      | string
      | DailySalesRecord
      | (Omit<DailySalesRecord, 'id' | 'createdAt' | 'postingStatus'> & {
          id?: string;
          creditDebtorId?: string;
          creditDebtorName?: string;
        }),
    ownerName?: string
  ): { success: boolean; message: string; record?: DailySalesRecord } => {
    const now = new Date().toISOString();
    let targetRecord: DailySalesRecord;

    if (typeof saleIdOrRecord === 'string') {
      const sale = dailySales.find((s) => s.id === saleIdOrRecord);
      if (!sale) {
        return { success: false, message: 'Sales record not found in system.' };
      }
      targetRecord = {
        ...sale,
        postingStatus: 'POSTED_APPROVED',
        approvedByOwnerAt: now,
        approvedByOwnerName: ownerName || 'Executive Owner',
        rejectionReason: undefined,
      };

      setDailySales((prev) =>
        prev.map((s) => (s.id === saleIdOrRecord ? targetRecord : s))
      );
    } else {
      // Record object was passed directly
      const recId = saleIdOrRecord.id || `sale-${Date.now()}`;
      targetRecord = {
        ...(saleIdOrRecord as any),
        id: recId,
        postingStatus: 'POSTED_APPROVED',
        approvedByOwnerAt: now,
        approvedByOwnerName: ownerName || 'Executive Owner',
        createdAt: (saleIdOrRecord as any).createdAt || now,
        rejectionReason: undefined,
      };

      setDailySales((prev) => {
        const idx = prev.findIndex(
          (s) =>
            (targetRecord.id && s.id === targetRecord.id) ||
            (s.branchId === targetRecord.branchId && s.date === targetRecord.date)
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = targetRecord;
          return copy;
        }
        return [targetRecord, ...prev];
      });
    }

    // Persist to PostgreSQL Database
    api.updateDailySale(targetRecord.id, targetRecord).catch(console.error);

    // Apply ledger and inventory postings immediately
    postDailySaleInternal(targetRecord);

    return {
      success: true,
      message: `Approved & posted daily sales for ${targetRecord.branchName} (${targetRecord.date}) to Bank, Cash, Airtel, Debtors, and Stock ledgers.`,
      record: targetRecord,
    };
  };

  // Owner rejects unposted sale and sends back to branch for correction
  const rejectDailySale = (saleId: string, reason: string) => {
    const sale = dailySales.find((s) => s.id === saleId);
    if (!sale) {
      return { success: false, message: 'Sales record not found.' };
    }

    setDailySales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              postingStatus: 'REJECTED',
              rejectionReason: reason,
            }
          : s
      )
    );

    api.updateDailySale(saleId, {
      postingStatus: 'REJECTED',
      rejectionReason: reason,
    }).catch(console.error);

    return {
      success: true,
      message: `Daily sales returned to branch with note: "${reason}". Branch can now edit and re-post.`,
    };
  };

  // Legacy/Direct Add Daily Sale (Used for direct entry)
  const addDailySale = (
    recordData: Omit<DailySalesRecord, 'id' | 'createdAt'> & {
      creditDebtorId?: string;
      creditDebtorName?: string;
    }
  ): DailySalesRecord => {
    return saveOrUpdateDailySale(recordData, true);
  };

  const updateDailySale = (id: string, updates: Partial<DailySalesRecord>) => {
    setDailySales((prev) =>
      prev.map((sale) => (sale.id === id ? { ...sale, ...updates } : sale))
    );
    api.updateDailySale(id, updates).catch(console.error);
  };

  const deleteDailySale = (
    saleId: string,
    restoreStock: boolean = true,
    removeAirtel: boolean = true
  ): { success: boolean; message?: string } => {
    const sale = dailySales.find((s) => s.id === saleId);
    if (!sale) {
      return { success: false, message: 'Sales record not found.' };
    }

    // 1. Restore branch stock ONLY if it was already POSTED_APPROVED
    if (sale.postingStatus === 'POSTED_APPROVED' && restoreStock && sale.items && sale.items.length > 0) {
      setBranchStocks((prev) => {
        const updated = [...prev];
        sale.items.forEach((item) => {
          const index = updated.findIndex(
            (s) => s.branchId === sale.branchId && s.productId === item.productId
          );
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              quantity: updated[index].quantity + item.quantity,
              lastUpdated: new Date().toISOString().split('T')[0],
            };
          } else {
            updated.push({
              branchId: sale.branchId,
              productId: item.productId,
              quantity: item.quantity,
              lastUpdated: new Date().toISOString().split('T')[0],
            });
          }
        });
        return updated;
      });
    }

    // 2. Remove corresponding Airtel Money transaction if matching and was approved
    if (sale.postingStatus === 'POSTED_APPROVED' && removeAirtel && sale.cashSentToAirtelMoney > 0) {
      setAirtelMoneyRecords((prev) =>
        prev.filter((r) => {
          if (sale.airtelMoneyTxRef && r.transactionRef === sale.airtelMoneyTxRef) {
            return false;
          }
          if (
            r.branchId === sale.branchId &&
            r.date === sale.date &&
            r.amount === sale.cashSentToAirtelMoney &&
            r.type === 'DAILY_SALES_CASH_IN'
          ) {
            return false;
          }
          return true;
        })
      );
    }

    // 3. Remove the daily sale record
    setDailySales((prev) => prev.filter((s) => s.id !== saleId));
    api.deleteDailySale(saleId).catch(console.error);

    return {
      success: true,
      message: `Daily sales record for ${sale.branchName} on ${sale.date} was deleted successfully.`,
    };
  };

  const adjustDailySale = (
    saleId: string,
    adjustedData: Omit<DailySalesRecord, 'id' | 'createdAt'>,
    adjustStockDifferences: boolean = true
  ): { success: boolean; message?: string; record?: DailySalesRecord } => {
    const oldSale = dailySales.find((s) => s.id === saleId);
    if (!oldSale) {
      return { success: false, message: 'Sales record not found.' };
    }

    // If it was already approved, synchronize stock deltas
    if (oldSale.postingStatus === 'POSTED_APPROVED' && adjustStockDifferences) {
      setBranchStocks((prev) => {
        let updated = [...prev];

        // If branch changed, restore all items to old branch and deduct from new branch
        if (oldSale.branchId !== adjustedData.branchId) {
          // Restore old
          oldSale.items.forEach((item) => {
            const idx = updated.findIndex(
              (s) => s.branchId === oldSale.branchId && s.productId === item.productId
            );
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                quantity: updated[idx].quantity + item.quantity,
                lastUpdated: new Date().toISOString().split('T')[0],
              };
            }
          });
          // Deduct new
          adjustedData.items.forEach((item) => {
            const idx = updated.findIndex(
              (s) => s.branchId === adjustedData.branchId && s.productId === item.productId
            );
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                quantity: Math.max(0, updated[idx].quantity - item.quantity),
                lastUpdated: new Date().toISOString().split('T')[0],
              };
            }
          });
        } else {
          // Same branch: calculate delta per product
          const allProductIds = Array.from(
            new Set([
              ...oldSale.items.map((i) => i.productId),
              ...adjustedData.items.map((i) => i.productId),
            ])
          );

          allProductIds.forEach((prodId) => {
            const oldItem = oldSale.items.find((i) => i.productId === prodId);
            const newItem = adjustedData.items.find((i) => i.productId === prodId);
            const oldQty = oldItem ? oldItem.quantity : 0;
            const newQty = newItem ? newItem.quantity : 0;
            const deltaQty = newQty - oldQty;

            if (deltaQty !== 0) {
              const idx = updated.findIndex(
                (s) => s.branchId === adjustedData.branchId && s.productId === prodId
              );
              if (idx >= 0) {
                updated[idx] = {
                  ...updated[idx],
                  quantity: Math.max(0, updated[idx].quantity - deltaQty),
                  lastUpdated: new Date().toISOString().split('T')[0],
                };
              } else if (deltaQty < 0) {
                updated.push({
                  branchId: adjustedData.branchId,
                  productId: prodId,
                  quantity: Math.abs(deltaQty),
                  lastUpdated: new Date().toISOString().split('T')[0],
                });
              }
            }
          });
        }

        return updated;
      });
    }

    // Airtel Money record update if applicable and approved
    if (
      oldSale.postingStatus === 'POSTED_APPROVED' &&
      (oldSale.cashSentToAirtelMoney !== adjustedData.cashSentToAirtelMoney ||
        oldSale.airtelMoneyTxRef !== adjustedData.airtelMoneyTxRef)
    ) {
      if (adjustedData.cashSentToAirtelMoney > 0) {
        setAirtelMoneyRecords((prev) => {
          const existingIdx = prev.findIndex(
            (r) =>
              (oldSale.airtelMoneyTxRef && r.transactionRef === oldSale.airtelMoneyTxRef) ||
              (r.branchId === oldSale.branchId &&
                r.date === oldSale.date &&
                r.amount === oldSale.cashSentToAirtelMoney)
          );

          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              branchId: adjustedData.branchId,
              branchName: adjustedData.branchName,
              date: adjustedData.date,
              amount: adjustedData.cashSentToAirtelMoney,
              transactionRef: adjustedData.airtelMoneyTxRef || updated[existingIdx].transactionRef,
              notes: `Adjusted daily sales deposit from ${adjustedData.branchName} (${adjustedData.date})`,
            };
            return updated;
          } else {
            const newAirtel: AirtelMoneyRecord = {
              id: `am-${Date.now()}`,
              branchId: adjustedData.branchId,
              branchName: adjustedData.branchName,
              date: adjustedData.date,
              type: 'DAILY_SALES_CASH_IN',
              amount: adjustedData.cashSentToAirtelMoney,
              transactionRef:
                adjustedData.airtelMoneyTxRef ||
                `AM-REF-${Math.floor(100000 + Math.random() * 900000)}`,
              senderNumber: adjustedData.airtelMoneySenderPhone || 'Branch Champ Phone',
              receiverNumber: adjustedData.airtelMoneyReceiver || 'HQ Airtel Float Wallet',
              verified: true,
              notes: `Adjusted daily sales deposit from ${adjustedData.branchName}`,
              createdAt: new Date().toISOString(),
            };
            return [newAirtel, ...prev];
          }
        });
      }
    }

    const updatedRecord: DailySalesRecord = {
      ...adjustedData,
      id: saleId,
      createdAt: oldSale.createdAt,
    };

    setDailySales((prev) =>
      prev.map((s) => (s.id === saleId ? updatedRecord : s))
    );

    return {
      success: true,
      message: `Daily sales record for ${adjustedData.branchName} (${adjustedData.date}) adjusted successfully.`,
      record: updatedRecord,
    };
  };

  // Stock Reconciliation
  const createStockReconciliation = (
    reconData: Omit<StockReconciliation, 'id' | 'createdAt' | 'status'>,
    applyInventoryAdjustment: boolean = true
  ): StockReconciliation => {
    const newId = `recon-${Date.now()}`;
    const newRecon: StockReconciliation = {
      ...reconData,
      id: newId,
      status: applyInventoryAdjustment ? 'APPROVED_ADJUSTED' : 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
    };

    // If auto adjusting, update the branch stock to match physical count
    if (applyInventoryAdjustment) {
      setBranchStocks((prev) => {
        const updated = [...prev];
        newRecon.items.forEach((item) => {
          const index = updated.findIndex(
            (s) => s.branchId === newRecon.branchId && s.productId === item.productId
          );
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              quantity: item.physicalQty,
              lastUpdated: newRecon.date,
            };
          } else {
            updated.push({
              branchId: newRecon.branchId,
              productId: item.productId,
              quantity: item.physicalQty,
              lastUpdated: newRecon.date,
            });
          }
        });
        return updated;
      });
    }

    setStockReconciliations((prev) => [newRecon, ...prev]);
    return newRecon;
  };

  const approveStockReconciliation = (reconId: string, notes?: string) => {
    const target = stockReconciliations.find((r) => r.id === reconId);
    if (!target) return;

    // Apply physical counts to branch stocks
    setBranchStocks((prev) => {
      const updated = [...prev];
      target.items.forEach((item) => {
        const index = updated.findIndex(
          (s) => s.branchId === target.branchId && s.productId === item.productId
        );
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            quantity: item.physicalQty,
            lastUpdated: target.date,
          };
        }
      });
      return updated;
    });

    setStockReconciliations((prev) =>
      prev.map((r) =>
        r.id === reconId
          ? {
              ...r,
              status: 'APPROVED_ADJUSTED',
              reviewedBy: 'Owner / HQ Auditor',
              reviewNotes: notes || 'Approved and physical stock synchronized.',
            }
          : r
      )
    );
  };

  const rejectStockReconciliation = (reconId: string, notes?: string) => {
    setStockReconciliations((prev) =>
      prev.map((r) =>
        r.id === reconId
          ? {
              ...r,
              status: 'REJECTED',
              reviewedBy: 'Owner / HQ Auditor',
              reviewNotes: notes || 'Rejected reconciliation. Recount required.',
            }
          : r
      )
    );
  };

  const deleteStockReconciliation = (reconId: string): { success: boolean; message?: string } => {
    const exists = stockReconciliations.some((r) => r.id === reconId);
    if (!exists) {
      return { success: false, message: 'Stock reconciliation log not found.' };
    }
    setStockReconciliations((prev) => prev.filter((r) => r.id !== reconId));
    return { success: true, message: 'Reconciliation log deleted successfully.' };
  };

  const clearStockReconciliations = (branchId?: string) => {
    if (branchId) {
      setStockReconciliations((prev) => prev.filter((r) => r.branchId !== branchId));
    } else {
      setStockReconciliations([]);
    }
  };

  // Supplier Management
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newId = `supp-${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    api.createSupplier(newSupplier).catch(console.error);
    return newSupplier;
  };

  const updateSupplier = (supplierId: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, ...updates } : s))
    );
    api.updateSupplier(supplierId, updates).catch(console.error);
  };

  const deleteSupplier = (supplierId: string): { success: boolean; message: string } => {
    // Check if there are any transactions for this supplier
    const txCount = supplierTransactions.filter(
      (tx) => tx.supplierId === supplierId
    ).length;

    if (txCount > 0) {
      return {
        success: false,
        message: `Security Rule: This supplier account cannot be deleted because ${txCount} transaction(s) exist on the account. You must delete all invoices and payments on this account before deleting it.`,
      };
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    api.deleteSupplier(supplierId).catch(console.error);
    return { success: true, message: 'Supplier account deleted successfully.' };
  };

  // Weighted Average Cost (WAC) Calculator
  const calculateWeightedAverageCost = (
    currentStock: number,
    currentCost: number,
    newPurchaseQty: number,
    newPurchaseUnitCost: number
  ): number => {
    const safeCurrentStock = Math.max(0, Number(currentStock) || 0);
    const safeCurrentCost = Math.max(0, Number(currentCost) || 0);
    const safePurchaseQty = Math.max(0, Number(newPurchaseQty) || 0);
    const safePurchaseUnitCost = Math.max(0, Number(newPurchaseUnitCost) || 0);

    if (safePurchaseQty <= 0) {
      return safeCurrentCost;
    }

    if (safeCurrentStock <= 0) {
      // Direct invoice price when remaining stock is 0
      return Number(safePurchaseUnitCost.toFixed(2));
    }

    // WAC Formula: ((Current Remaining Stock * Current Cost) + (New Purchase Qty * New Unit Cost)) / Total Combined Stock
    const totalValuation = (safeCurrentStock * safeCurrentCost) + (safePurchaseQty * safePurchaseUnitCost);
    const totalCombinedStock = safeCurrentStock + safePurchaseQty;
    const wac = totalValuation / totalCombinedStock;

    return Number(wac.toFixed(2));
  };

  const getProductInvoiceHistory = (productId: string) => {
    const history: {
      transactionId: string;
      invoiceRef: string;
      date: string;
      supplierName: string;
      branchName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }[] = [];

    supplierTransactions.forEach((tx) => {
      if (tx.type === 'INVOICE' && tx.items && tx.items.length > 0) {
        const match = tx.items.find((it) => it.productId === productId);
        if (match) {
          history.push({
            transactionId: tx.id,
            invoiceRef: tx.referenceNo || 'INVOICE',
            date: tx.date || tx.createdAt.split('T')[0],
            supplierName: tx.supplierName,
            branchName: tx.branchName || 'HQ Central',
            quantity: match.quantity,
            unitCost: match.unitCost,
            totalCost: match.totalCost || match.quantity * match.unitCost,
          });
        }
      }
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const syncProductCostPricesWithInvoices = () => {
    let updatedCount = 0;
    const details: {
      productId: string;
      productCode: string;
      productName: string;
      oldCost: number;
      newCost: number;
      purchaseCount: number;
      currentStock: number;
      formulaUsed: string;
    }[] = [];

    const invoiceTransactions = [...supplierTransactions]
      .filter((tx) => tx.type === 'INVOICE' && tx.items && tx.items.length > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        const productPurchases: {
          date: string;
          quantity: number;
          unitCost: number;
          invoiceRef: string;
        }[] = [];

        invoiceTransactions.forEach((tx) => {
          const item = tx.items?.find((it) => it.productId === product.id);
          if (item && item.quantity > 0 && item.unitCost > 0) {
            productPurchases.push({
              date: tx.date,
              quantity: item.quantity,
              unitCost: item.unitCost,
              invoiceRef: tx.referenceNo,
            });
          }
        });

        const currentStock = branchStocks
          .filter((s) => s.productId === product.id)
          .reduce((sum, s) => sum + (s.quantity || 0), 0);

        if (productPurchases.length === 0) {
          return product;
        }

        // Sequential chronological WAC
        let runningStock = 0;
        let runningCost = productPurchases[0].unitCost;

        productPurchases.forEach((p, idx) => {
          if (idx === 0 || runningStock <= 0) {
            runningCost = p.unitCost;
            runningStock = p.quantity;
          } else {
            const newWac = ((runningStock * runningCost) + (p.quantity * p.unitCost)) / (runningStock + p.quantity);
            runningCost = Number(newWac.toFixed(2));
            runningStock += p.quantity;
          }
        });

        const finalCost = Number(runningCost.toFixed(2));
        const oldCost = product.costPrice;

        if (Math.abs(oldCost - finalCost) > 0.001) {
          updatedCount++;
        }

        details.push({
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          oldCost,
          newCost: finalCost,
          purchaseCount: productPurchases.length,
          currentStock,
          formulaUsed:
            productPurchases.length > 1
              ? 'Sequential Weighted Average Cost (WAC)'
              : 'Direct Purchase Invoice Price',
        });

        return {
          ...product,
          costPrice: finalCost,
        };
      });
    });

    return {
      updatedCount,
      message: `Weighted Average Cost recalculated across catalog. ${updatedCount} product cost ${
        updatedCount === 1 ? 'price' : 'prices'
      } synchronized with supplier purchase invoices.`,
      details,
    };
  };

  const addSupplierTransaction = (
    txData: Omit<SupplierTransaction, 'id' | 'createdAt'>,
    autoReplenishStock: boolean = true
  ): SupplierTransaction => {
    const newId = `stx-${Date.now()}`;
    const newTx: SupplierTransaction = {
      ...txData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    // If it's an invoice with items and branch selected, replenish branch stock
    if (newTx.type === 'INVOICE' && newTx.items && newTx.items.length > 0 && autoReplenishStock && newTx.branchId) {
      setBranchStocks((prev) => {
        const updated = [...prev];
        newTx.items!.forEach((item) => {
          const index = updated.findIndex(
            (s) => s.branchId === newTx.branchId && s.productId === item.productId
          );
          if (index >= 0) {
            updated[index] = {
              ...updated[index],
              quantity: updated[index].quantity + item.quantity,
              lastUpdated: newTx.date,
            };
          } else {
            updated.push({
              branchId: newTx.branchId!,
              productId: item.productId,
              quantity: item.quantity,
              lastUpdated: newTx.date,
            });
          }
        });
        return updated;
      });
    }

    // ON PRODUCT & PRICING: Update Cost Price to reflect invoice or Weighted Average Cost (WAC)
    if (newTx.type === 'INVOICE' && newTx.items && newTx.items.length > 0) {
      setProducts((prevProducts) => {
        return prevProducts.map((prod) => {
          const matchingItem = newTx.items?.find((it) => it.productId === prod.id);
          if (!matchingItem || matchingItem.quantity <= 0 || matchingItem.unitCost <= 0) {
            return prod;
          }

          // Remaining stock in network prior to this new purchase replenishment
          const currentRemainingStock = branchStocks
            .filter((bs) => bs.productId === prod.id)
            .reduce((sum, bs) => sum + (bs.quantity || 0), 0);

          const currentCostPrice = prod.costPrice || 0;
          const newWacCost = calculateWeightedAverageCost(
            currentRemainingStock,
            currentCostPrice,
            matchingItem.quantity,
            matchingItem.unitCost
          );

          return {
            ...prod,
            costPrice: newWacCost,
          };
        });
      });
    }

    // If it's a payment made through Airtel Money, log to Airtel Money ledger
    if (newTx.type === 'PAYMENT' && newTx.paymentMethod === 'Airtel Money') {
      const airtelRec: AirtelMoneyRecord = {
        id: `am-supp-${Date.now()}`,
        branchId: newTx.branchId || 'HQ',
        branchName: newTx.branchName || 'HQ Central Treasury',
        date: newTx.date,
        type: 'SUPPLIER_PAYMENT_OUT',
        amount: newTx.amount,
        transactionRef: newTx.paymentRef || newTx.referenceNo,
        senderNumber: 'HQ Corporate Airtel Line',
        receiverNumber: newTx.supplierName,
        verified: true,
        notes: `Supplier settlement to ${newTx.supplierName} (${newTx.referenceNo})`,
        createdAt: new Date().toISOString(),
      };
      setAirtelMoneyRecords((prev) => [airtelRec, ...prev]);
    }

    // If this payment settled an invoice, update invoice status
    if (newTx.type === 'PAYMENT' && newTx.allocatedInvoiceId) {
      setSupplierTransactions((prev) =>
        prev.map((t) => {
          if (t.id === newTx.allocatedInvoiceId) {
            return { ...t, status: 'PAID' };
          }
          return t;
        })
      );
    }

    setSupplierTransactions((prev) => [newTx, ...prev]);
    api.createSupplierTransaction(newTx).catch(console.error);
    return newTx;
  };

  const updateSupplierTransaction = (
    txId: string,
    updates: Partial<SupplierTransaction>,
    options?: {
      adjustBranchStock?: boolean;
      previousTx?: SupplierTransaction;
    }
  ): { success: boolean; message: string } => {
    const currentTx = supplierTransactions.find((tx) => tx.id === txId);
    if (!currentTx) {
      return { success: false, message: 'Supplier transaction not found.' };
    }

    const prevTx = options?.previousTx || currentTx;
    const isInvoice = prevTx.type === 'INVOICE' || updates.type === 'INVOICE';

    // If supplierId changed and supplierName wasn't explicitly given, look it up
    let finalUpdates = { ...updates };
    if (updates.supplierId && !updates.supplierName) {
      const supp = suppliers.find((s) => s.id === updates.supplierId);
      if (supp) {
        finalUpdates.supplierName = supp.name;
      }
    }

    // If branchId changed and branchName wasn't explicitly given, look it up
    if (updates.branchId && !updates.branchName) {
      const br = branches.find((b) => b.id === updates.branchId);
      if (br) {
        finalUpdates.branchName = br.name;
      }
    }

    // Handle inventory stock synchronization if requested for invoices
    if (isInvoice && options?.adjustBranchStock) {
      const oldBranchId = prevTx.branchId;
      const newBranchId = finalUpdates.branchId || prevTx.branchId;
      const oldItems = prevTx.items || [];
      const newItems = finalUpdates.items !== undefined ? finalUpdates.items : oldItems;

      setBranchStocks((prevStocks) => {
        let updated = [...prevStocks];

        // 1. Deduct old item quantities from the old branch
        if (oldBranchId && oldItems.length > 0) {
          oldItems.forEach((oldItem) => {
            const idx = updated.findIndex(
              (s) => s.branchId === oldBranchId && s.productId === oldItem.productId
            );
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                quantity: Math.max(0, updated[idx].quantity - oldItem.quantity),
              };
            }
          });
        }

        // 2. Add new item quantities to the new branch
        if (newBranchId && newItems.length > 0) {
          newItems.forEach((newItem) => {
            const idx = updated.findIndex(
              (s) => s.branchId === newBranchId && s.productId === newItem.productId
            );
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                quantity: updated[idx].quantity + newItem.quantity,
                lastUpdated: finalUpdates.date || prevTx.date,
              };
            } else {
              updated.push({
                branchId: newBranchId,
                productId: newItem.productId,
                quantity: newItem.quantity,
                lastUpdated: finalUpdates.date || prevTx.date,
              });
            }
          });
        }

        return updated;
      });
    }

    // Update Product Cost Price based on edited invoice line items and WAC
    if (isInvoice && finalUpdates.items && finalUpdates.items.length > 0) {
      setProducts((prevProducts) => {
        return prevProducts.map((prod) => {
          const matchingItem = finalUpdates.items?.find((it) => it.productId === prod.id);
          if (!matchingItem || matchingItem.quantity <= 0 || matchingItem.unitCost <= 0) {
            return prod;
          }

          const currentRemainingStock = branchStocks
            .filter((bs) => bs.productId === prod.id)
            .reduce((sum, bs) => sum + (bs.quantity || 0), 0);

          const currentCostPrice = prod.costPrice || 0;
          const newWacCost = calculateWeightedAverageCost(
            currentRemainingStock,
            currentCostPrice,
            matchingItem.quantity,
            matchingItem.unitCost
          );

          return {
            ...prod,
            costPrice: newWacCost,
          };
        });
      });
    }

    setSupplierTransactions((prev) =>
      prev.map((tx) => (tx.id === txId ? { ...tx, ...finalUpdates } : tx))
    );
    api.updateSupplierTransaction(txId, finalUpdates).catch(console.error);

    return {
      success: true,
      message: options?.adjustBranchStock
        ? 'Invoice and product line items saved. Branch stock and product cost prices (WAC) synchronized.'
        : 'Supplier transaction updated successfully.',
    };
  };

  const deleteSupplierTransaction = (
    txId: string,
    options?: { reverseBranchStock?: boolean }
  ): { success: boolean; message: string } => {
    const txToDelete = supplierTransactions.find((t) => t.id === txId);
    if (!txToDelete) {
      return { success: false, message: 'Transaction not found.' };
    }

    // Optional stock reversal for deleted invoice
    if (options?.reverseBranchStock && txToDelete.type === 'INVOICE' && txToDelete.branchId && txToDelete.items) {
      setBranchStocks((prevStocks) => {
        let updated = [...prevStocks];
        txToDelete.items?.forEach((item) => {
          const idx = updated.findIndex(
            (s) => s.branchId === txToDelete.branchId && s.productId === item.productId
          );
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              quantity: Math.max(0, updated[idx].quantity - item.quantity),
            };
          }
        });
        return updated;
      });
    }

    setSupplierTransactions((prev) => prev.filter((tx) => tx.id !== txId));
    api.deleteSupplierTransaction(txId).catch(console.error);
    return { success: true, message: 'Supplier transaction deleted successfully.' };
  };

  const getSupplierBalance = (supplierId: string) => {
    const transactions = supplierTransactions.filter((t) => t.supplierId === supplierId);
    let totalInvoiced = 0;
    let totalPaid = 0;

    transactions.forEach((t) => {
      if (t.type === 'INVOICE') {
        totalInvoiced += t.amount;
      } else if (t.type === 'PAYMENT') {
        totalPaid += t.amount;
      } else if (t.type === 'CREDIT_NOTE') {
        totalInvoiced -= t.amount;
      }
    });

    return {
      totalInvoiced,
      totalPaid,
      balanceDue: totalInvoiced - totalPaid,
    };
  };

  // Airtel Money Operations
  const addAirtelMoneyRecord = (recordData: Omit<AirtelMoneyRecord, 'id' | 'createdAt'>): AirtelMoneyRecord => {
    const newId = `am-${Date.now()}`;
    const newRecord: AirtelMoneyRecord = {
      ...recordData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setAirtelMoneyRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const verifyAirtelMoneyRecord = (recordId: string) => {
    setAirtelMoneyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, verified: true } : r))
    );
  };

  // Recalculation helpers for ledger running balances
  const computeBankBalances = (records: BankRecord[]) => {
    let running = 0;
    return records.map((r) => {
      running = Number((running + (Number(r.debit) || 0) - (Number(r.credit) || 0)).toFixed(2));
      return { ...r, balance: running };
    });
  };

  const computeCashBalances = (records: CashRecord[]) => {
    let running = 0;
    return records.map((r) => {
      running = Number((running + (Number(r.debit) || 0) - (Number(r.credit) || 0)).toFixed(2));
      return { ...r, balance: running };
    });
  };

  const computeAirtelBalances = (records: AirtelRecord[]) => {
    let running = 0;
    return records.map((r) => {
      running = Number((running + (Number(r.debit) || 0) - (Number(r.credit) || 0)).toFixed(2));
      return { ...r, balance: running };
    });
  };

  // Helper to recompute debtor summary balances from transactions
  const recalculateDebtors = (
    debtorsList: Debtor[],
    txsList: DebtorTransaction[]
  ): Debtor[] => {
    return debtorsList.map((debtor) => {
      const debtorTxs = txsList.filter((t) => t.debtorId === debtor.id);
      let totalCreditSales = 0;
      let totalPaid = 0;
      debtorTxs.forEach((tx) => {
        if (tx.type === 'CREDIT_SALE') {
          totalCreditSales += Number(tx.debit) || 0;
        } else if (tx.type === 'PAYMENT') {
          totalPaid += Number(tx.credit) || 0;
        } else {
          totalCreditSales += Number(tx.debit) || 0;
          totalPaid += Number(tx.credit) || 0;
        }
      });
      const outstandingBalance = Number((totalCreditSales - totalPaid).toFixed(2));
      return {
        ...debtor,
        totalCreditSales,
        totalPaid,
        outstandingBalance,
      };
    });
  };

  // Helper to recompute running balance for debtor transactions
  const recalculateDebtorRunningBalances = (txs: DebtorTransaction[]): DebtorTransaction[] => {
    const debtorMap: { [debtorId: string]: DebtorTransaction[] } = {};
    txs.forEach((tx) => {
      if (!debtorMap[tx.debtorId]) debtorMap[tx.debtorId] = [];
      debtorMap[tx.debtorId].push(tx);
    });

    const updatedTxMap = new Map<string, DebtorTransaction>();

    Object.keys(debtorMap).forEach((dId) => {
      const debtorTxs = debtorMap[dId];
      // Sort oldest first (by date and createdAt) to compute running balance
      const sorted = [...debtorTxs].sort((a, b) => {
        const dDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dDiff !== 0) return dDiff;
        return new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime();
      });

      let running = 0;
      sorted.forEach((tx) => {
        const debit = Number(tx.debit) || 0;
        const credit = Number(tx.credit) || 0;
        running = Number((running + debit - credit).toFixed(2));
        updatedTxMap.set(tx.id, { ...tx, balance: running });
      });
    });

    return txs.map((tx) => updatedTxMap.get(tx.id) || tx);
  };

  // Bank Record Operations (Direct Debits, Credits & Running Balances)
  const addBankRecord = (
    recordData: Omit<BankRecord, 'id' | 'createdAt' | 'balance'>
  ): BankRecord => {
    const newId = `bnk-${Date.now()}`;
    const now = new Date().toISOString();

    const debitAmt = Number(recordData.debit) || 0;
    const creditAmt = Number(recordData.credit) || 0;

    const currentRecords = bankRecords;
    const lastBalance = currentRecords.length > 0 ? currentRecords[currentRecords.length - 1].balance : 0;
    const newBalance = Number((lastBalance + debitAmt - creditAmt).toFixed(2));

    const newRecord: BankRecord = {
      ...recordData,
      id: newId,
      debit: debitAmt,
      credit: creditAmt,
      balance: newBalance,
      createdAt: now,
    };

    const updated = [...currentRecords, newRecord];
    setBankRecords(updated);

    // Synchronize directly with OwnerTreasury to guarantee 100% reconciliation
    setOwnerTreasury((prev) => ({
      ...prev,
      cashInBank: newBalance,
      lastUpdated: now,
    }));

    api.createBankRecord(newRecord).catch(console.error);
    api.updateTreasury({ cashInBank: newBalance, lastUpdated: now }).catch(console.error);

    return newRecord;
  };

  const updateBankRecord = (id: string, updates: Partial<BankRecord>) => {
    const now = new Date().toISOString();
    const updated = bankRecords.map((r) => (r.id === id ? { ...r, ...updates } : r));
    const recomputed = computeBankBalances(updated);
    setBankRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashInBank: finalBalance,
      lastUpdated: now,
    }));

    api.updateBankRecord(id, updates).catch(console.error);
    api.updateTreasury({ cashInBank: finalBalance, lastUpdated: now }).catch(console.error);
  };

  const deleteBankRecord = (id: string) => {
    const now = new Date().toISOString();
    const filtered = bankRecords.filter((r) => r.id !== id);
    const recomputed = computeBankBalances(filtered);
    setBankRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashInBank: finalBalance,
      lastUpdated: now,
    }));

    api.deleteBankRecord(id).catch(console.error);
    api.updateTreasury({ cashInBank: finalBalance, lastUpdated: now }).catch(console.error);

    return { success: true, message: 'Bank transaction deleted.' };
  };

  const bulkDeleteBankRecords = (ids: string[]) => {
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    const filtered = bankRecords.filter((r) => !idSet.has(r.id));
    const recomputed = computeBankBalances(filtered);
    setBankRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashInBank: finalBalance,
      lastUpdated: now,
    }));

    ids.forEach((id) => api.deleteBankRecord(id).catch(console.error));
    api.updateTreasury({ cashInBank: finalBalance, lastUpdated: now }).catch(console.error);

    return { success: true, message: `Successfully deleted ${ids.length} bank transactions.` };
  };

  // Cash Record Operations (Direct Debits, Credits & Running Balances)
  const addCashRecord = (
    recordData: Omit<CashRecord, 'id' | 'createdAt' | 'balance'>
  ): CashRecord => {
    const newId = `csh-${Date.now()}`;
    const now = new Date().toISOString();

    const debitAmt = Number(recordData.debit) || 0;
    const creditAmt = Number(recordData.credit) || 0;

    const currentRecords = cashRecords;
    const lastBalance = currentRecords.length > 0 ? currentRecords[currentRecords.length - 1].balance : 0;
    const newBalance = Number((lastBalance + debitAmt - creditAmt).toFixed(2));

    const newRecord: CashRecord = {
      ...recordData,
      id: newId,
      debit: debitAmt,
      credit: creditAmt,
      balance: newBalance,
      createdAt: now,
    };

    const updated = [...currentRecords, newRecord];
    setCashRecords(updated);

    // Synchronize directly with OwnerTreasury to guarantee 100% reconciliation
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnHand: newBalance,
      lastUpdated: now,
    }));

    api.createCashRecord(newRecord).catch(console.error);
    api.updateTreasury({ cashOnHand: newBalance, lastUpdated: now }).catch(console.error);

    return newRecord;
  };

  const updateCashRecord = (id: string, updates: Partial<CashRecord>) => {
    const now = new Date().toISOString();
    const updated = cashRecords.map((r) => (r.id === id ? { ...r, ...updates } : r));
    const recomputed = computeCashBalances(updated);
    setCashRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnHand: finalBalance,
      lastUpdated: now,
    }));

    api.updateCashRecord(id, updates).catch(console.error);
    api.updateTreasury({ cashOnHand: finalBalance, lastUpdated: now }).catch(console.error);
  };

  const deleteCashRecord = (id: string) => {
    const now = new Date().toISOString();
    const filtered = cashRecords.filter((r) => r.id !== id);
    const recomputed = computeCashBalances(filtered);
    setCashRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnHand: finalBalance,
      lastUpdated: now,
    }));

    api.deleteCashRecord(id).catch(console.error);
    api.updateTreasury({ cashOnHand: finalBalance, lastUpdated: now }).catch(console.error);

    return { success: true, message: 'Cash transaction deleted.' };
  };

  const bulkDeleteCashRecords = (ids: string[]) => {
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    const filtered = cashRecords.filter((r) => !idSet.has(r.id));
    const recomputed = computeCashBalances(filtered);
    setCashRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnHand: finalBalance,
      lastUpdated: now,
    }));

    ids.forEach((id) => api.deleteCashRecord(id).catch(console.error));
    api.updateTreasury({ cashOnHand: finalBalance, lastUpdated: now }).catch(console.error);

    return { success: true, message: `Successfully deleted ${ids.length} cash transactions.` };
  };

  // Airtel Money Ledger Operations & Conversions
  const addAirtelRecord = (
    recordData: Omit<AirtelRecord, 'id' | 'createdAt' | 'balance'>
  ): AirtelRecord => {
    const newId = `air-${Date.now()}`;
    const now = new Date().toISOString();

    const debitAmt = Number(recordData.debit) || 0;
    const creditAmt = Number(recordData.credit) || 0;

    const currentRecords = airtelRecords;
    const lastBalance = currentRecords.length > 0 ? currentRecords[currentRecords.length - 1].balance : 0;
    const newBalance = Number((lastBalance + debitAmt - creditAmt).toFixed(2));

    const newRecord: AirtelRecord = {
      ...recordData,
      id: newId,
      debit: debitAmt,
      credit: creditAmt,
      balance: newBalance,
      createdAt: now,
    };

    const updated = [...currentRecords, newRecord];
    setAirtelRecords(updated);

    // Synchronize directly with OwnerTreasury
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnAirtelMoney: newBalance,
      lastUpdated: now,
    }));

    api.createAirtelRecord(newRecord).catch(console.error);
    api.updateTreasury({ cashOnAirtelMoney: newBalance, lastUpdated: now }).catch(console.error);

    return newRecord;
  };

  const updateAirtelRecord = (id: string, updates: Partial<AirtelRecord>) => {
    const now = new Date().toISOString();
    const updated = airtelRecords.map((r) => (r.id === id ? { ...r, ...updates } : r));
    const recomputed = computeAirtelBalances(updated);
    setAirtelRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnAirtelMoney: finalBalance,
      lastUpdated: now,
    }));

    api.updateAirtelRecord(id, updates).catch(console.error);
    api.updateTreasury({ cashOnAirtelMoney: finalBalance, lastUpdated: now }).catch(console.error);
  };

  const deleteAirtelRecord = (id: string) => {
    const now = new Date().toISOString();
    const filtered = airtelRecords.filter((r) => r.id !== id);
    const recomputed = computeAirtelBalances(filtered);
    setAirtelRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnAirtelMoney: finalBalance,
      lastUpdated: now,
    }));

    api.deleteAirtelRecord(id).catch(console.error);
    api.updateTreasury({ cashOnAirtelMoney: finalBalance, lastUpdated: now }).catch(console.error);

    return { success: true, message: 'Airtel Money transaction deleted.' };
  };

  const bulkDeleteAirtelRecords = (ids: string[]) => {
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    const filtered = airtelRecords.filter((r) => !idSet.has(r.id));
    const recomputed = computeAirtelBalances(filtered);
    setAirtelRecords(recomputed);

    const finalBalance = recomputed.length > 0 ? recomputed[recomputed.length - 1].balance : 0;
    setOwnerTreasury((prev) => ({
      ...prev,
      cashOnAirtelMoney: finalBalance,
      lastUpdated: now,
    }));
    return { success: true, message: `Successfully deleted ${ids.length} Airtel Money transactions.` };
  };

  // Convert Airtel Money to Physical Cash
  const convertAirtelToCash = (
    amount: number,
    date: string,
    refNo?: string,
    notes?: string
  ): { success: boolean; message?: string } => {
    if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };
    const currentAirtelBal = airtelRecords.length > 0 ? airtelRecords[airtelRecords.length - 1].balance : ownerTreasury.cashOnAirtelMoney;
    if (amount > currentAirtelBal) {
      return {
        success: false,
        message: `Insufficient Airtel Money balance. Available: K${currentAirtelBal.toLocaleString()}, requested: K${amount.toLocaleString()}.`,
      };
    }

    const now = new Date().toISOString();
    const txRef = refNo || `AM-CSH-${Date.now().toString().slice(-5)}`;

    // 1. Deduct from Airtel Record (Credit)
    const airtelOutflow: Omit<AirtelRecord, 'id' | 'createdAt' | 'balance'> = {
      date,
      details: notes ? `Conversion to Cash: ${notes}` : 'Conversion: Airtel Money Float cashed out to Physical Cash Safe',
      debit: 0,
      credit: amount,
      referenceNo: txRef,
      category: 'CONVERSION_CASH',
      recipientOrSender: 'Physical Cash Safe / HQ Cashier',
      notes,
    };
    addAirtelRecord(airtelOutflow);

    // 2. Add to Cash Record (Debit)
    const cashInflow: Omit<CashRecord, 'id' | 'createdAt' | 'balance'> = {
      date,
      details: notes ? `Cash Received from Airtel: ${notes}` : 'Cash Received from Airtel Money Conversion / Withdrawal',
      debit: amount,
      credit: 0,
      referenceNo: txRef,
      category: 'CONVERSION_AIRTEL',
      notes,
    };
    addCashRecord(cashInflow);

    return {
      success: true,
      message: `Successfully converted K${amount.toLocaleString()} from Airtel Money to Cash.`,
    };
  };

  // Convert Airtel Money to Bank Account
  const convertAirtelToBank = (
    amount: number,
    date: string,
    refNo?: string,
    notes?: string
  ): { success: boolean; message?: string } => {
    if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };
    const currentAirtelBal = airtelRecords.length > 0 ? airtelRecords[airtelRecords.length - 1].balance : ownerTreasury.cashOnAirtelMoney;
    if (amount > currentAirtelBal) {
      return {
        success: false,
        message: `Insufficient Airtel Money balance. Available: K${currentAirtelBal.toLocaleString()}, requested: K${amount.toLocaleString()}.`,
      };
    }

    const now = new Date().toISOString();
    const txRef = refNo || `AM-BNK-${Date.now().toString().slice(-5)}`;

    // 1. Deduct from Airtel Record (Credit)
    const airtelOutflow: Omit<AirtelRecord, 'id' | 'createdAt' | 'balance'> = {
      date,
      details: notes ? `Bank Transfer: ${notes}` : 'Conversion: Airtel Money Float transferred to Zanaco Operating Bank Account',
      debit: 0,
      credit: amount,
      referenceNo: txRef,
      category: 'CONVERSION_BANK',
      recipientOrSender: 'Zanaco Bank Operating Account',
      notes,
    };
    addAirtelRecord(airtelOutflow);

    // 2. Add to Bank Record (Debit)
    const bankInflow: Omit<BankRecord, 'id' | 'createdAt' | 'balance'> = {
      date,
      details: notes ? `Airtel Money Withdrawal: ${notes}` : 'Bank Deposit / Direct Transfer from Airtel Money Float',
      debit: amount,
      credit: 0,
      referenceNo: txRef,
      category: 'CONVERSION_AIRTEL',
      notes,
    };
    addBankRecord(bankInflow);

    return {
      success: true,
      message: `Successfully converted K${amount.toLocaleString()} from Airtel Money to Bank.`,
    };
  };

  // Pay Supplier using Airtel Money Float
  const paySupplierFromAirtel = (
    supplierId: string,
    amount: number,
    date: string,
    invoiceRef?: string,
    notes?: string
  ): { success: boolean; message?: string } => {
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than 0.' };
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found.' };

    const currentAirtelBal = airtelRecords.length > 0 ? airtelRecords[airtelRecords.length - 1].balance : ownerTreasury.cashOnAirtelMoney;
    if (amount > currentAirtelBal) {
      return {
        success: false,
        message: `Insufficient Airtel Money balance. Available: K${currentAirtelBal.toLocaleString()}, payment required: K${amount.toLocaleString()}.`,
      };
    }

    const txRef = invoiceRef || `AM-SUP-${Date.now().toString().slice(-5)}`;

    // 1. Deduct from Airtel Record (Credit)
    const airtelOutflow: Omit<AirtelRecord, 'id' | 'createdAt' | 'balance'> = {
      date,
      details: `Supplier Settlement: ${supplier.name} ${invoiceRef ? `(Ref: ${invoiceRef})` : ''}`,
      debit: 0,
      credit: amount,
      referenceNo: txRef,
      category: 'SUPPLIER_PAYMENT',
      recipientOrSender: `${supplier.name} (${supplier.phone || 'Merchant Till'})`,
      notes,
    };
    addAirtelRecord(airtelOutflow);

    // 2. Debit Supplier Account (Record Payment in Supplier Ledger)
    addSupplierTransaction({
      supplierId,
      supplierName: supplier.name,
      date,
      type: 'PAYMENT',
      amount,
      referenceNo: txRef,
      paymentMethod: 'Airtel Money',
      status: 'PAID',
      notes: notes || `Direct settlement via Airtel Money Float to ${supplier.name}`,
    });

    return {
      success: true,
      message: `Successfully paid K${amount.toLocaleString()} to ${supplier.name} from Airtel Money. Supplier balance reduced.`,
    };
  };

  // Pay Expense using Airtel Money Float
  const payExpenseFromAirtel = (
    amount: number,
    date: string,
    expenseDetails: string,
    refNo?: string
  ): { success: boolean; message?: string } => {
    if (amount <= 0) return { success: false, message: 'Expense amount must be greater than 0.' };
    const currentAirtelBal = airtelRecords.length > 0 ? airtelRecords[airtelRecords.length - 1].balance : ownerTreasury.cashOnAirtelMoney;
    if (amount > currentAirtelBal) {
      return {
        success: false,
        message: `Insufficient Airtel Money balance. Available: K${currentAirtelBal.toLocaleString()}, expense: K${amount.toLocaleString()}.`,
      };
    }

    const txRef = refNo || `AM-EXP-${Date.now().toString().slice(-5)}`;

    // Deduct from Airtel Record (Credit)
    addAirtelRecord({
      date,
      details: `Expense Payment: ${expenseDetails}`,
      debit: 0,
      credit: amount,
      referenceNo: txRef,
      category: 'EXPENSE_PAYMENT',
      notes: expenseDetails,
    });

    return {
      success: true,
      message: `Successfully recorded K${amount.toLocaleString()} expense paid from Airtel Money.`,
    };
  };

  // Debtors / Credit Customers Operations
  const addDebtor = (
    debtorData: Omit<Debtor, 'id' | 'createdAt' | 'totalCreditSales' | 'totalPaid' | 'outstandingBalance'>
  ): Debtor => {
    const newId = `deb-${Date.now()}`;
    const newDebtor: Debtor = {
      ...debtorData,
      id: newId,
      code: debtorData.code || `DEB-${String(debtors.length + 1).padStart(3, '0')}`,
      totalCreditSales: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      status: debtorData.status || 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setDebtors((prev) => [newDebtor, ...prev]);
    api.createDebtor(newDebtor).catch(console.error);
    return newDebtor;
  };

  const updateDebtor = (id: string, updates: Partial<Debtor>) => {
    setDebtors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    api.updateDebtor(id, updates).catch(console.error);
  };

  const deleteDebtor = (id: string): { success: boolean; message: string } => {
    const debtor = debtors.find((d) => d.id === id);
    if (!debtor) return { success: false, message: 'Debtor customer not found.' };

    const txCount = debtorTransactions.filter((tx) => tx.debtorId === id).length;
    if (txCount > 0) {
      return {
        success: false,
        message: `Security Rule: Cannot delete debtor "${debtor.name}" because ${txCount} transaction(s) exist on their account. You must delete all credit sales and repayment entries under this debtor before deleting the account.`,
      };
    }

    setDebtors((prev) => prev.filter((d) => d.id !== id));
    api.deleteDebtor(id).catch(console.error);
    return { success: true, message: `Debtor "${debtor.name}" deleted successfully.` };
  };

  const addDebtorCreditSale = (
    debtorId: string,
    amount: number,
    date: string,
    invoiceRef: string,
    details: string,
    branchId?: string,
    branchName?: string
  ): DebtorTransaction => {
    const debtor = debtors.find((d) => d.id === debtorId);
    const newId = `dtx-${Date.now()}`;
    const now = new Date().toISOString();

    const newTx: DebtorTransaction = {
      id: newId,
      debtorId,
      debtorName: debtor?.name || 'Credit Customer',
      branchId,
      branchName,
      date,
      type: 'CREDIT_SALE',
      referenceNo: invoiceRef || `INV-CS-${Date.now().toString().slice(-4)}`,
      details,
      debit: amount,
      credit: 0,
      balance: (debtor?.outstandingBalance || 0) + amount,
      status: 'UNPAID',
      createdAt: now,
    };

    const nextTxs = recalculateDebtorRunningBalances([newTx, ...debtorTransactions]);
    setDebtorTransactions(nextTxs);

    // Update debtor balances
    setDebtors((prev) => recalculateDebtors(prev, nextTxs));

    const finalTx = nextTxs.find((t) => t.id === newId) || newTx;
    api.createDebtorTransaction(finalTx).catch(console.error);

    return finalTx;
  };

  const recordDebtorPayment = (
    debtorId: string,
    amount: number,
    date: string,
    receiptNo: string,
    paymentMethod: 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque',
    destination: 'CASH' | 'BANK' | 'AIRTEL',
    notes?: string
  ): { success: boolean; message?: string; transaction?: DebtorTransaction } => {
    const debtor = debtors.find((d) => d.id === debtorId);
    if (!debtor) return { success: false, message: 'Debtor customer not found.' };
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than 0.' };

    const newId = `dtx-${Date.now()}`;
    const now = new Date().toISOString();
    const newBalance = Math.max(0, debtor.outstandingBalance - amount);

    const newTx: DebtorTransaction = {
      id: newId,
      debtorId,
      debtorName: debtor.name,
      date,
      type: 'PAYMENT',
      referenceNo: receiptNo || `RCT-${Date.now().toString().slice(-4)}`,
      details: notes || `Customer Repayment by ${debtor.name} via ${paymentMethod}`,
      debit: 0,
      credit: amount,
      balance: newBalance,
      paymentMethod,
      paymentDestination: destination,
      status: 'PAID',
      createdAt: now,
    };

    const nextTxs = recalculateDebtorRunningBalances([newTx, ...debtorTransactions]);
    setDebtorTransactions(nextTxs);
    const updatedDebtors = recalculateDebtors(debtors, nextTxs);
    setDebtors(updatedDebtors);

    // Route repayment into the specified owner ledger
    if (destination === 'CASH') {
      addCashRecord({
        date,
        details: `Debtor Settlement: ${debtor.name} (${paymentMethod})`,
        debit: amount,
        credit: 0,
        referenceNo: receiptNo,
        category: 'DEBTOR_PAYMENT',
        notes: `Received from ${debtor.name}`,
      });
    } else if (destination === 'BANK') {
      addBankRecord({
        date,
        details: `Debtor Wire Settlement: ${debtor.name} (${paymentMethod})`,
        debit: amount,
        credit: 0,
        referenceNo: receiptNo,
        category: 'DEBTOR_PAYMENT',
        notes: `Wire transfer deposit from ${debtor.name}`,
      });
    } else if (destination === 'AIRTEL') {
      addAirtelRecord({
        date,
        details: `Debtor Settlement: ${debtor.name} (${paymentMethod})`,
        debit: amount,
        credit: 0,
        referenceNo: receiptNo,
        category: 'DEBTOR_PAYMENT',
        recipientOrSender: `${debtor.name} (${debtor.phone})`,
        notes: `Airtel Money repayment from ${debtor.name}`,
      });
    }

    const createdTx = nextTxs.find((t) => t.id === newId) || newTx;
    api.createDebtorTransaction(createdTx).catch(console.error);

    return {
      success: true,
      message: `Successfully recorded repayment of K${amount.toLocaleString()} for ${debtor.name}. Outstanding balance is now K${newBalance.toLocaleString()}.`,
      transaction: createdTx,
    };
  };

  const updateDebtorTransaction = (
    id: string,
    updates: Partial<DebtorTransaction>
  ): { success: boolean; message?: string } => {
    const existing = debtorTransactions.find((t) => t.id === id);
    if (!existing) {
      return { success: false, message: 'Debtor transaction not found.' };
    }

    const rawUpdated = debtorTransactions.map((tx) => {
      if (tx.id === id) {
        const merged = { ...tx, ...updates };
        if (updates.debit !== undefined) merged.debit = Number(updates.debit) || 0;
        if (updates.credit !== undefined) merged.credit = Number(updates.credit) || 0;
        return merged;
      }
      return tx;
    });

    const nextTxs = recalculateDebtorRunningBalances(rawUpdated);
    setDebtorTransactions(nextTxs);
    setDebtors((prev) => recalculateDebtors(prev, nextTxs));
    api.updateDebtorTransaction(id, updates).catch(console.error);

    return { success: true, message: 'Debtor transaction entry updated successfully.' };
  };

  const deleteDebtorTransaction = (id: string): { success: boolean; message?: string } => {
    const existing = debtorTransactions.find((t) => t.id === id);
    if (!existing) {
      return { success: false, message: 'Transaction not found.' };
    }

    const filtered = debtorTransactions.filter((t) => t.id !== id);
    const nextTxs = recalculateDebtorRunningBalances(filtered);
    setDebtorTransactions(nextTxs);
    setDebtors((prev) => recalculateDebtors(prev, nextTxs));
    api.deleteDebtorTransaction(id).catch(console.error);
    return { success: true, message: 'Debtor transaction deleted and balance updated.' };
  };

  const getDebtorBalance = (debtorId: string) => {
    const debtorTxs = debtorTransactions.filter((t) => t.debtorId === debtorId);
    let totalCreditSales = 0;
    let totalPaid = 0;
    debtorTxs.forEach((tx) => {
      if (tx.type === 'CREDIT_SALE') {
        totalCreditSales += Number(tx.debit) || 0;
      } else if (tx.type === 'PAYMENT') {
        totalPaid += Number(tx.credit) || 0;
      }
    });
    return {
      totalCreditSales,
      totalPaid,
      outstandingBalance: totalCreditSales - totalPaid,
    };
  };

  // Branch Cash Movement Operations & Owner Approvals
  const createCashMovement = (
    movementData: Omit<BranchCashMovement, 'id' | 'requestedAt' | 'status'>
  ): BranchCashMovement => {
    const newId = `cm-${Date.now()}`;
    const newMovement: BranchCashMovement = {
      ...movementData,
      id: newId,
      status: 'PENDING_APPROVAL',
      requestedAt: new Date().toISOString(),
    };
    setCashMovements((prev) => [newMovement, ...prev]);
    api.createCashMovement(newMovement).catch(console.error);
    return newMovement;
  };

  const approveCashMovement = (movementId: string, reviewNotes?: string) => {
    const movement = cashMovements.find((m) => m.id === movementId);
    if (!movement) {
      return { success: false, message: 'Cash movement record not found.' };
    }
    if (movement.status === 'APPROVED') {
      return { success: false, message: 'This transaction is already approved.' };
    }

    const now = new Date().toISOString();
    setCashMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? {
              ...m,
              status: 'APPROVED',
              reviewedBy: 'Owner / HQ',
              reviewedAt: now,
              reviewNotes: reviewNotes || m.reviewNotes || 'Approved by Owner',
            }
          : m
      )
    );

    api.updateCashMovement(movementId, {
      status: 'APPROVED',
      reviewedBy: 'Owner / HQ',
      reviewedAt: now,
      reviewNotes: reviewNotes || movement.reviewNotes || 'Approved by Owner',
    }).catch(console.error);

    // Credit the Owner Treasury based on destination and record in corresponding ledger
    if (movement.destination === 'OWNER_CASH') {
      const lastBal = cashRecords.length > 0 ? cashRecords[cashRecords.length - 1].balance : ownerTreasury.cashOnHand;
      const newBal = Number((lastBal + movement.amount).toFixed(2));
      const newCashRec: CashRecord = {
        id: `csh-cm-${Date.now()}`,
        date: movement.date,
        details: `Branch Handover from ${movement.branchName} (${movement.submittedBy})`,
        debit: movement.amount,
        credit: 0,
        balance: newBal,
        referenceNo: movement.referenceNumber || `HO-${movement.branchCode}-${Date.now().toString().slice(-4)}`,
        category: 'BRANCH_HANDOVER',
        createdAt: now,
      };
      setCashRecords((prev) => [...prev, newCashRec]);
      setOwnerTreasury((prev) => ({
        ...prev,
        cashOnHand: newBal,
        lastUpdated: now,
      }));
      api.createCashRecord(newCashRec).catch(console.error);
      api.updateTreasury({ cashOnHand: newBal, lastUpdated: now }).catch(console.error);
    } else if (movement.destination === 'BANK') {
      const lastBal = bankRecords.length > 0 ? bankRecords[bankRecords.length - 1].balance : ownerTreasury.cashInBank;
      const newBal = Number((lastBal + movement.amount).toFixed(2));
      const newBankRec: BankRecord = {
        id: `bnk-cm-${Date.now()}`,
        date: movement.date,
        details: `Branch Bank Deposit - ${movement.branchName} (${movement.submittedBy})`,
        debit: movement.amount,
        credit: 0,
        balance: newBal,
        referenceNo: movement.referenceNumber || `DEP-${movement.branchCode}-${Date.now().toString().slice(-4)}`,
        category: 'BRANCH_DEPOSIT',
        createdAt: now,
      };
      setBankRecords((prev) => [...prev, newBankRec]);
      setOwnerTreasury((prev) => ({
        ...prev,
        cashInBank: newBal,
        lastUpdated: now,
      }));
      api.createBankRecord(newBankRec).catch(console.error);
      api.updateTreasury({ cashInBank: newBal, lastUpdated: now }).catch(console.error);
    } else if (movement.destination === 'AIRTEL_MONEY') {
      const newAirtelBal = Number((ownerTreasury.cashOnAirtelMoney + movement.amount).toFixed(2));
      setOwnerTreasury((prev) => ({
        ...prev,
        cashOnAirtelMoney: newAirtelBal,
        lastUpdated: now,
      }));
      api.updateTreasury({ cashOnAirtelMoney: newAirtelBal, lastUpdated: now }).catch(console.error);
    }

    // If destination was Airtel Money, also record in Airtel Money Ledger
    if (movement.destination === 'AIRTEL_MONEY') {
      const newAirtelRecord: AirtelMoneyRecord = {
        id: `am-cm-${Date.now()}`,
        branchId: movement.branchId,
        branchName: movement.branchName,
        date: movement.date,
        type: 'DAILY_SALES_CASH_IN',
        amount: movement.amount,
        transactionRef: movement.referenceNumber || `AM-RECON-${Date.now().toString().slice(-6)}`,
        senderNumber: movement.submittedBy || 'Branch Cashier',
        receiverNumber: movement.recipientDetails || 'HQ Corporate Wallet',
        verified: true,
        notes: `Branch Cash Transfer from ${movement.branchName}: ${movement.notes || ''}`,
        createdAt: now,
      };
      setAirtelMoneyRecords((prev) => [newAirtelRecord, ...prev]);
      api.createAirtelMoney(newAirtelRecord).catch(console.error);
    }

    return {
      success: true,
      message: `Approved transfer of K${movement.amount.toLocaleString()} to ${movement.destination.replace('_', ' ')}.`,
    };
  };

  const rejectCashMovement = (movementId: string, reviewNotes?: string) => {
    const movement = cashMovements.find((m) => m.id === movementId);
    if (!movement) {
      return { success: false, message: 'Cash movement record not found.' };
    }

    const now = new Date().toISOString();
    setCashMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? {
              ...m,
              status: 'REJECTED',
              reviewedBy: 'Owner / HQ',
              reviewedAt: now,
              reviewNotes: reviewNotes || 'Rejected by Owner',
            }
          : m
      )
    );

    api.updateCashMovement(movementId, {
      status: 'REJECTED',
      reviewedBy: 'Owner / HQ',
      reviewedAt: now,
      reviewNotes: reviewNotes || 'Rejected by Owner',
    }).catch(console.error);

    return { success: true, message: 'Transaction rejected.' };
  };

  const updateCashMovement = (
    id: string,
    updates: Partial<BranchCashMovement>
  ): { success: boolean; message?: string } => {
    const existing = cashMovements.find((m) => m.id === id);
    if (!existing) {
      return { success: false, message: 'Cash movement record not found.' };
    }

    setCashMovements((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const merged = { ...m, ...updates };
          if (updates.amount !== undefined) merged.amount = Number(updates.amount) || 0;
          return merged;
        }
        return m;
      })
    );

    api.updateCashMovement(id, updates).catch(console.error);
    return { success: true, message: 'Cash movement entry updated successfully.' };
  };

  const deleteCashMovement = (movementId: string) => {
    setCashMovements((prev) => prev.filter((m) => m.id !== movementId));
    api.deleteCashMovement(movementId).catch(console.error);
    return { success: true, message: 'Transaction record deleted.' };
  };

  const transferOwnerFunds = (
    source: CashMovementDestination,
    destination: CashMovementDestination,
    amount: number,
    notes?: string
  ) => {
    if (source === destination) {
      return { success: false, message: 'Source and destination accounts must be different.' };
    }
    if (amount <= 0) {
      return { success: false, message: 'Please enter a valid positive transfer amount.' };
    }

    let sourceField: keyof OwnerTreasury = 'cashOnHand';
    if (source === 'BANK') sourceField = 'cashInBank';
    if (source === 'AIRTEL_MONEY') sourceField = 'cashOnAirtelMoney';

    let destField: keyof OwnerTreasury = 'cashOnHand';
    if (destination === 'BANK') destField = 'cashInBank';
    if (destination === 'AIRTEL_MONEY') destField = 'cashOnAirtelMoney';

    if (ownerTreasury[sourceField] < amount) {
      return {
        success: false,
        message: `Insufficient funds in ${source.replace('_', ' ')} (Available: K${ownerTreasury[sourceField].toLocaleString()})`,
      };
    }

    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];
    const txRef = `TRF-${Date.now().toString().slice(-6)}`;

    // If source is BANK, credit bank (outflow)
    if (source === 'BANK') {
      const lastBal = bankRecords.length > 0 ? bankRecords[bankRecords.length - 1].balance : ownerTreasury.cashInBank;
      const newBal = Number((lastBal - amount).toFixed(2));
      const rec: BankRecord = {
        id: `bnk-trf-${Date.now()}`,
        date: dateStr,
        details: `Transfer Out to ${destination.replace('_', ' ')}${notes ? ` - ${notes}` : ''}`,
        debit: 0,
        credit: amount,
        balance: newBal,
        referenceNo: txRef,
        category: 'INTERNAL_TRANSFER',
        createdAt: now,
      };
      setBankRecords((prev) => [...prev, rec]);
    }

    // If destination is BANK, debit bank (inflow)
    if (destination === 'BANK') {
      const lastBal = bankRecords.length > 0 ? bankRecords[bankRecords.length - 1].balance : ownerTreasury.cashInBank;
      const newBal = Number((lastBal + amount).toFixed(2));
      const rec: BankRecord = {
        id: `bnk-trf-${Date.now()}`,
        date: dateStr,
        details: `Transfer In from ${source.replace('_', ' ')}${notes ? ` - ${notes}` : ''}`,
        debit: amount,
        credit: 0,
        balance: newBal,
        referenceNo: txRef,
        category: 'INTERNAL_TRANSFER',
        createdAt: now,
      };
      setBankRecords((prev) => [...prev, rec]);
    }

    // If source is OWNER_CASH, credit cash (outflow)
    if (source === 'OWNER_CASH') {
      const lastBal = cashRecords.length > 0 ? cashRecords[cashRecords.length - 1].balance : ownerTreasury.cashOnHand;
      const newBal = Number((lastBal - amount).toFixed(2));
      const rec: CashRecord = {
        id: `csh-trf-${Date.now()}`,
        date: dateStr,
        details: `Cash Outflow to ${destination.replace('_', ' ')}${notes ? ` - ${notes}` : ''}`,
        debit: 0,
        credit: amount,
        balance: newBal,
        referenceNo: txRef,
        category: 'INTERNAL_TRANSFER',
        createdAt: now,
      };
      setCashRecords((prev) => [...prev, rec]);
    }

    // If destination is OWNER_CASH, debit cash (inflow)
    if (destination === 'OWNER_CASH') {
      const lastBal = cashRecords.length > 0 ? cashRecords[cashRecords.length - 1].balance : ownerTreasury.cashOnHand;
      const newBal = Number((lastBal + amount).toFixed(2));
      const rec: CashRecord = {
        id: `csh-trf-${Date.now()}`,
        date: dateStr,
        details: `Cash Inflow from ${source.replace('_', ' ')}${notes ? ` - ${notes}` : ''}`,
        debit: amount,
        credit: 0,
        balance: newBal,
        referenceNo: txRef,
        category: 'INTERNAL_TRANSFER',
        createdAt: now,
      };
      setCashRecords((prev) => [...prev, rec]);
    }

    setOwnerTreasury((prev) => ({
      ...prev,
      [sourceField]: Number((Number(prev[sourceField]) - amount).toFixed(2)),
      [destField]: Number((Number(prev[destField]) + amount).toFixed(2)),
      lastUpdated: now,
    }));

    return {
      success: true,
      message: `Successfully transferred K${amount.toLocaleString()} from ${source.replace('_', ' ')} to ${destination.replace('_', ' ')}.`,
    };
  };

  const updateOwnerTreasury = (treasury: Partial<OwnerTreasury>) => {
    setOwnerTreasury((prev) => ({
      ...prev,
      ...treasury,
      lastUpdated: new Date().toISOString(),
    }));
  };

  // =========================================================================
  // INTER-BRANCH STOCK TRANSFERS (SITE-TO-SITE LOGISTICS)
  // =========================================================================

  const createStockTransfer = (data: {
    sourceBranchId: string;
    destinationBranchId: string;
    transferDate: string;
    dispatchedBy: string;
    driverOrCourierName?: string;
    vehicleRegNo?: string;
    waybillOrRefNo?: string;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }) => {
    if (data.sourceBranchId === data.destinationBranchId) {
      return { success: false, message: 'Source branch and destination branch must be different.' };
    }

    const sourceBranch = branches.find((b) => b.id === data.sourceBranchId);
    const destBranch = branches.find((b) => b.id === data.destinationBranchId);

    if (!sourceBranch || !destBranch) {
      return { success: false, message: 'Invalid source or destination branch specified.' };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, message: 'Please select at least one product item to dispatch.' };
    }

    // Verify stock availability at source branch
    const transferItems: StockTransferItem[] = [];
    let totalQuantity = 0;
    let totalVolume = 0;
    let totalValuation = 0;

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, message: `Product item not found.` };
      }

      const sourceStock = branchStocks.find(
        (s) => s.branchId === data.sourceBranchId && s.productId === item.productId
      );
      const availableQty = sourceStock ? sourceStock.quantity : 0;

      if (item.quantity <= 0) {
        return { success: false, message: `Transfer quantity for ${product.name} must be greater than 0.` };
      }

      if (item.quantity > availableQty) {
        return {
          success: false,
          message: `Insufficient stock for "${product.name}" at ${sourceBranch.name}. Available on site: ${availableQty} units, Requested dispatch: ${item.quantity} units.`,
        };
      }

      const unitCost = product.costPrice || 0;
      const lineCost = Number((item.quantity * unitCost).toFixed(2));
      const lineVolume = Number((item.quantity * (product.volumeLitersOrKg || 1)).toFixed(2));

      totalQuantity += item.quantity;
      totalVolume += lineVolume;
      totalValuation += lineCost;

      transferItems.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        category: product.category,
        unit: product.unit,
        volumePerUnit: product.volumeLitersOrKg || 1,
        quantity: item.quantity,
        unitCost,
        totalCost: lineCost,
      });
    }

    const now = new Date().toISOString();

    // Deduct stock from source branch immediately upon dispatch
    setBranchStocks((prev) =>
      prev.map((s) => {
        if (s.branchId === data.sourceBranchId) {
          const dispatched = data.items.find((i) => i.productId === s.productId);
          if (dispatched) {
            return {
              ...s,
              quantity: Math.max(0, s.quantity - dispatched.quantity),
              lastUpdated: now,
            };
          }
        }
        return s;
      })
    );

    const trfCount = stockTransfers.length + 1;
    const transferNumber = `TRF-${new Date().getFullYear()}-${String(trfCount).padStart(3, '0')}`;

    const newTransfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber,
      sourceBranchId: sourceBranch.id,
      sourceBranchName: sourceBranch.name,
      sourceBranchCode: sourceBranch.code,
      destinationBranchId: destBranch.id,
      destinationBranchName: destBranch.name,
      destinationBranchCode: destBranch.code,
      transferDate: data.transferDate || now.split('T')[0],
      status: 'IN_TRANSIT',
      items: transferItems,
      totalQuantity,
      totalVolumeLitersOrKg: totalVolume,
      totalValuation,
      dispatchedBy: data.dispatchedBy,
      dispatchedAt: now,
      driverOrCourierName: data.driverOrCourierName,
      vehicleRegNo: data.vehicleRegNo,
      waybillOrRefNo: data.waybillOrRefNo,
      notes: data.notes,
      createdAt: now,
    };

    setStockTransfers((prev) => [newTransfer, ...prev]);
    api.createStockTransfer(newTransfer).catch(console.error);

    return {
      success: true,
      message: `Stock transfer ${transferNumber} initiated. ${totalQuantity} units (K${totalValuation.toLocaleString()}) dispatched from ${sourceBranch.name} to ${destBranch.name}.`,
      transfer: newTransfer,
    };
  };

  const receiveStockTransfer = (
    transferId: string,
    receiptData: {
      receivedBy: string;
      receivingNotes?: string;
      itemReceipts?: {
        productId: string;
        receivedQty: number;
        damagedQty?: number;
        missingQty?: number;
      }[];
    }
  ) => {
    const transfer = stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      return { success: false, message: 'Stock transfer record not found.' };
    }

    if (transfer.status !== 'IN_TRANSIT') {
      return {
        success: false,
        message: `Transfer cannot be received because it is currently marked as ${transfer.status}.`,
      };
    }

    const now = new Date().toISOString();

    // Map updated items with received, damaged, and missing quantities
    const updatedItems = transfer.items.map((item) => {
      const receipt = receiptData.itemReceipts?.find((r) => r.productId === item.productId);
      const receivedQuantity = receipt !== undefined ? receipt.receivedQty : item.quantity;
      const damagedQuantity = receipt?.damagedQty || 0;
      const missingQuantity = receipt?.missingQty || 0;

      return {
        ...item,
        receivedQuantity,
        damagedQuantity,
        missingQuantity,
      };
    });

    // Add received stock to destination branch inventory
    setBranchStocks((prev) => {
      const nextStocks = [...prev];
      updatedItems.forEach((item) => {
        const qtyToAdd = item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity;
        if (qtyToAdd > 0) {
          const existingIdx = nextStocks.findIndex(
            (s) => s.branchId === transfer.destinationBranchId && s.productId === item.productId
          );
          if (existingIdx >= 0) {
            nextStocks[existingIdx] = {
              ...nextStocks[existingIdx],
              quantity: nextStocks[existingIdx].quantity + qtyToAdd,
              lastUpdated: now,
            };
          } else {
            nextStocks.push({
              branchId: transfer.destinationBranchId,
              productId: item.productId,
              quantity: qtyToAdd,
              lastUpdated: now,
            });
          }
        }
      });
      return nextStocks;
    });

    // Update transfer record
    const updatedRecordUpdates = {
      status: 'RECEIVED' as StockTransferStatus,
      receivedBy: receiptData.receivedBy,
      receivedAt: now,
      receivingNotes: receiptData.receivingNotes,
      items: updatedItems,
    };

    setStockTransfers((prev) =>
      prev.map((t) => {
        if (t.id === transferId) {
          return {
            ...t,
            ...updatedRecordUpdates,
          };
        }
        return t;
      })
    );

    api.updateStockTransfer(transferId, updatedRecordUpdates).catch(console.error);

    return {
      success: true,
      message: `Transfer ${transfer.transferNumber} received successfully at ${transfer.destinationBranchName}. Physical stock has been added to the branch inventory!`,
    };
  };

  const cancelStockTransfer = (transferId: string, reason?: string) => {
    const transfer = stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      return { success: false, message: 'Stock transfer not found.' };
    }

    if (transfer.status !== 'IN_TRANSIT') {
      return {
        success: false,
        message: `Only IN_TRANSIT transfers can be cancelled. Current status is ${transfer.status}.`,
      };
    }

    const now = new Date().toISOString();

    // Refund dispatched stock back to source branch
    setBranchStocks((prev) => {
      const nextStocks = [...prev];
      transfer.items.forEach((item) => {
        const existingIdx = nextStocks.findIndex(
          (s) => s.branchId === transfer.sourceBranchId && s.productId === item.productId
        );
        if (existingIdx >= 0) {
          nextStocks[existingIdx] = {
            ...nextStocks[existingIdx],
            quantity: nextStocks[existingIdx].quantity + item.quantity,
            lastUpdated: now,
          };
        } else {
          nextStocks.push({
            branchId: transfer.sourceBranchId,
            productId: item.productId,
            quantity: item.quantity,
            lastUpdated: now,
          });
        }
      });
      return nextStocks;
    });

    const cancelUpdates = {
      status: 'CANCELLED' as StockTransferStatus,
      notes: reason ? `${transfer.notes ? transfer.notes + ' | ' : ''}Cancelled: ${reason}` : transfer.notes,
    };

    setStockTransfers((prev) =>
      prev.map((t) => {
        if (t.id === transferId) {
          return {
            ...t,
            ...cancelUpdates,
          };
        }
        return t;
      })
    );

    api.updateStockTransfer(transferId, cancelUpdates).catch(console.error);

    return {
      success: true,
      message: `Transfer ${transfer.transferNumber} cancelled. Dispatched quantities returned to ${transfer.sourceBranchName} inventory.`,
    };
  };

  const deleteStockTransfer = (transferId: string, reverseStocks?: boolean) => {
    const transfer = stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      return { success: false, message: 'Stock transfer not found.' };
    }

    if (reverseStocks) {
      if (transfer.status === 'IN_TRANSIT') {
        // Return stock to source
        setBranchStocks((prev) => {
          const next = [...prev];
          transfer.items.forEach((item) => {
            const idx = next.findIndex(
              (s) => s.branchId === transfer.sourceBranchId && s.productId === item.productId
            );
            if (idx >= 0) {
              next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
            }
          });
          return next;
        });
      } else if (transfer.status === 'RECEIVED') {
        // Deduct from destination
        setBranchStocks((prev) => {
          const next = [...prev];
          transfer.items.forEach((item) => {
            const qty = item.receivedQuantity !== undefined ? item.receivedQuantity : item.quantity;
            const idx = next.findIndex(
              (s) => s.branchId === transfer.destinationBranchId && s.productId === item.productId
            );
            if (idx >= 0) {
              next[idx] = { ...next[idx], quantity: Math.max(0, next[idx].quantity - qty) };
            }
          });
          return next;
        });
      }
    }

    setStockTransfers((prev) => prev.filter((t) => t.id !== transferId));
    api.deleteStockTransfer(transferId).catch(console.error);
    return { success: true, message: `Transfer ${transfer.transferNumber} removed from system records.` };
  };

  // =========================================================================
  // EXCEL / CSV DATA BULK IMPORT ENGINE
  // =========================================================================

  const bulkImportProducts = (
    productsData: {
      code: string;
      name: string;
      category: 'LUBRICANTS' | 'LPG';
      subCategory?: string;
      unit?: string;
      volumeLitersOrKg?: number;
      costPrice: number;
      sellingPrice: number;
      reorderThreshold?: number;
      description?: string;
    }[],
    updateExisting: boolean = true
  ) => {
    let createdCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    const existingMap = new Map<string, Product>(products.map((p) => [p.code.toUpperCase().trim(), p]));
    const newProductsList = [...products];
    const newStocksToAdd: BranchStock[] = [];

    productsData.forEach((item) => {
      const codeKey = item.code.toUpperCase().trim();
      const existing = existingMap.get(codeKey);

      if (existing) {
        if (updateExisting) {
          const idx = newProductsList.findIndex((p) => p.id === existing.id);
          if (idx >= 0) {
            newProductsList[idx] = {
              ...newProductsList[idx],
              name: item.name || newProductsList[idx].name,
              category: item.category || newProductsList[idx].category,
              subCategory: item.subCategory || newProductsList[idx].subCategory,
              unit: item.unit || newProductsList[idx].unit,
              volumeLitersOrKg: item.volumeLitersOrKg || newProductsList[idx].volumeLitersOrKg,
              costPrice: item.costPrice >= 0 ? item.costPrice : newProductsList[idx].costPrice,
              sellingPrice: item.sellingPrice >= 0 ? item.sellingPrice : newProductsList[idx].sellingPrice,
              reorderThreshold: item.reorderThreshold ?? newProductsList[idx].reorderThreshold,
              description: item.description ?? newProductsList[idx].description,
            };
            updatedCount++;
          }
        }
      } else {
        const newProdId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newProd: Product = {
          id: newProdId,
          code: item.code.trim(),
          name: item.name.trim(),
          category: item.category,
          subCategory: item.subCategory || (item.category === 'LPG' ? 'LPG Refill' : 'Engine Oil'),
          unit: item.unit || (item.category === 'LPG' ? 'Cylinder' : '1L Bottle'),
          volumeLitersOrKg: item.volumeLitersOrKg || 1,
          costPrice: item.costPrice || 0,
          sellingPrice: item.sellingPrice || 0,
          reorderThreshold: item.reorderThreshold ?? 5,
          description: item.description,
          isActive: true,
        };
        newProductsList.push(newProd);
        existingMap.set(codeKey, newProd);
        createdCount++;

        // Initialize zero stock for all branches
        branches.forEach((b) => {
          newStocksToAdd.push({
            branchId: b.id,
            productId: newProdId,
            quantity: 0,
            lastUpdated: now,
          });
        });
      }
    });

    setProducts(newProductsList);
    if (newStocksToAdd.length > 0) {
      setBranchStocks((prev) => [...prev, ...newStocksToAdd]);
    }

    return {
      success: true,
      createdCount,
      updatedCount,
      message: `Product import successful! ${createdCount} new products added, ${updatedCount} existing products updated with latest pricing.`,
    };
  };

  const bulkImportBranchStocks = (
    stocksData: { branchId: string; productId: string; quantity: number }[],
    mode: 'SET' | 'ADD' = 'SET'
  ) => {
    let updatedCount = 0;
    const now = new Date().toISOString();

    setBranchStocks((prev) => {
      const next = [...prev];
      stocksData.forEach((item) => {
        if (!item.branchId || !item.productId) return;
        const idx = next.findIndex(
          (s) => s.branchId === item.branchId && s.productId === item.productId
        );
        const qty = Number(item.quantity) || 0;
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            quantity: mode === 'ADD' ? next[idx].quantity + qty : Math.max(0, qty),
            lastUpdated: now,
          };
          updatedCount++;
        } else {
          next.push({
            branchId: item.branchId,
            productId: item.productId,
            quantity: Math.max(0, qty),
            lastUpdated: now,
          });
          updatedCount++;
        }
      });
      return next;
    });

    return {
      success: true,
      updatedCount,
      message: `Successfully synchronized ${updatedCount} branch stock inventory records (${mode === 'ADD' ? 'incremental additions' : 'exact stock counts'}).`,
    };
  };

  const bulkImportDebtors = (
    debtorsData: {
      code?: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      creditLimit?: number;
      notes?: string;
    }[]
  ) => {
    let createdCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    setDebtors((prev) => {
      const next = [...prev];
      debtorsData.forEach((item) => {
        if (!item.name || !item.name.trim()) return;
        const idx = next.findIndex(
          (d) =>
            d.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
            (item.code && d.code.toUpperCase().trim() === item.code.toUpperCase().trim())
        );

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            contactPerson: item.contactPerson || next[idx].contactPerson,
            phone: item.phone || next[idx].phone,
            email: item.email || next[idx].email,
            address: item.address || next[idx].address,
            creditLimit: item.creditLimit !== undefined ? item.creditLimit : next[idx].creditLimit,
            notes: item.notes || next[idx].notes,
          };
          updatedCount++;
        } else {
          const newDebtor: Debtor = {
            id: `debtor-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            code: item.code || `DEB-${String(next.length + 1).padStart(3, '0')}`,
            name: item.name.trim(),
            contactPerson: item.contactPerson,
            phone: item.phone || '+260 97 0000000',
            email: item.email,
            address: item.address,
            creditLimit: item.creditLimit ?? 15000,
            totalCreditSales: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            status: 'ACTIVE',
            notes: item.notes,
            createdAt: now,
          };
          next.push(newDebtor);
          createdCount++;
        }
      });
      return next;
    });

    return {
      success: true,
      createdCount,
      updatedCount,
      message: `Imported customer debtors list. ${createdCount} created, ${updatedCount} updated.`,
    };
  };

  const bulkImportSuppliers = (
    suppliersData: {
      code?: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      category?: 'LUBRICANTS' | 'LPG' | 'BOTH' | 'EQUIPMENT';
      paymentTermsDays?: number;
      taxNumber?: string;
    }[]
  ) => {
    let createdCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();

    setSuppliers((prev) => {
      const next = [...prev];
      suppliersData.forEach((item) => {
        if (!item.name || !item.name.trim()) return;
        const idx = next.findIndex(
          (s) =>
            s.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
            (item.code && s.code.toUpperCase().trim() === item.code.toUpperCase().trim())
        );

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            contactPerson: item.contactPerson || next[idx].contactPerson,
            phone: item.phone || next[idx].phone,
            email: item.email || next[idx].email,
            address: item.address || next[idx].address,
            category: item.category || next[idx].category,
            paymentTermsDays: item.paymentTermsDays !== undefined ? item.paymentTermsDays : next[idx].paymentTermsDays,
            taxNumber: item.taxNumber || next[idx].taxNumber,
          };
          updatedCount++;
        } else {
          const newSupplier: Supplier = {
            id: `sup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            code: item.code || `SUP-${String(next.length + 1).padStart(3, '0')}`,
            name: item.name.trim(),
            contactPerson: item.contactPerson || 'Sales Desk',
            phone: item.phone || '+260 97 0000000',
            email: item.email || '',
            address: item.address || '',
            category: item.category || 'LUBRICANTS',
            paymentTermsDays: item.paymentTermsDays ?? 30,
            taxNumber: item.taxNumber,
            createdAt: now,
          };
          next.push(newSupplier);
          createdCount++;
        }
      });
      return next;
    });

    return {
      success: true,
      createdCount,
      updatedCount,
      message: `Imported suppliers directory. ${createdCount} created, ${updatedCount} updated.`,
    };
  };

  const resetToDemoData = () => {
    setBranches(INITIAL_BRANCHES);
    setProducts(INITIAL_PRODUCTS);
    setBranchStocks(INITIAL_BRANCH_STOCK);
    setDailySales(INITIAL_DAILY_SALES);
    setAirtelMoneyRecords(INITIAL_AIRTEL_MONEY_RECORDS);
    setAirtelRecords(INITIAL_AIRTEL_RECORDS);
    setDebtors(INITIAL_DEBTORS);
    setDebtorTransactions(INITIAL_DEBTOR_TRANSACTIONS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSupplierTransactions(INITIAL_SUPPLIER_TRANSACTIONS);
    setStockReconciliations(INITIAL_STOCK_RECONCILIATIONS);
    setCashMovements(INITIAL_CASH_MOVEMENTS);
    setOwnerTreasury(INITIAL_OWNER_TREASURY);
    setBankRecords(INITIAL_BANK_RECORDS);
    setCashRecords(INITIAL_CASH_RECORDS);
    setStockTransfers(INITIAL_STOCK_TRANSFERS);
    localStorage.clear();
  };

  const formatSystemDataToZero = () => {
    // 1. Leave all created branches intact
    const preservedBranches = [...branches];

    // 2. Leave products list intact, but value all products at zero (costPrice: 0, sellingPrice: 0)
    const zeroedProducts: Product[] = products.map((p) => ({
      ...p,
      costPrice: 0,
      sellingPrice: 0,
    }));
    setProducts(zeroedProducts);

    // 3. Zero out all branch inventory / stocks (0 quantity for all branch-product pairs)
    const zeroedStocks: BranchStock[] = [];
    preservedBranches.forEach((b) => {
      zeroedProducts.forEach((p) => {
        zeroedStocks.push({
          branchId: b.id,
          productId: p.id,
          quantity: 0,
          lastUpdated: new Date().toISOString(),
        });
      });
    });
    setBranchStocks(zeroedStocks);

    // 4. Format all transactional ledgers and history to zero/empty
    setDailySales([]);
    setAirtelMoneyRecords([]);
    setAirtelRecords([]);
    setBankRecords([]);
    setCashRecords([]);

    // 5. Zero out debtors
    const zeroedDebtors: Debtor[] = debtors.map((d) => ({
      ...d,
      totalCreditSales: 0,
      totalPaid: 0,
      outstandingBalance: 0,
    }));
    setDebtors(zeroedDebtors);
    setDebtorTransactions([]);

    // 6. Zero out suppliers
    const zeroedSuppliers: Supplier[] = suppliers.map((s) => ({
      ...s,
      totalInvoiced: 0,
      totalPaid: 0,
      balanceDue: 0,
    }));
    setSuppliers(zeroedSuppliers);
    setSupplierTransactions([]);

    // 7. Clear stock reconciliations, cash movements, & stock transfers
    setStockReconciliations([]);
    setCashMovements([]);
    setStockTransfers([]);

    // 8. Zero out owner treasury balances
    const zeroedTreasury: OwnerTreasury = {
      cashOnHand: 0,
      cashOnAirtelMoney: 0,
      cashInBank: 0,
      lastUpdated: new Date().toISOString(),
    };
    setOwnerTreasury(zeroedTreasury);

    // Persist zeroed formatted state to LocalStorage
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_branches`, JSON.stringify(preservedBranches));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_products`, JSON.stringify(zeroedProducts));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_stocks`, JSON.stringify(zeroedStocks));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_sales`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_airtel`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_airtel_records`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_bank_records`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cash_records`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debtors`, JSON.stringify(zeroedDebtors));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debtor_tx`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_suppliers`, JSON.stringify(zeroedSuppliers));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_supplier_tx`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_reconciliations`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cash_movements`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_stock_transfers`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_owner_treasury`, JSON.stringify(zeroedTreasury));

    return {
      success: true,
      message: `System successfully formatted! All entered values and stock counts are set to 0. Preserved ${preservedBranches.length} branches and ${zeroedProducts.length} catalog products valued at K0.00.`,
      branchesCount: preservedBranches.length,
      productsCount: zeroedProducts.length,
    };
  };

  return (
    <AppContext.Provider
      value={{
        role,
        currentBranchId,
        currentBranch,
        setRole,
        isAuthenticated,
        ownerPassword,
        setOwnerPassword,
        login,
        logout,
        branches,
        products,
        branchStocks,
        dailySales,
        airtelMoneyRecords,
        airtelRecords,
        debtors,
        debtorTransactions,
        totalDebtorsBalance,
        suppliers,
        supplierTransactions,
        stockReconciliations,
        cashMovements,
        stockTransfers,
        ownerTreasury,
        bankRecords,
        cashRecords,
        lowStockAlerts,
        totalDiscrepancyCount,
        pendingCashMovementCount,
        unpostedDailySales,
        unpostedDailySalesCount,
        addBranch,
        updateBranch,
        deleteBranch,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStockQuantity,
        getStockForBranch,
        addDailySale,
        saveOrUpdateDailySale,
        postDailySaleToSystem,
        approveAndPostDailySale,
        rejectDailySale,
        updateDailySale,
        deleteDailySale,
        adjustDailySale,
        createStockReconciliation,
        approveStockReconciliation,
        rejectStockReconciliation,
        deleteStockReconciliation,
        clearStockReconciliations,
        createCashMovement,
        updateCashMovement,
        approveCashMovement,
        rejectCashMovement,
        deleteCashMovement,
        transferOwnerFunds,
        updateOwnerTreasury,
        createStockTransfer,
        receiveStockTransfer,
        cancelStockTransfer,
        deleteStockTransfer,
        bulkImportProducts,
        bulkImportBranchStocks,
        bulkImportDebtors,
        bulkImportSuppliers,
        addBankRecord,
        updateBankRecord,
        deleteBankRecord,
        bulkDeleteBankRecords,
        addCashRecord,
        updateCashRecord,
        deleteCashRecord,
        bulkDeleteCashRecords,
        addAirtelRecord,
        updateAirtelRecord,
        deleteAirtelRecord,
        bulkDeleteAirtelRecords,
        convertAirtelToCash,
        convertAirtelToBank,
        paySupplierFromAirtel,
        payExpenseFromAirtel,
        addDebtor,
        updateDebtor,
        deleteDebtor,
        addDebtorCreditSale,
        recordDebtorPayment,
        updateDebtorTransaction,
        deleteDebtorTransaction,
        getDebtorBalance,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierTransaction,
        updateSupplierTransaction,
        deleteSupplierTransaction,
        getSupplierBalance,
        calculateWeightedAverageCost,
        getProductInvoiceHistory,
        syncProductCostPricesWithInvoices,
        addAirtelMoneyRecord,
        verifyAirtelMoneyRecord,
        verifyAirtelRecord: verifyAirtelMoneyRecord,
        resetToDemoData,
        formatSystemDataToZero,
        isDbConnected,
        dbSyncError,
        lastDbSyncTime,
        manualSyncWithDatabase: syncWithDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
