import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid message ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const messageId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { approved } = body;

    // Validate approved field
    if (approved === undefined || approved === null) {
      return NextResponse.json(
        { 
          error: 'Approved field is required',
          code: 'MISSING_APPROVED_FIELD' 
        },
        { status: 400 }
      );
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Approved field must be a boolean',
          code: 'INVALID_APPROVED_TYPE' 
        },
        { status: 400 }
      );
    }

    // Check if message exists
    const existingMessage = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json(
        { 
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Update message approval status
    const updatedMessage = await db.update(messages)
      .set({
        adminApproved: approved
      })
      .where(eq(messages.id, messageId))
      .returning();

    const [sender] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, updatedMessage[0].senderId))
      .limit(1);

    const [receiver] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, updatedMessage[0].receiverId))
      .limit(1);

    if (approved && receiver) {
      try {
        await createNotification({
          userId: receiver.id,
          type: 'message',
          title: 'New Message',
          message: `${sender?.name || 'A user'} sent you a message.`,
          relatedId: updatedMessage[0].id,
          relatedType: 'message',
        });
      } catch (notificationError) {
        console.error('Failed to notify direct message receiver:', notificationError);
      }

      if (receiver.email) {
        try {
          await sendEmail({
            to: receiver.email,
            subject: `New message from ${sender?.name || 'TaskLynk user'}`,
            category: 'notification',
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
              <h2 style="margin-bottom: 12px;">You have a new message</h2>
              <p><strong>From:</strong> ${sender?.name || sender?.email || `User #${updatedMessage[0].senderId}`}</p>
              <div style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">
                ${updatedMessage[0].content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </div>
              <p>Sign in to your dashboard to continue the conversation.</p>
            </div>`,
          });
        } catch (emailError) {
          console.error('Failed to send approved direct message email:', emailError);
        }
      }
    }

    if (sender) {
      try {
        await createNotification({
          userId: sender.id,
          type: 'message',
          title: approved ? 'Message Approved' : 'Message Rejected',
          message: approved
            ? 'Your message has been approved and delivered.'
            : 'Your message was rejected during moderation.',
          relatedId: updatedMessage[0].id,
          relatedType: 'message',
        });
      } catch (notificationError) {
        console.error('Failed to notify direct message sender:', notificationError);
      }
    }

    return NextResponse.json(updatedMessage[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}