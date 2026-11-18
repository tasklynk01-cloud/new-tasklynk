jest.mock('@/db', () => ({ db: { transaction: jest.fn() } }));
import { db } from '@/db';
import { payments, users } from '@/db/schema';
import { settleWalletTopup } from '@/lib/settle-wallet-topup';
import { isValidWalletTopup } from '@/lib/payment-policy';

describe('Wallet top-up policy', () => {
  test.each([100, 101, 500, 1000])('accepts whole KSh %s', amount => expect(isValidWalletTopup(amount)).toBe(true));
  test.each([0, -100, 1, 50, 99, 99.99, 100.5, NaN, Infinity, '100', null, true])('rejects invalid amount %s', amount => expect(isValidWalletTopup(amount)).toBe(false));
});

describe('Atomic wallet top-up settlement', () => {
  const payment = { id: 7, clientId: 9, purpose: 'wallet_topup', status: 'awaiting_confirmation', amount: 100, jobId: null, orderId: null };
  function transactionMock(status = payment.status) {
    const values: Array<{ table: unknown; value: Record<string, unknown> }> = [];
    let currentPayment = { ...payment, status };
    let balance = 40;
    const tx = {
      select: () => ({ from: (table: unknown) => ({ where: () => ({ for: async () => table === payments ? [currentPayment] : [{ id: 9, balance }] }) }) }),
      update: (table: unknown) => ({ set: (value: Record<string, unknown>) => ({ where: async () => {
        values.push({ table, value });
        if (table === payments) currentPayment = { ...currentPayment, ...value };
        if (table === users) balance = Number(value.balance);
      } }) }),
    };
    jest.mocked(db.transaction).mockImplementation(async callback => callback(tx as never));
    return values;
  }
  it('locks rows and credits exactly once across repeated reconciliation', async () => {
    const values = transactionMock();
    await settleWalletTopup(7, { receiptNumber: 'TESTRECEIPT' });
    await settleWalletTopup(7);
    expect(values.filter(v => v.table === users)).toEqual([{ table: users, value: expect.objectContaining({ balance: 140 }) }]);
    expect(values.find(v => v.table === payments)?.value).toMatchObject({ status: 'paid', mpesaReceiptNumber: 'TESTRECEIPT' });
  });
  it('does not auto-credit a payment under review', async () => {
    const values = transactionMock('payment_review_required');
    await expect(settleWalletTopup(7)).rejects.toThrow('Payment requires review');
    expect(values).toHaveLength(0);
  });
});