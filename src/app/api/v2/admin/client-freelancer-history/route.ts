import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { clientFreelancerHistory, users } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

// GET - Fetch client-freelancer relationship history
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const clientId = searchParams.get('clientId');
    const freelancerId = searchParams.get('freelancerId');
    const minJobs = searchParams.get('minJobs');

    // Build conditions
    const conditions = [];
    
    if (clientId) {
      conditions.push(eq(clientFreelancerHistory.clientId, parseInt(clientId)));
    }
    if (freelancerId) {
      conditions.push(eq(clientFreelancerHistory.freelancerId, parseInt(freelancerId)));
    }
    if (minJobs) {
      conditions.push(sql`${clientFreelancerHistory.completedJobsCount} >= ${parseInt(minJobs)}`);
    }

    // Create aliases for client and freelancer
    const clients = await db.select().from(users).as('clients');
    const freelancers = await db.select().from(users).as('freelancers');

    // Query relationships - using subqueries for user details
    const relationships = await db
      .select({
        id: clientFreelancerHistory.id,
        clientId: clientFreelancerHistory.clientId,
        freelancerId: clientFreelancerHistory.freelancerId,
        completedJobsCount: clientFreelancerHistory.completedJobsCount,
        lastWorkedAt: clientFreelancerHistory.lastWorkedAt,
        avgRating: clientFreelancerHistory.avgRating,
        createdAt: clientFreelancerHistory.createdAt,
        updatedAt: clientFreelancerHistory.updatedAt,
      })
      .from(clientFreelancerHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(clientFreelancerHistory.completedJobsCount))
      .limit(limit)
      .offset(offset);

    // Enrich with user details
    const enrichedRelationships = await Promise.all(
      relationships.map(async (rel) => {
        const [client] = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, rel.clientId));
        
        const [freelancer] = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, rel.freelancerId));

        return {
          ...rel,
          client,
          freelancer,
        };
      })
    );

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(clientFreelancerHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get stats
    const statsResult = await db
      .select({
        totalRelationships: sql<number>`count(*)`,
        totalJobsCompleted: sql<number>`sum(${clientFreelancerHistory.completedJobsCount})`,
        avgJobsPerRelationship: sql<number>`avg(${clientFreelancerHistory.completedJobsCount})`,
        avgRating: sql<number>`avg(${clientFreelancerHistory.avgRating})`,
      })
      .from(clientFreelancerHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get top clients by relationships
    const topClients = await db
      .select({
        clientId: clientFreelancerHistory.clientId,
        relationshipCount: sql<number>`count(distinct ${clientFreelancerHistory.freelancerId})`,
        totalJobs: sql<number>`sum(${clientFreelancerHistory.completedJobsCount})`,
      })
      .from(clientFreelancerHistory)
      .groupBy(clientFreelancerHistory.clientId)
      .orderBy(desc(sql<number>`count(distinct ${clientFreelancerHistory.freelancerId})`))
      .limit(10);

    // Enrich top clients with names
    const enrichedTopClients = await Promise.all(
      topClients.map(async (tc) => {
        const [client] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, tc.clientId));
        return { ...tc, clientName: client?.name, clientEmail: client?.email };
      })
    );

    // Get top freelancers by relationships
    const topFreelancers = await db
      .select({
        freelancerId: clientFreelancerHistory.freelancerId,
        relationshipCount: sql<number>`count(distinct ${clientFreelancerHistory.clientId})`,
        totalJobs: sql<number>`sum(${clientFreelancerHistory.completedJobsCount})`,
        avgRating: sql<number>`avg(${clientFreelancerHistory.avgRating})`,
      })
      .from(clientFreelancerHistory)
      .groupBy(clientFreelancerHistory.freelancerId)
      .orderBy(desc(sql<number>`count(distinct ${clientFreelancerHistory.clientId})`))
      .limit(10);

    // Enrich top freelancers with names
    const enrichedTopFreelancers = await Promise.all(
      topFreelancers.map(async (tf) => {
        const [freelancer] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, tf.freelancerId));
        return { ...tf, freelancerName: freelancer?.name, freelancerEmail: freelancer?.email };
      })
    );

    const stats = statsResult[0];

    return NextResponse.json({
      relationships: enrichedRelationships,
      total: countResult[0]?.count || 0,
      stats: {
        totalRelationships: stats?.totalRelationships || 0,
        totalJobsCompleted: stats?.totalJobsCompleted || 0,
        avgJobsPerRelationship: Math.round((stats?.avgJobsPerRelationship || 0) * 10) / 10,
        avgRating: Math.round((stats?.avgRating || 0) * 10) / 10,
      },
      topClients: enrichedTopClients,
      topFreelancers: enrichedTopFreelancers,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching client-freelancer history:', error);
    return NextResponse.json({ error: 'Failed to fetch relationship history' }, { status: 500 });
  }
}

