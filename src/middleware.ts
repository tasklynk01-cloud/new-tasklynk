import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware
 * 
 * This middleware runs on every request to ensure the application is properly configured.
 * It provides early validation and helpful error messages.
 */

export function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes that don't need full validation
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Environment validation happens at module load via startup-validation.ts
  // This middleware just adds helpful headers
  
  // CSP header - TaskLynk on Render with Cloudflare protection
  // Generate nonce for inline scripts (replaces unsafe-eval)
  // unsafe-inline kept as fallback for older browsers; modern browsers ignore it when nonce is present
  const nonce = btoa(crypto.randomUUID());
  
  // Pass nonce to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://slelguoygbfzlpylpxfs.supabase.co",
    "https://static.cloudflareinsights.com",
    "https://js.paystack.co",
    "https://pagead2.googlesyndication.com",
    "https://tpc.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
    "https://www.google.com",
    "https://adservice.google.com",
  ].join(' ');

  const cspHeader = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' blob: data: https: https://res.cloudinary.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com",
    "connect-src 'self' https: wss: https://cloudflareinsights.com https://api.paystack.co https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com https://ep2.adtrafficquality.google",
    "frame-src 'self' https://js.paystack.co https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com https://*.google.com https://*.adtrafficquality.google https://ep2.adtrafficquality.google",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
  // Also expose nonce on response for client consumption
  response.headers.set('x-nonce', nonce);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - Any files with extensions (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\..*).*)',
  ],
};

