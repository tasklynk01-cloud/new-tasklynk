#!/usr/bin/env tsx
/**
 * Comprehensive Database Column Verification Script
 * 
 * Verifies that all critical columns from schema.ts are present in the Turso database.
 * This checks columns required for the order creation fix to work properly.
 * 
 * Usage: tsx scripts/verify-all-columns.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from production config
dotenv.config({ path: path.resolve(__dirname, '..', '.env.production'), override: true });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Critical columns from schema.ts that are required for order creation
const JOBS_CRITICAL_COLUMNS = {
  // Identity columns (unique constraints)
  'id': 'INTEGER PRIMARY KEY',
  'display_id': 'TEXT UNIQUE NOT NULL',
  'order_number': 'TEXT UNIQUE NOT NULL',
  'order_id': 'TEXT UNIQUE NOT NULL',
  
  // User relationships
  'client_id': 'INTEGER NOT NULL',
  'assigned_freelancer_id': 'INTEGER',
  'manager_id': 'INTEGER',
  'assigned_by_id': 'INTEGER',
  'delivered_by_id': 'INTEGER',
  
  // Order details
  'title': 'TEXT NOT NULL',
  'instructions': 'TEXT NOT NULL',
  'work_type': 'TEXT NOT NULL',
  'pages': 'INTEGER',
  'slides': 'INTEGER',
  'problems': 'INTEGER',
  
  // Financial fields
  'amount': 'REAL NOT NULL',
  'freelancer_earnings': 'REAL NOT NULL DEFAULT 0',
  'manager_earnings': 'REAL NOT NULL DEFAULT 0',
  'admin_profit': 'REAL NOT NULL DEFAULT 0',
  
  // Timestamps
  'deadline': 'TEXT NOT NULL',
  'actual_deadline': 'TEXT NOT NULL',
  'freelancer_deadline': 'TEXT NOT NULL',
  'created_at': 'TEXT NOT NULL',
  'updated_at': 'TEXT NOT NULL',
  
  // Status and workflow
  'status': 'TEXT NOT NULL DEFAULT \'pending\'',
  'admin_approved': 'INTEGER DEFAULT 0',
  'client_approved': 'INTEGER DEFAULT 0',
  'payment_confirmed': 'INTEGER DEFAULT 0',
  
  // Freelancer acceptance tracking
  'freelancer_accepted': 'INTEGER DEFAULT 0',
  'freelancer_accepted_at': 'TEXT',
  'freelancer_rejected': 'INTEGER DEFAULT 0',
  'freelancer_rejected_at': 'TEXT',
  'freelancer_response_pending': 'INTEGER DEFAULT 0',
  
  // Order flow timestamps
  'accepted_at': 'TEXT',
  'assigned_at': 'TEXT',
  'submitted_at': 'TEXT',
  'delivered_at': 'TEXT',
  'approved_at': 'TEXT',
  'paid_at': 'TEXT',
  'completed_at': 'TEXT',
  
  // Account order tracking
  'account_order_number': 'TEXT',
  'account_linked': 'INTEGER DEFAULT 0',
};

async function verifyColumns(): Promise<void> {
  console.log('\n' + colors.bold + colors.cyan + '════════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + colors.cyan + '  Database Column Verification for Order Creation Fix' + colors.reset);
  console.log(colors.bold + colors.cyan + '════════════════════════════════════════════════════════════════' + colors.reset + '\n');

  // Check environment
  const hasUrl = !!process.env.TURSO_CONNECTION_URL;
  const hasToken = !!process.env.TURSO_AUTH_TOKEN;

  console.log(colors.blue + '🔧 Environment Check:' + colors.reset);
  console.log(`   TURSO_CONNECTION_URL: ${hasUrl ? colors.green + '✅ Set' : colors.red + '❌ Missing'}${colors.reset}`);
  console.log(`   TURSO_AUTH_TOKEN: ${hasToken ? colors.green + '✅ Set' : colors.red + '❌ Missing'}${colors.reset}\n`);

  if (!hasUrl || !hasToken) {
    console.error(colors.red + '❌ Missing database credentials. Check .env.production file.' + colors.reset + '\n');
    process.exit(1);
  }

  // Connect to database
  console.log(colors.blue + '🔗 Connecting to Turso database...' + colors.reset);
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN!.trim(),
  });

  try {
    await client.execute('SELECT 1');
    console.log(colors.green + '✅ Connection successful\n' + colors.reset);
  } catch (error: any) {
    console.error(colors.red + `❌ Connection failed: ${error.message}\n` + colors.reset);
    process.exit(1);
  }

  // Get current table schema
  console.log(colors.blue + '📊 Checking jobs table schema...' + colors.reset);
  
  try {
    const tableInfo = await client.execute('PRAGMA table_info(jobs)');
    const existingColumns = new Set<string>(tableInfo.rows.map((row: any) => row.name));
    
    console.log(colors.cyan + `   Found ${existingColumns.size} columns in jobs table\n` + colors.reset);
    
    // Verify critical columns
    console.log(colors.bold + '🔍 Verifying Critical Columns:' + colors.reset + '\n');
    
    let allPresent = true;
    let missingCount = 0;
    let presentCount = 0;
    const missingColumns: string[] = [];
    
    for (const [columnName, columnType] of Object.entries(JOBS_CRITICAL_COLUMNS)) {
      if (existingColumns.has(columnName)) {
        console.log(`   ${colors.green}✅${colors.reset} ${columnName.padEnd(30)} ${colors.cyan}${columnType}${colors.reset}`);
        presentCount++;
      } else {
        console.log(`   ${colors.red}❌${colors.reset} ${columnName.padEnd(30)} ${colors.red}MISSING${colors.reset}`);
        allPresent = false;
        missingCount++;
        missingColumns.push(columnName);
      }
    }
    
    // Summary
    console.log('\n' + colors.cyan + '─────────────────────────────────────────────────────────────────' + colors.reset);
    console.log(colors.bold + 'Summary:' + colors.reset);
    console.log(`   ${colors.green}✅ Present: ${presentCount}${colors.reset}`);
    console.log(`   ${colors.red}❌ Missing: ${missingCount}${colors.reset}`);
    console.log(colors.cyan + '─────────────────────────────────────────────────────────────────' + colors.reset + '\n');
    
    if (allPresent) {
      console.log(colors.green + colors.bold + '✅ ALL REQUIRED COLUMNS ARE PRESENT!' + colors.reset);
      console.log(colors.green + '   The database is ready for the order creation fix.' + colors.reset + '\n');
      
      // Additional verification: Check unique constraints
      console.log(colors.blue + '🔐 Verifying unique constraints...' + colors.reset);
      try {
        const indexInfo = await client.execute('PRAGMA index_list(jobs)');
        const uniqueIndexes = indexInfo.rows.filter((row: any) => row.unique === 1);
        console.log(colors.green + `   ✅ Found ${uniqueIndexes.length} unique indexes` + colors.reset);
        
        for (const idx of uniqueIndexes) {
          const idxName = idx.name as string;
          const columns = await client.execute(`PRAGMA index_info(${idxName})`);
          const colNames = columns.rows.map((r: any) => r.name).join(', ');
          console.log(`      - ${idxName}: ${colNames}`);
        }
        console.log('');
      } catch (e) {
        console.log(colors.yellow + '   ⚠️  Could not verify unique constraints (non-critical)' + colors.reset + '\n');
      }
      
      process.exit(0);
    } else {
      console.log(colors.red + colors.bold + '❌ MISSING COLUMNS DETECTED!' + colors.reset);
      console.log(colors.yellow + '\nMissing columns:' + colors.reset);
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log(colors.yellow + '\nTo fix, run:' + colors.reset);
      console.log(colors.cyan + '   npm run db:push' + colors.reset);
      console.log(colors.yellow + '\nOr manually add columns using:' + colors.reset);
      console.log(colors.cyan + '   tsx scripts/add-missing-columns.ts' + colors.reset + '\n');
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error(colors.red + `\n❌ Error checking schema: ${error.message}\n` + colors.reset);
    process.exit(1);
  }
}

// Run verification
verifyColumns().catch((error) => {
  console.error(colors.red + 'Unexpected error:', error, colors.reset);
  process.exit(1);
});
