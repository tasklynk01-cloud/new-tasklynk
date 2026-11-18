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
  try {
    const res = await pool.query(`
      SELECT id, email, name, role, status, approved, created_at, phone
      FROM users
      WHERE role ILIKE '%admin%' OR role ILIKE '%manager%'
      ORDER BY id ASC
    `);

    console.log('=== ADMIN & PRIVILEGED ACCOUNTS ===');
    console.table(res.rows);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying admins:', err);
  } finally {
    await pool.end();
  }
}

main();
