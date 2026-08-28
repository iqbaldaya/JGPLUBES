import * as XLSX from 'xlsx';
import { Product, ProductCategory, Branch, BranchStock, Debtor, Supplier } from '../types';
import { downloadCsvFile } from './csvExport';

// =========================================================================
// TYPES FOR IMPORT PARSING AND PREVIEW
// =========================================================================

export interface ImportValidationIssue {
  rowNumber: number;
  column: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ParsedProductRow {
  rowNumber: number;
  code: string;
  name: string;
  category: ProductCategory;
  subCategory: string;
  unit: string;
  volumeLitersOrKg: number;
  costPrice: number;
  sellingPrice: number;
  reorderThreshold: number;
  description?: string;
  isExisting: boolean;
  isValid: boolean;
  issues: ImportValidationIssue[];
}

export interface ParsedStockCountRow {
  rowNumber: number;
  branchId: string;
  branchCode: string;
  branchName: string;
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  newQuantity: number;
  isValid: boolean;
  issues: ImportValidationIssue[];
}

export interface ParsedDebtorRow {
  rowNumber: number;
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  notes?: string;
  isExisting: boolean;
  isValid: boolean;
  issues: ImportValidationIssue[];
}

export interface ParsedSupplierRow {
  rowNumber: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  category: 'LUBRICANTS' | 'LPG' | 'BOTH' | 'EQUIPMENT';
  paymentTermsDays: number;
  taxNumber?: string;
  isExisting: boolean;
  isValid: boolean;
  issues: ImportValidationIssue[];
}

// =========================================================================
// SPREADSHEET READ & PARSE HELPER
// =========================================================================

export const parseUploadedSpreadsheet = async (file: File): Promise<{ headers: string[]; rows: (string | number)[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to Array of Arrays
        const rawAoA: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
          defval: '',
        });

