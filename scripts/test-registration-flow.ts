import 'dotenv/config';
import { NextRequest } from 'next/server';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { POST as verifyPost } from '@/app/api/auth/verify-code/route';
import { db } from '@/db';
import { pendingRegistrations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function runRegistration(role: 'client' | 'freelancer') {
  const timestamp = Date.now();
  const email = `${role}.auto.${timestamp}@example.com`;
  const password = 'Password123!';
  const name = role === 'client' ? 'Auto Test Client' : 'Auto Test Freelancer';
  const phone = role === 'client' ? '0712345678' : '0723456789';

  const registerBody = {
    email,
    password,
    name,
    role,
    phone,
  };

  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-forwarded-for': role === 'client' ? '127.0.0.1' : '127.0.0.2',
  });

  const registerRequest = new NextRequest('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers,
    body: JSON.stringify(registerBody),
  });

  const registerResponse = await registerPost(registerRequest);
  const registerJson = await registerResponse.json();

  console.log(`\n=== ${role.toUpperCase()} REGISTRATION ===`);
  console.log('Status:', registerResponse.status);
  console.log('Response:', registerJson);

  if (!registerResponse.ok) {
    throw new Error(`Registration failed for ${role}: ${registerJson.error || registerResponse.statusText}`);
  }

  const pending = await db
    .select()
    .from(pendingRegistrations)
    .where(eq(pendingRegistrations.email, email))
    .limit(1);

  if (pending.length === 0) {
    throw new Error(`Pending registration not found for ${email}`);
  }

  const verificationCode = pending[0].verificationCode;

  const verifyBody: any = {
    email,
    code: verificationCode,
  };

  if (role === 'freelancer') {
    verifyBody.subjectIds = [1, 2, 3];
    verifyBody.availabilityDays = ['monday', 'wednesday', 'friday'];
  }

  const verifyRequest = new NextRequest('http://localhost:5000/api/auth/verify-code', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      'x-forwarded-for': role === 'client' ? '127.0.0.1' : '127.0.0.2',
    }),
    body: JSON.stringify(verifyBody),
  });

  const verifyResponse = await verifyPost(verifyRequest);
  const verifyJson = await verifyResponse.json();

  console.log('Verify Status:', verifyResponse.status);
  console.log('Verify Response:', verifyJson);

  if (!verifyResponse.ok) {
    throw new Error(`Verification failed for ${role}: ${verifyJson.error || verifyResponse.statusText}`);
  }

  const userRecord = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRecord.length === 0) {
    throw new Error(`User not found in users table for ${email}`);
  }

  console.log('User inserted:', userRecord[0]);
}

async function main() {
  try {
    await runRegistration('client');
    await runRegistration('freelancer');
    console.log('\n✅ Registration and verification flow completed successfully.');
  } catch (error) {
    console.error('\n❌ Error during registration flow:', error);
    process.exitCode = 1;
  }
}

main();
