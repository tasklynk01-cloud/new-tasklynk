#!/usr/bin/env tsx
/**
 * Phase 3: Database Configuration Setup
 * 
 * This script helps configure Turso database connection.
 * Run: tsx scripts/setup-phase-3-database.ts
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

async function setupPhase3() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 3: Database Configuration (Turso)                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📌 Getting Turso Database Credentials');
  console.log('   1. Go to: https://turso.tech/dashboard');
  console.log('   2. Select your database');
  console.log('   3. Copy the connection URL and auth token');
  console.log('');

  // TURSO_CONNECTION_URL
  console.log('📌 TURSO_CONNECTION_URL');
  console.log('   Format: libsql://database-name.turso.io');
  const connectionUrl = await question('   Enter TURSO_CONNECTION_URL: ');
  
  if (!connectionUrl) {
    console.error('❌ TURSO_CONNECTION_URL is required');
    process.exit(1);
  }

  if (!connectionUrl.startsWith('libsql://')) {
    console.error('❌ TURSO_CONNECTION_URL must start with libsql://');
    process.exit(1);
  }

  // TURSO_AUTH_TOKEN
  console.log('\n📌 TURSO_AUTH_TOKEN');
  console.log('   Generate with: turso db tokens create <database-name>');
  console.log('   Or get from Turso dashboard');
  const authToken = await question('   Enter TURSO_AUTH_TOKEN: ');
  
  if (!authToken) {
    console.error('❌ TURSO_AUTH_TOKEN is required');
    process.exit(1);
  }

  if (!authToken.startsWith('eyJ')) {
    console.warn('⚠️  Warning: Auth token should start with "eyJ" (JWT format)');
    const continueAnyway = await question('   Continue anyway? [y/N]: ');
    if (continueAnyway.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // Generate .env entries
  const envEntries = [
    '# Phase 3: Database Configuration (Turso)',
    `TURSO_CONNECTION_URL=${connectionUrl}`,
    `TURSO_AUTH_TOKEN=${authToken}`,
    '',
  ];

  console.log('\n✅ Phase 3 Configuration:');
  console.log('   TURSO_CONNECTION_URL:', connectionUrl);
  console.log('   TURSO_AUTH_TOKEN:', authToken.substring(0, 20) + '... (' + authToken.length + ' chars)');

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase3');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase3 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Test connection: npm run db:push');
  console.log('   4. Run: tsx scripts/setup-phase-4-email.ts');

  rl.close();
}

setupPhase3().catch(console.error);

