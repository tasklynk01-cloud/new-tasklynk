import { NextRequest, NextResponse } from 'next/server';

/**
 * API Health Check & Debug Endpoint
 * 
 * This endpoint helps diagnose 403 issues by showing:
 * - Server status
 * - Environment configuration
 * - Authentication headers
 * - Cookie status
 * 
 * GET /api/debug/auth
 */
export async function GET(request: NextRequest) {
  const headers = request.headers;
  const cookies = request.cookies;
  
  // Extract authentication info without exposing secrets
  const authHeader = headers.get('Authorization');
  const hasAuthHeader = !!authHeader;
  const authHeaderType = authHeader ? authHeader.split(' ')[0] : null;
  
  const cookieNames = Array.from(cookies.getAll()).map(c => c.name);
  const hasAuthSessionCookie = cookieNames.includes('auth_session');
  
  // Check environment variables (without exposing values)
  const envCheck = {
    JWT_SECRET: !!process.env.JWT_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  const debugInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      platform: process.platform,
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
    },
    environment: envCheck,
    request: {
      method: request.method,
      url: request.url,
      hasAuthHeader,
      authHeaderType,
      hasAuthSessionCookie,
      cookieCount: cookieNames.length,
      cookieNames: cookieNames.filter(n => !n.includes('session')), // Hide session cookie names
      userAgent: headers.get('user-agent'),
      origin: headers.get('origin'),
      referer: headers.get('referer'),
    },
    deployment: {
      isProduction: process.env.NODE_ENV === 'production',
      hasDatabase: envCheck.DATABASE_URL,
      hasJwtSecret: envCheck.JWT_SECRET,
    }
  };
  
  return NextResponse.json(debugInfo, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }
  });
}

