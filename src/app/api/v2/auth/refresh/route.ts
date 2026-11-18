import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import jwt from 'jsonwebtoken';

/**
 * POST /api/v2/auth/refresh
 * Refresh user's authentication token
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer', 'editor', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        sessionId: `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        issuer: 'tasklynk',
        audience: user.role
      }
    );

    // Set token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      token: newToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    response.cookies.set('auth_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

