-- Production M-PESA Payment System Migration
-- Adds full Daraja production support, audit logs, and reconciliation tracking

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reference" varchar(100);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "order_id" integer REFERENCES "jobs"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "project_id" integer;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'mpesa' NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_reference" varchar(255);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "merchant_request_id" varchar(255);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "checkout_request_id" varchar(255);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "result_code" integer;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "result_description" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "raw_callback" jsonb;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "unmatched" boolean DEFAULT false NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reconciled" boolean DEFAULT false NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reconciled_at" timestamp;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reconciled_by" integer REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reconciliation_notes" text;

-- Indexes for fast lookup and idempotency
CREATE UNIQUE INDEX IF NOT EXISTS "payments_reference_unique_idx" ON "payments" ("reference") WHERE "reference" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "payments_checkout_req_id_idx" ON "payments" ("checkout_request_id");
CREATE INDEX IF NOT EXISTS "payments_mpesa_checkout_req_id_idx" ON "payments" ("mpesa_checkout_request_id");
CREATE INDEX IF NOT EXISTS "payments_mpesa_receipt_idx" ON "payments" ("mpesa_receipt_number");
CREATE INDEX IF NOT EXISTS "payments_unmatched_idx" ON "payments" ("unmatched");
CREATE INDEX IF NOT EXISTS "payments_provider_idx" ON "payments" ("provider");
CREATE INDEX IF NOT EXISTS "payments_order_id_idx" ON "payments" ("order_id");
CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments" ("user_id");

-- Payment Audit Logs table for tracking all payment lifecycle events
CREATE TABLE IF NOT EXISTS "payment_audit_logs" (
  "id" serial PRIMARY KEY,
  "payment_id" integer REFERENCES "payments"("id") ON DELETE CASCADE,
  "event" varchar(100) NOT NULL,
  "actor" varchar(100) DEFAULT 'system' NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_audit_logs_payment_id_idx" ON "payment_audit_logs" ("payment_id");
CREATE INDEX IF NOT EXISTS "payment_audit_logs_event_idx" ON "payment_audit_logs" ("event");
CREATE INDEX IF NOT EXISTS "payment_audit_logs_created_at_idx" ON "payment_audit_logs" ("created_at");
