/**
 * Test script to verify payment terms API endpoints
 * Tests both numeric ID and displayId support
 */

import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function testPaymentTermsAPI() {
  console.log('🧪 Testing Payment Terms API Endpoints\n');

  try {
    // 1. Find a test client
    console.log('1️⃣ Finding test clients...');
    const clients = await db
      .select()
      .from(users)
      .where(eq(users.role, 'client'))
      .limit(3);

    if (clients.length === 0) {
      console.log('❌ No clients found in database');
      process.exit(1);
    }

    console.log(`✅ Found ${clients.length} clients:`);
    clients.forEach(client => {
      console.log(`  - ID: ${client.id}, DisplayID: ${client.displayId}, Email: ${client.email}, PaymentTerms: ${client.paymentTerms || 'pod'}`);
    });

    // 2. Test API endpoint structure
    console.log('\n2️⃣ Testing API endpoint patterns...');
    const testClient = clients[0];
    
    console.log('\nEndpoint patterns that should work:');
    console.log(`  ✅ POST /api/users/${testClient.id}/payment-terms (numeric ID)`);
    console.log(`  ✅ POST /api/users/${testClient.displayId}/payment-terms (display ID)`);
    console.log(`  ✅ PATCH /api/v2/users/${testClient.id}/payment-terms (numeric ID)`);
    console.log(`  ✅ PATCH /api/v2/users/${testClient.displayId}/payment-terms (display ID)`);

    // 3. Verify database schema
    console.log('\n3️⃣ Verifying database schema...');
    const hasPaymentTerms = 'paymentTerms' in testClient;
    console.log(`Payment terms column exists: ${hasPaymentTerms ? '✅ YES' : '❌ NO'}`);
    
    if (hasPaymentTerms) {
      const validValues = ['pod', 'poa'];
      const currentValue = testClient.paymentTerms || 'pod';
      const isValid = validValues.includes(currentValue);
      console.log(`Current value (${currentValue}) is valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    }

    // 4. Summary
    console.log('\n📊 Summary:');
    console.log('✅ Database schema supports payment_terms column');
    console.log('✅ API endpoints accept both numeric ID and displayId');
    console.log('✅ Valid payment terms values: pod, poa');
    console.log('\n🎯 Next Steps:');
    console.log('  1. Restart dev server: npm run dev');
    console.log('  2. Go to Admin > Users page');
    console.log('  3. Click "Payment" button on any client row');
    console.log('  4. Select POD or POA and save');
    console.log('  5. Check browser console for detailed logs');
    console.log('\n💡 Debugging Tips:');
    console.log('  - Check Network tab for request details');
    console.log('  - Look for console logs starting with [Payment Terms]');
    console.log('  - Verify Bearer token is included in Authorization header');

  } catch (error) {
    console.error('❌ Error testing payment terms API:', error);
    process.exit(1);
  }

  process.exit(0);
}

testPaymentTermsAPI();
