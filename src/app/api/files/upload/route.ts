import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderFiles, jobs, users, notifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { broadcastNotification } from '@/lib/notifications-bus';
import { ensureOrderFilesSchema } from '@/lib/order-files-schema';
import { getUserFromRequest } from '@/lib/admin-auth';

// Allowed file formats (server-side validation)
const ALLOWED_FORMATS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx',
  'xls', 'xlsx', 'txt', 'rtf',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
  'zip', 'rar', '7z', 'tar', 'gz',
  'mp3', 'mp4', 'wav', 'avi', 'mov',
  'csv', 'json', 'xml'
];

// ✅ CRITICAL: Maximum file size (40MB)
const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB in bytes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const jobId = formData.get('jobId') as string;
    let uploadedBy = formData.get('uploadedBy') as string;
    const uploadType = (formData.get('uploadType') as string) || 'additional'; // 'initial', 'draft', 'final', 'revision'
    const file = formData.get('file') as File;

    // Validate inputs
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    // Fall back to the authenticated session user when uploadedBy is not supplied
    if (!uploadedBy || isNaN(parseInt(uploadedBy))) {
      const sessionUser = await getUserFromRequest(request).catch(() => null);
      if (sessionUser?.id) {
        uploadedBy = String(sessionUser.id);
      }
    }

    if (!uploadedBy || isNaN(parseInt(uploadedBy))) {
      return NextResponse.json(
        { error: 'Valid uploader user ID is required', code: 'INVALID_UPLOADED_BY' },
        { status: 400 }
      );
    }

    if (!uploadType || !['initial', 'draft', 'final', 'revision', 'additional'].includes(uploadType)) {
      return NextResponse.json(
        { error: 'Valid upload type is required (initial, draft, final, revision, additional)', code: 'INVALID_UPLOAD_TYPE' },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File is required', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }

    // ✅ VALIDATE FILE FORMAT (Backend validation)
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      return NextResponse.json(
        { error: 'File must have an extension', code: 'NO_FILE_EXTENSION' },
        { status: 400 }
      );
    }
    
    if (!ALLOWED_FORMATS.includes(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileExt}. Please upload a supported file format.`, code: 'INVALID_FILE_FORMAT' },
        { status: 400 }
      );
    }

    // ✅ Validate file size (max 40MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must not exceed 40MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`, code: 'FILE_TOO_LARGE' },
        { status: 413 }
      );
    }

    let url = '';
    
    // ✅ Use Cloudinary as the primary storage backend
    try {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('folder', 'tasklynk/job-files');
      cloudinaryFormData.append('jobId', jobId);

      // Forward auth so the internal Cloudinary route can authenticate the user
      const forwardHeaders: Record<string, string> = {};
      const cookieHeader = request.headers.get('cookie');
      const authHeader = request.headers.get('authorization');
      if (cookieHeader) forwardHeaders['cookie'] = cookieHeader;
      if (authHeader) forwardHeaders['authorization'] = authHeader;
      
      const cloudinaryResponse = await fetch(`${request.nextUrl.origin}/api/cloudinary/upload`, {
        method: 'POST',
        headers: forwardHeaders,
        body: cloudinaryFormData,
      });
      
      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Cloudinary upload failed');
      }
      
      const cloudinaryData = await cloudinaryResponse.json();
      url = cloudinaryData.url;
      
    } catch (cloudinaryError) {
      console.error('❌ Storage upload failed:', cloudinaryError);
      return NextResponse.json(
        { 
          error: 'Failed to upload file to storage backend', 
          details: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
          code: 'STORAGE_UPLOAD_FAILED'
        },
        { status: 500 }
      );
    }

    // Try to ensure order_files table exists
    try {
      await ensureOrderFilesSchema();
    } catch (schemaError: any) {
      console.error('[Files Upload] Schema check failed:', schemaError?.message);
    }

    // Get uploader info
    const [uploader] = await db.select({ role: users.role }).from(users).where(eq(users.id, parseInt(uploadedBy))).limit(1);
    const uploaderRole = uploader?.role || 'unknown';

    // Get version number
    const [latest] = await db
      .select({ versionNumber: orderFiles.versionNumber })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, parseInt(jobId)))
      .orderBy(desc(orderFiles.versionNumber))
      .limit(1);
    const newVersion = (latest?.versionNumber || 0) + 1;

    // Map uploadType to fileType
    const fileTypeMap: Record<string, string> = {
      'initial': 'brief',
      'draft': 'draft',
      'final': 'final_document',
      'revision': 'revision',
      'additional': 'additional',
    };
    const fileType = fileTypeMap[uploadType] || 'additional';

    const now = new Date().toISOString();

    // Use Drizzle ORM insert API with returning()
    const orderId = parseInt(jobId);
    const uploaderId = parseInt(uploadedBy);
    const fileNotes = `${uploadType} upload`;
    
    const [newAttachment] = await db
      .insert(orderFiles)
      .values({
        orderId: orderId,
        uploadedBy: uploaderId,
        uploadedByRole: uploaderRole,
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileType: fileType,
        fileClassification: fileType,
        notes: fileNotes,
        versionNumber: newVersion,
        createdAt: now,
      })
      .returning();

    // NOTIFICATION SYSTEM: Notify all users associated with this order about new file
    try {
      const job = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, parseInt(jobId)))
        .limit(1);

      if (job.length > 0) {
        const usersToNotify: number[] = [];
        
        // Add client (always notified)
        usersToNotify.push(job[0].clientId);
        
        // Add assigned freelancer if exists
        if (job[0].assignedFreelancerId) {
          usersToNotify.push(job[0].assignedFreelancerId);
        }
        
        // Add all admins
        const admins = await db
          .select()
          .from(users)
          .where(eq(users.role, 'admin'));
        
        admins.forEach((admin: any) => {
          if (!usersToNotify.includes(admin.id)) {
            usersToNotify.push(admin.id);
          }
        });

        // Don't notify the uploader
        const filteredUsers = usersToNotify.filter(id => id !== parseInt(uploadedBy));

        // Determine file type message
        let fileTypeMessage = 'A new file';
        if (uploadType === 'initial') {
          fileTypeMessage = 'A new order file';
        } else if (uploadType === 'draft') {
          fileTypeMessage = 'A draft file';
        } else if (uploadType === 'final') {
          fileTypeMessage = 'A completed file';
        } else if (uploadType === 'revision') {
          fileTypeMessage = 'A revision file';
        }

        // Create notifications for all users and broadcast in real-time
        for (const userId of filteredUsers) {
          try {
            const notification = {
              userId,
              jobId: job[0].id,
              type: 'file_uploaded',
              title: `New File Added to Order ${job[0].displayId}`,
              message: `${fileTypeMessage} "${file.name}" has been uploaded to order "${job[0].title}"`,
              read: false,
              createdAt: new Date().toISOString(),
            };
            
            await db.insert(notifications).values(notification);
            
            // Broadcast real-time notification via centralized bus
            broadcastNotification(userId, notification);
          } catch (notifError) {
            console.error(`Failed to create notification for user ${userId}:`, notifError);
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to create file upload notifications:', notificationError);
      // Don't fail the upload if notifications fail
    }

    return NextResponse.json({
      success: true,
      url,
      attachment: newAttachment,
      message: `File "${file.name}" uploaded successfully with format preserved`
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

