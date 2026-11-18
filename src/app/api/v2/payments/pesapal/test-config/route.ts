import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { getAccessToken, getPesapalConfig } from '@/lib/pesapal'

/**
 * GET /api/v2/payments/pesapal/test-config
 * 
 * Test Pesapal configuration and credentials
 * Only accessible by admin
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }

  try {
    const config = getPesapalConfig()
    
    // Test 1: Check environment variables
    const checks = {
      hasBaseUrl: !!config.BASE_URL,
      baseUrl: config.BASE_URL,
      hasConsumerKey: !!config.CONSUMER_KEY,
      consumerKeyPreview: config.CONSUMER_KEY ? `${config.CONSUMER_KEY.substring(0, 8)}...` : 'MISSING',
      hasConsumerSecret: !!config.CONSUMER_SECRET,
      consumerSecretPreview: config.CONSUMER_SECRET ? '***...***' : 'MISSING',
      hasIpnId: !!config.IPN_ID,
      ipnId: config.IPN_ID || 'MISSING',
      hasWebhookSecret: !!config.WEBHOOK_SECRET,
      appUrl: config.APP_URL,
    }

    // Test 2: Try to get access token
    let tokenTest = null
    let tokenError = null
    try {
      const token = await getAccessToken()
      tokenTest = {
        success: true,
        status: token.status,
        expiryDate: token.expiryDate,
        tokenPreview: token.token ? `${token.token.substring(0, 20)}...` : 'MISSING',
      }
    } catch (error: any) {
      tokenError = {
        success: false,
        error: error.message,
        details: error.stack,
      }
    }

    // Test 3: Check IPN registration
    const ipnStatus = {
      ipnId: config.IPN_ID,
      expectedIpnUrl: `${config.APP_URL}/api/v2/payments/pesapal/ipn`,
      expectedCallbackUrl: `${config.APP_URL}/api/v2/payments/pesapal/callback`,
    }

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      configuration: checks,
      authenticationTest: tokenTest || tokenError,
      ipnConfiguration: ipnStatus,
      recommendations: [
        !checks.hasConsumerKey && 'Set PESAPAL_CONSUMER_KEY in .env',
        !checks.hasConsumerSecret && 'Set PESAPAL_CONSUMER_SECRET in .env',
        !checks.hasIpnId && 'Set PESAPAL_IPN_ID in .env (register IPN at Pesapal dashboard)',
        !checks.hasWebhookSecret && 'Set PESAPAL_WEBHOOK_SECRET in .env for webhook validation',
        tokenError && `Authentication failed: ${tokenError.error}`,
      ].filter(Boolean),
    })
  } catch (error: any) {
    console.error('[Pesapal Config Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

