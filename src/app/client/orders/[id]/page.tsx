"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, FileText, Download, DollarSign, Calendar, User, MessageSquare,
  UploadCloud, CheckCircle, AlertCircle, XCircle, Clock, Loader2, Eye, Edit, Upload, X,
  CreditCard, Star
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileListSection, AttributedFile } from '@/components/attributed-file-display';
import { OrderChat } from '@/components/order-chat';
import { getStatusLabel, getStatusColorClasses, type OrderStatus } from '@/lib/status-display';
import { extractErrorMessage, unwrapApiData } from '@/lib/client-api-helpers';
import { ClientOrderEditDialog } from '@/components/client-order-edit-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PreviewPopup } from '@/components/preview-popup';
import { RatingDialog } from '@/components/rating-dialog';
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';
import PaystackPaymentButton from '@/components/PaystackPaymentButton';

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
  clientPaymentTerms?: 'pod' | 'poa' | null;
  hasPayment?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'PPp');
  } catch {
    return '—';
  }
}

function ClientOrderDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState<{score: number; comment: string | null; createdAt: string} | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
    fetchFiles();
    fetchRatingStatus();
  }, [user, orderId]);

  const fetchRatingStatus = async () => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/rating`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setHasRated(true);
          setExistingRating(data.rating);
        }
      }
    } catch (error) {
      console.error('Error fetching rating status:', error);
    }
  };

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
        client?: { id?: number | string; name?: string | null; paymentTerms?: 'pod' | 'poa' | null } | null;
        writer?: { name?: string | null } | null;
        manager?: { name?: string | null } | null;
        latestPayment?: { status?: string | null } | null;
      }>(responseData);
      const orderObj = (payload as any)?.order ?? payload;

      const mappedOrder: Order = {
        id: Number(orderObj?.id) || 0,
        displayId: orderObj?.displayId || orderObj?.orderNumber || `TL-${orderObj?.id ?? orderId}`,
        orderNumber: orderObj?.orderNumber,
        clientId: Number(orderObj?.clientId) || Number(payload?.client?.id) || 0,
        clientName: payload?.client?.name || orderObj?.clientName || user?.name || 'Client',
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
        clientPaymentTerms: payload?.client?.paymentTerms || 'pod',
        hasPayment: Boolean(
          payload?.latestPayment?.status === 'completed' ||
          payload?.latestPayment?.status === 'confirmed'
        ),
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
      const qp = new URLSearchParams();
      if (user?.id) qp.set('userId', String(user.id));
      // Force role-aware filtering to avoid accidental data leakage and to follow the intended client rules
      qp.set('role', (user?.role === 'account_owner') ? 'account_owner' : 'client');
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/files?${qp.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const files = (data.files || []).map((f: any) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.fileType || f.mimeType || 'application/octet-stream',
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName || '',
          uploaderRole: String(f.uploaderRole || '').toLowerCase() === 'writer' ? 'freelancer' : (f.uploaderRole || ''),
          uploadType: f.uploadType || 'additional',
          createdAt: f.uploadedAt || f.createdAt,
          fileClassification: f.category || f.fileClassification || null,
          notes: f.notes || null,
        }));
        setAttachments(files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const canDownloadFile = (file: AttributedFile): boolean => {
    if (!order) return false;
    
    // Always allow downloading client's own uploads (brief files)
    const isClientUpload = ['initial', 'brief', 'additional', 'attachment'].includes(file.uploadType);
    if (isClientUpload) return true;
    
    // For POA clients, always allow downloads
    if (order.clientPaymentTerms === 'poa') return true;
    
    // For POD clients, ONLY allow if payment is completed - NOT just delivered
    if (order.clientPaymentTerms === 'pod') {
      return order.hasPayment === true;
    }
    
    return false;
  };

  const getDownloadDisabledReason = (): string => {
    if (order?.clientPaymentTerms === 'pod' && !order.hasPayment) {
      return `Payment of KSh ${order.amount.toLocaleString()} required to download deliverables. Use Preview to view limited content.`;
    }
    return 'Download not allowed';
  };

  const handleDownload = async (file: AttributedFile) => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/download/${file.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const reason = err?.reason || err?.error || 'Download failed';
        toast.error(reason);
        return;
      }

      const data = await response.json().catch(() => null);
      const url = data?.fileUrl || file.fileUrl;
      if (!url) {
        toast.error('Download link unavailable');
        return;
      }

      // Use a normal navigation to Cloudinary (works with large files and keeps auth checks server-side)
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleApproveOrder = async () => {
    if (!confirm('Are you sure you want to approve this order? This action cannot be undone.')) return;
    
    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating: null, feedback: null })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to approve order'));

      toast.success(data?.message || 'Order approved successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve order');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    const revisionNotes = prompt('Please provide details about what needs to be revised:');
    if (!revisionNotes?.trim()) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ revisionNotes: revisionNotes.trim() })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to request revision'));

      toast.success(data?.message || 'Revision requested successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request revision');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayNow = () => {
    window.location.href = `/client/orders/${orderId}/payment`;
  };

  const handleRatingSubmit = () => {
    // Refresh order data and rating status to show updated rating
    fetchOrder();
    fetchRatingStatus();
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Max 10 files
    }
  };

  const handleUploadAdditionalFiles = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (!user?.id) {
      toast.error('User session not found');
      return;
    }

    setUploading(true);
    try {
      // Upload each file to Cloudinary
      const uploadPromises = uploadFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'tasklynk_orders');

        const cloudinaryResponse = await safeApiFetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}/auto/upload`,
          { method: 'POST', body: formData }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const cloudinaryData = await cloudinaryResponse.json();
        return {
          url: cloudinaryData.secure_url,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          fileType: 'additional',
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Send to backend
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/upload/additional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId: user.id,
          notes: 'Additional files from client',
          files: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save files');
      }

      toast.success(`${uploadFiles.length} file(s) uploaded successfully`);
      setUploadFiles([]);
      setUploadDialogOpen(false);
      fetchFiles(); // Refresh file list
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleEditComplete = (updatedJob: any) => {
    setEditDialogOpen(false);
    fetchOrder(); // Refresh order data
    toast.success('Order updated successfully');
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
            <Button onClick={() => router.push('/client/orders')} variant="outline" size="sm">
              <ArrowLeft className="size-3.5" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate files by uploader role
  const normalizeRole = (role: string) => {
    const r = String(role || '').toLowerCase();
    if (r === 'writer') return 'freelancer';
    return r;
  };

  const clientFiles = attachments.filter(f => ['client', 'account_owner'].includes(normalizeRole(f.uploaderRole)));
  const freelancerFiles = attachments.filter(f => normalizeRole(f.uploaderRole) === 'freelancer');
  const adminFiles = attachments.filter(f => ['admin', 'manager'].includes(normalizeRole(f.uploaderRole)));

  const isDelivered = order.status === 'delivered';
  const canApprove = isDelivered;
  const canRequestRevision = isDelivered;
  
  // Show Pay Now button for all unpaid orders in delivered, approved, and subsequent stages
  const isUnpaidAndPayable = !order.hasPayment && 
    ['delivered', 'approved', 'completed', 'paid'].includes(order.status);
  
  // Show payment action section separately for non-delivered but payable orders
  const showPaymentSection = isUnpaidAndPayable && !isDelivered;

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/client/orders')} variant="outline" size="sm">
            <ArrowLeft className="size-3.5" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{order.title}</h1>
            <p className="text-xs text-muted-foreground">Order #{order.displayId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.status === 'pending' && (
            <Button onClick={() => setEditDialogOpen(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          )}
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <Badge variant="secondary" className={getStatusColorClasses(coerceOrderStatus(order.status))}>
            {getStatusLabel(coerceOrderStatus(order.status), 'client')}
          </Badge>
        </div>
      </div>

      {/* Action Buttons for Delivered Orders */}
      {isDelivered && (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-900">
              <Eye className="w-5 h-5" />
              Work Delivered - Review Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your order has been completed and delivered. Please review the work and either approve it or request revisions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                asChild
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Link href={`/client/orders/${orderId}/preview`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Document
                </Link>
              </Button>
              {/* Show Pay Now button only for unpaid orders */}
              {!order.hasPayment && (
                <PaystackPaymentButton
                  jobId={order.id}
                  clientId={order.clientId}
                  amount={Math.round(order.amount)}
                  email={user?.email || 'client@tasklynk.co.ke'}
                  buttonText={`Pay KSh ${Math.round(order.amount).toLocaleString()}`}
                  buttonVariant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onError={(error) => {
                    toast.error(error || 'Payment failed');
                  }}
                />
              )}
              <Button 
                onClick={handleApproveOrder} 
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approve Work
              </Button>
              <Button 
                onClick={handleRequestRevision} 
                disabled={processing}
                variant="outline"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                Request Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Section for Approved/Completed/Paid Orders that are not yet paid */}
      {showPaymentSection && (
        <Card className="mb-6 border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-900">
              <CreditCard className="w-5 h-5" />
              Payment Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your order is {order.status === 'approved' ? 'approved and ready for payment' : `in ${order.status} status`}. Please complete the payment to finalize your order.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                asChild
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Link href={`/client/orders/${orderId}/preview`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Document
                </Link>
              </Button>
              <PaystackPaymentButton
                jobId={order.id}
                clientId={order.clientId}
                amount={Math.round(order.amount)}
                email={user?.email || 'client@tasklynk.co.ke'}
                buttonText={`Pay Now - KSh ${Math.round(order.amount).toLocaleString()}`}
                buttonVariant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onError={(error) => {
                  toast.error(error || 'Payment failed');
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Section for Approved/Completed/Paid Orders */}
      {(order?.status === 'approved' || order?.status === 'completed' || order?.status === 'paid') && (
        <Card className={`mb-6 ${hasRated ? 'border-blue-200 bg-blue-50/30' : 'border-green-200 bg-green-50/30'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-3 ${hasRated ? 'text-blue-900' : 'text-green-900'}`}>
              <Star className={`w-5 h-5 ${hasRated ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {hasRated ? 'Your Rating' : 'Rate This Work'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasRated && existingRating ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= existingRating.score
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{existingRating.score}/5</span>
                </div>
                {existingRating.comment && (
                  <div className="bg-white p-3 rounded-md border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Your Feedback:</p>
                    <p className="text-sm">{existingRating.comment}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted on {format(parseISO(existingRating.createdAt), 'PPp')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  How would you rate the quality of this work? Your feedback helps us improve our services and helps the freelancer build their reputation.
                </p>
                <Button 
                  onClick={() => setShowRating(true)}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Leave a Rating
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    const allFiles = [...clientFiles, ...adminFiles, ...freelancerFiles];
                    allFiles.forEach((file, index) => {
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
              {/* Client Files - Your uploads + Admin/Manager uploads on your behalf */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Your Files & Administrative Uploads</h3>
                <FileListSection
                  title=""
                  files={[...clientFiles, ...adminFiles]}
                  onDownload={handleDownload}
                  showAttribution={true}
                  colorScheme="blue"
                  emptyMessage="No files uploaded yet"
                  canDownloadFn={canDownloadFile}
                  downloadDisabledReason={getDownloadDisabledReason()}
                />
              </div>

              {/* Freelancer Files - Delivered work */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Delivered Work</h3>
                <FileListSection
                  title=""
                  files={freelancerFiles}
                  onDownload={handleDownload}
                  showAttribution={false}
                  showUploadType={true}
                  colorScheme="green"
                  emptyMessage="No submissions yet"
                  canDownloadFn={canDownloadFile}
                  downloadDisabledReason={getDownloadDisabledReason()}
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
                currentUserRole={user?.role || 'client'}
                orderClientId={order?.clientId}
                orderFreelancerId={order?.assignedFreelancerId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Order Dialog */}
      {order && (
        <ClientOrderEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          job={{
            id: order.id,
            title: order.title,
            instructions: order.instructions,
            workType: order.workType,
            pages: order.pages,
            slides: order.slides,
            amount: order.amount,
            deadline: order.deadline,
            actualDeadline: order.deadline,
          }}
          onEdit={handleEditComplete}
        />
      )}

      {/* Upload Additional Files Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Additional Files</DialogTitle>
            <DialogDescription>
              Add supplementary files to your order (instructions, references, examples, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                disabled={uploading || uploadFiles.length >= 10}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 10 files, each under 40MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Documents, images, presentations, spreadsheets, archives
                </p>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Files ({uploadFiles.length}/10):</p>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFiles([]);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadAdditionalFiles}
              disabled={uploadFiles.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadFiles.length} File(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Popup */}
      {order && (
        <PreviewPopup
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          order={{
            id: order.id,
            title: order.title,
            instructions: order.instructions,
            workType: order.workType,
            pages: order.pages ?? undefined,
            slides: order.slides ?? undefined,
            amount: order.amount,
            status: order.status,
            deadline: order.deadline,
          }}
          files={attachments}
          onPayNow={handlePayNow}
          userPaymentTerms={order.clientPaymentTerms || 'pod'}
        />
      )}

      {/* Rating Dialog */}
      {order && (
        <RatingDialog
          open={showRating}
          onOpenChange={setShowRating}
          orderId={order.id}
          orderTitle={order.title}
          onRatingSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
}

export default function ClientOrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <ClientOrderDetailContent />
    </Suspense>
  );
}