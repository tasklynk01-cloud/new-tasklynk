import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, orderFiles, users, jobAttachments, payments } from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { requireRoleWithoutApproval } from '@/lib/admin-auth';

// GET /api/v2/orders/[id]/files - Role-aware files listing (uses order_files)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Validate authentication without approval requirement
    const authCheck = await requireRoleWithoutApproval(request, ['client', 'freelancer', 'manager', 'admin', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const orderId = parseInt(id);
    if (!orderId) {
      return NextResponse.json({ error: 'Valid order id required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') || '').toLowerCase();
    const userIdStr = searchParams.get('userId');
    const includeDrafts = (searchParams.get('includeDrafts') || 'false') === 'true';
    const deliveredOnly = (searchParams.get('deliveredOnly') || 'false') === 'true';

    const userId = userIdStr ? parseInt(userIdStr) : undefined;

    // Load order for status/ownership checks
    let order;
    try {
      const [orderResult] = await db.select().from(jobs).where(eq(jobs.id, orderId));
      order = orderResult;
    } catch (dbError) {
      console.error('[Files API] Error loading order:', dbError);
      return NextResponse.json({ 
        error: 'Failed to load order',
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
      }, { status: 500 });
    }
    
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Client/account_owner restrictions: user must be the owner OR belong to same account/domain as the owner.
    // Do not trust the role query param for access control.
    if (authCheck.user?.role === 'client' || authCheck.user?.role === 'account_owner') {
      const effectiveUserId = userId ?? authCheck.user?.id;
      if (!effectiveUserId) {
        return NextResponse.json({ error: 'Not authorized to view files for this order' }, { status: 403 });
      }

      let hasOrderAccess = order.clientId === effectiveUserId;

      if (!hasOrderAccess) {
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, effectiveUserId))
          .limit(1);

        const [orderClient] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.clientId))
          .limit(1);

        if (currentUser && orderClient) {
          if (currentUser.accountId && currentUser.accountId === orderClient.accountId) {
            hasOrderAccess = true;
          } else if (currentUser.domainId && currentUser.domainId === orderClient.domainId) {
            hasOrderAccess = true;
          }
        }
      }

      if (!hasOrderAccess) {
        return NextResponse.json({ error: 'Not authorized to view files for this order' }, { status: 403 });
      }
    }

    // Query order_files joined with uploader (primary)
    let rows: any[] = [];
    try {
      rows = await db
        .select({
          id: orderFiles.id,
          orderId: orderFiles.orderId,
          uploadedBy: orderFiles.uploadedBy,
          fileUrl: orderFiles.fileUrl,
          fileName: orderFiles.fileName,
          fileSize: orderFiles.fileSize,
          mimeType: orderFiles.mimeType,
          fileType: orderFiles.fileType,
          fileClassification: orderFiles.fileClassification,
          notes: orderFiles.notes,
          versionNumber: orderFiles.versionNumber,
          createdAt: orderFiles.createdAt,
          uploaderId: users.id,
          uploaderName: users.name,
          uploaderRole: users.role,
        })
        .from(orderFiles)
        .leftJoin(users, eq(orderFiles.uploadedBy, users.id))
        .where(eq(orderFiles.orderId, orderId))
        .orderBy(desc(orderFiles.createdAt));
      
      console.log('[Files API] Found files for order', orderId, ':', rows.length, 'files');
      if (rows.length > 0) {
        console.log('[Files API] File types:', rows.map(r => ({ id: r.id, fileType: r.fileType, classification: r.fileClassification, uploadedBy: r.uploadedBy })));
      }
    } catch (queryError: any) {
      console.error('[Files API] Error querying files:', queryError);
      console.error('[Files API] Query error details:', {
        message: queryError.message,
        code: queryError.code,
        orderId,
        orderStatus: order?.status
      });
      // Continue to legacy fallback below
    }

    // Legacy fallback: if order_files is missing OR empty (older data), load from job_attachments.
    let legacyRows: any[] = [];
    if (rows.length === 0) {
      try {
        legacyRows = await db
          .select({
            id: jobAttachments.id,
            orderId: jobAttachments.jobId,
            uploadedBy: jobAttachments.uploadedBy,
            fileUrl: jobAttachments.fileUrl,
            fileName: jobAttachments.fileName,
            fileSize: jobAttachments.fileSize,
            mimeType: jobAttachments.fileType,
            uploadType: jobAttachments.uploadType,
            createdAt: jobAttachments.createdAt,
            uploaderName: users.name,
            uploaderRole: users.role,
          })
          .from(jobAttachments)
          .leftJoin(users, eq(jobAttachments.uploadedBy, users.id))
          .where(eq(jobAttachments.jobId, orderId))
          .orderBy(desc(jobAttachments.createdAt));

        if (legacyRows.length > 0) {
          console.log('[Files API] Loaded legacy job_attachments for order', orderId, ':', legacyRows.length, 'files');
        }
      } catch (legacyError: any) {
        console.warn('[Files API] Legacy job_attachments query failed:', legacyError?.message);
      }
    }

    const allowedStatusesForDeliveredFiles = ['delivered', 'approved', 'paid', 'completed'];
    const orderIsDelivered = allowedStatusesForDeliveredFiles.includes(order.status);

    // Payment-term based restrictions (POD unpaid clients should NOT receive deliverable URLs)
    let paymentTerms: 'pod' | 'poa' = 'pod';
    let hasCompletedPayment = false;
    const requesterRole = String(authCheck.user?.role || '').toLowerCase();

    if (requesterRole === 'client' || requesterRole === 'account_owner') {
      try {
        const [clientRow] = await db
          .select({ paymentTerms: users.paymentTerms })
          .from(users)
          .where(eq(users.id, order.clientId))
          .limit(1);

        paymentTerms = (clientRow?.paymentTerms === 'poa' ? 'poa' : 'pod');

        const [payment] = await db
          .select({ id: payments.id })
          .from(payments)
          .where(and(eq(payments.jobId, orderId), eq(payments.status, 'completed')))
          .limit(1);

        hasCompletedPayment = !!payment;
      } catch (e) {
        console.warn('[Files API] Failed to load payment terms/payment status:', e);
      }
    }

    const isPodUnpaidClient = (requesterRole === 'client' || requesterRole === 'account_owner')
      && paymentTerms === 'pod'
      && !hasCompletedPayment;

    const deliverableUploadTypes = new Set([
      'final_document',
      'completed_paper',
      'completed_smart_paper',
      'revision',
      'plagiarism_report',
      'ai_report',
    ]);

    const rawRole = role || authCheck.user?.role || '';
    const effectiveRole = String(rawRole).toLowerCase();

    const normalizeUploaderRole = (value: unknown): string => {
      const roleStr = String(value ?? '').toLowerCase();
      if (roleStr === 'writer') return 'freelancer';
      return roleStr;
    };

    const normalized = [
      ...rows.map((r) => ({
        source: 'order_files' as const,
        id: r.id,
        orderId: r.orderId,
        uploadedBy: r.uploadedBy,
        fileUrl: r.fileUrl,
        fileName: r.fileName,
        fileSize: r.fileSize,
        mimeType: r.mimeType,
        uploadType: r.fileType,
        fileClassification: r.fileClassification,
        notes: r.notes || null,
        versionNumber: r.versionNumber ?? null,
        createdAt: r.createdAt,
        uploaderName: r.uploaderName,
        uploaderRole: normalizeUploaderRole(r.uploaderRole),
      })),
      ...legacyRows.map((r) => {
        const uploaderRole = normalizeUploaderRole(r.uploaderRole);
        // Heuristic: treat legacy "final-ish" admin/manager uploads as delivery markers.
        const finalish = ['final_document', 'completed_paper', 'completed_smart_paper', 'plagiarism_report', 'ai_report', 'revision'];
        const isDeliveryMarker = orderIsDelivered && (uploaderRole === 'admin' || uploaderRole === 'manager') && finalish.includes(String(r.uploadType || '').toLowerCase());
        return {
          source: 'job_attachments' as const,
          id: r.id,
          orderId: r.orderId,
          uploadedBy: r.uploadedBy,
          fileUrl: r.fileUrl,
          fileName: r.fileName,
          fileSize: r.fileSize,
          mimeType: r.mimeType,
          uploadType: r.uploadType,
          fileClassification: null,
          notes: isDeliveryMarker ? '[DELIVERY] Legacy delivered file' : null,
          versionNumber: null,
          createdAt: r.createdAt,
          uploaderName: r.uploaderName,
          uploaderRole,
        };
      }),
    ];

    // Role filtering logic
    const filtered = normalized.filter((r) => {
      const uploaderRole = normalizeUploaderRole(r.uploaderRole);
      const uploadType = String(r.uploadType || '').toLowerCase();
      const isDraft = uploadType === 'draft';
      const isDeliveryFile = String(r.notes || '').includes('[DELIVERY]');
      const isFreelancerFile = uploaderRole === 'freelancer';
      const isClientFile = uploaderRole === 'client' || uploaderRole === 'account_owner';
      const isAdminFile = uploaderRole === 'admin' || uploaderRole === 'manager';

      if (effectiveRole === 'client') {
        if (isDraft) return false;
        if (deliveredOnly && !orderIsDelivered) return false;
        if (isClientFile) return true;
        if (isAdminFile && !isDeliveryFile) return true;
        if (isFreelancerFile || isDeliveryFile) return orderIsDelivered;
        return orderIsDelivered;
      }

      if (effectiveRole === 'freelancer') {
        if (!includeDrafts && isDraft) return false;
        return true;
      }

      if (effectiveRole === 'manager' || effectiveRole === 'admin' || effectiveRole === 'account_owner') {
        if (!includeDrafts && isDraft) return false;
        return true;
      }

      if (!includeDrafts && isDraft) return false;
      return true;
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderStatus: order.status,
      files: filtered.map((f) => {
        const isDeliveryFile = String(f.notes || '').includes('[DELIVERY]');
        // For client view: delivery files uploaded by admin/manager should show as "from freelancer"
        const displayRole = effectiveRole === 'client' && isDeliveryFile && (f.uploaderRole === 'admin' || f.uploaderRole === 'manager')
          ? 'freelancer'
          : f.uploaderRole;

        return {
          id: f.id,
          orderId: f.orderId,
          fileName: f.fileName,
          fileUrl: (isPodUnpaidClient && orderIsDelivered && deliverableUploadTypes.has(String(f.uploadType || '').toLowerCase()))
            ? null
            : f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.mimeType || 'application/octet-stream',
          uploadType: f.uploadType || 'additional',
          category: f.fileClassification || null,
          uploadedAt: f.createdAt,
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName,
          uploaderRole: displayRole,
          version: f.versionNumber,
          notes: f.notes || null,
          source: f.source,
        };
      }),
    });
  } catch (error: any) {
    console.error('[Files API] Error fetching order files:', error);
    console.error('[Files API] Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch order files',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}