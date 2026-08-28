export type UserRole = 'OWNER' | 'BRANCH_MANAGER';

export type ProductCategory = 'LUBRICANTS' | 'LPG';

export interface Branch {
  id: string;
  name: string;
  code: string;
  lubesChamp: string; // The branch champion/manager
  phone: string;
  location: string;
  openingCashFloat: number;
  airtelMerchantNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  targetMonthlySales: number;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  subCategory: string; // e.g. 'Diesel Engine Oil', 'Petrol Engine Oil', 'Hydraulic Oil', 'Gear Oil', '2T/4T Oil', 'LPG Refill', 'LPG Full Kit'
  unit: string; // '1L Bottle', '4L Can', '5L Can', '20L Pail', '208L Drum', '6kg Cylinder', '13kg Cylinder', '38kg Cylinder', '45kg Cylinder'
  volumeLitersOrKg: number; // For performance volume metrics (Liters of oil or Kg of gas)
  costPrice: number;
  sellingPrice: number;
  reorderThreshold: number; // Alert when stock <= this
  description?: string;
  isActive: boolean;
}

export interface BranchStock {
  branchId: string;
  productId: string;
  quantity: number;
  lastUpdated: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productCode: string;
  category: ProductCategory;
  unit: string;
  volumePerUnit: number;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalAmount: number;
  totalCost: number;
  profit: number;
}

export interface PettyCashExpense {
  id: string;
  description: string;
  amount: number;
  receiptNo?: string;
}

export type DailySalesPostingStatus = 'DRAFT' | 'UNPOSTED' | 'POSTED_APPROVED' | 'REJECTED';

export interface DailySalesRecord {
  id: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  lubesChamp: string;
  date: string; // YYYY-MM-DD
  shift: 'Full Day' | 'Morning' | 'Evening';
  items: SaleItem[];
  totalSalesAmount: number;
  totalCostAmount: number;
  grossProfit: number;
  // Payment Breakdown
  paymentBreakdown: {
    cashSales: number;
    airtelMoneyDirectSales: number;
    bankOrCardSales: number;
    creditSales: number;
  };
  // Cash Reconciliation for the Day
  openingFloat: number;
  expectedCashFromSales: number;
  actualCashReceived: number;
  cashVariance: number; // actualCashReceived - expectedCashFromSales
  cashSentToAirtelMoney: number;
  airtelMoneyTxRef: string;
  airtelMoneySenderPhone: string;
  airtelMoneyReceiver: string;
  pettyCashExpenses: PettyCashExpense[];
  totalPettyExpenses: number;
  closingCashInDrawer: number;
  notes?: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'DISCREPANCY_FLAGGED';
  // Posting and Approval Control Fields
  postingStatus?: DailySalesPostingStatus;
  postedByBranchAt?: string;
  approvedByOwnerAt?: string;
  approvedByOwnerName?: string;
  rejectionReason?: string;
  creditDebtorId?: string;
  creditDebtorName?: string;
  createdAt: string;
}

export type VarianceReason = 
  | 'COUNT_ERROR'
  | 'LEAKAGE_SPILLAGE'
  | 'TRANSIT_DAMAGE'
  | 'THEFT_UNACCOUNTED'
  | 'UNRECORDED_SALE'
  | 'SUPPLIER_SHORT_DELIVERY'
  | 'CYLINDER_VALVE_LEAK'
  | 'NORMAL_TOLERANCE';

export interface StockReconciliationItem {
  productId: string;
  productName: string;
  productCode: string;
  category: ProductCategory;
  unit: string;
  systemQty: number;
  physicalQty: number;
  varianceQty: number; // physical - system
  unitCost: number;
  varianceValue: number; // varianceQty * unitCost
  reason: VarianceReason;
  notes?: string;
}

