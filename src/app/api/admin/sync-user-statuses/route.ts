/**
 * Sync User Statuses API
 * Ensures approved and status fields are synchronized across all users
 * 
 * POST /api/admin/sync-user-statuses
 * 
 * This endpoint fixes inconsistencies where:
 * - approved=true but status != 'active'
 * - approved=false but status != 'pending'
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { getStatusSyncInfo } from '@/lib/user-status';

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
    let skippedCount = 0;
    const fixedUsers: Array<{
      id: number;
      displayId: string;
      email: string;
      role: string;
      wasApproved: boolean;
      wasStatus: string;
      nowStatus: string;
      reason: string;
    }> = [];

    const now = new Date().toISOString();

    // Check each user
    for (const user of allUsers) {
      const syncInfo = getStatusSyncInfo(user);

      if (!syncInfo.needsSync) {
        alreadyCorrectCount++;
        continue;
      }

      // Skip special roles if needed (admins are auto-approved)
      if (user.role === 'admin' && user.approved) {
        skippedCount++;
        continue;
      }

      // Update status in database
      try {
        await db
          .update(users)
          .set({
            status: syncInfo.correctStatus,
            updatedAt: now,
          })
          .where(eq(users.id, user.id));

        fixedCount++;
        fixedUsers.push({
          id: user.id,
          displayId: user.displayId,
          email: user.email,
          role: user.role,
          wasApproved: Boolean(user.approved),
          wasStatus: user.status || 'unknown',
          nowStatus: syncInfo.correctStatus,
          reason: syncInfo.reason || 'Status synchronized',
        });

        console.log(
          `✅ [Status Sync] Fixed ${user.displayId} (${user.role}): ` +
          `approved=${user.approved}, ` +
          `status="${user.status}" → "${syncInfo.correctStatus}"`
        );
      } catch (error) {
        console.error(
          `❌ [Status Sync] Failed to update ${user.displayId}:`,
          error
        );
      }
    }

    const summary = {
      totalChecked: allUsers.length,
      alreadyCorrect: alreadyCorrectCount,
      fixed: fixedCount,
      skipped: skippedCount,
    };


    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${fixedCount} user status(es)`,
      summary,
      fixedUsers: fixedUsers.slice(0, 100), // Limit to first 100 for response size
      timestamp: now,
    });

  } catch (error) {
    console.error('❌ [Status Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to synchronize user statuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to preview what would be changed without making changes
 */
export async function GET(request: NextRequest) {
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

    const needsSync: Array<{
      id: number;
      displayId: string;
      email: string;
      role: string;
      approved: boolean;
      currentStatus: string;
      correctStatus: string;
      reason: string;
    }> = [];

    let correctCount = 0;

    // Check each user
    for (const user of allUsers) {
      const syncInfo = getStatusSyncInfo(user);

      if (syncInfo.needsSync) {
        needsSync.push({
          id: user.id,
          displayId: user.displayId,
          email: user.email,
          role: user.role,
          approved: Boolean(user.approved),
          currentStatus: user.status || 'unknown',
          correctStatus: syncInfo.correctStatus,
          reason: syncInfo.reason || 'Needs sync',
        });
      } else {
        correctCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: needsSync.length > 0 
        ? `Found ${needsSync.length} users that need status sync` 
        : 'All users have correct statuses',
      summary: {
        totalUsers: allUsers.length,
        correctStatuses: correctCount,
        needsSync: needsSync.length,
      },
      usersNeedingSync: needsSync.slice(0, 50), // Limit to first 50
      previewOnly: true,
      hint: 'Use POST request to apply these changes',
    });

  } catch (error) {
    console.error('❌ [Status Sync] Preview error:', error);
    return NextResponse.json(
      {
        error: 'Failed to preview status sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

