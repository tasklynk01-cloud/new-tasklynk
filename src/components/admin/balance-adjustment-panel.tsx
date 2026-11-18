"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface BalanceAdjustmentPanelProps {
  orderId: number;
  freelancerId?: number | null;
  managerId?: number | null;
  onAdjustmentSuccess?: () => void;
}

const ADJUSTMENT_TYPES = [
  { value: 'partial_payment', label: 'Partial Payment', description: 'Client paid less than expected' },
  { value: 'correction', label: 'Correction', description: 'Fix calculation error' },
  { value: 'dispute_resolution', label: 'Dispute Resolution', description: 'Resolve payment dispute' },
  { value: 'overpayment_refund', label: 'Overpayment Refund', description: 'Client overpaid' },
  { value: 'manual_credit', label: 'Manual Credit', description: 'Add funds manually' },
  { value: 'manual_debit', label: 'Manual Debit', description: 'Remove funds manually' },
];

export function BalanceAdjustmentPanel({ 
  orderId, 
  freelancerId, 
  managerId,
  onAdjustmentSuccess 
}: BalanceAdjustmentPanelProps) {
  const [userRole, setUserRole] = useState<'freelancer' | 'manager'>('freelancer');
  const [adjustmentType, setAdjustmentType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [targetBalance, setTargetBalance] = useState<'pending' | 'reserved' | 'available'>('pending');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedUserId = userRole === 'freelancer' ? freelancerId : managerId;
  const canAdjust = !!selectedUserId;

  const handleAdjustBalance = async () => {
    if (!canAdjust) {
      toast.error(`No ${userRole} assigned to this order`);
      return;
    }

    if (!adjustmentType) {
      toast.error('Please select an adjustment type');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum === 0) {
      toast.error('Please enter a valid non-zero amount');
      return;
    }

    if (reason.trim().length < 20) {
      toast.error('Reason must be at least 20 characters for audit trail');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v2/orders/${orderId}/admin/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          userRole,
          adjustmentType,
          amount: amountNum,
          targetBalance,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Balance adjusted: ${amountNum >= 0 ? '+' : ''}KSh ${amountNum.toFixed(2)}`,
          {
            description: `${userRole} ${targetBalance} balance updated`,
            duration: 5000,
          }
        );
        setAmount('');
        setReason('');
        onAdjustmentSuccess?.();
      } else {
        toast.error(extractErrorMessage(data, 'Failed to adjust balance'), {
          description: data.currentBalance ? 
            `Current: Pending ${data.currentBalance.pending}, Reserved ${data.currentBalance.reserved}, Available ${data.currentBalance.available}` 
            : undefined,
        });
      }
    } catch (error) {
      console.error('Balance adjustment error:', error);
      toast.error('Failed to adjust balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-blue-900">
          <DollarSign className="w-5 h-5" />
          Manual Balance Adjustment
        </CardTitle>
        <CardDescription>
          Adjust user balances for corrections, partial payments, or disputes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userRole">User Role</Label>
            <Select value={userRole} onValueChange={(v) => setUserRole(v as any)}>
              <SelectTrigger id="userRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freelancer" disabled={!freelancerId}>
                  Freelancer {!freelancerId && '(None assigned)'}
                </SelectItem>
                <SelectItem value="manager" disabled={!managerId}>
                  Manager {!managerId && '(None assigned)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetBalance">Target Balance</Label>
            <Select value={targetBalance} onValueChange={(v) => setTargetBalance(v as any)}>
              <SelectTrigger id="targetBalance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending (Pre-payment)</SelectItem>
                <SelectItem value="reserved">Reserved (Post-payment)</SelectItem>
                <SelectItem value="available">Available (Released)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustmentType">Adjustment Type</Label>
          <Select value={adjustmentType} onValueChange={setAdjustmentType}>
            <SelectTrigger id="adjustmentType">
              <SelectValue placeholder="Select adjustment reason" />
            </SelectTrigger>
            <SelectContent>
              {ADJUSTMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (KSh) <span className="text-xs text-muted-foreground">Use negative for deductions</span>
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 500 or -200"
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustReason">Detailed Reason (Required for Audit)</Label>
          <Textarea
            id="adjustReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide detailed explanation for this manual adjustment (minimum 20 characters)..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {reason.length}/20 characters minimum
          </p>
        </div>

        <Button
          onClick={handleAdjustBalance}
          disabled={loading || !canAdjust || !adjustmentType || !amount || reason.trim().length < 20}
          className="w-full"
          variant="default"
        >
          {loading ? (
            <>
              <DollarSign className="w-4 h-4 mr-2 animate-pulse" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Adjust {userRole} Balance
            </>
          )}
        </Button>

        <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg text-xs text-blue-900">
          <p className="font-semibold mb-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Audit Trail
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>All adjustments are logged with full details</li>
            <li>Cannot create negative balances (validation enforced)</li>
            <li>Use for partial payments, corrections, or dispute resolutions</li>
            <li>Recommended: Verify current balance before adjusting</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
