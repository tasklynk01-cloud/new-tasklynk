#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * Checks Turso database for all required tables and columns
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('❌ Missing TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

console.log('🔍 TaskLynk Database Schema Verification\n');
console.log('=' .repeat(60));

async function verifyDatabase() {
  try {
    console.log('\n📊 CHECKING DATABASE CONNECTION...\n');
    
    // Test connection
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful\n');

    // 1. List all tables
    console.log('=' .repeat(60));
    console.log('📋 ALL TABLES IN DATABASE:\n');
    const tables = await db.execute(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_litestream_%'
        AND name NOT LIKE '__drizzle_%'
      ORDER BY name
    `);
    
    console.log(`Found ${tables.rows.length} tables:\n`);
    tables.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
    });

    // 2. Check USERS table
    console.log('\n' + '='.repeat(60));
    console.log('👥 USERS TABLE VERIFICATION:\n');
    
    const usersInfo = await db.execute('PRAGMA table_info(users)');
    console.log(`✅ Users table has ${usersInfo.rows.length} columns\n`);
    
    const criticalUserColumns = ['id', 'email', 'password', 'name', 'role', 'role_id', 'approved', 'status'];
    console.log('Checking critical columns:');
    criticalUserColumns.forEach(col => {
      const exists = usersInfo.rows.some(row => row.name === col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });

    const userStats = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as approved_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as client_count,
        SUM(CASE WHEN role = 'freelancer' THEN 1 ELSE 0 END) as freelancer_count
      FROM users
    `);
    console.log('\nUser Statistics:');
    console.log(`  Total Users: ${userStats.rows[0].total_users}`);
    console.log(`  Approved: ${userStats.rows[0].approved_users}`);
    console.log(`  Admins: ${userStats.rows[0].admin_count}`);
    console.log(`  Clients: ${userStats.rows[0].client_count}`);
    console.log(`  Freelancers: ${userStats.rows[0].freelancer_count}`);

    // 3. Check JOBS table (MOST CRITICAL)
    console.log('\n' + '='.repeat(60));
    console.log('📦 JOBS TABLE VERIFICATION:\n');
    
    const jobsInfo = await db.execute('PRAGMA table_info(jobs)');
    console.log(`✅ Jobs table has ${jobsInfo.rows.length} columns\n`);
    
    const criticalJobColumns = [
      'id', 'display_id', 'order_number', 'order_id', 'client_id', 
      'title', 'instructions', 'work_type', 'pages', 'slides', 
      'amount', 'deadline', 'status', 'service_type', 'client_cpp',
      'manager_earnings', 'freelancer_earnings', 'admin_profit'
    ];
    
    console.log('Checking critical columns:');
    const missingColumns = [];
    criticalJobColumns.forEach(col => {
      const exists = jobsInfo.rows.some(row => row.name === col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) missingColumns.push(col);
    });

    if (missingColumns.length > 0) {
      console.log('\n⚠️  WARNING: Missing columns detected:');
      missingColumns.forEach(col => console.log(`     - ${col}`));
      console.log('\n🔧 You need to run: npm run db:push');
    }

    const jobStats = await db.execute(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM jobs
    `);
    console.log('\nJob Statistics:');
    console.log(`  Total Jobs: ${jobStats.rows[0].total_jobs}`);
    console.log(`  Pending: ${jobStats.rows[0].pending}`);
    console.log(`  Accepted: ${jobStats.rows[0].accepted}`);
    console.log(`  Assigned: ${jobStats.rows[0].assigned}`);
    console.log(`  Completed: ${jobStats.rows[0].completed}`);

    // 4. Check other critical tables
    console.log('\n' + '='.repeat(60));
    console.log('📊 OTHER CRITICAL TABLES:\n');

    const criticalTables = [
      'accounts', 'domains', 'notifications', 'job_files', 
      'payments', 'system_settings', 'invitations', 'cpp_levels', 'cpp_progress'
    ];

    for (const tableName of criticalTables) {
      try {
        const count = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  ✅ ${tableName.padEnd(20)} - ${count.rows[0].count} rows`);
      } catch (error) {
        console.log(`  ❌ ${tableName.padEnd(20)} - TABLE MISSING OR ERROR`);
      }
    }

    // 5. Check for orphaned records
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DATA INTEGRITY CHECKS:\n');

    try {
      const orphanedJobs = await db.execute(`
        SELECT COUNT(*) as count
        FROM jobs j
        LEFT JOIN users u ON j.client_id = u.id
        WHERE u.id IS NULL
      `);
      
      if (orphanedJobs.rows[0].count > 0) {
        console.log(`  ⚠️  ${orphanedJobs.rows[0].count} jobs with invalid client_id`);
      } else {
        console.log('  ✅ No orphaned jobs found');
      }
    } catch (error) {
      console.log('  ⚠️  Could not check orphaned jobs');
    }

    // 6. Database integrity
    console.log('\n' + '='.repeat(60));
    console.log('🏥 DATABASE HEALTH:\n');

    const integrity = await db.execute('PRAGMA integrity_check');
    if (integrity.rows[0] && integrity.rows[0].integrity_check === 'ok') {
      console.log('  ✅ Database integrity check: PASSED');
    } else {
      console.log('  ❌ Database integrity check: FAILED');
      console.log(integrity.rows);
    }

    // 7. Check system settings
    console.log('\n' + '='.repeat(60));
    console.log('⚙️  SYSTEM SETTINGS:\n');

    try {
      const settings = await db.execute('SELECT key, value, type FROM system_settings ORDER BY key');
      if (settings.rows.length > 0) {
        console.log(`  Found ${settings.rows.length} system settings:`);
        settings.rows.forEach(row => {
          console.log(`    ${row.key} = ${row.value} (${row.type})`);
        });
      } else {
        console.log('  ⚠️  No system settings found - may need initialization');
      }
    } catch (error) {
      console.log('  ❌ Could not read system settings');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE VERIFICATION COMPLETE\n');

    if (missingColumns.length > 0) {
      console.log('⚠️  ACTION REQUIRED: Missing columns detected');
      console.log('   Run: npm run db:push');
      console.log('   This will sync your schema with the database\n');
      process.exit(1);
    } else {
      console.log('✅ All critical tables and columns are present\n');
    }

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    console.error('\nError details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

verifyDatabase();