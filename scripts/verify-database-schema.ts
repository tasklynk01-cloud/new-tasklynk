#!/usr/bin/env tsx
/**
 * Database Schema Verification Tool
 * 
 * This script verifies that all required tables and columns exist in the database.
 * 
 * Usage:
 *   tsx scripts/verify-database-schema.ts
 *   OR
 *   npm run db:verify
 */

import { createClient } from '@libsql/client';
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

interface TableCheck {
  name: string;
  exists: boolean;
  columns?: string[];
  missingColumns?: string[];
}

const requiredTables = {
  jobs: [
    'id', 'display_id', 'status', 'assigned_at', 'submitted_at', 
    'delivered_at', 'approved_at', 'paid_at', 'completed_at',
    'is_invoiced', 'manager_assigned_fee', 'manager_delivery_fee',
    'freelancer_amount', 'total_amount', 'has_open_internal_revision',
    'internal_revision_count', 'client_requested_revision',
  ],
  internal_revisions: [
    'id', 'order_id', 'requested_by', 'assigned_to', 'reason',
    'status', 'created_at', 'submitted_at', 'reviewed_at', 'closed_at',
  ],
  balances: [
    'id', 'user_id', 'available_balance', 'pending_balance', 
    'reserved_balance', 'total_earned', 'total_withdrawn',
    'created_at', 'updated_at',
  ],
  adjustments: [
    'id', 'user_id', 'order_id', 'amount', 'reason', 'adjustment_type',
    'balance_before', 'balance_after', 'created_by', 'created_at',
  ],
  audit_logs: [
    'id', 'order_id', 'action', 'actor_id', 'actor_role', 'target_id',
    'target_type', 'old_value', 'new_value', 'note', 'timestamp', 'created_at',
  ],
  invoices: [
    'id', 'user_id', 'amount', 'status', 'type', 'orders_json',
    'issued_at', 'settled_at', 'csv_url', 'is_settled',
  ],
};

async function verifySchema(): Promise<void> {
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Database Schema Verification${colors.cyan}                          ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error(`${colors.red}❌ ERROR: Missing database credentials${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}🔗 Connecting to database...${colors.reset}`);
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    await client.execute('SELECT 1');
    console.log(`${colors.green}✅ Database connected${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Failed to connect${colors.reset}`);
    process.exit(1);
  }

  const results: TableCheck[] = [];

  for (const [tableName, requiredColumns] of Object.entries(requiredTables)) {
    const check = await checkTable(client, tableName, requiredColumns);
    results.push(check);
  }

  // Print results
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Verification Results${colors.cyan}                                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  for (const result of results) {
    if (result.exists) {
      if (result.missingColumns && result.missingColumns.length > 0) {
        console.log(`${colors.yellow}⚠️  ${result.name}${colors.reset}`);
        console.log(`   Table exists but missing columns:`);
        result.missingColumns.forEach(col => {
          console.log(`   - ${col}`);
        });
      } else {
        console.log(`${colors.green}✅ ${result.name}${colors.reset} (all columns present)`);
      }
    } else {
      console.log(`${colors.red}❌ ${result.name}${colors.reset} (table missing)`);
    }
  }

  console.log('');

  const allTablesExist = results.every(r => r.exists);
  const allColumnsPresent = results.every(r => !r.missingColumns || r.missingColumns.length === 0);

  if (allTablesExist && allColumnsPresent) {
    console.log(`${colors.green}✅ All required tables and columns are present!${colors.reset}`);
    console.log('');
    console.log('📋 Your database schema is up to date.');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Schema verification failed${colors.reset}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run migration: npm run db:migrate');
    console.log('   2. Re-verify: npm run db:verify');
    console.log('');
    process.exit(1);
  }
}

async function checkTable(
  client: any,
  tableName: string,
  requiredColumns: string[]
): Promise<TableCheck> {
  try {
    const result = await client.execute(`PRAGMA table_info(${tableName})`);
    const columns = result.rows.map((row: any) => row.name);

    if (columns.length === 0) {
      return {
        name: tableName,
        exists: false,
      };
    }

    const missingColumns = requiredColumns.filter(col => !columns.includes(col));

    return {
      name: tableName,
      exists: true,
      columns,
      missingColumns,
    };
  } catch (error) {
    return {
      name: tableName,
      exists: false,
    };
  }
}

if (require.main === module) {
  verifySchema().catch((error) => {
    console.error(`${colors.red}❌ Verification failed:${colors.reset}`, error);
    process.exit(1);
  });
}

export { verifySchema };

