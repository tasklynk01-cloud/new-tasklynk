-- Migration: Add centralized Paystack payment columns and webhook_events table
-- Safe, idempotent execution for PostgreSQL / Supabase

ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'website';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS purpose VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS authorization_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS callback_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paystack_transaction_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Indexes for payments
CREATE INDEX IF NOT EXISTS payments_paystack_ref_idx ON payments(paystack_reference);
CREATE INDEX IF NOT EXISTS payments_source_idx ON payments(source);

-- Webhook events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL DEFAULT 'paystack',
  event_type VARCHAR(100) NOT NULL,
  reference VARCHAR(255),
  payload JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'processed',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_id_idx ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS webhook_events_reference_idx ON webhook_events(reference);
