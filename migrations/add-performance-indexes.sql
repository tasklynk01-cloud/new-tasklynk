-- ========================================
-- PERFORMANCE INDEXES FOR ORDER MANAGEMENT SYSTEM
-- ========================================
-- This migration adds critical indexes for fast order queries
-- Supports efficient filtering by status, role assignments, and date ranges
-- Handles 1M+ orders efficiently

-- Indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_manager_id ON jobs(manager_id);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer_id ON jobs(assigned_freelancer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);

-- Composite index for common queries (status + date range)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at);

-- Index for manager-specific queries
CREATE INDEX IF NOT EXISTS idx_jobs_manager_status ON jobs(manager_id, status);

-- Index for freelancer-specific queries
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer_status ON jobs(assigned_freelancer_id, status);

-- Index for client-specific queries
CREATE INDEX IF NOT EXISTS idx_jobs_client_status ON jobs(client_id, status);

-- Index for deadline-based queries (urgent orders)
CREATE INDEX IF NOT EXISTS idx_jobs_status_deadline ON jobs(status, deadline);

-- Indexes for job_status_logs (audit trail queries)
CREATE INDEX IF NOT EXISTS idx_job_status_logs_job_id ON job_status_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_logs_created_at ON job_status_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_status_logs_new_status ON job_status_logs(new_status);

-- Indexes for internal_revisions (if table exists)
CREATE INDEX IF NOT EXISTS idx_internal_revisions_order_id ON internal_revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_internal_revisions_status ON internal_revisions(status);
CREATE INDEX IF NOT EXISTS idx_internal_revisions_assigned_to ON internal_revisions(assigned_to);

-- Indexes for order_files (file queries)
CREATE INDEX IF NOT EXISTS idx_order_files_job_id ON order_files(job_id);
CREATE INDEX IF NOT EXISTS idx_order_files_upload_type ON order_files(upload_type);

-- Indexes for payments (payment queries)
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);

-- Indexes for notifications (notification queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_job_id ON notifications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ========================================
-- VERIFICATION
-- ========================================
-- After running this migration, verify indexes with:
-- SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';

