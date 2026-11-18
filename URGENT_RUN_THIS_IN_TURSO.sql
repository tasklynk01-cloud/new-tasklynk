-- ========================================
-- URGENT: Run these commands in Turso console to fix payment system
-- ========================================
-- Go to: https://turso.tech/tasklynknet/tasklynk-database
-- Or use: turso db shell tasklynk-database

-- Step 1: Create a new payments table with nullable job_id and all current columns
CREATE TABLE IF NOT EXISTS payments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER,  -- Nullable for wallet top-ups
  client_id INTEGER NOT NULL,
  freelancer_id INTEGER,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  status TEXT NOT NULL DEFAULT 'pending',
  mpesa_code TEXT,  -- Client's MPESA code from SMS
  admin_verification_code TEXT,  -- Admin's MPESA code for verification
  phone_number TEXT,
  mpesa_checkout_request_id TEXT,
  mpesa_merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  mpesa_transaction_date TEXT,
  mpesa_result_desc TEXT,
  paystack_reference TEXT,
  merchant_reference TEXT,  -- Pesapal merchant reference
  order_tracking_id TEXT,  -- Pesapal order tracking ID
  confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
  confirmed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Step 2: Copy existing data (if any) - handles schema differences
-- First check what columns exist
-- PRAGMA table_info(payments);

-- Then run appropriate INSERT. If your table has all columns:
INSERT INTO payments_new (
  id, job_id, client_id, freelancer_id, amount, payment_method, status,
  mpesa_code, admin_verification_code, phone_number, merchant_reference,
  order_tracking_id, confirmed_by_admin, confirmed_at, created_at, updated_at
)
SELECT 
  id, job_id, client_id, freelancer_id, amount, 
  COALESCE(payment_method, 'mpesa'), 
  COALESCE(status, 'pending'),
  mpesa_code, admin_verification_code, phone_number, merchant_reference,
  order_tracking_id, COALESCE(confirmed_by_admin, 0), confirmed_at, created_at, updated_at
FROM payments;

-- Step 3: Drop old table
DROP TABLE payments;

-- Step 4: Rename new table
ALTER TABLE payments_new RENAME TO payments;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_job ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ========================================
-- Verification query (run after migration)
-- ========================================
-- Run this to confirm the schema is correct:
-- PRAGMA table_info(payments);
-- 
-- You should see job_id with notnull=0 (means nullable)
