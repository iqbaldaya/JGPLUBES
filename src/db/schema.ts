// src/db/schema.ts
import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// --- USERS TABLE (Linked with Firebase Auth UID) ---
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase Auth UID
    email: text('email').notNull(),
    name: text('name'),
    role: text('role').default('BRANCH_MANAGER').notNull(), // 'OWNER' | 'BRANCH_MANAGER'
    branchId: text('branch_id'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    uidIdx: uniqueIndex('users_uid_idx').on(table.uid),
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// --- BRANCHES TABLE ---
export const branches = pgTable(
  'branches',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull().unique(),
    lubesChamp: text('lubes_champ').notNull(),
    phone: text('phone').notNull(),
    location: text('location').notNull(),
    openingCashFloat: doublePrecision('opening_cash_float').default(0).notNull(),
    airtelMerchantNumber: text('airtel_merchant_number').notNull(),
    status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'INACTIVE'
    targetMonthlySales: doublePrecision('target_monthly_sales').default(0).notNull(),
    password: text('password'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('branches_code_idx').on(table.code),
  })
);

// --- PRODUCTS TABLE ---
export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    category: text('category').notNull(), // 'LUBRICANTS' | 'LPG'
    subCategory: text('sub_category').notNull(),
    unit: text('unit').notNull(),
    volumeLitersOrKg: doublePrecision('volume_liters_or_kg').notNull(),
    costPrice: doublePrecision('cost_price').notNull(),
    sellingPrice: doublePrecision('selling_price').notNull(),
    reorderThreshold: doublePrecision('reorder_threshold').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('products_code_idx').on(table.code),
    categoryIdx: index('products_category_idx').on(table.category),
  })
);

// --- BRANCH INVENTORY / STOCK LEVELS ---
export const branchStocks = pgTable(
  'branch_stocks',
  {
    id: serial('id').primaryKey(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: doublePrecision('quantity').default(0).notNull(),
    lastUpdated: text('last_updated').notNull(),
  },
  (table) => ({
    branchProductIdx: uniqueIndex('branch_product_unique_idx').on(table.branchId, table.productId),
    branchIdx: index('branch_stock_branch_idx').on(table.branchId),
    productIdx: index('branch_stock_product_idx').on(table.productId),
  })
);

// --- DAILY SALES RECORDS ---
export const dailySales = pgTable(
  'daily_sales',
  {
    id: text('id').primaryKey(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    branchName: text('branch_name').notNull(),
    branchCode: text('branch_code').notNull(),
    lubesChamp: text('lubes_champ').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    shift: text('shift').notNull(),
    items: jsonb('items').notNull(), // Array of SaleItem
    totalSalesAmount: doublePrecision('total_sales_amount').notNull(),
    totalCostAmount: doublePrecision('total_cost_amount').notNull(),
    grossProfit: doublePrecision('gross_profit').notNull(),
    paymentBreakdown: jsonb('payment_breakdown').notNull(),
    openingFloat: doublePrecision('opening_float').notNull(),
    expectedCashFromSales: doublePrecision('expected_cash_from_sales').notNull(),
    actualCashReceived: doublePrecision('actual_cash_received').notNull(),
    cashVariance: doublePrecision('cash_variance').notNull(),
    cashSentToAirtelMoney: doublePrecision('cash_sent_to_airtel_money').default(0).notNull(),
    airtelMoneyTxRef: text('airtel_money_tx_ref').default(''),
    airtelMoneySenderPhone: text('airtel_money_sender_phone').default(''),
    airtelMoneyReceiver: text('airtel_money_receiver').default(''),
    pettyCashExpenses: jsonb('petty_cash_expenses').notNull(),
    totalPettyExpenses: doublePrecision('total_petty_expenses').notNull(),
    closingCashInDrawer: doublePrecision('closing_cash_in_drawer').notNull(),
    notes: text('notes'),
    status: text('status').default('SUBMITTED').notNull(),
    postingStatus: text('posting_status').default('POSTED_APPROVED').notNull(),
    postedByBranchAt: text('posted_by_branch_at'),
    approvedByOwnerAt: text('approved_by_owner_at'),
    approvedByOwnerName: text('approved_by_owner_name'),
    rejectionReason: text('rejection_reason'),
    creditDebtorId: text('credit_debtor_id'),
    creditDebtorName: text('credit_debtor_name'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    branchDateIdx: index('daily_sales_branch_date_idx').on(table.branchId, table.date),
    dateIdx: index('daily_sales_date_idx').on(table.date),
    statusIdx: index('daily_sales_posting_status_idx').on(table.postingStatus),
  })
);

// --- DEBTORS (CREDIT CUSTOMERS) ---
export const debtors = pgTable(
  'debtors',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    contactPerson: text('contact_person'),
    phone: text('phone').notNull(),
    email: text('email'),
    address: text('address'),
    creditLimit: doublePrecision('credit_limit').default(0).notNull(),
    totalCreditSales: doublePrecision('total_credit_sales').default(0).notNull(),
    totalPaid: doublePrecision('total_paid').default(0).notNull(),
    outstandingBalance: doublePrecision('outstanding_balance').default(0).notNull(),
    notes: text('notes'),
    status: text('status').default('ACTIVE').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('debtors_code_idx').on(table.code),
    nameIdx: index('debtors_name_idx').on(table.name),
  })
);

