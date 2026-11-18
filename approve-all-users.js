#!/usr/bin/env node
/**
 * Approve All Non-Admin Users
 * 
 * This script approves all users except admins to enable full API access.
 * Run this to fix the "Account not approved" 403 errors.
 * 
 * Usage:
 *   node approve-all-users.js
 * 
 * Or via npm:
 *   npm run approve-users
 */

import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { ne, and, eq } from 'drizzle-orm';

async function approveAllUsers() {
  console.log('🔍 Fetching unapproved users...\n');
  
  try {
    // Get all unapproved non-admin users
    const unapprovedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        approved: users.approved,
        status: users.status,
      })
      .from(users)
      .where(
        and(
          ne(users.role, 'admin'),
          eq(users.approved, false)
        )
      );

    console.log(`Found ${unapprovedUsers.length} unapproved user(s):\n`);
    
    if (unapprovedUsers.length === 0) {
      console.log('✅ All users are already approved!');
      return;
    }

    // Display users that will be approved
    unapprovedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | Status: ${user.status}`);
      console.log('');
    });

    // Approve all non-admin users
    console.log('🔄 Approving all users...\n');
    
    const result = await db
      .update(users)
      .set({
        approved: true,
        status: 'approved',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          ne(users.role, 'admin'),
          eq(users.approved, false)
        )
      );

    console.log(`✅ Successfully approved ${unapprovedUsers.length} user(s)!\n`);
    
    // Verify the update
    console.log('🔍 Verifying approval status...\n');
    
    const verifyUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        approved: users.approved,
        status: users.status,
      })
      .from(users)
      .where(ne(users.role, 'admin'));

    const stillUnapproved = verifyUsers.filter(u => !u.approved);
    
    if (stillUnapproved.length === 0) {
      console.log('✅ Verification successful! All non-admin users are now approved.\n');
    } else {
      console.log(`⚠️  Warning: ${stillUnapproved.length} user(s) still unapproved:\n`);
      stillUnapproved.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    // Display final stats
    console.log('\n📊 Final Statistics:');
    console.log(`   Total non-admin users: ${verifyUsers.length}`);
    console.log(`   Approved: ${verifyUsers.filter(u => u.approved).length}`);
    console.log(`   Unapproved: ${verifyUsers.filter(u => !u.approved).length}`);
    console.log(`   Active: ${verifyUsers.filter(u => u.status === 'active').length}`);
    console.log(`   Pending: ${verifyUsers.filter(u => u.status === 'pending').length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error approving users:', error);
    process.exit(1);
  }
}

// Run the script
console.log('========================================');
console.log('  TaskLynk User Approval Script');
console.log('========================================\n');

approveAllUsers()
  .then(() => {
    console.log('========================================');
    console.log('  Script completed successfully! ');
    console.log('========================================\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
