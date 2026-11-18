import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { sendRegistrationEmail, getAccountApprovedEmailHTML } from '@/lib/email';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

async function pickLeastLoadedManagerId(): Promise<number | null> {
  const managers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, 'manager'), eq(users.approved, true), eq(users.status, 'active')));

  if (managers.length === 0) return null;

  let bestManagerId = managers[0]!.id;
  let bestCount = Number.POSITIVE_INFINITY;

  for (const manager of managers) {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.assignedManagerId, manager.id));
    const count = Number(row?.count ?? 0);
    if (count < bestCount) {
      bestCount = count;
      bestManagerId = manager.id;
    }
  }

  return bestManagerId;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(_request);
    if (authCheck.error) {
      console.error('[Approve] Auth check failed:', {
        error: authCheck.error,
        status: authCheck.status,
        userId: params.id
      });
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminUser = authCheck.user!;
    // FIXED: Await params for Next.js 15 compatibility
    const { id } = await params;

    console.log('[Approve] Request received:', {
      userId: id,
      adminId: adminUser.id,
      adminRole: adminUser.role
    });

    if (!id || isNaN(parseInt(id))) {
      console.error('[Approve] Invalid user ID:', { id, type: typeof id });
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check if user exists via drizzle
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRow) {
      console.error('[Approve] User not found:', { userId });
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    console.log('[Approve] User found:', {
      userId: userRow.id,
      name: userRow.name,
      role: userRow.role,
      currentStatus: userRow.status,
      currentApproved: userRow.approved
    });

    // Update approved flag and status - Both fields are critical for system access
    const now = new Date().toISOString();
    await db.update(users).set({ 
      approved: true,       // Required for order placement and feature access
      status: 'approved',   // Required for authentication and dashboard access (valid values: pending, approved, rejected, suspended, blacklisted)
      updatedAt: now 
    }).where(eq(users.id, userId));

    // ✅ AUTOMATION: After admin approval, assign a manager if missing (client/freelancer/account_owner)
    // This supports the "admin first → manager owns day-to-day" workflow.
    let autoAssignedManagerId: number | null = null;
    try {
      const eligibleForManager = ['client', 'freelancer', 'account_owner'].includes(String(userRow.role));
      const hasManagerAlready = Boolean((userRow as any).assignedManagerId);
      if (eligibleForManager && !hasManagerAlready) {
        autoAssignedManagerId = await pickLeastLoadedManagerId();
        if (autoAssignedManagerId) {
          await db.update(users)
            .set({ assignedManagerId: autoAssignedManagerId, updatedAt: now })
            .where(eq(users.id, userId));

          // Notify manager (best-effort)
          await db.insert(notifications).values({
            userId: autoAssignedManagerId,
            jobId: null,
            type: 'user_assigned',
            title: 'New User Assigned',
            message: `${userRow.name} (${userRow.role}) has been auto-assigned to you after admin approval.`,
            read: false,
            createdAt: now,
          });
        }
      }
    } catch (assignErr) {
      console.error('[Approve] Auto-assign manager failed:', assignErr);
    }


    // 📝 AUDIT: Log admin action
    await logAdminActionWithRequest(
      _request,
      adminUser.id,
      AdminActions.APPROVE_USER,
      userId,
      AuditTargetTypes.USER,
      {
        userEmail: userRow.email,
        userName: userRow.name,
        userRole: userRow.role,
        autoAssignedManagerId,
      }
    );

    // Create notification (best-effort)
    try {
      await db.insert(notifications).values({
        userId: userId,
        jobId: null,
        type: 'account_approved',
        title: 'Account Approved',
        message: `Congratulations! Your account has been approved. You can now start using TaskLynk.`,
        read: false,
        createdAt: now,
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Send email (best-effort) - Uses admn@tasklynk.co.ke with "Registration Approved" subject
    try {
      const emailResult = await sendRegistrationEmail({
        to: String(userRow.email),
        activitySubject: 'Registration Approved',
        html: getAccountApprovedEmailHTML(String(userRow.name), String(userRow.role)),
      });
      
      if (emailResult.success) {
        console.log('✅ Approval email sent successfully');
      } else {
        console.error('❌ [Approve] Approval email sending failed:', {
          email: userRow.email,
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('❌ [Approve] Email exception:', {
        email: userRow.email,
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Unknown'
      });
    }

    // Return updated user data with verification
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    // Verify the update was successful
    if (!updatedUser.approved || updatedUser.status !== 'active') {
      console.error('[Approve] WARNING: User approval may have failed', {
        userId: updatedUser.id,
        approved: updatedUser.approved,
        status: updatedUser.status
      });
    }
    
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      approved: updatedUser.approved,
      status: updatedUser.status,
      phone: updatedUser.phone,
      assignedManagerId: (updatedUser as any).assignedManagerId ?? null,
      message: 'User approved successfully. They can now access all platform features including order placement.'
    }, { status: 200 });
  } catch (error) {
    console.error('POST error (approve):', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}