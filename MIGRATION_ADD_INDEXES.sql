-- Database Index Migration
-- Gap #16: Optimize database queries and add indexes
--
-- Run this migration to add indexes for improved query performance
-- Execute: sqlite3 your_database.db < MIGRATION_ADD_INDEXES.sql

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(assigned_manager_id);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer ON jobs(assigned_freelancer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_manager ON jobs(manager_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_client_status ON jobs(client_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer_status ON jobs(assigned_freelancer_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_manager_status ON jobs(manager_id, status);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_job ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_freelancer ON payments(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_job_messages_job ON job_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_sender ON job_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_created ON job_messages(created_at);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Manager assignments indexes
CREATE INDEX IF NOT EXISTS idx_manager_freelancers_manager ON manager_freelancers(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_freelancers_freelancer ON manager_freelancers(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_manager_freelancers_status ON manager_freelancers(status);
CREATE INDEX IF NOT EXISTS idx_manager_clients_manager ON manager_clients(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_clients_client ON manager_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_manager_clients_status ON manager_clients(status);

-- Verify indexes were created
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;

