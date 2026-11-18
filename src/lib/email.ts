import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

// Admin email addresses
export const ADMIN_EMAILS = [
  'topwriteessays@gmail.com',
  'm.d.techpoint25@gmail.com',
  'maguna956@gmail.com',
  'tasklynk01@gmail.com',
  'maxwellotieno11@gmail.com',
  'ashleydothy3162@gmail.com'
];

// Official TaskLynk email addresses for the tasklynk.co.ke domain
export const TASKLYNK_EMAILS = {
  admin: 'admn@tasklynk.co.ke',      // For registration and user management
  support: 'support@tasklynk.co.ke',  // For order management
  noreply: 'noreply@tasklynk.co.ke',  // For automated emails
};

// Email type categories
export type EmailCategory = 'registration' | 'order' | 'system' | 'promotion' | 'notification' | 'escalation' | 'transactional';

// Get the appropriate sender email based on category
export function getSenderEmail(category: EmailCategory): string {
  switch (category) {
    case 'registration':
      return `TaskLynk Admin <${TASKLYNK_EMAILS.admin}>`;
    case 'order':
    case 'escalation':
      return `TaskLynk Support <${TASKLYNK_EMAILS.support}>`;
    case 'system':
    default:
      return `TaskLynk <${TASKLYNK_EMAILS.admin}>`;
  }
}

interface EmailResponse {
  success: boolean;
  error?: any;
  messageId?: string;
}

// Check if Resend is configured
function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// Check if Gmail / Google Workspace SMTP is configured
function isGmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let gmailTransporter: Transporter | null = null;
function getGmailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) return null;
  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return gmailTransporter;
}

async function sendViaGmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<EmailResponse> {
  const transporter = getGmailTransporter();
  if (!transporter) {
    return { success: false, error: 'Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.' };
  }

  const gmailUser = process.env.GMAIL_USER!.trim();
  const fromEmail = from || `TaskLynk <${gmailUser}>`;

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
      replyTo: TASKLYNK_EMAILS.support,
    });
    console.log('✅✅✅ [Gmail SMTP] Email sent successfully:', {
      messageId: info.messageId,
      to,
      timestamp: new Date().toISOString(),
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ [Gmail SMTP] Failed to send email:', error);
    return { success: false, error: error?.message || 'Gmail SMTP request failed' };
  }
}

let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Send email via Resend
async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<EmailResponse> {
  const client = getResendClient();

  if (!client) {
    console.error('❌ [Resend] API key not configured');
    return { success: false, error: 'Resend API key not configured. Set RESEND_API_KEY.' };
  }

  // Use FROM_EMAIL from env or default to resend.dev domain for testing
  const fromEmail = from || process.env.FROM_EMAIL || 'TaskLynk <onboarding@resend.dev>';

  console.log('📧 [Resend] Attempting to send email:', {
    to,
    from: fromEmail,
    subject: subject.substring(0, 50),
    timestamp: new Date().toISOString()
  });

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ [Resend] Failed to send email:', error);
      return { success: false, error: error.message || 'Resend API error' };
    }

    console.log('✅✅✅ [Resend] Email sent successfully:', {
      messageId: data?.id,
      to,
      timestamp: new Date().toISOString()
    });
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('❌ [Resend] Exception:', error);
    return { success: false, error: error.message || 'Resend request failed' };
  }
}

// ✅ EMAIL SERVICE: Resend

export async function sendEmail({
  to,
  subject,
  html,
  from,
  category,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  category?: EmailCategory;
}): Promise<{ success: boolean; error?: any; messageId?: string }> {
  console.log('📧 [sendEmail] Called with:', {
    to,
    subjectPreview: subject.substring(0, 50),
    category,
    htmlLength: html.length,
    timestamp: new Date().toISOString()
  });

  const senderEmail = from || (category ? getSenderEmail(category) : `TaskLynk <${TASKLYNK_EMAILS.admin}>`);

  if (!isResendConfigured() && !isGmailConfigured()) {
    const errorMsg = 'Email service not configured. Set RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD.';
    console.error('❌ [sendEmail]', errorMsg);
    return { success: false, error: errorMsg };
  }

  // Ensure every email renders with the clean professional design, new logo, and responsive envelope
  let formattedHtml = html;
  if (!formattedHtml.includes('<!DOCTYPE html') && !formattedHtml.includes('<html')) {
    formattedHtml = wrapInEmailLayout({
      title: subject,
      content: formattedHtml,
    });
  }

  const provider = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase().trim();

  // Determine primary and fallback providers
  const useResendFirst = provider !== 'gmail' && isResendConfigured();
  const primaryProvider = useResendFirst ? 'resend' : 'gmail';
  const fallbackProvider = useResendFirst ? 'gmail' : 'resend';

  const sendWithFallback = async (primary: 'resend' | 'gmail', fallback: 'resend' | 'gmail'): Promise<{ success: boolean; error?: any; messageId?: string }> => {
    // Try primary provider
    const primaryResult = primary === 'resend'
      ? await sendViaResend(to, subject, formattedHtml, senderEmail)
      : await sendViaGmail(to, subject, formattedHtml, senderEmail);

    if (primaryResult.success) {
      return primaryResult;
    }

    // Primary failed - try fallback if configured
    const isFallbackConfigured = fallback === 'resend' ? isResendConfigured() : isGmailConfigured();
    if (isFallbackConfigured) {
      console.warn(`⚠️ [sendEmail] ${primary.toUpperCase()} failed, falling back to ${fallback.toUpperCase()}...`, {
        to,
        primaryError: primaryResult.error,
        timestamp: new Date().toISOString()
      });
      const fallbackResult = fallback === 'resend'
        ? await sendViaResend(to, subject, formattedHtml, senderEmail)
        : await sendViaGmail(to, subject, formattedHtml, senderEmail);
      
      if (fallbackResult.success) {
        return fallbackResult;
      }
      
      console.error(`❌❌❌ [sendEmail] Both ${primary.toUpperCase()} and ${fallback.toUpperCase()} failed:`, {
        to,
        primaryError: primaryResult.error,
        fallbackError: fallbackResult.error,
        timestamp: new Date().toISOString()
      });
      return fallbackResult; // Return fallback error
    }

    // No fallback configured
    console.error(`❌❌❌ [sendEmail] ${primary.toUpperCase()} failed and no fallback configured:`, {
      to,
      error: primaryResult.error,
      timestamp: new Date().toISOString()
    });
    return primaryResult;
  };

  return sendWithFallback(primaryProvider, fallbackProvider);
}

export interface BulkEmailItem {
  to: string;
  subject: string;
  html: string;
  from?: string;
  category?: EmailCategory;
}