// --- DEBTOR TRANSACTIONS ---
export const debtorTransactions = pgTable(
  'debtor_transactions',
  {
    id: text('id').primaryKey(),
    debtorId: text('debtor_id')
      .notNull()
      .references(() => debtors.id, { onDelete: 'cascade' }),
    debtorName: text('debtor_name').notNull(),
    branchId: text('branch_id'),
    branchName: text('branch_name'),
    date: text('date').notNull(),
    type: text('type').notNull(),
    referenceNo: text('reference_no').notNull(),
    details: text('details').notNull(),
    debit: doublePrecision('debit').default(0).notNull(),
    credit: doublePrecision('credit').default(0).notNull(),
    balance: doublePrecision('balance').notNull(),
    paymentMethod: text('payment_method'),
    paymentDestination: text('payment_destination'),
    status: text('status').default('PAID').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    debtorIdx: index('debtor_tx_debtor_idx').on(table.debtorId),
    dateIdx: index('debtor_tx_date_idx').on(table.date),
  })
);

// --- SUPPLIERS ---
export const suppliers = pgTable(
  'suppliers',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    contactPerson: text('contact_person').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    address: text('address').notNull(),
    category: text('category').notNull(),
    paymentTermsDays: integer('payment_terms_days').default(30).notNull(),
    taxNumber: text('tax_number'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('suppliers_code_idx').on(table.code),
  })
);

