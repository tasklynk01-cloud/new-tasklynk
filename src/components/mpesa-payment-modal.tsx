"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Smartphone, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { MpesaLogo } from '@/components/ui/mpesa-logo';
import { toast } from 'sonner';

export interface MpesaPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderDisplayId?: string;
  amount: number;
  title?: string;
  defaultPhone?: string;
  onSuccess?: (receipt: string) => void;
}

type PaymentStep = 'input' | 'submitting' | 'waiting_pin' | 'success' | 'failed';

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_SECONDS = 75;

export function MpesaPaymentModal({
  open,
  onOpenChange,
  orderId,
  orderDisplayId,
  amount,
  defaultPhone = '',
  onSuccess,
}: MpesaPaymentModalProps) {
  const [phoneDigits, setPhoneDigits] = useState('');
  const [step, setStep] = useState<PaymentStep>('input');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TIMEOUT_SECONDS);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sanitizeTo9Digits = (raw: string): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return digits.slice(0, 9);
  };

  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, []);

  useEffect(() => {
    if (defaultPhone && !phoneDigits) {
      setPhoneDigits(sanitizeTo9Digits(defaultPhone));
    }
  }, [defaultPhone]);

  useEffect(() => {
    if (open) {
      setStep('input');
      setErrorMessage('');
      setReceiptNumber('');
      setSecondsRemaining(TIMEOUT_SECONDS);
      stopTimers();
    } else {
      stopTimers();
    }
  }, [open]);

  const stopTimers = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeTo9Digits(rawVal);
    setPhoneDigits(sanitized);
    if (errorMessage) setErrorMessage('');
  };

  const formattedDisplay = React.useMemo(() => {
    if (!phoneDigits) return '';
    if (phoneDigits.length <= 3) return phoneDigits;
    if (phoneDigits.length <= 6) return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;
    return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`;
  }, [phoneDigits]);

  const isValidKenyanNumber = (phoneDigits.startsWith('7') || phoneDigits.startsWith('1')) && phoneDigits.length === 9;

  const startPolling = (idToPoll: number) => {
    stopTimers();
    setSecondsRemaining(TIMEOUT_SECONDS);

    countdownTimerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          stopTimers();
          setStep('failed');
          setErrorMessage('Payment request timed out. Please unlock your phone and try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${idToPoll}/status`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) return;

        const data = await res.json();
        const currentStatus = data.status;

        if (currentStatus === 'paid' || currentStatus === 'completed') {
          stopTimers();
          const rNum = data.receiptNumber || 'Confirmed';
          setReceiptNumber(rNum);
          setStep('success');
          toast.success('M-PESA Payment Received!', {
            description: `Receipt: ${rNum}`,
          });
          onSuccess?.(rNum);
        } else if (currentStatus === 'failed') {
          stopTimers();
          setStep('failed');
          setErrorMessage(data.resultDescription || 'Transaction was cancelled or declined on your phone.');
        } else if (currentStatus === 'payment_review_required') {
          stopTimers();
          setStep('failed');
          setErrorMessage('Payment received with an amount difference. An administrator will verify shortly.');
        }
      } catch (err) {
        console.error('[M-Pesa Modal] Polling error:', err);
      }
    }, POLL_INTERVAL_MS);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 'submitting') return;

    if (!isValidKenyanNumber) {
      setErrorMessage('Please enter a valid 9-digit Kenyan phone number starting with 7 or 1.');
      return;
    }

    setStep('submitting');
    setErrorMessage('');

    try {
      const fullNormalizedPhone = `254${phoneDigits}`;
      const response = await fetch('/api/payments/mpesa/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phone: fullNormalizedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate M-PESA payment');
      }

      setPaymentId(data.paymentId);
      setStep('waiting_pin');

      toast.info('📱 M-PESA Prompt Sent', {
        description: 'Check your phone and enter your PIN to complete payment.',
        duration: 8000,
      });

      startPolling(data.paymentId);
    } catch (err: any) {
      console.error('[M-Pesa Modal] Initiation error:', err);
      setStep('input');
      const msg = err.message || 'Could not send M-PESA prompt. Please verify your phone number and try again.';
      setErrorMessage(msg);
      toast.error('Payment Error', { description: msg });
    }
  };

  const handleClose = () => {
    if (step !== 'submitting') {
      stopTimers();
      onOpenChange(false);
    }
  };

  const formatKes = (val: number) => `KES ${Math.round(val).toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border border-emerald-500/20 bg-background shadow-2xl rounded-3xl">
        {/* Header with Official M-PESA Green */}
        <div className="bg-[#00A34F] px-6 py-5 text-white flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <MpesaLogo size="md" />
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-wide leading-tight">
                M-PESA Pay
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-xs font-medium">
                Instant & Secure Checkout
              </DialogDescription>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm text-white">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: Input Screen */}
          {step === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount Box */}
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-4 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1">
                <span className="text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                  Amount Payable
                </span>
                <div className="text-3xl font-black text-[#00A34F] tracking-tight">
                  {formatKes(amount)}
                </div>
                {orderDisplayId && (
                  <div className="text-xs text-muted-foreground pt-0.5">
                    Order Ref: <span className="font-semibold text-foreground">{orderDisplayId}</span>
                  </div>
                )}
              </div>

              {/* Phone Input with Fixed Country Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mpesa-modal-phone" className="text-sm font-bold text-foreground">
                    M-PESA Phone Number
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    {phoneDigits.startsWith('7') ? 'Safaricom' : phoneDigits.startsWith('1') ? 'Airtel / Safaricom' : 'Kenyan Line'}
                  </span>
                </div>

                <div className="relative flex items-center rounded-xl border border-input focus-within:border-[#00A34F] focus-within:ring-2 focus-within:ring-[#00A34F]/20 bg-background transition-all overflow-hidden shadow-sm">
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-muted/60 border-r border-border text-foreground font-bold text-sm select-none">
                    <span>🇰🇪</span>
                    <span className="text-foreground">+254</span>
                  </div>

                  <Input
                    id="mpesa-modal-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="712 345 678"
                    value={formattedDisplay}
                    onChange={handlePhoneInputChange}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-2.5 h-11 text-base font-bold tracking-wider placeholder:text-muted-foreground/50 placeholder:font-normal"
                    autoFocus
                  />
                </div>

                <p className="text-[11px] text-muted-foreground leading-normal">
                  Enter 9 digits starting with <strong className="text-foreground font-semibold">7</strong> or <strong className="text-foreground font-semibold">1</strong> (no leading 0). An instant PIN prompt will appear on your phone.
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={!isValidKenyanNumber}
                className="w-full bg-[#00A34F] hover:bg-[#00843D] text-white font-bold h-12 text-base shadow-md transition-all rounded-xl disabled:opacity-50"
              >
                Pay {formatKes(amount)}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                <Lock className="w-3.5 h-3.5 text-[#00A34F]" />
                <span>Authorised securely on your M-PESA phone</span>
              </div>
            </form>
          )}

          {/* STEP 2: Submitting Request */}
          {step === 'submitting' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#00A34F]/20 animate-ping" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#00A34F]/10 text-[#00A34F]">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-foreground">Sending M-PESA Prompt...</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Please hold on while we send the prompt to +254 {formattedDisplay}.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Waiting for PIN on Phone */}
          {step === 'waiting_pin' && (
            <div className="py-4 text-center space-y-5">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-[#00A34F]/20 animate-ping" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#00A34F]/10 border-2 border-[#00A34F]/40 text-[#00A34F]">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-xl text-foreground">Check Your Phone</h4>
                <p className="text-sm font-medium text-muted-foreground">
                  An M-PESA prompt was sent to <span className="font-bold text-foreground font-mono">+254 {formattedDisplay}</span>.
                </p>
                <p className="text-sm font-semibold text-[#00A34F]">
                  Enter your M-PESA PIN to authorize {formatKes(amount)}.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground font-mono mt-2 border border-border">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#00A34F]" />
                  <span>Waiting for PIN entry ({secondsRemaining}s)...</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-left text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">Prompt didn't arrive?</p>
                <p>• Ensure your phone screen is unlocked and network signal is strong.</p>
                <p>• Prompts typically arrive within 5 to 15 seconds.</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => {
                  stopTimers();
                  setStep('input');
                }}
              >
                Change Phone Number or Retry
              </Button>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-5">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[#00A34F]/10 border-2 border-[#00A34F]/30 text-[#00A34F]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-2xl text-foreground">Payment Confirmed!</h4>
                <p className="text-sm text-muted-foreground">
                  Your payment of <span className="font-bold text-foreground">{formatKes(amount)}</span> has been received.
                </p>
              </div>

              {receiptNumber && (
                <div className="p-3 rounded-xl bg-muted/60 border border-border inline-block px-5">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    M-PESA Receipt
                  </div>
                  <div className="text-base font-black font-mono text-[#00A34F] tracking-wide">
                    {receiptNumber}
                  </div>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full bg-[#00A34F] hover:bg-[#00843D] text-white font-bold h-11 text-base shadow-sm rounded-xl"
              >
                Done
              </Button>
            </div>
          )}

          {/* STEP 5: Failed Screen */}
          {step === 'failed' && (
            <div className="py-4 text-center space-y-5">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 text-rose-600">
                <XCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-xl text-foreground">Payment Not Completed</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {errorMessage || 'The payment request was not completed on your phone.'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setErrorMessage('');
                    setStep('input');
                  }}
                  className="flex-1 bg-[#00A34F] hover:bg-[#00843D] text-white font-bold rounded-xl text-xs"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
