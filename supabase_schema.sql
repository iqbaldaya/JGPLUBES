-- Grant schema permissions
GRANT ALL ON SCHEMA public TO postgres, authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, authenticated, anon, service_role;

-- 1. Users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'BRANCH_MANAGER',
  branch_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Branches
CREATE TABLE IF NOT EXISTS public.branches (
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
  created_at TEXT NOT NULL
);

-- 3. Products
CREATE TABLE IF NOT EXISTS public.products (
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
);

-- 4. Branch Stocks
CREATE TABLE IF NOT EXISTS public.branch_stocks (
  id SERIAL PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL,
  CONSTRAINT branch_product_unique_idx UNIQUE (branch_id, product_id)
);

-- 5. Daily Sales
CREATE TABLE IF NOT EXISTS public.daily_sales (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
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
);

-- 6. Debtors
CREATE TABLE IF NOT EXISTS public.debtors (
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
);

-- 7. Debtor Transactions
CREATE TABLE IF NOT EXISTS public.debtor_transactions (
  id TEXT PRIMARY KEY,
  debtor_id TEXT NOT NULL REFERENCES public.debtors(id) ON DELETE CASCADE,
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
);

-- 8. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
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
);

-- 9. Supplier Transactions
CREATE TABLE IF NOT EXISTS public.supplier_transactions (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
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
);

-- 10. Stock Reconciliations
CREATE TABLE IF NOT EXISTS public.stock_reconciliations (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
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
);

-- 11. Cash Movements
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
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
);

-- 12. Owner Treasury
CREATE TABLE IF NOT EXISTS public.owner_treasury (
  id SERIAL PRIMARY KEY,
  cash_on_hand DOUBLE PRECISION NOT NULL DEFAULT 0,
  cash_on_airtel_money DOUBLE PRECISION NOT NULL DEFAULT 0,
  cash_in_bank DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL
);

-- 13. Bank Records
CREATE TABLE IF NOT EXISTS public.bank_records (
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
);

-- 14. Cash Records
CREATE TABLE IF NOT EXISTS public.cash_records (
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
);

-- 15. Airtel Records
CREATE TABLE IF NOT EXISTS public.airtel_records (
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
);

-- 16. Airtel Money Records
CREATE TABLE IF NOT EXISTS public.airtel_money_records (
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
);

-- 17. Stock Transfers
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id TEXT PRIMARY KEY,
  transfer_number TEXT NOT NULL UNIQUE,
  source_branch_id TEXT NOT NULL REFERENCES public.branches(id),
  source_branch_name TEXT NOT NULL,
  source_branch_code TEXT NOT NULL,
  destination_branch_id TEXT NOT NULL REFERENCES public.branches(id),
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
);
