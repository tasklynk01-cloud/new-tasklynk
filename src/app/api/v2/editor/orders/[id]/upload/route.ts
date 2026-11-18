import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, editorFiles, notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/v2/editor/orders/[id]/upload
 * Upload edited files by editor with version tracking
 * Editors can upload: edited_draft, edited_final, ai_report, plagiarism_report, editing_notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);
    const editorId = authCheck.user.id;

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { fileName, fileUrl, fileSize, fileType, notes } = body;

    // Validate required fields
    if (!fileName || !fileUrl || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileUrl, fileSize, fileType' },
        { status: 400 }
      );
    }

    // Validate file type
    const validFileTypes = ['edited_draft', 'edited_final', 'ai_report', 'plagiarism_report', 'editing_notes'];
    if (!validFileTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type. Must be one of: ${validFileTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify job exists and is assigned to this editor OR editor has access
    const job = await db
      .select({
        id: jobs.id,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check editor access: either assigned editor or any editor can access orders in editing status
    const editorStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];
    if (!editorStatuses.includes(job[0].editorStatus || '')) {
      return NextResponse.json(
        { error: 'This order is not in editing status' },
        { status: 403 }
      );
    }

    // Get current version number for this file type
    const existingFiles = await db
      .select({ version: editorFiles.version })
      .from(editorFiles)
      .where(and(
        eq(editorFiles.jobId, jobId),
        eq(editorFiles.fileType, fileType),
        eq(editorFiles.editorId, editorId)
      ))
      .orderBy(desc(editorFiles.version))
      .limit(1);

    const nextVersion = existingFiles[0] ? existingFiles[0].version + 1 : 1;

    // Mark previous files of this type as not latest
    await db
      .update(editorFiles)
      .set({ isLatest: false })
      .where(and(
        eq(editorFiles.jobId, jobId),
        eq(editorFiles.fileType, fileType),
        eq(editorFiles.editorId, editorId)
      ));

    const now = new Date().toISOString();

    // Insert new file
    const newFile = await db
      .insert(editorFiles)
      .values({
        jobId,
        editorId,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        version: nextVersion,
        notes: notes || null,
        isLatest: true,
        uploadedAt: now,
        createdAt: now,
      })
      .returning();

    // Update job editor status if this is the first file upload
    if (job[0].editorStatus === 'pending_editing') {
      await db
        .update(jobs)
        .set({
          editorStatus: 'editing_in_progress',
          editorStartedAt: now,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));
    }

    // Create notification for admin/manager
    await db.insert(notifications).values({
      userId: 1, // Admin notification (you can make this dynamic)
      jobId,
      type: 'editor_file_upload',
      title: 'Editor Uploaded File',
      message: `Editor uploaded ${fileType.replace(/_/g, ' ')} for order #${jobId}`,
      read: false,
      relatedId: newFile[0]?.id,
      relatedType: 'editor_file',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      file: newFile[0],
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading editor file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/editor/orders/[id]/upload
 * Get all editor files for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get all files for this order, grouped by type
    const files = await db
      .select()
      .from(editorFiles)
      .where(eq(editorFiles.jobId, jobId))
      .orderBy(desc(editorFiles.version), desc(editorFiles.createdAt));

    // Group files by type
    const filesByType = files.reduce((acc: Record<string, any[]>, file) => {
      if (!acc[file.fileType]) {
        acc[file.fileType] = [];
      }
      acc[file.fileType].push(file);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      files,
      filesByType,
      latestFiles: files.filter(f => f.isLatest),
    });
  } catch (error) {
    console.error('Error fetching editor files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
