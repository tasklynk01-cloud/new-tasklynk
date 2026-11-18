#!/usr/bin/env node
/**
 * COMPREHENSIVE DIAGNOSTIC REPORT
 * TaskLynk Academic Space - Full System Check
 * Generated: December 8, 2025
 */

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        TASKLYNK FULL DIAGNOSTIC REPORT                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

const diagnostics = {
  passed: [],
  warnings: [],
  failed: [],
  critical: []
};

// ============================================================================
// 1. ENVIRONMENT SETUP CHECK
// ============================================================================
section('1. ENVIRONMENT SETUP CHECK');

// Check Node.js version
const nodeVersion = process.version;
const requiredNodeVersion = 'v20';
log(`   Node.js Version: ${nodeVersion}`);
if (nodeVersion.startsWith('v20') || nodeVersion.startsWith('v22') || nodeVersion.startsWith('v24')) {
  log('   ✅ Node.js version compatible', colors.green);
  diagnostics.passed.push('Node.js version');
} else {
  log(`   ⚠️  Recommended: Node.js v20.x or higher`, colors.yellow);
  diagnostics.warnings.push('Node.js version not optimal');
}

// Check .env file
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);
log(`\n   .env file: ${envExists ? 'EXISTS' : 'MISSING'}`);
if (envExists) {
  log('   ✅ Environment file found', colors.green);
  diagnostics.passed.push('.env file exists');
} else {
  log('   ❌ CRITICAL: .env file not found!', colors.red);
  diagnostics.critical.push('.env file missing');
}

// ============================================================================
// 2. ENVIRONMENT VARIABLES VALIDATION
// ============================================================================
section('2. ENVIRONMENT VARIABLES VALIDATION');

require('dotenv').config();

const requiredVars = {
  'Core': [
    'NODE_ENV',
    'NEXT_PUBLIC_APP_URL',
  ],
  'Security': [
    'JWT_SECRET',
  ],
  'Database': [
    'TURSO_CONNECTION_URL',
    'TURSO_AUTH_TOKEN',
  ],
  'Email': [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
  ],
  'Storage': [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ],
  'Payments': [
    'PAYSTACK_SECRET_KEY',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
  ]
};

let totalVars = 0;
let foundVars = 0;
let missingCritical = [];

for (const [category, vars] of Object.entries(requiredVars)) {
  log(`\n   ${category}:`);
  for (const varName of vars) {
    totalVars++;
    const value = process.env[varName];
    const exists = value && value.trim() !== '' && !value.includes('your-') && !value.includes('your_');
    
    if (exists) {
      log(`      ✅ ${varName}`, colors.green);
      foundVars++;
    } else {
      log(`      ❌ ${varName} - MISSING or PLACEHOLDER`, colors.red);
      missingCritical.push(varName);
    }
  }
}

log(`\n   Summary: ${foundVars}/${totalVars} variables configured`);
if (missingCritical.length === 0) {
  log('   ✅ All required environment variables configured', colors.green);
  diagnostics.passed.push('Environment variables');
} else {
  log(`   ❌ CRITICAL: ${missingCritical.length} variables missing`, colors.red);
  diagnostics.critical.push(`${missingCritical.length} environment variables missing`);
}

// ============================================================================
// 3. DATABASE CONNECTIVITY
// ============================================================================
section('3. DATABASE CONNECTIVITY TEST');

const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (tursoUrl && tursoToken) {
  log('   Connection URL: ✅ Configured');
  log('   Auth Token: ✅ Configured');
  
  // Validate URL format
  if (tursoUrl.startsWith('libsql://') && tursoUrl.endsWith('.turso.io')) {
    log('   ✅ Turso URL format valid', colors.green);
    diagnostics.passed.push('Database URL format');
  } else if (tursoUrl.includes('your-database')) {
    log('   ❌ CRITICAL: Using placeholder database URL!', colors.red);
    log('   Action: Replace with actual Turso database URL', colors.yellow);
    diagnostics.critical.push('Database URL is placeholder');
  } else {
    log('   ⚠️  Database URL format unusual', colors.yellow);
    diagnostics.warnings.push('Database URL format');
  }
  
  // Check token length
  if (tursoToken.length < 20) {
    log('   ❌ Auth token appears invalid (too short)', colors.red);
    diagnostics.critical.push('Database auth token invalid');
  } else if (tursoToken.includes('your_turso')) {
    log('   ❌ CRITICAL: Using placeholder auth token!', colors.red);
    diagnostics.critical.push('Database auth token is placeholder');
  } else {
    log('   ✅ Auth token format appears valid', colors.green);
    diagnostics.passed.push('Database auth token');
  }
} else {
  log('   ❌ CRITICAL: Database credentials not configured', colors.red);
  diagnostics.critical.push('Database credentials missing');
}

