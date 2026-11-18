"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Paystack Payment Success Page
 * 
 * Handles redirects from Paystack Payment Pages after successful payment.
 * URL: https://tasklynk.co.ke/payment-success?reference=xxx&trxref=xxx
 * 
 * Query Parameters from Paystack:
 * - reference: Transaction reference
 * - trxref: Alternative transaction reference
 * - status: Payment status (optional)
 */
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
    if (!reference) {
      setError('No payment reference found');
      setVerifying(false);
      setPaymentStatus('failed');
      return;
    }

    verifyPayment(reference);
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      setVerifying(true);

      // Call your backend to verify the payment
      const response = await safeApiFetch('/api/paystack/verify-payment-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setPaymentDetails(data.payment);
        toast.success('Payment verified successfully!');
      } else {
        setPaymentStatus('failed');
        setError(data.error || 'Payment verification failed');
        toast.error(data.error || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setPaymentStatus('failed');
      setError('Failed to verify payment. Please contact support.');
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    // Redirect based on payment status
    if (paymentStatus === 'success') {
      // Check if user is logged in
      const token = localStorage.getItem('bearer_token');
      if (token) {
        // Redirect to client dashboard
        router.push('/client/dashboard');
      } else {
        // Redirect to login
        router.push('/login');
      }
    } else {
      // Return to homepage
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 shadow-2xl">
        {verifying ? (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment
            </p>
          </div>
        ) : paymentStatus === 'success' ? (
          <div className="text-center">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Thank you for choosing TaskLynk. Your payment has been received.
            </p>

            {paymentDetails && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-lg mb-4">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono font-semibold">
                      {paymentDetails.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">
                      KSh {(paymentDetails.amount / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-green-600">Confirmed</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Next Steps:</strong> Our team will contact you shortly to confirm your order 
                and provide further instructions. A confirmation email has been sent to your email address.
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleContinue}
              className="w-full sm:w-auto"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <XCircle className="h-20 w-20 text-red-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Payment Failed
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {error || 'We couldn\'t verify your payment. Please try again or contact support.'}
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-900 dark:text-red-100">
                If you believe this is an error, please contact our support team at{' '}
                <a href="mailto:tasklynkacademic@gmail.com" className="font-semibold underline">
                  tasklynkacademic@gmail.com
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/')}
              >
                Return Home
              </Button>
              <Button
                size="lg"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-6 shadow-2xl">
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          </div>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