export interface StockReconciliation {
  id: string;
  branchId: string;
  branchName: string;
  date: string; // YYYY-MM-DD
  auditorOrChampName: string;
  items: StockReconciliationItem[];
  totalPositiveVarianceQty: number;
  totalNegativeVarianceQty: number;
  netVarianceValue: number;
  status: 'PENDING_REVIEW' | 'APPROVED_ADJUSTED' | 'REJECTED';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface AirtelMoneyRecord {
  id: string;
  branchId: string;
  branchName: string;
  date: string;
  type: 'DAILY_SALES_CASH_IN' | 'DIRECT_CUSTOMER_PAYMENT' | 'FLOAT_TOPUP' | 'SUPPLIER_PAYMENT_OUT' | 'WITHDRAWAL_TO_BANK' | 'TRANSACTION_FEE';
  amount: number;
  transactionRef: string;
  senderNumber: string;
  receiverNumber: string;
  verified: boolean;
  notes?: string;
  createdAt: string;
}

export interface SupplierItemEntry {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  branchId?: string; // Optional: specific branch or HQ Central
  branchName?: string;
  type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE';
  referenceNo: string; // Invoice # or Payment Receipt #
  date: string;
  dueDate?: string;
  amount: number;
  paymentMethod?: 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque';
  paymentRef?: string;
  items?: SupplierItemEntry[];
  notes?: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  allocatedInvoiceId?: string; // for payments linking to invoice
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: 'LUBRICANTS' | 'LPG' | 'BOTH' | 'EQUIPMENT';
  paymentTermsDays: number;
  taxNumber?: string;
  createdAt: string;
}

export interface LowStockAlert {
  branchId: string;
  branchName: string;
  branchCode: string;
  lubesChamp: string;
  productId: string;
  productName: string;
  productCode: string;
  category: ProductCategory;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  deficit: number;
  severity: 'CRITICAL' | 'WARNING';
}

export interface AuthState {
  role: UserRole;
  currentBranchId: string | null; // null for Owner
  userName: string;
}

export type CashMovementDestination = 'AIRTEL_MONEY' | 'BANK' | 'OWNER_CASH';

export type CashMovementStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface BranchCashMovement {
  id: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  amount: number;
  destination: CashMovementDestination;
  date: string; // YYYY-MM-DD
  submittedBy: string; // e.g. Lubes Champ / Branch Manager name
  referenceNumber: string; // Airtel Tx ref, Bank deposit slip #, or Handover voucher #
  recipientDetails?: string; // e.g. "Zanaco A/C #10928374", "HQ Airtel Wallet +260979990000", "Handed in person to Owner"
  notes?: string;
  status: CashMovementStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface OwnerTreasury {
  cashOnHand: number; // Cash given directly to owner
  cashOnAirtelMoney: number; // Airtel float wallet balance
  cashInBank: number; // Bank accounts balance
  lastUpdated: string;
}

export interface BankRecord {
  id: string;
  date: string; // YYYY-MM-DD
  details: string; // Transaction details / Payee / Source
  debit: number; // Deposits / Inflow (Increases bank balance)
  credit: number; // Withdrawals / Outflow (Decreases bank balance)
  balance: number; // Running balance after transaction
  referenceNo?: string; // Cheque #, EFT Ref, Slip #
  category?: 'BRANCH_DEPOSIT' | 'BRANCH_SALES' | 'SUPPLIER_PAYMENT' | 'INTERNAL_TRANSFER' | 'CUSTOMER_PAYMENT' | 'DEBTOR_PAYMENT' | 'CONVERSION_AIRTEL' | 'BANK_FEES' | 'INTEREST' | 'OTHER';
  branchId?: string;
  branchName?: string;
  notes?: string;
  createdAt: string;
}

export interface CashRecord {
  id: string;
  date: string; // YYYY-MM-DD
  details: string; // Transaction details / Payee / Source
  debit: number; // Cash Inflow into Vault/Hand (Increases cash balance)
  credit: number; // Cash Outflow / Disbursal (Decreases cash balance)
  balance: number; // Running balance after transaction
  referenceNo?: string; // Voucher #, Handover Slip #
  category?: 'BRANCH_HANDOVER' | 'BRANCH_SALES' | 'SUPPLIER_PAYMENT' | 'INTERNAL_TRANSFER' | 'CONVERSION_AIRTEL' | 'DEBTOR_PAYMENT' | 'PETTY_CASH' | 'DRAWING' | 'OTHER';
  branchId?: string;
  branchName?: string;
  notes?: string;
  createdAt: string;
}

export interface AirtelRecord {
  id: string;
  date: string; // YYYY-MM-DD
  details: string; // Transaction details / Payee / Source
  debit: number; // Inflows (Branch Sales, Direct Customer Payments, Top-ups)
  credit: number; // Outflows (Converted to Cash, Converted to Bank, Supplier Payments, Expenses)
  balance: number; // Running balance after transaction
  referenceNo?: string; // Airtel Tx ID / Tx Ref
  category?: 'BRANCH_SALES' | 'CUSTOMER_PAYMENT' | 'DEBTOR_PAYMENT' | 'CONVERSION_CASH' | 'CONVERSION_BANK' | 'SUPPLIER_PAYMENT' | 'EXPENSE_PAYMENT' | 'FLOAT_TOPUP' | 'FEES' | 'OTHER';
  branchId?: string;
  branchName?: string;
  recipientOrSender?: string;
  notes?: string;
  createdAt: string;
}

export interface Debtor {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  totalCreditSales: number;
  totalPaid: number;
  outstandingBalance: number; // totalCreditSales - totalPaid
  notes?: string;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
}

export interface DebtorTransaction {
  id: string;
  debtorId: string;
  debtorName: string;
  branchId?: string;
  branchName?: string;
  date: string; // YYYY-MM-DD
  type: 'CREDIT_SALE' | 'PAYMENT' | 'OPENING_BALANCE' | 'ADJUSTMENT';
  referenceNo: string; // Invoice #, Sales Slip #, Receipt #
  details: string; // Description of items / invoice / receipt
  debit: number; // Credit Sale amount (increases what customer owes)
  credit: number; // Payment received (decreases what customer owes)
  balance: number; // Running balance for this debtor
  paymentMethod?: 'Cash' | 'Airtel Money' | 'Bank Transfer' | 'Cheque';
  paymentDestination?: 'CASH' | 'BANK' | 'AIRTEL';
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  createdAt: string;
}

export type StockTransferStatus = 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferItem {
  productId: string;
  productName: string;
  productCode: string;
  category: ProductCategory;
  unit: string;
  volumePerUnit: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  missingQuantity?: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string; // e.g. "TRF-2026-001"
  sourceBranchId: string;
  sourceBranchName: string;
  sourceBranchCode: string;
  destinationBranchId: string;
  destinationBranchName: string;
  destinationBranchCode: string;
  transferDate: string; // YYYY-MM-DD
  items: StockTransferItem[];
  totalQuantity: number;
  totalVolumeLitersOrKg: number;
  totalValuation: number;
  status: StockTransferStatus;
  dispatchedBy: string;
  dispatchedAt: string;
  driverOrCourierName?: string;
  vehicleRegNo?: string;
  waybillOrRefNo?: string;
  receivedBy?: string;
  receivedAt?: string;
  receivingNotes?: string;
  notes?: string;
  createdAt: string;
}

