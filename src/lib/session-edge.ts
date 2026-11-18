/**
 * Edge-Compatible Session Management
 * Uses jose library for JWT verification in Edge runtime
 */

import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from './session';

export interface SessionPayload {
  userId: number;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

const SESSION_CONFIG = {
  cookieName: 'auth_session',
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is required');
    return secret;
  })(),
};

/**
 * Get secret key as Uint8Array for jose
 */
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(SESSION_CONFIG.jwtSecret);
}

/**
 * Verify JWT token using jose (Edge-compatible)
 */
export async function verifySessionTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userIdRaw = (payload as any).userId;
    const emailRaw = (payload as any).email;
    const roleRaw = (payload as any).role;
    const sessionIdRaw = (payload as any).sessionId;

    const userId = typeof userIdRaw === 'number' ? userIdRaw : Number(userIdRaw);
    const email = typeof emailRaw === 'string' ? emailRaw : '';
    const role = roleRaw as UserRole;
    const sessionId = typeof sessionIdRaw === 'string' ? sessionIdRaw : '';

    if (!Number.isFinite(userId) || !email || !role || !sessionId) {
      return null;
    }

    return {
      userId,
      email,
      role,
      sessionId,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('[Session Edge] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Get session from request cookie (Edge runtime compatible)
 */
export async function getRequestSessionEdge(cookieValue: string | undefined): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  return await verifySessionTokenEdge(cookieValue);
}

