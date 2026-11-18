/**
 * Test script to verify admin user management functionality
 * Tests: Fetching user, updating payment terms, updating client tier/priority
 */

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'topwriteessays@gmail.com';
const ADMIN_PASSWORD = 'kemoda2025';

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const response = await fetch(`${BASE_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  return data.token;
}

async function getClientUsers(token: string) {
  console.log('\n📋 Fetching client users...');
  
  const response = await fetch(`${BASE_URL}/api/users/by-role?role=client`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.status}`);
  }

  const clients = await response.json();
  console.log(`✅ Found ${clients.length} clients`);
  return clients;
}

async function getUserDetails(token: string, userId: number) {
  console.log(`\n🔍 Fetching user details for ID: ${userId}...`);
  
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const user = await response.json();
  console.log('✅ User details fetched:');
  console.log(JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    paymentTerms: user.paymentTerms,
    clientTier: user.clientTier,
    clientPriority: user.clientPriority,
    balance: user.balance,
    approved: user.approved,
    status: user.status,
  }, null, 2));
  
  return user;
}

async function updatePaymentTerms(token: string, userId: number, newTerms: 'pod' | 'poa') {
  console.log(`\n💳 Updating payment terms to ${newTerms.toUpperCase()}...`);
  
  const response = await fetch(`${BASE_URL}/api/users/${userId}/payment-terms`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentTerms: newTerms }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update payment terms: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  console.log('✅ Payment terms updated successfully');
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function updateUserViaPatch(token: string, userId: number, updates: any) {
  console.log(`\n🔧 Updating user via PATCH endpoint...`);
  console.log('Updates:', JSON.stringify(updates, null, 2));
  
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update user: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  console.log('✅ User updated successfully via PATCH');
  console.log(JSON.stringify({
    id: result.id,
    name: result.name,
    email: result.email,
    paymentTerms: result.paymentTerms,
    clientTier: result.clientTier,
    clientPriority: result.clientPriority,
  }, null, 2));
  return result;
}

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('ADMIN USER MANAGEMENT TEST');
    console.log('='.repeat(80));

    // Step 1: Login
    const token = await loginAsAdmin();

    // Step 2: Get client users
    const clients = await getClientUsers(token);
    
    if (clients.length === 0) {
      console.log('⚠️  No clients found to test with');
      return;
    }

    // Use first client for testing
    const testClient = clients[0];
    console.log(`\n📌 Using test client: ${testClient.name} (ID: ${testClient.id})`);

    // Step 3: Get user details BEFORE changes
    console.log('\n' + '='.repeat(80));
    console.log('BEFORE CHANGES');
    console.log('='.repeat(80));
    const beforeUser = await getUserDetails(token, testClient.id);

    // Step 4: Update payment terms (toggle POD <-> POA)
    const currentTerms = beforeUser.paymentTerms || 'pod';
    const newTerms = currentTerms === 'pod' ? 'poa' : 'pod';
    await updatePaymentTerms(token, testClient.id, newTerms);

    // Step 5: Update other fields via PATCH
    await updateUserViaPatch(token, testClient.id, {
      clientTier: 'gold',
      clientPriority: 'priority',
    });

    // Step 6: Get user details AFTER changes
    console.log('\n' + '='.repeat(80));
    console.log('AFTER CHANGES');
    console.log('='.repeat(80));
    const afterUser = await getUserDetails(token, testClient.id);

    // Step 7: Verify changes
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));
    
    const changes = {
      paymentTerms: {
        before: beforeUser.paymentTerms,
        after: afterUser.paymentTerms,
        changed: beforeUser.paymentTerms !== afterUser.paymentTerms,
      },
      clientTier: {
        before: beforeUser.clientTier,
        after: afterUser.clientTier,
        changed: beforeUser.clientTier !== afterUser.clientTier,
      },
      clientPriority: {
        before: beforeUser.clientPriority,
        after: afterUser.clientPriority,
        changed: beforeUser.clientPriority !== afterUser.clientPriority,
      },
    };

    console.log(JSON.stringify(changes, null, 2));

    const allChanged = Object.values(changes).every(c => c.changed);
    
    if (allChanged) {
      console.log('\n✅ ALL TESTS PASSED - All changes persisted correctly!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - Not all changes persisted');
    }

    // Step 8: Revert changes (optional - restore original values)
    console.log('\n🔄 Reverting changes to original values...');
    await updatePaymentTerms(token, testClient.id, beforeUser.paymentTerms);
    await updateUserViaPatch(token, testClient.id, {
      clientTier: beforeUser.clientTier,
      clientPriority: beforeUser.clientPriority,
    });
    console.log('✅ Changes reverted');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

main();
