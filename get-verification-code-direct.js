/**
 * Get verification code for a pending registration using Turso directly
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.error('Usage: node get-verification-code-direct.js <email>');
  process.exit(1);
}

async function getVerificationCode() {
  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('Fetching verification code for:', email);
    
    const result = await client.execute({
      sql: 'SELECT * FROM pending_registrations WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      args: [email],
    });

    if (result.rows.length === 0) {
      console.error('❌ No pending registration found for:', email);
      process.exit(1);
    }

    const registration = result.rows[0];
    
    console.log('\n✅ Pending Registration Found:');
    console.log('  Email:', registration.email);
    console.log('  Verification Code:', registration.verification_code);
    console.log('  Role:', registration.role);
    console.log('  Created:', registration.created_at);
    console.log('  Expires:', registration.expires_at);
    console.log('\n📋 Copy this code:', registration.verification_code);
    
    return registration.verification_code;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getVerificationCode();
