"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'pending' | 'failed'>('verifying');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (!ref) {
      setStatus('failed');
      setErrorMessage('No payment reference found in callback parameters.');
      return;
    }

    setReference(ref);
    verifyAndPollPayment(ref, 0);
  }, [searchParams]);

  const verifyAndPollPayment = async (ref: string, attempt: number) => {
    try {
      // First, try server-side verification / status check
      const res = await fetch(`/api/payments/status/${encodeURIComponent(ref)}`);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.data) {
        const payment = data.data;
        setPaymentData(payment);

        if (payment.status === 'confirmed' || payment.is_confirmed) {
          setStatus('success');
          return;
        } else if (payment.status === 'failed' || payment.status === 'abandoned') {
          setStatus('failed');
          setErrorMessage(`Payment was marked as ${payment.status}.`);
          return;
        }
      }

      // If not yet confirmed in DB, trigger the verify endpoint directly to sync with Paystack
      if (attempt === 0) {
        const verifyRes = await fetch(`/api/payments/verify/${encodeURIComponent(ref)}`);
        const verifyData = await verifyRes.json().catch(() => ({}));

        if (verifyRes.ok && verifyData.success && verifyData.data?.verified) {
          setPaymentData(verifyData.data);
          setStatus('success');
          return;
        }
      }

      // If still pending, poll up to 5 times (webhook might be in flight)
      if (attempt < 5) {
        setPollCount(attempt + 1);
        setTimeout(() => {
          verifyAndPollPayment(ref, attempt + 1);
        }, 2500);
      } else {
        // After polling, if still pending
        setStatus('pending');
      }
    } catch (err: any) {
      console.error('[Payment Callback] Error checking status:', err);
      if (attempt < 3) {
        setTimeout(() => verifyAndPollPayment(ref, attempt + 1), 2000);
      } else {
        setStatus('pending');
      }
    }
  };

  const handleNavigateDashboard = () => {
    if (paymentData?.order_id) {
      router.push(`/client/orders/${paymentData.order_id}`);
    } else {
      router.push('/client/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#EEE5F8] dark:from-[#140E24] dark:via-[#18112C] dark:to-[#1D1533] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border border-[#DDD3E9] dark:border-[#3A2F5B] bg-white dark:bg-[#1D1533] rounded-3xl overflow-hidden">
        {status === 'verifying' && (
          <div className="p-8 sm:p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#5B3594]/10 dark:bg-[#5B3594]/20 flex items-center justify-center mx-auto text-[#5B3594]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-[#22183D] dark:text-white">
              Confirming Your Payment...
            </h2>
            <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed max-w-sm mx-auto">
              Please hold on while we securely verify your Paystack transaction with the network.
            </p>
            {pollCount > 0 && (
              <p className="text-xs text-[#5B3594] dark:text-[#EFE8F8] font-medium">
                Checking status (attempt {pollCount}/5)...
              </p>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white">
                Payment Successful!
              </h1>
              <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5">
                Your payment has been received and verified.
              </p>
            </div>

            {paymentData && (
              <div className="bg-[#FAF8FD] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl p-5 text-left space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-[#6B627A] dark:text-[#DDD3E9]/80">
                  <span>Reference</span>
                  <span className="font-mono font-bold text-[#22183D] dark:text-white">{reference}</span>
                </div>
                {paymentData.amount && (
                  <div className="flex justify-between items-center text-[#6B627A] dark:text-[#DDD3E9]/80">
                    <span>Amount</span>
                    <span className="font-extrabold text-[#5B3594] dark:text-[#FF7A3D]">
                      KSh {Number(paymentData.amount).toFixed(2)}
                    </span>
                  </div>
                )}
                {paymentData.order_id && (
                  <div className="flex justify-between items-center text-[#6B627A] dark:text-[#DDD3E9]/80">
                    <span>Order</span>
                    <span className="font-bold text-[#22183D] dark:text-white">#{paymentData.order_id}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[#6B627A] dark:text-[#DDD3E9]/80 pt-1 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                  <span>Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleNavigateDashboard}
              size="lg"
              className="w-full bg-[#5B3594] hover:bg-[#48267A] text-white font-bold rounded-2xl h-12 shadow-lg shadow-[#5B3594]/25"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {status === 'pending' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#22183D] dark:text-white">
                Payment Confirmation In Progress
              </h2>
              <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">
                We are still waiting for the payment network confirmation. Your account will update automatically as soon as Paystack confirms the transaction.
              </p>
            </div>

            {reference && (
              <div className="bg-[#FAF8FD] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl p-4 text-xs text-left">
                <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 block">Transaction Reference:</span>
                <span className="font-mono font-bold text-[#22183D] dark:text-white">{reference}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => verifyAndPollPayment(reference || '', 0)}
                className="flex-1 rounded-2xl h-11 font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
              <Button
                onClick={() => router.push('/client/dashboard')}
                className="flex-1 bg-[#5B3594] hover:bg-[#48267A] text-white font-bold rounded-2xl h-11"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#22183D] dark:text-white">
                Payment Not Completed
              </h2>
              <p className="text-sm text-rose-600 dark:text-rose-400 mt-1.5 leading-relaxed">
                {errorMessage || 'The payment could not be completed or was cancelled.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1 rounded-2xl h-11 font-semibold"
              >
                Return Home
              </Button>
              <Button
                onClick={() => router.push('/client/dashboard')}
                className="flex-1 bg-[#5B3594] hover:bg-[#48267A] text-white font-bold rounded-2xl h-11"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B3594]" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
