import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editorMessages, users, notifications } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/editor/messages
 * Get editor messages (Editor <-> Admin/Manager only)
 * Query params: jobId (optional), unreadOnly (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const userId = authCheck.user.id;
    const userRole = authCheck.user.role;

    let query = db
      .select({
        id: editorMessages.id,
        jobId: editorMessages.jobId,
        senderId: editorMessages.senderId,
        senderRole: editorMessages.senderRole,
        receiverId: editorMessages.receiverId,
        receiverRole: editorMessages.receiverRole,
        message: editorMessages.message,
        messageType: editorMessages.messageType,
        fileUrl: editorMessages.fileUrl,
        isRead: editorMessages.isRead,
        readAt: editorMessages.readAt,
        createdAt: editorMessages.createdAt,
        senderName: users.name,
      })
      .from(editorMessages)
      .leftJoin(users, eq(editorMessages.senderId, users.id))
      .where(
        or(
          eq(editorMessages.senderId, userId),
          eq(editorMessages.receiverId, userId)
        )
      )
      .$dynamic();

    if (jobId) {
      const jobIdNum = parseInt(jobId);
      if (!isNaN(jobIdNum)) {
        query = query.where(eq(editorMessages.jobId, jobIdNum));
      }
    }

    if (unreadOnly) {
      query = query.where(
        and(
          eq(editorMessages.receiverId, userId),
          eq(editorMessages.isRead, false)
        )
      );
    }

    const messages = await query.orderBy(desc(editorMessages.createdAt));

    // Count unread messages
    const unreadCount = await db
      .select({ count: editorMessages.id })
      .from(editorMessages)
      .where(
        and(
          eq(editorMessages.receiverId, userId),
          eq(editorMessages.isRead, false)
        )
      );

    return NextResponse.json({
      success: true,
      messages,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error('Error fetching editor messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/editor/messages
 * Send message between Editor and Admin/Manager
 * Body: { jobId, receiverId, message, messageType?, fileUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { jobId, receiverId, message, messageType, fileUrl } = body;

    if (!jobId || !receiverId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, receiverId, message' },
        { status: 400 }
      );
    }

    const senderId = authCheck.user.id;
    const senderRole = authCheck.user.role;

    // Validate receiver exists and has valid role (admin, manager, or editor)
    const receiver = await db
      .select({
        id: users.id,
        role: users.role,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);

    if (!receiver[0]) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    const validRoles = ['admin', 'manager', 'editor'];
    if (!validRoles.includes(receiver[0].role)) {
      return NextResponse.json(
        { error: 'Can only send messages to admin, manager, or editor' },
        { status: 403 }
      );
    }

    // Prevent editors from messaging other editors or clients/freelancers
    if (senderRole === 'editor' && receiver[0].role === 'editor') {
      return NextResponse.json(
        { error: 'Editors cannot message other editors directly' },
        { status: 403 }
      );
    }

    if (senderRole === 'editor' && !['admin', 'manager'].includes(receiver[0].role)) {
      return NextResponse.json(
        { error: 'Editors can only message admin or manager' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const newMessage = await db
      .insert(editorMessages)
      .values({
        jobId,
        senderId,
        senderRole,
        receiverId,
        receiverRole: receiver[0].role,
        message,
        messageType: messageType || 'text',
        fileUrl: fileUrl || null,
        isRead: false,
        createdAt: now,
      })
      .returning();

    // Create notification for receiver
    await db.insert(notifications).values({
      userId: receiverId,
      jobId,
      type: 'editor_message',
      title: 'New Editor Message',
      message: `You have a new message from ${authCheck.user.name || senderRole}`,
      read: false,
      relatedId: newMessage[0]?.id,
      relatedType: 'editor_message',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: newMessage[0],
    });
  } catch (error) {
    console.error('Error sending editor message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/editor/messages/[id]
 * Mark message as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const messageId = parseInt(id);

    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updated = await db
      .update(editorMessages)
      .set({
        isRead: true,
        readAt: now,
      })
      .where(
        and(
          eq(editorMessages.id, messageId),
          eq(editorMessages.receiverId, authCheck.user.id)
        )
      )
      .returning();

    if (!updated[0]) {
      return NextResponse.json(
        { error: 'Message not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updated[0],
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

