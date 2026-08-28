// src/db/seed.ts
import { db } from './index.ts';
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

export async function seedDatabaseIfEmpty() {
  try {
    // Check if branches exist
    const branchCount = await db.select({ val: count() }).from(branches);
    if (branchCount[0]?.val > 0) {
      console.log('Database already contains records. Skipping seed.');
      return;
    }

    console.log('Seeding Cloud SQL PostgreSQL database with enterprise master data...');

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
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}
