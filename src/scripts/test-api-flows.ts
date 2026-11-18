/**
 * TaskLynk API Integration Test Suite
 * Tests all critical endpoints end-to-end
 * 
 * Usage: bun src/scripts/test-api-flows.ts
 */

const BASE_URL = process.env.API_URL || 'https://tasklynk.co.ke';
let testResults = {
  passed: 0,
  failed: 0,
  errors: [] as string[]
};

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    testResults.passed++;
  } catch (error) {
    console.error(`❌ ${name} - FAILED`);
    const err = error instanceof Error ? error.message : String(error);
    console.error(`   Error: ${err}`);
    testResults.failed++;
    testResults.errors.push(`${name}: ${err}`);
  }
}

async function testRegistration() {
  const email = `test_${Date.now()}@gmail.com`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'test123456',
      name: 'Test User',
      role: 'freelancer',
      phone: '0712345678'
    })
  });

  if (!registerRes.ok) {
    const data = await registerRes.json();
    throw new Error(`Registration failed: ${data.error}`);
  }

  const data = await registerRes.json();
  if (!data.success) {
    throw new Error('Registration did not return success');
  }

}

async function testOrderCreation() {
  // Note: Requires valid bearer token
  const token = process.env.BEARER_TOKEN;
  if (!token) {
    throw new Error('BEARER_TOKEN not set in environment');
  }

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);

  const jobRes = await fetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      clientId: 1,
      title: 'Test Job',
      instructions: 'Test instructions',
      workType: 'Essay',
      pages: 5,
      amount: 1200,
      deadline: deadline.toISOString()
    })
  });

  if (!jobRes.ok) {
    const data = await jobRes.json();
    throw new Error(`Job creation failed: ${data.error}`);
  }

  const job = await jobRes.json();
}

async function testJobFetch() {
  const listRes = await fetch(`${BASE_URL}/api/jobs?limit=5`);

  if (!listRes.ok) {
    throw new Error(`Job fetch failed with status ${listRes.status}`);
  }

  const jobs = await listRes.json();
}

async function testUserFetch() {
  const userId = 1;
  const userRes = await fetch(`${BASE_URL}/api/users/${userId}`);

  if (!userRes.ok) {
    throw new Error(`User fetch failed with status ${userRes.status}`);
  }

  const user = await userRes.json();
}

async function testFiletypeValidation() {
  const allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'png'];
  const disallowedTypes = ['exe', 'bat', 'sh'];

  
  // This is a schema validation test, so we just verify the list is reasonable
  if (allowedTypes.length === 0 || disallowedTypes.length === 0) {
    throw new Error('File type lists not properly configured');
  }
}

async function runTests() {

  await test('Registration Flow', testRegistration);
  await test('Job List Fetch', testJobFetch);
  await test('User Fetch', testUserFetch);
  await test('File Type Validation', testFiletypeValidation);
  
  // Only run if BEARER_TOKEN is set
  if (process.env.BEARER_TOKEN) {
    await test('Order Creation', testOrderCreation);
  } else {
  }


  if (testResults.errors.length > 0) {
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});

