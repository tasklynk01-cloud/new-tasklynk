/**
 * Fix script to recalculate payment distributions for imbalanced orders
 * These orders have client amounts but no freelancer/manager/admin splits
 * 
 * ENHANCED: Now derives pages from amount when pages/slides are missing
 * 
 * Run with: npx tsx scripts/fix-payment-imbalances.ts
 */

import { db } from '../src/db';
import { jobs, users } from '../src/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel, clientMinCPP, isTechnicalWorkType } from '../src/lib/payment-calculations';

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

async function fixPaymentImbalances() {
  console.log('\n=== FIXING PAYMENT IMBALANCES ===\n');

  // Find orders where amounts don't add up (client paid but no earnings distributed)
  const imbalancedOrders = await db
    .select({
      id: jobs.id,
      displayId: jobs.displayId,
      title: jobs.title,
      amount: jobs.amount,
      pages: jobs.pages,
      slides: jobs.slides,
      workType: jobs.workType,
      singleSpaced: jobs.singleSpaced,
      freelancerEarnings: jobs.freelancerEarnings,
      managerEarnings: jobs.managerEarnings,
      adminProfit: jobs.adminProfit,
      status: jobs.status,
      assignedFreelancerId: jobs.assignedFreelancerId,
    })
    .from(jobs)
    .where(
      and(
        sql`CAST(${jobs.amount} AS REAL) > 0`,
        sql`(COALESCE(CAST(${jobs.freelancerEarnings} AS REAL), 0) + COALESCE(CAST(${jobs.managerEarnings} AS REAL), 0) + COALESCE(CAST(${jobs.adminProfit} AS REAL), 0)) < (CAST(${jobs.amount} AS REAL) - 1)`
      )
    );

  console.log(`Found ${imbalancedOrders.length} imbalanced orders\n`);

  if (imbalancedOrders.length === 0) {
    console.log('✅ No imbalanced orders found. All payments are properly distributed.');
    process.exit(0);
  }

  let fixedCount = 0;
  let errorCount = 0;

  for (const order of imbalancedOrders) {
    console.log('─'.repeat(60));
    console.log(`Processing: ${order.displayId} (ID: ${order.id})`);
    console.log(`Status: ${order.status}, Title: ${order.title}`);
    
    const clientAmount = Number(order.amount || 0);
    const pages = Number(order.pages || 0);
    const slides = Number(order.slides || 0);
    const singleSpaced = Boolean(order.singleSpaced);
    
    console.log(`  Client Amount: KSh ${clientAmount}`);
    console.log(`  Pages: ${pages}, Slides: ${slides}, Single Spaced: ${singleSpaced}`);

    // Derive pages from amount if pages/slides are missing
    let effectivePages = pages;
    let effectiveSlides = slides;
    
    if (pages === 0 && slides === 0 && clientAmount > 0) {
      // Try to derive pages from amount
      // Use minimum CPP for the work type to estimate pages
      const estimatedCpp = clientMinCPP(order.workType);
      const singleSpacedMultiplier = singleSpaced ? 2 : 1;
      effectivePages = derivePagesFromAmount(clientAmount, order.workType, estimatedCpp, singleSpaced);
      console.log(`  📊 DERIVED PAGES: ${effectivePages} (from amount KSh ${clientAmount} at CPP ${estimatedCpp}${singleSpaced ? ' × 2 for single-spaced' : ''})`);
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

    // Calculate freelancer earnings using effective pages/slides
    const freelancerEarnings = calculateWriterEarningsByCPPLevel(
      effectivePages,
      effectiveSlides,
      order.workType,
      freelancerCompletedJobs,
      singleSpaced
    );

    // Keep existing manager earnings or default to 0
    const managerEarnings = Number(order.managerEarnings || 0);

    // Calculate admin profit as remainder
    const adminProfit = clientAmount - freelancerEarnings - managerEarnings;

    console.log(`  Calculated Freelancer Earnings: KSh ${freelancerEarnings}`);
    console.log(`  Manager Earnings: KSh ${managerEarnings}`);
    console.log(`  Admin Profit: KSh ${adminProfit}`);

    // Validate calculations
    const total = freelancerEarnings + managerEarnings + adminProfit;
    if (Math.abs(total - clientAmount) > 0.01) {
      console.log(`  ❌ ERROR: Calculations don't balance! Total: ${total}, Client: ${clientAmount}`);
      errorCount++;
      continue;
    }

    // Build update object
    const updateData: Record<string, any> = {
      freelancerEarnings: String(freelancerEarnings),
      adminProfit: String(adminProfit),
      managerEarnings: String(managerEarnings),
    };

    // Also update pages/slides if they were derived
    if (pages === 0 && effectivePages > 0) {
      updateData.pages = effectivePages;
      console.log(`  📝 Also updating pages to: ${effectivePages}`);
    }
    if (slides === 0 && effectiveSlides > 0) {
      updateData.slides = effectiveSlides;
      console.log(`  📝 Also updating slides to: ${effectiveSlides}`);
    }

    // Update the order
    try {
      await db
        .update(jobs)
        .set(updateData)
        .where(eq(jobs.id, order.id));

      console.log(`  ✅ Fixed! Updated earnings for order ${order.displayId}`);
      fixedCount++;
    } catch (err) {
      console.log(`  ❌ Failed to update order: ${err}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Total imbalanced orders: ${imbalancedOrders.length}`);
  console.log(`  Fixed: ${fixedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('═'.repeat(60));

  process.exit(errorCount > 0 ? 1 : 0);
}

fixPaymentImbalances().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
