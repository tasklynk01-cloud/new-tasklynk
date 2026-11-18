import 'dotenv/config';
import { createClient } from '@libsql/client';

async function addMissingColumnsToFreelancerProfiles() {
  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Missing Turso database credentials in environment');
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('[DB] Checking freelancer_profiles table structure...');
    const tableInfo = await client.execute({ sql: 'PRAGMA table_info(freelancer_profiles);' });
    const currentColumns = tableInfo.rows?.map(r => r[1] as string) ?? [];
    console.log('[DB] Current columns:', currentColumns);
    
    // Check and add missing columns one by one
    const columnsToAdd = [
      { name: 'current_tier_id', sql: 'ALTER TABLE freelancer_profiles ADD COLUMN current_tier_id INTEGER;' },
      { name: 'available_days', sql: 'ALTER TABLE freelancer_profiles ADD COLUMN available_days TEXT;' },
      { name: 'available_time_start', sql: 'ALTER TABLE freelancer_profiles ADD COLUMN available_time_start TEXT;' },
      { name: 'available_time_end', sql: 'ALTER TABLE freelancer_profiles ADD COLUMN available_time_end TEXT;' },
    ];

    let addedCount = 0;
    for (const column of columnsToAdd) {
      if (currentColumns.includes(column.name)) {
        console.log(`[DB] ✓ Column ${column.name} already exists`);
      } else {
        console.log(`[DB] Adding column ${column.name}...`);
        await client.execute({ sql: column.sql });
        console.log(`[DB] ✅ Column ${column.name} added successfully`);
        addedCount++;
      }
    }

    if (addedCount === 0) {
      console.log('[DB] No columns needed to be added - all present!');
    } else {
      console.log(`[DB] ✅ Added ${addedCount} missing column(s)`);
    }
    
    // Verify the final structure
    const verifyInfo = await client.execute({ sql: 'PRAGMA table_info(freelancer_profiles);' });
    console.log('[DB] Final columns:', verifyInfo.rows?.map(r => r[1]));
  } finally {
    await client.close();
  }
}

addMissingColumnsToFreelancerProfiles().catch((error) => {
  console.error('[DB] Failed to add current_tier_id column:', error);
  process.exitCode = 1;
});
