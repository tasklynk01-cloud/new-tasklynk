/**
 * FIX FINANCIAL DATA SCRIPT
 * 
 * This script recalculates all missing/incorrect financial data in the database:
 * - Recalculates freelancer_earnings for orders with 0 earnings
 * - Recalculates manager_earnings based on assignment and delivery
 * - Recalculates admin_profit as (amount - freelancer - manager)
 * - Fixes orders with null pages/slides
 * - Sets default client_cpp where missing
 */

require('dotenv').config();
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// CPP Level System (from payment-calculations.ts)
const CPP_LEVELS = {
  starter: { min: 0, max: 2, cpp: 150, technicalCpp: 170 },
  rising: { min: 3, max: 4, cpp: 160, technicalCpp: 180 },
  established: { min: 5, max: 14, cpp: 170, technicalCpp: 190 },
  expert: { min: 15, max: 26, cpp: 180, technicalCpp: 200 },
  master: { min: 27, max: Infinity, cpp: 200, technicalCpp: 220 },
};

const TECHNICAL_KEYWORDS = [
  'excel', 'spss', 'stata', 'r ', ' r', 'python', 'data analysis',
  'programming', 'powerpoint', 'presentation', 'technical', 'coding',
  'jasp', 'jamovi'
];

function isTechnicalWorkType(workType) {
  if (!workType) return false;
  const t = workType.toLowerCase();
  return TECHNICAL_KEYWORDS.some((k) => t.includes(k));
}

function getCPPRate(completedJobs, isTechnical) {
  for (const level of Object.values(CPP_LEVELS)) {
    if (completedJobs >= level.min && completedJobs <= level.max) {
      return isTechnical ? level.technicalCpp : level.cpp;
    }
  }
  return isTechnical ? 170 : 150; // Default to starter
}

function calculateFreelancerEarnings(pages, slides, workType, completedJobs) {
  const p = Math.max(0, Number(pages || 0));
  const s = Math.max(0, Number(slides || 0));
  const isTechnical = isTechnicalWorkType(workType);
  const cppRate = getCPPRate(completedJobs, isTechnical);
  const writerPerSlide = 100;
  const amount = p * cppRate + s * writerPerSlide;
  return Math.round(amount * 100) / 100;
}

function calculateManagerEarnings(assignedFreelancerId, status, pages) {
  let total = 0;
  // Assignment fee (10 KSh) if freelancer is assigned
  if (assignedFreelancerId) {
    total += 10;
  }
  // Delivery fee if order was delivered/completed (10 + 5*(pages-1))
  const deliveredStatuses = ['delivered', 'approved', 'paid', 'completed'];
  if (deliveredStatuses.includes(status) && pages > 0) {
    total += 10 + 5 * Math.max(pages - 1, 0);
  }
  return Math.round(total * 100) / 100;
}

