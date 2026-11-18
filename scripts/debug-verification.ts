/**
 * Debug Verification Issue
 * Tests database connection and pending registrations table
 */

import { db } from '@/db';
import { pendingRegistrations, users, emailVerificationCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function debugVerification() {
  console.log('🔍 Starting verification debug...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const testQuery = await db.select().from(users).limit(1);
    console.log('✅ Database connection OK\n');

    // Test 2: Check pending registrations table structure
    console.log('2️⃣ Checking pending_registrations table...');
    try {
      const pendingCount = await db.select().from(pendingRegistrations);
      console.log(`✅ Found ${pendingCount.length} pending registrations`);
      
      if (pendingCount.length > 0) {
        console.log('Sample pending registration:');
        console.log(JSON.stringify(pendingCount[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Error querying pending_registrations:', error);
    }
    console.log('');

    // Test 3: Check email_verification_codes table
    console.log('3️⃣ Checking email_verification_codes table...');
    try {
      const verificationCodes = await db.select().from(emailVerificationCodes);
      console.log(`✅ Found ${verificationCodes.length} verification codes`);
      
      if (verificationCodes.length > 0) {
        console.log('Sample verification code:');
        console.log(JSON.stringify(verificationCodes[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Error querying email_verification_codes:', error);
    }
    console.log('');

    // Test 4: Check for any pending registrations with expired codes
    console.log('4️⃣ Checking for expired codes...');
    const now = new Date().toISOString();
    const allPending = await db.select().from(pendingRegistrations);
    
    const expired = allPending.filter(p => new Date(p.codeExpiresAt) < new Date());
    const valid = allPending.filter(p => new Date(p.codeExpiresAt) >= new Date());
    
    console.log(`   Expired codes: ${expired.length}`);
    console.log(`   Valid codes: ${valid.length}`);
    
    if (expired.length > 0) {
      console.log('\n   Expired registrations:');
      expired.forEach(p => {
        console.log(`   - ${p.email} (expires: ${p.codeExpiresAt})`);
      });
    }
    
    if (valid.length > 0) {
      console.log('\n   Valid registrations:');
      valid.forEach(p => {
        console.log(`   - ${p.email} (expires: ${p.codeExpiresAt}, code: ${p.verificationCode})`);
      });
    }
    console.log('');

    // Test 5: Check users table for approved status
    console.log('5️⃣ Checking users table...');
    const allUsers = await db.select().from(users).limit(10);
    console.log(`✅ Found ${allUsers.length} users (showing first 10)`);
    
    allUsers.forEach(user => {
      console.log(`   - ${user.email}: role=${user.role}, approved=${user.approved}, status=${user.status}, emailVerified=${user.emailVerified}`);
    });
    console.log('');

    console.log('✅ Debug complete!');

  } catch (error) {
    console.error('❌ Critical error during debug:', error);
    process.exit(1);
  }
}

debugVerification()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
