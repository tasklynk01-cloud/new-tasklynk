import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { jobs, users, freelancerOrderResponses } from './src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function fixAcceptedOrders() {
  try {
    console.log('🔧 Fixing accepted orders that are stuck in "assigned" status...\n');
    
    // Find all freelancers
    const freelancers = await db.select().from(users).where(eq(users.role, 'freelancer'));
    
    console.log(`Found ${freelancers.length} freelancers\n`);
    
    let totalFixed = 0;
    
    for (const freelancer of freelancers) {
      // Find assigned orders for this freelancer
      const assignedOrders = await db.select()
        .from(jobs)
        .where(
          and(
            eq(jobs.assignedFreelancerId, freelancer.id),
            eq(jobs.status, 'assigned')
          )
        );
      
      if (assignedOrders.length === 0) continue;
      
      // Check which orders have been accepted
      const responses = await db.select()
        .from(freelancerOrderResponses)
        .where(
          and(
            eq(freelancerOrderResponses.freelancerId, freelancer.id),
            inArray(freelancerOrderResponses.jobId, assignedOrders.map(j => j.id)),
            eq(freelancerOrderResponses.responseStatus, 'accepted')
          )
        );
      
      if (responses.length === 0) continue;
      
      console.log(`\n👤 ${freelancer.name} (ID: ${freelancer.id})`);
      console.log(`   Assigned orders: ${assignedOrders.length}, Accepted: ${responses.length}`);
      
      for (const response of responses) {
        const order = assignedOrders.find(j => j.id === response.jobId);
        if (!order) continue;
        
        console.log(`   🔄 Fixing Order ${order.displayId} (ID: ${order.id})`);
        console.log(`      Current status: ${order.status}`);
        console.log(`      Accepted at: ${response.responseAt}`);
        
        // Update order to in_progress
        const now = new Date().toISOString();
        await db.update(jobs)
          .set({
            status: 'in_progress',
            freelancerAccepted: true,
            freelancerAcceptedAt: response.responseAt,
            freelancerResponsePending: false,
            updatedAt: now,
          })
          .where(eq(jobs.id, order.id));
        
        console.log(`      ✅ Updated to: in_progress`);
        totalFixed++;
      }
    }
    
    console.log(`\n✅ Fixed ${totalFixed} orders\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
}

fixAcceptedOrders();
