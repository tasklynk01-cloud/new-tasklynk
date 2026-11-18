import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderFiles, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { ensureOrderFilesSchema } from '@/lib/order-files-schema';

/**
 * POST /api/v2/orders/[id]/admin-upload
 * Admin/Manager uploads edited files during "editing" status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate as admin or manager
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const jobId = parseInt(params.id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Check if job exists
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Allow uploads at various stages (not just editing)
    // Block only terminal states
    const blockedStatuses = ['completed', 'cancelled'];
    if (blockedStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot upload files for orders in ${job.status} status` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 40MB)
    const maxSize = 40 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 40MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOCX, PPTX, XLSX, images, archives' },
        { status: 400 }
      );
    }

    await ensureOrderFilesSchema();

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const timestamp = Math.round(Date.now() / 1000);
    
    // Create signature for secure upload - include folder in signature
    const crypto = await import('crypto');
    const folder = `tasklynk/orders/${jobId}/admin-edits`;
    const signatureString = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const uploadData = new FormData();
    uploadData.append('file', dataUri);
    uploadData.append('timestamp', timestamp.toString());
    uploadData.append('api_key', process.env.CLOUDINARY_API_KEY!);
    uploadData.append('signature', signature);
    uploadData.append('folder', folder);

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Cloudinary upload failed');
    }

    const uploadResult = await uploadResponse.json();

    // Save to database using Drizzle ORM insert API
    const now = new Date().toISOString();

    const [savedFile] = await db
      .insert(orderFiles)
      .values({
        orderId: jobId,
        uploadedBy: user.id,
        uploadedByRole: user.role,
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        fileType: 'additional',
        fileClassification: 'additional',
        notes: 'Uploaded by ' + user.role,
        versionNumber: 1,
        createdAt: now,
      })
      .returning();

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        fileName: savedFile.fileName,
        fileUrl: savedFile.fileUrl,
        fileSize: savedFile.fileSize,
        uploadedBy: user.name,
        uploadedByRole: user.role,
        createdAt: savedFile.createdAt,
      },
    });
  } catch (error) {
    console.error('Admin file upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/orders/[id]/admin-files
 * Get all files uploaded by admin/manager for this order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate as admin or manager
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const jobId = parseInt(params.id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Get all files uploaded by admin/manager
    const files = await db.select()
      .from(orderFiles)
      .where(eq(orderFiles.orderId, jobId));

    // Filter by role (only admin/manager files)
    const adminManagerFiles = files.filter(f => 
      f.uploadedByRole === 'admin' || f.uploadedByRole === 'manager'
    );

    return NextResponse.json({
      success: true,
      files: adminManagerFiles,
      count: adminManagerFiles.length,
    });
  } catch (error) {
    console.error('Get admin files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
