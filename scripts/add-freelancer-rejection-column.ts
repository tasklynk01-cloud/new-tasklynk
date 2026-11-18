import { createClient } from '@libsql/client';
import 'dotenv/config';

async function addMissingColumn() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log('Adding missing freelancer_rejection_reason column...\n');

  try {
    // Check if column exists
    const tableInfo = await client.execute('PRAGMA table_info(jobs)');
    const columns = tableInfo.rows.map(row => row.name);
    
    if (columns.includes('freelancer_rejection_reason')) {
      console.log('✅ Column freelancer_rejection_reason already exists');
      return;
    }

    // Add the missing column
    await client.execute(`
      ALTER TABLE jobs 
      ADD COLUMN freelancer_rejection_reason TEXT
    `);
    
    console.log('✅ Successfully added freelancer_rejection_reason column');

    // Verify the column was added
    const verifyInfo = await client.execute('PRAGMA table_info(jobs)');
    const newColumns = verifyInfo.rows.map(row => row.name);
    
    if (newColumns.includes('freelancer_rejection_reason')) {
      console.log('✅ Verified: Column exists in database');
    } else {
      console.log('❌ ERROR: Column was not added');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

addMissingColumn();
