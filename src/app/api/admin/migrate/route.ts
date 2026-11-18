import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Admin Database Migration Endpoint
 * 
 * POST /api/admin/migrate
 * 
 * Runs database migrations to create required tables and columns.
 * Admin-only endpoint for safety.
 */

export async function POST(request: NextRequest) {
  // Require admin role
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {

    const results: string[] = [];
    const errors: string[] = [];

    // Helper to run migration
    const runMigration = async (description: string, stmt: string) => {
      try {
        await db.execute(sql.raw(stmt));
        results.push(`✅ ${description}`);
      } catch (error: any) {
        if (
          error.message?.includes('duplicate column') ||
          error.message?.includes('already exists')
        ) {
          results.push(`ℹ️  ${description} (already exists)`);
        } else {
          errors.push(`❌ ${description}: ${error.message}`);
          console.error(`[Migration API] ❌ ${description}:`, error.message);
        }
      }
    };

    // Migration 1: Jobs table timestamp fields
    await runMigration('Jobs: assigned_at', 'ALTER TABLE jobs ADD COLUMN assigned_at TEXT');
    await runMigration('Jobs: submitted_at', 'ALTER TABLE jobs ADD COLUMN submitted_at TEXT');
    await runMigration('Jobs: delivered_at', 'ALTER TABLE jobs ADD COLUMN delivered_at TEXT');
    await runMigration('Jobs: approved_at', 'ALTER TABLE jobs ADD COLUMN approved_at TEXT');
    await runMigration('Jobs: paid_at', 'ALTER TABLE jobs ADD COLUMN paid_at TEXT');
    await runMigration('Jobs: completed_at', 'ALTER TABLE jobs ADD COLUMN completed_at TEXT');
    await runMigration('Jobs: invoiced_at', 'ALTER TABLE jobs ADD COLUMN invoiced_at TEXT');

    // Migration 2: Jobs table financial fields
    await runMigration('Jobs: is_invoiced', 'ALTER TABLE jobs ADD COLUMN is_invoiced INTEGER DEFAULT 0');
    await runMigration('Jobs: single_spaced', 'ALTER TABLE jobs ADD COLUMN single_spaced INTEGER DEFAULT 0');
    await runMigration('Jobs: order_type', 'ALTER TABLE jobs ADD COLUMN order_type TEXT DEFAULT "normal"');
    await runMigration('Jobs: manager_assigned_fee', 'ALTER TABLE jobs ADD COLUMN manager_assigned_fee REAL DEFAULT 0');
    await runMigration('Jobs: manager_delivery_fee', 'ALTER TABLE jobs ADD COLUMN manager_delivery_fee REAL DEFAULT 0');
    await runMigration('Jobs: freelancer_amount', 'ALTER TABLE jobs ADD COLUMN freelancer_amount REAL DEFAULT 0');
    await runMigration('Jobs: total_amount', 'ALTER TABLE jobs ADD COLUMN total_amount REAL DEFAULT 0');

    // Migration 3: Jobs table revision fields
    await runMigration('Jobs: has_open_internal_revision', 'ALTER TABLE jobs ADD COLUMN has_open_internal_revision INTEGER DEFAULT 0');
    await runMigration('Jobs: internal_revision_count', 'ALTER TABLE jobs ADD COLUMN internal_revision_count INTEGER DEFAULT 0');
    await runMigration('Jobs: client_requested_revision', 'ALTER TABLE jobs ADD COLUMN client_requested_revision INTEGER DEFAULT 0');

    // Migration 4: Create internal_revisions table
    await runMigration(
      'Create internal_revisions table',
      `CREATE TABLE IF NOT EXISTS internal_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        submitted_at TEXT,
        reviewed_at TEXT,
        closed_at TEXT
      )`
    );

    await runMigration('Create idx_internal_revisions_order', 'CREATE INDEX IF NOT EXISTS idx_internal_revisions_order ON internal_revisions(order_id)');
    await runMigration('Create idx_internal_revisions_assigned', 'CREATE INDEX IF NOT EXISTS idx_internal_revisions_assigned ON internal_revisions(assigned_to)');
    await runMigration('Create idx_internal_revisions_status', 'CREATE INDEX IF NOT EXISTS idx_internal_revisions_status ON internal_revisions(status)');

    // Migration 5: Create balances table
    await runMigration(
      'Create balances table',
      `CREATE TABLE IF NOT EXISTS balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        available_balance REAL NOT NULL DEFAULT 0,
        pending_balance REAL NOT NULL DEFAULT 0,
        reserved_balance REAL NOT NULL DEFAULT 0,
        total_earned REAL NOT NULL DEFAULT 0,
        total_withdrawn REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    );

    await runMigration('Create idx_balances_user', 'CREATE INDEX IF NOT EXISTS idx_balances_user ON balances(user_id)');

    // Migration 6: Create adjustments table
    await runMigration(
      'Create adjustments table',
      `CREATE TABLE IF NOT EXISTS adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
        amount REAL NOT NULL,
        reason TEXT NOT NULL,
        adjustment_type TEXT NOT NULL,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      )`
    );

    await runMigration('Create idx_adjustments_user', 'CREATE INDEX IF NOT EXISTS idx_adjustments_user ON adjustments(user_id)');
    await runMigration('Create idx_adjustments_order', 'CREATE INDEX IF NOT EXISTS idx_adjustments_order ON adjustments(order_id)');
    await runMigration('Create idx_adjustments_type', 'CREATE INDEX IF NOT EXISTS idx_adjustments_type ON adjustments(adjustment_type)');

    // Migration 7: Create audit_logs table
    await runMigration(
      'Create audit_logs table',
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        actor_role TEXT,
        target_id INTEGER,
        target_type TEXT,
        old_value TEXT,
        new_value TEXT,
        note TEXT,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    );

    await runMigration('Create idx_audit_logs_order', 'CREATE INDEX IF NOT EXISTS idx_audit_logs_order ON audit_logs(order_id)');
    await runMigration('Create idx_audit_logs_actor', 'CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id)');
    await runMigration('Create idx_audit_logs_action', 'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    await runMigration('Create idx_audit_logs_timestamp', 'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');

    // Migration 8: Update invoices table
    await runMigration('Invoices: type', 'ALTER TABLE invoices ADD COLUMN type TEXT DEFAULT "freelancer"');
    await runMigration('Invoices: orders_json', 'ALTER TABLE invoices ADD COLUMN orders_json TEXT');
    await runMigration('Invoices: issued_at', 'ALTER TABLE invoices ADD COLUMN issued_at TEXT');
    await runMigration('Invoices: settled_at', 'ALTER TABLE invoices ADD COLUMN settled_at TEXT');
    await runMigration('Invoices: csv_url', 'ALTER TABLE invoices ADD COLUMN csv_url TEXT');
    await runMigration('Invoices: is_settled', 'ALTER TABLE invoices ADD COLUMN is_settled INTEGER DEFAULT 0');


    return NextResponse.json({
      success: true,
      message: 'Database migration completed',
      results,
      errors,
      stats: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    info: 'Database migration endpoint',
    usage: 'POST /api/admin/migrate to run migrations',
    documentation: 'See DATABASE_MIGRATION_GUIDE.md',
  });
}