        if (rawAoA.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        // Find header row (skip leading comment or empty lines)
        let headerRowIndex = 0;
        for (let i = 0; i < rawAoA.length; i++) {
          const firstCell = String(rawAoA[i][0] || '').trim();
          if (firstCell && !firstCell.startsWith('#')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (rawAoA[headerRowIndex] || []).map((h) => String(h || '').trim());
        const dataRows = rawAoA.slice(headerRowIndex + 1).filter((row) => {
          // Keep rows that have at least one non-empty string or positive number
          return row.some((cell) => cell !== '' && cell !== null && cell !== undefined);
        });

        resolve({ headers, rows: dataRows });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${(err as Error).message || 'Invalid spreadsheet format'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsArrayBuffer(file);
  });
};

// =========================================================================
// 1. PRODUCT CATALOG IMPORT VALIDATOR
// =========================================================================

export const validateAndParseProductsImport = (
  headers: string[],
  rows: (string | number)[][],
  existingProducts: Product[]
): {
  parsedRows: ParsedProductRow[];
  totalValid: number;
  totalErrors: number;
  newCount: number;
  updateCount: number;
} => {
  // Normalize header mapping
  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some((k) => lower.includes(k));
    });
  };

  const codeIdx = findColIndex(['productcode', 'code', 'sku']);
  const nameIdx = findColIndex(['productname', 'name', 'description', 'title']);
  const categoryIdx = findColIndex(['category', 'type', 'group']);
  const subCategoryIdx = findColIndex(['subcategory', 'subcat', 'application']);
  const unitIdx = findColIndex(['unit', 'packaging', 'packsize']);
  const volumeIdx = findColIndex(['volume', 'liters', 'kg', 'capacity']);
  const costIdx = findColIndex(['costprice', 'cost', 'wac', 'purchaseprice']);
  const sellIdx = findColIndex(['sellingprice', 'selling', 'retailprice', 'price']);
  const thresholdIdx = findColIndex(['threshold', 'reorder', 'minstock', 'alert']);
  const descIdx = findColIndex(['details', 'note', 'specs']);

  const existingMap = new Map(existingProducts.map((p) => [p.code.toUpperCase().trim(), p]));

  const parsedRows: ParsedProductRow[] = [];
  let newCount = 0;
  let updateCount = 0;

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 for 1-based index, +1 for header
    const issues: ImportValidationIssue[] = [];

    const rawCode = String(row[codeIdx !== -1 ? codeIdx : 0] || '').trim();
    const rawName = String(row[nameIdx !== -1 ? nameIdx : 1] || '').trim();
    const rawCategory = String(row[categoryIdx !== -1 ? categoryIdx : 2] || '').trim().toUpperCase();
    const rawSubCategory = String(row[subCategoryIdx !== -1 ? subCategoryIdx : 3] || '').trim();
    const rawUnit = String(row[unitIdx !== -1 ? unitIdx : 4] || '').trim();
    const rawVolume = Number(row[volumeIdx !== -1 ? volumeIdx : 5]);
    const rawCost = Number(row[costIdx !== -1 ? costIdx : 6]);
    const rawSell = Number(row[sellIdx !== -1 ? sellIdx : 7]);
    const rawThreshold = Number(row[thresholdIdx !== -1 ? thresholdIdx : 8]);
    const rawDesc = String(row[descIdx !== -1 ? descIdx : 9] || '').trim();

    // Validation
    if (!rawCode) {
      issues.push({ rowNumber, column: 'Product Code', message: 'Product code / SKU is required', severity: 'ERROR' });
    }

    if (!rawName) {
      issues.push({ rowNumber, column: 'Product Name', message: 'Product name is required', severity: 'ERROR' });
    }

    let category: ProductCategory = 'LUBRICANTS';
    if (rawCategory.includes('LPG') || rawCategory.includes('GAS') || rawCategory.includes('CYLINDER')) {
      category = 'LPG';
    } else if (rawCategory.includes('LUB') || rawCategory.includes('OIL') || rawCategory.includes('GREASE')) {
      category = 'LUBRICANTS';
    } else if (rawCategory) {
      category = rawCategory === 'LPG' ? 'LPG' : 'LUBRICANTS';
    }

    const costPrice = isNaN(rawCost) || rawCost < 0 ? 0 : rawCost;
    const sellingPrice = isNaN(rawSell) || rawSell < 0 ? 0 : rawSell;
    const volumeLitersOrKg = isNaN(rawVolume) || rawVolume <= 0 ? 1 : rawVolume;
    const reorderThreshold = isNaN(rawThreshold) || rawThreshold < 0 ? 5 : rawThreshold;

    if (isNaN(rawSell) || rawSell <= 0) {
      issues.push({ rowNumber, column: 'Selling Price', message: 'Selling price must be a positive number', severity: 'ERROR' });
    }

    if (costPrice > sellingPrice && sellingPrice > 0) {
      issues.push({
        rowNumber,
        column: 'Cost Price',
        message: `Cost price (K${costPrice}) exceeds Selling price (K${sellingPrice})`,
        severity: 'WARNING',
      });
    }

    const isExisting = existingMap.has(rawCode.toUpperCase());
    const isValid = issues.filter((i) => i.severity === 'ERROR').length === 0;

    if (isValid) {
      if (isExisting) {
        updateCount++;
      } else {
        newCount++;
      }
    }

    parsedRows.push({
      rowNumber,
      code: rawCode,
      name: rawName || 'Unnamed Product',
      category,
      subCategory: rawSubCategory || (category === 'LPG' ? 'LPG Refill' : 'Engine Oil'),
      unit: rawUnit || (category === 'LPG' ? 'Cylinder' : '1L Bottle'),
      volumeLitersOrKg,
      costPrice,
      sellingPrice,
      reorderThreshold,
      description: rawDesc || undefined,
      isExisting,
      isValid,
      issues,
    });
  });

  const totalValid = parsedRows.filter((r) => r.isValid).length;
  const totalErrors = parsedRows.filter((r) => !r.isValid).length;

  return { parsedRows, totalValid, totalErrors, newCount, updateCount };
};

