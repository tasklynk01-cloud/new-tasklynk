#!/usr/bin/env node
/**
 * Fix Client Activation Status
 * 
 * This script ensures all approved clients have consistent status='active' everywhere:
 * - Database users table
 * - All client pages should show "Active"
 * - Settings pages should reflect active status
 * - Account should be fully operational
 * 
 * Run: node fix-client-activation.js
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixClientActivation() {
  console.log('🔧 Starting Client Activation Fix...\n');

  try {
    // Step 1: Find all approved clients
    console.log('📊 Step 1: Finding all approved clients...');
    const approvedClients = await db.execute({
      sql: `SELECT id, name, email, role, approved, status FROM users 
            WHERE (role = 'client' OR role = 'account_owner') 
            AND approved = 1`,
      args: []
    });

    console.log(`Found ${approvedClients.rows.length} approved clients\n`);

    if (approvedClients.rows.length === 0) {
      console.log('✅ No approved clients found to update');
      return;
    }

    // Step 2: Show current status
    console.log('📋 Current Status:');
    console.log('─'.repeat(80));
    console.log('ID  | Name                          | Email                          | Status');
    console.log('─'.repeat(80));
    
    for (const client of approvedClients.rows) {
      const statusDisplay = client.status || 'NULL';
      console.log(`${String(client.id).padEnd(4)}| ${String(client.name).substring(0, 28).padEnd(30)}| ${String(client.email).substring(0, 28).padEnd(31)}| ${statusDisplay}`);
    }
    console.log('─'.repeat(80));
    console.log('');

    // Step 3: Update all approved clients to status='active'
    console.log('🔄 Step 2: Updating all approved clients to status="active"...');
    
    const updateResult = await db.execute({
      sql: `UPDATE users 
            SET status = 'active', 
                updated_at = datetime('now')
            WHERE (role = 'client' OR role = 'account_owner') 
            AND approved = 1 
            AND status != 'active'`,
      args: []
    });

    console.log(`✅ Updated ${updateResult.rowsAffected} client(s) to active status\n`);

    // Step 4: Verify updates
    console.log('✔️  Step 3: Verifying updates...');
    const verifyClients = await db.execute({
      sql: `SELECT id, name, email, role, approved, status FROM users 
            WHERE (role = 'client' OR role = 'account_owner') 
            AND approved = 1`,
      args: []
    });

    console.log('📋 Updated Status:');
    console.log('─'.repeat(80));
    console.log('ID  | Name                          | Email                          | Status');
    console.log('─'.repeat(80));
    
    let allActive = true;
    for (const client of verifyClients.rows) {
      const statusDisplay = client.status || 'NULL';
      const marker = client.status === 'active' ? '✅' : '❌';
      console.log(`${marker} ${String(client.id).padEnd(3)}| ${String(client.name).substring(0, 28).padEnd(30)}| ${String(client.email).substring(0, 28).padEnd(31)}| ${statusDisplay}`);
      if (client.status !== 'active') {
        allActive = false;
      }
    }
    console.log('─'.repeat(80));
    console.log('');

    // Step 5: Check for conflicts
    console.log('🔍 Step 4: Checking for conflicting data...');
    
    // Check for clients with approved=1 but status not active
    const conflicts = await db.execute({
      sql: `SELECT id, name, email, approved, status FROM users 
            WHERE (role = 'client' OR role = 'account_owner') 
            AND approved = 1 
            AND status != 'active'`,
      args: []
    });

    if (conflicts.rows.length > 0) {
      console.log('⚠️  Found conflicting records:');
      for (const conflict of conflicts.rows) {
        console.log(`  - ID ${conflict.id}: ${conflict.name} (approved=${conflict.approved}, status=${conflict.status})`);
      }
      console.log('');
    } else {
      console.log('✅ No conflicts found - all approved clients have status="active"\n');
    }

    // Step 6: Summary
    console.log('📊 Summary:');
    console.log(`  Total Approved Clients: ${approvedClients.rows.length}`);
    console.log(`  Updated to Active: ${updateResult.rowsAffected}`);
    console.log(`  Current Active Clients: ${verifyClients.rows.filter(c => c.status === 'active').length}`);
    console.log(`  Status: ${allActive ? '✅ ALL ACTIVE' : '❌ SOME NOT ACTIVE'}`);
    console.log('');

    // Step 7: Database consistency check
    console.log('🔍 Step 5: Database Consistency Check...');
    
    // Check for any other status values in approved clients
    const statusCheck = await db.execute({
      sql: `SELECT DISTINCT status, COUNT(*) as count FROM users 
            WHERE (role = 'client' OR role = 'account_owner') 
            AND approved = 1 
            GROUP BY status`,
      args: []
    });

    console.log('Status Distribution (Approved Clients):');
    for (const row of statusCheck.rows) {
      console.log(`  - ${row.status || 'NULL'}: ${row.count} client(s)`);
    }
    console.log('');

    console.log('✅ Client Activation Fix Complete!\n');
    console.log('📝 Next Steps:');
    console.log('  1. Test client login and dashboard access');
    console.log('  2. Verify settings pages show "Active" status');
    console.log('  3. Check order placement functionality');
    console.log('  4. Confirm no status conflicts remain');

  } catch (error) {
    console.error('❌ Error during client activation fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixClientActivation()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
