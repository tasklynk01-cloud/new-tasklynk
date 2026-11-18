import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobMessages, jobs, conversations } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';
import { requireRole } from '@/lib/admin-auth';
import { getJobMessageAccess } from '@/lib/message-access';

// GET /api/v2/messages - Get messages for an order or between users
export async function GET(request: NextRequest) {
  let currentUserId: number | undefined;
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer']);
    if (authCheck.error) {
      return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
    }
    const currentUser = authCheck.user;
    if (!currentUser) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    currentUserId = currentUser.id;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (!orderId && !userId && !conversationId) {
      return createErrorResponse('Order ID, User ID, or Conversation ID required', 'MISSING_PARAMETERS', 400);
    }

    let messagesList;

    if (conversationId) {
      // 🔒 FIX #25: Validate participant before fetching messages
      const [conversation] = await withRetry(
        async () => {
          return await db.select().from(conversations)
            .where(eq(conversations.id, parseInt(conversationId)))
            .limit(1);
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      if (!conversation) {
        return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
      }

      const isParticipant = currentUser.id === conversation.participant1Id || currentUser.id === conversation.participant2Id;
      if (!isParticipant) {
        if (!conversation.jobId) {
          return createErrorResponse('You are not a participant in this conversation', 'FORBIDDEN', 403);
        }

        const access = await getJobMessageAccess(currentUser, conversation.jobId);
        if (!access.allowed) {
          return createErrorResponse(access.reason, 'FORBIDDEN', access.status);
        }
      }

      // Get messages for this conversation
      messagesList = await withRetry(
        async () => {
          return await db.select().from(jobMessages)
            .where(eq(jobMessages.jobId, conversation.jobId!))
            .orderBy(jobMessages.createdAt);
        },
        { maxRetries: 3, initialDelay: 500 }
      );
    } else if (orderId) {
      const parsedOrderId = parseInt(orderId);
      if (isNaN(parsedOrderId)) {
        return createErrorResponse('Invalid order ID', 'INVALID_ORDER_ID', 400);
      }

      const access = await getJobMessageAccess(currentUser, parsedOrderId);
      if (!access.allowed) {
        return createErrorResponse(access.reason, access.status === 404 ? 'ORDER_NOT_FOUND' : 'FORBIDDEN', access.status);
      }

      // Get all messages for an order
      messagesList = await withRetry(
        async () => {
          return await db.select().from(jobMessages)
            .where(eq(jobMessages.jobId, parsedOrderId))
            .orderBy(jobMessages.createdAt);
        },
        { maxRetries: 3, initialDelay: 500 }
      );
    } else if (userId) {
      const requestedUserId = parseInt(userId);
      if (isNaN(requestedUserId)) {
        return createErrorResponse('Invalid user ID', 'INVALID_USER_ID', 400);
      }

      if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && requestedUserId !== currentUser.id) {
        return createErrorResponse('You can only view your own sent messages', 'FORBIDDEN', 403);
      }

      // Get all messages for a user (sent or received)
      messagesList = await withRetry(
        async () => {
          return await db.select().from(jobMessages)
            .where(eq(jobMessages.senderId, requestedUserId))
            .orderBy(jobMessages.createdAt);
        },
        { maxRetries: 3, initialDelay: 500 }
      );
    }

    // REAL-TIME MESSAGING: Return all messages immediately without approval filtering
    // Messages are now auto-approved on creation for instant WhatsApp/SMS-like experience
    // Admin moderation can still be done after the fact if needed

    return createSuccessResponse({ messages: messagesList });
  } catch (error: any) {
    logApiError(error, {
      url: request.url,
      method: request.method,
      userId: currentUserId,
    });
    return handleDatabaseError(error);
  }
}

// POST /api/v2/messages - Send a message (pending approval)
export async function POST(request: NextRequest) {
  let currentUserId: number | undefined;
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer']);
    if (authCheck.error) {
      return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
    }
    const currentUser = authCheck.user;
    if (!currentUser) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
    currentUserId = currentUser.id;

    const body = await request.json();
    const { orderId, conversationId, senderId, message: messageText } = body;

    if ((!orderId && !conversationId) || !messageText) {
      return createErrorResponse('Missing required fields', 'MISSING_REQUIRED_FIELDS', 400);
    }

    if (senderId !== undefined && parseInt(String(senderId)) !== currentUser.id) {
      return createErrorResponse('Cannot send messages on behalf of another user', 'FORBIDDEN', 403);
    }

    let targetJobId: number;
    let targetConversationId: number | null = null;

    if (conversationId) {
      // 🔒 FIX #25: Validate sender is a participant
      const [conversation] = await withRetry(
        async () => {
          return await db.select().from(conversations)
            .where(eq(conversations.id, parseInt(conversationId)))
            .limit(1);
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      if (!conversation) {
        return createErrorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
      }

      const isParticipant = currentUser.id === conversation.participant1Id || currentUser.id === conversation.participant2Id;
      if (!isParticipant) {
        if (!conversation.jobId) {
          return createErrorResponse('You are not a participant in this conversation', 'FORBIDDEN', 403);
        }

        const access = await getJobMessageAccess(currentUser, conversation.jobId);
        if (!access.allowed) {
          return createErrorResponse(access.reason, 'FORBIDDEN', access.status);
        }
      }

      if (!conversation.jobId) {
        return createErrorResponse('Conversation is not linked to an order', 'INVALID_CONVERSATION', 400);
      }

      targetJobId = conversation.jobId!;
      targetConversationId = conversation.id;
    } else {
      targetJobId = parseInt(orderId);
      if (isNaN(targetJobId)) {
        return createErrorResponse('Invalid order ID', 'INVALID_ORDER_ID', 400);
      }
      
      const access = await getJobMessageAccess(currentUser, targetJobId);
      if (!access.allowed) {
        return createErrorResponse(access.reason, access.status === 404 ? 'ORDER_NOT_FOUND' : 'FORBIDDEN', access.status);
      }
    }

    const privilegedSender = currentUser.role === 'admin' || currentUser.role === 'manager';
    const now = new Date().toISOString();
    const [newMessage] = await withRetry(
      async () => {
        return await db.insert(jobMessages).values({
          jobId: targetJobId,
          senderId: currentUser.id,
          message: messageText,
          messageType: 'text',
          adminApproved: privilegedSender,
          isDelivered: privilegedSender,
          approvedAt: privilegedSender ? now : null,
          approvedBy: privilegedSender ? currentUser.id : null,
          createdAt: now,
        }).returning();
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (targetConversationId) {
      await withRetry(
        async () => {
          await db.update(conversations)
            .set({
              lastMessageAt: now,
              lastMessageSenderId: currentUser.id,
              lastMessagePreview: messageText.slice(0, 200),
              updatedAt: now,
            })
            .where(eq(conversations.id, targetConversationId));
        },
        { maxRetries: 2, initialDelay: 250 }
      );
    }

    return createSuccessResponse({ 
      message: newMessage,
      info: privilegedSender ? 'Message sent successfully' : 'Message sent and is pending approval'
    }, 201);
  } catch (error: any) {
    logApiError(error, {
      url: request.url,
      method: request.method,
      userId: currentUserId,
    });
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

