import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderChatMessages, jobs, users, contactMessages, notifications } from "@/db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";
import { sendEmailToAdmins, getNewContactMessageAdminHTML } from "@/lib/email";
import { notifyNewMessage } from "@/lib/notifications";

/**
 * GET /api/v2/orders/[id]/chat
 * Fetch chat messages for an order
 * 
 * Query params:
 * - role: user role (client, freelancer, admin, manager)
 * - userId: current user ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Valid order id required" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || '';
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!role || !userId) {
      return NextResponse.json({ error: "role and userId required" }, { status: 400 });
    }

    // Authenticate user
    const authCheck = await requireRole(request, ['client', 'account_owner', 'freelancer', 'admin', 'manager']);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json({ error: authCheck.error || "Unauthorized" }, { status: authCheck.status || 401 });
    }

    const authenticatedUser = authCheck.user;
    if (authenticatedUser.id !== userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Verify order exists
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 🔒 OWNERSHIP CHECK: this is a private order chat. Clients/freelancers may
    // only view messages for orders they're actually party to. Admin/manager
    // retain full oversight access.
    if (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') {
      if (order.clientId !== authenticatedUser.id) {
        return NextResponse.json({ error: "You do not have access to this order's messages" }, { status: 403 });
      }
    } else if (authenticatedUser.role === 'freelancer') {
      if (order.assignedFreelancerId !== authenticatedUser.id) {
        return NextResponse.json({ error: "You do not have access to this order's messages" }, { status: 403 });
      }
    }

    // Fetch messages - with error handling for missing table
    let messages: any[] = [];
    try {
      messages = await db
        .select({
          id: orderChatMessages.id,
          orderId: orderChatMessages.orderId,
          senderId: orderChatMessages.senderId,
          senderRole: orderChatMessages.senderRole,
          displaySenderName: orderChatMessages.displaySenderName,
          displaySenderRole: orderChatMessages.displaySenderRole,
          message: orderChatMessages.message,
          isRead: orderChatMessages.isRead,
          readAt: orderChatMessages.readAt,
          chatSpace: orderChatMessages.chatSpace,
          createdAt: orderChatMessages.createdAt,
        })
        .from(orderChatMessages)
        .where(eq(orderChatMessages.orderId, orderId))
        .orderBy(desc(orderChatMessages.createdAt));
    } catch (tableError: any) {
      const errorMessage = tableError?.message?.toLowerCase() || '';
      if (errorMessage.includes('no such table') || errorMessage.includes('order_chat_messages')) {
        console.warn('[Chat API] order_chat_messages table not found, returning empty array');
        return NextResponse.json({
          success: true,
          messages: [],
        });
      }
      throw tableError;
    }

    // Get sender names - fetch all unique senders
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    let senders: { id: number; name: string; role: string }[] = [];
    
    if (senderIds.length > 0) {
      senders = await db
        .select({ id: users.id, name: users.name, role: users.role })
        .from(users)
        .where(inArray(users.id, senderIds));
    }

    const messagesWithSenders = messages.map(msg => {
      const sender = senders.find(s => s.id === msg.senderId);
      return {
        ...msg,
        senderName: msg.displaySenderName || sender?.name || 'Unknown',
        senderRoleDisplay: msg.displaySenderRole || msg.senderRole || sender?.role || 'unknown',
      };
    });

    return NextResponse.json({
      success: true,
      messages: messagesWithSenders.reverse(), // Reverse to show oldest first
    });
  } catch (error: any) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * POST /api/v2/orders/[id]/chat
 * Send a chat message
 * 
 * Body:
 * - message: string
 * - chatSpace?: 'client' | 'freelancer' (for admin/manager)
 * - displaySenderName?: string (for admin/manager impersonation)
 * - displaySenderRole?: string (for admin/manager impersonation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Valid order id required" }, { status: 400 });
    }

    // Authenticate user
    const authCheck = await requireRole(request, ['client', 'account_owner', 'freelancer', 'admin', 'manager']);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json({ error: authCheck.error || "Unauthorized" }, { status: authCheck.status || 401 });
    }

    const authenticatedUser = authCheck.user;
    const body = await request.json();
    const { message, chatSpace, displaySenderName, displaySenderRole } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Verify order exists
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 🔒 OWNERSHIP CHECK: same as GET above - clients/freelancers can only
    // message on orders they're actually party to.
    if (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') {
      if (order.clientId !== authenticatedUser.id) {
        return NextResponse.json({ error: "You do not have access to this order's messages" }, { status: 403 });
      }
    } else if (authenticatedUser.role === 'freelancer') {
      if (order.assignedFreelancerId !== authenticatedUser.id) {
        return NextResponse.json({ error: "You do not have access to this order's messages" }, { status: 403 });
      }
    }

    // Determine message flow based on sender role
    let finalDisplayName = displaySenderName;
    let finalDisplayRole = displaySenderRole;
    let finalChatSpace = chatSpace;

    if (authenticatedUser.role === 'freelancer') {
      // Freelancer messages
      finalDisplayName = authenticatedUser.name;
      finalDisplayRole = 'freelancer';
      finalChatSpace = chatSpace || 'freelancer';
    } else if (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') {
      // Client messages
      finalDisplayName = authenticatedUser.name;
      finalDisplayRole = 'client';
      finalChatSpace = chatSpace || 'client';
    } else if (authenticatedUser.role === 'admin' || authenticatedUser.role === 'manager') {
      // Admin/Manager can send to either client or freelancer
      if (chatSpace && !['client', 'freelancer'].includes(chatSpace)) {
        return NextResponse.json({ error: "chatSpace must be 'client' or 'freelancer' for admin/manager" }, { status: 400 });
      }
      
      // Set display names for impersonation
      if (chatSpace === 'client') {
        finalDisplayName = displaySenderName || 'Support';
        finalDisplayRole = displaySenderRole || 'support';
      } else if (chatSpace === 'freelancer') {
        finalDisplayName = displaySenderName || 'Client';
        finalDisplayRole = displaySenderRole || 'client';
      } else {
        // Default for admin/manager if no chatSpace specified
        finalDisplayName = authenticatedUser.name;
        finalDisplayRole = authenticatedUser.role;
        finalChatSpace = 'admin';
      }
      finalChatSpace = chatSpace || 'admin';
    } else {
      // Allow any other role to send messages
      finalDisplayName = authenticatedUser.name;
      finalDisplayRole = authenticatedUser.role;
      finalChatSpace = chatSpace || authenticatedUser.role;
    }

    // Insert message (ownership already verified above)
    const now = new Date().toISOString();
    const [newMessage] = await db.insert(orderChatMessages).values({
      orderId,
      senderId: authenticatedUser.id,
      senderRole: authenticatedUser.role,
      displaySenderName: finalDisplayName,
      displaySenderRole: finalDisplayRole,
      message: message.trim(),
      isRead: false,
      chatSpace: finalChatSpace,
      createdAt: now,
    }).returning();

    // Create notification for message recipient
    try {
      // Determine who should receive the notification
      let recipientIds: number[] = [];
      
      if (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') {
        // Client sent message - notify freelancer and admin/manager
        if (order.assignedFreelancerId) {
          recipientIds.push(order.assignedFreelancerId);
        }
        // Get all admin and manager users
        const adminManagers = await db.select({ id: users.id }).from(users)
          .where(and(
            eq(users.approved, true),
            or(eq(users.role, 'admin'), eq(users.role, 'manager'))
          ));
        recipientIds.push(...adminManagers.map(u => u.id));
      } else if (authenticatedUser.role === 'freelancer') {
        // Freelancer sent message - notify client and admin/manager
        if (order.clientId) {
          recipientIds.push(order.clientId);
        }
        // Get all admin and manager users
        const adminManagers = await db.select({ id: users.id }).from(users)
          .where(and(
            eq(users.approved, true),
            or(eq(users.role, 'admin'), eq(users.role, 'manager'))
          ));
        recipientIds.push(...adminManagers.map(u => u.id));
      } else if (authenticatedUser.role === 'admin' || authenticatedUser.role === 'manager') {
        // Admin/Manager sent message - notify based on chat space
        if (finalChatSpace === 'client' && order.clientId) {
          recipientIds.push(order.clientId);
        } else if (finalChatSpace === 'freelancer' && order.assignedFreelancerId) {
          recipientIds.push(order.assignedFreelancerId);
        }
      }
      
      // Remove duplicates and sender
      recipientIds = [...new Set(recipientIds)].filter(id => id !== authenticatedUser.id);
      
      // Create notifications for each recipient
      const orderTitle = order.title || `Order #${order.displayId || orderId}`;
      for (const recipientId of recipientIds) {
        await notifyNewMessage(
          recipientId,
          newMessage.id,
          finalDisplayName || authenticatedUser.name
        );
      }
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError);
      // Don't fail the message send if notification fails
    }

    // If message is from client or freelancer, create a contact message for admin/manager
    if (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner' || authenticatedUser.role === 'freelancer') {
      try {
        // Get order details for context
        const orderTitle = order.title || `Order #${order.displayId || orderId}`;
        
        // Create contact message entry
        const contactMessageContent = `Order: ${orderTitle}\n\nMessage: ${message.trim()}`;
        
        await db.insert(contactMessages).values({
          senderName: authenticatedUser.name,
          senderEmail: authenticatedUser.email,
          senderPhone: authenticatedUser.phone || null,
          content: contactMessageContent,
          status: 'pending',
          isGuest: false,
          createdAt: now,
        });

        // Send email notification to admin/manager
        try {
          // Create email content with order context
          const emailContent = `Order: ${orderTitle} (ID: ${orderId})\n\nMessage:\n${message.trim()}`;
          
          const emailHTML = getNewContactMessageAdminHTML(
            authenticatedUser.name,
            authenticatedUser.email,
            authenticatedUser.phone || null,
            emailContent,
            false // Not a guest, registered user
          );

          await sendEmailToAdmins({
            subject: `New Message from ${authenticatedUser.role === 'freelancer' ? 'Freelancer' : 'Client'}: ${orderTitle}`,
            html: emailHTML,
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the message send if email fails
        }
      } catch (contactError) {
        console.error('Failed to create contact message:', contactError);
        // Don't fail the message send if contact message creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        orderId: newMessage.orderId,
        senderId: newMessage.senderId,
        senderRole: newMessage.senderRole,
        displaySenderName: newMessage.displaySenderName,
        displaySenderRole: newMessage.displaySenderRole,
        message: newMessage.message,
        isRead: newMessage.isRead,
        chatSpace: newMessage.chatSpace,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error sending chat message:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}

