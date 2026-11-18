/**
 * Hash-Session API Route
 *
 * Handles Google OAuth implicit-flow tokens that arrive in the URL hash fragment
 * (`#access_token=...&refresh_token=...`) instead of as a `?code=` query parameter.
 *
 * The server-side `/api/auth/callback` route cannot see hash fragments, so when
 * Supabase returns tokens via the implicit flow, the callback redirects to
 * `/login?error=auth_no_code` while the valid tokens sit unused in the hash.
 *
 * This endpoint accepts those tokens, verifies them with Supabase, and creates
 * the app's own httpOnly session cookie.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/db';
import { users, googleAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSessionToken, setSessionCookie, type UserRole } from '@/lib/session';
import { buildSessionUserData } from '@/lib/session-user-data';
import { getDashboardForRole } from '@/lib/dashboard-routes';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function determineUserRole(user: { role?: string | null }): UserRole {
  const roleText = String(user.role || '').toLowerCase();
  if (roleText === 'writer') return 'freelancer';
  if (['admin', 'client', 'freelancer', 'manager', 'account_owner', 'editor'].includes(roleText)) {
    return roleText as UserRole;
  }
  return 'client';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token) {
      return NextResponse.json(
        { error: 'Missing access_token' },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;

    // Use Supabase admin client to verify the access token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the access token by getting user info — this is a server-side
    // operation that works reliably with the service-role key (unlike setSession
    // which is a client-side method that can fail silently with admin keys).
    const { data: userData, error: userError } = await supabase.auth.getUser(access_token);

    if (userError || !userData?.user) {
      console.error('[Hash Session] Failed to verify access token:', userError?.message);
      return NextResponse.json(
        { error: 'Invalid or expired tokens' },
        { status: 401 }
      );
    }

    const supabaseUser = userData.user;
    const googleId = supabaseUser.id;
    const email = supabaseUser.email || '';
    const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email.split('@')[0];
    const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

    // Check if user already exists by google_id
    const existingGoogleAccount = await db
      .select()
      .from(googleAccounts)
      .where(eq(googleAccounts.googleId, googleId))
      .limit(1);

    if (existingGoogleAccount.length > 0) {
      const userId = existingGoogleAccount[0].userId;

      await db
        .update(googleAccounts)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(googleAccounts.googleId, googleId));

      await db
        .update(users)
        .set({
          lastLoginAt: new Date().toISOString(),
          avatarUrl: avatarUrl || undefined,
        })
        .where(eq(users.id, userId));

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user) {
        const role = determineUserRole(user);
        const token = generateSessionToken({
          userId: Number(user.id),
          email: String(user.email),
          role,
        });
        const userData = await buildSessionUserData(user, role);

        const response = NextResponse.json({
          success: true,
          redirectUrl: `${getDashboardForRole(role)}?google_success=true`,
          user: userData,
        });
        setSessionCookie(response, token, false);
        return response;
      }
    }

    // Check if user exists by email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Link Google account to existing user
      await db.insert(googleAccounts).values({
        userId: existingUser[0].id,
        googleId,
        email,
        accessToken: access_token,
        refreshToken: refresh_token || null,
      });

      await db
        .update(users)
        .set({
          authProvider: 'google',
          googleId,
          avatarUrl: avatarUrl || undefined,
          lastLoginAt: new Date().toISOString(),
        })
        .where(eq(users.id, existingUser[0].id));

      const [user] = await db.select().from(users).where(eq(users.id, existingUser[0].id)).limit(1);
      if (user) {
        const role = determineUserRole(user);
        const token = generateSessionToken({
          userId: Number(user.id),
          email: String(user.email),
          role,
        });
        const userData = await buildSessionUserData(user, role);

        const response = NextResponse.json({
          success: true,
          redirectUrl: `${getDashboardForRole(role)}?google_success=true`,
          user: userData,
        });
        setSessionCookie(response, token, false);
        return response;
      }
    }

    // New user - redirect to registration with Google data
    const googleData = encodeURIComponent(JSON.stringify({
      email,
      name,
      avatarUrl,
      googleId,
    }));

    return NextResponse.json({
      success: false,
      redirectUrl: `/register/google?data=${googleData}`,
      isNewUser: true,
    });
  } catch (err) {
    console.error('[Hash Session] Error:', err);
    return NextResponse.json(
      { error: 'Failed to process authentication' },
      { status: 500 }
    );
  }
}