// --- SUPPLIER TRANSACTIONS ---
export const supplierTransactions = pgTable(
  'supplier_transactions',
  {
    id: text('id').primaryKey(),
    supplierId: text('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    supplierName: text('supplier_name').notNull(),
    branchId: text('branch_id'),
    branchName: text('branch_name'),
    type: text('type').notNull(),
    referenceNo: text('reference_no').notNull(),
    date: text('date').notNull(),
    dueDate: text('due_date'),
    amount: doublePrecision('amount').notNull(),
    paymentMethod: text('payment_method'),
    paymentRef: text('payment_ref'),
    items: jsonb('items'),
    notes: text('notes'),
    status: text('status').notNull(),
    allocatedInvoiceId: text('allocated_invoice_id'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    supplierIdx: index('supplier_tx_supplier_idx').on(table.supplierId),
    dateIdx: index('supplier_tx_date_idx').on(table.date),
  })
);

// --- STOCK RECONCILIATIONS ---
export const stockReconciliations = pgTable(
  'stock_reconciliations',
  {
    id: text('id').primaryKey(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    branchName: text('branch_name').notNull(),
    date: text('date').notNull(),
    auditorOrChampName: text('auditor_or_champ_name').notNull(),
    items: jsonb('items').notNull(),
    totalPositiveVarianceQty: doublePrecision('total_positive_variance_qty').notNull(),
    totalNegativeVarianceQty: doublePrecision('total_negative_variance_qty').notNull(),
    netVarianceValue: doublePrecision('net_variance_value').notNull(),
    status: text('status').default('PENDING_REVIEW').notNull(),
    reviewedBy: text('reviewed_by'),
    reviewNotes: text('review_notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    branchIdx: index('stock_recon_branch_idx').on(table.branchId),
    dateIdx: index('stock_recon_date_idx').on(table.date),
  })
);

// --- CASH MOVEMENTS ---
export const cashMovements = pgTable(
  'cash_movements',
  {
    id: text('id').primaryKey(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    branchName: text('branch_name').notNull(),
    branchCode: text('branch_code').notNull(),
    amount: doublePrecision('amount').notNull(),
    destination: text('destination').notNull(),
    date: text('date').notNull(),
    submittedBy: text('submitted_by').notNull(),
    referenceNumber: text('reference_number').notNull(),
    recipientDetails: text('recipient_details'),
    notes: text('notes'),
    status: text('status').default('PENDING_APPROVAL').notNull(),
    requestedAt: text('requested_at').notNull(),
    reviewedBy: text('reviewed_by'),
    reviewedAt: text('reviewed_at'),
    reviewNotes: text('review_notes'),
  },
  (table) => ({
    branchIdx: index('cash_movements_branch_idx').on(table.branchId),
    statusIdx: index('cash_movements_status_idx').on(table.status),
  })
);

// --- OWNER TREASURY ---
export const ownerTreasury = pgTable('owner_treasury', {
  id: serial('id').primaryKey(),
  cashOnHand: doublePrecision('cash_on_hand').default(0).notNull(),
  cashOnAirtelMoney: doublePrecision('cash_on_airtel_money').default(0).notNull(),
  cashInBank: doublePrecision('cash_in_bank').default(0).notNull(),
  lastUpdated: text('last_updated').notNull(),
});

// --- BANK LEDGER RECORDS ---
export const bankRecords = pgTable(
  'bank_records',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    details: text('details').notNull(),
    debit: doublePrecision('debit').default(0).notNull(),
    credit: doublePrecision('credit').default(0).notNull(),
    balance: doublePrecision('balance').notNull(),
    referenceNo: text('reference_no'),
    category: text('category'),
    branchId: text('branch_id'),
    branchName: text('branch_name'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    dateIdx: index('bank_records_date_idx').on(table.date),
  })
);

// --- CASH LEDGER RECORDS ---
export const cashRecords = pgTable(
  'cash_records',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    details: text('details').notNull(),
    debit: doublePrecision('debit').default(0).notNull(),
    credit: doublePrecision('credit').default(0).notNull(),
    balance: doublePrecision('balance').notNull(),
    referenceNo: text('reference_no'),
    category: text('category'),
    branchId: text('branch_id'),
    branchName: text('branch_name'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    dateIdx: index('cash_records_date_idx').on(table.date),
  })
);

// --- AIRTEL LEDGER RECORDS ---
export const airtelRecords = pgTable(
  'airtel_records',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    details: text('details').notNull(),
    debit: doublePrecision('debit').default(0).notNull(),
    credit: doublePrecision('credit').default(0).notNull(),
    balance: doublePrecision('balance').notNull(),
    referenceNo: text('reference_no'),
    category: text('category'),
    branchId: text('branch_id'),
    branchName: text('branch_name'),
    recipientOrSender: text('recipient_or_sender'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    dateIdx: index('airtel_records_date_idx').on(table.date),
  })
);

// --- AIRTEL MONEY TRANSACTIONS ---
export const airtelMoneyRecords = pgTable(
  'airtel_money_records',
  {
    id: text('id').primaryKey(),
    branchId: text('branch_id').notNull(),
    branchName: text('branch_name').notNull(),
    date: text('date').notNull(),
    type: text('type').notNull(),
    amount: doublePrecision('amount').notNull(),
    transactionRef: text('transaction_ref').notNull(),
    senderNumber: text('sender_number').notNull(),
    receiverNumber: text('receiver_number').notNull(),
    verified: boolean('verified').default(false).notNull(),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    branchDateIdx: index('airtel_money_branch_date_idx').on(table.branchId, table.date),
  })
);

