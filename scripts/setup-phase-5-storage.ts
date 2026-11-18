#!/usr/bin/env tsx
/**
 * Phase 5: File Storage (Cloudinary) Setup
 * 
 * This script helps configure Cloudinary file storage.
 * Run: tsx scripts/setup-phase-5-storage.ts
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

async function setupPhase5() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 5: File Storage (Cloudinary)                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📌 Getting Cloudinary Credentials');
  console.log('   1. Go to: https://cloudinary.com/console');
  console.log('   2. Login to your account');
  console.log('   3. Dashboard → Account Details');
  console.log('   4. Copy: Cloud Name, API Key, API Secret');
  console.log('');

  // CLOUDINARY_CLOUD_NAME
  console.log('📌 CLOUDINARY_CLOUD_NAME');
  console.log('   Your Cloudinary cloud name (e.g., deicqit1a)');
  const cloudName = await question('   Enter CLOUDINARY_CLOUD_NAME: ');
  
  if (!cloudName) {
    console.error('❌ CLOUDINARY_CLOUD_NAME is required');
    process.exit(1);
  }

  // CLOUDINARY_API_KEY
  console.log('\n📌 CLOUDINARY_API_KEY');
  console.log('   Your Cloudinary API key (numeric)');
  const apiKey = await question('   Enter CLOUDINARY_API_KEY: ');
  
  if (!apiKey) {
    console.error('❌ CLOUDINARY_API_KEY is required');
    process.exit(1);
  }

  if (!/^\d+$/.test(apiKey)) {
    console.warn('⚠️  Warning: API Key should be numeric');
    const continueAnyway = await question('   Continue anyway? [y/N]: ');
    if (continueAnyway.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // CLOUDINARY_API_SECRET
  console.log('\n📌 CLOUDINARY_API_SECRET');
  console.log('   Your Cloudinary API secret');
  const apiSecret = await question('   Enter CLOUDINARY_API_SECRET: ');
  
  if (!apiSecret) {
    console.error('❌ CLOUDINARY_API_SECRET is required');
    process.exit(1);
  }

  // CLOUDINARY_UPLOAD_PRESET (Optional)
  console.log('\n📌 CLOUDINARY_UPLOAD_PRESET (Optional)');
  console.log('   Upload preset name (if you have one configured)');
  console.log('   Press Enter to skip');
  const uploadPreset = await question('   Enter CLOUDINARY_UPLOAD_PRESET [skip]: ');

  // CLOUDINARY_FOLDER (Optional)
  console.log('\n📌 CLOUDINARY_FOLDER (Optional)');
  console.log('   Folder name for organizing uploads');
  const folderName = await question('   Enter CLOUDINARY_FOLDER [TaskLynk_Storage]: ') || 'TaskLynk_Storage';

  // Generate .env entries
  const envEntries = [
    '# Phase 5: File Storage (Cloudinary)',
    `CLOUDINARY_CLOUD_NAME=${cloudName}`,
    `CLOUDINARY_API_KEY=${apiKey}`,
    `CLOUDINARY_API_SECRET=${apiSecret}`,
  ];

  if (uploadPreset) {
    envEntries.push(`CLOUDINARY_UPLOAD_PRESET=${uploadPreset}`);
  }

  if (folderName) {
    envEntries.push(`CLOUDINARY_FOLDER=${folderName}`);
  }

  envEntries.push('');

  console.log('\n✅ Phase 5 Configuration:');
  console.log('   CLOUDINARY_CLOUD_NAME:', cloudName);
  console.log('   CLOUDINARY_API_KEY:', apiKey);
  console.log('   CLOUDINARY_API_SECRET:', '*'.repeat(apiSecret.length));
  if (uploadPreset) console.log('   CLOUDINARY_UPLOAD_PRESET:', uploadPreset);
  if (folderName) console.log('   CLOUDINARY_FOLDER:', folderName);

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase5');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase5 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Test file upload in the application');
  console.log('   4. Verify files appear in Cloudinary dashboard');
  console.log('   5. Run: tsx scripts/setup-phase-9-features.ts (Optional)');

  rl.close();
}

setupPhase5().catch(console.error);

