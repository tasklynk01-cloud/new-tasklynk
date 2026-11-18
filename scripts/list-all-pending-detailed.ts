/**
 * List All Pending Registrations (Including Expired)
 */

import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';

async function listAllPending() {
  console.log('📧 Checking all pending registrations in database...\n');

  try {
    const allPending = await db.select().from(pendingRegistrations);
    
    console.log(`Total records in pending_registrations table: ${allPending.length}\n`);

    if (allPending.length === 0) {
      console.log('✅ The pending_registrations table is empty.');
      console.log('\nThis means either:');
      console.log('   1. All registrations have been verified ✅');
      console.log('   2. Expired registrations were cleaned up ✅');
      console.log('   3. The auto-cleanup ran successfully ✅');
      return;
    }

    const now = new Date();
    const expired = allPending.filter(p => new Date(p.codeExpiresAt) < now);
    const valid = allPending.filter(p => new Date(p.codeExpiresAt) >= now);

    console.log(`📊 Status:`);
    console.log(`   Total: ${allPending.length}`);
    console.log(`   Expired: ${expired.length}`);
    console.log(`   Valid: ${valid.length}\n`);

    if (expired.length > 0) {
      console.log('⚠️  EXPIRED REGISTRATIONS:');
      console.log('═'.repeat(100));
      expired.forEach((p, idx) => {
        const expiredDate = new Date(p.codeExpiresAt);
        const daysAgo = Math.floor((now.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`${idx + 1}. ${p.email}`);
        console.log(`   Name: ${p.name}`);
        console.log(`   Role: ${p.role}`);
        console.log(`   Phone: ${p.phone}`);
        console.log(`   Code: ${p.verificationCode}`);
        console.log(`   Expired: ${p.codeExpiresAt} (${daysAgo} days ago)`);
        console.log(`   Created: ${p.createdAt}`);
        if (p.accountName) console.log(`   Account: ${p.accountName}`);
        console.log('');
      });
      console.log('═'.repeat(100));
    }

    if (valid.length > 0) {
      console.log('\n✅ VALID REGISTRATIONS:');
      console.log('═'.repeat(100));
      valid.forEach((p, idx) => {
        const expiresIn = Math.floor((new Date(p.codeExpiresAt).getTime() - now.getTime()) / (1000 * 60));
        
        console.log(`${idx + 1}. ${p.email}`);
        console.log(`   Name: ${p.name}`);
        console.log(`   Role: ${p.role}`);
        console.log(`   Phone: ${p.phone}`);
        console.log(`   Code: ${p.verificationCode}`);
        console.log(`   Expires: ${p.codeExpiresAt} (in ${expiresIn} minutes)`);
        console.log(`   Created: ${p.createdAt}`);
        if (p.accountName) console.log(`   Account: ${p.accountName}`);
        console.log('');
      });
      console.log('═'.repeat(100));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAllPending()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
