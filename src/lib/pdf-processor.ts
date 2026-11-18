/**
 * PDF Processing Utilities
 * 
 * Provides comprehensive PDF operations including:
 * - DOCX to PDF conversion
 * - PDF splitting for preview generation
 * - PDF watermarking
 * - Secure PDF serving
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';

export interface PreviewConfig {
  previewPercentage: number; // 25 = 25%
  minPreviewPages: number;   // Minimum 2 pages
  maxPreviewPages: number;   // Maximum 5 pages  
  watermarkText: string;
  startPage?: number;        // Page to start preview from (1-indexed, default: 1)
}

export interface DocumentInfo {
  totalPages: number;
  previewPages: number;
  fileSize: number;
}

export interface PreviewResult {
  previewPdfPath: string;
  fullPdfPath: string;
  documentInfo: DocumentInfo;
  watermarkApplied: boolean;
}

/**
 * Default preview configuration matching Course Hero standards
 */
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  previewPercentage: 25,
  minPreviewPages: 2,
  maxPreviewPages: 5,
  watermarkText: 'PREVIEW ONLY – UNLOCK FULL DOCUMENT',
  startPage: 1
};

/**
 * POD (Pay on Delivery) preview configuration - shows 40% starting from page 1
 */
export const POD_PREVIEW_CONFIG: PreviewConfig = {
  previewPercentage: 40,
  minPreviewPages: 2,
  maxPreviewPages: 5,
  watermarkText: 'PREVIEW ONLY – PAYMENT REQUIRED FOR FULL ACCESS',
  startPage: 1
};

/**
 * Convert DOCX file to PDF using Puppeteer HTML rendering
 */
export async function convertDOCXToPDF(
  docxBuffer: Buffer,
  outputPath: string
): Promise<string> {
  try {
    console.log('[PDF Converter] Converting DOCX to PDF...');
    
    // Extract text and formatting from DOCX
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });
    const htmlContent = result.value;
    
    // Create full HTML document with proper styling
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 1in;
            color: #000;
        }
        p { margin-bottom: 12pt; }
        h1, h2, h3, h4, h5, h6 {
            color: #000;
            margin-top: 24pt;
            margin-bottom: 12pt;
        }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ccc; padding: 8pt; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    // Use Puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',  
        bottom: '1in',
        left: '1in'
      },
      printBackground: true
    });

    await browser.close();

    // Save PDF to file
    await fs.writeFile(outputPath, pdfBuffer);
    
    console.log(`[PDF Converter] Successfully converted DOCX to PDF: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('[PDF Converter] Failed to convert DOCX to PDF:', error);
    throw new Error(`Failed to convert DOCX to PDF: ${error}`);
  }
}

/**
 * Convert any file to PDF (handles PDF passthrough, DOCX conversion)
 */
export async function convertToPDF(
  fileBuffer: Buffer,
  fileName: string,
  outputPath: string
): Promise<string> {
  const extension = path.extname(fileName).toLowerCase();
  
  try {
    if (extension === '.pdf') {
      // Already PDF - just write to output path
      await fs.writeFile(outputPath, fileBuffer);
      console.log(`[PDF Converter] PDF file passed through: ${outputPath}`);
      return outputPath;
    } else if (extension === '.docx') {
      return await convertDOCXToPDF(fileBuffer, outputPath);
    } else {
      throw new Error(`Unsupported file type for PDF conversion: ${extension}`);
    }
  } catch (error) {
    console.error(`[PDF Converter] Failed to convert ${fileName} to PDF:`, error);
    throw error;
  }
}

/**
 * Calculate preview pages based on total pages and config
 */
export function calculatePreviewPages(
  totalPages: number,
  config: PreviewConfig = DEFAULT_PREVIEW_CONFIG
): number {
  const percentagePages = Math.ceil(totalPages * (config.previewPercentage / 100));
  return Math.max(
    config.minPreviewPages,
    Math.min(config.maxPreviewPages, percentagePages)
  );
}

/**
 * Split PDF into preview and full versions
 * @param startPage - Page number to start preview from (1-indexed, default: 1)
 */
export async function splitPDF(
  pdfPath: string,
  previewPages: number,
  previewOutputPath: string,
  startPage: number = 1
): Promise<{ previewPath: string; totalPages: number }> {
  try {
    let startPageIndex = Math.max(0, startPage - 1); // Convert to 0-indexed
    console.log(`[PDF Splitter] Splitting PDF: ${previewPages} preview pages starting from page ${startPage}...`);
    
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    // Validate start page
    if (startPageIndex >= totalPages) {
      console.warn(`[PDF Splitter] Start page (${startPage}) exceeds total pages (${totalPages}), starting from page 1`);
      startPageIndex = 0;
    }
    
    // Calculate actual pages to extract
    const endPageIndex = Math.min(startPageIndex + previewPages, totalPages);
    const actualPreviewPages = endPageIndex - startPageIndex;
    
    if (actualPreviewPages <= 0 || actualPreviewPages >= totalPages) {
      console.warn(`[PDF Splitter] Preview would include all pages, copying full document`);
      await fs.copyFile(pdfPath, previewOutputPath);
      return { previewPath: previewOutputPath, totalPages };
    }

    // Create preview document with specified page range
    const previewDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: actualPreviewPages }, (_, i) => startPageIndex + i);
    const pages = await previewDoc.copyPages(pdfDoc, pageIndices);
    
    pages.forEach((page) => previewDoc.addPage(page));
    
    const previewPdfBytes = await previewDoc.save();
    await fs.writeFile(previewOutputPath, previewPdfBytes);
    
    console.log(`[PDF Splitter] Created preview PDF with ${actualPreviewPages} pages (${startPage}-${startPage + actualPreviewPages - 1}): ${previewOutputPath}`);
    return { previewPath: previewOutputPath, totalPages };
  } catch (error) {
    console.error('[PDF Splitter] Failed to split PDF:', error);
    throw new Error(`Failed to split PDF: ${error}`);
  }
}

/**
 * Add watermark to PDF
 */
export async function addWatermarkToPDF(
  pdfPath: string,
  watermarkText: string,
  outputPath: string
): Promise<string> {
  try {
    console.log(`[PDF Watermark] Adding watermark to PDF: ${watermarkText}`);
    
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const pages = pdfDoc.getPages();
    
    pages.forEach((page) => {
      const { width, height } = page.getSize();
      
      // Add diagonal watermark
      page.drawText(watermarkText, {
        x: width / 2 - 150,
        y: height / 2,
        size: 24,
        font: helveticaFont,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.5,
        rotate: { type: 'radians' as any, angle: Math.PI / 4 }
      });
      
      // Add header watermark
      page.drawText('PREVIEW ONLY', {
        x: width - 120,
        y: height - 30,
        size: 12,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
        opacity: 0.8
      });
    });
    
    const watermarkedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, watermarkedPdfBytes);
    
    console.log(`[PDF Watermark] Watermarked PDF saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('[PDF Watermark] Failed to add watermark:', error);
    throw new Error(`Failed to add watermark: ${error}`);
  }
}

