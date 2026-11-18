import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, sendBulkEmails } from '@/lib/email';
import { emailTemplates, renderTemplate } from '@/lib/email-templates';

/**
 * GET /api/v2/admin/emails/templates
 * Get all available email templates
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Return templates with metadata (without actual HTML to reduce payload)
    const templatesMetadata = emailTemplates.map(t => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      category: t.category,
      variables: t.variables,
    }));

    return NextResponse.json({ templates: templatesMetadata });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

const GROUP_ROLE_MAP: Record<string, string[] | null> = {
  all_users: null,
  clients: ['client'],
  freelancers: ['freelancer'],
  managers: ['manager'],
  admins: ['admin'],
  editors: ['editor'],
  account_owners: ['account_owner'],
};

/**
 * POST /api/v2/admin/emails/send
 * Send email using template or custom HTML
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const {
      to,
      recipientGroup,
      includeUnapproved,
      templateId,
      variables,
      customSubject,
      customHtml,
      category,
    } = body as {
      to?: string | string[];
      recipientGroup?: string;
      includeUnapproved?: boolean;
      templateId?: string;
      variables?: Record<string, string>;
      customSubject?: string;
      customHtml?: string;
      category?: 'registration' | 'order' | 'system' | 'promotion' | 'notification';
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let recipientRecords: Array<{ email: string; name?: string }> = [];

    if (recipientGroup) {
      if (!(recipientGroup in GROUP_ROLE_MAP)) {
        return NextResponse.json(
          { error: `Invalid recipientGroup: ${recipientGroup}` },
          { status: 400 }
        );
      }

      const roles = GROUP_ROLE_MAP[recipientGroup];
      const conditions = [];
      if (roles && roles.length > 0) {
        conditions.push(inArray(users.role, roles));
      }
      if (!includeUnapproved) {
        conditions.push(eq(users.approved, true));
      }

      const matchedUsers = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const seen = new Set<string>();
      for (const u of matchedUsers) {
        const normalized = String(u.email || '').trim().toLowerCase();
        if (normalized && emailRegex.test(normalized) && !seen.has(normalized)) {
          seen.add(normalized);
          recipientRecords.push({ email: normalized, name: u.name || undefined });
        }
      }

      if (recipientRecords.length === 0) {
        return NextResponse.json(
          { error: `No matching users found for group "${recipientGroup}"` },
          { status: 400 }
        );
      }
    } else {
      // Validate required fields for direct/selected emails
      if (!to || (Array.isArray(to) && to.length === 0)) {
        return NextResponse.json(
          { error: 'Recipient email(s) or recipientGroup required' },
          { status: 400 }
        );
      }

      const rawEmails = (Array.isArray(to) ? to : [to]).map(e => String(e).trim()).filter(Boolean);
      const invalidEmails = rawEmails.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { error: `Invalid email format: ${invalidEmails.join(', ')}` },
          { status: 400 }
        );
      }

      const uniqueEmails = Array.from(new Set(rawEmails.map(e => e.toLowerCase())));
      recipientRecords = uniqueEmails.map(email => ({ email }));
    }

    const emails = recipientRecords.map(r => r.email);

    let subject: string;
    let html: string;

    const activationTemplateIds = new Set([
      'admin_activation',
      'client_activation',
      'manager_activation',
      'freelancer_activation',
      'editor_activation',
      'account_owner_activation',
    ]);

    const isActivationTemplate = templateId ? activationTemplateIds.has(templateId) : false;

    if (isActivationTemplate) {
      const results = await Promise.allSettled(
        emails.map(async (email) => {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()))
            .limit(1);

          if (!user) {
            return { success: false, email, error: 'User not found' };
          }

          const token = crypto.randomBytes(32).toString('hex');
          const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

          await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.userId, user.id));
          await db.insert(passwordResetTokens).values({ userId: user.id, token: hashedToken, expiresAt, used: false, createdAt: new Date().toISOString() });

          const resetUrl = `https://tasklynk.co.ke/reset-password?token=${token}`;
          const rendered = renderTemplate(templateId!, {
            userName: user.name,
            resetToken: token,
          });

          if (!rendered) {
            return { success: false, email, error: 'Template rendering failed' };
          }

          await sendEmail({
            to: email,
            subject: customSubject || rendered.subject,
            html: rendered.html,
            category: category || 'registration',
          });

          return { success: true, email };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

      const failedEmails = results
        .map((r, index) => {
          if (r.status === 'rejected') {
            return { email: emails[index], error: String(r.reason) };
          }
          if (r.status === 'fulfilled' && !r.value.success) {
            return { email: r.value.email, error: r.value.error };
          }
          return null;
        })
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        total: emails.length,
        sent: successful,
        failed,
        failedEmails,
      });
    }

    // Use template or custom content
    const canPersonalizeName =
      Boolean(templateId) &&
      !(variables?.userName && variables.userName.trim()) &&
      recipientRecords.some(r => Boolean(r.name));

    if (templateId) {
      const rendered = renderTemplate(templateId, variables || {});
      if (!rendered) {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
      subject = customSubject || rendered.subject;
      html = rendered.html;
    } else if (customSubject && customHtml) {
      subject = customSubject;
      html = customHtml;
    } else {
      return NextResponse.json(
        { error: 'Either templateId or both customSubject and customHtml required' },
        { status: 400 }
      );
    }

    const bulkItems = recipientRecords.map(recipient => {
      let recipientSubject = subject;
      let recipientHtml = html;

      if (canPersonalizeName && templateId) {
        const personalized = renderTemplate(templateId, {
          ...(variables || {}),
          userName: recipient.name || 'there',
        });
        if (personalized) {
          recipientSubject = customSubject || personalized.subject;
          recipientHtml = personalized.html;
        }
      }

      return {
        to: recipient.email,
        subject: recipientSubject,
        html: recipientHtml,
        category: (category || 'system') as 'registration' | 'order' | 'system' | 'promotion' | 'notification',
      };
    });

    const bulkResult = await sendBulkEmails(bulkItems);

    return NextResponse.json({
      success: bulkResult.sent > 0 || bulkResult.failed === 0,
      total: bulkResult.total,
      sent: bulkResult.sent,
      failed: bulkResult.failed,
      failedEmails: bulkResult.failedEmails,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails', details: String(error) },
      { status: 500 }
    );
  }
}

