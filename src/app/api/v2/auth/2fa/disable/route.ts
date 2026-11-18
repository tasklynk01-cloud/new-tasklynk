/**
 * 🔐 2FA DISABLE ENDPOINT
 * 
 * Disables two-factor authentication for admin users
 * 
 * POST /api/v2/auth/2fa/disable
 * Body: { token: string } - Current TOTP code to confirm
 * 
 * SECURITY:
 * - Requires current valid TOTP code to disable
 * - Admin role required
 * - Clears all 2FA data from database
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
        { error: 'Verification code is required to disable 2FA' },
        { status: 400 }
      );
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled.' },
        { status: 400 }
      );
    }

    // Decrypt secret
    const decryptedSecret = decryptSecret(user.twoFactorSecret, ENCRYPTION_KEY);

    // Verify TOTP code before disabling
    const isValid = verifyTwoFactorToken(decryptedSecret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code. Cannot disable 2FA.' },
        { status: 401 }
      );
    }

    // Disable 2FA and clear all 2FA data
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorVerifiedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled successfully.',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      {
        error: 'Failed to disable two-factor authentication',
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

