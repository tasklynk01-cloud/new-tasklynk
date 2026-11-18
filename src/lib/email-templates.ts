/**
 * Email Templates System - Option 3 Deep Purple & Vibrant Orange Design
 * Reusable email templates for various system communications
 */

import { getEmailHeader, getEmailFooter, wrapInEmailLayout } from './email';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'registration' | 'order' | 'system' | 'promotion' | 'notification';
  variables: string[]; // List of variables that can be used in the template
  htmlTemplate: (variables: Record<string, string>) => string;
}

const BUTTON_STYLE = `display: inline-block; background-color: #FF7A3D; background: linear-gradient(135deg, #FF7A3D 0%, #FF9057 100%); color: #ffffff; padding: 14px 34px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(255, 122, 61, 0.35); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.2px; text-align: center;`;

const CARD_STYLE = `background-color: #FAF8FD; padding: 22px 24px; border-radius: 12px; border: 1px solid #DDD5E8; border-left: 4px solid #5B3A8C; margin: 24px 0; box-shadow: 0 2px 8px rgba(36, 27, 63, 0.04);`;

const CARD_WARN_STYLE = `background-color: #FFF9F5; padding: 22px 24px; border-radius: 12px; border: 1px solid #FFE2D4; border-left: 4px solid #FF7A3D; margin: 24px 0; box-shadow: 0 2px 8px rgba(255, 122, 61, 0.06);`;

const CARD_SUCCESS_STYLE = `background-color: #F0FDF4; padding: 22px 24px; border-radius: 12px; border: 1px solid #BBF7D0; border-left: 4px solid #10B981; margin: 24px 0; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.06);`;

/**
 * Registration Restoration Template
 */
