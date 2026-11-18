import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobMessages, jobs, users } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { sendEmailToAdmins } from '@/lib/email';
import { getJobMessageAccess } from '@/lib/message-access';

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // Require authentication
  const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id } = await ctx.params;
    const jobId = id;

    // Validate jobId parameter
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    const parsedJobId = parseInt(jobId);
    const currentUser = authCheck.user!;

    // Parse request body
    const body = await request.json();
    const { senderId, message, content, messageType } = body;
    const messageText = typeof message === 'string' ? message : content;

    if (senderId !== undefined && parseInt(String(senderId)) !== currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot send messages on behalf of another user', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const access = await getJobMessageAccess(currentUser, parsedJobId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, code: access.status === 404 ? 'JOB_NOT_FOUND' : 'FORBIDDEN' },
        { status: access.status }
      );
    }

    // Validate required fields
    if (!messageText || typeof messageText !== 'string' || messageText.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    // Validate messageType if provided
    const validMessageTypes = ['text', 'link'];
    const finalMessageType = messageType || 'text';
    
    if (!validMessageTypes.includes(finalMessageType)) {
      return NextResponse.json(
        { error: `Invalid messageType. Must be one of: ${validMessageTypes.join(', ')}`, code: 'INVALID_MESSAGE_TYPE' },
        { status: 400 }
      );
    }

    // Validate job exists
    const existingJob = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, parsedJobId))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      );
    }

    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'manager';
    const shouldAutoApprove = isPrivileged;
    const now = new Date().toISOString();

    // Insert message with auto-approval for privileged users
    const newMessage = await db
      .insert(jobMessages)
      .values({
        jobId: parsedJobId,
        senderId: currentUser.id,
        message: messageText.trim(),
        messageType: finalMessageType,
        adminApproved: shouldAutoApprove,
        isDelivered: shouldAutoApprove, // Auto-deliver if auto-approved
        approvedAt: shouldAutoApprove ? now : null,
        approvedBy: shouldAutoApprove ? currentUser.id : null,
        createdAt: now,
      })
      .returning();

    // Send email notification to admins for new messages (except from admin/manager)
    if (!isPrivileged) {
      const job = existingJob[0];
      const senderName = currentUser.name || currentUser.email || `User #${currentUser.id}`;
      const messagePreview = messageText.trim().substring(0, 100) + (messageText.trim().length > 100 ? '...' : '');
      
      try {
        await sendEmailToAdmins({
          subject: `New Message on Order ${job.displayId || job.orderId || `#${jobId}`}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Message Received</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Order:</strong> ${job.displayId || job.orderId || `#${jobId}`}</p>
              <p><strong>From:</strong> ${senderName} (${currentUser.role})</p>
              <p><strong>Job Title:</strong> ${job.title || 'N/A'}</p>
              <p><strong>Message:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">${messagePreview}</p>
            </div>
            <p>Please <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/admin/jobs/${jobId}" style="color: #2563eb; text-decoration: none;">view the order</a> to respond.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This is an automated notification from TaskLynk.</p>
          </div>`
        });
      } catch (emailError) {
        console.error('Failed to send admin email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/jobs/[id]/messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await ctx.params;
    const jobId = id;

    // Validate jobId parameter
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    const parsedJobId = parseInt(jobId);
    const currentUser = authCheck.user!;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const access = await getJobMessageAccess(currentUser, parsedJobId);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          code: access.status === 404 ? 'JOB_NOT_FOUND' : 'FORBIDDEN',
        },
        { status: access.status }
      );
    }

    // Build query with user details - always join to get sender information
    type MessageRow = {
      id: number;
      jobId: number;
      senderId: number;
      message: string;
      messageType: string | null;
      adminApproved: boolean | null;
      isDelivered: boolean | null;
      approvedAt: string | null;
      approvedBy: number | null;
      createdAt: string;
      senderName: string | null;
      senderEmail: string | null;
      senderRole: string | null;
    };

    let allMessages: MessageRow[];
    try {
      allMessages = await db
        .select({
          id: jobMessages.id,
          jobId: jobMessages.jobId,
          senderId: jobMessages.senderId,
          message: jobMessages.message,
          messageType: jobMessages.messageType,
          adminApproved: jobMessages.adminApproved,
          isDelivered: jobMessages.isDelivered,
          approvedAt: jobMessages.approvedAt,
          approvedBy: jobMessages.approvedBy,
          createdAt: jobMessages.createdAt,
          senderName: users.name,
          senderEmail: users.email,
          senderRole: users.role,
        })
        .from(jobMessages)
        .leftJoin(users, eq(jobMessages.senderId, users.id))
        .where(eq(jobMessages.jobId, parsedJobId))
        .orderBy(asc(jobMessages.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (queryError: any) {
      console.error('Database query error in GET /api/jobs/[id]/messages:', {
        error: queryError?.message || queryError,
        stack: queryError?.stack,
        jobId: parsedJobId,
      });
      // Return empty array with success status - allows page to load even if query fails
      return NextResponse.json([], { status: 200 });
    }

    // Ensure allMessages is an array (fallback if query failed)
    if (!Array.isArray(allMessages)) {
      console.warn('GET /api/jobs/[id]/messages: Query returned non-array, using empty array');
      allMessages = [];
    }

    // Filter messages based on user role and sender visibility
    let filteredMessages = allMessages;
    
    // Allow full visibility for admin and manager
    const privileged = currentUser.role === 'admin' || currentUser.role === 'manager';
    if (!privileged) {
      filteredMessages = allMessages.filter(msg => {
        // User sees their own messages (even if pending)
        if (msg.senderId === currentUser.id) return true;
        
        // User sees delivered messages from others
        return msg.adminApproved === true && msg.isDelivered === true;
      });
    }

    // Format response with enhanced fields
    const formattedMessages = filteredMessages.map(msg => ({
      id: msg.id,
      jobId: msg.jobId,
      senderId: msg.senderId,
      senderName: msg.senderName || 'Unknown User',
      senderRole: msg.senderRole || 'unknown',
      content: msg.message,
      message: msg.message,
      messageType: msg.messageType || 'text',
      adminApproved: Boolean(msg.adminApproved),
      isApproved: msg.adminApproved,
      isDelivered: msg.isDelivered,
      approvedAt: msg.approvedAt,
      approvedBy: msg.approvedBy,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json(formattedMessages, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/jobs/[id]/messages error:', {
      error: error?.message || error,
      stack: error?.stack,
      url: request.url,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages', 
        details: error?.message || 'Unknown error',
        code: 'MESSAGES_FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}