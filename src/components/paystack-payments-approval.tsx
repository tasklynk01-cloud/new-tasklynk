"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ShieldCheck, AlertTriangle, Loader2, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type PendingPayment = {
  id: number;
  jobId: number | null;
  clientId: number;
  amount: number;
  paystackReference: string;
  paystackAccessCode: string | null;
  status: string;
  confirmedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  jobDisplayId: string | null;
  jobTitle: string | null;
  jobAmount: number | null;
  jobStatus: string | null;
  jobOrderNumber: string | null;
};

type VerificationData = {
  verified: boolean;
  data: {
    localPayment: any;
    paystackData: any;
    validation: {
      amountMatches: boolean;
      statusSuccess: boolean;
      referenceMatches: boolean;
    };
  };
};

export default function PaystackPaymentsApproval() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actualAmount, setActualAmount] = useState<string>('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/payments/pending-verification', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending payments');
      }

      const result = await response.json();
      setPayments(result.data?.payments || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast.error('Failed to load pending payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWithPaystack = async (payment: PendingPayment) => {
    try {
      setVerifyingId(payment.id);
      setSelectedPayment(payment);
      const response = await fetch(`/api/v2/payments/${payment.id}/verify-paystack`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const result = await response.json();
      setVerificationData(result);
      setShowVerifyDialog(true);

      if (result.verified) {
        toast.success('Payment verified with Paystack ✓');
      } else {
        toast.warning('Payment verification has issues - review carefully');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;

    try {
      setProcessingId(selectedPayment.id);
      const response = await fetch(`/api/v2/payments/${selectedPayment.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verificationNotes: verificationNotes.trim() || undefined,
          actualAmount: actualAmount ? parseFloat(actualAmount) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve payment');
      }

      const result = await response.json();
      toast.success(result.message || 'Payment approved successfully');
      
      setShowApproveDialog(false);
      setVerificationNotes('');
      setActualAmount('');
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast.error(error.message || 'Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(selectedPayment.id);
      const response = await fetch(`/api/v2/payments/${selectedPayment.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject payment');
      }

      toast.success('Payment rejected successfully');
      
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast.error(error.message || 'Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const openApproveDialog = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setActualAmount(payment.amount.toString());
    setShowApproveDialog(true);
  };

  const openRejectDialog = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowRejectDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-amber-100 bg-amber-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Paystack Payments Pending Verification
              </CardTitle>
              <CardDescription className="mt-2">
                Review and approve Paystack payments before they are confirmed. Always verify payment authenticity.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingPayments}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending Paystack payments</p>
              <p className="text-sm mt-1">All payments have been verified</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>
                  <strong>{payments.length}</strong> payment{payments.length !== 1 ? 's' : ''} awaiting verification. 
                  Always verify with Paystack API before approving.
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Info</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Paystack Reference</TableHead>
                      <TableHead>Date Received</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="bg-white hover:bg-amber-50/30">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-mono text-sm font-semibold">#{payment.id}</p>
                            <Badge variant="outline" className="text-xs">
                              {payment.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{payment.clientName}</p>
                            <p className="text-xs text-muted-foreground">{payment.clientEmail}</p>
                            {payment.clientPhone && (
                              <p className="text-xs text-muted-foreground">{payment.clientPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.jobId ? (
                            <div className="space-y-1">
                              <p className="font-mono text-sm font-semibold">
                                {payment.jobDisplayId || payment.jobOrderNumber || `#${payment.jobId}`}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {payment.jobTitle}
                              </p>
                              {payment.jobStatus && (
                                <Badge variant="secondary" className="text-xs">
                                  {payment.jobStatus}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Wallet Top-up
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-bold text-lg">KSh {payment.amount.toFixed(2)}</p>
                          {payment.jobAmount && payment.jobAmount !== payment.amount && (
                            <p className="text-xs text-amber-600">
                              Order: KSh {payment.jobAmount.toFixed(2)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.paystackReference}
                          </code>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.createdAt), 'HH:mm:ss')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyWithPaystack(payment)}
                              disabled={verifyingId === payment.id}
                              className="w-full text-xs"
                            >
                              {verifyingId === payment.id ? (
                                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying...</>
                              ) : (
                                <><Eye className="w-3 h-3 mr-1" />Verify</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openApproveDialog(payment)}
                              disabled={processingId === payment.id}
                              className="w-full bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(payment)}
                              disabled={processingId === payment.id}
                              className="w-full text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Results Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paystack Verification Results</DialogTitle>
            <DialogDescription>
              Verification data from Paystack API
            </DialogDescription>
          </DialogHeader>
          
          {verificationData && (
            <div className="space-y-4">
              <div className={`rounded-lg border-2 p-4 ${verificationData.verified ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  {verificationData.verified ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {verificationData.verified ? 'Payment Verified ✓' : 'Verification Issues Detected'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {verificationData.verified 
                        ? 'All checks passed - safe to approve' 
                        : 'Review issues carefully before deciding'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-semibold text-muted-foreground">Local Record</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Amount:</strong> KSh {verificationData.data.localPayment.amount.toFixed(2)}</p>
                    <p><strong>Status:</strong> {verificationData.data.localPayment.status}</p>
                    <p className="text-xs text-muted-foreground break-all">
                      <strong>Ref:</strong> {verificationData.data.localPayment.reference}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-semibold text-muted-foreground">Paystack Record</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Amount:</strong> KSh {verificationData.data.paystackData.amount.toFixed(2)}</p>
                    <p><strong>Status:</strong> {verificationData.data.paystackData.status}</p>
                    <p><strong>Channel:</strong> {verificationData.data.paystackData.channel}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Paid:</strong> {format(new Date(verificationData.data.paystackData.paidAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-3 bg-gray-50">
                <p className="text-sm font-semibold">Validation Checks</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {verificationData.data.validation.amountMatches ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>Amount matches</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {verificationData.data.validation.statusSuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>Payment successful on Paystack</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {verificationData.data.validation.referenceMatches ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>Reference matches</span>
                  </div>
                </div>
              </div>

              {verificationData.data.paystackData.customer && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Customer Email:</strong> {verificationData.data.paystackData.customer.email}</p>
                  <p><strong>Customer Code:</strong> {verificationData.data.paystackData.customer.customerCode}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Close
            </Button>
            {verificationData?.verified && selectedPayment && (
              <Button
                onClick={() => {
                  setShowVerifyDialog(false);
                  openApproveDialog(selectedPayment);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Proceed to Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Payment Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Confirm payment approval for {selectedPayment?.clientName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-gray-50 space-y-2">
                <p className="text-sm"><strong>Amount:</strong> KSh {selectedPayment.amount.toFixed(2)}</p>
                <p className="text-sm"><strong>Reference:</strong> {selectedPayment.paystackReference}</p>
                {selectedPayment.jobDisplayId && (
                  <p className="text-sm"><strong>Order:</strong> {selectedPayment.jobDisplayId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualAmount">Actual Amount Received (if different)</Label>
                <Input
                  id="actualAmount"
                  type="number"
                  step="0.01"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder={selectedPayment.amount.toString()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationNotes">Verification Notes (optional)</Label>
                <Textarea
                  id="verificationNotes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about the verification..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={processingId !== null}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processingId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Approving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Approve Payment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <p className="text-sm"><strong>Amount:</strong> KSh {selectedPayment.amount.toFixed(2)}</p>
                <p className="text-sm"><strong>Reference:</strong> {selectedPayment.paystackReference}</p>
                <p className="text-sm"><strong>Client:</strong> {selectedPayment.clientName}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this payment is being rejected..."
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processingId !== null}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null || !rejectionReason.trim()}
            >
              {processingId ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rejecting...</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" />Reject Payment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
