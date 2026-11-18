import { customAlphabet } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🔐 SECURE ID GENERATION UTILITIES
 * 
 * Provides multiple ID generation strategies:
 * - UUIDs for maximum security
 * - Short IDs for user-friendly displays
 * - Random alphanumeric codes
 */

/**
 * Generate UUID v4 (128-bit random)
 * Example: "550e8400-e29b-41d4-a716-446655440000"
 * Use for: Database primary keys, API tokens, session IDs
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate short, URL-safe ID (21 characters)
 * Example: "V1StGXR8_Z5jdHi6B-myT"
 * Use for: Short URLs, public-facing IDs, shareable links
 */
export function generateShortId(length: number = 21): string {
  const nanoid = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    length
  );
  return nanoid();
}

/**
 * Generate secure random display ID with prefix
 * Example: "USR-K7M2P9X4", "CLT-R8N3Z5A1"
 * Use for: User-facing identifiers, invoice numbers, order IDs
 * 
 * @param prefix - Role-based prefix (USR, CLT, FRL, etc.)
 * @param length - Length of random part (default 8)
 */
export function generateRandomDisplayId(prefix: string = 'USR', length: number = 8): string {
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', length);
  return `${prefix}-${nanoid()}`;
}

/**
 * Generate secure random code (numeric only)
 * Example: "384729" (6 digits), "8472938572" (10 digits)
 * Use for: Verification codes, OTPs, PIN numbers
 * 
 * @param length - Length of numeric code (default 6)
 */
export function generateNumericCode(length: number = 6): string {
  const nanoid = customAlphabet('0123456789', length);
  return nanoid();
}

/**
 * Generate alphanumeric token (no special characters)
 * Example: "A4K9P2X7M3N1", "B8F5Q6W2Z9"
 * Use for: API keys, access tokens, temp passwords
 * 
 * @param length - Length of token (default 16)
 */
export function generateAlphanumericToken(length: number = 16): string {
  const nanoid = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    length
  );
  return nanoid();
}

/**
 * Generate secure random hex string
 * Example: "a4f3c9d2e1b6" (12 hex chars = 48 bits)
 * Use for: Cryptographic operations, tokens
 * 
 * @param bytes - Number of bytes (default 16 = 128 bits)
 */
export function generateHexToken(bytes: number = 16): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate user display ID with role-based prefix
 * SECURE VERSION - uses random alphanumeric instead of sequential numbers
 * 
 * @param role - User role ('admin', 'client', 'freelancer', 'manager')
 * @returns Random display ID like "CLT-K7M2P9X4"
 */
export function generateSecureUserDisplayId(role: string): string {
  const prefixMap: Record<string, string> = {
    admin: 'ADMN',
    client: 'CLT',
    account_owner: 'CLT',
    freelancer: 'FRL',
    manager: 'MGR',
    editor: 'EDT',
    writer: 'WRT'
  };

  const prefix = prefixMap[role] || 'USR';
  return generateRandomDisplayId(prefix, 8);
}

/**
 * Generate job/order display ID
 * SECURE VERSION - uses random alphanumeric instead of year-based counter
 * 
 * @returns Random job ID like "ORD-2025-R8N3Z5A1"
 */
export function generateSecureJobDisplayId(): string {
  const year = new Date().getFullYear();
  const randomPart = generateShortId(8).toUpperCase();
  return `ORD-${year}-${randomPart}`;
}

/**
 * Collision probability calculator
 * 
 * With 8 characters from 36-character alphabet (0-9, A-Z):
 * - Total combinations: 36^8 = 2,821,109,907,456 (2.8 trillion)
 * - 1 million users: 0.000035% collision chance
 * - 10 million users: 0.00035% collision chance
 * 
 * This is more secure than sequential IDs and UUID-comparable for practical use.
 */
export const COLLISION_STATS = {
  alphabetSize: 36,
  idLength: 8,
  totalCombinations: Math.pow(36, 8),
  collisionAt1M: '0.000035%',
  collisionAt10M: '0.00035%'
};

/**
 * Validate display ID format
 * 
 * @param displayId - Display ID to validate
 * @param expectedPrefix - Expected prefix (optional)
 * @returns true if valid format
 */
export function isValidDisplayId(displayId: string, expectedPrefix?: string): boolean {
  const pattern = /^[A-Z]{3,4}-[A-Z0-9]{8}$/;
  
  if (!pattern.test(displayId)) {
    return false;
  }

  if (expectedPrefix) {
    return displayId.startsWith(expectedPrefix + '-');
  }

  return true;
}

/**
 * Example usage:
 * 
 * // User registration
 * const displayId = generateSecureUserDisplayId('client');
 * // Result: "CLT-K7M2P9X4"
 * 
 * // Job creation
 * const jobId = generateSecureJobDisplayId();
 * // Result: "ORD-2025-R8N3Z5A1"
 * 
 * // UUID for database
 * const uuid = generateUUID();
 * // Result: "550e8400-e29b-41d4-a716-446655440000"
 * 
 * // Verification code
 * const code = generateNumericCode(6);
 * // Result: "384729"
 */

