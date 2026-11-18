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
import { extractErrorMessage } from '@/lib/client-api-helpers';

function coerceOrderStatus(value: string): OrderStatus {
  const allowed: OrderStatus[] = [
    'pending',
    'accepted',
    'in_progress',
    'submitted',
    'editing',
    'delivered',
    'revision',
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

function ManagerOrderDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
      const response = await safeApiFetch('/api/v2/managers/team', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map API response to expected Freelancer type with safety checks
        const mappedFreelancers = (data.freelancers || []).map((f: any) => ({
          id: f.id,
          name: f.name || 'Unknown',
          email: f.email || '',
          completedJobs: f.completedJobs || 0,
          rating: f.rating || f.ratingAverage || 0,
          available: f.presenceStatus === 'online' || f.presenceStatus === 'away',
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

        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to assign freelancer'));

      toast.success(data?.message || 'Freelancer assigned successfully');
      await fetchOrder();
    } catch (error) {
      console.error('Error assigning freelancer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign freelancer');
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (newStatus: string, note?: string) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/jobs/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, changedBy: user?.id, note }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to update order'));

      toast.success(data?.message || 'Order updated');
      await fetchOrder();
    } catch (error) {
      console.error('Update order status error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!confirm('Accept this order?')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: 'Accepted by manager' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to accept order'));

      toast.success(data?.message || 'Order accepted');
      await fetchOrder();
    } catch (error) {
      console.error('Accept order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept order');
    } finally {
      setProcessing(false);
    }
  };

  const handlePutOnHold = async () => {
    if (!confirm('Put this order on hold?')) return;

    setProcessing(true);
    try {
      const reason = (prompt('Optional reason for putting this order on hold:') || '').trim();
      const response = await safeApiFetch(`/api/jobs/${orderId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId: user?.id, reason: reason || undefined }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to put order on hold'));

      toast.success(data?.message || 'Order put on hold');
      await fetchOrder();
    } catch (error) {
      console.error('Put on hold error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to put order on hold');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    const reason = (prompt('Reason for cancelling this order? (required)') || '').trim();
    if (!reason) return;
    if (!confirm('Cancel this order?')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to cancel order'));

      toast.success(data?.message || 'Order cancelled');
      await fetchOrder();
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeOrder = async () => {
    if (!order) return;
    if (!confirm('Resume this order from on-hold?')) return;

    setProcessing(true);
    try {
      const reason = (prompt('Optional reason for resuming this order:') || '').trim();
      const response = await safeApiFetch(`/api/jobs/${orderId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId: user?.id, reason: reason || undefined }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to resume order'));

      toast.success(data?.message || 'Order resumed');
      await fetchOrder();
    } catch (error) {
      console.error('Resume order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resume order');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveSubmissionToEditing = async () => {
    if (!confirm('Approve submission and send to editing?')) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/manager/${orderId}/approve-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ approvalNotes: 'Approved by manager for editing' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Failed to approve submission'));
      }
      toast.success(data?.message || 'Submission approved and sent to editing');
      await fetchOrder();
      await fetchFiles();
    } catch (error) {
      console.error('Approve submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve submission');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmissionToFreelancer = async () => {
    const rejectionReason = prompt('Rejection reason (required):');
    if (!rejectionReason?.trim()) return;
    const requiredChanges = prompt('Required changes (optional):') || '';

    if (!confirm('Reject submission and return to freelancer?')) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/manager/${orderId}/approve-submission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim(), requiredChanges: requiredChanges.trim() || undefined }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Failed to reject submission'));
      }
      toast.success(data?.message || 'Submission rejected and returned to freelancer');
      await fetchOrder();
    } catch (error) {
      console.error('Reject submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject submission');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliverToClient = async () => {
    if (!confirm('Deliver this order to the client for review?')) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Delivered to client by manager' }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Failed to deliver to client'));
      }

      toast.success(data?.message || 'Order delivered to client');
      await fetchOrder();
      await fetchFiles();
    } catch (error) {
      console.error('Error delivering order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deliver order');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestInternalRevision = async () => {
    const reason = prompt('Internal revision request (required):');
    if (!reason?.trim()) return;
    if (!order?.assignedFreelancerId) {
      toast.error('No freelancer assigned to this order');
      return;
    }

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/internal-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assignedTo: order.assignedFreelancerId,
          reason: reason.trim().length > 120 ? `${reason.trim().slice(0, 117)}...` : reason.trim(),
          details: reason.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Failed to request internal revision'));
      }

      toast.success(data?.message || 'Internal revision requested');
      await fetchOrder();
    } catch (error) {
      console.error('Internal revision error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request internal revision');
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
          <CardContent className="py-8 text-center">
            <XCircle className="size-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-base font-semibold mb-1.5">Order Not Found</h2>
            <p className="text-sm text-muted-foreground mb-3">The order you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/manager/orders')} variant="outline" size="sm">
              <ArrowLeft className="size-3.5" />
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

  const canAssign = order.status === 'accepted';
  const canGateReview = order.status === 'submitted';
  const canEditingReview = order.status === 'editing';
  const isManager = user?.role === 'manager';

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/manager/orders')} variant="outline" size="sm">
            <ArrowLeft className="size-3.5" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{order.title}</h1>
            <p className="text-xs text-muted-foreground">Order #{order.displayId}</p>
            {order.managerName && (
              <Badge variant="outline" className="mt-1 text-xs">Manager: {order.managerName}</Badge>
            )}
          </div>
        </div>
        <Badge variant="secondary" className={getStatusColorClasses(coerceOrderStatus(order.status))}>
          {getStatusLabel(coerceOrderStatus(order.status), 'manager')}
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
          {/* Manager Controls */}
          {isManager && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  Manager Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {order.status === 'pending' && (
                    <Button
                      onClick={handleAcceptOrder}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Accept Order
                    </Button>
                  )}

                  {order.status === 'on_hold' && (
                    <Button
                      onClick={handleResumeOrder}
                      disabled={processing}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                      Resume
                    </Button>
                  )}

                  {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'paid' && (
                    <Button
                      onClick={handlePutOnHold}
                      disabled={processing || order.status === 'on_hold'}
                      variant="outline"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                      Put On Hold
                    </Button>
                  )}

                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <Button
                      onClick={handleCancelOrder}
                      disabled={processing}
                      variant="destructive"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Cancel
                    </Button>
                  )}

                  {canAssign && !order.assignedFreelancerId && (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => handleAssignFreelancer(parseInt(value))}>
                        <SelectTrigger className="w-[200px]">
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
                    </div>
                  )}

                  {canGateReview && (
                    <>
                      <Button
                        onClick={handleApproveSubmissionToEditing}
                        disabled={processing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Approve → Editing
                      </Button>
                      <Button
                        onClick={handleRejectSubmissionToFreelancer}
                        disabled={processing}
                        variant="outline"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                        Reject → Freelancer
                      </Button>
                    </>
                  )}

                  {canEditingReview && (
                    <>
                      <Button 
                        onClick={handleDeliverToClient} 
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Deliver to Client
                      </Button>
                      <Button 
                        onClick={handleRequestInternalRevision} 
                        disabled={processing}
                        variant="outline"
                      >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                        Internal Revision
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Notification for Submitted Work */}
          {(canGateReview || canEditingReview) && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-900">
                  <Eye className="w-5 h-5" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {canGateReview
                    ? 'The freelancer has submitted their work. Review and either approve to editing or reject back to the freelancer.'
                    : 'This order is in editing. You can deliver to the client or request an internal revision.'}
                </p>
              </CardContent>
            </Card>
          )}

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

              {(order.freelancerEarnings || order.managerEarnings) && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Earnings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Manager Earnings</p>
                      <p className="text-lg font-semibold text-blue-600">KSh {order.managerEarnings || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Freelancer Earnings</p>
                      <p className="text-lg font-semibold text-green-600">KSh {order.freelancerEarnings || 0}</p>
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
            <CardContent className="space-y-4">
              {canUploadRevisionFiles && (
                <div className="p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <h3 className="text-sm font-semibold mb-1 text-purple-700 dark:text-purple-200">Upload Edited Files</h3>
                  <p className="text-xs text-muted-foreground mb-3">Attach revised documents while the order is in editing.</p>
                  <FileUploadSection
                    jobId={Number(order.id)}
                    currentUserId={user?.id || 0}
                    currentUserRole="manager"
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
                currentUserRole={user?.role || 'manager'}
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

export default function ManagerOrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <ManagerOrderDetailContent />
    </Suspense>
  );
}