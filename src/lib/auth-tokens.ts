import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { NextApiResponse } from 'next';
import type { NextResponse } from 'next/server';

// JWT configuration
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
})();

const JWT_EXPIRY = '7d'; // 7 days
const JWT_REFRESH_EXPIRY = '30d'; // 30 days for remember me
const TOKEN_NAME = 'auth_token';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token and set it as a cookie
 * @param res - NextApiResponse object
 * @param user - User object containing id, email, and role
 * @param rememberMe - If true, extends token expiry to 30 days
 */
export function setAuthCookie(
  res: NextApiResponse | NextResponse,
  user: { id: number; email: string; role: string },
  rememberMe: boolean = false
): void {
  const expiry = rememberMe ? JWT_REFRESH_EXPIRY : JWT_EXPIRY;
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: expiry }
  );

  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
  });

  const anyRes = res as any;
  if (anyRes?.cookies?.set) {
    anyRes.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });
    return;
  }

  (res as NextApiResponse).setHeader('Set-Cookie', cookie);
}

/**
 * Clear the authentication cookie
 * @param res - NextApiResponse object
 */
export function clearAuthCookie(res: NextApiResponse | NextResponse): void {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
  });

  const anyRes = res as any;
  if (anyRes?.cookies?.set) {
    anyRes.cookies.set(TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    });
    return;
  }

  (res as NextApiResponse).setHeader('Set-Cookie', cookie);
}

/**
 * Verify and decode a JWT token from cookies
 * @param req - NextApiRequest object
 * @returns Decoded token payload or null if invalid/expired
 */
export function verifyTokenFromCookie(req: { headers: { cookie?: string } }): TokenPayload | null {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[TOKEN_NAME];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Verify and decode a raw JWT token string
 * Used by admin-auth.ts for Bearer token validation
 * @param token - Raw JWT token string
 * @returns Decoded token payload or null if invalid/expired
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

