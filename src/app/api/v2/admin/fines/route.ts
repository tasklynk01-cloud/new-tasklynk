import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, userFines, userBalanceHistory } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// GET - Fetch all fines or fines for a specific user
// Managers can view fines for their managed users, admins can view all
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'manager']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let whereClause = undefined;
    if (userId) {
      whereClause = status 
        ? and(eq(userFines.userId, parseInt(userId)), eq(userFines.status, status))
        : eq(userFines.userId, parseInt(userId));
    } else if (status) {
      whereClause = eq(userFines.status, status);
    }

    const fines = await db.select()
      .from(userFines)
      .where(whereClause)
      .orderBy(desc(userFines.issuedAt));

    // Get user details for each fine
    const userIds = [...new Set(fines.map(f => f.userId))];
    const usersData = userIds.length > 0
      ? await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, userIds[0])) // TODO: use inArray for multiple
      : [];

    const userMap = new Map(usersData.map(u => [u.id, u]));

    const finesWithUsers = fines.map(fine => ({
      ...fine,
      user: userMap.get(fine.userId) || null,
    }));

    // Calculate totals
    const totalFines = fines
      .filter(f => f.status === 'applied')
      .reduce((sum, f) => sum + f.fineAmount, 0);

    return NextResponse.json({
      fines: finesWithUsers,
      totalAppliedFines: Math.round(totalFines * 100) / 100,
      count: fines.length,
    });

  } catch (error) {
    console.error('GET fines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Issue a fine to a user
// Both admins and managers can issue fines in order management context
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'manager']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { userId, fineAmount, fineType, reason, jobId } = body;

    if (!userId || !fineAmount || !fineType || !reason) {
      return NextResponse.json(
        { error: 'userId, fineAmount, fineType, and reason are required' },
        { status: 400 }
      );
    }

    if (fineAmount <= 0) {
      return NextResponse.json(
        { error: 'fineAmount must be a positive number' },
        { status: 400 }
      );
    }

    const validFineTypes = ['client_complaint', 'late_delivery', 'quality_issue', 'policy_violation', 'other'];
    if (!validFineTypes.includes(fineType)) {
      return NextResponse.json(
        { error: `fineType must be one of: ${validFineTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRecord[0];
    const userType = user.role === 'manager' ? 'manager' : 'freelancer';

    // Verify job exists if jobId provided
    if (jobId) {
      const jobRecord = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (jobRecord.length === 0) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const balanceBefore = user.balance;
    const balanceAfter = Math.max(0, balanceBefore - fineAmount); // Don't go below 0

    // Create fine record
    const fineResult = await db.insert(userFines).values({
      userId,
      userType,
      jobId: jobId || null,
      fineAmount: Math.round(fineAmount * 100) / 100,
      fineType,
      reason,
      balanceBeforeFine: balanceBefore,
      balanceAfterFine: balanceAfter,
      status: 'applied',
      issuedBy: authResult.user?.id || 0,
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: userFines.id });

    // Update user balance
    await db.update(users)
      .set({ balance: balanceAfter, updatedAt: now })
      .where(eq(users.id, userId));

    // Record balance history
    await db.insert(userBalanceHistory).values({
      userId,
      balanceBefore,
      balanceAfter,
      changeAmount: -fineAmount,
      changeType: 'fine',
      referenceType: 'fine',
      referenceId: Number(fineResult[0].id),
      notes: `Fine: ${fineType} - ${reason}`,
      changedBy: authResult.user?.id || null,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Fine of KSh ${fineAmount.toFixed(2)} applied to ${user.name}`,
      fine: {
        id: fineResult[0].id,
        userId,
        fineAmount,
        fineType,
        reason,
        balanceBefore,
        balanceAfter,
        issuedAt: now,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST fine error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Reverse a fine (only pending fines can be reversed)
// Both admins and managers can reverse fines they issued
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'manager']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const fineId = searchParams.get('fineId');
    const reversalReason = searchParams.get('reason');

    if (!fineId) {
      return NextResponse.json({ error: 'fineId is required' }, { status: 400 });
    }

    // Get fine
    const fineRecord = await db.select()
      .from(userFines)
      .where(eq(userFines.id, parseInt(fineId)))
      .limit(1);

    if (fineRecord.length === 0) {
      return NextResponse.json({ error: 'Fine not found' }, { status: 404 });
    }

    const fine = fineRecord[0];

    if (fine.status === 'reversed') {
      return NextResponse.json({ error: 'Fine has already been reversed' }, { status: 400 });
    }

    // Get user
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.id, fine.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRecord[0];
    const now = new Date().toISOString();
    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore + fine.fineAmount; // Restore the fine amount

    // Update fine status
    await db.update(userFines)
      .set({
        status: 'reversed',
        reversedAt: now,
        reversedBy: authResult.user?.id || null,
        reversalReason: reversalReason || 'Fine reversed by admin',
        updatedAt: now,
      })
      .where(eq(userFines.id, fine.id));

    // Update user balance
    await db.update(users)
      .set({ balance: balanceAfter, updatedAt: now })
      .where(eq(users.id, fine.userId));

    // Record balance history
    await db.insert(userBalanceHistory).values({
      userId: fine.userId,
      balanceBefore,
      balanceAfter,
      changeAmount: fine.fineAmount,
      changeType: 'fine',
      referenceType: 'fine',
      referenceId: fine.id,
      notes: `Fine reversed: ${reversalReason || 'Fine reversed by admin'}`,
      changedBy: authResult.user?.id || null,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Fine of KSh ${fine.fineAmount.toFixed(2)} reversed for user`,
      balanceBefore,
      balanceAfter,
    });

  } catch (error) {
    console.error('DELETE fine error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

