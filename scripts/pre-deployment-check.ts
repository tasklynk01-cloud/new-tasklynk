#!/usr/bin/env tsx
/**
 * Pre-Deployment Verification Script
 * 
 * Checks if the application is ready for Vercel deployment.
 * Verifies environment, database, build, and configuration.
 * 
 * Usage: tsx scripts/pre-deployment-check.ts
 *        npm run deploy:check
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warn', message: string, critical = false) {
  results.push({ name, status, message, critical });
}

function printHeader(title: string) {
  console.log('\n');
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log('');
}

function printResult(result: CheckResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  const color = result.status === 'pass' ? colors.green : result.status === 'fail' ? colors.red : colors.yellow;
  
  console.log(`${color}${icon} ${result.name}${colors.reset}`);
  if (result.message) {
    console.log(`   ${result.message}`);
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim() === '') {
      addResult('Git Working Tree', 'pass', 'Clean - no uncommitted changes');
    } else {
      addResult('Git Working Tree', 'warn', 'Uncommitted changes detected', false);
    }
  } catch (error) {
    addResult('Git Working Tree', 'fail', 'Could not check git status', false);
  }
}

function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.engines && packageJson.engines.node) {
      addResult('Node Version', 'pass', `Specified: ${packageJson.engines.node}`);
    } else {
      addResult('Node Version', 'warn', 'No engine specified in package.json', false);
    }

    const requiredScripts = ['build', 'start'];
    const hasAllScripts = requiredScripts.every(script => packageJson.scripts[script]);
    
    if (hasAllScripts) {
      addResult('Build Scripts', 'pass', 'All required scripts present');
    } else {
      addResult('Build Scripts', 'fail', 'Missing required scripts', true);
    }
  } catch (error) {
    addResult('Package.json', 'fail', 'Could not read package.json', true);
  }
}

function checkVercelConfig() {
  if (fs.existsSync('vercel.json')) {
    addResult('Vercel Config', 'pass', 'vercel.json exists');
  } else {
    addResult('Vercel Config', 'warn', 'No vercel.json found (optional)', false);
  }
}

function checkEnvironmentTemplate() {
  const envExample = fs.existsSync('.env.example');
  const envLocal = fs.existsSync('.env.local');
  const envProd = fs.existsSync('.env.production');
  
  if (envExample) {
    addResult('Environment Template', 'pass', '.env.example exists');
  } else {
    addResult('Environment Template', 'warn', 'No .env.example for reference', false);
  }

  if (!envLocal && !envProd && !process.env.TURSO_CONNECTION_URL) {
    addResult('Environment Variables', 'fail', 'No environment configured', true);
  } else {
    addResult('Environment Variables', 'pass', 'Environment appears configured');
  }
}

function checkCriticalEnvVars() {
  const criticalVars = [
    'TURSO_CONNECTION_URL',
    'TURSO_AUTH_TOKEN',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
  ];

  const missing = criticalVars.filter(v => !process.env[v]);

  if (missing.length === 0) {
    addResult('Critical Env Vars', 'pass', 'All critical variables set locally');
  } else {
    addResult('Critical Env Vars', 'warn', `Missing locally: ${missing.join(', ')}. Must be set in Vercel!`, false);
  }
}

function checkDatabaseConnection() {
  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    addResult('Database Connection', 'warn', 'Database credentials not set locally', false);
    return;
  }

  try {
    execSync('tsx scripts/check-database-status.ts', { stdio: 'pipe' });
    addResult('Database Connection', 'pass', 'Database accessible and healthy');
  } catch (error) {
    addResult('Database Connection', 'fail', 'Database connection failed', true);
  }
}

function checkBuild() {
  try {
    console.log(`\n${colors.blue}Running build test...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    addResult('Build Test', 'pass', 'Build completed successfully');
  } catch (error) {
    addResult('Build Test', 'fail', 'Build failed - fix errors before deploying', true);
  }
}

function checkTypeScript() {
  try {
    execSync('tsc --noEmit', { stdio: 'pipe' });
    addResult('TypeScript', 'pass', 'No type errors');
  } catch (error) {
    addResult('TypeScript', 'warn', 'Type errors detected (non-blocking)', false);
  }
}

function checkGitignore() {
  if (!fs.existsSync('.gitignore')) {
    addResult('Gitignore', 'fail', '.gitignore missing', true);
    return;
  }

  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const criticalPatterns = ['.env', '.env.local', 'node_modules'];
  
  const hasAll = criticalPatterns.every(pattern => gitignore.includes(pattern));
  
  if (hasAll) {
    addResult('Gitignore', 'pass', 'All critical patterns present');
  } else {
    addResult('Gitignore', 'fail', 'Missing critical patterns', true);
  }
}

function checkNextConfig() {
  if (fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs') || fs.existsSync('next.config.ts')) {
    addResult('Next.js Config', 'pass', 'Next.js configuration exists');
  } else {
    addResult('Next.js Config', 'warn', 'No Next.js config (using defaults)', false);
  }
}

function checkDependencies() {
  if (!fs.existsSync('node_modules')) {
    addResult('Dependencies', 'fail', 'node_modules missing - run npm install', true);
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const lockFile = fs.existsSync('package-lock.json') || fs.existsSync('yarn.lock') || fs.existsSync('pnpm-lock.yaml');
    
    if (lockFile) {
      addResult('Dependencies', 'pass', 'Lock file present for reproducible builds');
    } else {
      addResult('Dependencies', 'warn', 'No lock file - builds may vary', false);
    }
  } catch (error) {
    addResult('Dependencies', 'fail', 'Could not verify dependencies', true);
  }
}

async function runChecks() {
  printHeader('Pre-Deployment Verification');
  
  console.log(`${colors.blue}Checking deployment readiness...${colors.reset}\n`);

  // Run all checks
  printHeader('1. Code Quality');
  checkGitStatus();
  checkTypeScript();
  printResult(results[results.length - 2]);
  printResult(results[results.length - 1]);

  printHeader('2. Configuration Files');
  checkPackageJson();
  checkVercelConfig();
  checkNextConfig();
  checkGitignore();
  printResult(results[results.length - 4]);
  printResult(results[results.length - 3]);
  printResult(results[results.length - 2]);
  printResult(results[results.length - 1]);

  printHeader('3. Dependencies');
  checkDependencies();
  printResult(results[results.length - 1]);

  printHeader('4. Environment');
  checkEnvironmentTemplate();
  checkCriticalEnvVars();
  printResult(results[results.length - 2]);
  printResult(results[results.length - 1]);

  printHeader('5. Database');
  checkDatabaseConnection();
  printResult(results[results.length - 1]);

  printHeader('6. Build Test');
  checkBuild();
  printResult(results[results.length - 1]);

  // Summary
  printHeader('Summary');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const criticalFailed = results.filter(r => r.status === 'fail' && r.critical).length;

  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
  console.log('');

  if (criticalFailed > 0) {
    console.log(`${colors.red}${colors.bold}❌ DEPLOYMENT NOT READY${colors.reset}`);
    console.log(`${colors.red}${criticalFailed} critical issue(s) must be fixed first.${colors.reset}`);
    console.log('');
    console.log('Critical issues:');
    results.filter(r => r.status === 'fail' && r.critical).forEach(r => {
      console.log(`  ${colors.red}❌ ${r.name}: ${r.message}${colors.reset}`);
    });
    console.log('');
    process.exit(1);
  } else if (failed > 0) {
    console.log(`${colors.yellow}${colors.bold}⚠️  DEPLOYMENT POSSIBLE BUT NOT RECOMMENDED${colors.reset}`);
    console.log(`${colors.yellow}${failed} non-critical issue(s) detected.${colors.reset}`);
    console.log('');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${colors.green}${colors.bold}✅ READY FOR DEPLOYMENT${colors.reset}`);
    console.log(`${colors.yellow}Note: ${warnings} warning(s) detected but non-blocking.${colors.reset}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Set all environment variables in Vercel Dashboard');
    console.log('   2. Run: vercel --prod');
    console.log('   3. Monitor deployment logs');
    console.log('   4. Test deployed application');
    console.log('');
  } else {
    console.log(`${colors.green}${colors.bold}✅ READY FOR DEPLOYMENT${colors.reset}`);
    console.log(`${colors.green}All checks passed!${colors.reset}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Set all environment variables in Vercel Dashboard');
    console.log('   2. Run: vercel --prod');
    console.log('   3. Monitor deployment logs');
    console.log('   4. Test deployed application');
    console.log('');
  }
}

runChecks().catch((error) => {
  console.error(`${colors.red}❌ Check failed:${colors.reset}`, error);
  process.exit(1);
});

