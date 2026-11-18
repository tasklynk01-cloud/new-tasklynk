/**
 * Comprehensive Backend Diagnostic Script
 * Tests database connectivity, API endpoints, and authentication
 * 
 * Usage: node backend-diagnostic-comprehensive.js
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function testDatabaseConnection() {
  logSection('1. DATABASE CONNECTION TEST');
  
  try {
    // Check environment variables
    if (!process.env.TURSO_CONNECTION_URL) {
      logError('TURSO_CONNECTION_URL is not set in .env file');
      return false;
    }
    logSuccess('TURSO_CONNECTION_URL is set');
    logInfo(`  URL: ${process.env.TURSO_CONNECTION_URL.substring(0, 30)}...`);
    
    if (!process.env.TURSO_AUTH_TOKEN) {
      logError('TURSO_AUTH_TOKEN is not set in .env file');
      return false;
    }
    logSuccess('TURSO_AUTH_TOKEN is set');
    logInfo(`  Token: ${process.env.TURSO_AUTH_TOKEN.substring(0, 20)}...`);
    
    // Create database client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    logInfo('Testing database connection...');
    
    // Test basic query
    const result = await client.execute('SELECT 1 as test');
    if (result.rows.length > 0) {
      logSuccess('Database connection successful!');
      return client;
    } else {
      logError('Database query returned no results');
      return false;
    }
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testDatabaseTables(client) {
  logSection('2. DATABASE TABLES TEST');
  
  try {
    // Check critical tables
    const tables = [
      'users',
      'jobs',
      'bids',
      'payments',
      'notifications',
      'messages',
      'job_messages',
      'job_files',
      'job_attachments',
      'systemSettings',
      'cpp_levels',
      'cpp_progress',
      'invitations',
      'accounts',
      'domains'
    ];
    
    for (const table of tables) {
      try {
        const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0]?.count || 0;
        logSuccess(`Table '${table}' exists with ${count} records`);
      } catch (error) {
        logError(`Table '${table}' check failed: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Database tables test failed: ${error.message}`);
    return false;
  }
}

async function testCriticalQueries(client) {
  logSection('3. CRITICAL QUERIES TEST');
  
  try {
    // Test users query
    logInfo('Testing users query...');
    const usersResult = await client.execute(`
      SELECT id, name, email, role FROM users LIMIT 5
    `);
    logSuccess(`Retrieved ${usersResult.rows.length} users`);
    usersResult.rows.forEach(user => {
      logInfo(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Test jobs query
    logInfo('\nTesting jobs query...');
    const jobsResult = await client.execute(`
      SELECT 
        id, displayId, title, status, 
        clientId, assignedFreelancerId, 
        amount, createdAt 
      FROM jobs 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
    logSuccess(`Retrieved ${jobsResult.rows.length} jobs`);
    jobsResult.rows.forEach(job => {
      logInfo(`  - ${job.displayId}: ${job.title} [${job.status}] - Amount: KSh ${job.amount}`);
    });
    
    // Test jobs by status
    logInfo('\nTesting jobs count by status...');
    const statusResult = await client.execute(`
      SELECT status, COUNT(*) as count 
      FROM jobs 
      GROUP BY status
    `);
    logSuccess('Jobs by status:');
    statusResult.rows.forEach(row => {
      logInfo(`  - ${row.status}: ${row.count} orders`);
    });
    
    // Test accepted orders (for freelancers)
    logInfo('\nTesting accepted orders (visible to freelancers)...');
    const acceptedResult = await client.execute(`
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE status = 'accepted' AND adminApproved = 1
    `);
    const acceptedCount = acceptedResult.rows[0]?.count || 0;
    logSuccess(`Found ${acceptedCount} accepted orders (ready for bidding)`);
    
    // Test user roles
    logInfo('\nTesting user roles distribution...');
    const rolesResult = await client.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    logSuccess('Users by role:');
    rolesResult.rows.forEach(row => {
      logInfo(`  - ${row.role}: ${row.count} users`);
    });
    
    return true;
  } catch (error) {
    logError(`Critical queries test failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testAuthToken() {
  logSection('4. AUTHENTICATION TOKEN TEST');
  
  try {
    if (!process.env.JWT_SECRET) {
      logError('JWT_SECRET is not set in .env file');
      return false;
    }
    
    if (process.env.JWT_SECRET.length < 32) {
      logWarning(`JWT_SECRET is too short (${process.env.JWT_SECRET.length} chars). Should be at least 32 characters.`);
    } else {
      logSuccess(`JWT_SECRET is properly configured (${process.env.JWT_SECRET.length} characters)`);
    }
    
    return true;
  } catch (error) {
    logError(`Auth token test failed: ${error.message}`);
    return false;
  }
}

async function testCloudinaryConfig() {
  logSection('5. CLOUDINARY CONFIGURATION TEST');
  
  try {
    const requiredVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    
    let allConfigured = true;
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        logError(`${varName} is not set in .env file`);
        allConfigured = false;
      } else {
        logSuccess(`${varName} is configured`);
      }
    }
    
    if (allConfigured) {
      logSuccess('Cloudinary configuration is complete');
    } else {
      logWarning('Some Cloudinary variables are missing - file uploads may fail');
    }
    
    return allConfigured;
  } catch (error) {
    logError(`Cloudinary config test failed: ${error.message}`);
    return false;
  }
}

async function testPaymentConfig() {
  logSection('6. PAYMENT CONFIGURATION TEST');
  
  try {
    // Check Paystack
    if (process.env.PAYSTACK_SECRET_KEY) {
      logSuccess('PAYSTACK_SECRET_KEY is configured');
    } else {
      logWarning('PAYSTACK_SECRET_KEY is not set - Paystack payments unavailable');
    }
    
    // Check M-Pesa
    const mpesaVars = [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET',
      'MPESA_SHORTCODE',
      'MPESA_PASSKEY'
    ];
    
    let mpesaConfigured = true;
    for (const varName of mpesaVars) {
      if (!process.env[varName]) {
        mpesaConfigured = false;
        break;
      }
    }
    
    if (mpesaConfigured) {
      logSuccess('M-Pesa configuration is complete');
    } else {
      logWarning('M-Pesa configuration incomplete - M-Pesa payments may not work');
    }
    
    return true;
  } catch (error) {
    logError(`Payment config test failed: ${error.message}`);
    return false;
  }
}

async function testEmailConfig() {
  logSection('7. EMAIL CONFIGURATION TEST');
  
  try {
    const emailVars = [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'EMAIL_FROM'
    ];
    
    let allConfigured = true;
    
    for (const varName of emailVars) {
      if (!process.env[varName]) {
        logError(`${varName} is not set in .env file`);
        allConfigured = false;
      } else {
        logSuccess(`${varName} is configured`);
      }
    }
    
    if (allConfigured) {
      logSuccess('Email configuration is complete');
    } else {
      logWarning('Email configuration incomplete - notifications may not be sent');
    }
    
    return allConfigured;
  } catch (error) {
    logError(`Email config test failed: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  log('\n╔═══════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         TaskLynk Backend Comprehensive Diagnostic Tool                        ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    database: false,
    tables: false,
    queries: false,
    auth: false,
    cloudinary: false,
    payment: false,
    email: false
  };
  
  // Test 1: Database Connection
  const client = await testDatabaseConnection();
  results.database = !!client;
  
  if (client) {
    // Test 2: Database Tables
    results.tables = await testDatabaseTables(client);
    
    // Test 3: Critical Queries
    results.queries = await testCriticalQueries(client);
  }
  
  // Test 4: Authentication
  results.auth = await testAuthToken();
  
  // Test 5: Cloudinary
  results.cloudinary = await testCloudinaryConfig();
  
  // Test 6: Payment
  results.payment = await testPaymentConfig();
  
  // Test 7: Email
  results.email = await testEmailConfig();
  
  // Final Summary
  logSection('DIAGNOSTIC SUMMARY');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  log('\nTest Results:', 'cyan');
  log(`  Database Connection:     ${results.database ? '✓ PASS' : '✗ FAIL'}`, results.database ? 'green' : 'red');
  log(`  Database Tables:         ${results.tables ? '✓ PASS' : '✗ FAIL'}`, results.tables ? 'green' : 'red');
  log(`  Critical Queries:        ${results.queries ? '✓ PASS' : '✗ FAIL'}`, results.queries ? 'green' : 'red');
  log(`  Authentication:          ${results.auth ? '✓ PASS' : '✗ FAIL'}`, results.auth ? 'green' : 'red');
  log(`  Cloudinary Config:       ${results.cloudinary ? '✓ PASS' : '⚠ WARN'}`, results.cloudinary ? 'green' : 'yellow');
  log(`  Payment Config:          ${results.payment ? '✓ PASS' : '⚠ WARN'}`, results.payment ? 'green' : 'yellow');
  log(`  Email Config:            ${results.email ? '✓ PASS' : '⚠ WARN'}`, results.email ? 'green' : 'yellow');
  
  console.log('\n' + '='.repeat(80));
  
  if (allPassed) {
    log('\n🎉 All critical tests passed! Backend is healthy.', 'green');
  } else if (results.database && results.tables && results.queries) {
    log('\n⚠️  Core backend is functional, but some configurations need attention.', 'yellow');
  } else {
    log('\n❌ Critical backend issues detected. Please fix the errors above.', 'red');
  }
  
  console.log('');
}

// Run diagnostics
runDiagnostics().catch(error => {
  logError(`Diagnostic script failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
