import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users, jobMessages, jobs } from '@/db/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';
import { createNotification } from '@/lib/notifications';
import { sendEmail, sendEmailToAdmins } from '@/lib/email';

export async function GET(request: NextRequest) {
  let authenticatedUser: { id: number; role?: string } | null = null;
  try {
    // 🔒 AUTHENTICATION: Require any authenticated user
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer', 'editor', 'writer']);
    if (authCheck.error) {
      return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
    }
    authenticatedUser = authCheck.user!;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');
    const otherId = searchParams.get('otherId');
    const jobId = searchParams.get('jobId');
    const adminApproved = searchParams.get('adminApproved');

    let query = db.select().from(messages).$dynamic();

    const conditions = [] as any[];

    if (senderId && !isNaN(parseInt(senderId))) {
      conditions.push(eq(messages.senderId, parseInt(senderId)));
    }

    if (receiverId && !isNaN(parseInt(receiverId))) {
      conditions.push(eq(messages.receiverId, parseInt(receiverId)));
    }

    if (otherId && !isNaN(parseInt(otherId)) && authenticatedUser) {
      const otherUserId = parseInt(otherId);
      conditions.push(
        or(
          and(eq(messages.senderId, authenticatedUser.id), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, authenticatedUser.id))
        )
      );
    }

    if (jobId && !isNaN(parseInt(jobId))) {
      conditions.push(eq(messages.jobId, parseInt(jobId)));
    }

    if (adminApproved !== null) {
      if (adminApproved === 'true') {
        conditions.push(eq(messages.adminApproved, true));
      } else if (adminApproved === 'false') {
        conditions.push(eq(messages.adminApproved, false));
      }
    }

    if (
      authenticatedUser &&
      authenticatedUser.role !== 'admin' &&
      authenticatedUser.role !== 'manager' &&
      !otherId
    ) {
      conditions.push(
        or(
          eq(messages.senderId, authenticatedUser.id),
          eq(messages.receiverId, authenticatedUser.id)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    try {
      const results = await withRetry(
        async () => {
          return await query
            .orderBy(desc(messages.createdAt))
            .limit(limit)
            .offset(offset);
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      const userIds = Array.from(new Set(results.flatMap((message) => [message.senderId, message.receiverId])));
      const participantRows = userIds.length > 0
        ? await withRetry(
            async () => {
              return await db
                .select({
                  id: users.id,
                  name: users.name,
                  email: users.email,
                  role: users.role,
                })
                .from(users)
                .where(inArray(users.id, userIds));
            },
            { maxRetries: 3, initialDelay: 500 }
          )
        : [];

      const participantMap = new Map(participantRows.map((user) => [user.id, user]));
      const formattedResults = results.map((message) => ({
        ...message,
        senderName: participantMap.get(message.senderId)?.name || `User #${message.senderId}`,
        senderEmail: participantMap.get(message.senderId)?.email || null,
        senderRole: participantMap.get(message.senderId)?.role || null,
        receiverName: participantMap.get(message.receiverId)?.name || `User #${message.receiverId}`,
        receiverEmail: participantMap.get(message.receiverId)?.email || null,
        receiverRole: participantMap.get(message.receiverId)?.role || null,
      }));

      return NextResponse.json(formattedResults);
    } catch (innerErr) {
      // Fallback: derive a moderation list from job messages when global messages query fails
      const fallbackPending = await withRetry(
        async () => {
          return await db
        .select({
          id: jobMessages.id,
          senderId: jobMessages.senderId,
          receiverId: jobs.assignedFreelancerId, // best-effort; may be null
          jobId: jobMessages.jobId,
          content: jobMessages.message,
          fileUrl: jobMessages.messageType, // no file here; reuse type for visibility
          adminApproved: jobMessages.adminApproved,
          createdAt: jobMessages.createdAt,
        })
            .from(jobMessages)
            .leftJoin(jobs, eq(jobMessages.jobId, jobs.id))
            .where(eq(jobMessages.adminApproved, false))
            .orderBy(desc(jobMessages.createdAt))
            .limit(limit)
            .offset(offset);
        },
        { maxRetries: 2, initialDelay: 500 }
      );

      return NextResponse.json(fallbackPending);
    }
  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
      userId: authenticatedUser?.id,
    });
    return handleDatabaseError(error);
  }
}

export async function POST(request: NextRequest) {
  let authenticatedUser: { id: number; role: string } | null = null;
  try {
    // 🔒 AUTHENTICATION: Require any authenticated user
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer', 'editor', 'writer']);
    if (authCheck.error) {
      return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
    }
    authenticatedUser = authCheck.user!;

    const body = await request.json();
    const { senderId, receiverId, jobId, content, message, fileUrl } = body;
    const contentText = typeof content === 'string' ? content : message;

    // 🔒 AUTHORIZATION: Verify sender matches authenticated user (unless admin)
    if (!authenticatedUser) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    if (authenticatedUser.role !== 'admin' && senderId !== authenticatedUser.id) {
      return createErrorResponse(
        'Cannot send messages on behalf of other users',
        'FORBIDDEN',
        403
      );
    }

    if (!senderId || isNaN(parseInt(String(senderId)))) {
      return createErrorResponse('Valid senderId is required', 'MISSING_SENDER_ID', 400);
    }

    if (!receiverId || isNaN(parseInt(String(receiverId)))) {
      return createErrorResponse('Valid receiverId is required', 'MISSING_RECEIVER_ID', 400);
    }

    if (!contentText || typeof contentText !== 'string' || contentText.trim() === '') {
      return createErrorResponse('Content is required and must not be empty', 'MISSING_CONTENT', 400);
    }

    // Check if sender is admin - if so, auto-approve the message
    const sender = await withRetry(
      async () => {
        return await db.select()
          .from(users)
          .where(eq(users.id, parseInt(String(senderId))))
          .limit(1);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    const senderRole = sender.length > 0 ? sender[0].role : null;
    const isPrivilegedSender = senderRole === 'admin' || senderRole === 'manager';

    // Check if receiver is freelancer for admin messages
    const receiver = await withRetry(
      async () => {
        return await db.select()
          .from(users)
          .where(eq(users.id, parseInt(String(receiverId))))
          .limit(1);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    const insertData: {
      senderId: number;
      receiverId: number;
      content: string;
      jobId?: number;
      fileUrl?: string;
      adminApproved: boolean;
      createdAt: string;
    } = {
      senderId: parseInt(String(senderId)),
      receiverId: parseInt(String(receiverId)),
      content: contentText.trim(),
      adminApproved: isPrivilegedSender,
      createdAt: new Date().toISOString(),
    };

    if (jobId !== undefined && jobId !== null && !isNaN(parseInt(String(jobId)))) {
      insertData.jobId = parseInt(String(jobId));
    }

    if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim() !== '') {
      insertData.fileUrl = fileUrl.trim();
    }

    const newMessage = await withRetry(
      async () => {
        return await db.insert(messages).values(insertData).returning();
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    const senderUser = sender[0];
    const receiverUser = receiver[0];

    if (receiverUser) {
      if (insertData.adminApproved) {
        try {
          await createNotification({
            userId: receiverUser.id,
            type: 'message',
            title: 'New Message',
            message: `${senderUser?.name || 'A user'} sent you a new message.`,
            relatedId: newMessage[0].id,
            relatedType: 'message',
          });
        } catch (notificationError) {
          console.error('Failed to create direct message notification:', notificationError);
        }

        if (receiverUser.email) {
          try {
            await sendEmail({
              to: receiverUser.email,
              subject: `New message from ${senderUser?.name || 'TaskLynk user'}`,
              category: 'notification',
              html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin-bottom: 12px;">You have a new message</h2>
                <p><strong>From:</strong> ${senderUser?.name || senderUser?.email || `User #${senderId}`}</p>
                <p><strong>Role:</strong> ${senderUser?.role || 'user'}</p>
                <div style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">
                  ${contentText.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
                <p>Sign in to your dashboard to continue the conversation.</p>
              </div>`,
            });
          } catch (emailError) {
            console.error('Failed to send direct message email:', emailError);
          }
        }
      } else {
        try {
          await sendEmailToAdmins({
            subject: `Direct message pending approval from ${senderUser?.name || senderUser?.email || `User #${senderId}`}`,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
              <h2 style="margin-bottom: 12px;">Direct message pending approval</h2>
              <p><strong>From:</strong> ${senderUser?.name || senderUser?.email || `User #${senderId}`}</p>
              <p><strong>To:</strong> ${receiverUser.name || receiverUser.email || `User #${receiverId}`}</p>
              <div style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">
                ${contentText.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </div>
              <p>Review the pending message from the admin dashboard.</p>
            </div>`,
          });
        } catch (adminEmailError) {
          console.error('Failed to notify admins about pending direct message:', adminEmailError);
        }
      }
    }

    return createSuccessResponse(newMessage[0], 201);
  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
      userId: authenticatedUser?.id,
    });
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

