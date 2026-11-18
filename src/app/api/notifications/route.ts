import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since');

    if (!userId) {
      return createErrorResponse('userId is required', 'MISSING_USER_ID', 400);
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return createErrorResponse('userId must be a number', 'INVALID_USER_ID', 400);
    }

    // Build query conditions
    const conditions = [eq(notifications.userId, userIdNum)];

    // Add timestamp filter if provided
    if (since) {
      conditions.push(gte(notifications.createdAt, since));
    }

    const userNotifications = await withRetry(
      async () => {
        return await db
          .select()
          .from(notifications)
          .where(and(...conditions))
          .orderBy(desc(notifications.createdAt))
          .limit(100);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    const response = createSuccessResponse(userNotifications);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, relatedId, relatedType } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return createErrorResponse('Missing required fields: userId, type, title, message', 'MISSING_REQUIRED_FIELDS', 400);
    }

    // Verify user exists
    const [user] = await withRetry(
      async () => {
        return await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (!user) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    // Insert notification
    await withRetry(
      async () => {
        return await db.insert(notifications).values({
          userId,
          type,
          title,
          message,
          read: false,
          relatedId: relatedId || null,
          relatedType: relatedType || null,
          createdAt: new Date().toISOString(),
        });
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    return createSuccessResponse({
      message: 'Notification created successfully',
    }, 201);
  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

/**
 * PATCH /api/notifications
 * Mark notifications as read or delete
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, action, userId } = body;

    if (action === 'mark_all_read') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId required for mark_all_read' },
          { status: 400 }
        );
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));

      return NextResponse.json(
        { success: true, message: 'All notifications marked as read' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!notificationId && !userId) {
      return NextResponse.json(
        { error: 'Provide either id or userId' },
        { status: 400 }
      );
    }

    if (notificationId) {
      // Delete specific notification
      await db
        .delete(notifications)
        .where(eq(notifications.id, parseInt(notificationId)));

      return NextResponse.json(
        { success: true, message: 'Notification deleted' },
        { status: 200 }
      );
    }

    if (userId) {
      // Delete all notifications for user
      await db
        .delete(notifications)
        .where(eq(notifications.userId, parseInt(userId)));

      return NextResponse.json(
        { success: true, message: 'All notifications deleted' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}

