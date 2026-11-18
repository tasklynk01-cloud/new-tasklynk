/**
 * Comprehensive Database Schema Audit
 * Checks all tables and columns for freelancers and clients
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';

async function auditDatabase() {
  console.log('🔍 Starting comprehensive database audit...\n');

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    // 1. List all tables
    console.log('1️⃣ Checking all tables...');
    const tables = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    });
    
    const tableNames = tables.rows.map(r => r[0] as string);
    console.log(`Found ${tableNames.length} tables\n`);

    // 2. Check freelancer-related tables
    console.log('2️⃣ Freelancer-related tables:');
    const freelancerTables = tableNames.filter(t => 
      t.includes('freelancer') || t === 'users'
    );
    
    for (const tableName of freelancerTables) {
      const info = await client.execute(`PRAGMA table_info(${tableName})`);
      console.log(`\n   📋 ${tableName}:`);
      console.log(`      Columns: ${info.rows.length}`);
      info.rows.forEach(row => {
        console.log(`      - ${row[1]} (${row[2]})`);
      });
    }

    // 3. Check client-related tables
    console.log('\n3️⃣ Client-related tables:');
    const clientTables = tableNames.filter(t => 
      t.includes('client') || t.includes('account')
    );
    
    for (const tableName of clientTables) {
      const info = await client.execute(`PRAGMA table_info(${tableName})`);
      console.log(`\n   📋 ${tableName}:`);
      console.log(`      Columns: ${info.rows.length}`);
      info.rows.forEach(row => {
        console.log(`      - ${row[1]} (${row[2]})`);
      });
    }

    // 4. Check critical missing tables
    console.log('\n4️⃣ Checking for critical tables:');
    const criticalTables = [
      'users',
      'freelancer_profiles',
      'client_profiles',
      'freelancer_subjects',
      'freelancer_software',
      'freelancer_services',
      'freelancer_subject_map',
      'freelancer_software_map',
      'freelancer_services_map',
      'jobs',
      'payments',
    ];

    const missing = [];
    for (const table of criticalTables) {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING!`);
        missing.push(table);
      }
    }

    // 5. Summary
    console.log('\n📊 Summary:');
    console.log(`   Total tables: ${tableNames.length}`);
    console.log(`   Freelancer tables: ${freelancerTables.length}`);
    console.log(`   Client tables: ${clientTables.length}`);
    console.log(`   Missing critical tables: ${missing.length}`);
    
    if (missing.length > 0) {
      console.log('\n⚠️  Missing tables need to be created:');
      missing.forEach(t => console.log(`   - ${t}`));
    } else {
      console.log('\n✅ All critical tables exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

auditDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
