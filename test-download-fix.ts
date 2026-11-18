import { db } from './src/db';
import { users, jobs, orderFiles, jobAttachments } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function testDownloadFix() {
  console.log('Testing download fix for order 102, file 268...\n');

  const orderId = 102;
  const fileId = 268;
  const userId = 11;

  // Get order
  const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
  console.log('Order status:', order.status);
  console.log('Order client ID:', order.clientId);

  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  console.log('User role:', user.role);
  console.log('User payment terms:', user.paymentTerms);

  // Get file
  const [file] = await db.select().from(jobAttachments).where(eq(jobAttachments.id, fileId)).limit(1);
  if (file) {
    console.log('\nFile details:');
    console.log('- File ID:', file.id);
    console.log('- Job ID:', file.jobId);
    console.log('- File name:', file.fileName);
    console.log('- Upload type:', file.uploadType);
    console.log('- File type:', file.fileType);
    
    const isClientBrief = ['initial', 'brief', 'additional', 'attachment'].includes(file.uploadType || '');
    console.log('\nIs client brief?', isClientBrief);
    
    if (isClientBrief) {
      console.log('✅ This file should be accessible immediately as it\'s a client-uploaded brief');
    } else {
      console.log('🔒 This file is a freelancer deliverable');
      if (order.status === 'delivered') {
        console.log('✅ Order is delivered, so should be accessible despite pending payment');
      } else {
        console.log('❌ Order not yet delivered, may require payment');
      }
    }
  }
}

testDownloadFix().catch(console.error).finally(() => process.exit(0));
