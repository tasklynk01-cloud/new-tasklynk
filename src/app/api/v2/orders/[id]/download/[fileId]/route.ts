import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { checkDocumentAccess, logDocumentAccess } from '@/lib/document-access-control';
import { db } from '@/db';
import { orderFiles, jobAttachments, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/orders/[id]/download/[fileId]
 * Secure document download with access control
 * 
 * Only allows download if:
 * - User has POA payment terms (immediate access)
 * - User has POD payment terms AND payment is completed
 * - User is admin/manager (always allowed)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> | { id: string; fileId: string } }
) {
  try {
    // Authenticate user
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;

    const resolvedParams = params instanceof Promise ? await params : params;
    const orderId = parseInt(resolvedParams.id);
    const fileId = parseInt(resolvedParams.fileId);

    console.log('[Download] Request:', {
      userId: user.id,
      userRole: user.role,
      orderId,
      fileId,
    });

    if (isNaN(orderId) || isNaN(fileId)) {
      console.error('[Download] Invalid IDs:', {
        orderId: resolvedParams?.id,
        fileId: resolvedParams?.fileId,
        paramsType: typeof params,
      });
      return NextResponse.json({ error: 'Invalid order or file ID' }, { status: 400 });
    }

    // Fetch file details first to determine if it's a client-uploaded brief
    let file = null;
    let legacyFile = null;
    let fileUploadType = null;

    // Try order_files table first
    const [orderFile] = await db
      .select()
      .from(orderFiles)
      .where(eq(orderFiles.id, fileId))
      .limit(1);

    if (orderFile) {
      if (orderFile.orderId !== orderId) {
        return NextResponse.json({ error: 'File does not belong to this order' }, { status: 403 });
      }
      file = orderFile;
      fileUploadType = orderFile.fileType;
    } else {
      // Fallback to legacy job_attachments table
      const [attachment] = await db
        .select({
          id: jobAttachments.id,
          jobId: jobAttachments.jobId,
          fileUrl: jobAttachments.fileUrl,
          fileName: jobAttachments.fileName,
          fileType: jobAttachments.fileType,
          uploadType: jobAttachments.uploadType,
        })
        .from(jobAttachments)
        .where(eq(jobAttachments.id, fileId))
        .limit(1);

      if (!attachment) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      if (attachment.jobId !== orderId) {
        return NextResponse.json({ error: 'File does not belong to this order' }, { status: 403 });
      }

      legacyFile = attachment;
      fileUploadType = attachment.uploadType || attachment.fileType;
    }

    // 🔒 OWNERSHIP CHECK: the "client brief" fast-path below used to grant any
    // authenticated client access to brief files on ANY order (it never checked
    // that the requester was actually that order's client). Verify ownership here.
    const [orderForOwnership] = await db
      .select({ clientId: jobs.clientId })
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!orderForOwnership) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (
      (user.role === 'client' || user.role === 'account_owner') &&
      orderForOwnership.clientId !== user.id
    ) {
      return NextResponse.json({ error: 'You do not have access to this order' }, { status: 403 });
    }

    // Client-uploaded files (brief, additional) are always accessible to the order owner
    const isClientBrief = ['initial', 'brief', 'additional', 'attachment'].includes(fileUploadType || '');

    // For client/account_owner requesting their own order's brief files, grant immediate access
    if ((user.role === 'client' || user.role === 'account_owner') && isClientBrief) {
      console.log('[Download] Granting access to client brief file:', {
        userId: user.id,
        orderId,
        fileId,
        uploadType: fileUploadType,
      });

      await logDocumentAccess(user.id, orderId, 'full', 'download', true);

      const fileUrl = file?.fileUrl || legacyFile?.fileUrl;
      const fileName = file?.fileName || legacyFile?.fileName;
      const fileType = file?.fileType || legacyFile?.uploadType || legacyFile?.fileType;

      return NextResponse.json({
        success: true,
        fileUrl,
        fileName,
        fileType,
        message: 'Download authorized - client brief file',
      });
    }

    // For freelancer deliverables and other files, check document access permissions
    const accessCheck = await checkDocumentAccess(user.id, orderId, user.role);

    console.log('[Download] Access check result:', { 
      userId: user.id, 
      orderId, 
      fileId,
      uploadType: fileUploadType,
      isClientBrief,
      hasAccess: accessCheck.hasAccess, 
      canDownload: accessCheck.canDownload,
      reason: accessCheck.reason 
    });

    if (!accessCheck.hasAccess || !accessCheck.canDownload) {
      // Log failed access attempt
      await logDocumentAccess(user.id, orderId, accessCheck.accessLevel, 'download', false);

      return NextResponse.json(
        {
          error: 'Download not authorized',
          reason: accessCheck.reason,
          requiresPayment: accessCheck.requiresPayment,
          message: fileUploadType?.includes('final') || fileUploadType?.includes('completed') 
            ? 'Payment required to download final deliverables. Please complete payment to access your files.'
            : accessCheck.reason,
        },
        { status: 403 }
      );
    }

    // Log successful access
    await logDocumentAccess(user.id, orderId, accessCheck.accessLevel, 'download', true);

    const fileUrl = file?.fileUrl || legacyFile?.fileUrl;
    const fileName = file?.fileName || legacyFile?.fileName;
    const fileType = file?.fileType || legacyFile?.uploadType || legacyFile?.fileType;

    // Return file URL for download (redirect to Cloudinary)
    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      fileType,
      message: 'Download authorized',
    });
  } catch (error) {
    console.error('Failed to process download request:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    );
  }
}
