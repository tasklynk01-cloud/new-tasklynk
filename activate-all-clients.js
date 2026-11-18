/**
 * Script to activate all existing client accounts
 * Sets approved=true and status='active' for all clients and account_owners
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function activateAllClients() {
  try {
    console.log('🔍 Starting client activation process...\n');

    // Get all clients and account_owners that are not active
    const inactiveClients = await db.execute({
      sql: `SELECT id, email, name, role, approved, status 
            FROM users 
            WHERE (role = 'client' OR role = 'account_owner') 
            AND (approved = 0 OR status != 'active')`,
      args: []
    });

    if (inactiveClients.rows.length === 0) {
      console.log('✅ All clients are already active!\n');
      return;
    }

    console.log(`📊 Found ${inactiveClients.rows.length} inactive client(s):\n`);
    
    inactiveClients.rows.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (${client.email})`);
      console.log(`   Role: ${client.role}`);
      console.log(`   Current Status: approved=${client.approved}, status='${client.status}'`);
      console.log('');
    });

    console.log('🔄 Activating all clients...\n');

    // Update all clients and account_owners to be active
    const result = await db.execute({
      sql: `UPDATE users 
            SET approved = 1, 
                status = 'active', 
                updated_at = datetime('now')
            WHERE (role = 'client' OR role = 'account_owner') 
            AND (approved = 0 OR status != 'active')`,
      args: []
    });

    console.log(`✅ Successfully activated ${result.rowsAffected} client account(s)!\n`);

    // Verify the changes
    const verifyClients = await db.execute({
      sql: `SELECT id, email, name, role, approved, status 
            FROM users 
            WHERE (role = 'client' OR role = 'account_owner')
            ORDER BY created_at DESC
            LIMIT 10`,
      args: []
    });

    console.log('📋 Latest client accounts status:\n');
    verifyClients.rows.forEach((client, index) => {
      const statusIcon = client.approved && client.status === 'active' ? '✅' : '⏳';
      console.log(`${statusIcon} ${client.name} (${client.email})`);
      console.log(`   Role: ${client.role} | Approved: ${client.approved} | Status: ${client.status}`);
      console.log('');
    });

    console.log('🎉 Client activation complete!\n');
    console.log('All clients can now:');
    console.log('  • Login to their accounts');
    console.log('  • Place orders immediately');
    console.log('  • Access all client features\n');

  } catch (error) {
    console.error('❌ Error activating clients:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the activation
activateAllClients()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
