/**
 * Document Preview Service
 * 
 * High-level service for managing document previews with caching,
 * security, and integration with the existing TaskLynk system.
 */

import { generateDocumentPreview, PreviewConfig, DEFAULT_PREVIEW_CONFIG } from './pdf-processor';
import { db } from '@/db';
import { documentPreviews } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs/promises';

export interface PreviewCache {
  id: number;
  orderId: number;
  userId: number;
  fileName: string;
  originalFileUrl: string;
  previewPdfPath: string;
  fullPdfPath: string;
  totalPages: number;
  previewPages: number;
  fileSize: number;
  watermarkText: string;
  createdAt: string;
  expiresAt: string;
  accessToken: string;
}

export interface PreviewRequest {
  orderId: number;
  userId: number;
  fileUrl: string;
  fileName: string;
  hasFullAccess: boolean;
  config?: PreviewConfig;
}

export interface PreviewResponse {
  orderId: number;
  fileName: string;
  totalPages: number;
  previewPages: number;
  hasFullAccess: boolean;
  previewUrl?: string;
  downloadUrl?: string;
  watermarkText: string;
  expiresAt?: string;
  cached: boolean;
}

/**
 * Cache duration for preview files (24 hours)
 */
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Download token expiry (10 minutes)
 */
const DOWNLOAD_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Generate secure access token for downloads
 */
export function generateAccessToken(orderId: number, userId: number, type: 'preview' | 'full'): string {
  const payload = JSON.stringify({
    orderId,
    userId,
    type,
    expires: Date.now() + DOWNLOAD_TOKEN_EXPIRY_MS
  });
  
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex') + '.' + Buffer.from(payload).toString('base64');
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): { orderId: number; userId: number; type: string; expires: number } | null {
  try {
    const [signature, payloadBase64] = token.split('.');
    if (!signature || !payloadBase64) return null;
    
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    
    // Verify signature
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    // Check expiry
    if (Date.now() > payload.expires) return null;
    
    return payload;
  } catch (error) {
    console.error('Failed to verify access token:', error);
    return null;
  }
}

/**
 * Fetch file from Cloudinary URL
 */
async function fetchCloudinaryFile(fileUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('Failed to fetch file from Cloudinary:', error);
    throw new Error(`Failed to fetch file: ${error}`);
  }
}

/**
 * Get cached preview if exists and valid
 */
async function getCachedPreview(orderId: number, fileName: string): Promise<PreviewCache | null> {
  try {
    // Check if preview cache table exists (will be created by schema update)
    const cached = await db
      .select()
      .from(documentPreviews)
      .where(and(
        eq(documentPreviews.orderId, orderId),
        eq(documentPreviews.fileName, fileName)
      ))
      .limit(1);
    
    if (cached.length === 0) return null;
    
    const preview = cached[0];
    
    // Check if expired
    if (new Date(preview.expiresAt) < new Date()) {
      // Cleanup expired preview
      await cleanupPreview(preview.id);
      return null;
    }
    
    // Verify files still exist
    try {
      await fs.access(preview.previewPdfPath);
      await fs.access(preview.fullPdfPath);
      return preview as PreviewCache;
    } catch (error) {
      // Files missing, cleanup cache entry
      await cleanupPreview(preview.id);
      return null;
    }
  } catch (error) {
    console.error('Failed to get cached preview:', error);
    return null;
  }
}

/**
 * Cache preview metadata and file paths
 */
