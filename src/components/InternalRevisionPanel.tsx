"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface InternalRevision {
  id: number;
  orderId: number;
  requestedBy: number;
  requestedByName?: string;
  assignedTo: number;
  assignedToName?: string;
  reason: string;
  details: string | null;
  status: 'open' | 'submitted' | 'closed';
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

interface InternalRevisionPanelProps {
  orderId: number;
  userRole: 'admin' | 'manager' | 'freelancer';
  userId: number;
  freelancerId?: number;
  onRevisionChange?: () => void;
}

export default function InternalRevisionPanel({
  orderId,
  userRole,
  userId,
  freelancerId,
  onRevisionChange,
}: InternalRevisionPanelProps) {
  const [revisions, setRevisions] = useState<InternalRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<InternalRevision | null>(null);
  
  // Create form
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  
  // Submit form
  const [submissionNotes, setSubmissionNotes] = useState('');
  
  // Review form
  const [reviewAction, setReviewAction] = useState<'accept' | 'request_more'>('accept');
  const [reviewNotes, setReviewNotes] = useState('');
  const [additionalChanges, setAdditionalChanges] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRevisions();
  }, [orderId]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(
        `/api/v2/orders/${orderId}/internal-revision?userId=${userId}&role=${userRole}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRevisions(data.revisions || []);
      }
    } catch (error) {
      console.error('Failed to fetch internal revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!reason.trim() || !freelancerId) {
      toast.error('Please provide a reason for the revision');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(`/api/v2/orders/${orderId}/internal-revision`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: freelancerId,
          reason: reason.trim(),
          details: details.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success('Internal revision requested from freelancer');
        setReason('');
        setDetails('');
        setShowCreateDialog(false);
        fetchRevisions();
        onRevisionChange?.();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to create internal revision'));
      }
    } catch (error) {
      console.error('Create revision error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!selectedRevision) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(
        `/api/v2/internal-revisions/${selectedRevision.id}/submit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submissionNotes: submissionNotes.trim() || null,
          }),
        }
      );

      if (response.ok) {
        toast.success('Internal revision submitted for review');
        setSubmissionNotes('');
        setShowSubmitDialog(false);
        setSelectedRevision(null);
        fetchRevisions();
        onRevisionChange?.();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to submit revision'));
      }
    } catch (error) {
      console.error('Submit revision error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewRevision = async () => {
    if (!selectedRevision) return;
    if (reviewAction === 'request_more' && !additionalChanges.trim()) {
      toast.error('Please provide additional changes requested');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(
        `/api/v2/internal-revisions/${selectedRevision.id}/review`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: reviewAction,
            reviewNotes: reviewNotes.trim() || null,
            additionalChanges: additionalChanges.trim() || null,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          reviewAction === 'accept'
            ? 'Internal revision accepted. Ready to deliver to client.'
            : 'Additional changes requested from freelancer'
        );
        setReviewNotes('');
        setAdditionalChanges('');
        setShowReviewDialog(false);
        setSelectedRevision(null);
        fetchRevisions();
        onRevisionChange?.();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to review revision'));
      }
    } catch (error) {
      console.error('Review revision error:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open - Needs Work</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted - Awaiting Review</Badge>;
      case 'closed':
        return <Badge className="bg-green-500">Accepted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canCreate = (userRole === 'admin' || userRole === 'manager') && freelancerId;
  const openRevisions = revisions.filter((r) => r.status === 'open');
  const hasOpenRevisions = openRevisions.length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Internal Revisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5" />
                Internal Revisions
                {hasOpenRevisions && (
                  <Badge variant="destructive" className="ml-2">
                    {openRevisions.length} Open
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Quality control revisions between admin/manager and freelancer
                (not visible to client)
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={() => setShowCreateDialog(true)} size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Request Revision
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No internal revisions yet</p>
              {canCreate && (
                <p className="text-sm mt-1">
                  Request a revision if the work needs changes before delivering to client
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision) => (
                <Card key={revision.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      {getStatusBadge(revision.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(revision.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold">Reason:</span>
                        <p className="text-sm text-muted-foreground">{revision.reason}</p>
                      </div>

                      {revision.details && (
                        <div>
                          <span className="text-sm font-semibold">Details:</span>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {revision.details}
                          </p>
                        </div>
                      )}

                      {revision.status === 'submitted' && revision.submittedAt && (
                        <div className="bg-blue-50 p-4 rounded text-sm">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Submitted: {new Date(revision.submittedAt).toLocaleString()}
                        </div>
                      )}

                      {revision.reviewNotes && (
                        <div className="bg-green-50 p-4 rounded">
                          <span className="text-sm font-semibold">Review Notes:</span>
                          <p className="text-sm">{revision.reviewNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-3">
                      {userRole === 'freelancer' && revision.status === 'open' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRevision(revision);
                            setShowSubmitDialog(true);
                          }}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Submit Work
                        </Button>
                      )}

                      {(userRole === 'admin' || userRole === 'manager') &&
                        revision.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRevision(revision);
                              setShowReviewDialog(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Revision Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Internal Revision</DialogTitle>
            <DialogDescription>
              Request changes from the freelancer before delivering to client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  This revision is internal QC only. The client will not see this
                  revision or know about it. Order status remains unchanged.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Revision *</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Fix citation formatting"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="details">Detailed Instructions</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide specific details about what needs to be changed..."
                className="mt-1 min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRevision}
              disabled={actionLoading || !reason.trim()}
            >
              {actionLoading ? 'Requesting...' : 'Request Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Revision Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Internal Revision</DialogTitle>
            <DialogDescription>
              Mark this revision as complete and ready for admin/manager review
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="submissionNotes">Submission Notes (Optional)</Label>
            <Textarea
              id="submissionNotes"
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Describe the changes you made..."
              className="mt-1 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRevision} disabled={actionLoading}>
              {actionLoading ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Revision Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Internal Revision</DialogTitle>
            <DialogDescription>
              Accept the work or request additional changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Action</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  variant={reviewAction === 'accept' ? 'default' : 'outline'}
                  onClick={() => setReviewAction('accept')}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  variant={reviewAction === 'request_more' ? 'default' : 'outline'}
                  onClick={() => setReviewAction('request_more')}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Request More Changes
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any feedback or notes..."
                className="mt-1"
              />
            </div>

            {reviewAction === 'request_more' && (
              <div>
                <Label htmlFor="additionalChanges">Additional Changes Required *</Label>
                <Textarea
                  id="additionalChanges"
                  value={additionalChanges}
                  onChange={(e) => setAdditionalChanges(e.target.value)}
                  placeholder="Describe what still needs to be changed..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewRevision}
              disabled={
                actionLoading ||
                (reviewAction === 'request_more' && !additionalChanges.trim())
              }
            >
              {actionLoading
                ? 'Processing...'
                : reviewAction === 'accept'
                ? 'Accept Revision'
                : 'Request More Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
