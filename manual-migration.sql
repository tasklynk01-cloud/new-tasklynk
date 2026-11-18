-- ========================================
-- TaskLynk Manual Database Migration Script
-- Generated: December 9, 2025
-- Purpose: Apply schema changes for order management fixes + new billing/editor systems
-- Database: Turso (libsql://tasklynk-database-tasklynknet.aws-us-east-2.turso.io)
-- ========================================

-- INSTRUCTIONS:
-- 1. Connect to Turso using: turso db shell tasklynk-database
-- 2. Copy and paste each section below one at a time
-- 3. Verify success after each section before proceeding
-- 4. Backup database before running: turso db backup create tasklynk-database
-- OR paste entire file: turso db shell tasklynk-database < manual-migration.sql

-- ========================================
-- SECTION 1: ADD MISSING COLUMN TO JOBS TABLE
-- ========================================
-- This fixes the order lifecycle tracking by adding acceptedAt timestamp

-- Check if column already exists (run first to verify)
PRAGMA table_info(jobs);

-- Add acceptedAt column to jobs table (if not already present)
ALTER TABLE jobs ADD COLUMN accepted_at TEXT;

-- Verify the column was added
PRAGMA table_info(jobs);
-- Expected: You should see 'accepted_at' in the column list

-- ========================================
-- SECTION 2: CREATE BILLING INVOICES TABLE
-- ========================================
-- New table for consolidated billing invoices (monthly/periodic)

CREATE TABLE IF NOT EXISTS billing_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  recipient_id INTEGER NOT NULL,
  recipient_role TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  mpesa_code TEXT,
  merchant_reference TEXT,
  order_tracking_id TEXT,
  transaction_id TEXT,
  payment_method TEXT,
  pdf_url TEXT,
  payment_reference TEXT,
  sent_at TEXT,
  sent_by INTEGER,
  confirmed_at TEXT,
  confirmed_by INTEGER,
  paid_at TEXT,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_invoices_recipient ON billing_invoices(recipient_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_number ON billing_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_period ON billing_invoices(period_start, period_end);

-- Verify table creation
SELECT sql FROM sqlite_master WHERE type='table' AND name='billing_invoices';

-- ========================================
-- SECTION 3: CREATE BILLING INVOICE ITEMS TABLE
-- ========================================
-- Line items for each billing invoice

CREATE TABLE IF NOT EXISTS billing_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  job_id INTEGER,
  order_number TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES billing_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_invoice_items_invoice ON billing_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoice_items_job ON billing_invoice_items(job_id);

-- Verify table creation
SELECT sql FROM sqlite_master WHERE type='table' AND name='billing_invoice_items';

-- ========================================
-- SECTION 4: CREATE EDITOR FILES TABLE
-- ========================================
-- Track files uploaded by editors (edited drafts, AI reports, plagiarism reports)

CREATE TABLE IF NOT EXISTS editor_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  editor_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  is_latest INTEGER NOT NULL DEFAULT 1,
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_editor_files_job ON editor_files(job_id);
CREATE INDEX IF NOT EXISTS idx_editor_files_editor ON editor_files(editor_id);
CREATE INDEX IF NOT EXISTS idx_editor_files_type ON editor_files(file_type);
CREATE INDEX IF NOT EXISTS idx_editor_files_latest ON editor_files(is_latest);

-- Verify table creation
SELECT sql FROM sqlite_master WHERE type='table' AND name='editor_files';

-- ========================================
-- SECTION 5: CREATE EDITOR MESSAGES TABLE
-- ========================================
-- Communication between editors and admin/manager only (not visible to clients/freelancers)

CREATE TABLE IF NOT EXISTS editor_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_role TEXT NOT NULL,
  receiver_id INTEGER NOT NULL,
  receiver_role TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_editor_messages_job ON editor_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_editor_messages_sender ON editor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_editor_messages_receiver ON editor_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_editor_messages_read ON editor_messages(is_read);

-- Verify table creation
SELECT sql FROM sqlite_master WHERE type='table' AND name='editor_messages';

-- ========================================
-- SECTION 6: CREATE EDITOR INTERNAL REVISIONS TABLE
-- ========================================
-- Track revision requests from editor to freelancer (via admin/manager approval)

CREATE TABLE IF NOT EXISTS editor_internal_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  editor_id INTEGER NOT NULL,
  requested_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  detailed_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  approved_at TEXT,
  sent_to_freelancer_at TEXT,
  resubmitted_at TEXT,
  completed_at TEXT,
  freelancer_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_editor_revisions_job ON editor_internal_revisions(job_id);
CREATE INDEX IF NOT EXISTS idx_editor_revisions_editor ON editor_internal_revisions(editor_id);
CREATE INDEX IF NOT EXISTS idx_editor_revisions_status ON editor_internal_revisions(status);

-- Verify table creation
SELECT sql FROM sqlite_master WHERE type='table' AND name='editor_internal_revisions';
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memos_target_role ON memos(target_role);
CREATE INDEX IF NOT EXISTS idx_memos_priority ON memos(priority);
CREATE INDEX IF NOT EXISTS idx_memos_active ON memos(is_active);
CREATE INDEX IF NOT EXISTS idx_memos_expires_at ON memos(expires_at);

-- ============================================
-- 4. CREATE MEMO READS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS memo_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at DATETIME,
    FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(memo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memo_reads_memo ON memo_reads(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_reads_user ON memo_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_memo_reads_acknowledged ON memo_reads(acknowledged);

-- ========================================
-- SECTION 7: VERIFY ALL CHANGES
-- ========================================
-- Run these queries to confirm everything was created successfully

-- List all tables (should include the new ones)
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Count records in new tables (should all be 0 initially)
SELECT 
  (SELECT COUNT(*) FROM billing_invoices) as billing_invoices_count,
  (SELECT COUNT(*) FROM billing_invoice_items) as billing_invoice_items_count,
  (SELECT COUNT(*) FROM editor_files) as editor_files_count,
  (SELECT COUNT(*) FROM editor_messages) as editor_messages_count,
  (SELECT COUNT(*) FROM editor_internal_revisions) as editor_internal_revisions_count;

-- Verify jobs table has acceptedAt column
PRAGMA table_info(jobs);
-- Look for: accepted_at in the output

-- ========================================
-- SECTION 8: OPTIONAL - BACKFILL ACCEPTED_AT DATA
-- ========================================
-- If you have existing orders that were accepted but don't have acceptedAt timestamps,
-- you can backfill using other timestamp fields as reference

-- Example: Set acceptedAt to assignedAt for orders that are assigned but missing acceptedAt
-- UPDATE jobs 
-- SET accepted_at = assigned_at 
-- WHERE status = 'assigned' 
--   AND accepted_at IS NULL 
--   AND assigned_at IS NOT NULL;

-- Example: Set acceptedAt to created_at for very old orders where we can't determine exact time
-- UPDATE jobs 
-- SET accepted_at = created_at 
-- WHERE status IN ('assigned', 'in_progress', 'editing', 'delivered', 'approved', 'paid', 'completed')
--   AND accepted_at IS NULL;

-- ========================================
-- COMPLETION CHECKLIST
-- ========================================
-- ✅ Section 1: jobs.accepted_at column added
-- ✅ Section 2: billing_invoices table created
-- ✅ Section 3: billing_invoice_items table created
-- ✅ Section 4: editor_files table created
-- ✅ Section 5: editor_messages table created
-- ✅ Section 6: editor_internal_revisions table created
-- ✅ Section 7: All verification queries passed
-- ✅ Section 8 (Optional): Backfill data if needed

-- ========================================
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- ========================================
-- To undo these changes:

-- DROP TABLE IF EXISTS editor_internal_revisions;
-- DROP TABLE IF EXISTS editor_messages;
-- DROP TABLE IF EXISTS editor_files;
-- DROP TABLE IF EXISTS billing_invoice_items;
-- DROP TABLE IF EXISTS billing_invoices;
-- ALTER TABLE jobs DROP COLUMN accepted_at; -- Note: SQLite doesn't support DROP COLUMN in older versions

-- ========================================
-- NEXT STEPS AFTER MIGRATION
-- ========================================
-- 1. Restart your Next.js application: npm run dev
-- 2. Run validation script: npx tsx scripts/validate-all-fixes.ts
-- 3. Test manager dashboard: http://localhost:5000/manager/orders
-- 4. Test admin dashboard: http://localhost:5000/admin/orders
-- 5. Verify order filtering works correctly (managers only see their orders)
-- 6. Check that acceptedAt timestamp populates when orders are accepted

-- ========================================
-- TURSO CLI COMMANDS REFERENCE
-- ========================================
-- Connect to database:
--   turso db shell tasklynk-database
--
-- Create backup before migration:
--   turso db backup create tasklynk-database
--
-- List backups:
--   turso db backup list tasklynk-database
--
-- Restore from backup (if needed):
--   turso db restore tasklynk-database <backup-name>
--
-- Execute SQL file:
--   turso db shell tasklynk-database < manual-migration.sql
