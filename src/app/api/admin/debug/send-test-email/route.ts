import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/admin/debug/send-test-email
 * 
 * Admin-only endpoint to send a test email
 * Useful for debugging email delivery issues
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { to } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid recipient email address is required',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    console.log(`🧪 [Test Email] Admin ${authCheck.user?.email} sending test to: ${to}`);

    const timestamp = new Date().toISOString();
    const result = await sendEmail({
      to,
      subject: `TaskLynk Resend Test - ${timestamp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <div style="background: #1e3a8a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">TaskLynk Email Test</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>This is a test email from the TaskLynk platform.</p>
            <p><strong>Sent by:</strong> ${authCheck.user?.email}</p>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #22c55e; font-weight: bold;">✅ If you received this email, Resend is working correctly!</p>
            <p style="color: #6b7280; font-size: 12px;">
              FROM_EMAIL: ${process.env.FROM_EMAIL || 'NOT SET'}
            </p>
          </div>
        </div>
      `,
    });

    if (result.success) {
      console.log(`✅ [Test Email] Sent successfully, messageId: ${result.messageId}`);
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        messageId: result.messageId,
        timestamp,
      });
    } else {
      console.error(`❌ [Test Email] Failed:`, result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test email',
        smtpConfig: {
          host: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
          port: process.env.SMTP_PORT || 'NOT SET',
          user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
          password: process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET',
        },
        troubleshooting: [
          'Verify SMTP environment variables are set in Render Dashboard',
          'Check if the mail server is reachable from Render servers',
          'Try switching between port 587 (TLS) and 465 (SSL)',
          'Ensure the sender email matches the SMTP account',
        ],
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Test Email] Exception:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error.message,
    }, { status: 500 });
  }
}