// ============================================================================
// 4. FILE STRUCTURE VALIDATION
// ============================================================================
section('4. FILE STRUCTURE VALIDATION');

const criticalPaths = [
  'src/db/schema.ts',
  'src/lib/db.ts',
  'src/middleware.ts',
  'src/app/api/v2/auth/login/route.ts',
  'drizzle.config.ts',
  'next.config.ts',
  'package.json',
];

let missingFiles = [];
for (const filePath of criticalPaths) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  if (exists) {
    log(`   ✅ ${filePath}`, colors.green);
  } else {
    log(`   ❌ ${filePath} - MISSING`, colors.red);
    missingFiles.push(filePath);
  }
}

if (missingFiles.length === 0) {
  diagnostics.passed.push('Critical files present');
} else {
  diagnostics.critical.push(`${missingFiles.length} critical files missing`);
}

// ============================================================================
// 5. DEPENDENCIES CHECK
// ============================================================================
section('5. DEPENDENCIES CHECK');

const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
log(`   node_modules folder: ${nodeModulesExists ? 'EXISTS' : 'MISSING'}`);

if (nodeModulesExists) {
  log('   ✅ Dependencies installed', colors.green);
  diagnostics.passed.push('Dependencies installed');
  
  // Check critical dependencies
  const criticalDeps = [
    'next',
    'react',
    '@libsql/client',
    'drizzle-orm',
    'cloudinary',
    'nodemailer',
  ];
  
  log('\n   Critical dependencies:');
  for (const dep of criticalDeps) {
    const depPath = path.join(process.cwd(), 'node_modules', dep);
    const exists = fs.existsSync(depPath);
    if (exists) {
      log(`      ✅ ${dep}`, colors.green);
    } else {
      log(`      ❌ ${dep} - NOT FOUND`, colors.red);
      diagnostics.failed.push(`Dependency: ${dep}`);
    }
  }
} else {
  log('   ❌ CRITICAL: Dependencies not installed', colors.red);
  log('   Action: Run "npm install"', colors.yellow);
  diagnostics.critical.push('Dependencies not installed');
}

// ============================================================================
// 6. BUILD ARTIFACTS CHECK
// ============================================================================
section('6. BUILD ARTIFACTS CHECK');

const nextFolder = fs.existsSync(path.join(process.cwd(), '.next'));
log(`   .next folder: ${nextFolder ? 'EXISTS' : 'NOT FOUND'}`);

if (nextFolder) {
  log('   ℹ️  Previous build artifacts found (this is normal)', colors.cyan);
  diagnostics.passed.push('Build folder exists');
} else {
  log('   ℹ️  No previous build (run "npm run build" first)', colors.cyan);
}

// ============================================================================
// 7. PORT AVAILABILITY
// ============================================================================
section('7. APPLICATION CONFIGURATION');

const port = process.env.PORT || 5000;
log(`   Application Port: ${port}`);
log(`   App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}`);

if (process.env.NEXT_PUBLIC_APP_URL) {
  log('   ✅ App URL configured', colors.green);
  diagnostics.passed.push('App URL configured');
} else {
  log('   ⚠️  App URL not configured (will use localhost)', colors.yellow);
  diagnostics.warnings.push('App URL not configured');
}

// ============================================================================
// 8. EMAIL CONFIGURATION
// ============================================================================
section('8. EMAIL CONFIGURATION');

const emailVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'];
let emailConfigured = true;

for (const varName of emailVars) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('your-')) {
    emailConfigured = false;
    log(`   ❌ ${varName} - Not configured`, colors.red);
  } else {
    log(`   ✅ ${varName}`, colors.green);
  }
}

if (emailConfigured) {
  diagnostics.passed.push('Email configuration');
} else {
  diagnostics.critical.push('Email configuration incomplete');
}

// ============================================================================
// 9. STORAGE CONFIGURATION
// ============================================================================
section('9. STORAGE CONFIGURATION (Cloudinary)');

const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let cloudinaryConfigured = true;

for (const varName of cloudinaryVars) {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('your-')) {
    cloudinaryConfigured = false;
    log(`   ❌ ${varName} - Not configured`, colors.red);
  } else {
    log(`   ✅ ${varName}`, colors.green);
  }
}

if (cloudinaryConfigured) {
  diagnostics.passed.push('Cloudinary configuration');
} else {
  diagnostics.critical.push('Cloudinary configuration incomplete');
}

