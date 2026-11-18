"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, XCircle, Clock, FileText, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type PendingAssignment = {
  id: number;
  displayId: string;
  title: string;
  instructions?: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  deadline?: string;
  freelancerDeadline?: string;
  amount?: number;
  freelancerEarnings?: number | null;
  freelancerResponsePending?: boolean;
};

type BlockingOrderConfirmationModalProps = {
  freelancerId: number | null;
  onOrderConfirmed: () => void;
};

export function BlockingOrderConfirmationModal({ 
  freelancerId, 
  onOrderConfirmed 
}: BlockingOrderConfirmationModalProps) {
  // Early return BEFORE any hooks to prevent conditional hook calls
  if (!freelancerId) {
    return null;
  }

  const [pendingOrders, setPendingOrders] = useState<PendingAssignment[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch orders with pending freelancer response
  useEffect(() => {
    const fetchPendingOrders = async () => {
      if (!freelancerId) return;

      try {
        const response = await fetch('/api/v2/assignments/pending', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const assignments = (data.pendingAssignments || []) as PendingAssignment[];
          setPendingOrders(assignments);
          setCurrentOrderIndex(0);
        }
      } catch (error) {
        console.error('Failed to fetch pending orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
    
    // Poll every 10 seconds to check for new assignments
    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, [freelancerId]);

  const currentOrder = pendingOrders[currentOrderIndex];

  const handleAccept = async () => {
    if (!currentOrder) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/v2/assignments/${currentOrder.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response: 'accepted' }),
      });

      if (response.ok) {
        toast.success('Order accepted! Status updated to In Progress.');
        
        // Remove accepted order from list
        const updatedOrders = pendingOrders.filter(o => o.id !== currentOrder.id);
        setPendingOrders(updatedOrders);
        
        // Move to next order or close modal
        if (currentOrderIndex < updatedOrders.length) {
          setCurrentOrderIndex(Math.min(currentOrderIndex, updatedOrders.length - 1));
        } else {
          // No more pending orders
          setPendingOrders([]);
          onOrderConfirmed();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || 'Failed to accept order';
        toast.error(errorMessage);
        console.error('Accept order error:', errorData);
      }
    } catch (error) {
      console.error('Accept error:', error);
      if (error instanceof Error && error.message.includes('Failed to process assignment response')) {
        // Show more user-friendly error
        toast.error('There was an issue processing your response. Please refresh and try again.');
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentOrder) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/v2/assignments/${currentOrder.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          response: 'rejected',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Order rejected. Manager has been notified.');
        setRejectionReason('');
        setShowRejectionForm(false);
        
        // Remove rejected order from list
        const updatedOrders = pendingOrders.filter(o => o.id !== currentOrder.id);
        setPendingOrders(updatedOrders);
        
        // Move to next order or close modal
        if (currentOrderIndex < updatedOrders.length) {
          setCurrentOrderIndex(Math.min(currentOrderIndex, updatedOrders.length - 1));
        } else {
          // No more pending orders
          setPendingOrders([]);
          onOrderConfirmed();
        }
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || 'Failed to reject order';
        toast.error(errorMessage);
        console.error('Reject order error:', error);
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEarnings = (order: PendingAssignment): number => {
    if (typeof order.freelancerEarnings === 'number') {
      return order.freelancerEarnings;
    }

    const workType = order.workType.toLowerCase().trim();
    
    // AI Removal - 60 per page, 30 per slide
    if (workType.includes('ai removal') || workType.includes('ai-removal')) {
      return ((order.pages || 0) * 60) + ((order.slides || 0) * 30);
    }
    
    // Plag AI Report - 30 flat
    if (workType.includes('plag') || workType.includes('plagiarism')) {
      return 30;
    }
    
    // Grammarly and Proofreading - 30 per page
    if (workType.includes('grammarly') || workType.includes('proofread')) {
      return (order.pages || 0) * 30;
    }
    
    // Default: Writing jobs - 150 per page, 90 per slide
    return ((order.pages || 0) * 150) + ((order.slides || 0) * 90);
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'No deadline set';

    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} (${date.toLocaleString()})`;
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} (${date.toLocaleString()})`;
  };

  // Don't show modal if no pending orders
  if (!loading && pendingOrders.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <VisuallyHidden asChild>
              <DialogTitle>Checking pending assignments</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden asChild>
              <DialogDescription>
                We are checking for orders that need your response.
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentOrder) return null;

  const earnings = calculateEarnings(currentOrder);

  return (
    <Dialog open={true}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500 animate-pulse" />
              New Order Assignment - Action Required
            </DialogTitle>
            {pendingOrders.length > 1 && (
              <Badge variant="secondary">
                {currentOrderIndex + 1} of {pendingOrders.length}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-base">
            You have been assigned a new order. Please review the details carefully and confirm whether you can accept or need to reject this assignment.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> You must respond to this assignment before accessing other features. Accepting moves the order to "In Progress". Rejecting returns it to the manager for reassignment.
          </AlertDescription>
        </Alert>

        {/* Order Details */}
        <div className="space-y-4 mt-4">
          {/* Order ID and Title */}
          <div>
            <Label className="text-xs text-muted-foreground">Order ID</Label>
            <div className="font-mono text-lg font-semibold text-primary">
              {currentOrder.displayId || currentOrder.id}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <div className="text-lg font-medium">{currentOrder.title}</div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">Your Earnings</div>
                <div className="font-semibold text-green-600">KES {earnings.toFixed(0)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">Pages / Slides</div>
                <div className="font-semibold">
                  {currentOrder.pages || 0} pg / {currentOrder.slides || 0} sl
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">Work Type</div>
                <div className="font-semibold capitalize">{currentOrder.workType}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">Your Deadline</div>
                <div className="font-semibold text-sm">
                  {formatDeadline(currentOrder.freelancerDeadline || currentOrder.deadline)}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Label className="text-sm font-semibold mb-2 flex items-center gap-3">
              <FileText className="h-4 w-4" />
              Order Instructions
            </Label>
            <div className="bg-muted/50 p-4 rounded-lg border max-h-[200px] overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm">
                {currentOrder.instructions || 'No additional instructions provided.'}
              </div>
            </div>
          </div>

          {/* Rejection Form */}
          {showRejectionForm && (
            <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
              <Label htmlFor="rejectionReason" className="text-sm font-semibold">
                Rejection Reason (Required)
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why you cannot accept this order (e.g., deadline too tight, outside my expertise, personal emergency, etc.)"
                rows={4}
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                Your manager will be notified with this reason and can reassign the order to another writer.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {!showRejectionForm ? (
            <>
              <Button
                onClick={handleAccept}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-primary-foreground h-12"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {submitting ? 'Accepting...' : 'Accept Order'}
              </Button>
              <Button
                onClick={() => setShowRejectionForm(true)}
                disabled={submitting}
                variant="destructive"
                className="flex-1 h-12"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Reject Order
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                variant="destructive"
                className="flex-1 h-12"
              >
                {submitting ? 'Submitting...' : 'Confirm Rejection'}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectionForm(false);
                  setRejectionReason('');
                }}
                disabled={submitting}
                variant="outline"
                className="flex-1 h-12"
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          This dialog will remain until you respond to all pending assignments.
        </p>
      </DialogContent>
    </Dialog>
  );
}
