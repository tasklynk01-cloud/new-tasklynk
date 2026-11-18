import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles, users, jobAttachments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";
import { ensureOrderFilesSchema } from "@/lib/order-files-schema";
import { notifyFileUploaded } from "@/lib/notifications";

// Allowed final file types (matching FileUploadPopup classifications)
const FINAL_TYPES = new Set([
  // Primary paper types
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
  
  // Upload type categories
  "brief",
  "additional",
  "draft",
  "revision_file",
  "other",
]);

// POST /api/v2/orders/[id]/upload/final
// Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType, fileType }]} where fileType in FINAL_TYPES
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Only freelancers, managers, and admins can upload final files
    const authCheck = await requireRole(request, ['freelancer', 'manager', 'admin', 'editor']);
    if (authCheck.error) {
      console.error('[Final Upload] Auth failed:', authCheck.error);
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;
    console.log('[Final Upload] Authenticated user:', authenticatedUser.id, authenticatedUser.role);

    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Valid order id required", code: 'INVALID_ORDER_ID' }, { status: 400 });
    }

    // Try to ensure order_files table exists, but don't fail if it errors
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Final Upload] Schema check failed:', schemaError?.message);
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

    // Validate file types
    for (const f of files) {
      if (!FINAL_TYPES.has(f.fileType)) {
        return NextResponse.json({ 
          error: `Invalid fileType '${f.fileType}'. Allowed types: ${Array.from(FINAL_TYPES).join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        }, { status: 400 });
      }
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!job) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (["cancelled", "closed"].includes(job.status)) {
      return NextResponse.json({ error: `Order is ${job.status}, uploading disabled` }, { status: 409 });
    }

    // 🔒 AUTHORIZATION: Freelancers can only upload to orders assigned to them
    // (Managers/Admins/Editors may upload as part of internal workflows.)
    if (authenticatedUser.role === 'freelancer' && job.assignedFreelancerId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this order', code: 'FORBIDDEN' },
        { status: 403 }
      );
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
    
    console.log('[Final Upload] Inserting files:', files.length);
    
    // Use Drizzle ORM insert API (not raw SQL execute which doesn't work with libsql driver)
    const inserted = [];
    let orderFilesInsertFailed = false;
    
    for (const f of files) {
      const fileClassification = f.fileClassification ?? mapClassificationFromType(f.fileType) ?? 'other';
      const fileNotes = notes || null;
      let insertedRecord = null;
      
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
            fileType: f.fileType,
            fileClassification: fileClassification,
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          })
          .returning();
          
        if (record) {
          insertedRecord = record;
          inserted.push(record);
          console.log('[Final Upload] Inserted to orderFiles:', record.id);
        }
      } catch (orderFilesError: any) {
        console.warn('[Final Upload] orderFiles insert failed:', orderFilesError?.message);
        orderFilesInsertFailed = true;
      }
      
      // Also insert to legacy jobAttachments for backward compatibility
      // Map fileType to uploadType for legacy table
      // IMPORTANT: Preserve specific classification types for proper display
      const uploadTypeMap: Record<string, string> = {
        'brief': 'initial',
        'final_document': 'completed_paper',
        'completed_paper': 'completed_paper',
        'completed_smart_paper': 'completed_smart_paper',
        'draft': 'draft',
        'revision': 'revision_file',
        'revision_file': 'revision_file',
        'additional': 'additional',
        'plagiarism_report': 'plagiarism_report',
        'ai_report': 'ai_report',
        'abstract': 'abstract',
        'detailed_outline': 'detailed_outline',
        'graphics_tables': 'graphics_tables',
        'printable_sources': 'printable_source',
        'printable_source': 'printable_source',
        'other': 'other',
      };
      const uploadType = uploadTypeMap[f.fileType] || f.fileType || 'other';
      
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
        
        // If orderFiles failed but legacy succeeded, use legacy record
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
          console.log('[Final Upload] Fallback to jobAttachments:', legacyRecord.id);
        } else {
          console.log('[Final Upload] Also inserted to jobAttachments:', legacyRecord?.id);
        }
      } catch (legacyError: any) {
        console.warn('[Final Upload] jobAttachments insert failed:', legacyError?.message);
        // If both failed, that's a problem
        if (!insertedRecord) {
          console.error('[Final Upload] Both orderFiles and jobAttachments failed for file:', f.name);
        }
      }
    }
    
    // If no files were inserted at all, return error
    if (inserted.length === 0) {
      return NextResponse.json({ 
        error: "Failed to save files to database. Please try again.",
        code: 'DATABASE_INSERT_FAILED'
      }, { status: 500 });
    }

    console.log('[Final Upload] Successfully inserted:', inserted.length, 'files');

    // Check readiness across all files for this order
    const all = await db
      .select({ fileType: orderFiles.fileType })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId));

    const hasFinal = all.some((r) => r.fileType === "final_document" || r.fileType === "completed_paper");
    const hasPlag = all.some((r) => r.fileType === "plagiarism_report");
    const hasAI = all.some((r) => r.fileType === "ai_report");

    const requiresReports = !!job.requiresReports;
    const finalReady = requiresReports ? (hasFinal && hasPlag && hasAI) : hasFinal;

    // IMPORTANT:
    // Uploading final files should NOT transition the order status by itself.
    // The explicit submit action (/api/v2/orders/:id/freelancer/submit) is responsible
    // for moving an order into review (editing) so the UI cannot show a false "submitted"
    // state when the submit call fails.
    if (finalReady) {
      await db
        .update(jobs)
        .set({ finalSubmissionComplete: true })
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
            'final'
          ).catch(err => console.error('[Final Upload] Notification failed:', err));
        }
      }
      
      console.log('[Final Upload] Notifications sent to', notificationTargets.length, 'users');
    } catch (notifError) {
      console.error('[Final Upload] Failed to send notifications:', notifError);
      // Don't fail the upload if notifications fail
    }

    return NextResponse.json({ success: true, version: newVersion, files: inserted, finalReady });
  } catch (error: any) {
    console.error("Final upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload final files" }, { status: 500 });
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
    default:
      return null;
  }
}