// =========================================================================
// 2. BRANCH STOCK COUNTS IMPORT VALIDATOR
// =========================================================================

export const validateAndParseStockCountsImport = (
  headers: string[],
  rows: (string | number)[][],
  branches: Branch[],
  products: Product[],
  currentBranchStocks: BranchStock[]
): {
  parsedRows: ParsedStockCountRow[];
  totalValid: number;
  totalErrors: number;
} => {
  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some((k) => lower.includes(k));
    });
  };

  const branchIdx = findColIndex(['branch', 'branchcode', 'branchname', 'site', 'location']);
  const productIdx = findColIndex(['productcode', 'product', 'sku', 'code', 'item']);
  const qtyIdx = findColIndex(['quantity', 'stock', 'qty', 'count', 'units', 'physicalqty']);

  // Lookup maps
  const branchMapByCode = new Map(branches.map((b) => [b.code.toUpperCase().trim(), b]));
  const branchMapByName = new Map(branches.map((b) => [b.name.toLowerCase().trim(), b]));
  const branchMapById = new Map(branches.map((b) => [b.id, b]));

  const productMapByCode = new Map(products.map((p) => [p.code.toUpperCase().trim(), p]));
  const productMapByName = new Map(products.map((p) => [p.name.toLowerCase().trim(), p]));
  const productMapById = new Map(products.map((p) => [p.id, p]));

  const stockMap = new Map<string, number>();
  currentBranchStocks.forEach((s) => {
    stockMap.set(`${s.branchId}_${s.productId}`, s.quantity);
  });

  const parsedRows: ParsedStockCountRow[] = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const issues: ImportValidationIssue[] = [];

    const rawBranch = String(row[branchIdx !== -1 ? branchIdx : 0] || '').trim();
    const rawProduct = String(row[productIdx !== -1 ? productIdx : 1] || '').trim();
    const rawQty = Number(row[qtyIdx !== -1 ? qtyIdx : 2]);

    // Find Branch
    let matchedBranch =
      branchMapByCode.get(rawBranch.toUpperCase()) ||
      branchMapByName.get(rawBranch.toLowerCase()) ||
      branchMapById.get(rawBranch);

    if (!matchedBranch) {
      // Partial name match
      matchedBranch = branches.find(
        (b) =>
          b.name.toLowerCase().includes(rawBranch.toLowerCase()) ||
          rawBranch.toLowerCase().includes(b.code.toLowerCase())
      );
    }

    if (!matchedBranch) {
      issues.push({
        rowNumber,
        column: 'Branch',
        message: `Branch "${rawBranch}" could not be found. Use valid Branch Code (e.g. ${branches[0]?.code || 'LUS-01'})`,
        severity: 'ERROR',
      });
    }

    // Find Product
    let matchedProduct =
      productMapByCode.get(rawProduct.toUpperCase()) ||
      productMapByName.get(rawProduct.toLowerCase()) ||
      productMapById.get(rawProduct);

    if (!matchedProduct) {
      matchedProduct = products.find(
        (p) =>
          p.name.toLowerCase().includes(rawProduct.toLowerCase()) ||
          rawProduct.toLowerCase().includes(p.code.toLowerCase())
      );
    }

    if (!matchedProduct) {
      issues.push({
        rowNumber,
        column: 'Product',
        message: `Product "${rawProduct}" could not be found. Use valid Product SKU Code (e.g. ${products[0]?.code || 'LUB-15W40-5L'})`,
        severity: 'ERROR',
      });
    }

    if (isNaN(rawQty) || rawQty < 0) {
      issues.push({
        rowNumber,
        column: 'Quantity',
        message: `Quantity must be 0 or a positive number`,
        severity: 'ERROR',
      });
    }

    const currentQty =
      matchedBranch && matchedProduct ? stockMap.get(`${matchedBranch.id}_${matchedProduct.id}`) ?? 0 : 0;

    const isValid = issues.filter((i) => i.severity === 'ERROR').length === 0;

    parsedRows.push({
      rowNumber,
      branchId: matchedBranch ? matchedBranch.id : '',
      branchCode: matchedBranch ? matchedBranch.code : rawBranch,
      branchName: matchedBranch ? matchedBranch.name : 'Unknown Branch',
      productId: matchedProduct ? matchedProduct.id : '',
      productCode: matchedProduct ? matchedProduct.code : rawProduct,
      productName: matchedProduct ? matchedProduct.name : 'Unknown Product',
      currentStock: currentQty,
      newQuantity: isNaN(rawQty) || rawQty < 0 ? 0 : rawQty,
      isValid,
      issues,
    });
  });

  const totalValid = parsedRows.filter((r) => r.isValid).length;
  const totalErrors = parsedRows.filter((r) => !r.isValid).length;

  return { parsedRows, totalValid, totalErrors };
};

