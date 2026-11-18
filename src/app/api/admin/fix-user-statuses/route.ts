import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

/**
 * Fix User Approval Status Synchronization
 * 
 * This endpoint ensures that the `approved` field and `status` field are synchronized:
 * - If approved=true, status should be 'active'
 * - If approved=false, status should be 'pending' (unless suspended/rejected)
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }


    // Get all users
    const allUsers = await db.select().from(users);
    

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    const fixedUsers: any[] = [];

    const now = new Date().toISOString();

    for (const user of allUsers) {
      const userId = user.id;
      const displayId = user.displayId;
      const role = user.role;
      const approved = user.approved;
      const status = user.status;

      // Skip if suspended or rejected - these are special states
      if (status === 'suspended' || status === 'rejected') {
        alreadyCorrectCount++;
        continue;
      }

      // Determine what the status should be
      let correctStatus = status;
      let needsUpdate = false;

      // If approved=true, status should be 'active'
      if (approved && status !== 'active') {
        correctStatus = 'active';
        needsUpdate = true;
      }

      // If approved=false, status should be 'pending'
      if (!approved && status !== 'pending') {
        correctStatus = 'pending';
        needsUpdate = true;
      }

      if (needsUpdate) {
        
        await db.update(users)
          .set({ status: correctStatus, updatedAt: now })
          .where(eq(users.id, userId));

        fixedCount++;
        fixedUsers.push({
          id: userId,
          displayId,
          role,
          email: user.email,
          name: user.name,
          oldStatus: status,
          newStatus: correctStatus,
          approved
        });
      } else {
        alreadyCorrectCount++;
      }
    }


    return NextResponse.json({
      success: true,
      message: fixedCount > 0 
        ? `Successfully synchronized ${fixedCount} user status(es)` 
        : 'All user statuses were already correct',
      summary: {
        totalChecked: allUsers.length,
        alreadyCorrect: alreadyCorrectCount,
        fixed: fixedCount
      },
      fixedUsers
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fixing user approval status:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

