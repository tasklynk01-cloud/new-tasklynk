"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, FileText, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PendingAssignment {
  id: number;
  displayId: string;
  orderId: string;
  title: string;
  description?: string;
  instructions?: string;
  pages: number;
  slides: number;
  workType: string;
  deadline: string;
  freelancerDeadline?: string;
  assignedAt: string;
  clientId: number;
  freelancerEarnings?: number | null;
  freelancerResponsePending?: boolean;
}

interface AssignmentPopupProps {
  onComplete?: () => void;
  // Backward compatibility for older callers
  onAssignmentHandled?: () => void;
}

export default function AssignmentPopup({ onComplete, onAssignmentHandled }: AssignmentPopupProps) {
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const fetchPendingAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/assignments/pending', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setPendingAssignments(data.pendingAssignments || []);
        setCurrentIndex(0);
      } else {
        toast.error('Failed to load pending assignments');
        setPendingAssignments([]);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
      setPendingAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingAssignments();
  }, [fetchPendingAssignments]);

  const removeAssignmentAtIndex = useCallback((index: number) => {
    setPendingAssignments((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);

      if (updated.length === 0) {
        onComplete?.();
        onAssignmentHandled?.();
        setCurrentIndex(0);
      } else if (index >= updated.length) {
        setCurrentIndex(updated.length - 1);
      } else {
        setCurrentIndex(index);
      }

      return updated;
    });
  }, [onComplete]);

  const handleAccept = async () => {
    const assignment = pendingAssignments[currentIndex];
    if (!assignment) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/v2/assignments/${assignment.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          response: 'accepted',
        }),
      });

      if (response.ok) {
        toast.success('Assignment accepted successfully!');
        removeAssignmentAtIndex(currentIndex);
        // Refresh the list to get updated assignments
        await fetchPendingAssignments();
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || 'Failed to accept assignment';
        toast.error(errorMessage);
        console.error('Accept assignment error:', error);
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('An error occurred while accepting the assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const assignment = pendingAssignments[currentIndex];
    if (!assignment || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/v2/assignments/${assignment.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          response: 'rejected',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Assignment rejected. Order returned to pool.');
        setRejectionReason('');
        setShowRejectDialog(false);
        removeAssignmentAtIndex(currentIndex);
        // Refresh the list to get updated assignments
        await fetchPendingAssignments();
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}` 
          : error.error || 'Failed to reject assignment';
        toast.error(errorMessage);
        console.error('Reject assignment error:', error);
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('An error occurred while rejecting the assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const hoursLeft = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft < 24) {
      return `${hoursLeft} hours left`;
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return `${daysLeft} days left`;
    }
  };

  if (loading) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (pendingAssignments.length === 0) {
    return null; // No pending assignments
  }

  const assignment = pendingAssignments[currentIndex];

  return (
    <>
      <Dialog open={true} modal={true}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">New Assignment - Action Required</DialogTitle>
              <Badge variant="outline" className="text-lg">
                {currentIndex + 1} of {pendingAssignments.length}
              </Badge>
            </div>
            <DialogDescription className="text-base">
              You must review this order and accept or reject it before proceeding. Click "View Order Details" to read the full instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Alert */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Action Required
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You must accept or reject this assignment before proceeding
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{assignment.displayId}</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800">
                    {assignment.workType}
                  </Badge>
                </div>
                <CardDescription className="text-base font-semibold">
                  {assignment.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {assignment.description || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pages</p>
                      <p className="font-semibold">{assignment.pages || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Slides</p>
                      <p className="font-semibold">{assignment.slides || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-semibold text-sm">
                        {formatDeadline(assignment.deadline)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Assigned: {new Date(assignment.assignedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Order Details Button - Forces opening the order */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => {
                  window.open(`/freelancer/orders/${assignment.id}`, '_blank');
                }}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Order Details (Opens in New Tab)
              </Button>
            </div>
          </div>

          <DialogFooter className="flex justify-between gap-3 sm:gap-4">
            <Button
              onClick={() => setShowRejectDialog(true)}
              disabled={actionLoading}
              variant="destructive"
              size="lg"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={actionLoading}
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {actionLoading ? 'Processing...' : 'Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Assignment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this assignment
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter your reason for rejecting this assignment..."
              className="mt-2 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              variant="destructive"
            >
              {actionLoading ? 'Submitting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
