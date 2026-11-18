import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";


// Add all message tables and ensure all order-related records are purged
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
];

export async function POST() {
  const results: { table: string; ok: boolean; error?: string }[] = [];
  try {
    // Step 1: Delete all order and message records
    for (const table of TABLES_IN_DELETE_ORDER) {
      try {
        await db.execute(sql.raw(`DELETE FROM ${table}`));
        results.push({ table, ok: true });
      } catch (e: any) {
        // Ignore if table is missing or any other non-critical error
        results.push({ table, ok: false, error: e?.message || String(e) });
      }
    }

    // Step 2: Recompute all user balances and set currency to KShs
    // Set all user balances to 0 and currency to KShs (if any currency field exists)
    await db.execute(sql.raw(`UPDATE users SET balance = 0, total_earned = 0, total_spent = 0`));
    await db.execute(sql.raw(`UPDATE writer_balances SET available_balance = 0, pending_balance = 0, total_earned = 0`));
    await db.execute(sql.raw(`UPDATE managers SET balance = 0, total_earnings = 0`));
    // If any user has a currency field, set to 'KShs' (skip if not present)
    try { await db.execute(sql.raw(`UPDATE users SET currency = 'KShs'`)); } catch (e) {}

    return NextResponse.json({ success: true, results, message: 'All order and message records deleted, balances reset, currency set to KShs.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

