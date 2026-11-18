-- ============================================
-- EDITOR SYSTEM - TURSO DATABASE SCHEMA
-- Run these queries directly in Turso CLI or Dashboard
-- ============================================

-- NOTE: Most editor fields already exist in the jobs table
-- This script adds missing fields and creates/verifies editor-specific tables

-- ============================================
-- 1. VERIFY/ADD EDITOR FIELDS TO JOBS TABLE
-- ============================================

-- Check if editor fields exist (run this first to verify):
-- PRAGMA table_info(jobs);

-- If any fields are missing, add them:
-- ALTER TABLE jobs ADD COLUMN assigned_editor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE jobs ADD COLUMN editor_status TEXT DEFAULT 'not_assigned';
-- ALTER TABLE jobs ADD COLUMN editor_approved INTEGER DEFAULT 0;
-- ALTER TABLE jobs ADD COLUMN editor_approved_at TEXT;
-- ALTER TABLE jobs ADD COLUMN editor_approval_notes TEXT;
-- ALTER TABLE jobs ADD COLUMN editor_notes TEXT;
-- ALTER TABLE jobs ADD COLUMN editor_requested_revision INTEGER DEFAULT 0;
-- ALTER TABLE jobs ADD COLUMN editor_revision_notes TEXT;
-- ALTER TABLE jobs ADD COLUMN editor_assigned_at TEXT;
-- ALTER TABLE jobs ADD COLUMN editor_started_at TEXT;
-- ALTER TABLE jobs ADD COLUMN editor_completed_at TEXT;

-- ============================================
-- 2. EDITOR FILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS editor_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL, -- 'edited_draft', 'edited_final', 'ai_report', 'plagiarism_report', 'editing_notes'
  version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  is_latest INTEGER NOT NULL DEFAULT 1, -- Boolean: 1 = true, 0 = false
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_editor_files_job_id ON editor_files(job_id);
CREATE INDEX IF NOT EXISTS idx_editor_files_editor_id ON editor_files(editor_id);
CREATE INDEX IF NOT EXISTS idx_editor_files_is_latest ON editor_files(is_latest);

-- ============================================
-- 3. EDITOR MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS editor_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL, -- 'editor', 'admin', 'manager'
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_role TEXT NOT NULL, -- 'editor', 'admin', 'manager'
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'revision_request', 'clarification', 'file_attachment'
  file_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0, -- Boolean: 1 = true, 0 = false
  read_at TEXT,
  created_at TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_editor_messages_job_id ON editor_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_editor_messages_sender_id ON editor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_editor_messages_receiver_id ON editor_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_editor_messages_is_read ON editor_messages(is_read);

-- ============================================
-- 4. EDITOR INTERNAL REVISIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS editor_internal_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  issue_type TEXT NOT NULL, -- 'quality', 'ai_generated', 'plagiarism', 'incomplete', 'formatting', 'instructions_not_followed'
  detailed_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent_to_freelancer', 'resubmitted', 'completed', 'cancelled'
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TEXT,
  sent_to_freelancer_at TEXT,
  resubmitted_at TEXT,
  completed_at TEXT,
  freelancer_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_editor_internal_revisions_job_id ON editor_internal_revisions(job_id);
CREATE INDEX IF NOT EXISTS idx_editor_internal_revisions_editor_id ON editor_internal_revisions(editor_id);
CREATE INDEX IF NOT EXISTS idx_editor_internal_revisions_status ON editor_internal_revisions(status);

-- ============================================
-- 5. VERIFY TABLES EXIST
-- ============================================

-- Check all editor-related tables:
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%editor%';

-- Verify editor_files structure:
-- PRAGMA table_info(editor_files);

-- Verify editor_messages structure:
-- PRAGMA table_info(editor_messages);

-- Verify editor_internal_revisions structure:
-- PRAGMA table_info(editor_internal_revisions);

-- ============================================
-- 6. SAMPLE QUERIES FOR TESTING
-- ============================================

-- Get all editors in the system:
-- SELECT id, name, email, role, approved, status FROM users WHERE role = 'editor';

