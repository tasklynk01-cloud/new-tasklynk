/**
 * Kenyan phone number validation utility
 * Valid formats:
 * - 07XXXXXXXX (any 07X prefix - Safaricom, Airtel, Telkom)
 * - 01XXXXXXXX (any 01X prefix - alternative numbers)
 * - +2547XXXXXXXX or +2541XXXXXXXX (international format)
 */

export function validateKenyanPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.trim().replace(/[\s-()]/g, '');

  // Check for local format: 07 or 01 followed by 8 digits (10 digits total)
  const localPattern = /^0[17]\d{8}$/;
  
  // Check for international format: +254 7 or 1 followed by 8 digits
  const internationalPattern = /^\+254[17]\d{8}$/;

  if (localPattern.test(cleaned)) {
    return { valid: true };
  }

  if (internationalPattern.test(cleaned)) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid phone number' };
}

export function normalizeKenyanPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.trim().replace(/[\s-()]/g, '');
  
  // If it's a local format (starts with 0), convert to international
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254${cleaned.slice(1)}`;
  }
  
  // If it starts with 254 but no +, add +
  if (cleaned.startsWith('254') && !cleaned.startsWith('+254')) {
    return `+${cleaned}`;
  }
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+') && cleaned.length > 0) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Helper for optional phone fields. When the field is empty it returns valid=true
 * so optional inputs don't block submission. When provided, it validates and
 * normalizes the number into +254 format for consistent storage.
 */
export function validateOptionalKenyanPhone(
  phone?: string | null
): { valid: boolean; normalized: string | null; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: true, normalized: null };
  }

  const validation = validateKenyanPhone(phone);
  if (!validation.valid) {
    return { valid: false, normalized: null, error: validation.error };
  }

  return {
    valid: true,
    normalized: normalizeKenyanPhone(phone),
  };
}


