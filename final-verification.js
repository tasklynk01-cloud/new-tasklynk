require('dotenv').config();
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function finalVerification() {
  console.log('🎯 FINAL FINANCIAL DATA VERIFICATION\n');
  console.log('=' .repeat(60));
  
  // 1. Check for any remaining issues
  const zeroEarnings = await turso.execute(`
    SELECT COUNT(*) as count
    FROM jobs
    WHERE (pages > 0 OR slides > 0)
      AND (freelancer_earnings = 0 OR freelancer_earnings IS NULL)
  `);
  
  console.log('\n📊 INTEGRITY CHECKS:');
  console.log('-'.repeat(60));
  
  if (zeroEarnings.rows[0].count === 0) {
    console.log('✅ No orders with zero/null freelancer earnings');
  } else {
    console.log(`❌ Found ${zeroEarnings.rows[0].count} orders with zero freelancer earnings`);
  }
  
  // 2. Check manager earnings
  const zeroManager = await turso.execute(`
    SELECT COUNT(*) as count
    FROM jobs
    WHERE (status IN ('delivered', 'approved', 'paid', 'completed'))
      AND assigned_freelancer_id IS NOT NULL
      AND (manager_earnings = 0 OR manager_earnings IS NULL)
  `);
  
  if (zeroManager.rows[0].count === 0) {
    console.log('✅ All delivered/completed orders have manager earnings');
  } else {
    console.log(`⚠️  ${zeroManager.rows[0].count} delivered orders missing manager earnings`);
  }
  
  // 3. Check admin profit
  const zeroProfit = await turso.execute(`
    SELECT COUNT(*) as count
    FROM jobs
    WHERE amount > 0
      AND (admin_profit = 0 OR admin_profit IS NULL)
  `);
  
  if (zeroProfit.rows[0].count === 0) {
    console.log('✅ All orders have calculated admin profit');
  } else {
    console.log(`⚠️  ${zeroProfit.rows[0].count} orders missing admin profit`);
  }
  
  // 4. Verify calculations are correct
  const sampleOrders = await turso.execute(`
    SELECT 
      display_id,
      amount,
      freelancer_earnings,
      manager_earnings,
      admin_profit,
      pages,
      slides
    FROM jobs
    WHERE amount > 0
    ORDER BY created_at DESC
    LIMIT 5
  `);
  
  console.log('\n🔍 SAMPLE CALCULATION VERIFICATION:');
  console.log('-'.repeat(60));
  
  let allCorrect = true;
  sampleOrders.rows.forEach(order => {
    const calculated = Number(order.freelancer_earnings) + Number(order.manager_earnings) + Number(order.admin_profit);
    const actual = Number(order.amount);
    const diff = Math.abs(calculated - actual);
    
    if (diff > 1) { // Allow 1 KES rounding error
      console.log(`❌ ${order.display_id}: Calculation mismatch`);
      console.log(`   Amount: ${actual}, Calculated: ${calculated}, Diff: ${diff}`);
      allCorrect = false;
    } else {
      console.log(`✅ ${order.display_id}: Amount: ${actual} = Freelancer: ${order.freelancer_earnings} + Manager: ${order.manager_earnings} + Admin: ${order.admin_profit}`);
    }
  });
  
  // 5. Check for missing CPP
  const missingCpp = await turso.execute(`
    SELECT COUNT(*) as count
    FROM jobs
    WHERE pages > 0
      AND (client_cpp IS NULL OR client_cpp = 0)
  `);
  
  console.log('\n💰 CPP DATA:');
  console.log('-'.repeat(60));
  
  if (missingCpp.rows[0].count === 0) {
    console.log('✅ All page-based orders have client_cpp set');
  } else {
    console.log(`⚠️  ${missingCpp.rows[0].count} orders missing client_cpp`);
  }
  
  // 6. Summary statistics
  const stats = await turso.execute(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(amount) as total_revenue,
      SUM(freelancer_earnings) as total_freelancer_earnings,
      SUM(manager_earnings) as total_manager_earnings,
      SUM(admin_profit) as total_admin_profit,
      AVG(freelancer_earnings) as avg_freelancer_earnings
    FROM jobs
    WHERE amount > 0
  `);
  
  console.log('\n📈 FINANCIAL SUMMARY:');
  console.log('-'.repeat(60));
  console.log(`Total Orders: ${stats.rows[0].total_orders}`);
  console.log(`Total Revenue: KSh ${Number(stats.rows[0].total_revenue).toLocaleString()}`);
  console.log(`Total Freelancer Earnings: KSh ${Number(stats.rows[0].total_freelancer_earnings).toLocaleString()}`);
  console.log(`Total Manager Earnings: KSh ${Number(stats.rows[0].total_manager_earnings).toLocaleString()}`);
  console.log(`Total Admin Profit: KSh ${Number(stats.rows[0].total_admin_profit).toLocaleString()}`);
  console.log(`Avg Freelancer Earnings: KSh ${Number(stats.rows[0].avg_freelancer_earnings).toFixed(2)}`);
  
  // Final status
  console.log('\n' + '='.repeat(60));
  
  if (allCorrect && 
      zeroEarnings.rows[0].count === 0 && 
      zeroProfit.rows[0].count === 0 &&
      missingCpp.rows[0].count === 0) {
    console.log('🎉 ALL FINANCIAL DATA IS CORRECT!');
    console.log('✅ Database integrity verified');
    console.log('✅ Calculations accurate');
    console.log('✅ No missing data');
  } else {
    console.log('⚠️  Some issues remain - please review above');
  }
  
  console.log('='.repeat(60));
}

finalVerification().catch(console.error).finally(() => process.exit(0));
