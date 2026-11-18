#!/bin/bash

echo "🧪 Testing Memo System Fixes"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Test 1: Verify memos table structure"
echo "--------------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  const schema = await client.execute('PRAGMA table_info(memos)');
  const columns = schema.rows.map(r => r.name);
  console.log('Columns:', columns.join(', '));
  
  const required = ['id', 'title', 'content', 'target_role', 'priority', 'requires_acknowledgement', 'created_by', 'created_at', 'updated_at'];
  const missing = required.filter(col => !columns.includes(col));
  
  if (missing.length === 0) {
    console.log('✅ All required columns present');
  } else {
    console.log('❌ Missing columns:', missing.join(', '));
  }
})();
"

echo ""
echo "Test 2: Verify memo_reads table structure"
echo "-------------------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  const schema = await client.execute('PRAGMA table_info(memo_reads)');
  const columns = schema.rows.map(r => r.name);
  console.log('Columns:', columns.join(', '));
  
  const required = ['id', 'memo_id', 'user_id', 'read_at', 'acknowledged_at'];
  const missing = required.filter(col => !columns.includes(col));
  
  if (missing.length === 0) {
    console.log('✅ All required columns present');
  } else {
    console.log('❌ Missing columns:', missing.join(', '));
  }
})();
"

echo ""
echo "Test 3: Test memo creation (simulated)"
echo "---------------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  try {
    const adminResult = await client.execute('SELECT id FROM users WHERE role = \"admin\" LIMIT 1');
    if (adminResult.rows.length === 0) {
      console.log('❌ No admin user found');
      return;
    }
    
    const adminId = adminResult.rows[0].id;
    const now = new Date().toISOString();
    
    const result = await client.execute({
      sql: 'INSERT INTO memos (title, content, target_role, priority, requires_acknowledgement, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: ['Test Memo ' + Date.now(), 'This is a test memo', 'all', 'normal', 1, adminId, now, now],
    });
    
    console.log('✅ Memo created successfully, ID:', result.lastInsertRowid.toString());
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
"

echo ""
echo "Test 4: Test memo acknowledgement (simulated)"
echo "-----------------------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  try {
    // Get latest memo
    const memoResult = await client.execute('SELECT id FROM memos ORDER BY created_at DESC LIMIT 1');
    if (memoResult.rows.length === 0) {
      console.log('❌ No memos found');
      return;
    }
    
    const memoId = memoResult.rows[0].id;
    
    // Get a test user (client or freelancer)
    const userResult = await client.execute('SELECT id FROM users WHERE role IN (\"client\", \"freelancer\") AND approved = 1 LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ No approved user found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    const now = new Date().toISOString();
    
    // Insert memo_read (without created_at)
    const result = await client.execute({
      sql: 'INSERT INTO memo_reads (memo_id, user_id, read_at, acknowledged_at) VALUES (?, ?, ?, ?)',
      args: [memoId, userId, now, now],
    });
    
    console.log('✅ Memo acknowledgement created successfully');
    console.log('   Memo ID:', memoId.toString());
    console.log('   User ID:', userId.toString());
    
    // Verify it was inserted
    const verify = await client.execute({
      sql: 'SELECT * FROM memo_reads WHERE memo_id = ? AND user_id = ?',
      args: [memoId, userId],
    });
    
    if (verify.rows.length > 0) {
      console.log('✅ Acknowledgement verified in database');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
"

echo ""
echo "Test 5: Test pending memo query"
echo "---------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  try {
    // Get a test user
    const userResult = await client.execute('SELECT id, role FROM users WHERE approved = 1 AND role != \"admin\" LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('⚠️  No approved users found (other than admin)');
      return;
    }
    
    const user = userResult.rows[0];
    const userId = user.id;
    const userRole = user.role;
    
    // Query pending memos (same query as API)
    const result = await client.execute({
      sql: \`
        SELECT m.*
        FROM memos m
        WHERE m.requires_acknowledgement = 1
        AND (m.target_role = ? OR m.target_role = 'all')
        AND (m.expires_at IS NULL OR datetime(m.expires_at) > datetime('now'))
        AND NOT EXISTS (
          SELECT 1 FROM memo_reads mr
          WHERE mr.memo_id = m.id 
          AND mr.user_id = ?
          AND mr.acknowledged_at IS NOT NULL
        )
        ORDER BY m.created_at ASC
        LIMIT 1
      \`,
      args: [userRole, userId],
    });
    
    console.log('User:', userId.toString(), 'Role:', userRole);
    console.log('Pending memos:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('✅ Query works, found pending memo:', result.rows[0].title);
    } else {
      console.log('ℹ️  No pending memos (user may have acknowledged all)');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
"

echo ""
echo "=============================="
echo "✅ All tests completed!"
echo ""
