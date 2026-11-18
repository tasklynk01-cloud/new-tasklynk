// Simple script to add columns using raw HTTP request to Turso
// Run: node scripts/add-columns-direct.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const url = envVars.TURSO_CONNECTION_URL;
const token = envVars.TURSO_AUTH_TOKEN;

console.log('URL:', url);
console.log('Token length:', (token || '').length);

if (!url || !token) {
  console.error('Missing credentials');
  process.exit(1);
}

// Create libsql client
const { createClient } = require('@libsql/client');
const client = createClient({
  url: url,
  authToken: token,
});

async function run() {
  // Check current columns
  const info = await client.execute('PRAGMA table_info(jobs)');
  const columns = info.rows.map(r => r.name);
  console.log('Found', columns.length, 'columns');
  
  // Add missing columns
  const toAdd = ['assigned_by_id', 'delivered_by_id'];
  for (const col of toAdd) {
    if (!columns.includes(col)) {
      console.log('Adding', col);
      try {
        await client.execute(`ALTER TABLE jobs ADD COLUMN ${col} INTEGER`);
        console.log('Added', col);
      } catch (e) {
        console.error('Failed:', e.message);
      }
    } else {
      console.log(col, 'already exists');
    }
  }
  
  console.log('Done');
}

run().catch(console.error);
