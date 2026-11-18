/**
 * Trace the 42 Expired Pending Registrations
 * Check if they're now verified users or completely gone
 */

import { db } from '@/db';
import { users, pendingRegistrations } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

async function traceExpiredEmails() {
  console.log('🔍 Tracing the 42 expired pending registrations...\n');

  // The 42 emails from the earlier debug output
  const expiredEmails = [
    'dorothyrichards3162@gmail.com',
    'testuser@gmail.com',
    'freelancer@gmail.com',
    'newfreelancer@gmail.com',
    'newclient@gmail.com',
    'accountowner@gmail.com',
    'testclient2@gmail.com',
    'testverify@gmail.com',
    'testverify789@gmail.com',
    'clienttest123@gmail.com',
    'client456@gmail.com',
    'client789@gmail.com',
    'test.user@gmail.com',
    'testwriter456@gmail.com',
    'qa-client-account-1763922630855@gmail.com',
    'qa-client-solo-1763922637752@gmail.com',
    'qa-freelancer-1763922641667@gmail.com',
    'joym30552@gmail.com',
    'test-client-1764365915287@test.com',
    'test-freelancer-1764365915287@test.com',
    'test-freelancer-flow-1764366610433@test.com',
    'test-freelancer-flow-1764366658798@test.com',
    'test-freelancer-flow-1764366694284@test.com',
    'simonjamesmulu@gmail.com',
    'o762855@gmail.com',
    'ghret85@gmail.com',
    'firstwritersorg@gmail.com',
    'client.auto.1764876773380@example.com',
    'client.auto.1764877328575@example.com',
    'client.auto.1764877514756@example.com',
    'client.auto.1764878013216@example.com',
    'client.auto.1764878201991@example.com',
    'freelancer.auto.1764898160499@example.com',
    'client.auto.1764900160217@example.com',
    'dole3527@gmail.com',
    'tharaukuria@gmail.com',
    'bsagala573@gmail.com',
    'aokomercyline34@gmail.com',
    'jumamatezo96@gmail.com',
    'sigilaikelly@gmail.com',
    'kentkiariem@gmail.com',
    'sheeslee387@gmail.com',
  ];

  console.log(`📧 Total expired emails to trace: ${expiredEmails.length}\n`);

  try {
    // 1. Check if they're still in pending_registrations
    console.log('1️⃣ Checking pending_registrations table...');
    const stillPending = await db.select().from(pendingRegistrations);
    const foundInPending = expiredEmails.filter(email => 
      stillPending.some(p => p.email === email)
    );
    console.log(`   Found in pending: ${foundInPending.length}`);
    if (foundInPending.length > 0) {
      foundInPending.forEach(email => console.log(`   - ${email}`));
    }
    console.log('');

    // 2. Check if they successfully verified and are now users
    console.log('2️⃣ Checking if they became verified users...');
    const allUsers = await db.select().from(users);
    const foundAsUsers = expiredEmails.filter(email => 
      allUsers.some(u => u.email === email)
    );
    console.log(`   Found as verified users: ${foundAsUsers.length}`);
    if (foundAsUsers.length > 0) {
      console.log('   ═'.repeat(60));
      foundAsUsers.forEach(email => {
        const user = allUsers.find(u => u.email === email);
        console.log(`   ✅ ${email}`);
        console.log(`      Name: ${user?.name}`);
        console.log(`      Role: ${user?.role}`);
        console.log(`      Status: ${user?.status}`);
        console.log(`      Approved: ${user?.approved ? 'Yes' : 'No'}`);
        console.log(`      Created: ${user?.createdAt}`);
        console.log('');
      });
      console.log('   ═'.repeat(60));
    }
    console.log('');

    // 3. Find completely gone (not in pending, not in users)
    console.log('3️⃣ Finding completely deleted emails...');
    const completelyGone = expiredEmails.filter(email => 
      !foundInPending.includes(email) && !foundAsUsers.includes(email)
    );
    console.log(`   Completely gone: ${completelyGone.length}`);
    console.log('');

    if (completelyGone.length > 0) {
      console.log('   ❌ DELETED EMAILS (Never verified):');
      console.log('   ═'.repeat(60));
      completelyGone.forEach((email, idx) => {
        console.log(`   ${idx + 1}. ${email}`);
      });
      console.log('   ═'.repeat(60));
    }

    // 4. Summary
    console.log('\n📊 TRACE SUMMARY:');
    console.log('   ═'.repeat(60));
    console.log(`   Total expired emails: ${expiredEmails.length}`);
    console.log(`   Still in pending: ${foundInPending.length}`);
    console.log(`   Became verified users: ${foundAsUsers.length}`);
    console.log(`   Completely deleted: ${completelyGone.length}`);
    console.log('   ═'.repeat(60));

    // 5. Full list with status
    console.log('\n📋 COMPLETE LIST OF 42 EXPIRED EMAILS:');
    console.log('═'.repeat(80));
    expiredEmails.forEach((email, idx) => {
      let status = '❌ Deleted';
      if (foundInPending.includes(email)) status = '⏳ Still Pending';
      if (foundAsUsers.includes(email)) status = '✅ Verified User';
      
      console.log(`${idx + 1}. ${email}`);
      console.log(`   Status: ${status}`);
      console.log('');
    });
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

traceExpiredEmails()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
