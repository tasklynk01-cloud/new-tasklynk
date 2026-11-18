/**
 * Automated Vercel Deployment Script
 * 
 * Prerequisites:
 * 1. Get a Vercel token from: https://vercel.com/account/tokens
 * 2. Add it to .env as: VERCEL_TOKEN=your_token_here
 * 
 * Usage:
 *   node deploy-vercel.js           # Deploy to preview
 *   node deploy-vercel.js --prod    # Deploy to production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const isProduction = process.argv.includes('--prod');
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
  console.error('❌ ERROR: VERCEL_TOKEN not found in .env file');
  console.error('');
  console.error('Steps to fix:');
  console.error('1. Go to https://vercel.com/account/tokens');
  console.error('2. Create a new token');
  console.error('3. Add to .env: VERCEL_TOKEN=your_token_here');
  process.exit(1);
}

console.log('🚀 Starting Vercel Deployment...');
console.log(`📦 Mode: ${isProduction ? 'Production' : 'Preview'}`);
console.log('');

try {
  // Set the token in environment for the command
  process.env.VERCEL_ORG_ID = process.env.VERCEL_ORG_ID || '';
  process.env.VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || '';

  const deployCommand = isProduction 
    ? `npx vercel --prod --token=${VERCEL_TOKEN}`
    : `npx vercel --token=${VERCEL_TOKEN}`;

  console.log('⚙️  Running deployment...');
  const output = execSync(deployCommand, { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('');
  console.log('✅ Deployment successful!');
  
} catch (error) {
  console.error('');
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
