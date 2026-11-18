import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Require valid session
    // Only admins and managers can view all bids for a job
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error, code: 'UNAUTHORIZED' }, { status: authCheck.status });
    }

    const params = await props.params;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid Job ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);

    // Fetch bids with freelancer details
    const jobBids = await db
      .select({
        id: bids.id,
        jobId: bids.jobId,
        freelancerId: bids.freelancerId,
        bidAmount: bids.bidAmount,
        message: bids.message,
        status: bids.status,
        createdAt: bids.createdAt,
        freelancerName: users.name,
        freelancerEmail: users.email,
        freelancerRating: users.rating,
        freelancerCompletedJobs: users.completedJobs,
      })
      .from(bids)
      .leftJoin(users, eq(bids.freelancerId, users.id))
      .where(eq(bids.jobId, jobId))
      .orderBy(desc(bids.createdAt));

    return NextResponse.json(jobBids, { status: 200 });
  } catch (error) {
    console.error('GET /api/jobs/[id]/bids error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
