-- TaskLynk comprehensive schema repair (SQLite/Turso)
-- Generated from src/db/schema.ts
--
-- This script is designed to be safely re-runnable:
--  - CREATE TABLE IF NOT EXISTS for all tables
--  - ALTER TABLE ADD COLUMN IF NOT EXISTS for all columns
--
-- If your SQLite engine does not support "ADD COLUMN IF NOT EXISTS",
-- you can remove the "IF NOT EXISTS" portions and re-run carefully.
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL UNIQUE,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- admin_audit_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id INTEGER,
  target_type TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS admin_id INTEGER;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS target_id INTEGER;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  success INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_values TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_values TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS success INTEGER DEFAULT 1;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  criteria TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE badges ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS criteria TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE badges ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- balances
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance REAL NOT NULL DEFAULT 0,
  pending_balance REAL NOT NULL DEFAULT 0,
  reserved_balance REAL NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  total_withdrawn REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE balances ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS available_balance REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS pending_balance REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS reserved_balance REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS total_earned REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS total_withdrawn REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- bids
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  bid_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

ALTER TABLE bids ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS bid_amount REAL;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- billing_invoice_items
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  order_number TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS invoice_id INTEGER;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS unit_price REAL DEFAULT 0;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS amount REAL DEFAULT 0;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- billing_invoices
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TEXT,
  confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  paid_at TEXT,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS recipient_id INTEGER;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS recipient_role TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS period_start TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS period_end TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS total_amount REAL DEFAULT 0;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES';
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS mpesa_code TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS merchant_reference TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS order_tracking_id TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS sent_at TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS sent_by INTEGER;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS confirmed_at TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS confirmed_by INTEGER;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS paid_at TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS updated_at TEXT;
ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- client_freelancer_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_freelancer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_jobs_count INTEGER NOT NULL DEFAULT 1,
  last_worked_at TEXT NOT NULL,
  avg_rating REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS completed_jobs_count INTEGER DEFAULT 1;
ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS last_worked_at TEXT;
ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS avg_rating REAL;
ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE client_freelancer_history ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- client_manager
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_manager (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE client_manager ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE client_manager ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE client_manager ADD COLUMN IF NOT EXISTS assigned_at TEXT;
ALTER TABLE client_manager ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- client_online_status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_online_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_online INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  online_status_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE client_online_status ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE client_online_status ADD COLUMN IF NOT EXISTS is_online INTEGER DEFAULT 0;
ALTER TABLE client_online_status ADD COLUMN IF NOT EXISTS last_seen_at TEXT;
ALTER TABLE client_online_status ADD COLUMN IF NOT EXISTS online_status_updated_at TEXT;
ALTER TABLE client_online_status ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- client_profiles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  industry TEXT,
  website TEXT,
  tax_id TEXT,
  business_registration TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  preferred_payment_method TEXT,
  automate_payments INTEGER DEFAULT 0,
  total_jobs_posted INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  recurring_client_discount REAL DEFAULT 0,
  is_profile_complete INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS business_registration TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS automate_payments INTEGER DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS total_jobs_posted INTEGER DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS total_spent REAL DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS recurring_client_discount REAL DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS is_profile_complete INTEGER DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_guest INTEGER NOT NULL DEFAULT 1,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS sender_phone TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_guest INTEGER DEFAULT 1;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved_by INTEGER;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved_at TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  participant1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TEXT,
  last_message_sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_message_preview TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant1_id INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant2_id INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_sender_id INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_at TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- domains
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE domains ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE domains ADD COLUMN IF NOT EXISTS max_users INTEGER;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- editor_assignments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editor_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL,
  review_started_at TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approval_reason TEXT,
  revisions_requested INTEGER NOT NULL DEFAULT 0,
  revision_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS editor_id INTEGER;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS assigned_at TEXT;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS review_started_at TEXT;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS approval_reason TEXT;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS revisions_requested INTEGER DEFAULT 0;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE editor_assignments ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- editor_files
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editor_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  is_latest INTEGER NOT NULL DEFAULT 1,
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS editor_id INTEGER;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS is_latest INTEGER DEFAULT 1;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS uploaded_at TEXT;
ALTER TABLE editor_files ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- editor_internal_revisions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editor_internal_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  detailed_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TEXT,
  sent_to_freelancer_at TEXT,
  resubmitted_at TEXT,
  completed_at TEXT,
  freelancer_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS editor_id INTEGER;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS requested_at TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS detailed_notes TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS sent_to_freelancer_at TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS resubmitted_at TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS completed_at TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS freelancer_response TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE editor_internal_revisions ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- editor_messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editor_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_role TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS sender_id INTEGER;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS receiver_id INTEGER;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS receiver_role TEXT;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS is_read INTEGER DEFAULT 0;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS read_at TEXT;
ALTER TABLE editor_messages ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- editor_profiles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editor_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialization TEXT,
  years_experience INTEGER,
  languages TEXT,
  qualifications TEXT,
  areas_of_expertise TEXT,
  average_edits_per_order INTEGER DEFAULT 0,
  orders_touched INTEGER DEFAULT 0,
  client_satisfaction_rate REAL DEFAULT 0,
  is_profile_complete INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS areas_of_expertise TEXT;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS average_edits_per_order INTEGER DEFAULT 0;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS orders_touched INTEGER DEFAULT 0;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS client_satisfaction_rate REAL DEFAULT 0;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS is_profile_complete INTEGER DEFAULT 0;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE editor_profiles ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- email_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sent_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_to TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  failed_recipients TEXT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS sent_by INTEGER;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS sent_to TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_type TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS recipient_count INTEGER;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS failed_recipients TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- email_notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_to TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL
);

ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS notification_type TEXT;
ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS sent_to TEXT;
ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS sent_at TEXT;
ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE email_notifications ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- email_verification_codes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS expires_at TEXT;
ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS used INTEGER DEFAULT 0;
ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_cpp_levels
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_cpp_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level INTEGER NOT NULL UNIQUE,
  level_name TEXT NOT NULL,
  description TEXT NOT NULL,
  completed_orders_required INTEGER NOT NULL,
  cpp_non_technical REAL NOT NULL,
  cpp_technical REAL NOT NULL,
  order_count_in_level INTEGER NOT NULL,
  progress_bar_color TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS level INTEGER;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS level_name TEXT;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS completed_orders_required INTEGER;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS cpp_non_technical REAL;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS cpp_technical REAL;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS order_count_in_level INTEGER;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS progress_bar_color TEXT;