export async function sendBulkEmails(items: BulkEmailItem[]): Promise<{
  total: number;
  sent: number;
  failed: number;
  failedEmails: Array<{ email: string; error: string }>;
}> {
  if (items.length === 0) {
    return { total: 0, sent: 0, failed: 0, failedEmails: [] };
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const formatHtml = (html: string, subject: string) =>
    !html.includes('<!DOCTYPE html') && !html.includes('<html')
      ? wrapInEmailLayout({ title: subject, content: html })
      : html;

  const isReservedTestEmail = (email: string) => {
    const lower = email.trim().toLowerCase();
    const domain = lower.split('@')[1] || '';
    return (
      domain === 'example.com' ||
      domain === 'example.org' ||
      domain === 'example.net' ||
      domain === 'test.com' ||
      domain === 'localhost' ||
      domain.endsWith('.example') ||
      domain.endsWith('.test') ||
      domain.endsWith('.invalid')
    );
  };

  const failedEmails: Array<{ email: string; error: string }> = [];
  const validItems: BulkEmailItem[] = [];

  for (const item of items) {
    if (isReservedTestEmail(item.to)) {
      failedEmails.push({ email: item.to, error: 'Skipped reserved/test domain' });
    } else {
      validItems.push(item);
    }
  }

  if (validItems.length === 0) {
    return {
      total: items.length,
      sent: 0,
      failed: failedEmails.length,
      failedEmails,
    };
  }

  const provider = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase().trim();
  const useResendBatch =
    isResendConfigured() && (provider !== 'gmail' || !isGmailConfigured());

  let sent = 0;

  const sendSingleWithGuaranteedFallback = async (item: BulkEmailItem): Promise<{ success: boolean; error?: any; messageId?: string }> => {
    return sendEmail({
      to: item.to,
      subject: item.subject,
      html: item.html,
      from: item.from,
      category: item.category,
    });
  };

  if (useResendBatch) {
    const client = getResendClient()!;
    const RESEND_BATCH_LIMIT = 100;

    const sendChunkWithIsolation = async (chunk: BulkEmailItem[]): Promise<void> => {
      const payload = chunk.map((item) => ({
        from:
          item.from ||
          (item.category
            ? getSenderEmail(item.category)
            : process.env.FROM_EMAIL || `TaskLynk <${TASKLYNK_EMAILS.admin}>`),
        to: [item.to],
        subject: item.subject,
        html: formatHtml(item.html, item.subject),
      }));

      try {
        const { data, error } = await client.batch.send(payload);
        if (error) {
          throw new Error(error.message || 'Resend batch send failed');
        }
        const sentCountInChunk = Array.isArray(data?.data) ? data.data.length : chunk.length;
        sent += sentCountInChunk;
      } catch (err: any) {
        const errMsg = err?.message || 'Resend batch error';
        console.error(`❌ [Resend Batch] Chunk (${chunk.length}) failed:`, errMsg);

        // If a multi-email batch failed (e.g. 1 invalid recipient), split to isolate bad addresses
        if (chunk.length > 1) {
          const mid = Math.ceil(chunk.length / 2);
          await sleep(550);
          await sendChunkWithIsolation(chunk.slice(0, mid));
          await sleep(550);
          await sendChunkWithIsolation(chunk.slice(mid));
          return;
        }

        // Single-item: use guaranteed fallback via sendEmail()
        const single = chunk[0]!;
        const result = await sendSingleWithGuaranteedFallback(single);
        if (result.success) {
          sent++;
        } else {
          failedEmails.push({ email: single.to, error: String(result.error || errMsg) });
        }
      }
    };

    for (let i = 0; i < validItems.length; i += RESEND_BATCH_LIMIT) {
      const chunk = validItems.slice(i, i + RESEND_BATCH_LIMIT);
      await sendChunkWithIsolation(chunk);

      if (i + RESEND_BATCH_LIMIT < validItems.length) {
        await sleep(650);
      }
    }

    return {
      total: items.length,
      sent,
      failed: failedEmails.length,
      failedEmails,
    };
  }

  // Gmail primary path - already uses sendEmail() which has guaranteed fallback
  for (let i = 0; i < validItems.length; i += 5) {
    const chunk = validItems.slice(i, i + 5);
    const results = await Promise.all(
      chunk.map((item) =>
        sendEmail({
          to: item.to,
          subject: item.subject,
          html: item.html,
          from: item.from,
          category: item.category,
        })
      )
    );
    results.forEach((res, idx) => {
      if (res.success) {
        sent++;
      } else {
        failedEmails.push({
          email: chunk[idx]!.to,
          error: String(res.error || 'Email send failed'),
        });
      }
    });
    if (i + 5 < validItems.length) {
      await sleep(300);
    }
  }

  return {
    total: items.length,
    sent,
    failed: failedEmails.length,
    failedEmails,
  };
}

// Registration email helper - uses admn@tasklynk.co.ke
export async function sendRegistrationEmail({
  to,
  activitySubject,
  html,
}: {
  to: string;
  activitySubject: string; // e.g., "Registration Received", "Registration Approved"
  html: string;
}) {
  return sendEmail({
    to,
    subject: activitySubject,
    html,
    category: 'registration',
  });
}

// Order email helper - uses support@tasklynk.co.ke with order number as subject
export async function sendOrderEmail({
  to,
  orderId,
  orderAction,
  html,
}: {
  to: string;
  orderId: string;
  orderAction?: string; // Optional suffix like "Assigned", "Delivered"
  html: string;
}) {
  const subject = orderAction ? `Order #${orderId} - ${orderAction}` : `Order #${orderId}`;
  return sendEmail({
    to,
    subject,
    html,
    category: 'order',
  });
}

// Send email to all admins
export async function sendEmailToAdmins({
  subject,
  html,
}: {
  subject: string;
  html: string;
}) {
  try {
    const results = await Promise.allSettled(
      ADMIN_EMAILS.map(email => sendEmail({ to: email, subject, html }))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    return { success: true, successCount, totalCount: ADMIN_EMAILS.length };
  } catch (error) {
    console.error('❌ Failed to send emails to admins:', error);
    return { success: false, error };
  }
}

// Send new order notification to admins
export async function sendNewOrderNotificationToAdmins({
  orderId,
  orderNumber,
  displayId,
  clientName,
  clientEmail,
  title,
  workType,
  pages,
  slides,
  amount,
  deadline,
  instructions,
}: {
  orderId: number;
  orderNumber?: string;
  displayId?: string;
  clientName: string;
  clientEmail: string;
  title: string;
  workType: string;
  pages?: number;
  slides?: number;
  amount: number;
  deadline: string;
  instructions?: string;
}) {
  console.log('📧 [sendNewOrderNotificationToAdmins] Preparing to notify admins about new order:', orderId);
  
  const orderIdentifier = displayId || orderNumber || `#${orderId}`;
  const orderUrl = `https://tasklynk.co.ke/admin/orders/${orderId}`;
  
  // Format deadline for better readability
  const formattedDeadline = new Date(deadline).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi'
  });
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification - TaskLynk Admin</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #dc2626; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">🔔</span>
                      </div>
                    </div>
                    
                    <h1 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">New Order Placed</h1>
                    
                    <p style="color: #64748b; font-size: 16px; text-align: center; margin: 0 0 30px 0;">Requires Review & Approval</p>
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                      <h2 style="color: #991b1b; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">Order ${orderIdentifier}</h2>
                      <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px; color: #7f1d1d;">
                        <tr>
                          <td style="font-weight: 600; width: 30%;">Title:</td>
                          <td>${title}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Work Type:</td>
                          <td>${workType}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Pages/Slides:</td>
                          <td>${pages || 0} pages, ${slides || 0} slides</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Amount:</td>
                          <td style="font-weight: 700; color: #dc2626;">KSh ${amount.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Deadline:</td>
                          <td>${formattedDeadline}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="background-color: #f1f5f9; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                      <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Client Information</h3>
                      <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px; color: #475569;">
                        <tr>
                          <td style="font-weight: 600; width: 30%;">Name:</td>
                          <td>${clientName}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: 600;">Email:</td>
                          <td><a href="mailto:${clientEmail}" style="color: #3b82f6; text-decoration: none;">${clientEmail}</a></td>
                        </tr>
                      </table>
                    </div>
                    
                    ${instructions ? `
                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                      <h3 style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Order Instructions</h3>
                      <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${instructions.substring(0, 500)}${instructions.length > 500 ? '...' : ''}</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${orderUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Order in Dashboard</a>
                    </div>
                    
                    <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Required Actions:</h3>
                      <ul style="color: #1e3a8a; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Review order details and client requirements</li>
                        <li>Approve or reject the order</li>
                        <li>Assign to appropriate manager (if applicable)</li>
                        <li>Notify client of order status</li>
                      </ul>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 30px 0 0 0;">Please process this order promptly to maintain quality service delivery.</p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  
  const subject = `🔔 New Order Placed - ${orderIdentifier} - ${clientName}`;
  
  try {
    const result = await sendEmailToAdmins({
      subject,
      html: emailHtml,
    });
    
    console.log('✅ [sendNewOrderNotificationToAdmins] Notification sent to admins:', result);
    return result;
  } catch (error) {
    console.error('❌ [sendNewOrderNotificationToAdmins] Failed to send notification:', error);
    return { success: false, error };
  }
}

// Email header template with official new logo and premium branding matching our website
export function getEmailHeader(): string {
  return `
    <!-- Top Trust Bar -->
    <tr>
      <td style="background-color: #160F29; padding: 10px 24px; text-align: center; border-radius: 14px 14px 0 0; border-bottom: 1px solid rgba(91, 58, 140, 0.4);">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #DDD5E8; font-weight: 500;">
              <span style="color: #FF7A3D; font-weight: 900;">✦</span> Verified Specialists &bull; 24/7 Quality Assured
            </td>
            <td align="right" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #DDD5E8; font-weight: 700;">
              <a href="tel:+254701066845" style="color: #FF7A3D; text-decoration: none; font-weight: 700;">+254 701 066 845</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Main Header with Official New Logo -->
    <tr>
      <td style="background-color: #1A122E; background: linear-gradient(135deg, #1A122E 0%, #241B3F 50%, #35255C 100%); padding: 32px 28px; text-align: center; border-bottom: 3px solid #FF7A3D;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td valign="middle" style="padding-right: 14px;">
                    <a href="https://tasklynk.co.ke" target="_blank" style="text-decoration: none; display: block;">
                      <img src="https://tasklynk.co.ke/tl-logo-192.png" alt="TaskLynk Logo" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 12px; border: 0; outline: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);" />
                    </a>
                  </td>
                  <td valign="middle" align="left">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.1; color: #FAF8FD;">
                      <a href="https://tasklynk.co.ke" target="_blank" style="text-decoration: none; color: #FAF8FD;">
                        Task<span style="color: #FF7A3D;">Lynk</span>
                      </a>
                      <span style="display: inline-block; background-color: rgba(255, 122, 61, 0.18); border: 1px solid rgba(255, 122, 61, 0.45); color: #FF9057; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 2px 7px; border-radius: 4px; vertical-align: middle; margin-left: 6px;">
                        Academic
                      </span>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 500; color: #DDD5E8; letter-spacing: 0.3px; margin-top: 3px;">
                      Linking Talent, Delivering Results.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

// Email footer template - Dark Luxury Silk Design matching our Site Footer
export function getEmailFooter(): string {
  return `
    <tr>
      <td style="background-color: #1A122E; padding: 32px 26px; text-align: center; border-top: 1px solid #5B3A8C; border-radius: 0 0 14px 14px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center;">
          <!-- Trust Badges Strip -->
          <tr>
            <td align="center" style="padding-bottom: 22px; border-bottom: 1px solid rgba(221, 213, 232, 0.15);">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" style="padding: 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; color: #DDD5E8;">
                    <strong style="color: #FAF8FD;">🛡️ 100% Turnitin Clean</strong>
                  </td>
                  <td style="color: #FF7A3D; font-size: 12px;">&bull;</td>
                  <td align="center" style="padding: 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; color: #DDD5E8;">
                    <strong style="color: #FAF8FD;">⭐ Triple-Check QA</strong>
                  </td>
                  <td style="color: #FF7A3D; font-size: 12px;">&bull;</td>
                  <td align="center" style="padding: 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; color: #DDD5E8;">
                    <strong style="color: #FAF8FD;">⚡ Express Delivery</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Company & Contact Info -->
          <tr>
            <td align="center" style="padding-top: 20px;">
              <p style="margin: 0 0 6px; color: #FAF8FD; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -0.2px;">
                TaskLynk Academic Solutions
              </p>
              <p style="margin: 0 0 14px; color: #DDD5E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; line-height: 1.5;">
                Nairobi, Kenya &bull; 
                <a href="mailto:admn@tasklynk.co.ke" style="color: #FF7A3D; text-decoration: none; font-weight: 700;">admn@tasklynk.co.ke</a> &bull; 
                <a href="tel:+254701066845" style="color: #DDD5E8; text-decoration: none; font-weight: 600;">+254 701 066 845</a>
              </p>
              <!-- Action Pills -->
              <div style="margin: 14px 0 18px 0;">
                <a href="https://tasklynk.co.ke" target="_blank" style="display: inline-block; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 700; text-decoration: none; padding: 7px 18px; background-color: #FF7A3D; border-radius: 8px; margin: 3px; box-shadow: 0 2px 8px rgba(255, 122, 61, 0.35);">
                  Visit TaskLynk Platform &rarr;
                </a>
                <a href="https://tasklynk.co.ke/login" target="_blank" style="display: inline-block; color: #FAF8FD; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 600; text-decoration: none; padding: 7px 16px; background-color: rgba(91, 58, 140, 0.45); border: 1px solid #5B3A8C; border-radius: 8px; margin: 3px;">
                  My Dashboard
                </a>
                <a href="https://wa.me/254701066845" target="_blank" style="display: inline-block; color: #25D366; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 600; text-decoration: none; padding: 7px 16px; background-color: rgba(37, 211, 102, 0.12); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 8px; margin: 3px;">
                  WhatsApp 24/7
                </a>
              </div>
              <p style="margin: 14px 0 0 0; color: #9C8EB9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; line-height: 1.5;">
                &copy; 2026 TaskLynk Academic Solutions. All rights reserved.<br>
                This is an official system transmission. If you need support, reply directly to this email or visit our help center.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

// Master Responsive Email Wrapper with Full HTML Envelope
export function wrapInEmailLayout({
  title = 'TaskLynk Academic',
  preheader = '',
  content,
}: {
  title?: string;
  preheader?: string;
  content: string;
}): string {
  // If content already contains getEmailHeader or getEmailFooter, don't duplicate
  const hasTableEnvelope = content.includes('<table') && (content.includes('role="presentation"') || content.includes('TaskLynk'));

  if (hasTableEnvelope) {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F4EFFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-btn { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4EFFB;">
  ${preheader ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
  ${content}
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F4EFFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-btn { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4EFFB;">
  ${preheader ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 24px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 620px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(36, 27, 63, 0.08); border: 1px solid #E8E0F0;">
          ${getEmailHeader()}
          <tr>
            <td class="mobile-padding" style="padding: 38px 30px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Admin notification: New user registration
export function getNewUserRegistrationAdminHTML(
  userName: string,
  userEmail: string,
  userRole: string,
  userPhone: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration - TaskLynk Admin</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">👤</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">New User Registration</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello Admin,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      A new user has registered on TaskLynk Academic and is awaiting approval.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">User Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px;">
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Name:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${userName}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Email:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${userEmail}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Phone:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${userPhone}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Role:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0; text-transform: capitalize;">${userRole}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                        <strong>Action Required:</strong> Please log in to the admin dashboard to review and approve/reject this registration.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/admin/users" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        View Pending Registrations
                      </a>
                    </div>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Admin notification: New job posting
export function getNewJobPostingAdminHTML(
  clientName: string,
  clientEmail: string,
  jobTitle: string,
  jobId: number,
  displayId: string,
  workType: string,
  amount: number,
  deadline: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Posted - TaskLynk Admin</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">📝</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">New Job Posted</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello Admin,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      A new job has been posted on TaskLynk Academic and requires your approval.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Job Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px;">
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Job ID:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0; font-family: monospace;">${displayId}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Title:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${jobTitle}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Work Type:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${workType}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Amount:</strong></td>
                          <td style="color: #10b981; padding: 8px 0; font-weight: bold;">KSh ${amount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Deadline:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${new Date(deadline).toLocaleString()}</td>
                        </tr>
                      </table>
                      
                      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="margin: 0 0 10px; color: #1f2937; font-size: 16px;">Client Information</h4>
                        <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Name:</strong> ${clientName}</p>
                        <p style="margin: 5px 0; color: #4b5563; font-size: 14px;"><strong>Email:</strong> ${clientEmail}</p>
                      </div>
                    </div>
                    
                    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                        <strong>Action Required:</strong> Please review and approve this job to make it visible to freelancers.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/admin/jobs/${jobId}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Review Job
                      </a>
                    </div>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 1. Account Registration Received
export function getAccountRegistrationReceivedHTML(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TaskLynk Academic — Registration Received</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Welcome to TaskLynk Academic — Registration Received</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for registering with TaskLynk Academic.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Your application has been received successfully and is currently under review by our team.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You will receive an account approval update within 7 business days.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      In the meantime, feel free to explore your dashboard and update your profile details.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      We appreciate your interest in joining our academic network!
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Best regards,<br>
                      TaskLynk Academic Team<br>
                      admn@tasklynk.co.ke
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Admin notification: New contact message
export function getNewContactMessageAdminHTML(
  senderName: string,
  senderEmail: string,
  senderPhone: string | null,
  content: string,
  isGuest: boolean
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message - TaskLynk Admin</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #3b82f6; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">💬</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">New Contact Message</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello Admin,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You have received a new message from the "Chat with Us" widget.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Sender Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px;">
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Name:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${senderName}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Email:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${senderEmail}</td>
                        </tr>
                        ${senderPhone ? `
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Phone:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${senderPhone}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>User Type:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${isGuest ? 'Guest' : 'Registered User'}</td>
                        </tr>
                      </table>
                      
                      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <h4 style="margin: 0 0 10px; color: #1f2937; font-size: 16px;">Message</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${content}</p>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/manager/contact-messages" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        View Messages
                      </a>
                    </div>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 2. Account Approved
export function getAccountApprovedEmailHTML(userName: string, userRole: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your TaskLynk Academic Account Has Been Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Your TaskLynk Academic Account Has Been Approved</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Congratulations! Your TaskLynk Academic account has been successfully approved.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You can now log in, explore available orders, and begin working or posting tasks right away.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/login" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Login Here
                      </a>
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      We're excited to have you on board!
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Warm regards,<br>
                      TaskLynk Academic Admin<br>
                      admn@tasklynk.co.ke
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 3. Order Assigned - Now includes freelancer name in subject and body
export function getJobAssignedEmailHTML(
  freelancerName: string,
  orderId: string,
  jobTitle: string,
  deadline: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderId} — Assigned to ${freelancerName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Order #${orderId} — Assigned to You</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello <strong>${freelancerName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Good news! You've been assigned to a new order.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Order Details</h3>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 15px;"><strong>Order ID:</strong> ${orderId}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 15px;"><strong>Title:</strong> ${jobTitle}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 15px;"><strong>Deadline:</strong> ${deadline}</p>
                      <p style="margin: 5px 0; color: #4b5563; font-size: 15px;"><strong>Assigned Writer:</strong> ${freelancerName}</p>
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Please review the order requirements carefully and begin working as soon as possible.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You can track progress or communicate with the client from your dashboard.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/freelancer/in-progress" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        View Your Order
                      </a>
                    </div>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Best regards,<br>
                      TaskLynk Support<br>
                      support@tasklynk.co.ke
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 4. Revision Required
export function getRevisionRequestedEmailHTML(
  freelancerName: string,
  orderId: string,
  revisionMessage: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderId} — Revision Requested</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Order #${orderId} — Revision Requested</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${freelancerName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      The client has requested a revision for your submitted work on Order #${orderId}.
                    </p>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                      <h3 style="margin: 0 0 10px; color: #92400e; font-size: 16px;">Client Feedback:</h3>
                      <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">
                        ${revisionMessage}
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Please review the client's comments and re-upload the revised file as soon as possible.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You can view the revision notes in your order dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Ensure all revisions meet TaskLynk's quality and originality standards.
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you,<br>
                      TaskLynk Academic Quality Team
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getAccountRejectedEmailHTML(userName: string, userRole: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Status Update - TaskLynk</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Account Application Update</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Dear ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for your interest in joining TaskLynk as a ${userRole}. After careful review, we regret to inform you that we cannot approve your account at this time.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      This decision was made to maintain the quality standards of our platform. If you believe this was a mistake or would like to discuss this further, please contact our support team.
                    </p>
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
                        <strong>Important:</strong> You will no longer have access to your account. Please contact support if you need more information.
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      For inquiries, contact us at 
                      <a href="mailto:admn@tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">admn@tasklynk.co.ke</a> 
                      or +254701066845.
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getAccountSuspendedEmailHTML(userName: string, reason: string, suspendedUntil: string | null): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended - TaskLynk</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Account Suspended</h2>
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Dear ${userName},
                    </p>
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Your TaskLynk account has been temporarily suspended.
                    </p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0 0 10px; color: #991b1b; font-size: 15px;"><strong>Reason:</strong> ${reason}</p>
                      ${suspendedUntil ? `<p style="margin: 0; color: #991b1b; font-size: 15px;"><strong>Until:</strong> ${new Date(suspendedUntil).toLocaleDateString()}</p>` : '<p style="margin: 0; color: #991b1b; font-size: 15px;"><strong>Duration:</strong> Indefinite</p>'}
                    </div>
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Contact support at <a href="mailto:admn@tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">admn@tasklynk.co.ke</a>
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getAccountUnsuspendedEmailHTML(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Reactivated - TaskLynk</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Account Reactivated!</h2>
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Dear ${userName},
                    </p>
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Good news! Your account suspension has been lifted and you now have full access to TaskLynk.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/login" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Access Your Dashboard
                      </a>
                    </div>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getWorkDeliveredEmailHTML(
  clientName: string,
  jobTitle: string,
  jobId: number,
  displayId: string,
  freelancerName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order ${displayId} — Work Delivered</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #8b5cf6; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Order ${displayId} — Work Delivered!</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hi ${clientName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Great news! ${freelancerName} has completed and submitted the work for your job "${jobTitle}". The work is now awaiting your review.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Next Steps</h3>
                      <p style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                        1. Review the delivered work (40% preview available)<br>
                        2. Check for quality and completeness<br>
                        3. Request revision if needed (free)<br>
                        4. Complete payment via M-Pesa to download full files<br>
                        5. Approve the work to release payment to freelancer
                      </p>
                    </div>
                    
                    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                        <strong>Tip:</strong> Review the work carefully before approving. You can request one free revision if needed.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/client/orders/${jobId}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Review Delivered Work
                      </a>
                    </div>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getPaymentConfirmedEmailHTML(
  freelancerName: string,
  jobTitle: string,
  displayId: string,
  amount: number,
  newBalance: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order ${displayId} — Payment Received</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Order ${displayId} — Payment Received!</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hi ${freelancerName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Congratulations! Payment for your completed job "${jobTitle}" has been confirmed and added to your balance.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Payment Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 15px;">
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Order ID:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0; font-family: monospace;">${displayId}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Job:</strong></td>
                          <td style="color: #1f2937; padding: 8px 0;">${jobTitle}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 8px 0;"><strong>Amount Earned:</strong></td>
                          <td style="color: #10b981; padding: 8px 0; font-weight: bold;">KSh ${amount.toFixed(2)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e5e7eb;">
                          <td style="color: #6b7280; padding: 12px 0;"><strong>New Balance:</strong></td>
                          <td style="color: #059669; padding: 12px 0; font-size: 18px; font-weight: bold;">KSh ${newBalance.toFixed(2)}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                        <strong>Well done!</strong> Keep up the excellent work. More jobs are available for you to bid on.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/freelancer/dashboard" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        View Dashboard
                      </a>
                    </div>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getPasswordResetEmailHTML(userName: string, resetToken: string): string {
  const resetUrl = `https://tasklynk.co.ke/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - TaskLynk</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #F2A541; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px;">🔐</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Password Reset Request</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password for your TaskLynk account. Click the button below to create a new password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Reset Password
                      </a>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #F2A541; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong>⚠️ Important:</strong> This link will expire in 1 hour and can only be used once. If you didn't request this password reset, please ignore this email.
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${resetUrl}" style="color: #1D3557; word-break: break-all;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// Email Verification Code
export function getEmailVerificationHTML(userName: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - TaskLynk</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px;">📧</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Verify Your Email Address</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for registering with TaskLynk Academic! Please use the verification code below to verify your email address:
                    </p>
                    
                    <div style="background-color: #f3f4f6; border: 2px dashed #1D3557; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                      <h1 style="margin: 0; color: #1D3557; font-size: 42px; letter-spacing: 8px; font-weight: bold;">${code}</h1>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #F2A541; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong>⏰ Important:</strong> This code will expire in 15 minutes. Enter it on the verification page to complete your registration.
                      </p>
                    </div>

                    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">
                        <strong>📧 Didn't receive this email?</strong> Check your <strong>spam/junk folder</strong> — automated emails sometimes get filtered there. If not found within 3 minutes, use the "Resend Code" option on the verification page.
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      If you didn't create an account with TaskLynk, please ignore this email.
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Best regards,<br>
                      TaskLynk Academic Team<br>
                      admn@tasklynk.co.ke
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 5. Order Approved
export function getOrderApprovedEmailHTML(
  freelancerName: string,
  orderId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderId} — Approved by Client</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Order #${orderId} — Approved by Client</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${freelancerName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Your submission for Order #${orderId} has been approved by the client.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      The order is now marked as Completed, and your payment will be processed shortly.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for your quality work and dedication!
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Keep it up,<br>
                      TaskLynk Academic Admin
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 6. Order Cancelled
export function getOrderCancelledEmailHTML(
  freelancerName: string,
  orderId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderId} — Order Cancelled</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Order #${orderId} — Order Cancelled</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${freelancerName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Unfortunately, Order #${orderId} has been cancelled by the client or admin.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      If you had already started work, please do not proceed further.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      For clarification, contact support through your dashboard or email us directly.
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Best regards,<br>
                      TaskLynk Academic Team<br>
                      admn@tasklynk.co.ke
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 7. Order Delivered (by Writer)
export function getOrderDeliveredEmailHTML(
  clientName: string,
  orderId: string,
  orderTitle: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderId} — Work Delivered</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #8b5cf6; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Order #${orderId} — Work Delivered</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hi ${clientName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      The writer has submitted the completed work for your order #${orderId}.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You can review the document and:
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                      • Approve it if you're satisfied, or<br>
                      • Request a revision if changes are needed.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/orders/${orderId}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Access Your Order
                      </a>
                    </div>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for using TaskLynk Academic.
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 8. Payment Confirmation (for Client)
export function getPaymentConfirmationEmailHTML(
  clientName: string,
  orderId: string,
  amount: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received for Order #${orderId}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">✓</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Order #${orderId} — Payment Received!</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hi ${clientName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      We've received your payment of KSh ${amount.toFixed(2)} for Order #${orderId}.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Your order is now being reviewed and will be assigned to a qualified writer shortly.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You can track progress from your dashboard.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for choosing TaskLynk Academic!
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 9. Order On Hold
export function getOrderOnHoldEmailHTML(
  freelancerName: string,
  orderId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderId} — Currently On Hold</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">Order #${orderId} — Currently On Hold</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${freelancerName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Order #${orderId} has been placed on hold temporarily by the client or admin.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Please pause all work until further notice.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You will be notified once the order is resumed or cancelled.
                    </p>
                    
                    <p style="margin: 20px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Thank you for your understanding,<br>
                      TaskLynk Academic Admin
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// 10. New Message Notification
export function getNewMessageNotificationHTML(
  userName: string,
  orderId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Message on Order #${orderId}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">New Message on Order #${orderId}</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello ${userName},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You have received a new message regarding Order #${orderId}.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://tasklynk.co.ke/orders/${orderId}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Log in to View and Reply
                      </a>
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Please respond promptly to maintain smooth communication.
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function getPasswordChangeConfirmationHTML(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1A237E 0%, #3949AB 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #212121;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #424242;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #E8F5E9;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 30px 20px;
      text-align: center;
      font-size: 14px;
      color: #757575;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Password Changed</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${name},</p>
      <p class="message">
        Your password has been changed successfully.
      </p>
      <div class="info-box">
        <strong>✓ Password Updated</strong><br>
        Your account is secure. If you did not make this change, please contact support immediately.
      </div>
      <p class="message">
        For your security, we recommend:
      </p>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Don't share your password with anyone</li>
        <li>Enable two-factor authentication when available</li>
      </ul>
      <p class="message">
        If you need any assistance, please don't hesitate to reach out to our support team.
      </p>
    </div>
    <div class="footer">
      <p><strong>TaskLynk Academic</strong></p>
      <p>Professional Academic Writing Services</p>
      <p style="margin-top: 10px;">
        <a href="https://tasklynk.co.ke" style="color: #1A237E; text-decoration: none;">Visit Website</a> |
        <a href="mailto:admn@tasklynk.co.ke" style="color: #1A237E; text-decoration: none;">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Account Owner Welcome Email - Sent immediately after registration
export function getAccountOwnerWelcomeHTML(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TaskLynk Academic Writing Platform</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="650" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 26px; text-align: center; font-weight: 700;">Welcome to TaskLynk Academic Writing Platform</h2>
                    
                    <p style="margin: 0 0 20px; color: #1f2937; font-size: 17px; line-height: 1.7; font-weight: 600;">
                      Dear Account Owner,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                      Are you looking for a <strong>reliable, efficient, and high-quality team</strong> to handle your academic writing workload, manage writers, and deliver work that is ready for submission? Our platform is designed specifically for account owners who want to scale their productivity, eliminate writer follow-up stress, and maximize delivery rates with guaranteed quality and consistency.
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                      We connect you to a large pool of <strong>qualified, vetted, and specialized academic writers</strong>, supported by a professional management and editorial team. Once you post your jobs on our platform, we take full responsibility for assigning them to the right writers, overseeing progress, editing submissions, and ensuring the final work is polished, original, and formatted for immediate submission. <strong>You only need to hire bidders—we handle everything else.</strong>
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #EBF5FF 0%, #E0F2FE 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
                      <h3 style="margin: 0 0 20px; color: #1D3557; font-size: 22px; font-weight: 700; text-align: center;">Why Account Owners Prefer Our System</h3>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Reliable Access to Qualified Writers</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          You get instant access to hundreds of trained and vetted writers who can handle:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Regular academic work</li>
                          <li>Technical and advanced assignments</li>
                          <li>Business tasks</li>
                          <li>STEM papers</li>
                          <li>Research, coding, statistics, engineering, nursing, finance—every category</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          <strong>No more gambling with inconsistent freelancers</strong>—our system guarantees expertise.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Professional Manager + Editor Workflow</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Every order you post enters a <strong>three-layer quality system:</strong>
                        </p>
                        <ol style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li><strong>Manager</strong> — assigns and supervises the right writer, tracks deadlines, and ensures instructions are followed</li>
                          <li><strong>Writer</strong> — completes the order professionally and on time</li>
                          <li><strong>Editor</strong> — reviews, proofreads, checks originality, polishes formatting, and ensures the submission meets academic standards</li>
                        </ol>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          The output you receive is <strong>100% ready for submission</strong>—you do not need to edit, correct errors, or chase writers.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ 24/7 Availability & Ultra-Fast Delivery</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          We offer around-the-clock service, including:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Urgent orders completed within 3 hours</li>
                          <li>Same-day deliveries</li>
                          <li>High-capacity workload handling (no backlog)</li>
                          <li>Immediate replacement writers if issues arise</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Because we have a wide network of writers across Kenya, reliability is guaranteed—even during power outages or high-pressure periods.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Handling ALL Types of Orders</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          We confidently process every category of work:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Essays, reports, reflections</li>
                          <li>Dissertations and long projects</li>
                          <li>Coding, calculations, engineering tasks</li>
                          <li>Business plans & proposals</li>
                          <li>Nursing papers & medical cases</li>
                          <li>Statistical analysis (SPSS, STATA, R, Python)</li>
                          <li>Professional editing and rewriting</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          <strong>No matter the complexity, subject, deadline, or volume—we deliver.</strong>
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Improved Delivery Rates Without Stress</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Account owners no longer need to:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Deal with unresponsive writers</li>
                          <li>Follow up repeatedly</li>
                          <li>Manage conflicts and excuses</li>
                          <li>Fix poor-quality work</li>
                          <li>Worry about missing deadlines</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Our system eliminates commotion and delays by using a structured workflow, ensuring your orders are completed smoothly and consistently.
                        </p>
                        <p style="margin: 10px 0 0; color: #1D3557; font-size: 15px; line-height: 1.7; font-weight: 600;">
                          We help you increase your job delivery rate significantly—even during peak seasons.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Fair Pricing + Flexible Billing</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Our rates are competitive and designed to protect your profit margins. We also offer:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Bi-weekly payment cycles (under agreement)</li>
                          <li>Payment-on-delivery options to guarantee your money is secure</li>
                          <li>Ability to set your preferred CPP with minimum backend protection</li>
                          <li>Optional bonuses and top-ups when you need premium quality</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          <strong>We give you full financial control with maximum transparency.</strong>
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Consistency Through Dedicated Teams</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Your orders can be assigned to:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Specific managers</li>
                          <li>Specific writers</li>
                          <li>Specialized editors</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          This builds long-term consistency and predictable quality. If you have your own writers or managers, you may onboard them into our system, integrating them into your workflow to improve productivity and increase earnings.
                        </p>
                        <p style="margin: 10px 0 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          <strong>Even small accounts can scale up efficiently with our structure.</strong>
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 0;">
                        <h4 style="margin: 0 0 12px; color: #1D3557; font-size: 17px; font-weight: 600;">✓ Quality Assurance Guaranteed</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                          Every completed order undergoes:
                        </p>
                        <ul style="margin: 10px 0 0 20px; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                          <li>Plagiarism checking</li>
                          <li>AI detection screening (where required)</li>
                          <li>Formatting review</li>
                          <li>Academic standard verification</li>
                          <li>Grammar and clarity polishing</li>
                        </ul>
                        <p style="margin: 10px 0 0; color: #1D3557; font-size: 15px; line-height: 1.7; font-weight: 600;">
                          You receive work that is polished and ready for your client—no corrections needed.
                        </p>
                      </div>
                    </div>
                    
                    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 25px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 15px; color: #065f46; font-size: 20px; font-weight: 700;">Conclusion</h3>
                      <p style="margin: 0; color: #065f46; font-size: 16px; line-height: 1.8;">
                        Our platform exists to make your academic account easier to manage, more profitable, and more reliable. By posting your jobs with us, you gain a fully supported writing ecosystem with trained writers, managers, and editors committed to delivering excellence. Whether you handle a large account or a small one, we guarantee <strong>consistency, quality, speed, and peace of mind</strong>.
                      </p>
                      <p style="margin: 15px 0 0; color: #065f46; font-size: 16px; line-height: 1.8; font-weight: 600;">
                        We are ready to support your operations, boost your delivery capacity, and provide the dependable team you deserve.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="https://tasklynk.co.ke/login" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 17px; font-weight: 600; box-shadow: 0 4px 12px rgba(29, 53, 87, 0.3);">
                        Access Your Dashboard
                      </a>
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #1D3557; font-size: 17px; line-height: 1.7; font-weight: 600;">
                      Warm regards,<br>
                      TaskLynk Academic Place<br>
                      <span style="color: #4b5563; font-weight: 400;">Academic Writing & Management Services</span>
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// ==================== PROMOTIONAL EMAIL TEMPLATES ====================

/**
 * Promotional email template for CLIENT INVITATION
 * Highlights academic writing services, benefits, and quality guarantees
 */
export function getClientPromotionalEmailHTML(recipientName?: string): string {
  const greeting = recipientName ? `Dear ${recipientName}` : 'Hello';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transform Your Academic Writing Business - TaskLynk</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <!-- Hero Section -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h2 style="margin: 0 0 15px; color: #1D3557; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        🎓 Premium Academic Writing Services<br/>That Scale With Your Business
                      </h2>
                      <p style="margin: 0; color: #F2A541; font-size: 18px; font-weight: 600;">
                        Professional • Reliable • On-Time Delivery
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.7;">
                      ${greeting},
                    </p>
                    
                    <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.7;">
                      Are you looking for a <strong>reliable academic writing partner</strong> that can handle your orders with consistency, quality, and professionalism? TaskLynk Academic is Kenya's leading platform connecting clients with vetted academic writers, managers, and editors.
                    </p>
                    
                    <!-- Key Benefits Section -->
                    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 10px; padding: 30px; margin: 30px 0;">
                      <h3 style="margin: 0 0 20px; color: #1D3557; font-size: 22px; font-weight: 700; text-align: center;">
                        ✨ Why Choose TaskLynk?
                      </h3>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">📝</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Comprehensive Academic Services</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Essays, Research Papers, Dissertations, Theses, Case Studies, Literature Reviews, Annotated Bibliographies, PowerPoint Presentations, Excel Projects, SPSS Analysis, and more.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">⚡</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Fast Turnaround Times</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Rush orders in as little as <strong>3-6 hours</strong>. Standard delivery within 24-48 hours. Our network of 50+ active writers ensures capacity even during peak seasons.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">🔒</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Quality Assurance Guaranteed</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Every paper passes through plagiarism detection, grammar checks, AI detection screening, and formatting review. <strong>Free revisions</strong> until you're satisfied.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">💰</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Flexible Pricing & Payment</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Competitive rates starting at <strong>KSh 240/page</strong>. M-Pesa payments accepted. Bi-weekly billing options available. Set your own CPP rates with backend support.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 0;">
                        <div style="display: table; width: 100%;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">👥</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Dedicated Account Management</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Assign specific managers and writers to your account for consistency. Onboard your own team members into our platform. Scale your operations effortlessly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Services Overview -->
                    <div style="background-color: #fffbeb; border-left: 4px solid #F2A541; padding: 25px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 15px; color: #92400e; font-size: 20px; font-weight: 700;">
                        📚 Our Academic Writing Services
                      </h3>
                      <ul style="margin: 0; padding: 0 0 0 20px; color: #78350f; font-size: 15px; line-height: 2;">
                        <li><strong>Essays & Term Papers</strong> - All citation styles (APA, MLA, Harvard, Chicago)</li>
                        <li><strong>Research Papers & Reports</strong> - Data analysis, charts, references</li>
                        <li><strong>Dissertations & Theses</strong> - Chapter-by-chapter support</li>
                        <li><strong>Case Studies & Business Analysis</strong> - Real-world applications</li>
                        <li><strong>Literature Reviews</strong> - Comprehensive source synthesis</li>
                        <li><strong>PowerPoint Presentations</strong> - Professional slide design</li>
                        <li><strong>Excel & SPSS Projects</strong> - Statistical analysis and data visualization</li>
                        <li><strong>Editing & Proofreading</strong> - Polish existing documents</li>
                      </ul>
                    </div>
                    
                    <!-- How It Works -->
                    <div style="margin: 30px 0;">
                      <h3 style="margin: 0 0 20px; color: #1D3557; font-size: 22px; font-weight: 700; text-align: center;">
                        🚀 How It Works
                      </h3>
                      
                      <table width="100%" cellpadding="15" cellspacing="0">
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">1</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #1D3557; font-size: 16px; font-weight: 600;">Register Your Account</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">Create a free client account in under 2 minutes</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">2</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #1D3557; font-size: 16px; font-weight: 600;">Post Your Order</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">Submit details, attach instructions, set your deadline</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">3</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #1D3557; font-size: 16px; font-weight: 600;">Get Matched & Assigned</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">We assign the best writer based on subject expertise</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">4</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #1D3557; font-size: 16px; font-weight: 600;">Receive & Review</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">Download completed work, request revisions if needed</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Testimonial/Trust Section -->
                    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
                      <p style="margin: 0 0 10px; color: #065f46; font-size: 18px; line-height: 1.6; font-style: italic;">
                        "TaskLynk has transformed how we manage academic orders. The quality is consistent, deadlines are always met, and the support team is incredibly responsive."
                      </p>
                      <p style="margin: 0; color: #047857; font-size: 14px; font-weight: 600;">
                        — Academic Account Manager
                      </p>
                    </div>
                    
                    <!-- Special Offer -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 30px; margin: 30px 0; text-align: center; border: 3px solid #F2A541;">
                      <h3 style="margin: 0 0 15px; color: #78350f; font-size: 24px; font-weight: 700;">
                        🎁 Special Launch Offer!
                      </h3>
                      <p style="margin: 0 0 20px; color: #92400e; font-size: 16px; line-height: 1.6;">
                        Register now and get <strong>10% off your first 5 orders</strong><br/>
                        Plus <strong>free plagiarism reports</strong> on all submissions
                      </p>
                      <p style="margin: 0; color: #78350f; font-size: 14px;">
                        Limited time offer • New clients only
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="https://tasklynk.co.ke/register/client" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 10px; font-size: 18px; font-weight: 700; box-shadow: 0 4px 15px rgba(29, 53, 87, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                        Register as Client Now
                      </a>
                      <p style="margin: 15px 0 0; color: #6b7280; font-size: 14px;">
                        Free registration • No credit card required • Start posting orders immediately
                      </p>
                    </div>
                    
                    <!-- Contact Information -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h4 style="margin: 0 0 15px; color: #1D3557; font-size: 16px; font-weight: 600; text-align: center;">
                        📞 Need Help? Contact Us
                      </h4>
                      <table width="100%" cellpadding="5" cellspacing="0">
                        <tr>
                          <td style="text-align: center; color: #4b5563; font-size: 14px;">
                            <strong>Email:</strong> admn@tasklynk.co.ke<br/>
                            <strong>Phone:</strong> +254 701 066 845<br/>
                            <strong>Website:</strong> <a href="https://tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">www.tasklynk.co.ke</a>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #1D3557; font-size: 16px; line-height: 1.7;">
                      Best regards,<br/>
                      <strong>The TaskLynk Team</strong><br/>
                      <span style="color: #6b7280; font-size: 14px;">Professional Academic Writing Platform</span>
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Promotional email template for FREELANCER INVITATION
 * Highlights earning opportunities, flexible work, and career growth
 */
export function getFreelancerPromotionalEmailHTML(recipientName?: string): string {
  const greeting = recipientName ? `Dear ${recipientName}` : 'Hello';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join TaskLynk - Earn as a Freelance Academic Writer</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <!-- Hero Section -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h2 style="margin: 0 0 15px; color: #1D3557; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        ✍️ Turn Your Writing Skills Into<br/>Consistent Income
                      </h2>
                      <p style="margin: 0; color: #10b981; font-size: 20px; font-weight: 600;">
                        Join 50+ Active Writers Earning Daily
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.7;">
                      ${greeting},
                    </p>
                    
                    <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.7;">
                      Are you a skilled academic writer looking for <strong>steady work</strong>, <strong>fair compensation</strong>, and a <strong>professional platform</strong> that values your expertise? TaskLynk Academic is Kenya's premier writing marketplace connecting talented writers with high-quality academic orders.
                    </p>
                    
                    <!-- Earnings Highlight -->
                    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 10px; padding: 30px; margin: 30px 0; text-align: center; border: 3px solid #10b981;">
                      <h3 style="margin: 0 0 15px; color: #065f46; font-size: 26px; font-weight: 700;">
                        💰 Earn KSh 150 - 200 Per Page
                      </h3>
                      <p style="margin: 0; color: #047857; font-size: 16px; line-height: 1.6;">
                        <strong>Plus +KSh 20 bonus</strong> for technical work (Excel, SPSS, PowerPoint)<br/>
                        Progressive rate increases as you complete more orders
                      </p>
                    </div>
                    
                    <!-- Key Benefits Section -->
                    <div style="background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 10px; padding: 30px; margin: 30px 0;">
                      <h3 style="margin: 0 0 20px; color: #1D3557; font-size: 22px; font-weight: 700; text-align: center;">
                        🌟 Why Join TaskLynk?
                      </h3>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">📈</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Progressive Earnings System</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Start at <strong>KSh 150/page</strong> and progress through 5 tiers up to <strong>KSh 200/page</strong> as you complete orders (3 → 5 → 15 → 27+ orders). Your rates automatically increase with experience!
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">⚡</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Consistent Daily Orders</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Access orders 24/7 through our platform. Choose assignments that match your expertise and schedule. Never run out of work—we have a steady flow of academic orders across all subjects.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">💳</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Fast & Reliable Payments</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              <strong>Get paid within 24-48 hours</strong> after order approval. M-Pesa and bank transfer options available. Request payouts anytime from your available balance. No payment delays or disputes.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">🏠</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Work From Anywhere</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Complete flexibility—work from home, coffee shop, or anywhere with internet. Set your own schedule. Take on as many orders as you can handle. Perfect for students, part-timers, or full-time writers.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 25px;">
                        <div style="display: table; width: 100%; margin-bottom: 15px;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">🎯</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Subject Matching System</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Get assigned orders that match your expertise. Specialize in Business, Nursing, Psychology, IT, Engineering, or any subject. Build your reputation in your strongest areas.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 0;">
                        <div style="display: table; width: 100%;">
                          <div style="display: table-cell; vertical-align: top; width: 40px;">
                            <span style="font-size: 24px;">🛡️</span>
                          </div>
                          <div style="display: table-cell; vertical-align: top;">
                            <h4 style="margin: 0 0 8px; color: #1D3557; font-size: 17px; font-weight: 600;">Professional Support & Tools</h4>
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                              Access plagiarism checkers, grammar tools, and formatting guides. Get support from managers and editors. Join a community of professional writers who help each other succeed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Earnings Breakdown -->
                    <div style="background-color: #fffbeb; border-left: 4px solid #F2A541; padding: 25px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 15px; color: #92400e; font-size: 20px; font-weight: 700;">
                        💵 Your Earning Potential
                      </h3>
                      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                        <tr style="background-color: #fef3c7;">
                          <td style="padding: 10px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">Tier</td>
                          <td style="padding: 10px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">Orders Completed</td>
                          <td style="padding: 10px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">Rate/Page</td>
                          <td style="padding: 10px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">Technical Work</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">Starter</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">0-2</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">KSh 150</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">KSh 170</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">Rising</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">3-4</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">KSh 160</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">KSh 180</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">Established</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">5-14</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">KSh 170</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">KSh 190</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">Expert</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">15-26</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f; font-weight: 600;">KSh 180</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f;">KSh 200</td>
                        </tr>
                        <tr style="background-color: #fef3c7;">
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f; font-weight: 700;">Master</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #78350f; font-weight: 700;">27+</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #10b981; font-weight: 700;">KSh 200</td>
                          <td style="padding: 8px; border: 1px solid #fde68a; color: #10b981; font-weight: 700;">KSh 220</td>
                        </tr>
                      </table>
                      <p style="margin: 15px 0 0; color: #78350f; font-size: 14px; font-style: italic;">
                        * Example: Complete 20 orders at KSh 170/page (5 pages each) = <strong>KSh 17,000</strong>
                      </p>
                    </div>
                    
                    <!-- Requirements -->
                    <div style="margin: 30px 0;">
                      <h3 style="margin: 0 0 20px; color: #1D3557; font-size: 22px; font-weight: 700; text-align: center;">
                        ✅ Basic Requirements
                      </h3>
                      
                      <ul style="margin: 0; padding: 0 0 0 20px; color: #374151; font-size: 15px; line-height: 2;">
                        <li>Bachelor's degree or higher (any field)</li>
                        <li>Strong English writing and grammar skills</li>
                        <li>Ability to follow academic citation styles (APA, MLA, Harvard, Chicago)</li>
                        <li>Reliable internet connection and computer/laptop</li>
                        <li>Commitment to meeting deadlines</li>
                        <li>Plagiarism-free original work</li>
                      </ul>
                      
                      <p style="margin: 15px 0 0; color: #10b981; font-size: 15px; font-weight: 600;">
                        ✓ Previous writing experience is a bonus but NOT required—we provide training!
                      </p>
                    </div>
                    
                    <!-- How To Get Started -->
                    <div style="background-color: #f0fdf4; border-radius: 10px; padding: 30px; margin: 30px 0;">
                      <h3 style="margin: 0 0 20px; color: #065f46; font-size: 22px; font-weight: 700; text-align: center;">
                        🚀 How To Get Started
                      </h3>
                      
                      <table width="100%" cellpadding="15" cellspacing="0">
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">1</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #065f46; font-size: 16px; font-weight: 600;">Register as Freelancer</h4>
                            <p style="margin: 0; color: #047857; font-size: 14px;">Complete the registration form with your details and qualifications</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">2</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #065f46; font-size: 16px; font-weight: 600;">Complete Test Assignment</h4>
                            <p style="margin: 0; color: #047857; font-size: 14px;">Submit a short writing sample to demonstrate your skills</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 60px; text-align: center; vertical-align: top;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; color: white; font-size: 24px; font-weight: 700; line-height: 50px; text-align: center; margin: 0 auto;">3</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 5px; color: #065f46; font-size: 16px; font-weight: 600;">Get Approved & Start Earning</h4>
                            <p style="margin: 0; color: #047857; font-size: 14px;">Once approved, start accepting orders immediately</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Testimonial -->
                    <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
                      <p style="margin: 0 0 10px; color: #1e40af; font-size: 17px; line-height: 1.6; font-style: italic;">
                        "I started with TaskLynk 6 months ago as a part-time writer. Now I'm earning KSh 40,000+ per month while still in university. The flexibility and consistent orders are amazing!"
                      </p>
                      <p style="margin: 0; color: #1e3a8a; font-size: 14px; font-weight: 600;">
                        — Sarah K., Master Tier Writer
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="https://tasklynk.co.ke/register/freelancer" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 10px; font-size: 18px; font-weight: 700; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                        Join as Freelancer Now
                      </a>
                      <p style="margin: 15px 0 0; color: #6b7280; font-size: 14px;">
                        Free registration • Get approved in 24-48 hours • Start earning immediately
                      </p>
                    </div>
                    
                    <!-- FAQ Quick Answers -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0;">
                      <h4 style="margin: 0 0 20px; color: #1D3557; font-size: 18px; font-weight: 600; text-align: center;">
                        ❓ Quick Questions?
                      </h4>
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 5px; color: #1D3557; font-size: 14px; font-weight: 600;">How much can I earn monthly?</p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Writers typically earn KSh 15,000 - 60,000/month depending on volume and tier level.</p>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 5px; color: #1D3557; font-size: 14px; font-weight: 600;">When do I get paid?</p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px;">Within 24-48 hours after the client approves your work. Request payout anytime.</p>
                      </div>
                      <div style="margin-bottom: 0;">
                        <p style="margin: 0 0 5px; color: #1D3557; font-size: 14px; font-weight: 600;">Is there a registration fee?</p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px;">No! Registration is completely free. No hidden charges.</p>
                      </div>
                    </div>
                    
                    <!-- Contact Information -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h4 style="margin: 0 0 15px; color: #1D3557; font-size: 16px; font-weight: 600; text-align: center;">
                        📞 Questions? Reach Out
                      </h4>
                      <table width="100%" cellpadding="5" cellspacing="0">
                        <tr>
                          <td style="text-align: center; color: #4b5563; font-size: 14px;">
                            <strong>Email:</strong> admn@tasklynk.co.ke<br/>
                            <strong>Phone:</strong> +254 701 066 845<br/>
                            <strong>Website:</strong> <a href="https://tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">www.tasklynk.co.ke</a>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #1D3557; font-size: 16px; line-height: 1.7;">
                      Ready to start earning?<br/>
                      <strong>The TaskLynk Team</strong><br/>
                      <span style="color: #6b7280; font-size: 14px;">Professional Academic Writing Platform</span>
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Send promotional email to potential CLIENT
 */
export async function sendClientPromotionalEmail({
  to,
  recipientName,
}: {
  to: string;
  recipientName?: string;
}) {
  return sendEmail({
    to,
    subject: '🎓 Transform Your Academic Writing Business with TaskLynk',
    html: getClientPromotionalEmailHTML(recipientName),
    category: 'promotion',
  });
}

/**
 * Send promotional email to potential FREELANCER
 */
export async function sendFreelancerPromotionalEmail({
  to,
  recipientName,
}: {
  to: string;
  recipientName?: string;
}) {
  return sendEmail({
    to,
    subject: '✍️ Join TaskLynk - Earn KSh 150-200 Per Page as a Freelance Writer',
    html: getFreelancerPromotionalEmailHTML(recipientName),
    category: 'promotion',
  });
}

