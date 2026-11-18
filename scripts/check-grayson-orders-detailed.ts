/**
 * Check all orders for graysonbay11@gmail.com
 */
import { db } from '../src/db';
import { users, jobs } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkGraysonOrders() {
  console.log('🔍 Checking orders for graysonbay11@gmail.com...\n');

  // Get the user
  const [freelancer] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'graysonbay11@gmail.com'))
    .limit(1);

  if (!freelancer) {
    console.log('❌ User not found');
    return;
  }

  console.log(`✅ Found user: ${freelancer.name} (ID: ${freelancer.id})`);
  console.log(`   Role: ${freelancer.role}`);
  console.log(`   Approved: ${freelancer.approved}`);
  console.log(`   Completed Jobs: ${freelancer.completedJobs}\n`);

  // Get all orders assigned to this freelancer
  const allOrders = await db
    .select({
      id: jobs.id,
      displayId: jobs.displayId,
      title: jobs.title,
      status: jobs.status,
      assignedFreelancerId: jobs.assignedFreelancerId,
      pages: jobs.pages,
      deadline: jobs.deadline,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(eq(jobs.assignedFreelancerId, freelancer.id));

  console.log(`📊 Total orders assigned to ${freelancer.name}: ${allOrders.length}\n`);

  if (allOrders.length === 0) {
    console.log('No orders found');
    return;
  }

  // Group by status
  const byStatus: Record<string, typeof allOrders> = {};
  allOrders.forEach(order => {
    const status = order.status || 'null';
    if (!byStatus[status]) {
      byStatus[status] = [];
    }
    byStatus[status].push(order);
  });

  console.log('📋 Orders by Status:');
  console.log('='.repeat(80));
  
  Object.entries(byStatus).forEach(([status, orders]) => {
    console.log(`\n${status.toUpperCase()} (${orders.length} orders):`);
    orders.forEach(order => {
      console.log(`  • Order #${order.displayId || order.id} - ${order.title}`);
      console.log(`    Pages: ${order.pages}, Deadline: ${order.deadline}`);
      console.log(`    Created: ${order.createdAt}`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📌 Status Summary:');
  Object.entries(byStatus).forEach(([status, orders]) => {
    console.log(`  ${status}: ${orders.length} orders`);
  });
}

checkGraysonOrders()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
