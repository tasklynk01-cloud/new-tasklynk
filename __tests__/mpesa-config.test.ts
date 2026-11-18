jest.mock('@/db', () => ({ db: {} }));
import { assertDarajaCredentials, getDarajaConfig, normalizeKenyanPhoneNumber } from '@/lib/mpesa-service';

describe('Daraja configuration guardrails', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });
  beforeEach(() => {
    process.env.MPESA_ENV = 'sandbox';
    process.env.MPESA_CONSUMER_KEY = 'test-key';
    process.env.MPESA_CONSUMER_SECRET = 'test-secret';
    process.env.MPESA_PASSKEY = 'test-passkey';
    process.env.MPESA_SHORTCODE = '174379';
    process.env.MPESA_STK_CALLBACK_URL = 'https://tasklynk.co.ke/api/payments/mpesa/callback';
    process.env.MPESA_TRANSACTION_TYPE = 'CustomerPayBillOnline';
    process.env.MPESA_TILL_NUMBER = '174379';
  });
  it('respects an explicit PayBill type even if a till setting is present', () => {
    expect(getDarajaConfig().transactionType).toBe('CustomerPayBillOnline');
  });
  it('accepts complete sandbox settings', () => expect(() => assertDarajaCredentials()).not.toThrow());
  it('rejects the sandbox shortcode in production', () => {
    process.env.MPESA_ENV = 'production';
    expect(() => assertDarajaCredentials()).toThrow('sandbox shortcode');
  });
  it('ignores sandbox store and till values when production uses PayBill', () => {
    process.env.MPESA_ENV = 'production';
    process.env.MPESA_SHORTCODE = '600000';
    expect(() => assertDarajaCredentials()).not.toThrow();
  });
  it('rejects sandbox store or till values when production uses Buy Goods', () => {
    process.env.MPESA_ENV = 'production';
    process.env.MPESA_SHORTCODE = '600000';
    process.env.MPESA_TRANSACTION_TYPE = 'CustomerBuyGoodsOnline';
    expect(() => assertDarajaCredentials()).toThrow('sandbox shortcode');
  });
  it('rejects a non-HTTPS callback', () => {
    process.env.MPESA_STK_CALLBACK_URL = 'http://localhost:5000/api/payments/callback';
    expect(() => assertDarajaCredentials()).toThrow('HTTPS');
  });
  test.each(['0712345678', '+254712345678', '712345678', '0112345678'])('accepts Kenyan phone %s', phone => {
    expect(normalizeKenyanPhoneNumber(phone).valid).toBe(true);
  });
});