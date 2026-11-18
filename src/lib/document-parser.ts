/**
 * Document Text Extraction Utilities
 * 
 * Provides functions to extract text content from various document formats
 * for preview generation and content segmentation.
 */

import mammoth from 'mammoth';

/**
 * Extract text from DOCX file buffer
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Failed to extract text from DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Extract text from PDF file buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Import pdf-parse - v2 exports default function
    const pdfParse = (await import('pdf-parse') as any).default || (await import('pdf-parse'));
    
    // Parse PDF with buffer
    const data = await pdfParse(buffer);
    const text = data.text || '';
    
    if (!text.trim()) {
      return '[PDF contains no extractable text content. This may be an image-based PDF or scanned document.]';
    }
    
    return text;
  } catch (error) {
    console.error('Failed to extract text from PDF:', error);
    // Return a user-friendly message instead of throwing
    return '[Unable to extract text from this PDF. The file may be image-based, encrypted, or corrupted. Please download to view full content.]';
  }
}

/**
 * Fetch file from Cloudinary URL and extract text
 */
export async function extractTextFromCloudinary(fileUrl: string, fileType: string): Promise<string> {
  try {
    console.log(`[Document Parser] Fetching file from Cloudinary: ${fileUrl}`);
    
    // Fetch file from Cloudinary
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(`[Document Parser] Failed to fetch from Cloudinary - Status: ${response.status}`);
      throw new Error(`Failed to fetch file from Cloudinary (status: ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[Document Parser] File fetched successfully, size: ${buffer.length} bytes`);

    // Extract text based on file type
    const normalizedType = fileType.toLowerCase();
    
    if (normalizedType.includes('docx') || normalizedType.includes('word') || normalizedType.includes('document')) {
      console.log('[Document Parser] Extracting text from DOCX');
      return await extractTextFromDOCX(buffer);
    } else if (normalizedType.includes('pdf') || normalizedType.includes('application/pdf')) {
      console.log('[Document Parser] Extracting text from PDF');
      return await extractTextFromPDF(buffer);
    } else {
      console.log(`[Document Parser] Unsupported file type: ${fileType}`);
      // For other file types, return a placeholder
      return `[Text preview not available for ${fileType} files. Please download to view full content.]`;
    }
  } catch (error) {
    console.error('[Document Parser] Failed to extract text from Cloudinary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Return user-friendly error message instead of throwing
    return `[Unable to load document preview: ${errorMessage}]`;
  }
}

/**
 * Segment text content by percentage with optional skip from start
 * Returns visible portion and metadata
 * @param skipStartPercentage - Percentage of content to skip from the start (e.g., 10 = skip first 10%)
 */
export function segmentTextContent(
  fullText: string,
  percentage: number,
  skipStartPercentage: number = 0
): {
  visible: string;
  hidden: string;
  totalWords: number;
  visibleWords: number;
  hiddenWords: number;
  visibleCharacters: number;
  totalCharacters: number;
} {
  // Split into words (handling multiple whitespace)
  const words = fullText.split(/\s+/).filter(word => word.length > 0);
  const totalWords = words.length;
  
  // Calculate skip count (to simulate skipping first page)
  const skipWordCount = Math.floor(totalWords * (skipStartPercentage / 100));
  
  // Calculate visible word count from remaining words
  const remainingWords = totalWords - skipWordCount;
  const visibleWordCount = Math.floor(remainingWords * (percentage / 100));
  
  // Extract word segments
  const skippedWords = words.slice(0, skipWordCount);
  const visibleWords = words.slice(skipWordCount, skipWordCount + visibleWordCount);
  const hiddenWords = words.slice(skipWordCount + visibleWordCount);
  
  // Reconstruct text segments
  const skippedText = skippedWords.join(' ');
  const visibleText = visibleWords.join(' ');
  const hiddenText = hiddenWords.join(' ');
  
  return {
    visible: visibleText,
    hidden: hiddenText,
    totalWords,
    visibleWords: visibleWords.length,
    hiddenWords: hiddenWords.length + skippedWords.length,
    visibleCharacters: visibleText.length,
    totalCharacters: fullText.length,
  };
}

/**
 * Clean and normalize extracted text
 * Removes excessive whitespace, special characters, etc.
 */
export function cleanDocumentText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]{2,}/g, ' ') // Remove excessive spaces
    .trim();
}

/**
 * Generate document preview with metadata
 * @param skipStartPercentage - Percentage to skip from start (for POD clients to skip page 1)
 */
export async function generateDocumentPreview(
  fileUrl: string,
  fileType: string,
  previewPercentage: number = 20,
  skipStartPercentage: number = 0
): Promise<{
  fullText: string;
  previewText: string;
  metadata: {
    totalWords: number;
    visibleWords: number;
    totalCharacters: number;
    visibleCharacters: number;
    previewPercentage: number;
    skipStartPercentage: number;
  };
}> {
  // Extract full text
  const rawText = await extractTextFromCloudinary(fileUrl, fileType);
  const fullText = cleanDocumentText(rawText);
  
  // Segment content (with optional skip from start)
  const segmented = segmentTextContent(fullText, previewPercentage, skipStartPercentage);
  
  return {
    fullText,
    previewText: segmented.visible,
    metadata: {
      totalWords: segmented.totalWords,
      visibleWords: segmented.visibleWords,
      totalCharacters: segmented.totalCharacters,
      visibleCharacters: segmented.visibleCharacters,
      previewPercentage,
      skipStartPercentage,
    },
  };
}

/**
 * Check if file type supports text extraction
 */
export function supportsTextExtraction(fileType: string): boolean {
  const normalizedType = fileType.toLowerCase();
  return (
    normalizedType.includes('docx') ||
    normalizedType.includes('word') ||
    normalizedType.includes('document') ||
    normalizedType.includes('pdf') ||
    normalizedType.includes('application/pdf') ||
    normalizedType === 'pdf'
  );
}

