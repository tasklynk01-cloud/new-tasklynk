import { db } from './src/db';
import { users, payments, jobs } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

async function testDownloadAccess() {
  const userId = 11;
  const orderId = 102;
  const fileId = 268;

  console.log('Testing download access for:');
  console.log('- User ID:', userId);
  console.log('- Order ID:', orderId);
  console.log('- File ID:', fileId);
  console.log('');

  // Fetch order details
  const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
  
  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  console.log('Order details:');
  console.log('- Status:', order.status);
  console.log('- Client ID:', order.clientId);
  console.log('');

  // Fetch client details
  const [client] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!client) {
    console.log('❌ Client not found');
    return;
  }

  console.log('Client details:');
  console.log('- Role:', client.role);
  console.log('- Payment Terms:', client.paymentTerms);
  console.log('- Approved:', client.approved);
  console.log('');

  // Check if user has access to order
  const hasOrderAccess = order.clientId === userId;
  console.log('Has order access:', hasOrderAccess ? '✅' : '❌');
  console.log('');

  const paymentTerms = (client.paymentTerms || 'pod') as 'poa' | 'pod';
  console.log('Payment terms:', paymentTerms);

  if (paymentTerms === 'poa') {
    console.log('✅ POA - Full access immediately');
  } else if (paymentTerms === 'pod') {
    console.log('POD - Checking payment status...');
    
    // Check for completed payment
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.jobId, orderId),
          eq(payments.status, 'completed')
        )
      )
      .limit(1);

    if (payment) {
      console.log('✅ Payment completed - Full access granted');
      console.log('Payment details:', {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      });
    } else {
      console.log('❌ Payment pending - Download restricted');
      
      // List all payments for this job
      const allPayments = await db.select().from(payments).where(eq(payments.jobId, orderId));
      console.log('\nAll payments for this order:', allPayments.length);
      allPayments.forEach(p => {
        console.log(`- Payment ${p.id}: ${p.status}, ${p.amount} KSh, ${p.paymentMethod}`);
      });
    }
  }
}

testDownloadAccess().catch(console.error).finally(() => process.exit(0));
