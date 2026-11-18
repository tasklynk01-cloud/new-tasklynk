const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ewdbrfwqtlijyyaftlcp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3ZGJyZndxdGxpanl5YWZ0bGNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDMxODE4NCwiZXhwIjoyMDk5ODk0MTg0fQ.ZIEMvGQ9FyPA36So7O-BMA1-QenDkjDaINfebgIbP5Q';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc`);
    const postData = JSON.stringify({ query: sql });

    // Try the pg_net approach or direct SQL
    // Actually, Supabase doesn't have a generic SQL exec endpoint
    // Let's use the Management API instead

    const options = {
      hostname: 'ewdbrfwqtlijyyaftlcp.supabase.co',
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'drizzle', '0000_fine_randall_flagg.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log(`SQL file size: ${sql.length} bytes`);
  console.log('Note: Supabase does not have a direct SQL execution API endpoint.');
  console.log('Please run the SQL file in the Supabase SQL Editor:');
  console.log(`\n1. Go to: https://supabase.com/dashboard/project/ewdbrfwqtlijyyaftlcp/sql/new`);
  console.log(`2. Paste the contents of: ${sqlPath}`);
  console.log(`3. Click "Run"\n`);

  // Verify connection via REST API
  try {
    const result = await executeSQL('');
    console.log(`API test result: ${result.status}`);
  } catch (err) {
    console.log(`API test: ${err.message}`);
  }
}

main();
