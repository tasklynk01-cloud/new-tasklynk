/**
 * Sync User Status Database Fix Script
 * 
 * This script calls the API endpoint to fix all inconsistent user statuses
 * where approved=false but status='active'
 * 
 * SOLUTION:
 * 1. First do a dry-run (GET) to see what will be fixed
 * 2. Then execute the fix (POST) to update the database
 * 
 * SAFE TO RUN: Only fixes users with approved=false, preserves special statuses
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.tasklynk.co.ke';

async function syncDatabaseStatuses() {
  console.log('🔍 Database Status Sync Tool\n');
  console.log('This tool will fix inconsistent user statuses in the database.');
  console.log('Users with approved=false will have their status set to "pending"\n');

  try {
    // Step 1: Preview what will be fixed (GET request)
    console.log('📊 Step 1: Checking for inconsistent statuses...\n');
    
    const previewResponse = await fetch(`${API_URL}/api/admin/sync-user-statuses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!previewResponse.ok) {
      throw new Error(`Preview failed: ${previewResponse.status} ${previewResponse.statusText}`);
    }

    const previewData = await previewResponse.json();
    
    console.log('📈 Preview Results:');
    console.log('─'.repeat(50));
    console.log(`Total Users: ${previewData.stats.totalUsers}`);
    console.log(`Consistent: ${previewData.stats.consistent}`);
    console.log(`Need Sync: ${previewData.stats.needsSync}`);
    console.log(`Special Status: ${previewData.stats.specialStatus}`);
    console.log('─'.repeat(50));

    if (previewData.stats.needsSync === 0) {
      console.log('\n✅ All user statuses are already consistent!');
      console.log('No fixes needed.');
      return;
    }

    console.log('\n⚠️  Users that need fixing:');
    previewData.needsSync.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Display ID: ${user.displayId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Current: approved=${user.approved}, status="${user.status}"`);
      console.log(`   Will change to: status="pending"`);
    });

    // Step 2: Execute the fix (POST request)
    console.log('\n\n🔧 Step 2: Applying fixes to database...\n');
    
    const fixResponse = await fetch(`${API_URL}/api/admin/sync-user-statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!fixResponse.ok) {
      throw new Error(`Fix failed: ${fixResponse.status} ${fixResponse.statusText}`);
    }

    const fixData = await fixResponse.json();
    
    console.log('✅ Database Sync Complete!');
    console.log('─'.repeat(50));
    console.log(`Users Updated: ${fixData.updated}`);
    console.log(`Errors: ${fixData.errors.length}`);
    console.log('─'.repeat(50));

    if (fixData.errors.length > 0) {
      console.log('\n⚠️  Errors occurred:');
      fixData.errors.forEach((error, index) => {
        console.log(`${index + 1}. User ${error.userId}: ${error.error}`);
      });
    }

    console.log('\n📊 After-Fix Status:');
    fixData.details.forEach(detail => {
      console.log(`\n✓ ${detail.name} (${detail.email})`);
      console.log(`  Status changed: "${detail.oldStatus}" → "${detail.newStatus}"`);
    });

    console.log('\n\n✅ All Done!');
    console.log('Users with approved=false now have status="pending"');
    console.log('The database is now consistent with the UI display logic.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
syncDatabaseStatuses();
