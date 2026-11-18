"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Clock, CheckCircle, UserPlus, Download, XCircle, PauseCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

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

type Writer = {
  id: number;
  displayId: string;
  name: string;
  rating: number | null;
  completedJobs: number;
};

export default function ManagerPendingOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingWriters, setLoadingWriters] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedWriterId, setSelectedWriterId] = useState<string>("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [holdingId, setHoldingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        fetchJobs();
        fetchWriters();
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/manager/orders?managerId=${user?.id}&status=pending`, {
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
        toast.error('Failed to fetch pending orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchWriters = async () => {
    try {
      setLoadingWriters(true);
      const response = await safeApiFetch(`/api/manager/writers?managerId=${user?.id}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWriters(data);
      }
    } catch (error) {
      console.error('Failed to fetch writers:', error);
    } finally {
      setLoadingWriters(false);
    }
  };

  const handleAccept = async (jobId: number) => {
    try {
      setAcceptingId(jobId);
      const response = await safeApiFetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted', changedBy: user?.id })
      });

      if (response.ok) {
        toast.success('Order accepted successfully');
        fetchJobs(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to accept order'));
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Error accepting order');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (jobId: number) => {
    try {
      setRejectingId(jobId);
      const response = await safeApiFetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled', changedBy: user?.id })
      });
      if (response.ok) {
        toast.success('Order rejected');
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to reject order'));
      }
    } catch (e) {
      console.error('Failed to reject order', e);
      toast.error('Failed to reject order');
    } finally {
      setRejectingId(null);
    }
  };

  const handlePutOnHold = async (jobId: number) => {
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

  const handleOpenAssignDialog = (job: Job) => {
    setSelectedJob(job);
    setSelectedWriterId("");
    setAssignDialogOpen(true);
  };

  const handleAssignWriter = async () => {
    if (!selectedJob || !selectedWriterId) {
      toast.error('Please select a writer');
      return;
    }

    try {
      setAssigningId(selectedJob.id);
      
      // First, accept the order if it's still pending
      if (selectedJob.status === 'pending') {
        const acceptResponse = await safeApiFetch(`/api/jobs/${selectedJob.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'accepted', changedBy: user?.id })
        });

        if (!acceptResponse.ok) {
          const error = await acceptResponse.json();
          toast.error(extractErrorMessage(error, 'Failed to accept order'));
          return;
        }
      }

      // Then assign the writer (which moves to 'in_progress')
      const assignResponse = await safeApiFetch(`/api/jobs/${selectedJob.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ freelancerId: parseInt(selectedWriterId) })
      });

      if (assignResponse.ok) {
        toast.success('Writer assigned successfully');
        setAssignDialogOpen(false);
        setSelectedJob(null);
        setSelectedWriterId("");
        fetchJobs(); // Refresh the list
      } else {
        const error = await assignResponse.json();
        toast.error(extractErrorMessage(error, 'Failed to assign writer'));
      }
    } catch (error) {
      console.error('Failed to assign writer:', error);
      toast.error('Error assigning writer');
    } finally {
      setAssigningId(null);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const res = await safeApiFetch(`/api/manager/orders?managerId=${user.id}&status=pending&format=csv`, {
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
      a.download = `manager-pending-orders-${user.id}.csv`;
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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Pending Orders</h1>
        <p className="text-muted-foreground text-sm">
          Review and accept orders from your assigned clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Orders ({jobs.length})</CardTitle>
              <CardDescription>
                Orders awaiting your acceptance
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleExport} variant="outline">
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
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Pending Orders</p>
              <p className="text-sm">
                All orders from your assigned clients have been processed
              </p>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow 
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/manager/orders/${job.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()} className="font-mono text-xs">
                        <Link href={`/manager/orders/${job.id}`} className="text-primary hover:underline font-semibold">
                          {job.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {job.orderNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{job.title}</TableCell>
                      <TableCell>{job.client?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{job.workType}</Badge>
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
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={() => handleAccept(job.id)}
                            disabled={acceptingId === job.id}
                          >
                            {acceptingId === job.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenAssignDialog(job)}
                            disabled={loadingWriters}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Accept & Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                            onClick={() => handlePutOnHold(job.id)}
                            disabled={holdingId === job.id}
                          >
                            <PauseCircle className="w-4 h-4 mr-1" />
                            {holdingId === job.id ? 'Holding...' : 'Put On Hold'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(job.id)}
                            disabled={rejectingId === job.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {rejectingId === job.id ? 'Rejecting...' : 'Reject'}
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

      {/* Assign Writer Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept & Assign Writer to Order</DialogTitle>
            <DialogDescription>
              This will accept the order and assign a writer from your team
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">Order ID:</p>
                    <p className="text-xs text-muted-foreground font-mono">{selectedJob.displayId}</p>
                  </div>
                  <Badge variant="outline">{selectedJob.workType}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Title:</p>
                  <p className="text-xs text-muted-foreground">{selectedJob.title}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Client:</p>
                    <p className="text-xs text-muted-foreground">{selectedJob.client?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Amount:</p>
                    <p className="text-sm font-semibold text-green-600">KSh {selectedJob.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Writer</label>
                <Select value={selectedWriterId} onValueChange={setSelectedWriterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a writer..." />
                  </SelectTrigger>
                  <SelectContent className="z-[70]">
                    {writers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No writers assigned to you
                      </div>
                    ) : (
                      writers.map((writer) => (
                        <SelectItem key={writer.id} value={writer.id.toString()}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{writer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {writer.rating !== null ? `? ${writer.rating.toFixed(1)}` : 'No rating'}  {writer.completedJobs} jobs
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedJob(null);
                setSelectedWriterId("");
              }}
              disabled={assigningId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignWriter}
              disabled={!selectedWriterId || assigningId !== null}
            >
              {assigningId !== null ? 'Assigning...' : 'Accept & Assign Writer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
