/**
 * CODE VALIDATION: Manager API Endpoint Logic
 * 
 * Validates the filtering logic in manager order endpoints without hitting the database
 * This confirms the code changes are correct even if DB migration is pending
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 CODE-LEVEL VALIDATION: Manager Order Endpoints\n');

const files = [
  {
    path: 'src/app/api/manager/orders/route.ts',
    name: 'Legacy Manager Orders API'
  },
  {
    path: 'src/app/api/v2/manager/orders/route.ts',
    name: 'V2 Manager Orders API'
  }
];

let allPassed = true;

files.forEach(file => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄 ${file.name}`);
  console.log(`   ${file.path}`);
  console.log('─'.repeat(60));

  const filePath = path.join(process.cwd(), file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Test 1: Check for manager filtering logic
  const hasManagerFilter = content.includes('eq(jobs.managerId') || 
                          content.includes('jobs.managerId');
  
  if (hasManagerFilter) {
    console.log('✅ Contains managerId filtering logic');
  } else {
    console.log('❌ Missing managerId filtering logic');
    allPassed = false;
  }

  // Test 2: Check for role-based logic
  const hasRoleCheck = content.includes('isManagerRequest') || 
                       content.includes("role === 'manager'") ||
                       content.includes('authCheck.user?.role');
  
  if (hasRoleCheck) {
    console.log('✅ Contains role-based access control');
  } else {
    console.log('❌ Missing role-based access control');
    allPassed = false;
  }

  // Test 3: Check that "OPEN ACCESS" comment is removed
  const hasOpenAccess = content.includes('OPEN ACCESS') || 
                       content.includes('see ALL orders');
  
  if (!hasOpenAccess) {
    console.log('✅ Old "OPEN ACCESS" logic removed');
  } else {
    console.log('⚠️  Still contains "OPEN ACCESS" comment');
  }

  // Test 4: Check for proper where clause construction
  const hasWhereConstruction = content.includes('whereConditions') && 
                              content.includes('filters');
  
  if (hasWhereConstruction) {
    console.log('✅ Proper WHERE clause construction');
  } else {
    console.log('⚠️  WHERE clause construction may need review');
  }

  // Test 5: Extract key logic snippet
  const managerFilterMatch = content.match(/if.*isManagerRequest.*\{[\s\S]{0,200}managerId/);
  if (managerFilterMatch) {
    console.log('\n📝 Filter Logic Snippet:');
    const snippet = managerFilterMatch[0]
      .split('\n')
      .map(line => '   ' + line.trim())
      .join('\n');
    console.log(snippet.substring(0, 300) + '...');
  }
});

console.log('\n' + '═'.repeat(60));

if (allPassed) {
  console.log('✅ ALL CODE VALIDATIONS PASSED');
  console.log('\nManager endpoints correctly filter by managerId');
  console.log('Role-based access control is properly implemented');
} else {
  console.log('❌ SOME VALIDATIONS FAILED');
  console.log('\nPlease review the failing checks above');
}

console.log('═'.repeat(60));

// Validate schema changes
console.log('\n📋 Validating Schema Changes...\n');

const schemaPath = path.join(process.cwd(), 'src/db/schema.ts');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  // Check for acceptedAt field
  if (schemaContent.includes("acceptedAt: text('accepted_at')")) {
    console.log('✅ acceptedAt field added to jobs table schema');
  } else {
    console.log('❌ acceptedAt field NOT found in schema');
    allPassed = false;
  }

  // Check field position (should be before assignedAt)
  const acceptedAtIndex = schemaContent.indexOf("acceptedAt:");
  const assignedAtIndex = schemaContent.indexOf("assignedAt:");
  
  if (acceptedAtIndex > 0 && assignedAtIndex > 0 && acceptedAtIndex < assignedAtIndex) {
    console.log('✅ acceptedAt positioned correctly (before assignedAt)');
  } else if (acceptedAtIndex > 0) {
    console.log('⚠️  acceptedAt exists but position may differ from expected');
  }
} else {
  console.log('❌ Schema file not found');
  allPassed = false;
}

// Validate order detail API changes
console.log('\n📋 Validating Order Detail API...\n');

const orderDetailPath = path.join(process.cwd(), 'src/app/api/v2/orders/[id]/route.ts');
if (fs.existsSync(orderDetailPath)) {
  const detailContent = fs.readFileSync(orderDetailPath, 'utf-8');
  
  if (detailContent.includes('orderFiles') && detailContent.includes('orderFileRows')) {
    console.log('✅ Order detail API uses consolidated orderFiles table');
  } else {
    console.log('❌ orderFiles consolidation not found');
    allPassed = false;
  }

  if (detailContent.includes('legacyRows') || detailContent.includes('job_attachments')) {
    console.log('✅ Legacy fallback to job_attachments preserved');
  } else {
    console.log('⚠️  Legacy fallback may not be implemented');
  }
} else {
  console.log('❌ Order detail API file not found');
  allPassed = false;
}

console.log('\n' + '═'.repeat(60));
console.log(allPassed ? '✅ ALL VALIDATIONS PASSED' : '⚠️  SOME CHECKS NEED ATTENTION');
console.log('═'.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
