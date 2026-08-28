// server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import {
  getAllBranches,
  createBranch,
  updateBranch,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllBranchStocks,
  upsertBranchStock,
  getAllDailySales,
  createDailySale,
  updateDailySale,
  deleteDailySale,
  getAllDebtors,
  createDebtor,
  updateDebtor,
  deleteDebtor,
  getAllDebtorTransactions,
  createDebtorTransaction,
  updateDebtorTransaction,
  deleteDebtorTransaction,
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getAllSupplierTransactions,
  createSupplierTransaction,
  updateSupplierTransaction,
  deleteSupplierTransaction,
  getAllStockReconciliations,
  createStockReconciliation,
  updateStockReconciliation,
  getAllCashMovements,
  createCashMovement,
  updateCashMovement,
  deleteCashMovement,
  getOwnerTreasury,
  updateOwnerTreasury,
  getAllBankRecords,
  createBankRecord,
  updateBankRecord,
  deleteBankRecord,
  getAllCashRecords,
  createCashRecord,
  updateCashRecord,
  deleteCashRecord,
  getAllAirtelRecords,
  createAirtelRecord,
  updateAirtelRecord,
  deleteAirtelRecord,
  getAllAirtelMoneyRecords,
  createAirtelMoneyRecord,
  getAllStockTransfers,
  createStockTransfer,
  updateStockTransfer,
  deleteStockTransfer,
  getOrCreateUser,
} from './src/db/queries.ts';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// 1. HEALTH ENDPOINT
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. BOOTSTRAP INITIAL DATA & SEED
app.get('/api/bootstrap', async (req, res) => {
  try {
    await seedDatabaseIfEmpty();
    const [
      branchesData,
      productsData,
      stocksData,
      dailySalesData,
      debtorsData,
      debtorTxData,
      suppliersData,
      supplierTxData,
      stockReconData,
      cashMovementsData,
      treasuryData,
      bankRecordsData,
      cashRecordsData,
      airtelRecordsData,
      airtelMoneyData,
      stockTransfersData,
    ] = await Promise.all([
      getAllBranches(),
      getAllProducts(),
      getAllBranchStocks(),
      getAllDailySales(),
      getAllDebtors(),
      getAllDebtorTransactions(),
      getAllSuppliers(),
      getAllSupplierTransactions(),
      getAllStockReconciliations(),
      getAllCashMovements(),
      getOwnerTreasury(),
      getAllBankRecords(),
      getAllCashRecords(),
      getAllAirtelRecords(),
      getAllAirtelMoneyRecords(),
      getAllStockTransfers(),
    ]);

    res.json({
      branches: branchesData,
      products: productsData,
      branchStocks: stocksData,
      dailySales: dailySalesData,
      debtors: debtorsData,
      debtorTransactions: debtorTxData,
      suppliers: suppliersData,
      supplierTransactions: supplierTxData,
      stockReconciliations: stockReconData,
      cashMovements: cashMovementsData,
      ownerTreasury: treasuryData,
      bankRecords: bankRecordsData,
      cashRecords: cashRecordsData,
      airtelRecords: airtelRecordsData,
      airtelMoneyRecords: airtelMoneyData,
      stockTransfers: stockTransfersData,
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: error.message || 'Bootstrap failed' });
  }
});

// 3. USER SYNC
app.post('/api/users/sync', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email, name, role, branchId } = req.body;
    const effectiveUid = req.user?.uid || uid;
    const effectiveEmail = req.user?.email || email || 'guest@enterprise.com';
    const user = await getOrCreateUser(effectiveUid, effectiveEmail, name, role, branchId);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// 4. BRANCHES