export const registrationRestoredTemplate: EmailTemplate = {
  id: 'registration_restored',
  name: 'Registration Restored',
  subject: 'TaskLynk Registration System Restored',
  category: 'registration',
  variables: ['recipientName'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  Registration System Restored
                </h2>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Dear ${vars.recipientName || 'User'},
                </p>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  We are pleased to inform you that the <strong>TaskLynk registration system has been fully restored</strong> and is now active.
                </p>
                
                <div style="text-align: center; margin: 28px 0;">
                  <a href="https://tasklynk.co.ke/register" style="${BUTTON_STYLE}">
                    Complete Registration →
                  </a>
                </div>
                
                <div style="${CARD_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">
                    What's Next?
                  </h3>
                  <ul style="color: #6B627A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
                    <li>Visit our registration portal</li>
                    <li>Submit your academic specialty & profile details</li>
                    <li>Receive approval notification within 24 hours</li>
                  </ul>
                </div>
                
                <p style="color: #6B627A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
                  If you have questions, please reach our 24/7 support at 
                  <a href="mailto:support@tasklynk.co.ke" style="color: #5B3A8C; font-weight: 600; text-decoration: none;">support@tasklynk.co.ke</a>.
                </p>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * Welcome/Registration Approved Template
 */
export const registrationApprovedTemplate: EmailTemplate = {
  id: 'registration_approved',
  name: 'Registration Approved',
  subject: 'Welcome to TaskLynk - Account Approved',
  category: 'registration',
  variables: ['userName', 'userRole', 'loginUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  🎉 Welcome to TaskLynk!
                </h2>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${vars.userName || 'there'},
                </p>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Great news! Your <strong>${vars.userRole || 'user'}</strong> account has been reviewed, approved, and activated.
                </p>
                
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.loginUrl || 'https://tasklynk.co.ke/login'}" style="${BUTTON_STYLE}">
                    Sign In to Your Dashboard →
                  </a>
                </div>
                
                <div style="${CARD_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">
                    Your Platform Privileges
                  </h3>
                  <p style="color: #6B627A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.7; margin: 0;">
                    You can now access your role workspace, submit work, track orders, and interact with the TaskLynk team.
                  </p>
                </div>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * Client Registration Request Template
 */
export const clientRegistrationRequestTemplate: EmailTemplate = {
  id: 'client_registration_request',
  name: 'Client Registration Request',
  subject: 'TaskLynk Client Registration Invitation',
  category: 'registration',
  variables: ['registrationUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  Complete Your TaskLynk Client Profile
                </h2>

                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Dear Client,
                </p>

                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Thank you for choosing TaskLynk Academic. Complete your client account registration to place orders, track milestones, and receive dedicated project support.
                </p>

                <div style="${CARD_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">
                    What to Expect
                  </h3>
                  <ul style="color: #6B627A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
                    <li>15-minute specialist matching with verified experts</li>
                    <li>Triple-check QA with senior editors & plagiarism reports</li>
                    <li>Instant M-Pesa STK push deposits and escrow protection</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.registrationUrl || 'https://tasklynk.co.ke/register/client'}" style="${BUTTON_STYLE}">
                    Complete Client Registration →
                  </a>
                </div>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * New Job Posted Template
 */
export const newJobPostedTemplate: EmailTemplate = {
  id: 'new_job_posted',
  name: 'New Job Posted',
  subject: 'New Job Available - Order #{orderId}',
  category: 'order',
  variables: ['freelancerName', 'orderId', 'jobTitle', 'pages', 'deadline', 'orderUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  New Order Available for Bidding
                </h2>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${vars.freelancerName || 'Specialist'},
                </p>
                
                <div style="${CARD_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; font-weight: 700; margin: 0 0 12px 0;">
                    Order #${vars.orderId || 'XXX'}
                  </h3>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                    <strong>Title:</strong> ${vars.jobTitle || 'N/A'}
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                    <strong>Pages:</strong> ${vars.pages || 'N/A'}
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0;">
                    <strong>Deadline:</strong> ${vars.deadline || 'N/A'}
                  </p>
                </div>
                
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.orderUrl || 'https://tasklynk.co.ke/freelancer/available'}" style="${BUTTON_STYLE}">
                    Inspect Job & Place Bid →
                  </a>
                </div>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * Request for Bid Template
 */
export const requestBidTemplate: EmailTemplate = {
  id: 'request_bid',
  name: 'Request for Bid',
  subject: 'Direct Bid Request - Order #{orderId}',
  category: 'order',
  variables: ['freelancerName', 'orderId', 'jobTitle', 'pages', 'deadline', 'bidUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  Direct Bid Request
                </h2>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${vars.freelancerName || 'Specialist'}, you have been selected for an urgent academic order:
                </p>
                
                <div style="${CARD_WARN_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; font-weight: 700; margin: 0 0 12px 0;">
                    Order #${vars.orderId || 'XXX'}
                  </h3>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                    <strong>Topic:</strong> ${vars.jobTitle || 'N/A'}
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                    <strong>Pages:</strong> ${vars.pages || 'N/A'}
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0;">
                    <strong>Deadline:</strong> ${vars.deadline || 'N/A'}
                  </p>
                </div>
                
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.bidUrl || 'https://tasklynk.co.ke/freelancer/available'}" style="${BUTTON_STYLE}">
                    Submit Your Bid Now →
                  </a>
                </div>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * Order Assignment Notification
 */
export const orderAssignedTemplate: EmailTemplate = {
  id: 'order_assigned',
  name: 'Order Assigned',
  subject: 'Order Assigned - #{orderId}',
  category: 'order',
  variables: ['freelancerName', 'orderId', 'jobTitle', 'pages', 'deadline', 'orderUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  🎉 Order Officially Assigned!
                </h2>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${vars.freelancerName || 'Specialist'}, you have been selected to work on the following assignment:
                </p>
                
                <div style="${CARD_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; font-weight: 700; margin: 0 0 12px 0;">
                    Order #${vars.orderId || 'XXX'}
                  </h3>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                    <strong>Topic:</strong> ${vars.jobTitle || 'N/A'}
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                    <strong>Pages:</strong> ${vars.pages || 'N/A'}
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0;">
                    <strong>Target Deadline:</strong> ${vars.deadline || 'N/A'}
                  </p>
                </div>
                
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.orderUrl || 'https://tasklynk.co.ke/freelancer/in-progress'}" style="${BUTTON_STYLE}">
                    Open Order Workspace →
                  </a>
                </div>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * Promotional Email Template
 */
export const promotionalTemplate: EmailTemplate = {
  id: 'promotional',
  name: 'Promotional Email',
  subject: '{promoTitle}',
  category: 'promotion',
  variables: ['recipientName', 'promoTitle', 'promoMessage', 'ctaText', 'ctaUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  ${vars.promoTitle || 'Special TaskLynk Announcement'}
                </h2>
                
                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${vars.recipientName || 'there'},
                </p>
                
                <div style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.8; margin: 20px 0;">
                  ${vars.promoMessage || 'Check out our latest academic features!'}
                </div>
                
                ${vars.ctaUrl ? `
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.ctaUrl}" style="${BUTTON_STYLE}">
                    ${vars.ctaText || 'Learn More →'}
                  </a>
                </div>
                ` : ''}
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `
};

/**
 * Account Activation Email Template
 */
export function getAccountActivationEmailHTML(userName: string, role: string, resetUrl: string): string {
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const bodyContent = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 38px 28px; background: #ffffff;">
                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">
                  Activate Your TaskLynk ${roleLabel} Account
                </h2>

                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${userName},
                </p>

                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Your <strong>${roleLabel}</strong> account has been configured on TaskLynk. To complete your setup and access your dashboard, please set your password by clicking below:
                </p>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}" style="${BUTTON_STYLE}">
                    Activate Account &amp; Set Password →
                  </a>
                </div>

                <div style="${CARD_STYLE}">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">
                    Quick Security Checklist
                  </h3>
                  <ul style="color: #6B627A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
                    <li>Use at least 8 characters with numbers &amp; symbols</li>
                    <li>Do not share your login credentials with third parties</li>
                    <li>Two-factor authentication can be enabled in Settings</li>
                  </ul>
                </div>

                <p style="color: #6B627A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
                  If the button doesn't work, copy this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #5B3A8C; word-break: break-all; font-weight: 600;">${resetUrl}</a>
                </p>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `;

  return wrapInEmailLayout({
    title: `Activate Your TaskLynk ${roleLabel} Account`,
    preheader: `Complete your ${roleLabel} account activation on TaskLynk Academic.`,
    content: bodyContent,
  });
}

export const adminActivationTemplate: EmailTemplate = {
  id: 'admin_activation',
  name: 'Admin Account Activation',
  subject: 'Activate Your TaskLynk Admin Account',
  category: 'registration',
  variables: ['userName', 'resetToken'],
  htmlTemplate: (vars) => getAccountActivationEmailHTML(vars.userName || 'Admin', 'admin', `https://tasklynk.co.ke/reset-password?token=${vars.resetToken || ''}`),
};

export const clientActivationTemplate: EmailTemplate = {
  id: 'client_activation',
  name: 'Client Account Activation',
  subject: 'Activate Your TaskLynk Client Account',
  category: 'registration',
  variables: ['userName', 'resetToken'],
  htmlTemplate: (vars) => getAccountActivationEmailHTML(vars.userName || 'Client', 'client', `https://tasklynk.co.ke/reset-password?token=${vars.resetToken || ''}`),
};

export const managerActivationTemplate: EmailTemplate = {
  id: 'manager_activation',
  name: 'Manager Account Activation',
  subject: 'Activate Your TaskLynk Manager Account',
  category: 'registration',
  variables: ['userName', 'resetToken'],
  htmlTemplate: (vars) => getAccountActivationEmailHTML(vars.userName || 'Manager', 'manager', `https://tasklynk.co.ke/reset-password?token=${vars.resetToken || ''}`),
};

export const freelancerActivationTemplate: EmailTemplate = {
  id: 'freelancer_activation',
  name: 'Freelancer Account Activation',
  subject: 'Activate Your TaskLynk Freelancer Account',
  category: 'registration',
  variables: ['userName', 'resetToken'],
  htmlTemplate: (vars) => getAccountActivationEmailHTML(vars.userName || 'Freelancer', 'freelancer', `https://tasklynk.co.ke/reset-password?token=${vars.resetToken || ''}`),
};

export const editorActivationTemplate: EmailTemplate = {
  id: 'editor_activation',
  name: 'Editor Account Activation',
  subject: 'Activate Your TaskLynk Editor Account',
  category: 'registration',
  variables: ['userName', 'resetToken'],
  htmlTemplate: (vars) => getAccountActivationEmailHTML(vars.userName || 'Editor', 'editor', `https://tasklynk.co.ke/reset-password?token=${vars.resetToken || ''}`),
};

export const accountOwnerActivationTemplate: EmailTemplate = {
  id: 'account_owner_activation',
  name: 'Account Owner Activation',
  subject: 'Activate Your TaskLynk Account Owner Access',
  category: 'registration',
  variables: ['userName', 'resetToken'],
  htmlTemplate: (vars) => getAccountActivationEmailHTML(vars.userName || 'Account Owner', 'account_owner', `https://tasklynk.co.ke/reset-password?token=${vars.resetToken || ''}`),
};

/**
 * 1-Year Milestone: Specialist Profile Update Action
 */
export const anniversarySpecialistUpdateTemplate: EmailTemplate = {
  id: 'anniversary_specialist_update',
  name: 'TaskLynk 1 Year: Specialist Profile Update Action',
  subject: 'TaskLynk Celebrates 1 Year: Action Required — Update Your Professional Profile',
  category: 'notification',
  variables: ['recipientName', 'profileUrl', 'loginUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 30px; background: #ffffff;">
                <!-- Milestone Badge -->
                <div style="display: inline-block; background-color: #FAF4EB; border: 1px solid #F5D3B3; border-radius: 20px; padding: 4px 14px; margin-bottom: 18px;">
                  <span style="color: #FF7A3D; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    🎉 TaskLynk 1-Year Milestone &bull; October 2025 – October 2026
                  </span>
                </div>

                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.35;">
                  Action Required: Update Your Professional Profile for Administrative Approval
                </h2>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  Dear ${vars.recipientName || 'TaskLynk Professional'},
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  As TaskLynk celebrates <strong>one year of operation since October 2025</strong>, we want to thank you for being part of our journey.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  We are entering a new phase of growth, expanding beyond our original academic-focused services into a wider managed professional services platform.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                  This expansion creates opportunities for professionals from different academic, technical and industry backgrounds to showcase their expertise and contribute to a wider range of customer projects.
                </p>

                <!-- Action Required Alert Box -->
                <div style="background-color: #FFF9F5; padding: 20px 22px; border-radius: 12px; border: 1px solid #FFE2D4; border-left: 4px solid #FF7A3D; margin: 20px 0;">
                  <h3 style="color: #C2410C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                    ⚠ ACTION REQUIRED: UPDATE YOUR PROFESSIONAL PROFILE
                  </h3>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                    We are improving our professional directory to help customers discover the expertise available through TaskLynk.
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin: 0;">
                    We therefore request every professional to log in to their TaskLynk account, review and update their professional profile, and submit it for administrative approval.
                  </p>
                </div>

                <!-- Primary Action CTA Button -->
                <div style="text-align: center; margin: 26px 0;">
                  <a href="${vars.profileUrl || 'https://tasklynk.co.ke/freelancer/profile'}" style="${BUTTON_STYLE}">
                    Log In &amp; Update Your Profile Now →
                  </a>
                </div>

                <!-- Required Information Checklist -->
                <div style="background-color: #FAF8FD; padding: 22px 24px; border-radius: 12px; border: 1px solid #DDD5E8; margin: 24px 0;">
                  <h3 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; font-weight: 800; margin: 0 0 16px 0; border-bottom: 2px solid #5B3A8C; padding-bottom: 8px;">
                    📋 Please Provide the Following Information:
                  </h3>
                  
                  <!-- 1. Education -->
                  <div style="margin-bottom: 18px;">
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      1. Educational Background
                    </p>
                    <ul style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Institution attended.</li>
                      <li>Course or programme studied.</li>
                      <li>Qualification obtained or currently pursuing.</li>
                      <li>Graduation year or expected completion year.</li>
                      <li>Relevant academic or professional training.</li>
                    </ul>
                    <p style="color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-style: italic; margin: 4px 0 0 20px;">
                      * If you are still studying, indicate that your qualification is in progress rather than completed.
                    </p>
                  </div>

                  <!-- 2. Areas of Specialisation -->
                  <div style="margin-bottom: 18px;">
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      2. Areas of Specialisation
                    </p>
                    <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0 0 8px 0;">
                      Clearly indicate what you specialise in. Include your subject areas, professional disciplines, technical fields and specific areas of expertise.
                    </p>
                    <div style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12.5px; line-height: 1.7; background-color: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
                      &bull; Mathematics and Statistics &bull; Economics and Finance<br/>
                      &bull; Computer Science &amp; IT &bull; Data Science and Analytics<br/>
                      &bull; Web and Software Development &bull; Accounting &amp; Business Management<br/>
                      &bull; Research Methods &bull; Graphic Design and Multimedia
                    </div>
                  </div>

                  <!-- 3. Services You Can Provide -->
                  <div style="margin-bottom: 18px;">
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      3. Services You Can Provide
                    </p>
                    <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0;">
                      TaskLynk will provide a list of service categories and specific services on the profile update page. Select all the services you are genuinely qualified and capable of providing. <strong>Do not select a service simply because it is available.</strong> Your selections should reflect your actual skills, training, experience and competence.
                    </p>
                  </div>

                  <!-- 4. Skills, Tools & Technical Capabilities -->
                  <div style="margin-bottom: 18px;">
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      4. Skills, Tools and Technical Capabilities
                    </p>
                    <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0;">
                      List the tools, software, technologies and methods you can work with. Examples include <strong>SPSS, Stata, R, Python, Excel, Power BI, WordPress, PHP, JavaScript, SQL, Adobe Photoshop</strong> and other relevant tools.
                    </p>
                  </div>

                  <!-- 5. Professional Experience -->
                  <div style="margin-bottom: 18px;">
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      5. Professional Experience
                    </p>
                    <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0;">
                      Provide details of relevant employment, internships, practical assignments, projects, training and other experience that demonstrates your capabilities.
                    </p>
                  </div>

                  <!-- 6. Portfolio and Previous Work -->
                  <div style="margin-bottom: 18px;">
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      6. Portfolio and Previous Work
                    </p>
                    <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0;">
                      Where available, upload up to three suitable samples of completed work. Explain the project, your contribution and the skills demonstrated. <em>Only submit work that you have permission to share.</em>
                    </p>
                  </div>

                  <!-- 7. Profile Review and Approval -->
                  <div>
                    <p style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; margin: 0 0 6px 0;">
                      7. Profile Review and Approval
                    </p>
                    <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0 0 6px 0;">
                      Once you have completed your profile, submit it for administrative review. TaskLynk will assess the information provided and may approve it, request clarification or corrections, or decline publication where requirements are not met.
                    </p>
                    <p style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; font-weight: 700; line-height: 1.6; margin: 0;">
                      Only approved and published profiles will appear in the public professional directory. Please ensure all information is accurate and supported by your actual qualifications.
                    </p>
                  </div>
                </div>

                <!-- Why this matters card -->
                <div style="background-color: #F8FAFC; padding: 18px 20px; border-radius: 10px; border: 1px solid #E2E8F0; margin: 20px 0;">
                  <h4 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 800; margin: 0 0 6px 0;">
                    💡 Why this matters
                  </h4>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0 0 8px 0;">
                    An accurate and complete profile will help TaskLynk understand your capabilities, identify suitable assignments and present your professional expertise to potential customers.
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0;">
                    Remember, TaskLynk continues to manage customer orders, professional assignments, communication, quality review and delivery. All existing order acceptance and assignment procedures remain in place.
                  </p>
                </div>

                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 24px 0 16px 0;">
                  Thank you for being part of our first year. We look forward to building a stronger professional community together.
                </p>

                <!-- Signature -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 18px;">
                  <tr>
                    <td>
                      <p style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 800; margin: 0 0 2px 0;">
                        The TaskLynk Team
                      </p>
                      <p style="color: #FF7A3D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">
                        Professional Services. One Trusted Platform.
                      </p>
                      <p style="color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; margin: 0;">
                        <a href="https://tasklynk.co.ke" style="color: #5B3A8C; text-decoration: underline; font-weight: 600;">https://tasklynk.co.ke</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `,
};

/**
 * 1-Year Milestone: Client Appreciation & Services Expansion
 */
export const anniversaryClientAppreciationTemplate: EmailTemplate = {
  id: 'anniversary_client_appreciation',
  name: 'TaskLynk 1 Year: Client Appreciation & Services Expansion',
  subject: 'Celebrating 1 Year of TaskLynk — Thank You & Our Next Chapter',
  category: 'promotion',
  variables: ['recipientName', 'exploreUrl', 'newOrderUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 30px; background: #ffffff;">
                <!-- Milestone Badge -->
                <div style="display: inline-block; background-color: #FAF4EB; border: 1px solid #F5D3B3; border-radius: 20px; padding: 4px 14px; margin-bottom: 18px;">
                  <span style="color: #FF7A3D; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ⭐ Celebrating 1 Year &bull; October 2025 – October 2026
                  </span>
                </div>

                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.35;">
                  Thank You for Making Our First Year Possible
                </h2>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  Dear ${vars.recipientName || 'Valued Client'},
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  As TaskLynk marks <strong>one year since beginning operations in October 2025</strong>, we want to take a moment to sincerely thank you.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  Thank you for trusting us with your projects, choosing our services and giving us the opportunity to serve you.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 18px 0;">
                  Every order, assignment and working relationship has contributed to our growth. Your support has helped us build experience, improve our service delivery and identify more ways to meet our customers' needs.
                </p>

                <!-- Transition Box -->
                <div style="background-color: #FAF8FD; padding: 18px 20px; border-radius: 12px; border: 1px solid #DDD5E8; border-left: 4px solid #5B3A8C; margin: 20px 0;">
                  <h3 style="color: #5B3A8C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 800; margin: 0 0 6px 0;">
                    🚀 Now, we are taking the next step.
                  </h3>
                  <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin: 0;">
                    TaskLynk is expanding from its original academic-focused services into a broader managed professional services platform.
                  </p>
                </div>

                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">
                  You can now access, or will progressively be able to access, a wider range of services, including:
                </p>

                <!-- Services List Grid -->
                <div style="background-color: #ffffff; padding: 16px 20px; border-radius: 10px; border: 1px solid #E2E8F0; margin: 16px 0 22px 0;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Website development</strong> and software solutions.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Data analysis</strong>, statistics and data processing.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Graphic design</strong>, branding and video production.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Accounting</strong> and financial support.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Virtual assistance</strong> and business administration.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Research</strong> and business intelligence.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Professional writing</strong>, editing and presentations.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">
                        <span style="color: #FF7A3D; font-weight: bold; margin-right: 6px;">&bull;</span> <strong>Academic support</strong> and research coordination.
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Managed Coordination Card -->
                <div style="background-color: #FFF9F5; padding: 20px 22px; border-radius: 12px; border: 1px solid #FFE2D4; margin: 20px 0;">
                  <p style="color: #241B3F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                    Instead of having to source and coordinate different service providers yourself, you can submit your requirements through TaskLynk. <strong>Our team coordinates the relevant expertise, manages the process and oversees delivery.</strong>
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0;">
                    We are also improving our website to make it easier to explore services, understand what we offer and place orders.
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.exploreUrl || 'https://tasklynk.co.ke/services'}" style="${BUTTON_STYLE}">
                    Explore Our Expanded Services →
                  </a>
                </div>

                <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                  Our commitment remains the same: to serve you with professionalism, accountability and attention to the work you entrust to us.
                </p>

                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 18px 0;">
                  Thank you for making our first year possible. We look forward to serving you in the years ahead.
                </p>

                <!-- Signature -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 18px;">
                  <tr>
                    <td>
                      <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; margin: 0 0 4px 0;">
                        Warm regards,
                      </p>
                      <p style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 800; margin: 0 0 2px 0;">
                        The TaskLynk Team
                      </p>
                      <p style="color: #FF7A3D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">
                        Professional Services. One Trusted Platform.
                      </p>
                      <p style="color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; margin: 0;">
                        <a href="${vars.exploreUrl || 'https://tasklynk.co.ke'}" style="color: #5B3A8C; text-decoration: underline; font-weight: 600;">Explore TaskLynk: https://tasklynk.co.ke</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `,
};

/**
 * 1-Year Milestone: Community Anniversary & Vision for All Members
 */
export const anniversaryAllUsersMilestoneTemplate: EmailTemplate = {
  id: 'anniversary_all_users_milestone',
  name: 'TaskLynk 1 Year: Community Milestone & Vision',
  subject: 'TaskLynk at 1 Year: Thank You for Being Part of Our Journey',
  category: 'notification',
  variables: ['recipientName', 'visitUrl'],
  htmlTemplate: (vars) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4EFFB; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(36, 27, 63, 0.08);">
            ${getEmailHeader()}
            <tr>
              <td style="padding: 36px 30px; background: #ffffff;">
                <!-- Milestone Badge -->
                <div style="display: inline-block; background-color: #FAF4EB; border: 1px solid #F5D3B3; border-radius: 20px; padding: 4px 14px; margin-bottom: 18px;">
                  <span style="color: #FF7A3D; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    🚀 1-Year Milestone &bull; October 2025 – October 2026
                  </span>
                </div>

                <h2 style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.35;">
                  Thank You for Being Part of Our Journey
                </h2>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  Dear ${vars.recipientName || 'TaskLynk Member'},
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  One year ago, in <strong>October 2025</strong>, TaskLynk began its journey with a simple goal: to make professional services more accessible to people who need them.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  Today, as we celebrate our first year of operation, we want to thank you for being part of that journey.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 18px 0;">
                  Your interest, registration, engagement and support have helped us grow and rethink how we can serve our community better.
                </p>
                
                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">
                  <strong>We are growing, and TaskLynk is evolving.</strong> We are expanding beyond our original academic-focused services to provide a wider range of professional services, including:
                </p>

                <!-- 2-Column Categories -->
                <div style="background-color: #FAF8FD; padding: 18px 22px; border-radius: 12px; border: 1px solid #DDD5E8; margin: 18px 0;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="50%" valign="top" style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.7; padding-right: 10px;">
                        &bull; Website &amp; software development<br/>
                        &bull; Data analysis &amp; statistics<br/>
                        &bull; Data processing &amp; management<br/>
                        &bull; Graphic design &amp; branding<br/>
                        &bull; Video production &amp; editing
                      </td>
                      <td width="50%" valign="top" style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.7;">
                        &bull; Virtual assistance &amp; administration<br/>
                        &bull; Accounting &amp; financial support<br/>
                        &bull; Research &amp; business intelligence<br/>
                        &bull; Professional writing &amp; editing<br/>
                        &bull; Academic support
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Mission Card -->
                <div style="background-color: #FFF9F5; padding: 18px 20px; border-radius: 10px; border: 1px solid #FFE2D4; margin: 20px 0;">
                  <p style="color: #241B3F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                    Our goal is to make TaskLynk <strong>one trusted destination</strong> where individuals and businesses can access different professional services through a managed platform.
                  </p>
                  <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; line-height: 1.6; margin: 0 0 8px 0;">
                    We are also improving how customers discover our services and how professionals showcase their qualifications, skills and experience.
                  </p>
                  <p style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; font-weight: 700; line-height: 1.6; margin: 0;">
                    As these changes roll out, your existing account remains important to us.
                  </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${vars.visitUrl || 'https://tasklynk.co.ke'}" style="${BUTTON_STYLE}">
                    Visit TaskLynk Platform →
                  </a>
                </div>

                <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                  Thank you for being part of our first year. We look forward to building an even more useful TaskLynk with you.
                </p>

                <!-- Signature -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 18px;">
                  <tr>
                    <td>
                      <p style="color: #22183D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 800; margin: 0 0 2px 0;">
                        TaskLynk
                      </p>
                      <p style="color: #FF7A3D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">
                        Professional Services. One Trusted Platform.
                      </p>
                      <p style="color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; margin: 0;">
                        <a href="${vars.visitUrl || 'https://tasklynk.co.ke'}" style="color: #5B3A8C; text-decoration: underline; font-weight: 600;">Visit TaskLynk: https://tasklynk.co.ke</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${getEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  `,
};

/**
 * Get all available templates
 */
export const emailTemplates: EmailTemplate[] = [
  anniversarySpecialistUpdateTemplate,
  anniversaryClientAppreciationTemplate,
  anniversaryAllUsersMilestoneTemplate,
  registrationRestoredTemplate,
  registrationApprovedTemplate,
  clientRegistrationRequestTemplate,
  newJobPostedTemplate,
  requestBidTemplate,
  orderAssignedTemplate,
  promotionalTemplate,
  adminActivationTemplate,
  clientActivationTemplate,
  managerActivationTemplate,
  freelancerActivationTemplate,
  editorActivationTemplate,
  accountOwnerActivationTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return emailTemplates.find(t => t.id === id);
}

/**
 * Render template with variables
 */
export function renderTemplate(
  templateId: string,
  variables: Record<string, string>
): { subject: string; html: string } | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  let subject = template.subject;
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(`{${key}}`, value);
  });

  const rawHtml = template.htmlTemplate(variables);
  const html = rawHtml.includes('<!DOCTYPE html')
    ? rawHtml
    : wrapInEmailLayout({ title: subject, content: rawHtml });

  return {
    subject,
    html,
  };
}
