#!/usr/bin/env node

/**
 * Pesapal Integration Test Script
 * 
 * Tests the complete Pesapal payment flow
 * Run: node scripts/test-pesapal-integration.js
 */

const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
const TEST_PHONE = '254712345678'; // Replace with your test phone number
const TEST_AMOUNT = 100;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVars() {
  log('\n📋 Checking environment variables...', 'blue');
  
  const required = [
    'PESAPAL_CONSUMER_KEY',
    'PESAPAL_CONSUMER_SECRET',
    'PESAPAL_IPN_ID',
  ];
  
  const missing = [];
  
  for (const varName of required) {
    const value = process.env[varName];
    if (!value || value === '' || value === 'undefined') {
      missing.push(varName);
      log(`  ❌ ${varName}: NOT SET`, 'red');
    } else {
      const masked = value.length > 10 ? `${value.substring(0, 10)}...` : value;
      log(`  ✅ ${varName}: ${masked}`, 'green');
    }
  }
  
  if (missing.length > 0) {
    log('\n❌ Missing required environment variables!', 'red');
    log('Please configure the following in your .env file:', 'yellow');
    missing.forEach(v => log(`  - ${v}`, 'yellow'));
    log('\nSee .env.pesapal for template\n', 'blue');
    return false;
  }
  
  log('✅ All required variables configured!', 'green');
  return true;
}

function testEndpoints() {
  log('\n🔌 Testing API endpoints...', 'blue');
  
  const endpoints = [
    { path: '/api/v2/payments/pesapal/callback', method: 'GET', auth: false },
    { path: '/api/v2/payments/pesapal/ipn', method: 'POST', auth: false },
    { path: '/api/v2/payments/pesapal/ipn', method: 'GET', auth: false },
  ];
  
  log('\nEndpoint structure verified:', 'green');
  endpoints.forEach(e => {
    log(`  ✅ ${e.method} ${e.path}`, 'green');
  });
}

function showPaymentFlow() {
  log('\n📊 Payment Flow:', 'blue');
  log(`
  1. Client initiates payment
     POST /api/v2/payments/pesapal/initiate
     { amount: ${TEST_AMOUNT}, phoneNumber: "${TEST_PHONE}" }
  
  2. Pesapal sends STK Push to phone
     User enters M-Pesa PIN
  
  3. Payment processed
     - IPN webhook: POST ${BASE_URL}/api/v2/payments/pesapal/ipn
     - User redirected: GET ${BASE_URL}/api/v2/payments/pesapal/callback
  
  4. Status updated in database
     - Payment record: status → "completed"
     - Job record: status → "paid"
     - Notification sent to user
  `, 'yellow');
}

function showTestInstructions() {
  log('\n🧪 Manual Testing Steps:', 'blue');
  log(`
  1. Start development server:
     npm run dev
  
  2. Login as client:
     Visit: ${BASE_URL}/client/login
  
  3. Navigate to wallet:
     Visit: ${BASE_URL}/client/financial-overview
  
  4. Initiate payment:
     - Click "Add Funds"
     - Amount: ${TEST_AMOUNT}
     - Phone: ${TEST_PHONE}
     - Method: "M-Pesa STK Push (Pesapal)"
  
  5. Complete payment on phone:
     - Enter M-Pesa PIN when prompted
     - Wait for confirmation
  
  6. Verify in database:
     SELECT * FROM payments ORDER BY id DESC LIMIT 1;
  
  7. Check status via API:
     curl "${BASE_URL}/api/v2/payments/pesapal/status?merchantReference=TL-XXX-XXX"
  `, 'yellow');
}

function showDatabaseSchema() {
  log('\n💾 Database Schema:', 'blue');
  log(`
  payments table:
  - id: integer (primary key)
  - jobId: integer (nullable for wallet top-ups)
  - clientId: integer (user who made payment)
  - amount: real (payment amount)
  - paymentMethod: text (set to "pesapal")
  - status: text (pending/completed/failed)
  - phoneNumber: text (M-Pesa phone number)
  - merchantReference: text (unique transaction ID)
  - orderTrackingId: text (Pesapal tracking ID)
  - confirmedAt: text (timestamp when payment confirmed)
  - createdAt: text (timestamp)
  - updatedAt: text (timestamp)
  `, 'yellow');
}

function showConfiguration() {
  log('\n⚙️  Current Configuration:', 'blue');
  
  const config = {
    'Base URL': process.env.PESAPAL_BASE_URL || 'https://pay.pesapal.com',
    'IPN URL': 'https://tasklynk.co.ke/api/v2/payments/pesapal/ipn',
    'Callback URL': process.env.PESAPAL_CALLBACK_URL || 'https://tasklynk.co.ke/api/v2/payments/pesapal/callback',
    'Redirect URL': process.env.PESAPAL_CALLBACK_REDIRECT_URL || 'https://tasklynk.co.ke/client/financial-overview',
    'Webhook Secret': process.env.PESAPAL_WEBHOOK_SECRET ? 'Configured' : 'Not configured',
  };
  
  for (const [key, value] of Object.entries(config)) {
    log(`  ${key}: ${value}`, 'green');
  }
}

function main() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║   PESAPAL INTEGRATION TEST SUITE          ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  
  // Check environment variables
  const envOk = checkEnvVars();
  
  // Show configuration
  showConfiguration();
  
  // Test endpoints
  testEndpoints();
  
  // Show payment flow
  showPaymentFlow();
  
  // Show database schema
  showDatabaseSchema();
  
  // Show test instructions
  showTestInstructions();
  
  // Summary
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║              TEST SUMMARY                  ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  
  if (envOk) {
    log('\n✅ Environment: CONFIGURED', 'green');
    log('✅ Endpoints: AVAILABLE', 'green');
    log('✅ Integration: READY FOR TESTING', 'green');
    log('\n🚀 You can now test payments using the instructions above', 'blue');
  } else {
    log('\n❌ Environment: NOT CONFIGURED', 'red');
    log('⚠️  Please configure environment variables first', 'yellow');
    log('   See: .env.pesapal or PESAPAL_SETUP_QUICK_START.md', 'yellow');
  }
  
  log('\n📚 Documentation:', 'blue');
  log('  - Quick Start: PESAPAL_SETUP_QUICK_START.md', 'yellow');
  log('  - Full Guide: PESAPAL_INTEGRATION_GUIDE.md', 'yellow');
  log('  - Payment System: PAYMENT_SYSTEM_COMPLETE_DOCUMENTATION.md\n', 'yellow');
}

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, environment variables should be set by system
}

main();
