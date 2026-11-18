const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const tls = require('tls');

// Disable certificate verification for Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = 'postgresql://postgres.ewdbrfwqtlijyyaftlcp:KmjdiMRNEYmv8rMm@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      // Force SNI by setting servername
      servername: 'aws-0-us-east-2.pooler.supabase.com',
    },
    connectionTimeoutMillis: 30000,
    max: 1,
  });

  try {
    console.log('Testing connection...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connected:', res.rows[0]);

    // Read SQL migration file
    const sqlPath = path.join(__dirname, '..', 'drizzle', '0000_fine_randall_flagg.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log(`Executing SQL migration (${sql.length} bytes)...`);

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt);
        successCount++;
        if ((i + 1) % 50 === 0) {
          console.log(`Progress: ${i + 1}/${statements.length} statements executed`);
        }
      } catch (err) {
        errorCount++;
        // Skip duplicate table/column errors (expected when re-running)
        if (!err.message.includes('already exists') && !err.message.includes('duplicate key')) {
          console.error(`Error on statement ${i + 1}:`, err.message);
          console.error('Statement:', stmt.substring(0, 200));
        }
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors (skipped): ${errorCount}`);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
