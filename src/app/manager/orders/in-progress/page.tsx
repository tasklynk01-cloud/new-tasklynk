"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock, PauseCircle, CheckCircle, PlayCircle, Download, UserMinus, XCircle, RotateCcw } from 'lucide-react';
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
  orderNumber: string | null;
  title: string;
  workType: string;
  amount: number;
  deadline: string;
  actualDeadline: string;
  status: string;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
  createdAt: string;
};

export default function ManagerInProgressOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [holdingId, setHoldingId] = useState<number | null>(null);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [revisionId, setRevisionId] = useState<number | null>(null);
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedJobForCancel, setSelectedJobForCancel] = useState<Job | null>(null);
  
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedJobForRevision, setSelectedJobForRevision] = useState<Job | null>(null);
  
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [selectedJobForUnassign, setSelectedJobForUnassign] = useState<Job | null>(null);

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
      const response = await safeApiFetch(`/api/manager/orders?managerId=${user?.id}&status=in_progress`, {
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
        toast.error('Failed to fetch in-progress orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handlePutOnHold = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setHoldingId(jobId);
      const response = await safeApiFetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'on_hold' })
      });
      if (response.ok) {
        toast.success('Order put on hold');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to put order on hold'));
      }
    } catch (e) {
      console.error('Failed to put order on hold', e);
      toast.error('Failed to put order on hold');
    } finally {
      setHoldingId(null);
    }
  };

  const handleUnassignFreelancer = async () => {
    if (!selectedJobForUnassign) return;
    try {
      setUnassigningId(selectedJobForUnassign.id);
      const response = await safeApiFetch(`/api/v2/orders/${selectedJobForUnassign.id}/unassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Freelancer unassigned successfully');
        setUnassignDialogOpen(false);
        setSelectedJobForUnassign(null);
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to unassign freelancer'));
      }
    } catch (e) {
      console.error('Failed to unassign freelancer', e);
      toast.error('Failed to unassign freelancer');
    } finally {
      setUnassigningId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedJobForCancel || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    try {
      setCancellingId(selectedJobForCancel.id);
      const response = await safeApiFetch(`/api/v2/orders/${selectedJobForCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason })
      });
      if (response.ok) {
        toast.success('Order cancelled successfully');
        setCancelDialogOpen(false);
        setSelectedJobForCancel(null);
        setCancelReason('');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to cancel order'));
      }
    } catch (e) {
      console.error('Failed to cancel order', e);
      toast.error('Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleInternalRevision = async () => {
    if (!selectedJobForRevision) return;
    try {
      setRevisionId(selectedJobForRevision.id);
      const response = await safeApiFetch(`/api/v2/orders/${selectedJobForRevision.id}/internal-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notes: revisionNotes || 'Internal revision requested' })
      });
      if (response.ok) {
        toast.success('Order sent for internal revision');
        setRevisionDialogOpen(false);
        setSelectedJobForRevision(null);
        setRevisionNotes('');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to request internal revision'));
      }
    } catch (e) {
      console.error('Failed to request internal revision', e);
      toast.error('Failed to request internal revision');
    } finally {
      setRevisionId(null);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const res = await safeApiFetch(`/api/manager/orders?managerId=${user.id}&status=in_progress&format=csv`, {
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
      a.download = `manager-in-progress-orders-${user.id}.csv`;
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
          <PlayCircle className="w-8 h-8 text-purple-600" />
          In Progress Orders
        </h1>
        <p className="text-muted-foreground">
          Orders currently being worked on by assigned writers
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>In Progress ({jobs.length})</CardTitle>
              <CardDescription>Manage orders that are underway</CardDescription>
            </div>
            <Button size="sm" onClick={handleExport} variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No In Progress Orders</p>
              <p className="text-sm">You'll see orders here once writers start working on them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Writer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/manager/orders/${job.id}`)}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/manager/orders/${job.id}`} className="text-primary hover:underline font-semibold">
                          {job.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{job.orderNumber || 'N/A'}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{job.title}</TableCell>
                      <TableCell>{job.client?.name || 'Unknown'}</TableCell>
                      <TableCell>{job.writer?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize rounded-xl">{job.workType}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">KSh {job.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {format(new Date(job.actualDeadline || job.deadline), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link href={`/manager/orders/${job.id}`}>
                            <Button size="sm" variant="outline" className="rounded-xl">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 rounded-xl"
                            onClick={(e) => handlePutOnHold(job.id, e)}
                            disabled={holdingId === job.id}
                          >
                            <PauseCircle className="w-4 h-4 mr-1" />
                            {holdingId === job.id ? 'Holding...' : 'Hold'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForRevision(job);
                              setRevisionDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Internal Revision
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForUnassign(job);
                              setUnassignDialogOpen(true);
                            }}
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Unassign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForCancel(job);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
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

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {selectedJobForCancel?.displayId}? This action requires a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Cancellation Reason</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancellingId !== null || !cancelReason.trim()}
            >
              {cancellingId !== null ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Internal Revision</DialogTitle>
            <DialogDescription>
              Send order {selectedJobForRevision?.displayId} back to the freelancer for revision.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="revision-notes">Revision Notes (Optional)</Label>
            <Textarea
              id="revision-notes"
              placeholder="Enter notes for the freelancer..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInternalRevision}
              disabled={revisionId !== null}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {revisionId !== null ? 'Sending...' : 'Send for Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Freelancer Dialog */}
      <Dialog open={unassignDialogOpen} onOpenChange={setUnassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign Freelancer</DialogTitle>
            <DialogDescription>
              Are you sure you want to unassign {selectedJobForUnassign?.writer?.name || 'the freelancer'} from order {selectedJobForUnassign?.displayId}? The order will be returned to the available pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnassignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnassignFreelancer}
              disabled={unassigningId !== null}
            >
              {unassigningId !== null ? 'Unassigning...' : 'Confirm Unassign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
