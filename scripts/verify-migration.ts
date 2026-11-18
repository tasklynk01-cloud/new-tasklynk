#!/usr/bin/env tsx
import { config } from 'dotenv';
config();

import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

(async () => {
  try {
    console.log('🔍 Verifying database migration...\n');
    
    // Check internal_revisions
    const ir = await client.execute('SELECT COUNT(*) as count FROM internal_revisions');
    console.log('✅ internal_revisions table exists, rows:', ir.rows[0].count);
    
    // Check balances
    const bal = await client.execute('SELECT COUNT(*) as count FROM balances');
    console.log('✅ balances table exists, rows:', bal.rows[0].count);
    
    // Check adjustments
    const adj = await client.execute('SELECT COUNT(*) as count FROM adjustments');
    console.log('✅ adjustments table exists, rows:', adj.rows[0].count);
    
    // Check audit_logs
    const audit = await client.execute('SELECT COUNT(*) as count FROM audit_logs');
    console.log('✅ audit_logs table exists, rows:', audit.rows[0].count);
    
    // Check jobs table new fields
    console.log('\n📋 Checking jobs table new fields...');
    const jobFields = await client.execute(`
      PRAGMA table_info(jobs)
    `);
    
    const newFields = [
      'assigned_at', 'submitted_at', 'delivered_at', 'approved_at', 'paid_at', 'completed_at',
      'is_invoiced', 'order_type', 'manager_assigned_fee', 'manager_delivery_fee',
      'freelancer_amount', 'total_amount', 'has_open_internal_revision', 'internal_revision_count'
    ];
    
    const existingFields = jobFields.rows.map((row: any) => row.name);
    const foundFields = newFields.filter(f => existingFields.includes(f));
    
    console.log(`✅ Found ${foundFields.length}/${newFields.length} new fields in jobs table`);
    
    client.close();
    console.log('\n🎉 Migration verification complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    client.close();
    process.exit(1);
  }
})();