// =========================================================================
// 3. DEBTORS IMPORT VALIDATOR
// =========================================================================

export const validateAndParseDebtorsImport = (
  headers: string[],
  rows: (string | number)[][],
  existingDebtors: Debtor[]
): {
  parsedRows: ParsedDebtorRow[];
  totalValid: number;
  totalErrors: number;
  newCount: number;
  updateCount: number;
} => {
  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some((k) => lower.includes(k));
    });
  };

  const codeIdx = findColIndex(['customercode', 'debtorcode', 'code', 'accno', 'id']);
  const nameIdx = findColIndex(['customername', 'debtorname', 'company', 'name', 'client']);
  const contactIdx = findColIndex(['contactperson', 'contact', 'manager', 'person']);
  const phoneIdx = findColIndex(['phone', 'mobile', 'cell', 'tel']);
  const emailIdx = findColIndex(['email', 'mail']);
  const addrIdx = findColIndex(['address', 'location', 'city']);
  const limitIdx = findColIndex(['creditlimit', 'limit', 'credit']);
  const notesIdx = findColIndex(['notes', 'remark', 'terms']);

  const existingMap = new Map(existingDebtors.map((d) => [d.name.toLowerCase().trim(), d]));
  const existingCodeMap = new Map(existingDebtors.map((d) => [d.code.toUpperCase().trim(), d]));

  const parsedRows: ParsedDebtorRow[] = [];
  let newCount = 0;
  let updateCount = 0;

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const issues: ImportValidationIssue[] = [];

    const rawCode = String(row[codeIdx !== -1 ? codeIdx : 0] || '').trim();
    const rawName = String(row[nameIdx !== -1 ? nameIdx : 1] || '').trim();
    const rawContact = String(row[contactIdx !== -1 ? contactIdx : 2] || '').trim();
    const rawPhone = String(row[phoneIdx !== -1 ? phoneIdx : 3] || '').trim();
    const rawEmail = String(row[emailIdx !== -1 ? emailIdx : 4] || '').trim();
    const rawAddr = String(row[addrIdx !== -1 ? addrIdx : 5] || '').trim();
    const rawLimit = Number(row[limitIdx !== -1 ? limitIdx : 6]);
    const rawNotes = String(row[notesIdx !== -1 ? notesIdx : 7] || '').trim();

    if (!rawName) {
      issues.push({ rowNumber, column: 'Customer Name', message: 'Customer/Company name is required', severity: 'ERROR' });
    }

    if (!rawPhone) {
      issues.push({ rowNumber, column: 'Phone', message: 'Phone number is recommended for SMS receipts', severity: 'WARNING' });
    }

    const creditLimit = isNaN(rawLimit) || rawLimit < 0 ? 10000 : rawLimit;
    const isExisting = existingMap.has(rawName.toLowerCase()) || (rawCode && existingCodeMap.has(rawCode.toUpperCase()));
    const isValid = issues.filter((i) => i.severity === 'ERROR').length === 0;

    if (isValid) {
      if (isExisting) updateCount++;
      else newCount++;
    }

    parsedRows.push({
      rowNumber,
      code: rawCode || `DEB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: rawName,
      contactPerson: rawContact || undefined,
      phone: rawPhone || '+260 97 0000000',
      email: rawEmail || undefined,
      address: rawAddr || undefined,
      creditLimit,
      notes: rawNotes || undefined,
      isExisting: !!isExisting,
      isValid,
      issues,
    });
  });

  const totalValid = parsedRows.filter((r) => r.isValid).length;
  const totalErrors = parsedRows.filter((r) => !r.isValid).length;

  return { parsedRows, totalValid, totalErrors, newCount, updateCount };
};

// =========================================================================
// 4. SUPPLIERS IMPORT VALIDATOR
// =========================================================================

export const validateAndParseSuppliersImport = (
  headers: string[],
  rows: (string | number)[][],
  existingSuppliers: Supplier[]
): {
  parsedRows: ParsedSupplierRow[];
  totalValid: number;
  totalErrors: number;
  newCount: number;
  updateCount: number;
} => {
  const findColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return keywords.some((k) => lower.includes(k));
    });
  };

  const codeIdx = findColIndex(['suppliercode', 'code', 'vendorcode', 'id']);
  const nameIdx = findColIndex(['suppliername', 'name', 'company', 'vendor']);
  const contactIdx = findColIndex(['contactperson', 'contact', 'manager', 'rep']);
  const phoneIdx = findColIndex(['phone', 'mobile', 'tel']);
  const emailIdx = findColIndex(['email', 'mail']);
  const addrIdx = findColIndex(['address', 'location', 'city']);
  const catIdx = findColIndex(['category', 'supplycategory', 'type']);
  const termsIdx = findColIndex(['paymentterms', 'terms', 'days', 'creditterms']);
  const taxIdx = findColIndex(['tpin', 'taxnumber', 'vat', 'tax']);

  const existingMap = new Map(existingSuppliers.map((s) => [s.name.toLowerCase().trim(), s]));
  const existingCodeMap = new Map(existingSuppliers.map((s) => [s.code.toUpperCase().trim(), s]));

  const parsedRows: ParsedSupplierRow[] = [];
  let newCount = 0;
  let updateCount = 0;

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const issues: ImportValidationIssue[] = [];

    const rawCode = String(row[codeIdx !== -1 ? codeIdx : 0] || '').trim();
    const rawName = String(row[nameIdx !== -1 ? nameIdx : 1] || '').trim();
    const rawContact = String(row[contactIdx !== -1 ? contactIdx : 2] || '').trim();
    const rawPhone = String(row[phoneIdx !== -1 ? phoneIdx : 3] || '').trim();
    const rawEmail = String(row[emailIdx !== -1 ? emailIdx : 4] || '').trim();
    const rawAddr = String(row[addrIdx !== -1 ? addrIdx : 5] || '').trim();
    const rawCat = String(row[catIdx !== -1 ? catIdx : 6] || '').trim().toUpperCase();
    const rawTerms = Number(row[termsIdx !== -1 ? termsIdx : 7]);
    const rawTax = String(row[taxIdx !== -1 ? taxIdx : 8] || '').trim();

    if (!rawName) {
      issues.push({ rowNumber, column: 'Supplier Name', message: 'Supplier/Vendor name is required', severity: 'ERROR' });
    }

    let category: 'LUBRICANTS' | 'LPG' | 'BOTH' | 'EQUIPMENT' = 'LUBRICANTS';
    if (rawCat.includes('BOTH') || (rawCat.includes('LUB') && rawCat.includes('LPG'))) {
      category = 'BOTH';
    } else if (rawCat.includes('LPG') || rawCat.includes('GAS')) {
      category = 'LPG';
    } else if (rawCat.includes('EQUIP') || rawCat.includes('HARDWARE')) {
      category = 'EQUIPMENT';
    }

    const paymentTermsDays = isNaN(rawTerms) || rawTerms < 0 ? 30 : rawTerms;
    const isExisting = existingMap.has(rawName.toLowerCase()) || (rawCode && existingCodeMap.has(rawCode.toUpperCase()));
    const isValid = issues.filter((i) => i.severity === 'ERROR').length === 0;

    if (isValid) {
      if (isExisting) updateCount++;
      else newCount++;
    }

    parsedRows.push({
      rowNumber,
      code: rawCode || `SUP-${Math.floor(100 + Math.random() * 900)}`,
      name: rawName,
      contactPerson: rawContact || 'Sales Representative',
      phone: rawPhone || '+260 97 0000000',
      email: rawEmail || undefined,
      address: rawAddr || undefined,
      category,
      paymentTermsDays,
      taxNumber: rawTax || undefined,
      isExisting: !!isExisting,
      isValid,
      issues,
    });
  });

  const totalValid = parsedRows.filter((r) => r.isValid).length;
  const totalErrors = parsedRows.filter((r) => !r.isValid).length;

  return { parsedRows, totalValid, totalErrors, newCount, updateCount };
};

// =========================================================================
// SAMPLE TEMPLATE DOWNLOADERS (.XLSX & .CSV)
// =========================================================================

export const downloadProductsTemplate = (format: 'xlsx' | 'csv' = 'xlsx'): void => {
  const headers = [
    'Product Code (SKU)',
    'Product Name',
    'Category (LUBRICANTS/LPG)',
    'Sub Category',
    'Packaging Unit',
    'Volume in Liters or Kg',
    'Cost Price (ZMW)',
    'Selling Price (ZMW)',
    'Reorder Threshold',
    'Description',
  ];

  const sampleRows = [
    ['LUB-15W40-5L', 'Heavy Duty Diesel Engine Oil 15W-40', 'LUBRICANTS', 'Diesel Engine Oil', '5L Can', 5, 320, 420, 10, 'CI-4/SL specification for heavy trucks & tractors'],
    ['LUB-5W30-4L', 'Premium Fully Synthetic Motor Oil 5W-30', 'LUBRICANTS', 'Synthetic Passenger Oil', '4L Can', 4, 450, 600, 8, 'API SP / ILSAC GF-6 for modern petrol engines'],
    ['LUB-20W50-1L', 'Multigrade High Mileage Engine Oil 20W-50', 'LUBRICANTS', 'Multigrade Engine Oil', '1L Bottle', 1, 75, 110, 20, 'For older commercial vehicles and taxis'],
    ['LUB-HYD68-20L', 'Heavy Duty Hydraulic Oil ISO VG 68', 'LUBRICANTS', 'Hydraulic Oil', '20L Pail', 20, 1100, 1500, 5, 'Anti-wear hydraulic fluid for earthmovers & pumps'],
    ['LPG-REF-6KG', 'LPG Cooking Gas Refill 6kg', 'LPG', 'LPG Refill', '6kg Refill', 6, 110, 150, 15, 'Clean propane/butane mix domestic cylinder refill'],
    ['LPG-REF-13KG', 'LPG Cooking Gas Refill 13kg', 'LPG', 'LPG Refill', '13kg Refill', 13, 240, 310, 12, 'Standard domestic gas cylinder refill'],
    ['LPG-KIT-6KG', 'LPG Complete Starter Kit 6kg', 'LPG', 'LPG Full Kit', '6kg Full Kit', 6, 450, 620, 5, 'Brand new steel cylinder + burner + full gas charge'],
  ];

  if (format === 'csv') {
    const csvStr = [
      '# Enterprise Lubricants & LPG Catalog Import Template',
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\r\n');
    downloadCsvFile('Product_Catalog_Import_Template.csv', csvStr);
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Product Catalog Template');
    XLSX.writeFile(wb, 'Product_Catalog_Import_Template.xlsx');
  }
};

export const downloadStockCountsTemplate = (
  branches: Branch[],
  products: Product[],
  format: 'xlsx' | 'csv' = 'xlsx'
): void => {
  const headers = [
    'Branch Code',
    'Branch Name',
    'Product SKU Code',
    'Product Name',
    'Stock Quantity (Units On Hand)',
  ];

  const sampleRows: (string | number)[][] = [];

  // Generate matrix of branches & products so user just needs to fill numbers!
  branches.forEach((b) => {
    products.slice(0, 4).forEach((p) => {
      sampleRows.push([b.code, b.name, p.code, p.name, 25]);
    });
  });

  if (format === 'csv') {
    const csvStr = [
      '# Enterprise Branch Inventory Stock Counts Template',
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\r\n');
    downloadCsvFile('Branch_Stock_Counts_Template.csv', csvStr);
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 38 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Counts Template');
    XLSX.writeFile(wb, 'Branch_Stock_Counts_Template.xlsx');
  }
};

export const downloadDebtorsTemplate = (format: 'xlsx' | 'csv' = 'xlsx'): void => {
  const headers = [
    'Customer Code',
    'Customer / Company Name',
    'Contact Person',
    'Phone Number',
    'Email Address',
    'Physical Address / Location',
    'Credit Limit (ZMW)',
    'Payment Terms / Notes',
  ];

  const sampleRows = [
    ['DEB-001', 'Copperbelt Mining Fleet Haulage Ltd', 'Bwalya Kangwa', '+260 97 7112233', 'transport@cbmining.co.zm', 'Plot 409, Industrial Area, Kitwe', 50000, '30 days net terms; monthly statement billing'],
    ['DEB-002', 'Lusaka Agro-Farming Cooperative', 'Chileshe Mulenga', '+260 96 6445566', 'accounts@lusaka-agro.org', 'Great North Road, Chisamba', 30000, 'Seasonal tractor oil & bulk LPG supplies'],
    ['DEB-003', 'Ndola City Logistics & Freight Services', 'Musonda Banda', '+260 97 8889900', 'logistics@ndolafreight.com', 'President Avenue, Ndola', 25000, 'Fleet engine oil and differential lubricants'],
  ];

  if (format === 'csv') {
    const csvStr = [
      '# Enterprise Debtors & Credit Customers Import Template',
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\r\n');
    downloadCsvFile('Debtors_Customers_Import_Template.csv', csvStr);
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map(() => ({ wch: 25 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Debtors Template');
    XLSX.writeFile(wb, 'Debtors_Customers_Import_Template.xlsx');
  }
};

export const downloadSuppliersTemplate = (format: 'xlsx' | 'csv' = 'xlsx'): void => {
  const headers = [
    'Supplier Code',
    'Supplier / Vendor Name',
    'Contact Person',
    'Phone Number',
    'Email Address',
    'Physical Address',
    'Supply Category (LUBRICANTS/LPG/BOTH)',
    'Payment Terms (Days)',
    'TPIN / Tax Number',
  ];

  const sampleRows = [
    ['SUP-001', 'TotalEnergies Marketing Zambia Ltd', 'Kabwe Mwape', '+260 211 254100', 'orders@totalenergies.co.zm', 'P.O. Box 31724, Lumumba Road, Lusaka', 'LUBRICANTS', 30, '1001928374'],
    ['SUP-002', 'Oryx Energies Gas & Lubricants', 'Namakau Sitwala', '+260 211 289400', 'zambia.sales@oryxenergies.com', 'Plot 104, Heavy Industrial Area, Ndola', 'BOTH', 30, '1004829102'],
    ['SUP-003', 'Afrox Industrial & LPG Bulk Supplies', 'Kelvin Sakala', '+260 211 247000', 'lpg.orders@afrox.linde.com', 'Mungwi Road, Industrial Area, Lusaka', 'LPG', 14, '1002938475'],
  ];

  if (format === 'csv') {
    const csvStr = [
      '# Enterprise Suppliers Import Template',
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\r\n');
    downloadCsvFile('Suppliers_Import_Template.csv', csvStr);
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers Template');
    XLSX.writeFile(wb, 'Suppliers_Import_Template.xlsx');
  }
};
