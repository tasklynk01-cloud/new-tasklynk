/**
 * Database Cleanup Script
 * Cleans order records, messages, and files while preserving user data
 * Run with: node cleanup-database.js
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // 1. Delete all messages
    console.log('📧 Deleting messages...');
    await db.execute('DELETE FROM messages');
    await db.execute('DELETE FROM job_messages');
    await db.execute('DELETE FROM contact_messages');
    console.log('✅ Messages deleted\n');

    // 2. Delete all job files and attachments
    console.log('📎 Deleting job files and attachments...');
    await db.execute('DELETE FROM job_files');
    await db.execute('DELETE FROM job_attachments');
    console.log('✅ Files deleted\n');

    // 3. Delete all bids
    console.log('💰 Deleting bids...');
    await db.execute('DELETE FROM bids');
    console.log('✅ Bids deleted\n');

    // 4. Delete all notifications related to orders
    console.log('🔔 Deleting order notifications...');
    await db.execute("DELETE FROM notifications WHERE type LIKE '%order%' OR type LIKE '%job%'");
    console.log('✅ Order notifications deleted\n');

    // 5. Delete all jobs/orders
    console.log('📋 Deleting orders...');
    await db.execute('DELETE FROM jobs');
    console.log('✅ Orders deleted\n');

    // 6. Delete all payments
    console.log('💳 Deleting payments...');
    await db.execute('DELETE FROM payments');
    console.log('✅ Payments deleted\n');

    // 7. Reset user balances and earnings
    console.log('💵 Resetting user balances and earnings...');
    await db.execute(`
      UPDATE users 
      SET 
        balance = 0,
        earned = 0,
        totalEarnings = 0,
        totalEarned = 0,
        totalSpent = 0,
        completedJobs = 0,
        completionRate = NULL
    `);
    console.log('✅ User balances reset\n');

    // 8. Reset CPP progress
    console.log('📊 Resetting CPP progress...');
    await db.execute('DELETE FROM cpp_progress');
    console.log('✅ CPP progress reset\n');

    // 9. Delete ratings and reviews
    console.log('⭐ Deleting ratings and reviews...');
    await db.execute('DELETE FROM ratings');
    await db.execute('DELETE FROM reviews');
    console.log('✅ Ratings deleted\n');

    // 10. Delete transaction history
    console.log('💸 Deleting transaction history...');
    await db.execute('DELETE FROM transactions');
    console.log('✅ Transactions deleted\n');

    // 11. Delete invoices
    console.log('🧾 Deleting invoices...');
    await db.execute('DELETE FROM invoices');
    console.log('✅ Invoices deleted\n');

    console.log('✨ Database cleanup completed successfully!');
    console.log('\n📌 Preserved data:');
    console.log('  - User accounts');
    console.log('  - System settings');
    console.log('  - Invitations');
    console.log('  - Domains and accounts');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup
cleanupDatabase()
  .then(() => {
    console.log('\n✅ Cleanup script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error);
    process.exit(1);
  });
