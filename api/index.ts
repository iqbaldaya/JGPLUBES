import express from 'express';
import { seedDatabaseIfEmpty } from '../src/db/seed.ts';
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
} from '../src/db/queries.ts';
import { optionalAuth, AuthRequest } from '../src/middleware/auth.ts';

const app = express();
app.use(express.json({ limit: '10mb' }));

const router = express.Router();

// 1. HEALTH ENDPOINT
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    hasDbUrl: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// 2. BOOTSTRAP INITIAL DATA & SEED
router.get('/bootstrap', async (req, res) => {
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
      stocks: stocksData,
      dailySales: dailySalesData,
      debtors: debtorsData,
      debtorTransactions: debtorTxData,
      suppliers: suppliersData,
      supplierTransactions: supplierTxData,
      stockReconciliations: stockReconData,
      cashMovements: cashMovementsData,
      treasury: treasuryData,
      bankRecords: bankRecordsData,
      cashRecords: cashRecordsData,
      airtelRecords: airtelRecordsData,
      airtelMoneyRecords: airtelMoneyData,
      stockTransfers: stockTransfersData,
    });
  } catch (err: any) {
    console.error('Error fetching bootstrap data from database:', err);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
  }
});

// 3. USER PROFILE
router.get('/user/me', optionalAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.json(null);
    }
    const user = await getOrCreateUser(req.user.uid, req.user.email || '', req.user.name);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. BRANCHES
router.get('/branches', async (req, res) => {
  try {
    const data = await getAllBranches();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/branches', async (req, res) => {
  try {
    const data = await createBranch(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/branches/:id', async (req, res) => {
  try {
    const data = await updateBranch(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PRODUCTS
router.get('/products', async (req, res) => {
  try {
    const data = await getAllProducts();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const data = await createProduct(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const data = await updateProduct(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const data = await deleteProduct(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. STOCKS
router.get('/stocks', async (req, res) => {
  try {
    const data = await getAllBranchStocks();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stocks/upsert', async (req, res) => {
  try {
    const { branchId, productId, quantity } = req.body;
    const data = await upsertBranchStock(branchId, productId, quantity);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DAILY SALES
router.get('/daily-sales', async (req, res) => {
  try {
    const data = await getAllDailySales();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/daily-sales', async (req, res) => {
  try {
    const data = await createDailySale(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/daily-sales/:id', async (req, res) => {
  try {
    const data = await updateDailySale(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/daily-sales/:id', async (req, res) => {
  try {
    const data = await deleteDailySale(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. DEBTORS & DEBTOR TRANSACTIONS
router.get('/debtors', async (req, res) => {
  try {
    const data = await getAllDebtors();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/debtors', async (req, res) => {
  try {
    const data = await createDebtor(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/debtors/:id', async (req, res) => {
  try {
    const data = await updateDebtor(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/debtors/:id', async (req, res) => {
  try {
    const data = await deleteDebtor(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/debtor-transactions', async (req, res) => {
  try {
    const data = await getAllDebtorTransactions();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/debtor-transactions', async (req, res) => {
  try {
    const data = await createDebtorTransaction(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/debtor-transactions/:id', async (req, res) => {
  try {
    const data = await updateDebtorTransaction(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/debtor-transactions/:id', async (req, res) => {
  try {
    const data = await deleteDebtorTransaction(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. SUPPLIERS & SUPPLIER TRANSACTIONS
router.get('/suppliers', async (req, res) => {
  try {
    const data = await getAllSuppliers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const data = await createSupplier(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/suppliers/:id', async (req, res) => {
  try {
    const data = await updateSupplier(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const data = await deleteSupplier(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/supplier-transactions', async (req, res) => {
  try {
    const data = await getAllSupplierTransactions();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/supplier-transactions', async (req, res) => {
  try {
    const data = await createSupplierTransaction(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/supplier-transactions/:id', async (req, res) => {
  try {
    const data = await updateSupplierTransaction(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/supplier-transactions/:id', async (req, res) => {
  try {
    const data = await deleteSupplierTransaction(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. STOCK RECONCILIATIONS
router.get('/stock-reconciliations', async (req, res) => {
  try {
    const data = await getAllStockReconciliations();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock-reconciliations', async (req, res) => {
  try {
    const data = await createStockReconciliation(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/stock-reconciliations/:id', async (req, res) => {
  try {
    const data = await updateStockReconciliation(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. CASH MOVEMENTS
router.get('/cash-movements', async (req, res) => {
  try {
    const data = await getAllCashMovements();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cash-movements', async (req, res) => {
  try {
    const data = await createCashMovement(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/cash-movements/:id', async (req, res) => {
  try {
    const data = await updateCashMovement(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cash-movements/:id', async (req, res) => {
  try {
    const data = await deleteCashMovement(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. TREASURY & LEDGERS
router.get('/treasury', async (req, res) => {
  try {
    const data = await getOwnerTreasury();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/treasury', async (req, res) => {
  try {
    const data = await updateOwnerTreasury(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bank-records', async (req, res) => {
  try {
    const data = await getAllBankRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bank-records', async (req, res) => {
  try {
    const data = await createBankRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/bank-records/:id', async (req, res) => {
  try {
    const data = await updateBankRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bank-records/:id', async (req, res) => {
  try {
    const data = await deleteBankRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cash-records', async (req, res) => {
  try {
    const data = await getAllCashRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cash-records', async (req, res) => {
  try {
    const data = await createCashRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/cash-records/:id', async (req, res) => {
  try {
    const data = await updateCashRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cash-records/:id', async (req, res) => {
  try {
    const data = await deleteCashRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/airtel-records', async (req, res) => {
  try {
    const data = await getAllAirtelRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/airtel-records', async (req, res) => {
  try {
    const data = await createAirtelRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/airtel-records/:id', async (req, res) => {
  try {
    const data = await updateAirtelRecord(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/airtel-records/:id', async (req, res) => {
  try {
    const data = await deleteAirtelRecord(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/airtel-money-records', async (req, res) => {
  try {
    const data = await getAllAirtelMoneyRecords();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/airtel-money-records', async (req, res) => {
  try {
    const data = await createAirtelMoneyRecord(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. STOCK TRANSFERS
router.get('/stock-transfers', async (req, res) => {
  try {
    const data = await getAllStockTransfers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock-transfers', async (req, res) => {
  try {
    const data = await createStockTransfer(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/stock-transfers/:id', async (req, res) => {
  try {
    const data = await updateStockTransfer(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/stock-transfers/:id', async (req, res) => {
  try {
    const data = await deleteStockTransfer(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mount on both /api and / to seamlessly handle any Vercel routing configuration
app.use('/api', router);
app.use('/', router);

export default app;
