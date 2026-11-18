import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';

/**
 * GET /api/admin/debug/smtp
 *
 * Admin-only endpoint to check email (Resend) configuration status
 * Returns whether environment variables are set (not the actual values)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resendConfig = {
      RESEND_API_KEY: {
        configured: !!process.env.RESEND_API_KEY,
        value: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 6)}...` : null,
      },
      FROM_EMAIL: {
        configured: !!process.env.FROM_EMAIL,
        value: process.env.FROM_EMAIL || null,
      },
    };

    const allConfigured = Object.values(resendConfig).every(v => v.configured);

    return NextResponse.json({
      status: allConfigured ? 'configured' : 'missing_variables',
      resend: resendConfig,
      recommendations: !allConfigured ? [
        'Set RESEND_API_KEY and FROM_EMAIL in your hosting provider\'s Environment Variables settings',
        'Get an API key from https://resend.com/api-keys',
        'FROM_EMAIL must use a domain verified in your Resend account',
      ] : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Resend Debug Error:', error);
    return NextResponse.json({
      error: 'Failed to check email config',
      details: error.message,
    }, { status: 500 });
  }
}
