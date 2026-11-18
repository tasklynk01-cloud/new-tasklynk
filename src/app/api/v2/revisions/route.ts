import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { orderRevisions, jobs, users } from '@/db/schema';
import { eq, desc, and, sql, count, gte, lte } from 'drizzle-orm';

/**
 * GET /api/v2/revisions
 * Fetch revisions with analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type'); // 'client' | 'internal' | 'all'
    const status = searchParams.get('status'); // 'pending' | 'in_progress' | 'completed' | 'rejected'
    const freelancerId = searchParams.get('freelancerId');
    const orderId = searchParams.get('orderId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build conditions array
    const conditions: any[] = [];

    // Role-based filtering
    if (user.role === 'freelancer') {
      conditions.push(eq(orderRevisions.assignedTo, user.id));
    } else if (user.role === 'client' || user.role === 'account_owner') {
      // Clients can only see client-requested revisions for their own orders
      // Filter by orderId is mandatory for clients
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required for client access' }, { status: 400 });
      }
      conditions.push(eq(orderRevisions.revisionType, 'client'));
    } else if (freelancerId) {
      conditions.push(eq(orderRevisions.assignedTo, parseInt(freelancerId)));
    }

    // Type filter
    if (type && type !== 'all') {
      conditions.push(eq(orderRevisions.revisionType, type));
    }

    // Status filter
    if (status) {
      conditions.push(eq(orderRevisions.status, status));
    }

    // Order filter
    if (orderId) {
      conditions.push(eq(orderRevisions.orderId, parseInt(orderId)));
    }

    // Date range filter
    if (startDate) {
      conditions.push(gte(orderRevisions.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orderRevisions.createdAt, endDate));
    }

    // Fetch revisions with related data
    const revisions = await db
      .select({
        id: orderRevisions.id,
        orderId: orderRevisions.orderId,
        revisionType: orderRevisions.revisionType,
        requestedBy: orderRevisions.requestedBy,
        assignedTo: orderRevisions.assignedTo,
        description: orderRevisions.description,
        status: orderRevisions.status,
        filesJson: orderRevisions.filesJson,
        freelancerResponse: orderRevisions.freelancerResponse,
        reviewerNotes: orderRevisions.reviewerNotes,
        createdAt: orderRevisions.createdAt,
        updatedAt: orderRevisions.updatedAt,
        submittedAt: orderRevisions.submittedAt,
        completedAt: orderRevisions.completedAt,
        closedBy: orderRevisions.closedBy,
        // Job details
        orderDisplayId: jobs.displayId,
        orderTitle: jobs.title,
        orderNumber: jobs.orderNumber,
      })
      .from(orderRevisions)
      .leftJoin(jobs, eq(orderRevisions.orderId, jobs.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orderRevisions.createdAt))
      .limit(limit);

    // Fetch user names for requestedBy and assignedTo
    const userIds = new Set<number>();
    revisions.forEach(r => {
      if (r.requestedBy) userIds.add(r.requestedBy);
      if (r.assignedTo) userIds.add(r.assignedTo);
      if (r.closedBy) userIds.add(r.closedBy);
    });

    const userNames: Record<number, string> = {};
    if (userIds.size > 0) {
      const usersList = await db.select({ id: users.id, name: users.name })
        .from(users)
        .where(sql`${users.id} IN (${Array.from(userIds).join(',')})`);
      usersList.forEach(u => { userNames[u.id] = u.name; });
    }

    // Enrich revisions with user names
    const enrichedRevisions = revisions.map(r => ({
      ...r,
      requestedByName: r.requestedBy ? userNames[r.requestedBy] || 'Unknown' : null,
      assignedToName: r.assignedTo ? userNames[r.assignedTo] || 'Unknown' : null,
      closedByName: r.closedBy ? userNames[r.closedBy] || 'Unknown' : null,
    }));

    return NextResponse.json({ revisions: enrichedRevisions });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
  }
}

