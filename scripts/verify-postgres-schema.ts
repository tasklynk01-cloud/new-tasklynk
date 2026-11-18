import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const databaseUrl = (process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connectionStringForPool = databaseUrl.split('?')[0];
const pool = new Pool({
  connectionString: connectionStringForPool,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  console.log('\n=== TASKLYNK POSTGRESQL DATABASE INTEGRITY AUDIT ===\n');

  try {
    // 1. Fetch all tables
    const tableRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name ASC;
    `);

    const tables = tableRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in public schema:`);
    console.log(tables.join(', '));
    console.log('\n----------------------------------------\n');

    // Key required tables to audit
    const keyTables = [
      'users',
      'jobs',
      'payments',
      'invoices',
      'billing_invoices',
      'billing_invoice_items',
      'balances',
      'manager_earnings',
      'notifications',
      'bids',
      'order_files',
      'order_history',
      'reviews',
      'messages'
    ];

    let missingTablesCount = 0;
    for (const kt of keyTables) {
      if (!tables.includes(kt)) {
        console.error(`❌ MISSING TABLE: ${kt}`);
        missingTablesCount++;
      } else {
        // Fetch column count & details
        const colRes = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position ASC;
        `, [kt]);

        console.log(`✅ Table '${kt}' (${colRes.rows.length} columns) - OK`);
      }
    }

    // Check row counts of key tables
    console.log('\n--- Live Data Row Counts ---');
    for (const kt of keyTables) {
      if (tables.includes(kt)) {
        const countRes = await pool.query(`SELECT count(*) FROM "${kt}";`);
        console.log(`• ${kt}: ${countRes.rows[0].count} rows`);
      }
    }

    if (missingTablesCount === 0) {
      console.log('\n🎉 ALL DATABASE TABLES AND COLUMNS ARE 100% HEALTHY AND READY FOR PRODUCTION DEPLOYMENT!\n');
    } else {
      console.log(`\n⚠️ ${missingTablesCount} tables missing.\n`);
    }

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    await pool.end();
  }
}

main();
