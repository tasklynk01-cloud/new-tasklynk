import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailHeader,
  getEmailFooter,
  wrapInEmailLayout,
  getAccountApprovedEmailHTML,
  getJobAssignedEmailHTML,
  getRevisionRequestedEmailHTML,
  getWorkDeliveredEmailHTML,
  getPaymentConfirmedEmailHTML,
  getPasswordResetEmailHTML,
  getEmailVerificationHTML,
  getClientPromotionalEmailHTML,
  getFreelancerPromotionalEmailHTML,
  getAccountOwnerWelcomeHTML,
  getAccountRegistrationReceivedHTML,
} from '@/lib/email';
import { emailTemplates, renderTemplate, getAccountActivationEmailHTML } from '@/lib/email-templates';

// Catalog of sample data for previewing templates
const SAMPLE_VARIABLES: Record<string, Record<string, string>> = {
  anniversary_specialist_update: {
    recipientName: 'Peter Wagogo (Verified Specialist)',
    profileUrl: 'http://localhost:5000/freelancer/profile',
    loginUrl: 'http://localhost:5000/login',
  },
  anniversary_client_appreciation: {
    recipientName: 'Dr. Evans Kiprono',
    exploreUrl: 'http://localhost:5000/services',
    newOrderUrl: 'http://localhost:5000/client/new-job',
  },
  anniversary_all_users_milestone: {
    recipientName: 'Valued TaskLynk Member',
    visitUrl: 'http://localhost:5000',
  },
  registration_approved: {
    name: 'Peter Wagogo',
    role: 'Financial Analyst & BI Specialist',
    loginUrl: 'http://localhost:5000/login',
    dashboardUrl: 'http://localhost:5000/freelancer',
  },
  registration_restored: {
    name: 'Catherine Wanjiku',
    loginUrl: 'http://localhost:5000/login',
  },
  client_registration_request: {
    clientName: 'Dr. Evans Kiprono',
    clientEmail: 'evans.kiprono@strathmore.edu',
    phoneNumber: '+254 712 345 678',
    academicLevel: 'Doctoral / PhD',
    institution: 'Strathmore University Business School',
    fieldOfStudy: 'Econometrics & Predictive Financial Risk Modeling',
    referralSource: 'Academic Colleague Referral',
    notes: 'Requires comprehensive Chapter 4 empirical data modeling (Panel GMM regression & Stata do-files).',
    adminReviewUrl: 'http://localhost:5000/admin/clients',
  },
  new_job_posted: {
    freelancerName: 'Shelma Chepchumba',
    jobTitle: 'Econometric Panel Data Estimation & JASP Hypothesis Testing',
    jobId: 'TL-ORD-84920',
    budget: 'KSh 18,500',
    deadline: 'Saturday, Nov 22, 2026 (5:00 PM EAT)',
    academicLevel: 'Master of Science',
    category: 'Statistical Data Analysis',
    description: 'Empirical analysis of 12-year financial stability indicators across 38 commercial banks using multivariate fixed-effects models and diagnostic residual checks.',
    viewJobUrl: 'http://localhost:5000/freelancer/jobs/84920',
    bidUrl: 'http://localhost:5000/freelancer/jobs/84920/bid',
  },
  request_bid: {
    freelancerName: 'Peter Wagogo',
    jobTitle: '5-Year Feasibility Study & Discounted Cash Flow Model for SACCO Expansion',
    jobId: 'TL-ORD-84931',
    budget: 'KSh 24,000',
    deadline: '48 Hours Express (Urgent)',
    academicLevel: 'Postgraduate / MBA',
    category: 'Finance & Financial Modeling',
    description: 'Comprehensive financial appraisal with sensitivity matrices, Monte Carlo scenario tables, and automated debt-service coverage calculations.',
    bidUrl: 'http://localhost:5000/freelancer/jobs/84931/bid',
    urgency: 'HIGH PRIORITY — 48H EXPRESS',
  },
  order_assigned: {
    freelancerName: 'Lucy Nduta',
    orderId: 'TL-ORD-77123',
    title: 'Executive Brand Identity Kit & Corporate Visual Guidelines',
    deadline: 'Thursday, Nov 20, 2026 (6:00 PM EAT)',
    pages: '18 Slides / Brand Deck',
    academicLevel: 'Corporate Executive / MBA',
    specialInstructions: 'Ensure exact compliance with CMYK / RGB palette tokens, vector typography guidelines, and responsive logo safe-zone exports.',
    downloadUrl: 'http://localhost:5000/freelancer/orders/77123/files',
    orderUrl: 'http://localhost:5000/freelancer/orders/77123',
  },
  promotional: {
    name: 'Valued Scholar',
    offerTitle: 'Mid-Semester Capstone & Dissertation Excellence Grant',
    discountPercentage: '20',
    promoCode: 'TURNOUT20',
    validUntil: 'Nov 30, 2026',
    ctaUrl: 'http://localhost:5000/client/new-order?promo=TURNOUT20',
    ctaText: 'Claim 20% Discount on Your Order',
    benefits: '• Free Turnitin Originality & AI Similarity Audit\n• Direct WhatsApp Coordination with Senior QA Editor\n• Unlimited Revisions & Free Defense Presentation Deck',
    terms: 'Valid on orders exceeding 5 pages or KSh 3,000. Cannot be combined with other promotional coupons.',
  },
  admin_activation: {
    name: 'Administrator',
    activationUrl: 'http://localhost:5000/verify-email?token=SAMPLE_ADMIN_ACTIVATION_TOKEN_99881',
    expiresInHours: '48',
  },
  client_activation: {
    name: 'David Otieno',
    activationUrl: 'http://localhost:5000/verify-email?token=SAMPLE_CLIENT_ACTIVATION_TOKEN_11223',
    expiresInHours: '48',
  },
  freelancer_activation: {
    name: 'Peter Wagogo',
    activationUrl: 'http://localhost:5000/verify-email?token=SAMPLE_EXPERT_ACTIVATION_TOKEN_44556',
    expiresInHours: '48',
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('template') || 'registration_approved';
  const format = searchParams.get('format') || 'html';
  const standalone = searchParams.get('standalone') === '1';

  let subject = 'TaskLynk Academic Solutions Notification';
  let html = '';

  // Check built-in helper functions from email.ts first
  switch (templateId) {
    case 'email_account_approved':
      subject = '🎉 Welcome to TaskLynk — Your Specialist Account is Approved!';
      html = getAccountApprovedEmailHTML('Peter Wagogo', 'Financial Analyst & BI Specialist');
      break;

    case 'email_job_assigned':
      subject = '📋 New Order Assigned: TL-ORD-84920';
      html = getJobAssignedEmailHTML(
        'Peter Wagogo',
        'TL-ORD-84920',
        'Econometric Panel Data Estimation & Stata Modeling',
        'Saturday, Nov 22, 2026 (5:00 PM EAT)'
      );
      break;

    case 'email_revision_requested':
      subject = '⚠️ Order Revision Requested: TL-ORD-84920';
      html = getRevisionRequestedEmailHTML(
        'Peter Wagogo',
        'TL-ORD-84920',
        'Client noted that Table 4.3 Hausman test p-value interpretation requires an extra explanatory paragraph connecting findings to the Hansen J-statistic.'
      );
      break;

    case 'email_work_delivered':
      subject = '✅ Milestone / Work Delivered: TL-ORD-84920';
      html = getWorkDeliveredEmailHTML(
        'Dr. Evans Kiprono',
        'Econometric Panel Data Estimation & JASP Hypothesis Testing',
        84920,
        'TL-ORD-84920',
        'Peter Wagogo (Lead Quantitative Specialist)'
      );
      break;

    case 'email_payment_confirmed':
      subject = '💳 Payment Credited — KSh 18,500';
      html = getPaymentConfirmedEmailHTML(
        'Peter Wagogo',
        'Econometric Panel Data Estimation & JASP Hypothesis Testing',
        'TL-ORD-84920',
        18500,
        42350
      );
      break;

    case 'email_password_reset':
      subject = '🔐 Reset Your TaskLynk Password';
      html = getPasswordResetEmailHTML('Peter Wagogo', 'sample-secure-token-88392-xyz');
      break;

    case 'email_verify_email':
      subject = '✉️ Verify Your TaskLynk Email Address';
      html = getEmailVerificationHTML('Catherine Wanjiku', '849201');
      break;

    case 'email_client_promotional':
      subject = '✨ Special Academic Excellence Grant — TaskLynk';
      html = getClientPromotionalEmailHTML('Dr. Evans Kiprono');
      break;

    case 'email_freelancer_promotional':
      subject = '🚀 High-Volume Assignment Surge — Claim Priority Projects';
      html = getFreelancerPromotionalEmailHTML('Peter Wagogo');
      break;

    case 'email_account_owner_welcome':
      subject = '👑 Master Account Privileges Configured — TaskLynk Academic';
      html = getAccountOwnerWelcomeHTML('Master Administrator');
      break;

    case 'email_registration_received':
      subject = '📥 Specialist Application Received — TaskLynk Review Queue';
      html = getAccountRegistrationReceivedHTML('Shelma Chepchumba');
      break;

    default: {
      // Check templates defined in email-templates.ts
      const template = emailTemplates.find((t) => t.id === templateId);
      if (template) {
        subject = template.subject;
        const defaultVars = SAMPLE_VARIABLES[templateId] || {};
        // Allow query param overrides
        const mergedVars: Record<string, string> = { ...defaultVars };
        template.variables.forEach((v) => {
          const val = searchParams.get(v);
          if (val) mergedVars[v] = val;
        });

        const rendered = renderTemplate(templateId, mergedVars);
        if (rendered) {
          subject = rendered.subject;
          html = rendered.html;
        } else {
          html = getAccountApprovedEmailHTML('Peter Wagogo', 'Financial Analyst & BI Specialist');
        }
      } else {
        // Fallback to default approved template
        subject = '🎉 Welcome to TaskLynk — Your Specialist Account is Approved!';
        html = getAccountApprovedEmailHTML('Peter Wagogo', 'Financial Analyst & BI Specialist');
      }
      break;
    }
  }

  // If user requested raw JSON
  if (format === 'json') {
    return NextResponse.json({
      template: templateId,
      subject,
      html,
    });
  }

  // Prepend an interactive navigation toolbar unless ?standalone=1 is passed
  let finalHtml = typeof html === 'string' ? html : String((html as any)?.html ?? html ?? '');
  if (!standalone) {
    const allTemplates = [
      { id: 'anniversary_specialist_update', name: '🎉 1-Yr: Specialist Profile Action' },
      { id: 'anniversary_client_appreciation', name: '⭐ 1-Yr: Client Appreciation & Services' },
      { id: 'anniversary_all_users_milestone', name: '🚀 1-Yr: Community Vision (All Users)' },
      { id: 'registration_approved', name: 'Account Approved (Specialist)' },
      { id: 'email_account_approved', name: 'Specialist Welcome & Onboarding' },
      { id: 'email_job_assigned', name: 'New Project Assigned' },
      { id: 'new_job_posted', name: 'Job Available Notification' },
      { id: 'request_bid', name: 'Invitation to Bid' },
      { id: 'email_work_delivered', name: 'Work Delivered / Clearance' },
      { id: 'email_revision_requested', name: 'Revision Request' },
      { id: 'email_payment_confirmed', name: 'M-Pesa Payment Receipt' },
      { id: 'client_registration_request', name: 'Client Registration Alert (Admin)' },
      { id: 'email_client_promotional', name: 'Client Promotional Offer' },
      { id: 'email_freelancer_promotional', name: 'Specialist Bonus Surge' },
      { id: 'email_password_reset', name: 'Password Reset' },
      { id: 'email_verify_email', name: 'Email Verification Code' },
      { id: 'registration_restored', name: 'Account Restored' },
      { id: 'admin_activation', name: 'Admin Portal Activation' },
    ];

    const optionsHtml = allTemplates
      .map(
        (t) =>
          `<option value="${t.id}" ${t.id === templateId ? 'selected' : ''}>${t.name}</option>`
      )
      .join('');

    const toolbar = `
<!-- TaskLynk Email Preview Bar -->
<div id="tl-preview-bar" style="position: sticky; top: 0; left: 0; right: 0; z-index: 999999; background: #1A122E; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px 18px; border-bottom: 2px solid #FF7A3D; box-shadow: 0 4px 18px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <a href="http://localhost:5000" style="text-decoration: none; display: flex; align-items: center; gap: 8px;">
      <img src="https://tasklynk.co.ke/tl-logo-192.png" alt="TaskLynk" style="width: 26px; height: 26px; object-fit: contain; vertical-align: middle;" />
      <span style="font-weight: 900; font-size: 15px; color: #FFFFFF;">Task<span style="color: #FF7A3D;">Lynk</span></span>
      <span style="background: rgba(255,122,61,0.18); color: #FF7A3D; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; text-transform: uppercase;">Email Previewer</span>
    </a>
  </div>

  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <label style="font-size: 12px; font-weight: 600; color: #DDD3E9;">Select Template:</label>
    <select onchange="window.location.search = '?template=' + this.value" style="background: #271E42; color: #FFFFFF; border: 1px solid #5B3A8C; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 600; outline: none; cursor: pointer;">
      ${optionsHtml}
    </select>

    <div style="display: inline-flex; align-items: center; background: #271E42; border: 1px solid #5B3A8C; border-radius: 6px; padding: 3px 6px;">
      <button onclick="document.body.style.maxWidth='100%';" style="background: transparent; border: none; color: #DDD3E9; font-size: 11px; font-weight: 700; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Desktop</button>
      <span style="color: #5B3A8C;">|</span>
      <button onclick="document.body.style.maxWidth='420px'; document.body.style.margin='0 auto';" style="background: transparent; border: none; color: #DDD3E9; font-size: 11px; font-weight: 700; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Mobile (375px)</button>
    </div>

    <a href="?template=${templateId}&standalone=1" target="_blank" style="background: #FF7A3D; color: #FFFFFF; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
      Open Clean Standalone ↗
    </a>
  </div>
</div>
<!-- End TaskLynk Preview Bar -->
`;

    // Inject toolbar after <body> or at start of string
    if (finalHtml.includes('<body')) {
      finalHtml = finalHtml.replace(/<body[^>]*>/i, `$&${toolbar}`);
    } else {
      finalHtml = toolbar + finalHtml;
    }
  }

  return new NextResponse(finalHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
