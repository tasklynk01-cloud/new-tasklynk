#!/usr/bin/env tsx
/**
 * Database Backup Tool
 * 
 * Creates a backup of critical database tables before running migrations.
 * 
 * Usage:
 *   tsx scripts/backup-database.ts
 *   OR
 *   npm run db:backup
 */

import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';
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

async function backupDatabase(): Promise<void> {
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Database Backup Tool${colors.cyan}                                  ║${colors.reset}`);
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

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

  console.log(`${colors.blue}📦 Creating backup...${colors.reset}\n`);

  const backup: any = {
    timestamp: new Date().toISOString(),
    database: process.env.TURSO_CONNECTION_URL,
    tables: {},
  };

  const tablesToBackup = [
    'users',
    'jobs',
    'pending_registrations',
    'balances',
    'invoices',
    'payments',
  ];

  for (const tableName of tablesToBackup) {
    try {
      console.log(`${colors.blue}  Backing up ${tableName}...${colors.reset}`);
      const result = await client.execute(`SELECT * FROM ${tableName}`);
      backup.tables[tableName] = {
        rowCount: result.rows.length,
        data: result.rows,
      };
      console.log(`${colors.green}  ✅ ${tableName}: ${result.rows.length} rows${colors.reset}`);
    } catch (error: any) {
      console.log(`${colors.yellow}  ⚠️  ${tableName}: ${error.message}${colors.reset}`);
      backup.tables[tableName] = {
        rowCount: 0,
        error: error.message,
      };
    }
  }

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  console.log('');
  console.log(`${colors.green}✅ Backup created successfully!${colors.reset}`);
  console.log(`${colors.blue}📁 Location: ${backupPath}${colors.reset}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Run migration: npm run db:migrate');
  console.log('   2. Verify: npm run db:verify');
  console.log('');

  await client.close();
}

if (require.main === module) {
  backupDatabase().catch((error) => {
    console.error(`${colors.red}❌ Backup failed:${colors.reset}`, error);
    process.exit(1);
  });
}

export { backupDatabase };

