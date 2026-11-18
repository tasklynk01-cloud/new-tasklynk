#!/usr/bin/env node
/**
 * TaskLynk System Health Check Script
 * Verifies all critical systems are functioning properly
 * 
 * Run: bun src/scripts/health-check.ts
 */

import { db } from '@/db';
import { users, jobs, pendingRegistrations } from '@/db/schema';

async function checkDatabaseConnection() {
  try {
    const result = await db.select().from(users).limit(1);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function checkEmailService() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not configured');
      return false;
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'test@tasklynk.co.ke',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }),
    });

    if (response.status === 401 || response.status === 403) {
      console.error('❌ Email service: Invalid API key');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Email service check failed:', error);
    return false;
  }
}

async function checkCloudinaryService() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️  Cloudinary credentials not fully configured');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Cloudinary check failed:', error);
    return false;
  }
}

async function checkTableStructures() {
  try {
    // Check users table
    const users_check = await db.select().from(users).limit(1);

    // Check jobs table
    const jobs_check = await db.select().from(jobs).limit(1);

    // Check pending_registrations table
    const pending_check = await db.select().from(pendingRegistrations).limit(1);

    return true;
  } catch (error) {
    console.error('❌ Table structure check failed:', error);
    return false;
  }
}

async function checkEnvironmentVariables() {
  
  const required = [
    'DATABASE_URL',
    'RESEND_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  let allPresent = true;
  for (const key of required) {
    const value = process.env[key];
    if (value) {
    } else {
      console.warn(`⚠️  ${key}: Not set`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function runHealthCheck() {

  const checks = [
    checkEnvironmentVariables(),
    checkDatabaseConnection(),
    checkTableStructures(),
    checkEmailService(),
    checkCloudinaryService(),
  ];

  const results = await Promise.allSettled(checks);
  
  const passed = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const total = results.length;


  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runHealthCheck().catch(err => {
  console.error('❌ Health check failed:', err);
  process.exit(1);
});

