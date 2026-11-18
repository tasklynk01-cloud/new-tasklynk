/**
 * Secure Session Management System
 * Handles JWT tokens, cookies, and session validation
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Session configuration
const SESSION_CONFIG = {
  cookieName: 'auth_session',
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is required');
    return secret;
  })(),
  shortSessionDuration: 24 * 60 * 60, // 24 hours in seconds
  longSessionDuration: 30 * 24 * 60 * 60, // 30 days in seconds
  refreshThreshold: 60 * 60, // Refresh if expires in < 1 hour
};

export type UserRole = 'admin' | 'client' | 'freelancer' | 'manager' | 'account_owner' | 'writer' | 'editor';

export interface SessionPayload {
  userId: number;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface SessionAssignmentCounts {
  pendingResponse: number;
  active: number;
  total: number;
}

export interface SessionApprovalInfo {
  status: string;
  label: string;
  approved: boolean;
  emailVerified: boolean;
  reason?: string | null;
  blocked?: boolean;
}

export interface SessionData {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  status: string;
  balance?: number;
  rating?: number;
  phone?: string;
  profilePicture?: string | null;
  displayId?: string;
  emailVerified?: boolean;
  statusLabel?: string;
  approval?: SessionApprovalInfo;
  assignmentCounts?: SessionAssignmentCounts;
  hasPendingAssignments?: boolean;
  clientTier?: string | null;
  clientPriority?: string | null;
  freelancerBadge?: string | null;
  accountName?: string | null;
  presenceStatus?: string | null;
  assignedManagerId?: number | null;
  domainId?: number | null;
  accountId?: number | null;
}

/**
 * Generate a secure JWT token with user data
 */
export function generateSessionToken(payload: Omit<SessionPayload, 'sessionId' | 'iat' | 'exp'>, rememberMe: boolean = false): string {
  const sessionId = generateSessionId();
  const expiresIn = rememberMe ? SESSION_CONFIG.longSessionDuration : SESSION_CONFIG.shortSessionDuration;
  
  return jwt.sign(
    { ...payload, sessionId },
    SESSION_CONFIG.jwtSecret,
    { expiresIn }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SESSION_CONFIG.jwtSecret) as SessionPayload;
    return decoded;
  } catch (error) {
    console.error('[Session] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Check if token needs refresh (expires soon)
 */
export function shouldRefreshToken(payload: SessionPayload): boolean {
  if (!payload.exp) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - now;
  
  return timeUntilExpiry < SESSION_CONFIG.refreshThreshold;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Set session cookie (server-side)
 */
export function setSessionCookie(response: NextResponse, token: string, rememberMe: boolean = false): void {
  const maxAge = rememberMe ? SESSION_CONFIG.longSessionDuration : SESSION_CONFIG.shortSessionDuration;
  
  response.cookies.set(SESSION_CONFIG.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

/**
 * Clear session cookie (server-side)
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_CONFIG.cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Get session from cookie (server-side)
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_CONFIG.cookieName)?.value;
    
    if (!token) return null;
    
    return verifySessionToken(token);
  } catch (error) {
    console.error('[Session] Failed to get server session:', error);
    return null;
  }
}

/**
 * Get session from request (middleware)
 */
export function getRequestSession(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(SESSION_CONFIG.cookieName)?.value;
  
  if (!token) return null;
  
  return verifySessionToken(token);
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
}

/**
 * Get dashboard path for user role
 */
export function getDashboardPath(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    client: '/client/dashboard',
    account_owner: '/client/dashboard',
    freelancer: '/freelancer/dashboard',
    writer: '/freelancer/dashboard',
    editor: '/editor/dashboard',
  };
  
  return dashboards[role] || '/login';
}

/**
 * Create session response with user data
 */
export function createSessionResponse(sessionData: SessionData, token: string, rememberMe: boolean = false): NextResponse {
  const response = NextResponse.json({
    success: true,
    user: sessionData,
    token, // Bridge: included so client can store for legacy components
    session: {
      expiresAt: new Date(Date.now() + (rememberMe ? SESSION_CONFIG.longSessionDuration : SESSION_CONFIG.shortSessionDuration) * 1000).toISOString(),
      rememberMe,
    },
  });
  
  setSessionCookie(response, token, rememberMe);
  
  return response;
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

