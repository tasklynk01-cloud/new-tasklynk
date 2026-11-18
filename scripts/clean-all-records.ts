import * as dotenv from 'dotenv';
dotenv.config();

import { sql } from 'drizzle-orm';
// Import db dynamically to ensure env vars are loaded first
const { db } = require('../src/db');

const TABLES_IN_DELETE_ORDER = [
  "job_status_logs",
  "email_notifications",
  "job_files",
  "revisions",
  "ratings",
  "job_messages",
  "messages",
  "job_attachments",
  "invoices",
  "payments",
  "bids",
  "jobs",
  "order_history",
  "order_files",
  "order_amount_adjustments",
  "order_settlements",
  "order_additional_payments",
  "conversations",
  "submissions",
  "submission_files",
  "payment_transactions",
  "payment_requests",
  "manager_earnings",
  "email_logs"
];

async function cleanAllRecords() {
  console.log('Starting cleanup...');
  
  try {
    // Step 1: Delete all order and message records
    for (const table of TABLES_IN_DELETE_ORDER) {
      try {
        console.log(`Deleting from ${table}...`);
        await db.run(sql.raw(`DELETE FROM ${table}`));
        console.log(`✓ Deleted ${table}`);
      } catch (e: any) {
        console.log(`⚠ Error deleting ${table}: ${e.message}`);
      }
    }

    // Step 2: Recompute all user balances and set currency to KShs
    console.log('Resetting user balances...');
    await db.run(sql.raw(`UPDATE users SET balance = 0, total_earned = 0, total_spent = 0, completed_jobs = 0`));
    
    try {
        await db.run(sql.raw(`UPDATE writer_balances SET available_balance = 0, pending_balance = 0, total_earned = 0`));
    } catch (e) {}
    
    try {
        await db.run(sql.raw(`UPDATE managers SET balance = 0, total_earnings = 0`));
    } catch (e) {}

    // If any user has a currency field, set to 'KShs' (skip if not present)
    try { 
        await db.run(sql.raw(`UPDATE users SET currency = 'KShs'`)); 
    } catch (e) {
        console.log('Note: currency column might not exist in users table');
    }

    console.log('✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanAllRecords();
