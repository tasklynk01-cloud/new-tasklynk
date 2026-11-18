#!/usr/bin/env node

/**
 * Pesapal Setup Helper Script
 * 
 * This script helps you configure Pesapal payment integration for TaskLynk.
 * Run: node scripts/setup-pesapal.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('\n🔧 TaskLynk Pesapal Setup\n');
console.log('This script will help you configure Pesapal payment integration.\n');

const credentials = {
  PESAPAL_CONSUMER_KEY: '',
  PESAPAL_CONSUMER_SECRET: '',
  PESAPAL_IPN_ID: '',
  PESAPAL_BASE_URL: 'https://pay.pesapal.com',
  PESAPAL_CALLBACK_URL: 'https://tasklynk.co.ke/api/v2/payments/pesapal/callback',
  PESAPAL_CALLBACK_REDIRECT_URL: 'https://tasklynk.co.ke/client/financial-overview',
  PESAPAL_WEBHOOK_SECRET: ''
};

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('📋 Step 1: Pesapal Account Setup\n');
  console.log('Before proceeding, you need:');
  console.log('1. Pesapal merchant account (https://www.pesapal.com/)');
  console.log('2. Consumer Key and Consumer Secret from Pesapal Dashboard');
  console.log('3. Registered IPN URL: https://tasklynk.co.ke/api/v2/payments/pesapal/ipn');
  console.log('4. IPN ID from Pesapal after IPN registration\n');

  const proceed = await question('Do you have all the required information? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\n❌ Setup cancelled. Please gather the required information first.\n');
    console.log('Visit: https://developer.pesapal.com/ to get started.\n');
    rl.close();
    return;
  }

  console.log('\n📝 Step 2: Enter Your Credentials\n');

  credentials.PESAPAL_CONSUMER_KEY = await question('Enter Pesapal Consumer Key: ');
  credentials.PESAPAL_CONSUMER_SECRET = await question('Enter Pesapal Consumer Secret: ');
  credentials.PESAPAL_IPN_ID = await question('Enter Pesapal IPN ID: ');
  
  const env = await question('Environment (sandbox/live) [live]: ');
  if (env.toLowerCase() === 'sandbox') {
    credentials.PESAPAL_BASE_URL = 'https://cybqa.pesapal.com';
    console.log('✓ Using sandbox environment');
  } else {
    credentials.PESAPAL_BASE_URL = 'https://pay.pesapal.com';
    console.log('✓ Using live environment');
  }

  const webhookSecret = await question('Enter Webhook Secret (optional, press Enter to skip): ');
  if (webhookSecret.trim()) {
    credentials.PESAPAL_WEBHOOK_SECRET = webhookSecret.trim();
  }

  console.log('\n📄 Step 3: Update .env File\n');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✓ Found existing .env file');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log('✓ Creating .env from .env.example');
  } else {
    console.error('❌ Error: Neither .env nor .env.example found');
    rl.close();
    return;
  }

  // Update or add Pesapal credentials
  for (const [key, value] of Object.entries(credentials)) {
    if (!value) continue;
    
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated successfully!\n');

  console.log('🎉 Setup Complete!\n');
  console.log('Next steps:');
  console.log('1. Verify your Pesapal dashboard settings');
  console.log('2. Ensure IPN URL is registered: https://tasklynk.co.ke/api/v2/payments/pesapal/ipn');
  console.log('3. Test payment flow with a small amount');
  console.log('4. Monitor logs for any errors\n');

  console.log('📋 Configuration Summary:');
  console.log(`   Consumer Key: ${credentials.PESAPAL_CONSUMER_KEY.substring(0, 10)}...`);
  console.log(`   IPN ID: ${credentials.PESAPAL_IPN_ID}`);
  console.log(`   Environment: ${credentials.PESAPAL_BASE_URL}`);
  console.log(`   IPN URL: https://tasklynk.co.ke/api/v2/payments/pesapal/ipn`);
  console.log(`   Callback URL: ${credentials.PESAPAL_CALLBACK_URL}`);
  console.log(`   Webhook Secret: ${credentials.PESAPAL_WEBHOOK_SECRET ? 'Configured' : 'Not configured'}\n`);

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
