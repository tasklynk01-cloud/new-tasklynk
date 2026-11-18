import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, TASKLYNK_EMAILS } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
    }

    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1D3557;">TaskLynk Email Test</h1>
        <p>This is a test email from TaskLynk Academic Platform.</p>
        <p>If you received this, the email system is working correctly!</p>
        <p style="color: #666; margin-top: 20px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `;

    const adminResult = await sendEmail({
      to,
      subject: 'TaskLynk Test Email - From Admin',
      html: testHtml,
      from: `TaskLynk Admin <${TASKLYNK_EMAILS.admin}>`,
    });

    const supportResult = await sendEmail({
      to,
      subject: 'TaskLynk Test Email - From Support',
      html: testHtml,
      from: `TaskLynk Support <${TASKLYNK_EMAILS.support}>`,
    });

    return NextResponse.json({
      admin: {
        from: TASKLYNK_EMAILS.admin,
        success: adminResult.success,
        messageId: adminResult.messageId,
        error: adminResult.error,
      },
      support: {
        from: TASKLYNK_EMAILS.support,
        success: supportResult.success,
        messageId: supportResult.messageId,
        error: supportResult.error,
      },
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

