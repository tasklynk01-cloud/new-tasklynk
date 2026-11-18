/**
 * Recalculate ALL order payment distributions using proper page derivation
 * This script derives pages from amount when missing and recalculates freelancer earnings
 * 
 * Run with: npx tsx scripts/recalculate-all-payments.ts
 */

import { db } from '../src/db';
import { jobs, users } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel, clientMinCPP, isTechnicalWorkType } from '../src/lib/payment-calculations';
import { getCurrentCPP, getCPPLevelByOrderCount } from '../src/lib/cpp-calculation';

/**
 * Derive pages from amount when pages/slides are missing
 */
function derivePagesFromAmount(
  amount: number,
  workType: string | null | undefined,
  clientCpp: number | null | undefined,
  singleSpaced: boolean = false
): number {
  if (amount <= 0) return 0;
  
  // Use provided clientCpp or fall back to minimum
  const cpp = Number(clientCpp || 0) || clientMinCPP(workType);
  if (cpp <= 0) return 0;
  
  // For single-spaced, client pays 2x per page
  const effectiveMultiplier = singleSpaced ? 2 : 1;
  const derivedPages = amount / (cpp * effectiveMultiplier);
  
  return Math.max(1, Math.round(derivedPages));
}

async function recalculateAllPayments() {
  console.log('\n=== RECALCULATING ALL ORDER PAYMENTS ===\n');
  console.log('This will recalculate freelancer earnings for ALL orders,');
  console.log('deriving pages from amount where pages are missing.\n');

  // Get ALL orders
  const allOrders = await db
    .select({
      id: jobs.id,
      displayId: jobs.displayId,
      title: jobs.title,
      amount: jobs.amount,
      pages: jobs.pages,
      slides: jobs.slides,
      workType: jobs.workType,
      singleSpaced: jobs.singleSpaced,
      clientCpp: jobs.clientCpp,
      freelancerEarnings: jobs.freelancerEarnings,
      managerEarnings: jobs.managerEarnings,
      adminProfit: jobs.adminProfit,
      status: jobs.status,
      assignedFreelancerId: jobs.assignedFreelancerId,
    })
    .from(jobs)
    .orderBy(desc(jobs.createdAt));

  console.log(`Found ${allOrders.length} total orders\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  const toFix: Array<{
    order: typeof allOrders[0];
    derivedPages: number;
    derivedSlides: number;
    freelancerEarnings: number;
    adminProfit: number;
    reason: string;
  }> = [];

  for (const order of allOrders) {
    const clientAmount = Number(order.amount || 0);
    if (clientAmount <= 0) {
      skippedCount++;
      continue;
    }

    let pages = Number(order.pages || 0);
    let slides = Number(order.slides || 0);
    const singleSpaced = Boolean(order.singleSpaced);
    let reason = '';
    
    // Derive pages from amount if pages/slides are missing
    if (pages === 0 && slides === 0) {
      pages = derivePagesFromAmount(clientAmount, order.workType, order.clientCpp, singleSpaced);
      reason = `Derived ${pages} pages from amount KSh ${clientAmount}`;
    }

    // Get freelancer's completed jobs if assigned
    let freelancerCompletedJobs = 0;
    if (order.assignedFreelancerId) {
      const [freelancer] = await db
        .select({ completedJobs: users.completedJobs })
        .from(users)
        .where(eq(users.id, order.assignedFreelancerId));
      freelancerCompletedJobs = freelancer?.completedJobs || 0;
    }

    // Calculate what freelancer earnings SHOULD be
    const calculatedFreelancerEarnings = calculateWriterEarningsByCPPLevel(
      pages,
      slides,
      order.workType,
      freelancerCompletedJobs,
      singleSpaced
    );

    const managerEarnings = Number(order.managerEarnings || 0);
    const calculatedAdminProfit = clientAmount - calculatedFreelancerEarnings - managerEarnings;
    
    const storedFreelancerEarnings = Number(order.freelancerEarnings || 0);
    const storedAdminProfit = Number(order.adminProfit || 0);
    
    // Check if recalculation is needed
    const freelancerDiff = Math.abs(storedFreelancerEarnings - calculatedFreelancerEarnings);
    const profitDiff = Math.abs(storedAdminProfit - calculatedAdminProfit);
    
    // Only fix if there's a significant difference
    if (freelancerDiff > 1 || profitDiff > 1) {
      if (!reason) reason = 'Recalculated with proper CPP level';
      toFix.push({
        order,
        derivedPages: pages,
        derivedSlides: slides,
        freelancerEarnings: calculatedFreelancerEarnings,
        adminProfit: calculatedAdminProfit,
        reason,
      });
    } else {
      skippedCount++;
    }
  }

  console.log(`Orders to fix: ${toFix.length}`);
  console.log(`Orders already correct: ${skippedCount}`);
  console.log('\n');

  if (toFix.length === 0) {
    console.log('✅ All orders have correct payment calculations!');
    process.exit(0);
  }

  // Show what will be fixed
  console.log('=== ORDERS TO BE FIXED ===\n');
  for (const { order, derivedPages, derivedSlides, freelancerEarnings, adminProfit, reason } of toFix) {
    const storedFreelancerEarnings = Number(order.freelancerEarnings || 0);
    const storedAdminProfit = Number(order.adminProfit || 0);
    
    console.log(`${order.displayId} (ID: ${order.id})`);
    console.log(`  Status: ${order.status}, Work Type: ${order.workType}`);
    console.log(`  Amount: KSh ${Number(order.amount)}, Pages: ${order.pages} → ${derivedPages}, Slides: ${order.slides} → ${derivedSlides}`);
    console.log(`  Single Spaced: ${Boolean(order.singleSpaced)}`);
    console.log(`  Reason: ${reason}`);
    console.log(`  Freelancer: KSh ${storedFreelancerEarnings} → ${freelancerEarnings} (${freelancerEarnings > storedFreelancerEarnings ? '+' : ''}${(freelancerEarnings - storedFreelancerEarnings).toFixed(2)})`);
    console.log(`  Admin Profit: KSh ${storedAdminProfit} → ${adminProfit} (${adminProfit > storedAdminProfit ? '+' : ''}${(adminProfit - storedAdminProfit).toFixed(2)})`);
    console.log('');
  }

  // Confirm before applying
  console.log('\nApplying fixes...\n');

  for (const { order, derivedPages, derivedSlides, freelancerEarnings, adminProfit } of toFix) {
    const updateData: Record<string, any> = {
      freelancerEarnings: String(freelancerEarnings),
      adminProfit: String(adminProfit),
    };

    // Also update pages/slides if they were derived
    if (Number(order.pages || 0) === 0 && derivedPages > 0) {
      updateData.pages = derivedPages;
    }
    if (Number(order.slides || 0) === 0 && derivedSlides > 0) {
      updateData.slides = derivedSlides;
    }

    try {
      await db
        .update(jobs)
        .set(updateData)
        .where(eq(jobs.id, order.id));
      console.log(`✅ Fixed ${order.displayId}`);
      fixedCount++;
    } catch (err) {
      console.log(`❌ Failed to fix ${order.displayId}: ${err}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Total orders: ${allOrders.length}`);
  console.log(`  Fixed: ${fixedCount}`);
  console.log(`  Already correct: ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('═'.repeat(60));

  process.exit(errorCount > 0 ? 1 : 0);
}

recalculateAllPayments().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
