/**
 * Complete the registration by verifying the email
 */

const BASE_URL = 'http://localhost:5000';

const email = process.argv[2];
const code = process.argv[3];

if (!email || !code) {
  console.error('Usage: node complete-registration.js <email> <verification_code>');
  console.error('Example: node complete-registration.js test@test.com 123456');
  process.exit(1);
}

// Sample data for availability and subjects
const availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const subjectIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10 subjects (within 7-15 range)

console.log('🔐 Completing registration with email verification\n');
console.log('Configuration:');
console.log('  Email:', email);
console.log('  Code:', code);
console.log('  Availability:', availabilityDays.join(', '));
console.log('  Subject IDs:', subjectIds);
console.log('\n' + '='.repeat(60) + '\n');

async function verifyEmail() {
  try {
    console.log('Sending verification request...');
    
    const response = await fetch(`${BASE_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        code: code,
        role: 'freelancer',
        availability_days: availabilityDays,
        subject_ids: subjectIds,
      }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(`Verification failed: ${data.error || 'Unknown error'}`);
    }

    if (!data.success) {
      throw new Error(`Verification unsuccessful: ${data.error || data.message || 'Unknown error'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ REGISTRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n✓ Email verified');
    console.log('✓ User account created');
    console.log('✓ Availability saved');
    console.log('✓ Subjects saved');
    console.log('✓ User ID:', data.userId || data.user?.id || 'N/A');
    console.log('\n⚠️ Note: Freelancer accounts require admin approval.');
    console.log('   The user must wait for approval before logging in.');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyEmail();
