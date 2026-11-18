-- Enhanced Messaging System Migration
-- Adds delivery tracking fields to job_messages table
-- Date: 2025-11-26

-- Add new columns to job_messages table
ALTER TABLE job_messages ADD COLUMN is_delivered INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE job_messages ADD COLUMN approved_at TEXT;
ALTER TABLE job_messages ADD COLUMN approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Set existing approved messages as delivered
UPDATE job_messages 
SET is_delivered = 1, 
    approved_at = created_at
WHERE admin_approved = 1;

-- Create index for faster delivery status queries
CREATE INDEX IF NOT EXISTS idx_job_messages_delivery 
ON job_messages(job_id, is_delivered, admin_approved);

-- Create index for sender queries (to fetch sender's own pending messages)
CREATE INDEX IF NOT EXISTS idx_job_messages_sender 
ON job_messages(sender_id, admin_approved, is_delivered);
