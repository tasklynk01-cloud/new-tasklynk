import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emailLogs, users } from '@/db/schema';
import { eq, and, inArray, gte, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

const ALLOWED_FROM_EMAILS = [
  'admn@tasklynk.co.ke',
  'admin@tasklynk.co.ke',
  'support@tasklynk.co.ke'
];

const ALLOWED_RECIPIENT_TYPES = [
  'individual',
  'freelancers',
  'clients',
  'managers',
  'admins',
  'editors',
  'account_owners',
  'all_users',
  'direct'
];

const GROUP_ROLE_MAP: Record<string, { role: string | null; sentTo: string; emptyError: string; emptyCode: string }> = {
  freelancers: { role: 'freelancer', sentTo: 'all_freelancers', emptyError: 'No approved freelancers found', emptyCode: 'NO_FREELANCERS_FOUND' },
  clients: { role: 'client', sentTo: 'all_clients', emptyError: 'No approved clients found', emptyCode: 'NO_CLIENTS_FOUND' },
  managers: { role: 'manager', sentTo: 'all_managers', emptyError: 'No approved managers found', emptyCode: 'NO_MANAGERS_FOUND' },
  admins: { role: 'admin', sentTo: 'all_admins', emptyError: 'No approved admins found', emptyCode: 'NO_ADMINS_FOUND' },
  editors: { role: 'editor', sentTo: 'all_editors', emptyError: 'No approved editors found', emptyCode: 'NO_EDITORS_FOUND' },
  account_owners: { role: 'account_owner', sentTo: 'all_account_owners', emptyError: 'No approved account owners found', emptyCode: 'NO_ACCOUNT_OWNERS_FOUND' },
  all_users: { role: null, sentTo: 'all_users', emptyError: 'No approved users found', emptyCode: 'NO_USERS_FOUND' },
};

// SMTP email limit: 100 emails/day for safety
const DAILY_EMAIL_LIMIT = 100;

interface EmailRecipient {
  id: number;
  email: string;
  name: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sentBy,
      fromEmail,
      recipientType,
      recipientIds,
      recipientEmails, // new optional: array of raw email strings when recipientType === 'direct'
      subject,
      body: emailBody,
      jobId,
      attachmentUrls // optional: array of urls to include in body footer
    } = body;

    // Validate required fields
    if (!sentBy || typeof sentBy !== 'number') {
      return NextResponse.json({
        error: 'sentBy is required and must be a valid user ID',
        code: 'MISSING_SENT_BY'
      }, { status: 400 });
    }

    if (!fromEmail || typeof fromEmail !== 'string') {
      return NextResponse.json({
        error: 'fromEmail is required',
        code: 'MISSING_FROM_EMAIL'
      }, { status: 400 });
    }

    if (!ALLOWED_FROM_EMAILS.includes(fromEmail)) {
      return NextResponse.json({
        error: `fromEmail must be one of: ${ALLOWED_FROM_EMAILS.join(', ')}`,
        code: 'INVALID_FROM_EMAIL'
      }, { status: 400 });
    }

    if (!recipientType || typeof recipientType !== 'string') {
      return NextResponse.json({
        error: 'recipientType is required',
        code: 'MISSING_RECIPIENT_TYPE'
      }, { status: 400 });
    }

    if (!ALLOWED_RECIPIENT_TYPES.includes(recipientType)) {
      return NextResponse.json({
        error: `recipientType must be one of: ${ALLOWED_RECIPIENT_TYPES.join(', ')}`,
        code: 'INVALID_RECIPIENT_TYPE'
      }, { status: 400 });
    }

    if (recipientType === 'individual' && (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0)) {
      return NextResponse.json({
        error: 'recipientIds array is required when recipientType is "individual"',
        code: 'MISSING_RECIPIENT_IDS'
      }, { status: 400 });
    }

    // Direct mode validation
    if (recipientType === 'direct') {
      if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
        return NextResponse.json({
          error: 'recipientEmails array is required when recipientType is "direct"',
          code: 'MISSING_RECIPIENT_EMAILS'
        }, { status: 400 });
      }
    }

    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      return NextResponse.json({
        error: 'subject is required and must be a non-empty string',
        code: 'MISSING_SUBJECT'
      }, { status: 400 });
    }

    if (!emailBody || typeof emailBody !== 'string' || emailBody.trim() === '') {
      return NextResponse.json({
        error: 'body is required and must be a non-empty HTML string',
        code: 'MISSING_BODY'
      }, { status: 400 });
    }

    if (jobId !== undefined && jobId !== null && typeof jobId !== 'number') {
      return NextResponse.json({
        error: 'jobId must be a valid integer if provided',
        code: 'INVALID_JOB_ID'
      }, { status: 400 });
    }

    // Verify sentBy user exists and has admin role
    const adminUser = await db.select()
      .from(users)
      .where(eq(users.id, sentBy))
      .limit(1);

    if (adminUser.length === 0) {
      return NextResponse.json({
        error: 'User specified in sentBy not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    if (adminUser[0].role !== 'admin') {
      return NextResponse.json({
        error: 'Only admin users can send bulk emails',
        code: 'FORBIDDEN_NOT_ADMIN'
      }, { status: 403 });
    }

    // Get recipient list based on recipientType
    let recipients: EmailRecipient[] = [];
    let sentToString = '';

    if (recipientType === 'individual') {
      const individualUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
        .from(users)
        .where(
          and(
            inArray(users.id, recipientIds),
            eq(users.approved, true)
          )
        );

      recipients = individualUsers;
      sentToString = individualUsers.map(u => u.email).join(', ');

      if (recipients.length === 0) {
        return NextResponse.json({
          error: 'No approved users found with the provided recipient IDs',
          code: 'NO_RECIPIENTS_FOUND'
        }, { status: 400 });
      }
    } else if (recipientType in GROUP_ROLE_MAP) {
      const cfg = GROUP_ROLE_MAP[recipientType];
      const conditions = [eq(users.approved, true)];
      if (cfg.role) {
        conditions.push(eq(users.role, cfg.role));
      }

      const groupUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
        .from(users)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

      recipients = groupUsers;
      sentToString = cfg.sentTo;

      if (recipients.length === 0) {
        return NextResponse.json({
          error: cfg.emptyError,
          code: cfg.emptyCode
        }, { status: 400 });
      }
    } else if (recipientType === 'direct') {
      // Build recipients array from raw emails; name/role not known
      const cleaned = (recipientEmails as string[]).map((e) => String(e).trim()).filter(Boolean);
      const unique = Array.from(new Set(cleaned));
      recipients = unique.map((email, idx) => ({ id: -1 * (idx + 1), email, name: email.split('@')[0], role: 'guest' }));
      sentToString = unique.join(', ');
    }

    // Check daily email limit (100 emails/day for safety)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const emailsSentToday = await db.select({
      totalSent: sql<number>`COALESCE(SUM(${emailLogs.recipientCount}), 0)`
    })
      .from(emailLogs)
      .where(gte(emailLogs.createdAt, todayStart.toISOString()));

    const currentDailyCount = Number(emailsSentToday[0]?.totalSent || 0);
    const remainingQuota = DAILY_EMAIL_LIMIT - currentDailyCount;

    if (recipients.length > remainingQuota) {
      return NextResponse.json({
        error: `Daily email limit exceeded. You can send ${remainingQuota} more emails today (${currentDailyCount}/${DAILY_EMAIL_LIMIT} used).`,
        code: 'DAILY_LIMIT_EXCEEDED',
        data: {
          limit: DAILY_EMAIL_LIMIT,
          used: currentDailyCount,
          remaining: remainingQuota,
          requested: recipients.length
        }
      }, { status: 429 });
    }

    // Prepare body with optional attachment links footer
    const attachmentsFooter = Array.isArray(attachmentUrls) && attachmentUrls.length > 0
      ? `<hr style=\"margin-top:16px;margin-bottom:8px;border:none;border-top:1px solid #e5e7eb\"/><p style=\"margin:4px 0;color:#374151\">Attachments:</p><ul>${attachmentUrls.map((u: string) => `<li><a href=\"${u}\" target=\"_blank\" rel=\"noopener noreferrer\">${u}</a></li>`).join('')}</ul>`
      : '';
    const finalHtml = `${emailBody.trim()}${attachmentsFooter}`;

    // Send emails to all recipients
    const failedRecipients: { email: string; name: string; error: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          from: fromEmail,
          subject: subject.trim(),
          html: finalHtml
        });
        successCount++;
      } catch (error) {
        failedCount++;
        failedRecipients.push({
          email: recipient.email,
          name: recipient.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }

    // Determine status
    let status: 'sent' | 'failed' | 'partial';
    if (failedCount === 0) {
      status = 'sent';
    } else if (successCount === 0) {
      status = 'failed';
    } else {
      status = 'partial';
    }

    // Insert email log
    const emailLogData: any = {
      sentBy,
      sentTo: sentToString,
      recipientType,
      recipientCount: recipients.length,
      fromEmail,
      subject: subject.trim(),
      body: finalHtml,
      status,
      failedRecipients: failedRecipients.length > 0 ? JSON.stringify(failedRecipients) : null,
      jobId: jobId || null,
      createdAt: new Date().toISOString()
    };

    const newEmailLog = await db.insert(emailLogs)
      .values(emailLogData)
      .returning();

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedCount,
      total: recipients.length,
      emailLogId: newEmailLog[0].id,
      status,
      dailyUsage: {
        used: currentDailyCount + successCount,
        limit: DAILY_EMAIL_LIMIT,
        remaining: DAILY_EMAIL_LIMIT - (currentDailyCount + successCount)
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/emails/bulk error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

