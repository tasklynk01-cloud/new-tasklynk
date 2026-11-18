import DOMPurify from 'isomorphic-dompurify';

/**
 * 🔒 INPUT SANITIZATION UTILITY
 * 
 * Provides secure input sanitization to prevent XSS attacks
 * Uses DOMPurify to clean HTML/text input from users
 * 
 * USAGE:
 * - sanitizeHTML: For rich text/HTML content
 * - sanitizeText: For plain text (strips all HTML)
 * - sanitizeInput: General-purpose input cleaning
 */

/**
 * Sanitize HTML content while preserving safe HTML tags
 * Use this for rich text editors or markdown content
 * 
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize text by stripping ALL HTML tags
 * Use this for plain text fields like names, titles, etc.
 * 
 * @param dirty - The potentially unsafe string
 * @returns Plain text with HTML stripped
 */
export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Strip all HTML tags and entities
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * General-purpose input sanitization
 * Removes dangerous characters and scripts
 * 
 * @param input - The potentially unsafe input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First pass: Remove HTML
  let cleaned = sanitizeText(input);

  // Second pass: Remove dangerous patterns
  cleaned = cleaned
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .trim();

  return cleaned;
}

/**
 * Sanitize an object's string properties recursively
 * Useful for sanitizing entire form submissions
 * 
 * @param obj - Object with potentially unsafe string values
 * @returns Object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      ) as any;
    }
  }

  return sanitized;
}

/**
 * Sanitize email addresses
 * Validates format and removes dangerous characters
 * 
 * @param email - Email address to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.trim().toLowerCase();

  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize file names
 * Removes path traversal attempts and dangerous characters
 * 
 * @param filename - The filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  return filename
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe characters
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

/**
 * Sanitize SQL-like input (additional layer of protection)
 * Note: This is NOT a replacement for parameterized queries
 * 
 * @param input - Input that might contain SQL injection attempts
 * @returns Sanitized string
 */
export function sanitizeSQLInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove common SQL injection patterns
  return input
    .replace(/[;'"\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '')
    .replace(/exec/gi, '')
    .replace(/execute/gi, '')
    .replace(/union/gi, '')
    .replace(/select/gi, '')
    .replace(/insert/gi, '')
    .replace(/update/gi, '')
    .replace(/delete/gi, '')
    .replace(/drop/gi, '')
    .trim();
}

/**
 * Validate and sanitize URL
 * Only allows http and https protocols
 * 
 * @param url - URL to validate and sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize phone number
 * Removes all non-numeric characters except + and spaces
 * 
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  return phone.replace(/[^0-9+\s()-]/g, '').trim();
}

