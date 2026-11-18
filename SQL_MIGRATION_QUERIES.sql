-- ============================================================
-- TaskLynk Database Migration Queries
-- Generated: December 14, 2025
-- 
-- PURPOSE: Add all missing tables and columns identified in the
-- database schema audit.
--
-- INSTRUCTIONS:
-- 1. Run these queries against your Turso database
-- 2. Alternatively, run `npm run db:push` to let Drizzle handle migrations
-- 3. These are SQLite-compatible queries
-- ============================================================

-- ============================================================
-- NEW TABLE: audit_logs
-- Purpose: General system-wide audit trail (used by audit-logger.ts)
-- This table tracks ALL system events, not just admin actions
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  event_type TEXT NOT NULL,  -- USER_LOGIN, ORDER_CREATED, PAYMENT_CONFIRMED, etc.
  description TEXT NOT NULL,
  severity TEXT NOT NULL,    -- LOW, MEDIUM, HIGH, CRITICAL
  resource_type TEXT,        -- user, job, payment, etc.
  resource_id INTEGER,
  old_values TEXT,           -- JSON string of previous values
  new_values TEXT,           -- JSON string of new values
  metadata TEXT,             -- JSON string with additional context
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  success INTEGER NOT NULL DEFAULT 1,  -- 0 = false, 1 = true (SQLite boolean)
  error_message TEXT,
  created_at TEXT NOT NULL
);

-- Create indexes for audit_logs for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);


-- ============================================================
-- ALTER TABLE: freelancer_subjects
-- Add: category_id column for grouping subjects into categories
-- ============================================================

-- SQLite doesn't support ADD COLUMN with IF NOT EXISTS, so we check first
-- Run this query to check if column exists:
-- SELECT * FROM pragma_table_info('freelancer_subjects') WHERE name = 'category_id';

-- If column doesn't exist, run:
ALTER TABLE freelancer_subjects ADD COLUMN category_id INTEGER;


-- ============================================================
-- PREVIOUSLY ADDED (in earlier session): jobs table columns
-- These were added in commit e27a247
-- ============================================================

-- Check if columns exist before adding:
-- SELECT * FROM pragma_table_info('jobs') WHERE name IN ('manager_assigned_fee', 'manager_delivery_fee');

-- If not exists:
-- ALTER TABLE jobs ADD COLUMN manager_assigned_fee REAL NOT NULL DEFAULT 0;
-- ALTER TABLE jobs ADD COLUMN manager_delivery_fee REAL NOT NULL DEFAULT 0;


-- ============================================================
-- VERIFICATION QUERIES
-- Run these to verify the changes were applied
-- ============================================================

-- Check audit_logs table exists
SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs';

-- Check audit_logs columns
SELECT * FROM pragma_table_info('audit_logs');

-- Check freelancer_subjects has category_id
SELECT * FROM pragma_table_info('freelancer_subjects') WHERE name = 'category_id';

-- Check jobs has manager fee columns
SELECT * FROM pragma_table_info('jobs') WHERE name IN ('manager_assigned_fee', 'manager_delivery_fee');


-- ============================================================
-- FULL TABLE LIST (for reference)
-- These are all the tables that should exist in the database
-- ============================================================

/*
1.  accounts
2.  admin_audit_logs
3.  audit_logs                    -- NEW (added this session)
4.  badges
5.  balances
6.  bids
7.  billing_invoice_items
8.  billing_invoices
9.  client_freelancer_history
10. client_manager
11. client_online_status          -- DEPRECATED
12. client_profiles
13. contact_messages
14. conversations
15. domains
16. editor_assignments
17. editor_files
18. editor_internal_revisions
19. editor_messages
20. editor_profiles
21. email_logs
22. email_notifications
23. email_verification_codes
24. freelancer_cpp_levels
25. freelancer_cpp_progress
26. freelancer_online_status      -- DEPRECATED
27. freelancer_order_responses
28. freelancer_profiles
29. freelancer_services
30. freelancer_services_map
31. freelancer_software
32. freelancer_software_map
33. freelancer_subject_map
34. freelancer_subjects           -- MODIFIED (added category_id)
35. invitations
36. invoice_settlements
37. invoices
38. job_attachments               -- DEPRECATED (use order_files)
39. job_messages
40. job_status_logs
41. jobs                          -- MODIFIED (added manager fee columns)
42. manager_clients
43. manager_earnings
44. manager_freelancers
45. manager_invitations           -- DEPRECATED
46. manager_online_status         -- DEPRECATED
47. managers
48. memo_reads
49. memos
50. messages
51. notifications
52. order_additional_payments
53. order_amount_adjustments
54. order_chat_messages
55. order_files
56. order_history
57. order_revisions
58. order_settlements
59. password_reset_tokens
60. payment_requests
61. payment_transactions
62. payments
63. payout_requests
64. pending_registrations
65. pricing_minimums
66. ratings
67. revisions                     -- DEPRECATED (use order_revisions)
68. settings_history
69. submission_files
70. submissions
71. system_logs
72. system_settings
73. user_badges
74. user_balance_history
75. user_categories
76. user_fines
77. user_stats
78. users
79. writer_balances
80. writer_tiers
*/


-- ============================================================
-- DRIZZLE PUSH ALTERNATIVE
-- Instead of running these SQL queries manually, you can run:
-- 
-- npm run db:push
-- 
-- This will automatically apply all schema changes from
-- src/db/schema.ts to your Turso database.
-- ============================================================
