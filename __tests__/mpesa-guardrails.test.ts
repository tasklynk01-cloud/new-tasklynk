jest.mock('@/db', () => ({ db: { select: jest.fn(), insert: jest.fn() } }));
jest.mock('@/lib/admin-auth', () => ({ getUserFromRequest: jest.fn() }));
jest.mock('@/lib/mpesa-service', () => ({
  normalizeKenyanPhoneNumber: () => ({ valid: true, normalized: '254712345678', masked: '254712****78' }),
  generatePaymentReference: jest.fn(), sendDarajaStkPush: jest.fn(), recordPaymentAuditLog: jest.fn(),
}));
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/mpesa/stk/route';
import { getUserFromRequest } from '@/lib/admin-auth';
import { db } from '@/db';
import { sendDarajaStkPush } from '@/lib/mpesa-service';

describe('M-PESA initiation guardrails', () => {
  let ip = 0;
  const request = (amount: unknown) => new NextRequest('https://tasklynk.co.ke/api/payments/mpesa/stk', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `test-${++ip}` },
    body: JSON.stringify({ type: 'topup', amount, phone: '0712345678' }),
  });
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(getUserFromRequest).mockResolvedValue({ id: 9, role: 'client' }); });
  it('requires authentication before any payment or database operation', async () => {
    jest.mocked(getUserFromRequest).mockResolvedValue(null);
    expect((await POST(request(100))).status).toBe(401);
    expect(db.insert).not.toHaveBeenCalled();
    expect(sendDarajaStkPush).not.toHaveBeenCalled();
  });
  test.each([1, 50, 99, 99.99, 100.5, 'invalid'])('rejects invalid top-up %s before charging', async amount => {
    expect((await POST(request(amount))).status).toBe(400);
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(sendDarajaStkPush).not.toHaveBeenCalled();
  });
});