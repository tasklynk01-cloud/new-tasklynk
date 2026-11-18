import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * Test Email Endpoint
 * 
 * Tests email configuration and sends a test email
 * 
 * Usage:
 * POST /api/test/email
 * Body: { "to": "test@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json({
        error: 'Email address required',
        usage: 'POST /api/test/email with body: { "to": "your@email.com" }'
      }, { status: 400 });
    }

    // Check environment variables
    const config = {
      provider: 'Resend',
      resendApiKey: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
      fromEmail: process.env.FROM_EMAIL ? '✅ Configured' : '❌ Missing',
    };


    // Send test email
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #1e3a8a;">TaskLynk Email Test</h1>
            <p>This is a test email from TaskLynk Academic.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Sent to:</strong> ${to}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              If you received this email, your email system is working correctly! ✅
            </p>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to,
      subject: 'TaskLynk Email System Test',
      html: testHtml,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        sentTo: to,
        config,
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: result.error,
        config,
        troubleshooting: {
          resendKey: 'Check RESEND_API_KEY is set correctly',
          resendDomain: 'Ensure FROM_EMAIL uses a domain verified in your Resend account',
          vercel: 'Ensure environment variables are set in Vercel dashboard',
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check email configuration without sending
 */
export async function GET() {
  const config = {
    provider: 'Resend',
    resendApiKey: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
    fromEmail: process.env.FROM_EMAIL ? `✅ ${process.env.FROM_EMAIL}` : '❌ Missing',
    nodeEnv: process.env.NODE_ENV || 'Not set',
  };

  const isConfigured = !!process.env.RESEND_API_KEY;

  return NextResponse.json({
    configured: isConfigured ? '✅ Yes' : '❌ No',
    config,
    recommendation: !isConfigured
      ? 'Set RESEND_API_KEY (and FROM_EMAIL) for email delivery'
      : 'Resend configured ✅',
    usage: 'POST /api/test/email with body: { "to": "your@email.com" } to send test email',
    troubleshooting: {
      apiKey: 'Get an API key from https://resend.com/api-keys',
      domain: 'FROM_EMAIL must use a domain verified in your Resend account (or onboarding@resend.dev for testing)',
      logs: 'Check your hosting provider logs for detailed Resend debug output'
    }
  }, { status: 200 });
}

