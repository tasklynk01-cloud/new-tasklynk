/**
 * Payment Calculation Test Suite
 * 
 * Run this script to verify manager and freelancer payment calculations
 * Usage: npx tsx scripts/test-payment-calculations.ts
 */

import { calculateWriterEarningsByCPPLevel, calculateManagerEarningsV2 } from '@/lib/payment-calculations';

console.log('🧪 Testing Payment Calculations\n');
console.log('='.repeat(60));

// ========================================
// FREELANCER PAYMENT TESTS
// ========================================
console.log('\n📊 FREELANCER PAYMENT TESTS\n');

interface FreelancerTest {
  name: string;
  pages: number;
  slides: number;
  workType: string;
  completedOrders: number;
  singleSpaced: boolean;
  expectedAmount: number;
}

const freelancerTests: FreelancerTest[] = [
  {
    name: '1 page, Starter tier, non-tech',
    pages: 1,
    slides: 0,
    workType: 'essay',
    completedOrders: 0,
    singleSpaced: false,
    expectedAmount: 150,
  },
  {
    name: '5 pages, Starter tier, non-tech',
    pages: 5,
    slides: 0,
    workType: 'essay',
    completedOrders: 0,
    singleSpaced: false,
    expectedAmount: 750, // 5 × 150
  },
  {
    name: '5 pages, single-spaced, Starter tier',
    pages: 5,
    slides: 0,
    workType: 'essay',
    completedOrders: 0,
    singleSpaced: true,
    expectedAmount: 1500, // 10 effective pages × 150
  },
  {
    name: '10 pages, Rising tier, non-tech',
    pages: 10,
    slides: 0,
    workType: 'essay',
    completedOrders: 3,
    singleSpaced: false,
    expectedAmount: 1600, // 10 × 160
  },
  {
    name: '5 pages + 10 slides, Established tier',
    pages: 5,
    slides: 10,
    workType: 'research',
    completedOrders: 10,
    singleSpaced: false,
    expectedAmount: 1850, // 5×170 + 10×100 = 850 + 1000 = 1850
  },
  {
    name: '3 pages, Starter tier, technical',
    pages: 3,
    slides: 0,
    workType: 'excel',
    completedOrders: 0,
    singleSpaced: false,
    expectedAmount: 510, // 3 × 170
  },
  {
    name: 'Zero pages (minimum guarantee)',
    pages: 0,
    slides: 0,
    workType: 'essay',
    completedOrders: 0,
    singleSpaced: false,
    expectedAmount: 150,
  },
  {
    name: '10 pages, Master tier, technical',
    pages: 10,
    slides: 0,
    workType: 'spss',
    completedOrders: 50,
    singleSpaced: false,
    expectedAmount: 2200, // 10 × 220 (Master technical rate)
  },
];

let freelancerPassed = 0;
let freelancerFailed = 0;

for (const test of freelancerTests) {
  const result = calculateWriterEarningsByCPPLevel(
    test.pages,
    test.slides,
    test.workType,
    test.completedOrders,
    test.singleSpaced
  );

  const passed = result === test.expectedAmount;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  if (passed) {
    freelancerPassed++;
  } else {
    freelancerFailed++;
  }

  console.log(`${status}: ${test.name}`);
  console.log(`  Expected: ${test.expectedAmount} KSh, Got: ${result} KSh`);
  
  if (!passed) {
    console.log(`  ⚠️  MISMATCH! Check calculation logic.`);
  }
  console.log('');
}

// ========================================
// MANAGER PAYMENT TESTS
// ========================================
console.log('='.repeat(60));
console.log('\n💼 MANAGER PAYMENT TESTS\n');

interface ManagerTest {
  name: string;
  assignedByRole: string | null;
  assignedByUserId: number | null;
  deliveredByRole: string | null;
  deliveredByUserId: number | null;
  pages: number;
  singleSpaced: boolean;
  expectedAssignmentFee: number;
  expectedDeliveryFee: number;
  expectedAssignedByManagerId: number | null;
  expectedDeliveredByManagerId: number | null;
}

