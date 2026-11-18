/**
 * Database Status Consistency Fix Script
 * Diagnoses and fixes user status inconsistencies
 * 
 * ISSUE: Schema has:
 * - approved: boolean (default: false)
 * - status: text (default: 'active')
 * 
 * This creates inconsistency where new users have:
 * - approved = false (not approved)
 * - status = 'active' (appears active)
 * 
 * SOLUTION: Synchronize both fields
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

async function auditAndFixUserStatuses() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('🔍 DATABASE USER STATUS AUDIT\n');
    console.log('=' .repeat(80));
    
    // Get all users
    const allUsers = await client.execute({
      sql: 'SELECT id, displayId, email, name, role, approved, status, emailVerified, createdAt FROM users ORDER BY createdAt DESC',
      args: []
    });

    console.log(`\n📊 Total Users in Database: ${allUsers.rows.length}\n`);
    
    // Categorize users by status
    const categories = {
      correct: [],           // approved=true, status='active'
      pendingInconsistent: [], // approved=false, status='active' (WRONG!)
      pendingCorrect: [],      // approved=false, status='pending'
      suspended: [],           // status='suspended'
      rejected: [],            // status='rejected'
      blacklisted: [],         // status='blacklisted'
      other: []
    };

    allUsers.rows.forEach(user => {
      const approved = user.approved === 1;
      const status = user.status;

      if (status === 'blacklisted') {
        categories.blacklisted.push(user);
      } else if (status === 'rejected') {
        categories.rejected.push(user);
      } else if (status === 'suspended') {
        categories.suspended.push(user);
      } else if (approved && status === 'active') {
        categories.correct.push(user);
      } else if (!approved && status === 'active') {
        categories.pendingInconsistent.push(user); // THIS IS THE PROBLEM!
      } else if (!approved && status === 'pending') {
        categories.pendingCorrect.push(user);
      } else {
        categories.other.push(user);
      }
    });

    // Display results
    console.log('✅ CORRECT STATUS (approved=true, status=active):');
    console.log(`   Count: ${categories.correct.length}`);
    categories.correct.slice(0, 5).forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    if (categories.correct.length > 5) {
      console.log(`   ... and ${categories.correct.length - 5} more`);
    }

    console.log('\n🟡 PENDING - CORRECT (approved=false, status=pending):');
    console.log(`   Count: ${categories.pendingCorrect.length}`);
    categories.pendingCorrect.slice(0, 5).forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });

    console.log('\n❌ PENDING - INCONSISTENT (approved=false, status=active):');
    console.log(`   Count: ${categories.pendingInconsistent.length}`);
    console.log('   ⚠️  THESE USERS NEED FIXING!\n');
    categories.pendingInconsistent.forEach(u => {
      console.log(`   - ${u.email} (${u.role}) - Created: ${u.createdAt}`);
    });

    if (categories.suspended.length > 0) {
      console.log('\n🔴 SUSPENDED:');
      console.log(`   Count: ${categories.suspended.length}`);
      categories.suspended.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    }

    if (categories.rejected.length > 0) {
      console.log('\n⛔ REJECTED:');
      console.log(`   Count: ${categories.rejected.length}`);
      categories.rejected.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    }

    if (categories.blacklisted.length > 0) {
      console.log('\n⛔ BLACKLISTED:');
      console.log(`   Count: ${categories.blacklisted.length}`);
      categories.blacklisted.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    }

    // Check specifically for maxwellochieng2525@gmail.com
    console.log('\n' + '='.repeat(80));
    console.log('🔍 SPECIFIC USER CHECK: maxwellochieng2525@gmail.com\n');
    
    const targetUser = allUsers.rows.find(u => u.email === 'maxwellochieng2525@gmail.com');
    if (targetUser) {
      const approved = targetUser.approved === 1;
      const status = targetUser.status;
      
      console.log('📋 USER FOUND:');
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   Name: ${targetUser.name}`);
      console.log(`   Role: ${targetUser.role}`);
      console.log(`   Approved: ${approved ? '✅ YES' : '❌ NO'}`);
      console.log(`   Status: ${status}`);
      console.log(`   Email Verified: ${targetUser.emailVerified === 1 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Created: ${targetUser.createdAt}`);
      
      if (!approved && status === 'active') {
        console.log('\n❌ PROBLEM DETECTED:');
        console.log('   This user has approved=false but status=active');
        console.log('   Display Status: "Pending Approval" (correct based on approved flag)');
        console.log('   Database Status: "active" (misleading!)');
        console.log('\n💡 RECOMMENDATION:');
        console.log('   Option 1: Approve user → Set approved=true');
        console.log('   Option 2: Fix inconsistency → Set status=\'pending\'');
      }
    } else {
      console.log('❌ User not found in database');
    }

    // Provide fix recommendations
    if (categories.pendingInconsistent.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🔧 FIX RECOMMENDATIONS:\n');
      console.log(`Found ${categories.pendingInconsistent.length} users with inconsistent status`);
      console.log('\n🔹 Option 1: Fix Database (Set status=\'pending\' for unapproved users)');
      console.log('   Run: POST /api/admin/sync-user-statuses');
      console.log('   This will set status=\'pending\' for all users with approved=false\n');
      
      console.log('🔹 Option 2: Approve Users (If they should be active)');
      console.log('   Go to /admin/users and click "Approve" for each user\n');
      
      console.log('🔹 Option 3: Bulk SQL Fix (Direct database update)');
      console.log('   SQL: UPDATE users SET status=\'pending\' WHERE approved=0 AND status=\'active\';');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ AUDIT COMPLETE\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.close();
  }
}

auditAndFixUserStatuses();
