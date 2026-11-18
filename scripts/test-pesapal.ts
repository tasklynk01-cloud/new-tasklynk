// Test Pesapal API connection
import 'dotenv/config';

const BASE_URL = process.env.PESAPAL_BASE_URL || 'https://pay.pesapal.com';
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.env.PESAPAL_CONSUMER_SECRET;
const IPN_ID = process.env.PESAPAL_IPN_ID;

async function testPesapal() {
  console.log('=== Testing Pesapal API ===');
  console.log('Base URL:', BASE_URL);
  console.log('Consumer Key:', CONSUMER_KEY?.substring(0, 10) + '...');
  console.log('Consumer Secret:', CONSUMER_SECRET?.substring(0, 10) + '...');
  console.log('IPN ID:', IPN_ID);
  console.log('');
  
  try {
    console.log('Requesting auth token...');
    const res = await fetch(`${BASE_URL}/v3/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        consumer_key: CONSUMER_KEY, 
        consumer_secret: CONSUMER_SECRET 
      }),
    });
    
    console.log('Response status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.token) {
      console.log('\n✅ SUCCESS! Token received.');
      console.log('Token preview:', data.token.substring(0, 30) + '...');
      console.log('Expires:', data.expiryDate);
    } else {
      console.log('\n❌ FAILED:', data.message || data.error);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testPesapal();
