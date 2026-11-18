/**
 * Fix User Approval Status Synchronization
 * 
 * This script ensures that the `approved` field and `status` field are synchronized:
 * - If approved=true, status should be 'active'
 * - If approved=false, status should be 'pending' (unless suspended/rejected)
 * 
 * Run with: node fix-user-approval-status.js
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL || process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixUserApprovalStatus() {
  console.log('🔧 Starting user approval status synchronization...\n');

  try {
    // Get all users
    const result = await db.execute('SELECT id, displayId, email, name, role, approved, status FROM users');
    const users = result.rows;

    console.log(`📊 Found ${users.length} users to check\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of users) {
      const userId = user.id;
      const displayId = user.displayId;
      const email = user.email;
      const name = user.name;
      const role = user.role;
      const approved = user.approved === 1 || user.approved === true;
      const status = user.status;

      // Determine what the status should be
      let correctStatus = status;
      let needsUpdate = false;

      // Skip if suspended or rejected - these are special states
      if (status === 'suspended' || status === 'rejected') {
        console.log(`⏭️  Skipping ${displayId} (${role}) - Status: ${status} (special state)`);
        alreadyCorrectCount++;
        continue;
      }

      // If approved=true, status should be 'active'
      if (approved && status !== 'active') {
        correctStatus = 'active';
        needsUpdate = true;
      }

      // If approved=false, status should be 'pending'
      if (!approved && status !== 'pending') {
        correctStatus = 'pending';
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`🔄 Fixing ${displayId} (${role}): approved=${approved}, status="${status}" → "${correctStatus}"`);
        
        await db.execute({
          sql: 'UPDATE users SET status = ?, updatedAt = ? WHERE id = ?',
          args: [correctStatus, new Date().toISOString(), userId]
        });

        fixedCount++;
      } else {
        console.log(`✅ ${displayId} (${role}): approved=${approved}, status="${status}" (correct)`);
        alreadyCorrectCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total users checked: ${users.length}`);
    console.log(`   ✅ Already correct: ${alreadyCorrectCount}`);
    console.log(`   🔄 Fixed: ${fixedCount}`);
    console.log('='.repeat(60));

    if (fixedCount > 0) {
      console.log('\n✅ User approval status synchronization completed successfully!');
      console.log('   All approved users now have status="active"');
      console.log('   All unapproved users now have status="pending"');
    } else {
      console.log('\n✅ All user statuses were already correct!');
    }

  } catch (error) {
    console.error('\n❌ Error fixing user approval status:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixUserApprovalStatus()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
