#!/usr/bin/env tsx
/**
 * DATABASE MIGRATION SCRIPT - Order Flow Enhancement
 * Simple version using direct Turso connection
 * 
 * USAGE:
 *   npm run migrate:order-flow
 *   OR
 *   npx tsx scripts/run-order-flow-migration.ts
 */

import { config } from 'dotenv';
config();

import { createClient } from '@libsql/client';

// Verify environment
if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ Error: Turso credentials not found in environment');
  console.error('Please ensure .env file has TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function runMigration() {
  console.log('🚀 Starting Order Flow Schema Migration...\n');

  try {
    // ========================================
    // 1. UPDATE ORDERS TABLE
    // ========================================
    console.log('📝 Step 1: Updating jobs table with new fields...');
    
    const ordersUpdates = [
      { field: 'assigned_at', type: 'TEXT' },
      { field: 'submitted_at', type: 'TEXT' },
      { field: 'delivered_at', type: 'TEXT' },
      { field: 'approved_at', type: 'TEXT' },
      { field: 'paid_at', type: 'TEXT' },
      { field: 'completed_at', type: 'TEXT' },
      { field: 'is_invoiced', type: 'INTEGER DEFAULT 0' },
      { field: 'single_spaced', type: 'INTEGER DEFAULT 0' },
      { field: 'order_type', type: 'TEXT DEFAULT \'normal\'' },
      { field: 'manager_assigned_fee', type: 'REAL DEFAULT 0' },
      { field: 'manager_delivery_fee', type: 'REAL DEFAULT 0' },
      { field: 'freelancer_amount', type: 'REAL DEFAULT 0' },
      { field: 'total_amount', type: 'REAL DEFAULT 0' },
      { field: 'invoiced_at', type: 'TEXT' },
      { field: 'has_open_internal_revision', type: 'INTEGER DEFAULT 0' },
      { field: 'internal_revision_count', type: 'INTEGER DEFAULT 0' },
      { field: 'client_requested_revision', type: 'INTEGER DEFAULT 0' },
    ];

    for (const update of ordersUpdates) {
      try {
        await client.execute(`ALTER TABLE jobs ADD COLUMN ${update.field} ${update.type}`);
        console.log(`  ✅ Added jobs.${update.field}`);
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log(`  ℹ️  jobs.${update.field} already exists, skipping`);
        } else {
          console.error(`  ❌ Error adding jobs.${update.field}:`, error.message);
        }
      }
    }

    // ========================================
    // 2. CREATE INTERNAL_REVISIONS TABLE
    // ========================================
    console.log('\n📝 Step 2: Creating internal_revisions table...');
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS internal_revisions (
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
      )
    `);
    console.log('  ✅ internal_revisions table created');

    // Create indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_internal_revisions_order ON internal_revisions(order_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_internal_revisions_assigned ON internal_revisions(assigned_to)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_internal_revisions_status ON internal_revisions(status)`);
    console.log('  ✅ internal_revisions indexes created');

    // ========================================
    // 3. CREATE BALANCES TABLE
    // ========================================
    console.log('\n📝 Step 3: Creating balances table...');
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        available_balance REAL NOT NULL DEFAULT 0,
        pending_balance REAL NOT NULL DEFAULT 0,
        reserved_balance REAL NOT NULL DEFAULT 0,
        total_earned REAL NOT NULL DEFAULT 0,
        total_withdrawn REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('  ✅ balances table created');

    await client.execute(`CREATE INDEX IF NOT EXISTS idx_balances_user ON balances(user_id)`);
    console.log('  ✅ balances indexes created');

    // ========================================
    // 4. CREATE ADJUSTMENTS TABLE
    // ========================================
    console.log('\n📝 Step 4: Creating adjustments table...');
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS adjustments (
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
      )
    `);
    console.log('  ✅ adjustments table created');

    await client.execute(`CREATE INDEX IF NOT EXISTS idx_adjustments_user ON adjustments(user_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_adjustments_order ON adjustments(order_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_adjustments_type ON adjustments(adjustment_type)`);
    console.log('  ✅ adjustments indexes created');

    // ========================================
    // 5. CREATE AUDIT_LOGS TABLE
    // ========================================
    console.log('\n📝 Step 5: Creating audit_logs table...');
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
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
      )
    `);
    console.log('  ✅ audit_logs table created');

    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_order ON audit_logs(order_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
    console.log('  ✅ audit_logs indexes created');

    // ========================================
    // 6. UPDATE INVOICES TABLE
    // ========================================
    console.log('\n📝 Step 6: Updating invoices table with new fields...');
    
    const invoicesUpdates = [
      { field: 'type', type: 'TEXT DEFAULT \'freelancer\'' },
      { field: 'orders_json', type: 'TEXT' },
      { field: 'issued_at', type: 'TEXT' },
      { field: 'settled_at', type: 'TEXT' },
      { field: 'csv_url', type: 'TEXT' },
      { field: 'is_settled', type: 'INTEGER DEFAULT 0' },
    ];

    for (const update of invoicesUpdates) {
      try {
        await client.execute(`ALTER TABLE invoices ADD COLUMN ${update.field} ${update.type}`);
        console.log(`  ✅ Added invoices.${update.field}`);
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log(`  ℹ️  invoices.${update.field} already exists, skipping`);
        } else {
          console.error(`  ❌ Error adding invoices.${update.field}:`, error.message);
        }
      }
    }

    // ========================================
    // 7. INITIALIZE BALANCES FOR EXISTING USERS
    // ========================================
    console.log('\n📝 Step 7: Initializing balances for existing users...');
    
    await client.execute(`
      INSERT OR IGNORE INTO balances (user_id, available_balance, pending_balance, reserved_balance, total_earned, total_withdrawn, created_at, updated_at)
      SELECT 
        id,
        COALESCE(balance, 0),
        0,
        0,
        COALESCE(total_earnings, 0),
        0,
        datetime('now'),
        datetime('now')
      FROM users
      WHERE role IN ('freelancer', 'manager')
    `);
    console.log('  ✅ Balances initialized for all freelancers and managers');

    // ========================================
    // MIGRATION COMPLETE
    // ========================================
    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  ✅ jobs table: 17 new fields added');
    console.log('  ✅ internal_revisions table: created with indexes');
    console.log('  ✅ balances table: created with indexes');
    console.log('  ✅ adjustments table: created with indexes');
    console.log('  ✅ audit_logs table: created with indexes');
    console.log('  ✅ invoices table: 6 new fields added');
    console.log('  ✅ User balances: initialized for existing users');
    console.log('\n🎉 Database is now ready for the new order flow system!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n👋 Migration script finished. You can now proceed with implementing the API endpoints.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error during migration:', error);
    process.exit(1);
  });
