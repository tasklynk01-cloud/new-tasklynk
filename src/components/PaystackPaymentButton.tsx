"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PaystackPaymentButtonProps {
  jobId?: number;
  clientId?: number;
  amount: number;
  email?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  disabled?: boolean;
  className?: string;
  onError?: (error: string) => void;
}

/**
 * PaystackPaymentButton Component
 * 
 * Redirects to Paystack Checkout for payment.
 */
export default function PaystackPaymentButton({
  jobId,
  clientId: _clientId,
  amount,
  email,
  buttonText = 'Pay with Paystack',
  buttonVariant = 'default',
  disabled = false,
  className = '',
  onError,
}: PaystackPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const handlePayment = async () => {
    if (loading) return;

    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;

      const isAppDomain = typeof window !== 'undefined' && (window.location.hostname.startsWith('app.') || window.location.pathname.startsWith('/client'));
      const source = isAppDomain ? 'app' : 'website';
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/payment/callback` : undefined;

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          jobId: jobId || null,
          amount,
          email,
          source,
          purpose: jobId ? 'order' : 'wallet_topup',
          return_url: returnUrl,
          metadata: { paymentType: jobId ? 'order_payment' : 'wallet_topup' },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || err.error || 'Failed to initialize payment');
      }

      const data = await response.json();
      const authUrl = data.data?.authorization_url || data.authorization_url;

      if (!authUrl) {
        throw new Error('Payment service did not return a checkout URL');
      }

      toast.success('Redirecting to Paystack checkout…');
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('[Paystack Redirect Error]', error);
      toast.error(error.message || 'Payment failed');
      onError?.(error.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting…
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
