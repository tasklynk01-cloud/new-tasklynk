import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { handleOptions } from '@/lib/api-helpers';

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    // Admin/manager can view all. Freelancers can view only their own requests.
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const currentUser = authCheck.user!;

    // Build query
    let query = db
      .select({
        id: payoutRequests.id,
        writerId: payoutRequests.writerId,
        amount: payoutRequests.amount,
        method: payoutRequests.method,
        accountDetails: payoutRequests.accountDetails,
        status: payoutRequests.status,
        requestedAt: payoutRequests.requestedAt,
        processedAt: payoutRequests.processedAt,
        processedBy: payoutRequests.processedBy,
        rejectionReason: payoutRequests.rejectionReason,
        transactionReference: payoutRequests.transactionReference,
        createdAt: payoutRequests.createdAt,
        updatedAt: payoutRequests.updatedAt,
        writerName: users.name,
        writerEmail: users.email,
        writerPhone: users.phone,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.writerId, users.id))
      .orderBy(desc(payoutRequests.requestedAt));

    const conditions = [];
    if (currentUser.role === 'freelancer') {
      conditions.push(eq(payoutRequests.writerId, currentUser.id));
    }
    if (status) {
      conditions.push(eq(payoutRequests.status, status));
    }

    if (conditions.length === 1) {
      query = query.where(conditions[0]) as any;
    } else if (conditions.length > 1) {
      query = query.where(and(...conditions)) as any;
    }

    const requests = await query;

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout requests' },
      { status: 500 }
    );
  }
}

