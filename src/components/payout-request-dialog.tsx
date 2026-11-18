"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface PayoutRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  availableBalance: number;
  onSuccess?: () => void;
}

export function PayoutRequestDialog({
  open,
  onOpenChange,
  userId,
  availableBalance,
  onSuccess,
}: PayoutRequestDialogProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setMethod('mpesa');
      setPhoneNumber('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parsedAmount > availableBalance) {
      newErrors.amount = `Amount exceeds available balance (KSh ${availableBalance.toFixed(2)})`;
    } else if (parsedAmount < 100) {
      newErrors.amount = 'Minimum payout amount is KSh 100';
    }

    // Validate method-specific fields
    if (method === 'mpesa') {
      if (!phoneNumber.trim()) {
        newErrors.phoneNumber = 'M-Pesa phone number is required';
      } else {
        // Validate phone number format
        const cleaned = phoneNumber.replace(/[\s-]/g, '').replace(/^\+/, '');
        if (!/^(0|254)?[17]\d{8}$/.test(cleaned)) {
          newErrors.phoneNumber = 'Please enter a valid Kenyan phone number';
        }
      }
    } else {
      if (!bankName.trim()) {
        newErrors.bankName = 'Bank name is required';
      }
      if (!accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      }
      if (!accountName.trim()) {
        newErrors.accountName = 'Account name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[\s-]/g, '').replace(/^\+/, '');
    
    if (/^0[17]\d{8}$/.test(cleaned)) {
      return '254' + cleaned.slice(1);
    } else if (/^[17]\d{8}$/.test(cleaned)) {
      return '254' + cleaned;
    } else if (/^254[17]\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    
    return cleaned;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      
      let accountDetails: any = {};
      if (method === 'mpesa') {
        accountDetails = {
          phoneNumber: formatPhoneNumber(phoneNumber),
        };
      } else {
        accountDetails = {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        };
      }

      const response = await fetch(`/api/v2/users/${userId}/payout-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          accountDetails,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Payout request submitted successfully! Awaiting admin approval.');
        onOpenChange(false);
        onSuccess?.();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to submit payout request' }));
        toast.error(extractErrorMessage(error, 'Failed to submit payout request'));
        if (error.code === 'ACCOUNT_NOT_APPROVED') {
          setErrors({ general: 'Your account must be approved before requesting payouts' });
        }
      }
    } catch (error) {
      console.error('Payout request error:', error);
      toast.error('Failed to submit payout request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Wallet className="w-5 h-5" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Request withdrawal of your available balance. Minimum payout: KSh 100
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Available Balance Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-900">Available Balance</span>
              <span className="text-lg font-bold text-green-700">
                KSh {availableBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Payout Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max={availableBalance}
              step="0.01"
              disabled={submitting}
            />
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Minimum: KSh 100 | Maximum: KSh {availableBalance.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select value={method} onValueChange={(value: 'mpesa' | 'bank') => setMethod(value)}>
              <SelectTrigger id="method" disabled={submitting}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* M-Pesa Fields */}
          {method === 'mpesa' && (
            <div>
              <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="e.g., 0712345678 or 254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={submitting}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enter your M-Pesa registered phone number
              </p>
            </div>
          )}

          {/* Bank Transfer Fields */}
          {method === 'bank' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., Equity Bank, KCB"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={submitting}
                />
                {errors.bankName && (
                  <p className="text-sm text-red-600 mt-1">{errors.bankName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={submitting}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.accountNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  placeholder="Account holder name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  disabled={submitting}
                />
                {errors.accountName && (
                  <p className="text-sm text-red-600 mt-1">{errors.accountName}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !amount || availableBalance < 100}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

