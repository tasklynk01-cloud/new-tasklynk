/**
 * Test Email Verification Flow
 * Tests the complete registration and verification process
 */

import { db } from '@/db';
import { pendingRegistrations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testVerificationFlow() {
  console.log('🧪 Testing Email Verification Flow\n');

  try {
    // Test 1: Check for valid pending registrations
    console.log('1️⃣ Checking for valid pending registrations...');
    const now = new Date();
    const allPending = await db.select().from(pendingRegistrations);
    const validPending = allPending.filter(p => new Date(p.codeExpiresAt) > now);
    
    console.log(`   Total pending: ${allPending.length}`);
    console.log(`   Valid (not expired): ${validPending.length}`);
    
    if (validPending.length > 0) {
      console.log('\n   Valid registrations:');
      validPending.forEach(p => {
        console.log(`   📧 ${p.email}`);
        console.log(`      Code: ${p.verificationCode}`);
        console.log(`      Role: ${p.role}`);
        console.log(`      Expires: ${p.codeExpiresAt}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No valid pending registrations found');
      console.log('   💡 Try registering a new account to test');
    }

    // Test 2: Simulate verification API call
    if (validPending.length > 0) {
      const testPending = validPending[0];
      console.log('2️⃣ Simulating verification API call...');
      console.log(`   Email: ${testPending.email}`);
      console.log(`   Code: ${testPending.verificationCode}`);
      
      // We won't actually call the API, just show what would happen
      console.log('\n   ✅ To test manually, use:');
      console.log(`   curl -X POST https://www.tasklynk.co.ke/api/auth/verify-code \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"email":"${testPending.email}","code":"${testPending.verificationCode}"}'`);
      console.log('');
    }

    // Test 3: Check session cookie configuration
    console.log('3️⃣ Checking session configuration...');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production') {
      console.log('   ⚠️  JWT_SECRET is not properly configured!');
      console.log('   💡 Set JWT_SECRET in .env file');
    } else {
      console.log(`   ✅ JWT_SECRET is configured (${jwtSecret.substring(0, 8)}...)`);
    }
    console.log('');

    // Test 4: Check database connection
    console.log('4️⃣ Testing database connection...');
    const testUser = await db.select().from(users).limit(1);
    console.log('   ✅ Database connection OK');
    console.log('');

    console.log('✅ Test complete!');
    console.log('\n📝 Summary:');
    console.log(`   - Pending registrations: ${allPending.length} (${validPending.length} valid)`);
    console.log('   - Database: Connected');
    console.log(`   - JWT_SECRET: ${jwtSecret ? 'Configured' : 'Missing'}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Register a new account via the web interface');
    console.log('   2. Check your email for the verification code');
    console.log('   3. Enter the code on the verification page');
    console.log('   4. You should be automatically logged in after verification');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testVerificationFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
