import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { jobs, freelancerOrderResponses } from './src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function fixOrderStatusConsistency() {
  console.log('🔍 Starting Order Status Consistency Check...\n');
  console.log('═'.repeat(80));
  
  let ordersToFix = [];
  let acceptedButWrongStatus = [];
  let pendingWithoutFreelancer = [];
  
  try {
    // 1. Find all orders with status 'assigned'
    console.log('\n📊 ISSUE 1: Orders stuck in "assigned" status but have been accepted\n');
    const assignedOrders = await db.select()
      .from(jobs)
      .where(eq(jobs.status, 'assigned'));
    
    console.log(`Found ${assignedOrders.length} orders with status "assigned"\n`);
    
    if (assignedOrders.length > 0) {
      // Check which have accepted responses
      const jobIds = assignedOrders.map(j => j.id);
      const responses = await db.select()
        .from(freelancerOrderResponses)
        .where(
          and(
            inArray(freelancerOrderResponses.jobId, jobIds),
            eq(freelancerOrderResponses.responseStatus, 'accepted')
          )
        );
      
      const acceptedJobIds = new Set(responses.map(r => r.jobId));
      ordersToFix = assignedOrders.filter(j => acceptedJobIds.has(j.id));
      
      if (ordersToFix.length > 0) {
        console.log(`⚠️  Found ${ordersToFix.length} orders that are accepted but stuck in "assigned" status:\n`);
        ordersToFix.forEach(order => {
          console.log(`  - Order ${order.displayId || order.orderId} (ID: ${order.id})`);
          console.log(`    Freelancer ID: ${order.assignedFreelancerId}`);
          console.log(`    freelancerAccepted: ${order.freelancerAccepted}`);
        });
        
        console.log('\n💾 Fixing these orders...\n');
        
        for (const order of ordersToFix) {
          const response = responses.find(r => r.jobId === order.id);
          await db.update(jobs)
            .set({
              status: 'in_progress',
              freelancerAccepted: true,
              freelancerAcceptedAt: response?.responseAt || new Date().toISOString(),
              freelancerResponsePending: false,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(jobs.id, order.id));
          
          console.log(`  ✅ Fixed Order ${order.displayId || order.orderId} - moved to "in_progress"`);
        }
      } else {
        console.log('✅ All "assigned" orders are correctly waiting for freelancer response\n');
      }
    }
    
    // 2. Find orders marked as accepted but status is not in_progress
    console.log('\n📊 ISSUE 2: Orders with freelancerAccepted=true but status != "in_progress"\n');
    const allOrders = await db.select().from(jobs);
    acceptedButWrongStatus = allOrders.filter(j => 
      j.freelancerAccepted === true && 
      j.status !== 'in_progress' &&
      j.status !== 'editing' &&
      j.status !== 'delivered' &&
      j.status !== 'approved' &&
      j.status !== 'paid' &&
      j.status !== 'completed'
    );
    
    if (acceptedButWrongStatus.length > 0) {
      console.log(`⚠️  Found ${acceptedButWrongStatus.length} orders with acceptance mismatch:\n`);
      acceptedButWrongStatus.forEach(order => {
        console.log(`  - Order ${order.displayId || order.orderId} (ID: ${order.id})`);
        console.log(`    Status: ${order.status}, freelancerAccepted: ${order.freelancerAccepted}`);
        console.log(`    Accepted At: ${order.freelancerAcceptedAt || 'Not set'}`);
      });
      
      console.log('\n💾 Fixing these orders...\n');
      
      for (const order of acceptedButWrongStatus) {
        await db.update(jobs)
          .set({
            status: 'in_progress',
            freelancerResponsePending: false,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(jobs.id, order.id));
        
        console.log(`  ✅ Fixed Order ${order.displayId || order.orderId} - moved to "in_progress"`);
      }
    } else {
      console.log('✅ No acceptance status mismatches found\n');
    }
    
    // 3. Find orders with freelancerResponsePending=true but no freelancer assigned
    console.log('\n📊 ISSUE 3: Orders with freelancerResponsePending=true but no freelancer\n');
    pendingWithoutFreelancer = allOrders.filter(j => 
      j.freelancerResponsePending === true && 
      !j.assignedFreelancerId
    );
    
    if (pendingWithoutFreelancer.length > 0) {
      console.log(`⚠️  Found ${pendingWithoutFreelancer.length} orders with orphaned pending flag:\n`);
      pendingWithoutFreelancer.forEach(order => {
        console.log(`  - Order ${order.displayId || order.orderId} (ID: ${order.id})`);
        console.log(`    Status: ${order.status}`);
      });
      
      console.log('\n💾 Fixing these orders...\n');
      
      for (const order of pendingWithoutFreelancer) {
        await db.update(jobs)
          .set({
            freelancerResponsePending: false,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(jobs.id, order.id));
        
        console.log(`  ✅ Fixed Order ${order.displayId || order.orderId} - cleared pending flag`);
      }
    } else {
      console.log('✅ No orphaned pending flags found\n');
    }
    
    // 4. Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ ORDER STATUS CONSISTENCY CHECK COMPLETE\n');
    console.log('Summary:');
    console.log(`  - Fixed orders stuck in assigned: ${ordersToFix.length}`);
    console.log(`  - Fixed acceptance mismatches: ${acceptedButWrongStatus.length}`);
    console.log(`  - Fixed orphaned pending flags: ${pendingWithoutFreelancer.length}`);
    console.log(`  - Total fixes applied: ${ordersToFix.length + acceptedButWrongStatus.length + pendingWithoutFreelancer.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.close();
  }
}

fixOrderStatusConsistency();
