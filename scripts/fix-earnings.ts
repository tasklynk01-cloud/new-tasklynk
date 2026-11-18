/**
 * Script to recalculate and fix freelancer/manager earnings for all orders
 * This addresses orders with missing or incorrect earnings calculations
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

import { db } from '../src/db';
import { jobs, users } from '../src/db/schema';
import { eq, and, or, sql, isNull, desc } from 'drizzle-orm';
import { 
  calculateWriterEarningsByCPPLevel, 
  managerAssignFee, 
  managerSubmitFee,
  clientMinCPP,
  clientMinCPS
} from '../src/lib/payment-calculations';

interface OrderToFix {
  id: number;
  displayId: string | null;
  status: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  freelancerEarnings: number;
  managerEarnings: number;
  assignedFreelancerId: number | null;
  managerId: number | null;
  workType: string;
  clientCpp: number | null;
}

async function main() {
  console.log('='.repeat(80));
  console.log('EARNINGS RECALCULATION SCRIPT');
  console.log('='.repeat(80));

  // Get all orders
  const allOrders = await db
    .select({
      id: jobs.id,
      displayId: jobs.displayId,
      status: jobs.status,
      pages: jobs.pages,
      slides: jobs.slides,
      amount: jobs.amount,
      freelancerEarnings: jobs.freelancerEarnings,
      managerEarnings: jobs.managerEarnings,
      assignedFreelancerId: jobs.assignedFreelancerId,
      managerId: jobs.managerId,
      workType: jobs.workType,
      clientCpp: jobs.clientCpp,
    })
    .from(jobs)
    .orderBy(jobs.id);

  console.log(`\nTotal orders: ${allOrders.length}`);

  // Find orders needing fixes
  const ordersToFix: OrderToFix[] = [];
  let fixedCount = 0;
  let skippedCount = 0;

  for (const order of allOrders) {
    // Calculate expected earnings
    let completedOrders = 0;
    if (order.assignedFreelancerId) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(
          and(
            eq(jobs.assignedFreelancerId, order.assignedFreelancerId),
            eq(jobs.status, 'completed')
          )
        );
      completedOrders = Number(countResult[0]?.count || 0);
    }

    // If pages/slides are null, try to infer from amount and clientCpp
    let pages = order.pages;
    let slides = order.slides;
    
    if ((pages === null || pages === 0) && (slides === null || slides === 0) && order.amount > 0) {
      // Try to infer pages from amount
      const cpp = order.clientCpp || clientMinCPP(order.workType);
      if (cpp > 0) {
        // Check if it's a slide order
        if (order.workType?.toLowerCase().includes('slide') || order.workType?.toLowerCase().includes('presentation')) {
          slides = Math.round(order.amount / clientMinCPS());
          console.log(`\n⚠️ Order ${order.displayId}: Inferred ${slides} slides from amount ${order.amount} (CPP: ${clientMinCPS()})`);
        } else {
          pages = Math.round(order.amount / cpp);
          console.log(`\n⚠️ Order ${order.displayId}: Inferred ${pages} pages from amount ${order.amount} (CPP: ${cpp})`);
        }
      }
    }

    const expectedFreelancerEarnings = calculateWriterEarningsByCPPLevel(
      pages,
      slides,
      order.workType,
      completedOrders
    );

    // Calculate manager earnings (simplified - no tracking of who assigned/delivered yet)
    // Manager gets: 10 KSh for assignment + (10 + 5*(pages-1)) for delivery
    let expectedManagerEarnings = 0;
    const deliveredStatuses = ['delivered', 'approved', 'paid', 'completed'];
    
    if (order.assignedFreelancerId && order.managerId) {
      // Manager assigned this order
      expectedManagerEarnings += managerAssignFee();
      
      // If delivered, manager gets delivery fee
      if (deliveredStatuses.includes(order.status)) {
        expectedManagerEarnings += managerSubmitFee(pages);
      }
    }

    // Check if corrections needed
    const needsFreelancerFix = order.assignedFreelancerId && 
      (order.freelancerEarnings === 0 || order.freelancerEarnings === null) &&
      expectedFreelancerEarnings > 0;
    
    const needsManagerFix = order.managerId && 
      Math.abs((order.managerEarnings || 0) - expectedManagerEarnings) > 0.01;
    
    const needsPagesFix = (pages !== order.pages || slides !== order.slides) && 
      (pages !== null || slides !== null);

    if (needsFreelancerFix || needsManagerFix || needsPagesFix) {
      console.log(`\n📝 Order ${order.displayId} (ID: ${order.id}) - ${order.status}:`);
      console.log(`   Current: pages=${order.pages}, slides=${order.slides}`);
      console.log(`   Current freelancerEarnings: ${order.freelancerEarnings}, expected: ${expectedFreelancerEarnings}`);
      console.log(`   Current managerEarnings: ${order.managerEarnings}, expected: ${expectedManagerEarnings}`);
      
      if (needsPagesFix) {
        console.log(`   Will update pages to ${pages}, slides to ${slides}`);
      }

      // Apply fix
      try {
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };
        
        if (needsFreelancerFix) {
          updateData.freelancerEarnings = expectedFreelancerEarnings;
        }
        if (needsManagerFix) {
          updateData.managerEarnings = expectedManagerEarnings;
        }
        if (needsPagesFix) {
          if (pages !== null) updateData.pages = pages;
          if (slides !== null) updateData.slides = slides;
        }

        await db.update(jobs).set(updateData).where(eq(jobs.id, order.id));
        console.log(`   ✅ Fixed!`);
        fixedCount++;
      } catch (err: any) {
        console.log(`   ❌ Failed: ${err.message}`);
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: Fixed ${fixedCount} orders, Skipped ${skippedCount} (already correct)`);
  console.log('='.repeat(80));

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
