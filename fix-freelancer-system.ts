import { db } from './src/db';
import { freelancerCPPLevels, freelancerCPPProgress, users } from './src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Freelancer System Fixes
 * 
 * This script fixes identified issues in the freelancer system:
 * 1. Initialize CPP Levels (if missing)
 * 2. Initialize CPP Progress for all freelancers
 * 3. Verify role consistency
 */

(async () => {
  console.log('🔧 FREELANCER SYSTEM FIX\n');
  console.log('Starting fixes...\n');

  // 1. Check and initialize CPP Levels
  console.log('1. Checking CPP Levels...');
  const existingLevels = await db.select().from(freelancerCPPLevels);
  
  if (existingLevels.length === 0) {
    console.log('   ⚠️  CPP Levels not found. Initializing...');
    
    const levels = [
      {
        level: 1,
        levelName: 'Starter',
        description: 'Entry-level writers - First 3 orders',
        completedOrdersRequired: 0,
        cppNonTechnical: 150,
        cppTechnical: 170,
        orderCountInLevel: 3,
        progressBarColor: '#10b981',
        createdAt: new Date().toISOString(),
      },
      {
        level: 2,
        levelName: 'Rising',
        description: 'Developing writers - Orders 4-5',
        completedOrdersRequired: 3,
        cppNonTechnical: 160,
        cppTechnical: 180,
        orderCountInLevel: 2,
        progressBarColor: '#3b82f6',
        createdAt: new Date().toISOString(),
      },
      {
        level: 3,
        levelName: 'Established',
        description: 'Proven writers - Orders 6-15',
        completedOrdersRequired: 5,
        cppNonTechnical: 170,
        cppTechnical: 190,
        orderCountInLevel: 10,
        progressBarColor: '#8b5cf6',
        createdAt: new Date().toISOString(),
      },
      {
        level: 4,
        levelName: 'Expert',
        description: 'Highly skilled writers - Orders 16-27',
        completedOrdersRequired: 15,
        cppNonTechnical: 180,
        cppTechnical: 200,
        orderCountInLevel: 12,
        progressBarColor: '#f59e0b',
        createdAt: new Date().toISOString(),
      },
      {
        level: 5,
        levelName: 'Master',
        description: 'Elite writers - 28+ orders',
        completedOrdersRequired: 27,
        cppNonTechnical: 200,
        cppTechnical: 220,
        orderCountInLevel: 999,
        progressBarColor: '#ef4444',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const level of levels) {
      await db.insert(freelancerCPPLevels).values(level);
      console.log(`   ✓ Created ${level.levelName} (Level ${level.level})`);
    }
    console.log('   ✓ CPP Levels initialized\n');
  } else {
    console.log(`   ✓ CPP Levels exist (${existingLevels.length} levels)\n`);
  }

  // 2. Initialize CPP Progress for all freelancers
  console.log('2. Initializing CPP Progress for freelancers...');
  const freelancers = await db.select().from(users).where(eq(users.role, 'freelancer'));
  console.log(`   Found ${freelancers.length} freelancers\n`);

  let initialized = 0;
  let alreadyExists = 0;

  for (const freelancer of freelancers) {
    // Check if progress already exists
    const existingProgress = await db
      .select()
      .from(freelancerCPPProgress)
      .where(eq(freelancerCPPProgress.freelancerId, freelancer.id));

    if (existingProgress.length === 0) {
      // Create initial progress record
      await db.insert(freelancerCPPProgress).values({
        freelancerId: freelancer.id,
        currentLevel: 1,
        totalCompletedOrders: freelancer.completedJobs || 0,
        ordersInCurrentLevel: 0,
        progressPercentage: 0,
        nextLevelOrdersRequired: 3,
        isWorkTypeSpecialized: false,
        lastProgressUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`   ✓ Initialized: ${freelancer.email} (ID: ${freelancer.id})`);
      initialized++;
    } else {
      alreadyExists++;
    }
  }

  console.log(`\n   Summary:`);
  console.log(`   - Initialized: ${initialized}`);
  console.log(`   - Already exists: ${alreadyExists}`);
  console.log(`   - Total: ${freelancers.length}\n`);

  // 3. Verify role consistency
  console.log('3. Verifying role consistency...');
  const freelancersWithWrongRoleId = await db
    .select()
    .from(users)
    .where(eq(users.role, 'freelancer'));

  let inconsistent = 0;
  for (const freelancer of freelancersWithWrongRoleId) {
    if (freelancer.roleId !== 4) {
      await db
        .update(users)
        .set({ roleId: 4 })
        .where(eq(users.id, freelancer.id));
      
      console.log(`   ✓ Fixed roleId for: ${freelancer.email} (was ${freelancer.roleId}, now 4)`);
      inconsistent++;
    }
  }

  if (inconsistent === 0) {
    console.log('   ✓ All freelancers have correct roleId (4)\n');
  } else {
    console.log(`   ✓ Fixed ${inconsistent} inconsistent roleId values\n`);
  }

  console.log('✅ FREELANCER SYSTEM FIX COMPLETE\n');
  console.log('All freelancers now have:');
  console.log('- CPP Levels configured');
  console.log('- CPP Progress initialized');
  console.log('- Correct role and roleId');
  
  process.exit(0);
})();
