import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderRevisions, jobs, users } from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate authentication - freelancers can view their own revisions
    const authCheck = await requireRole(request, ['freelancer', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('freelancerId');
    const type = searchParams.get('type'); // 'client' | 'internal' | null (all)
    const status = searchParams.get('status'); // 'pending' | 'in_progress' | 'completed' | null (all)

    // If freelancer, they can only view their own revisions
    const targetFreelancerId = authCheck.user.role === 'freelancer'
      ? authCheck.user.id
      : freelancerId ? parseInt(freelancerId, 10) : undefined;

    if (!targetFreelancerId || Number.isNaN(targetFreelancerId)) {
      return NextResponse.json(
        { error: 'freelancerId is required for this request' },
        { status: 400 }
      );
    }

    // Build conditions for the query
    const conditions = [
      or(
        eq(orderRevisions.assignedTo, targetFreelancerId),
        eq(jobs.assignedFreelancerId, targetFreelancerId)
      ),
    ];

    if (type && type !== 'all') {
      conditions.push(eq(orderRevisions.revisionType, type));
    }

    if (status && status !== 'all') {
      conditions.push(eq(orderRevisions.status, status));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    // Freelancers should see revisions on orders they are assigned to or explicitly assigned via revision record
    const revisionsResult = await db
      .select({
        revision: orderRevisions,
        order: {
          id: jobs.id,
          displayId: jobs.displayId,
          title: jobs.title,
          orderId: jobs.orderId,
        },
        requestedByUser: {
          id: users.id,
          name: users.name,
          role: users.role,
        },
      })
      .from(orderRevisions)
      .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
      .leftJoin(users, eq(orderRevisions.requestedBy, users.id))
      .where(whereClause)
      .orderBy(desc(orderRevisions.createdAt));

    // Format the results
    const revisions = revisionsResult.map(row => ({
      id: row.revision.id,
      orderId: row.revision.orderId,
      revisionType: row.revision.revisionType,
      description: row.revision.description,
      status: row.revision.status,
      freelancerResponse: row.revision.freelancerResponse,
      reviewerNotes: row.revision.reviewerNotes,
      createdAt: row.revision.createdAt,
      updatedAt: row.revision.updatedAt,
      submittedAt: row.revision.submittedAt,
      completedAt: row.revision.completedAt,
      order: row.order ? {
        id: row.order.id,
        displayId: row.order.displayId,
        title: row.order.title,
        orderId: row.order.orderId,
      } : null,
      requestedByUser: row.requestedByUser ? {
        id: row.requestedByUser.id,
        name: row.requestedByUser.name,
        role: row.requestedByUser.role,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      revisions,
      total: revisions.length,
    });

  } catch (error) {
    console.error('Error fetching freelancer revisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revisions' },
      { status: 500 }
    );
  }
}

