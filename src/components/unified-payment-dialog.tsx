"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Smartphone, CheckCircle2, AlertCircle, XCircle, RefreshCw, Lock, Wallet, ArrowRight } from 'lucide-react';
import { MpesaLogo } from '@/components/ui/mpesa-logo';
import { toast } from 'sonner';
import { isValidWalletTopup, MIN_WALLET_TOPUP_KES } from '@/lib/payment-policy';

export type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number;
  orderDisplayId?: string;
  amount: number;
  description?: string;
  onSuccess?: () => void;
  type?: 'order' | 'topup' | 'bulk';
  orderIds?: number[];
  invoiceId?: string;
  bonusAmount?: number;
  defaultPhoneNumber?: string;
  customerName?: string;
  customerEmail?: string;
  clientId?: string;
};

type PaymentStep = 'input' | 'initiating' | 'waiting_pin' | 'success' | 'failed';

const POLL_INTERVAL = 2500;
const TIMEOUT_SECONDS = 75;

export function UnifiedPaymentDialog({
  open,
  onOpenChange,
  orderId,
  orderDisplayId,
  amount,
  onSuccess,
  type = 'order',
  orderIds = [],
  bonusAmount = 0,
  defaultPhoneNumber,
}: PaymentDialogProps) {
  // Store 9 digits without country code or leading 0 (e.g. '701066845')
  const [phoneDigits, setPhoneDigits] = useState('');
  const [step, setStep] = useState<PaymentStep>('input');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TIMEOUT_SECONDS);

  // Wallet deduction & topup states
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(true);
  const [customTopupAmount, setCustomTopupAmount] = useState<number>(amount > 0 ? amount : 500);
  const [walletPaying, setWalletPaying] = useState<boolean>(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const isTopup = type === 'topup';
  const isBulkPayment = type === 'bulk' && orderIds.length > 0;
  const basePayable = isTopup ? customTopupAmount : (amount + bonusAmount);

  // Calculate wallet deduction & remaining M-PESA amount
  const walletDeduction = useMemo(() => {
    if (isTopup || !useWalletBalance || walletBalance < basePayable) return 0;
    return Math.min(walletBalance, basePayable);
  }, [isTopup, useWalletBalance, walletBalance, basePayable]);

  const remainingMpesaPayable = Math.max(0, basePayable - walletDeduction);
  const isFullyCoveredByWallet = !isTopup && walletDeduction >= basePayable && basePayable > 0;

  // Clean initial phone number input
  const sanitizeTo9Digits = (raw: string): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return digits.slice(0, 9);
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Fetch fresh client wallet balance whenever dialog opens
  useEffect(() => {
    if (open) {
      setCustomTopupAmount(amount > 0 ? amount : MIN_WALLET_TOPUP_KES);
      setStep('input');
      setErrorMessage('');
      setReceiptNumber('');
      setSecondsRemaining(TIMEOUT_SECONDS);
      clearTimers();

      fetch('/api/v2/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.balance !== undefined) {
            setWalletBalance(Number(data.user.balance) || 0);
          }
        })
        .catch(() => {});
    } else {
      clearTimers();
    }
  }, [open, amount]);

  useEffect(() => {
    if (defaultPhoneNumber && !phoneDigits) {
      setPhoneDigits(sanitizeTo9Digits(defaultPhoneNumber));
    }
  }, [defaultPhoneNumber]);

  const clearTimers = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeTo9Digits(rawVal);
    setPhoneDigits(sanitized);
    if (errorMessage) setErrorMessage('');
  };

  // Format 9 digits as "7XX XXX XXX" for clean readability
  const formattedDisplay = useMemo(() => {
    if (!phoneDigits) return '';
    if (phoneDigits.length <= 3) return phoneDigits;
    if (phoneDigits.length <= 6) return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3)}`;
    return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`;
  }, [phoneDigits]);

  const isValidKenyanNumber = (phoneDigits.startsWith('7') || phoneDigits.startsWith('1')) && phoneDigits.length === 9;

  const startPolling = (idToPoll: number) => {
    clearTimers();
    setSecondsRemaining(TIMEOUT_SECONDS);

    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearTimers();
          setStep('failed');
          setErrorMessage('Payment request timed out. Please unlock your phone and try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${idToPoll}/status`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) return;

        const data = await res.json();
        const status = data.status;

        if (status === 'paid' || status === 'completed') {
          clearTimers();
          setReceiptNumber(data.receiptNumber || 'Confirmed');
          setStep('success');
          toast.success(isTopup ? 'Wallet Top-up Successful!' : 'M-PESA Payment Received!', {
            description: `Receipt: ${data.receiptNumber || 'Confirmed'}`,
          });
          onSuccess?.();
        } else if (status === 'failed') {
          clearTimers();
          setStep('failed');
          setErrorMessage(data.resultDescription || 'Payment was declined or cancelled on your phone.');
        } else if (status === 'payment_review_required') {
          clearTimers();
          setStep('failed');
          setErrorMessage('Payment received with an amount difference. Admin will verify shortly.');
        }
      } catch (err) {
        console.error('[Unified Payment Polling Error]:', err);
      }
    }, POLL_INTERVAL);
  };

  // 1. Direct Pay via Wallet Balance (100% covered)
  const handlePayWithWalletOnly = async () => {
    if (type === 'bulk') { toast.error('Please pay each order individually. Bulk payment is not available yet.'); return; }
    const targetOrderId = orderId || (isBulkPayment && orderIds.length > 0 ? orderIds[0] : null);
    if (!targetOrderId) {
      toast.error('No order selected');
      return;
    }

    try {
      setWalletPaying(true);
      setErrorMessage('');

      const res = await fetch('/api/payments/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: targetOrderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to pay with wallet balance');
      }

      setReceiptNumber(data.reference || 'TLK-WALLET');
      setStep('success');
      toast.success('Payment Complete!', {
        description: `Order paid using wallet balance. Remaining: KES ${Number(data.newBalance).toFixed(2)}`,
      });
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete wallet payment');
      toast.error(err.message || 'Wallet payment failed');
    } finally {
      setWalletPaying(false);
    }
  };

  // 2. M-PESA STK Push (covers full or remaining balance)
  const handleInitiatePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 'initiating') return;
    if (type === 'bulk') { setErrorMessage('Please pay each order individually. Bulk payment is not available yet.'); return; }
    if (isTopup && !isValidWalletTopup(customTopupAmount)) {
      setErrorMessage('Enter a whole-shilling top-up of at least KSh 100.');
      return;
    }

    if (isFullyCoveredByWallet) {
      return handlePayWithWalletOnly();
    }

    if (!isValidKenyanNumber) {
      setErrorMessage('Please enter a valid 9-digit Kenyan phone number starting with 7 or 1.');
      return;
    }

    const targetOrderId = orderId || (isBulkPayment && orderIds.length > 0 ? orderIds[0] : null);
    if (!isTopup && !targetOrderId) {
      toast.error('No order selected for payment');
      return;
    }

    setStep('initiating');
    setErrorMessage('');

    try {
      const fullNormalizedPhone = `254${phoneDigits}`;
      const payload: any = {
        phone: fullNormalizedPhone,
      };

      if (isTopup) {
        payload.type = 'topup';
        payload.amount = customTopupAmount;
      } else {
        payload.orderId = targetOrderId;
        if (walletDeduction > 0) {
          payload.walletDeduction = walletDeduction;
        }
      }

      const response = await fetch('/api/payments/mpesa/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate M-PESA payment');
      }

      setPaymentId(data.paymentId);
      setStep('waiting_pin');

      toast.info('📱 M-PESA Prompt Sent', {
        description: 'Please check your phone and enter your PIN.',
        duration: 8000,
      });

      startPolling(data.paymentId);
    } catch (err: any) {
      console.error('[Unified Payment STK Error]:', err);
      setStep('input');
      const msg = err.message || 'Could not initiate M-PESA payment. Please verify your phone number.';
      setErrorMessage(msg);
      toast.error('Payment Error', { description: msg });
    }
  };

  const handleClose = () => {
    if (step !== 'initiating') {
      clearTimers();
      onOpenChange(false);
    }
  };

  const formatKes = (val: number) => `KES ${Math.round(val).toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border border-emerald-500/20 bg-background shadow-2xl rounded-3xl">
        {/* Header: Official Safaricom M-PESA Green & Real Logo */}
        <div className="bg-[#00A34F] px-6 py-4 text-white flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <MpesaLogo size="md" />
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-wide leading-tight">
                {isTopup ? 'Wallet Top-Up' : 'M-PESA Pay'}
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-xs font-medium">
                {isTopup ? 'Add funds to your TaskLynk balance' : 'Instant & Secure Payment'}
              </DialogDescription>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm text-white">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: Phone Input & Wallet Options */}
          {step === 'input' && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              {/* Order / Top-up Amount Card */}
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-4 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1">
                <span className="text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                  {isTopup ? 'Top-Up Amount' : 'Amount Payable'}
                </span>
                <div className="text-3xl font-black text-[#00A34F] tracking-tight">
                  {formatKes(basePayable)}
                </div>
                {orderDisplayId && !isTopup && (
                  <div className="text-xs text-muted-foreground pt-0.5">
                    Order Ref: <span className="font-semibold text-foreground">{orderDisplayId}</span>
                  </div>
                )}
              </div>

              {/* Wallet Balance & Deduction Option */}
              {!isTopup && walletBalance > 0 && (
                <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Wallet className="w-4 h-4 text-[#00A34F]" />
                      <span>TaskLynk Wallet Balance</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#00A34F]">
                      KES {walletBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <Checkbox
                      id="use-wallet"
                      checked={useWalletBalance}
                       disabled={walletBalance < basePayable}
                      onCheckedChange={(checked) => setUseWalletBalance(Boolean(checked))}
                      className="mt-0.5 data-[state=checked]:bg-[#00A34F] data-[state=checked]:border-[#00A34F]"
                    />
                    <label htmlFor="use-wallet" className="text-xs text-muted-foreground cursor-pointer leading-tight select-none">
                      {isFullyCoveredByWallet ? (
                        <span className="text-foreground font-semibold">
                          Pay 100% using available wallet balance (No M-PESA needed)
                        </span>
                      ) : (
                        <span>
                          Wallet balance does not cover this order. Pay in full via M-PESA, or top up your wallet first. Split payments are unavailable.
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Top-up Amount Preset Selector */}
              {isTopup && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">Select Amount</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={customTopupAmount === preset ? 'default' : 'outline'}
                        size="sm"
                        className={customTopupAmount === preset ? 'bg-[#00A34F] hover:bg-[#00843D] text-white font-bold' : 'text-xs font-semibold'}
                        onClick={() => setCustomTopupAmount(preset)}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                  <Input aria-label="Wallet top-up amount" type="number" min={MIN_WALLET_TOPUP_KES} step={1} value={customTopupAmount || ''} onChange={event => setCustomTopupAmount(Number(event.target.value))} />
                  <p className="text-xs text-muted-foreground">Minimum wallet top-up: KSh 100. Whole shillings only.</p>
                </div>
              )}

              {/* M-PESA Phone Number Input (Only needed if remaining > 0 or Topup) */}
              {!isFullyCoveredByWallet && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mpesa-phone-input" className="text-sm font-bold text-foreground">
                      M-PESA Phone Number
                    </Label>
                    <span className="text-xs text-muted-foreground font-medium">
                      {phoneDigits.startsWith('7') ? 'Safaricom' : phoneDigits.startsWith('1') ? 'Airtel / Safaricom' : 'Kenyan Line'}
                    </span>
                  </div>

                  <div className="relative flex items-center rounded-xl border border-input focus-within:border-[#00A34F] focus-within:ring-2 focus-within:ring-[#00A34F]/20 bg-background transition-all overflow-hidden shadow-sm">
                    {/* Fixed Country Code Pill */}
                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-muted/60 border-r border-border text-foreground font-bold text-sm select-none">
                      <span>🇰🇪</span>
                      <span>+254</span>
                    </div>

                    {/* 9-digit input */}
                    <Input
                      id="mpesa-phone-input"
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
                    Enter 9 digits starting with <strong className="text-foreground font-semibold">7</strong> or <strong className="text-foreground font-semibold">1</strong> (no leading 0).
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              {isFullyCoveredByWallet ? (
                <Button
                  type="button"
                  onClick={handlePayWithWalletOnly}
                  disabled={walletPaying}
                  className="w-full bg-[#00A34F] hover:bg-[#00843D] text-white font-bold h-12 text-base shadow-md transition-all rounded-xl gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  {walletPaying ? 'Processing...' : `Pay ${formatKes(basePayable)} from Wallet`}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValidKenyanNumber || (isTopup && !isValidWalletTopup(customTopupAmount))}
                  className="w-full bg-[#00A34F] hover:bg-[#00843D] text-white font-bold h-12 text-base shadow-md transition-all rounded-xl disabled:opacity-50"
                >
                  {isTopup
                    ? `Top Up ${formatKes(customTopupAmount)} via M-PESA`
                    : walletDeduction > 0
                    ? `Pay Remaining ${formatKes(remainingMpesaPayable)} via M-PESA`
                    : `Pay ${formatKes(basePayable)} via M-PESA`}
                </Button>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                <Lock className="w-3.5 h-3.5 text-[#00A34F]" />
                <span>Authorised securely on your M-PESA handset</span>
              </div>
            </form>
          )}

          {/* STEP 2: Initiating Request */}
          {step === 'initiating' && (
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
                  Enter your M-PESA PIN to authorize {formatKes(remainingMpesaPayable)}.
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
                  clearTimers();
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
                <h4 className="font-black text-2xl text-foreground">
                  {isTopup ? 'Wallet Top-Up Complete!' : 'Payment Confirmed!'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isTopup
                    ? `Your TaskLynk wallet has been credited with ${formatKes(customTopupAmount)}.`
                    : `Your payment of ${formatKes(basePayable)} has been confirmed.`}
                </p>
              </div>

              {receiptNumber && (
                <div className="p-3 rounded-xl bg-muted/60 border border-border inline-block px-5">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Receipt Reference
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
