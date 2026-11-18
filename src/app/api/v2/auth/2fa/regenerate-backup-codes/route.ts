/**
 * 🔐 2FA BACKUP CODES REGENERATION ENDPOINT
 * 
 * Generates new backup codes for users who have exhausted their existing ones
 * 
 * POST /api/v2/auth/2fa/regenerate-backup-codes
 * Body: { token: string } - Current TOTP code to confirm
 * 
 * SECURITY:
 * - Requires current valid TOTP code
 * - Admin role required
 * - Replaces all existing backup codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  verifyTwoFactorToken,
  decryptSecret,
  encryptSecret,
  regenerateBackupCodes,
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

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled.' },
        { status: 400 }
      );
    }

    // Decrypt secret
    const decryptedSecret = decryptSecret(user.twoFactorSecret, ENCRYPTION_KEY);

    // Verify TOTP code
    const isValid = verifyTwoFactorToken(decryptedSecret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code.' },
        { status: 401 }
      );
    }

    // Generate new backup codes
    const newBackupCodes = regenerateBackupCodes();
    const encryptedBackupCodes = encryptSecret(
      JSON.stringify(newBackupCodes),
      ENCRYPTION_KEY
    );

    // Update database
    await db
      .update(users)
      .set({
        twoFactorBackupCodes: encryptedBackupCodes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      data: {
        backupCodes: newBackupCodes,
      },
      message: 'New backup codes generated. Please save them securely.',
    });
  } catch (error) {
    console.error('2FA backup codes regeneration error:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate backup codes',
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

