import { createClient } from '@libsql/client';
import 'dotenv/config';

async function checkJobsColumns() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log('Checking jobs table columns...\n');

  try {
    // Get table info
    const result = await client.execute('PRAGMA table_info(jobs)');
    
    console.log('Jobs table columns:');
    console.log('==================');
    
    const columnNames: string[] = [];
    for (const row of result.rows) {
      const name = row.name as string;
      const type = row.type as string;
      const notnull = row.notnull as number;
      const dfltValue = row.dflt_value;
      columnNames.push(name);
      console.log(`${name} (${type})${notnull ? ' NOT NULL' : ''}${dfltValue !== null ? ` DEFAULT ${dfltValue}` : ''}`);
    }

    // Check for the specific columns we need
    const requiredColumns = [
      'freelancer_accepted',
      'freelancer_accepted_at',
      'freelancer_rejected',
      'freelancer_rejected_at',
      'freelancer_rejection_reason',
      'freelancer_response_pending'
    ];

    console.log('\n\nChecking required columns:');
    console.log('=========================');
    
    for (const col of requiredColumns) {
      const exists = columnNames.includes(col);
      console.log(`${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Try a test update to see if there's any issue
    console.log('\n\nTesting update query on job ID 90...');
    const testQuery = await client.execute({
      sql: `SELECT id, status, freelancer_accepted, freelancer_rejected FROM jobs WHERE id = ?`,
      args: [90]
    });
    
    if (testQuery.rows.length > 0) {
      console.log('Job 90 current state:', testQuery.rows[0]);
    } else {
      console.log('Job 90 not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

checkJobsColumns();
