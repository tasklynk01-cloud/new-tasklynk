import { NextRequest } from 'next/server';

/**
 * 🔒 FILE UPLOAD VALIDATION MIDDLEWARE
 * 
 * Security features:
 * - File size limit enforcement (15MB default)
 * - File type validation (whitelist approach)
 * - MIME type verification
 * - Dangerous file extension blocking
 * - File name sanitization
 * 
 * USAGE:
 * Import this in your file upload API routes:
 * 
 * const validation = await validateFileUpload(request);
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 });
 * }
 */

// File size limits (in bytes)
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

// Allowed file types for documents
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

// Allowed file types for images
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Allowed file extensions (whitelist)
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'
];

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp'
];

// Dangerous file extensions (blacklist)
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar', '.com',
  '.scr', '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg', '.bin', '.run',
  '.apk', '.ipa', '.dll', '.so', '.dylib', '.sys', '.pif', '.application',
  '.gadget', '.msp', '.cpl', '.hta', '.inf', '.reg', '.scf', '.url', '.ws',
  '.wsf', '.wsh', '.lnk', '.ace', '.arj', '.cab', '.chm', '.cpl', '.hlp'
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: {
    name: string;
    size: number;
    type: string;
  };
}

/**
 * Validate file upload from multipart form data
 * 
 * @param request - NextRequest containing multipart/form-data
 * @param fileFieldName - Name of the file field in form (default: 'file')
 * @param maxSize - Maximum file size in bytes (default: 15MB)
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export async function validateFileUpload(
  request: NextRequest,
  fileFieldName: string = 'file',
  maxSize: number = MAX_FILE_SIZE,
  allowedTypes: string[] = ALLOWED_DOCUMENT_TYPES
): Promise<FileValidationResult> {
  try {
    const contentType = request.headers.get('content-type');

    // Check if request is multipart/form-data
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        valid: false,
        error: 'Request must be multipart/form-data'
      };
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get(fileFieldName);

    // Check if file exists
    if (!file || !(file instanceof File)) {
      return {
        valid: false,
        error: 'No file provided or invalid file format'
      };
    }

    // Validate file name
    const fileName = file.name;
    if (!fileName || fileName.trim().length === 0) {
      return {
        valid: false,
        error: 'File name is required'
      };
    }

    // Check for dangerous file extensions
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type ${fileExtension} is not allowed for security reasons`
      };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${maxSizeMB}MB`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    // Validate MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Validate file extension matches MIME type category
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    
    if (isDocument && !ALLOWED_DOCUMENT_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext))) {
      return {
        valid: false,
        error: 'File extension does not match document type'
      };
    }

    if (isImage && !ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext))) {
      return {
        valid: false,
        error: 'File extension does not match image type'
      };
    }

    // Additional security: Read file header to verify MIME type
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check for common file signatures (magic numbers)
    const isValidFileSignature = verifyFileSignature(uint8Array, file.type);
    if (!isValidFileSignature) {
      return {
        valid: false,
        error: 'File signature does not match declared type. File may be corrupted or disguised.'
      };
    }

    return {
      valid: true,
      file: {
        name: fileName,
        size: file.size,
        type: file.type
      }
    };
  } catch (error) {
    console.error('File validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate file: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

/**
 * Verify file signature (magic numbers) matches declared MIME type
 * This prevents users from renaming .exe to .pdf, etc.
 * 
 * @param bytes - First bytes of the file
 * @param mimeType - Declared MIME type
 * @returns true if signature matches
 */
function verifyFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  // We only check the first few bytes for performance
  if (bytes.length < 4) {
    return false;
  }

  // PDF: %PDF (25 50 44 46)
  if (mimeType === 'application/pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  // PNG: 89 50 4E 47
  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  }

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }

  // GIF: GIF87a or GIF89a
  if (mimeType === 'image/gif') {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  }

  // MS Office files (DOCX, XLSX, PPTX) - ZIP signature: 50 4B 03 04
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  }

  // Legacy MS Office files (DOC, XLS, PPT) - D0 CF 11 E0 A1 B1 1A E1
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  }

  // Plain text and CSV - no specific signature, accept any
  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    return true; // Text files don't have a magic number
  }

  // WEBP: RIFF....WEBP
  if (mimeType === 'image/webp') {
    if (bytes.length < 12) return false;
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
           bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }

  // Unknown type - reject for security
  return false;
}

/**
 * Validate multiple files at once
 * 
 * @param request - NextRequest containing multipart/form-data
 * @param fileFieldNames - Array of file field names
 * @param maxSize - Maximum file size per file
 * @param allowedTypes - Array of allowed MIME types
 * @returns Array of validation results
 */
export async function validateMultipleFiles(
  request: NextRequest,
  fileFieldNames: string[],
  maxSize: number = MAX_FILE_SIZE,
  allowedTypes: string[] = ALLOWED_DOCUMENT_TYPES
): Promise<FileValidationResult[]> {
  const results: FileValidationResult[] = [];

  for (const fieldName of fileFieldNames) {
    const result = await validateFileUpload(request, fieldName, maxSize, allowedTypes);
    results.push(result);
  }

  return results;
}

/**
 * Sanitize file name for safe storage
 * Removes dangerous characters and limits length
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path separators
  let safe = filename.replace(/[/\\]/g, '');

  // Get extension
  const lastDot = safe.lastIndexOf('.');
  const name = lastDot > 0 ? safe.substring(0, lastDot) : safe;
  const ext = lastDot > 0 ? safe.substring(lastDot) : '';

  // Remove dangerous characters from name
  const safeName = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._]+/, '') // Remove leading dots/underscores
    .substring(0, 200); // Limit length

  // Keep extension safe
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return `${safeName}${safeExt}` || 'unnamed_file';
}

/**
 * Generate unique filename with timestamp to prevent collisions
 * 
 * @param originalFilename - Original filename
 * @param prefix - Optional prefix for the file
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string, prefix?: string): string {
  const sanitized = sanitizeFileName(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  const lastDot = sanitized.lastIndexOf('.');
  const name = lastDot > 0 ? sanitized.substring(0, lastDot) : sanitized;
  const ext = lastDot > 0 ? sanitized.substring(lastDot) : '';

  const parts = [prefix, name, timestamp, random].filter(Boolean);
  
  return `${parts.join('_')}${ext}`;
}

