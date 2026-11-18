/**
 * Get verification code for a pending registration
 */

const { db } = require('./src/db');
const { pendingRegistrations } = require('./src/db/schema');
const { eq } = require('drizzle-orm');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node get-verification-code.js <email>');
  process.exit(1);
}

async function getVerificationCode() {
  try {
    console.log('Fetching verification code for:', email);
    
    const [registration] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email))
      .limit(1);

    if (!registration) {
      console.error('❌ No pending registration found for:', email);
      process.exit(1);
    }

    console.log('\n✅ Pending Registration Found:');
    console.log('  Email:', registration.email);
    console.log('  Verification Code:', registration.verification_code);
    console.log('  Role:', registration.role);
    console.log('  Created:', registration.created_at);
    console.log('  Expires:', registration.expires_at);
    
    return registration.verification_code;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getVerificationCode();
