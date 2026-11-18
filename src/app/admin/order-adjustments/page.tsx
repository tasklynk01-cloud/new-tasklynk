'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Check,
  X,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

interface OrderAdjustment {
  id: number;
  jobId: number;
  changedBy: number | null;
  changeType: string;
  amount: number;
  previousTotal: number;
  newTotal: number;
  reason: string;
  status: string;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  appliedAt: string | null;
  createdAt: string;
  jobTitle: string | null;
  jobDisplayId: string | null;
  changedByName: string | null;
}

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
  applied: number;
  total: number;
}

export default function OrderAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<OrderAdjustment[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0, applied: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAdjustment, setSelectedAdjustment] = useState<OrderAdjustment | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchAdjustments = async (status?: string) => {
    try {
      setLoading(true);
      const url = new URL('/api/v2/order-adjustments', window.location.origin);
      if (status && status !== 'all') {
        url.searchParams.set('status', status);
      }
      
      const response = await safeApiFetch(url.toString());
      const data = await response.json();

if (data.success) {
        setAdjustments(data.adjustments);
        setCounts(data.counts);
      } else {
        toast.error(extractErrorMessage(data, 'Failed to fetch adjustments'));
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      toast.error('Failed to fetch adjustments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments(activeTab);
  }, [activeTab]);

  const handleAction = async (adjustmentId: number, action: 'approve' | 'reject' | 'apply', reason?: string) => {
    try {
      setProcessing(true);
      const response = await safeApiFetch(`/api/v2/order-adjustments/${adjustmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      const data = await response.json();

if (data.success) {
        toast.success(data.message);
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedAdjustment(null);
        fetchAdjustments(activeTab);
      } else {
        toast.error(extractErrorMessage(data, `Failed to ${action} adjustment`));
      }
    } catch (error) {
      console.error(`Error ${action} adjustment:`, error);
      toast.error(`Failed to ${action} adjustment`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      applied: 'bg-green-100 text-green-800',
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getChangeTypeIcon = (type: string) => {
    if (type === 'increase' || type === 'bonus' || type === 'fee') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (type === 'decrease' || type === 'discount' || type === 'refund') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <DollarSign className="h-4 w-4 text-gray-500" />;
  };

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? '+' : '';
    return `${prefix}KSh ${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Amount Adjustments</h1>
          <p className="text-muted-foreground">Manage price modifications for orders</p>
        </div>
        <Button onClick={() => fetchAdjustments(activeTab)} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.approved}</div>
            <p className="text-xs text-muted-foreground">Ready to apply</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.applied}</div>
            <p className="text-xs text-muted-foreground">Changes applied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.rejected}</div>
            <p className="text-xs text-muted-foreground">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-3">
            <Clock className="h-4 w-4" />
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-3">
            <CheckCircle className="h-4 w-4" />
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="applied" className="gap-3">
            <Check className="h-4 w-4" />
            Applied ({counts.applied})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-3">
            <XCircle className="h-4 w-4" />
            Rejected ({counts.rejected})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Adjustments' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Adjustments`}
              </CardTitle>
              <CardDescription>
                {activeTab === 'pending' && 'Review and approve or reject adjustment requests'}
                {activeTab === 'approved' && 'Approved adjustments ready to be applied to orders'}
                {activeTab === 'applied' && 'Adjustments that have been applied to order amounts'}
                {activeTab === 'rejected' && 'Declined adjustment requests'}
                {activeTab === 'all' && 'Complete list of all adjustment requests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : adjustments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No adjustments found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Previous ? New</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>
                          <div className="font-medium">{adj.jobDisplayId || `#${adj.jobId}`}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {adj.jobTitle || 'Untitled'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getChangeTypeIcon(adj.changeType)}
                            <span className="capitalize">{adj.changeType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(adj.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-muted-foreground">KSh {adj.previousTotal?.toLocaleString()}</span>
                            <span className="mx-1">?</span>
                            <span className="font-medium">KSh {adj.newTotal?.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={adj.reason}>
                            {adj.reason}
                          </div>
                        </TableCell>
                        <TableCell>{adj.changedByName || 'System'}</TableCell>
                        <TableCell>{getStatusBadge(adj.status)}</TableCell>
                        <TableCell className="text-sm">{formatDate(adj.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAdjustment(adj)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {adj.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleAction(adj.id, 'approve')}
                                  disabled={processing}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedAdjustment(adj);
                                    setShowRejectDialog(true);
                                  }}
                                  disabled={processing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {adj.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleAction(adj.id, 'apply')}
                                disabled={processing}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={!!selectedAdjustment && !showRejectDialog} onOpenChange={() => setSelectedAdjustment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjustment Details</DialogTitle>
            <DialogDescription>
              Order: {selectedAdjustment?.jobDisplayId || `#${selectedAdjustment?.jobId}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Change Type</p>
                  <p className="capitalize">{selectedAdjustment.changeType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className={selectedAdjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatAmount(selectedAdjustment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Previous Total</p>
                  <p>KSh {selectedAdjustment.previousTotal?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Total</p>
                  <p className="font-bold">KSh {selectedAdjustment.newTotal?.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                <p className="text-sm mt-1">{selectedAdjustment.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested By</p>
                  <p>{selectedAdjustment.changedByName || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedAdjustment.status)}
                </div>
              </div>

              {selectedAdjustment.approvedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved By</p>
                    <p>{selectedAdjustment.approvedByName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved At</p>
                    <p className="text-sm">{formatDate(selectedAdjustment.approvedAt)}</p>
                  </div>
                </div>
              )}

              {selectedAdjustment.rejectionReason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejection Reason</p>
                  <p className="text-sm text-red-600 mt-1">{selectedAdjustment.rejectionReason}</p>
                </div>
              )}

              {selectedAdjustment.appliedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applied At</p>
                  <p className="text-sm">{formatDate(selectedAdjustment.appliedAt)}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedAdjustment?.status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(true);
                  }}
                  disabled={processing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleAction(selectedAdjustment.id, 'approve')}
                  disabled={processing}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
            {selectedAdjustment?.status === 'approved' && (
              <Button
                onClick={() => handleAction(selectedAdjustment.id, 'apply')}
                disabled={processing}
              >
                <Play className="h-4 w-4 mr-2" />
                Apply to Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Adjustment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this adjustment request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Order: {selectedAdjustment?.jobDisplayId}</p>
              <p className="text-sm text-muted-foreground">
                Adjustment: {formatAmount(selectedAdjustment?.amount || 0)}
              </p>
            </div>
            
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAdjustment && handleAction(selectedAdjustment.id, 'reject', rejectionReason)}
              disabled={!rejectionReason.trim() || processing}
            >
              Reject Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
