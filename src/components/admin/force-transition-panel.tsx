"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface ForceTransitionPanelProps {
  orderId: number;
  currentStatus: string;
  onTransitionSuccess?: () => void;
}

const RECOVERY_STATUSES = [
  { value: 'in_progress', label: 'In Progress', description: 'Resume normal work flow' },
  { value: 'editing', label: 'Editing', description: 'Return to editing phase' },
  { value: 'delivered', label: 'Delivered', description: 'Mark as delivered for client review' },
  { value: 'revision', label: 'Revision', description: 'Request revision from freelancer' },
  { value: 'on_hold', label: 'On Hold', description: 'Temporarily pause order' },
];

export function ForceTransitionPanel({ orderId, currentStatus, onTransitionSuccess }: ForceTransitionPanelProps) {
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForceTransition = async () => {
    if (!targetStatus) {
      toast.error('Please select a target status');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v2/orders/${orderId}/admin/force-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetStatus,
          reason: reason.trim(),
          notifyUsers: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Order transitioned from ${data.transition.from} to ${data.transition.to}`,
          { duration: 5000 }
        );
        setTargetStatus('');
        setReason('');
        onTransitionSuccess?.();
      } else {
        toast.error(extractErrorMessage(data, 'Failed to force transition'), {
          description: data.hint || undefined,
        });
      }
    } catch (error) {
      console.error('Force transition error:', error);
      toast.error('Failed to force transition order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-orange-900">
          <AlertTriangle className="w-5 h-5" />
          Force Status Transition
        </CardTitle>
        <CardDescription>
          Manually override order status for recovery purposes. Current: <strong>{currentStatus}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="targetStatus">Target Status</Label>
          <Select value={targetStatus} onValueChange={setTargetStatus}>
            <SelectTrigger id="targetStatus">
              <SelectValue placeholder="Select recovery status" />
            </SelectTrigger>
            <SelectContent>
              {RECOVERY_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{status.label}</span>
                    <span className="text-xs text-muted-foreground">{status.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Required for Audit Trail)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this manual intervention is necessary (minimum 10 characters)..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {reason.length}/10 characters minimum
          </p>
        </div>

        <Button
          onClick={handleForceTransition}
          disabled={loading || !targetStatus || reason.trim().length < 10}
          className="w-full"
          variant="destructive"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Force Transition to {targetStatus ? RECOVERY_STATUSES.find(s => s.value === targetStatus)?.label : '...'}
            </>
          )}
        </Button>

        <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg text-xs text-orange-900">
          <p className="font-semibold mb-1">⚠️ Warning: Manual Override</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This bypasses normal workflow validations</li>
            <li>All affected users will be notified</li>
            <li>Action is logged in audit trail</li>
            <li>Cannot transition to/from protected states (approved, paid, completed, cancelled)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
