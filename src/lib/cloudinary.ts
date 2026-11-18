/**
 * Cloudinary Integration Library
 * Handles file uploads to Cloudinary storage
 */

export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: 'auto' | 'image' | 'video' | 'raw';
  publicId?: string;
  overwrite?: boolean;
  tags?: string[];
}

/**
 * Upload a file to Cloudinary
 * @param file - File to upload
 * @param options - Upload options
 * @returns Cloudinary upload response
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (options.folder) formData.append('folder', options.folder);
  if (options.publicId) formData.append('publicId', options.publicId);
  if (options.resourceType) formData.append('resourceType', options.resourceType);
  if (options.overwrite !== undefined) formData.append('overwrite', String(options.overwrite));
  if (options.tags) formData.append('tags', JSON.stringify(options.tags));

  const response = await fetch('/api/cloudinary/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file to Cloudinary');
  }

  return response.json();
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Success status
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file from Cloudinary');
  }

  const data = await response.json();
  return data.success;
}

/**
 * Generate Cloudinary URL with transformations
 * @param publicId - Cloudinary public ID
 * @param transformations - Transformation options
 * @returns Transformed URL
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'limit';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  }
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  let transformString = '';
  if (transformations) {
    const parts: string[] = [];
    if (transformations.width) parts.push(`w_${transformations.width}`);
    if (transformations.height) parts.push(`h_${transformations.height}`);
    if (transformations.crop) parts.push(`c_${transformations.crop}`);
    if (transformations.quality) parts.push(`q_${transformations.quality}`);
    if (transformations.format) parts.push(`f_${transformations.format}`);
    transformString = parts.length > 0 ? `/${parts.join(',')}` : '';
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload${transformString}/${publicId}`;
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 40)
 * @param allowedTypes - Allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 40,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type if specified
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Common file type groups
 */
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  ALL: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
};

