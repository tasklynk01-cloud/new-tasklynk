import {
  normalizeKenyanPhoneNumber,
  generatePaymentReference,
  getDarajaTimestamp,
  generateDarajaPassword,
  parseDarajaStkCallback,
  parseDarajaC2BCallback,
} from '@/lib/mpesa-service';

describe('M-PESA Production Daraja Service Tests', () => {
  describe('Phone Number Normalization & Validation', () => {
    test('normalizes 10-digit Kenyan phone with leading 0 (07XXXXXXXX)', () => {
      const result = normalizeKenyanPhoneNumber('0712345678');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('254712345678');
      expect(result.masked).toBe('254712****78');
    });

    test('normalizes 10-digit Kenyan phone with leading 0 (01XXXXXXXX)', () => {
      const result = normalizeKenyanPhoneNumber('0112345678');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('254112345678');
      expect(result.masked).toBe('254112****78');
    });

    test('normalizes Kenyan phone with leading plus (+2547XXXXXXXX)', () => {
      const result = normalizeKenyanPhoneNumber('+254712345678');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('254712345678');
    });

    test('handles phone number with spaces and dashes', () => {
      const result = normalizeKenyanPhoneNumber('0712 - 345 - 678');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('254712345678');
    });

    test('rejects non-Kenyan or invalid length phone number', () => {
      expect(normalizeKenyanPhoneNumber('0812345678').valid).toBe(false);
      expect(normalizeKenyanPhoneNumber('12345').valid).toBe(false);
      expect(normalizeKenyanPhoneNumber('254812345678').valid).toBe(false);
      expect(normalizeKenyanPhoneNumber('').valid).toBe(false);
    });
  });

  describe('Internal Reference Generation', () => {
    test('generates reference matching TLK-YYYYMMDD-XXXXXXXX pattern', () => {
      const ref1 = generatePaymentReference('TLK');
      const ref2 = generatePaymentReference('TLK');

      expect(ref1).toMatch(/^TLK-\d{8}-[A-F0-9]{8}$/);
      expect(ref2).toMatch(/^TLK-\d{8}-[A-F0-9]{8}$/);
      expect(ref1).not.toBe(ref2);
    });
  });

  describe('Timestamp and Password Generation', () => {
    test('generates valid 14-character Daraja timestamp (YYYYMMDDHHmmss)', () => {
      const ts = getDarajaTimestamp();
      expect(ts).toMatch(/^\d{14}$/);
    });

    test('generates base64 encoded password using shortcode, passkey, and timestamp', () => {
      const shortcode = '174379';
      const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
      const timestamp = '20261007120000';

      const password = generateDarajaPassword(shortcode, passkey, timestamp);
      const decoded = Buffer.from(password, 'base64').toString('utf8');

      expect(decoded).toBe(`${shortcode}${passkey}${timestamp}`);
    });
  });

  describe('STK Push Callback Parsing', () => {
    test('successfully parses successful STK callback (ResultCode === 0)', () => {
      const rawPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: '29115-34620561-1',
            CheckoutRequestID: 'ws_CO_191220261020362925',
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 750.0 },
                { Name: 'MpesaReceiptNumber', Value: 'QABC123XYZ' },
                { Name: 'TransactionDate', Value: 20261007120530 },
                { Name: 'PhoneNumber', Value: 254712345678 },
              ],
            },
          },
        },
      };

      const parsed = parseDarajaStkCallback(rawPayload);

      expect(parsed).not.toBeNull();
      expect(parsed?.success).toBe(true);
      expect(parsed?.resultCode).toBe(0);
      expect(parsed?.checkoutRequestId).toBe('ws_CO_191220261020362925');
      expect(parsed?.merchantRequestId).toBe('29115-34620561-1');
      expect(parsed?.receiptNumber).toBe('QABC123XYZ');
      expect(parsed?.amount).toBe(750);
      expect(parsed?.phoneNumber).toBe('254712345678');
    });

    test('properly parses failed/cancelled STK callback (ResultCode !== 0)', () => {
      const rawPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: '29115-34620561-2',
            CheckoutRequestID: 'ws_CO_191220261020362926',
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user',
          },
        },
      };

      const parsed = parseDarajaStkCallback(rawPayload);

      expect(parsed).not.toBeNull();
      expect(parsed?.success).toBe(false);
      expect(parsed?.resultCode).toBe(1032);
      expect(parsed?.resultDesc).toBe('Request cancelled by user');
      expect(parsed?.receiptNumber).toBeUndefined();
    });
  });

  describe('C2B v2 Callback Parsing', () => {
    test('successfully parses direct C2B confirmation payload', () => {
      const rawC2B = {
        TransactionType: 'Pay Bill',
        TransID: 'RKT9123456',
        TransTime: '20261007121000',
        TransAmount: '1500.00',
        BusinessShortCode: '174379',
        BillRefNumber: 'TLK-ORD-104',
        MSISDN: '254712345678',
        FirstName: 'John',
        LastName: 'Doe',
      };

      const parsed = parseDarajaC2BCallback(rawC2B);

      expect(parsed).not.toBeNull();
      expect(parsed?.transId).toBe('RKT9123456');
      expect(parsed?.transAmount).toBe(1500);
      expect(parsed?.billRefNumber).toBe('TLK-ORD-104');
      expect(parsed?.msisdn).toBe('254712345678');
      expect(parsed?.firstName).toBe('John');
    });

    test('handles C2B confirmation with missing or unformatted bill reference', () => {
      const rawC2B = {
        TransactionType: 'Pay Bill',
        TransID: 'RKT9123457',
        TransTime: '20261007121000',
        TransAmount: '500.00',
        BusinessShortCode: '174379',
        BillRefNumber: '',
        MSISDN: '0712345678',
      };

      const parsed = parseDarajaC2BCallback(rawC2B);
      expect(parsed).not.toBeNull();
      expect(parsed?.billRefNumber).toBe('');
      expect(parsed?.transAmount).toBe(500);
    });
  });

  describe('Amount Validation and Mismatch Detection', () => {
    test('detects amount mismatch when received does not equal expected', () => {
      const expectedAmount = 1000;
      const receivedAmount = 500;
      const isMismatch = Math.abs(receivedAmount - expectedAmount) > 0.01;
      expect(isMismatch).toBe(true);
    });

    test('accepts amounts when within floating point epsilon', () => {
      const expectedAmount = 750.0;
      const receivedAmount = 750.0;
      const isMismatch = Math.abs(receivedAmount - expectedAmount) > 0.01;
      expect(isMismatch).toBe(false);
    });
  });

  describe('Idempotency State Transitions', () => {
    test('does not re-process payment if status is already paid or completed', () => {
      const isAlreadyProcessed = (status: string) => status === 'paid' || status === 'completed';
      expect(isAlreadyProcessed('paid')).toBe(true);
      expect(isAlreadyProcessed('completed')).toBe(true);
      expect(isAlreadyProcessed('pending')).toBe(false);
      expect(isAlreadyProcessed('awaiting_confirmation')).toBe(false);
      expect(isAlreadyProcessed('failed')).toBe(false);
    });
  });
});

