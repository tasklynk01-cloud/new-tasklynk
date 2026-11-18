#!/usr/bin/env node
/**
 * Database Cleanup Script
 * 
 * Removes backup and old tables to reduce database bloat
 * Current: 98 tables → Target: ~60-70 tables
 */

require('dotenv').config();
const { createClient } = require('@libsql/client');

const BACKUP_TABLES_TO_REMOVE = [
  'bids_backup',
  'bids_old',
  'bids_new',
  'jobs_backup',
  'jobs_old',
  'payments_backup',
  'users_backup',
  'notifications_backup',
];

async function cleanupDatabase() {
  console.log('🧹 Starting Database Cleanup...\n');

  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing database credentials in .env');
    process.exit(1);
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Get all tables
    const tablesResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log(`📊 Total tables before cleanup: ${tablesResult.rows.length}\n`);

    // Identify backup tables
    const backupTables = tablesResult.rows
      .map(row => row.name)
      .filter(name => 
        name.includes('_backup') || 
        name.includes('_old') || 
        name.includes('_new') ||
        BACKUP_TABLES_TO_REMOVE.includes(name)
      );

    console.log(`🗑️  Found ${backupTables.length} backup/old tables to review:\n`);
    backupTables.forEach(table => console.log(`   - ${table}`));

    if (backupTables.length === 0) {
      console.log('\n✅ No backup tables found. Database is clean!');
      return;
    }

    // Safety check: require confirmation for production
    if (process.env.NODE_ENV === 'production') {
      console.log('\n⚠️  PRODUCTION ENVIRONMENT DETECTED');
      console.log('⚠️  Manual confirmation required before dropping tables');
      console.log('\n💡 To proceed, set CONFIRM_DB_CLEANUP=true');
      
      if (process.env.CONFIRM_DB_CLEANUP !== 'true') {
        console.log('\n❌ Cleanup aborted for safety');
        process.exit(0);
      }
    }

    // Drop backup tables
    console.log('\n🗑️  Dropping backup tables...\n');
    let droppedCount = 0;

    for (const table of backupTables) {
      try {
        await client.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✅ Dropped: ${table}`);
        droppedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to drop ${table}:`, error.message);
      }
    }

    // Verify cleanup
    const afterResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Tables before: ${tablesResult.rows.length}`);
    console.log(`📊 Tables after: ${afterResult.rows.length}`);
    console.log(`🗑️  Removed: ${droppedCount} tables`);
    
    // VACUUM to reclaim space
    console.log('\n🔄 Running VACUUM to reclaim disk space...');
    await client.execute('VACUUM');
    console.log('✅ VACUUM complete');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run if executed directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('\n🎉 Database cleanup finished successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDatabase };
