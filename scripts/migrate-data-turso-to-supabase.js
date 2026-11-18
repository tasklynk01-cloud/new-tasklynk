/**
 * Data Migration Script: Turso (SQLite) -> Supabase (PostgreSQL)
 *
 * Usage:
 *   node scripts/migrate-data-turso-to-supabase.js
 *
 * Requirements:
 *   - TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in .env
 *   - DATABASE_URL pointing to Supabase in .env
 *   - Run with: node scripts/migrate-data-turso-to-supabase.js
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

// ========================================
// CONFIGURATION
// ========================================
const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const SUPABASE_URL = process.env.DATABASE_URL;

// Tables to migrate in order (respecting foreign key dependencies)
const TABLES_IN_ORDER = [
  'domains',
  'accounts',
  'roles',
  'users',
  'user_stats',
  'jobs',
  'bids',
  'payments',
  'notifications',
  'job_messages',
  'order_chat_messages',
  'ratings',
  'job_attachments',
  'revisions',
  'order_revisions',
  'email_logs',
  'order_files',
  'document_previews',
  'file_upload_audit_log',
  'order_submissions',
  'email_verification_codes',
  'pending_registrations',
  'password_reset_tokens',
  'payment_requests',
  'email_notifications',
  'manager_invitations',
  'invitations',
  'job_status_logs',
  'order_history',
  'order_status_history',
  'order_timeline_events',
  'writer_balances',
  'balances',
  'managers',
  'client_manager',
  'manager_earnings',
  'user_categories',
  'system_logs',
  'badges',
  'user_badges',
  'payout_requests',
  'admin_audit_logs',
  'audit_logs',
  'writer_tiers',
  'conversations',
  'freelancer_profiles',
  'editor_profiles',
  'editor_assignments',
  'editor_files',
  'editor_messages',
  'editor_internal_revisions',
  'payment_transactions',
  'client_profiles',
  'client_freelancer_history',
  'freelancer_online_status',
  'manager_online_status',
  'client_online_status',
  'freelancer_cpp_levels',
  'freelancer_cpp_progress',
  'contact_messages',
  'submissions',
  'submission_files',
  'pricing_minimums',
  'order_amount_adjustments',
  'freelancer_subjects',
  'freelancer_software',
  'freelancer_services',
  'freelancer_subject_map',
  'freelancer_software_map',
  'freelancer_services_map',
  'memos',
  'memo_reads',
  'manager_freelancers',
  'manager_clients',
  'invoice_settlements',
  'order_settlements',
  'user_fines',
  'order_additional_payments',
  'user_balance_history',
  'internal_revisions',
  'adjustments',
  'balance_ledger',
  'billing_invoices',
  'billing_invoice_items',
  'invoices',
  'messages',
  'freelancer_order_responses',
  'system_settings',
  'settings_history',
  'payments_new',
];

// ========================================
// TURSO CLIENT (using @libsql/client)
// ========================================
let tursoClient;

async function initTurso() {
  try {
    const { createClient } = require('@libsql/client');
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });

    const result = await tursoClient.execute('SELECT 1 as test');
    console.log('[Turso] Connected successfully');
    return true;
  } catch (error) {
    console.error('[Turso] Connection failed:', error.message);
    return false;
  }
}

// ========================================
// SUPABASE (PostgreSQL) CLIENT
// ========================================
const pgPool = new Pool({
  connectionString: SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

async function initSupabase() {
  try {
    const result = await pgPool.query('SELECT NOW()');
    console.log('[Supabase] Connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('[Supabase] Connection failed:', error.message);
    return false;
  }
}

// ========================================
// DATA TRANSFORMATION
// ========================================

/**
 * Convert SQLite values to PostgreSQL values
 */
