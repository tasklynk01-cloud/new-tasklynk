import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, getPasswordResetEmailHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ success: true, message: 'If an account exists with that email, a password reset link has been sent.' }, { status: 200 });
    }

    const user = userResult[0];

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.userId, user.id));
    await db.insert(passwordResetTokens).values({ userId: user.id, token: hashedToken, expiresAt, used: false, createdAt: new Date().toISOString() });

    const resetLink = `https://tasklynk.co.ke/reset-password?token=${token}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset Your TaskLynk Password - System Update',
      html: getPasswordResetEmailHTML(user.name, token),
      category: 'system',
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Failed to send password reset email', details: emailResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent.', messageId: emailResult.messageId }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Reset] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
