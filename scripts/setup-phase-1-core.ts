#!/usr/bin/env tsx
/**
 * Phase 1: Core Application Settings Setup
 * 
 * This script helps configure the core application settings.
 * Run: tsx scripts/setup-phase-1-core.ts
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

async function setupPhase1() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 1: Core Application Settings                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // NODE_ENV
  console.log('📌 NODE_ENV');
  console.log('   Options: development, production, test');
  const nodeEnv = await question('   Enter NODE_ENV [production]: ') || 'production';
  
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    console.error('❌ Invalid NODE_ENV. Must be: development, production, or test');
    process.exit(1);
  }

  // NEXT_PUBLIC_APP_URL
  console.log('\n📌 NEXT_PUBLIC_APP_URL');
  console.log('   This should be your production domain (e.g., https://tasklynk.co.ke)');
  const appUrl = await question('   Enter NEXT_PUBLIC_APP_URL: ');
  
  if (!appUrl) {
    console.error('❌ NEXT_PUBLIC_APP_URL is required');
    process.exit(1);
  }

  if (!appUrl.startsWith('https://')) {
    console.error('❌ NEXT_PUBLIC_APP_URL must start with https://');
    process.exit(1);
  }

  // NEXTAUTH_URL
  console.log('\n📌 NEXTAUTH_URL');
  console.log('   Should match NEXT_PUBLIC_APP_URL for authentication callbacks');
  const nextAuthUrl = await question(`   Enter NEXTAUTH_URL [${appUrl}]: `) || appUrl;

  if (!nextAuthUrl.startsWith('https://')) {
    console.error('❌ NEXTAUTH_URL must start with https://');
    process.exit(1);
  }

  // Generate .env entries
  const envEntries = [
    '# Phase 1: Core Application Settings',
    `NODE_ENV=${nodeEnv}`,
    `NEXT_PUBLIC_APP_URL=${appUrl}`,
    `NEXTAUTH_URL=${nextAuthUrl}`,
    '',
  ];

  console.log('\n✅ Phase 1 Configuration:');
  console.log('   NODE_ENV:', nodeEnv);
  console.log('   NEXT_PUBLIC_APP_URL:', appUrl);
  console.log('   NEXTAUTH_URL:', nextAuthUrl);

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase1');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase1 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Run: tsx scripts/setup-phase-2-security.ts');

  rl.close();
}

setupPhase1().catch(console.error);

