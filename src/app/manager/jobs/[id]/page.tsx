"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, XCircle, UserPlus, Ban, ArrowLeft, Send, 
  Loader2, Pause, Play, AlertCircle, DollarSign, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DualCountdownTimer } from '@/components/prominent-countdown-timer';
import { CategorizedFilesDisplay, AttributedFile } from '@/components/attributed-file-display';
import { PendingMessagesSection, DeliveredMessagesSection } from '@/components/admin-message-sections';
import { FileUploadSection } from '@/components/file-upload-section';

type Job = {
  id: number;
  clientId: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  assignedFreelancerName?: string;
  assignedFreelancerEmail?: string;
  adminApproved: boolean;
  clientApproved: boolean;
  paymentConfirmed: boolean;
  createdAt: string;
  displayId?: string;
};

type Freelancer = {
  id: number;
  name: string;
  email: string;
  rating: number | null;
  balance: number;
  completedJobs?: number;
};

type EnhancedMessage = {
  id: number;
  jobId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  isApproved: boolean;
  isDelivered: boolean;
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: number | null;
};

type ApiEnvelope<T> = T | { success?: boolean; data?: T };

function unwrapApiData<T>(payload: ApiEnvelope<T> | null | undefined): T | null {
  if (!payload) return null;

  if (typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  return payload as T;
}

export default function ManagerJobDetailPageRedesigned() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>('');
  const [freelancerDeadline, setFreelancerDeadline] = useState('');

  // Status change
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Payment confirmation
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [mpesaCode, setMpesaCode] = useState('');

  // Delete job
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === 'manager') {
      fetchJob();
      fetchFreelancers();
      fetchMessages();
      fetchAttachments();
    }
  }, [user, jobId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchJob(); // Refresh order details
      fetchMessages();
      fetchAttachments();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${jobId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        }
      });
      if (!response.ok) {
        toast.error('Failed to load order');
        router.push('/manager/dashboard');
        return;
      }
      const responseData = await response.json();
      const payload = unwrapApiData<{
        order: Record<string, any>;
        client?: { name?: string | null; email?: string | null; phone?: string | null } | null;
        writer?: { name?: string | null; email?: string | null } | null;
        payment?: { amount?: number | null } | null;
      }>(responseData);

      if (!payload?.order) {
        toast.error('Order not found');
        router.push('/manager/dashboard');
        return;
      }
      const orderObj = payload.order || {};
      const actualAmount = payload.payment?.amount ?? orderObj?.actualPaymentAmount ?? orderObj?.amount ?? 0;
      const mappedJob: Job = {
        id: orderObj.id,
        clientId: orderObj.clientId,
        clientName: payload.client?.name ?? undefined,
        clientEmail: payload.client?.email ?? undefined,
        clientPhone: payload.client?.phone ?? undefined,
        title: orderObj.title || '',
        instructions: orderObj.instructions || '',
        workType: orderObj.workType || 'standard',
        pages: orderObj.pages,
        slides: orderObj.slides,
        amount: actualAmount,
        deadline: orderObj.deadline || '',
        actualDeadline: orderObj.actualDeadline || orderObj.deadline || '',
        freelancerDeadline: orderObj.freelancerDeadline || orderObj.actualDeadline || orderObj.deadline || '',
        status: orderObj.status || 'pending',
        assignedFreelancerId: orderObj.assignedFreelancerId || null,
        assignedFreelancerName: payload.writer?.name ?? undefined,
        assignedFreelancerEmail: payload.writer?.email ?? undefined,
        adminApproved: !!orderObj.adminApproved,
        clientApproved: !!orderObj.clientApproved,
        paymentConfirmed: !!orderObj.paymentConfirmed,
        createdAt: orderObj.createdAt || new Date().toISOString(),
        displayId: orderObj.displayId || orderObj.orderNumber,
      };
      setJob(mappedJob);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Error loading order');
      router.push('/manager/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreelancers = async () => {
    try {
      const response = await safeApiFetch('/api/users?role=freelancer&approved=true', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFreelancers(data);
      } else {
        console.error('Failed to fetch freelancers - status:', response.status);
        toast.error('Failed to load freelancers list');
      }
    } catch (error) {
      console.error('Failed to fetch freelancers:', error);
      toast.error('Error loading freelancers');
    }
  };

  const fetchMessages = async () => {
    try {
      // Use v2 chat API
      const response = await safeApiFetch(`/api/v2/orders/${jobId}/chat?role=manager&userId=${user?.id}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map v2 chat messages to EnhancedMessage format
        const mappedMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          jobId: msg.orderId,
          senderId: msg.senderId,
          senderName: msg.displaySenderName || msg.senderName || 'Unknown',
          senderRole: msg.senderRoleDisplay || msg.senderRole || 'user',
          message: msg.message,
          isApproved: true, // Chat messages are auto-approved
          isDelivered: msg.isRead || false,
          createdAt: msg.createdAt,
          approvedAt: msg.createdAt,
          approvedBy: null,
        }));
        setMessages(mappedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const authHeader = { 'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}` };
      const [v2Res, legacyRes] = await Promise.all([
        safeApiFetch(`/api/v2/orders/${jobId}/files?role=manager&userId=${user?.id}&includeDrafts=true`, {
          credentials: 'include',
          headers: authHeader,
        }),
        safeApiFetch(`/api/jobs/${jobId}/attachments`, {
          credentials: 'include',
          headers: authHeader,
        }),
      ]);

      let allFiles: AttributedFile[] = [];

      if (v2Res.ok) {
        const data = await v2Res.json();
        const v2Files = (data.files || []).map((f: any) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.fileType || 'application/octet-stream',
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName || '',
          uploaderRole: f.uploaderRole || '',
          uploadType: f.uploadType || 'additional',
          createdAt: f.uploadedAt,
          fileClassification: f.category || null,
        }));
        allFiles = [...allFiles, ...v2Files];
      }

      if (legacyRes.ok) {
        const legacy = await legacyRes.json();
        const legacyFiles = (legacy || []).map((f: any) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          fileType: f.fileType || 'application/octet-stream',
          uploadedBy: f.uploadedBy,
          uploaderName: f.uploaderName || '',
          uploaderRole: f.uploaderRole || '',
          uploadType: f.uploadType || 'initial',
          createdAt: f.createdAt,
        }));
        allFiles = [...allFiles, ...legacyFiles];
      }

      setAttachments(allFiles);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleAccept = async () => {
    if (!job || !user) return;
    setActionLoading(true);

    try {
      const response = await safeApiFetch(`/api/v2/orders/${job.id}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        },
        body: JSON.stringify({ 
          managerId: user.id,
        }),
      });

if (response.ok) {
        toast.success('Order accepted! You can now assign a freelancer.');
        fetchJob();
        setAssignDialogOpen(true);
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to accept order'));
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!job || !selectedFreelancerId || !freelancerDeadline || !user) {
      toast.error('Please select a freelancer and set a deadline');
      return;
    }

    setActionLoading(true);

    try {
      const response = await safeApiFetch(`/api/v2/orders/${job.id}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        },
        body: JSON.stringify({
          freelancerId: parseInt(selectedFreelancerId),
          freelancerDeadline: new Date(freelancerDeadline).toISOString(),
        }),
      });

