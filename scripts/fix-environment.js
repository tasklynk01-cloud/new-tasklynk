#!/usr/bin/env node
/**
 * AUTOMATED ENVIRONMENT FIX SCRIPT
 * Guides user through fixing critical environment variables
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        TASKLYNK ENVIRONMENT FIX WIZARD                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', colors.red);
    log('Creating .env from .env.example...', colors.yellow);
    
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      log('✅ .env file created', colors.green);
    } else {
      log('❌ .env.example not found either. Cannot proceed.', colors.red);
      process.exit(1);
    }
  }

  // Read current .env content
  let envContent = fs.readFileSync(envPath, 'utf-8');
  const originalContent = envContent;
  
  log('\nThis wizard will help you configure critical environment variables.', colors.cyan);
  log('We\'ll fix placeholders one by one.\n', colors.cyan);

  // ============================================================================
  // 1. JWT_SECRET
  // ============================================================================
  console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  1. JWT Secret (Authentication)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  const currentJwtSecret = jwtSecretMatch ? jwtSecretMatch[1] : '';
  
  if (currentJwtSecret.includes('your-') || currentJwtSecret.length < 32) {
    log('Current JWT_SECRET is invalid (placeholder or too short)', colors.yellow);
    
    const autoGenerate = await question('Generate secure JWT secret automatically? (Y/n): ');
    
    if (autoGenerate.toLowerCase() !== 'n') {
      const newSecret = crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      envContent = envContent.replace(/JWT_SECRET=.+/, `JWT_SECRET=${newSecret}`);
      log(`✅ Generated new JWT secret: ${newSecret.substring(0, 10)}...`, colors.green);
    } else {
      const customSecret = await question('Enter your JWT secret (min 32 chars): ');
      if (customSecret.length >= 32) {
        envContent = envContent.replace(/JWT_SECRET=.+/, `JWT_SECRET=${customSecret}`);
        log('✅ JWT secret updated', colors.green);
      } else {
        log('❌ Secret too short. Keeping placeholder.', colors.red);
      }
    }
  } else {
    log('✅ JWT_SECRET already configured', colors.green);
  }

  // ============================================================================
  // 2. TURSO_AUTH_TOKEN
  // ============================================================================
  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  2. Turso Database (Connection)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  const tursoTokenMatch = envContent.match(/TURSO_AUTH_TOKEN=(.+)/);
  const currentTursoToken = tursoTokenMatch ? tursoTokenMatch[1] : '';
  
  if (currentTursoToken.includes('your_turso') || currentTursoToken.length < 20) {
    log('Current TURSO_AUTH_TOKEN is placeholder', colors.yellow);
    log('\nTo get your Turso auth token:', colors.cyan);
    log('1. Install Turso CLI: npm install -g @libsql/client', colors.cyan);
    log('2. Login: turso auth login', colors.cyan);
    log('3. List databases: turso db list', colors.cyan);
    log('4. Generate token: turso db tokens create your-database-name', colors.cyan);
    log('5. Or visit: https://turso.tech\n', colors.cyan);
    
    const hasToken = await question('Do you have your Turso auth token? (y/N): ');
    
    if (hasToken.toLowerCase() === 'y') {
      const token = await question('Paste your TURSO_AUTH_TOKEN: ');
      if (token.length > 20) {
        envContent = envContent.replace(/TURSO_AUTH_TOKEN=.+/, `TURSO_AUTH_TOKEN=${token}`);
        log('✅ Turso auth token updated', colors.green);
      } else {
        log('❌ Token seems invalid. Keeping placeholder.', colors.red);
      }
    } else {
      log('⚠️  Skipping Turso config. Database connection will fail.', colors.yellow);
    }
    
    // Also check TURSO_CONNECTION_URL
    const tursoUrlMatch = envContent.match(/TURSO_CONNECTION_URL=(.+)/);
    const currentTursoUrl = tursoUrlMatch ? tursoUrlMatch[1] : '';
    
    if (currentTursoUrl.includes('your-database')) {
      const url = await question('Enter your TURSO_CONNECTION_URL (libsql://...): ');
      if (url.startsWith('libsql://')) {
        envContent = envContent.replace(/TURSO_CONNECTION_URL=.+/, `TURSO_CONNECTION_URL=${url}`);
        log('✅ Turso connection URL updated', colors.green);
      }
    }
  } else {
    log('✅ TURSO_AUTH_TOKEN already configured', colors.green);
  }

  // ============================================================================
  // 3. CLOUDINARY
  // ============================================================================
  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  3. Cloudinary (File Storage)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  const cloudNameMatch = envContent.match(/CLOUDINARY_CLOUD_NAME=(.+)/);
  const currentCloudName = cloudNameMatch ? cloudNameMatch[1] : '';
  
  if (currentCloudName.includes('your_') || currentCloudName.length < 3) {
    log('Cloudinary not configured', colors.yellow);
    log('\nTo get Cloudinary credentials:', colors.cyan);
    log('1. Visit: https://cloudinary.com/console', colors.cyan);
    log('2. Login or create free account', colors.cyan);
    log('3. Copy Cloud Name, API Key, API Secret from dashboard\n', colors.cyan);
    
    const hasCloudinary = await question('Do you have Cloudinary credentials? (y/N): ');
    
    if (hasCloudinary.toLowerCase() === 'y') {
      const cloudName = await question('Cloud Name: ');
      const apiKey = await question('API Key: ');
      const apiSecret = await question('API Secret: ');
      
      if (cloudName && apiKey && apiSecret) {
        envContent = envContent.replace(/CLOUDINARY_CLOUD_NAME=.+/, `CLOUDINARY_CLOUD_NAME=${cloudName}`);
        envContent = envContent.replace(/CLOUDINARY_API_KEY=.+/, `CLOUDINARY_API_KEY=${apiKey}`);
        envContent = envContent.replace(/CLOUDINARY_API_SECRET=.+/, `CLOUDINARY_API_SECRET=${apiSecret}`);
        log('✅ Cloudinary credentials updated', colors.green);
      }
    } else {
      log('⚠️  Skipping Cloudinary. File uploads will fail.', colors.yellow);
    }
  } else {
    log('✅ Cloudinary already configured', colors.green);
  }

  // ============================================================================
  // 4. PAYSTACK
  // ============================================================================
  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  4. Paystack (Payment Gateway)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  const paystackMatch = envContent.match(/PAYSTACK_SECRET_KEY=(.+)/);
  const currentPaystack = paystackMatch ? paystackMatch[1] : '';
  
  if (currentPaystack.includes('your_paystack') || currentPaystack.includes('sk_live_your')) {
    log('Paystack secret key is placeholder', colors.yellow);
    log('\nTo get Paystack secret key:', colors.cyan);
    log('1. Visit: https://dashboard.paystack.com/#/settings/developers', colors.cyan);
    log('2. Copy Test Secret Key (for development)', colors.cyan);
    log('3. Or Live Secret Key (for production)\n', colors.cyan);
    
    const hasPaystack = await question('Do you have Paystack secret key? (y/N): ');
    
    if (hasPaystack.toLowerCase() === 'y') {
      const secretKey = await question('Paste PAYSTACK_SECRET_KEY (sk_test_... or sk_live_...): ');
      if (secretKey.startsWith('sk_')) {
        envContent = envContent.replace(/PAYSTACK_SECRET_KEY=.+/, `PAYSTACK_SECRET_KEY=${secretKey}`);
        log('✅ Paystack secret key updated', colors.green);
      } else {
        log('❌ Invalid Paystack key format. Keeping placeholder.', colors.red);
      }
    } else {
      log('⚠️  Skipping Paystack. Payments will fail.', colors.yellow);
    }
  } else {
    log('✅ PAYSTACK_SECRET_KEY already configured', colors.green);
  }

  // ============================================================================
  // SAVE CHANGES
  // ============================================================================
  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  Saving Changes${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  if (envContent !== originalContent) {
    // Backup original
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, originalContent);
    log(`📦 Backup created: ${path.basename(backupPath)}`, colors.cyan);
    
    // Save new content
    fs.writeFileSync(envPath, envContent);
    log('✅ .env file updated successfully!', colors.green);
  } else {
    log('ℹ️  No changes made to .env', colors.cyan);
  }

  // ============================================================================
  // VERIFICATION
  // ============================================================================
  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}  Next Steps${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  log('Run these commands to verify your configuration:', colors.cyan);
  log('', colors.reset);
  log('  1. npm run verify-env    # Check all environment variables', colors.green);
  log('  2. npm run db:status     # Test database connection', colors.green);
  log('  3. npm run dev           # Start development server', colors.green);
  log('', colors.reset);
  log('If you need to make changes:', colors.cyan);
  log('  • Edit .env file manually', colors.yellow);
  log('  • Or run this script again: node scripts\\fix-environment.js', colors.yellow);
  log('', colors.reset);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Environment Fix Complete!                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  rl.close();
}

// Run the wizard
main().catch(error => {
  console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});
