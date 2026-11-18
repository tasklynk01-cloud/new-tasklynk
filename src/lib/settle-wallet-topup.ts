import { db } from '@/db';
import { payments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/** Serialize callback/query races and commit the paid flag and wallet credit together. */
export async function settleWalletTopup(paymentId: number, details: {
  receiptNumber?: string | null;
  transactionDate?: string | null;
  description?: string;
  rawCallback?: unknown;
} = {}): Promise<void> {
  await db.transaction(async tx => {
    const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId)).for('update');
    if (!payment || payment.purpose !== 'wallet_topup' || payment.jobId || payment.orderId) throw new Error('Invalid wallet top-up');
    if (['paid', 'completed', 'confirmed'].includes(payment.status)) return;
    if (payment.status === 'payment_review_required') throw new Error('Payment requires review');
    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid payment amount');
    const [client] = await tx.select().from(users).where(eq(users.id, payment.clientId)).for('update');
    if (!client) throw new Error('Wallet owner not found');
    const now = new Date().toISOString();
    await tx.update(users).set({ balance: Number(client.balance || 0) + amount, updatedAt: now }).where(eq(users.id, client.id));
    await tx.update(payments).set({
      status: 'paid', paidAt: now, confirmedAt: now, confirmedByAdmin: true, resultCode: 0,
      resultDescription: details.description || 'M-PESA payment confirmed',
      ...(details.receiptNumber ? { mpesaReceiptNumber: details.receiptNumber } : {}),
      ...(details.transactionDate ? { mpesaTransactionDate: details.transactionDate } : {}),
      ...(details.rawCallback ? { rawCallback: details.rawCallback } : {}),
      updatedAt: now,
    }).where(eq(payments.id, paymentId));
  });
}