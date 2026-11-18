import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles, users, jobAttachments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";
import { ensureOrderFilesSchema } from "@/lib/order-files-schema";

const ADDITIONAL_TYPES = new Set([
  "additional",
  "abstract",
  "printable_sources",
  "graphics_tables",
  "references",
  "appendix",
  // extended
  "outline",
]);

// POST /api/v2/orders/[id]/upload/additional
// Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType, fileType }]} where fileType in ADDITIONAL_TYPES
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: All authenticated users can upload additional files
    const authCheck = await requireRole(request, ['client', 'freelancer', 'manager', 'admin', 'editor']);
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
      console.error('[Additional Upload] Schema check failed:', schemaError?.message);
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
      if (!ADDITIONAL_TYPES.has(f.fileType)) {
        return NextResponse.json({ 
          error: `Invalid fileType '${f.fileType}'. Allowed types: ${Array.from(ADDITIONAL_TYPES).join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        }, { status: 400 });
      }
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!job) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (["cancelled", "closed"].includes(job.status)) {
      return NextResponse.json({ error: `Order is ${job.status}, uploading disabled"` }, { status: 409 });
    }

    // 🔒 OWNERSHIP CHECK: client/freelancer/editor may only upload additional
    // files to orders they're actually party to - without this, any user with
    // one of these roles could upload files to any order in the system.
    if (authenticatedUser.role === 'client' && job.clientId !== authenticatedUser.id) {
      return NextResponse.json({ error: "You do not have access to this order", code: 'FORBIDDEN' }, { status: 403 });
    }
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
    
    // Use Drizzle ORM insert API with returning()
    const inserted = [];
    let orderFilesInsertFailed = false;
    
    for (const f of files) {
      const fileClassification = f.fileClassification ?? mapClassificationFromType(f.fileType) ?? 'other';
      const fileNotes = notes || undefined;
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
          console.log('[Additional Upload] Inserted to orderFiles:', record.id, record.fileName);
        }
      } catch (orderFilesError: any) {
        console.warn('[Additional Upload] orderFiles insert failed:', orderFilesError?.message);
        orderFilesInsertFailed = true;
      }
      
      // Also insert to legacy jobAttachments for backward compatibility
      // IMPORTANT: Preserve specific classification types for proper display
      const uploadTypeMap: Record<string, string> = {
        'additional': 'additional',
        'abstract': 'abstract',
        'printable_sources': 'printable_source',
        'printable_source': 'printable_source',
        'graphics_tables': 'graphics_tables',
        'references': 'references',
        'appendix': 'appendix',
        'outline': 'detailed_outline',
        'detailed_outline': 'detailed_outline',
        'other': 'other',
      };
      const uploadType = uploadTypeMap[f.fileType] || f.fileType || 'additional';
      
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
          console.log('[Additional Upload] Fallback to jobAttachments:', legacyRecord.id);
        } else {
          console.log('[Additional Upload] Also inserted to jobAttachments:', legacyRecord?.id);
        }
      } catch (legacyError: any) {
        console.warn('[Additional Upload] jobAttachments insert failed:', legacyError?.message);
        if (!insertedRecord) {
          console.error('[Additional Upload] Both tables failed for file:', f.name);
        }
      }
    }
    
    if (inserted.length === 0) {
      return NextResponse.json({ 
        error: "Failed to save files to database. Please try again.",
        code: 'DATABASE_INSERT_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, version: newVersion, files: inserted });
  } catch (error: any) {
    console.error("Additional upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload files" }, { status: 500 });
  }
}

function mapClassificationFromType(fileType: string): string {
  switch (fileType) {
    case 'printable_sources':
      return 'printable_sources';
    case 'graphics_tables':
      return 'tables';
    case 'abstract':
      return 'abstract';
    case 'outline':
      return 'outline';
    default:
      return 'other';
  }
}
