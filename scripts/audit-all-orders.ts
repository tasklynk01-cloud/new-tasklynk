import { db } from '../src/db';
import { jobs, users } from '../src/db/schema';
import { eq, sql, count } from 'drizzle-orm';

async function auditOrders() {
  console.log('\n========================================');
  console.log('    COMPLETE ORDER AUDIT');
  console.log('========================================\n');

  // Get all orders with key fields
  const allOrders = await db.select({
    id: jobs.id,
    displayId: jobs.displayId,
    orderId: jobs.orderId,
    title: jobs.title,
    status: jobs.status,
    clientId: jobs.clientId,
    managerId: jobs.managerId,
    assignedFreelancerId: jobs.assignedFreelancerId,
    freelancerAccepted: jobs.freelancerAccepted,
    freelancerResponsePending: jobs.freelancerResponsePending,
    createdAt: jobs.createdAt,
  }).from(jobs).orderBy(jobs.id);

  console.log(`=== TOTAL ORDERS: ${allOrders.length} ===\n`);

  // Group by status
  const byStatus: Record<string, typeof allOrders> = {};
  for (const order of allOrders) {
    const status = order.status || 'null';
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(order);
  }

  console.log('=== ORDERS BY STATUS ===');
  for (const [status, orders] of Object.entries(byStatus)) {
    console.log(`\n[${status.toUpperCase()}] - ${orders.length} orders:`);
    for (const o of orders) {
      console.log(`  ID:${o.id} | ${o.displayId || o.orderId || 'NO-ID'} | Client:${o.clientId} | Manager:${o.managerId || 'none'} | Freelancer:${o.assignedFreelancerId || 'none'} | Accepted:${o.freelancerAccepted}`);
    }
  }

  // Summary table
  console.log('\n========================================');
  console.log('    STATUS SUMMARY');
  console.log('========================================');
  
  const validStatuses = [
    'pending', 'accepted', 'in_progress', 'editing', 
    'delivered', 'revision', 'approved', 'paid', 
    'completed', 'cancelled', 'on_hold'
  ];
  
  let total = 0;
  for (const status of validStatuses) {
    const count = byStatus[status]?.length || 0;
    total += count;
    if (count > 0) {
      console.log(`  ${status.padEnd(15)}: ${count}`);
    }
  }
  
  // Check for any unexpected statuses
  const unexpectedStatuses = Object.keys(byStatus).filter(s => !validStatuses.includes(s));
  if (unexpectedStatuses.length > 0) {
    console.log('\n  ⚠️  UNEXPECTED STATUSES:');
    for (const status of unexpectedStatuses) {
      console.log(`    ${status}: ${byStatus[status].length}`);
      total += byStatus[status].length;
    }
  }
  
  console.log(`  ${'─'.repeat(20)}`);
  console.log(`  TOTAL           : ${total}`);

  // Check for data integrity issues
  console.log('\n========================================');
  console.log('    DATA INTEGRITY CHECKS');
  console.log('========================================');

  // Check for orders with assigned freelancer but wrong status
  const assignedButWrongStatus = allOrders.filter(o => 
    o.assignedFreelancerId && 
    !['in_progress', 'editing', 'delivered', 'revision', 'approved', 'paid', 'completed', 'on_hold'].includes(o.status || '')
  );
  
  if (assignedButWrongStatus.length > 0) {
    console.log(`\n⚠️  Orders with freelancer assigned but status not in expected workflow:`);
    for (const o of assignedButWrongStatus) {
      console.log(`  ID:${o.id} | ${o.displayId} | Status:${o.status} | Freelancer:${o.assignedFreelancerId}`);
    }
  }

  // Check for orders still showing 'assigned' status (should be none after migration)
  const stillAssigned = allOrders.filter(o => o.status === 'assigned');
  if (stillAssigned.length > 0) {
    console.log(`\n❌ CRITICAL: Orders still have 'assigned' status (should be migrated to in_progress):`);
    for (const o of stillAssigned) {
      console.log(`  ID:${o.id} | ${o.displayId} | Freelancer:${o.assignedFreelancerId}`);
    }
  } else {
    console.log(`\n✅ No orders with deprecated 'assigned' status`);
  }

  // Check for in_progress orders without freelancer
  const inProgressNoFreelancer = allOrders.filter(o => 
    o.status === 'in_progress' && !o.assignedFreelancerId
  );
  
  if (inProgressNoFreelancer.length > 0) {
    console.log(`\n⚠️  Orders in 'in_progress' without assigned freelancer:`);
    for (const o of inProgressNoFreelancer) {
      console.log(`  ID:${o.id} | ${o.displayId} | Client:${o.clientId}`);
    }
  }

  // Manager visibility check
  console.log('\n========================================');
  console.log('    MANAGER VISIBILITY');
  console.log('========================================');

  // Get orders that should be visible to managers (all orders except maybe some edge cases)
  const managerVisibleStatuses = [
    'pending', 'accepted', 'in_progress', 'editing', 
    'delivered', 'revision', 'approved', 'paid', 
    'completed', 'cancelled', 'on_hold'
  ];
  
  const managerVisible = allOrders.filter(o => managerVisibleStatuses.includes(o.status || ''));
  console.log(`\nOrders visible to managers: ${managerVisible.length}`);
  
  // Check if any orders have null/undefined status
  const nullStatus = allOrders.filter(o => !o.status);
  if (nullStatus.length > 0) {
    console.log(`\n⚠️  Orders with NULL/undefined status: ${nullStatus.length}`);
    for (const o of nullStatus) {
      console.log(`  ID:${o.id} | ${o.displayId} | Client:${o.clientId}`);
    }
  }

  console.log('\n========================================');
  console.log('    AUDIT COMPLETE');
  console.log('========================================\n');
}

auditOrders()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
