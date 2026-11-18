import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple in-memory cache to prevent multiple rapid requests within a short window
interface CachedCounts {
  timestamp: number;
  data: any;
}

const countsCache = new Map<string, CachedCounts>();
const CACHE_TTL_MS = 15000; // 15 seconds cache per user/scope

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, [
      'admin',
      'manager',
      'client',
      'account_owner',
      'freelancer',
      'editor',
    ]);

    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const authUser = authCheck.user!;
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const freelancerIdParam = searchParams.get('assignedFreelancerId');

    // Build cache key based on user and relevant filters
    const cacheKey = `${authUser.id}:${authUser.role}:${clientIdParam || ''}:${freelancerIdParam || ''}`;
    const cached = countsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      });
    }

    // Role-based where conditions
    const conditions = [];

    if (authUser.role === 'client' || authUser.role === 'account_owner') {
      conditions.push(eq(jobs.clientId, authUser.id));
    } else if (authUser.role === 'freelancer') {
      conditions.push(eq(jobs.assignedFreelancerId, authUser.id));
    } else if (authUser.role === 'editor') {
      // Editor typically sees editing orders, or assigned orders
      // No strict client/freelancer filter unless specified
    } else if (authUser.role === 'admin' || authUser.role === 'manager') {
      if (clientIdParam) {
        const parsedClientId = parseInt(clientIdParam, 10);
        if (!Number.isNaN(parsedClientId)) {
          conditions.push(eq(jobs.clientId, parsedClientId));
        }
      }
      if (freelancerIdParam) {
        const parsedFreelancerId = parseInt(freelancerIdParam, 10);
        if (!Number.isNaN(parsedFreelancerId)) {
          conditions.push(eq(jobs.assignedFreelancerId, parsedFreelancerId));
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fast aggregate query: count by status
    const statusCounts = await db
      .select({
        status: jobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobs)
      .where(whereClause)
      .groupBy(jobs.status);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      if (row.status) {
        statusMap[row.status] = Number(row.count) || 0;
      }
    }

    // Standardized payload format matching what sidebars need
    const result = {
      pending: statusMap['pending'] || 0,
      accepted: statusMap['accepted'] || 0,
      assigned: 0,
      inProgress: (statusMap['in_progress'] || 0) + (statusMap['in-progress'] || 0),
      submitted: statusMap['submitted'] || 0,
      editing: statusMap['editing'] || 0,
      delivered: statusMap['delivered'] || 0,
      approved: statusMap['approved'] || 0,
      revision:
        (statusMap['revision'] || 0) +
        (statusMap['client_revision'] || 0) +
        (statusMap['internal_revision'] || 0),
      revisions:
        (statusMap['revision'] || 0) +
        (statusMap['client_revision'] || 0) +
        (statusMap['internal_revision'] || 0),
      paid: statusMap['paid'] || 0,
      completed: statusMap['completed'] || 0,
      onHold: (statusMap['on_hold'] || 0) + (statusMap['on-hold'] || 0),
      cancelled: (statusMap['cancelled'] || 0) + (statusMap['canceled'] || 0),
      total: Object.values(statusMap).reduce((sum, val) => sum + val, 0),
      raw: statusMap,
    };

    // Store in cache
    countsCache.set(cacheKey, { timestamp: now, data: result });

    // Clean up old cache keys if too large
    if (countsCache.size > 200) {
      for (const [k, v] of countsCache.entries()) {
        if (now - v.timestamp > CACHE_TTL_MS * 2) {
          countsCache.delete(k);
        }
      }
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[GET /api/v2/orders/counts] Error calculating order counts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order counts' },
      { status: 500 }
    );
  }
}
