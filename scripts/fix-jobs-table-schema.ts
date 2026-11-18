#!/usr/bin/env tsx
/**
 * Fix Jobs Table Schema - Add Missing Columns
 * 
 * This script checks for missing columns in the jobs table and adds them.
 * Safe to run multiple times - only adds columns that don't exist.
 * 
 * Usage: npx tsx scripts/fix-jobs-table-schema.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TURSO_CONNECTION_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_CONNECTION_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   TURSO_CONNECTION_URL:', TURSO_CONNECTION_URL ? '✓' : '✗');
  console.error('   TURSO_AUTH_TOKEN:', TURSO_AUTH_TOKEN ? '✓' : '✗');
  process.exit(1);
}

const client = createClient({
  url: TURSO_CONNECTION_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Define ALL columns that should exist in jobs table
const REQUIRED_COLUMNS = [
  // Core identification
  { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL' },
  { name: 'display_id', type: 'TEXT NOT NULL' },
  { name: 'order_number', type: 'TEXT NOT NULL' },
  { name: 'order_id', type: 'TEXT NOT NULL' },
  
  // Account linking
  { name: 'account_order_number', type: 'TEXT' },
  { name: 'account_linked', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // User relationships
  { name: 'client_id', type: 'INTEGER NOT NULL' },
  { name: 'assigned_freelancer_id', type: 'INTEGER' },
  { name: 'manager_id', type: 'INTEGER' },
  { name: 'assigned_by_id', type: 'INTEGER' },
  { name: 'delivered_by_id', type: 'INTEGER' },
  
  // Order details
  { name: 'title', type: 'TEXT NOT NULL' },
  { name: 'instructions', type: 'TEXT NOT NULL' },
  { name: 'work_type', type: 'TEXT NOT NULL' },
  
  // Quantities
  { name: 'pages', type: 'INTEGER' },
  { name: 'slides', type: 'INTEGER' },
  { name: 'problems', type: 'INTEGER' },
  
  // Financial
  { name: 'amount', type: 'REAL NOT NULL' },
  { name: 'manager_earnings', type: 'REAL NOT NULL DEFAULT 0' },
  { name: 'freelancer_earnings', type: 'REAL NOT NULL DEFAULT 0' },
  { name: 'admin_profit', type: 'REAL NOT NULL DEFAULT 0' },
  { name: 'manager_assigned_fee', type: 'REAL NOT NULL DEFAULT 0' },
  { name: 'manager_delivery_fee', type: 'REAL NOT NULL DEFAULT 0' },
  
  // Deadlines
  { name: 'deadline', type: 'TEXT NOT NULL' },
  { name: 'actual_deadline', type: 'TEXT NOT NULL' },
  { name: 'freelancer_deadline', type: 'TEXT NOT NULL' },
  
  // Order options
  { name: 'request_draft', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'draft_delivered', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'request_printable_sources', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'single_spaced', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Pricing
  { name: 'base_cpp', type: 'REAL' },
  { name: 'effective_cpp', type: 'REAL' },
  
  // Status
  { name: 'status', type: 'TEXT NOT NULL DEFAULT \'pending\'' },
  
  // Manager approval
  { name: 'manager_approved', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'manager_approved_at', type: 'TEXT' },
  { name: 'manager_approval_notes', type: 'TEXT' },
  
  // Editor system
  { name: 'assigned_editor_id', type: 'INTEGER' },
  { name: 'editor_status', type: 'TEXT DEFAULT \'not_assigned\'' },
  { name: 'editor_approved', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'editor_approved_at', type: 'TEXT' },
  { name: 'editor_approval_notes', type: 'TEXT' },
  { name: 'editor_notes', type: 'TEXT' },
  { name: 'editor_requested_revision', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'editor_revision_notes', type: 'TEXT' },
  { name: 'editor_assigned_at', type: 'TEXT' },
  { name: 'editor_started_at', type: 'TEXT' },
  { name: 'editor_completed_at', type: 'TEXT' },
  { name: 'editor_claimed_at', type: 'TEXT' },
  { name: 'editor_flagged', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Approvals
  { name: 'admin_approved', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'client_approved', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'approved_by_client_at', type: 'TEXT' },
  
  // Revisions
  { name: 'revision_requested', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'revision_notes', type: 'TEXT' },
  
  // Payment
  { name: 'payment_confirmed', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'paid_order_confirmed_at', type: 'TEXT' },
  { name: 'invoice_generated', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Ratings
  { name: 'client_rating', type: 'INTEGER' },
  { name: 'writer_rating', type: 'INTEGER' },
  { name: 'review_comment', type: 'TEXT' },
  
  // Priority & pricing
  { name: 'placement_priority', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'urgency_multiplier', type: 'REAL NOT NULL DEFAULT 1.0' },
  { name: 'calculated_price', type: 'REAL' },
  { name: 'is_real_order', type: 'INTEGER NOT NULL DEFAULT 1' },
  
  // Submission flags
  { name: 'requires_reports', type: 'INTEGER NOT NULL DEFAULT 1' },
  { name: 'final_submission_complete', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'revision_submission_complete', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Client CPP
  { name: 'client_cpp', type: 'REAL' },
  { name: 'client_cpp_confirmed', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'service_type', type: 'TEXT DEFAULT \'writing_page\'' },
  
  // Manager additional
  { name: 'manager_additional', type: 'REAL NOT NULL DEFAULT 0' },
  { name: 'manager_additional_note', type: 'TEXT' },
  { name: 'manager_additional_status', type: 'TEXT DEFAULT \'none\'' },
  
  // Client bonus
  { name: 'client_bonus', type: 'REAL NOT NULL DEFAULT 0' },
  { name: 'status_total_amount', type: 'REAL NOT NULL DEFAULT 0' },
  
  // Payment status
  { name: 'cpp_payment_status', type: 'TEXT DEFAULT \'unpaid\'' },
  { name: 'last_amount_update_at', type: 'TEXT' },
  
  // Freelancer response
  { name: 'freelancer_accepted', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'freelancer_accepted_at', type: 'TEXT' },
  { name: 'freelancer_rejected', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'freelancer_rejected_at', type: 'TEXT' },
  { name: 'freelancer_rejection_reason', type: 'TEXT' },
  { name: 'freelancer_response_pending', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Status timestamps
  { name: 'accepted_at', type: 'TEXT' },
  { name: 'assigned_at', type: 'TEXT' },
  { name: 'submitted_at', type: 'TEXT' },
  { name: 'delivered_at', type: 'TEXT' },
  { name: 'approved_at', type: 'TEXT' },
  { name: 'paid_at', type: 'TEXT' },
  { name: 'completed_at', type: 'TEXT' },
  
  // Invoicing
  { name: 'is_invoiced', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'order_type', type: 'TEXT' },
  { name: 'invoiced_at', type: 'TEXT' },
  
  // Internal revisions
  { name: 'has_open_internal_revision', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'internal_revision_count', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'client_requested_revision', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Escalation
  { name: 'escalation_level', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'last_escalation_at', type: 'TEXT' },
  
  // Client preferences
  { name: 'client_notes', type: 'TEXT' },
  { name: 'client_preferred_freelancer', type: 'INTEGER' },
  { name: 'client_preference_type', type: 'TEXT' },
  { name: 'urgency_level', type: 'TEXT DEFAULT \'normal\'' },
  { name: 'complexity_level', type: 'TEXT DEFAULT \'standard\'' },
  
  // Activity timestamps
  { name: 'submitted_to_client_at', type: 'TEXT' },
  { name: 'client_first_viewed_at', type: 'TEXT' },
  { name: 'last_client_activity_at', type: 'TEXT' },
  { name: 'last_freelancer_activity_at', type: 'TEXT' },
  
  // Quality metrics
  { name: 'quality_score', type: 'INTEGER' },
  { name: 'quality_notes', type: 'TEXT' },
  { name: 'plagiarism_score', type: 'REAL' },
  { name: 'ai_detection_score', type: 'REAL' },
  { name: 'grammar_score', type: 'INTEGER' },
  
  // Revision tracking
  { name: 'total_revision_count', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'client_revision_count', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'last_revision_requested_at', type: 'TEXT' },
  { name: 'revision_deadline', type: 'TEXT' },
  
  // Message counts
  { name: 'unread_client_messages', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'unread_freelancer_messages', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'unread_admin_messages', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'last_message_at', type: 'TEXT' },
  
  // File counts
  { name: 'total_files_uploaded', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'client_files_count', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'freelancer_files_count', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'final_files_count', type: 'INTEGER NOT NULL DEFAULT 0' },
  
  // Cancellation
  { name: 'cancelled_at', type: 'TEXT' },
  { name: 'cancelled_by', type: 'INTEGER' },
  { name: 'cancellation_reason', type: 'TEXT' },
  { name: 'cancellation_category', type: 'TEXT' },
  { name: 'refund_issued', type: 'INTEGER NOT NULL DEFAULT 0' },
  { name: 'refund_amount', type: 'REAL NOT NULL DEFAULT 0' },
  
  // On hold
  { name: 'on_hold_at', type: 'TEXT' },
  { name: 'on_hold_by', type: 'INTEGER' },
  { name: 'on_hold_reason', type: 'TEXT' },
  { name: 'expected_resume_date', type: 'TEXT' },
  { name: 'resumed_at', type: 'TEXT' },
  
  // Timestamps
  { name: 'created_at', type: 'TEXT NOT NULL' },
  { name: 'updated_at', type: 'TEXT NOT NULL' },
];

async function getExistingColumns(): Promise<string[]> {
  try {
    const result = await client.execute(`PRAGMA table_info(jobs)`);
    return result.rows.map((row: any) => row.name as string);
  } catch (error: any) {
    console.error('❌ Failed to get existing columns:', error.message);
    throw error;
  }
}

async function addMissingColumns() {
  console.log('🔍 Checking jobs table schema...\n');
  
  const existingColumns = await getExistingColumns();
  console.log(`✅ Found ${existingColumns.length} existing columns\n`);
  
  const missingColumns = REQUIRED_COLUMNS.filter(
    col => !existingColumns.includes(col.name) && col.name !== 'id'
  );
  
  if (missingColumns.length === 0) {
    console.log('✅ All required columns exist!');
    return;
  }
  
  console.log(`⚠️  Found ${missingColumns.length} missing columns:\n`);
  
  for (const col of missingColumns) {
    console.log(`   📝 ${col.name} (${col.type})`);
  }
  
  console.log('\n🔧 Adding missing columns...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const col of missingColumns) {
    try {
      const sql = `ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`;
      await client.execute(sql);
      console.log(`   ✅ Added: ${col.name}`);
      successCount++;
    } catch (error: any) {
      // Ignore "duplicate column" errors (already exists)
      if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
        console.log(`   ⚠️  Skipped: ${col.name} (already exists)`);
      } else {
        console.error(`   ❌ Failed: ${col.name} - ${error.message}`);
        failCount++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Added: ${successCount} columns`);
  console.log(`   ⚠️  Skipped: ${missingColumns.length - successCount - failCount} columns`);
  if (failCount > 0) {
    console.log(`   ❌ Failed: ${failCount} columns`);
  }
  console.log('');
}

async function verifySchema() {
  console.log('\n🔍 Verifying final schema...\n');
  
  const existingColumns = await getExistingColumns();
  const missingColumns = REQUIRED_COLUMNS.filter(
    col => !existingColumns.includes(col.name) && col.name !== 'id'
  );
  
  if (missingColumns.length === 0) {
    console.log('✅ All columns verified successfully!');
    console.log(`   Total columns: ${existingColumns.length}`);
  } else {
    console.log('⚠️  Still missing columns:');
    missingColumns.forEach(col => {
      console.log(`   - ${col.name}`);
    });
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  JOBS TABLE SCHEMA FIX');
  console.log('='.repeat(60) + '\n');
  
  try {
    await addMissingColumns();
    await verifySchema();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Schema fix completed successfully!');
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