if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Freelancer assigned successfully!');
        setAssignDialogOpen(false);
        setSelectedFreelancerId('');
        setFreelancerDeadline('');
        fetchJob();
      } else {
        const data = await response.json();
        toast.error(extractErrorMessage(data, 'Failed to assign freelancer'));
      }
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('Failed to assign freelancer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!job || !newStatus) return;
    setActionLoading(true);

    try {
      const response = await safeApiFetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Status changed to ${newStatus}!`);
        setStatusChangeOpen(false);
        fetchJob();
      } else {
        toast.error('Failed to change status');
      }
    } catch (error) {
      console.error('Failed to change status:', error);
      toast.error('Failed to change status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      // Use v2 payment endpoint that wraps confirmPaymentReceived()
      const response = await safeApiFetch(`/api/v2/orders/${job.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionId: mpesaCode.trim() || 'ADMIN_CONFIRMED',
          paymentMethod: 'mpesa',
        }),
      });

if (response.ok) {
        const data = await response.json();
        toast.success(
          `Payment confirmed! Funds reserved for payout. Writer: KSh ${data.distribution?.writer || 0}, Manager: KSh ${data.distribution?.manager || 0}`,
          { duration: 5000 }
        );
        setPaymentDialogOpen(false);
        setMpesaCode('');
        fetchJob();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to confirm payment'));
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await safeApiFetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Order deleted!');
        router.push('/manager/dashboard');
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete order');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Deliver to Client - transitions order from editing/in_progress/submitted to delivered
  const handleDeliverToClient = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await safeApiFetch(`/api/v2/orders/${job.id}/admin/deliver`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          notes: 'Work delivered to client by manager',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Work delivered to client! Manager delivery fee: KSh ${data.managerDeliveryFee || 0}`);
        fetchJob();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to deliver work'));
        console.error('Deliver failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to deliver:', error);
      toast.error('Failed to deliver work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!job) return;
    const revisionNotes = prompt('Please provide details about what needs to be revised:');
    if (!revisionNotes?.trim()) return;

    setActionLoading(true);

    try {
      const response = await safeApiFetch(`/api/v2/orders/${job.id}/request-revision`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ revisionNotes: revisionNotes.trim() }),
      });

      if (response.ok) {
        toast.success('Revision requested successfully');
        fetchJob();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to request revision'));
        console.error('Request revision failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to request revision:', error);
      toast.error('Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (file: AttributedFile) => {
    try {
      const url = `/api/files/download/${file.id}?role=manager&userId=${user?.id}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeliverMessage = async (messageId: number, recipientRole: 'client' | 'freelancer') => {
    try {
      const response = await safeApiFetch(`/api/jobs/${jobId}/messages/${messageId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: user?.id,
          recipientRole,
        }),
      });

      if (response.ok) {
        toast.success(`Message delivered to ${recipientRole}!`);
        fetchMessages();
      } else {
        toast.error('Failed to deliver message');
      }
    } catch (error) {
      console.error('Failed to deliver message:', error);
      toast.error('Failed to deliver message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) return null;

  const displayStatus = job.status;

  const pendingMessages = messages.filter(m => m.isApproved && !m.isDelivered);
  const deliveredMessages = messages.filter(m => m.isDelivered);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-7xl">
        <Link href="/manager/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* DUAL COUNTDOWN TIMER - PROMINENT */}
        <div className="mb-6">
          <DualCountdownTimer
            clientDeadline={job.actualDeadline || job.deadline}
            freelancerDeadline={job.freelancerDeadline}
            orderStatus={job.status}
            size="lg"
          />
        </div>

        {/* ORDER SUMMARY CARD */}
        <Card className="mb-6 border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl mb-2 break-words">{job.title}</CardTitle>
                <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm text-muted-foreground">
                  <span>Order ID: <Badge variant="outline" className="font-mono">{job.displayId}</Badge></span>
                  <span>•</span>
                  <span>Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <Badge 
                variant={displayStatus === 'completed' ? 'default' : 'secondary'}
                className="text-sm sm:text-base px-3 py-1.5 capitalize"
              >
                {displayStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Order Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground">Work Type</Label>
                <p className="font-semibold text-sm capitalize">{job.workType}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <p className="font-semibold text-sm">
                  {job.pages ? `${job.pages} pages` : ''}{job.pages && job.slides ? ' + ' : ''}{job.slides ? `${job.slides} slides` : ''}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Client Deadline</Label>
                <p className="font-semibold text-sm">
                  {format(new Date(job.actualDeadline), 'MMM dd, HH:mm')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <p className="font-bold text-lg text-green-600">KSh {job.amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <div className="mt-2">
                <p className="font-semibold text-sm">{job.clientName || 'Client'}</p>
                {job.clientEmail && <p className="text-xs text-muted-foreground">{job.clientEmail}</p>}
                {job.clientPhone && <p className="text-xs text-muted-foreground">{job.clientPhone}</p>}
              </div>
            </div>

            {/* Freelancer Info (if assigned) */}
            {job.assignedFreelancerId && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <Label className="text-xs text-muted-foreground">Assigned Writer</Label>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{job.assignedFreelancerName || 'Freelancer'}</p>
                    {job.assignedFreelancerEmail && (
                      <p className="text-xs text-muted-foreground">{job.assignedFreelancerEmail}</p>
                    )}
                    {job.freelancerDeadline && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                        Writer Deadline: {format(new Date(job.freelancerDeadline), 'MMM dd, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground">Instructions</Label>
              <div className="mt-1 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                {job.instructions}
              </div>
            </div>

            {/* STATUS-SPECIFIC ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {job.status === 'pending' && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="gap-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}

              {job.status === 'approved' && !job.assignedFreelancerId && (
                <>
                  <Button onClick={handleAccept} disabled={actionLoading} className="gap-3">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accept Order
                  </Button>
                  <Button onClick={() => setAssignDialogOpen(true)} className="gap-3" variant="outline">
                    <UserPlus className="w-4 h-4" />
                    Assign Freelancer
                  </Button>
                </>
              )}

              {job.status === 'accepted' && !job.assignedFreelancerId && (
                <Button onClick={() => setAssignDialogOpen(true)} className="gap-3">
                  <UserPlus className="w-4 h-4" />
                  Assign Freelancer
                </Button>
              )}

              {/* Deliver to Client - for orders in work-ready status */}
              {['editing', 'submitted', 'in_progress', 'internal_revision'].includes(job.status) && (
                <>
                  <Button 
                    onClick={handleDeliverToClient}
                    disabled={actionLoading}
                    className="gap-3 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Deliver to Client
                  </Button>
                  <Button 
                    onClick={handleRequestRevision}
                    disabled={actionLoading}
                    variant="outline"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    Request Revision
                  </Button>
                </>
              )}

              {job.status === 'delivered' && !job.paymentConfirmed && (
                <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    Waiting for client payment confirmation
                  </AlertDescription>
                </Alert>
              )}

              {job.status === 'delivered' && job.paymentConfirmed && !job.clientApproved && (
                <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Waiting for client approval
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                variant="outline" 
                onClick={() => setStatusChangeOpen(true)}
                className="gap-3"
              >
                <Pause className="w-4 h-4" />
                Change Status
              </Button>

              {job.status === 'delivered' && (
                <Button 
                  onClick={() => setPaymentDialogOpen(true)}
                  variant="outline"
                  className="gap-3 border-green-600 text-green-600"
                >
                  <DollarSign className="w-4 h-4" />
                  Confirm Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MESSAGES & FILES - TWO COLUMN LAYOUT */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* MESSAGES SECTION */}
          <Card className="h-[600px] flex flex-col shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
              <PendingMessagesSection
                messages={pendingMessages}
                jobId={parseInt(jobId)}
                currentJob={{
                  clientId: job.clientId,
                  assignedFreelancerId: job.assignedFreelancerId
                }}
                onMessageDelivered={fetchMessages}
              />

              <DeliveredMessagesSection
                messages={deliveredMessages}
              />
            </CardContent>
          </Card>

          {/* FILES SECTION */}
          <Card className="h-[600px] flex flex-col shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Files</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Deliver to Client Section with Classification */}
              <div className="p-4 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3">📤 Deliver to Client (Classified)</h3>
                <FileUploadSection
                  jobId={parseInt(jobId)}
                  currentUserId={user?.id || 0}
                  currentUserRole="manager"
                  files={attachments.map(f => ({
                    ...f,
                    id: typeof f.id === 'string' ? Number.parseInt(f.id, 10) : f.id,
                    uploaderEmail: ''
                  }))}
                  canUpload={true}
                  canDownload={false}
                  uploadType="delivery"
                  onFileUploaded={fetchAttachments}
                  clientId={job.clientId}
                />
              </div>

              {/* Additional File Upload Section */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Upload Additional Files</h3>
                <FileUploadSection
                  jobId={parseInt(jobId)}
                  currentUserId={user?.id || 0}
                  currentUserRole="admin"
                  files={attachments.map(f => ({
                    ...f,
                    id: typeof f.id === 'string' ? Number.parseInt(f.id, 10) : f.id,
                    uploaderEmail: ''
                  }))}
                  canUpload={true}
                  canDownload={true}
                  uploadType="additional"
                  onFileUploaded={fetchAttachments}
                  clientId={job.clientId}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">All Files (Categorized)</h3>
                <CategorizedFilesDisplay
                  files={attachments}
                  onDownload={handleDownload}
                  showCategories={{
                    client: true,
                    writer: true,
                    manager: true,
                    admin: true,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ASSIGN FREELANCER DIALOG */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Freelancer</DialogTitle>
            <DialogDescription>Select a freelancer and set their deadline</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Freelancer *</Label>
              <Select value={selectedFreelancerId} onValueChange={setSelectedFreelancerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select freelancer" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]" position="popper" sideOffset={5}>
                  {freelancers.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No approved freelancers available
                    </div>
                  ) : (
                    freelancers.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name} {f.rating ? `(★ ${f.rating.toFixed(1)})` : ''} - {f.completedJobs || 0} jobs
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedFreelancerId && (
                <p className="text-xs text-green-600">
                  ✓ Freelancer selected: {freelancers.find(f => f.id.toString() === selectedFreelancerId)?.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Writer Deadline *</Label>
              <Input
                type="datetime-local"
                value={freelancerDeadline}
                onChange={(e) => setFreelancerDeadline(e.target.value)}
                max={job?.actualDeadline ? new Date(job.actualDeadline).toISOString().slice(0, 16) : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Must be before client deadline: {job && format(new Date(job.actualDeadline), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STATUS CHANGE DIALOG */}
      <Dialog open={statusChangeOpen} onOpenChange={setStatusChangeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Order Status</DialogTitle>
            <DialogDescription>Select new status for this order</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Change Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PAYMENT CONFIRMATION DIALOG */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Confirm that client has paid KSh {job?.amount.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>M-Pesa Code (Optional)</Label>
              <Input
                placeholder="e.g., SH12ABC34D"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if confirmed manually
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePaymentConfirm} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
