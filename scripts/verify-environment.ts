#!/usr/bin/env tsx
/**
 * Environment Configuration Verification Script
 * 
 * This script verifies that all required environment variables are set correctly.
 * Run this before deployment to ensure nothing is missing.
 * 
 * Usage:
 *   tsx scripts/verify-environment.ts
 *   OR
 *   npm run verify-env
 */

import { z } from 'zod';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface PhaseCheck {
  phase: string;
  priority: 'critical' | 'important' | 'optional';
  variables: string[];
  status: 'pass' | 'fail' | 'warning';
  missing: string[];
  invalid: string[];
}

const phases: Array<{
  name: string;
  priority: 'critical' | 'important' | 'optional';
  variables: Array<{
    name: string;
    required: boolean;
    validator?: (value: string) => boolean;
    description?: string;
  }>;
}> = [
  {
    name: 'Phase 1: Core Application Settings',
    priority: 'critical',
    variables: [
      { name: 'NODE_ENV', required: true, validator: (v) => ['development', 'production', 'test'].includes(v) },
      { name: 'NEXT_PUBLIC_APP_URL', required: true, validator: (v) => v.startsWith('https://') },
      { name: 'NEXTAUTH_URL', required: true, validator: (v) => v.startsWith('https://') },
    ],
  },
  {
    name: 'Phase 2: Security & Authentication',
    priority: 'critical',
    variables: [
      { name: 'JWT_SECRET', required: true, validator: (v) => v.length >= 32 },
      { name: 'NEXTAUTH_SECRET', required: false, validator: (v) => !v || v.length >= 32 },
    ],
  },
  {
    name: 'Phase 3: Database Configuration',
    priority: 'critical',
    variables: [
      { name: 'TURSO_CONNECTION_URL', required: true, validator: (v) => v.startsWith('libsql://') },
      { name: 'TURSO_AUTH_TOKEN', required: true, validator: (v) => v.length > 0 },
    ],
  },
  {
    name: 'Phase 4: Email Configuration',
    priority: 'critical',
    variables: [
      { name: 'SMTP_HOST', required: true },
      { name: 'SMTP_PORT', required: true, validator: (v) => ['587', '465'].includes(v) },
      { name: 'SMTP_USER', required: true, validator: (v) => v.includes('@') },
      { name: 'SMTP_PASSWORD', required: true },
      { name: 'EMAIL_FROM', required: true, validator: (v) => v.includes('@') },
    ],
  },
  {
    name: 'Phase 5: File Storage (Cloudinary)',
    priority: 'critical',
    variables: [
      { name: 'CLOUDINARY_CLOUD_NAME', required: true },
      { name: 'CLOUDINARY_API_KEY', required: true },
      { name: 'CLOUDINARY_API_SECRET', required: true },
    ],
  },
  {
    name: 'Phase 6: M-Pesa Payment Gateway',
    priority: 'important',
    variables: [
      { name: 'MPESA_CONSUMER_KEY', required: false },
      { name: 'MPESA_CONSUMER_SECRET', required: false },
      { name: 'MPESA_SHORTCODE', required: false },
      { name: 'MPESA_PASSKEY', required: false },
      { name: 'MPESA_ENVIRONMENT', required: false, validator: (v) => ['sandbox', 'production'].includes(v) },
    ],
  },
  {
    name: 'Phase 7: Paystack Payment Gateway',
    priority: 'important',
    variables: [
      { name: 'PAYSTACK_SECRET_KEY', required: false },
      { name: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY', required: false },
    ],
  },
  {
    name: 'Phase 8: Optional - Supabase',
    priority: 'optional',
    variables: [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', required: false },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', required: false },
    ],
  },
  {
    name: 'Phase 9: Feature Flags',
    priority: 'optional',
    variables: [
      { name: 'ENABLE_RATE_LIMITING', required: false },
      { name: 'ENABLE_FILE_VALIDATION', required: false },
      { name: 'ENABLE_EMAIL_NOTIFICATIONS', required: false },
    ],
  },
  {
    name: 'Phase 10: Monitoring (Optional)',
    priority: 'optional',
    variables: [
      { name: 'SENTRY_DSN', required: false },
      { name: 'SENTRY_AUTH_TOKEN', required: false },
    ],
  },
];

function checkPhase(phase: typeof phases[0]): PhaseCheck {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const variable of phase.variables) {
    const value = process.env[variable.name];

    if (variable.required && !value) {
      missing.push(variable.name);
    } else if (value && variable.validator && !variable.validator(value)) {
      invalid.push(variable.name);
    }
  }

  let status: 'pass' | 'fail' | 'warning' = 'pass';
  if (missing.length > 0) {
    status = phase.priority === 'critical' ? 'fail' : 'warning';
  } else if (invalid.length > 0) {
    status = 'fail';
  }

  return {
    phase: phase.name,
    priority: phase.priority,
    variables: phase.variables.map(v => v.name),
    status,
    missing,
    invalid,
  };
}

function printHeader() {
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Environment Configuration Verification${colors.cyan}              ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
}

function printPhaseResult(check: PhaseCheck) {
  const priorityIcon = {
    critical: '🔴',
    important: '🟡',
    optional: '🟢',
  }[check.priority];

  const statusIcon = {
    pass: '✅',
    fail: '❌',
    warning: '⚠️',
  }[check.status];

  const statusColor = {
    pass: colors.green,
    fail: colors.red,
    warning: colors.yellow,
  }[check.status];

  console.log(`${statusIcon} ${priorityIcon} ${check.phase}`);
  console.log(`   Status: ${statusColor}${check.status.toUpperCase()}${colors.reset}`);

  if (check.missing.length > 0) {
    console.log(`   ${colors.red}Missing:${colors.reset} ${check.missing.join(', ')}`);
  }

  if (check.invalid.length > 0) {
    console.log(`   ${colors.red}Invalid:${colors.reset} ${check.invalid.join(', ')}`);
  }

  if (check.status === 'pass') {
    console.log(`   ${colors.green}All variables configured correctly${colors.reset}`);
  }

  console.log('');
}

function printSummary(results: PhaseCheck[]) {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║${colors.reset}  Summary${colors.cyan}                                                    ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  console.log(`   ${colors.green}✅ Passed:${colors.reset} ${passed}/${results.length} phases`);
  console.log(`   ${colors.yellow}⚠️  Warnings:${colors.reset} ${warnings} phases`);
  console.log(`   ${colors.red}❌ Failed:${colors.reset} ${failed} phases`);
  console.log('');

  if (failed > 0) {
    console.log(`${colors.red}❌ CRITICAL ERRORS FOUND${colors.reset}`);
    console.log('   Please fix the failed phases before deployment.');
    console.log('');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${colors.yellow}⚠️  WARNINGS FOUND${colors.reset}`);
    console.log('   Some optional configurations are missing, but deployment can proceed.');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ ALL CHECKS PASSED${colors.reset}`);
    console.log('   Environment is ready for deployment!');
    console.log('');
    process.exit(0);
  }
}

function main() {
  printHeader();

  const results = phases.map(checkPhase);
  results.forEach(printPhaseResult);
  printSummary(results);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { checkPhase, phases };

