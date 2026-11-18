/**
 * Freelancer Order Flow Test Script
 * 
 * Tests the complete freelancer journey from viewing available orders to completion.
 * Run with: npx tsx scripts/test-freelancer-order-flow.ts
 */

import * as readline from 'readline';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function makeRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testFreelancerLogin() {
  logSection('1. Freelancer Login Test');

  const response = await makeRequest('/api/v2/auth/login', 'POST', {
    email: 'freelancer@test.com',
    password: 'freelancer123',
  });

  if (response.success && response.data.token) {
    log('✅ Login successful', 'green');
    log(`Token: ${response.data.token.substring(0, 20)}...`, 'blue');
    return response.data.token;
  } else {
    log('❌ Login failed', 'red');
    console.log(response);
    return null;
  }
}

async function testAvailableOrders(token: string) {
  logSection('2. Fetch Available Orders (status: accepted)');

  const response = await makeRequest(
    '/api/v2/freelancers/available-orders?status=accepted',
    'GET',
    undefined,
    token
  );

  if (response.success && response.data) {
    const orders = response.data.orders || response.data;
    log(`✅ Found ${orders.length} available orders`, 'green');
    
    if (orders.length > 0) {
      const order = orders[0];
      log(`\nFirst Order:`, 'blue');
      console.log(`  - ID: ${order.id}`);
      console.log(`  - Display ID: ${order.displayId}`);
      console.log(`  - Title: ${order.title}`);
      console.log(`  - Status: ${order.status}`);
      console.log(`  - Pages: ${order.pages}`);
      console.log(`  - Deadline: ${order.deadline}`);
      
      return order.id;
    } else {
      log('⚠️  No available orders for bidding', 'yellow');
      return null;
    }
  } else {
    log('❌ Failed to fetch available orders', 'red');
    console.log(response);
    return null;
  }
}

async function testOrderDetail(orderId: number, token: string, endpoint: string) {
  logSection(`3. Fetch Order Detail - ${endpoint}`);

  const response = await makeRequest(
    `${endpoint}/${orderId}`,
    'GET',
    undefined,
    token
  );

  if (response.success && response.data) {
    const order = response.data.order || response.data;
    log(`✅ Order detail fetched successfully`, 'green');
    log(`\nOrder Details:`, 'blue');
    console.log(`  - ID: ${order.id}`);
    console.log(`  - Display ID: ${order.displayId || order.orderNumber}`);
    console.log(`  - Title: ${order.title}`);
    console.log(`  - Status: ${order.status}`);
    console.log(`  - Pages: ${order.pages}`);
    console.log(`  - Freelancer Earnings: KSh ${order.freelancerEarnings || 0}`);
    console.log(`  - Deadline: ${order.deadline}`);
    console.log(`  - Assigned Freelancer: ${order.assignedFreelancerId || 'None'}`);
    
    return {
      success: true,
      order,
    };
  } else {
    log(`❌ Failed to fetch order detail (Status: ${response.status})`, 'red');
    console.log(response.data || response.error);
    return {
      success: false,
      status: response.status,
      error: response.data?.error || response.error,
    };
  }
}

async function testBidPlacement(orderId: number, freelancerId: number, token: string) {
  logSection('4. Place Bid on Order');

  const bidAmount = 1500; // Example bid amount

  const response = await makeRequest(
    '/api/bids',
    'POST',
    {
      jobId: orderId,
      freelancerId,
      bidAmount,
    },
    token
  );

  if (response.success) {
    log('✅ Bid placed successfully', 'green');
    console.log(`  - Bid Amount: KSh ${bidAmount}`);
    console.log(`  - Order ID: ${orderId}`);
    return true;
  } else if (response.status === 400 && response.data?.error?.includes('already placed')) {
    log('⚠️  Bid already exists for this order', 'yellow');
    return true;
  } else {
    log('❌ Failed to place bid', 'red');
    console.log(response.data || response.error);
    return false;
  }
}

async function testMyBids(freelancerId: number, token: string) {
  logSection('5. Fetch My Bids');

  const response = await makeRequest(
    `/api/bids?freelancerId=${freelancerId}`,
    'GET',
    undefined,
    token
  );

  if (response.success && response.data) {
    const bids = Array.isArray(response.data) ? response.data : response.data.bids || [];
    log(`✅ Found ${bids.length} bids`, 'green');
    
    if (bids.length > 0) {
      log(`\nYour Bids:`, 'blue');
      bids.forEach((bid: any, index: number) => {
        console.log(`\n  Bid ${index + 1}:`);
        console.log(`    - Job ID: ${bid.jobId}`);
        console.log(`    - Bid Amount: KSh ${bid.bidAmount}`);
        console.log(`    - Status: ${bid.status || 'pending'}`);
        console.log(`    - Created: ${bid.createdAt}`);
      });
    }
    
    return bids;
  } else {
    log('❌ Failed to fetch bids', 'red');
    console.log(response);
    return [];
  }
}

async function testAssignedOrders(token: string) {
  logSection('6. Fetch Assigned Orders (My Work)');

  const response = await makeRequest(
    '/api/v2/freelancers/my-orders',
    'GET',
    undefined,
    token
  );

  if (response.success && response.data) {
    const orders = response.data.orders || response.data;
    log(`✅ Found ${orders.length} assigned orders`, 'green');
    
    if (orders.length > 0) {
      log(`\nYour Assigned Orders:`, 'blue');
      orders.forEach((order: any, index: number) => {
        console.log(`\n  Order ${index + 1}:`);
        console.log(`    - ID: ${order.id}`);
        console.log(`    - Display ID: ${order.displayId}`);
        console.log(`    - Title: ${order.title}`);
        console.log(`    - Status: ${order.status}`);
        console.log(`    - Earnings: KSh ${order.freelancerEarnings || 0}`);
        console.log(`    - Deadline: ${order.freelancerDeadline || order.deadline}`);
      });
      
      return orders;
    } else {
      log('⚠️  No assigned orders', 'yellow');
      return [];
    }
  } else {
    log('❌ Failed to fetch assigned orders', 'red');
    console.log(response);
    return [];
  }
}