const managerTests: ManagerTest[] = [
  {
    name: 'Admin assigns, Admin delivers',
    assignedByRole: 'admin',
    assignedByUserId: 1,
    deliveredByRole: 'admin',
    deliveredByUserId: 1,
    pages: 5,
    singleSpaced: false,
    expectedAssignmentFee: 0,
    expectedDeliveryFee: 0,
    expectedAssignedByManagerId: null,
    expectedDeliveredByManagerId: null,
  },
  {
    name: 'Manager assigns, Admin delivers',
    assignedByRole: 'manager',
    assignedByUserId: 42,
    deliveredByRole: 'admin',
    deliveredByUserId: 1,
    pages: 5,
    singleSpaced: false,
    expectedAssignmentFee: 10,
    expectedDeliveryFee: 0,
    expectedAssignedByManagerId: 42,
    expectedDeliveredByManagerId: null,
  },
  {
    name: 'Admin assigns, Manager delivers (5 pages)',
    assignedByRole: 'admin',
    assignedByUserId: 1,
    deliveredByRole: 'manager',
    deliveredByUserId: 42,
    pages: 5,
    singleSpaced: false,
    expectedAssignmentFee: 0,
    expectedDeliveryFee: 30, // 10 + 5×(5-1) = 10 + 20 = 30
    expectedAssignedByManagerId: null,
    expectedDeliveredByManagerId: 42,
  },
  {
    name: 'Manager assigns & delivers (5 pages)',
    assignedByRole: 'manager',
    assignedByUserId: 42,
    deliveredByRole: 'manager',
    deliveredByUserId: 42,
    pages: 5,
    singleSpaced: false,
    expectedAssignmentFee: 10,
    expectedDeliveryFee: 30,
    expectedAssignedByManagerId: 42,
    expectedDeliveredByManagerId: 42,
  },
  {
    name: 'Different managers (assign vs deliver)',
    assignedByRole: 'manager',
    assignedByUserId: 42,
    deliveredByRole: 'manager',
    deliveredByUserId: 55,
    pages: 3,
    singleSpaced: false,
    expectedAssignmentFee: 10,
    expectedDeliveryFee: 20, // 10 + 5×(3-1) = 10 + 10 = 20
    expectedAssignedByManagerId: 42,
    expectedDeliveredByManagerId: 55,
  },
  {
    name: 'Single-spaced delivery (5 pages → 10 effective)',
    assignedByRole: 'admin',
    assignedByUserId: 1,
    deliveredByRole: 'manager',
    deliveredByUserId: 42,
    pages: 5,
    singleSpaced: true,
    expectedAssignmentFee: 0,
    expectedDeliveryFee: 55, // 10 + 5×(10-1) = 10 + 45 = 55
    expectedAssignedByManagerId: null,
    expectedDeliveredByManagerId: 42,
  },
];

let managerPassed = 0;
let managerFailed = 0;

for (const test of managerTests) {
  const result = calculateManagerEarningsV2({
    assignedByRole: test.assignedByRole,
    assignedByUserId: test.assignedByUserId,
    deliveredByRole: test.deliveredByRole,
    deliveredByUserId: test.deliveredByUserId,
    pages: test.pages,
    singleSpaced: test.singleSpaced,
  });

  const assignmentMatch = result.assignmentFee === test.expectedAssignmentFee;
  const deliveryMatch = result.deliveryFee === test.expectedDeliveryFee;
  const assignerIdMatch = result.assignedByManagerId === test.expectedAssignedByManagerId;
  const delivererIdMatch = result.deliveredByManagerId === test.expectedDeliveredByManagerId;
  
  const passed = assignmentMatch && deliveryMatch && assignerIdMatch && delivererIdMatch;
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  if (passed) {
    managerPassed++;
  } else {
    managerFailed++;
  }

  console.log(`${status}: ${test.name}`);
  console.log(`  Assignment Fee: Expected ${test.expectedAssignmentFee}, Got ${result.assignmentFee} ${assignmentMatch ? '✅' : '❌'}`);
  console.log(`  Delivery Fee: Expected ${test.expectedDeliveryFee}, Got ${result.deliveryFee} ${deliveryMatch ? '✅' : '❌'}`);
  console.log(`  Assigned By Manager ID: Expected ${test.expectedAssignedByManagerId}, Got ${result.assignedByManagerId} ${assignerIdMatch ? '✅' : '❌'}`);
  console.log(`  Delivered By Manager ID: Expected ${test.expectedDeliveredByManagerId}, Got ${result.deliveredByManagerId} ${delivererIdMatch ? '✅' : '❌'}`);
  console.log('');
}

// ========================================
// SUMMARY
// ========================================
console.log('='.repeat(60));
console.log('\n📋 TEST SUMMARY\n');

const totalTests = freelancerTests.length + managerTests.length;
const totalPassed = freelancerPassed + managerPassed;
const totalFailed = freelancerFailed + managerFailed;

console.log(`Freelancer Tests: ${freelancerPassed}/${freelancerTests.length} passed`);
console.log(`Manager Tests: ${managerPassed}/${managerTests.length} passed`);
console.log(`\nTotal: ${totalPassed}/${totalTests} passed`);

if (totalFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Payment calculations are working correctly.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalFailed} TEST(S) FAILED! Review the implementation.\n`);
  process.exit(1);
}
