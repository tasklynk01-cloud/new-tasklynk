/**
 * 🔐 TWO-FACTOR AUTHENTICATION (2FA) UTILITY
 * 
 * Implements TOTP (Time-based One-Time Password) authentication for admin accounts
 * Uses speakeasy for TOTP generation/verification and qrcode for setup QR codes
 * 
 * SECURITY FEATURES:
 * - TOTP with 30-second time window
 * - 6-digit codes
 * - Backup codes for account recovery (10 codes)
 * - QR code generation for easy setup with authenticator apps
 * - Encrypted secret storage
 * 
 * SUPPORTED AUTHENTICATOR APPS:
 * - Google Authenticator
 * - Microsoft Authenticator
 * - Authy
 * - 1Password
 * - Any TOTP-compatible app
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const APP_NAME = 'TaskLynk';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  usedBackupCode?: boolean;
}

/**
 * Generate a new 2FA secret and setup data
 * 
 * @param userEmail - User's email for QR code label
 * @returns Setup data including secret, QR code, and backup codes
 */
export async function generateTwoFactorSecret(userEmail: string): Promise<TwoFactorSetup> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${userEmail})`,
    issuer: APP_NAME,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate 2FA secret');
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey: secret.base32,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 * 
 * @param secret - User's 2FA secret (base32)
 * @param token - 6-digit code from authenticator app
 * @param window - Time window (default 1 = 30 seconds before/after)
 * @returns Whether the token is valid
 */
export function verifyTwoFactorToken(
  secret: string,
  token: string,
  window: number = 1
): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''), // Remove any spaces
      window, // Allow 1 time step before/after current time
    });
  } catch (error) {
    console.error('2FA token verification error:', error);
    return false;
  }
}

/**
 * Verify a backup code
 * 
 * @param providedCode - Code provided by user
 * @param storedCodes - JSON string of stored backup codes
 * @returns Object with validation result and remaining codes
 */
export function verifyBackupCode(
  providedCode: string,
  storedCodes: string
): { isValid: boolean; remainingCodes?: string[] } {
  try {
    const codes: string[] = JSON.parse(storedCodes);
    const normalizedProvidedCode = providedCode.replace(/\s/g, '').toLowerCase();

    // Find matching code
    const codeIndex = codes.findIndex(
      (code) => code.toLowerCase() === normalizedProvidedCode
    );

    if (codeIndex === -1) {
      return { isValid: false };
    }

    // Remove used code
    const remainingCodes = codes.filter((_, index) => index !== codeIndex);

    return {
      isValid: true,
      remainingCodes,
    };
  } catch (error) {
    console.error('Backup code verification error:', error);
    return { isValid: false };
  }
}

/**
 * Verify 2FA code (checks both TOTP and backup codes)
 * 
 * @param secret - User's 2FA secret
 * @param token - Code provided by user
 * @param backupCodes - JSON string of backup codes (optional)
 * @returns Verification result with remaining backup codes if used
 */
export function verifyTwoFactor(
  secret: string,
  token: string,
  backupCodes?: string | null
): TwoFactorVerification & { remainingCodes?: string[] } {
  // First try TOTP
  if (verifyTwoFactorToken(secret, token)) {
    return { isValid: true, usedBackupCode: false };
  }

  // If TOTP fails and backup codes exist, try backup code
  if (backupCodes) {
    const backupResult = verifyBackupCode(token, backupCodes);
    if (backupResult.isValid) {
      return {
        isValid: true,
        usedBackupCode: true,
        remainingCodes: backupResult.remainingCodes,
      };
    }
  }

  return { isValid: false };
}

/**
 * Generate cryptographically secure backup codes
 * 
 * @param count - Number of codes to generate (default 10)
 * @returns Array of backup codes in format XXXX-XXXX
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8 random characters (4-4 format)
    const randomBytes = crypto.randomBytes(4);
    const code = randomBytes.toString('hex').toUpperCase();
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formattedCode);
  }

  return codes;
}

/**
 * Encrypt 2FA secret for database storage
 * Uses AES-256-GCM encryption
 * 
 * @param secret - Secret to encrypt
 * @param encryptionKey - Encryption key (from env)
 * @returns Encrypted secret with IV
 */
export function encryptSecret(secret: string, encryptionKey: string): string {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Secret encryption error:', error);
    throw new Error('Failed to encrypt secret');
  }
}

/**
 * Decrypt 2FA secret from database storage
 * 
 * @param encryptedData - Encrypted secret with IV
 * @param encryptionKey - Encryption key (from env)
 * @returns Decrypted secret
 */
export function decryptSecret(encryptedData: string, encryptionKey: string): string {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);

    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Secret decryption error:', error);
    throw new Error('Failed to decrypt secret');
  }
}

/**
 * Generate new backup codes when existing ones are exhausted
 * 
 * @returns Array of new backup codes
 */
export function regenerateBackupCodes(): string[] {
  return generateBackupCodes(10);
}

/**
 * Check if user should regenerate backup codes (less than 3 remaining)
 * 
 * @param backupCodes - JSON string of current backup codes
 * @returns Whether user should regenerate codes
 */
export function shouldRegenerateBackupCodes(backupCodes: string | null): boolean {
  if (!backupCodes) return true;

  try {
    const codes: string[] = JSON.parse(backupCodes);
    return codes.length < 3;
  } catch {
    return true;
  }
}

