import { sendEmail } from '../src/lib/email';

async function sendSingleEmail() {
  const email = 'nomaskworld11@gmail.com';
  
  console.log(`\n📧 Sending apology email to: ${email}`);
  
  const subject = '🙏 Apology & Update: TaskLynk Registration Process Restored';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskLynk Registration Process Restored</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 30px -30px; }
    .apology-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    h1 { margin: 0; font-size: 24px; }
    h2 { color: #667eea; margin-top: 25px; }
    h3 { color: #764ba2; }
    ul { padding-left: 20px; }
    li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🙏 Important Update from TaskLynk</h1>
    </div>

    <div class="apology-box">
      <strong>⚠️ We Sincerely Apologize</strong>
      <p style="margin: 10px 0 0 0;">
        We discovered and resolved a technical issue that affected the registration process on our platform. 
        If you experienced difficulties during registration, we deeply apologize for the inconvenience.
      </p>
    </div>

    <div class="success-box">
      <strong>✅ Good News - Everything is Fixed!</strong>
      <p style="margin: 10px 0 0 0;">
        Our registration system is now fully operational and working perfectly. You can now complete your 
        registration without any issues.
      </p>
    </div>

    <h2>🔄 Ready to Join TaskLynk?</h2>
    <p>
      We've identified that your previous registration attempt may have been affected by the technical issue. 
      Please follow these simple steps to complete your registration:
    </p>

    <ol>
      <li><strong>Visit our registration page</strong> at <a href="https://www.tasklynk.co.ke/register">www.tasklynk.co.ke/register</a></li>
      <li><strong>Fill in your details</strong> with the same or updated information</li>
      <li><strong>Verify your email</strong> - you'll receive a verification code instantly</li>
      <li><strong>Start working!</strong> - access your dashboard immediately after verification</li>
    </ol>

    <div style="text-align: center;">
      <a href="https://www.tasklynk.co.ke/register" class="cta-button">
        🚀 Register Now - It's Fixed!
      </a>
    </div>

    <h3>✨ What Makes TaskLynk Special?</h3>
    <ul>
      <li>🎯 Simple and intuitive registration process (now working perfectly!)</li>
      <li>💼 Access to quality academic writing opportunities</li>
      <li>💰 Competitive rates and transparent payment system</li>
      <li>🛡️ Secure platform with verified clients and writers</li>
      <li>📞 24/7 assistance available</li>
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

  try {
    const result = await sendEmail({
      to: email,
      subject,
      html,
    });
    
    if (result.success) {
      console.log(`   ✅ Sent successfully`);
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

sendSingleEmail().catch(console.error);
