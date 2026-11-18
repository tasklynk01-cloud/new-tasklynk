import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

import { createClient } from '@libsql/client';

async function addMissingColumns() {
  const client = createClient({
    url: (process.env.TURSO_CONNECTION_URL || '').trim(),
    authToken: (process.env.TURSO_AUTH_TOKEN || '').trim(),
  });

  console.log('Adding missing columns to jobs table...');

  // Check if columns exist first
  const tableInfo = await client.execute('PRAGMA table_info(jobs)');
  const columns = tableInfo.rows.map((row: any) => row.name);
  console.log('Existing columns:', columns.length);

  // Add missing columns
  const columnsToAdd = [
    { name: 'assigned_by_id', sql: 'ALTER TABLE jobs ADD COLUMN assigned_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL' },
    { name: 'delivered_by_id', sql: 'ALTER TABLE jobs ADD COLUMN delivered_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL' },
  ];

  for (const col of columnsToAdd) {
    if (!columns.includes(col.name)) {
      try {
        await client.execute(col.sql);
        console.log(`✅ Added column: ${col.name}`);
      } catch (err: any) {
        if (err.message?.includes('duplicate column')) {
          console.log(`⏭️ Column ${col.name} already exists`);
        } else {
          console.error(`❌ Failed to add column ${col.name}:`, err.message);
        }
      }
    } else {
      console.log(`⏭️ Column ${col.name} already exists`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

addMissingColumns().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
