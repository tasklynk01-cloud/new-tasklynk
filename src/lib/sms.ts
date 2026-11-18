// SMS Verification Service using Africa's Talking API
// Alternative to email verification for Kenyan users

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Africa's Talking configuration
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox';
const AT_API_URL = 'https://api.africastalking.com/version1/messaging';

/**
 * Send SMS verification code via Africa's Talking
 * @param phoneNumber - Phone number in format +254XXXXXXXXX
 * @param code - 6-digit verification code
 * @returns Promise with success status and messageId
 */
export async function sendVerificationSMS(
  phoneNumber: string,
  code: string
): Promise<SMSResponse> {
  if (!AT_API_KEY) {
    console.error('❌ [SMS] AFRICASTALKING_API_KEY not configured');
    return { 
      success: false, 
      error: 'SMS service not configured. Contact support.' 
    };
  }

  // Normalize phone number (ensure +254 format)
  let normalizedPhone = phoneNumber.trim();
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+254' + normalizedPhone.slice(1);
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+254' + normalizedPhone;
  }

  // Validate Kenyan phone number
  const kenyanPhoneRegex = /^\+254[17]\d{8}$/;
  if (!kenyanPhoneRegex.test(normalizedPhone)) {
    console.error('❌ [SMS] Invalid phone number format:', normalizedPhone);
    return {
      success: false,
      error: 'Invalid phone number. Use format: +254712345678 or 0712345678'
    };
  }

  const message = `Your TaskLynk verification code is: ${code}. Valid for 15 minutes. Do not share this code with anyone.`;

  try {
    console.log('[SMS] Sending verification code:', {
      to: normalizedPhone,
      code: code,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(AT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_API_KEY,
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: normalizedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [SMS] Africa\'s Talking API error:', {
        status: response.status,
        error: errorText,
        phone: normalizedPhone
      });
      return {
        success: false,
        error: `SMS delivery failed: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('[SMS] Verification code sent successfully:', {
      messageId: data.SMSMessageData?.Recipients?.[0]?.messageId,
      phone: normalizedPhone,
      status: data.SMSMessageData?.Recipients?.[0]?.status,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: data.SMSMessageData?.Recipients?.[0]?.messageId || 'unknown'
    };
  } catch (error) {
    console.error('❌ [SMS] Network or API error:', {
      error,
      phone: normalizedPhone,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS sending failed'
    };
  }
}

/**
 * Send SMS notification (generic)
 * @param phoneNumber - Phone number in format +254XXXXXXXXX
 * @param message - Message to send (max 160 chars for single SMS)
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSResponse> {
  if (!AT_API_KEY) {
    console.error('❌ [SMS] AFRICASTALKING_API_KEY not configured');
    return { 
      success: false, 
      error: 'SMS service not configured' 
    };
  }

  // Normalize phone number
  let normalizedPhone = phoneNumber.trim();
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+254' + normalizedPhone.slice(1);
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+254' + normalizedPhone;
  }

  try {
    console.log('[SMS] Sending notification:', {
      to: normalizedPhone,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(AT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_API_KEY,
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: normalizedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [SMS] API error:', errorText);
      return {
        success: false,
        error: `SMS delivery failed: ${errorText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.SMSMessageData?.Recipients?.[0]?.messageId || 'unknown'
    };
  } catch (error) {
    console.error('❌ [SMS] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS sending failed'
    };
  }
}

/**
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return !!AT_API_KEY && !!AT_USERNAME;
}

/**
 * Get SMS service status for diagnostics
 */
export function getSMSServiceStatus() {
  return {
    configured: isSMSConfigured(),
    apiKey: AT_API_KEY ? `${AT_API_KEY.slice(0, 10)}...` : 'Not set',
    username: AT_USERNAME,
    provider: 'Africa\'s Talking'
  };
}

