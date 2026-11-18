import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payoutRequests, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

interface PayoutRequestResponse {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  approvedDate?: string;
  processedDate?: string;
  rejectionReason?: string;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

// GET - Fetch all payout requests with optional filtering
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Query payout requests from database with freelancer info
    const payoutData = await db
      .select({
        id: payoutRequests.id,
        writerId: payoutRequests.writerId,
        amount: payoutRequests.amount,
        method: payoutRequests.method,
        accountDetails: payoutRequests.accountDetails,
        status: payoutRequests.status,
        requestedAt: payoutRequests.requestedAt,
        processedAt: payoutRequests.processedAt,
        rejectionReason: payoutRequests.rejectionReason,
        transactionReference: payoutRequests.transactionReference,
        freelancerName: users.name,
        freelancerEmail: users.email,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.writerId, users.id))
      .orderBy(desc(payoutRequests.requestedAt));

    // Transform to response format
    let formattedRequests: PayoutRequestResponse[] = payoutData.map(payout => {
      let bankAccount: PayoutRequestResponse['bankAccount'] = undefined;
      const parsed = payout.accountDetails as { accountNumber?: string; bankName?: string; accountName?: string; phoneNumber?: string } | null;
      if (parsed) {
        if (payout.method === 'bank') {
          bankAccount = {
            accountNumber: parsed.accountNumber || '',
            bankName: parsed.bankName || '',
            accountName: parsed.accountName || payout.freelancerName || '',
          };
        } else if (payout.method === 'mpesa') {
          bankAccount = {
            accountNumber: parsed.phoneNumber || '',
            bankName: 'M-PESA',
            accountName: payout.freelancerName || '',
          };
        }
      }

      return {
        id: String(payout.id),
        freelancerId: String(payout.writerId),
        freelancerName: payout.freelancerName || 'Unknown',
        freelancerEmail: payout.freelancerEmail || '',
        amount: payout.amount,
        status: payout.status as PayoutRequestResponse['status'],
        requestDate: payout.requestedAt,
        processedDate: payout.processedAt || undefined,
        rejectionReason: payout.rejectionReason || undefined,
        bankAccount,
      };
    });

    // Filter by status if provided
    if (status && status !== 'all' && status !== '') {
      formattedRequests = formattedRequests.filter(req => req.status === status);
    }

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new payout request (for freelancers)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { freelancerId, amount, method, accountDetails } = body;

    if (!freelancerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create payout request in database
    const newPayout = await db.insert(payoutRequests).values({
      writerId: parseInt(freelancerId),
      amount,
      method: method || 'mpesa',
      accountDetails: accountDetails || {},
      status: 'pending',
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    return NextResponse.json({
      id: String(newPayout[0].id),
      freelancerId: String(newPayout[0].writerId),
      amount: newPayout[0].amount,
      status: newPayout[0].status,
      requestDate: newPayout[0].requestedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payout request:', error);
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    );
  }
}

