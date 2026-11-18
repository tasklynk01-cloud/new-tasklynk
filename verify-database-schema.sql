-- ================================
-- TaskLynk Database Schema Verification Script
-- Run this against your Turso database to check all tables and columns
-- ================================

-- Get list of all tables
SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;

-- ================================
-- VERIFY USERS TABLE
-- ================================
PRAGMA table_info(users);

-- Check critical users columns
SELECT 
  'users table check' as verification,
  COUNT(*) as total_users,
  SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as approved_users,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
  SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as client_count,
  SUM(CASE WHEN role = 'freelancer' THEN 1 ELSE 0 END) as freelancer_count,
  SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count
FROM users;

-- Check for users without required fields
SELECT 
  id, email, role, approved, status, created_at
FROM users 
WHERE email IS NULL 
   OR password IS NULL 
   OR role IS NULL 
   OR role_id IS NULL
LIMIT 10;

-- ================================
-- VERIFY JOBS TABLE (Most Critical)
-- ================================
PRAGMA table_info(jobs);

-- Check jobs table structure
SELECT 
  'jobs table check' as verification,
  COUNT(*) as total_jobs,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
FROM jobs;

-- Check for required columns existence (will fail if column missing)
SELECT 
  id, 
  display_id,
  order_number,
  order_id,
  client_id,
  title,
  work_type,
  pages,
  slides,
  amount,
  deadline,
  status,
  created_at
FROM jobs 
LIMIT 1;

-- ================================
-- VERIFY ACCOUNTS TABLE
-- ================================
PRAGMA table_info(accounts);

SELECT 'accounts table' as verification, COUNT(*) as count FROM accounts;

-- ================================
-- VERIFY DOMAINS TABLE
-- ================================
PRAGMA table_info(domains);

SELECT 'domains table' as verification, COUNT(*) as count FROM domains;

-- ================================
-- VERIFY NOTIFICATIONS TABLE
-- ================================
PRAGMA table_info(notifications);

SELECT 
  'notifications table' as verification,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
  SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
FROM notifications;

-- ================================
-- VERIFY JOB_FILES TABLE
-- ================================
PRAGMA table_info(job_files);

SELECT 'job_files table' as verification, COUNT(*) as count FROM job_files;

-- ================================
-- VERIFY PAYMENTS TABLE
-- ================================
PRAGMA table_info(payments);

SELECT 
  'payments table' as verification,
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments
FROM payments;

-- ================================
-- VERIFY SYSTEM_SETTINGS TABLE
-- ================================
PRAGMA table_info(system_settings);

SELECT * FROM system_settings ORDER BY key;

-- ================================
-- VERIFY INVITATIONS TABLE
-- ================================
PRAGMA table_info(invitations);

SELECT 
  'invitations table' as verification,
  COUNT(*) as total_invitations,
  SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM invitations;

-- ================================
-- VERIFY CPP LEVELS TABLE
-- ================================
PRAGMA table_info(cpp_levels);

SELECT * FROM cpp_levels ORDER BY level_number;

-- ================================
-- VERIFY CPP_PROGRESS TABLE
-- ================================
PRAGMA table_info(cpp_progress);

SELECT 
  'cpp_progress table' as verification,
  COUNT(*) as freelancers_with_progress
FROM cpp_progress;

-- ================================
-- CHECK FOR MISSING INDEXES
-- ================================
SELECT name, tbl_name, sql 
FROM sqlite_master 
WHERE type = 'index' 
  AND tbl_name IN ('users', 'jobs', 'notifications', 'payments')
ORDER BY tbl_name, name;

-- ================================
-- VERIFY FOREIGN KEY RELATIONSHIPS
-- ================================
-- Check jobs have valid client_ids
SELECT 
  'orphaned jobs check' as verification,
  COUNT(*) as jobs_with_invalid_client
FROM jobs j
LEFT JOIN users u ON j.client_id = u.id
WHERE u.id IS NULL;

-- Check jobs have valid freelancer assignments
SELECT 
  'invalid freelancer assignments' as verification,
  COUNT(*) as count
FROM jobs j
LEFT JOIN users u ON j.assigned_freelancer_id = u.id
WHERE j.assigned_freelancer_id IS NOT NULL 
  AND u.id IS NULL;

-- ================================
-- CHECK DATABASE SIZE AND HEALTH
-- ================================
SELECT 
  page_count * page_size / 1024.0 / 1024.0 as size_mb 
FROM pragma_page_count(), pragma_page_size();

-- Check for database corruption
PRAGMA integrity_check;

-- ================================
-- CRITICAL COLUMNS CHECK FOR ORDER CREATION
-- These columns MUST exist for order creation to work
-- ================================

-- Verify users table has all required columns
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'users.role' as column_check
FROM pragma_table_info('users')
WHERE name = 'role';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'users.approved' as column_check
FROM pragma_table_info('users')
WHERE name = 'approved';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'users.status' as column_check
FROM pragma_table_info('users')
WHERE name = 'status';

-- Verify jobs table has all required columns
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'jobs.display_id' as column_check
FROM pragma_table_info('jobs')
WHERE name = 'display_id';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'jobs.order_number' as column_check
FROM pragma_table_info('jobs')
WHERE name = 'order_number';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'jobs.client_cpp' as column_check
FROM pragma_table_info('jobs')
WHERE name = 'client_cpp';

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'MISSING COLUMN'
    ELSE 'EXISTS'
  END as status,
  'jobs.service_type' as column_check
FROM pragma_table_info('jobs')
WHERE name = 'service_type';

-- ================================
-- END OF VERIFICATION SCRIPT
-- ================================
