import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientFreelancerHistory, users, freelancerProfiles, writerTiers, jobs } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, desc, and, sql, or } from 'drizzle-orm';

// GET /api/v2/client-freelancer-history - Get client's freelancer history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const freelancerId = searchParams.get('freelancerId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Authentication check
    const authCheck = await requireRole(request, ['admin', 'manager', 'client']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Clients can only view their own history
    if (authCheck.user?.role === 'client' && clientId && parseInt(clientId) !== authCheck.user.id) {
      return NextResponse.json(
        { error: 'You can only view your own freelancer history' },
        { status: 403 }
      );
    }

    let query = db
      .select({
        id: clientFreelancerHistory.id,
        clientId: clientFreelancerHistory.clientId,
        freelancerId: clientFreelancerHistory.freelancerId,
        completedJobsCount: clientFreelancerHistory.completedJobsCount,
        lastWorkedAt: clientFreelancerHistory.lastWorkedAt,
        avgRating: clientFreelancerHistory.avgRating,
        createdAt: clientFreelancerHistory.createdAt,
        // Client info
        clientName: users.name,
        clientEmail: users.email,
        clientDisplayId: users.displayId,
      })
      .from(clientFreelancerHistory)
      .leftJoin(users, eq(clientFreelancerHistory.clientId, users.id))
      .orderBy(desc(clientFreelancerHistory.lastWorkedAt))
      .limit(limit);

    if (clientId) {
      query = query.where(eq(clientFreelancerHistory.clientId, parseInt(clientId))) as any;
    }

    if (freelancerId) {
      query = query.where(eq(clientFreelancerHistory.freelancerId, parseInt(freelancerId))) as any;
    }

    const history = await query;

    // Fetch freelancer details separately to avoid complex joins
    const freelancerIds = [...new Set(history.map(h => h.freelancerId))];
    const freelancers = freelancerIds.length > 0 
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            displayId: users.displayId,
            rating: users.rating,
            tierName: writerTiers.name,
            tierColor: writerTiers.color,
            tierIcon: writerTiers.icon,
          })
          .from(users)
          .leftJoin(freelancerProfiles, eq(users.id, freelancerProfiles.userId))
          .leftJoin(writerTiers, eq(freelancerProfiles.currentTierId, writerTiers.id))
          .where(sql`${users.id} IN ${freelancerIds}`)
      : [];

    const freelancerMap = Object.fromEntries(freelancers.map(f => [f.id, f]));

    // Combine data
    const result = history.map(h => ({
      ...h,
      freelancer: freelancerMap[h.freelancerId] || null,
    }));

    return NextResponse.json({
      success: true,
      history: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error fetching client-freelancer history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

// POST /api/v2/client-freelancer-history - Update or create history entry (called after job completion)
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { clientId, freelancerId, rating } = body;

    if (!clientId || !freelancerId) {
      return NextResponse.json(
        { error: 'clientId and freelancerId are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Check if entry exists
    const [existing] = await db
      .select()
      .from(clientFreelancerHistory)
      .where(
        and(
          eq(clientFreelancerHistory.clientId, clientId),
          eq(clientFreelancerHistory.freelancerId, freelancerId)
        )
      )
      .limit(1);

    let result;
    if (existing) {
      // Update existing entry
      const newCount = existing.completedJobsCount + 1;
      const newAvgRating = rating 
        ? ((existing.avgRating || 0) * existing.completedJobsCount + rating) / newCount
        : existing.avgRating;

      [result] = await db
        .update(clientFreelancerHistory)
        .set({
          completedJobsCount: newCount,
          lastWorkedAt: now,
          avgRating: newAvgRating,
          updatedAt: now,
        })
        .where(eq(clientFreelancerHistory.id, existing.id))
        .returning();
    } else {
      // Create new entry
      [result] = await db
        .insert(clientFreelancerHistory)
        .values({
          clientId,
          freelancerId,
          completedJobsCount: 1,
          lastWorkedAt: now,
          avgRating: rating || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      history: result,
      isNew: !existing,
    });
  } catch (error) {
    console.error('Error updating client-freelancer history:', error);
    return NextResponse.json(
      { error: 'Failed to update history' },
      { status: 500 }
    );
  }
}

