#!/usr/bin/env node
/**
 * Email Delivery Diagnostic Tool
 * 
 * This script diagnoses why emails are being sent but not reaching recipients.
 * Common issues: SPF/DKIM/DMARC records, spam filters, blacklisting, etc.
 */

require('dotenv').config({ path: '.env.render' });
const nodemailer = require('nodemailer');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║      Email Delivery Diagnostic Tool - TaskLynk          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Check 1: Environment Variables
console.log('📋 Step 1: Checking Email Configuration...\n');
const config = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.EMAIL_FROM,
};

const issues = [];

if (!config.host) issues.push('❌ SMTP_HOST missing');
else console.log('✅ SMTP_HOST:', config.host);

if (!config.port) issues.push('❌ SMTP_PORT missing');
else console.log('✅ SMTP_PORT:', config.port);

if (!config.user) issues.push('❌ SMTP_USER missing');
else console.log('✅ SMTP_USER:', config.user);

if (!config.password) issues.push('❌ SMTP_PASSWORD missing');
else console.log('✅ SMTP_PASSWORD:', '********');

if (!config.from) issues.push('❌ EMAIL_FROM missing');
else console.log('✅ EMAIL_FROM:', config.from);

if (issues.length > 0) {
  console.log('\n❌ Configuration Issues Found:');
  issues.forEach(issue => console.log('   ' + issue));
  console.log('\n💡 Fix: Ensure all SMTP environment variables are set');
  process.exit(1);
}

console.log('\n✅ All configuration variables present\n');

// Check 2: SMTP Connection
console.log('🔌 Step 2: Testing SMTP Connection...\n');

