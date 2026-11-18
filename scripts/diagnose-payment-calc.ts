/**
 * Diagnostic script to check payment calculations
 * Run with: npx tsx scripts/diagnose-payment-calc.ts
 */

import { db } from '../src/db';
import { jobs, users, payments } from '../src/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel, clientMinCPP, clientMinCPS } from '../src/lib/payment-calculations';
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

async function diagnosePaymentCalculations() {
  console.log('\n=== PAYMENT CALCULATIONS DIAGNOSTIC ===\n');

  // Get orders with large amounts to analyze
  const orders = await db
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
      clientCpp: jobs.clientCpp,
      effectiveCpp: jobs.effectiveCpp,
      baseCpp: jobs.baseCpp,
      assignedFreelancerId: jobs.assignedFreelancerId,
    })
    .from(jobs)
    .orderBy(desc(jobs.amount))
    .limit(10);

  console.log(`Found ${orders.length} orders to analyze\n`);

  for (const order of orders) {
    console.log('─'.repeat(60));
    console.log(`Order: ${order.displayId} (ID: ${order.id})`);
    console.log(`Status: ${order.status}`);
    console.log(`Title: ${order.title}`);
    console.log(`Work Type: ${order.workType}`);
    
    // Get stored values
    const storedClientAmount = Number(order.amount || 0);
    const storedFreelancerEarnings = Number(order.freelancerEarnings || 0);
    const storedManagerEarnings = Number(order.managerEarnings || 0);
    const storedAdminProfit = Number(order.adminProfit || 0);
    
    console.log('\n📊 STORED VALUES:');
    console.log(`  Client Amount: KSh ${storedClientAmount.toFixed(2)}`);
    console.log(`  Pages: ${order.pages || 0}`);
    console.log(`  Slides: ${order.slides || 0}`);
    console.log(`  Single Spaced: ${order.singleSpaced ? 'Yes' : 'No'}`);
    console.log(`  Client CPP: ${order.clientCpp || 'not set'}`);
    console.log(`  Effective CPP: ${order.effectiveCpp || 'not set'}`);
    console.log(`  Base CPP: ${order.baseCpp || 'not set'}`);
    console.log(`  Stored Freelancer Earnings: KSh ${storedFreelancerEarnings.toFixed(2)}`);
    console.log(`  Stored Manager Earnings: KSh ${storedManagerEarnings.toFixed(2)}`);
    console.log(`  Stored Admin Profit: KSh ${storedAdminProfit.toFixed(2)}`);
    
    // Get freelancer's completed jobs if assigned
    let freelancerCompletedJobs = 0;
    if (order.assignedFreelancerId) {
      const [freelancer] = await db
        .select({ completedJobs: users.completedJobs })
        .from(users)
        .where(eq(users.id, order.assignedFreelancerId));
      freelancerCompletedJobs = freelancer?.completedJobs || 0;
      console.log(`\n👤 FREELANCER (ID: ${order.assignedFreelancerId}):`);
      console.log(`  Completed Jobs: ${freelancerCompletedJobs}`);
      
      const isTechnical = order.workType?.toLowerCase().includes('excel') || 
                         order.workType?.toLowerCase().includes('spss') ||
                         order.workType?.toLowerCase().includes('powerpoint');
      const cppLevel = getCPPLevelByOrderCount(freelancerCompletedJobs);
      const currentCpp = getCurrentCPP(freelancerCompletedJobs, isTechnical);
      console.log(`  CPP Level: ${cppLevel.levelName}`);
      console.log(`  Current CPP Rate: KSh ${currentCpp}/page`);
    }
    
    // Calculate what it SHOULD be
    console.log('\n🧮 RECALCULATED VALUES:');
    
    const pages = order.pages || 0;
    const slides = order.slides || 0;
    const singleSpaced = Boolean(order.singleSpaced);
    const effectivePages = pages * (singleSpaced ? 2 : 1);
    
    console.log(`  Effective Pages: ${effectivePages} (${pages} × ${singleSpaced ? 2 : 1})`);
    
    // Calculate freelancer earnings using the function
    const calculatedFreelancerEarnings = calculateWriterEarningsByCPPLevel(
      pages,
      slides,
      order.workType,
      freelancerCompletedJobs,
      singleSpaced
    );
    
    console.log(`  Calculated Freelancer Earnings: KSh ${calculatedFreelancerEarnings.toFixed(2)}`);
    
    // Calculate what admin profit should be
    const calculatedAdminProfit = storedClientAmount - calculatedFreelancerEarnings - storedManagerEarnings;
    console.log(`  Calculated Admin Profit: KSh ${calculatedAdminProfit.toFixed(2)}`);
    
    // Check for discrepancies
    const freelancerDiff = Math.abs(storedFreelancerEarnings - calculatedFreelancerEarnings);
    const profitDiff = Math.abs(storedAdminProfit - calculatedAdminProfit);
    
    if (freelancerDiff > 1) {
      console.log(`\n⚠️ DISCREPANCY FOUND:`);
      console.log(`   Freelancer Earnings Off By: KSh ${freelancerDiff.toFixed(2)}`);
    }
    
    if (profitDiff > 1) {
      console.log(`   Admin Profit Off By: KSh ${profitDiff.toFixed(2)}`);
    }
    
    // Verify totals add up
    const totalOut = storedFreelancerEarnings + storedManagerEarnings + storedAdminProfit;
    const balanceCheck = Math.abs(storedClientAmount - totalOut);
    
    console.log('\n✅ BALANCE CHECK:');
    console.log(`  Client Amount: KSh ${storedClientAmount.toFixed(2)}`);
    console.log(`  Total Out (Freelancer + Manager + Admin): KSh ${totalOut.toFixed(2)}`);
    console.log(`  Difference: KSh ${balanceCheck.toFixed(2)}`);
    
    if (balanceCheck > 1) {
      console.log(`  ❌ IMBALANCE! Client paid ${storedClientAmount} but only ${totalOut} allocated`);
    } else {
      console.log(`  ✓ Balanced`);
    }
    
    console.log('');
  }

  // Summary
  console.log('\n=== CPP RATE TABLE ===');
  console.log('Level Name     | Orders Needed | Regular CPP | Technical CPP');
  console.log('─'.repeat(60));
  const levels = [
    { name: 'Starter', orders: 0 },
    { name: 'Rising', orders: 3 },
    { name: 'Established', orders: 5 },
    { name: 'Expert', orders: 15 },
    { name: 'Master', orders: 27 },
  ];
  for (const level of levels) {
    const regular = getCurrentCPP(level.orders, false);
    const technical = getCurrentCPP(level.orders, true);
    console.log(`${level.name.padEnd(14)} | ${String(level.orders).padStart(13)} | KSh ${String(regular).padStart(3)}/page | KSh ${String(technical).padStart(3)}/page`);
  }
  
  console.log('\n=== CLIENT MINIMUM RATES ===');
  console.log(`Regular Work: KSh ${clientMinCPP()}/page`);
  console.log(`Technical Work: KSh ${clientMinCPP('excel')}/page`);
  console.log(`Slides: KSh ${clientMinCPS()}/slide`);

  process.exit(0);
}

diagnosePaymentCalculations().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
