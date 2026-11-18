import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, googleAccounts, userStats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { generateSessionToken, setSessionCookie, type UserRole } from '@/lib/session';
import { buildSessionUserData } from '@/lib/session-user-data';
import { getDashboardForRole } from '@/lib/dashboard-routes';
import { getRoleId } from '@/lib/role-map';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, phone, role, googleId, avatarUrl } = body;

    if (!email || !name || !role || !googleId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, role, googleId' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = (role === 'writer' ? 'freelancer' : role) as UserRole;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Generate unique display ID and fallback phone if omitted
    const displayId = `TKL-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const normalizedPhone = phone && String(phone).trim() 
      ? String(phone).trim() 
      : `+000${randomUUID().replace(/-/g, '').slice(0, 12)}`;

    // Clients/Admins auto-approved; Freelancers/Managers pending
    const isClientOrAdmin = normalizedRole === 'client' || normalizedRole === 'account_owner' || normalizedRole === 'admin';
    const initialStatus = isClientOrAdmin ? 'approved' : 'pending';
    const isApproved = isClientOrAdmin;
    const roleId = getRoleId(normalizedRole);

    // Hash a random password for Google-authenticated user
    const randomPassword = randomUUID();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const now = new Date().toISOString();

    // Create user
    const [newUser] = await db.insert(users).values({
      displayId,
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      role: normalizedRole,
      roleId,
      phone: normalizedPhone,
      status: initialStatus,
      approved: isApproved,
      emailVerified: true,
      googleId,
      avatarUrl: avatarUrl || null,
      authProvider: 'google',
      balance: 0,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create user stats if userStats table exists
    try {
      await db.insert(userStats).values({
        userId: newUser.id,
        totalJobsPosted: 0,
        totalJobsCompleted: 0,
        totalJobsCancelled: 0,
        totalAmountEarned: 0,
        totalAmountSpent: 0,
        totalRatings: 0,
        onTimeDelivery: 0,
        lateDelivery: 0,
        revisionsRequested: 0,
      });
    } catch (statsErr) {
      console.warn('[Google Register] UserStats insert skipped:', statsErr);
    }

    // Link Google account
    await db.insert(googleAccounts).values({
      userId: newUser.id,
      googleId,
      email: normalizedEmail,
    });

    // Establish session token and cookie
    const token = generateSessionToken({
      userId: Number(newUser.id),
      email: normalizedEmail,
      role: normalizedRole,
    });
    const sessionUserData = await buildSessionUserData(newUser, normalizedRole);

    const redirectPath = getDashboardForRole(normalizedRole);

    const response = NextResponse.json({
      success: true,
      user: sessionUserData,
      redirectUrl: `${redirectPath}?google_success=true`,
      message: isApproved 
        ? 'Registration successful! Welcome to TaskLynk.' 
        : 'Registration received! Your application is pending admin approval.',
    });

    setSessionCookie(response, token, false);
    return response;

  } catch (error) {
    console.error('[Google Register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Google registration' },
      { status: 500 }
    );
  }
}