// --- STOCK TRANSFERS ---
export const stockTransfers = pgTable(
  'stock_transfers',
  {
    id: text('id').primaryKey(),
    transferNumber: text('transfer_number').notNull().unique(),
    sourceBranchId: text('source_branch_id')
      .notNull()
      .references(() => branches.id),
    sourceBranchName: text('source_branch_name').notNull(),
    sourceBranchCode: text('source_branch_code').notNull(),
    destinationBranchId: text('destination_branch_id')
      .notNull()
      .references(() => branches.id),
    destinationBranchName: text('destination_branch_name').notNull(),
    destinationBranchCode: text('destination_branch_code').notNull(),
    transferDate: text('transfer_date').notNull(),
    items: jsonb('items').notNull(), // Array of StockTransferItem
    totalQuantity: doublePrecision('total_quantity').notNull(),
    totalVolumeLitersOrKg: doublePrecision('total_volume_liters_or_kg').notNull(),
    totalValuation: doublePrecision('total_valuation').notNull(),
    status: text('status').default('IN_TRANSIT').notNull(), // 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'
    dispatchedBy: text('dispatched_by').notNull(),
    dispatchedAt: text('dispatched_at').notNull(),
    driverOrCourierName: text('driver_or_courier_name'),
    vehicleRegNo: text('vehicle_reg_no'),
    waybillOrRefNo: text('waybill_or_ref_no'),
    receivedBy: text('received_by'),
    receivedAt: text('received_at'),
    receivingNotes: text('receiving_notes'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    transferNumberIdx: uniqueIndex('stock_transfers_number_idx').on(table.transferNumber),
    sourceBranchIdx: index('stock_transfers_source_idx').on(table.sourceBranchId),
    destBranchIdx: index('stock_transfers_dest_idx').on(table.destinationBranchId),
    statusIdx: index('stock_transfers_status_idx').on(table.status),
  })
);


export const expenses = pgTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    branchId: text('branch_id').notNull(),
    branchName: text('branch_name').notNull(),
    date: text('date').notNull(),
    description: text('description').notNull(),
    amount: doublePrecision('amount').notNull(),
    category: text('category').notNull(),
    reference: text('reference'), // e.g. daily sale ID
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    branchIdx: index('expenses_branch_idx').on(table.branchId),
    dateIdx: index('expenses_date_idx').on(table.date),
  })
);

// --- RELATIONS DEFINITIONS ---
export const branchesRelations = relations(branches, ({ many }) => ({
  stocks: many(branchStocks),
  dailySales: many(dailySales),
  stockReconciliations: many(stockReconciliations),
  cashMovements: many(cashMovements),
  outboundTransfers: many(stockTransfers, { relationName: 'sourceBranch' }),
  inboundTransfers: many(stockTransfers, { relationName: 'destinationBranch' }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  stocks: many(branchStocks),
}));

export const branchStocksRelations = relations(branchStocks, ({ one }) => ({
  branch: one(branches, {
    fields: [branchStocks.branchId],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [branchStocks.productId],
    references: [products.id],
  }),
}));

export const dailySalesRelations = relations(dailySales, ({ one }) => ({
  branch: one(branches, {
    fields: [dailySales.branchId],
    references: [branches.id],
  }),
}));

export const debtorsRelations = relations(debtors, ({ many }) => ({
  transactions: many(debtorTransactions),
}));

export const debtorTransactionsRelations = relations(debtorTransactions, ({ one }) => ({
  debtor: one(debtors, {
    fields: [debtorTransactions.debtorId],
    references: [debtors.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  transactions: many(supplierTransactions),
}));

export const supplierTransactionsRelations = relations(supplierTransactions, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierTransactions.supplierId],
    references: [suppliers.id],
  }),
}));
