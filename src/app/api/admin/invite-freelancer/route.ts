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

    // Check if email already has an active invitation for freelancer/writer role
    const [existingInvitation] = await db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.email, email),
        eq(invitations.role, 'writer')
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

    // Check if user already exists
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
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days for freelancers

    // Create invitation - use 'writer' role for freelancers in the database
    const [invitation] = await db.insert(invitations).values({
      email,
      role: 'writer',
      token: invitationToken,
      status: 'pending',
      createdByAdminId: adminUser.id,
      createdAt: new Date().toISOString(),
      used: false,
      expiresAt,
    }).returning();

    // Use production domain for the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke';
    const invitationLink = `${baseUrl}/register/freelancer?token=${invitationToken}`;

    // Send persuasive email invitation
    let emailSent = false;
    let emailError: string | undefined;
    
    const emailHTML = getFreelancerInvitationEmailHTML(email, name || '', invitationLink, String(adminUser.name ?? 'Admin'));
    
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: '💸 You\'re Invited: Earn Money Online with TaskLynk - Kenya\'s #1 Academic Writing Platform',
        html: emailHTML,
        category: 'registration'
      });

      if (emailResult.success) {
        emailSent = true;
      } else {
        emailError = emailResult.error instanceof Error ? emailResult.error.message : String(emailResult.error);
        console.error('❌ [Freelancer Invitation] Email delivery failed:', {
          email,
          error: emailError
        });
      }
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : 'Unknown error';
      console.error('❌ [Freelancer Invitation] Email sending exception:', {
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
        ? 'Freelancer invitation created and email sent successfully' 
        : 'Freelancer invitation created, but email delivery failed. You can manually share the invitation link.',
    });
  } catch (error) {
    console.error('Error creating freelancer invitation:', error);
    return NextResponse.json({ 
      error: 'Failed to create invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Persuasive email template for freelancer invitation - highlights earning opportunities
function getFreelancerInvitationEmailHTML(email: string, name: string, invitationLink: string, adminName: string): string {
  const greeting = name ? `Dear ${name}` : 'Hello Future TaskLynk Writer';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Earn Money with TaskLynk - Freelancer Invitation</title>
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
                        💸 Want to Make Money Online<br/>Using Your Skills?
                      </h1>
                      <p style="margin: 0; color: #F2A541; font-size: 18px; font-weight: 600;">
                        TaskLynk is Hiring Freelance Writers!
                      </p>
                      <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">
                        <em>Where Talent Meets Opportunity</em>
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.7;">
                      ${greeting},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.7;">
                      You've been personally invited by <strong>${adminName}</strong> to join <strong>TaskLynk Academic</strong> – Kenya's #1 platform connecting talented writers with clients who need academic and professional writing services.
                    </p>
                    
                    <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.7;">
                      If you can <strong>write, research, analyze, or design</strong> — you can earn! Whether you're a student, graduate, or professional looking for flexible income, TaskLynk offers you the opportunity to <strong>work remotely from anywhere</strong> and get paid for your expertise.
                    </p>
                    
                    <!-- Earning Opportunities -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; padding: 30px; margin: 30px 0; color: #ffffff;">
                      <h3 style="margin: 0 0 20px; color: #ffffff; font-size: 22px; font-weight: 700;">
                        💰 Your Earning Potential
                      </h3>
                      
                      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
                        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 15px; flex: 1; min-width: 120px; text-align: center;">
                          <p style="margin: 0 0 5px; font-size: 24px; font-weight: 700;">KSh 150+</p>
                          <p style="margin: 0; font-size: 12px; color: #d1fae5;">Per Page (Starter)</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 15px; flex: 1; min-width: 120px; text-align: center;">
                          <p style="margin: 0 0 5px; font-size: 24px; font-weight: 700;">KSh 200+</p>
                          <p style="margin: 0; font-size: 12px; color: #d1fae5;">Per Page (Master Tier)</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 15px; flex: 1; min-width: 120px; text-align: center;">
                          <p style="margin: 0 0 5px; font-size: 24px; font-weight: 700;">+KSh 20</p>
                          <p style="margin: 0; font-size: 12px; color: #d1fae5;">Technical Work Bonus</p>
                        </div>
                      </div>
                      
                      <p style="margin: 0; font-size: 14px; color: #d1fae5;">
                        ✨ <strong>Progress through 5 CPP tiers</strong> as you complete more orders: Starter → Rising → Established → Expert → Master
                      </p>
                    </div>
                    
                    <!-- What We Need -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 30px; margin: 30px 0; border-left: 5px solid #F2A541;">
                      <h3 style="margin: 0 0 20px; color: #92400e; font-size: 22px; font-weight: 700;">
                        📌 Skills We're Looking For
                      </h3>
                      
                      <div style="columns: 2; column-gap: 20px;">
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Academic Writing</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Research Papers</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Essays & Reports</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Dissertations</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ SPSS & STATA Analysis</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Python & R Coding</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ PowerPoint Presentations</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Business Plans</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Nursing & Medical Cases</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Engineering Tasks</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Proofreading & Editing</p>
                        <p style="margin: 0 0 10px; color: #78350f; font-size: 14px;">✅ Data Entry</p>
                      </div>
                      
                      <p style="margin: 20px 0 0; color: #92400e; font-size: 14px; font-style: italic;">
                        💡 <strong>No experience?</strong> If you have strong writing or analytical skills, you can start earning and build your reputation!
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${invitationLink}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                        🚀 Accept Invitation & Start Earning
                      </a>
                    </div>
                    
                    <p style="margin: 0 0 25px; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                      <em>Registration takes less than 2 minutes. Start bidding on jobs immediately!</em>
                    </p>
                    
                    <!-- Benefits Section -->
                    <div style="background: linear-gradient(135deg, #1D3557 0%, #2a4a7f 100%); border-radius: 10px; padding: 30px; margin: 30px 0; color: #ffffff;">
                      <h3 style="margin: 0 0 20px; color: #F2A541; font-size: 22px; font-weight: 700;">
                        🔥 Benefits of Working with TaskLynk
                      </h3>
                      
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 5px; font-size: 16px;">
                          <strong>✔ Work From Anywhere</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #e5e7eb;">
                          No office required. Work from home, campus, or anywhere with internet access.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 5px; font-size: 16px;">
                          <strong>✔ Choose Tasks You Like</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #e5e7eb;">
                          Browse available orders and bid only on work that matches your expertise.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 5px; font-size: 16px;">
                          <strong>✔ Get Paid Securely & On Time</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #e5e7eb;">
                          Weekly payouts via M-Pesa. Fair and transparent payment system with no hidden deductions.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 0 0 5px; font-size: 16px;">
                          <strong>✔ Build Your Reputation</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #e5e7eb;">
                          Progress through CPP tiers, earn higher rates, and build a portfolio of completed work.
                        </p>
                      </div>
                      
                      <div style="margin-bottom: 0;">
                        <p style="margin: 0 0 5px; font-size: 16px;">
                          <strong>✔ Steady Work Flow</strong>
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #e5e7eb;">
                          Hundreds of orders posted daily. Never run out of work opportunities.
                        </p>
                      </div>
                    </div>
                    
                    <!-- What You Get Section -->
                    <div style="background-color: #f0fdf4; border-radius: 10px; padding: 25px; margin: 30px 0; border: 1px solid #86efac;">
                      <h3 style="margin: 0 0 15px; color: #166534; font-size: 18px; font-weight: 700;">
                        📋 As a TaskLynk Freelancer, You'll Get:
                      </h3>
                      <ul style="margin: 0; padding: 0 0 0 20px; color: #15803d; font-size: 14px; line-height: 2;">
                        <li>Access to your personal dashboard to browse and bid on orders</li>
                        <li>Real-time notifications for new assignments</li>
                        <li>Direct messaging with managers and clients</li>
                        <li>Secure file uploads for your submissions</li>
                        <li>Earnings tracker and payment history</li>
                        <li>CPP progression system (earn more as you grow)</li>
                        <li>Support from our management team</li>
                        <li>Flexible working hours - work at your own pace</li>
                      </ul>
                    </div>
                    
                    <!-- Testimonial -->
                    <div style="background-color: #eff6ff; border-radius: 10px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                      <p style="margin: 0 0 15px; color: #1e40af; font-size: 15px; line-height: 1.7; font-style: italic;">
                        "I joined TaskLynk as a student and now I earn a consistent income every week. The platform is easy to use, payments are reliable, and I can work whenever I have free time. Best decision I ever made!"
                      </p>
                      <p style="margin: 0; color: #1d4ed8; font-size: 14px; font-weight: 600;">
                        — James M., Freelancer since 2023
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
                        ⏰ This invitation expires in <strong>14 days</strong>. Don't miss this opportunity!
                      </p>
                    </div>
                    
                    <!-- Slogan -->
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 10px;">
                      <p style="margin: 0; color: #166534; font-size: 18px; font-weight: 700;">
                        🌀 TaskLynk – Where Talent Meets Opportunity
                      </p>
                      <p style="margin: 10px 0 0; color: #15803d; font-size: 14px;">
                        Post Work. Get Work. Earn Respect.
                      </p>
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #1D3557; font-size: 17px; line-height: 1.7; font-weight: 600;">
                      Looking forward to having you on the team!<br><br>
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

