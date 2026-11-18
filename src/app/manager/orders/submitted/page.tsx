"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock, CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  pages: number;
  slides: number;
  amount: number;
  deadline: string;
  status: string;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
  submittedAt: string;
  createdAt: string;
};

export default function ManagerSubmittedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');
  const [selectedJobForReject, setSelectedJobForReject] = useState<Job | null>(null);
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [selectedJobForApprove, setSelectedJobForApprove] = useState<Job | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/manager/orders?managerId=${user?.id}&status=submitted`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : []);
      } else {
        toast.error('Failed to load submitted orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleApproveSubmission = async () => {
    if (!selectedJobForApprove) return;
    try {
      setProcessingId(selectedJobForApprove.id);
      const response = await safeApiFetch(`/api/manager/${selectedJobForApprove.id}/approve-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          managerId: user?.id,
          approvalNotes: approvalNotes || 'Approved by manager for editor review',
          sendToEditor: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Work approved! Assigned to editor for QA review. You earned KSh ${result.managerDeliveryFee?.toFixed(2) || '0.00'}`);
        setApproveDialogOpen(false);
        setSelectedJobForApprove(null);
        setApprovalNotes('');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to approve submission'));
      }
    } catch (e) {
      console.error('Failed to approve submission', e);
      toast.error('Failed to approve submission');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmission = async () => {
    if (!selectedJobForReject || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    try {
      setProcessingId(selectedJobForReject.id);
      const response = await safeApiFetch(`/api/manager/${selectedJobForReject.id}/approve-submission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          managerId: user?.id,
          rejectionReason,
          requiredChanges: requiredChanges || undefined
        })
      });
      
      if (response.ok) {
        toast.success('Work rejected and returned to freelancer for revision');
        setRejectDialogOpen(false);
        setSelectedJobForReject(null);
        setRejectionReason('');
        setRequiredChanges('');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to reject submission'));
      }
    } catch (e) {
      console.error('Failed to reject submission', e);
      toast.error('Failed to reject submission');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const res = await safeApiFetch(`/api/manager/orders?managerId=${user.id}&status=submitted&format=csv`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) {
        toast.error('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manager-submitted-orders-${user.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Orders exported successfully');
    } catch (e) {
      console.error('Export failed', e);
      toast.error('Export failed');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
          Submitted Orders - Gate 1 Review
        </h1>
        <p className="text-muted-foreground">
          Review freelancer submissions before sending to editor (Quality Gate 1)
        </p>
      </div>

      <Card className="rounded-xl border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-orange-50 dark:bg-orange-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Badge className="bg-orange-500 rounded-xl">{jobs.length}</Badge>
                Orders Awaiting Your Review
              </CardTitle>
              <CardDescription>
                ?? These orders need YOUR approval before going to editor
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleExport} variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-500" />
              <p className="text-lg font-medium mb-2">All Clear!</p>
              <p className="text-sm">No submitted work awaiting your review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Writer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pages/Slides</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow 
                      key={job.id} 
                      className="bg-orange-50 dark:bg-orange-950/10 hover:bg-orange-100 dark:hover:bg-orange-950/20 transition-colors"
                    >
                      <TableCell className="font-mono text-xs">
                        <Link href={`/manager/orders/${job.id}`} className="text-primary hover:underline font-semibold">
                          {job.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{job.title}</TableCell>
                      <TableCell className="text-sm">
                        {job.writer ? (
                          <Link href={`/manager/writers/${job.writer.id}`} className="text-blue-600 hover:underline">
                            {job.writer.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{job.workType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.pages > 0 && `${job.pages} pages`}
                        {job.pages > 0 && job.slides > 0 && ' + '}
                        {job.slides > 0 && `${job.slides} slides`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.submittedAt ? format(new Date(job.submittedAt), 'MMM dd, HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/manager/orders/${job.id}`)}
                            className="rounded-lg"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedJobForReject(job);
                              setRejectDialogOpen(true);
                            }}
                            disabled={processingId === job.id}
                            className="rounded-lg"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedJobForApprove(job);
                              setApproveDialogOpen(true);
                            }}
                            disabled={processingId === job.id}
                            className="rounded-lg bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission - Send to Editor</DialogTitle>
            <DialogDescription>
              This will send the order to an editor for quality review (Gate 2). You will earn the delivery fee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about the quality check..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside mt-1">
                <li>Order status ? editing</li>
                <li>Editor assigned automatically</li>
                <li>You earn delivery fee</li>
                <li>Editor reviews before client delivery</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproveSubmission} 
              disabled={processingId === selectedJobForApprove?.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId === selectedJobForApprove?.id ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Send to Editor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission - Request Revisions</DialogTitle>
            <DialogDescription>
              Send this work back to the freelancer for revisions. Please provide clear feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this work needs revision..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="required-changes">Required Changes (Optional)</Label>
              <Textarea
                id="required-changes"
                placeholder="List specific changes that need to be made..."
                value={requiredChanges}
                onChange={(e) => setRequiredChanges(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside mt-1">
                <li>Order status ? in_progress</li>
                <li>Freelancer notified with your feedback</li>
                <li>They must revise and resubmit</li>
                <li>Order returns to your review queue</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectSubmission} 
              disabled={processingId === selectedJobForReject?.id || !rejectionReason}
              variant="destructive"
            >
              {processingId === selectedJobForReject?.id ? (
                <>Processing...</>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject & Request Revision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
