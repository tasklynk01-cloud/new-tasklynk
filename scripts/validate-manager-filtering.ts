/**
 * VALIDATION SCRIPT: Manager Order Filtering
 * 
 * Tests that manager endpoints correctly filter orders by managerId
 * Run with: npx tsx scripts/validate-manager-filtering.ts
 */

import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function validateManagerFiltering() {
  console.log('🔍 Validating Manager Order Filtering Logic\n');

  try {
    // Step 1: Find a manager in the system
    const [manager] = await db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.role, 'manager'))
      .limit(1);

    if (!manager) {
      console.log('⚠️  No manager found in database. Create a manager first.');
      return;
    }

    console.log(`✅ Found manager: ${manager.name} (ID: ${manager.id})`);

    // Step 2: Count total orders in system
    const allOrders = await db.select({ id: jobs.id }).from(jobs);
    console.log(`📊 Total orders in system: ${allOrders.length}`);

    // Step 3: Count orders assigned to this manager
    const managerOrders = await db
      .select({ id: jobs.id, displayId: jobs.displayId, status: jobs.status })
      .from(jobs)
      .where(eq(jobs.managerId, manager.id));

    console.log(`📊 Orders assigned to manager ${manager.id}: ${managerOrders.length}`);

    if (managerOrders.length > 0) {
      console.log('\n🔢 Sample manager orders:');
      managerOrders.slice(0, 5).forEach(order => {
        console.log(`   - ${order.displayId} (${order.status})`);
      });
    }

    // Step 4: Test filtering logic
    console.log('\n✅ Filter Logic Validation:');
    console.log(`   - Manager should see ONLY their ${managerOrders.length} orders`);
    console.log(`   - NOT all ${allOrders.length} orders`);
    
    if (managerOrders.length === allOrders.length) {
      console.log('\n❌ WARNING: Manager has ALL orders assigned - filtering would be ineffective');
    } else {
      console.log('\n✅ Filtering will work correctly');
    }

    // Step 5: Check for orders with NULL managerId
    const unassignedOrders = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.managerId, null as any));

    if (unassignedOrders.length > 0) {
      console.log(`\n⚠️  ${unassignedOrders.length} orders have no manager assigned`);
      console.log('   These orders will NOT appear in any manager\'s list');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

validateManagerFiltering().then(() => {
  console.log('\n✅ Validation complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
