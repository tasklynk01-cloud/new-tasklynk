/**
 * Cleanup Expired Pending Registrations
 * Removes all pending registrations with expired verification codes
 */

import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function cleanupExpired() {
  console.log('🧹 Cleaning up expired pending registrations...\n');

  try {
    // Get all pending registrations
    const allPending = await db.select().from(pendingRegistrations);
    const now = new Date();
    
    const expired = allPending.filter(p => new Date(p.codeExpiresAt) < now);
    const valid = allPending.filter(p => new Date(p.codeExpiresAt) >= now);
    
    console.log(`📊 Current status:`);
    console.log(`   Total: ${allPending.length}`);
    console.log(`   Expired: ${expired.length}`);
    console.log(`   Valid: ${valid.length}`);
    console.log('');

    if (expired.length === 0) {
      console.log('✅ No expired registrations to clean up!');
      return;
    }

    console.log('📋 Expired registrations to be deleted:');
    expired.forEach(p => {
      console.log(`   - ${p.email} (role: ${p.role}, expired: ${p.codeExpiresAt})`);
    });
    console.log('');

    // Delete expired registrations
    console.log('🗑️  Deleting expired registrations...');
    const currentTimestamp = now.toISOString();
    const result = await db
      .delete(pendingRegistrations)
      .where(sql`${pendingRegistrations.codeExpiresAt} < ${currentTimestamp}`);

    console.log(`✅ Deleted ${expired.length} expired registrations`);
    console.log('');

    // Show remaining valid registrations
    console.log('📝 Remaining valid registrations:');
    if (valid.length === 0) {
      console.log('   None');
    } else {
      valid.forEach(p => {
        console.log(`   - ${p.email} (role: ${p.role}, expires: ${p.codeExpiresAt})`);
      });
    }
    console.log('');
    
    console.log('✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupExpired()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
