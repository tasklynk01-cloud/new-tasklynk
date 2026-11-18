import { z } from 'zod';

/**
 * 🔒 ENVIRONMENT VARIABLE VALIDATION
 * 
 * Validates all required environment variables at startup
 * Ensures proper configuration before the application runs
 * 
 * USAGE:
 * Import this file in your server entry point to validate env vars:
 * import { env } from '@/lib/env';
 * 
 * Access validated variables:
 * const dbUrl = env.DATABASE_URL;
 * const jwtSecret = env.JWT_SECRET;
 */

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // 🔒 Security & Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  NEXTAUTH_SECRET: z.string().optional(), // Optional for NextAuth compatibility
  NEXTAUTH_URL: z.string().url().optional(),

  // 🗄️ Database Configuration (Supabase PostgreSQL)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // 📧 Email Configuration (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  FROM_EMAIL: z.string().min(1, 'FROM_EMAIL is required').default('TaskLynk <onboarding@resend.dev>'),

  // 📁 File Storage (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_PRESET: z.string().optional(),

  // 💳 Payment Integration (M-Pesa)
  MPESA_ENV: z.enum(['sandbox', 'production']).optional(),
  MPESA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('production'),
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_BUSINESS_SHORTCODE: z.string().optional(),
  MPESA_STK_CALLBACK_URL: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().optional(),
  MPESA_C2B_VALIDATION_URL: z.string().optional(),
  MPESA_C2B_CONFIRMATION_URL: z.string().optional(),
  MPESA_TRANSACTION_TYPE: z.string().optional(),

  // 💳 Payment Integration (Paystack)
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  // 🔧 Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://tasklynk.co.ke'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // 📊 Analytics & Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // 🔍 Feature Flags (Optional)
  ENABLE_RATE_LIMITING: z.string().default('true').transform(val => val === 'true'),
  ENABLE_FILE_VALIDATION: z.string().default('true').transform(val => val === 'true'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().default('true').transform(val => val === 'true'),

  // 📈 Performance
  MAX_FILE_UPLOAD_SIZE_MB: z.string().default('15').transform(val => parseInt(val, 10)),
  RATE_LIMIT_LOGIN_MAX_ATTEMPTS: z.string().default('5').transform(val => parseInt(val, 10)),
  RATE_LIMIT_LOGIN_WINDOW_MINUTES: z.string().default('15').transform(val => parseInt(val, 10)),
});

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  try {
    const rawEnv: Record<string, any> = {};
    for (const [key, val] of Object.entries(process.env)) {
      rawEnv[key] = typeof val === 'string' ? val.trim() : val;
    }
    const parsed = envSchema.parse(rawEnv);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment Variable Validation Failed:');
      console.error('');
      
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      console.error('');
      console.error('Please check your .env file and ensure all required variables are set.');
      console.error('Refer to .env.example for a template.');
      
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Use this object throughout your application instead of process.env
 * 
 * Benefits:
 * - Type-safe access to env vars
 * - Guaranteed to have all required values
 * - Proper type coercion (strings to numbers/booleans)
 * - Early failure if misconfigured
 */
export const env = validateEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Get database connection URL (Supabase PostgreSQL)
 */
export function getDatabaseUrl(): string {
  return env.DATABASE_URL;
}

/**
 * Get application base URL
 * Useful for constructing absolute URLs in emails, redirects, etc.
 */
export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: 'rateLimiting' | 'fileValidation' | 'emailNotifications'): boolean {
  const featureMap = {
    rateLimiting: env.ENABLE_RATE_LIMITING,
    fileValidation: env.ENABLE_FILE_VALIDATION,
    emailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS,
  };
  
  return featureMap[feature] ?? false;
}

/**
 * Get email configuration (Resend)
 */
export function getEmailConfig() {
  return {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.FROM_EMAIL,
    enabled: env.ENABLE_EMAIL_NOTIFICATIONS,
  };
}

/**
 * Get Cloudinary configuration
 */
export function getCloudinaryConfig() {
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
  };
}

/**
 * Get M-Pesa configuration
 */
export function getMpesaConfig() {
  const envType = env.MPESA_ENV || env.MPESA_ENVIRONMENT || 'production';
  const shortcode = env.MPESA_SHORTCODE || env.MPESA_BUSINESS_SHORTCODE || '';
  const stkCallbackUrl = env.MPESA_STK_CALLBACK_URL || env.MPESA_CALLBACK_URL || `${env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`;
  const c2bValidationUrl = env.MPESA_C2B_VALIDATION_URL || `${env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/c2b/validation`;
  const c2bConfirmationUrl = env.MPESA_C2B_CONFIRMATION_URL || `${env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/c2b/confirmation`;
  const transactionType = env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline';

  return {
    consumerKey: env.MPESA_CONSUMER_KEY,
    consumerSecret: env.MPESA_CONSUMER_SECRET,
    passkey: env.MPESA_PASSKEY,
    shortcode,
    environment: envType as 'sandbox' | 'production',
    stkCallbackUrl,
    c2bValidationUrl,
    c2bConfirmationUrl,
    transactionType,
    enabled: Boolean(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET && env.MPESA_PASSKEY && shortcode),
  };
}

/**
 * Get Paystack configuration
 */
export function getPaystackConfig() {
  return {
    secretKey: env.PAYSTACK_SECRET_KEY,
    publicKey: env.PAYSTACK_PUBLIC_KEY,
    enabled: Boolean(env.PAYSTACK_SECRET_KEY && env.PAYSTACK_PUBLIC_KEY),
  };
}

/**
 * Log environment configuration (safe - hides secrets)
 * Call this at startup to verify configuration
 */
export function logEnvironmentConfig(): void {
}

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;

