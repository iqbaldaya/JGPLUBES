import * as XLSX from 'xlsx';
import {
  Branch,
  Product,
  BranchStock,
  DailySalesRecord,
  BankRecord,
  CashRecord,
  AirtelRecord,
  Debtor,
  DebtorTransaction,
  Supplier,
  SupplierTransaction,
  StockReconciliation,
  BranchCashMovement,
  OwnerTreasury,
  StockTransfer,
} from '../types';

/**
 * Escapes a cell value for CSV formatting following RFC 4180 rules.
 * Handles nulls, numbers, commas, quotes, linebreaks.
 */
export const escapeCsvCell = (val: unknown): string => {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts an array of rows (each row is an array of cell values) into standard CSV string with UTF-8 BOM.
 */
export const buildCsvString = (headers: string[], rows: (string | number | boolean | null | undefined)[][]): string => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};

/**
 * Downloads a string content as a CSV file with UTF-8 BOM encoding for complete Microsoft Excel compatibility.
 */
export const downloadCsvFile = (filename: string, csvContent: string): void => {
  // UTF-8 BOM prefix (\uFEFF) ensures Excel opens special characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// =======================================================
// TABLE DATA EXTRACTORS (SHARED BETWEEN CSV & MULTI-SHEET EXCEL)
// =======================================================

export interface TableData {
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * 1. DAILY SALES DATA
 */
export const getDailySalesTableData = (dailySales: DailySalesRecord[]): TableData => {
  const headers = [
    'Record ID',
    'Date',
    'Shift',
    'Branch ID',
    'Branch Name',
    'Branch Code',
    'Lubes Champion / Attendant',
    'Product SKU / Code',
    'Product Name',
    'Category',
    'Unit Packaging',
    'Unit Volume (L/Kg)',
    'Quantity Sold',
    'Total Volume Sold (L/Kg)',
    'Unit Cost Price (ZMW)',
    'Unit Selling Price (ZMW)',
    'Line Item Total (ZMW)',
    'Line Item Profit (ZMW)',
    'Shift Total Sales (ZMW)',
    'Cash Sales Portion (ZMW)',
    'Airtel Direct Sales Portion (ZMW)',
    'Bank/Card Portion (ZMW)',
    'Credit Sale Portion (ZMW)',
    'Debtor Customer Name',
    'Opening Cash Float (ZMW)',
    'Actual Cash Counted (ZMW)',
    'Expected Cash (ZMW)',
    'Cash Variance (ZMW)',
    'Airtel Tx Ref',
    'Petty Expenses (ZMW)',
    'Closing Cash in Drawer (ZMW)',
    'Record Status',
    'Posting Status',
    'Approved By',
    'Notes / Remarks',
    'Created Timestamp',
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [];

  dailySales.forEach((r) => {
    if (r.items && r.items.length > 0) {
      r.items.forEach((item) => {
        const totalVol = (Number(item.quantity) || 0) * (Number(item.volumePerUnit) || 0);
        rows.push([
          r.id,
          r.date,
          r.shift || 'Full Day',
          r.branchId,
          r.branchName,
          r.branchCode,
          r.lubesChamp,
          item.productCode,
          item.productName,
          item.category,
          item.unit,
          item.volumePerUnit ?? 0,
          item.quantity,
          totalVol,
          item.costPrice ?? 0,
          item.unitPrice,
          item.totalAmount,
          item.profit ?? (item.totalAmount - (item.costPrice ?? 0) * item.quantity),
          r.totalSalesAmount,
          r.paymentBreakdown?.cashSales ?? 0,
          r.paymentBreakdown?.airtelMoneyDirectSales ?? 0,
          r.paymentBreakdown?.bankOrCardSales ?? 0,
          r.paymentBreakdown?.creditSales ?? 0,
          r.creditDebtorName || '',
          r.openingFloat ?? 0,
          r.actualCashReceived ?? 0,
          r.expectedCashFromSales ?? 0,
          r.cashVariance ?? 0,
          r.airtelMoneyTxRef || '',
          r.totalPettyExpenses ?? 0,
          r.closingCashInDrawer ?? 0,
          r.status,
          r.postingStatus || 'POSTED_APPROVED',
          r.approvedByOwnerName || '',
          r.notes || '',
          r.createdAt,
        ]);
      });
    } else {
      rows.push([
        r.id,
        r.date,
        r.shift || 'Full Day',
        r.branchId,
        r.branchName,
        r.branchCode,
        r.lubesChamp,
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        r.totalSalesAmount,
        r.paymentBreakdown?.cashSales ?? 0,
        r.paymentBreakdown?.airtelMoneyDirectSales ?? 0,
        r.paymentBreakdown?.bankOrCardSales ?? 0,
        r.paymentBreakdown?.creditSales ?? 0,
        r.creditDebtorName || '',
        r.openingFloat ?? 0,
        r.actualCashReceived ?? 0,
        r.expectedCashFromSales ?? 0,
        r.cashVariance ?? 0,
        r.airtelMoneyTxRef || '',
        r.totalPettyExpenses ?? 0,
        r.closingCashInDrawer ?? 0,
        r.status,
        r.postingStatus || 'POSTED_APPROVED',
        r.approvedByOwnerName || '',
        r.notes || '',
        r.createdAt,
      ]);
    }
  });

  return { headers, rows };
};

/**
 * 2. PRODUCTS DATA
 */
export const getProductsTableData = (products: Product[]): TableData => {
  const headers = [
    'Product ID',
    'SKU / Code',
    'Product Name',
    'Category',
    'Sub Category',
    'Packaging Unit',
    'Volume in Liters or Kg',
    'Cost Price (WAC ZMW)',
    'Selling Price (ZMW)',
    'Gross Margin (ZMW)',
    'Gross Margin (%)',
    'Reorder Threshold (Units)',
    'Status',
    'Description',
  ];

  const rows = products.map((p) => {
    const margin = p.sellingPrice - p.costPrice;
    const marginPercent = p.costPrice > 0 ? ((margin / p.costPrice) * 100).toFixed(1) + '%' : '100%';
    return [
      p.id,
      p.code,
      p.name,
      p.category,
      p.subCategory || '',
      p.unit,
      p.volumeLitersOrKg,
      p.costPrice,
      p.sellingPrice,
      margin,
      marginPercent,
      p.reorderThreshold,
      p.isActive ? 'ACTIVE' : 'INACTIVE',
      p.description || '',
    ];
  });

  return { headers, rows };
};

/**
 * 3. BRANCH STOCKS DATA
 */
export const getBranchStocksTableData = (
  branchStocks: BranchStock[],
  branches: Branch[],
  products: Product[]
): TableData => {
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const headers = [
    'Branch ID',
    'Branch Name',
    'Branch Code',
    'Product ID',
    'SKU / Code',
    'Product Name',
    'Category',
    'Sub Category',
    'Unit',
    'Volume Per Unit (L/Kg)',
    'Current Stock (Units)',
    'Total Volume Remaining (L/Kg)',
    'Unit Cost Price (ZMW)',
    'Unit Selling Price (ZMW)',
    'Stock Value at Cost (ZMW)',
    'Stock Value at Retail (ZMW)',
    'Reorder Threshold',
    'Stock Status',
    'Last Updated Timestamp',
  ];

  const rows = branchStocks.map((s) => {
    const branch = branchMap.get(s.branchId);
    const product = productMap.get(s.productId);
    const qty = Number(s.quantity) || 0;
    const volPerUnit = Number(product?.volumeLitersOrKg) || 0;
    const cost = Number(product?.costPrice) || 0;
    const price = Number(product?.sellingPrice) || 0;
    const threshold = Number(product?.reorderThreshold) || 5;

    let status = 'HEALTHY';
    if (qty <= 0) status = 'OUT_OF_STOCK';
    else if (qty <= threshold) status = 'LOW_STOCK';

    return [
      s.branchId,
      branch ? branch.name : s.branchId,
      branch ? branch.code : '',
      s.productId,
      product ? product.code : '',
      product ? product.name : '',
      product ? product.category : '',
      product ? product.subCategory : '',
      product ? product.unit : '',
      volPerUnit,
      qty,
      qty * volPerUnit,
      cost,
      price,
      qty * cost,
      qty * price,
      threshold,
      status,
      s.lastUpdated,
    ];
  });

  return { headers, rows };
};

/**
 * 4. BANK RECORDS DATA
 */
export const getBankRecordsTableData = (bankRecords: BankRecord[]): TableData => {
  const headers = [
    'Record ID',
    'Date',
    'Transaction Details',
    'Category',
    'Debit Inflow (ZMW)',
    'Credit Outflow (ZMW)',
    'Running Balance (ZMW)',
    'Reference / Cheque No',
    'Branch ID',
    'Branch Name',
    'Notes',
    'Created Timestamp',
  ];

  const rows = bankRecords.map((r) => [
    r.id,
    r.date,
    r.details,
    r.category || 'OTHER',
    r.debit ?? 0,
    r.credit ?? 0,
    r.balance ?? 0,
    r.referenceNo || '',
    r.branchId || '',
    r.branchName || '',
    r.notes || '',
    r.createdAt,
  ]);

  return { headers, rows };
};

/**
 * 5. CASH RECORDS DATA
 */
export const getCashRecordsTableData = (cashRecords: CashRecord[]): TableData => {
  const headers = [
    'Record ID',
    'Date',
    'Transaction Details',
    'Category',
    'Debit Inflow (ZMW)',
    'Credit Outflow (ZMW)',
    'Running Balance (ZMW)',
    'Reference / Voucher No',
    'Branch ID',
    'Branch Name',
    'Notes',
    'Created Timestamp',
  ];

  const rows = cashRecords.map((r) => [
    r.id,
    r.date,
    r.details,
    r.category || 'OTHER',
    r.debit ?? 0,
    r.credit ?? 0,
    r.balance ?? 0,
    r.referenceNo || '',
    r.branchId || '',
    r.branchName || '',
    r.notes || '',
    r.createdAt,
  ]);

  return { headers, rows };
};

/**
 * 6. AIRTEL RECORDS DATA
 */
export const getAirtelRecordsTableData = (airtelRecords: AirtelRecord[]): TableData => {
  const headers = [
    'Record ID',
    'Date',
    'Transaction Details',
    'Category',
    'Debit Inflow (ZMW)',
    'Credit Outflow (ZMW)',
    'Running Balance (ZMW)',
    'Airtel Tx Reference',
    'Recipient / Sender Phone',
    'Branch ID',
    'Branch Name',
    'Notes',
    'Created Timestamp',
  ];

  const rows = airtelRecords.map((r) => [
    r.id,
    r.date,
    r.details,
    r.category || 'OTHER',
    r.debit ?? 0,
    r.credit ?? 0,
    r.balance ?? 0,
    r.referenceNo || '',
    r.recipientOrSender || '',
    r.branchId || '',
    r.branchName || '',
    r.notes || '',
    r.createdAt,
  ]);

  return { headers, rows };
};

/**
 * 7. DEBTORS DATA
 */
export const getDebtorsTableData = (debtors: Debtor[]): TableData => {
  const headers = [
    'Debtor ID',
    'Customer Code',
    'Customer / Company Name',
    'Contact Person',
    'Phone',
    'Email',
    'Physical Address',
    'Credit Limit (ZMW)',
    'Total Credit Sales (ZMW)',
    'Total Amount Paid (ZMW)',
    'Outstanding Balance Due (ZMW)',
    'Account Status',
    'Notes',
    'Created Timestamp',
  ];

  const rows = debtors.map((d) => [
    d.id,
    d.code,
    d.name,
    d.contactPerson || '',
    d.phone,
    d.email || '',
    d.address || '',
    d.creditLimit ?? 0,
    d.totalCreditSales ?? 0,
    d.totalPaid ?? 0,
    d.outstandingBalance ?? 0,
    d.status,
    d.notes || '',
    d.createdAt,
  ]);

  return { headers, rows };
};

/**
 * 8. DEBTOR TRANSACTIONS DATA
 */
export const getDebtorTransactionsTableData = (
  debtorTransactions: DebtorTransaction[],
  debtors: Debtor[]
): TableData => {
  const debtorMap = new Map(debtors.map((d) => [d.id, d]));

  const headers = [
    'Transaction ID',
    'Date',
    'Debtor ID',
    'Debtor Customer Name',
    'Customer Code',
    'Transaction Type',
    'Reference / Invoice / Receipt No',
    'Transaction Details',
    'Debit Credit Sale (ZMW)',
    'Credit Payment Received (ZMW)',
    'Running Balance (ZMW)',
    'Payment Method',
    'Destination Account',
    'Settlement Status',
    'Branch ID',
    'Branch Name',
    'Created Timestamp',
  ];

  const rows = debtorTransactions.map((t) => {
    const debtor = debtorMap.get(t.debtorId);
    return [
      t.id,
      t.date,
      t.debtorId,
      t.debtorName || (debtor ? debtor.name : ''),
      debtor ? debtor.code : '',
      t.type,
      t.referenceNo || '',
      t.details || '',
      t.debit ?? 0,
      t.credit ?? 0,
      t.balance ?? 0,
      t.paymentMethod || '',
      t.paymentDestination || '',
      t.status || 'PAID',
      t.branchId || '',
      t.branchName || '',
      t.createdAt,
    ];
  });

  return { headers, rows };
};

/**
 * 9. SUPPLIERS DATA
 */
export const getSuppliersTableData = (suppliers: Supplier[]): TableData => {
  const headers = [
    'Supplier ID',
    'Supplier Code',
    'Supplier Name',
    'Contact Person',
    'Phone',
    'Email',
    'Physical Address',
    'Supply Category',
    'Payment Terms (Days)',
    'TPIN / Tax Number',
    'Created Timestamp',
  ];

  const rows = suppliers.map((s) => [
    s.id,
    s.code,
    s.name,
    s.contactPerson || '',
    s.phone,
    s.email || '',
    s.address || '',
    s.category,
    s.paymentTermsDays ?? 30,
    s.taxNumber || '',
    s.createdAt,
  ]);

  return { headers, rows };
};

/**
 * 10. SUPPLIER TRANSACTIONS DATA
 */
export const getSupplierTransactionsTableData = (
  supplierTransactions: SupplierTransaction[],
  suppliers: Supplier[]
): TableData => {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  const headers = [
    'Transaction ID',
    'Date',
    'Supplier ID',
    'Supplier Name',
    'Supplier Code',
    'Type',
    'Invoice / Reference No',
    'Amount (ZMW)',
    'Due Date',
    'Payment Method',
    'Payment Reference',
    'Items Summary',
    'Payment Status',
    'Branch Destination ID',
    'Branch Name',
    'Notes',
    'Created Timestamp',
  ];

  const rows = supplierTransactions.map((t) => {
    const sup = supplierMap.get(t.supplierId);
    const itemsSummary = t.items
      ? t.items.map((i) => `${i.productName} (${i.quantity}x @ K${i.unitCost})`).join('; ')
      : '';

    return [
      t.id,
      t.date,
      t.supplierId,
      t.supplierName || (sup ? sup.name : ''),
      sup ? sup.code : '',
      t.type,
      t.referenceNo,
      t.amount,
      t.dueDate || '',
      t.paymentMethod || '',
      t.paymentRef || '',
      itemsSummary,
      t.status,
      t.branchId || 'HQ_CENTRAL',
      t.branchName || 'HQ / Central Storage',
      t.notes || '',
      t.createdAt,
    ];
  });

  return { headers, rows };
};

/**
 * 11. STOCK RECONCILIATIONS DATA
 */
export const getStockReconciliationsTableData = (stockReconciliations: StockReconciliation[]): TableData => {
  const headers = [
    'Audit ID',
    'Date',
    'Branch ID',
    'Branch Name',
    'Auditor / Champ Name',
    'Product Code',
    'Product Name',
    'Category',
    'Unit',
    'System Book Qty',
    'Physical Count Qty',
    'Variance Qty',
    'Unit Cost (ZMW)',
    'Variance Value (ZMW)',
    'Variance Reason',
    'Item Notes',
    'Audit Overall Status',
    'Auditor Review Notes',
    'Created Timestamp',
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [];

  stockReconciliations.forEach((r) => {
    if (r.items && r.items.length > 0) {
      r.items.forEach((item) => {
        rows.push([
          r.id,
          r.date,
          r.branchId,
          r.branchName,
          r.auditorOrChampName,
          item.productCode,
          item.productName,
          item.category,
          item.unit,
          item.systemQty,
          item.physicalQty,
          item.varianceQty,
          item.unitCost,
          item.varianceValue,
          item.reason,
          item.notes || '',
          r.status,
          r.reviewNotes || '',
          r.createdAt,
        ]);
      });
    } else {
      rows.push([
        r.id,
        r.date,
        r.branchId,
        r.branchName,
        r.auditorOrChampName,
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        r.netVarianceValue ?? 0,
        '',
        '',
        r.status,
        r.reviewNotes || '',
        r.createdAt,
      ]);
    }
  });

  return { headers, rows };
};

/**
 * 12. CASH MOVEMENTS DATA
 */
export const getCashMovementsTableData = (cashMovements: BranchCashMovement[]): TableData => {
  const headers = [
    'Movement ID',
    'Date',
    'Branch ID',
    'Branch Name',
    'Branch Code',
    'Amount (ZMW)',
    'Destination Account',
    'Submitted By (Attendant)',
    'Reference / Voucher Number',
    'Recipient Details',
    'Approval Status',
    'Requested Timestamp',
    'Reviewed By (Owner)',
    'Reviewed Timestamp',
    'Notes / Remarks',
  ];

  const rows = cashMovements.map((m) => [
    m.id,
    m.date,
    m.branchId,
    m.branchName,
    m.branchCode,
    m.amount,
    m.destination,
    m.submittedBy,
    m.referenceNumber,
    m.recipientDetails || '',
    m.status,
    m.requestedAt,
    m.reviewedBy || '',
    m.reviewedAt || '',
    m.notes || m.reviewNotes || '',
  ]);

  return { headers, rows };
};

/**
 * 13. BRANCHES DATA
 */
export const getBranchesTableData = (branches: Branch[]): TableData => {
  const headers = [
    'Branch ID',
    'Branch Code',
    'Branch Name',
    'Location / Address',
    'Lubes Champion / Manager',
    'Phone',
    'Opening Cash Float (ZMW)',
    'Airtel Merchant No',
    'Status',
    'Monthly Sales Target (ZMW)',
    'Created Timestamp',
  ];

  const rows = branches.map((b) => [
    b.id,
    b.code,
    b.name,
    b.location,
    b.lubesChamp,
    b.phone,
    b.openingCashFloat ?? 0,
    b.airtelMerchantNumber || '',
    b.status,
    b.targetMonthlySales ?? 0,
    b.createdAt,
  ]);

  return { headers, rows };
};

// ==========================================
// CSV STRING CONVERTERS
// ==========================================

export const generateDailySalesCsv = (dailySales: DailySalesRecord[]): string => {
  const { headers, rows } = getDailySalesTableData(dailySales);
  return buildCsvString(headers, rows);
};

export const generateProductsCsv = (products: Product[]): string => {
  const { headers, rows } = getProductsTableData(products);
  return buildCsvString(headers, rows);
};

export const generateBranchStocksCsv = (
  branchStocks: BranchStock[],
  branches: Branch[],
  products: Product[]
): string => {
  const { headers, rows } = getBranchStocksTableData(branchStocks, branches, products);
  return buildCsvString(headers, rows);
};

export const generateBankRecordsCsv = (bankRecords: BankRecord[]): string => {
  const { headers, rows } = getBankRecordsTableData(bankRecords);
  return buildCsvString(headers, rows);
};

export const generateCashRecordsCsv = (cashRecords: CashRecord[]): string => {
  const { headers, rows } = getCashRecordsTableData(cashRecords);
  return buildCsvString(headers, rows);
};

export const generateAirtelRecordsCsv = (airtelRecords: AirtelRecord[]): string => {
  const { headers, rows } = getAirtelRecordsTableData(airtelRecords);
  return buildCsvString(headers, rows);
};

export const generateDebtorsCsv = (debtors: Debtor[]): string => {
  const { headers, rows } = getDebtorsTableData(debtors);
  return buildCsvString(headers, rows);
};

export const generateDebtorTransactionsCsv = (
  debtorTransactions: DebtorTransaction[],
  debtors: Debtor[]
): string => {
  const { headers, rows } = getDebtorTransactionsTableData(debtorTransactions, debtors);
  return buildCsvString(headers, rows);
};

export const generateSuppliersCsv = (suppliers: Supplier[]): string => {
  const { headers, rows } = getSuppliersTableData(suppliers);
  return buildCsvString(headers, rows);
};

export const generateSupplierTransactionsCsv = (
  supplierTransactions: SupplierTransaction[],
  suppliers: Supplier[]
): string => {
  const { headers, rows } = getSupplierTransactionsTableData(supplierTransactions, suppliers);
  return buildCsvString(headers, rows);
};

export const generateStockReconciliationsCsv = (stockReconciliations: StockReconciliation[]): string => {
  const { headers, rows } = getStockReconciliationsTableData(stockReconciliations);
  return buildCsvString(headers, rows);
};

export const generateCashMovementsCsv = (cashMovements: BranchCashMovement[]): string => {
  const { headers, rows } = getCashMovementsTableData(cashMovements);
  return buildCsvString(headers, rows);
};

export const generateBranchesCsv = (branches: Branch[]): string => {
  const { headers, rows } = getBranchesTableData(branches);
  return buildCsvString(headers, rows);
};

/**
 * 14. INTER-BRANCH STOCK TRANSFERS DATA
 */
export const getStockTransfersTableData = (stockTransfers: StockTransfer[] = []): TableData => {
  const headers = [
    'Transfer ID',
    'Transfer No',
    'Transfer Date',
    'Source Branch ID',
    'Source Branch Name',
    'Source Branch Code',
    'Destination Branch ID',
    'Destination Branch Name',
    'Destination Branch Code',
    'Product SKU / Code',
    'Product Name',
    'Packaging Unit',
    'Quantity Dispatched',
    'Unit Cost (ZMW)',
    'Line Total Cost (ZMW)',
    'Total Transfer Qty',
    'Total Volume (L/Kg)',
    'Total Transfer Valuation (ZMW)',
    'Transfer Status',
    'Dispatched By',
    'Dispatched Timestamp',
    'Driver / Courier',
    'Vehicle Reg No',
    'Waybill / Ref No',
    'Received By',
    'Received Timestamp',
    'Receiving Notes',
    'Notes',
    'Created Timestamp',
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [];

  stockTransfers.forEach((trf) => {
    if (trf.items && trf.items.length > 0) {
      trf.items.forEach((item) => {
        rows.push([
          trf.id,
          trf.transferNumber,
          trf.transferDate,
          trf.sourceBranchId,
          trf.sourceBranchName,
          trf.sourceBranchCode,
          trf.destinationBranchId,
          trf.destinationBranchName,
          trf.destinationBranchCode,
          item.productCode,
          item.productName,
          item.unit,
          item.quantity,
          item.unitCost,
          item.totalCost,
          trf.totalQuantity,
          trf.totalVolumeLitersOrKg,
          trf.totalValuation,
          trf.status,
          trf.dispatchedBy,
          trf.dispatchedAt,
          trf.driverOrCourierName || '',
          trf.vehicleRegNo || '',
          trf.waybillOrRefNo || '',
          trf.receivedBy || '',
          trf.receivedAt || '',
          trf.receivingNotes || '',
          trf.notes || '',
          trf.createdAt,
        ]);
      });
    } else {
      rows.push([
        trf.id,
        trf.transferNumber,
        trf.transferDate,
        trf.sourceBranchId,
        trf.sourceBranchName,
        trf.sourceBranchCode,
        trf.destinationBranchId,
        trf.destinationBranchName,
        trf.destinationBranchCode,
        '',
        '',
        '',
        0,
        0,
        0,
        trf.totalQuantity,
        trf.totalVolumeLitersOrKg,
        trf.totalValuation,
        trf.status,
        trf.dispatchedBy,
        trf.dispatchedAt,
        trf.driverOrCourierName || '',
        trf.vehicleRegNo || '',
        trf.waybillOrRefNo || '',
        trf.receivedBy || '',
        trf.receivedAt || '',
        trf.receivingNotes || '',
        trf.notes || '',
        trf.createdAt,
      ]);
    }
  });

  return { headers, rows };
};

export const generateStockTransfersCsv = (stockTransfers: StockTransfer[] = []): string => {
  const { headers, rows } = getStockTransfersTableData(stockTransfers);
  return buildCsvString(headers, rows);
};

// =========================================================================
// MULTI-SHEET EXCEL WORKBOOK EXPORT (.XLSX) - EACH SECTION ON A SEPARATE SHEET
// =========================================================================

export interface SystemDataExportPayload {
  branches: Branch[];
  products: Product[];
  branchStocks: BranchStock[];
  dailySales: DailySalesRecord[];
  bankRecords: BankRecord[];
  cashRecords: CashRecord[];
  airtelRecords: AirtelRecord[];
  debtors: Debtor[];
  debtorTransactions: DebtorTransaction[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  stockReconciliations: StockReconciliation[];
  cashMovements: BranchCashMovement[];
  stockTransfers?: StockTransfer[];
  ownerTreasury?: OwnerTreasury;
}

/**
 * Downloads a Master Spreadsheet Backup (.xlsx) where each section of the project
 * is saved in its own dedicated, neatly labeled worksheet tab.
 */
export const downloadMultiSheetExcelBackup = (
  data: SystemDataExportPayload,
  customFilename?: string
): void => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const wb = XLSX.utils.book_new();

  // Helper to add a sheet to the workbook with auto column widths
  const addWorksheet = (
    sheetName: string,
    headers: string[],
    rows: (string | number | boolean | null | undefined)[][]
  ) => {
    // Sanitize sheet name for Excel (max 31 chars, no invalid chars)
    const cleanName = sheetName.replace(/[:\\/?*[\]]/g, ' ').substring(0, 31).trim();

    // Map AoA cleanly
    const aoa = [
      headers,
      ...rows.map((row) =>
        row.map((cell) => (cell === null || cell === undefined ? '' : cell))
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Calculate auto column widths
    const colWidths = headers.map((headerText, colIdx) => {
      let maxLen = headerText ? String(headerText).length : 8;
      // Sample first 100 rows for speed
      const sampleRows = rows.slice(0, 100);
      sampleRows.forEach((r) => {
        const val = r[colIdx];
        if (val !== undefined && val !== null) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
    });

    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, cleanName);
  };

  // 1. EXECUTIVE OVERVIEW & SUMMARY SHEET
  const totalStockUnits = data.branchStocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalSalesRevenue = data.dailySales.reduce(
    (sum, s) => sum + (Number(s.totalSalesAmount) || 0),
    0
  );
  const totalDebtorsBal = data.debtors.reduce(
    (sum, d) => sum + (Number(d.outstandingBalance) || 0),
    0
  );

  const summaryHeaders = ['System Metric / Parameter', 'Value', 'Unit / Currency', 'Notes'];
  const summaryRows = [
    ['Enterprise Platform', 'Lubricants & LPG Multi-Branch Operations', 'Text', 'Master System Backup'],
    ['Export Timestamp', new Date().toISOString(), 'UTC ISO', 'Full Snapshot'],
    ['Total Branches Configured', data.branches.length, 'Sites', 'Active branch retail sites'],
    ['Total Catalog SKUs', data.products.length, 'Products', 'Lubricants and LPG items'],
    ['Total Inventory Units Held', totalStockUnits, 'Units', 'Across all physical branches'],
    ['Total Sales Shifts Logged', data.dailySales.length, 'Shifts', 'Historical shift records'],
    ['Total Recorded Revenue', totalSalesRevenue, 'ZMW', 'Gross sales turnover'],
    ['Treasury - Cash on Hand', data.ownerTreasury?.cashOnHand ?? 0, 'ZMW', 'Vault / safe cash'],
    ['Treasury - Airtel Money', data.ownerTreasury?.cashOnAirtelMoney ?? 0, 'ZMW', 'Airtel merchant balance'],
    ['Treasury - Bank Account', data.ownerTreasury?.cashInBank ?? 0, 'ZMW', 'Operating bank account'],
    ['Debtors Outstanding Balance', totalDebtorsBal, 'ZMW', 'Customer credit receivables'],
    ['Bank Transactions Count', data.bankRecords.length, 'Entries', 'Bank ledger records'],
    ['Cash Transactions Count', data.cashRecords.length, 'Entries', 'Cash on hand ledger'],
    ['Airtel Transactions Count', data.airtelRecords.length, 'Entries', 'Airtel Money ledger'],
    ['Suppliers Registered', data.suppliers.length, 'Vendors', 'Active supplier list'],
    ['Supplier Invoices Logged', data.supplierTransactions.length, 'Invoices', 'Purchases & orders'],
    ['Stock Audits Conducted', data.stockReconciliations.length, 'Audits', 'Physical stock audits'],
    ['Cash Remittance Movements', data.cashMovements.length, 'Handovers', 'Branch cash handovers'],
  ];
  addWorksheet('Summary Overview', summaryHeaders, summaryRows);

  // 2. BRANCHES DIRECTORY SHEET
  const branchesTable = getBranchesTableData(data.branches);
  addWorksheet('Branches Directory', branchesTable.headers, branchesTable.rows);

  // 3. PRODUCT CATALOG & PRICING SHEET
  const productsTable = getProductsTableData(data.products);
  addWorksheet('Product Catalog', productsTable.headers, productsTable.rows);

  // 4. BRANCH INVENTORY STOCKS SHEET
  const stocksTable = getBranchStocksTableData(data.branchStocks, data.branches, data.products);
  addWorksheet('Branch Inventory', stocksTable.headers, stocksTable.rows);

  // 5. DAILY SALES & SHIFT POS SHEET
  const salesTable = getDailySalesTableData(data.dailySales);
  addWorksheet('Daily Sales Shifts', salesTable.headers, salesTable.rows);

  // 6. BANK RECORDS LEDGER SHEET
  const bankTable = getBankRecordsTableData(data.bankRecords);
  addWorksheet('Bank Ledger', bankTable.headers, bankTable.rows);

  // 7. CASH ON HAND RECORDS SHEET
  const cashTable = getCashRecordsTableData(data.cashRecords);
  addWorksheet('Cash on Hand', cashTable.headers, cashTable.rows);

  // 8. AIRTEL MONEY RECORDS SHEET
  const airtelTable = getAirtelRecordsTableData(data.airtelRecords);
  addWorksheet('Airtel Money', airtelTable.headers, airtelTable.rows);

  // 9. DEBTORS DIRECTORY SHEET
  const debtorsTable = getDebtorsTableData(data.debtors);
  addWorksheet('Debtors Directory', debtorsTable.headers, debtorsTable.rows);

  // 10. DEBTOR TRANSACTIONS SHEET
  const debtorTxTable = getDebtorTransactionsTableData(data.debtorTransactions, data.debtors);
  addWorksheet('Debtor Transactions', debtorTxTable.headers, debtorTxTable.rows);

  // 11. SUPPLIERS DIRECTORY SHEET
  const suppliersTable = getSuppliersTableData(data.suppliers);
  addWorksheet('Suppliers Directory', suppliersTable.headers, suppliersTable.rows);

  // 12. SUPPLIER INVOICES & PURCHASES SHEET
  const supplierTxTable = getSupplierTransactionsTableData(
    data.supplierTransactions,
    data.suppliers
  );
  addWorksheet('Supplier Invoices', supplierTxTable.headers, supplierTxTable.rows);

  // 13. STOCK RECONCILIATIONS SHEET
  const stockReconsTable = getStockReconciliationsTableData(data.stockReconciliations);
  addWorksheet('Stock Audits', stockReconsTable.headers, stockReconsTable.rows);

  // 14. CASH MOVEMENTS & HANDOVERS SHEET
  const cashMovementsTable = getCashMovementsTableData(data.cashMovements);
  addWorksheet('Cash Handovers', cashMovementsTable.headers, cashMovementsTable.rows);

  // 15. INTER-BRANCH STOCK TRANSFERS SHEET
  const stockTransfersTable = getStockTransfersTableData(data.stockTransfers || []);
  addWorksheet('Stock Transfers', stockTransfersTable.headers, stockTransfersTable.rows);

  // Write and trigger download
  const filename =
    customFilename || `Enterprise_Master_MultiSheet_Backup_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// ==========================================
// CONSOLIDATED MASTER MULTI-TABLE CSV BACKUP
// ==========================================

/**
 * Generates a comprehensive consolidated Master CSV containing all system tables with clear separator banners.
 */
export const generateConsolidatedMasterCsv = (data: SystemDataExportPayload): string => {
  const dateStr = new Date().toISOString();
  const sections: string[] = [];

  // Header Banner
  sections.push(
    `# ==============================================================================`,
    `# LUBRICANTS & LPG ENTERPRISE MANAGEMENT SYSTEM - COMPLETE DATA BACKUP`,
    `# Export Date: ${dateStr}`,
    `# Total Branches: ${data.branches.length} | Total Products: ${data.products.length} | Total Sales Records: ${data.dailySales.length}`,
    `# ==============================================================================\r\n`
  );

  // Table 1: Branches
  sections.push(
    `# SECTION 1: BRANCHES & SITE LOCATIONS DIRECTORY`,
    generateBranchesCsv(data.branches),
    `\r\n`
  );

  // Table 2: Product Catalog
  sections.push(
    `# SECTION 2: PRODUCT CATALOG & PRICING MATRIX`,
    generateProductsCsv(data.products),
    `\r\n`
  );

  // Table 3: Branch Inventory Stocks
  sections.push(
    `# SECTION 3: CURRENT BRANCH INVENTORY & STOCK BALANCES`,
    generateBranchStocksCsv(data.branchStocks, data.branches, data.products),
    `\r\n`
  );

  // Table 4: Daily Sales
  sections.push(
    `# SECTION 4: DAILY SALES & SHIFT POS AUDIT LOGS`,
    generateDailySalesCsv(data.dailySales),
    `\r\n`
  );

  // Table 5: Bank Records Ledger
  sections.push(
    `# SECTION 5: BANK ACCOUNT LEDGER (DEPOSITS & WITHDRAWALS)`,
    generateBankRecordsCsv(data.bankRecords),
    `\r\n`
  );

  // Table 6: Cash on Hand Records
  sections.push(
    `# SECTION 6: CASH ON HAND (VAULT & CUSTODIAN) LEDGER`,
    generateCashRecordsCsv(data.cashRecords),
    `\r\n`
  );

  // Table 7: Airtel Money Records
  sections.push(
    `# SECTION 7: AIRTEL MONEY FLOAT & TRANSACTION LEDGER`,
    generateAirtelRecordsCsv(data.airtelRecords),
    `\r\n`
  );

  // Table 8: Debtors Directory
  sections.push(
    `# SECTION 8: DEBTORS & CUSTOMER CREDIT DIRECTORY`,
    generateDebtorsCsv(data.debtors),
    `\r\n`
  );

  // Table 9: Debtor Credit Transactions
  sections.push(
    `# SECTION 9: DEBTOR CREDIT SALES & PAYMENT RECEIPTS`,
    generateDebtorTransactionsCsv(data.debtorTransactions, data.debtors),
    `\r\n`
  );

  // Table 10: Suppliers Directory
  sections.push(
    `# SECTION 10: SUPPLIERS DIRECTORY & TERMS`,
    generateSuppliersCsv(data.suppliers),
    `\r\n`
  );

  // Table 11: Supplier Invoices & Purchases
  sections.push(
    `# SECTION 11: SUPPLIER INVOICES & PURCHASES LOG`,
    generateSupplierTransactionsCsv(data.supplierTransactions, data.suppliers),
    `\r\n`
  );

  // Table 12: Stock Reconciliations
  sections.push(
    `# SECTION 12: PHYSICAL STOCK AUDITS & RECONCILIATIONS`,
    generateStockReconciliationsCsv(data.stockReconciliations),
    `\r\n`
  );

  // Table 13: Cash Movements
  sections.push(
    `# SECTION 13: BRANCH CASH HANDOVERS & TREASURY REMITTANCES`,
    generateCashMovementsCsv(data.cashMovements),
    `\r\n`
  );

  // Table 14: Stock Transfers
  sections.push(
    `# SECTION 14: INTER-BRANCH STOCK TRANSFERS & SITE LOGISTICS`,
    generateStockTransfersCsv(data.stockTransfers || []),
    `\r\n`
  );

  return sections.join('\r\n');
};

/**
 * Downloads all individual CSV tables in a single batch sequence.
 */
export const downloadAllIndividualCsvFiles = (data: SystemDataExportPayload): void => {
  const dateStr = new Date().toISOString().slice(0, 10);

  const files = [
    { name: `01_daily_sales_records_${dateStr}.csv`, content: generateDailySalesCsv(data.dailySales) },
    { name: `02_product_catalog_${dateStr}.csv`, content: generateProductsCsv(data.products) },
    {
      name: `03_branch_inventory_stocks_${dateStr}.csv`,
      content: generateBranchStocksCsv(data.branchStocks, data.branches, data.products),
    },
    { name: `04_bank_records_ledger_${dateStr}.csv`, content: generateBankRecordsCsv(data.bankRecords) },
    { name: `05_cash_on_hand_records_${dateStr}.csv`, content: generateCashRecordsCsv(data.cashRecords) },
    { name: `06_airtel_money_records_${dateStr}.csv`, content: generateAirtelRecordsCsv(data.airtelRecords) },
    { name: `07_debtors_directory_${dateStr}.csv`, content: generateDebtorsCsv(data.debtors) },
    {
      name: `08_debtor_transactions_${dateStr}.csv`,
      content: generateDebtorTransactionsCsv(data.debtorTransactions, data.debtors),
    },
    { name: `09_suppliers_directory_${dateStr}.csv`, content: generateSuppliersCsv(data.suppliers) },
    {
      name: `10_supplier_invoices_purchases_${dateStr}.csv`,
      content: generateSupplierTransactionsCsv(data.supplierTransactions, data.suppliers),
    },
    {
      name: `11_stock_reconciliations_${dateStr}.csv`,
      content: generateStockReconciliationsCsv(data.stockReconciliations),
    },
    { name: `12_branch_cash_movements_${dateStr}.csv`, content: generateCashMovementsCsv(data.cashMovements) },
    { name: `13_stock_transfers_${dateStr}.csv`, content: generateStockTransfersCsv(data.stockTransfers || []) },
    { name: `14_branches_directory_${dateStr}.csv`, content: generateBranchesCsv(data.branches) },
  ];

  files.forEach((f, idx) => {
    setTimeout(() => {
      downloadCsvFile(f.name, f.content);
    }, idx * 150); // slight stagger for browser download handlers
  });
};

/**
 * Downloads a complete raw JSON snapshot of the system state.
 */
export const downloadJsonBackup = (data: SystemDataExportPayload): void => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const jsonStr = JSON.stringify(
    {
      _metadata: {
        exportTimestamp: new Date().toISOString(),
        version: '1.0.0',
        system: 'Lubricants & LPG Enterprise Management Platform',
      },
      ...data,
    },
    null,
    2
  );

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `enterprise_system_backup_${dateStr}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