async function testOrderMessages(orderId: number, token: string) {
  logSection('7. Fetch Order Messages');

  const response = await makeRequest(
    `/api/v2/orders/${orderId}/chat`,
    'GET',
    undefined,
    token
  );

  if (response.success && response.data) {
    const messages = Array.isArray(response.data) ? response.data : response.data.messages || [];
    log(`✅ Found ${messages.length} messages`, 'green');
    
    if (messages.length > 0) {
      log(`\nRecent Messages:`, 'blue');
      messages.slice(0, 3).forEach((msg: any) => {
        console.log(`\n  - ${msg.senderName || 'Unknown'} (${msg.senderRole}):`);
        console.log(`    ${msg.message}`);
        console.log(`    ${new Date(msg.createdAt).toLocaleString()}`);
      });
    }
    
    return messages;
  } else {
    log('❌ Failed to fetch messages', 'red');
    console.log(response);
    return [];
  }
}

async function testOrderFiles(orderId: number, token: string) {
  logSection('8. Fetch Order Files');

  const response = await makeRequest(
    `/api/v2/orders/${orderId}/files`,
    'GET',
    undefined,
    token
  );

  if (response.success && response.data) {
    const files = Array.isArray(response.data) ? response.data : response.data.files || [];
    log(`✅ Found ${files.length} files`, 'green');
    
    if (files.length > 0) {
      log(`\nUploaded Files:`, 'blue');
      files.forEach((file: any) => {
        console.log(`\n  - ${file.fileName}`);
        console.log(`    Type: ${file.fileType || file.uploadType || 'Unknown'}`);
        console.log(`    Size: ${Math.round((file.fileSize || 0) / 1024)} KB`);
        console.log(`    Uploaded by: ${file.uploaderName || 'Unknown'} (${file.uploaderRole || 'Unknown'})`);
      });
    }
    
    return files;
  } else {
    log('❌ Failed to fetch files', 'red');
    console.log(response);
    return [];
  }
}

async function runTests() {
  console.clear();
  log('🚀 FREELANCER ORDER FLOW TEST SUITE', 'cyan');
  log('Testing complete journey from login to order interaction\n', 'blue');

  // 1. Login
  const token = await testFreelancerLogin();
  if (!token) {
    log('\n❌ Cannot proceed without authentication token', 'red');
    return;
  }

  // Wait 1 second between requests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Fetch available orders
  const availableOrderId = await testAvailableOrders(token);
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Test order detail endpoints (both legacy and v2)
  if (availableOrderId) {
    // Test v2 endpoint
    const v2Result = await testOrderDetail(availableOrderId, token, '/api/v2/orders');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test legacy endpoint
    const legacyResult = await testOrderDetail(availableOrderId, token, '/api/jobs');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Compare results
    if (v2Result.success && legacyResult.success) {
      logSection('API Endpoint Comparison');
      log('✅ Both endpoints working', 'green');
      console.log(`\nv2 endpoint status: ${v2Result.order?.status}`);
      console.log(`Legacy endpoint status: ${legacyResult.order?.status}`);
      console.log(`\nv2 earnings: KSh ${v2Result.order?.freelancerEarnings || 0}`);
      console.log(`Legacy earnings: KSh ${legacyResult.order?.freelancerEarnings || 0}`);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Test bid placement (using freelancer ID from token decode - assuming ID 4)
  const freelancerId = 4; // Test freelancer ID
  if (availableOrderId) {
    await testBidPlacement(availableOrderId, freelancerId, token);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 5. Fetch my bids
  await testMyBids(freelancerId, token);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 6. Fetch assigned orders
  const assignedOrders = await testAssignedOrders(token);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 7. Test order messages (if assigned orders exist)
  if (assignedOrders.length > 0) {
    await testOrderMessages(assignedOrders[0].id, token);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 8. Test order files
    await testOrderFiles(assignedOrders[0].id, token);
  }

  // Summary
  logSection('Test Summary');
  log('✅ Test suite completed', 'green');
  log('\nVerify the following:', 'yellow');
  console.log('  1. Freelancer can login successfully');
  console.log('  2. Available orders are fetched and displayed');
  console.log('  3. Order details load from both API endpoints');
  console.log('  4. Bids can be placed on available orders');
  console.log('  5. Freelancer can see their bids');
  console.log('  6. Assigned orders are fetched correctly');
  console.log('  7. Order messages are accessible');
  console.log('  8. Order files are accessible');
  
  log('\n📝 Next Steps:', 'cyan');
  console.log('  - Test the frontend by visiting:');
  console.log(`    ${BASE_URL}/freelancer/orders (Available orders)`);
  console.log(`    ${BASE_URL}/freelancer/jobs (My work)`);
  if (availableOrderId) {
    console.log(`    ${BASE_URL}/freelancer/orders/${availableOrderId} (Order detail - bidding)`);
  }
  if (assignedOrders.length > 0) {
    console.log(`    ${BASE_URL}/freelancer/jobs/${assignedOrders[0].id} (Order detail - work)`);
  }
}

// Run the tests
runTests().catch((error) => {
  log('\n❌ Fatal error during test execution:', 'red');
  console.error(error);
  process.exit(1);
});
