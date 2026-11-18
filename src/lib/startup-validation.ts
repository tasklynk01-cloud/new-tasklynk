/**
 * Startup Validation
 * 
 * This module ensures environment variables are validated at application startup.
 * Import this file early in your application to enforce configuration checks.
 */

import { env, logEnvironmentConfig } from './env';

/**
 * Initialize application with environment validation
 * This function is called at module load to validate env vars
 */
export function initializeEnvironment() {
  try {
    // Access env to trigger validation
    const requiredVars = {
      nodeEnv: env.NODE_ENV,
      database: env.DATABASE_URL,
      jwt: env.JWT_SECRET,
      email: env.RESEND_API_KEY,
      storage: env.CLOUDINARY_CLOUD_NAME,
    };

    // Log configuration (server-side only)
    if (typeof window === 'undefined' && env.NODE_ENV !== 'test') {
      logEnvironmentConfig();
    }

    return requiredVars;
  } catch (error) {
    console.error('\n');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ CRITICAL: Environment Configuration Failed           ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('\n');
    console.error('The application cannot start due to missing or invalid environment variables.');
    console.error('\n');
    console.error('📋 Quick Fix:');
    console.error('   1. Run setup: npm run setup:phases1-4');
    console.error('   2. Or manually configure .env file');
    console.error('   3. Verify: npm run verify-env');
    console.error('\n');
    console.error('📚 Documentation:');
    console.error('   - See: PHASES_1-4_SETUP_GUIDE.md');
    console.error('   - See: ENVIRONMENT_CONFIGURATION_PHASES.md');
    console.error('\n');
    
    // Re-throw to prevent app from starting
    throw error;
  }
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initializeEnvironment();
}

// Export env for convenience
export { env };


