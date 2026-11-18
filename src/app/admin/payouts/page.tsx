'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { formatDistanceToNow } from 'date-fns';

interface PayoutRequest {
  id: number;
  writerId: number;
  writerName: string | null;
  writerEmail: string | null;
  writerPhone: string | null;
  amount: number;
  method: string;
  accountDetails: string; // JSON string
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  processedAt: string | null;
  processedBy: number | null;
  rejectionReason: string | null;
  transactionReference: string | null;
  createdAt: string;
  updatedAt: string;
}

type PayoutStatusUi = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

interface PayoutRow {
  id: number;
  freelancerId: number;
  freelancerName: string;
  freelancerEmail: string;
  freelancerPhone?: string;
  freelancerRole?: string;
  amount: number;
  status: PayoutStatusUi;
  requestDate: string;
  approvedDate?: string;
  processedDate?: string;
  rejectionReason?: string;
  method: string;
  transactionReference?: string;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  mpesaPhone?: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function PayoutsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRow | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');

  const fetchPayouts = useCallback(async () => {
    try {
      setLoadingPayouts(true);
      const statusParam = filter === 'all' ? '' : filter === 'completed' ? 'processed' : filter;
      const response = await safeApiFetch(
        `/api/v2/payout-requests${statusParam ? `?status=${statusParam}` : ''}`,
        {
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch payout requests');
      }
      
      const data = await response.json();
      const payoutArray: PayoutRequest[] = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : []);

      // Transform v2 API response to match component expectations
      const transformedData: PayoutRow[] = payoutArray.map((payout) => {
        const statusUi: PayoutStatusUi =
          payout.status === 'processed' ? 'completed' : payout.status;

        let bankAccount: PayoutRow['bankAccount'] = undefined;
        let mpesaPhone: string | undefined = undefined;

        try {
          const details = JSON.parse(payout.accountDetails || '{}');
          if (payout.method === 'bank' && details.bankName) {
            bankAccount = {
              accountNumber: details.accountNumber || '',
              bankName: details.bankName || '',
              accountName: details.accountName || '',
            };
          } else if (payout.method === 'mpesa' && details.phoneNumber) {
            mpesaPhone = details.phoneNumber;
          }
        } catch {
          // Ignore parsing errors
        }

        return {
          id: payout.id,
          freelancerId: payout.writerId,
          freelancerName: payout.writerName || 'Unknown',
          freelancerEmail: payout.writerEmail || '',
          freelancerPhone: payout.writerPhone || undefined,
          freelancerRole: undefined, // Will be fetched if needed
          amount: payout.amount,
          status: statusUi,
          requestDate: payout.requestedAt,
          approvedDate:
            payout.status === 'approved' || payout.status === 'processed'
              ? (payout.processedAt || undefined)
              : undefined,
          processedDate:
            payout.status === 'processed' ? (payout.processedAt || undefined) : undefined,
          rejectionReason: payout.rejectionReason || undefined,
          method: payout.method,
          transactionReference: payout.transactionReference || undefined,
          bankAccount,
          mpesaPhone,
        };
      });
      
      setPayouts(transformedData);
    } catch (error) {
      toast.error('Failed to load payout requests');
      console.error(error);
    } finally {
      setLoadingPayouts(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchPayouts();
      }
    }
  }, [user, loading, router, fetchPayouts]);

  const handleApprove = useCallback(async () => {
    if (!selectedPayout || !user) return;
    try {
      setApproving(true);
      const response = await safeApiFetch(
        `/api/v2/payout-requests/${selectedPayout.id}/approve`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            adminId: user.id,
            notes, // Optional notes field
          }),
        }
      );

