import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, getEmailHeader, getEmailFooter } from '@/lib/email';
import { requireAdminRole } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    // Require admin role using centralized helper
    const authCheck = await requireAdminRole(req);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const adminUser = authCheck.user;

    const body = await req.json();
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if email already has an active invitation for client role
    const [existingInvitation] = await db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.email, email),
        eq(invitations.role, 'client')
      ));

    if (existingInvitation) {
      // Check if invitation is already used
      if (existingInvitation.used) {
        // Used invitation - delete it and allow new invitation
        await db
          .delete(invitations)
          .where(eq(invitations.id, existingInvitation.id));
      } else if (existingInvitation.expiresAt) {
        // Check if expired
        const now = new Date();
        const expiryDate = new Date(existingInvitation.expiresAt);
        if (now > expiryDate) {
          // Expired invitation - delete it and allow new invitation
          await db
            .delete(invitations)
            .where(eq(invitations.id, existingInvitation.id));
        } else {
          // Active invitation exists - prevent duplicate
          return NextResponse.json({ 
            error: 'An active invitation already exists for this email. Please wait for it to expire or use the resend option.',
            existingInvitation: {
              expiresAt: existingInvitation.expiresAt,
              createdAt: existingInvitation.createdAt,
            }
          }, { status: 400 });
        }
      } else {
        // No expiry date but not used - treat as active
        return NextResponse.json({ 
          error: 'An invitation already exists for this email',
          existingInvitation: {
            createdAt: existingInvitation.createdAt,
          }
        }, { status: 400 });
      }
    }

    // Check if user already exists as a client
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Generate secure token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days for clients

    // Create invitation
    const [invitation] = await db.insert(invitations).values({
      email,
      role: 'client',
      token: invitationToken,
      status: 'pending',
      createdByAdminId: adminUser.id,
      createdAt: new Date().toISOString(),
      used: false,
      expiresAt,
    }).returning();

    // Use production domain for the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke';
    const invitationLink = `${baseUrl}/register/client?token=${invitationToken}`;

    // Send persuasive email invitation
    let emailSent = false;
    let emailError: string | undefined;
    
    const emailHTML = getClientInvitationEmailHTML(email, name || '', invitationLink, String(adminUser.name ?? 'Admin'));
    
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: '🎓 Exclusive Invitation: Transform Your Academic Writing Business with TaskLynk',
        html: emailHTML,
        category: 'registration'
      });

      if (emailResult.success) {
        emailSent = true;
      } else {
        emailError = emailResult.error instanceof Error ? emailResult.error.message : String(emailResult.error);
        console.error('❌ [Client Invitation] Email delivery failed:', {
          email,
          error: emailError
        });
      }
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : 'Unknown error';
      console.error('❌ [Client Invitation] Email sending exception:', {
        email,
        error: emailErr,
        message: emailError
      });
    }

    return NextResponse.json({
      success: true,
      token: invitationToken,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      invitationLink,
      emailSent,
      emailError: emailError || undefined,
      message: emailSent 
        ? 'Client invitation created and email sent successfully' 
        : 'Client invitation created, but email delivery failed. You can manually share the invitation link.',
    });
  } catch (error) {
    console.error('Error creating client invitation:', error);
    return NextResponse.json({ 
      error: 'Failed to create invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Persuasive email template for client invitation - highlights benefits and services
function getClientInvitationEmailHTML(email: string, name: string, invitationLink: string, adminName: string): string {
  const greeting = name ? `Dear ${name}` : 'Dear Client/Account Owner';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exclusive Invitation - TaskLynk Academic Services</title>
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
                      <h1 style="margin: 0 0 15px; color: #1D3557; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        🎓 You're Invited to Join<br/>Kenya's #1 Academic Writing Platform
                      </h1>
                      <p style="margin: 0; color: #F2A541; font-size: 18px; font-weight: 600;">
                        Post Work. Get Work Done. Scale Your Business.
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.7;">
                      ${greeting},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.7;">
                      Are you looking for a <strong>reliable, efficient, and high-quality team</strong> to handle your academic writing workload, manage writers, and deliver work that is <strong>ready for submission</strong>?
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.7;">
                      You've been personally invited by <strong>${adminName}</strong> to join <strong>TaskLynk Academic</strong> – the platform designed specifically for account owners who want to <strong>scale productivity, eliminate writer follow-up stress, and maximize delivery rates</strong> with guaranteed quality and consistency.
                    </p>
                    
                    <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.7;">
                      We connect you to a large pool of <strong>qualified, vetted, and specialized academic writers</strong>, supported by a professional management and editorial team. Once you post your jobs on our platform, we take full responsibility for assigning them to the right writers, overseeing progress, editing submissions, and ensuring the final work is polished, original, and formatted for immediate submission. <strong>You only need to hire bidders—we handle everything else.</strong>
                    </p>
                    
                    <!-- Why Account Owners Prefer Our System -->
                    <div style="background: linear-gradient(135deg, #1D3557 0%, #2a4a7f 100%); border-radius: 10px; padding: 30px; margin: 30px 0; color: #ffffff;">
                      <h3 style="margin: 0 0 20px; color: #F2A541; font-size: 22px; font-weight: 700;">
                        💼 Why Account Owners Prefer Our System
                      </h3>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 16px;">
                          <strong>✔ Reliable Access to Qualified Writers</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e7eb;">
                          Instant access to hundreds of trained writers handling: Regular academic work, Technical assignments, Business tasks, STEM papers, Research, Coding, Statistics, Engineering, Nursing, Finance—every category. No more gambling with inconsistent freelancers.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 16px;">
                          <strong>✔ Professional Manager + Editor Workflow</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e7eb;">
                          Every order enters a three-layer quality system: <strong>Manager</strong> (assigns & supervises) → <strong>Writer</strong> (completes professionally) → <strong>Editor</strong> (reviews, proofreads, polishes). The output is 100% ready for submission—no editing or chasing writers required.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 16px;">
                          <strong>✔ 24/7 Availability & Ultra-Fast Delivery</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e7eb;">
                          Urgent orders within <strong>3 hours</strong>. Same-day deliveries. High-capacity workload handling (no backlog). Immediate replacement writers if issues arise. Reliability guaranteed—even during peak periods.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 0;">
                        <p style="margin: 0 0 8px; font-size: 16px;">
                          <strong>✔ Improved Delivery Rates Without Stress</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e7eb;">
                          No more: Unresponsive writers, Repeated follow-ups, Conflicts and excuses, Poor-quality fixes, Missing deadlines. Our structured workflow eliminates commotion and delays.
                        </p>
                      </div>
                    </div>
                    
                    <!-- Key Benefits Section -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 30px; margin: 30px 0; border-left: 5px solid #F2A541;">
                      <h3 style="margin: 0 0 20px; color: #92400e; font-size: 22px; font-weight: 700;">
                        ✨ Complete Service Coverage
                      </h3>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; color: #78350f; font-size: 16px;">
                          <strong>📝 We Handle ALL Types of Orders</strong>
                        </p>
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                          Essays, Reports, Reflections • Dissertations & Long Projects • Coding, Calculations, Engineering • Business Plans & Proposals • Nursing & Medical Cases • Statistical Analysis (SPSS, STATA, R, Python) • Professional Editing & Rewriting • PowerPoint Presentations • Research Papers & Literature Reviews
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; color: #78350f; font-size: 16px;">
                          <strong>🔒 Quality Assurance Guaranteed</strong>
                        </p>
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                          Every completed order undergoes: Plagiarism checking • AI detection screening • Formatting review • Academic standard verification • Grammar and clarity polishing. <strong>Work arrives polished and ready—no corrections needed.</strong>
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; color: #78350f; font-size: 16px;">
                          <strong>💰 Fair Pricing + Flexible Billing</strong>
                        </p>
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                          Competitive rates from <strong>KSh 240/page</strong> • Bi-weekly payment cycles available • Payment-on-delivery options • Set your preferred CPP with minimum backend protection • M-Pesa and card payments accepted
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 0;">
                        <p style="margin: 0 0 8px; color: #78350f; font-size: 16px;">
                          <strong>👥 Consistency Through Dedicated Teams</strong>
                        </p>
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                          Assign specific managers, writers, and editors to your account. Onboard your own team members into our system. Even small accounts can scale up efficiently.
                        </p>
                      </div>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${invitationLink}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #F2A541 0%, #e6932f 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(242, 165, 65, 0.4);">
                        🚀 Accept Invitation & Register Now
                      </a>
                    </div>
                    
                    <p style="margin: 0 0 25px; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                      <em>Registration takes less than 2 minutes. No credit card required to start.</em>
                    </p>
                    
                    <!-- What You Get Section -->
                    <div style="background-color: #f0fdf4; border-radius: 10px; padding: 25px; margin: 30px 0; border: 1px solid #86efac;">
                      <h3 style="margin: 0 0 15px; color: #166534; font-size: 18px; font-weight: 700;">
                        📋 As a TaskLynk Client, You'll Get:
                      </h3>
                      <ul style="margin: 0; padding: 0 0 0 20px; color: #15803d; font-size: 14px; line-height: 2;">
                        <li>Access to our dashboard to post and manage orders</li>
                        <li>Real-time order tracking and notifications</li>
                        <li>Direct communication with assigned writers</li>
                        <li>Secure file uploads and downloads</li>
                        <li>Payment history and invoice management</li>
                        <li>Priority support via WhatsApp and email</li>
                        <li>No minimum order requirements</li>
                        <li>Volume discounts for regular clients</li>
                      </ul>
                    </div>
                    
                    <!-- Testimonial -->
                    <div style="background-color: #eff6ff; border-radius: 10px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                      <p style="margin: 0 0 15px; color: #1e40af; font-size: 15px; line-height: 1.7; font-style: italic;">
                        "TaskLynk transformed how I run my writing business. The quality is consistent, the turnaround is reliable, and their support team is always available. I've increased my capacity by 3x without any headaches."
                      </p>
                      <p style="margin: 0; color: #1d4ed8; font-size: 14px; font-weight: 600;">
                        — Sarah K., Nairobi (Client since 2023)
                      </p>
                    </div>
                    
                    <!-- Link Info -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="margin: 0 0 10px; color: #374151; font-size: 14px;">
                        <strong>Your exclusive invitation link:</strong>
                      </p>
                      <p style="margin: 0; word-break: break-all; font-size: 12px; color: #6b7280; font-family: monospace; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        ${invitationLink}
                      </p>
                      <p style="margin: 15px 0 0; color: #9ca3af; font-size: 13px;">
                        ⏰ This invitation expires in <strong>14 days</strong>. Don't miss out!
                      </p>
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #1D3557; font-size: 17px; line-height: 1.7; font-weight: 600;">
                      Looking forward to welcoming you to TaskLynk!<br><br>
                      Best regards,<br>
                      <strong>${adminName}</strong><br>
                      <span style="color: #4b5563; font-weight: 400;">TaskLynk Academic Team</span>
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

