import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles, users, jobAttachments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/admin-auth";
import { ensureOrderFilesSchema } from "@/lib/order-files-schema";
import { notifyFileUploaded } from "@/lib/notifications";

// POST /api/v2/orders/[id]/upload/draft
// Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType }] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Freelancers, managers, and admins can upload drafts
    const authCheck = await requireRole(request, ['freelancer', 'manager', 'admin']);
    if (authCheck.error) {
      console.error('[Draft Upload] Auth failed:', authCheck.error);
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const authenticatedUser = authCheck.user!;
    console.log('[Draft Upload] Authenticated user:', authenticatedUser.id, authenticatedUser.role);

    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "Valid order id required", code: 'INVALID_ORDER_ID' }, { status: 400 });
    }

    // Try to ensure order_files table exists, but don't fail if it errors
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Draft Upload] Schema check failed:', schemaError?.message);
      // Continue anyway - we'll catch the table error later with better messaging
    }

    const body = await request.json();
    const { uploaderId, notes, files } = body as {
      uploaderId: number;
      notes?: string;
      files: { url: string; name: string; size: number; mimeType: string }[];
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

    // 🔒 OWNERSHIP CHECK: a freelancer may only upload drafts to orders they're
    // actually assigned to - without this, any approved freelancer could upload
    // files to any order in the system.
    if (authenticatedUser.role === 'freelancer' && job.assignedFreelancerId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: "You are not assigned to this order", code: 'FORBIDDEN' },
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
    
    console.log('[Draft Upload] Inserting files:', files.length);
    
    // 🔴 CRITICAL FIX: Use raw SQL to avoid Drizzle including id:null in INSERT
    const inserted = [];
    let orderFilesInsertFailed = false;
    
    for (const f of files) {
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
            fileType: 'draft',
            fileClassification: 'draft',
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          })
          .returning();
          
        if (record) {
          insertedRecord = record;
          inserted.push(record);
          console.log('[Draft Upload] Inserted to orderFiles:', record.id, record.fileName);
        }
      } catch (orderFilesError: any) {
        console.warn('[Draft Upload] orderFiles insert failed:', orderFilesError?.message);
        orderFilesInsertFailed = true;
      }
      
      // Also insert to legacy jobAttachments for backward compatibility
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
            uploadType: 'draft',
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
            fileType: 'draft',
            fileClassification: 'draft',
            notes: fileNotes,
            versionNumber: newVersion,
            createdAt: now,
          });
          console.log('[Draft Upload] Fallback to jobAttachments:', legacyRecord.id);
        } else {
          console.log('[Draft Upload] Also inserted to jobAttachments:', legacyRecord?.id);
        }
      } catch (legacyError: any) {
        console.warn('[Draft Upload] jobAttachments insert failed:', legacyError?.message);
        if (!insertedRecord) {
          console.error('[Draft Upload] Both tables failed for file:', f.name);
        }
      }
    }
    
    if (inserted.length === 0) {
      return NextResponse.json({ 
        error: "Failed to save files to database. Please try again.",
        code: 'DATABASE_INSERT_FAILED'
      }, { status: 500 });
    }

    console.log('[Draft Upload] Successfully inserted:', inserted.length, 'files');

    // Auto-progress to in_progress when uploading draft from accepted
    if (job.status === "accepted") {
      await db.update(jobs).set({ status: "in_progress", draftDelivered: true }).where(eq(jobs.id, orderId));
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
            'draft'
          ).catch(err => console.error('[Draft Upload] Notification failed:', err));
        }
      }
      
      console.log('[Draft Upload] Notifications sent to', notificationTargets.length, 'users');
    } catch (notifError) {
      console.error('[Draft Upload] Failed to send notifications:', notifError);
      // Don't fail the upload if notifications fail
    }

    return NextResponse.json({ success: true, version: newVersion, files: inserted });
  } catch (error: any) {
    console.error("Draft upload error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: error.message || "Failed to upload draft",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
