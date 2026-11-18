import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/mpesa/c2b/validation
 * Public endpoint called by Safaricom to validate direct C2B till payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log('[M-Pesa C2B Validation] Incoming validation request:', JSON.stringify(body).slice(0, 200));

    // Accept by default to allow customer payment to proceed
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  } catch (error: any) {
    console.error('[M-Pesa C2B Validation] Error:', error);
    // Return accepted so Safaricom doesn't reject customer payment due to server glitch
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
}
