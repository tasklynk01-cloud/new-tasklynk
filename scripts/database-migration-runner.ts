#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * 
 * This script runs all necessary database migrations to bring the schema up to date.
 * It checks which tables and columns are missing and creates them.
 * 
 * Usage:
 *   tsx scripts/database-migration-runner.ts
 *   OR
 *   npm run db:migrate
 */

import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import { config } from 'dotenv';
config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
}

async function runMigration(): Promise<void> {
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Database Migration Runner${colors.cyan}                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  // Check environment variables
  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error(`${colors.red}❌ ERROR: Missing database credentials${colors.reset}`);
    console.error('   Please set TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN');
    console.error('   Run: npm run setup:phase3');
    process.exit(1);
  }

  console.log(`${colors.blue}🔗 Connecting to database...${colors.reset}`);
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Test connection
    await client.execute('SELECT 1');
    console.log(`${colors.green}✅ Database connected${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Failed to connect to database${colors.reset}`);
    console.error(error);
    process.exit(1);
  }

  const results: MigrationResult[] = [];

  // Run migrations
  console.log(`${colors.blue}📦 Running migrations...${colors.reset}\n`);

  // Migration 1: Add timestamp fields to jobs table
  results.push(await addJobsTimestampFields(client));

  // Migration 2: Add financial fields to jobs table
  results.push(await addJobsFinancialFields(client));

  // Migration 3: Add internal revision fields to jobs table
  results.push(await addJobsRevisionFields(client));

  // Migration 4: Create internal_revisions table
  results.push(await createInternalRevisionsTable(client));

  // Migration 5: Create balances table
  results.push(await createBalancesTable(client));

  // Migration 6: Create adjustments table
  results.push(await createAdjustmentsTable(client));

  // Migration 7: Create audit_logs table
  results.push(await createAuditLogsTable(client));

  // Migration 8: Update invoices table
  results.push(await updateInvoicesTable(client));

  // Print summary
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Migration Summary${colors.cyan}                                     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    if (result.success) {
      console.log(`${colors.green}✅${colors.reset} ${result.message}`);
    } else {
      console.log(`${colors.red}❌${colors.reset} ${result.message}`);
      if (result.error) {
        console.log(`   ${colors.red}${result.error}${colors.reset}`);
      }
    }
  });

  console.log('');
  console.log(`${colors.green}✅ Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log('');

  if (failed === 0) {
    console.log(`${colors.green}✅ All migrations completed successfully!${colors.reset}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Verify tables: npm run db:verify');
    console.log('   2. Start application: npm run dev');
    console.log('');
  } else {
    console.log(`${colors.yellow}⚠️  Some migrations failed${colors.reset}`);
    console.log('   This may be normal if tables already exist');
    console.log('   Run: npm run db:verify to check status');
    console.log('');
  }

  await client.close();
}

// Migration functions
async function addJobsTimestampFields(client: any): Promise<MigrationResult> {
  const fields = [
    'assigned_at TEXT',
    'submitted_at TEXT',
    'delivered_at TEXT',
    'approved_at TEXT',
    'paid_at TEXT',
    'completed_at TEXT',
    'invoiced_at TEXT',
  ];

  try {
    for (const field of fields) {
      const [fieldName] = field.split(' ');
      try {
        await client.execute(`ALTER TABLE jobs ADD COLUMN ${field}`);
      } catch (error: any) {
        // Ignore duplicate column errors
        if (!error.message?.includes('duplicate column')) {
          throw error;
        }
      }
    }
    return {
      success: true,
      message: 'Jobs table: Added timestamp fields',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Jobs table: Failed to add timestamp fields',
      error: error.message,
    };
  }
}

