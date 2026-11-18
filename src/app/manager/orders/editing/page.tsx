"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Clock, Edit3, Download, Send, RotateCcw } from 'lucide-react';
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
  amount: number;
  deadline: string;
  status: string;
  assignedFreelancerId?: number | null;
  client?: { id: number; displayId: string; name: string } | null;
  writer?: { id: number; displayId: string; name: string } | null;
  createdAt: string;
};

export default function ManagerEditingOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [deliveringId, setDeliveringId] = useState<number | null>(null);
  const [revisionId, setRevisionId] = useState<number | null>(null);
  
  // Dialog states
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedJobForRevision, setSelectedJobForRevision] = useState<Job | null>(null);
  
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [selectedJobForDeliver, setSelectedJobForDeliver] = useState<Job | null>(null);

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
      const response = await safeApiFetch(`/api/manager/orders?managerId=${user?.id}&status=editing`, {
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
        toast.error('Failed to load editing orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('bearer_token');
      const res = await safeApiFetch(`/api/manager/orders?managerId=${user.id}&status=editing&format=csv`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
      a.download = `manager-editing-orders-${user.id}.csv`;
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

  const handleDeliverOrder = async () => {
    if (!selectedJobForDeliver) return;
    try {
      setDeliveringId(selectedJobForDeliver.id);
      const response = await safeApiFetch(`/api/v2/orders/${selectedJobForDeliver.id}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notes: 'Work delivered to client from editing queue',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Order delivered to client successfully');
        setDeliverDialogOpen(false);
        setSelectedJobForDeliver(null);
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(extractErrorMessage(err, 'Failed to deliver order'));
      }
    } catch (e) {
      console.error('Failed to deliver order', e);
      toast.error('Failed to deliver order');
    } finally {
      setDeliveringId(null);
    }
  };

  const handleInternalRevision = async () => {
    if (!selectedJobForRevision) return;
    try {
      setRevisionId(selectedJobForRevision.id);
      const assignedTo = selectedJobForRevision.assignedFreelancerId ?? selectedJobForRevision.writer?.id ?? null;
      if (!assignedTo) {
        toast.error('Cannot request internal revision: no freelancer assigned');
        return;
      }

      const reason = revisionNotes.trim();
      if (!reason) {
        toast.error('Please provide revision notes');
        return;
      }

      const response = await safeApiFetch(`/api/v2/orders/${selectedJobForRevision.id}/internal-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          assignedTo,
          reason: reason.length > 120 ? `${reason.slice(0, 117)}...` : reason,
          details: reason,
        })
      });
      if (response.ok) {
        toast.success('Order sent back for internal revision');
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
          <Edit3 className="w-8 h-8 text-purple-600" />
          Editing Orders
        </h1>
        <p className="text-muted-foreground">
          Orders submitted by writers and under review
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Badge className="bg-purple-500 rounded-xl">{jobs.length}</Badge>
                Orders Under Review
              </CardTitle>
              <CardDescription>
                Review submitted work before delivering to clients
              </CardDescription>
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
              <Edit3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Orders Under Review</p>
              <p className="text-sm">Submitted work will appear here for review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Writer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors cursor-pointer" onClick={() => router.push(`/manager/orders/${job.id}`)}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/manager/orders/${job.id}`} className="text-primary hover:underline font-semibold">
                          {job.displayId}
                        </Link>
                      </TableCell>
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
                          {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link href={`/manager/orders/${job.id}`}>
                            <Button size="sm" variant="outline" className="rounded-xl">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForDeliver(job);
                              setDeliverDialogOpen(true);
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Deliver
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

      {/* Deliver Order Dialog */}
      <Dialog open={deliverDialogOpen} onOpenChange={setDeliverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deliver Order to Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to deliver order {selectedJobForDeliver?.displayId} to the client? Make sure you have reviewed all files.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeliverOrder}
              disabled={deliveringId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {deliveringId !== null ? 'Delivering...' : 'Confirm Deliver'}
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
    </div>
  );
}