      if (response.ok) {
        toast.success('Payout request approved');
        setApproveOpen(false);
        setNotes('');
        fetchPayouts();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to approve payout request' }));
        toast.error(extractErrorMessage(error, 'Failed to approve payout request'));
      }
    } catch (error) {
      toast.error('Error approving payout request');
      console.error(error);
    } finally {
      setApproving(false);
    }
  }, [selectedPayout, notes, fetchPayouts, user]);

  const handleProcess = useCallback(async () => {
    if (!selectedPayout) return;
    try {
      setApproving(true);
      // Transaction reference is required for processing
      const transactionRef = notes.trim() || `TXN-${Date.now()}`;
      
      const response = await safeApiFetch(
        `/api/v2/payout-requests/${selectedPayout.id}/process`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            transactionReference: transactionRef,
          }),
        }
      );

      if (response.ok) {
        toast.success('Payout processed successfully');
        setProcessOpen(false);
        setNotes('');
        fetchPayouts();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to process payout' }));
        toast.error(extractErrorMessage(error, 'Failed to process payout'));
      }
    } catch (error) {
      toast.error('Error processing payout');
      console.error(error);
    } finally {
      setApproving(false);
    }
  }, [selectedPayout, notes, fetchPayouts]);

  const handleReject = useCallback(async () => {
    if (!selectedPayout || !user) return;
    try {
      setApproving(true);
      const response = await safeApiFetch(
        `/api/v2/payout-requests/${selectedPayout.id}/reject`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            adminId: user.id,
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (response.ok) {
        toast.success('Payout request rejected');
        setRejectOpen(false);
        setRejectionReason('');
        fetchPayouts();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to reject payout request' }));
        toast.error(extractErrorMessage(error, 'Failed to reject payout request'));
      }
    } catch (error) {
      toast.error('Error rejecting payout request');
      console.error(error);
    } finally {
      setApproving(false);
    }
  }, [selectedPayout, rejectionReason, fetchPayouts, user]);

  const stats = useMemo(() => ({
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved').length,
    processing: payouts.filter(p => p.status === 'approved').length, // Approved = ready to process
    completed: payouts.filter(p => p.status === 'completed').length,
    rejected: payouts.filter(p => p.status === 'rejected').length,
    totalPending: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    totalApproved: payouts
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0),
    totalCompleted: payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    totalAll: payouts.reduce((sum, p) => sum + p.amount, 0),
  }), [payouts]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all payout requests from freelancers and managers
        </p>
      </div>

      {/* Payment Workflow Info Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2">?? Payment Workflow</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>1. Pending:</strong> User submits request ? Review details
            </div>
            <div>
              <strong>2. Approved:</strong> Verify account ? Send payment externally
            </div>
            <div>
              <strong>3. Processed:</strong> Enter transaction reference ? Mark complete
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <strong>Note:</strong> Payments must be sent through your banking system (bank transfer/M-Pesa). 
            Use this interface to track and verify all payout requests.
          </p>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 rounded-xl border-yellow-200 bg-yellow-50">
          <div className="text-sm font-medium text-yellow-700">Pending Review</div>
          <div className="text-3xl font-bold mt-2 text-yellow-900">{stats.pending}</div>
          <div className="text-xs text-yellow-600 mt-1">
            KES {stats.totalPending.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6 rounded-xl border-blue-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-700">Ready to Process</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">{stats.approved}</div>
          <div className="text-xs text-blue-600 mt-1">
            KES {stats.totalApproved.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6 rounded-xl border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700">Completed</div>
          <div className="text-3xl font-bold text-green-900 mt-2">{stats.completed}</div>
          <div className="text-xs text-green-600 mt-1">
            KES {stats.totalCompleted.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6 rounded-xl border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-700">Total Payouts</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{payouts.length}</div>
          <div className="text-xs text-gray-600 mt-1">
            KES {stats.totalAll.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {(['all', 'pending', 'approved', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize rounded-xl"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Payouts Table */}
      <Card className="rounded-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPayouts ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading payouts...
                  </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payout requests found
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.freelancerName}</TableCell>
                    <TableCell className="text-sm">{payout.freelancerEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {payout.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      KES {payout.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payout.status]}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(payout.requestDate), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        {payout.status === 'pending' && (
                          <>
                            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600"
                                  onClick={() => setSelectedPayout(payout)}
                                >
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Payout Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Freelancer</Label>
                                    <Input
                                      disabled
                                      value={selectedPayout?.freelancerName || ''}
                                    />
                                  </div>
                                  <div>
                                    <Label>Amount</Label>
                                    <Input
                                      disabled
                                      value={`KES ${selectedPayout?.amount.toLocaleString()}`}
                                    />
                                  </div>
                                  <div>
                                    <Label>Notes (optional)</Label>
                                    <Textarea
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Add any notes about this approval..."
                                    />
                                  </div>
                                  <Button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                  >
                                    {approving ? 'Approving...' : 'Approve'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => setSelectedPayout(payout)}
                                >
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Payout Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Freelancer</Label>
                                    <Input
                                      disabled
                                      value={selectedPayout?.freelancerName || ''}
                                    />
                                  </div>
                                  <div>
                                    <Label>Rejection Reason *</Label>
                                    <Textarea
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Please explain why this payout is being rejected..."
                                    />
                                  </div>
                                  <Button
                                    onClick={handleReject}
                                    disabled={approving || !rejectionReason}
                                    className="w-full bg-destructive hover:bg-red-700"
                                  >
                                    {approving ? 'Rejecting...' : 'Reject'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {payout.status === 'approved' && (
                          <Dialog open={processOpen} onOpenChange={setProcessOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedPayout(payout)}
                              >
                                Process
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Payout</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Freelancer</Label>
                                  <Input
                                    disabled
                                    value={selectedPayout?.freelancerName || ''}
                                  />
                                </div>
                                <div>
                                  <Label>Amount</Label>
                                  <Input
                                    disabled
                                    value={`KES ${selectedPayout?.amount.toLocaleString()}`}
                                  />
                                </div>
                                {selectedPayout?.bankAccount && (
                                  <>
                                    <div className="bg-muted p-4 rounded">
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Account:</strong>{' '}
                                        {selectedPayout.bankAccount.accountName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Bank:</strong>{' '}
                                        {selectedPayout.bankAccount.bankName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        <strong>Number:</strong>{' '}
                                        {selectedPayout.bankAccount.accountNumber}
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <Label>Transaction Reference *</Label>
                                  <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g., MPESA-ABC123 or Bank-TXN-456"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Enter the transaction reference from your payment system
                                  </p>
                                </div>
                                <Button
                                  onClick={handleProcess}
                                  disabled={approving || !notes.trim()}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  {approving ? 'Processing...' : 'Process Payment'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setViewDetailsOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              {/* User Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedPayout.freelancerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedPayout.freelancerEmail}</p>
                  </div>
                  {selectedPayout.freelancerPhone && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedPayout.freelancerPhone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="font-medium">#{selectedPayout.freelancerId}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-bold text-lg">KES {selectedPayout.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Method</Label>
                    <p className="font-medium uppercase">{selectedPayout.method}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedPayout.status]}>
                      {selectedPayout.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Requested</Label>
                    <p className="font-medium">
                      {new Date(selectedPayout.requestDate).toLocaleDateString()} {new Date(selectedPayout.requestDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank/M-Pesa Details */}
              {selectedPayout.method === 'bank' && selectedPayout.bankAccount && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-blue-900">Bank Account Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-medium">{selectedPayout.bankAccount.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">{selectedPayout.bankAccount.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-medium font-mono">{selectedPayout.bankAccount.accountNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPayout.method === 'mpesa' && selectedPayout.mpesaPhone && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-green-900">M-Pesa Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone Number:</span>
                      <span className="font-medium font-mono">{selectedPayout.mpesaPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-medium">{selectedPayout.freelancerName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Information */}
              {(selectedPayout.status === 'completed' || selectedPayout.transactionReference) && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-green-900">Processing Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedPayout.transactionReference && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction Reference:</span>
                        <span className="font-medium font-mono">{selectedPayout.transactionReference}</span>
                      </div>
                    )}
                    {selectedPayout.processedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processed Date:</span>
                        <span className="font-medium">
                          {new Date(selectedPayout.processedDate).toLocaleDateString()} {new Date(selectedPayout.processedDate).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Information */}
              {selectedPayout.status === 'rejected' && selectedPayout.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-red-900">Rejection Information</h3>
                  <p className="text-sm">{selectedPayout.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedPayout.status === 'pending' && (
                  <>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setViewDetailsOpen(false);
                        setApproveOpen(true);
                      }}
                    >
                      Approve Payout
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setViewDetailsOpen(false);
                        setRejectOpen(true);
                      }}
                    >
                      Reject Payout
                    </Button>
                  </>
                )}
                {selectedPayout.status === 'approved' && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setViewDetailsOpen(false);
                      setProcessOpen(true);
                    }}
                  >
                    Process Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
