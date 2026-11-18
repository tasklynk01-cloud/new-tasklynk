require('dotenv').config();

const BASE_URL = 'http://localhost:5000'; // Change to production URL if testing prod
const PHONE = '0701066845';
const AMOUNT = 10;

// Test credentials (replace with actual test user credentials)
const TEST_USER_EMAIL = 'client@test.com';
const TEST_USER_PASSWORD = 'client123';

async function testPaymentFlow() {
  try {
    console.log('\n=== PESAPAL PAYMENT FLOW TEST ===\n');
    
    // Step 1: Login
    console.log('[Step 1] Logging in as test client...');
    const loginResponse = await fetch(`${BASE_URL}/api/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Logged in successfully');
    console.log('User:', loginData.user.name, '(ID:', loginData.user.id + ')');
    console.log('Token:', token.substring(0, 20) + '...\n');
    
    // Step 2: Initiate payment
    console.log('[Step 2] Initiating payment...');
    const paymentResponse = await fetch(`${BASE_URL}/api/v2/payments/pesapal/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: AMOUNT,
        phoneNumber: PHONE,
        description: 'Test payment - KSh 10'
      })
    });
    
    const paymentText = await paymentResponse.text();
    console.log('Payment Response Status:', paymentResponse.status);
    console.log('Payment Response Body:', paymentText);
    
    if (!paymentResponse.ok) {
      console.error('\n❌ PAYMENT INITIATION FAILED');
      return;
    }
    
    const paymentData = JSON.parse(paymentText);
    console.log('\n✅ Payment initiated successfully!');
    console.log('Payment ID:', paymentData.payment.id);
    console.log('Order Tracking ID:', paymentData.orderTrackingId);
    console.log('Merchant Reference:', paymentData.merchantReference);
    console.log('Redirect URL:', paymentData.redirectUrl);
    
    console.log('\n📱 Next Steps:');
    console.log('1. Open this URL in your browser:', paymentData.redirectUrl);
    console.log('2. Complete the payment using M-PESA');
    console.log('3. Check payment status using:');
    console.log(`   GET ${BASE_URL}/api/v2/payments/pesapal/status?orderTrackingId=${paymentData.orderTrackingId}`);
    
    console.log('\n=== TEST COMPLETE ===\n');
    console.log('Payment URL:', paymentData.redirectUrl);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }
}

testPaymentFlow();