/**
 * Get PDF metadata (page count, file size)
 */
export async function getPDFInfo(pdfPath: string): Promise<DocumentInfo> {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    const stat = await fs.stat(pdfPath);
    
    return {
      totalPages,
      previewPages: 0, // Will be calculated separately
      fileSize: stat.size
    };
  } catch (error) {
    console.error('[PDF Info] Failed to get PDF info:', error);
    throw new Error(`Failed to get PDF info: ${error}`);
  }
}

/**
 * Complete preview generation pipeline
 */
export async function generateDocumentPreview(
  fileBuffer: Buffer,
  fileName: string,
  userId: number,
  orderId: number,
  config: PreviewConfig = DEFAULT_PREVIEW_CONFIG
): Promise<PreviewResult> {
  const baseDir = `/tmp/pdf-previews/${userId}/${orderId}`;
  await fs.mkdir(baseDir, { recursive: true });
  
  const timestamp = Date.now();
  const baseName = path.parse(fileName).name;
  
  const fullPdfPath = `${baseDir}/${baseName}_full_${timestamp}.pdf`;
  const previewPdfPath = `${baseDir}/${baseName}_preview_${timestamp}.pdf`;
  const watermarkedPreviewPath = `${baseDir}/${baseName}_preview_watermarked_${timestamp}.pdf`;
  
  try {
    // Step 1: Convert to PDF
    await convertToPDF(fileBuffer, fileName, fullPdfPath);
    
    // Step 2: Get document info
    const pdfInfo = await getPDFInfo(fullPdfPath);
    const previewPages = calculatePreviewPages(pdfInfo.totalPages, config);
    
    // Step 3: Split PDF (with optional start page)
    const startPage = config.startPage || 1;
    await splitPDF(fullPdfPath, previewPages, previewPdfPath, startPage);
    
    // Step 4: Add watermark to preview
    const watermarkText = `${config.watermarkText}\nUser ID: ${userId} | Order: ${orderId}`;
    await addWatermarkToPDF(previewPdfPath, watermarkText, watermarkedPreviewPath);
    
    const result: PreviewResult = {
      previewPdfPath: watermarkedPreviewPath,
      fullPdfPath,
      documentInfo: {
        ...pdfInfo,
        previewPages
      },
      watermarkApplied: true
    };
    
    console.log(`[Preview Generator] Successfully generated preview for order ${orderId}`);
    return result;
  } catch (error) {
    console.error(`[Preview Generator] Failed to generate preview for order ${orderId}:`, error);
    
    // Cleanup on error
    try {
      await fs.rm(baseDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to cleanup preview files:', cleanupError);
    }
    
    throw error;
  }
}

