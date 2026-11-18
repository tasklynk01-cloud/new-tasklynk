#!/usr/bin/env tsx
/**
 * Phase 4: Email Configuration Setup
 * 
 * This script helps configure SMTP email settings.
 * Run: tsx scripts/setup-phase-4-email.ts
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function setupPhase4() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 4: Email Configuration (SMTP)                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📌 Getting SMTP Settings');
  console.log('   For HostAfrica:');
  console.log('   1. Login to HostAfrica control panel');
  console.log('   2. Go to Email → SMTP Settings');
  console.log('   3. Note: Host, Port, Username, Password');
  console.log('');

  // SMTP_HOST
  console.log('📌 SMTP_HOST');
  console.log('   Example: mail.tasklynk.co.ke');
  const smtpHost = await question('   Enter SMTP_HOST: ');
  
  if (!smtpHost) {
    console.error('❌ SMTP_HOST is required');
    process.exit(1);
  }

  // SMTP_PORT
  console.log('\n📌 SMTP_PORT');
  console.log('   Use 587 for STARTTLS (recommended)');
  console.log('   Use 465 for SSL');
  const smtpPort = await question('   Enter SMTP_PORT [587]: ') || '587';
  
  if (!['587', '465'].includes(smtpPort)) {
    console.warn('⚠️  Warning: Port should typically be 587 or 465');
    const continueAnyway = await question('   Continue anyway? [y/N]: ');
    if (continueAnyway.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // SMTP_USER
  console.log('\n📌 SMTP_USER');
  console.log('   Your email address (e.g., admn@tasklynk.co.ke)');
  const smtpUser = await question('   Enter SMTP_USER: ');
  
  if (!smtpUser) {
    console.error('❌ SMTP_USER is required');
    process.exit(1);
  }

  if (!validateEmail(smtpUser)) {
    console.error('❌ SMTP_USER must be a valid email address');
    process.exit(1);
  }

  // SMTP_PASSWORD
  console.log('\n📌 SMTP_PASSWORD');
  console.log('   Your email account password');
  const smtpPassword = await question('   Enter SMTP_PASSWORD: ');
  
  if (!smtpPassword) {
    console.error('❌ SMTP_PASSWORD is required');
    process.exit(1);
  }

  // EMAIL_FROM
  console.log('\n📌 EMAIL_FROM');
  console.log('   Email address to send from (usually same as SMTP_USER)');
  const emailFrom = await question(`   Enter EMAIL_FROM [${smtpUser}]: `) || smtpUser;
  
  if (!validateEmail(emailFrom)) {
    console.error('❌ EMAIL_FROM must be a valid email address');
    process.exit(1);
  }

  // Generate .env entries
  const envEntries = [
    '# Phase 4: Email Configuration (SMTP)',
    `SMTP_HOST=${smtpHost}`,
    `SMTP_PORT=${smtpPort}`,
    `SMTP_USER=${smtpUser}`,
    `SMTP_PASSWORD=${smtpPassword}`,
    `EMAIL_FROM=${emailFrom}`,
    '',
  ];

  console.log('\n✅ Phase 4 Configuration:');
  console.log('   SMTP_HOST:', smtpHost);
  console.log('   SMTP_PORT:', smtpPort);
  console.log('   SMTP_USER:', smtpUser);
  console.log('   SMTP_PASSWORD:', '*'.repeat(smtpPassword.length));
  console.log('   EMAIL_FROM:', emailFrom);

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase4');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase4 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Test email sending (if test endpoint available)');
  console.log('   4. Run: tsx scripts/setup-phase-5-storage.ts');

  rl.close();
}

setupPhase4().catch(console.error);

