import { NextRequest, NextResponse } from 'next/server';
import { registerDarajaC2BUrls } from '@/lib/mpesa-service';
import { requireAdminRole } from '@/lib/admin-auth';

/**
 * POST /api/payments/mpesa/c2b/register
 * Admin endpoint to register C2B v2 URLs with Safaricom Daraja
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await requireAdminRole(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status || 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { shortcode, validationUrl, confirmationUrl, responseType } = body;

    console.log('[M-Pesa C2B Register] Registering URLs with Safaricom...');
    const result = await registerDarajaC2BUrls({
      shortcode,
      validationUrl,
      confirmationUrl,
      responseType,
    });

    console.log('[M-Pesa C2B Register] ✓ Safaricom registration result:', result);

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      originatorConversationId: result.originatorConversationId,
      responseDescription: result.responseDescription,
    });
  } catch (error: any) {
    console.error('[M-Pesa C2B Register] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to register C2B URLs with Safaricom',
    }, { status: 500 });
  }
}