const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.port === 465,
  auth: {
    user: config.user,
    pass: config.password,
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify()
  .then(() => {
    console.log('✅ SMTP Connection: SUCCESS\n');
    
    // Check 3: Common Delivery Issues
    console.log('🔍 Step 3: Analyzing Common Delivery Issues...\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNOSIS: Emails Sending But Not Reaching Recipients');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('⚠️  LIKELY CAUSES:\n');
    
    console.log('1. 📭 SPAM/JUNK FOLDER (Most Common)');
    console.log('   • Recipients should check spam/junk folders');
    console.log('   • Gmail, Outlook often filter automated emails');
    console.log('   • Add admn@tasklynk.co.ke to contacts\n');
    
    console.log('2. 📧 MISSING DNS AUTHENTICATION RECORDS');
    console.log('   • SPF record not configured');
    console.log('   • DKIM record not configured');
    console.log('   • DMARC record not configured');
    console.log('   • This causes emails to be marked as spam\n');
    
    console.log('3. 🚫 DOMAIN REPUTATION');
    console.log('   • New domain (tasklynk.co.ke) has no reputation');
    console.log('   • Need to "warm up" by sending gradually');
    console.log('   • Start with 10-20 emails/day, increase slowly\n');
    
    console.log('4. 🔒 RECIPIENT SERVER BLOCKING');
    console.log('   • Some servers block shared hosting IPs');
    console.log('   • HostAfrica IP may be on blacklist');
    console.log('   • Check: mxtoolbox.com/blacklists.aspx\n');
    
    console.log('5. ⏱️  DELIVERY DELAYS');
    console.log('   • Email may take 5-15 minutes to arrive');
    console.log('   • Greylisting by recipient servers');
    console.log('   • Retry after short delay\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 IMMEDIATE ACTIONS (Priority Order)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('ACTION 1: CHECK SPAM FOLDERS ⚡ (5 minutes)');
    console.log('   → Ask all recipients to check spam/junk folders');
    console.log('   → Mark emails as "Not Spam"');
    console.log('   → Add admn@tasklynk.co.ke to contacts\n');
    
    console.log('ACTION 2: ADD SPF RECORD 📝 (15 minutes)');
    console.log('   → Login to domain registrar (HostAfrica/NameCheap)');
    console.log('   → Go to DNS settings for tasklynk.co.ke');
    console.log('   → Add TXT record:');
    console.log('      Type: TXT');
    console.log('      Name: @');
    console.log('      Value: v=spf1 include:mail.tasklynk.co.ke ~all');
    console.log('      TTL: 3600\n');
    
    console.log('ACTION 3: ENABLE DKIM 🔑 (20 minutes)');
    console.log('   → Login to HostAfrica cPanel');
    console.log('   → Go to: Email → Email Deliverability');
    console.log('   → Click "Manage" next to tasklynk.co.ke');
    console.log('   → Enable DKIM');
    console.log('   → Copy DKIM record');
    console.log('   → Add to DNS as TXT record\n');
    
    console.log('ACTION 4: ADD DMARC RECORD 📊 (10 minutes)');
    console.log('   → Add to DNS:');
    console.log('      Type: TXT');
    console.log('      Name: _dmarc');
    console.log('      Value: v=DMARC1; p=none; rua=mailto:admn@tasklynk.co.ke');
    console.log('      TTL: 3600\n');
    
    console.log('ACTION 5: CHECK BLACKLISTS 🔍 (5 minutes)');
    console.log('   → Visit: https://mxtoolbox.com/blacklists.aspx');
    console.log('   → Enter: mail.tasklynk.co.ke');
    console.log('   → If blacklisted, contact HostAfrica support\n');
    
    console.log('ACTION 6: TEST EMAIL DELIVERY 📤 (now)');
    console.log('   → Run: node test-email-delivery.js');
    console.log('   → Send to personal Gmail/Outlook');
    console.log('   → Check inbox AND spam folder\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 DETAILED GUIDES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('• SPF/DKIM/DMARC Setup:');
    console.log('  → See: HOSTAFRICA_SMTP_CONFIGURATION.md (line 303)\n');
    
    console.log('• Domain Configuration:');
    console.log('  → See: RENDER_DOMAIN_CONFIGURATION_GUIDE.md (line 265)\n');
    
    console.log('• Email Troubleshooting:');
    console.log('  → See: SMTP_EMAIL_SETUP.md (line 170)\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏱️  EXPECTED TIMELINE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('• SPF/DKIM/DMARC setup: 45 minutes total');
    console.log('• DNS propagation: 1-24 hours (usually 2-4 hours)');
    console.log('• Email reputation buildup: 2-4 weeks');
    console.log('• Immediate improvement: After DNS records active\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆘 IF STILL NOT WORKING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('1. Contact HostAfrica Support:');
    console.log('   • Email: support@hostafrica.com');
    console.log('   • Ask to check email deliverability');
    console.log('   • Request IP reputation check\n');
    
    console.log('2. Switch to Transactional Email Service:');
    console.log('   • Use Resend API (already configured)');
    console.log('   • Use SendGrid');
    console.log('   • Use Amazon SES');
    console.log('   • These have better deliverability\n');
    
    console.log('3. Use Resend as Primary (Temporary):');
    console.log('   • Already have API key: re_KKXApQ4T...');
    console.log('   • Better deliverability for new domains');
    console.log('   • 100 emails/day free tier');
    console.log('   • Switch back to SMTP after domain warmed up\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Diagnostic Complete\n');
    console.log('Next Step: Choose an action from the list above\n');
  })
  .catch((error) => {
    console.log('❌ SMTP Connection: FAILED\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Port blocked or wrong server');
      console.log('   → Try changing SMTP_PORT from 587 to 465');
      console.log('   → Or check firewall settings');
    } else if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed');
      console.log('   → Verify SMTP_USER and SMTP_PASSWORD');
      console.log('   → Check credentials in HostAfrica cPanel');
    } else {
      console.log('\n💡 Connection issue');
      console.log('   → Check internet connection');
      console.log('   → Verify mail.tasklynk.co.ke is accessible');
    }
  });