async function cachePreview(
  orderId: number,
  userId: number,
  fileName: string,
  originalFileUrl: string,
  previewPdfPath: string,
  fullPdfPath: string,
  totalPages: number,
  previewPages: number,
  fileSize: number,
  watermarkText: string
): Promise<string> {
  try {
    const accessToken = generateAccessToken(orderId, userId, 'preview');
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS).toISOString();
    
    await db.insert(documentPreviews).values({
      orderId,
      userId,
      fileName,
      originalFileUrl,
      previewPdfPath,
      fullPdfPath,
      totalPages,
      previewPages,
      fileSize,
      watermarkText,
      accessToken,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    
    console.log(`[Preview Cache] Cached preview for order ${orderId}, file ${fileName}`);
    return accessToken;
  } catch (error) {
    console.error('Failed to cache preview:', error);
    throw error;
  }
}

/**
 * Cleanup preview files and database entry
 */
async function cleanupPreview(previewId: number): Promise<void> {
  try {
    // Get file paths before deleting from DB
    const preview = await db
      .select()
      .from(documentPreviews)
      .where(eq(documentPreviews.id, previewId))
      .limit(1);
    
    if (preview.length > 0) {
      const { previewPdfPath, fullPdfPath } = preview[0];
      
      // Delete files
      try {
        await fs.unlink(previewPdfPath);
        await fs.unlink(fullPdfPath);
        // Try to remove empty parent directories
        const baseDir = previewPdfPath.split('/').slice(0, -1).join('/');
        await fs.rmdir(baseDir).catch(() => {}); // Ignore errors if not empty
      } catch (fileError) {
        console.warn('Failed to cleanup preview files:', fileError);
      }
      
      // Remove from database
      await db.delete(documentPreviews).where(eq(documentPreviews.id, previewId));
    }
  } catch (error) {
    console.error('Failed to cleanup preview:', error);
  }
}

/**
 * Main preview generation function
 */
export async function generatePreview(request: PreviewRequest): Promise<PreviewResponse> {
  const { orderId, userId, fileUrl, fileName, hasFullAccess, config = DEFAULT_PREVIEW_CONFIG } = request;
  
  try {
    console.log(`[Preview Service] Generating preview for order ${orderId}, file ${fileName}`);
    
    // Check cache first
    const cached = await getCachedPreview(orderId, fileName);
    if (cached) {
      console.log(`[Preview Service] Using cached preview for order ${orderId}`);
      
      return {
        orderId,
        fileName,
        totalPages: cached.totalPages,
        previewPages: cached.previewPages,
        hasFullAccess,
        previewUrl: hasFullAccess ? undefined : `/api/v2/orders/${orderId}/preview/download?token=${cached.accessToken}&type=preview`,
        downloadUrl: hasFullAccess ? `/api/v2/orders/${orderId}/preview/download?token=${generateAccessToken(orderId, userId, 'full')}&type=full` : undefined,
        watermarkText: cached.watermarkText,
        expiresAt: cached.expiresAt,
        cached: true
      };
    }
    
    // Fetch original file
    console.log(`[Preview Service] Fetching file from Cloudinary: ${fileUrl}`);
    const fileBuffer = await fetchCloudinaryFile(fileUrl);
    
    // Generate preview and split PDF
    console.log(`[Preview Service] Generating PDF preview for order ${orderId}`);
    const result = await generateDocumentPreview(fileBuffer, fileName, userId, orderId, config);
    
    // Cache the result
    const watermarkText = `${config.watermarkText}\nUser ID: ${userId} | Order: ${orderId}`;
    await cachePreview(
      orderId,
      userId,
      fileName,
      fileUrl,
      result.previewPdfPath,
      result.fullPdfPath,
      result.documentInfo.totalPages,
      result.documentInfo.previewPages,
      result.documentInfo.fileSize,
      watermarkText
    );
    
    return {
      orderId,
      fileName,
      totalPages: result.documentInfo.totalPages,
      previewPages: result.documentInfo.previewPages,
      hasFullAccess,
      previewUrl: hasFullAccess ? undefined : `/api/v2/orders/${orderId}/preview/download?token=${generateAccessToken(orderId, userId, 'preview')}&type=preview`,
      downloadUrl: hasFullAccess ? `/api/v2/orders/${orderId}/preview/download?token=${generateAccessToken(orderId, userId, 'full')}&type=full` : undefined,
      watermarkText,
      cached: false
    };
  } catch (error) {
    console.error(`[Preview Service] Failed to generate preview for order ${orderId}:`, error);
    throw new Error(`Failed to generate document preview: ${error}`);
  }
}

/**
 * Cleanup expired previews (should be run as scheduled job)
 */
export async function cleanupExpiredPreviews(): Promise<number> {
  try {
    const expired = await db
      .select()
      .from(documentPreviews)
      .where(eq(documentPreviews.expiresAt, new Date().toISOString()));
    
    let cleanedCount = 0;
    for (const preview of expired) {
      await cleanupPreview(preview.id);
      cleanedCount++;
    }
    
    console.log(`[Preview Cleanup] Cleaned up ${cleanedCount} expired previews`);
    return cleanedCount;
  } catch (error) {
    console.error('Failed to cleanup expired previews:', error);
    return 0;
  }
}

