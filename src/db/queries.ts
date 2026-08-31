// src/db/queries.ts
import { db } from './index.ts';
import {
  users,
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
import { eq, desc, and } from 'drizzle-orm';

// --- USER SYNC & AUTH ---
export async function getOrCreateUser(uid: string, email: string, name?: string, role = 'BRANCH_MANAGER', branchId?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      if (name && existing[0].name !== name) {
        await db.update(users).set({ name }).where(eq(users.uid, uid));
      }
      return existing[0];
    }
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role,
        branchId: branchId || null,
      })
      .returning();
    return inserted[0];
  } catch (error: any) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error(error?.message || 'User sync failed', { cause: error });
  }
}

// --- BRANCHES ---
export async function getAllBranches() {
  try {
    return await db.select().from(branches).orderBy(branches.name);
  } catch (error: any) {
    console.error('Database query failed for getAllBranches:', error);
    throw new Error(error?.message || 'Failed to retrieve branches', { cause: error });
  }
}

export async function createBranch(branchData: typeof branches.$inferInsert) {
  try {
    const res = await db.insert(branches).values(branchData).returning();
    return res[0];
  } catch (error: any) {
    console.error('Database query failed for createBranch:', error);
    throw new Error(error?.message || 'Failed to create branch', { cause: error });
  }
}

export async function updateBranch(branchId: string, updates: Partial<typeof branches.$inferInsert>) {
  try {
    const res = await db.update(branches).set(updates).where(eq(branches.id, branchId)).returning();
    return res[0];
  } catch (error: any) {
    console.error('Database query failed for updateBranch:', error);
    throw new Error(error?.message || 'Failed to update branch', { cause: error });
  }
}

export async function deleteBranch(branchId: string) {
  try {
    await db.delete(branches).where(eq(branches.id, branchId));
    return { success: true };
  } catch (error: any) {
    console.error('Database query failed for deleteBranch:', error);
    throw new Error(error?.message || 'Failed to delete branch', { cause: error });
  }
}

// --- PRODUCTS ---
export async function getAllProducts() {
  try {
    return await db.select().from(products).orderBy(products.category, products.name);
  } catch (error: any) {
    console.error('Database query failed for getAllProducts:', error);
    throw new Error(error?.message || 'Failed to retrieve products', { cause: error });
  }
}

export async function createProduct(productData: typeof products.$inferInsert) {
  try {
    const res = await db.insert(products).values(productData).returning();
    return res[0];
  } catch (error: any) {
    console.error('Database query failed for createProduct:', error);
    throw new Error(error?.message || 'Failed to create product', { cause: error });
  }
}

export async function updateProduct(productId: string, updates: Partial<typeof products.$inferInsert>) {
  try {
    const res = await db.update(products).set(updates).where(eq(products.id, productId)).returning();
    return res[0];
  } catch (error: any) {
    console.error('Database query failed for updateProduct:', error);
    throw new Error(error?.message || 'Failed to update product', { cause: error });
  }
}

export async function deleteProduct(productId: string) {
  try {
    await db.delete(products).where(eq(products.id, productId));
    return { success: true };
  } catch (error: any) {
    console.error('Database query failed for deleteProduct:', error);
    throw new Error(error?.message || 'Failed to delete product', { cause: error });
  }
}

// --- BRANCH STOCKS ---
export async function getAllBranchStocks() {
  try {
    return await db.select().from(branchStocks);
  } catch (error: any) {
    console.error('Database query failed for getAllBranchStocks:', error);
    throw new Error(error?.message || 'Failed to retrieve branch stocks', { cause: error });
  }
}

