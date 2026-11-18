import { db } from './src/db';
import { orderFiles, jobAttachments, jobs, users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkFileDownload() {
  console.log('Checking file download issue for order 102, file 268...\n');

  // Check order 102
  const [order] = await db.select().from(jobs).where(eq(jobs.id, 102)).limit(1);
  if (order) {
    console.log('Order 102 details:');
    console.log('- ID:', order.id);
    console.log('- Client ID:', order.clientId);
    console.log('- Status:', order.status);
    console.log('- Display ID:', order.displayId);
  } else {
    console.log('Order 102 not found!');
  }

  // Check file 268 in order_files table
  const [file] = await db.select().from(orderFiles).where(eq(orderFiles.id, 268)).limit(1);
  if (file) {
    console.log('\nFile 268 in order_files:');
    console.log('- ID:', file.id);
    console.log('- Order ID:', file.orderId);
    console.log('- File Name:', file.fileName);
    console.log('- File Type:', file.fileType);
    console.log('- File URL:', file.fileUrl);
  } else {
    console.log('\nFile 268 not found in order_files table');
  }

  // Check file 268 in job_attachments table (legacy)
  const [legacyFile] = await db.select().from(jobAttachments).where(eq(jobAttachments.id, 268)).limit(1);
  if (legacyFile) {
    console.log('\nFile 268 in job_attachments (legacy):');
    console.log('- ID:', legacyFile.id);
    console.log('- Job ID:', legacyFile.jobId);
    console.log('- File Name:', legacyFile.fileName);
    console.log('- File Type:', legacyFile.fileType);
    console.log('- Upload Type:', legacyFile.uploadType);
    console.log('- File URL:', legacyFile.fileUrl);
  } else {
    console.log('\nFile 268 not found in job_attachments table either');
  }

  // Get client details if order exists
  if (order) {
    const [client] = await db.select().from(users).where(eq(users.id, order.clientId)).limit(1);
    if (client) {
      console.log('\nClient details:');
      console.log('- ID:', client.id);
      console.log('- Email:', client.email);
      console.log('- Role:', client.role);
      console.log('- Payment Terms:', client.paymentTerms);
      console.log('- Approved:', client.approved);
    }
  }

  // List all files for order 102
  const allFiles = await db.select().from(orderFiles).where(eq(orderFiles.orderId, 102));
  console.log('\n\nAll files for order 102 in order_files:');
  allFiles.forEach(f => console.log(`- File ID ${f.id}: ${f.fileName} (${f.fileType})`));

  const allLegacyFiles = await db.select().from(jobAttachments).where(eq(jobAttachments.jobId, 102));
  console.log('\nAll files for order 102 in job_attachments:');
  allLegacyFiles.forEach(f => console.log(`- File ID ${f.id}: ${f.fileName} (${f.uploadType})`));
}

checkFileDownload().catch(console.error).finally(() => process.exit(0));
