/**
 * Debug script using Drizzle to check order statuses
 * Run: npx tsx debug-orders-status.ts
 */

import { db } from './src/db';
import { jobs } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

async function debugOrderStatuses() {
  console.log('🔍 Debugging Order Statuses After Freelancer Acceptance\n');

  try {
    // Find all orders where freelancer_accepted = true
    const acceptedOrders = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        assignedFreelancerId: jobs.assignedFreelancerId,
        freelancerAccepted: jobs.freelancerAccepted,
        freelancerAcceptedAt: jobs.freelancerAcceptedAt,
        freelancerResponsePending: jobs.freelancerResponsePending,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(eq(jobs.freelancerAccepted, true))
      .limit(20);

    console.log(`📊 Found ${acceptedOrders.length} orders with freelancer_accepted=true:\n`);

    const statusCounts: Record<string, number> = {};

    acceptedOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.id} (${order.displayId})`);
      console.log(`   Title: ${order.title}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Freelancer ID: ${order.assignedFreelancerId}`);
      console.log(`   Accepted At: ${order.freelancerAcceptedAt}`);
      console.log(`   Response Pending: ${order.freelancerResponsePending}`);
      console.log(`   Updated: ${order.updatedAt}`);
      console.log('');

      // Count statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    console.log('\n📈 Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Check for potential issues
    const stuckInAssigned = acceptedOrders.filter(o => o.status === 'assigned');
    if (stuckInAssigned.length > 0) {
      console.log(`\n⚠️  WARNING: ${stuckInAssigned.length} orders are stuck in 'assigned' status despite being accepted!`);
      console.log('   These orders should have transitioned to "in_progress"');
    }

    const inProgress = acceptedOrders.filter(o => o.status === 'in_progress');
    console.log(`\n✅ ${inProgress.length} orders correctly in 'in_progress' status`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

debugOrderStatuses();