export async function upsertBranchStock(branchId: string, productId: string, quantity: number) {
  try {
    const res = await db
      .insert(branchStocks)
      .values({
        branchId,
        productId,
        quantity,
        lastUpdated: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [branchStocks.branchId, branchStocks.productId],
        set: {
          quantity,
          lastUpdated: new Date().toISOString(),
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for upsertBranchStock:', error);
    throw new Error('Failed to update stock quantity', { cause: error });
  }
}

// --- DAILY SALES ---
export async function getAllDailySales() {
  try {
    return await db.select().from(dailySales).orderBy(desc(dailySales.date), desc(dailySales.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllDailySales:', error);
    throw new Error('Failed to retrieve daily sales', { cause: error });
  }
}

export async function createDailySale(saleData: typeof dailySales.$inferInsert) {
  try {
    const res = await db.insert(dailySales).values(saleData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createDailySale:', error);
    throw new Error('Failed to create daily sale', { cause: error });
  }
}

export async function updateDailySale(saleId: string, updates: Partial<typeof dailySales.$inferInsert>) {
  try {
    const res = await db.update(dailySales).set(updates).where(eq(dailySales.id, saleId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateDailySale:', error);
    throw new Error('Failed to update daily sale', { cause: error });
  }
}

export async function deleteDailySale(saleId: string) {
  try {
    await db.delete(dailySales).where(eq(dailySales.id, saleId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteDailySale:', error);
    throw new Error('Failed to delete daily sale', { cause: error });
  }
}

// --- DEBTORS ---
export async function getAllDebtors() {
  try {
    return await db.select().from(debtors).orderBy(debtors.name);
  } catch (error) {
    console.error('Database query failed for getAllDebtors:', error);
    throw new Error('Failed to retrieve debtors', { cause: error });
  }
}

export async function createDebtor(debtorData: typeof debtors.$inferInsert) {
  try {
    const res = await db.insert(debtors).values(debtorData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createDebtor:', error);
    throw new Error('Failed to create debtor', { cause: error });
  }
}

export async function updateDebtor(debtorId: string, updates: Partial<typeof debtors.$inferInsert>) {
  try {
    const res = await db.update(debtors).set(updates).where(eq(debtors.id, debtorId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateDebtor:', error);
    throw new Error('Failed to update debtor', { cause: error });
  }
}

export async function deleteDebtor(debtorId: string) {
  try {
    await db.delete(debtors).where(eq(debtors.id, debtorId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteDebtor:', error);
    throw new Error('Failed to delete debtor', { cause: error });
  }
}

export async function getAllDebtorTransactions() {
  try {
    return await db.select().from(debtorTransactions).orderBy(desc(debtorTransactions.date), desc(debtorTransactions.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllDebtorTransactions:', error);
    throw new Error('Failed to retrieve debtor transactions', { cause: error });
  }
}

export async function createDebtorTransaction(txData: typeof debtorTransactions.$inferInsert) {
  try {
    const res = await db.insert(debtorTransactions).values(txData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createDebtorTransaction:', error);
    throw new Error('Failed to create debtor transaction', { cause: error });
  }
}

export async function updateDebtorTransaction(txId: string, updates: Partial<typeof debtorTransactions.$inferInsert>) {
  try {
    const res = await db.update(debtorTransactions).set(updates).where(eq(debtorTransactions.id, txId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateDebtorTransaction:', error);
    throw new Error('Failed to update debtor transaction', { cause: error });
  }
}

export async function deleteDebtorTransaction(txId: string) {
  try {
    await db.delete(debtorTransactions).where(eq(debtorTransactions.id, txId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteDebtorTransaction:', error);
    throw new Error('Failed to delete debtor transaction', { cause: error });
  }
}

// --- SUPPLIERS ---
export async function getAllSuppliers() {
  try {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  } catch (error) {
    console.error('Database query failed for getAllSuppliers:', error);
    throw new Error('Failed to retrieve suppliers', { cause: error });
  }
}

export async function createSupplier(supplierData: typeof suppliers.$inferInsert) {
  try {
    const res = await db.insert(suppliers).values(supplierData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createSupplier:', error);
    throw new Error('Failed to create supplier', { cause: error });
  }
}

export async function updateSupplier(supplierId: string, updates: Partial<typeof suppliers.$inferInsert>) {
  try {
    const res = await db.update(suppliers).set(updates).where(eq(suppliers.id, supplierId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateSupplier:', error);
    throw new Error('Failed to update supplier', { cause: error });
  }
}

export async function deleteSupplier(supplierId: string) {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, supplierId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteSupplier:', error);
    throw new Error('Failed to delete supplier', { cause: error });
  }
}

export async function getAllSupplierTransactions() {
  try {
    return await db.select().from(supplierTransactions).orderBy(desc(supplierTransactions.date), desc(supplierTransactions.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllSupplierTransactions:', error);
    throw new Error('Failed to retrieve supplier transactions', { cause: error });
  }
}

export async function createSupplierTransaction(txData: typeof supplierTransactions.$inferInsert) {
  try {
    const res = await db.insert(supplierTransactions).values(txData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createSupplierTransaction:', error);
    throw new Error('Failed to create supplier transaction', { cause: error });
  }
}

export async function updateSupplierTransaction(txId: string, updates: Partial<typeof supplierTransactions.$inferInsert>) {
  try {
    const res = await db.update(supplierTransactions).set(updates).where(eq(supplierTransactions.id, txId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateSupplierTransaction:', error);
    throw new Error('Failed to update supplier transaction', { cause: error });
  }
}

export async function deleteSupplierTransaction(txId: string) {
  try {
    await db.delete(supplierTransactions).where(eq(supplierTransactions.id, txId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteSupplierTransaction:', error);
    throw new Error('Failed to delete supplier transaction', { cause: error });
  }
}

// --- STOCK RECONCILIATIONS ---
export async function getAllStockReconciliations() {
  try {
    return await db.select().from(stockReconciliations).orderBy(desc(stockReconciliations.date), desc(stockReconciliations.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllStockReconciliations:', error);
    throw new Error('Failed to retrieve stock reconciliations', { cause: error });
  }
}

export async function createStockReconciliation(reconData: typeof stockReconciliations.$inferInsert) {
  try {
    const res = await db.insert(stockReconciliations).values(reconData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createStockReconciliation:', error);
    throw new Error('Failed to create stock reconciliation', { cause: error });
  }
}

export async function updateStockReconciliation(reconId: string, updates: Partial<typeof stockReconciliations.$inferInsert>) {
  try {
    const res = await db.update(stockReconciliations).set(updates).where(eq(stockReconciliations.id, reconId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateStockReconciliation:', error);
    throw new Error('Failed to update stock reconciliation', { cause: error });
  }
}

export async function deleteStockReconciliation(reconId: string) {
  try {
    const res = await db.delete(stockReconciliations).where(eq(stockReconciliations.id, reconId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for deleteStockReconciliation:', error);
    throw new Error('Failed to delete stock reconciliation', { cause: error });
  }
}

export async function clearAllStockReconciliations(branchId?: string) {
  try {
    if (branchId) {
      await db.delete(stockReconciliations).where(eq(stockReconciliations.branchId, branchId));
    } else {
      await db.delete(stockReconciliations);
    }
    return { success: true };
  } catch (error) {
    console.error('Database query failed for clearAllStockReconciliations:', error);
    throw new Error('Failed to clear stock reconciliations', { cause: error });
  }
}

// --- CASH MOVEMENTS ---
export async function getAllCashMovements() {
  try {
    return await db.select().from(cashMovements).orderBy(desc(cashMovements.date), desc(cashMovements.requestedAt));
  } catch (error) {
    console.error('Database query failed for getAllCashMovements:', error);
    throw new Error('Failed to retrieve cash movements', { cause: error });
  }
}

export async function createCashMovement(movementData: typeof cashMovements.$inferInsert) {
  try {
    const res = await db.insert(cashMovements).values(movementData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createCashMovement:', error);
    throw new Error('Failed to create cash movement', { cause: error });
  }
}

export async function updateCashMovement(movementId: string, updates: Partial<typeof cashMovements.$inferInsert>) {
  try {
    const res = await db.update(cashMovements).set(updates).where(eq(cashMovements.id, movementId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateCashMovement:', error);
    throw new Error('Failed to update cash movement', { cause: error });
  }
}

export async function deleteCashMovement(movementId: string) {
  try {
    await db.delete(cashMovements).where(eq(cashMovements.id, movementId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteCashMovement:', error);
    throw new Error('Failed to delete cash movement', { cause: error });
  }
}

// --- TREASURY & LEDGERS ---
export async function getOwnerTreasury() {
  try {
    const list = await db.select().from(ownerTreasury).limit(1);
    if (list.length > 0) return list[0];
    const created = await db
      .insert(ownerTreasury)
      .values({
        cashOnHand: 0,
        cashOnAirtelMoney: 0,
        cashInBank: 0,
        lastUpdated: new Date().toISOString(),
      })
      .returning();
    return created[0];
  } catch (error) {
    console.error('Database query failed for getOwnerTreasury:', error);
    throw new Error('Failed to retrieve owner treasury', { cause: error });
  }
}

export async function updateOwnerTreasury(updates: Partial<typeof ownerTreasury.$inferInsert>) {
  try {
    const list = await db.select().from(ownerTreasury).limit(1);
    if (list.length > 0) {
      const res = await db.update(ownerTreasury).set(updates).where(eq(ownerTreasury.id, list[0].id)).returning();
      return res[0];
    } else {
      const created = await db.insert(ownerTreasury).values({
        cashOnHand: updates.cashOnHand || 0,
        cashOnAirtelMoney: updates.cashOnAirtelMoney || 0,
        cashInBank: updates.cashInBank || 0,
        lastUpdated: new Date().toISOString(),
      }).returning();
      return created[0];
    }
  } catch (error) {
    console.error('Database query failed for updateOwnerTreasury:', error);
    throw new Error('Failed to update owner treasury', { cause: error });
  }
}

export async function getAllBankRecords() {
  try {
    return await db.select().from(bankRecords).orderBy(desc(bankRecords.date), desc(bankRecords.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllBankRecords:', error);
    throw new Error('Failed to retrieve bank records', { cause: error });
  }
}

export async function createBankRecord(record: typeof bankRecords.$inferInsert) {
  try {
    const res = await db.insert(bankRecords).values(record).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createBankRecord:', error);
    throw new Error('Failed to create bank record', { cause: error });
  }
}

export async function updateBankRecord(recordId: string, updates: Partial<typeof bankRecords.$inferInsert>) {
  try {
    const res = await db.update(bankRecords).set(updates).where(eq(bankRecords.id, recordId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateBankRecord:', error);
    throw new Error('Failed to update bank record', { cause: error });
  }
}

export async function deleteBankRecord(recordId: string) {
  try {
    await db.delete(bankRecords).where(eq(bankRecords.id, recordId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteBankRecord:', error);
    throw new Error('Failed to delete bank record', { cause: error });
  }
}

export async function getAllCashRecords() {
  try {
    return await db.select().from(cashRecords).orderBy(desc(cashRecords.date), desc(cashRecords.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllCashRecords:', error);
    throw new Error('Failed to retrieve cash records', { cause: error });
  }
}

export async function createCashRecord(record: typeof cashRecords.$inferInsert) {
  try {
    const res = await db.insert(cashRecords).values(record).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createCashRecord:', error);
    throw new Error('Failed to create cash record', { cause: error });
  }
}

export async function updateCashRecord(recordId: string, updates: Partial<typeof cashRecords.$inferInsert>) {
  try {
    const res = await db.update(cashRecords).set(updates).where(eq(cashRecords.id, recordId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateCashRecord:', error);
    throw new Error('Failed to update cash record', { cause: error });
  }
}

export async function deleteCashRecord(recordId: string) {
  try {
    await db.delete(cashRecords).where(eq(cashRecords.id, recordId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteCashRecord:', error);
    throw new Error('Failed to delete cash record', { cause: error });
  }
}

export async function getAllAirtelRecords() {
  try {
    return await db.select().from(airtelRecords).orderBy(desc(airtelRecords.date), desc(airtelRecords.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllAirtelRecords:', error);
    throw new Error('Failed to retrieve airtel records', { cause: error });
  }
}

export async function createAirtelRecord(record: typeof airtelRecords.$inferInsert) {
  try {
    const res = await db.insert(airtelRecords).values(record).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createAirtelRecord:', error);
    throw new Error('Failed to create airtel record', { cause: error });
  }
}

export async function updateAirtelRecord(recordId: string, updates: Partial<typeof airtelRecords.$inferInsert>) {
  try {
    const res = await db.update(airtelRecords).set(updates).where(eq(airtelRecords.id, recordId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateAirtelRecord:', error);
    throw new Error('Failed to update airtel record', { cause: error });
  }
}

export async function deleteAirtelRecord(recordId: string) {
  try {
    await db.delete(airtelRecords).where(eq(airtelRecords.id, recordId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteAirtelRecord:', error);
    throw new Error('Failed to delete airtel record', { cause: error });
  }
}

export async function getAllAirtelMoneyRecords() {
  try {
    return await db.select().from(airtelMoneyRecords).orderBy(desc(airtelMoneyRecords.date), desc(airtelMoneyRecords.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllAirtelMoneyRecords:', error);
    throw new Error('Failed to retrieve airtel money records', { cause: error });
  }
}

export async function createAirtelMoneyRecord(record: typeof airtelMoneyRecords.$inferInsert) {
  try {
    const res = await db.insert(airtelMoneyRecords).values(record).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createAirtelMoneyRecord:', error);
    throw new Error('Failed to create airtel money record', { cause: error });
  }
}

// --- STOCK TRANSFERS ---
export async function getAllStockTransfers() {
  try {
    return await db.select().from(stockTransfers).orderBy(desc(stockTransfers.transferDate), desc(stockTransfers.createdAt));
  } catch (error) {
    console.error('Database query failed for getAllStockTransfers:', error);
    throw new Error('Failed to retrieve stock transfers', { cause: error });
  }
}

export async function createStockTransfer(transferData: typeof stockTransfers.$inferInsert) {
  try {
    const res = await db.insert(stockTransfers).values(transferData).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for createStockTransfer:', error);
    throw new Error('Failed to create stock transfer', { cause: error });
  }
}

export async function updateStockTransfer(transferId: string, updates: Partial<typeof stockTransfers.$inferInsert>) {
  try {
    const res = await db.update(stockTransfers).set(updates).where(eq(stockTransfers.id, transferId)).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed for updateStockTransfer:', error);
    throw new Error('Failed to update stock transfer', { cause: error });
  }
}

export async function deleteStockTransfer(transferId: string) {
  try {
    await db.delete(stockTransfers).where(eq(stockTransfers.id, transferId));
    return { success: true };
  } catch (error) {
    console.error('Database query failed for deleteStockTransfer:', error);
    throw new Error('Failed to delete stock transfer', { cause: error });
  }
}
