#!/usr/bin/env tsx
/**
 * Phase 10: Monitoring & Analytics Setup
 * 
 * This script helps configure monitoring and analytics services.
 * Run: tsx scripts/setup-phase-10-monitoring.ts
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

async function setupPhase10() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 10: Monitoring & Analytics (Optional)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📌 This phase is OPTIONAL');
  console.log('   Configure monitoring and error tracking services');
  console.log('   You can skip this and configure later if needed');
  console.log('');

  const configure = await question('   Configure monitoring now? [y/N]: ');
  
  if (configure.toLowerCase() !== 'y') {
    console.log('\n✅ Skipping Phase 10 (Monitoring & Analytics)');
    console.log('   You can run this script later when ready');
    rl.close();
    return;
  }

  console.log('\n📌 Sentry Error Tracking');
  console.log('   Sentry provides error tracking and performance monitoring');
  console.log('   Get your credentials from: https://sentry.io');
  console.log('');

  const useSentry = await question('   Configure Sentry? [y/N]: ');
  
  let sentryDsn = '';
  let sentryAuthToken = '';

  if (useSentry.toLowerCase() === 'y') {
    // SENTRY_DSN
    console.log('\n📌 SENTRY_DSN');
    console.log('   Your Sentry DSN (Data Source Name)');
    console.log('   Format: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx');
    sentryDsn = await question('   Enter SENTRY_DSN: ');
    
    if (sentryDsn && !sentryDsn.startsWith('https://')) {
      console.error('❌ SENTRY_DSN should start with https://');
      process.exit(1);
    }

    // SENTRY_AUTH_TOKEN (Optional)
    console.log('\n📌 SENTRY_AUTH_TOKEN (Optional)');
    console.log('   Auth token for Sentry CLI');
    console.log('   Press Enter to skip');
    sentryAuthToken = await question('   Enter SENTRY_AUTH_TOKEN [skip]: ');
  }

  console.log('\n📌 Other Monitoring Services');
  console.log('   You can add other services like Google Analytics, PostHog, etc.');
  console.log('');

  const otherServices = await question('   Add custom monitoring variables? [y/N]: ');
  
  const customVars: string[] = [];
  
  if (otherServices.toLowerCase() === 'y') {
    console.log('\n   Enter custom environment variables (one per line)');
    console.log('   Format: VARIABLE_NAME=value');
    console.log('   Press Enter with empty line to finish');
    console.log('');

    while (true) {
      const customVar = await question('   > ');
      if (!customVar.trim()) break;
      
      if (!customVar.includes('=')) {
        console.warn('   ⚠️  Invalid format. Use: VARIABLE_NAME=value');
        continue;
      }
      
      customVars.push(customVar.trim());
    }
  }

  // Generate .env entries
  const envEntries = ['# Phase 10: Monitoring & Analytics (Optional)'];

  if (sentryDsn) {
    envEntries.push('# Sentry Error Tracking');
    envEntries.push(`SENTRY_DSN=${sentryDsn}`);
    if (sentryAuthToken) {
      envEntries.push(`SENTRY_AUTH_TOKEN=${sentryAuthToken}`);
    }
  }

  if (customVars.length > 0) {
    envEntries.push('');
    envEntries.push('# Custom Monitoring');
    envEntries.push(...customVars);
  }

  envEntries.push('');

  console.log('\n✅ Phase 10 Configuration:');
  if (sentryDsn) {
    console.log('   Sentry:');
    console.log('   - DSN:', sentryDsn.substring(0, 30) + '...');
    if (sentryAuthToken) {
      console.log('   - Auth Token: ***');
    }
  }

  if (customVars.length > 0) {
    console.log('   Custom Variables:');
    customVars.forEach(v => {
      const [key] = v.split('=');
      console.log('   -', key);
    });
  }

  if (!sentryDsn && customVars.length === 0) {
    console.log('   No monitoring services configured');
  }

  // Save to file
  const envPath = path.join(process.cwd(), '.env.phase10');
  fs.writeFileSync(envPath, envEntries.join('\n'));

  console.log(`\n✅ Configuration saved to: ${envPath}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the generated .env.phase10 file');
  console.log('   2. Copy these values to your .env file or deployment platform');
  console.log('   3. Test error tracking (if Sentry configured)');
  console.log('   4. Run: npm run verify-env to verify all phases');

  rl.close();
}

setupPhase10().catch(console.error);

