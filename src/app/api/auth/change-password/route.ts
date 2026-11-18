import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendEmail, getPasswordChangeConfirmationHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // Validation
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!currentPassword) {
      return NextResponse.json({ 
        error: 'Current password is required',
        code: 'MISSING_CURRENT_PASSWORD' 
      }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ 
        error: 'New password is required',
        code: 'MISSING_NEW_PASSWORD' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT' 
      }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ 
        error: 'New password must be different from current password',
        code: 'SAME_PASSWORD' 
      }, { status: 400 });
    }


    // Find user
    const userResult = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const user: any = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, String(user.password));
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD' 
      }, { status: 401 });
    }


    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const now = new Date().toISOString();
    await db.execute(sql`UPDATE users SET password = ${hashedPassword}, updated_at = ${now} WHERE id = ${userId}`);


    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Changed Successfully - TaskLynk',
        html: getPasswordChangeConfirmationHTML(user.name)
      });
    } catch (emailError) {
      console.error('[Change Password] Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

