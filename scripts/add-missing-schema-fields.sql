-- =========================================
-- ADD MISSING TIMESTAMP FIELDS TO JOBS TABLE
-- =========================================
-- Run this directly in Turso CLI or dashboard
-- These fields are used by the new order flow system

-- Add accepted_at timestamp
ALTER TABLE jobs ADD COLUMN accepted_at TEXT;

-- Add assigned_at timestamp
ALTER TABLE jobs ADD COLUMN assigned_at TEXT;

-- Add submitted_at timestamp
ALTER TABLE jobs ADD COLUMN submitted_at TEXT;

-- Add delivered_at timestamp
ALTER TABLE jobs ADD COLUMN delivered_at TEXT;

-- Add approved_at timestamp
ALTER TABLE jobs ADD COLUMN approved_at TEXT;

-- Add paid_at timestamp
ALTER TABLE jobs ADD COLUMN paid_at TEXT;

-- Add completed_at timestamp
ALTER TABLE jobs ADD COLUMN completed_at TEXT;

-- Add freelancer acceptance tracking
ALTER TABLE jobs ADD COLUMN freelancer_accepted INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN freelancer_accepted_at TEXT;

-- Add freelancer rejection tracking
ALTER TABLE jobs ADD COLUMN freelancer_rejected INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN freelancer_rejected_at TEXT;

-- Add freelancer response pending flag
ALTER TABLE jobs ADD COLUMN freelancer_response_pending INTEGER DEFAULT 0;

-- Add final submission tracking
ALTER TABLE jobs ADD COLUMN final_submission_complete INTEGER DEFAULT 0;

-- =========================================
-- VERIFY CHANGES
-- =========================================
-- Run this to verify all columns were added:
-- PRAGMA table_info(jobs);

-- Expected new columns:
-- accepted_at
-- assigned_at
-- submitted_at
-- delivered_at
-- approved_at
-- paid_at
-- completed_at
-- freelancer_accepted
-- freelancer_accepted_at
-- freelancer_rejected
-- freelancer_rejected_at
-- freelancer_response_pending
-- final_submission_complete
