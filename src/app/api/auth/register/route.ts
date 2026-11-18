import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { pendingRegistrations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendEmail, getEmailVerificationHTML } from '@/lib/email';
import { registrationRateLimiter, applyRateLimit } from '@/lib/rate-limit';
import { sql } from 'drizzle-orm';
import { setAuthCookie } from '@/lib/auth-tokens';
import { createSuccessResponse, createErrorResponse, handleOptions } from '@/lib/api-helpers';

/**
 * `users.phone` has a UNIQUE constraint. Registrations that skip the phone
 * field all used to fall back to the same hardcoded "+254700000000" value,
 * so every account after the first one to use it hit a unique-constraint
 * violation at verification time (surfaced as an opaque 500). Generate a
 * distinct placeholder per registration instead.
 */
function generatePlaceholderPhone(): string {
  return `+000${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  let pendingRegId: string | null = null;

  try {
    if (!db) {
      return createErrorResponse('Database connection error', 'DATABASE_UNAVAILABLE', 503);
    }

    if (!process.env.DATABASE_URL) {
      return createErrorResponse('Database not configured', 'DATABASE_NOT_CONFIGURED', 503);
    }

    const body = await request.json();
    const { email, password, name, role, phone, account_name, accountName, domain_id, subject_ids } = body;

    if (!email || !password || !name || !role) {
      return createErrorResponse('Missing required fields', 'MISSING_FIELDS', 400);
    }

    // Rate limiting, scoped per-account (email) rather than per-IP so
    // registering multiple different-role accounts (client, admin, manager,
    // editor, freelancer) from the same machine doesn't share a lockout.
    const rateLimitResponse = await applyRateLimit(request, registrationRateLimiter, email);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let normalizedPhone = generatePlaceholderPhone();
    if (phone && String(phone).trim()) {
      const rawPhone = String(phone).trim().replace(/[\s-()]/g, '');
      if (rawPhone.length > 0) {
        const keLocalPattern = /^0[17]\d{8}$/;
        const keInternationalPattern = /^\+254[17]\d{8}$/;
        if (keLocalPattern.test(rawPhone)) {
          normalizedPhone = `+254${rawPhone.slice(1)}`;
        } else if (keInternationalPattern.test(rawPhone)) {
          normalizedPhone = rawPhone;
        } else {
          return createErrorResponse('Invalid phone number format', 'INVALID_PHONE', 400);
        }
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existingUser.length > 0) {
      return createErrorResponse('Email already registered', 'EMAIL_EXISTS', 409);
    }

    const existingPending = await db.select().from(pendingRegistrations).where(eq(pendingRegistrations.email, normalizedEmail)).limit(1);
    if (existingPending.length > 0) {
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, normalizedEmail));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const timestamp = new Date().toISOString();
    const finalAccountName = accountName || account_name;

    if (finalAccountName) {
      await db.execute(sql`INSERT INTO pending_registrations (email, password, name, role, phone, verification_code, code_expires_at, created_at, account_name) VALUES (${normalizedEmail}, ${hashedPassword}, ${name.trim()}, ${role}, ${normalizedPhone}, ${verificationCode}, ${codeExpiresAt}, ${timestamp}, ${finalAccountName})`);
    } else {
      await db.execute(sql`INSERT INTO pending_registrations (email, password, name, role, phone, verification_code, code_expires_at, created_at) VALUES (${normalizedEmail}, ${hashedPassword}, ${name.trim()}, ${role}, ${normalizedPhone}, ${verificationCode}, ${codeExpiresAt}, ${timestamp})`);
    }

    let verificationSent = false;
    let verificationMethod = 'none';
    try {
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: 'Verify Your TaskLynk Account',
        html: getEmailVerificationHTML(name.trim(), verificationCode),
        category: 'registration',
      });
      if (emailResult.success) {
        verificationSent = true;
        verificationMethod = 'email';
      }
    } catch (error) {
      console.error('Email sending failed:', error);
    }

    let responseMessage = 'Registration successful! Please check your email to verify your account.';
    if (verificationMethod !== 'email') {
      responseMessage = 'Registration successful. Contact support for verification.';
    }

    const response = createSuccessResponse({
        message: responseMessage,
        verificationMethod,
        email: normalizedEmail,
    });

    return response;
  } catch (error: any) {
    console.error('[Register] Registration failed:', error);
    return createErrorResponse(error.message || 'An unknown error occurred', 'REGISTRATION_FAILED', 500);
  }
}

