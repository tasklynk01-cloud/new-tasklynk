import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, getEmailVerificationHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL' 
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find pending registration
    const pending = await db.select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, normalizedEmail))
      .limit(1);

    if (pending.length === 0) {
      return NextResponse.json({ 
        error: 'No pending registration found for this email',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const registration = pending[0];

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update expiration (15 minutes from now)
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Update pending registration with new code
    await db.update(pendingRegistrations)
      .set({
        verificationCode,
        codeExpiresAt,
      })
      .where(eq(pendingRegistrations.email, normalizedEmail));

    // Send verification email
    try {
      console.log('[Email Config]', {
        resendConfigured: process.env.RESEND_API_KEY ? 'Yes' : 'No',
      });

      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: 'Verify Your Email - TaskLynk Academic',
        html: getEmailVerificationHTML(registration.name, verificationCode),
        category: 'registration',
      });
      
      if (!emailResult.success) {
        console.error('❌ [Send-Verification] Email sending failed:', {
          email: normalizedEmail,
          error: emailResult.error,
          errorMessage: emailResult.error instanceof Error ? emailResult.error.message : 'Unknown',
          errorCode: (emailResult.error as any)?.code,
        });
        
        // Still return success to user (code is saved in DB)
        // This prevents blocking user flow if email fails
        return NextResponse.json({ 
          success: true,
          message: 'Verification code generated. If you don\'t receive an email, please contact support.',
          warning: 'Email delivery may be delayed',
          code: verificationCode, // Include code in response for development debugging
        }, { status: 200 });
      }
      
      console.log('[Send-Verification] Email sent successfully:', {
        email: normalizedEmail,
        messageId: emailResult.messageId
      });
    } catch (emailError) {
      console.error('❌ [Send-Verification] Email exception:', {
        email: normalizedEmail,
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Unknown',
        stack: emailError instanceof Error ? emailError.stack : undefined,
      });
      
      // Still return success to user (code is saved in DB)
      return NextResponse.json({ 
        success: true,
        message: 'Verification code generated. If you don\'t receive an email, please contact support.',
        warning: 'Email service temporarily unavailable',
        code: verificationCode, // Include code in response for development debugging
      }, { status: 200 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'New verification code sent to your email'
    }, { status: 200 });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

