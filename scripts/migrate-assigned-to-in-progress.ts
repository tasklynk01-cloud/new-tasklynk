import { db } from '../src/db';
import { jobs } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function migrateAssignedOrders() {
  console.log('\n========================================');
  console.log('    MIGRATE ASSIGNED → IN_PROGRESS');
  console.log('========================================\n');

  // First, find all orders with 'assigned' status
  const assignedOrders = await db.select({
    id: jobs.id,
    displayId: jobs.displayId,
    status: jobs.status,
    assignedFreelancerId: jobs.assignedFreelancerId,
    freelancerAccepted: jobs.freelancerAccepted,
  }).from(jobs).where(eq(jobs.status, 'assigned'));

  console.log(`Found ${assignedOrders.length} orders with 'assigned' status\n`);

  if (assignedOrders.length === 0) {
    console.log('✅ No orders to migrate - all good!');
    return;
  }

  // Show orders to be migrated
  console.log('Orders to migrate:');
  for (const order of assignedOrders) {
    console.log(`  ID:${order.id} | ${order.displayId} | Freelancer:${order.assignedFreelancerId} | Accepted:${order.freelancerAccepted}`);
  }

  console.log('\nMigrating...\n');

  // Update all 'assigned' orders to 'in_progress' with freelancerAccepted = true
  const now = new Date().toISOString();
  
  for (const order of assignedOrders) {
    try {
      await db.update(jobs)
        .set({
          status: 'in_progress',
          freelancerAccepted: true,
          freelancerResponsePending: false,
          updatedAt: now,
        })
        .where(eq(jobs.id, order.id));
      
      console.log(`  ✅ ID:${order.id} (${order.displayId}) → in_progress`);
    } catch (error) {
      console.error(`  ❌ ID:${order.id} failed:`, error);
    }
  }

  // Verify migration
  console.log('\n--- Verification ---');
  const stillAssigned = await db.select({
    id: jobs.id,
    displayId: jobs.displayId,
    status: jobs.status,
  }).from(jobs).where(eq(jobs.status, 'assigned'));

  if (stillAssigned.length === 0) {
    console.log('✅ All orders successfully migrated!');
  } else {
    console.log(`⚠️ ${stillAssigned.length} orders still have 'assigned' status`);
    for (const order of stillAssigned) {
      console.log(`  ID:${order.id} | ${order.displayId}`);
    }
  }

  // Show new counts
  const inProgressOrders = await db.select({
    id: jobs.id,
  }).from(jobs).where(eq(jobs.status, 'in_progress'));

  console.log(`\n📊 Total in_progress orders now: ${inProgressOrders.length}`);

  console.log('\n========================================');
  console.log('    MIGRATION COMPLETE');
  console.log('========================================\n');
}

migrateAssignedOrders()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