// ============================================================================
// 10. PAYMENT GATEWAYS
// ============================================================================
section('10. PAYMENT GATEWAYS');

// Paystack
log('   Paystack:');
const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
const paystackPublic = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

if (paystackSecret && !paystackSecret.includes('your_')) {
  log('      ✅ Secret Key configured', colors.green);
} else {
  log('      ❌ Secret Key missing', colors.red);
}

if (paystackPublic && !paystackPublic.includes('your_')) {
  log('      ✅ Public Key configured', colors.green);
} else {
  log('      ❌ Public Key missing', colors.red);
}

// M-Pesa
log('\n   M-Pesa (Optional):');
const mpesaConsumer = process.env.MPESA_CONSUMER_KEY;
if (mpesaConsumer && !mpesaConsumer.includes('your_')) {
  log('      ✅ Configured', colors.green);
} else {
  log('      ℹ️  Not configured (optional)', colors.cyan);
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
section('DIAGNOSTIC SUMMARY');

console.log(`   ${colors.green}✅ PASSED: ${diagnostics.passed.length} checks${colors.reset}`);
console.log(`   ${colors.yellow}⚠️  WARNINGS: ${diagnostics.warnings.length} checks${colors.reset}`);
console.log(`   ${colors.red}❌ FAILED: ${diagnostics.failed.length} checks${colors.reset}`);
console.log(`   ${colors.red}🔴 CRITICAL: ${diagnostics.critical.length} checks${colors.reset}`);

if (diagnostics.critical.length > 0) {
  console.log(`\n${colors.red}   CRITICAL ISSUES FOUND:${colors.reset}`);
  diagnostics.critical.forEach(issue => {
    console.log(`   ${colors.red}   • ${issue}${colors.reset}`);
  });
}

if (diagnostics.warnings.length > 0) {
  console.log(`\n${colors.yellow}   WARNINGS:${colors.reset}`);
  diagnostics.warnings.forEach(issue => {
    console.log(`   ${colors.yellow}   • ${issue}${colors.reset}`);
  });
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================
section('RECOMMENDED ACTIONS');

if (diagnostics.critical.length > 0) {
  console.log(`${colors.red}   ⚠️  CRITICAL ACTIONS REQUIRED:${colors.reset}\n`);
  
  if (!envExists) {
    console.log('   1. Create .env file from .env.example:');
    console.log('      copy .env.example .env');
  }
  
  if (missingCritical.includes('TURSO_CONNECTION_URL')) {
    console.log('\n   2. Configure Turso database:');
    console.log('      • Go to https://turso.tech');
    console.log('      • Create new database');
    console.log('      • Get connection URL and auth token');
    console.log('      • Add to .env file');
  }
  
  if (missingCritical.includes('JWT_SECRET')) {
    console.log('\n   3. Generate JWT secret:');
    console.log('      openssl rand -base64 32');
    console.log('      • Add result to .env as JWT_SECRET');
  }
  
  if (missingCritical.some(v => v.startsWith('SMTP_'))) {
    console.log('\n   4. Configure email (HostAfrica SMTP):');
    console.log('      • SMTP_HOST: mail.tasklynk.co.ke');
    console.log('      • SMTP_PORT: 587');
    console.log('      • SMTP_USER: your email');
    console.log('      • SMTP_PASSWORD: your password');
  }
  
  if (missingCritical.some(v => v.startsWith('CLOUDINARY_'))) {
    console.log('\n   5. Configure Cloudinary storage:');
    console.log('      • Go to https://cloudinary.com');
    console.log('      • Get API credentials');
    console.log('      • Add to .env file');
  }
  
  if (!nodeModulesExists) {
    console.log('\n   6. Install dependencies:');
    console.log('      npm install');
  }
  
  console.log(`\n${colors.cyan}   After fixing critical issues, run:${colors.reset}`);
  console.log('      npm run verify-env');
  console.log('      npm run db:status');
  console.log('      npm run dev');
  
} else if (diagnostics.warnings.length > 0) {
  console.log(`${colors.yellow}   ⚠️  RECOMMENDED IMPROVEMENTS:${colors.reset}\n`);
  console.log('   • Review warnings above');
  console.log('   • Application should work but may have limited functionality');
  
} else {
  console.log(`${colors.green}   ✅ ALL CHECKS PASSED!${colors.reset}\n`);
  console.log('   Your application is ready to run:');
  console.log('      npm run dev');
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  Diagnostic Complete                                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Exit code
if (diagnostics.critical.length > 0) {
  process.exit(1);
} else if (diagnostics.failed.length > 0) {
  process.exit(2);
} else {
  process.exit(0);
}
