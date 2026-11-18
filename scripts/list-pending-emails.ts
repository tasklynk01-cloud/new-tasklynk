/**
 * List All Pending Registration Emails
 */

import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';

async function listPendingEmails() {
  console.log('📧 Listing all pending registration emails...\n');

  try {
    const pending = await db.select().from(pendingRegistrations);
    const now = new Date();

    if (pending.length === 0) {
      console.log('✅ No pending registrations found!');
      return;
    }

    console.log(`Found ${pending.length} pending registrations:\n`);

    // Separate into valid and expired
    const valid = pending.filter(p => new Date(p.codeExpiresAt) > now);
    const expired = pending.filter(p => new Date(p.codeExpiresAt) <= now);

    if (valid.length > 0) {
      console.log('✅ VALID REGISTRATIONS (not expired):');
      console.log('═'.repeat(80));
      valid.forEach((p, idx) => {
        console.log(`\n${idx + 1}. ${p.email}`);
        console.log(`   Name: ${p.name}`);
        console.log(`   Role: ${p.role}`);
        console.log(`   Phone: ${p.phone}`);
        console.log(`   Code: ${p.verificationCode}`);
        console.log(`   Expires: ${p.codeExpiresAt}`);
        console.log(`   Created: ${p.createdAt}`);
        if (p.accountName) console.log(`   Account: ${p.accountName}`);
      });
      console.log('\n' + '═'.repeat(80));
    }

    if (expired.length > 0) {
      console.log(`\n⚠️  EXPIRED REGISTRATIONS (${expired.length}):`);
      console.log('─'.repeat(80));
      expired.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.email} (${p.role}) - expired ${p.codeExpiresAt}`);
      });
      console.log('─'.repeat(80));
    }

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total: ${pending.length}`);
    console.log(`   Valid: ${valid.length}`);
    console.log(`   Expired: ${expired.length}`);

    if (valid.length > 0) {
      console.log(`\n💡 To verify a registration, use:`);
      console.log(`   POST /api/auth/verify-code`);
      console.log(`   Body: {"email":"<email>","code":"<code>"}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listPendingEmails()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
