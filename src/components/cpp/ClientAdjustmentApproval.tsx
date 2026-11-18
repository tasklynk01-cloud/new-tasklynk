'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, DollarSign, Plus, ThumbsUp, ThumbsDown, CreditCard, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface Adjustment {
  id: number;
  jobId: number;
  adjustmentType: string;
  amount: number;
  reason: string | null;
  status: string;
  requestedBy: number;
  requestedByName?: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: number;
}

interface ClientAdjustmentApprovalProps {
  jobId: number;
  orderId: string;
  currentAmount: number;
  clientCpp?: number | null;
  managerAdditional?: number;
  managerAdditionalStatus?: string;
  statusTotalAmount?: number;
  clientBonus?: number;
  adjustments?: Adjustment[];
  onAction?: () => void;
}

const ADJUSTMENT_TYPE_LABELS: Record<string, string> = {
  extra_pages: 'Extra Pages',
  urgency: 'Urgency Fee',
  complexity: 'Complexity Fee',
  revision_extra: 'Extra Revisions',
  format_change: 'Format Change',
  topup: 'Client Top-up',
  bonus: 'Client Bonus',
  other: 'Other',
};

export function ClientAdjustmentApproval({
  jobId,
  orderId,
  currentAmount,
  clientCpp,
  managerAdditional = 0,
  managerAdditionalStatus = 'none',
  statusTotalAmount = 0,
  clientBonus = 0,
  adjustments = [],
  onAction,
}: ClientAdjustmentApprovalProps) {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupNote, setTopupNote] = useState('');
  const [submittingTopup, setSubmittingTopup] = useState(false);

  const handleApprove = async (adjustmentId: number) => {
    setProcessingId(adjustmentId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch(`/api/jobs/${jobId}/adjustments/${adjustmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: 'approved',
        }),
      });

      if (response.ok) {
        toast.success('Adjustment approved successfully');
        onAction?.();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to approve adjustment'));
      }
    } catch (error) {
      console.error('Failed to approve adjustment:', error);
      toast.error('Failed to approve adjustment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (adjustmentId: number) => {
    setProcessingId(adjustmentId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch(`/api/jobs/${jobId}/adjustments/${adjustmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: 'rejected',
        }),
      });

      if (response.ok) {
        toast.success('Adjustment rejected');
        onAction?.();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to reject adjustment'));
      }
    } catch (error) {
      console.error('Failed to reject adjustment:', error);
      toast.error('Failed to reject adjustment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTopup = async () => {
    const numAmount = parseFloat(topupAmount);
    
    if (!numAmount || numAmount < 50) {
      toast.error('Minimum top-up amount is KSh 50');
      return;
    }

    setSubmittingTopup(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch(`/api/jobs/${jobId}/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: numAmount,
          note: topupNote.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success('Top-up added successfully');
        setTopupAmount('');
        setTopupNote('');
        setShowTopupForm(false);
        onAction?.();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to add top-up'));
      }
    } catch (error) {
      console.error('Failed to add top-up:', error);
      toast.error('Failed to add top-up');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" /> Pending Approval</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingAdjustments = adjustments.filter(a => a.status === 'pending');
  const otherAdjustments = adjustments.filter(a => a.status !== 'pending');

  const approvedTotal = adjustments
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.amount, 0);

  const pendingTotal = pendingAdjustments.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-[#F2A541]" />
          Order Payment Details
        </CardTitle>
        <CardDescription>
          View and manage adjustments for Order #{orderId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Base Amount</p>
            <p className="font-semibold">KSh {currentAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved Extras</p>
            <p className="font-semibold text-green-600">+ KSh {(approvedTotal + (managerAdditionalStatus === 'approved' ? managerAdditional : 0)).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Bonus</p>
            <p className="font-semibold text-purple-600">+ KSh {clientBonus.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="font-bold text-lg text-[#1D3557]">KSh {(statusTotalAmount || currentAmount).toFixed(2)}</p>
          </div>
        </div>

        {clientCpp && (
          <div className="text-sm text-muted-foreground">
            Your Price Per Page: <span className="font-medium">KSh {clientCpp.toFixed(2)}</span>
          </div>
        )}

        {pendingAdjustments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              Pending Approval ({pendingAdjustments.length})
            </h4>
            <div className="space-y-2">
              {pendingAdjustments.map((adj) => (
                <div key={adj.id} className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{ADJUSTMENT_TYPE_LABELS[adj.adjustmentType] || adj.adjustmentType}</span>
                        <span className="text-lg font-bold text-[#1D3557]">KSh {adj.amount.toFixed(2)}</span>
                      </div>
                      {adj.reason && (
                        <p className="text-sm text-gray-600 mt-1">{adj.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {new Date(adj.requestedAt).toLocaleDateString()}
                        {adj.requestedByName && ` by ${adj.requestedByName}`}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(adj.id)}
                        disabled={processingId === adj.id}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-primary-foreground"
                        onClick={() => handleApprove(adj.id)}
                        disabled={processingId === adj.id}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-yellow-700">
              Total pending: <strong>KSh {pendingTotal.toFixed(2)}</strong> - Approve to add to your order total
            </p>
          </div>
        )}

        {otherAdjustments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Adjustment History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {otherAdjustments.map((adj) => (
                <div key={adj.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{ADJUSTMENT_TYPE_LABELS[adj.adjustmentType] || adj.adjustmentType}</span>
                    {adj.reason && <p className="text-xs text-muted-foreground">{adj.reason}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(adj.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">KSh {adj.amount.toFixed(2)}</span>
                    {getStatusBadge(adj.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-3">
            <Gift className="w-4 h-4 text-purple-600" />
            Add a Bonus / Top-up
          </h4>
          <p className="text-sm text-muted-foreground">
            Want to add extra payment as a tip or for additional work? Add a top-up below.
          </p>

          {!showTopupForm ? (
            <Button
              variant="outline"
              onClick={() => setShowTopupForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Top-up / Bonus
            </Button>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Amount (KSh)</Label>
                <Input
                  type="number"
                  min="50"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Minimum KSh 50"
                />
              </div>

              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Textarea
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                  placeholder="e.g., Thank you for the great work!"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTopupForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTopup}
                  disabled={submittingTopup}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-primary-foreground"
                >
                  {submittingTopup ? (
                    <>Adding...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Top-up
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