-- Get all orders assigned to editing:
-- SELECT id, order_number, assigned_editor_id, editor_status, editor_assigned_at 
-- FROM jobs 
-- WHERE editor_status IN ('pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review');

-- Get editor files for a specific order:
-- SELECT * FROM editor_files WHERE job_id = ? ORDER BY version DESC, created_at DESC;

-- Get editor messages for a specific order:
-- SELECT em.*, 
--        sender.name as sender_name, 
--        receiver.name as receiver_name
-- FROM editor_messages em
-- JOIN users sender ON em.sender_id = sender.id
-- JOIN users receiver ON em.receiver_id = receiver.id
-- WHERE em.job_id = ?
-- ORDER BY em.created_at DESC;

-- Get pending internal revision requests:
-- SELECT eir.*, 
--        jobs.order_number, 
--        editor.name as editor_name
-- FROM editor_internal_revisions eir
-- JOIN jobs ON eir.job_id = jobs.id
-- JOIN users editor ON eir.editor_id = editor.id
-- WHERE eir.status = 'pending'
-- ORDER BY eir.requested_at DESC;

-- ============================================
-- 7. EDITOR ROLE VERIFICATION
-- ============================================

-- Ensure editor role exists in users table:
-- Role mapping: admin=1, client=2, manager=3, freelancer=4, editor=5, account_owner=6

-- Update existing editors to ensure correct role_id:
-- UPDATE users SET role_id = 5 WHERE role = 'editor';

-- Create a test editor account (if needed):
-- INSERT INTO users (
--   display_id, email, password, name, role, role_id, 
--   approved, email_verified, phone, status, created_at, updated_at
-- ) VALUES (
--   'ED-0001', 
--   'editor@test.com', 
--   '$2b$10$hashedpassword', -- Replace with actual hashed password
--   'Test Editor', 
--   'editor', 
--   5,
--   1, -- approved
--   1, -- email_verified
--   '+254700000000',
--   'active',
--   datetime('now'),
--   datetime('now')
-- );

-- ============================================
-- 8. CLEANUP QUERIES (USE WITH CAUTION)
-- ============================================

-- Remove all editor data for a specific order:
-- DELETE FROM editor_files WHERE job_id = ?;
-- DELETE FROM editor_messages WHERE job_id = ?;
-- DELETE FROM editor_internal_revisions WHERE job_id = ?;
-- UPDATE jobs SET 
--   assigned_editor_id = NULL,
--   editor_status = 'not_assigned',
--   editor_approved = 0,
--   editor_approved_at = NULL,
--   editor_approval_notes = NULL,
--   editor_notes = NULL,
--   editor_requested_revision = 0,
--   editor_revision_notes = NULL,
--   editor_assigned_at = NULL,
--   editor_started_at = NULL,
--   editor_completed_at = NULL
-- WHERE id = ?;

-- ============================================
-- 9. MIGRATION SCRIPT FOR EXISTING ORDERS
-- ============================================

-- If you have existing orders that need editor workflow initialization:
-- UPDATE jobs 
-- SET editor_status = 'not_assigned'
-- WHERE editor_status IS NULL;

-- ============================================
-- 10. PERFORMANCE OPTIMIZATION
-- ============================================

-- Add composite indexes for common query patterns:
CREATE INDEX IF NOT EXISTS idx_jobs_editor_status_assigned ON jobs(editor_status, assigned_editor_id);
CREATE INDEX IF NOT EXISTS idx_editor_files_job_latest ON editor_files(job_id, is_latest, version);
CREATE INDEX IF NOT EXISTS idx_editor_messages_job_read ON editor_messages(job_id, is_read);

-- ============================================
-- END OF SCHEMA
-- ============================================

-- NOTES:
-- 1. All timestamps are stored as ISO strings (TEXT type)
-- 2. Booleans are stored as INTEGER (1 = true, 0 = false)
-- 3. Foreign keys have ON DELETE CASCADE or SET NULL as appropriate
-- 4. All tables have proper indexes for query performance
-- 5. Editor role_id = 5 in the role mapping system
