/**
 * Test script to verify order creation works correctly
 * Run with: npx tsx scripts/test-order-creation.ts
 */

import { config } from 'dotenv';
config(); // Load environment variables from .env

import { db } from '../src/db';
import { jobs, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation Fix...\n');

  try {
    // Find a test client
    const testClient = await db
      .select()
      .from(users)
      .where(eq(users.role, 'client'))
      .limit(1);

    if (testClient.length === 0) {
      console.error('❌ No client found in database. Cannot test order creation.');
      process.exit(1);
    }

    const client = testClient[0];
    console.log(`✓ Found test client: ${client.name} (ID: ${client.id})\n`);

    const now = new Date().toISOString();
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    // Generate a unique display ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const displayId = `TL-TEST-${timestamp}-${random}`;
    const orderNumber = `TEST${String(random).padStart(4, '0')}`;

    console.log(`📋 Creating test order:`);
    console.log(`   Display ID: ${displayId}`);
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Client: ${client.name}\n`);

    // Test data - explicitly NOT including 'id' field
    // Note: Boolean fields must be true/false (not 1/0) for TypeScript compatibility
    const insertData = {
      displayId,
      orderId: displayId,
      orderNumber,
      accountOrderNumber: null,
      accountLinked: false,
      clientId: client.id,
      title: 'Test Order - Database Insert Fix',
      instructions: 'This is a test order to verify the id field fix works correctly.',
      workType: 'Essay',
      pages: 5,
      slides: null,
      amount: 1200,
      managerEarnings: 0,
      freelancerEarnings: 0,
      adminProfit: 0,
      deadline,
      actualDeadline: deadline,
      freelancerDeadline: deadline,
      requestDraft: false,
      draftDelivered: false,
      requestPrintableSources: false,
      singleSpaced: false,
      baseCpp: 240,
      effectiveCpp: 240,
      clientCpp: 240,
      clientCppConfirmed: false,
      serviceType: 'writing_page' as const,
      managerAdditional: 0,
      managerAdditionalStatus: 'none' as const,
      clientBonus: 0,
      statusTotalAmount: 1200,
      cppPaymentStatus: 'unpaid' as const,
      lastAmountUpdateAt: now,
      status: 'pending' as const,
      managerApproved: false,
      editorApproved: false,
      adminApproved: false,
      clientApproved: false,
      revisionRequested: false,
      paymentConfirmed: false,
      invoiceGenerated: false,
      placementPriority: 0,
      urgencyMultiplier: 1.0,
      calculatedPrice: 1200,
      isRealOrder: false, // Mark as test order
      requiresReports: true,
      finalSubmissionComplete: false,
      revisionSubmissionComplete: false,
      freelancerAccepted: false,
      freelancerRejected: false,
      freelancerResponsePending: false,
      hasOpenInternalRevision: false,
      internalRevisionCount: 0,
      clientRequestedRevision: false,
      createdAt: now,
      updatedAt: now,
    };

    console.log('🔄 Attempting database insert...\n');

    // Insert the order
    const newJob = await db.insert(jobs).values(insertData).returning();

    if (newJob && newJob.length > 0) {
      console.log('✅ SUCCESS! Order created successfully!\n');
      console.log('📊 Created Order Details:');
      console.log(`   ID: ${newJob[0].id}`);
      console.log(`   Display ID: ${newJob[0].displayId}`);
      console.log(`   Order Number: ${newJob[0].orderNumber}`);
      console.log(`   Client ID: ${newJob[0].clientId}`);
      console.log(`   Title: ${newJob[0].title}`);
      console.log(`   Amount: KSh ${newJob[0].amount}`);
      console.log(`   Status: ${newJob[0].status}`);
      console.log(`   Created At: ${newJob[0].createdAt}\n`);

      // Clean up test order
      console.log('🧹 Cleaning up test order...');
      await db.delete(jobs).where(eq(jobs.id, newJob[0].id));
      console.log('✓ Test order deleted\n');

      console.log('✅ ALL TESTS PASSED! The order creation fix is working correctly.\n');
      process.exit(0);
    } else {
      console.error('❌ FAILED: Order creation returned no data\n');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ TEST FAILED!\n');
    console.error('Error Details:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    
    if (error.message.includes('insert into')) {
      console.error('\n🔍 This looks like a database insert error.');
      console.error('   The fix may not have resolved the issue completely.');
    }
    
    process.exit(1);
  }
}

// Run the test
testOrderCreation();
