#!/usr/bin/env node
/**
 * Environment Variables Checklist for Deployment
 * Run this before deploying to verify all required variables are set
 */

const requiredVars = {
  'Security & Authentication': [
    'JWT_SECRET',
    'NODE_ENV'
  ],
  'Database (Turso)': [
    'TURSO_CONNECTION_URL',
    'TURSO_AUTH_TOKEN'
  ],
  'File Storage (Cloudinary)': [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_FOLDER'
  ],
  'Email (SMTP)': [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM'
  ],
  'Payments (Paystack)': [
    'PAYSTACK_SECRET_KEY',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY'
  ],
  'Application': [
    'NEXT_PUBLIC_APP_URL'
  ]
};

const optionalVars = {
  'M-Pesa Integration (Optional)': [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_PASSKEY',
    'MPESA_CALLBACK_URL'
  ],
  'Pesapal Integration (Optional)': [
    'PESAPAL_CONSUMER_KEY',
    'PESAPAL_CONSUMER_SECRET',
    'PESAPAL_IPN_ID',
    'PESAPAL_BASE_URL',
    'PESAPAL_CALLBACK_URL'
  ]
};

console.log('\n🔍 TaskLynk Environment Variables Checklist\n');
console.log('=' .repeat(60));

let missingRequired = [];
let foundRequired = [];
let missingOptional = [];
let foundOptional = [];

// Check required variables
Object.entries(requiredVars).forEach(([category, vars]) => {
  console.log(`\n📋 ${category}:`);
  vars.forEach(varName => {
    const value = process.env[varName];
    const exists = value && value !== 'your-' && value !== 'undefined';
    
    if (exists) {
      console.log(`  ✅ ${varName} = ${maskValue(value)}`);
      foundRequired.push(varName);
    } else {
      console.log(`  ❌ ${varName} = NOT SET`);
      missingRequired.push(varName);
    }
  });
});

// Check optional variables
Object.entries(optionalVars).forEach(([category, vars]) => {
  console.log(`\n📋 ${category}:`);
  vars.forEach(varName => {
    const value = process.env[varName];
    const exists = value && value !== 'your-' && value !== 'undefined';
    
    if (exists) {
      console.log(`  ✅ ${varName} = ${maskValue(value)}`);
      foundOptional.push(varName);
    } else {
      console.log(`  ⚠️  ${varName} = NOT SET (optional)`);
      missingOptional.push(varName);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');
console.log(`✅ Required variables set: ${foundRequired.length}/${foundRequired.length + missingRequired.length}`);
console.log(`⚠️  Optional variables set: ${foundOptional.length}/${foundOptional.length + missingOptional.length}`);

if (missingRequired.length > 0) {
  console.log('\n❌ MISSING REQUIRED VARIABLES:');
  missingRequired.forEach(v => console.log(`   - ${v}`));
  console.log('\n⚠️  WARNING: Deployment will fail without these variables!');
  console.log('   Add them to your .env file or hosting platform.\n');
  process.exit(1);
} else {
  console.log('\n✅ All required variables are set!');
  console.log('   You can proceed with deployment.\n');
  
  if (missingOptional.length > 0) {
    console.log('ℹ️  Optional variables not set:');
    missingOptional.forEach(v => console.log(`   - ${v}`));
    console.log('   These are not required but enable additional features.\n');
  }
  
  process.exit(0);
}

function maskValue(value) {
  if (!value) return 'NOT SET';
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}
