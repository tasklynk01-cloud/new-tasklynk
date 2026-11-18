import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { jobs, users } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function diagnoseGrasonOrders() {
  try {
    console.log('🔍 Finding Grayson Bay...\n');
    
    // Find Grayson Bay
    const grason = await db.select().from(users).where(eq(users.email, 'graysonbay11@gmail.com')).limit(1);
    
    if (grason.length === 0) {
      console.log('❌ Grayson Bay not found');
      return;
    }
    
    const grasonUser = grason[0];
    console.log(`✅ Found Grayson Bay: ID=${grasonUser.id}, Role=${grasonUser.role}`);
    
    // Find all orders assigned to Grayson Bay
    console.log('\n🔍 Finding orders assigned to Grayson Bay...\n');
    const grasonOrders = await db.select().from(jobs).where(eq(jobs.assignedFreelancerId, grasonUser.id));
    
    console.log(`📊 Total orders assigned to Grayson Bay: ${grasonOrders.length}\n`);
    
    if (grasonOrders.length === 0) {
      console.log('❌ No orders found for Grayson Bay');
      return;
    }
    
    // Analyze each order
    console.log('📋 Order Details:\n');
    console.log('═'.repeat(100));
    
    for (const order of grasonOrders) {
      console.log(`\nOrder ID: ${order.id}`);
      console.log(`Display ID: ${order.displayId || order.orderId}`);
      console.log(`Status: ${order.status}`);
      console.log(`Freelancer Accepted: ${order.freelancerAccepted}`);
      console.log(`Freelancer Accepted At: ${order.freelancerAcceptedAt || 'Not set'}`);
      console.log(`Freelancer Response Pending: ${order.freelancerResponsePending}`);
      console.log(`Assigned At: ${order.assignedAt || 'Not set'}`);
      console.log('─'.repeat(100));
    }
    
    // Summary by status
    console.log('\n📊 Summary by Status:\n');
    const statusCounts = {};
    grasonOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} order(s)`);
    });
    
    // Check for problematic orders (accepted but still in "assigned" status)
    const problematicOrders = grasonOrders.filter(
      order => order.freelancerAccepted && order.status === 'assigned'
    );
    
    if (problematicOrders.length > 0) {
      console.log(`\n⚠️  Found ${problematicOrders.length} orders that are accepted but still in "assigned" status:`);
      problematicOrders.forEach(order => {
        console.log(`  - Order ${order.displayId || order.orderId} (ID: ${order.id})`);
      });
      console.log('\n💡 These orders should be moved to "in_progress" status');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.close();
  }
}

diagnoseGrasonOrders();
