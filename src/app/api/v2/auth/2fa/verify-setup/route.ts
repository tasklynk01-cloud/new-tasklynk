/**
 * 🔐 2FA SETUP VERIFICATION ENDPOINT
 * 
 * Verifies TOTP code to complete 2FA setup and enable 2FA for user
 * 
 * POST /api/v2/auth/2fa/verify-setup
 * Body: { token: string }
 * 
 * SECURITY:
 * - Verifies TOTP code matches secret
 * - Enables 2FA only after successful verification
 * - Admin role required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  verifyTwoFactorToken,
  decryptSecret,
} from '@/lib/two-factor-auth';

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const user = authCheck.user;
    const body = await request.json();
    const { token } = body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Check if user has a pending 2FA setup
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'No 2FA setup found. Please start setup first.' },
        { status: 400 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled.' },
        { status: 400 }
      );
    }

    // Decrypt secret
    const decryptedSecret = decryptSecret(user.twoFactorSecret, ENCRYPTION_KEY);

    // Verify TOTP code
    const isValid = verifyTwoFactorToken(decryptedSecret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 401 }
      );
    }

    // Enable 2FA
    await db
      .update(users)
      .set({
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully.',
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify two-factor authentication',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

