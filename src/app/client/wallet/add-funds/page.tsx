"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';
import { toast } from 'sonner';
import { isValidWalletTopup, MIN_WALLET_TOPUP_KES } from '@/lib/payment-policy';

export default function AddFundsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [amount, setAmount] = useState<number>(1000);

  const handlePaymentSuccess = () => {
    toast.success('Payment confirmed and wallet credited.');
    // Refresh wallet balance
    setTimeout(() => {
      router.push('/client/wallet');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6">
          <Link 
            href="/client/wallet"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Wallet
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            Add Funds to Wallet
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Top up your TaskLynk wallet to pay for orders
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Top-Up Amounts</CardTitle>
              <CardDescription>Select a predefined amount or enter a custom amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[100, 500, 1000, 5000].map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    variant={amount === presetAmount ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setAmount(presetAmount)}
                    className="text-lg font-semibold"
                  >
                    KSh {presetAmount}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Amount (KSh)</label>
                <input
                  type="number"
                  min={MIN_WALLET_TOPUP_KES}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 text-lg border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-muted-foreground">Minimum amount: KSh 100. Whole shillings only.</p>
              </div>

              <Button
                size="lg"
                className="w-full text-lg"
                onClick={() => {
                  if (!isValidWalletTopup(amount)) {
                    toast.error('Enter a whole-shilling amount of at least KSh 100');
                    return;
                  }
                  setPaymentDialogOpen(true);
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add KSh {amount.toFixed(2)} to Wallet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📱</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Option 1: M-Pesa STK Push (Safaricom)</h3>
                    <p className="text-sm text-muted-foreground">
                      Instant payment via M-Pesa prompt. You'll receive a push notification on your phone to complete the payment.
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-green-600 dark:text-green-400">
                      <span className="font-semibold">✓ Instant</span>
                      <span>•</span>
                      <span className="font-semibold">✓ Secure</span>
                      <span>•</span>
                      <span className="font-semibold">✓ Automatic confirmation</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🧾</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Option 2: Pay to Till Number</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay manually to Till No: <span className="font-bold">6392479</span>, then enter your M-Pesa confirmation code for verification.
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400">
                      <span className="font-semibold">✓ Manual verification</span>
                      <span>•</span>
                      <span className="font-semibold">✓ Admin approval required</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Payment Dialog */}
      <UnifiedPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        amount={amount}
        description="Wallet Top-Up"
        type="topup"
        defaultPhoneNumber={user?.phone || ''}
        customerName={user?.name || ''}
        customerEmail={user?.email || ''}
        clientId={user?.clientId || String(user?.id || '')}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
