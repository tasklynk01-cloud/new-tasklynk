require('dotenv').config();

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY?.trim();
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET?.trim();
const BASE_URL = process.env.PESAPAL_BASE_URL?.trim() || 'https://pay.pesapal.com';
const IPN_ID = process.env.PESAPAL_IPN_ID?.trim();

console.log('\n=== PESAPAL AUTHENTICATION TEST ===\n');
console.log('Base URL:', BASE_URL);
console.log('Consumer Key:', CONSUMER_KEY);
console.log('Consumer Secret:', CONSUMER_SECRET ? '***' + CONSUMER_SECRET.slice(-4) : 'MISSING');
console.log('IPN ID:', IPN_ID);

async function testAuth() {
  try {
    console.log('\n[Step 1] Requesting access token...');
    
    const authPayload = {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET
    };
    
    console.log('Auth payload:', JSON.stringify(authPayload, null, 2));
    
    const authResponse = await fetch(`${BASE_URL}/v3/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(authPayload)
    });
    
    console.log('Auth Response Status:', authResponse.status, authResponse.statusText);
    
    const authText = await authResponse.text();
    console.log('Auth Response Body:', authText);
    
    if (!authResponse.ok) {
      console.error('\n❌ AUTHENTICATION FAILED');
      return;
    }
    
    const authData = JSON.parse(authText);
    console.log('\n✅ Authentication successful!');
    console.log('Status:', authData.status);
    console.log('Message:', authData.message);
    console.log('Token (first 30 chars):', authData.token?.substring(0, 30) + '...');
    console.log('Expiry Date:', authData.expiryDate);
    
    // Now test submitting an order
    console.log('\n[Step 2] Testing order submission...');
    
    const orderPayload = {
      id: `TEST-${Date.now()}`,
      currency: 'KES',
      amount: 10,
      description: 'Test payment - KSh 10',
      callback_url: 'https://tasklynk.co.ke/api/v2/payments/pesapal/callback',
      notification_id: IPN_ID,
      billing_address: {
        phone_number: '0701066845',
        first_name: 'Test',
        last_name: 'User',
        email_address: 'test@tasklynk.co.ke',
        country_code: 'KE'
      }
    };
    
    console.log('Order payload:', JSON.stringify(orderPayload, null, 2));
    
    const orderResponse = await fetch(`${BASE_URL}/v3/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify(orderPayload)
    });
    
    console.log('\nOrder Response Status:', orderResponse.status, orderResponse.statusText);
    
    const orderText = await orderResponse.text();
    console.log('Order Response Body:', orderText);
    
    if (!orderResponse.ok) {
      console.error('\n❌ ORDER SUBMISSION FAILED');
      return;
    }
    
    const orderData = JSON.parse(orderText);
    console.log('\n✅ Order submitted successfully!');
    console.log('Order tracking ID:', orderData.order_tracking_id);
    console.log('Merchant reference:', orderData.merchant_reference);
    console.log('Redirect URL:', orderData.redirect_url);
    console.log('Status:', orderData.status);
    console.log('Message:', orderData.message);
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }
}

testAuth();