ALTER TABLE freelancer_cpp_levels ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_cpp_progress
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_cpp_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 1,
  total_completed_orders INTEGER NOT NULL DEFAULT 0,
  orders_in_current_level INTEGER NOT NULL DEFAULT 0,
  progress_percentage REAL NOT NULL DEFAULT 0,
  next_level_orders_required INTEGER NOT NULL DEFAULT 3,
  is_work_type_specialized INTEGER NOT NULL DEFAULT 0,
  last_progress_update TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS total_completed_orders INTEGER DEFAULT 0;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS orders_in_current_level INTEGER DEFAULT 0;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS progress_percentage REAL DEFAULT 0;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS next_level_orders_required INTEGER DEFAULT 3;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS is_work_type_specialized INTEGER DEFAULT 0;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS last_progress_update TEXT;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE freelancer_cpp_progress ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_online_status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_online_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_online INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  current_jobs_count INTEGER NOT NULL DEFAULT 0,
  online_status_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE freelancer_online_status ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE freelancer_online_status ADD COLUMN IF NOT EXISTS is_online INTEGER DEFAULT 0;
ALTER TABLE freelancer_online_status ADD COLUMN IF NOT EXISTS last_seen_at TEXT;
ALTER TABLE freelancer_online_status ADD COLUMN IF NOT EXISTS current_jobs_count INTEGER DEFAULT 0;
ALTER TABLE freelancer_online_status ADD COLUMN IF NOT EXISTS online_status_updated_at TEXT;
ALTER TABLE freelancer_online_status ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_order_responses
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_order_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  response_status TEXT NOT NULL,
  response_at TEXT,
  rejection_reason TEXT,
  response_time_minutes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS response_status TEXT;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS response_at TEXT;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE freelancer_order_responses ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_profiles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_tier_id INTEGER REFERENCES writer_tiers(id) ON DELETE SET NULL,
  bio TEXT,
  skills TEXT,
  certifications TEXT,
  portfolio TEXT,
  hourly_rate REAL,
  languages TEXT,
  timezone TEXT,
  availability TEXT DEFAULT 'part-time',
  available_days TEXT,
  available_time_start TEXT,
  available_time_end TEXT,
  response_time INTEGER,
  total_clients INTEGER DEFAULT 0,
  repeat_client_rate REAL DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  is_profile_complete INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS current_tier_id INTEGER;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS portfolio TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS hourly_rate REAL;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'part-time';
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS available_days TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS available_time_start TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS available_time_end TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS response_time INTEGER;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS total_clients INTEGER DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS repeat_client_rate REAL DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS jobs_completed INTEGER DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS is_profile_complete INTEGER DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_services
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE freelancer_services ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE freelancer_services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE freelancer_services ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE freelancer_services ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_services_map
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_services_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES freelancer_services(id) ON DELETE CASCADE,
  other_service TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE freelancer_services_map ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE freelancer_services_map ADD COLUMN IF NOT EXISTS service_id INTEGER;
