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

/** Establish the app's own httpOnly session cookie for a user record and redirect to their dashboard. */
async function respondWithSession(origin: string, user: typeof users.$inferSelect) {
  const role = determineUserRole(user);
  const token = generateSessionToken({
    userId: Number(user.id),
    email: String(user.email),
    role,
  });
  const sessionData = await buildSessionUserData(user, role);

  const response = NextResponse.redirect(`${origin}${getDashboardForRole(role)}?google_success=true`);
  setSessionCookie(response, token, false);
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    // No code - likely an implicit-flow (hash-fragment) redirect that never reached
    // this server route with usable params. Nothing to exchange server-side.
    return NextResponse.redirect(`${origin}/login?error=auth_no_code`);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] Exchange code error:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
    }

    if (!data.user) {
      return NextResponse.redirect(`${origin}/login?error=no_user_data`);
    }

    const googleId = data.user.id;
    const email = data.user.email || '';
    const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];
    const avatarUrl = data.user.user_metadata?.avatar_url || null;

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
          accessToken: data.session?.access_token || null,
          refreshToken: data.session?.refresh_token || null,
          expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(googleAccounts.googleId, googleId));

      await db
        .update(users)
        .set({
          lastLoginAt: new Date().toISOString(),
          loginCount: undefined,
          avatarUrl: avatarUrl || undefined,
        })
        .where(eq(users.id, userId));

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user) {
        return respondWithSession(origin, user);
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
        googleId: googleId,
        email: email,
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      });

      await db
        .update(users)
        .set({
          authProvider: 'google',
          googleId: googleId,
          avatarUrl: avatarUrl || undefined,
          lastLoginAt: new Date().toISOString(),
        })
        .where(eq(users.id, existingUser[0].id));

      const [user] = await db.select().from(users).where(eq(users.id, existingUser[0].id)).limit(1);
      return respondWithSession(origin, user);
    }

    // New user - redirect to registration with Google data
    const googleData = encodeURIComponent(JSON.stringify({
      email,
      name,
      avatarUrl,
      googleId,
    }));

    return NextResponse.redirect(`${origin}/register/google?data=${googleData}`);
  } catch (err) {
    console.error('[Auth Callback] Error:', err);
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }
}
