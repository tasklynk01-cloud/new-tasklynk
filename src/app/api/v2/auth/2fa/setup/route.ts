/**
 * 🔐 2FA SETUP ENDPOINT
 * 
 * Generates 2FA secret and QR code for admin users to enable 2FA
 * 
 * POST /api/v2/auth/2fa/setup
 * - Generates new TOTP secret
 * - Creates QR code for authenticator app
 * - Generates backup codes
 * - Requires admin authentication
 * 
 * SECURITY:
 * - Admin role required
 * - Secret encrypted before storage
 * - Backup codes encrypted
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  generateTwoFactorSecret,
  encryptSecret,
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

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        {
          error: 'Two-factor authentication is already enabled. Disable it first to set up a new secret.',
        },
        { status: 400 }
      );
    }

    // Generate 2FA secret and setup data
    const setupData = await generateTwoFactorSecret(user.email);

    // Encrypt secret and backup codes for storage
    const encryptedSecret = encryptSecret(setupData.secret, ENCRYPTION_KEY);
    const encryptedBackupCodes = encryptSecret(
      JSON.stringify(setupData.backupCodes),
      ENCRYPTION_KEY
    );

    // Store encrypted secret (but don't enable 2FA yet - requires verification)
    await db
      .update(users)
      .set({
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: encryptedBackupCodes,
        twoFactorEnabled: false, // Not enabled until user verifies
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // Return setup data to client
    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setupData.qrCodeUrl,
        manualEntryKey: setupData.manualEntryKey,
        backupCodes: setupData.backupCodes,
      },
      message: 'Scan the QR code with your authenticator app, then verify with a code to enable 2FA.',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      {
        error: 'Failed to set up two-factor authentication',
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

