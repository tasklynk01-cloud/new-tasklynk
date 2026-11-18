import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from '../src/db/schema';
import { getTableColumns, isTable } from 'drizzle-orm';

dotenv.config({ override: true });

async function runAudit() {
  const dbUrl = (process.env.DATABASE_URL || '').trim().split('?')[0];
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();

  try {
    // 1. Get all public tables in database
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const dbTables = new Set(tablesRes.rows.map(r => r.table_name));
    console.log(`\nFound ${dbTables.size} public tables in database.`);

    // 2. Get all columns for public tables in database
    const colsRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    const dbColumnsByTable: Record<string, Set<string>> = {};
    for (const row of colsRes.rows) {
      if (!dbColumnsByTable[row.table_name]) {
        dbColumnsByTable[row.table_name] = new Set();
      }
      dbColumnsByTable[row.table_name].add(row.column_name);
    }

    // 3. Extract all Drizzle tables defined in src/db/schema.ts
    const schemaTables: Record<string, { tableName: string; columns: string[] }> = {};
    for (const [exportName, exportedItem] of Object.entries(schema)) {
      if (isTable(exportedItem)) {
        const tableName = (exportedItem as any)[Symbol.for('drizzle:Name')] || (exportedItem as any)._?.name;
        if (tableName) {
          try {
            const colsObj = getTableColumns(exportedItem as any);
            // Use the actual SQL column name (col.name), not the TS property key
            const sqlColNames = Object.values(colsObj).map((c: any) => c.name);
            schemaTables[tableName] = {
              tableName,
              columns: sqlColNames,
            };
          } catch (e) {
            // fallback
          }
        }
      }
    }

    console.log(`Extracted ${Object.keys(schemaTables).length} tables from src/db/schema.ts.\n`);

    // 4. Compare tables
    const missingTablesInDb: string[] = [];
    const tableComparison: Record<string, { missingColsInDb: string[]; dbColCount: number; schemaColCount: number }> = {};

    for (const [tableName, info] of Object.entries(schemaTables)) {
      if (!dbTables.has(tableName)) {
        missingTablesInDb.push(tableName);
      } else {
        const dbCols = dbColumnsByTable[tableName] || new Set();
        const missingCols: string[] = [];
        for (const col of info.columns) {
          if (!dbCols.has(col)) {
            missingCols.push(col);
          }
        }
        tableComparison[tableName] = {
          missingColsInDb: missingCols,
          dbColCount: dbCols.size,
          schemaColCount: info.columns.length,
        };
      }
    }

    // Check migration journal and applied migrations
    let appliedMigrations: string[] = [];
    try {
      const migRes = await client.query('SELECT * FROM "__drizzle_migrations" ORDER BY id;');
      appliedMigrations = migRes.rows.map(r => r.tag || r.name || String(r.id));
    } catch {
      // no __drizzle_migrations table
    }

    // Report
    console.log('=== AUDIT RESULTS ===');
    console.log(`Applied Drizzle migrations in DB: ${appliedMigrations.length}`);
    if (appliedMigrations.length > 0) {
      console.log(`  Migrations: ${appliedMigrations.join(', ')}`);
    }

    console.log(`\nMissing Tables in DB (${missingTablesInDb.length}):`);
    if (missingTablesInDb.length === 0) {
      console.log('  ✅ ALL tables in src/db/schema.ts exist in the database!');
    } else {
      missingTablesInDb.forEach(t => console.log(`  ❌ Missing table: ${t}`));
    }

    let totalMissingColumns = 0;
    const tablesWithMissingCols: string[] = [];
    for (const [tableName, comp] of Object.entries(tableComparison)) {
      if (comp.missingColsInDb.length > 0) {
        totalMissingColumns += comp.missingColsInDb.length;
        tablesWithMissingCols.push(tableName);
      }
    }

    console.log(`\nColumn Integrity Check:`);
    if (tablesWithMissingCols.length === 0) {
      console.log('  ✅ ALL columns defined across all schema tables exist in the database!');
    } else {
      console.log(`  ⚠️ Found ${totalMissingColumns} missing columns across ${tablesWithMissingCols.length} tables:`);
      for (const t of tablesWithMissingCols) {
        console.log(`    Table "${t}" missing columns: ${tableComparison[t].missingColsInDb.join(', ')}`);
      }
    }

    // Additional check: specialist profiles and freelance profiles
    console.log('\nCritical Table Row Counts & Sanity Check:');
    const sampleTables = ['users', 'freelancer_profiles', 'jobs', 'payments', 'reviews', 'email_templates', 'domains', 'alex_settings'];
    for (const st of sampleTables) {
      if (dbTables.has(st)) {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM "${st}";`);
        console.log(`  - ${st}: ${countRes.rows[0].count} rows (DB cols: ${dbColumnsByTable[st]?.size || 0}, Schema cols: ${schemaTables[st]?.columns.length || 'N/A'})`);
      }
    }

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runAudit();