async function fixFinancialData() {
  console.log('🔧 FIXING FINANCIAL DATA IN DATABASE\n');
  
  // Get all orders that need fixing
  const ordersToFix = await turso.execute(`
    SELECT 
      j.id,
      j.display_id,
      j.order_number,
      j.amount,
      j.freelancer_earnings,
      j.manager_earnings,
      j.admin_profit,
      j.client_cpp,
      j.pages,
      j.slides,
      j.work_type,
      j.status,
      j.assigned_freelancer_id,
      j.single_spaced,
      COALESCE(u.completed_jobs, 0) as freelancer_completed_jobs
    FROM jobs j
    LEFT JOIN users u ON u.id = j.assigned_freelancer_id
    WHERE (j.freelancer_earnings = 0 OR j.freelancer_earnings IS NULL)
       OR (j.admin_profit = 0 OR j.admin_profit IS NULL)
       OR (j.manager_earnings IS NULL)
       OR (j.pages IS NULL AND j.slides IS NULL AND j.amount > 0)
    ORDER BY j.created_at DESC
  `);

  console.log(`Found ${ordersToFix.rows.length} orders to fix\n`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const order of ordersToFix.rows) {
    try {
      let pages = Number(order.pages || 0);
      let slides = Number(order.slides || 0);
      let amount = Number(order.amount || 0);
      let clientCpp = Number(order.client_cpp || 0);

      // Skip if both pages and slides are 0 AND amount is 0
      if (pages === 0 && slides === 0 && amount === 0) {
        console.log(`⏭️  Skipping order ${order.display_id || order.id} - no units or amount`);
        skipped++;
        continue;
      }

      // If pages/slides are null but amount exists, try to derive pages from amount
      if (pages === 0 && slides === 0 && amount > 0) {
        // Default client CPP = 240 for regular, 270 for technical
        const defaultCpp = isTechnicalWorkType(order.work_type) ? 270 : 240;
        const derivedCpp = clientCpp > 0 ? clientCpp : defaultCpp;
        
        // Try to derive pages from amount
        pages = Math.max(1, Math.round(amount / derivedCpp));
        
        console.log(`  Derived ${pages} pages from amount ${amount} using CPP ${derivedCpp}`);
        
        // Update pages in database
        await turso.execute({
          sql: `UPDATE jobs SET pages = ? WHERE id = ?`,
          args: [pages, order.id]
        });
      }

      // Set default client_cpp if missing
      if (clientCpp === 0 && pages > 0) {
        clientCpp = isTechnicalWorkType(order.work_type) ? 270 : 240;
        await turso.execute({
          sql: `UPDATE jobs SET client_cpp = ? WHERE id = ?`,
          args: [clientCpp, order.id]
        });
      }

      // Calculate effective pages (double if single spaced)
      const pageMultiplier = order.single_spaced ? 2 : 1;
      const effectivePages = pages * pageMultiplier;

      // Recalculate freelancer earnings
      const freelancerCompletedJobs = Number(order.freelancer_completed_jobs || 0);
      const freelancerEarnings = calculateFreelancerEarnings(
        effectivePages,
        slides,
        order.work_type,
        freelancerCompletedJobs
      );

      // Recalculate manager earnings
      const managerEarnings = calculateManagerEarnings(
        order.assigned_freelancer_id,
        order.status,
        pages
      );

      // Recalculate admin profit
      const adminProfit = Math.max(0, amount - freelancerEarnings - managerEarnings);

      // Update database
      await turso.execute({
        sql: `
          UPDATE jobs 
          SET 
            freelancer_earnings = ?,
            manager_earnings = ?,
            admin_profit = ?,
            client_cpp = ?,
            updated_at = ?
          WHERE id = ?
        `,
        args: [
          freelancerEarnings,
          managerEarnings,
          adminProfit,
          clientCpp || (isTechnicalWorkType(order.work_type) ? 270 : 240),
          new Date().toISOString(),
          order.id
        ]
      });

      console.log(`✅ Fixed order ${order.display_id || order.id}:`);
      console.log(`   Amount: ${amount} → Freelancer: ${freelancerEarnings}, Manager: ${managerEarnings}, Admin: ${adminProfit}`);
      
      fixed++;
    } catch (error) {
      console.error(`❌ Error fixing order ${order.display_id || order.id}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  // Verify the fixes
  console.log('\n🔍 Verifying fixes...\n');
  
  const stillBroken = await turso.execute(`
    SELECT COUNT(*) as count
    FROM jobs
    WHERE (pages > 0 OR slides > 0)
      AND (freelancer_earnings = 0 OR freelancer_earnings IS NULL)
  `);

  console.log(`⚠️  Orders still with 0/null freelancer earnings: ${stillBroken.rows[0].count}`);

  if (stillBroken.rows[0].count === 0) {
    console.log('\n🎉 All financial data has been fixed!');
  }
}

fixFinancialData().catch(console.error).finally(() => process.exit(0));
