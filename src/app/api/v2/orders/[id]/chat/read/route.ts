import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderChatMessages, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";

/**
 * POST /api/v2/orders/[id]/chat/read
 * Mark messages as read
 * 
 * Body:
 * - messageIds?: number[] (optional - mark specific messages)
 * - markAll?: boolean (mark all unread messages for this order)
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
    const { messageIds, markAll } = body;

    // Verify order exists
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 🔒 OWNERSHIP CHECK: same as the chat routes above.
    if (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') {
      if (order.clientId !== authenticatedUser.id) {
        return NextResponse.json({ error: "You do not have access to this order's messages" }, { status: 403 });
      }
    } else if (authenticatedUser.role === 'freelancer') {
      if (order.assignedFreelancerId !== authenticatedUser.id) {
        return NextResponse.json({ error: "You do not have access to this order's messages" }, { status: 403 });
      }
    }

    const now = new Date().toISOString();

    if (markAll) {
      // Mark all unread messages for this order as read
      await db
        .update(orderChatMessages)
        .set({
          isRead: true,
          readAt: now,
        })
        .where(
          and(
            eq(orderChatMessages.orderId, orderId),
            eq(orderChatMessages.isRead, false)
          )
        );
    } else if (Array.isArray(messageIds) && messageIds.length > 0) {
      // Mark specific messages as read
      for (const messageId of messageIds) {
        await db
          .update(orderChatMessages)
          .set({
            isRead: true,
            readAt: now,
          })
          .where(
            and(
              eq(orderChatMessages.id, messageId),
              eq(orderChatMessages.orderId, orderId)
            )
          );
      }
    } else {
      return NextResponse.json({ error: "messageIds array or markAll flag required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: error.message || "Failed to mark messages as read" }, { status: 500 });
  }
}

