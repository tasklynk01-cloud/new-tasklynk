import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/startup-validation';

/**
 * Environment Configuration Health Check
 * 
 * GET /api/health/env
 * 
 * Returns the status of environment configuration.
 * Useful for monitoring, debugging, and deployment verification.
 */

export async function GET(request: NextRequest) {
  try {
    // Check authentication (optional - only show to admins)
    const authHeader = request.headers.get('authorization');
    const isAdmin = authHeader?.includes('admin'); // Simplified check
    
    // Basic status (always available)
    const basicStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      phases: {
        phase1_core: checkPhase1(),
        phase2_security: checkPhase2(),
        phase3_database: checkPhase3(),
        phase4_email: checkPhase4(),
        phase5_storage: checkPhase5(),
        phase6_mpesa: checkPhase6(),
        phase7_paystack: checkPhase7(),
      },
    };

    // Detailed status (admin only)
    if (isAdmin) {
      return NextResponse.json({
        ...basicStatus,
        details: {
          nodeEnv: env.NODE_ENV,
          appUrl: env.NEXT_PUBLIC_APP_URL,
          database: {
            type: 'supabase',
            configured: !!env.DATABASE_URL,
          },
          email: {
            provider: 'resend',
            fromEmail: env.FROM_EMAIL,
            configured: !!env.RESEND_API_KEY,
          },
          storage: {
            provider: 'cloudinary',
            configured: !!env.CLOUDINARY_CLOUD_NAME && !!env.CLOUDINARY_API_KEY,
          },
          payments: {
            mpesa: !!env.MPESA_CONSUMER_KEY && !!env.MPESA_CONSUMER_SECRET,
            paystack: !!env.PAYSTACK_SECRET_KEY,
          },
        },
      });
    }

    return NextResponse.json(basicStatus);
  } catch (error) {
    console.error('Environment health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Environment configuration is invalid or incomplete',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions to check each phase
function checkPhase1(): { status: string; configured: boolean } {
  try {
    const configured = 
      !!env.NODE_ENV &&
      !!env.NEXT_PUBLIC_APP_URL &&
      env.NEXT_PUBLIC_APP_URL.startsWith('http');
    
    return { status: configured ? 'ok' : 'incomplete', configured };
  } catch {
    return { status: 'error', configured: false };
  }
}

function checkPhase2(): { status: string; configured: boolean } {
  try {
    const configured = 
      !!env.JWT_SECRET &&
      env.JWT_SECRET.length >= 32;
    
    return { status: configured ? 'ok' : 'incomplete', configured };
  } catch {
    return { status: 'error', configured: false };
  }
}

function checkPhase3(): { status: string; configured: boolean } {
  try {
    const configured =
      !!env.DATABASE_URL &&
      (env.DATABASE_URL.startsWith('postgres://') || env.DATABASE_URL.startsWith('postgresql://'));
    
    return { status: configured ? 'ok' : 'incomplete', configured };
  } catch {
    return { status: 'error', configured: false };
  }
}

function checkPhase4(): { status: string; configured: boolean } {
  try {
    const configured = !!env.RESEND_API_KEY;

    return { status: configured ? 'ok' : 'incomplete', configured };
  } catch {
    return { status: 'error', configured: false };
  }
}

function checkPhase5(): { status: string; configured: boolean } {
  try {
    const configured = 
      !!env.CLOUDINARY_CLOUD_NAME &&
      !!env.CLOUDINARY_API_KEY &&
      !!env.CLOUDINARY_API_SECRET;
    
    return { status: configured ? 'ok' : 'incomplete', configured };
  } catch {
    return { status: 'error', configured: false };
  }
}

function checkPhase6(): { status: string; configured: boolean } {
  try {
    const configured = 
      !!env.MPESA_CONSUMER_KEY &&
      !!env.MPESA_CONSUMER_SECRET &&
      !!env.MPESA_SHORTCODE &&
      !!env.MPESA_PASSKEY;
    
    return { 
      status: configured ? 'ok' : 'optional', 
      configured 
    };
  } catch {
    return { status: 'optional', configured: false };
  }
}

function checkPhase7(): { status: string; configured: boolean } {
  try {
    const configured = 
      !!env.PAYSTACK_SECRET_KEY &&
      !!env.PAYSTACK_PUBLIC_KEY;
    
    return { 
      status: configured ? 'ok' : 'optional', 
      configured 
    };
  } catch {
    return { status: 'optional', configured: false };
  }
}


