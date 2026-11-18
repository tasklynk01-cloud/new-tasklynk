import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, orderFiles, users, payments, jobAttachments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateDocumentPreview, supportsTextExtraction } from '@/lib/document-parser';

/**
 * GET /api/v2/orders/[id]/preview
 * Returns document preview based on payment terms and payment status
 * 
 * Access Control:
 * - POA users: Full document access (100%)
 * - POD users (unpaid): Limited preview (40% of word count)
 * - POD users (paid): Full document access (100%)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate user
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const resolvedParams = params instanceof Promise ? await params : params;
    const orderId = parseInt(resolvedParams.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Fetch order details
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Preview only becomes available once the work is delivered/approved.
    // (We also allow later lifecycle statuses to avoid breaking after payment.)
    const allowedPreviewStatuses = new Set(['delivered', 'approved', 'paid', 'completed']);
    if (!allowedPreviewStatuses.has(String(order.status || '').toLowerCase())) {
      return NextResponse.json(
        {
          error: 'Preview is only available after delivery/approval',
          orderStatus: order.status,
        },
        { status: 403 }
      );
    }

    // Verify user has access to this order
    if (user.role === 'client' || user.role === 'account_owner') {
      if (order.clientId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized access to this order' }, { status: 403 });
      }
    }

    // Fetch client details to check payment terms
    const [client] = await db
      .select()
      .from(users)
      .where(eq(users.id, order.clientId))
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch delivered documents (supports multiple delivery types)
    const deliveryTypes = [
      'final_document',
      'completed_paper',
      'completed_smart_paper',
      'revision',
      'plagiarism_report',
      'ai_report',
      'abstract',
      'graphics_tables',
      'printable_sources',
    ];

    const orderFilesRows = await db
      .select({
        id: orderFiles.id,
        fileName: orderFiles.fileName,
        fileUrl: orderFiles.fileUrl,
        fileType: orderFiles.fileType,
        fileClassification: orderFiles.fileClassification,
        notes: orderFiles.notes,
        mimeType: orderFiles.mimeType,
        createdAt: orderFiles.createdAt,
      })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId));

    // Legacy fallback (job_attachments)
    const legacyTypes = [
      'completed_paper',
      'completed_smart_paper',
      'final_document',
      'revision_file',
      'plagiarism_report',
      'ai_report',
      'abstract',
      'graphics_tables',
      'printable_source',
      'printable_sources',
    ];

    const legacyRows = await db
      .select({
        id: jobAttachments.id,
        fileName: jobAttachments.fileName,
        fileUrl: jobAttachments.fileUrl,
        fileType: jobAttachments.fileType,
        uploadType: jobAttachments.uploadType,
        createdAt: jobAttachments.createdAt,
      })
      .from(jobAttachments)
      .where(
        and(
          eq(jobAttachments.jobId, orderId),
          inArray(jobAttachments.uploadType, legacyTypes)
        )
      );

    const isDeliveredOrderFile = (row: typeof orderFilesRows[number]) => {
      const type = String(row.fileType || '').toLowerCase();
      const classification = String(row.fileClassification || '').toLowerCase();
      const notes = String(row.notes || '');
      return (
        deliveryTypes.includes(type) ||
        classification === 'final_paper' ||
        notes.includes('[DELIVERY]')
      );
    };

    const finalFiles = [
      ...orderFilesRows.filter(isDeliveredOrderFile).map((row) => ({
        id: row.id,
        fileName: row.fileName,
        fileUrl: row.fileUrl,
        fileType: row.mimeType || row.fileType,
        createdAt: row.createdAt,
      })),
      ...legacyRows.map((row) => ({
        id: row.id,
        fileName: row.fileName,
        fileUrl: row.fileUrl,
        fileType: row.fileType || row.uploadType,
        createdAt: row.createdAt,
      })),
    ];

    if (finalFiles.length === 0) {
      return NextResponse.json({ error: 'No delivered documents available' }, { status: 404 });
    }

    // Check payment status for POD users
    const paymentTerms = client.paymentTerms || 'pod';
    let hasFullAccess = false;
    let accessReason = '';

    if (paymentTerms === 'poa') {
      // POA users get full access immediately
      hasFullAccess = true;
      accessReason = 'Pay on Approval (POA) enabled';
    } else if (paymentTerms === 'pod') {
      // POD users - check if payment confirmed
      const [payment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.jobId, orderId),
            eq(payments.status, 'completed')
          )
        )
        .limit(1);

      if (payment) {
        hasFullAccess = true;
        accessReason = 'Payment confirmed';
      } else {
        hasFullAccess = false;
        accessReason = 'Payment pending - limited preview only';
      }
    }

    // Admin and manager always get full access
    if (user.role === 'admin' || user.role === 'manager') {
      hasFullAccess = true;
      accessReason = 'Admin/Manager access';
    }

    // Process document preview
    console.log(`[Preview API] Processing ${finalFiles.length} final document(s) for order ${orderId}`);
    console.log(`[Preview API] User: ${user.email}, Role: ${user.role}, Payment Terms: ${paymentTerms}, Full Access: ${hasFullAccess}`);
    
    const documentsWithPreview = await Promise.all(
      finalFiles.map(async (file) => {
        try {
          console.log(`[Preview API] Processing file ${file.id}: ${file.fileName}`);
          
          // Check if file type supports text extraction
          // Get file extension from fileName or fileType
          const fileName = file.fileName || '';
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          const fileTypeStr = file.fileType || fileExtension || '';
          const canExtractText = supportsTextExtraction(fileTypeStr);

          console.log(`[Preview API] File type: ${fileTypeStr}, Can extract text: ${canExtractText}`);

          if (!canExtractText) {
            return {
              id: file.id,
              fileName: file.fileName,
              fileType: file.fileType,
              // Never leak underlying storage URL in preview responses.
              fileUrl: null,
              uploadedAt: file.createdAt,
              previewContent: `Text preview not available for ${fileExtension.toUpperCase()} files. ${hasFullAccess ? 'You can download the file to view its contents.' : 'Complete payment to download and view this file.'}`,
              previewPercentage: hasFullAccess ? 100 : 20,
              hasFullAccess,
              wordCount: 0,
              canExtractText: false,
            };
          }

          // Generate preview with appropriate percentage (word-count based)
          // POD clients without payment: 40% of the document by word count
          // Full access clients: 100%
          const previewPercentage = hasFullAccess ? 100 : 40;
          const skipStartPercentage = 0; // Requirement: 40% by word count, no skipping
          
          console.log(`[Preview API] Generating preview: ${previewPercentage}% visible, skipping ${skipStartPercentage}% from start`);
          
          const preview = await generateDocumentPreview(
            file.fileUrl,
            fileTypeStr,
            previewPercentage,
            skipStartPercentage
          );

          console.log(`[Preview API] Preview generated: ${preview.metadata.visibleWords}/${preview.metadata.totalWords} words visible`);

          return {
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            // Never leak underlying storage URL in preview responses.
            fileUrl: null,
            uploadedAt: file.createdAt,
            previewContent: hasFullAccess ? preview.fullText : preview.previewText,
            previewPercentage,
            hasFullAccess,
            wordCount: preview.metadata.totalWords,
            visibleWords: preview.metadata.visibleWords,
            canExtractText: true,
          };
        } catch (error) {
          console.error(`[Preview API] Failed to process file ${file.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileUrl: null,
            uploadedAt: file.createdAt,
            previewContent: `Unable to load preview: ${errorMessage}. ${hasFullAccess ? 'You can try downloading the file directly.' : 'Complete payment to download and view this file.'}`,
            previewPercentage: 0,
            hasFullAccess,
            wordCount: 0,
            error: errorMessage,
            canExtractText: false,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      displayId: order.displayId,
      orderStatus: order.status,
      paymentTerms,
      hasFullAccess,
      accessReason,
      canDownload: hasFullAccess,
      documents: documentsWithPreview,
    });
  } catch (error) {
    console.error('Failed to generate document preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate document preview' },
      { status: 500 }
    );
  }
}
