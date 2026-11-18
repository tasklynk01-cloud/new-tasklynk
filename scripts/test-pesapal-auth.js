#!/usr/bin/env node

/**
 * Test Pesapal Authentication
 * 
 * This script tests if Pesapal credentials are working correctly
 * Run: node scripts/test-pesapal-auth.js
 */

require('dotenv').config({ path: '.env' });

const BASE_URL = process.env.PESAPAL_BASE_URL || 'https://pay.pesapal.com';
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY?.trim();
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET?.trim();
const IPN_ID = process.env.PESAPAL_IPN_ID?.trim();

console.log('\n🔐 Testing Pesapal Authentication\n');
console.log('Configuration:');
console.log('  Base URL:', BASE_URL);
console.log('  Consumer Key:', CONSUMER_KEY ? `${CONSUMER_KEY.substring(0, 10)}...` : '❌ MISSING');
console.log('  Consumer Secret:', CONSUMER_SECRET ? `${CONSUMER_SECRET.substring(0, 5)}...` : '❌ MISSING');
console.log('  IPN ID:', IPN_ID ? `${IPN_ID.substring(0, 8)}...` : '❌ MISSING');
console.log('');

if (!CONSUMER_KEY || !CONSUMER_SECRET || !IPN_ID) {
  console.error('❌ Missing required credentials!');
  console.error('\nPlease update your .env file with:');
  console.error('  PESAPAL_CONSUMER_KEY=mQHar5k8QPNFTzfy6tJc77baFchUn48t');
  console.error('  PESAPAL_CONSUMER_SECRET=sXoImQmH0WQMtoUvlFjKluKlVQs=');
  console.error('  PESAPAL_IPN_ID=a0dc42d6-ee78-4bcf-9d98-db00bffce0fc');
  process.exit(1);
}

async function testAuth() {
  try {
    console.log('📡 Requesting access token from Pesapal...\n');
    
    const response = await fetch(`${BASE_URL}/v3/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
      }),
    });

    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ Authentication FAILED!\n');
      console.error('Error Details:');
      try {
        const errorJson = JSON.parse(errorText);
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        console.error(errorText);
      }
      console.error('\n💡 Troubleshooting Tips:');
      console.error('  1. Verify credentials in Pesapal Developer Dashboard');
      console.error('  2. Check if you\'re using the correct environment (sandbox vs live)');
      console.error('  3. Ensure no extra spaces or quotes in .env file');
      console.error('  4. Confirm API credentials are not expired or revoked');
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('\n✅ Authentication SUCCESSFUL!\n');
    console.log('Full Response:', JSON.stringify(data, null, 2));
    console.log('\nToken Details:');
    console.log('  Access Token:', data.token || data.access_token ? `${(data.token || data.access_token).substring(0, 20)}...` : 'N/A');
    console.log('  Token Type:', data.token_type || 'Bearer');
    console.log('  Expires In:', data.expiryDate || data.expires_in ? (data.expiryDate || `${data.expires_in} seconds`) : 'N/A');
    console.log('\n🎉 Pesapal is configured correctly!');
    console.log('\nNext Steps:');
    console.log('  1. Restart your dev server: npm run dev');
    console.log('  2. Test payment flow from client dashboard');
    console.log('  3. Monitor logs for any payment errors');
    
  } catch (error) {
    console.error('\n❌ Network Error!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Check:');
    console.error('  - Internet connection');
    console.error('  - Firewall settings');
    console.error('  - Pesapal service status');
    process.exit(1);
  }
}

testAuth();
