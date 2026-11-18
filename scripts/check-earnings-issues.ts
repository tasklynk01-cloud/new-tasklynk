import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { db } from '../src/db';
import { jobs, users, managerEarnings, managers } from '../src/db/schema';
import { eq, and, or, sql, desc, inArray } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel, managerAssignFee, managerSubmitFee } from '../src/lib/payment-calculations';

async function main() {
  console.log('='.repeat(80));
  console.log('EARNINGS ISSUE DIAGNOSTIC REPORT');
  console.log('='.repeat(80));

  // 1. Check orders with 0 or null freelancerEarnings
  console.log('\n📊 PART 1: Orders with freelancerEarnings = 0 or NULL');
  console.log('-'.repeat(60));
  
  const zeroEarningsOrders = await db
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
      workType: jobs.workType,
    })
    .from(jobs)
    .where(
      or(
        eq(jobs.freelancerEarnings, 0),
        sql`${jobs.freelancerEarnings} IS NULL`
      )
    )
    .orderBy(desc(jobs.id));

  console.log(`Found ${zeroEarningsOrders.length} orders with freelancerEarnings = 0 or NULL:\n`);
  
  for (const order of zeroEarningsOrders) {
    // Calculate what earnings SHOULD be
    const completedOrders = order.assignedFreelancerId 
      ? (await db
          .select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(and(
            eq(jobs.assignedFreelancerId, order.assignedFreelancerId),
            eq(jobs.status, 'completed')
          )))[0]?.count || 0
      : 0;
    
    const expectedEarnings = calculateWriterEarningsByCPPLevel(
      order.pages,
      order.slides,
      order.workType,
      completedOrders
    );
    
    console.log(`Order ${order.displayId} (ID: ${order.id}):`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Pages: ${order.pages}, Slides: ${order.slides}`);
    console.log(`  Amount (client): KSh ${order.amount}`);
    console.log(`  Current freelancerEarnings: KSh ${order.freelancerEarnings}`);
    console.log(`  EXPECTED earnings: KSh ${expectedEarnings}`);
    console.log(`  Assigned Freelancer ID: ${order.assignedFreelancerId || 'NONE'}`);
    console.log(`  Work Type: ${order.workType}`);
    console.log('');
  }

  // 2. Check manager earnings table and calculations
  console.log('\n📊 PART 2: Manager Earnings Analysis');
  console.log('-'.repeat(60));

  // Get all manager users
  const managerUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.roleId, 3)); // roleId 3 = manager

  console.log(`Found ${managerUsers.length} managers:\n`);

  for (const manager of managerUsers) {
    console.log(`\n🔹 Manager: ${manager.name} (ID: ${manager.id})`);
    
    // Get manager_earnings records for this manager
    const earningsRecords = await db
      .select()
      .from(managerEarnings)
      .where(eq(managerEarnings.managerId, manager.id));
    
    const assignmentEarnings = earningsRecords.filter(e => e.earningType === 'assignment' || e.earningType === 'assign');
    const deliveryEarnings = earningsRecords.filter(e => e.earningType === 'delivery' || e.earningType === 'submit');
    
    console.log(`  manager_earnings table records: ${earningsRecords.length}`);
    console.log(`    - Assignment fees: ${assignmentEarnings.length} records, total: KSh ${assignmentEarnings.reduce((s, e) => s + e.amount, 0)}`);
    console.log(`    - Delivery fees: ${deliveryEarnings.length} records, total: KSh ${deliveryEarnings.reduce((s, e) => s + e.amount, 0)}`);
    
    // Get orders where this manager is set
    const managerOrders = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        status: jobs.status,
        pages: jobs.pages,
        managerEarnings: jobs.managerEarnings,
        assignedById: jobs.assignedById,
        deliveredById: jobs.deliveredById,
      })
      .from(jobs)
      .where(eq(jobs.managerId, manager.id));
    
    console.log(`\n  Orders with this manager: ${managerOrders.length}`);
    
    let totalJobManagerEarnings = 0;
    let expectedTotalEarnings = 0;
    
    for (const order of managerOrders) {
      const currentEarnings = order.managerEarnings || 0;
      totalJobManagerEarnings += currentEarnings;
      
      // Calculate expected earnings based on assignment/delivery
      let expectedForOrder = 0;
      
      // Did this manager assign? (assignedById === manager.id)
      if (order.assignedById === manager.id) {
        expectedForOrder += managerAssignFee(); // 10 KSh
      }
      
      // Did this manager deliver? (deliveredById === manager.id and status is delivered/approved/completed/paid)
      const deliveredStatuses = ['delivered', 'approved', 'paid', 'completed'];
      if (order.deliveredById === manager.id && deliveredStatuses.includes(order.status)) {
        expectedForOrder += managerSubmitFee(order.pages); // 10 + 5*(pages-1)
      }
      
      expectedTotalEarnings += expectedForOrder;
      
      if (currentEarnings !== expectedForOrder && expectedForOrder > 0) {
        console.log(`\n    ⚠️ Order ${order.displayId}: stored managerEarnings = ${currentEarnings}, expected = ${expectedForOrder}`);
        console.log(`       Status: ${order.status}, Pages: ${order.pages}`);
        console.log(`       AssignedById: ${order.assignedById}, DeliveredById: ${order.deliveredById}`);
      }
    }
    
    console.log(`\n  SUMMARY for ${manager.name}:`);
    console.log(`    Total from jobs.managerEarnings: KSh ${totalJobManagerEarnings}`);
    console.log(`    Expected based on actions: KSh ${expectedTotalEarnings}`);
    console.log(`    Difference: KSh ${totalJobManagerEarnings - expectedTotalEarnings}`);
  }

  // 3. Check Manager 2 specifically (as mentioned by user)
  console.log('\n\n📊 PART 3: Detailed Analysis for "Manager 2"');
  console.log('-'.repeat(60));
  
  const manager2Candidates = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        eq(users.roleId, 3),
        sql`LOWER(${users.name}) LIKE '%manager%2%' OR LOWER(${users.name}) LIKE '%2%' OR ${users.name} LIKE '%Manager 2%'`
      )
    );
  
  // Also get all managers to find the 2nd one
  const allManagers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.roleId, 3))
    .orderBy(users.id);
  
  console.log('All managers found:', allManagers.map(m => `${m.name} (ID: ${m.id})`).join(', '));
  
  const manager2 = manager2Candidates[0] || allManagers[1]; // Either named "Manager 2" or the 2nd manager
  
  if (manager2) {
    console.log(`\nAnalyzing Manager: ${manager2.name} (ID: ${manager2.id})`);
    
    // Get ALL orders assigned by or delivered by this manager
    const manager2Orders = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        status: jobs.status,
        pages: jobs.pages,
        slides: jobs.slides,
        amount: jobs.amount,
        managerEarnings: jobs.managerEarnings,
        managerId: jobs.managerId,
        assignedById: jobs.assignedById,
        deliveredById: jobs.deliveredById,
        assignedFreelancerId: jobs.assignedFreelancerId,
      })
      .from(jobs)
      .where(
        or(
          eq(jobs.managerId, manager2.id),
          eq(jobs.assignedById, manager2.id),
          eq(jobs.deliveredById, manager2.id)
        )
      )
      .orderBy(jobs.id);
    
    console.log(`\nOrders involving this manager: ${manager2Orders.length}`);
    
    let totalExpected = 0;
    let totalStored = 0;
    
    for (const order of manager2Orders) {
      let expectedEarnings = 0;
      const reasons: string[] = [];
      
      // Assignment fee: manager who assigned (if they're a manager)
      if (order.assignedById === manager2.id) {
        expectedEarnings += managerAssignFee();
        reasons.push(`Assignment fee: KSh ${managerAssignFee()}`);
      }
      
      // Delivery fee: manager who delivered
      const deliveredStatuses = ['delivered', 'approved', 'paid', 'completed'];
      if (order.deliveredById === manager2.id && deliveredStatuses.includes(order.status)) {
        const deliveryFee = managerSubmitFee(order.pages);
        expectedEarnings += deliveryFee;
        reasons.push(`Delivery fee (${order.pages} pages): KSh ${deliveryFee}`);
      }
      
      totalExpected += expectedEarnings;
      totalStored += order.managerEarnings || 0;
      
      console.log(`\n  Order ${order.displayId} (ID: ${order.id}):`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Pages: ${order.pages}`);
      console.log(`    managerId: ${order.managerId}, assignedById: ${order.assignedById}, deliveredById: ${order.deliveredById}`);
      console.log(`    Stored managerEarnings: KSh ${order.managerEarnings}`);
      console.log(`    Expected for this manager: KSh ${expectedEarnings}`);
      if (reasons.length > 0) {
        console.log(`    Breakdown: ${reasons.join(' + ')}`);
      }
      if (expectedEarnings !== (order.managerEarnings || 0)) {
        console.log(`    ⚠️ MISMATCH!`);
      }
    }
    
    console.log(`\n  === FINAL TOTALS for ${manager2.name} ===`);
    console.log(`  Total stored in jobs.managerEarnings: KSh ${totalStored}`);
    console.log(`  Total expected (computed): KSh ${totalExpected}`);
    console.log(`  Difference: KSh ${totalStored - totalExpected}`);
  } else {
    console.log('No manager found matching "Manager 2"');
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error running diagnostic:', err);
  process.exit(1);
});
