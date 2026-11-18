#!/usr/bin/env tsx
/**
 * Phase 2: Security & Authentication Setup
 * 
 * This script helps generate secure JWT secrets and configure authentication.
 * Run: tsx scripts/setup-phase-2-security.ts
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

async function setupPhase2() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 2: Security & Authentication                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('🔒 JWT_SECRET');
  console.log('   Must be at least 32 characters for security');
  console.log('   Options:');
  console.log('   1. Generate automatically (recommended)');
  console.log('   2. Enter your own secret');
  
  const jwtChoice = await question('   Choose option [1]: ') || '1';

  let jwtSecret: string;
  if (jwtChoice === '1') {
    jwtSecret = generateSecret(32);
    console.log(`   ✅ Generated JWT_SECRET: ${jwtSecret.substring(0, 8)}... (${jwtSecret.length} chars)`);
  } else {
    jwtSecret = await question('   Enter JWT_SECRET (min 32 chars): ');
    if (jwtSecret.length < 32) {
      console.error('❌ JWT_SECRET must be at least 32 characters');
      process.exit(1);
    }
  }

  console.log('\n🔒 NEXTAUTH_SECRET');
  console.log('   Can be same as JWT_SECRET or different');
  console.log('   Options:');
  console.log('   1. Use same as JWT_SECRET');
  console.log('   2. Generate new secret');
  console.log('   3. Enter your own secret');
  
  const nextAuthChoice = await question('   Choose option [1]: ') || '1';

  let nextAuthSecret: string;
  if (nextAuthChoice === '1') {
    nextAuthSecret = jwtSecret;
    console.log('   ✅ Using same value as JWT_SECRET');
  } else if (nextAuthChoice === '2') {
    nextAuthSecret = generateSecret(32);
    console.log(`   ✅ Generated NEXTAUTH_SECRET: ${nextAuthSecret.substring(0, 8)}... (${nextAuthSecret.length} chars)`);
  } else {
    nextAuthSecret = await question('   Enter NEXTAUTH_SECRET (min 32 chars): ');
    if (nextAuthSecret.length < 32) {
      console.error('❌ NEXTAUTH_SECRET must be at least 32 characters');
      process.exit(1);
    }
  }

  // Generate .env entries
  const envEntries = [
    '# Phase 2: Security & Authentication',
    `JWT_SECRET=${jwtSecret}`,
    `NEXTAUTH_SECRET=${nextAuthSecret}`,
    '',
  ];

  console.log('\n✅ Phase 2 Configuration:');
  console.log('   JWT_SECRET:', jwtSecret.substring(0, 8) + '... (' + jwtSecret.length + ' chars)');
  console.log('   NEXTAUTH_SECRET:', nextAuthSecret.substring(0, 8) + '... (' + nextAuthSecret.length + ' chars)');

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase2');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n⚠️  SECURITY WARNING:');
  console.log('   - Keep these secrets secure!');
  console.log('   - Never commit them to version control');
  console.log('   - Use different secrets for dev/prod');
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase2 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Run: tsx scripts/setup-phase-3-database.ts');

  rl.close();
}

setupPhase2().catch(console.error);

