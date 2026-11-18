#!/usr/bin/env tsx
/**
 * Database Status Checker
 * 
 * Comprehensive database health check and status report.
 * 
 * Usage:
 *   tsx scripts/check-database-status.ts
 *   OR
 *   npm run db:status
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

async function checkDatabaseStatus(): Promise<void> {
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Database Status Report${colors.cyan}                                ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  // Check environment
  console.log(`${colors.blue}🔧 Environment Check${colors.reset}`);
  const hasUrl = !!process.env.TURSO_CONNECTION_URL;
  const hasToken = !!process.env.TURSO_AUTH_TOKEN;

  console.log(`   TURSO_CONNECTION_URL: ${hasUrl ? colors.green + '✅' + colors.reset : colors.red + '❌' + colors.reset}`);
  console.log(`   TURSO_AUTH_TOKEN: ${hasToken ? colors.green + '✅' + colors.reset : colors.red + '❌' + colors.reset}`);

  if (!hasUrl || !hasToken) {
    console.log('');
    console.log(`${colors.red}❌ Missing database credentials${colors.reset}`);
    console.log('   Run: npm run setup:phase3');
    process.exit(1);
  }

  console.log('');

  // Connect to database
  console.log(`${colors.blue}🔗 Connecting to database...${colors.reset}`);
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    await client.execute('SELECT 1');
    console.log(`${colors.green}✅ Connection successful${colors.reset}\n`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Connection failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Check tables
  console.log(`${colors.blue}📊 Table Status${colors.reset}`);
  console.log('');

  const criticalTables = [
    'users',
    'jobs',
    'pending_registrations',
    'internal_revisions',
    'balances',
    'adjustments',
    'audit_logs',
    'invoices',
    'payments',
  ];

  let allTablesExist = true;

  for (const tableName of criticalTables) {
    try {
      const result = await client.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      const count = result.rows[0]?.count || 0;
      console.log(`   ${colors.green}✅${colors.reset} ${tableName.padEnd(25)} ${count} rows`);
    } catch (error: any) {
      console.log(`   ${colors.red}❌${colors.reset} ${tableName.padEnd(25)} ${colors.red}Missing${colors.reset}`);
      allTablesExist = false;
    }
  }

  console.log('');

  // Check specific columns in jobs table
  console.log(`${colors.blue}🔍 Jobs Table Column Check${colors.reset}`);
  console.log('');

  const requiredJobsColumns = [
    'assigned_at',
    'is_invoiced',
    'manager_assigned_fee',
    'has_open_internal_revision',
  ];

  try {
    const tableInfo = await client.execute('PRAGMA table_info(jobs)');
    const existingColumns = tableInfo.rows.map((row: any) => row.name);

    let allColumnsExist = true;
    for (const col of requiredJobsColumns) {
      const exists = existingColumns.includes(col);
      console.log(`   ${exists ? colors.green + '✅' + colors.reset : colors.red + '❌' + colors.reset} ${col}`);
      if (!exists) allColumnsExist = false;
    }

    if (!allColumnsExist) {
      allTablesExist = false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Could not check jobs table${colors.reset}`);
    allTablesExist = false;
  }

  console.log('');

  // Summary
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Summary${colors.cyan}                                                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  if (allTablesExist) {
    console.log(`${colors.green}✅ Database schema is complete and up to date!${colors.reset}`);
    console.log('');
    console.log('📋 Your database is ready for production.');
    console.log('');
  } else {
    console.log(`${colors.red}❌ Database schema is incomplete${colors.reset}`);
    console.log('');
    console.log('📋 Action required:');
    console.log('   1. Run migration: npm run db:migrate');
    console.log('   2. Verify: npm run db:verify');
    console.log('   3. Re-check: npm run db:status');
    console.log('');
  }

  await client.close();
}

if (require.main === module) {
  checkDatabaseStatus().catch((error) => {
    console.error(`${colors.red}❌ Status check failed:${colors.reset}`, error);
    process.exit(1);
  });
}

export { checkDatabaseStatus };

