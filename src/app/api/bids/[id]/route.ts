import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const bidId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { message, status } = body;

    // Check if bid exists
    const existingBid = await db
      .select()
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (existingBid.length === 0) {
      return NextResponse.json(
        {
          error: 'Bid not found',
          code: 'BID_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: 'Invalid status. Must be one of: pending, accepted, rejected',
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
    }

    // Validate message if provided
    if (message !== undefined) {
      const trimmedMessage = message.trim();
      if (trimmedMessage === '') {
        return NextResponse.json(
          {
            error: 'Message cannot be empty',
            code: 'EMPTY_MESSAGE',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with provided fields
    const updates: {
      message?: string;
      status?: string;
    } = {};

    if (message !== undefined) {
      updates.message = message.trim();
    }

    if (status !== undefined) {
      updates.status = status;
    }

    // Check if there are any updates to perform
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: 'No valid fields provided for update',
          code: 'NO_UPDATES',
        },
        { status: 400 }
      );
    }

    // Update bid with provided fields
    const updatedBid = await db
      .update(bids)
      .set(updates)
      .where(eq(bids.id, bidId))
      .returning();

    return NextResponse.json(updatedBid[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bids/[id]
 * Withdraw/delete a bid (freelancer can only delete their own bids)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const bidId = parseInt(id);

    // Check if bid exists
    const [existingBid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (!existingBid) {
      return NextResponse.json(
        {
          error: 'Bid not found',
          code: 'BID_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if bid is still pending (can't withdraw accepted/rejected bids)
    if (existingBid.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Cannot withdraw ${existingBid.status} bid. Only pending bids can be withdrawn.`,
          code: 'INVALID_BID_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if job is still available (not assigned)
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, existingBid.jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        {
          error: 'Associated job not found',
          code: 'JOB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (job.assignedFreelancerId !== null) {
      return NextResponse.json(
        {
          error: 'Cannot withdraw bid: job has already been assigned',
          code: 'JOB_ALREADY_ASSIGNED',
        },
        { status: 400 }
      );
    }

    // Delete the bid
    await db
      .delete(bids)
      .where(eq(bids.id, bidId));

    return NextResponse.json(
      { 
        success: true, 
        message: 'Bid withdrawn successfully',
        bidId: bidId
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE bid error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}