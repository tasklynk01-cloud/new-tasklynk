import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type PaymentMethod = 'card' | 'mobile_money' | 'bank';

interface PaystackPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderId?: number;
  orderTitle?: string;
  onSuccess?: (reference: string) => void;
}

export function PaystackPaymentDialog({
  open,
  onOpenChange,
  amount,
  orderId,
  orderTitle,
  onSuccess,
}: PaystackPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const handleInitiatePayment = async () => {
    // Validate inputs
    if (paymentMethod === 'mobile_money' && !phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Validate phone number format for mobile money
    if (paymentMethod === 'mobile_money') {
      const phoneRegex = /^(07|01|254)\d{8,9}$/;
      if (!phoneRegex.test(phoneNumber.replace(/[\s\-]/g, ''))) {
        toast.error('Invalid phone number. Use format: 07XXXXXXXX or 254XXXXXXXXX');
        return;
      }
    }

    setLoading(true);

    try {
      // Get bearer token
      const token = localStorage.getItem('bearer_token');
      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Determine channels based on payment method
      const channels = paymentMethod === 'mobile_money' 
        ? ['mobile_money'] 
        : paymentMethod === 'card'
        ? ['card']
        : ['bank'];

      // Determine source based on current domain
      const isAppDomain = typeof window !== 'undefined' && (window.location.hostname.startsWith('app.') || window.location.pathname.startsWith('/client'));
      const source = isAppDomain ? 'app' : 'website';
      const returnUrl = `${window.location.origin}/payment/callback`;

      // Initiate payment via centralized endpoint
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          jobId: orderId || null,
          amount,
          email,
          phoneNumber: paymentMethod === 'mobile_money' ? phoneNumber : undefined,
          channel: channels,
          source,
          purpose: orderId ? 'order' : 'wallet_topup',
          return_url: returnUrl,
          metadata: {
            orderTitle: orderTitle || 'Order payment',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Failed to initialize payment');
      }

      console.log('[Paystack Payment] Initialized:', data);

      const authUrl = data.data?.authorization_url || data.authorization_url;

      // For mobile money, show instructions
      if (paymentMethod === 'mobile_money') {
        toast.success(data.message || 'Payment prompt initialized. Redirecting to complete checkout...');
        
        if (authUrl) {
          window.location.href = authUrl;
        }
      } else {
        // For card/bank, redirect to Paystack checkout
        if (authUrl) {
          window.location.href = authUrl;
        } else {
          throw new Error('No payment URL received');
        }
      }

      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

    } catch (error: any) {
      console.error('[Paystack Payment] Error:', error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay KSh {amount.toFixed(2)} for {orderTitle || 'your order'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <Label htmlFor="mobile_money" className="flex-1 cursor-pointer flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">M-Pesa (Mobile Money)</div>
                    <div className="text-sm text-muted-foreground">Pay with M-Pesa STK push</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Card Payment</div>
                    <div className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or Verve</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex-1 cursor-pointer flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Bank Transfer</div>
                    <div className="text-sm text-muted-foreground">Direct bank transfer</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Phone Number for Mobile Money */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="07XXXXXXXX or 254XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the M-Pesa number registered to your name
              </p>
            </div>
          )}

          {/* Amount Display */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-2xl font-bold">KSh {amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInitiatePayment}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay KSh {amount.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
