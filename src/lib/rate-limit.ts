import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔒 RATE LIMITING MIDDLEWARE
 *
 * Prevents brute force attacks on sensitive endpoints like login/register
 * Uses in-memory sliding window approach
 *
 * FEATURES:
 * - Sliding window rate limiting
 * - Tracking is scoped per-account (email) when an identifier is supplied,
 *   falling back to IP-only when it isn't. This keeps one account's failed
 *   attempts (or lockout) from blocking every other account behind the same
 *   IP — e.g. testing client/admin/manager/editor/freelancer logins back to
 *   back from the same machine no longer trips a shared lockout.
 * - Automatic cleanup of old entries
 * - Configurable limits and windows
 *
 * USAGE:
 * const limiter = createRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });
 * const result = await limiter.check(request, email); // pass the account identifier when known
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.error }, { status: 429 });
 * }
 * // On successful auth for that identifier, clear its bucket so future
 * // attempts start fresh: limiter.reset(request, email);
 *
 * PRODUCTION NOTE:
 * For production with multiple servers, consider using Redis or similar
 * distributed cache instead of in-memory storage.
 */

interface RateLimitEntry {
  attempts: number[];
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  resetTime?: number;
  error?: string;
}

// In-memory store for rate limiting
// Key: IP address, Value: Rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup old entries from the rate limit store
 * Call this periodically to prevent memory leaks
 */
function cleanupOldEntries(windowMs: number): void {
  const now = Date.now();
  const cutoff = now - windowMs;

  for (const [ip, entry] of rateLimitStore.entries()) {
    // Remove attempts outside the window
    entry.attempts = entry.attempts.filter(timestamp => timestamp > cutoff);

    // Remove entry if no attempts and not blocked
    if (entry.attempts.length === 0 && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Extract client IP from request
 * Checks X-Forwarded-For header for proxy/load balancer scenarios
 */
function getClientIP(request: NextRequest): string {
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  return 'unknown';
}

/**
 * Build the store key for a request. When an account identifier (e.g. email)
 * is supplied, the bucket is scoped to that account so unrelated accounts
 * sharing an IP (shared office network, local dev machine, etc.) don't share
 * a lockout. Falls back to IP-only for anonymous/unauthenticated checks.
 */
function buildKey(ip: string, identifier?: string): string {
  if (identifier && identifier.trim()) {
    return `${ip}:${identifier.trim().toLowerCase()}`;
  }
  return ip;
}

/**
 * Create a rate limiter instance
 * 
 * @param config - Configuration for the rate limiter
 * @returns Rate limiter object with check method
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxAttempts,
    windowMs,
    blockDurationMs = windowMs, // Default block duration same as window
  } = config;

  // Cleanup interval (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    cleanupOldEntries(windowMs);
  }, 5 * 60 * 1000);

  // Ensure cleanup runs when the process exits
  if (typeof process !== 'undefined') {
    process.on('beforeExit', () => {
      clearInterval(cleanupInterval);
    });
  }

  return {
    maxAttempts,
    /**
     * Check if request is allowed based on rate limit
     *
     * @param request - NextRequest to check
     * @param identifier - Optional account identifier (e.g. email) to scope the bucket per-account
     * @returns Result indicating if request is allowed
     */
    async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
      const ip = getClientIP(request);
      const key = buildKey(ip, identifier);
      const now = Date.now();

      // Get or create entry for this key
      let entry = rateLimitStore.get(key);
      if (!entry) {
        entry = { attempts: [] };
        rateLimitStore.set(key, entry);
      }

      // Check if IP is currently blocked
      if (entry.blockedUntil && entry.blockedUntil > now) {
        const resetTime = entry.blockedUntil;
        const waitTime = Math.ceil((resetTime - now) / 1000);
        
        return {
          allowed: false,
          resetTime,
          error: `Too many attempts. Please try again in ${waitTime} seconds.`
        };
      }

      // Clear block if expired
      if (entry.blockedUntil && entry.blockedUntil <= now) {
        entry.blockedUntil = undefined;
        entry.attempts = [];
      }

      // Remove attempts outside the window
      const windowStart = now - windowMs;
      entry.attempts = entry.attempts.filter(timestamp => timestamp > windowStart);

      // Check if max attempts exceeded
      if (entry.attempts.length >= maxAttempts) {
        // Block the IP
        entry.blockedUntil = now + blockDurationMs;
        const waitTime = Math.ceil(blockDurationMs / 1000);
        
        return {
          allowed: false,
          resetTime: entry.blockedUntil,
          error: `Too many attempts. Account temporarily locked for ${waitTime} seconds.`
        };
      }

      // Record this attempt
      entry.attempts.push(now);

      // Calculate remaining attempts
      const remainingAttempts = maxAttempts - entry.attempts.length;
      const resetTime = entry.attempts[0] + windowMs;

      return {
        allowed: true,
        remainingAttempts,
        resetTime
      };
    },

    /**
     * Reset rate limit for a specific store key (raw IP or "ip:identifier")
     * Useful for testing or manual intervention
     *
     * @param key - Store key to reset
     */
    reset(key: string): void {
      rateLimitStore.delete(key);
    },

    /**
     * Reset the rate limit bucket for a given request/account, e.g. after a
     * successful login so a prior run of failed attempts doesn't linger.
     *
     * @param request - NextRequest the attempt came from
     * @param identifier - Optional account identifier (e.g. email) used to scope the bucket
     */
    resetForRequest(request: NextRequest, identifier?: string): void {
      const ip = getClientIP(request);
      rateLimitStore.delete(buildKey(ip, identifier));
    },

    /**
     * Get current status for a store key without recording an attempt
     *
     * @param key - Store key to check (raw IP or "ip:identifier")
     * @returns Current rate limit status
     */
    getStatus(key: string): { attempts: number; blocked: boolean } {
      const entry = rateLimitStore.get(key);
      if (!entry) {
        return { attempts: 0, blocked: false };
      }

      const now = Date.now();
      const isBlocked = entry.blockedUntil ? entry.blockedUntil > now : false;
      const windowStart = now - windowMs;
      const currentAttempts = entry.attempts.filter(t => t > windowStart).length;

      return {
        attempts: currentAttempts,
        blocked: isBlocked
      };
    }
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Login rate limiter: 5 attempts per 15 minutes
export const loginRateLimiter = createRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 15 * 60 * 1000, // Block for 15 minutes
});

