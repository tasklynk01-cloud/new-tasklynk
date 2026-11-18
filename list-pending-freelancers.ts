import { db } from './src/db';
import { users } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * List all pending freelancers for selective approval
 */

(async () => {
  console.log('📋 PENDING FREELANCERS LIST\n');
  
  const pendingFreelancers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, 'freelancer'),
        eq(users.approved, false)
      )
    );

  if (pendingFreelancers.length === 0) {
    console.log('✅ No pending freelancers - all are approved!\n');
  } else {
    console.log(`Found ${pendingFreelancers.length} pending freelancer(s):\n`);
    
    pendingFreelancers.forEach((f, idx) => {
      console.log(`[${idx + 1}] ID: ${f.id}`);
      console.log(`    Display ID: ${f.displayId}`);
      console.log(`    Email: ${f.email}`);
      console.log(`    Name: ${f.name}`);
      console.log(`    Status: ${f.status}`);
      console.log(`    Created: ${f.createdAt}`);
      console.log('');
    });

    console.log('To approve a specific freelancer:');
    console.log('1. Login to admin dashboard at http://localhost:5000/admin/dashboard');
    console.log('2. Go to Users Management');
    console.log('3. Find the freelancer and click "Approve"');
    console.log('\nOR use the admin API:');
    console.log('curl -X PATCH http://localhost:5000/api/users/{userId}/approve \\');
    console.log('  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"approved": true}\'');
  }

  // Show approved freelancers count
  const approvedFreelancers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, 'freelancer'),
        eq(users.approved, true)
      )
    );

  console.log(`\n✓ Approved freelancers: ${approvedFreelancers.length}`);
  
  process.exit(0);
})();
