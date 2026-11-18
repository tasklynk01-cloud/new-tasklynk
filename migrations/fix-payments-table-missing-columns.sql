-- Migration: Fix payments table missing columns
-- Date: 2026-01-09
-- Purpose: Add all required columns to payments table for Paystack integration

PRAGMA foreign_keys = ON;

-- Add missing columns to payments table
-- Note: SQLite doesn't support adding NOT NULL columns with foreign keys in one step
-- We'll add them as nullable first, then handle defaults separately

-- Core payment fields
ALTER TABLE payments ADD COLUMN job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN client_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN amount REAL DEFAULT 0;
ALTER TABLE payments ADD COLUMN payment_method TEXT DEFAULT 'mpesa';
ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';

-- M-Pesa specific fields
ALTER TABLE payments ADD COLUMN mpesa_code TEXT;
ALTER TABLE payments ADD COLUMN admin_verification_code TEXT;
ALTER TABLE payments ADD COLUMN phone_number TEXT;
ALTER TABLE payments ADD COLUMN mpesa_checkout_request_id TEXT;
ALTER TABLE payments ADD COLUMN mpesa_merchant_request_id TEXT;
ALTER TABLE payments ADD COLUMN mpesa_receipt_number TEXT;
ALTER TABLE payments ADD COLUMN mpesa_transaction_date TEXT;
ALTER TABLE payments ADD COLUMN mpesa_result_desc TEXT;

-- Paystack specific fields
ALTER TABLE payments ADD COLUMN paystack_reference TEXT;
ALTER TABLE payments ADD COLUMN paystack_access_code TEXT;

-- Pesapal specific fields
ALTER TABLE payments ADD COLUMN merchant_reference TEXT;
ALTER TABLE payments ADD COLUMN order_tracking_id TEXT;

-- Admin confirmation fields
ALTER TABLE payments ADD COLUMN confirmed_by_admin INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN confirmed_at TEXT;

-- Timestamps
ALTER TABLE payments ADD COLUMN created_at TEXT DEFAULT '';
ALTER TABLE payments ADD COLUMN updated_at TEXT DEFAULT '';
