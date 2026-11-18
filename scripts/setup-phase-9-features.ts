#!/usr/bin/env tsx
/**
 * Phase 9: Feature Flags & Performance Setup
 * 
 * This script helps configure feature flags and performance settings.
 * Run: tsx scripts/setup-phase-9-features.ts
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

async function setupPhase9() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 9: Feature Flags & Performance                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📌 Configuring Feature Flags');
  console.log('   These control optional features in your application');
  console.log('');

  // ENABLE_RATE_LIMITING
  console.log('📌 ENABLE_RATE_LIMITING');
  console.log('   Enable rate limiting to prevent abuse?');
  console.log('   Recommended: true for production');
  const rateLimiting = await question('   Enable rate limiting? [Y/n]: ');
  const enableRateLimiting = rateLimiting.toLowerCase() !== 'n' ? 'true' : 'false';

  // ENABLE_FILE_VALIDATION
  console.log('\n📌 ENABLE_FILE_VALIDATION');
  console.log('   Enable file type and size validation?');
  console.log('   Recommended: true for security');
  const fileValidation = await question('   Enable file validation? [Y/n]: ');
  const enableFileValidation = fileValidation.toLowerCase() !== 'n' ? 'true' : 'false';

  // ENABLE_EMAIL_NOTIFICATIONS
  console.log('\n📌 ENABLE_EMAIL_NOTIFICATIONS');
  console.log('   Enable email notifications?');
  console.log('   Recommended: true for user engagement');
  const emailNotifications = await question('   Enable email notifications? [Y/n]: ');
  const enableEmailNotifications = emailNotifications.toLowerCase() !== 'n' ? 'true' : 'false';

  console.log('\n📌 Configuring Performance Settings');
  console.log('');

  // MAX_FILE_UPLOAD_SIZE_MB
  console.log('📌 MAX_FILE_UPLOAD_SIZE_MB');
  console.log('   Maximum file upload size in megabytes');
  console.log('   Recommended: 15-40 MB depending on your needs');
  const maxFileSize = await question('   Enter MAX_FILE_UPLOAD_SIZE_MB [15]: ') || '15';

  if (!/^\d+$/.test(maxFileSize)) {
    console.error('❌ MAX_FILE_UPLOAD_SIZE_MB must be a number');
    process.exit(1);
  }

  // RATE_LIMIT_LOGIN_MAX_ATTEMPTS
  console.log('\n📌 RATE_LIMIT_LOGIN_MAX_ATTEMPTS');
  console.log('   Maximum login attempts before rate limiting');
  console.log('   Recommended: 5 attempts');
  const maxAttempts = await question('   Enter RATE_LIMIT_LOGIN_MAX_ATTEMPTS [5]: ') || '5';

  if (!/^\d+$/.test(maxAttempts)) {
    console.error('❌ RATE_LIMIT_LOGIN_MAX_ATTEMPTS must be a number');
    process.exit(1);
  }

  // RATE_LIMIT_LOGIN_WINDOW_MINUTES
  console.log('\n📌 RATE_LIMIT_LOGIN_WINDOW_MINUTES');
  console.log('   Time window for rate limiting (in minutes)');
  console.log('   Recommended: 15 minutes');
  const windowMinutes = await question('   Enter RATE_LIMIT_LOGIN_WINDOW_MINUTES [15]: ') || '15';

  if (!/^\d+$/.test(windowMinutes)) {
    console.error('❌ RATE_LIMIT_LOGIN_WINDOW_MINUTES must be a number');
    process.exit(1);
  }

  // Generate .env entries
  const envEntries = [
    '# Phase 9: Feature Flags & Performance',
    '# Feature Flags',
    `ENABLE_RATE_LIMITING=${enableRateLimiting}`,
    `ENABLE_FILE_VALIDATION=${enableFileValidation}`,
    `ENABLE_EMAIL_NOTIFICATIONS=${enableEmailNotifications}`,
    '',
    '# Performance Settings',
    `MAX_FILE_UPLOAD_SIZE_MB=${maxFileSize}`,
    `RATE_LIMIT_LOGIN_MAX_ATTEMPTS=${maxAttempts}`,
    `RATE_LIMIT_LOGIN_WINDOW_MINUTES=${windowMinutes}`,
    '',
  ];

  console.log('\n✅ Phase 9 Configuration:');
  console.log('\n   Feature Flags:');
  console.log('   - Rate Limiting:', enableRateLimiting);
  console.log('   - File Validation:', enableFileValidation);
  console.log('   - Email Notifications:', enableEmailNotifications);
  console.log('\n   Performance Settings:');
  console.log('   - Max File Size:', maxFileSize, 'MB');
  console.log('   - Login Max Attempts:', maxAttempts);
  console.log('   - Login Window:', windowMinutes, 'minutes');

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase9');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase9 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Test features in the application');
  console.log('   4. Run: tsx scripts/setup-phase-10-monitoring.ts (Optional)');

  rl.close();
}

setupPhase9().catch(console.error);