// Registration rate limiter: 3 attempts per hour
export const registrationRateLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
});

// Password reset rate limiter: 3 attempts per hour
export const passwordResetRateLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
});

// API rate limiter: 100 requests per minute
export const apiRateLimiter = createRateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 60 * 1000, // Block for 1 minute
});

// Strict rate limiter for sensitive operations: 3 attempts per 30 minutes
export const strictRateLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 30 * 60 * 1000, // 30 minutes
  blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
});

/**
 * Helper function to apply rate limiting to an API route
 * Returns a response if rate limit exceeded, null otherwise
 *
 * @param request - NextRequest to check
 * @param limiter - Rate limiter to use
 * @param identifier - Optional account identifier (e.g. email) to scope the bucket per-account
 *                      instead of per-IP, so different accounts tested from the same machine
 *                      don't share a lockout.
 * @returns NextResponse if blocked, null if allowed
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof createRateLimiter>,
  identifier?: string
): Promise<NextResponse | null> {
  const result = await limiter.check(request, identifier);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: result.error || 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: result.resetTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.resetTime
            ? String(Math.ceil((result.resetTime - Date.now()) / 1000))
            : '900', // Default 15 minutes
          'X-RateLimit-Limit': String(limiter.maxAttempts),
          'X-RateLimit-Remaining': String(result.remainingAttempts || 0),
          'X-RateLimit-Reset': String(result.resetTime || Date.now() + 900000),
        },
      }
    );
  }

  return null;
}