app.get('/api/branches', async (req, res) => {
  try {
    const data = await getAllBranches();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/branches', async (req, res) => {
  try {
    const data = await createBranch(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/branches/:id', async (req, res) => {
  try {
    const data = await updateBranch(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const data = await getAllProducts();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const data = await createProduct(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const data = await updateProduct(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const data = await deleteProduct(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. STOCKS
app.get('/api/stocks', async (req, res) => {
  try {
    const data = await getAllBranchStocks();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stocks/upsert', async (req, res) => {
  try {
    const { branchId, productId, quantity } = req.body;
    const data = await upsertBranchStock(branchId, productId, quantity);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DAILY SALES
app.get('/api/daily-sales', async (req, res) => {
  try {
    const data = await getAllDailySales();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/daily-sales', async (req, res) => {
  try {
    const data = await createDailySale(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/daily-sales/:id', async (req, res) => {
  try {
    const data = await updateDailySale(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/daily-sales/:id', async (req, res) => {
  try {
    const data = await deleteDailySale(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. DEBTORS & DEBTOR TRANSACTIONS
app.get('/api/debtors', async (req, res) => {
  try {
    const data = await getAllDebtors();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/debtors', async (req, res) => {
  try {
    const data = await createDebtor(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/debtors/:id', async (req, res) => {
  try {
    const data = await updateDebtor(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/debtors/:id', async (req, res) => {
  try {
    const data = await deleteDebtor(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debtor-transactions', async (req, res) => {
  try {
    const data = await getAllDebtorTransactions();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/debtor-transactions', async (req, res) => {
  try {
    const data = await createDebtorTransaction(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/debtor-transactions/:id', async (req, res) => {
  try {
    const data = await updateDebtorTransaction(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/debtor-transactions/:id', async (req, res) => {
  try {
    const data = await deleteDebtorTransaction(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. SUPPLIERS & SUPPLIER TRANSACTIONS
app.get('/api/suppliers', async (req, res) => {
  try {
    const data = await getAllSuppliers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const data = await createSupplier(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/suppliers/:id', async (req, res) => {
  try {
    const data = await updateSupplier(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const data = await deleteSupplier(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/supplier-transactions', async (req, res) => {
  try {
    const data = await getAllSupplierTransactions();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/supplier-transactions', async (req, res) => {
  try {
    const data = await createSupplierTransaction(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/supplier-transactions/:id', async (req, res) => {
  try {
    const data = await updateSupplierTransaction(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/supplier-transactions/:id', async (req, res) => {
  try {
    const data = await deleteSupplierTransaction(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. STOCK RECONCILIATIONS
app.get('/api/stock-reconciliations', async (req, res) => {
  try {
    const data = await getAllStockReconciliations();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-reconciliations', async (req, res) => {
  try {
    const data = await createStockReconciliation(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/stock-reconciliations/:id', async (req, res) => {
  try {
    const data = await updateStockReconciliation(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. CASH MOVEMENTS
app.get('/api/cash-movements', async (req, res) => {
  try {
    const data = await getAllCashMovements();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-movements', async (req, res) => {
  try {
    const data = await createCashMovement(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/cash-movements/:id', async (req, res) => {
  try {
    const data = await updateCashMovement(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cash-movements/:id', async (req, res) => {
  try {
    const data = await deleteCashMovement(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. TREASURY & LEDGERS
app.get('/api/treasury', async (req, res) => {
  try {
    const data = await getOwnerTreasury();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/treasury', async (req, res) => {
  try {
    const data = await updateOwnerTreasury(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bank-records', async (req, res) => {
  try {
    const data = await getAllBankRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bank-records', async (req, res) => {
  try {
    const data = await createBankRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bank-records/:id', async (req, res) => {
  try {
    const data = await updateBankRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bank-records/:id', async (req, res) => {
  try {
    const data = await deleteBankRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cash-records', async (req, res) => {
  try {
    const data = await getAllCashRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-records', async (req, res) => {
  try {
    const data = await createCashRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/cash-records/:id', async (req, res) => {
  try {
    const data = await updateCashRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cash-records/:id', async (req, res) => {
  try {
    const data = await deleteCashRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/airtel-records', async (req, res) => {
  try {
    const data = await getAllAirtelRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/airtel-records', async (req, res) => {
  try {
    const data = await createAirtelRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/airtel-records/:id', async (req, res) => {
  try {
    const data = await updateAirtelRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/airtel-records/:id', async (req, res) => {
  try {
    const data = await deleteAirtelRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/airtel-money-records', async (req, res) => {
  try {
    const data = await getAllAirtelMoneyRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/airtel-money-records', async (req, res) => {
  try {
    const data = await createAirtelMoneyRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. STOCK TRANSFERS
app.get('/api/stock-transfers', async (req, res) => {
  try {
    const data = await getAllStockTransfers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-transfers', async (req, res) => {
  try {
    const data = await createStockTransfer(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/stock-transfers/:id', async (req, res) => {
  try {
    const data = await updateStockTransfer(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stock-transfers/:id', async (req, res) => {
  try {
    const data = await deleteStockTransfer(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER & ATTACH VITE MIDDLEWARE
async function start() {
  try {
    await seedDatabaseIfEmpty();
  } catch (seedErr) {
    console.error('Error during initial database seeding:', seedErr);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
