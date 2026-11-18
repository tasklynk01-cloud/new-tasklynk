import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { ratings, users, jobs } from '@/db/schema';
import { eq, and, avg } from 'drizzle-orm';
import { notifyNewRating } from '@/lib/notifications';

/**
 * POST /api/v2/orders/[id]/rating
 * Submit a rating for a completed order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate user
    const authCheck = await requireRole(request, ['client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const resolvedParams = params instanceof Promise ? await params : params;
    const orderId = parseInt(resolvedParams.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Parse request body
    const { rating, comment } = await request.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ 
        error: 'Rating must be an integer between 1 and 5' 
      }, { status: 400 });
    }

    // Fetch order to verify ownership and status
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user is the order owner
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only rate your own orders' }, { status: 403 });
    }

    // Verify order is in a completed state
    const completedStatuses = ['approved', 'paid', 'completed'];
    if (!completedStatuses.includes(order.status)) {
      return NextResponse.json({ 
        error: 'You can only rate completed orders' 
      }, { status: 400 });
    }

    // Check if order has assigned freelancer
    if (!order.assignedFreelancerId) {
      return NextResponse.json({ 
        error: 'Cannot rate order with no assigned freelancer' 
      }, { status: 400 });
    }

    // Check if rating already exists
    const [existingRating] = await db
      .select()
      .from(ratings)
      .where(and(
        eq(ratings.orderId, orderId),
        eq(ratings.raterId, user.id)
      ))
      .limit(1);

    if (existingRating) {
      return NextResponse.json({ 
        error: 'You have already rated this order',
        code: 'ALREADY_RATED'
      }, { status: 400 });
    }

    // Insert new rating
    const metadata = {
      raterRole: user.role,
      orderStatus: order.status,
      workType: order.workType,
    };

    const currentTimestamp = new Date().toISOString();

    await db.insert(ratings).values({
      orderId: orderId,
      raterId: user.id,
      ratedUserId: order.assignedFreelancerId,
      rating: rating,
      comment: comment?.trim() || null,
      metadata: JSON.stringify(metadata),
      createdAt: currentTimestamp,
    });

    // Update the job record with the client's rating
    await db
      .update(jobs)
      .set({
        clientRating: rating,
        reviewComment: comment?.trim() || null,
        updatedAt: currentTimestamp,
      })
      .where(eq(jobs.id, orderId));

    // Update freelancer's aggregated rating
    const freelancerRatings = await db
      .select({ avgRating: avg(ratings.rating) })
      .from(ratings)
      .where(eq(ratings.ratedUserId, order.assignedFreelancerId));

    const ratingCount = await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, order.assignedFreelancerId));

    const newAvgRating = freelancerRatings[0]?.avgRating || 0;
    const newRatingCount = ratingCount.length;

    // Update freelancer's profile
    await db
      .update(users)
      .set({
        ratingAverage: Number(newAvgRating),
        ratingCount: newRatingCount,
        rating: Number(newAvgRating), // Keep legacy field in sync
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, order.assignedFreelancerId));

    // Send notification to freelancer
    try {
      await notifyNewRating(
        order.assignedFreelancerId,
        orderId,
        rating,
        user.name || 'Client'
      );
    } catch (notifyError) {
      console.error('[Rating] Failed to send notification:', notifyError);
      // Don't fail the rating submission if notification fails
    }

    console.log('[Rating] Submitted successfully:', {
      orderId,
      clientId: user.id,
      freelancerId: order.assignedFreelancerId,
      rating,
      newAvgRating,
      newRatingCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating,
        comment,
        freelancerNewAverage: newAvgRating,
        freelancerTotalRatings: newRatingCount,
      },
    });
  } catch (error) {
    console.error('Failed to submit rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/orders/[id]/rating
 * Get rating information for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate user
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const orderId = parseInt(resolvedParams.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get existing rating for this order
    const [rating] = await db
      .select({
        id: ratings.id,
        score: ratings.rating,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
        raterName: users.name,
      })
      .from(ratings)
      .leftJoin(users, eq(ratings.raterId, users.id))
      .where(eq(ratings.orderId, orderId))
      .limit(1);

    return NextResponse.json({
      success: true,
      rating: rating || null,
    });
  } catch (error) {
    console.error('Failed to get rating:', error);
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: 500 }
    );
  }
}
