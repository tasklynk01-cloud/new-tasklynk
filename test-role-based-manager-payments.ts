/**
 * Test script for role-based manager payment system
 * 
 * Tests 5 scenarios:
 * 1. Manager assigns → different manager delivers: Both get paid
 * 2. Admin assigns → manager delivers: Only delivery fee
 * 3. Manager assigns → admin delivers: Only assignment fee
 * 4. Manager assigns → same manager delivers: Full both fees
 * 5. Admin assigns → admin delivers: Zero fees
 */

import { calculateManagerEarningsV2 } from './src/lib/payment-calculations';

console.log('='.repeat(60));
console.log('🧪 ROLE-BASED MANAGER PAYMENT SYSTEM TEST');
console.log('='.repeat(60));
console.log();

const pages = 3; // Standard 3-page order

console.log(`Test Order: ${pages} pages\n`);

// Scenario 1: Manager assigns → different manager delivers
console.log('📋 Scenario 1: Manager assigns → Different manager delivers');
const scenario1 = calculateManagerEarningsV2({
  assignedByRole: 'manager',
  assignedByUserId: 10,
  deliveredByRole: 'manager',
  deliveredByUserId: 11,
  pages,
});
console.log(`  Assignment Fee: KSh ${scenario1.assignmentFee} (Manager #10)`);
console.log(`  Delivery Fee: KSh ${scenario1.deliveryFee} (Manager #11)`);
console.log(`  ✅ Expected: Both get paid independently\n`);

// Scenario 2: Admin assigns → manager delivers
console.log('📋 Scenario 2: Admin assigns → Manager delivers');
const scenario2 = calculateManagerEarningsV2({
  assignedByRole: 'admin',
  assignedByUserId: 1,
  deliveredByRole: 'manager',
  deliveredByUserId: 10,
  pages,
});
console.log(`  Assignment Fee: KSh ${scenario2.assignmentFee} (Admin #1)`);
console.log(`  Delivery Fee: KSh ${scenario2.deliveryFee} (Manager #10)`);
console.log(`  ✅ Expected: Only delivery fee (admin gets 0)\n`);

// Scenario 3: Manager assigns → admin delivers
console.log('📋 Scenario 3: Manager assigns → Admin delivers');
const scenario3 = calculateManagerEarningsV2({
  assignedByRole: 'manager',
  assignedByUserId: 10,
  deliveredByRole: 'admin',
  deliveredByUserId: 1,
  pages,
});
console.log(`  Assignment Fee: KSh ${scenario3.assignmentFee} (Manager #10)`);
console.log(`  Delivery Fee: KSh ${scenario3.deliveryFee} (Admin #1)`);
console.log(`  ✅ Expected: Only assignment fee (admin gets 0)\n`);

// Scenario 4: Manager assigns → same manager delivers
console.log('📋 Scenario 4: Manager assigns → Same manager delivers');
const scenario4 = calculateManagerEarningsV2({
  assignedByRole: 'manager',
  assignedByUserId: 10,
  deliveredByRole: 'manager',
  deliveredByUserId: 10,
  pages,
});
console.log(`  Assignment Fee: KSh ${scenario4.assignmentFee} (Manager #10)`);
console.log(`  Delivery Fee: KSh ${scenario4.deliveryFee} (Manager #10)`);
console.log(`  Total for Manager #10: KSh ${scenario4.assignmentFee + scenario4.deliveryFee}`);
console.log(`  ✅ Expected: Full both fees (same manager)\n`);

// Scenario 5: Admin assigns → admin delivers
console.log('📋 Scenario 5: Admin assigns → Admin delivers');
const scenario5 = calculateManagerEarningsV2({
  assignedByRole: 'admin',
  assignedByUserId: 1,
  deliveredByRole: 'admin',
  deliveredByUserId: 1,
  pages,
});
console.log(`  Assignment Fee: KSh ${scenario5.assignmentFee} (Admin #1)`);
console.log(`  Delivery Fee: KSh ${scenario5.deliveryFee} (Admin #1)`);
console.log(`  ✅ Expected: Zero fees (admins never earn manager fees)\n`);

console.log('='.repeat(60));
console.log('✅ TEST COMPLETE');
console.log('='.repeat(60));

// Validation
const allCorrect = 
  scenario1.assignmentFee === 10 &&
  scenario1.deliveryFee === 20 && // 10 + 5*(3-1)
  scenario2.assignmentFee === 0 &&
  scenario2.deliveryFee === 20 &&
  scenario3.assignmentFee === 10 &&
  scenario3.deliveryFee === 0 &&
  scenario4.assignmentFee === 10 &&
  scenario4.deliveryFee === 20 &&
  scenario5.assignmentFee === 0 &&
  scenario5.deliveryFee === 0;

if (allCorrect) {
  console.log('\n🎉 ALL TESTS PASSED - Role-based manager payment system working correctly!');
  process.exit(0);
} else {
  console.error('\n❌ TESTS FAILED - Check calculations');
  process.exit(1);
}
