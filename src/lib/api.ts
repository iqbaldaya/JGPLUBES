// src/lib/api.ts
export const api = {
  async getExpenses() {
    const res = await fetch('/api/expenses');
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },
  async createExpense(data: any) {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },
  async bootstrap() {
    try {
      const res = await fetch('/api/bootstrap?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { connected: false, isConfigured: true, error: errData.error || 'Database unavailable' };
      }
      return await res.json();
    } catch (err: any) {
      return { connected: false, isConfigured: false, error: err?.message || 'Network request failed' };
    }
  },

  async checkDbStatus() {
    try {
      const res = await fetch('/api/db-status');
      return await res.json();
    } catch (err: any) {
      return { connected: false, isConfigured: false, error: err?.message || 'Status check failed' };
    }
  },

  // Branches
  async createBranch(data: any) {
    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateBranch(id: string, updates: any) {
    const res = await fetch(`/api/branches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteBranch(id: string) {
    const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Products
  async createProduct(data: any) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateProduct(id: string, updates: any) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteProduct(id: string) {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Stocks
  async upsertStock(branchId: string, productId: string, quantity: number) {
    const res = await fetch('/api/stocks/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId, productId, quantity }),
    });
    return res.json();
  },

  // Daily Sales
  async createDailySale(data: any) {
    const res = await fetch('/api/daily-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateDailySale(id: string, updates: any) {
    const res = await fetch(`/api/daily-sales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteDailySale(id: string) {
    const res = await fetch(`/api/daily-sales/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Debtors
  async createDebtor(data: any) {
    const res = await fetch('/api/debtors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateDebtor(id: string, updates: any) {
    const res = await fetch(`/api/debtors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteDebtor(id: string) {
    const res = await fetch(`/api/debtors/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async createDebtorTransaction(data: any) {
    const res = await fetch('/api/debtor-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateDebtorTransaction(id: string, updates: any) {
    const res = await fetch(`/api/debtor-transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteDebtorTransaction(id: string) {
    const res = await fetch(`/api/debtor-transactions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Suppliers
  async createSupplier(data: any) {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateSupplier(id: string, updates: any) {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteSupplier(id: string) {
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async createSupplierTransaction(data: any) {
    const res = await fetch('/api/supplier-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateSupplierTransaction(id: string, updates: any) {
    const res = await fetch(`/api/supplier-transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteSupplierTransaction(id: string) {
    const res = await fetch(`/api/supplier-transactions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Stock Reconciliations
  async createStockReconciliation(data: any) {
    const res = await fetch('/api/stock-reconciliations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateStockReconciliation(id: string, updates: any) {
    const res = await fetch(`/api/stock-reconciliations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteStockReconciliation(id: string) {
    const res = await fetch(`/api/stock-reconciliations/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async clearStockReconciliations(branchId?: string) {
    const url = branchId ? `/api/stock-reconciliations?branchId=${encodeURIComponent(branchId)}` : '/api/stock-reconciliations';
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  },

  // Cash Movements
  async createCashMovement(data: any) {
    const res = await fetch('/api/cash-movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateCashMovement(id: string, updates: any) {
    const res = await fetch(`/api/cash-movements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteCashMovement(id: string) {
    const res = await fetch(`/api/cash-movements/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Treasury & Ledgers
  async updateTreasury(updates: any) {
    const res = await fetch('/api/treasury', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async createBankRecord(data: any) {
    const res = await fetch('/api/bank-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateBankRecord(id: string, updates: any) {
    const res = await fetch(`/api/bank-records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteBankRecord(id: string) {
    const res = await fetch(`/api/bank-records/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async createCashRecord(data: any) {
    const res = await fetch('/api/cash-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateCashRecord(id: string, updates: any) {
    const res = await fetch(`/api/cash-records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteCashRecord(id: string) {
    const res = await fetch(`/api/cash-records/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async createAirtelRecord(data: any) {
    const res = await fetch('/api/airtel-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateAirtelRecord(id: string, updates: any) {
    const res = await fetch(`/api/airtel-records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteAirtelRecord(id: string) {
    const res = await fetch(`/api/airtel-records/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async updateAirtelMoneyRecord(id: string, updates: any) {
    const res = await fetch(`/api/airtel-money-records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteAirtelMoneyRecord(id: string) {
    const res = await fetch(`/api/airtel-money-records/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async createAirtelMoneyRecord(data: any) {
    const res = await fetch('/api/airtel-money-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async createAirtelMoney(data: any) {
    return this.createAirtelMoneyRecord(data);
  },

  // Stock Transfers
  async createStockTransfer(data: any) {
    const res = await fetch('/api/stock-transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateStockTransfer(id: string, updates: any) {
    const res = await fetch(`/api/stock-transfers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  async deleteStockTransfer(id: string) {
    const res = await fetch(`/api/stock-transfers/${id}`, { method: 'DELETE' });
    return res.json();
  },
};
