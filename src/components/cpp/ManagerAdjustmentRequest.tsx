'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, DollarSign, Plus, Send } from 'lucide-react';
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

interface ManagerAdjustmentRequestProps {
  jobId: number;
  orderId: string;
  currentAmount: number;
  clientCpp?: number | null;
  managerAdditional?: number;
  managerAdditionalStatus?: string;
  statusTotalAmount?: number;
  adjustments?: Adjustment[];
  onAdjustmentCreated?: () => void;
}

const ADJUSTMENT_TYPES = [
  { value: 'extra_pages', label: 'Extra Pages', description: 'Additional pages beyond original scope' },
  { value: 'urgency', label: 'Urgency Fee', description: 'Rush delivery surcharge' },
  { value: 'complexity', label: 'Complexity Fee', description: 'Technical or complex work' },
  { value: 'revision_extra', label: 'Extra Revisions', description: 'Beyond free revisions limit' },
  { value: 'format_change', label: 'Format Change', description: 'Referencing style or format changes' },
  { value: 'other', label: 'Other', description: 'Other justified additional work' },
];

export function ManagerAdjustmentRequest({
  jobId,
  orderId,
  currentAmount,
  clientCpp,
  managerAdditional = 0,
  managerAdditionalStatus = 'none',
  statusTotalAmount = 0,
  adjustments = [],
  onAdjustmentCreated,
}: ManagerAdjustmentRequestProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    
    if (!adjustmentType) {
      toast.error('Please select an adjustment type');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const response = await fetch(`/api/jobs/${jobId}/adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          adjustmentType,
          amount: numAmount,
          reason: reason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Adjustment request submitted successfully');
        setAmount('');
        setReason('');
        setAdjustmentType('');
        setShowForm(false);
        onAdjustmentCreated?.();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to submit adjustment request'));
      }
    } catch (error) {
      console.error('Failed to submit adjustment:', error);
      toast.error('Failed to submit adjustment request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingTotal = adjustments
    .filter(a => a.status === 'pending')
    .reduce((sum, a) => sum + a.amount, 0);

  const approvedTotal = adjustments
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-[#F2A541]" />
          Amount Adjustments
        </CardTitle>
        <CardDescription>
          Request additional payment for extra work on Order #{orderId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Base Amount</p>
            <p className="font-semibold">KSh {currentAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Manager Additional</p>
            <p className="font-semibold text-green-600">+ KSh {managerAdditional.toFixed(2)}</p>
            {managerAdditionalStatus !== 'none' && (
              <span className="text-xs">{getStatusBadge(managerAdditionalStatus)}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved Adjustments</p>
            <p className="font-semibold text-green-600">+ KSh {approvedTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Total</p>
            <p className="font-bold text-lg text-[#1D3557]">KSh {(statusTotalAmount || currentAmount).toFixed(2)}</p>
          </div>
        </div>

        {clientCpp && (
          <div className="text-sm text-muted-foreground">
            Client CPP (Cost Per Page): <span className="font-medium">KSh {clientCpp.toFixed(2)}</span>
          </div>
        )}

        {adjustments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Adjustment History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {adjustments.map((adj) => (
                <div key={adj.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium capitalize">{adj.adjustmentType.replace('_', ' ')}</span>
                    {adj.reason && <p className="text-xs text-muted-foreground">{adj.reason}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(adj.requestedAt).toLocaleDateString()}
                      {adj.requestedByName && ` by ${adj.requestedByName}`}
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

        {pendingTotal > 0 && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg text-sm">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span>Pending adjustments: <strong>KSh {pendingTotal.toFixed(2)}</strong> awaiting client approval</span>
          </div>
        )}

        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full bg-[#1D3557] hover:bg-[#1D3557]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Additional Payment
          </Button>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">New Adjustment Request</h4>
            
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (KSh)</Label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter additional amount..."
              />
            </div>

            <div className="space-y-2">
              <Label>Reason / Justification</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this additional amount is needed..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-[#F2A541] hover:bg-[#F2A541]/90 text-primary-foreground"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
