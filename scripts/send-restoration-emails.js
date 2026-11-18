require('dotenv').config();
const nodemailer = require('nodemailer');

const recipients = [
  { email: 'firstpaymailwrite@gmail.com', name: 'User' },
  { email: 'bennoh59@gmail.com', name: 'User' },
  { email: 'prince001kyle@gmail.com', name: 'User' },
];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.tasklynk.co.ke',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const getEmailHTML = (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">TaskLynk</h1>
              <p style="margin: 10px 0 0; color: #F2A541; font-size: 16px;">Academic Writing Platform</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background: white;">
              <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0 0 24px 0;">
                Registration System Restored
              </h1>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear ${name},
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're pleased to inform you that the <strong>TaskLynk registration system has been fully restored</strong> and is now operational.
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You can now proceed to complete your registration on our platform:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://tasklynk.co.ke/register" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Complete Registration
                </a>
              </div>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 24px 0;">
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
                  What's Next?
                </h3>
                <ul style="color: #475569; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Visit our registration page</li>
                  <li>Fill in your details</li>
                  <li>Submit your application</li>
                  <li>Wait for admin approval (usually within 24 hours)</li>
                </ul>
              </div>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 24px 0 0 0;">
                If you have any questions or need assistance, please don't hesitate to contact our support team at 
                <a href="mailto:support@tasklynk.co.ke" style="color: #3b82f6; text-decoration: none;">support@tasklynk.co.ke</a>
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Best regards,<br>
                <strong>The TaskLynk Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                © 2025 TaskLynk Academic. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Nairobi, Kenya | admn@tasklynk.co.ke | +254701066845
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

async function sendEmails() {
  console.log('🚀 Starting email campaign...\n');
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPassword: !!process.env.SMTP_PASSWORD
  });
  console.log('');

  const results = [];

  for (const recipient of recipients) {
    console.log(`📧 Sending to: ${recipient.email}`);
    
    try {
      const info = await transporter.sendMail({
        from: `TaskLynk Admin <${process.env.SMTP_USER}>`,
        to: recipient.email,
        subject: 'TaskLynk Registration System Restored',
        html: getEmailHTML(recipient.name),
      });

      console.log(`✅ Success: ${recipient.email}`);
      console.log(`   Message ID: ${info.messageId}\n`);
      results.push({ email: recipient.email, status: 'sent', messageId: info.messageId });
    } catch (error) {
      console.error(`❌ Failed: ${recipient.email}`);
      console.error(`   Error: ${error.message}\n`);
      results.push({ email: recipient.email, status: 'failed', error: error.message });
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Summary:');
  console.log('='.repeat(50));
  const successful = results.filter(r => r.status === 'sent').length;
  console.log(`Total: ${results.length}`);
  console.log(`✅ Sent: ${successful}`);
  console.log(`❌ Failed: ${results.length - successful}`);

  process.exit(successful === results.length ? 0 : 1);
}

sendEmails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
