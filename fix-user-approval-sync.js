/**
 * Fix User Approval Status Synchronization
 * 
 * Problem: Some users have status='active' but approved=false
 * This causes them to see "pending approval" even though admin approved them
 * 
 * Solution: Sync approved and status fields
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixUserApprovalSync() {
  console.log('🔧 USER APPROVAL STATUS SYNCHRONIZATION FIX\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Find mismatched users
    console.log('\n📋 Step 1: Finding mismatched users...\n');
    
    const mismatchQuery = `
      SELECT 
        id,
        email,
        name,
        role,
        approved,
        status
      FROM users
      WHERE 
        (approved = 0 AND (status = 'active' OR status = 'approved'))
        OR
        (approved = 1 AND status = 'pending')
    `;
    
    const mismatches = await client.execute(mismatchQuery);
    
    if (mismatches.rows.length === 0) {
      console.log('✅ No mismatches found! All users are in sync.');
      return;
    }
    
    console.log(`Found ${mismatches.rows.length} mismatched users:\n`);
    
    mismatches.rows.forEach((user) => {
      const issue = user.approved === 0 
        ? '❌ approved=false but status=active/approved'
        : '❌ approved=true but status=pending';
      
      console.log(`  User #${user.id}: ${user.email}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Approved: ${user.approved === 1 ? 'true' : 'false'}`);
      console.log(`    Status: ${user.status}`);
      console.log(`    Issue: ${issue}\n`);
    });
    
    // Step 2: Fix mismatches
    console.log('\n🔧 Step 2: Fixing mismatches...\n');
    
    // Fix type 1: approved=false but status=active/approved
    const fix1 = await client.execute(`
      UPDATE users
      SET 
        approved = 1,
        updated_at = datetime('now')
      WHERE 
        approved = 0 
        AND (status = 'active' OR status = 'approved')
    `);
    
    console.log(`✅ Fixed ${fix1.rowsAffected || 0} users: Set approved=true for active/approved status`);
    
    // Fix type 2: approved=true but status=pending
    const fix2 = await client.execute(`
      UPDATE users
      SET 
        status = 'active',
        updated_at = datetime('now')
      WHERE 
        approved = 1 
        AND status = 'pending'
    `);
    
    console.log(`✅ Fixed ${fix2.rowsAffected || 0} users: Set status=active for approved users`);
    
    // Step 3: Verify fix
    console.log('\n\n📊 Step 3: Verification...\n');
    
    const verifyQuery = `
      SELECT 
        id,
        email,
        name,
        role,
        approved,
        status
      FROM users
      WHERE 
        (approved = 0 AND (status = 'active' OR status = 'approved'))
        OR
        (approved = 1 AND status = 'pending')
    `;
    
    const remainingMismatches = await client.execute(verifyQuery);
    
    if (remainingMismatches.rows.length === 0) {
      console.log('✅ All mismatches fixed! Users are now in sync.');
    } else {
      console.log(`⚠️  Still ${remainingMismatches.rows.length} mismatches remaining.`);
      console.log('   This may require manual investigation.');
    }
    
    // Step 4: Show summary
    console.log('\n\n📈 Step 4: Summary Statistics\n');
    console.log('-'.repeat(70));
    
    const stats = await client.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as approved_users,
        SUM(CASE WHEN status IN ('active', 'approved') THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN 
          (approved = 0 AND (status = 'active' OR status = 'approved'))
          OR (approved = 1 AND status = 'pending')
        THEN 1 ELSE 0 END) as mismatched_users
      FROM users
    `);
    
    const summary = stats.rows[0];
    console.log(`Total Users:              ${summary.total_users}`);
    console.log(`Approved Users:           ${summary.approved_users}`);
    console.log(`Active Status Users:      ${summary.active_users}`);
    console.log(`Pending Users:            ${summary.pending_users}`);
    console.log(`Mismatched Users:         ${summary.mismatched_users}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ USER APPROVAL SYNC FIX COMPLETE');
    console.log('='.repeat(70));
    
    console.log('\n💡 What was fixed:');
    console.log('   - Users with status=active/approved now have approved=true');
    console.log('   - Users with approved=true now have status=active');
    console.log('   - Frontend will now show correct approval status');
    console.log('   - Users can now place orders if approved');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Users should refresh their browser');
    console.log('   2. Test order placement for approved users');
    console.log('   3. Verify admin panel shows correct status');
    console.log('   4. Monitor for any remaining issues');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the fix
fixUserApprovalSync()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
