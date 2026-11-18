import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobAttachments, jobs, users, orderFiles } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { ensureOrderFilesSchema } from '@/lib/order-files-schema';

const MAX_FILE_SIZE = 41943040; // 40MB in bytes
const BLOCKED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/webm'
];
const VALID_UPLOAD_TYPES = ['initial', 'draft', 'final', 'revision', 'additional'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: All authenticated users can upload attachments (without approval requirement)
    const { requireRoleWithoutApproval } = await import('@/lib/admin-auth');
    const authCheck = await requireRoleWithoutApproval(request, ['client', 'freelancer', 'manager', 'admin', 'account_owner', 'editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;

    const { id: jobId } = await params;

    // Validate jobId parameter
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    const parsedJobId = parseInt(jobId);

    const [job] = await db
      .select({
        id: jobs.id,
        clientId: jobs.clientId,
        assignedFreelancerId: jobs.assignedFreelancerId,
        managerId: jobs.managerId,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
      })
      .from(jobs)
      .where(eq(jobs.id, parsedJobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { uploadedBy, fileName, fileUrl, fileSize, fileType, uploadType } = body;

    // Validate required fields
    if (!uploadedBy) {
      return NextResponse.json(
        { error: 'uploadedBy is required', code: 'MISSING_UPLOADED_BY' },
        { status: 400 }
      );
    }

    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
      return NextResponse.json(
        { error: 'fileName is required and must be a non-empty string', code: 'INVALID_FILE_NAME' },
        { status: 400 }
      );
    }

    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
      return NextResponse.json(
        { error: 'fileUrl is required and must be a non-empty string', code: 'INVALID_FILE_URL' },
        { status: 400 }
      );
    }

    // Allow fileSize of 0 for external links
    if (typeof fileSize !== 'number' || fileSize < 0) {
      return NextResponse.json(
        { error: 'fileSize is required and must be a non-negative number', code: 'INVALID_FILE_SIZE' },
        { status: 400 }
      );
    }

    if (!fileType || typeof fileType !== 'string' || fileType.trim() === '') {
      return NextResponse.json(
        { error: 'fileType is required and must be a non-empty string', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    if (!uploadType || typeof uploadType !== 'string') {
      return NextResponse.json(
        { error: 'uploadType is required', code: 'MISSING_UPLOAD_TYPE' },
        { status: 400 }
      );
    }

    // Validate uploadedBy is a valid integer
    if (isNaN(parseInt(uploadedBy.toString()))) {
      return NextResponse.json(
        { error: 'uploadedBy must be a valid integer', code: 'INVALID_UPLOADED_BY' },
        { status: 400 }
      );
    }

    // 🔒 AUTHORIZATION: Verify uploader matches authenticated user (unless admin)
    if (authenticatedUser.role !== 'admin' && parseInt(uploadedBy.toString()) !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'Cannot upload files on behalf of other users', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate file size does not exceed 40MB (skip for external links)
    if (fileType !== 'external/link' && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size exceeds maximum allowed size of 40MB (${MAX_FILE_SIZE} bytes)`, 
          code: 'FILE_SIZE_EXCEEDED' 
        },
        { status: 400 }
      );
    }

    // Validate file type is not a blocked video type (skip for external links)
    if (fileType !== 'external/link' && BLOCKED_VIDEO_TYPES.includes(fileType.toLowerCase())) {
      return NextResponse.json(
        { 
          error: 'Video files are not allowed', 
          code: 'VIDEO_FILE_NOT_ALLOWED' 
        },
        { status: 400 }
      );
    }

    // Validate uploadType is one of the valid types
    if (!VALID_UPLOAD_TYPES.includes(uploadType)) {
      return NextResponse.json(
        { 
          error: `uploadType must be one of: ${VALID_UPLOAD_TYPES.join(', ')}`, 
          code: 'INVALID_UPLOAD_TYPE' 
        },
        { status: 400 }
      );
    }

    // Try to ensure order_files table exists
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Attachments] Schema check failed:', schemaError?.message);
    }

    // Get uploader role for tracking
    const [uploader] = await db.select({ role: users.role }).from(users).where(eq(users.id, parseInt(uploadedBy.toString()))).limit(1);
    const uploaderRole = uploader?.role || 'unknown';

    // Get version number for orderFiles
    const [latest] = await db
      .select({ versionNumber: orderFiles.versionNumber })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, parsedJobId))
      .orderBy(desc(orderFiles.versionNumber))
      .limit(1);
    const newVersion = (latest?.versionNumber || 0) + 1;

    // Map uploadType to fileType for orderFiles
    const fileTypeMap: Record<string, string> = {
      'initial': 'brief',
      'draft': 'draft',
      'final': 'final_document',
      'revision': 'revision',
      'additional': 'additional',
    };
    const mappedFileType = fileTypeMap[uploadType] || 'additional';

    const now = new Date().toISOString();

    // Use Drizzle ORM insert API for orderFiles
    const uploadedById = parseInt(uploadedBy.toString());
    const trimmedFileName = fileName.trim();
    const trimmedFileUrl = fileUrl.trim();
    const trimmedMimeType = fileType.trim();
    const fileNotes = `${uploadType} upload (legacy endpoint)`;
    
    try {
      await db
        .insert(orderFiles)
        .values({
          orderId: parsedJobId,
          uploadedBy: uploadedById,
          uploadedByRole: uploaderRole,
          fileUrl: trimmedFileUrl,
          fileName: trimmedFileName,
          fileSize: fileSize,
          mimeType: trimmedMimeType,
          fileType: mappedFileType,
          fileClassification: mappedFileType,
          notes: fileNotes,
          versionNumber: newVersion,
          createdAt: now,
        });
      console.log('[Attachments] Successfully saved to orderFiles table');
    } catch (orderFilesError) {
      console.error('[Attachments] Failed to save to orderFiles:', orderFilesError);
      // Continue - the legacy insert below will still work
    }

    // Insert to legacy jobAttachments (for backward compatibility)
    const newAttachment = await db
      .insert(jobAttachments)
      .values({
        jobId: parsedJobId,
        uploadedBy: parseInt(uploadedBy.toString()),
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        fileSize,
        fileType: fileType.trim(),
        uploadType,
        scheduledDeletionAt: null,
        deletedAt: null,
        createdAt: now
      })
      .returning();

    return NextResponse.json(newAttachment[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/jobs/[id]/attachments error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: All authenticated users can view attachments (without approval requirement)
    const { requireRoleWithoutApproval } = await import('@/lib/admin-auth');
    const authCheck = await requireRoleWithoutApproval(request, ['client', 'freelancer', 'manager', 'admin', 'account_owner', 'editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;

    const { id: jobId } = await params;
    const { searchParams } = new URL(request.url);

    // Validate jobId parameter
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    const parsedJobId = parseInt(jobId);

    // Parse pagination parameters
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: 'limit must be a positive number', code: 'INVALID_LIMIT' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'offset must be a non-negative number', code: 'INVALID_OFFSET' },
        { status: 400 }
      );
    }

    // Fetch job data for role-based visibility checks
    const [job] = await db
      .select({
        id: jobs.id,
        clientId: jobs.clientId,
        assignedFreelancerId: jobs.assignedFreelancerId,
        managerId: jobs.managerId,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
      })
      .from(jobs)
      .where(eq(jobs.id, parsedJobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Role-based visibility checks
    if (authenticatedUser.role === 'client') {
      if (job.clientId !== authenticatedUser.id) {
        return NextResponse.json(
          { error: 'Not authorized to view files for this order', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (authenticatedUser.role === 'freelancer') {
      if (job.assignedFreelancerId !== authenticatedUser.id) {
        return NextResponse.json(
          { error: 'Not authorized to view files for this order', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (authenticatedUser.role === 'editor') {
      const editorStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];
      const isCompletedGate = job.editorStatus === 'completed' && job.status === 'delivered';
      if (job.status !== 'editing' && !isCompletedGate) {
        return NextResponse.json(
          { error: 'Order is not available for editor review', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      if (!editorStatuses.includes(job.editorStatus ?? '') && !isCompletedGate) {
        return NextResponse.json(
          { error: 'Order is not in an editor-accessible state', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Parse optional filter parameters
    const uploadType = searchParams.get('uploadType');
    const uploadedBy = searchParams.get('uploadedBy');

    // Validate uploadType if provided
    if (uploadType && !VALID_UPLOAD_TYPES.includes(uploadType)) {
      return NextResponse.json(
        { 
          error: `uploadType must be one of: ${VALID_UPLOAD_TYPES.join(', ')}`, 
          code: 'INVALID_UPLOAD_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate uploadedBy if provided
    if (uploadedBy && isNaN(parseInt(uploadedBy))) {
      return NextResponse.json(
        { error: 'uploadedBy must be a valid integer', code: 'INVALID_UPLOADED_BY' },
        { status: 400 }
      );
    }

    // Build query with filters and user details - EXCLUDE DELETED FILES
    const conditions = [
      eq(jobAttachments.jobId, parsedJobId),
      isNull(jobAttachments.deletedAt) // Only show files that haven't been deleted
    ];

    if (uploadType) {
      conditions.push(eq(jobAttachments.uploadType, uploadType));
    }

    if (uploadedBy) {
      conditions.push(eq(jobAttachments.uploadedBy, parseInt(uploadedBy)));
    }

    // Query with uploader details
    const attachments = await db
      .select({
        id: jobAttachments.id,
        jobId: jobAttachments.jobId,
        uploadedBy: jobAttachments.uploadedBy,
        fileName: jobAttachments.fileName,
        fileUrl: jobAttachments.fileUrl,
        fileSize: jobAttachments.fileSize,
        fileType: jobAttachments.fileType,
        uploadType: jobAttachments.uploadType,
        scheduledDeletionAt: jobAttachments.scheduledDeletionAt,
        deletedAt: jobAttachments.deletedAt,
        createdAt: jobAttachments.createdAt,
        uploader: {
          id: users.id,
          name: users.name,
          role: users.role,
          email: users.email,
        },
      })
      .from(jobAttachments)
      .leftJoin(users, eq(jobAttachments.uploadedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(jobAttachments.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response to include uploaderRole and uploaderName
    let formattedAttachments = attachments.map(att => {
      const rawRole = att.uploader?.role || 'unknown';
      // Normalize legacy roles: map 'writer' -> 'freelancer' so UI separation works correctly
      const uploaderRole = rawRole === 'writer' ? 'freelancer' : rawRole;
      return {
        id: att.id,
        jobId: att.jobId,
        uploadedBy: att.uploadedBy,
        uploaderName: att.uploader?.name || 'Unknown User',
        uploaderRole,
        uploaderEmail: att.uploader?.email || '',
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        fileType: att.fileType,
        uploadType: att.uploadType,
        scheduledDeletionAt: att.scheduledDeletionAt,
        deletedAt: att.deletedAt,
        createdAt: att.createdAt,
      };
    });

    // 🔒 FILE VISIBILITY RULES: Clients should NOT see freelancer work files (drafts/revisions)
    // Only show: their own uploads (initial) + admin/manager uploads (final/revision)
    if (authenticatedUser.role === 'client') {
      formattedAttachments = formattedAttachments.filter(att => {
        const uploaderRole = att.uploaderRole.toLowerCase();
        
        // Allow client's own files (initial uploads)
        if (att.uploadedBy === authenticatedUser.id) return true;
        
        // Allow admin/manager files (final deliveries, approved revisions)
        if (uploaderRole === 'admin' || uploaderRole === 'manager') return true;
        
        // Block freelancer files - clients should not see work in progress
        if (uploaderRole === 'freelancer' || uploaderRole === 'writer') return false;
        
        // Default: allow
        return true;
      });
    }

    return NextResponse.json(formattedAttachments, { status: 200 });
  } catch (error) {
    console.error('GET /api/jobs/[id]/attachments error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}