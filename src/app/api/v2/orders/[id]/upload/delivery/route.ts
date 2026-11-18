import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles, users, jobAttachments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";
import { ensureOrderFilesSchema } from "@/lib/order-files-schema";

// Allow same set as final uploads for delivery
const DELIVERY_TYPES = new Set([
  "final_document",
  "completed_paper",
  "plagiarism_report",
  "ai_report",
  "abstract",
  "graphics_tables",
  "printable_sources",
  "additional",
]);

/**
 * POST /api/v2/orders/[id]/upload/delivery
 * Admin/Manager uploads files for delivery to client
 * These files will show as "from freelancer" on client side
 * 
 * Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType, fileType?, fileClassification? }] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Only managers and admins can upload delivery files
    const authCheck = await requireRole(request, ['manager', 'admin', 'editor']);
    if (authCheck.error) {
      console.error('[Delivery Upload] Auth failed:', authCheck.error);
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;
    console.log('[Delivery Upload] Authenticated user:', authenticatedUser.id, authenticatedUser.role);

    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Valid order id required", code: 'INVALID_ORDER_ID' }, { status: 400 });
    }

    // Try to ensure order_files table exists, but don't fail if it errors
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Delivery Upload] Schema check failed:', schemaError?.message);
      // Continue anyway - we'll catch the table error later with better messaging
    }

    const body = await request.json();
    const { uploaderId, notes, files } = body as {
      uploaderId: number;
      notes?: string;
      files: { url: string; name: string; size: number; mimeType: string; fileType?: string; fileClassification?: string | null }[];
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

    const [job] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!job) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (["cancelled", "closed"].includes(job.status)) {
      return NextResponse.json({ error: `Order is ${job.status}, uploading disabled` }, { status: 409 });
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
    
    console.log('[Delivery Upload] Inserting files:', files.length);
    
    const inserted = [];
    let orderFilesInsertFailed = false;
    
    for (const f of files) {
      const fileType = f.fileType && DELIVERY_TYPES.has(f.fileType) ? f.fileType : 'final_document';
      const fileClassification = f.fileClassification ?? mapClassificationFromType(f.fileType) ?? 'other';
      const fileNotes = notes ? `[DELIVERY] ${notes}` : '[DELIVERY] Files delivered to client';
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
            fileType: fileType,
            fileClassification: fileClassification,
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          })
          .returning();
          
        if (record) {
          insertedRecord = record;
          inserted.push(record);
          console.log('[Delivery Upload] Inserted to orderFiles:', record.id, record.fileName);
        }
      } catch (orderFilesError: any) {
        console.warn('[Delivery Upload] orderFiles insert failed:', orderFilesError?.message);
        orderFilesInsertFailed = true;
      }
      
      // Also insert to legacy jobAttachments for backward compatibility
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
      const uploadType = uploadTypeMap[fileType] || fileType || 'other';
      
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
            fileType: fileType,
            fileClassification: fileClassification,
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          });
          console.log('[Delivery Upload] Fallback to jobAttachments:', legacyRecord.id);
        } else {
          console.log('[Delivery Upload] Also inserted to jobAttachments:', legacyRecord?.id);
        }
      } catch (legacyError: any) {
        console.warn('[Delivery Upload] jobAttachments insert failed:', legacyError?.message);
        if (!insertedRecord) {
          console.error('[Delivery Upload] Both tables failed for file:', f.name);
        }
      }
    }
    
    if (inserted.length === 0) {
      return NextResponse.json({ 
        error: "Failed to save files to database. Please try again.",
        code: 'DATABASE_INSERT_FAILED'
      }, { status: 500 });
    }

    console.log('[Delivery Upload] Successfully inserted:', inserted.length, 'files');
    return NextResponse.json({ success: true, version: newVersion, files: inserted });
  } catch (error: any) {
    console.error("Delivery upload error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || "Failed to upload delivery files",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

function mapClassificationFromType(fileType?: string): string | null {
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

