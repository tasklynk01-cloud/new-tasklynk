import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, users, jobAttachments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/v2/editor/orders/[id]/review
 * Fetch detailed order information for editor review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const orderId = parseInt(params.id);
    const editorId = authCheck.user.id;

    // Fetch order with all related data
    const [order] = await db
      .select({
        id: jobs.id,
        orderId: jobs.orderId,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        deadline: jobs.deadline,
        pages: jobs.pages,
        slides: jobs.slides,
        workType: jobs.workType,
        instructions: jobs.instructions,
        editorNotes: jobs.editorNotes,
        editorRevisionNotes: jobs.editorRevisionNotes,
        clientId: jobs.clientId,
        assignedFreelancerId: jobs.assignedFreelancerId,
        assignedEditorId: jobs.assignedEditorId,
      })
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify editor has access
    if (order.assignedEditorId !== editorId) {
      return NextResponse.json(
        { error: 'You do not have access to this order' },
        { status: 403 }
      );
    }

    // Fetch client name
    let clientName = 'Unknown';
    if (order.clientId) {
      const [client] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, order.clientId))
        .limit(1);
      if (client) clientName = client.name;
    }

    // Fetch freelancer name
    let freelancerName = null;
    if (order.assignedFreelancerId) {
      const [freelancer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, order.assignedFreelancerId))
        .limit(1);
      if (freelancer) freelancerName = freelancer.name;
    }

    // Fetch attachments
    const attachments = await db
      .select({
        id: jobAttachments.id,
        fileName: jobAttachments.fileName,
        fileUrl: jobAttachments.fileUrl,
        fileType: jobAttachments.fileType,
        uploadType: jobAttachments.uploadType,
        uploadedAt: jobAttachments.createdAt,
        uploadedBy: jobAttachments.uploadedBy,
      })
      .from(jobAttachments)
      .where(eq(jobAttachments.jobId, orderId));

    // Enrich attachments with uploader details
    const enrichedAttachments = await Promise.all(
      attachments.map(async (file) => {
        if (file.uploadedBy) {
          const [uploader] = await db
            .select({ name: users.name, role: users.role })
            .from(users)
            .where(eq(users.id, file.uploadedBy))
            .limit(1);
          
          return {
            ...file,
            uploaderName: uploader?.name || 'Unknown',
            uploaderRole: uploader?.role || 'unknown',
          };
        }
        return {
          ...file,
          uploaderName: 'System',
          uploaderRole: 'system',
        };
      })
    );

    // Parse editor notes
    let parsedEditorNotes = [];
    if (order.editorNotes) {
      try {
        parsedEditorNotes = JSON.parse(order.editorNotes);
      } catch (e) {
        console.error('Failed to parse editor notes:', e);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        description: order.instructions,
        academicLevel: order.workType,
        subject: order.title,
        freelancerId: order.assignedFreelancerId,
        clientName,
        freelancerName,
        editorNotes: parsedEditorNotes,
        attachments: enrichedAttachments,
      }
    });
  } catch (error) {
    console.error('Error fetching order for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
