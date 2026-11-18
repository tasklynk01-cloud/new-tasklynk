/**
 * SMTP Connection Test Script
 * 
 * Tests the email sending functionality using the configured SMTP server.
 * Run with: npx tsx scripts/test-smtp-connection.ts
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testSMTPConnection() {
  console.log('\n📧 SMTP CONNECTION TEST\n');
  console.log('='.repeat(50));
  
  // Check environment variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;
  
  console.log('\n📋 SMTP Configuration:');
  console.log(`   Host: ${smtpHost || '❌ NOT SET'}`);
  console.log(`   Port: ${smtpPort || '❌ NOT SET'}`);
  console.log(`   User: ${smtpUser || '❌ NOT SET'}`);
  console.log(`   Password: ${smtpPassword ? '✅ SET (hidden)' : '❌ NOT SET'}`);
  console.log(`   From: ${emailFrom || '❌ NOT SET'}`);
  
  // Validate all required vars are set
  const missingVars: string[] = [];
  if (!smtpHost) missingVars.push('SMTP_HOST');
  if (!smtpPort) missingVars.push('SMTP_PORT');
  if (!smtpUser) missingVars.push('SMTP_USER');
  if (!smtpPassword) missingVars.push('SMTP_PASSWORD');
  
  if (missingVars.length > 0) {
    console.log(`\n❌ Missing environment variables: ${missingVars.join(', ')}`);
    console.log('   Please set these in your .env file');
    process.exit(1);
  }
  
  console.log('\n✅ All required SMTP variables are set');
  
  // Create transporter
  const port = parseInt(smtpPort!);
  const secure = port === 465;
  
  console.log(`\n🔧 Creating transporter (port ${port}, secure: ${secure})...`);
  console.log(`   💡 Tip: Use port 587 for better cloud platform compatibility`);
  
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: secure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    connectionTimeout: 30000, // 30 seconds for cloud environments
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates
      minVersion: 'TLSv1.2'
    }
  });
  
  // Test connection
  console.log('\n🔗 Testing SMTP connection...');
  try {
    const verified = await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log(`   Connection result: ${verified}`);
  } catch (verifyError: any) {
    console.log('\n❌ SMTP connection FAILED');
    console.log('   Error:', verifyError.message);
    console.log('   Code:', verifyError.code);
    console.log('   Command:', verifyError.command);
    console.log('   Response:', verifyError.response);
    
    // Common error troubleshooting
    if (verifyError.code === 'ECONNREFUSED') {
      console.log('\n💡 TROUBLESHOOTING:');
      console.log('   - Connection refused means the mail server is unreachable');
      console.log('   - Check if SMTP_HOST is correct');
      console.log('   - Verify the port is open (465 for SSL, 587 for TLS)');
      console.log('   - Some hosts block outgoing SMTP connections');
    } else if (verifyError.code === 'EAUTH') {
      console.log('\n💡 TROUBLESHOOTING:');
      console.log('   - Authentication failed');
      console.log('   - Check SMTP_USER and SMTP_PASSWORD are correct');
      console.log('   - Some providers require app-specific passwords');
    } else if (verifyError.code === 'ETIMEDOUT') {
      console.log('\n💡 TROUBLESHOOTING:');
      console.log('   - Connection timeout');
      console.log('   - The mail server might be blocking your IP');
      console.log('   - Render/Cloudflare might be blocking SMTP ports');
      console.log('   - Try using port 587 instead of 465');
    }
    
    process.exit(1);
  }
  
  // Ask to send test email
  console.log('\n📬 SMTP connection is working!');
  console.log('\nTo send a test email, run:');
  console.log('   npx tsx scripts/test-smtp-connection.ts test@example.com');
  
  // Check if a test recipient was provided
  const testRecipient = process.argv[2];
  if (testRecipient && testRecipient.includes('@')) {
    console.log(`\n📤 Sending test email to: ${testRecipient}`);
    
    try {
      const info = await transporter.sendMail({
        from: `TaskLynk <${smtpUser}>`,
        to: testRecipient,
        subject: 'TaskLynk SMTP Test - ' + new Date().toISOString(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e3a8a;">TaskLynk SMTP Test</h2>
            <p>This is a test email from the TaskLynk SMTP configuration test script.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>SMTP Host:</strong> ${smtpHost}</p>
            <p><strong>SMTP Port:</strong> ${smtpPort}</p>
            <p><strong>Sender:</strong> ${smtpUser}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              If you received this email, your SMTP configuration is working correctly.
            </p>
          </div>
        `,
      });
      
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);
    } catch (sendError: any) {
      console.log('\n❌ Failed to send test email');
      console.log('   Error:', sendError.message);
      console.log('   Code:', sendError.code);
      process.exit(1);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📧 SMTP TEST COMPLETE\n');
}

// Run the test
testSMTPConnection().catch(console.error);