async function addJobsFinancialFields(client: any): Promise<MigrationResult> {
  const fields = [
    'is_invoiced INTEGER DEFAULT 0',
    'single_spaced INTEGER DEFAULT 0',
    'order_type TEXT DEFAULT "normal"',
    'manager_assigned_fee REAL DEFAULT 0',
    'manager_delivery_fee REAL DEFAULT 0',
    'freelancer_amount REAL DEFAULT 0',
    'total_amount REAL DEFAULT 0',
  ];

  try {
    for (const field of fields) {
      try {
        await client.execute(`ALTER TABLE jobs ADD COLUMN ${field}`);
      } catch (error: any) {
        if (!error.message?.includes('duplicate column')) {
          throw error;
        }
      }
    }
    return {
      success: true,
      message: 'Jobs table: Added financial fields',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Jobs table: Failed to add financial fields',
      error: error.message,
    };
  }
}

async function addJobsRevisionFields(client: any): Promise<MigrationResult> {
  const fields = [
    'has_open_internal_revision INTEGER DEFAULT 0',
    'internal_revision_count INTEGER DEFAULT 0',
    'client_requested_revision INTEGER DEFAULT 0',
  ];

  try {
    for (const field of fields) {
      try {
        await client.execute(`ALTER TABLE jobs ADD COLUMN ${field}`);
      } catch (error: any) {
        if (!error.message?.includes('duplicate column')) {
          throw error;
        }
      }
    }
    return {
      success: true,
      message: 'Jobs table: Added revision tracking fields',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Jobs table: Failed to add revision fields',
      error: error.message,
    };
  }
}

async function createInternalRevisionsTable(client: any): Promise<MigrationResult> {
  const sql = `
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
  `;

  try {
    await client.execute(sql);
    await client.execute('CREATE INDEX IF NOT EXISTS idx_internal_revisions_order ON internal_revisions(order_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_internal_revisions_assigned ON internal_revisions(assigned_to)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_internal_revisions_status ON internal_revisions(status)');
    return {
      success: true,
      message: 'Created table: internal_revisions (with indexes)',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create internal_revisions table',
      error: error.message,
    };
  }
}

async function createBalancesTable(client: any): Promise<MigrationResult> {
  const sql = `
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
  `;

  try {
    await client.execute(sql);
    await client.execute('CREATE INDEX IF NOT EXISTS idx_balances_user ON balances(user_id)');
    return {
      success: true,
      message: 'Created table: balances (with index)',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create balances table',
      error: error.message,
    };
  }
}

async function createAdjustmentsTable(client: any): Promise<MigrationResult> {
  const sql = `
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
  `;

  try {
    await client.execute(sql);
    await client.execute('CREATE INDEX IF NOT EXISTS idx_adjustments_user ON adjustments(user_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_adjustments_order ON adjustments(order_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_adjustments_type ON adjustments(adjustment_type)');
    return {
      success: true,
      message: 'Created table: adjustments (with indexes)',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create adjustments table',
      error: error.message,
    };
  }
}

async function createAuditLogsTable(client: any): Promise<MigrationResult> {
  const sql = `
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
  `;

  try {
    await client.execute(sql);
    await client.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_order ON audit_logs(order_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');
    return {
      success: true,
      message: 'Created table: audit_logs (with indexes)',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create audit_logs table',
      error: error.message,
    };
  }
}

async function updateInvoicesTable(client: any): Promise<MigrationResult> {
  const fields = [
    'type TEXT DEFAULT "freelancer"',
    'orders_json TEXT',
    'issued_at TEXT',
    'settled_at TEXT',
    'csv_url TEXT',
    'is_settled INTEGER DEFAULT 0',
  ];

  try {
    for (const field of fields) {
      try {
        await client.execute(`ALTER TABLE invoices ADD COLUMN ${field}`);
      } catch (error: any) {
        if (!error.message?.includes('duplicate column')) {
          throw error;
        }
      }
    }
    return {
      success: true,
      message: 'Invoices table: Added new fields',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Invoices table: Failed to add fields',
      error: error.message,
    };
  }
}

// Run migration
if (require.main === module) {
  runMigration().catch((error) => {
    console.error(`${colors.red}❌ Migration failed:${colors.reset}`, error);
    process.exit(1);
  });
}

export { runMigration };

