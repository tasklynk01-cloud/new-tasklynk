/**
 * Send Registration Restoration Email
 * Apologize and inform users that registration is now working
 */

import { sendEmail } from '@/lib/email';

// The 10 users who need to be notified
const usersToNotify = [
  'joym30552@gmail.com',
  'simonjamesmulu@gmail.com',
  'firstwritersorg@gmail.com',
  'tharaukuria@gmail.com',
  'bsagala573@gmail.com',
  'aokomercyline34@gmail.com',
  'jumamatezo96@gmail.com',
  'sigilaikelly@gmail.com',
  'kentkiariem@gmail.com',
  'sheeslee387@gmail.com',
];

// Email template
function getRegistrationRestoredHTML(email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .apology-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .success-box {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      border-radius: 0 0 10px 10px;
    }
    .steps {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .steps li {
      margin: 10px 0;
    }
    .highlight {
      color: #667eea;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Registration Restored!</h1>
    <p style="margin: 0;">TaskLynk Academic Writing Platform</p>
  </div>
  
  <div class="content">
    <h2>Dear Aspiring Writer,</h2>
    
    <div class="apology-box">
      <strong>⚠️ We Sincerely Apologize</strong>
      <p style="margin: 10px 0 0 0;">
        We experienced a technical issue with our email verification system that prevented you from completing your registration. 
        We deeply apologize for any inconvenience this may have caused.
      </p>
    </div>

    <div class="success-box">
      <strong>✅ Good News - Registration is Now Fully Operational!</strong>
      <p style="margin: 10px 0 0 0;">
        Our technical team has resolved the issue, and the registration process is now working perfectly. 
        All systems are tested and verified.
      </p>
    </div>

    <h3>🔄 Please Complete Your Registration Again</h3>
    <p>
      Your previous registration attempt was not completed due to the technical issue. 
      We kindly ask you to register again using the link below:
    </p>

    <div style="text-align: center;">
      <a href="https://www.tasklynk.co.ke/register" class="cta-button">
        Register Now →
      </a>
    </div>

    <div class="steps">
      <strong>📝 Registration Process (Takes 2 minutes):</strong>
      <ol>
        <li>Click the "Register Now" button above</li>
        <li>Fill in your details and select your role (Freelancer/Client)</li>
        <li>Check your email for a <span class="highlight">6-digit verification code</span></li>
        <li>Enter the code to activate your account</li>
        <li>You'll be automatically logged in and can start immediately!</li>
      </ol>
      <p style="margin-top: 15px;">
        <strong>Note:</strong> The verification code is valid for 15 minutes. 
        If you don't receive it, please check your spam folder.
      </p>
    </div>

    <h3>💡 What's New?</h3>
    <ul>
      <li><strong>Auto-login after verification</strong> - No need to log in manually</li>
      <li><strong>Faster approval</strong> - Clients are approved instantly</li>
      <li><strong>Better email delivery</strong> - Improved email system</li>
      <li><strong>Enhanced support</strong> - 24/7 assistance available</li>
    </ul>

    <h3>🚀 Why Join TaskLynk?</h3>
    <p>
      TaskLynk connects talented academic writers with clients who need quality writing services. 
      Whether you're a freelance writer looking for opportunities or a client seeking professional writers, 
      we've got you covered.
    </p>

    <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <strong>Need Help?</strong><br>
      📧 Email: <a href="mailto:admn@tasklynk.co.ke">admn@tasklynk.co.ke</a><br>
      🌐 Website: <a href="https://www.tasklynk.co.ke">www.tasklynk.co.ke</a><br>
      📱 WhatsApp: +254 701 066 845
    </div>

    <p>
      We value your interest in joining our platform and apologize again for the inconvenience. 
      Our team is committed to providing you with the best experience possible.
    </p>

    <p style="margin-top: 30px;">
      <strong>Best regards,</strong><br>
      The TaskLynk Team<br>
      <em>Your Academic Writing Partner</em>
    </p>
  </div>

  <div class="footer">
    <p>
      <strong>TaskLynk Academic Writing Platform</strong><br>
      Professional Writing Services | Quality Guaranteed<br>
      <a href="https://www.tasklynk.co.ke">www.tasklynk.co.ke</a>
    </p>
    <p style="margin-top: 10px; font-size: 11px;">
      This email was sent to ${email} because you attempted to register on our platform.<br>
      If you did not initiate this registration, please ignore this email.
    </p>
  </div>
</body>
</html>
  `;
}

async function sendRegistrationRestoredEmails() {
  console.log('📧 Sending registration restoration emails...\n');
  console.log(`Recipients: ${usersToNotify.length}\n`);

  const results = {
    sent: [] as string[],
    failed: [] as { email: string; error: string }[],
  };

  for (const email of usersToNotify) {
    console.log(`📨 Sending to: ${email}`);
    
    try {
      const result = await sendEmail({
        to: email,
        subject: '🎉 Registration Restored - Complete Your TaskLynk Registration',
        html: getRegistrationRestoredHTML(email),
        category: 'registration',
      });

      if (result.success) {
        console.log(`   ✅ Sent successfully`);
        results.sent.push(email);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        results.failed.push({ email, error: result.error || 'Unknown error' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Exception: ${errorMsg}`);
      results.failed.push({ email, error: errorMsg });
    }

    // Small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY:');
  console.log('═'.repeat(80));
  console.log(`Total: ${usersToNotify.length}`);
  console.log(`✅ Sent successfully: ${results.sent.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.sent.length > 0) {
    console.log('\n✅ Successfully sent to:');
    results.sent.forEach(email => console.log(`   - ${email}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed to send to:');
    results.failed.forEach(({ email, error }) => {
      console.log(`   - ${email}`);
      console.log(`     Error: ${error}`);
    });
  }

  console.log('\n' + '═'.repeat(80));
}

sendRegistrationRestoredEmails()
  .then(() => {
    console.log('\n✅ Email campaign completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
