import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { supabaseStorage } from '@/lib/supabase-storage';
import { sendEmail } from '@/lib/email';

/**
 * STORAGE & SERVICES DIAGNOSTIC ENDPOINT
 * 
 * Tests all integrated storage and external services:
 * - Cloudinary (file storage - PRIMARY)
 * - Supabase (file storage - SECONDARY/FALLBACK)
 * - Email (Resend)
 * - Database (Supabase Postgres)
 *
 * Usage: GET /api/test/storage-diagnostic
 */

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {},
  };

  // ========================================
  // 1. CLOUDINARY STORAGE TEST (PRIMARY)
  // ========================================
  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const cloudinaryConfig = {
      configured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
      has_api_key: !!process.env.CLOUDINARY_API_KEY,
      has_api_secret: !!process.env.CLOUDINARY_API_SECRET,
    };

    if (cloudinaryConfig.configured) {
      // Test API connection by getting usage stats
      try {
        const usage = await cloudinary.api.usage();
        
        results.services.cloudinary = {
          status: 'OPERATIONAL',
          configured: true,
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          plan: usage.plan || 'Unknown',
          storage_used_mb: (usage.storage?.usage || 0) / 1024 / 1024,
          storage_limit_mb: (usage.storage?.limit || 0) / 1024 / 1024,
          credits_used: usage.credits?.usage || 0,
          credits_limit: usage.credits?.limit || 0,
          transformations_used: usage.transformations?.usage || 0,
          bandwidth_used_gb: (usage.bandwidth?.usage || 0) / 1024 / 1024 / 1024,
          last_updated: usage.last_updated,
          test_passed: true,
          supported_formats: [
            'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
            'txt', 'rtf', 'csv', 'jpg', 'jpeg', 'png', 'gif',
            'zip', 'rar', '7z', 'mp4', 'mp3', 'wav'
          ],
          max_file_size: '40MB',
        };
      } catch (apiError: any) {
        results.services.cloudinary = {
          status: 'ERROR',
          configured: true,
          error: apiError.message,
          error_code: apiError.http_code,
          test_passed: false,
          hint: 'Cloudinary credentials may be invalid. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
        };
      }
    } else {
      results.services.cloudinary = {
        status: 'NOT CONFIGURED',
        configured: false,
        missing_vars: [
          !process.env.CLOUDINARY_CLOUD_NAME && 'CLOUDINARY_CLOUD_NAME',
          !process.env.CLOUDINARY_API_KEY && 'CLOUDINARY_API_KEY',
          !process.env.CLOUDINARY_API_SECRET && 'CLOUDINARY_API_SECRET',
        ].filter(Boolean),
        test_passed: false,
      };
    }
  } catch (error) {
    results.services.cloudinary = {
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      test_passed: false,
    };
  }

  // ========================================
  // 2. SUPABASE STORAGE TEST (SECONDARY)
  // ========================================
  try {
    const supabaseConfig = {
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    if (supabaseStorage) {
      try {
        // Test by listing buckets
        const { data: buckets, error } = await supabaseStorage.storage.listBuckets();
        
        if (error) throw error;

        results.services.supabase = {
          status: 'OPERATIONAL',
          configured: true,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          buckets_count: buckets?.length || 0,
          buckets: buckets?.map((b: any) => b.name) || [],
          test_passed: true,
          note: 'Supabase is configured as secondary/fallback storage',
        };
      } catch (apiError: any) {
        results.services.supabase = {
          status: 'ERROR',
          configured: true,
          error: apiError.message,
          test_passed: false,
          hint: 'Supabase credentials may be invalid. Check SUPABASE_SERVICE_ROLE_KEY.',
        };
      }
    } else {
      results.services.supabase = {
        status: 'NOT CONFIGURED',
        configured: false,
        missing_vars: [
          !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
          !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
        ].filter(Boolean),
        test_passed: false,
        note: 'Supabase is optional. Cloudinary is the primary storage.',
      };
    }
  } catch (error) {
    results.services.supabase = {
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      test_passed: false,
    };
  }

  // ========================================
  // 3. RESEND EMAIL TEST
  // ========================================
  try {
    const resendConfig = {
      configured: !!process.env.RESEND_API_KEY,
      from: process.env.FROM_EMAIL || 'NOT SET',
    };

    if (resendConfig.configured) {
      // Note: We can't easily test Resend without actually sending an email
      // So we'll just verify configuration
      results.services.email = {
        status: 'CONFIGURED',
        configured: true,
        from_email: process.env.FROM_EMAIL,
        test_passed: null, // Would need to send actual email to verify
        note: 'Resend is configured. To test fully, trigger an actual email (registration, order notification, etc.)',
        provider: 'Resend',
      };
    } else {
      results.services.email = {
        status: 'NOT CONFIGURED',
        configured: false,
        missing_vars: [
          !process.env.RESEND_API_KEY && 'RESEND_API_KEY',
        ].filter(Boolean),
        test_passed: false,
      };
    }
  } catch (error) {
    results.services.email = {
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      test_passed: false,
    };
  }

  // ========================================
  // 4. DATABASE TEST
  // ========================================
  try {
    const { db: dbClient } = await import('@/db');
    const { sql: drizzleSql } = await import('drizzle-orm');

    const dbConfig = {
      configured: Boolean(process.env.DATABASE_URL),
      has_url: !!process.env.DATABASE_URL,
    };

    if (dbConfig.configured) {
      try {
        // Test connection
        const result = await dbClient.execute(drizzleSql`SELECT 1 as test`);

        // Get table count
        const tables = await dbClient.execute(drizzleSql`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`);

        const tableCount = tables.rows[0]?.count || 0;

        results.services.turso = {
          status: 'OPERATIONAL',
          configured: true,
          test_query_passed: result.rows[0]?.test === 1,
          tables_count: tableCount,
          test_passed: true,
          note: 'Database connection successful',
        };
      } catch (dbError: any) {
        results.services.turso = {
          status: 'ERROR',
          configured: true,
          error: dbError.message,
          test_passed: false,
          hint: 'Database credentials may be invalid. Check DATABASE_URL.',
        };
      }
    } else {
      results.services.turso = {
        status: 'NOT CONFIGURED',
        configured: false,
        missing_vars: [
          !process.env.DATABASE_URL && 'DATABASE_URL',
        ].filter(Boolean),
        test_passed: false,
      };
    }
  } catch (error) {
    results.services.turso = {
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      test_passed: false,
    };
  }

  // ========================================
  // 5. PAYMENT GATEWAYS (CONFIG CHECK ONLY)
  // ========================================
  results.services.payments = {
    mpesa: {
      configured: Boolean(
        process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_SHORTCODE &&
        process.env.MPESA_PASSKEY
      ),
      environment: process.env.MPESA_ENVIRONMENT || 'NOT SET',
      shortcode: process.env.MPESA_SHORTCODE || 'NOT SET',
      note: 'M-Pesa requires live transaction to test fully',
    },
    paystack: {
      configured: Boolean(process.env.PAYSTACK_SECRET_KEY),
      key_type: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 
                process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN',
      note: 'Paystack requires live transaction to test fully',
    },
  };

  // ========================================
  // SUMMARY
  // ========================================
  const allServices = [
    results.services.cloudinary,
    results.services.supabase,
    results.services.email,
    results.services.turso,
  ];

  const operationalCount = allServices.filter(s => s.status === 'OPERATIONAL').length;
  const configuredCount = allServices.filter(s => s.configured === true).length;

  results.summary = {
    total_services: 4,
    operational: operationalCount,
    configured: configuredCount,
    overall_health: operationalCount === 4 ? 'EXCELLENT' : 
                    operationalCount >= 3 ? 'GOOD' : 
                    operationalCount >= 2 ? 'DEGRADED' : 'CRITICAL',
    primary_storage: results.services.cloudinary.status === 'OPERATIONAL' ? 'Cloudinary (OK)' : 'UNAVAILABLE',
    database: results.services.turso.status === 'OPERATIONAL' ? 'Database (Supabase - OK)' : 'UNAVAILABLE',
    email: results.services.email.status === 'CONFIGURED' ? 'Resend (Configured)' : 'UNAVAILABLE',
  };

  // ========================================
  // RECOMMENDATIONS
  // ========================================
  results.recommendations = [];

  if (results.services.cloudinary.status !== 'OPERATIONAL') {
    results.recommendations.push({
      service: 'Cloudinary',
      priority: 'CRITICAL',
      action: 'Configure Cloudinary credentials in .env. This is the PRIMARY file storage.',
      vars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    });
  }

  if (results.services.turso.status !== 'OPERATIONAL') {
    results.recommendations.push({
      service: 'Database (Supabase)',
      priority: 'CRITICAL',
      action: 'Configure the Supabase Postgres database connection. Application cannot function without database.',
      vars: ['DATABASE_URL'],
    });
  }

  if (results.services.email.status !== 'CONFIGURED') {
    results.recommendations.push({
      service: 'Resend Email',
      priority: 'HIGH',
      action: 'Configure Resend API key for notifications.',
      vars: ['RESEND_API_KEY', 'FROM_EMAIL'],
    });
  }

  if (results.services.supabase.status !== 'OPERATIONAL') {
    results.recommendations.push({
      service: 'Supabase',
      priority: 'LOW',
      action: 'Supabase is optional secondary storage. Cloudinary is primary.',
      note: 'Not critical if Cloudinary is working.',
    });
  }


  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

