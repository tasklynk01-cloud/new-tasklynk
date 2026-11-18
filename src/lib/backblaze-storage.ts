// Storage bucket configuration
export const STORAGE_BUCKETS = {
  JOB_FILES: 'job-files',
  PROFILE_PICTURES: 'profile-pictures',
  DOCUMENTS: 'documents',
} as const;

// Check if Backblaze is configured
const isB2Configured = !!(
  process.env.B2_KEY_ID &&
  process.env.B2_APPLICATION_KEY &&
  process.env.B2_BUCKET_ID &&
  process.env.B2_BUCKET_NAME &&
  process.env.B2_ENDPOINT
);

// Lazy-load Backblaze B2 client only when configured and needed
let b2Client: any = null;
let authData: any = null;
let authExpiry: number = 0;

async function getB2Client() {
  if (!isB2Configured) {
    return null;
  }
  
  if (!b2Client) {
    const BackblazeB2 = (await import('backblaze-b2')).default;
    b2Client = new BackblazeB2({
      applicationKeyId: process.env.B2_KEY_ID!,
      applicationKey: process.env.B2_APPLICATION_KEY!,
    });
  }
  
  return b2Client;
}

/**
 * Authorize with Backblaze B2
 */
async function authorizeB2() {
  const client = await getB2Client();
  if (!client) {
    throw new Error('Backblaze B2 client not initialized');
  }
  
  const now = Date.now();
  if (authData && authExpiry > now) {
    return authData;
  }
  
  try {
    const response = await client.authorize();
    authData = response.data;
    authExpiry = now + (23 * 60 * 60 * 1000);
    return authData;
  } catch (error) {
    console.error('Failed to authorize with Backblaze B2:', error);
    throw error;
  }
}

/**
 * Upload a file to Backblaze B2 Storage
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File | Buffer,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  if (!isB2Configured) {
    return {
      url: null,
      error: new Error('Backblaze B2 not configured. Using Cloudinary for file storage.'),
    };
  }

  try {
    const client = await getB2Client();
    if (!client) {
      return { url: null, error: new Error('Failed to initialize B2 client') };
    }

    await authorizeB2();

    const uploadUrlResponse = await client.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID!,
    });

    let fileBuffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      fileBuffer = file;
    }

    const cleanPath = filePath.replace(/^\/+/, '');
    const fullFileName = `${bucket}/${cleanPath}`;

    await client.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: fullFileName,
      data: fileBuffer,
      contentType: contentType || 'application/octet-stream',
    });

    const downloadUrl = `${process.env.B2_ENDPOINT}/file/${process.env.B2_BUCKET_NAME}/${fullFileName}`;

    return { 
      url: downloadUrl, 
      error: null 
    };
  } catch (error) {
    console.error('Backblaze B2 upload error:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Delete a file from Backblaze B2 Storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isB2Configured) {
    return { success: true, error: null };
  }

  try {
    const client = await getB2Client();
    if (!client) {
      return { success: false, error: new Error('Failed to initialize B2 client') };
    }

    await authorizeB2();

    const cleanPath = filePath.replace(/^\/+/, '');
    const fullFileName = `${bucket}/${cleanPath}`;

    const listResponse = await client.listFileNames({
      bucketId: process.env.B2_BUCKET_ID!,
      prefix: fullFileName,
      maxFileCount: 1,
    });

    if (listResponse.data.files.length === 0) {
      return { success: false, error: new Error('File not found') };
    }

    const fileId = listResponse.data.files[0].fileId;
    const fileName = listResponse.data.files[0].fileName;

    await client.deleteFileVersion({
      fileId,
      fileName,
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Backblaze B2 delete error:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * List files in a bucket path
 */
export async function listFiles(
  bucket: string,
  path?: string
): Promise<{ files: any[] | null; error: Error | null }> {
  if (!isB2Configured) {
    return { files: [], error: null };
  }

  try {
    const client = await getB2Client();
    if (!client) {
      return { files: [], error: new Error('Failed to initialize B2 client') };
    }

    await authorizeB2();

    const prefix = path ? `${bucket}/${path}` : bucket;

    const listResponse = await client.listFileNames({
      bucketId: process.env.B2_BUCKET_ID!,
      prefix,
      maxFileCount: 100,
    });

    return { files: listResponse.data.files, error: null };
  } catch (error) {
    console.error('Backblaze B2 list error:', error);
    return { files: null, error: error as Error };
  }
}

/**
 * Get public URL for a file (for private buckets, use signed URLs)
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  if (!isB2Configured) {
    return `/mock-storage/${bucket}/${filePath}`;
  }

  return `${process.env.B2_ENDPOINT}/file/${process.env.B2_BUCKET_NAME}/${bucket}/${filePath}`;
}

/**
 * Generate a temporary download URL for private buckets
 */
export async function getDownloadUrl(
  bucket: string,
  filePath: string,
  _durationSeconds: number = 3600
): Promise<{ url: string | null; error: Error | null }> {
  if (!isB2Configured) {
    return {
      url: `/mock-storage/${bucket}/${filePath}`,
      error: null,
    };
  }

  try {
    await authorizeB2();
    const baseUrl = getPublicUrl(bucket, filePath);
    return { url: baseUrl, error: null };
  } catch (error) {
    console.error('Backblaze B2 download URL error:', error);
    return { url: null, error: error as Error };
  }
}

