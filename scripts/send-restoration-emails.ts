/**
 * Send Registration Restoration Emails
 * Script to notify users that registration system is restored
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { sendEmail } from '../src/lib/email';
import { registrationRestoredTemplate } from '../src/lib/email-templates';

const recipients = [
  { email: 'firstpaymailwrite@gmail.com', name: 'User' },
  { email: 'bennoh59@gmail.com', name: 'User' },
  { email: 'prince001kyle@gmail.com', name: 'User' },
];

async function sendRestorationEmails() {
  console.log('🚀 Starting registration restoration email campaign...\n');

  const results = [];

  for (const recipient of recipients) {
    console.log(`📧 Sending to: ${recipient.email}`);
    
    try {
      const html = registrationRestoredTemplate.htmlTemplate({
        recipientName: recipient.name,
      });

      const result = await sendEmail({
        to: recipient.email,
        subject: registrationRestoredTemplate.subject,
        html,
        category: 'registration',
      });

      if (result.success) {
        console.log(`✅ Success: ${recipient.email} (Message ID: ${result.messageId})\n`);
        results.push({ email: recipient.email, status: 'sent', messageId: result.messageId });
      } else {
        console.error(`❌ Failed: ${recipient.email}`);
        console.error(`   Error: ${result.error}\n`);
        results.push({ email: recipient.email, status: 'failed', error: result.error });
      }
    } catch (error) {
      console.error(`❌ Exception for ${recipient.email}:`, error);
      results.push({ email: recipient.email, status: 'error', error: String(error) });
    }

    // Small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Campaign Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status !== 'sent').length;
  
  console.log(`Total: ${results.length}`);
  console.log(`✅ Sent: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  console.log('\nDetailed Results:');
  results.forEach(r => {
    console.log(`  ${r.status === 'sent' ? '✅' : '❌'} ${r.email} - ${r.status}`);
  });

  process.exit(failed === 0 ? 0 : 1);
}

// Run the script
sendRestorationEmails().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
