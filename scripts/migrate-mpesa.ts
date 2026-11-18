import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMpesaMigration() {
  console.log('[M-Pesa Migration] Running M-PESA production payment migration...');
  const migrationPath = path.join(__dirname, '../drizzle/0005_mpesa_production_system.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  // Split by statements while ignoring empty lines
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
      console.log('✓ Executed:', statement.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (err: any) {
      // Ignore if index or column already exists
      if (err.message?.includes('already exists') || err.message?.includes('duplicate column')) {
        console.log('- Skipped (already exists):', statement.substring(0, 50).replace(/\n/g, ' '));
      } else {
        console.error('❌ Failed statement:', statement, err.message);
        throw err;
      }
    }
  }

  console.log('[M-Pesa Migration] ✓ Migration completed successfully!');
  process.exit(0);
}

runMpesaMigration().catch(err => {
  console.error('[M-Pesa Migration] Migration error:', err);
  process.exit(1);
});
