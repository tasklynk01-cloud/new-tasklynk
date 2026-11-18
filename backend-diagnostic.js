/**
 * Backend Diagnostic Script
 * Tests database connectivity and API endpoints
 */

const { createClient } = require('@libsql/client');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();

const TURSO_CONNECTION_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';

console.log('\n🔍 BACKEND DIAGNOSTIC REPORT');
console.log('═'.repeat(60));

// 1. Check Environment Variables
console.log('\n1️⃣ ENVIRONMENT VARIABLES CHECK');
console.log('─'.repeat(60));
console.log(`✓ TURSO_CONNECTION_URL: ${TURSO_CONNECTION_URL ? '✅ SET' : '❌ MISSING'}`);
console.log(`  Value: ${TURSO_CONNECTION_URL?.substring(0, 40)}...`);
console.log(`✓ TURSO_AUTH_TOKEN: ${TURSO_AUTH_TOKEN ? '✅ SET' : '❌ MISSING'}`);
console.log(`  Length: ${TURSO_AUTH_TOKEN?.length || 0} chars`);
console.log(`✓ JWT_SECRET: ${JWT_SECRET ? '✅ SET' : '❌ MISSING'}`);
console.log(`  Length: ${JWT_SECRET?.length || 0} chars`);
console.log(`✓ NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`✓ APP_URL: ${APP_URL}`);

// 2. Test Database Connection
async function testDatabaseConnection() {
  console.log('\n2️⃣ DATABASE CONNECTION TEST');
  console.log('─'.repeat(60));
  
  if (!TURSO_CONNECTION_URL || !TURSO_AUTH_TOKEN) {
    console.log('❌ Cannot test: Missing database credentials');
    return false;
  }
  
  try {
    console.log('Connecting to Turso database...');
    const client = createClient({
      url: TURSO_CONNECTION_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
    
    // Test query
    console.log('Executing test query...');
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    console.log(`   Result: ${JSON.stringify(result.rows[0])}`);
    
    // Check users table
    console.log('\nChecking users table...');
    const usersCount = await client.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table accessible: ${usersCount.rows[0].count} users found`);
    
    // Check jobs table
    console.log('Checking jobs table...');
    const jobsCount = await client.execute('SELECT COUNT(*) as count FROM jobs');
    console.log(`✅ Jobs table accessible: ${jobsCount.rows[0].count} jobs found`);
    
    // Check for accepted orders
    console.log('Checking accepted orders...');
    const acceptedCount = await client.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'accepted'");
    console.log(`✅ Accepted orders: ${acceptedCount.rows[0].count} found`);
    
    return true;
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
    return false;
  }
}

// 3. Test API Endpoints
async function testAPIEndpoint(endpoint, method = 'GET', token = null) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, APP_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          data: data.substring(0, 200),
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        ok: false,
        error: error.message,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        ok: false,
        error: 'Request timeout',
      });
    });
    
    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('\n3️⃣ API ENDPOINTS TEST');
  console.log('─'.repeat(60));
  console.log(`Testing against: ${APP_URL}`);
  console.log('Note: Some endpoints require authentication (401 is expected)\n');
  
  const endpoints = [
    { path: '/api/jobs', name: 'Jobs API (V1)' },
    { path: '/api/v2/orders/1', name: 'Order Details API (V2)' },
    { path: '/api/v2/freelancers/available-orders', name: 'Freelancer Orders API' },
    { path: '/api/manager/orders', name: 'Manager Orders API' },
    { path: '/api/bids', name: 'Bids API' },
  ];
  
  for (const endpoint of endpoints) {
    const result = await testAPIEndpoint(endpoint.path);
    const statusIcon = result.ok ? '✅' : (result.status === 401 ? '🔐' : '❌');
    const statusText = result.status === 401 ? 'AUTH REQUIRED' : (result.ok ? 'OK' : 'FAILED');
    
    console.log(`${statusIcon} ${endpoint.name}`);
    console.log(`   Status: ${result.status} (${statusText})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
}

// 4. Test Admin Authentication
async function testAdminAuth() {
  console.log('\n4️⃣ ADMIN AUTHENTICATION TEST');
  console.log('─'.repeat(60));
  
  try {
    const loginData = JSON.stringify({
      email: 'topwriteessays@gmail.com',
      password: 'kemoda2025'
    });
    
    const result = await new Promise((resolve, reject) => {
      const url = new URL('/api/v2/auth/login', APP_URL);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length,
        },
        timeout: 5000,
      };
      
      const req = lib.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data,
          });
        });
      });
      
      req.on('error', (error) => reject(error));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(loginData);
      req.end();
    });
    
    if (result.status === 200) {
      console.log('✅ Admin login successful!');
      const parsed = JSON.parse(result.data);
      console.log(`   User: ${parsed.user?.email}`);
      console.log(`   Role: ${parsed.user?.role}`);
      console.log(`   Token: ${parsed.token?.substring(0, 20)}...`);
    } else {
      console.log(`❌ Admin login failed (Status: ${result.status})`);
      console.log(`   Response: ${result.data.substring(0, 200)}`);
    }
  } catch (error) {
    console.log('❌ Admin authentication test failed!');
    console.error('   Error:', error.message);
  }
}

// Run all tests
async function runDiagnostics() {
  const dbConnected = await testDatabaseConnection();
  await testAPIEndpoints();
  await testAdminAuth();
  
  console.log('\n═'.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Database: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`API Server: Check individual endpoints above`);
  console.log(`\nIf database is connected but APIs fail:`);
  console.log(`  1. Make sure dev server is running: npm run dev`);
  console.log(`  2. Check that port ${APP_URL.split(':').pop()} is not blocked`);
  console.log(`  3. Review API route authentication logic`);
  console.log('\n');
}

// Execute
runDiagnostics().catch(console.error);
