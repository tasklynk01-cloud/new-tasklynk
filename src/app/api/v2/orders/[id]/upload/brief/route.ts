import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderFiles, users, jobAttachments, jobs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRoleWithoutApproval } from '@/lib/admin-auth';
import { ensureOrderFilesSchema } from '@/lib/order-files-schema';

/**
 * Brief Upload Endpoint
 * Dedicated endpoint for uploading order brief files
 * ✅ UPDATED: Now saves to orderFiles table (not deprecated jobAttachments)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Allow clients and account_owners to upload briefs (even if not approved yet)
    const authCheck = await requireRoleWithoutApproval(request, ['client', 'account_owner', 'admin', 'manager']);
    if (authCheck.error) {
      console.error('[Brief Upload] Auth failed:', authCheck.error);
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;
    console.log('[Brief Upload] Authenticated user:', authenticatedUser.id, authenticatedUser.role);

    const { id } = await params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    // Try to ensure order_files table exists
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Brief Upload] Schema check failed:', schemaError?.message);
    }

    // 🔒 OWNERSHIP CHECK: verify the order exists and, for clients, that they
    // actually own it - without this, any client could upload a "brief" file
    // into any other client's order.
    const [job] = await db.select({ clientId: jobs.clientId }).from(jobs).where(eq(jobs.id, orderId)).limit(1);
    if (!job) {
      return NextResponse.json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }, { status: 404 });
    }
    if (
      (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') &&
      job.clientId !== authenticatedUser.id
    ) {
      return NextResponse.json({ error: 'You do not have access to this order', code: 'FORBIDDEN' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // Validate file size (max 40MB)
    const maxSize = 40 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 40MB limit', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary - forward cookies for auth
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('folder', 'order-briefs');
    uploadFormData.append('jobId', orderId.toString());

    const uploadResponse = await fetch(`${request.nextUrl.origin}/api/cloudinary/upload`, {
      method: 'POST',
      body: uploadFormData,
      headers: {
        // Forward the auth cookie for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('[Brief Upload] Cloudinary upload failed:', errorData);
      throw new Error(errorData.error || 'Failed to upload file to Cloudinary');
    }

    const uploadData = await uploadResponse.json();

    // Get uploader role for tracking
    const [uploader] = await db.select({ role: users.role }).from(users).where(eq(users.id, authenticatedUser.id)).limit(1);
    const uploaderRole = uploader?.role || authenticatedUser.role || 'client';

    // Get version number
    const [latest] = await db
      .select({ versionNumber: orderFiles.versionNumber })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId))
      .orderBy(desc(orderFiles.versionNumber))
      .limit(1);
    const newVersion = (latest?.versionNumber || 0) + 1;

    const now = new Date().toISOString();

    // Try orderFiles first, with jobAttachments as fallback
    let attachment = null;
    let orderFilesInsertFailed = false;
    
    // Try orderFiles table first
    try {
      const [record] = await db
        .insert(orderFiles)
        .values({
          orderId: orderId,
          uploadedBy: authenticatedUser.id,
          uploadedByRole: uploaderRole,
          fileName: file.name,
          fileUrl: uploadData.url,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileType: 'brief',
          fileClassification: 'brief',
          notes: 'Client brief/instructions',
          versionNumber: newVersion,
          createdAt: now,
        })
        .returning();

      if (record) {
        attachment = record;
        console.log('[Brief Upload] Successfully saved to orderFiles:', record.id);
      }
    } catch (orderFilesError: any) {
      console.warn('[Brief Upload] orderFiles insert failed:', orderFilesError?.message);
      orderFilesInsertFailed = true;
    }
    
    // Also insert to legacy jobAttachments for backward compatibility
    try {
      const [legacyRecord] = await db
        .insert(jobAttachments)
        .values({
          jobId: orderId,
          uploadedBy: authenticatedUser.id,
          fileName: file.name,
          fileUrl: uploadData.url,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          uploadType: 'initial',
          scheduledDeletionAt: null,
          deletedAt: null,
          createdAt: now,
        })
        .returning();
      
      if (!attachment && legacyRecord) {
        attachment = {
          id: legacyRecord.id,
          orderId: orderId,
          uploadedBy: authenticatedUser.id,
          uploadedByRole: uploaderRole,
          fileName: file.name,
          fileUrl: uploadData.url,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileType: 'brief',
          fileClassification: 'brief',
          notes: 'Client brief/instructions',
          versionNumber: newVersion,
          createdAt: now,
        };
        console.log('[Brief Upload] Fallback to jobAttachments:', legacyRecord.id);
      } else {
        console.log('[Brief Upload] Also inserted to jobAttachments:', legacyRecord?.id);
      }
    } catch (legacyError: any) {
      console.warn('[Brief Upload] jobAttachments insert failed:', legacyError?.message);
      if (!attachment) {
        console.error('[Brief Upload] Both tables failed for file:', file.name);
      }
    }
    
    if (!attachment) {
      return NextResponse.json(
        { error: 'Failed to save file to database. Please try again.', code: 'DATABASE_INSERT_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attachment,
      message: 'Brief uploaded successfully',
    });
  } catch (error: any) {
    console.error('Brief upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload brief', code: 'UPLOAD_FAILED' },
      { status: 500 }
    );
  }
}

/**
 * Get brief files for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: this endpoint previously had none at all - anyone on
    // the internet could list an order's brief file URLs without logging in.
    const authCheck = await requireRoleWithoutApproval(request, ['client', 'account_owner', 'admin', 'manager', 'freelancer', 'editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error, code: 'UNAUTHORIZED' }, { status: authCheck.status });
    }
    const authenticatedUser = authCheck.user!;

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // 🔒 OWNERSHIP CHECK
    const [job] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
    if (!job) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (
      (authenticatedUser.role === 'client' || authenticatedUser.role === 'account_owner') &&
      job.clientId !== authenticatedUser.id
    ) {
      return NextResponse.json({ error: 'You do not have access to this order' }, { status: 403 });
    }
    if (authenticatedUser.role === 'freelancer' && job.assignedFreelancerId !== authenticatedUser.id) {
      return NextResponse.json({ error: 'You do not have access to this order' }, { status: 403 });
    }
    if (authenticatedUser.role === 'editor' && job.assignedEditorId !== authenticatedUser.id) {
      return NextResponse.json({ error: 'You do not have access to this order' }, { status: 403 });
    }

    // ✅ Fetch brief files from orderFiles table
    const briefs = await db
      .select()
      .from(orderFiles)
      .where(
        and(
          eq(orderFiles.orderId, orderId),
          eq(orderFiles.fileType, 'brief')
        )
      )
      .orderBy(orderFiles.createdAt);

    return NextResponse.json({
      success: true,
      briefs,
    });
  } catch (error) {
    console.error('Failed to fetch briefs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch briefs' },
      { status: 500 }
    );
  }
}
