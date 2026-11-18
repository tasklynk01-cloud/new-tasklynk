const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const url = (process.env.DATABASE_URL || '').split('?')[0];
  if (!url) {
    console.error('No DATABASE_URL found in .env');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  const sqlPath = path.resolve(__dirname, '../migrations/add_centralized_paystack_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying migration from:', sqlPath);
  await pool.query(sql);
  console.log('Migration applied successfully!');

  // Verify columns in payments
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payments'");
  console.log('Payments columns:', cols.rows.map(r => r.column_name).join(', '));

  // Verify webhook_events table
  const tbl = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'webhook_events'");
  console.log('Webhook events table exists:', tbl.rows.length > 0);

  await pool.end();
}

run().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});
