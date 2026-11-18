/**
 * List All Recently Registered Users
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';

async function listAllUsers() {
  console.log('👥 Listing all registered users...\n');

  try {
    const allUsers = await db
      .select({
        id: users.id,
        displayId: users.displayId,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        approved: users.approved,
        emailVerified: users.emailVerified,
        status: users.status,
        accountName: users.accountName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    console.log(`Total users in database: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('No users found in database.');
      return;
    }

    // Group by role
    const byRole = {
      admin: allUsers.filter(u => u.role === 'admin'),
      client: allUsers.filter(u => u.role === 'client'),
      account_owner: allUsers.filter(u => u.role === 'account_owner'),
      freelancer: allUsers.filter(u => u.role === 'freelancer'),
      manager: allUsers.filter(u => u.role === 'manager'),
      editor: allUsers.filter(u => u.role === 'editor'),
    };

    console.log('📊 Summary by Role:');
    console.log(`   Admins: ${byRole.admin.length}`);
    console.log(`   Clients: ${byRole.client.length}`);
    console.log(`   Account Owners: ${byRole.account_owner.length}`);
    console.log(`   Freelancers: ${byRole.freelancer.length}`);
    console.log(`   Managers: ${byRole.manager.length}`);
    console.log(`   Editors: ${byRole.editor.length}`);
    console.log('');

    // Show all users
    console.log('═'.repeat(120));
    console.log('ALL REGISTERED USERS:');
    console.log('═'.repeat(120));

    allUsers.forEach((u, idx) => {
      const statusIcon = u.approved ? '✅' : '⏳';
      const verifiedIcon = u.emailVerified ? '📧' : '❌';
      
      console.log(`\n${idx + 1}. ${u.email}`);
      console.log(`   ID: ${u.displayId} (DB: ${u.id})`);
      console.log(`   Name: ${u.name}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Phone: ${u.phone}`);
      console.log(`   Status: ${u.status} ${statusIcon}`);
      console.log(`   Approved: ${u.approved ? 'Yes' : 'No'}`);
      console.log(`   Email Verified: ${u.emailVerified ? 'Yes' : 'No'} ${verifiedIcon}`);
      console.log(`   Created: ${u.createdAt}`);
      if (u.accountName) console.log(`   Account: ${u.accountName}`);
    });

    console.log('\n' + '═'.repeat(120));

    // Show recently created (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recent = allUsers.filter(u => new Date(u.createdAt) > oneDayAgo);
    
    if (recent.length > 0) {
      console.log(`\n🆕 Recently Created (Last 24 hours): ${recent.length}`);
      console.log('─'.repeat(120));
      recent.forEach(u => {
        console.log(`   ${u.email} (${u.role}) - ${u.createdAt}`);
      });
      console.log('─'.repeat(120));
    }

    // Show pending approval
    const pending = allUsers.filter(u => !u.approved && u.status === 'pending');
    
    if (pending.length > 0) {
      console.log(`\n⏳ Pending Approval: ${pending.length}`);
      console.log('─'.repeat(120));
      pending.forEach(u => {
        console.log(`   ${u.email} (${u.role}) - Created: ${u.createdAt}`);
      });
      console.log('─'.repeat(120));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAllUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
