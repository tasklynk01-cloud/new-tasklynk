import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, passwordResetTokens, emailLogs } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { getAccountActivationEmailHTML } from '@/lib/email-templates';

const DAILY_EMAIL_LIMIT = 100;

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { sentBy, fromEmail, recipientType, role } = body;

    if (!sentBy || typeof sentBy !== 'number') {
      return NextResponse.json({ error: 'sentBy is required', code: 'MISSING_SENT_BY' }, { status: 400 });
    }

    if (!fromEmail || typeof fromEmail !== 'string') {
      return NextResponse.json({ error: 'fromEmail is required', code: 'MISSING_FROM_EMAIL' }, { status: 400 });
    }

    if (!recipientType || !['freelancers', 'clients', 'all_users', 'role'].includes(recipientType)) {
      return NextResponse.json({ error: 'recipientType must be freelancers, clients, all_users, or role', code: 'INVALID_RECIPIENT_TYPE' }, { status: 400 });
    }

    if (recipientType === 'role' && !role) {
      return NextResponse.json({ error: 'role is required when recipientType is role', code: 'MISSING_ROLE' }, { status: 400 });
    }

    const [adminUser] = await db.select().from(users).where(eq(users.id, sentBy)).limit(1);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin users can send bulk emails', code: 'FORBIDDEN_NOT_ADMIN' }, { status: 403 });
    }

    let targetUsers: any[] = [];
    if (recipientType === 'freelancers') {
      targetUsers = await db.select().from(users).where(and(eq(users.role, 'freelancer'), eq(users.approved, true)));
    } else if (recipientType === 'clients') {
      targetUsers = await db.select().from(users).where(and(eq(users.role, 'client'), eq(users.approved, true)));
    } else if (recipientType === 'all_users') {
      targetUsers = await db.select().from(users).where(eq(users.approved, true));
    } else if (recipientType === 'role') {
      targetUsers = await db.select().from(users).where(and(eq(users.role, role), eq(users.approved, true)));
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No approved users found for the selected recipient type', code: 'NO_RECIPIENTS_FOUND' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const emailsSentToday = await db.select({ totalSent: sql<number>`COALESCE(SUM(${emailLogs.recipientCount}), 0)` }).from(emailLogs).where(gte(emailLogs.createdAt, todayStart.toISOString()));
    const currentDailyCount = Number(emailsSentToday[0]?.totalSent || 0);
    const remainingQuota = DAILY_EMAIL_LIMIT - currentDailyCount;

    if (targetUsers.length > remainingQuota) {
      return NextResponse.json({
        error: `Daily email limit exceeded. You can send ${remainingQuota} more emails today.`,
        code: 'DAILY_LIMIT_EXCEEDED',
        data: { limit: DAILY_EMAIL_LIMIT, used: currentDailyCount, remaining: remainingQuota, requested: targetUsers.length }
      }, { status: 429 });
    }

    const failedRecipients: { email: string; name: string; error: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const user of targetUsers) {
      try {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.userId, user.id));
        await db.insert(passwordResetTokens).values({ userId: user.id, token: hashedToken, expiresAt, used: false, createdAt: new Date().toISOString() });

        const resetUrl = `https://tasklynk.co.ke/reset-password?token=${token}`;
        const html = getAccountActivationEmailHTML(user.name, user.role, resetUrl);

        await sendEmail({
          to: user.email,
          from: fromEmail,
          subject: `Activate Your TaskLynk ${user.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Account`,
          html,
          category: 'registration',
        });

        successCount++;
      } catch (error) {
        failedCount++;
        failedRecipients.push({
          email: user.email,
          name: user.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    let status: 'sent' | 'failed' | 'partial' = 'sent';
    if (failedCount > 0 && successCount === 0) status = 'failed';
    else if (failedCount > 0) status = 'partial';

    const emailLogData: any = {
      sentBy,
      sentTo: targetUsers.map(u => u.email).join(', '),
      recipientType: recipientType === 'role' ? `role_${role}` : recipientType,
      recipientCount: targetUsers.length,
      fromEmail,
      subject: `Activation emails sent to ${recipientType}`,
      body: '',
      status,
      failedRecipients: failedRecipients.length > 0 ? JSON.stringify(failedRecipients) : null,
      jobId: null,
      createdAt: new Date().toISOString()
    };

    await db.insert(emailLogs).values(emailLogData);

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedCount,
      total: targetUsers.length,
      status,
      dailyUsage: {
        used: currentDailyCount + successCount,
        limit: DAILY_EMAIL_LIMIT,
        remaining: DAILY_EMAIL_LIMIT - (currentDailyCount + successCount)
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/emails/send-activation error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