function transformValue(value, columnName) {
  if (value === null || value === undefined) return null;

  // Boolean fields (SQLite stores as 0/1)
  const booleanColumns = [
    'approved', 'email_verified', 'is_read', 'used', 'admin_approved',
    'client_approved', 'revision_requested', 'payment_confirmed',
    'is_real_order', 'requires_reports', 'final_submission_complete',
    'revision_submission_complete', 'account_linked', 'request_draft',
    'draft_delivered', 'request_printable_sources', 'single_spaced',
    'manager_approved', 'editor_approved', 'editor_requested_revision',
    'editor_flagged', 'invoice_generated', 'is_invoiced',
    'freelancer_accepted', 'freelancer_rejected', 'freelancer_response_pending',
    'has_open_internal_revision', 'client_requested_revision',
    'refund_issued', 'confirmed_by_admin', 'sent_to_freelancer',
    'approved_by_admin', 'checklist_completed', 'has_final_document',
    'has_plagiarism_report', 'has_ai_report', 'is_guest',
    'requires_acknowledgement', 'automatic_transition',
    'visible_to_client', 'visible_to_freelancer', 'visible_to_admin',
    'two_factor_enabled', 'skills_completed', 'is_online',
    'is_latest', 'is_archived', 'is_deleted', 'is_profile_complete',
    'is_work_type_specialized', 'automate_payments', 'is_settled',
    'is_delivered', 'client_cpp_confirmed', 'success',
  ];

  if (booleanColumns.includes(columnName)) {
    return Boolean(value);
  }

  // JSON fields stored as text in SQLite
  const jsonColumns = [
    'badge_list', 'criteria', 'benefits', 'skills', 'certifications',
    'portfolio', 'languages', 'available_days', 'qualifications',
    'areas_of_expertise', 'billing_address', 'shipping_address',
    'account_details', 'order_ids', 'metadata', 'old_values',
    'new_values', 'context', 'details', 'request_payload',
    'response_payload', 'files_json', 'tags',
  ];

  if (jsonColumns.includes(columnName) && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // Integer fields that might be stored as strings
  if (typeof value === 'string' && /^\d+$/.test(value) && !isNaN(parseInt(value))) {
    // Don't convert IDs or fields that should stay as strings
    if (columnName.includes('code') || columnName.includes('token') ||
        columnName.includes('reference') || columnName.includes('number') ||
        columnName.includes('phone') || columnName.includes('email') ||
        columnName.includes('name') || columnName.includes('url') ||
        columnName.includes('path') || columnName.includes('file')) {
      return value;
    }
  }

  return value;
}

/**
 * Transform a row from SQLite to PostgreSQL format
 */
function transformRow(row, tableName) {
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    transformed[key] = transformValue(value, key);
  }
  return transformed;
}

// ========================================
// MIGRATION LOGIC
// ========================================

async function getTursoTableCount(tableName) {
  try {
    const result = await tursoClient.execute(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return parseInt(result.rows[0]?.count || '0');
  } catch {
    return 0;
  }
}

async function getTursoTableColumns(tableName) {
  try {
    const result = await tursoClient.execute(`PRAGMA table_info("${tableName}")`);
    return result.rows.map(row => row.name);
  } catch {
    return [];
  }
}

async function migrateTable(tableName) {
  const count = await getTursoTableCount(tableName);
  if (count === 0) {
    console.log(`  [${tableName}] 0 rows - skipping`);
    return { success: true, count: 0 };
  }

  console.log(`  [${tableName}] ${count} rows found`);

  const columns = await getTursoTableColumns(tableName);
  if (columns.length === 0) {
    console.log(`  [${tableName}] No columns found - skipping`);
    return { success: true, count: 0 };
  }

  let migrated = 0;
  let errors = 0;
  const BATCH_SIZE = 100;

  try {
    // Fetch all rows from Turso
    const result = await tursoClient.execute(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;

    // Process in batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        try {
          const transformed = transformRow(row, tableName);

          // Build INSERT query
          const keys = Object.keys(transformed).filter(k => columns.includes(k));
          const values = keys.map(k => transformed[k]);
          const placeholders = keys.map((_, idx) => `$${idx + 1}`);

          const insertQuery = `
            INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT DO NOTHING
          `;

          await pgPool.query(insertQuery, values);
          migrated++;
        } catch (err) {
          errors++;
          if (errors <= 3) {
            console.error(`    Error migrating row in ${tableName}:`, err.message);
          }
        }
      }

      if (i + BATCH_SIZE < rows.length) {
        process.stdout.write(`    Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}\r`);
      }
    }

    console.log(`  [${tableName}] Migrated: ${migrated}/${count} (errors: ${errors})`);
    return { success: true, count: migrated, errors };
  } catch (err) {
    console.error(`  [${tableName}] Failed:`, err.message);
    return { success: false, count: 0, errors: err.message };
  }
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('========================================');
  console.log('Data Migration: Turso -> Supabase');
  console.log('========================================\n');

  // Initialize connections
  const tursoOk = await initTurso();
  if (!tursoOk) {
    console.error('Failed to connect to Turso. Check TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in .env');
    process.exit(1);
  }

  const supabaseOk = await initSupabase();
  if (!supabaseOk) {
    console.error('Failed to connect to Supabase. Check DATABASE_URL in .env');
    process.exit(1);
  }

  console.log('\nStarting migration...\n');

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    rows: 0,
  };

  for (const table of TABLES_IN_ORDER) {
    results.total++;
    const result = await migrateTable(table);
    if (result.success) {
      results.success++;
      results.rows += result.count;
    } else {
      results.failed++;
    }
  }

  console.log('\n========================================');
  console.log('Migration Complete!');
  console.log(`  Tables processed: ${results.total}`);
  console.log(`  Successful: ${results.success}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Total rows migrated: ${results.rows}`);
  console.log('========================================');

  await pgPool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
