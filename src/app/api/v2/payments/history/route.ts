import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments, jobs, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * GET /api/v2/payments/history
 * Fetch payment history for the authenticated user
 * 
 * Query Parameters:
 * - userId: number (required) - User ID to fetch payments for
 * - limit: number (optional, default 50) - Max number of records
 * - offset: number (optional, default 0) - Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authCheck = await requireRole(request, ['admin', 'client', 'account_owner', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Determine which user's history to fetch
    let targetUserId: number;
    if (user.role === 'admin') {
      // Admins can view any user's history
      targetUserId = requestedUserId ? parseInt(requestedUserId) : user.id;
    } else {
      // Non-admins can only view their own history
      targetUserId = user.id;
    }

    // Fetch payment records with associated job and user data
    const paymentRecords = await db
      .select({
        // Payment data
        paymentId: payments.id,
        amount: payments.amount,
        method: payments.paymentMethod,
        status: payments.status,
        transactionId: sql<string | null>`coalesce(
          ${payments.paystackReference},
          ${payments.mpesaReceiptNumber},
          ${payments.orderTrackingId},
          ${payments.merchantReference},
          ${payments.mpesaCode}
        )`,
        mpesaCode: payments.mpesaCode,
        phoneNumber: payments.phoneNumber,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        verifiedAt: payments.confirmedAt,
        notes: payments.mpesaResultDesc,
        
        // Job data
        jobId: jobs.id,
        jobDisplayId: jobs.displayId,
        jobTitle: jobs.title,
        jobAmount: jobs.amount,
        jobStatus: jobs.status,
        
        // User data
        userName: users.name,
        userEmail: users.email,
      })
      .from(payments)
      .leftJoin(jobs, eq(payments.jobId, jobs.id))
      .leftJoin(users, eq(payments.clientId, users.id))
      .where(eq(payments.clientId, targetUserId))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total records for pagination
    const totalRecords = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.clientId, targetUserId));

    const total = totalRecords[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        payments: paymentRecords,
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/payments/history
 * Add a note or update payment record (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Only admins can modify payment records
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Update payment record
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;

    await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentId));

    return NextResponse.json({ success: true, message: 'Payment record updated' });
  } catch (error) {
    console.error('Error updating payment record:', error);
    return NextResponse.json(
      { error: 'Failed to update payment record', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

