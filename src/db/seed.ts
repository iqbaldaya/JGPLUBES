// src/db/seed.ts
import { db, createPool } from './index.ts';
import {
  branches,
  products,
  branchStocks,
  dailySales,
  debtors,
  debtorTransactions,
  suppliers,
  supplierTransactions,
  stockReconciliations,
  cashMovements,
  ownerTreasury,
  bankRecords,
  cashRecords,
  airtelRecords,
  airtelMoneyRecords,
  stockTransfers,
} from './schema.ts';
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
} from '../data/initialData.ts';
import { eq, count } from 'drizzle-orm';

export async function ensureTablesExist() {
  const pool = createPool();
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'BRANCH_MANAGER',
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      lubes_champ TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      opening_cash_float DOUBLE PRECISION NOT NULL DEFAULT 0,
      airtel_merchant_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      target_monthly_sales DOUBLE PRECISION NOT NULL DEFAULT 0,
      password TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      unit TEXT NOT NULL,
      volume_liters_or_kg DOUBLE PRECISION NOT NULL,
      cost_price DOUBLE PRECISION NOT NULL,
      selling_price DOUBLE PRECISION NOT NULL,
      reorder_threshold DOUBLE PRECISION NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true
    );`,

    `CREATE TABLE IF NOT EXISTS branch_stocks (
      id SERIAL PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL,
      CONSTRAINT branch_product_unique_idx UNIQUE (branch_id, product_id)
    );`,

    `CREATE TABLE IF NOT EXISTS daily_sales (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      branch_name TEXT NOT NULL,
      branch_code TEXT NOT NULL,
      lubes_champ TEXT NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL,
      items JSONB NOT NULL,
      total_sales_amount DOUBLE PRECISION NOT NULL,
      total_cost_amount DOUBLE PRECISION NOT NULL,
      gross_profit DOUBLE PRECISION NOT NULL,
      payment_breakdown JSONB NOT NULL,
      opening_float DOUBLE PRECISION NOT NULL,
      expected_cash_from_sales DOUBLE PRECISION NOT NULL,
      actual_cash_received DOUBLE PRECISION NOT NULL,
      cash_variance DOUBLE PRECISION NOT NULL,
      cash_sent_to_airtel_money DOUBLE PRECISION NOT NULL DEFAULT 0,
      airtel_money_tx_ref TEXT DEFAULT '',
      airtel_money_sender_phone TEXT DEFAULT '',
      airtel_money_receiver TEXT DEFAULT '',
      petty_cash_expenses JSONB NOT NULL,
      total_petty_expenses DOUBLE PRECISION NOT NULL,
      closing_cash_in_drawer DOUBLE PRECISION NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      posting_status TEXT NOT NULL DEFAULT 'POSTED_APPROVED',
      posted_by_branch_at TEXT,
      approved_by_owner_at TEXT,
      approved_by_owner_name TEXT,
      rejection_reason TEXT,
      credit_debtor_id TEXT,
      credit_debtor_name TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS debtors (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      credit_limit DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_credit_sales DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_paid DOUBLE PRECISION NOT NULL DEFAULT 0,
      outstanding_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS debtor_transactions (
      id TEXT PRIMARY KEY,
      debtor_id TEXT NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
      debtor_name TEXT NOT NULL,
      branch_id TEXT,
      branch_name TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      reference_no TEXT NOT NULL,
      details TEXT NOT NULL,
      debit DOUBLE PRECISION NOT NULL DEFAULT 0,
      credit DOUBLE PRECISION NOT NULL DEFAULT 0,
      balance DOUBLE PRECISION NOT NULL,
      payment_method TEXT,
      payment_destination TEXT,
      status TEXT NOT NULL DEFAULT 'PAID',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      category TEXT NOT NULL,
      payment_terms_days INTEGER NOT NULL DEFAULT 30,
      tax_number TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS supplier_transactions (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
      supplier_name TEXT NOT NULL,
      branch_id TEXT,
      branch_name TEXT,
      type TEXT NOT NULL,
      reference_no TEXT NOT NULL,
      date TEXT NOT NULL,
      due_date TEXT,
      amount DOUBLE PRECISION NOT NULL,
      payment_method TEXT,
      payment_ref TEXT,
      items JSONB,
      notes TEXT,
      status TEXT NOT NULL,
      allocated_invoice_id TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS stock_reconciliations (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      branch_name TEXT NOT NULL,
      date TEXT NOT NULL,
      auditor_or_champ_name TEXT NOT NULL,
      items JSONB NOT NULL,
      total_positive_variance_qty DOUBLE PRECISION NOT NULL,
      total_negative_variance_qty DOUBLE PRECISION NOT NULL,
      net_variance_value DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
      reviewed_by TEXT,
      review_notes TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS cash_movements (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      branch_name TEXT NOT NULL,
      branch_code TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      destination TEXT NOT NULL,
      date TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      reference_number TEXT NOT NULL,
      recipient_details TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      requested_at TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_notes TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS owner_treasury (
      id SERIAL PRIMARY KEY,
      cash_on_hand DOUBLE PRECISION NOT NULL DEFAULT 0,
      cash_on_airtel_money DOUBLE PRECISION NOT NULL DEFAULT 0,
      cash_in_bank DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS bank_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      details TEXT NOT NULL,
      debit DOUBLE PRECISION NOT NULL DEFAULT 0,
      credit DOUBLE PRECISION NOT NULL DEFAULT 0,
      balance DOUBLE PRECISION NOT NULL,
      reference_no TEXT,
      category TEXT,
      branch_id TEXT,
      branch_name TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS cash_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      details TEXT NOT NULL,
      debit DOUBLE PRECISION NOT NULL DEFAULT 0,
      credit DOUBLE PRECISION NOT NULL DEFAULT 0,
      balance DOUBLE PRECISION NOT NULL,
      reference_no TEXT,
      category TEXT,
      branch_id TEXT,
      branch_name TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS airtel_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      details TEXT NOT NULL,
      debit DOUBLE PRECISION NOT NULL DEFAULT 0,
      credit DOUBLE PRECISION NOT NULL DEFAULT 0,
      balance DOUBLE PRECISION NOT NULL,
      reference_no TEXT,
      category TEXT,
      branch_id TEXT,
      branch_name TEXT,
      recipient_or_sender TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS airtel_money_records (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      transaction_ref TEXT NOT NULL,
      sender_number TEXT NOT NULL,
      receiver_number TEXT NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS stock_transfers (
      id TEXT PRIMARY KEY,
      transfer_number TEXT NOT NULL UNIQUE,
      source_branch_id TEXT NOT NULL REFERENCES branches(id),
      source_branch_name TEXT NOT NULL,
      source_branch_code TEXT NOT NULL,
      destination_branch_id TEXT NOT NULL REFERENCES branches(id),
      destination_branch_name TEXT NOT NULL,
      destination_branch_code TEXT NOT NULL,
      transfer_date TEXT NOT NULL,
      items JSONB NOT NULL,
      total_quantity DOUBLE PRECISION NOT NULL,
      total_volume_liters_or_kg DOUBLE PRECISION NOT NULL,
      total_valuation DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'IN_TRANSIT',
      dispatched_by TEXT NOT NULL,
      dispatched_at TEXT NOT NULL,
      driver_or_courier_name TEXT,
      vehicle_reg_no TEXT,
      waybill_or_ref_no TEXT,
      received_by TEXT,
      received_at TEXT,
      receiving_notes TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,
  ];

  for (const tableSql of tables) {
    try {
      await pool.query(tableSql);
    } catch (err: any) {
      console.warn('Table creation notice:', err?.message || err);
    }
  }

  // Ensure any newer columns exist on existing databases
  const alterStatements = [
    `ALTER TABLE branches ADD COLUMN IF NOT EXISTS password TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS credit_debtor_id TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS credit_debtor_name TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS cash_sent_to_airtel_money DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS airtel_money_tx_ref TEXT DEFAULT '';`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS airtel_money_sender_phone TEXT DEFAULT '';`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS airtel_money_receiver TEXT DEFAULT '';`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS posted_by_branch_at TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS approved_by_owner_at TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS approved_by_owner_name TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`,
    `ALTER TABLE daily_sales ADD COLUMN IF NOT EXISTS posting_status TEXT DEFAULT 'POSTED_APPROVED';`,
  ];

  for (const alterSql of alterStatements) {
    try {
      await pool.query(alterSql);
    } catch {
      // column already exists or table not ready yet
    }
  }
}

let hasVerifiedSeeding = false;

export async function seedDatabaseIfEmpty(maxRetries = 3) {
  if (hasVerifiedSeeding) {
    return;
  }
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      await ensureTablesExist();

      // Check if branches exist
      const branchCount = await db.select({ val: count() }).from(branches);
      if (branchCount[0]?.val > 0) {
        console.log('Database already contains records. Skipping seed.');
        hasVerifiedSeeding = true;
        return;
      }

      console.log('Seeding PostgreSQL database with enterprise master data...');

    // 1. Branches
    await db.insert(branches).values(
      INITIAL_BRANCHES.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        lubesChamp: b.lubesChamp,
        phone: b.phone,
        location: b.location,
        openingCashFloat: b.openingCashFloat,
        airtelMerchantNumber: b.airtelMerchantNumber,
        status: b.status,
        targetMonthlySales: b.targetMonthlySales,
        createdAt: b.createdAt,
      }))
    );

    // 2. Products
    await db.insert(products).values(
      INITIAL_PRODUCTS.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        subCategory: p.subCategory,
        unit: p.unit,
        volumeLitersOrKg: p.volumeLitersOrKg,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        reorderThreshold: p.reorderThreshold,
        description: p.description || '',
        isActive: p.isActive,
      }))
    );

    // 3. Branch Stocks
    if (INITIAL_BRANCH_STOCK.length > 0) {
      await db.insert(branchStocks).values(
        INITIAL_BRANCH_STOCK.map((bs) => ({
          branchId: bs.branchId,
          productId: bs.productId,
          quantity: bs.quantity,
          lastUpdated: bs.lastUpdated || new Date().toISOString(),
        }))
      );
    }

    // 4. Debtors
    await db.insert(debtors).values(
      INITIAL_DEBTORS.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        contactPerson: d.contactPerson || '',
        phone: d.phone,
        email: d.email || '',
        address: d.address || '',
        creditLimit: d.creditLimit,
        totalCreditSales: d.totalCreditSales,
        totalPaid: d.totalPaid,
        outstandingBalance: d.outstandingBalance,
        notes: d.notes || '',
        status: d.status,
        createdAt: d.createdAt,
      }))
    );

    // 5. Debtor Transactions
    if (INITIAL_DEBTOR_TRANSACTIONS.length > 0) {
      await db.insert(debtorTransactions).values(
        INITIAL_DEBTOR_TRANSACTIONS.map((dt) => ({
          id: dt.id,
          debtorId: dt.debtorId,
          debtorName: dt.debtorName,
          branchId: dt.branchId || null,
          branchName: dt.branchName || null,
          date: dt.date,
          type: dt.type,
          referenceNo: dt.referenceNo,
          details: dt.details,
          debit: dt.debit,
          credit: dt.credit,
          balance: dt.balance,
          paymentMethod: dt.paymentMethod || null,
          paymentDestination: dt.paymentDestination || null,
          status: dt.status,
          createdAt: dt.createdAt,
        }))
      );
    }

    // 6. Suppliers
    await db.insert(suppliers).values(
      INITIAL_SUPPLIERS.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        contactPerson: s.contactPerson,
        phone: s.phone,
        email: s.email,
        address: s.address,
        category: s.category,
        paymentTermsDays: s.paymentTermsDays,
        taxNumber: s.taxNumber || '',
        createdAt: s.createdAt,
      }))
    );

    // 7. Supplier Transactions
    if (INITIAL_SUPPLIER_TRANSACTIONS.length > 0) {
      await db.insert(supplierTransactions).values(
        INITIAL_SUPPLIER_TRANSACTIONS.map((st) => ({
          id: st.id,
          supplierId: st.supplierId,
          supplierName: st.supplierName,
          branchId: st.branchId || null,
          branchName: st.branchName || null,
          type: st.type,
          referenceNo: st.referenceNo,
          date: st.date,
          dueDate: st.dueDate || null,
          amount: st.amount,
          paymentMethod: st.paymentMethod || null,
          paymentRef: st.paymentRef || null,
          items: st.items || [],
          notes: st.notes || '',
          status: st.status,
          allocatedInvoiceId: st.allocatedInvoiceId || null,
          createdAt: st.createdAt,
        }))
      );
    }

    // 8. Daily Sales Records
    if (INITIAL_DAILY_SALES.length > 0) {
      await db.insert(dailySales).values(
        INITIAL_DAILY_SALES.map((sale) => ({
          id: sale.id,
          branchId: sale.branchId,
          branchName: sale.branchName,
          branchCode: sale.branchCode,
          lubesChamp: sale.lubesChamp,
          date: sale.date,
          shift: sale.shift,
          items: sale.items,
          totalSalesAmount: sale.totalSalesAmount,
          totalCostAmount: sale.totalCostAmount,
          grossProfit: sale.grossProfit,
          paymentBreakdown: sale.paymentBreakdown,
          openingFloat: sale.openingFloat,
          expectedCashFromSales: sale.expectedCashFromSales,
          actualCashReceived: sale.actualCashReceived,
          cashVariance: sale.cashVariance,
          cashSentToAirtelMoney: sale.cashSentToAirtelMoney,
          airtelMoneyTxRef: sale.airtelMoneyTxRef,
          airtelMoneySenderPhone: sale.airtelMoneySenderPhone,
          airtelMoneyReceiver: sale.airtelMoneyReceiver,
          pettyCashExpenses: sale.pettyCashExpenses,
          totalPettyExpenses: sale.totalPettyExpenses,
          closingCashInDrawer: sale.closingCashInDrawer,
          notes: sale.notes || '',
          status: sale.status,
          postingStatus: sale.postingStatus || 'POSTED_APPROVED',
          postedByBranchAt: sale.postedByBranchAt || null,
          approvedByOwnerAt: sale.approvedByOwnerAt || null,
          approvedByOwnerName: sale.approvedByOwnerName || null,
          rejectionReason: sale.rejectionReason || null,
          creditDebtorId: sale.creditDebtorId || null,
          creditDebtorName: sale.creditDebtorName || null,
          createdAt: sale.createdAt,
        }))
      );
    }

    // 9. Owner Treasury
    await db.insert(ownerTreasury).values({
      cashOnHand: INITIAL_OWNER_TREASURY.cashOnHand,
      cashOnAirtelMoney: INITIAL_OWNER_TREASURY.cashOnAirtelMoney,
      cashInBank: INITIAL_OWNER_TREASURY.cashInBank,
      lastUpdated: INITIAL_OWNER_TREASURY.lastUpdated,
    });

    // 10. Bank Records
    if (INITIAL_BANK_RECORDS.length > 0) {
      await db.insert(bankRecords).values(
        INITIAL_BANK_RECORDS.map((br) => ({
          id: br.id,
          date: br.date,
          details: br.details,
          debit: br.debit,
          credit: br.credit,
          balance: br.balance,
          referenceNo: br.referenceNo || '',
          category: br.category || 'OTHER',
          branchId: br.branchId || null,
          branchName: br.branchName || null,
          notes: br.notes || '',
          createdAt: br.createdAt,
        }))
      );
    }

    // 11. Cash Records
    if (INITIAL_CASH_RECORDS.length > 0) {
      await db.insert(cashRecords).values(
        INITIAL_CASH_RECORDS.map((cr) => ({
          id: cr.id,
          date: cr.date,
          details: cr.details,
          debit: cr.debit,
          credit: cr.credit,
          balance: cr.balance,
          referenceNo: cr.referenceNo || '',
          category: cr.category || 'OTHER',
          branchId: cr.branchId || null,
          branchName: cr.branchName || null,
          notes: cr.notes || '',
          createdAt: cr.createdAt,
        }))
      );
    }

    // 12. Airtel Records
    if (INITIAL_AIRTEL_RECORDS.length > 0) {
      await db.insert(airtelRecords).values(
        INITIAL_AIRTEL_RECORDS.map((ar) => ({
          id: ar.id,
          date: ar.date,
          details: ar.details,
          debit: ar.debit,
          credit: ar.credit,
          balance: ar.balance,
          referenceNo: ar.referenceNo || '',
          category: ar.category || 'OTHER',
          branchId: ar.branchId || null,
          branchName: ar.branchName || null,
          recipientOrSender: ar.recipientOrSender || '',
          notes: ar.notes || '',
          createdAt: ar.createdAt,
        }))
      );
    }

    // 13. Airtel Money Records
    if (INITIAL_AIRTEL_MONEY_RECORDS.length > 0) {
      await db.insert(airtelMoneyRecords).values(
        INITIAL_AIRTEL_MONEY_RECORDS.map((am) => ({
          id: am.id,
          branchId: am.branchId,
          branchName: am.branchName,
          date: am.date,
          type: am.type,
          amount: am.amount,
          transactionRef: am.transactionRef,
          senderNumber: am.senderNumber,
          receiverNumber: am.receiverNumber,
          verified: am.verified,
          notes: am.notes || '',
          createdAt: am.createdAt,
        }))
      );
    }

    // 14. Stock Reconciliations
    if (INITIAL_STOCK_RECONCILIATIONS.length > 0) {
      await db.insert(stockReconciliations).values(
        INITIAL_STOCK_RECONCILIATIONS.map((sr) => ({
          id: sr.id,
          branchId: sr.branchId,
          branchName: sr.branchName,
          date: sr.date,
          auditorOrChampName: sr.auditorOrChampName,
          items: sr.items,
          totalPositiveVarianceQty: sr.totalPositiveVarianceQty,
          totalNegativeVarianceQty: sr.totalNegativeVarianceQty,
          netVarianceValue: sr.netVarianceValue,
          status: sr.status,
          reviewedBy: sr.reviewedBy || null,
          reviewNotes: sr.reviewNotes || null,
          createdAt: sr.createdAt,
        }))
      );
    }

    // 15. Cash Movements
    if (INITIAL_CASH_MOVEMENTS.length > 0) {
      await db.insert(cashMovements).values(
        INITIAL_CASH_MOVEMENTS.map((cm) => ({
          id: cm.id,
          branchId: cm.branchId,
          branchName: cm.branchName,
          branchCode: cm.branchCode,
          amount: cm.amount,
          destination: cm.destination,
          date: cm.date,
          submittedBy: cm.submittedBy,
          referenceNumber: cm.referenceNumber,
          recipientDetails: cm.recipientDetails || null,
          notes: cm.notes || null,
          status: cm.status,
          requestedAt: cm.requestedAt,
          reviewedBy: cm.reviewedBy || null,
          reviewedAt: cm.reviewedAt || null,
          reviewNotes: cm.reviewNotes || null,
        }))
      );
    }

    // 16. Stock Transfers
    if (INITIAL_STOCK_TRANSFERS.length > 0) {
      await db.insert(stockTransfers).values(
        INITIAL_STOCK_TRANSFERS.map((st) => ({
          id: st.id,
          transferNumber: st.transferNumber,
          sourceBranchId: st.sourceBranchId,
          sourceBranchName: st.sourceBranchName,
          sourceBranchCode: st.sourceBranchCode,
          destinationBranchId: st.destinationBranchId,
          destinationBranchName: st.destinationBranchName,
          destinationBranchCode: st.destinationBranchCode,
          transferDate: st.transferDate,
          items: st.items,
          totalQuantity: st.totalQuantity,
          totalVolumeLitersOrKg: st.totalVolumeLitersOrKg,
          totalValuation: st.totalValuation,
          status: st.status,
          dispatchedBy: st.dispatchedBy,
          dispatchedAt: st.dispatchedAt,
          driverOrCourierName: st.driverOrCourierName || null,
          vehicleRegNo: st.vehicleRegNo || null,
          waybillOrRefNo: st.waybillOrRefNo || null,
          receivedBy: st.receivedBy || null,
          receivedAt: st.receivedAt || null,
          receivingNotes: st.receivingNotes || null,
          notes: st.notes || null,
          createdAt: st.createdAt,
        }))
      );
    }

    console.log('Database seeding successfully completed.');
    return;
  } catch (error: any) {
    console.warn(`Database seed attempt ${attempt} notice:`, error?.message || error);
    if (attempt >= maxRetries) {
      throw error;
    }
    // Wait before retrying to let Cloud SQL proxy warm up
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}
}