ALTER TABLE freelancer_services_map ADD COLUMN IF NOT EXISTS other_service TEXT;
ALTER TABLE freelancer_services_map ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_software
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_software (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE freelancer_software ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE freelancer_software ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE freelancer_software ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE freelancer_software ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_software_map
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_software_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  software_id INTEGER NOT NULL REFERENCES freelancer_software(id) ON DELETE CASCADE,
  other_software TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE freelancer_software_map ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE freelancer_software_map ADD COLUMN IF NOT EXISTS software_id INTEGER;
ALTER TABLE freelancer_software_map ADD COLUMN IF NOT EXISTS other_software TEXT;
ALTER TABLE freelancer_software_map ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_subject_map
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_subject_map (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES freelancer_subjects(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

ALTER TABLE freelancer_subject_map ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE freelancer_subject_map ADD COLUMN IF NOT EXISTS subject_id INTEGER;
ALTER TABLE freelancer_subject_map ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- freelancer_subjects
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE freelancer_subjects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE freelancer_subjects ADD COLUMN IF NOT EXISTS category_id INTEGER;
ALTER TABLE freelancer_subjects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE freelancer_subjects ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE freelancer_subjects ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  used INTEGER NOT NULL DEFAULT 0,
  used_at TEXT,
  expires_at TEXT NOT NULL,
  created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_email_role_unique ON invitations(email, role);

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS used INTEGER DEFAULT 0;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS used_at TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS expires_at TEXT;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------
-- invoice_settlements
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  settlement_amount REAL NOT NULL,
  orders_settled INTEGER NOT NULL,
  order_ids TEXT NOT NULL,
  balance_before_settlement REAL NOT NULL,
  balance_after_settlement REAL NOT NULL DEFAULT 0,
  notes TEXT,
  settled_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  settled_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS settlement_amount REAL;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS orders_settled INTEGER;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS order_ids TEXT;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS balance_before_settlement REAL;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS balance_after_settlement REAL DEFAULT 0;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS settled_by INTEGER;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS settled_at TEXT;
ALTER TABLE invoice_settlements ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  freelancer_amount REAL NOT NULL,
  admin_commission REAL NOT NULL,
  manager_amount REAL NOT NULL DEFAULT 0,
  company_fee REAL NOT NULL DEFAULT 0,
  client_cpp_at_invoice REAL,
  manager_additional_included REAL NOT NULL DEFAULT 0,
  client_bonus_included REAL NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_paid INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  billing_invoice_id INTEGER REFERENCES billing_invoices(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS freelancer_amount REAL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS admin_commission REAL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manager_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_fee REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_cpp_at_invoice REAL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manager_additional_included REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_bonus_included REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_paid INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_invoice_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- job_attachments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  upload_type TEXT NOT NULL,
  attachment_category TEXT,
  scheduled_deletion_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS uploaded_by INTEGER;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS upload_type TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS attachment_category TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS scheduled_deletion_at TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS deleted_at TEXT;
ALTER TABLE job_attachments ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- job_messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  admin_approved INTEGER NOT NULL DEFAULT 0,
  is_delivered INTEGER NOT NULL DEFAULT 0,
  approved_at TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS sender_id INTEGER;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS admin_approved INTEGER DEFAULT 0;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS is_delivered INTEGER DEFAULT 0;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE job_messages ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- job_status_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_status_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE job_status_logs ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE job_status_logs ADD COLUMN IF NOT EXISTS old_status TEXT;
ALTER TABLE job_status_logs ADD COLUMN IF NOT EXISTS new_status TEXT;
ALTER TABLE job_status_logs ADD COLUMN IF NOT EXISTS changed_by INTEGER;
ALTER TABLE job_status_logs ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE job_status_logs ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_id TEXT NOT NULL UNIQUE,
  order_number TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  account_order_number TEXT,
  account_linked INTEGER NOT NULL DEFAULT 0,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delivered_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  work_type TEXT NOT NULL,
  pages INTEGER,
  slides INTEGER,
  problems INTEGER,
  amount REAL NOT NULL,
  manager_earnings REAL NOT NULL DEFAULT 0,
  freelancer_earnings REAL NOT NULL DEFAULT 0,
  admin_profit REAL NOT NULL DEFAULT 0,
  manager_assigned_fee REAL NOT NULL DEFAULT 0,
  manager_delivery_fee REAL NOT NULL DEFAULT 0,
  deadline TEXT NOT NULL,
  actual_deadline TEXT NOT NULL,
  freelancer_deadline TEXT NOT NULL,
  request_draft INTEGER NOT NULL DEFAULT 0,
  draft_delivered INTEGER NOT NULL DEFAULT 0,
  request_printable_sources INTEGER NOT NULL DEFAULT 0,
  single_spaced INTEGER NOT NULL DEFAULT 0,
  base_cpp REAL,
  effective_cpp REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  manager_approved INTEGER NOT NULL DEFAULT 0,
  manager_approved_at TEXT,
  manager_approval_notes TEXT,
  assigned_editor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  editor_status TEXT DEFAULT 'not_assigned',
  editor_approved INTEGER NOT NULL DEFAULT 0,
  editor_approved_at TEXT,
  editor_approval_notes TEXT,
  editor_notes TEXT,
  editor_requested_revision INTEGER NOT NULL DEFAULT 0,
  editor_revision_notes TEXT,
  editor_assigned_at TEXT,
  editor_started_at TEXT,
  editor_completed_at TEXT,
  editor_claimed_at TEXT,
  editor_flagged INTEGER NOT NULL DEFAULT 0,
  admin_approved INTEGER NOT NULL DEFAULT 0,
  client_approved INTEGER NOT NULL DEFAULT 0,
  approved_by_client_at TEXT,
  revision_requested INTEGER NOT NULL DEFAULT 0,
  revision_notes TEXT,
  payment_confirmed INTEGER NOT NULL DEFAULT 0,
  paid_order_confirmed_at TEXT,
  invoice_generated INTEGER NOT NULL DEFAULT 0,
  client_rating INTEGER,
  writer_rating INTEGER,
  review_comment TEXT,
  placement_priority INTEGER NOT NULL DEFAULT 0,
  urgency_multiplier REAL NOT NULL DEFAULT 1.0,
  calculated_price REAL,
  is_real_order INTEGER NOT NULL DEFAULT 1,
  requires_reports INTEGER NOT NULL DEFAULT 1,
  final_submission_complete INTEGER NOT NULL DEFAULT 0,
  revision_submission_complete INTEGER NOT NULL DEFAULT 0,
  client_cpp REAL,
  client_cpp_confirmed INTEGER NOT NULL DEFAULT 0,
  service_type TEXT DEFAULT 'writing_page',
  manager_additional REAL NOT NULL DEFAULT 0,
  manager_additional_note TEXT,
  manager_additional_status TEXT DEFAULT 'none',
  client_bonus REAL NOT NULL DEFAULT 0,
  status_total_amount REAL NOT NULL DEFAULT 0,
  cpp_payment_status TEXT DEFAULT 'unpaid',
  last_amount_update_at TEXT,
  freelancer_accepted INTEGER NOT NULL DEFAULT 0,
  freelancer_accepted_at TEXT,
  freelancer_rejected INTEGER NOT NULL DEFAULT 0,
  freelancer_rejected_at TEXT,
  freelancer_rejection_reason TEXT,
  freelancer_response_pending INTEGER NOT NULL DEFAULT 0,
  accepted_at TEXT,
  assigned_at TEXT,
  submitted_at TEXT,
  delivered_at TEXT,
  approved_at TEXT,
  paid_at TEXT,
  completed_at TEXT,
  is_invoiced INTEGER NOT NULL DEFAULT 0,
  order_type TEXT,
  invoiced_at TEXT,
  has_open_internal_revision INTEGER NOT NULL DEFAULT 0,
  internal_revision_count INTEGER NOT NULL DEFAULT 0,
  client_requested_revision INTEGER NOT NULL DEFAULT 0,
  escalation_level INTEGER NOT NULL DEFAULT 0,
  last_escalation_at TEXT,
  client_notes TEXT,
  client_preferred_freelancer INTEGER REFERENCES users(id) ON DELETE SET NULL,
  client_preference_type TEXT,
  urgency_level TEXT DEFAULT 'normal',
  complexity_level TEXT DEFAULT 'standard',
  submitted_to_client_at TEXT,
  client_first_viewed_at TEXT,
  last_client_activity_at TEXT,
  last_freelancer_activity_at TEXT,
  quality_score INTEGER,
  quality_notes TEXT,
  plagiarism_score REAL,
  ai_detection_score REAL,
  grammar_score INTEGER,
  total_revision_count INTEGER NOT NULL DEFAULT 0,
  client_revision_count INTEGER NOT NULL DEFAULT 0,
  last_revision_requested_at TEXT,
  revision_deadline TEXT,
  unread_client_messages INTEGER NOT NULL DEFAULT 0,
  unread_freelancer_messages INTEGER NOT NULL DEFAULT 0,
  unread_admin_messages INTEGER NOT NULL DEFAULT 0,
  last_message_at TEXT,
  total_files_uploaded INTEGER NOT NULL DEFAULT 0,
  client_files_count INTEGER NOT NULL DEFAULT 0,
  freelancer_files_count INTEGER NOT NULL DEFAULT 0,
  final_files_count INTEGER NOT NULL DEFAULT 0,
  cancelled_at TEXT,
  cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  cancellation_category TEXT,
  refund_issued INTEGER NOT NULL DEFAULT 0,
  refund_amount REAL NOT NULL DEFAULT 0,
  on_hold_at TEXT,
  on_hold_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  on_hold_reason TEXT,
  expected_resume_date TEXT,
  resumed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS display_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS account_order_number TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS account_linked INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_freelancer_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_by_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivered_by_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pages INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS slides INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS problems INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_earnings REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_earnings REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS admin_profit REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_assigned_fee REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_delivery_fee REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS actual_deadline TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_deadline TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS request_draft INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS draft_delivered INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS request_printable_sources INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS single_spaced INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS base_cpp REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS effective_cpp REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_approved INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_approved_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_approval_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_editor_id INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_status TEXT DEFAULT 'not_assigned';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_approved INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_approved_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_approval_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_requested_revision INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_revision_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_assigned_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_started_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_completed_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_claimed_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS editor_flagged INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS admin_approved INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_approved INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_by_client_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revision_requested INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_confirmed INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS paid_order_confirmed_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_generated INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_rating INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS writer_rating INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS placement_priority INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS urgency_multiplier REAL DEFAULT 1.0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS calculated_price REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_real_order INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requires_reports INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS final_submission_complete INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revision_submission_complete INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_cpp REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_cpp_confirmed INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'writing_page';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_additional REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_additional_note TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manager_additional_status TEXT DEFAULT 'none';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_bonus REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status_total_amount REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cpp_payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_amount_update_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_accepted INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_accepted_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_rejected INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_rejected_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_rejection_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_response_pending INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS accepted_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submitted_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivered_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS paid_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_invoiced INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoiced_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS has_open_internal_revision INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internal_revision_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_requested_revision INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_escalation_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_preferred_freelancer INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_preference_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'normal';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'standard';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submitted_to_client_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_first_viewed_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_client_activity_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_freelancer_activity_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS quality_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS plagiarism_score REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_detection_score REAL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS grammar_score INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_revision_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_revision_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_revision_requested_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revision_deadline TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unread_client_messages INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unread_freelancer_messages INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unread_admin_messages INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_message_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_files_uploaded INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_files_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS freelancer_files_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS final_files_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelled_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelled_by INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellation_category TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS refund_issued INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS refund_amount REAL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS on_hold_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS on_hold_by INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS on_hold_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expected_resume_date TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resumed_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- manager_clients
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manager_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  assigned_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS assigned_by INTEGER;
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS assigned_at TEXT;
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE manager_clients ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- manager_earnings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manager_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  earning_type TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE manager_earnings ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE manager_earnings ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE manager_earnings ADD COLUMN IF NOT EXISTS earning_type TEXT;
ALTER TABLE manager_earnings ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE manager_earnings ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- manager_freelancers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manager_freelancers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  assigned_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS assigned_by INTEGER;
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS assigned_at TEXT;
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE manager_freelancers ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- manager_invitations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manager_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'manager',
  status TEXT DEFAULT 'pending',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  used_at TEXT,
  expires_at TEXT
);

ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'manager';
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS used INTEGER DEFAULT 0;
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS used_at TEXT;
ALTER TABLE manager_invitations ADD COLUMN IF NOT EXISTS expires_at TEXT;

-- ---------------------------------------------------------------------
-- manager_online_status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manager_online_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_online INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  online_status_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE manager_online_status ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE manager_online_status ADD COLUMN IF NOT EXISTS is_online INTEGER DEFAULT 0;
ALTER TABLE manager_online_status ADD COLUMN IF NOT EXISTS last_seen_at TEXT;
ALTER TABLE manager_online_status ADD COLUMN IF NOT EXISTS online_status_updated_at TEXT;
ALTER TABLE manager_online_status ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- managers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  balance REAL NOT NULL DEFAULT 0,
  total_earnings REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE managers ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS balance REAL DEFAULT 0;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS total_earnings REAL DEFAULT 0;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE managers ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE managers ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- memo_reads
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memo_reads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memo_id INTEGER NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TEXT NOT NULL,
  acknowledged_at TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE memo_reads ADD COLUMN IF NOT EXISTS memo_id INTEGER;
ALTER TABLE memo_reads ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE memo_reads ADD COLUMN IF NOT EXISTS read_at TEXT;
ALTER TABLE memo_reads ADD COLUMN IF NOT EXISTS acknowledged_at TEXT;
ALTER TABLE memo_reads ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- memos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  requires_acknowledgement INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE memos ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS target_role TEXT;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE memos ADD COLUMN IF NOT EXISTS requires_acknowledgement INTEGER DEFAULT 1;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS expires_at TEXT;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE memos ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  admin_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS admin_approved INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  related_id INTEGER,
  related_type TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_additional_payments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_additional_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  additional_amount REAL NOT NULL,
  reason TEXT NOT NULL,
  original_amount REAL NOT NULL,
  new_total_amount REAL NOT NULL,
  added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  added_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS recipient_id INTEGER;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS additional_amount REAL;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS original_amount REAL;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS new_total_amount REAL;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS added_by INTEGER;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS added_at TEXT;
ALTER TABLE order_additional_payments ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_amount_adjustments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_amount_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL,
  amount REAL NOT NULL,
  previous_total REAL,
  new_total REAL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  applied_at TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS changed_by INTEGER;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS change_type TEXT;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS previous_total REAL;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS new_total REAL;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS rejected_at TEXT;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS applied_at TEXT;
ALTER TABLE order_amount_adjustments ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_chat_messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  display_sender_name TEXT,
  display_sender_role TEXT,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  chat_space TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS order_id INTEGER;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS sender_id INTEGER;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS display_sender_name TEXT;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS display_sender_role TEXT;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS is_read INTEGER DEFAULT 0;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS read_at TEXT;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS chat_space TEXT;
ALTER TABLE order_chat_messages ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_files
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_by_role TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_classification TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

ALTER TABLE order_files ADD COLUMN IF NOT EXISTS order_id INTEGER;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS uploaded_by INTEGER;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS file_classification TEXT DEFAULT 'other';
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE order_history ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE order_history ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE order_history ADD COLUMN IF NOT EXISTS old_status TEXT;
ALTER TABLE order_history ADD COLUMN IF NOT EXISTS new_status TEXT;
ALTER TABLE order_history ADD COLUMN IF NOT EXISTS actor_id INTEGER;
ALTER TABLE order_history ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE order_history ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_revisions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  revision_type TEXT NOT NULL,
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  files_json TEXT DEFAULT '[]',
  freelancer_response TEXT,
  reviewer_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  completed_at TEXT,
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS order_id INTEGER;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS revision_type TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS requested_by INTEGER;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS assigned_to INTEGER;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS files_json TEXT DEFAULT '[]';
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS freelancer_response TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS updated_at TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS submitted_at TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS completed_at TEXT;
ALTER TABLE order_revisions ADD COLUMN IF NOT EXISTS closed_by INTEGER;

-- ---------------------------------------------------------------------
-- order_settlements
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  settlement_id INTEGER NOT NULL REFERENCES invoice_settlements(id) ON DELETE CASCADE,
  freelancer_amount REAL NOT NULL,
  manager_amount REAL NOT NULL DEFAULT 0,
  is_settled INTEGER NOT NULL DEFAULT 1,
  settled_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS settlement_id INTEGER;
ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS freelancer_amount REAL;
ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS manager_amount REAL DEFAULT 0;
ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS is_settled INTEGER DEFAULT 1;
ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS settled_at TEXT;
ALTER TABLE order_settlements ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_status_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by_role TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  automatic_transition INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS order_id INTEGER;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS from_status TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS to_status TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS changed_by INTEGER;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS changed_by_role TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS automatic_transition INTEGER DEFAULT 0;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- order_timeline_events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT,
  actor_name TEXT,
  metadata TEXT,
  importance TEXT DEFAULT 'normal',
  visible_to_client INTEGER NOT NULL DEFAULT 1,
  visible_to_freelancer INTEGER NOT NULL DEFAULT 1,
  visible_to_admin INTEGER NOT NULL DEFAULT 1,
  icon TEXT,
  color TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS order_id INTEGER;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS event_category TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS actor_id INTEGER;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS actor_role TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'normal';
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS visible_to_client INTEGER DEFAULT 1;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS visible_to_freelancer INTEGER DEFAULT 1;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS visible_to_admin INTEGER DEFAULT 1;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE order_timeline_events ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- password_reset_tokens
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS expires_at TEXT;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS used INTEGER DEFAULT 0;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- payment_requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  phone_number TEXT,
  transaction_reference TEXT,
  created_at TEXT NOT NULL,
  confirmed_at TEXT,
  confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT
);

ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS confirmed_at TEXT;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS confirmed_by INTEGER;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ---------------------------------------------------------------------
-- payment_transactions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  reason TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS payment_id INTEGER;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS balance_before REAL;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS balance_after REAL;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  status TEXT NOT NULL DEFAULT 'pending',
  mpesa_code TEXT,
  admin_verification_code TEXT,
  phone_number TEXT,
  mpesa_checkout_request_id TEXT,
  mpesa_merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  mpesa_transaction_date TEXT,
  mpesa_result_desc TEXT,
  paystack_reference TEXT,
  paystack_access_code TEXT,
  merchant_reference TEXT,
  order_tracking_id TEXT,
  confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
  confirmed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS freelancer_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mpesa';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_verification_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_transaction_date TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mpesa_result_desc TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paystack_access_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS merchant_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_tracking_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_by_admin INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- payout_requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payout_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  writer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  account_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TEXT NOT NULL,
  processed_at TEXT,
  processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  transaction_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS writer_id INTEGER;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS amount REAL;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS account_details TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS requested_at TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS processed_at TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS processed_by INTEGER;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- pending_registrations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  account_name TEXT,
  domain_id INTEGER,
  subject_ids TEXT,
  verification_code TEXT NOT NULL,
  code_expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS domain_id INTEGER;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS subject_ids TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS code_expires_at TEXT;
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- pricing_minimums
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_minimums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_type TEXT NOT NULL UNIQUE,
  min_cpp REAL NOT NULL,
  min_cps REAL,
  description TEXT,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  enforced_by TEXT DEFAULT 'system',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS min_cpp REAL;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS min_cps REAL;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS effective_from TEXT;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS effective_to TEXT;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS enforced_by TEXT DEFAULT 'system';
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE pricing_minimums ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rated_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  comment TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE ratings ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rated_user_id INTEGER;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rated_by_user_id INTEGER;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- revisions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  submitted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  revision_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review',
  sent_to_freelancer INTEGER NOT NULL DEFAULT 0,
  approved_by_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE revisions ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS submitted_by INTEGER;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review';
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS sent_to_freelancer INTEGER DEFAULT 0;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS approved_by_admin INTEGER DEFAULT 0;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE revisions ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- settings_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT NOT NULL,
  previous_type TEXT,
  new_type TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  change_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS setting_key TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS previous_value TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS new_value TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS previous_type TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS new_type TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS changed_by INTEGER;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS changed_by_name TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS change_reason TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE settings_history ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- submission_files
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS submission_id INTEGER;
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS uploaded_at TEXT;
ALTER TABLE submission_files ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  writer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS writer_id INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_type TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- system_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT,
  context TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- system_settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_by INTEGER;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- user_badges
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  badge_name TEXT,
  badge_icon TEXT,
  awarded_at TEXT NOT NULL,
  awarded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  description TEXT,
  created_at TEXT NOT NULL
);

ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS badge_id INTEGER;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS badge_name TEXT;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS badge_icon TEXT;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS awarded_at TEXT;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS awarded_by INTEGER;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- user_balance_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_balance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  change_amount REAL NOT NULL,
  change_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  notes TEXT,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS balance_before REAL;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS balance_after REAL;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS change_amount REAL;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS change_type TEXT;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS reference_id INTEGER;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS changed_by INTEGER;
ALTER TABLE user_balance_history ADD COLUMN IF NOT EXISTS created_at TEXT;

-- ---------------------------------------------------------------------
-- user_categories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS assigned_at TEXT;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS assigned_by INTEGER;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE user_categories ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- user_fines
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_fines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  fine_amount REAL NOT NULL,
  fine_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  balance_before_fine REAL NOT NULL,
  balance_after_fine REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  issued_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  issued_at TEXT NOT NULL,
  reversed_at TEXT,
  reversed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reversal_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS job_id INTEGER;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS fine_amount REAL;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS fine_type TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS balance_before_fine REAL;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS balance_after_fine REAL;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'applied';
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS issued_by INTEGER;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS issued_at TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS reversed_at TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS reversed_by INTEGER;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS reversal_reason TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE user_fines ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- user_stats
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_jobs_posted INTEGER NOT NULL DEFAULT 0,
  total_jobs_completed INTEGER NOT NULL DEFAULT 0,
  total_jobs_cancelled INTEGER NOT NULL DEFAULT 0,
  total_amount_earned REAL NOT NULL DEFAULT 0,
  total_amount_spent REAL NOT NULL DEFAULT 0,
  average_rating REAL,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  on_time_delivery INTEGER NOT NULL DEFAULT 0,
  late_delivery INTEGER NOT NULL DEFAULT 0,
  revisions_requested INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_jobs_posted INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_jobs_cancelled INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_amount_earned REAL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_amount_spent REAL DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS average_rating REAL;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS on_time_delivery INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS late_delivery INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS revisions_requested INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0,
  email_verified INTEGER NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  earned REAL NOT NULL DEFAULT 0,
  total_earnings REAL NOT NULL DEFAULT 0,
  rating REAL,
  rating_average REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  badge_list TEXT NOT NULL DEFAULT '[]',
  presence_status TEXT NOT NULL DEFAULT 'offline',
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  suspended_until TEXT,
  suspension_reason TEXT,
  blacklist_reason TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  total_earned REAL NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  completion_rate REAL,
  profile_picture_url TEXT,
  last_login_at TEXT,
  last_login_ip TEXT,
  last_login_device TEXT,
  login_count INTEGER NOT NULL DEFAULT 0,
  domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  account_name TEXT,
  assigned_manager_id INTEGER,
  freelancer_badge TEXT,
  client_tier TEXT DEFAULT 'basic',
  client_priority TEXT NOT NULL DEFAULT 'regular',
  payment_terms TEXT NOT NULL DEFAULT 'pod',
  skills_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone);

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS earned REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_average REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_list TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS presence_status TEXT DEFAULT 'offline';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earned REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_jobs INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS completion_rate REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_device TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_manager_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS freelancer_badge TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_tier TEXT DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_priority TEXT DEFAULT 'regular';
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'pod';
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- writer_balances
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS writer_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  writer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance REAL NOT NULL DEFAULT 0,
  pending_balance REAL NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

ALTER TABLE writer_balances ADD COLUMN IF NOT EXISTS writer_id INTEGER;
ALTER TABLE writer_balances ADD COLUMN IF NOT EXISTS available_balance REAL DEFAULT 0;
ALTER TABLE writer_balances ADD COLUMN IF NOT EXISTS pending_balance REAL DEFAULT 0;
ALTER TABLE writer_balances ADD COLUMN IF NOT EXISTS total_earned REAL DEFAULT 0;
ALTER TABLE writer_balances ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ---------------------------------------------------------------------
-- writer_tiers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS writer_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  min_rating REAL NOT NULL,
  min_jobs INTEGER NOT NULL,
  min_success_rate REAL NOT NULL,
  benefits TEXT,
  color TEXT,
  icon TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS min_rating REAL;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS min_jobs INTEGER;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS min_success_rate REAL;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE writer_tiers ADD COLUMN IF NOT EXISTS updated_at TEXT;
