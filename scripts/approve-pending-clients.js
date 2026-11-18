/**
 * Script to approve all pending clients in the database
 * This ensures clients registered before the admin approval enforcement can place orders
 * 
 * Run with: node scripts/approve-pending-clients.js
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

async function approvePendingClients() {
  console.log('🔍 Starting client approval process...\n');

  // Create Turso database client
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Find all unapproved users (clients, account_owners, freelancers, managers, editors)
    console.log('📊 Checking for unapproved users...');
    
    const result = await client.execute(`
      SELECT 
        id, 
        email, 
        name, 
        role, 
        status, 
        approved,
        created_at
      FROM users 
      WHERE 
        (approved = 0 OR approved IS NULL OR status = 'pending')
        AND role IN ('client', 'account_owner', 'freelancer', 'manager', 'editor')
      ORDER BY role, created_at
    `);

    if (result.rows.length === 0) {
      console.log('✅ No unapproved users found. All users are already approved!\n');
      return;
    }

    console.log(`\n📋 Found ${result.rows.length} unapproved users:\n`);
    
    // Group by role for display
    const usersByRole = {};
    result.rows.forEach(row => {
      const role = row.role;
      if (!usersByRole[role]) usersByRole[role] = [];
      usersByRole[role].push(row);
    });

    // Display summary
    Object.keys(usersByRole).sort().forEach(role => {
      console.log(`  ${role.toUpperCase()}: ${usersByRole[role].length} user(s)`);
      usersByRole[role].forEach(user => {
        console.log(`    - ${user.name} (${user.email}) - Status: ${user.status}`);
      });
      console.log('');
    });

    // 2. Update all unapproved users to approved
    console.log('🔄 Approving all pending users...\n');
    
    const now = new Date().toISOString();
    const updateResult = await client.execute(`
      UPDATE users 
      SET 
        approved = 1,
        status = 'active',
        updated_at = ?
      WHERE 
        (approved = 0 OR approved IS NULL OR status = 'pending')
        AND role IN ('client', 'account_owner', 'freelancer', 'manager', 'editor')
    `, [now]);

    console.log(`✅ Successfully approved ${updateResult.rowsAffected} users!\n`);

    // 3. Verify the updates
    console.log('🔍 Verifying updates...');
    
    const verifyResult = await client.execute(`
      SELECT role, COUNT(*) as count
      FROM users 
      WHERE approved = 1 AND status = 'active'
      GROUP BY role
      ORDER BY role
    `);

    console.log('\n📊 Current approval status by role:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.role.toUpperCase()}: ${row.count} approved`);
    });

    // 4. Check if any users are still unapproved
    const stillPendingResult = await client.execute(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE 
        (approved = 0 OR approved IS NULL OR status = 'pending')
        AND role != 'admin'
    `);

    const stillPending = stillPendingResult.rows[0].count;
    if (stillPending > 0) {
      console.log(`\n⚠️  Warning: ${stillPending} users are still unapproved (may be rejected/suspended)`);
    } else {
      console.log('\n✅ All non-admin users are now approved!');
    }

    console.log('\n✨ Client approval process completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Users can now log in and access their dashboards');
    console.log('   2. Clients can place orders');
    console.log('   3. Freelancers can accept assignments');
    console.log('   4. Managers can manage orders');
    console.log('');

  } catch (error) {
    console.error('❌ Error during approval process:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    client.close();
  }
}

// Run the script
approvePendingClients()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
