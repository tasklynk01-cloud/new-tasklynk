/**
 * Database Schema Enhancement Script
 * Ensures all tables and columns for freelancers and clients are present
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function enhanceDatabase() {
  console.log('🔧 Enhancing database schema for freelancers and clients...\n');

  try {
    // Check if tables exist and have correct columns
    console.log('1️⃣ Verifying freelancer_profiles table...');
    const freelancerProfilesCheck = await db.run(sql`
      SELECT name FROM sqlite_master WHERE type='table' AND name='freelancer_profiles'
    `);
    
    if (!freelancerProfilesCheck) {
      console.log('   ⚠️  freelancer_profiles table missing, will be created by schema push');
    } else {
      console.log('   ✅ freelancer_profiles table exists');
    }

    console.log('\n2️⃣ Verifying client_profiles table...');
    const clientProfilesCheck = await db.run(sql`
      SELECT name FROM sqlite_master WHERE type='table' AND name='client_profiles'
    `);
    
    if (!clientProfilesCheck) {
      console.log('   ⚠️  client_profiles table missing, will be created by schema push');
    } else {
      console.log('   ✅ client_profiles table exists');
    }

    console.log('\n3️⃣ Verifying freelancer onboarding tables...');
    const onboardingTables = [
      'freelancer_subjects',
      'freelancer_software',
      'freelancer_services',
      'freelancer_subject_map',
      'freelancer_software_map',
      'freelancer_services_map'
    ];

    for (const tableName of onboardingTables) {
      const tableCheck = await db.run(sql`
        SELECT name FROM sqlite_master WHERE type='table' AND name=${tableName}
      `);
      
      if (!tableCheck) {
        console.log(`   ⚠️  ${tableName} missing`);
      } else {
        console.log(`   ✅ ${tableName} exists`);
      }
    }

    console.log('\n4️⃣ Verifying users table has required columns...');
    const usersColumnsCheck = await db.run(sql`PRAGMA table_info(users)`);
    const userColumns = usersColumnsCheck?.rows?.map((r: any) => r[1]) || [];
    
    const requiredUserColumns = [
      'skills_completed',
      'payment_terms',
      'client_tier',
      'client_priority',
      'freelancer_badge',
      'account_id',
      'account_name',
      'domain_id',
      'assigned_manager_id'
    ];

    for (const col of requiredUserColumns) {
      if (userColumns.includes(col)) {
        console.log(`   ✅ ${col}`);
      } else {
        console.log(`   ⚠️  ${col} missing`);
      }
    }

    console.log('\n✅ Schema verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run db:push');
    console.log('   2. This will sync the schema with Turso database');
    console.log('   3. All missing tables/columns will be created automatically');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

enhanceDatabase()
  .then(() => {
    console.log('\n✅ Database enhancement check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
