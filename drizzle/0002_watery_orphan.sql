ALTER TABLE "adjustments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balance_ledger" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "available_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "available_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "pending_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "pending_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "reserved_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "reserved_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "total_earned" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "total_earned" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "total_withdrawn" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "total_withdrawn" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "assignment_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "assignment_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "delivery_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balances" ALTER COLUMN "delivery_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "bid_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "billing_invoice_items" ALTER COLUMN "unit_price" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "billing_invoice_items" ALTER COLUMN "unit_price" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "billing_invoice_items" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "billing_invoice_items" ALTER COLUMN "amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "billing_invoices" ALTER COLUMN "total_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "billing_invoices" ALTER COLUMN "total_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "client_freelancer_history" ALTER COLUMN "avg_rating" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "client_profiles" ALTER COLUMN "total_spent" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "client_profiles" ALTER COLUMN "total_spent" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "client_profiles" ALTER COLUMN "recurring_client_discount" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "client_profiles" ALTER COLUMN "recurring_client_discount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "editor_profiles" ALTER COLUMN "client_satisfaction_rate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "editor_profiles" ALTER COLUMN "client_satisfaction_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "freelancer_cpp_levels" ALTER COLUMN "cpp_non_technical" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "freelancer_cpp_levels" ALTER COLUMN "cpp_technical" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "freelancer_cpp_progress" ALTER COLUMN "progress_percentage" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "freelancer_cpp_progress" ALTER COLUMN "progress_percentage" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ALTER COLUMN "hourly_rate" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ALTER COLUMN "repeat_client_rate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ALTER COLUMN "repeat_client_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoice_settlements" ALTER COLUMN "settlement_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoice_settlements" ALTER COLUMN "balance_before_settlement" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoice_settlements" ALTER COLUMN "balance_after_settlement" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoice_settlements" ALTER COLUMN "balance_after_settlement" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "freelancer_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "admin_commission" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "manager_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "manager_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "company_fee" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "company_fee" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "client_cpp_at_invoice" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "manager_additional_included" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "manager_additional_included" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "client_bonus_included" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "client_bonus_included" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_earnings" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_earnings" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "freelancer_earnings" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "freelancer_earnings" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "admin_profit" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "admin_profit" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_assigned_fee" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_assigned_fee" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_delivery_fee" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_delivery_fee" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "base_cpp" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "effective_cpp" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "urgency_multiplier" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "urgency_multiplier" SET DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "calculated_price" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "client_cpp" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_additional" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "manager_additional" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "client_bonus" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "client_bonus" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status_total_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status_total_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "plagiarism_score" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "ai_detection_score" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "refund_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "refund_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "manager_earnings" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "managers" ALTER COLUMN "balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "managers" ALTER COLUMN "balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "managers" ALTER COLUMN "total_earnings" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "managers" ALTER COLUMN "total_earnings" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "order_additional_payments" ALTER COLUMN "additional_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_additional_payments" ALTER COLUMN "original_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_additional_payments" ALTER COLUMN "new_total_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_amount_adjustments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_amount_adjustments" ALTER COLUMN "previous_total" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_amount_adjustments" ALTER COLUMN "new_total" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_settlements" ALTER COLUMN "freelancer_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_settlements" ALTER COLUMN "manager_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_settlements" ALTER COLUMN "manager_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "payment_requests" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_transactions" ALTER COLUMN "balance_before" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_transactions" ALTER COLUMN "balance_after" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payout_requests" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "pricing_minimums" ALTER COLUMN "min_cpp" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "pricing_minimums" ALTER COLUMN "min_cps" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "user_balance_history" ALTER COLUMN "balance_before" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_balance_history" ALTER COLUMN "balance_after" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_balance_history" ALTER COLUMN "change_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_fines" ALTER COLUMN "fine_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_fines" ALTER COLUMN "balance_before_fine" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_fines" ALTER COLUMN "balance_after_fine" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "total_amount_earned" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "total_amount_earned" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "total_amount_spent" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "total_amount_spent" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "average_rating" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "earned" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "earned" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_earnings" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_earnings" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "rating" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "rating_average" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "rating_average" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_earned" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_earned" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_spent" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "total_spent" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "completion_rate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "writer_balances" ALTER COLUMN "available_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "writer_balances" ALTER COLUMN "available_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "writer_balances" ALTER COLUMN "pending_balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "writer_balances" ALTER COLUMN "pending_balance" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "writer_balances" ALTER COLUMN "total_earned" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "writer_balances" ALTER COLUMN "total_earned" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "writer_tiers" ALTER COLUMN "min_rating" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "writer_tiers" ALTER COLUMN "min_success_rate" SET DATA TYPE numeric(5, 2);