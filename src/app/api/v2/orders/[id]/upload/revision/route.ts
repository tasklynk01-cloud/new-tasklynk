import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles, users, jobAttachments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";
import { ensureOrderFilesSchema } from "@/lib/order-files-schema";
import { notifyFileUploaded } from "@/lib/notifications";

// Allowed revision file types (matching FileUploadPopup classifications)
const REVISION_TYPES = new Set([
  // Revision-specific types
  "revision",
  "revision_file",
  
  // Primary paper types (can be uploaded as part of revision)
  "final_document",
  "completed_paper",
  "completed_smart_paper",
  
  // Report types
  "plagiarism_report",
  "ai_report",
  
  // Supporting document types
  "abstract",
  "detailed_outline",
  "graphics_tables",
  "printable_source",    // Frontend uses singular
  "printable_sources",   // Keep for backward compatibility
  
  // Other types
  "draft",
  "other",
]);

// POST /api/v2/orders/[id]/upload/revision
// Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType, fileType }]} where fileType in REVISION_TYPES
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Only freelancers, managers, and admins can upload revisions
    const authCheck = await requireRole(request, ['freelancer', 'manager', 'admin', 'editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;

    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Valid order id required", code: 'INVALID_ORDER_ID' }, { status: 400 });
    }

    // Try to ensure order_files table exists, but don't fail if it errors
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Revision Upload] Schema check failed:', schemaError?.message);
      // Continue anyway - we'll catch the table error later with better messaging
    }

    const body = await request.json();
    const { uploaderId, notes, files } = body as {
      uploaderId: number;
      notes?: string;
      files: { url: string; name: string; size: number; mimeType: string; fileType: string; fileClassification?: string | null }[];
    };

    if (!uploaderId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "uploaderId and files are required", code: 'MISSING_FIELDS' }, { status: 400 });
    }

    // 🔒 AUTHORIZATION: Verify uploader matches authenticated user (unless admin)
    if (authenticatedUser.role !== 'admin' && uploaderId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: "Cannot upload files on behalf of other users", code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    for (const f of files) {
      if (!REVISION_TYPES.has(f.fileType)) {
        return NextResponse.json({ 
          error: `Invalid fileType '${f.fileType}'. Allowed types: ${Array.from(REVISION_TYPES).join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        }, { status: 400 });
      }
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!job) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (["cancelled", "closed"].includes(job.status)) {
      return NextResponse.json({ error: `Order is ${job.status}, uploading disabled` }, { status: 409 });
    }

    // 🔒 OWNERSHIP CHECK: freelancer/editor may only upload revisions to orders
    // they're actually assigned to.
    if (authenticatedUser.role === 'freelancer' && job.assignedFreelancerId !== authenticatedUser.id) {
      return NextResponse.json({ error: "You are not assigned to this order", code: 'FORBIDDEN' }, { status: 403 });
    }
    if (authenticatedUser.role === 'editor' && job.assignedEditorId !== authenticatedUser.id) {
      return NextResponse.json({ error: "You are not assigned to this order", code: 'FORBIDDEN' }, { status: 403 });
    }

    // Compute new version number (max + 1)
    const [latest] = await db
      .select({ versionNumber: orderFiles.versionNumber })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId))
      .orderBy(desc(orderFiles.versionNumber))
      .limit(1);
    const newVersion = (latest?.versionNumber || 0) + 1;

    // Get uploader role for tracking
    const [uploader] = await db.select({ role: users.role }).from(users).where(eq(users.id, uploaderId)).limit(1);
    const uploaderRole = uploader?.role || 'unknown';

    const now = new Date().toISOString();
    
    console.log('[Revision Upload] Inserting files:', files.length);
    
    // Use Drizzle ORM insert API with returning()
    const inserted = [];
    let orderFilesInsertFailed = false;
    
    for (const f of files) {
      if (!f.fileType) {
        console.warn('[Revision Upload] Skipping file with missing type:', f.name);
        continue;
      }

      const fileType = f.fileType;
      const fileClassification =
        f.fileClassification ?? mapClassificationFromType(fileType) ?? 'other';
      const fileNotes = notes || null;
      let insertedRecord = null;

      if (!f.url) {
        console.warn('[Revision Upload] Skipping file with missing URL:', f.name);
        continue;
      }
      
      // Try orderFiles table first
      try {
        const [record] = await db
          .insert(orderFiles)
          .values({
            orderId: orderId,
            uploadedBy: Number(uploaderId),
            uploadedByRole: uploaderRole,
            fileUrl: f.url,
            fileName: f.name,
            fileSize: Number(f.size || 0),
            mimeType: f.mimeType || "application/octet-stream",
            fileType,
            fileClassification: fileClassification,
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          })
          .returning();
          
        if (record) {
          insertedRecord = record;
          inserted.push(record);
          console.log('[Revision Upload] Inserted to orderFiles:', record.id, record.fileName);
        }
      } catch (orderFilesError: any) {
        console.warn('[Revision Upload] orderFiles insert failed:', orderFilesError?.message);
        orderFilesInsertFailed = true;
      }
      
      // Also insert to legacy jobAttachments for backward compatibility
      // IMPORTANT: Preserve specific classification types for proper display
      const uploadTypeMap: Record<string, string> = {
        'revision': 'revision_file',
        'revision_file': 'revision_file',
        'final_document': 'completed_paper',
        'completed_paper': 'completed_paper',
        'plagiarism_report': 'plagiarism_report',
        'ai_report': 'ai_report',
        'abstract': 'abstract',
        'detailed_outline': 'detailed_outline',
        'graphics_tables': 'graphics_tables',
        'printable_sources': 'printable_source',
        'other': 'other',
      };
      const uploadType = uploadTypeMap[f.fileType] || f.fileType || 'revision_file';
      
      try {
        const [legacyRecord] = await db
          .insert(jobAttachments)
          .values({
            jobId: orderId,
            uploadedBy: Number(uploaderId),
            fileName: f.name,
            fileUrl: f.url,
            fileSize: Number(f.size || 0),
            fileType: f.mimeType || "application/octet-stream",
            uploadType: uploadType,
            scheduledDeletionAt: null,
            deletedAt: null,
            createdAt: now,
          })
          .returning();
        
        if (!insertedRecord && legacyRecord) {
          inserted.push({
            id: legacyRecord.id,
            orderId: orderId,
            uploadedBy: Number(uploaderId),
            uploadedByRole: uploaderRole,
            fileUrl: f.url,
            fileName: f.name,
            fileSize: Number(f.size || 0),
            mimeType: f.mimeType || "application/octet-stream",
            fileType: f.fileType,
            fileClassification: fileClassification,
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          });
          console.log('[Revision Upload] Fallback to jobAttachments:', legacyRecord.id);
        } else {
          console.log('[Revision Upload] Also inserted to jobAttachments:', legacyRecord?.id);
        }
      } catch (legacyError: any) {
        console.warn('[Revision Upload] jobAttachments insert failed:', legacyError?.message);
        if (!insertedRecord) {
          console.error('[Revision Upload] Both tables failed for file:', f.name);
        }
      }
    }
    
    if (inserted.length === 0) {
      return NextResponse.json({ 
        error: "Failed to save files to database. Please try again.",
        code: 'DATABASE_INSERT_FAILED'
      }, { status: 500 });
    }
    
    console.log('[Revision Upload] Successfully inserted:', inserted.length, 'files');

    // Readiness check across order
    const all = await db
      .select({ fileType: orderFiles.fileType })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId));

    const hasFinal = all.some((r) => r.fileType === "final_document" || r.fileType === "completed_paper");
    const hasPlag = all.some((r) => r.fileType === "plagiarism_report");
    const hasAI = all.some((r) => r.fileType === "ai_report");

    const requiresReports = !!job.requiresReports;
    const revisionReady = requiresReports ? (hasFinal && hasPlag && hasAI) : hasFinal;

    if (revisionReady) {
      const next = ["accepted", "in_progress", "revision", "editing"].includes(job.status)
        ? "editing"
        : job.status;
      await db
        .update(jobs)
        .set({ revisionSubmissionComplete: true, status: next })
        .where(eq(jobs.id, orderId));
    }

    // 🔔 Send notifications to relevant users
    try {
      const [uploaderData] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, uploaderId))
        .limit(1);
      
      const uploaderName = uploaderData?.name || uploaderData?.email || 'Someone';
      const orderNumber = job.displayId || job.orderId || `#${orderId}`;
      
      // Notify admin/managers (role 1 = admin, role 3 = manager)
      const adminsAndManagers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.roleId, 1)); // Get all admins
      
      const managers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.roleId, 3)); // Get all managers
      
      const notificationTargets = [...adminsAndManagers, ...managers];
      
      // Also notify the client if one is assigned
      if (job.clientId) {
        notificationTargets.push({ id: job.clientId });
      }
      
      // Send notifications
      for (const target of notificationTargets) {
        if (target.id !== uploaderId) { // Don't notify the uploader
          await notifyFileUploaded(
            target.id,
            orderId,
            orderNumber,
            uploaderName,
            files.length,
            'revision'
          ).catch(err => console.error('[Revision Upload] Notification failed:', err));
        }
      }
      
      console.log('[Revision Upload] Notifications sent to', notificationTargets.length, 'users');
    } catch (notifError) {
      console.error('[Revision Upload] Failed to send notifications:', notifError);
      // Don't fail the upload if notifications fail
    }

    return NextResponse.json({ success: true, version: newVersion, files: inserted, revisionReady });
  } catch (error: any) {
    console.error("Revision upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload revision files" }, { status: 500 });
  }
}

function mapClassificationFromType(fileType: string): string | null {
  switch (fileType) {
    case 'final_document':
    case 'completed_paper':
      return 'final_paper';
    case 'plagiarism_report':
      return 'plag_report';
    case 'ai_report':
      return 'ai_report';
    case 'printable_sources':
      return 'printable_sources';
    case 'graphics_tables':
      return 'tables';
    case 'abstract':
      return 'abstract';
    case 'revision':
      return 'revision';
    default:
      return null;
  }
}
