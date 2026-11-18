"use client";

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PaystackPaymentButton from '@/components/PaystackPaymentButton';

interface PaystackPaymentProps {
  amount: number; // Amount in KSh
  email: string;
  jobId: string;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export function PaystackPayment({
  amount,
  email,
  jobId,
  onClose,
  onError,
}: PaystackPaymentProps) {
  const numericJobId = Number.parseInt(jobId, 10);

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Amount to Pay:</span>
          <span className="text-2xl font-bold text-primary">KSh {amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Payment Email:</span>
          <span className="text-sm font-medium">{email}</span>
        </div>
      </div>

      <PaystackPaymentButton
        jobId={Number.isNaN(numericJobId) ? undefined : numericJobId}
        amount={amount}
        email={email}
        buttonText="Pay with Paystack"
        className="w-full"
        onError={(error) => {
          toast.error(error || 'Payment failed. Please try again.');
          onError?.(error || 'Payment failed');
        }}
      />

      {onClose && (
        <Button variant="outline" onClick={onClose} className="w-full">
          Cancel
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Secure payment. Supports M-Pesa, Cards, and Bank transfers.
      </p>
    </div>
  );
}
