-- Migration: Fix Jobs Table - Add Missing Columns
-- Date: 2026-01-09
-- Description: Adds all missing columns to jobs table that were causing order creation failures
-- Safe to run multiple times (uses IF NOT EXISTS logic in ALTER TABLE)

-- Note: SQLite's ALTER TABLE doesn't support IF NOT EXISTS, so this is reference SQL.
-- Use the TypeScript script: npx tsx scripts/fix-jobs-table-schema.ts

-- User assignment tracking
ALTER TABLE jobs ADD COLUMN assigned_by_id INTEGER;
ALTER TABLE jobs ADD COLUMN delivered_by_id INTEGER;

-- Manager approval gate
ALTER TABLE jobs ADD COLUMN manager_approved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN manager_approved_at TEXT;
ALTER TABLE jobs ADD COLUMN manager_approval_notes TEXT;

-- Editor system (complete editor workflow)
ALTER TABLE jobs ADD COLUMN assigned_editor_id INTEGER;
ALTER TABLE jobs ADD COLUMN editor_status TEXT DEFAULT 'not_assigned';
ALTER TABLE jobs ADD COLUMN editor_approved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN editor_approved_at TEXT;
ALTER TABLE jobs ADD COLUMN editor_approval_notes TEXT;
ALTER TABLE jobs ADD COLUMN editor_notes TEXT;
ALTER TABLE jobs ADD COLUMN editor_requested_revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN editor_revision_notes TEXT;
ALTER TABLE jobs ADD COLUMN editor_assigned_at TEXT;
ALTER TABLE jobs ADD COLUMN editor_started_at TEXT;
ALTER TABLE jobs ADD COLUMN editor_completed_at TEXT;
ALTER TABLE jobs ADD COLUMN editor_claimed_at TEXT;
ALTER TABLE jobs ADD COLUMN editor_flagged INTEGER NOT NULL DEFAULT 0;

-- Escalation tracking
ALTER TABLE jobs ADD COLUMN escalation_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN last_escalation_at TEXT;

-- Client order placement enhancements
ALTER TABLE jobs ADD COLUMN client_notes TEXT;
ALTER TABLE jobs ADD COLUMN client_preferred_freelancer INTEGER;
ALTER TABLE jobs ADD COLUMN client_preference_type TEXT;
ALTER TABLE jobs ADD COLUMN urgency_level TEXT DEFAULT 'normal';
ALTER TABLE jobs ADD COLUMN complexity_level TEXT DEFAULT 'standard';

-- Activity timestamps
ALTER TABLE jobs ADD COLUMN submitted_to_client_at TEXT;
ALTER TABLE jobs ADD COLUMN client_first_viewed_at TEXT;
ALTER TABLE jobs ADD COLUMN last_client_activity_at TEXT;
ALTER TABLE jobs ADD COLUMN last_freelancer_activity_at TEXT;

-- Quality assurance metrics
ALTER TABLE jobs ADD COLUMN quality_score INTEGER;
ALTER TABLE jobs ADD COLUMN quality_notes TEXT;
ALTER TABLE jobs ADD COLUMN plagiarism_score REAL;
ALTER TABLE jobs ADD COLUMN ai_detection_score REAL;
ALTER TABLE jobs ADD COLUMN grammar_score INTEGER;

-- Enhanced revision tracking
ALTER TABLE jobs ADD COLUMN total_revision_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN client_revision_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN last_revision_requested_at TEXT;
ALTER TABLE jobs ADD COLUMN revision_deadline TEXT;

-- Communication tracking
ALTER TABLE jobs ADD COLUMN unread_client_messages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN unread_freelancer_messages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN unread_admin_messages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN last_message_at TEXT;

-- File upload tracking
ALTER TABLE jobs ADD COLUMN total_files_uploaded INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN client_files_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN freelancer_files_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN final_files_count INTEGER NOT NULL DEFAULT 0;

-- Cancellation tracking
ALTER TABLE jobs ADD COLUMN cancelled_at TEXT;
ALTER TABLE jobs ADD COLUMN cancelled_by INTEGER;
ALTER TABLE jobs ADD COLUMN cancellation_reason TEXT;
ALTER TABLE jobs ADD COLUMN cancellation_category TEXT;
ALTER TABLE jobs ADD COLUMN refund_issued INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN refund_amount REAL NOT NULL DEFAULT 0;

-- On-hold tracking
ALTER TABLE jobs ADD COLUMN on_hold_at TEXT;
ALTER TABLE jobs ADD COLUMN on_hold_by INTEGER;
ALTER TABLE jobs ADD COLUMN on_hold_reason TEXT;
ALTER TABLE jobs ADD COLUMN expected_resume_date TEXT;
ALTER TABLE jobs ADD COLUMN resumed_at TEXT;

-- Foreign key relationships (for reference - added via schema)
-- FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL
-- FOREIGN KEY (delivered_by_id) REFERENCES users(id) ON DELETE SET NULL
-- FOREIGN KEY (assigned_editor_id) REFERENCES users(id) ON DELETE SET NULL
-- FOREIGN KEY (client_preferred_freelancer) REFERENCES users(id) ON DELETE SET NULL
-- FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
-- FOREIGN KEY (on_hold_by) REFERENCES users(id) ON DELETE SET NULL

-- Indexes for performance (add if needed)
-- CREATE INDEX IF NOT EXISTS idx_jobs_assigned_by_id ON jobs(assigned_by_id);
-- CREATE INDEX IF NOT EXISTS idx_jobs_delivered_by_id ON jobs(delivered_by_id);
-- CREATE INDEX IF NOT EXISTS idx_jobs_assigned_editor_id ON jobs(assigned_editor_id);
-- CREATE INDEX IF NOT EXISTS idx_jobs_editor_status ON jobs(editor_status);
-- CREATE INDEX IF NOT EXISTS idx_jobs_escalation_level ON jobs(escalation_level);
-- CREATE INDEX IF NOT EXISTS idx_jobs_urgency_level ON jobs(urgency_level);
-- CREATE INDEX IF NOT EXISTS idx_jobs_complexity_level ON jobs(complexity_level);
