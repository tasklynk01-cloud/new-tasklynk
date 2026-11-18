CREATE TYPE "public"."order_status_enum" AS ENUM('pending', 'accepted', 'assigned', 'in_progress', 'submitted', 'editing', 'delivered', 'approved', 'paid', 'cancelled', 'revision');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'confirmed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('admin', 'client', 'freelancer', 'manager', 'editor', 'account_owner');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('pending', 'active', 'approved', 'rejected', 'suspended', 'blacklisted');--> statement-breakpoint
CREATE TYPE "public"."work_type_enum" AS ENUM('writing', 'slides', 'technical', 'excel', 'other');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_account_name_unique" UNIQUE("account_name"),
	CONSTRAINT "accounts_contact_email_unique" UNIQUE("contact_email")
);
--> statement-breakpoint
CREATE TABLE "adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"user_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"type" varchar(50) NOT NULL,
	"reason" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" varchar(255) NOT NULL,
	"target_id" integer,
	"target_type" varchar(50) NOT NULL,
	"details" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_email" varchar(255),
	"user_role" varchar(50),
	"event_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(50) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"session_id" varchar(255),
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"criteria" jsonb NOT NULL,
	"category" varchar(50) NOT NULL,
	"color" varchar(20),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "balance_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer,
	"amount" numeric NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"available_balance" numeric DEFAULT '0' NOT NULL,
	"pending_balance" numeric DEFAULT '0' NOT NULL,
	"reserved_balance" numeric DEFAULT '0' NOT NULL,
	"total_earned" numeric DEFAULT '0' NOT NULL,
	"total_withdrawn" numeric DEFAULT '0' NOT NULL,
	"assignment_balance" numeric DEFAULT '0' NOT NULL,
	"delivery_balance" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balances_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"message" text,
	"bid_amount" numeric NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"job_id" integer,
	"order_number" varchar(50),
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"recipient_id" integer NOT NULL,
	"recipient_role" varchar(50) NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"mpesa_code" varchar(100),
	"merchant_reference" varchar(255),
	"order_tracking_id" varchar(255),
	"transaction_id" varchar(255),
	"payment_method" varchar(50),
	"pdf_url" text,
	"payment_reference" varchar(255),
	"sent_at" timestamp,
	"sent_by" integer,
	"confirmed_at" timestamp,
	"confirmed_by" integer,
	"paid_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "client_freelancer_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"completed_jobs_count" integer DEFAULT 1 NOT NULL,
	"last_worked_at" timestamp NOT NULL,
	"avg_rating" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_manager" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"manager_id" integer NOT NULL,
	"assigned_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_online_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"online_status_updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_online_status_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_name" varchar(255),
	"industry" varchar(100),
	"website" varchar(255),
	"tax_id" varchar(100),
	"business_registration" varchar(100),
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"preferred_payment_method" varchar(50),
	"automate_payments" boolean DEFAULT false,
	"total_jobs_posted" integer DEFAULT 0,
	"total_spent" numeric DEFAULT '0',
	"recurring_client_discount" numeric DEFAULT '0',
	"is_profile_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"sender_phone" varchar(50),
	"content" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"is_guest" boolean DEFAULT true NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"participant1_id" integer NOT NULL,
	"participant2_id" integer NOT NULL,
	"last_message_at" timestamp,
	"last_message_sender_id" integer,
	"last_message_preview" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_previews" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_url" text NOT NULL,
	"preview_pdf_path" text NOT NULL,
	"full_pdf_path" text NOT NULL,
	"total_pages" integer NOT NULL,
	"preview_pages" integer NOT NULL,
	"file_size" integer NOT NULL,
	"watermark_text" varchar(255) NOT NULL,
	"access_token" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_accessed_at" timestamp,
	"access_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "document_previews_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"max_users" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "editor_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"editor_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"assigned_at" timestamp NOT NULL,
	"review_started_at" timestamp,
	"approval_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approval_reason" text,
	"revisions_requested" boolean DEFAULT false NOT NULL,
	"revision_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"editor_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"is_latest" boolean DEFAULT true NOT NULL,
	"uploaded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_internal_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"editor_id" integer NOT NULL,
	"requested_at" timestamp NOT NULL,
	"reason" text NOT NULL,
	"issue_type" varchar(100) NOT NULL,
	"detailed_notes" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"sent_to_freelancer_at" timestamp,
	"resubmitted_at" timestamp,
	"completed_at" timestamp,
	"freelancer_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_role" varchar(50) NOT NULL,
	"receiver_id" integer NOT NULL,
	"receiver_role" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"message_type" varchar(50) DEFAULT 'text' NOT NULL,
	"file_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"specialization" varchar(100),
	"years_experience" integer,
	"languages" jsonb,
	"qualifications" jsonb,
	"areas_of_expertise" jsonb,
	"average_edits_per_order" integer DEFAULT 0,
	"orders_touched" integer DEFAULT 0,
	"client_satisfaction_rate" numeric DEFAULT '0',
	"is_profile_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "editor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sent_by" integer NOT NULL,
	"sent_to" varchar(255) NOT NULL,
	"recipient_type" varchar(50) NOT NULL,
	"recipient_count" integer NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"failed_recipients" text,
	"job_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"notification_type" varchar(100) NOT NULL,
	"sent_to" varchar(255) NOT NULL,
	"sent_at" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_upload_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"uploader_id" integer NOT NULL,
	"uploader_role" varchar(50) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_classification" varchar(50),
	"upload_endpoint" varchar(255) NOT NULL,
	"upload_status" varchar(50) NOT NULL,
	"cloudinary_url" text,
	"error_message" text,
	"error_code" varchar(50),
	"request_payload" jsonb,
	"response_payload" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_cpp_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" integer NOT NULL,
	"level_name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"completed_orders_required" integer NOT NULL,
	"cpp_non_technical" numeric NOT NULL,
	"cpp_technical" numeric NOT NULL,
	"order_count_in_level" integer NOT NULL,
	"progress_bar_color" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_cpp_levels_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE "freelancer_cpp_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"total_completed_orders" integer DEFAULT 0 NOT NULL,
	"orders_in_current_level" integer DEFAULT 0 NOT NULL,
	"progress_percentage" numeric DEFAULT '0' NOT NULL,
	"next_level_orders_required" integer DEFAULT 3 NOT NULL,
	"is_work_type_specialized" boolean DEFAULT false NOT NULL,
	"last_progress_update" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_cpp_progress_freelancer_id_unique" UNIQUE("freelancer_id")
);
--> statement-breakpoint
CREATE TABLE "freelancer_online_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"current_jobs_count" integer DEFAULT 0 NOT NULL,
	"online_status_updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_online_status_freelancer_id_unique" UNIQUE("freelancer_id")
);
--> statement-breakpoint
CREATE TABLE "freelancer_order_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"response_status" varchar(50) NOT NULL,
	"response_at" timestamp,
	"rejection_reason" text,
	"response_time_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_tier_id" integer,
	"bio" text,
	"skills" jsonb,
	"certifications" jsonb,
	"portfolio" jsonb,
	"hourly_rate" numeric,
	"languages" jsonb,
	"timezone" varchar(100),
	"availability" varchar(50) DEFAULT 'part-time',
	"available_days" jsonb,
	"available_time_start" varchar(10),
	"available_time_end" varchar(10),
	"response_time" integer,
	"total_clients" integer DEFAULT 0,
	"repeat_client_rate" numeric DEFAULT '0',
	"jobs_completed" integer DEFAULT 0,
	"is_profile_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "freelancer_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_services_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "freelancer_services_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"other_service" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_software" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_software_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "freelancer_software_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"software_id" integer NOT NULL,
	"other_software" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_subject_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelancer_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "google_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "google_accounts_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "internal_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"assigned_to" integer,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_by_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invoice_settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_type" varchar(50) NOT NULL,
	"settlement_amount" numeric NOT NULL,
	"orders_settled" integer NOT NULL,
	"order_ids" jsonb NOT NULL,
	"balance_before_settlement" numeric NOT NULL,
	"balance_after_settlement" numeric DEFAULT '0' NOT NULL,
	"notes" text,
	"settled_by" integer NOT NULL,
	"settled_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"freelancer_id" integer,
	"invoice_number" varchar(100) NOT NULL,
	"amount" numeric NOT NULL,
	"freelancer_amount" numeric NOT NULL,
	"admin_commission" numeric NOT NULL,
	"manager_amount" numeric DEFAULT '0' NOT NULL,
	"company_fee" numeric DEFAULT '0' NOT NULL,
	"client_cpp_at_invoice" numeric,
	"manager_additional_included" numeric DEFAULT '0' NOT NULL,
	"client_bonus_included" numeric DEFAULT '0' NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"billing_invoice_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "job_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"upload_type" varchar(50) NOT NULL,
	"attachment_category" varchar(50),
	"scheduled_deletion_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"message" text NOT NULL,
	"message_type" varchar(50) DEFAULT 'text' NOT NULL,
	"admin_approved" boolean DEFAULT false NOT NULL,
	"is_delivered" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_status_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"old_status" varchar(50),
	"new_status" varchar(50) NOT NULL,
	"changed_by" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_id" varchar(50) NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"order_id" varchar(100) NOT NULL,
	"account_order_number" varchar(100),
	"account_linked" boolean DEFAULT false NOT NULL,
	"client_id" integer NOT NULL,
	"assigned_freelancer_id" integer,
	"manager_id" integer,
	"assigned_by_id" integer,
	"delivered_by_id" integer,
	"title" varchar(500) NOT NULL,
	"instructions" text NOT NULL,
	"work_type" varchar(50) NOT NULL,
	"pages" integer,
	"slides" integer,
	"problems" integer,
	"amount" numeric NOT NULL,
	"manager_earnings" numeric DEFAULT '0' NOT NULL,
	"freelancer_earnings" numeric DEFAULT '0' NOT NULL,
	"admin_profit" numeric DEFAULT '0' NOT NULL,
	"manager_assigned_fee" numeric DEFAULT '0' NOT NULL,
	"manager_delivery_fee" numeric DEFAULT '0' NOT NULL,
	"deadline" timestamp NOT NULL,
	"actual_deadline" timestamp NOT NULL,
	"freelancer_deadline" timestamp NOT NULL,
	"request_draft" boolean DEFAULT false NOT NULL,
	"draft_delivered" boolean DEFAULT false NOT NULL,
	"request_printable_sources" boolean DEFAULT false NOT NULL,
	"single_spaced" boolean DEFAULT false NOT NULL,
	"base_cpp" numeric,
	"effective_cpp" numeric,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"manager_approved" boolean DEFAULT false NOT NULL,
	"manager_approved_at" timestamp,
	"manager_approval_notes" text,
	"assigned_editor_id" integer,
	"editor_status" varchar(50) DEFAULT 'not_assigned',
	"editor_approved" boolean DEFAULT false NOT NULL,
	"editor_approved_at" timestamp,
	"editor_approval_notes" text,
	"editor_notes" text,
	"editor_requested_revision" boolean DEFAULT false NOT NULL,
	"editor_revision_notes" text,
	"editor_assigned_at" timestamp,
	"editor_started_at" timestamp,
	"editor_completed_at" timestamp,
	"editor_claimed_at" timestamp,
	"editor_flagged" boolean DEFAULT false NOT NULL,
	"admin_approved" boolean DEFAULT false NOT NULL,
	"client_approved" boolean DEFAULT false NOT NULL,
	"approved_by_client_at" timestamp,
	"revision_requested" boolean DEFAULT false NOT NULL,
	"revision_notes" text,
	"payment_confirmed" boolean DEFAULT false NOT NULL,
	"paid_order_confirmed_at" timestamp,
	"invoice_generated" boolean DEFAULT false NOT NULL,
	"client_rating" integer,
	"writer_rating" integer,
	"review_comment" text,
	"placement_priority" integer DEFAULT 0 NOT NULL,
	"urgency_multiplier" numeric DEFAULT '1.0' NOT NULL,
	"calculated_price" numeric,
	"is_real_order" boolean DEFAULT true NOT NULL,
	"requires_reports" boolean DEFAULT true NOT NULL,
	"final_submission_complete" boolean DEFAULT false NOT NULL,
	"revision_submission_complete" boolean DEFAULT false NOT NULL,
	"client_cpp" numeric,
	"client_cpp_confirmed" boolean DEFAULT false NOT NULL,
	"service_type" varchar(50) DEFAULT 'writing_page',
	"manager_additional" numeric DEFAULT '0' NOT NULL,
	"manager_additional_note" text,
	"manager_additional_status" varchar(50) DEFAULT 'none',
	"client_bonus" numeric DEFAULT '0' NOT NULL,
	"status_total_amount" numeric DEFAULT '0' NOT NULL,
	"cpp_payment_status" varchar(50) DEFAULT 'unpaid',
	"last_amount_update_at" timestamp,
	"freelancer_accepted" boolean DEFAULT false NOT NULL,
	"freelancer_accepted_at" timestamp,
	"freelancer_rejected" boolean DEFAULT false NOT NULL,
	"freelancer_rejected_at" timestamp,
	"freelancer_rejection_reason" text,
	"freelancer_response_pending" boolean DEFAULT false NOT NULL,
	"accepted_at" timestamp,
	"assigned_at" timestamp,
	"submitted_at" timestamp,
	"delivered_at" timestamp,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"completed_at" timestamp,
	"is_invoiced" boolean DEFAULT false NOT NULL,
	"order_type" varchar(50),
	"invoiced_at" timestamp,
	"has_open_internal_revision" boolean DEFAULT false NOT NULL,
	"internal_revision_count" integer DEFAULT 0 NOT NULL,
	"client_requested_revision" boolean DEFAULT false NOT NULL,
	"escalation_level" integer DEFAULT 0 NOT NULL,
	"last_escalation_at" timestamp,
	"client_notes" text,
	"client_preferred_freelancer" integer,
	"client_preference_type" varchar(50),
	"urgency_level" varchar(50) DEFAULT 'normal',
	"complexity_level" varchar(50) DEFAULT 'standard',
	"submitted_to_client_at" timestamp,
	"client_first_viewed_at" timestamp,
	"last_client_activity_at" timestamp,
	"last_freelancer_activity_at" timestamp,
	"quality_score" integer,
	"quality_notes" text,
	"plagiarism_score" numeric,
	"ai_detection_score" numeric,
	"grammar_score" integer,
	"total_revision_count" integer DEFAULT 0 NOT NULL,
	"client_revision_count" integer DEFAULT 0 NOT NULL,
	"last_revision_requested_at" timestamp,
	"revision_deadline" timestamp,
	"unread_client_messages" integer DEFAULT 0 NOT NULL,
	"unread_freelancer_messages" integer DEFAULT 0 NOT NULL,
	"unread_admin_messages" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"total_files_uploaded" integer DEFAULT 0 NOT NULL,
	"client_files_count" integer DEFAULT 0 NOT NULL,
	"freelancer_files_count" integer DEFAULT 0 NOT NULL,
	"final_files_count" integer DEFAULT 0 NOT NULL,
	"cancelled_at" timestamp,
	"cancelled_by" integer,
	"cancellation_reason" text,
	"cancellation_category" varchar(50),
	"refund_issued" boolean DEFAULT false NOT NULL,
	"refund_amount" numeric DEFAULT '0' NOT NULL,
	"on_hold_at" timestamp,
	"on_hold_by" integer,
	"on_hold_reason" text,
	"expected_resume_date" timestamp,
	"resumed_at" timestamp,
	"metadata" jsonb,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_display_id_unique" UNIQUE("display_id"),
	CONSTRAINT "jobs_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "jobs_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "manager_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"assigned_by" integer,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"notes" text,
	"assigned_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"earning_type" varchar(50) NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_freelancers" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"assigned_by" integer,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"notes" text,
	"assigned_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manager_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'manager',
	"status" varchar(50) DEFAULT 'pending',
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp,
	CONSTRAINT "manager_invitations_email_unique" UNIQUE("email"),
	CONSTRAINT "manager_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "manager_online_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" integer NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"online_status_updated_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manager_online_status_manager_id_unique" UNIQUE("manager_id")
);
--> statement-breakpoint
CREATE TABLE "managers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"phone" varchar(50),
	"balance" numeric DEFAULT '0' NOT NULL,
	"total_earnings" numeric DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "managers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "memo_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"memo_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" timestamp NOT NULL,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memo_reads_new" (
	"id" serial PRIMARY KEY NOT NULL,
	"memo_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"target_role" varchar(50) NOT NULL,
	"priority" varchar(50) DEFAULT 'normal' NOT NULL,
	"requires_acknowledgement" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"job_id" integer,
	"content" text NOT NULL,
	"file_url" text,
	"admin_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer,
	"type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_id" integer,
	"related_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_additional_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"additional_amount" numeric NOT NULL,
	"reason" text NOT NULL,
	"original_amount" numeric NOT NULL,
	"new_total_amount" numeric NOT NULL,
	"added_by" integer NOT NULL,
	"added_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_amount_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"changed_by" integer,
	"change_type" varchar(100) NOT NULL,
	"amount" numeric NOT NULL,
	"previous_total" numeric,
	"new_total" numeric,
	"reason" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_role" varchar(50) NOT NULL,
	"display_sender_name" varchar(255),
	"display_sender_role" varchar(50),
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"chat_space" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"uploaded_by_role" varchar(50),
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_classification" varchar(50) DEFAULT 'other' NOT NULL,
	"notes" text,
	"version_number" integer DEFAULT 1 NOT NULL,
	"upload_status" varchar(50) DEFAULT 'completed' NOT NULL,
	"upload_progress" integer DEFAULT 100 NOT NULL,
	"upload_error" text,
	"verified_by" integer,
	"verified_at" timestamp,
	"verification_status" varchar(50) DEFAULT 'pending',
	"verification_notes" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_by" integer,
	"deleted_at" timestamp,
	"deletion_reason" text,
	"replaced_by" integer,
	"ip_address" varchar(50),
	"user_agent" text,
	"cloudinary_public_id" varchar(255),
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_downloaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_files_new" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"action" varchar(255) NOT NULL,
	"old_status" varchar(50),
	"new_status" varchar(50),
	"actor_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"revision_type" varchar(50) NOT NULL,
	"requested_by" integer NOT NULL,
	"assigned_to" integer,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"files_json" jsonb DEFAULT '[]',
	"freelancer_response" text,
	"reviewer_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"closed_by" integer
);
--> statement-breakpoint
CREATE TABLE "order_settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"settlement_id" integer NOT NULL,
	"freelancer_amount" numeric NOT NULL,
	"manager_amount" numeric DEFAULT '0' NOT NULL,
	"is_settled" boolean DEFAULT true NOT NULL,
	"settled_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_settlements_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"from_status" varchar(50),
	"to_status" varchar(50) NOT NULL,
	"changed_by" integer NOT NULL,
	"changed_by_role" varchar(50) NOT NULL,
	"reason" text,
	"notes" text,
	"automatic_transition" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"submission_type" varchar(50) NOT NULL,
	"submission_status" varchar(50) NOT NULL,
	"files_submitted" integer DEFAULT 0 NOT NULL,
	"has_final_document" boolean DEFAULT false NOT NULL,
	"has_plagiarism_report" boolean DEFAULT false NOT NULL,
	"has_ai_report" boolean DEFAULT false NOT NULL,
	"checklist_completed" boolean DEFAULT false NOT NULL,
	"submission_notes" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"review_status" varchar(50),
	"submitted_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_timeline_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_category" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"actor_id" integer,
	"actor_role" varchar(50),
	"actor_name" varchar(255),
	"metadata" jsonb,
	"importance" varchar(50) DEFAULT 'normal',
	"visible_to_client" boolean DEFAULT true NOT NULL,
	"visible_to_freelancer" boolean DEFAULT true NOT NULL,
	"visible_to_admin" boolean DEFAULT true NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"phone_number" varchar(50),
	"transaction_reference" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"confirmed_by" integer,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"transaction_type" varchar(100) NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"balance_before" numeric NOT NULL,
	"balance_after" numeric NOT NULL,
	"status" varchar(50) DEFAULT 'completed' NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"client_id" integer NOT NULL,
	"freelancer_id" integer,
	"amount" numeric NOT NULL,
	"payment_method" varchar(50) DEFAULT 'mpesa' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"mpesa_code" varchar(100),
	"admin_verification_code" varchar(100),
	"phone_number" varchar(50),
	"mpesa_checkout_request_id" varchar(255),
	"mpesa_merchant_request_id" varchar(255),
	"mpesa_receipt_number" varchar(255),
	"mpesa_transaction_date" varchar(100),
	"mpesa_result_desc" text,
	"paystack_reference" varchar(255),
	"paystack_access_code" varchar(255),
	"merchant_reference" varchar(255),
	"order_tracking_id" varchar(255),
	"confirmed_by_admin" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp,
	"currency" varchar(10) DEFAULT 'KES',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments_new" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"client_id" integer NOT NULL,
	"freelancer_id" integer,
	"amount" numeric NOT NULL,
	"payment_method" varchar(50) DEFAULT 'mpesa' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"writer_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"method" varchar(50) NOT NULL,
	"account_details" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"processed_by" integer,
	"rejection_reason" text,
	"transaction_reference" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"account_name" varchar(255),
	"domain_id" integer,
	"subject_ids" text,
	"verification_code" varchar(50) NOT NULL,
	"code_expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_registrations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pricing_minimums" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_type" varchar(100) NOT NULL,
	"min_cpp" numeric NOT NULL,
	"min_cps" numeric,
	"description" text,
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"enforced_by" varchar(50) DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_minimums_service_type_unique" UNIQUE("service_type")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"rater_id" integer NOT NULL,
	"rated_user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"submitted_by" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"revision_notes" text,
	"status" varchar(50) DEFAULT 'pending_review' NOT NULL,
	"sent_to_freelancer" boolean DEFAULT false NOT NULL,
	"approved_by_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"permissions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"previous_value" text,
	"new_value" text NOT NULL,
	"previous_type" varchar(50),
	"new_type" varchar(50) NOT NULL,
	"changed_by" integer,
	"changed_by_name" varchar(255),
	"change_reason" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"uploaded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"writer_id" integer NOT NULL,
	"submission_type" varchar(50) NOT NULL,
	"content" text,
	"word_count" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"user_id" integer,
	"action" varchar(255),
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"badge_name" varchar(100),
	"badge_icon" varchar(50),
	"awarded_at" timestamp NOT NULL,
	"awarded_by" integer,
	"reason" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_balance_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance_before" numeric NOT NULL,
	"balance_after" numeric NOT NULL,
	"change_amount" numeric NOT NULL,
	"change_type" varchar(100) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"notes" text,
	"changed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"assigned_at" timestamp NOT NULL,
	"assigned_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_fines" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_type" varchar(50) NOT NULL,
	"job_id" integer,
	"fine_amount" numeric NOT NULL,
	"fine_type" varchar(100) NOT NULL,
	"reason" text NOT NULL,
	"balance_before_fine" numeric NOT NULL,
	"balance_after_fine" numeric NOT NULL,
	"status" varchar(50) DEFAULT 'applied' NOT NULL,
	"issued_by" integer NOT NULL,
	"issued_at" timestamp NOT NULL,
	"reversed_at" timestamp,
	"reversed_by" integer,
	"reversal_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_jobs_posted" integer DEFAULT 0 NOT NULL,
	"total_jobs_completed" integer DEFAULT 0 NOT NULL,
	"total_jobs_cancelled" integer DEFAULT 0 NOT NULL,
	"total_amount_earned" numeric DEFAULT '0' NOT NULL,
	"total_amount_spent" numeric DEFAULT '0' NOT NULL,
	"average_rating" numeric,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"on_time_delivery" integer DEFAULT 0 NOT NULL,
	"late_delivery" integer DEFAULT 0 NOT NULL,
	"revisions_requested" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subjects_new" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_id" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"role_id" integer DEFAULT 2 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"balance" numeric DEFAULT '0' NOT NULL,
	"earned" numeric DEFAULT '0' NOT NULL,
	"total_earnings" numeric DEFAULT '0' NOT NULL,
	"rating" numeric,
	"rating_average" numeric DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"badge_list" text DEFAULT '[]' NOT NULL,
	"presence_status" varchar(50) DEFAULT 'offline' NOT NULL,
	"phone" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"suspended_until" timestamp,
	"suspension_reason" text,
	"blacklist_reason" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"total_earned" numeric DEFAULT '0' NOT NULL,
	"total_spent" numeric DEFAULT '0' NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"completion_rate" numeric,
	"profile_picture_url" text,
	"last_login_at" timestamp,
	"last_login_ip" varchar(50),
	"last_login_device" text,
	"login_count" integer DEFAULT 0 NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"two_factor_backup_codes" text,
	"two_factor_verified_at" timestamp,
	"domain_id" integer,
	"account_id" integer,
	"account_name" text,
	"assigned_manager_id" integer,
	"freelancer_badge" text,
	"client_tier" varchar(50) DEFAULT 'basic',
	"client_priority" varchar(50) DEFAULT 'regular' NOT NULL,
	"payment_terms" varchar(50) DEFAULT 'pod' NOT NULL,
	"skills_completed" boolean DEFAULT false NOT NULL,
	"google_id" varchar(255),
	"avatar_url" text,
	"auth_provider" varchar(50) DEFAULT 'local',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_display_id_unique" UNIQUE("display_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "writer_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"writer_id" integer NOT NULL,
	"available_balance" numeric DEFAULT '0' NOT NULL,
	"pending_balance" numeric DEFAULT '0' NOT NULL,
	"total_earned" numeric DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writer_balances_writer_id_unique" UNIQUE("writer_id")
);
--> statement-breakpoint
CREATE TABLE "writer_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_rating" numeric NOT NULL,
	"min_jobs" integer NOT NULL,
	"min_success_rate" numeric NOT NULL,
	"benefits" jsonb,
	"color" varchar(20),
	"icon" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writer_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_ledger" ADD CONSTRAINT "balance_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_ledger" ADD CONSTRAINT "balance_ledger_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."billing_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_freelancer_history" ADD CONSTRAINT "client_freelancer_history_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_freelancer_history" ADD CONSTRAINT "client_freelancer_history_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_manager" ADD CONSTRAINT "client_manager_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_manager" ADD CONSTRAINT "client_manager_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_online_status" ADD CONSTRAINT "client_online_status_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1_id_users_id_fk" FOREIGN KEY ("participant1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant2_id_users_id_fk" FOREIGN KEY ("participant2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_last_message_sender_id_users_id_fk" FOREIGN KEY ("last_message_sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_previews" ADD CONSTRAINT "document_previews_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_previews" ADD CONSTRAINT "document_previews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_assignments" ADD CONSTRAINT "editor_assignments_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_assignments" ADD CONSTRAINT "editor_assignments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_files" ADD CONSTRAINT "editor_files_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_files" ADD CONSTRAINT "editor_files_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_internal_revisions" ADD CONSTRAINT "editor_internal_revisions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_internal_revisions" ADD CONSTRAINT "editor_internal_revisions_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_internal_revisions" ADD CONSTRAINT "editor_internal_revisions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_messages" ADD CONSTRAINT "editor_messages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_messages" ADD CONSTRAINT "editor_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_messages" ADD CONSTRAINT "editor_messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_profiles" ADD CONSTRAINT "editor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_upload_audit_log" ADD CONSTRAINT "file_upload_audit_log_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_upload_audit_log" ADD CONSTRAINT "file_upload_audit_log_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_cpp_progress" ADD CONSTRAINT "freelancer_cpp_progress_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_online_status" ADD CONSTRAINT "freelancer_online_status_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_order_responses" ADD CONSTRAINT "freelancer_order_responses_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_order_responses" ADD CONSTRAINT "freelancer_order_responses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_current_tier_id_writer_tiers_id_fk" FOREIGN KEY ("current_tier_id") REFERENCES "public"."writer_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_services_map" ADD CONSTRAINT "freelancer_services_map_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_services_map" ADD CONSTRAINT "freelancer_services_map_service_id_freelancer_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."freelancer_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_software_map" ADD CONSTRAINT "freelancer_software_map_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_software_map" ADD CONSTRAINT "freelancer_software_map_software_id_freelancer_software_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."freelancer_software"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_subject_map" ADD CONSTRAINT "freelancer_subject_map_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_subject_map" ADD CONSTRAINT "freelancer_subject_map_subject_id_freelancer_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."freelancer_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_revisions" ADD CONSTRAINT "internal_revisions_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_revisions" ADD CONSTRAINT "internal_revisions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_revisions" ADD CONSTRAINT "internal_revisions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_settlements" ADD CONSTRAINT "invoice_settlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_settlements" ADD CONSTRAINT "invoice_settlements_settled_by_users_id_fk" FOREIGN KEY ("settled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_invoice_id_billing_invoices_id_fk" FOREIGN KEY ("billing_invoice_id") REFERENCES "public"."billing_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_attachments" ADD CONSTRAINT "job_attachments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_attachments" ADD CONSTRAINT "job_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_logs" ADD CONSTRAINT "job_status_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_status_logs" ADD CONSTRAINT "job_status_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_freelancer_id_users_id_fk" FOREIGN KEY ("assigned_freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_delivered_by_id_users_id_fk" FOREIGN KEY ("delivered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_editor_id_users_id_fk" FOREIGN KEY ("assigned_editor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_preferred_freelancer_users_id_fk" FOREIGN KEY ("client_preferred_freelancer") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_on_hold_by_users_id_fk" FOREIGN KEY ("on_hold_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_clients" ADD CONSTRAINT "manager_clients_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_clients" ADD CONSTRAINT "manager_clients_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_clients" ADD CONSTRAINT "manager_clients_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_earnings" ADD CONSTRAINT "manager_earnings_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_earnings" ADD CONSTRAINT "manager_earnings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_freelancers" ADD CONSTRAINT "manager_freelancers_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_freelancers" ADD CONSTRAINT "manager_freelancers_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_freelancers" ADD CONSTRAINT "manager_freelancers_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_invitations" ADD CONSTRAINT "manager_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_online_status" ADD CONSTRAINT "manager_online_status_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managers" ADD CONSTRAINT "managers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memo_reads" ADD CONSTRAINT "memo_reads_memo_id_memos_id_fk" FOREIGN KEY ("memo_id") REFERENCES "public"."memos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memo_reads" ADD CONSTRAINT "memo_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memo_reads_new" ADD CONSTRAINT "memo_reads_new_memo_id_memos_id_fk" FOREIGN KEY ("memo_id") REFERENCES "public"."memos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memo_reads_new" ADD CONSTRAINT "memo_reads_new_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_additional_payments" ADD CONSTRAINT "order_additional_payments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_additional_payments" ADD CONSTRAINT "order_additional_payments_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_additional_payments" ADD CONSTRAINT "order_additional_payments_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_amount_adjustments" ADD CONSTRAINT "order_amount_adjustments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_amount_adjustments" ADD CONSTRAINT "order_amount_adjustments_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_amount_adjustments" ADD CONSTRAINT "order_amount_adjustments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_chat_messages" ADD CONSTRAINT "order_chat_messages_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_chat_messages" ADD CONSTRAINT "order_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files_new" ADD CONSTRAINT "order_files_new_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_files_new" ADD CONSTRAINT "order_files_new_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_revisions" ADD CONSTRAINT "order_revisions_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_revisions" ADD CONSTRAINT "order_revisions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_revisions" ADD CONSTRAINT "order_revisions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_revisions" ADD CONSTRAINT "order_revisions_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_settlements" ADD CONSTRAINT "order_settlements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_settlements" ADD CONSTRAINT "order_settlements_settlement_id_invoice_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."invoice_settlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_submissions" ADD CONSTRAINT "order_submissions_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_submissions" ADD CONSTRAINT "order_submissions_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_submissions" ADD CONSTRAINT "order_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_timeline_events" ADD CONSTRAINT "order_timeline_events_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_timeline_events" ADD CONSTRAINT "order_timeline_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments_new" ADD CONSTRAINT "payments_new_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments_new" ADD CONSTRAINT "payments_new_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments_new" ADD CONSTRAINT "payments_new_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_writer_id_users_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_order_id_jobs_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rated_user_id_users_id_fk" FOREIGN KEY ("rated_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_history" ADD CONSTRAINT "settings_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_writer_id_users_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balance_history" ADD CONSTRAINT "user_balance_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_balance_history" ADD CONSTRAINT "user_balance_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fines" ADD CONSTRAINT "user_fines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fines" ADD CONSTRAINT "user_fines_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fines" ADD CONSTRAINT "user_fines_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fines" ADD CONSTRAINT "user_fines_reversed_by_users_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects" ADD CONSTRAINT "user_subjects_subject_id_freelancer_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."freelancer_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects_new" ADD CONSTRAINT "user_subjects_new_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subjects_new" ADD CONSTRAINT "user_subjects_new_subject_id_freelancer_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."freelancer_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writer_balances" ADD CONSTRAINT "writer_balances_writer_id_users_id_fk" FOREIGN KEY ("writer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_freelancer_unique" ON "client_freelancer_history" USING btree ("client_id","freelancer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_manager_client_manager_unique" ON "client_manager" USING btree ("client_id","manager_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_email_role_unique" ON "invitations" USING btree ("email","role");--> statement-breakpoint
CREATE INDEX "jobs_client_id_idx" ON "jobs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "jobs_freelancer_id_idx" ON "jobs" USING btree ("assigned_freelancer_id");--> statement-breakpoint
CREATE INDEX "jobs_manager_id_idx" ON "jobs" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "manager_client_unique" ON "manager_clients" USING btree ("manager_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "manager_freelancer_unique" ON "manager_freelancers" USING btree ("manager_id","freelancer_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "order_files_order_id_idx" ON "order_files" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_files_uploaded_by_idx" ON "order_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "payments_client_id_idx" ON "payments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_subjects_unique" ON "user_subjects" USING btree ("user_id","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");