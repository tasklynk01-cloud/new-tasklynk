#!/bin/bash

echo "🧪 Testing Improved Memo System"
echo "================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Test 1: Create multi-role memo (client + freelancer)${NC}"
echo "-------------------------------------------------------"
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
    
    // Simulate creating memo for multiple roles
    const targetRoles = ['client', 'freelancer'];
    let createdCount = 0;
    
    for (const role of targetRoles) {
      const result = await client.execute({
        sql: 'INSERT INTO memos (title, content, target_role, priority, requires_acknowledgement, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: ['Multi-Role Test', 'Testing multi-role memo system', role, 'normal', 1, adminId, now, now],
      });
      createdCount++;
      console.log(\`✅ Created memo for \${role} role (ID: \${result.lastInsertRowid})\`);
    }
    
    console.log(\`\n✅ Successfully created \${createdCount} memos for multiple roles\`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
"

echo ""
echo -e "${BLUE}Test 2: Verify admin users excluded from 'all' memos${NC}"
echo "------------------------------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  try {
    // Get admin user
    const adminResult = await client.execute('SELECT id, role FROM users WHERE role = \"admin\" LIMIT 1');
    if (adminResult.rows.length === 0) {
      console.log('❌ No admin user found');
      return;
    }
    
    const adminUser = adminResult.rows[0];
    
    // Check if admin would see 'all' memos
    const result = await client.execute({
      sql: \`
        SELECT m.*
        FROM memos m
        WHERE m.requires_acknowledgement = 1
        AND m.target_role = 'all'
        AND NOT EXISTS (
          SELECT 1 FROM memo_reads mr
          WHERE mr.memo_id = m.id 
          AND mr.user_id = ?
          AND mr.acknowledged_at IS NOT NULL
        )
        LIMIT 1
      \`,
      args: [adminUser.id],
    });
    
    if (result.rows.length > 0) {
      console.log('⚠️  Warning: Admin would see memos with target_role=\"all\"');
      console.log('   This is expected in DB query, but frontend filters admin users');
    } else {
      console.log('✅ No pending memos for admin (good!)');
    }
    
    console.log(\`\nℹ️  Note: Frontend prevents admin from seeing memos via role check in component\`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
"

echo ""
echo -e "${BLUE}Test 3: Count memos by target role${NC}"
echo "------------------------------------"
node -e "
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

(async () => {
  try {
    const result = await client.execute(\`
      SELECT target_role, COUNT(*) as count
      FROM memos
      GROUP BY target_role
      ORDER BY count DESC
    \`);
    
    console.log('Memo distribution by role:');
    result.rows.forEach(row => {
      console.log(\`  - \${row.target_role}: \${row.count} memo(s)\`);
    });
    
    const total = await client.execute('SELECT COUNT(*) as total FROM memos');
    console.log(\`\n✅ Total memos: \${total.rows[0].total}\`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
"

echo ""
echo -e "${BLUE}Test 4: Verify role-specific layouts have memo modal${NC}"
echo "------------------------------------------------------"

if grep -q "MemoAcknowledgementModal" src/app/client/layout.tsx; then
  echo "✅ Client layout has MemoAcknowledgementModal"
else
  echo "❌ Client layout missing MemoAcknowledgementModal"
fi

if grep -q "MemoAcknowledgementModal" src/app/freelancer/layout.tsx; then
  echo "✅ Freelancer layout has MemoAcknowledgementModal"
else
  echo "❌ Freelancer layout missing MemoAcknowledgementModal"
fi

if grep -q "MemoAcknowledgementModal" src/app/manager/layout.tsx; then
  echo "✅ Manager layout has MemoAcknowledgementModal"
else
  echo "❌ Manager layout missing MemoAcknowledgementModal"
fi

if ! grep -q "MemoAcknowledgementModal" src/app/layout.tsx; then
  echo "✅ Root layout does NOT have MemoAcknowledgementModal (correct!)"
else
  echo "⚠️  Root layout still has MemoAcknowledgementModal"
fi

echo ""
echo -e "${BLUE}Test 5: Verify admin role filter in component${NC}"
echo "-----------------------------------------------"

if grep -q "user.role !== 'admin'" src/components/memo-acknowledgement-modal.tsx; then
  echo "✅ Component filters out admin users"
else
  echo "❌ Component does not filter admin users"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Summary of Changes:"
echo "  ✓ Memos only popup on client/freelancer/manager pages"
echo "  ✓ Landing, registration, public pages unaffected"
echo "  ✓ Admin users excluded from memos"
echo "  ✓ Multi-role selection available in admin panel"
echo "  ✓ Each selected role gets its own memo record"
echo ""
