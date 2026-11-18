import { db } from './src/db';
import { users, jobs, bids, freelancerCPPLevels, freelancerCPPProgress } from './src/db/schema';
import { eq } from 'drizzle-orm';

(async () => {
  console.log('=== FREELANCER SYSTEM DEBUG ===\n');

  const freelancers = await db.select().from(users).where(eq(users.role, 'freelancer'));
  console.log(`Total Freelancers: ${freelancers.length}\n`);

  if (freelancers.length > 0) {
    for (const f of freelancers) {
      console.log(`Freelancer ID ${f.id}:`);
      console.log(`  Display ID: ${f.displayId}`);
      console.log(`  Email: ${f.email}`);
      console.log(`  Name: ${f.name}`);
      console.log(`  Approved: ${f.approved}`);
      console.log(`  Status: ${f.status}`);
      console.log(`  Role ID: ${f.roleId}`);
      console.log(`  Balance: ${f.balance}`);
      console.log(`  Completed Jobs: ${f.completedJobs}\n`);
      
      // Check assignments
      const assignedJobs = await db.select().from(jobs).where(eq(jobs.assignedFreelancerId, f.id));
      console.log(`  Assigned Jobs: ${assignedJobs.length}`);
      
      // Check bids
      const freelancerBids = await db.select().from(bids).where(eq(bids.freelancerId, f.id));
      console.log(`  Bids: ${freelancerBids.length}`);
      
      // Check CPP progress
      const cppProgress = await db.select().from(freelancerCPPProgress).where(eq(freelancerCPPProgress.freelancerId, f.id));
      console.log(`  CPP Progress: ${cppProgress.length > 0 ? 'INITIALIZED' : 'NOT INITIALIZED'}\n`);
    }
  } else {
    console.log('⚠️  NO FREELANCERS FOUND\n');
  }

  // Check CPP Levels
  const cppLevels = await db.select().from(freelancerCPPLevels);
  console.log(`\nCPP Levels configured: ${cppLevels.length}`);
  
  console.log('\n=== END DEBUG ===');
  process.exit(0);
})();
