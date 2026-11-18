import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, users, jobs } from '@/db/schema';
import { eq, and, desc, isNull, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const freelancerId = searchParams.get('freelancerId');
    const status = searchParams.get('status');
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build filter conditions for bids
    const bidConditions: SQL<unknown>[] = [];

    if (jobId) {
      const parsedJobId = parseInt(jobId);
      if (isNaN(parsedJobId)) {
        return NextResponse.json(
          { error: 'Invalid jobId parameter', code: 'INVALID_JOB_ID' },
          { status: 400 }
        );
      }
      bidConditions.push(eq(bids.jobId, parsedJobId));
    }

    if (freelancerId) {
      const parsedFreelancerId = parseInt(freelancerId);
      if (isNaN(parsedFreelancerId)) {
        return NextResponse.json(
          { error: 'Invalid freelancerId parameter', code: 'INVALID_FREELANCER_ID' },
          { status: 400 }
        );
      }
      bidConditions.push(eq(bids.freelancerId, parsedFreelancerId));
    }

    if (status) {
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be pending, accepted, or rejected', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      bidConditions.push(eq(bids.status, status));
    }

    let results;
    
    if (unassignedOnly) {
      // Join with jobs table to filter bids on unassigned accepted orders only
      const allConditions: SQL<unknown>[] = [
        eq(jobs.status, 'accepted'),
        isNull(jobs.assignedFreelancerId),
        ...bidConditions
      ];
      
      results = await db.select({
        id: bids.id,
        jobId: bids.jobId,
        freelancerId: bids.freelancerId,
        message: bids.message,
        bidAmount: bids.bidAmount,
        status: bids.status,
        createdAt: bids.createdAt
      })
      .from(bids)
      .innerJoin(jobs, eq(bids.jobId, jobs.id))
      .where(and(...allConditions))
      .orderBy(desc(bids.createdAt))
      .limit(limit)
      .offset(offset);
    } else {
      // Simple bid query without job join
      if (bidConditions.length > 0) {
        results = await db.select()
          .from(bids)
          .where(and(...bidConditions))
          .orderBy(desc(bids.createdAt))
          .limit(limit)
          .offset(offset);
      } else {
        results = await db.select()
          .from(bids)
          .orderBy(desc(bids.createdAt))
          .limit(limit)
          .offset(offset);
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, freelancerId, message, bidAmount } = body;

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required', code: 'MISSING_JOB_ID' },
        { status: 400 }
      );
    }

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required', code: 'MISSING_FREELANCER_ID' },
        { status: 400 }
      );
    }

    if (bidAmount === undefined || bidAmount === null) {
      return NextResponse.json(
        { error: 'bidAmount is required', code: 'MISSING_BID_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate jobId is a valid number
    const parsedJobId = parseInt(jobId);
    if (isNaN(parsedJobId)) {
      return NextResponse.json(
        { error: 'jobId must be a valid number', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    // Validate freelancerId is a valid number
    const parsedFreelancerId = parseInt(freelancerId);
    if (isNaN(parsedFreelancerId)) {
      return NextResponse.json(
        { error: 'freelancerId must be a valid number', code: 'INVALID_FREELANCER_ID' },
        { status: 400 }
      );
    }

    // 🔴 CRITICAL: Check if freelancer account is approved
    const [freelancer] = await db
      .select({ approved: users.approved, role: users.role })
      .from(users)
      .where(eq(users.id, parsedFreelancerId))
      .limit(1);

    if (!freelancer) {
      return NextResponse.json(
        { error: 'Freelancer not found', code: 'FREELANCER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (freelancer.role !== 'freelancer') {
      return NextResponse.json(
        { error: 'Only freelancers can place bids', code: 'INVALID_ROLE' },
        { status: 403 }
      );
    }

    if (!freelancer.approved) {
      return NextResponse.json(
        { error: 'Your account must be approved before you can place bids', code: 'ACCOUNT_NOT_APPROVED' },
        { status: 403 }
      );
    }

    // Validate bidAmount is a valid positive number
    const parsedBidAmount = parseFloat(bidAmount);
    if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
      return NextResponse.json(
        { error: 'bidAmount must be a positive number', code: 'INVALID_BID_AMOUNT' },
        { status: 400 }
      );
    }

    // Enforce one bid per writer per job
    const existing = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.jobId, parsedJobId), eq(bids.freelancerId, parsedFreelancerId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already placed a bid for this job', code: 'DUPLICATE_BID' },
        { status: 409 }
      );
    }

    // Create new bid - message is optional (can be empty string)
    const newBid = await db.insert(bids)
      .values({
        jobId: parsedJobId,
        freelancerId: parsedFreelancerId,
        message: message?.trim() || '', // Optional message, default to empty string
        bidAmount: parsedBidAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newBid[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

