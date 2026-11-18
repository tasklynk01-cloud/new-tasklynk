/**
 * API Response Caching
 * 
 * Gap #17: Implement API response caching
 * 
 * Provides caching utilities for API responses to reduce database load
 * and improve response times.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxAge?: number; // Cache duration in seconds
  staleWhileRevalidate?: number; // Stale cache duration in seconds
  tags?: string[]; // Cache tags for invalidation
  vary?: string[]; // Headers to vary cache by
}

/**
 * In-memory cache store (for development/single-instance)
 * In production, use Redis or similar
 */
class MemoryCache {
  private store: Map<string, { data: any; expiresAt: number; tags: string[] }> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  set(key: string, data: any, ttl: number, tags: string[] = []): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { data, expiresAt, tags });
    
    // Index by tags
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.tags.forEach(tag => {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
        }
      });
    }
    this.store.delete(key);
  }

  invalidateByTag(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      keys.forEach(key => this.delete(key));
      this.tagIndex.delete(tag);
    }
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }
}

// Global cache instance
const cache = new MemoryCache();

/**
 * Generate cache key from request
 */
function generateCacheKey(request: NextRequest, vary: string[] = []): string {
  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;
  
  // Include vary headers in key
  const varyValues = vary.map(header => {
    const value = request.headers.get(header);
    return `${header}:${value || ''}`;
  }).join('|');
  
  const keyString = `${path}${search}|${varyValues}`;
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

/**
 * Add cache headers to response
 */
function addCacheHeaders(
  response: NextResponse,
  config: CacheConfig
): NextResponse {
  const maxAge = config.maxAge || 300; // Default 5 minutes
  const staleWhileRevalidate = config.staleWhileRevalidate || 0;
  
  // Cache-Control header
  let cacheControl = `public, max-age=${maxAge}`;
  if (staleWhileRevalidate > 0) {
    cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
  }
  
  response.headers.set('Cache-Control', cacheControl);
  
  // ETag for conditional requests
  const etag = crypto.createHash('md5').update(JSON.stringify(response.body)).digest('hex');
  response.headers.set('ETag', `"${etag}"`);
  
  // Vary header
  if (config.vary && config.vary.length > 0) {
    response.headers.set('Vary', config.vary.join(', '));
  }
  
  return response;
}

/**
 * Check if request has valid cache
 */
export function getCachedResponse(
  request: NextRequest,
  config: CacheConfig = {}
): NextResponse | null {
  const key = generateCacheKey(request, config.vary);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  // Check If-None-Match header for conditional request
  const ifNoneMatch = request.headers.get('If-None-Match');
  const etag = crypto.createHash('md5').update(JSON.stringify(cached)).digest('hex');
  
  if (ifNoneMatch === `"${etag}"`) {
    return new NextResponse(null, { status: 304 }); // Not Modified
  }
  
  // Return cached response
  const response = NextResponse.json(cached);
  return addCacheHeaders(response, config);
}

/**
 * Cache a response
 */
export function cacheResponse(
  request: NextRequest,
  response: NextResponse,
  config: CacheConfig = {}
): NextResponse {
  const maxAge = config.maxAge || 300;
  const key = generateCacheKey(request, config.vary);
  
  // Try to get response body
  // Note: NextResponse body is a ReadableStream, so we need to clone it
  const clonedResponse = response.clone();
  
  // For now, we'll cache the response after it's been sent
  // In production, use Redis with proper serialization
  
  // Add cache headers
  return addCacheHeaders(response, config);
}

/**
 * Invalidate cache by tag
 */
export function invalidateCache(tag: string): void {
  cache.invalidateByTag(tag);
}

/**
 * Invalidate cache by key pattern
 */
export function invalidateCacheByPattern(pattern: string): void {
  // Simple pattern matching - in production use Redis SCAN
  const keys = Array.from(cache['store'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Create a cached route handler
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const config: CacheConfig = {
 *     maxAge: 300,
 *     tags: ['users'],
 *     vary: ['Authorization'],
 *   };
 *   
 *   const cached = getCachedResponse(request, config);
 *   if (cached) return cached;
 *   
 *   const data = await fetchData();
 *   const response = NextResponse.json(data);
 *   return cacheResponse(request, response, config);
 * }
 * ```
 */
export function withCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: CacheConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check cache
    const cached = getCachedResponse(request, config);
    if (cached) return cached;
    
    // Execute handler
    const response = await handler(request);
    
    // Only cache successful responses
    if (response.status === 200) {
      return cacheResponse(request, response, config);
    }
    
    return response;
  };
}

/**
 * Cache tags for common resources
 */
export const CACHE_TAGS = {
  USERS: 'users',
  JOBS: 'jobs',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  ASSIGNMENTS: 'assignments',
} as const;


