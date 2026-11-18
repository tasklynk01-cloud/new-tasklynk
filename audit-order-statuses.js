import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { jobs, freelancerOrderResponses } from './src/db/schema';
import { eq, and, or, isNull, isNotNull } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function auditOrderStatuses() {
  try {
    console.log('🔍 AUDITING ORDER STATUSES AND ASSIGNMENTS\n');
    console.log('=' .repeat(80));
    
    // 1. Find orders with assignedFreelancerId but status not in assigned/in_progress
    console.log('\n1️⃣ Orders with freelancer assigned but wrong status:');
    const orphanedAssignments = await db.select()
      .from(jobs)
      .where(
        and(
          isNotNull(jobs.assignedFreelancerId),
          or(
            eq(jobs.status, 'pending'),
            eq(jobs.status, 'accepted'),
            eq(jobs.status, 'delivered'),
            eq(jobs.status, 'completed')
          )
        )
      );
    
    if (orphanedAssignments.length > 0) {
      console.log(`   ⚠️  Found ${orphanedAssignments.length} orders:`);
      orphanedAssignments.forEach(order => {
        console.log(`   - Order ${order.displayId}: Status=${order.status}, FreelancerID=${order.assignedFreelancerId}`);
      });
    } else {
      console.log('   ✅ None found');
    }
    
    // 2. Find orders in assigned/in_progress status but no freelancer assigned
    console.log('\n2️⃣ Orders in assigned/in_progress status without freelancer:');
    const statusWithoutFreelancer = await db.select()
      .from(jobs)
      .where(
        and(
          isNull(jobs.assignedFreelancerId),
          or(
            eq(jobs.status, 'assigned'),
            eq(jobs.status, 'in_progress')
          )
        )
      );
    
    if (statusWithoutFreelancer.length > 0) {
      console.log(`   ⚠️  Found ${statusWithoutFreelancer.length} orders:`);
      statusWithoutFreelancer.forEach(order => {
        console.log(`   - Order ${order.displayId}: Status=${order.status}, FreelancerID=null`);
      });
    } else {
      console.log('   ✅ None found');
    }
    
    // 3. Find accepted responses where order is still in 'assigned' status
    console.log('\n3️⃣ Accepted responses but order still in "assigned" status:');
    const acceptedResponses = await db.select()
      .from(freelancerOrderResponses)
      .where(eq(freelancerOrderResponses.responseStatus, 'accepted'));
    
    let mismatchCount = 0;
    for (const response of acceptedResponses) {
      const [order] = await db.select()
        .from(jobs)
        .where(eq(jobs.id, response.jobId))
        .limit(1);
      
      if (order && order.status === 'assigned') {
        mismatchCount++;
        console.log(`   ⚠️  Order ${order.displayId}: Accepted at ${response.responseAt} but status is still "assigned"`);
      }
    }
    
    if (mismatchCount === 0) {
      console.log('   ✅ None found (all accepted orders are in correct status)');
    }
    
    // 4. Find orders with freelancerAccepted=true but status not in_progress
    console.log('\n4️⃣ Orders with freelancerAccepted=true but status not "in_progress":');
    const acceptedButWrongStatus = await db.select()
      .from(jobs)
      .where(
        and(
          eq(jobs.freelancerAccepted, true),
          or(
            eq(jobs.status, 'assigned'),
            eq(jobs.status, 'accepted'),
            eq(jobs.status, 'pending')
          )
        )
      );
    
    if (acceptedButWrongStatus.length > 0) {
      console.log(`   ⚠️  Found ${acceptedButWrongStatus.length} orders:`);
      acceptedButWrongStatus.forEach(order => {
        console.log(`   - Order ${order.displayId}: Status=${order.status}, FreelancerAccepted=true`);
      });
    } else {
      console.log('   ✅ None found');
    }
    
    // 5. Find orders with freelancerResponsePending=true but response already recorded
    console.log('\n5️⃣ Orders with freelancerResponsePending=true but response recorded:');
    const pendingWithResponse = await db.select()
      .from(jobs)
      .where(eq(jobs.freelancerResponsePending, true));
    
    let pendingMismatchCount = 0;
    for (const order of pendingWithResponse) {
      const [response] = await db.select()
        .from(freelancerOrderResponses)
        .where(eq(freelancerOrderResponses.jobId, order.id))
        .limit(1);
      
      if (response) {
        pendingMismatchCount++;
        console.log(`   ⚠️  Order ${order.displayId}: Has response but freelancerResponsePending=true`);
      }
    }
    
    if (pendingMismatchCount === 0) {
      console.log('   ✅ None found');
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 AUDIT SUMMARY:');
    console.log(`   - Orphaned assignments: ${orphanedAssignments.length}`);
    console.log(`   - Status without freelancer: ${statusWithoutFreelancer.length}`);
    console.log(`   - Accepted but still assigned: ${mismatchCount}`);
    console.log(`   - Accepted flag but wrong status: ${acceptedButWrongStatus.length}`);
    console.log(`   - Response pending flag mismatch: ${pendingMismatchCount}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
}

auditOrderStatuses();
