import { db } from './src/db';
import { users } from './src/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';

/**
 * Unapprove freelancers except Willys and Madilu
 */

(async () => {
  console.log('🔄 UPDATING FREELANCER APPROVALS\n');
  
  // Get Willys and Madilu IDs
  const keepApproved = await db
    .select()
    .from(users)
    .where(eq(users.role, 'freelancer'));
  
  const willys = keepApproved.find(f => f.email === 'willysodhaimbo@gmail.com');
  const madilu = keepApproved.find(f => f.email === 'madilu343@gmail.com');
  
  if (!willys || !madilu) {
    console.log('❌ Could not find Willys or Madilu');
    process.exit(1);
  }
  
  console.log(`✓ Found Willys (ID: ${willys.id})`);
  console.log(`✓ Found Madilu (ID: ${madilu.id})\n`);
  
  const keepApprovedIds = [willys.id, madilu.id];
  
  // Get all other freelancers
  const allFreelancers = await db
    .select()
    .from(users)
    .where(eq(users.role, 'freelancer'));
  
  let unapprovedCount = 0;
  
  for (const freelancer of allFreelancers) {
    if (!keepApprovedIds.includes(freelancer.id)) {
      // Unapprove this freelancer
      await db
        .update(users)
        .set({ 
          approved: false,
          status: 'pending'
        })
        .where(eq(users.id, freelancer.id));
      
      console.log(`✓ Unapproved: ${freelancer.email} (ID: ${freelancer.id})`);
      unapprovedCount++;
    }
  }
  
  console.log(`\n✅ Complete!`);
  console.log(`   - Kept approved: 2 (Willys, Madilu)`);
  console.log(`   - Unapproved: ${unapprovedCount}`);
  console.log(`   - Total freelancers: ${allFreelancers.length}`);
  
  process.exit(0);
})();
