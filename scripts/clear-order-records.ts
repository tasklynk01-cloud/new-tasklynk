#!/usr/bin/env tsx
/**
 * ⚠️ CRITICAL SCRIPT: Clear Order Records
 * 
 * This script safely removes all order-related records from the database
 * while preserving user accounts and system settings.
 * 
 * What gets cleared:
 * - All jobs (orders)
 * - Order files (uploads)
 * - Job status logs
 * - Bids
 * - Ratings
 * - Messages related to orders
 * - Payments
 * - Payment requests
 * - Invoices
 * - Notifications related to orders
 * - Audit logs for orders
 * 
 * What stays intact:
 * - User accounts
 * - System settings
 * - Invitations
 * - CPP levels and progress
 * - Domains and accounts
 * 
 * Usage: npx tsx scripts/clear-order-records.ts [--confirm]
 */

import { db } from '../src/db';
import { 
  jobs, 
  orderFiles, 
  jobStatusLogs, 
  bids, 
  ratings,
  messages,
  jobMessages,
  payments,
  paymentRequests,
  invoices,
  notifications,
  auditLogs
} from '../src/db/schema';
import { sql } from 'drizzle-orm';

const args = process.argv.slice(2);
const isConfirmed = args.includes('--confirm');

async function clearOrderRecords() {
  console.log('🔍 TaskLynk Order Records Cleanup Script\n');
  console.log('=' .repeat(50));
  
  if (!isConfirmed) {
    console.log('⚠️  WARNING: This will DELETE ALL ORDER RECORDS!');
    console.log('\nThis includes:');
    console.log('  • All jobs/orders');
    console.log('  • Order files and attachments');
    console.log('  • Job status logs');
    console.log('  • Bids');
    console.log('  • Ratings');
    console.log('  • Order-related messages');
    console.log('  • Payments and payment requests');
    console.log('  • Invoices');
    console.log('  • Order-related notifications');
    console.log('  • Order-related audit logs');
    console.log('\n❌ User accounts will NOT be deleted');
    console.log('❌ System settings will NOT be deleted');
    console.log('\nTo proceed, run: npx tsx scripts/clear-order-records.ts --confirm');
    process.exit(0);
  }

  console.log('🚀 Starting cleanup process...\n');

  try {
    // Step 1: Count existing records
    console.log('📊 Counting existing records...');
    const jobCount = await db.select({ count: sql<number>`count(*)` }).from(jobs);
    const filesCount = await db.select({ count: sql<number>`count(*)` }).from(orderFiles);
    const bidsCount = await db.select({ count: sql<number>`count(*)` }).from(bids);
    const ratingsCount = await db.select({ count: sql<number>`count(*)` }).from(ratings);
    const paymentsCount = await db.select({ count: sql<number>`count(*)` }).from(payments);
    const invoicesCount = await db.select({ count: sql<number>`count(*)` }).from(invoices);

    console.log(`  Jobs: ${jobCount[0].count}`);
    console.log(`  Order Files: ${filesCount[0].count}`);
    console.log(`  Bids: ${bidsCount[0].count}`);
    console.log(`  Ratings: ${ratingsCount[0].count}`);
    console.log(`  Payments: ${paymentsCount[0].count}`);
    console.log(`  Invoices: ${invoicesCount[0].count}`);
    console.log('');

    // Step 2: Delete in correct order (respecting foreign keys)
    console.log('🗑️  Deleting records...\n');

    // Delete order-related audit logs (skip if table doesn't exist or has issues)
    console.log('  ⏳ Deleting audit logs...');
    try {
      await db.delete(auditLogs).where(sql`${auditLogs.resourceType} = 'order' OR ${auditLogs.resourceType} = 'job'`);
      console.log('  ✅ Audit logs cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping audit logs (table may not exist or has different structure)');
    }

    // Delete notifications related to orders
    console.log('  ⏳ Deleting notifications...');
    try {
      await db.delete(notifications).where(sql`${notifications.type} LIKE '%order%' OR ${notifications.type} LIKE '%job%'`);
      console.log('  ✅ Notifications cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping notifications (table may not exist)');
    }

    // Delete invoices
    console.log('  ⏳ Deleting invoices...');
    try {
      await db.delete(invoices);
      console.log('  ✅ Invoices cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping invoices (table may not exist)');
    }

    // Delete payment requests
    console.log('  ⏳ Deleting payment requests...');
    try {
      await db.delete(paymentRequests);
      console.log('  ✅ Payment requests cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping payment requests (table may not exist)');
    }

    // Delete payments
    console.log('  ⏳ Deleting payments...');
    await db.delete(payments);
    console.log('  ✅ Payments cleared');

    // Delete ratings (has FK to jobs)
    console.log('  ⏳ Deleting ratings...');
    await db.delete(ratings);
    console.log('  ✅ Ratings cleared');

    // Delete bids (has FK to jobs)
    console.log('  ⏳ Deleting bids...');
    await db.delete(bids);
    console.log('  ✅ Bids cleared');

    // Delete job messages
    console.log('  ⏳ Deleting job messages...');
    try {
      await db.delete(jobMessages);
      console.log('  ✅ Job messages cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping job messages (table may not exist)');
    }

    // Delete general messages (optional - only if they're order-related)
    console.log('  ⏳ Deleting order-related messages...');
    try {
      await db.delete(messages).where(sql`${messages.content} LIKE '%order%' OR ${messages.content} LIKE '%Order%'`);
      console.log('  ✅ Messages cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping messages (table may not exist)');
    }

    // Delete job status logs
    console.log('  ⏳ Deleting job status logs...');
    try {
      await db.delete(jobStatusLogs);
      console.log('  ✅ Job status logs cleared');
    } catch (error) {
      console.log('  ⚠️  Skipping job status logs (table may not exist)');
    }

    // Delete order files (has FK to jobs, but let's be explicit)
    console.log('  ⏳ Deleting order files...');
    await db.delete(orderFiles);
    console.log('  ✅ Order files cleared');

    // Delete all other tables that reference jobs (to avoid FK constraint errors)
    console.log('  ⏳ Deleting related tables...');
    const tablesToDelete = [
      'order_chat_messages',
      'order_additional_payments',
      'order_settlements',
      'freelancer_order_responses',
      'order_amount_adjustments',
      'orderFiles',
      'jobAttachments',
      'order_status_history',
      'order_history',
      'order_financials',
      'orders',
      'order_sequences',
      'job_files_backup',
      'job_attachments_backup',
      'jobs_backup',
      'job_attachments',
      'job_files',
    ];
    
    for (const table of tablesToDelete) {
      try {
        await db.run(sql.raw(`DELETE FROM ${table}`));
        console.log(`    ✅ Cleared ${table}`);
      } catch (error: any) {
        if (!error.message?.includes('no such table')) {
          console.log(`    ⚠️  ${table}: ${error.message}`);
        }
      }
    }

    // Finally, delete jobs (main table)
    console.log('  ⏳ Deleting jobs...');
    try {
      await db.delete(jobs);
      console.log('  ✅ Jobs cleared');
    } catch (error) {
      console.log('  ⚠️  Jobs table error:', error);
      // Try with raw SQL as fallback
      try {
        await db.run(sql`DELETE FROM jobs`);
        console.log('  ✅ Jobs cleared (via SQL)');
      } catch (sqlError) {
        console.log('  ❌ Could not delete jobs:', sqlError);
      }
    }

    // Step 3: Reset user statistics
    console.log('\n📊 Resetting user statistics...');
    try {
      await db.run(sql`
        UPDATE users 
        SET 
          balance = 0,
          earned = 0,
          total_earnings = 0,
          total_earned = 0,
          total_spent = 0,
          completed_jobs = 0,
          completion_rate = NULL
      `);
      console.log('  ✅ User statistics reset');
    } catch (error) {
      console.log('  ⚠️  Could not reset user statistics:', error);
    }

    // Step 4: Verify cleanup
    console.log('\n✅ Verifying cleanup...');
    const finalJobCount = await db.select({ count: sql<number>`count(*)` }).from(jobs);
    const finalFilesCount = await db.select({ count: sql<number>`count(*)` }).from(orderFiles);
    const finalBidsCount = await db.select({ count: sql<number>`count(*)` }).from(bids);

    console.log(`  Jobs remaining: ${finalJobCount[0].count}`);
    console.log(`  Order files remaining: ${finalFilesCount[0].count}`);
    console.log(`  Bids remaining: ${finalBidsCount[0].count}`);

    if (finalJobCount[0].count === 0 && finalFilesCount[0].count === 0) {
      console.log('\n✅ SUCCESS: All order records have been cleared!');
      console.log('✅ User accounts remain intact');
      console.log('✅ System is ready for fresh orders');
    } else {
      console.log('\n⚠️  WARNING: Some records may still exist');
      console.log('Please check the database manually');
    }

  } catch (error) {
    console.error('\n❌ ERROR during cleanup:', error);
    throw error;
  }
}

// Execute
clearOrderRecords()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
