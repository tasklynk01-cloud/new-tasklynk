import { db } from '../src/db';
import { jobs } from '../src/db/schema';
import { eq, count, or, and, isNotNull, isNull } from 'drizzle-orm';

async function verifyCounts() {
  console.log('\n========================================');
  console.log('    ORDER COUNTS VERIFICATION');
  console.log('========================================\n');

  // All valid statuses after removing 'assigned'
  const statuses = [
    'pending', 'accepted', 'in_progress', 'editing', 
    'delivered', 'revision', 'approved', 'paid', 
    'completed', 'cancelled', 'on_hold'
  ];

  console.log('=== STATUS COUNTS ===\n');
  
  let grandTotal = 0;
  const statusCounts: Record<string, number> = {};
  
  for (const status of statuses) {
    const result = await db.select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, status));
    const c = result[0]?.count || 0;
    statusCounts[status] = c;
    grandTotal += c;
    if (c > 0) {
      console.log(`  ${status.padEnd(15)}: ${c}`);
    }
  }
  
  console.log(`  ${'─'.repeat(22)}`);
  console.log(`  TOTAL           : ${grandTotal}`);

  // Check for any orders with unexpected statuses
  console.log('\n=== CHECKING FOR ORPHAN STATUSES ===\n');
  
  const allOrders = await db.select({ 
    id: jobs.id, 
    status: jobs.status 
  }).from(jobs);
  
  const orphans = allOrders.filter(o => !statuses.includes(o.status || ''));
  if (orphans.length > 0) {
    console.log(`⚠️  Found ${orphans.length} orders with unexpected statuses:`);
    for (const o of orphans) {
      console.log(`  ID:${o.id} - Status: "${o.status}"`);
    }
  } else {
    console.log('✅ All orders have valid statuses');
  }

  // Dashboard-specific counts
  console.log('\n=== DASHBOARD VIEW COUNTS ===\n');

  // Admin/Manager view - all orders
  console.log(`📊 Admin/Manager Total: ${grandTotal}`);

  // Active orders (not completed/cancelled)
  const activeStatuses = ['pending', 'accepted', 'in_progress', 'editing', 'delivered', 'revision', 'approved', 'paid', 'on_hold'];
  const activeCount = activeStatuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
  console.log(`📊 Active Orders: ${activeCount}`);

  // Freelancer relevant orders (assigned to any freelancer)
  const freelancerOrders = await db.select({ count: count() })
    .from(jobs)
    .where(isNotNull(jobs.assignedFreelancerId));
  console.log(`📊 Orders with Freelancer: ${freelancerOrders[0]?.count || 0}`);

  // Orders awaiting assignment (accepted, no freelancer)
  const awaitingAssignment = await db.select({ count: count() })
    .from(jobs)
    .where(and(
      eq(jobs.status, 'accepted'),
      isNull(jobs.assignedFreelancerId)
    ));
  console.log(`📊 Awaiting Assignment: ${awaitingAssignment[0]?.count || 0}`);

  // In Progress orders
  console.log(`📊 In Progress: ${statusCounts['in_progress'] || 0}`);
  
  // On Hold orders
  console.log(`📊 On Hold: ${statusCounts['on_hold'] || 0}`);

  // Completed/Paid orders
  const finishedCount = (statusCounts['completed'] || 0) + (statusCounts['paid'] || 0);
  console.log(`📊 Completed/Paid: ${finishedCount}`);

  console.log('\n========================================');
  console.log('    VERIFICATION COMPLETE');
  console.log('========================================\n');
}

verifyCounts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
