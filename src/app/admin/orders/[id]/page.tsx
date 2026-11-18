"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, FileText, Download, DollarSign, Calendar, User, MessageSquare,
  UploadCloud, CheckCircle, AlertCircle, XCircle, Clock, Loader2, Eye, 
  UserPlus, Settings, Edit, Save, Ban, PlayCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileListSection, AttributedFile } from '@/components/attributed-file-display';
import { FileUploadSection } from '@/components/file-upload-section';
import { OrderChat } from '@/components/order-chat';
import { getStatusLabel, getStatusColorClasses, type OrderStatus } from '@/lib/status-display';

function coerceOrderStatus(value: string): OrderStatus {
  const allowed: OrderStatus[] = [
    'pending',
    'accepted',
    'in_progress',
    'submitted',
    'editing',
    'delivered',
    'revision',
    'internal_revision',
    'client_revision',
    'approved',
    'paid',
    'completed',
    'on_hold',
    'cancelled',
  ];
  return (allowed as string[]).includes(value) ? (value as OrderStatus) : 'pending';
}

type Order = {
  id: number;
  displayId: string;
  orderNumber?: string;
  clientId: number;
  clientName?: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  status: string;
  assignedFreelancerId: number | null;
  freelancerName?: string;
  managerId?: number | null;
  managerName?: string;
  createdAt: string;
  updatedAt?: string;
  freelancerEarnings?: number;
  managerEarnings?: number;
};

type Freelancer = {
  id: number;
  name: string;
  email: string;
  completedJobs: number;
  rating: number;
  available: boolean;
};

type ApiEnvelope<T> = T | { success?: boolean; data?: T };

function unwrapApiData<T>(payload: ApiEnvelope<T> | null | undefined): T | null {
  if (!payload) return null;

  if (typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  return payload as T;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'PPp');
  } catch {
    return '—';
  }
}

function AdminOrderDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeReason, setResumeReason] = useState('');

  const [sendToEditingDialogOpen, setSendToEditingDialogOpen] = useState(false);
  const [sendToEditingNotes, setSendToEditingNotes] = useState('');

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paystack'>('mpesa');
  const [paymentReference, setPaymentReference] = useState('');
  const [actualPaymentAmount, setActualPaymentAmount] = useState<string>('');
  const [partialPaymentReason, setPartialPaymentReason] = useState('');
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [recoveryTarget, setRecoveryTarget] = useState<OrderStatus>('in_progress');
  const [recoveryReason, setRecoveryReason] = useState('');
  const [recoveryNotifyUsers, setRecoveryNotifyUsers] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
    fetchFiles();
    fetchFreelancers();
  }, [user, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const responseData = await response.json();
      const payload = unwrapApiData<{
        order: Record<string, any>;
        client?: { id?: number | string; name?: string | null } | null;
        writer?: { name?: string | null } | null;
        manager?: { name?: string | null } | null;
      }>(responseData);
      const orderObj = payload?.order;

      if (!orderObj) {
        throw new Error('Order payload missing from response');
      }

      const mappedOrder: Order = {
        id: Number(orderObj?.id) || 0,
        displayId: orderObj?.displayId || orderObj?.orderNumber || `TL-${orderObj?.id ?? orderId}`,
        orderNumber: orderObj?.orderNumber,
        clientId: Number(orderObj?.clientId) || Number(payload?.client?.id) || 0,
        clientName: payload?.client?.name || orderObj?.clientName || 'Client',
        title: orderObj?.title || 'Untitled Order',
        instructions: orderObj?.instructions || '',
        workType: orderObj?.workType || 'writing',
        pages: orderObj?.pages ?? null,
        slides: orderObj?.slides ?? null,
        amount: Number(orderObj?.amount) || 0,
        deadline: orderObj?.deadline || new Date().toISOString(),
        status: orderObj?.status || 'pending',
        assignedFreelancerId: orderObj?.assignedFreelancerId ?? null,
        freelancerName: payload?.writer?.name || orderObj?.freelancerName,
        managerId: orderObj?.managerId ?? null,
        managerName: payload?.manager?.name || orderObj?.managerName,
        createdAt: orderObj?.createdAt || new Date().toISOString(),
        updatedAt: orderObj?.updatedAt,
        freelancerEarnings: orderObj?.freelancerEarnings,
        managerEarnings: orderObj?.managerEarnings,
      };

      setOrder(mappedOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/files`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const files = (data.files || []).map((f: any) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.fileType || 'application/octet-stream',
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName || '',
          uploaderRole: f.uploaderRole || '',
          uploadType: f.uploadType || 'additional',
          createdAt: f.uploadedAt || f.createdAt,
          fileClassification: f.category || f.fileClassification || null,
        }));
        setAttachments(files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchFreelancers = async () => {
    try {
      const response = await safeApiFetch('/api/v2/freelancers/active', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map API response to expected Freelancer type
        const mappedFreelancers = (data.freelancers || []).map((f: any) => ({
          id: f.freelancerId || f.id,
          name: f.freelancerName || f.name || 'Unknown',
          email: f.freelancerEmail || f.email || '',
          completedJobs: f.completedJobs || 0,
          rating: f.freelancerRating || f.rating || 0,
          available: true,
        })).filter((f: any) => f.id != null); // Filter out any with undefined id
        setFreelancers(mappedFreelancers);
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
    }
  };

  const handleDownload = async (file: AttributedFile) => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/download/${file.id}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Download failed');

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json().catch(() => ({}));
        const fileUrl = data?.fileUrl || file.fileUrl;
        const fileName = data?.fileName || file.fileName;
        if (!fileUrl) throw new Error('Missing file URL');

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = fileUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleAssignFreelancer = async (freelancerId: number) => {
    if (!confirm('Are you sure you want to assign this freelancer to the order?')) return;
    
    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ freelancerId })
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('Assign API returned error:', responseData);
        throw new Error(responseData?.details || responseData?.error || 'Failed to assign freelancer');
      }

      toast.success('Freelancer assigned successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error assigning freelancer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign freelancer');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnassignFreelancer = async () => {
    if (!order?.assignedFreelancerId) return;
    if (!confirm('Unassign freelancer from this order? The order will return to Accepted.')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Unassigned by admin' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to unassign freelancer');
      }

      toast.success('Freelancer unassigned');
      fetchOrder();
    } catch (error) {
      console.error('Error unassigning freelancer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unassign freelancer');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptPending = async () => {
    if (!user?.id) return;
    if (!order || order.status !== 'pending') return;
    if (!confirm('Accept this pending order? It will move to Accepted.')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: 'Accepted by admin' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Failed to accept order');

      toast.success(data?.message || 'Order accepted');
      fetchOrder();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error('Cancellation reason is required');
      return;
    }

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to cancel order');
      }
      toast.success('Order cancelled');
      setCancelDialogOpen(false);
      setCancelReason('');
      fetchOrder();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  const handlePutOnHold = async () => {
    if (!order || !user?.id) return;
    const reason = holdReason.trim();

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/jobs/${order.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId: user.id, reason: reason || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to put order on hold');
      }

      toast.success('Order put on hold');
      setHoldDialogOpen(false);
      setHoldReason('');
      fetchOrder();
    } catch (error) {
      console.error('Error putting order on hold:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to put order on hold');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeFromHold = async () => {
    if (!order || !user?.id) return;
    const reason = resumeReason.trim();

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/jobs/${order.id}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId: user.id, reason: reason || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to resume order');
      }

      toast.success('Order resumed');
      setResumeDialogOpen(false);
      setResumeReason('');
      fetchOrder();
    } catch (error) {
      console.error('Error resuming order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resume order');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendToEditing = async () => {
    if (!order) return;
    const notes = sendToEditingNotes.trim();
    if (!confirm('Send this order to the editing stage?')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/send-to-editing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: notes || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send to editing');
      }
      toast.success(data?.message || 'Order sent to editing');
      setSendToEditingDialogOpen(false);
      setSendToEditingNotes('');
      fetchOrder();
    } catch (error) {
      console.error('Error sending to editing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send to editing');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    if (order.status !== 'approved') return;

    const reference = paymentReference.trim();
    if (!reference) {
      toast.error('Payment reference is required');
      return;
    }

    const parsedAmount = actualPaymentAmount.trim().length ? Number(actualPaymentAmount) : undefined;
    if (actualPaymentAmount.trim().length && Number.isNaN(parsedAmount)) {
      toast.error('Actual payment amount must be a number');
      return;
    }

    if (parsedAmount != null && parsedAmount !== order.amount) {
      if (partialPaymentReason.trim().length < 5) {
        toast.error('Partial payment reason is required');
        return;
      }
    }

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: reference,
          paymentMethod,
          actualPaymentAmount: parsedAmount,
          partialPaymentReason: parsedAmount != null && parsedAmount !== order.amount ? partialPaymentReason.trim() : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to confirm payment');
      }
      toast.success(data?.message || 'Payment confirmed');
      setPaymentDialogOpen(false);
      setPaymentReference('');
      setActualPaymentAmount('');
      setPartialPaymentReason('');
      fetchOrder();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to confirm payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!order) return;
    if (!user?.id) return;
    if (order.status !== 'paid') return;
    if (!confirm('Mark this order as completed? This credits freelancer earnings.')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId: user.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to complete order');
      }
      toast.success(data?.message || 'Order completed');
      fetchOrder();
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete order');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliverToClient = async () => {
    if (!order) return;
    if (!confirm('Deliver this order to the client for review?')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/admin/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Delivered to client by admin' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to deliver to client');
      }
      toast.success('Delivered to client');
      fetchOrder();
    } catch (error) {
      console.error('Error delivering order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deliver to client');
    } finally {
      setProcessing(false);
    }
  };

  const submitRecoveryTransition = async () => {
    if (!order) return;
    const reason = recoveryReason.trim();
    if (reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/admin/force-transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetStatus: recoveryTarget,
          reason,
          notifyUsers: recoveryNotifyUsers,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to force transition');
      }
      toast.success('Status updated');
      setRecoveryDialogOpen(false);
      setRecoveryReason('');
      fetchOrder();
    } catch (error) {
      console.error('Force transition error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/orders')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate files by uploader role
  const clientFiles = attachments.filter(f => ['client', 'account_owner'].includes(f.uploaderRole));
  const freelancerFiles = attachments.filter(f => f.uploaderRole === 'freelancer');
  const adminFiles = attachments.filter(f => ['admin', 'manager'].includes(f.uploaderRole));
  const uploadReadyFiles = attachments.map((f) => ({
    ...f,
    id: typeof f.id === 'string' ? Number.parseInt(f.id, 10) || 0 : f.id,
    uploaderEmail: '',
  }));
  const canUploadRevisionFiles = order.status === 'editing';

  const canAssign = ['accepted'].includes(order.status);
  const canUnassign = !!order.assignedFreelancerId && !['cancelled', 'completed'].includes(order.status);
  const canCancel = !['cancelled', 'completed'].includes(order.status);
  const canHold = !['on_hold', 'paid', 'completed', 'cancelled'].includes(order.status);
  const canResume = order.status === 'on_hold';
  const canSendToEditing = ['submitted', 'revision', 'client_revision', 'internal_revision', 'in_progress', 'editing'].includes(order.status);
  const isRecoverable = ['in_progress', 'editing', 'revision', 'client_revision', 'internal_revision', 'on_hold', 'delivered'].includes(order.status);
  const canDeliver = ['editing'].includes(order.status);
  const canConfirmPayment = order.status === 'approved';
  const canComplete = order.status === 'paid';

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/admin/orders')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.title}</h1>
            <p className="text-sm text-muted-foreground">Order #{order.displayId}</p>
          </div>
        </div>
        <Badge variant="secondary" className={getStatusColorClasses(coerceOrderStatus(order.status))}>
          {getStatusLabel(coerceOrderStatus(order.status), 'admin')}
        </Badge>
      </div>

      {/* Tabbed Layout */}
      <Tabs defaultValue="instructions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Instructions
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            All Files ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Instructions Tab */}
        <TabsContent value="instructions" className="space-y-4">
          {/* Admin Controls */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {order.status === 'pending' && (
                  <Button onClick={handleAcceptPending} disabled={processing}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processing ? 'Processing...' : 'Accept Order'}
                  </Button>
                )}

                {canAssign && !order.assignedFreelancerId && (
                  <Select onValueChange={(value) => handleAssignFreelancer(parseInt(value))}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Assign Freelancer" />
                    </SelectTrigger>
                    <SelectContent>
                      {freelancers
                        .filter(freelancer => freelancer.id != null)
                        .map((freelancer) => (
                        <SelectItem key={freelancer.id} value={freelancer.id!.toString()}>
                          {freelancer.name} ({freelancer.completedJobs} jobs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {canUnassign && (
                  <Button onClick={handleUnassignFreelancer} variant="outline" disabled={processing}>
                    <Ban className="w-4 h-4 mr-2" />
                    Unassign Freelancer
                  </Button>
                )}

                {canDeliver && (
                  <Button onClick={handleDeliverToClient} variant="secondary" disabled={processing}>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Deliver to Client
                  </Button>
                )}

                {canSendToEditing && (
                  <Button onClick={() => setSendToEditingDialogOpen(true)} variant="outline" disabled={processing}>
                    <Edit className="w-4 h-4 mr-2" />
                    Send to Editing
                  </Button>
                )}

                {canHold && (
                  <Button onClick={() => setHoldDialogOpen(true)} variant="outline" disabled={processing}>
                    <Clock className="w-4 h-4 mr-2" />
                    Put On Hold
                  </Button>
                )}

                {canResume && (
                  <Button onClick={() => setResumeDialogOpen(true)} variant="outline" disabled={processing}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}

                {canConfirmPayment && (
                  <Button onClick={() => setPaymentDialogOpen(true)} variant="secondary" disabled={processing}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </Button>
                )}

                {canComplete && (
                  <Button onClick={handleCompleteOrder} variant="secondary" disabled={processing}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Order
                  </Button>
                )}

                {isRecoverable && user?.role === 'admin' && (
                  <Button onClick={() => setRecoveryDialogOpen(true)} variant="outline" disabled={processing}>
                    <Settings className="w-4 h-4 mr-2" />
                    Force Transition
                  </Button>
                )}

                {canCancel && (
                  <Button onClick={() => setCancelDialogOpen(true)} variant="destructive" disabled={processing}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>

              {order.status === 'approved' && (
                <Alert>
                  <AlertDescription>
                    This order is approved by the client (financials are generated at approval). Use the Payments screen to confirm payment.
                  </AlertDescription>
                </Alert>
              )}

              {order.status === 'paid' && (
                <Alert>
                  <AlertDescription>
                    This order is paid. You can now complete it to credit freelancer earnings.
                  </AlertDescription>
                </Alert>
              )}

              {order.status === 'completed' && (
                <Alert>
                  <AlertDescription>
                    This order is completed (terminal). Admin actions are limited to viewing files and messages.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Hold Dialog */}
          <AlertDialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Put Order On Hold</AlertDialogTitle>
                <AlertDialogDescription>
                  Optionally provide a reason. This will move the order to On Hold.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Textarea
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handlePutOnHold} disabled={processing}>
                  Put On Hold
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Resume Dialog */}
          <AlertDialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resume Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Optionally provide a reason. The order will resume to its previous status.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Textarea
                  value={resumeReason}
                  onChange={(e) => setResumeReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleResumeFromHold} disabled={processing}>
                  Resume
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Send To Editing Dialog */}
          <AlertDialog open={sendToEditingDialogOpen} onOpenChange={setSendToEditingDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send To Editing</AlertDialogTitle>
                <AlertDialogDescription>
                  Add optional manager/admin notes for the editor.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Textarea
                  value={sendToEditingNotes}
                  onChange={(e) => setSendToEditingNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleSendToEditing} disabled={processing}>
                  Send
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Confirm Payment Dialog */}
          <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                <AlertDialogDescription>
                  Confirms payment received and moves order to Paid.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3">
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'mpesa' | 'paystack')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={paymentMethod === 'mpesa' ? 'M-Pesa code' : 'Paystack reference'}
                  rows={2}
                />
                <Textarea
                  value={actualPaymentAmount}
                  onChange={(e) => setActualPaymentAmount(e.target.value)}
                  placeholder="Actual amount received (optional, number)"
                  rows={1}
                />
                {actualPaymentAmount.trim().length > 0 && actualPaymentAmount.trim() !== String(order.amount) && (
                  <Textarea
                    value={partialPaymentReason}
                    onChange={(e) => setPartialPaymentReason(e.target.value)}
                    placeholder="Reason for partial payment (required if amount differs)"
                    rows={2}
                  />
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmPayment} disabled={processing || paymentReference.trim().length === 0}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Cancel Dialog */}
          <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Provide a reason (required). This will move the order to Cancelled.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation"
                  rows={4}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelOrder} disabled={processing || cancelReason.trim().length === 0}>
                  Cancel Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Force Transition Dialog */}
          <AlertDialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Force Status Transition (Admin)</AlertDialogTitle>
                <AlertDialogDescription>
                  Use only to recover stuck orders. Reason must be at least 10 characters.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3">
                <Select value={recoveryTarget} onValueChange={(v) => setRecoveryTarget(coerceOrderStatus(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="editing">Editing</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={recoveryReason}
                  onChange={(e) => setRecoveryReason(e.target.value)}
                  placeholder="Reason (min 10 chars)"
                  rows={4}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={recoveryNotifyUsers}
                    onChange={(e) => setRecoveryNotifyUsers(e.target.checked)}
                  />
                  Notify client/freelancer/manager
                </label>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                <AlertDialogAction onClick={submitRecoveryTransition} disabled={processing || recoveryReason.trim().length < 10}>
                  Apply Transition
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Work Type</p>
                  <p className="text-lg font-semibold capitalize">{order.workType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pages</p>
                  <p className="text-lg font-semibold">{order.pages || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slides</p>
                  <p className="text-lg font-semibold">{order.slides || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold text-green-600">KSh {order.amount}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-lg font-semibold">{order.clientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                  <p className="text-lg font-semibold">{formatDateTime(order.deadline)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg font-semibold">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              {order.freelancerName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned Freelancer</p>
                  <p className="text-lg font-semibold">{order.freelancerName}</p>
                </div>
              )}

              {order.managerName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manager</p>
                  <p className="text-lg font-semibold">{order.managerName}</p>
                </div>
              )}

              {(order.freelancerEarnings || order.managerEarnings) && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Financial Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Freelancer Earnings</p>
                      <p className="text-lg font-semibold text-green-600">KSh {order.freelancerEarnings || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Manager Earnings</p>
                      <p className="text-lg font-semibold text-blue-600">KSh {order.managerEarnings || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Platform Profit</p>
                      <p className="text-lg font-semibold text-purple-600">
                        KSh {order.amount - (order.freelancerEarnings || 0) - (order.managerEarnings || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{order.instructions}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Files</CardTitle>
              {attachments.length > 0 && (
                <Button 
                  onClick={() => {
                    attachments.forEach((file, index) => {
                      setTimeout(() => handleDownload(file), index * 500);
                    });
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {canUploadRevisionFiles && (
                <div className="p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <h3 className="text-sm font-semibold mb-1 text-purple-700 dark:text-purple-200">Upload Edited Files</h3>
                  <p className="text-xs text-muted-foreground mb-3">Attach revised documents while the order is in editing.</p>
                  <FileUploadSection
                    jobId={Number(order.id)}
                    currentUserId={user?.id || 0}
                    currentUserRole="admin"
                    files={uploadReadyFiles}
                    canUpload={canUploadRevisionFiles}
                    canDownload={false}
                    uploadType="revision"
                    onFileUploaded={fetchFiles}
                    clientId={order.clientId}
                  />
                </div>
              )}

              {/* Client Files */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-blue-600">Client Uploads ({clientFiles.length})</h3>
                <FileListSection
                  title=""
                  files={clientFiles}
                  onDownload={handleDownload}
                  showAttribution={true}
                  colorScheme="blue"
                  emptyMessage="No client files uploaded"
                />
              </div>

              {/* Freelancer Files */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-green-600">Freelancer Submissions ({freelancerFiles.length})</h3>
                <FileListSection
                  title=""
                  files={freelancerFiles}
                  onDownload={handleDownload}
                  showAttribution={true}
                  showUploadType={true}
                  colorScheme="green"
                  emptyMessage="No submissions yet"
                />
              </div>

              {/* Admin/Manager Files */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-purple-600">Administrative Files ({adminFiles.length})</h3>
                <FileListSection
                  title=""
                  files={adminFiles}
                  onDownload={handleDownload}
                  showAttribution={true}
                  colorScheme="purple"
                  emptyMessage="No administrative files"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Order Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderChat 
                orderId={Number(orderId)} 
                currentUserId={user?.id || 0}
                currentUserRole={user?.role || 'admin'}
                orderClientId={order?.clientId}
                orderFreelancerId={order?.assignedFreelancerId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <AdminOrderDetailContent />
    </Suspense>
  );
}
