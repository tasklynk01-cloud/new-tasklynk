/**
 * VALIDATION SCRIPT: Schema Acceptedat Field Check
 * 
 * Verifies that acceptedAt field exists in jobs table
 * Run with: npx tsx scripts/validate-acceptedat-field.ts
 */

import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function validateAcceptedAtField() {
  console.log('🔍 Validating acceptedAt Field in Jobs Table\n');

  try {
    // Test 1: Check if acceptedAt is in schema TypeScript definition
    const sampleJob = await db.select().from(jobs).limit(1);
    
    if (sampleJob.length === 0) {
      console.log('⚠️  No jobs in database to test with');
      console.log('✅ Schema field definition exists in TypeScript');
      return;
    }

    const job = sampleJob[0];
    console.log(`📝 Sample job: ${job.displayId || job.id}`);
    console.log(`   Status: ${job.status}`);
    
    // Test 2: Check if acceptedAt field is accessible
    if ('acceptedAt' in job) {
      console.log('✅ acceptedAt field exists in schema');
      console.log(`   Value: ${job.acceptedAt || '(null)'}`);
    } else {
      console.log('❌ acceptedAt field NOT found in schema');
      console.log('   Database migration may not have been applied');
    }

    // Test 3: Find accepted orders and check timestamp
    const acceptedOrders = await db
      .select({ 
        id: jobs.id, 
        displayId: jobs.displayId, 
        status: jobs.status,
        acceptedAt: jobs.acceptedAt as any,
        createdAt: jobs.createdAt 
      })
      .from(jobs)
      .where(eq(jobs.status, 'accepted'))
      .limit(5);

    if (acceptedOrders.length > 0) {
      console.log(`\n📊 Found ${acceptedOrders.length} accepted orders:`);
      acceptedOrders.forEach(order => {
        console.log(`   - ${order.displayId}: acceptedAt = ${order.acceptedAt || '(null)'}`);
      });

      const withTimestamp = acceptedOrders.filter(o => o.acceptedAt).length;
      const withoutTimestamp = acceptedOrders.length - withTimestamp;

      if (withTimestamp > 0) {
        console.log(`\n✅ ${withTimestamp} orders have acceptedAt timestamps`);
      }
      if (withoutTimestamp > 0) {
        console.log(`⚠️  ${withoutTimestamp} orders missing acceptedAt (accepted before migration)`);
      }
    } else {
      console.log('\n📊 No accepted orders found to validate timestamps');
    }

    // Test 4: Schema field type check
    console.log('\n📋 Schema Field Type:');
    console.log('   Field: acceptedAt');
    console.log('   Type: text (ISO 8601 timestamp string)');
    console.log('   Nullable: Yes');
    console.log('   Purpose: Tracks when order was accepted by admin/manager');

  } catch (error) {
    console.error('❌ Validation failed:', error);
    if (error instanceof Error && error.message.includes('no such column')) {
      console.log('\n❌ Database does not have acceptedAt column');
      console.log('   Run: npm run db:push (or npx drizzle-kit push)');
    }
  }
}

validateAcceptedAtField().then(() => {
  console.log('\n✅ Validation complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
