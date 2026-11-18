"use client";

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
  Loader2, Pause, Play, AlertCircle, DollarSign, Trash2, PlayCircle,
  UserX, Clock, Award, MinusCircle, UploadCloud
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Input } from '@/components/ui/input';
import { getStatusLabel, getStatusColorClasses, type OrderStatus, type UserRole } from '@/lib/status-display';
import { Textarea } from '@/components/ui/textarea';
import { DualCountdownTimer } from '@/components/prominent-countdown-timer';
import { CategorizedFilesDisplay, AttributedFile } from '@/components/attributed-file-display';
import { FileUploadSection } from '@/components/file-upload-section';
import UserEarningsCard from '@/components/UserEarningsCard';
import { FileUploadPopup, FileClassification } from '@/components/file-upload-popup';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type SubmissionFileType =
  | 'final_document'
  | 'completed_paper'
  | 'plagiarism_report'
  | 'ai_report'
  | 'abstract'
  | 'graphics_tables'
  | 'printable_sources';

const CLASSIFICATION_TO_FILETYPE: Record<string, SubmissionFileType> = {
  final_document: 'final_document',
  final_paper: 'final_document',
  final_work: 'final_document',
  final_submission: 'final_document',
  completed_paper: 'completed_paper',
  completed_smart_paper: 'completed_paper',
  plag_report: 'plagiarism_report',
  plagiarism_report: 'plagiarism_report',
  ai_report: 'ai_report',
  ai_detection_report: 'ai_report',
  printable_source: 'printable_sources',
  printable_sources: 'printable_sources',
  graphics_tables: 'graphics_tables',
  graphics: 'graphics_tables',
  tables: 'graphics_tables',
  abstract: 'abstract',
  detailed_outline: 'abstract',
  outline: 'abstract',
};

const FINAL_ALLOWED_CLASSIFICATIONS: FileClassification[] = [
  'completed_paper',
  'completed_smart_paper',
  'plagiarism_report',
  'ai_report',
  'abstract',
  'detailed_outline',
  'graphics_tables',
  'printable_source',
];

const normalizeIdentifier = (value?: string | null) => (value ? value.toLowerCase().trim() : '');

const resolveFileTypeForClassification = (
  classification: string | null | undefined
): SubmissionFileType | null => {
  const normalized = normalizeIdentifier(classification);
  if (!normalized) {
    return null;
  }
  return CLASSIFICATION_TO_FILETYPE[normalized] ?? null;
};

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
  assignedFreelancerPhone?: string;
  adminApproved: boolean;
  clientApproved: boolean;
  paymentConfirmed: boolean;
  createdAt: string;
  displayId?: string;
  hasOpenInternalRevision?: boolean;
  internalRevisionCount?: number;
  clientRequestedRevision?: boolean;
};

type OrderRevision = {
  id: number;
  orderId: number;
  revisionType: 'internal' | 'client';
  requestedBy: number;
  assignedTo: number | null;
  description: string;
  priority?: string;
  status: string;
  freelancerResponse?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  completedAt?: string | null;
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

type Bid = {
  id: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
  message: string | null;
  status: string;
  createdAt: string;
  freelancerName: string;
  freelancerEmail: string;
  freelancerRating: number | null;
  freelancerCompletedJobs: number;
};

export default function ManagerJobDetailPageRedesigned() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const fallbackOrdersPath = isAdmin ? '/admin/orders' : isManager ? '/manager/orders' : '/';
  const fallbackDashboardPath = isAdmin ? '/admin/dashboard' : isManager ? '/manager/dashboard' : '/';
  const fileAccessRole: UserRole = isAdmin ? 'admin' : 'manager';
  
  const [job, setJob] = useState<Job | null>(null);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Online status tracking
  const [clientOnline, setClientOnline] = useState(false);
  const [freelancerOnline, setFreelancerOnline] = useState(false);

  // Internal revisions
  const [internalRevisions, setInternalRevisions] = useState<OrderRevision[]>([]);
  const [clientRevisions, setClientRevisions] = useState<OrderRevision[]>([]);
  const [internalRevisionDialogOpen, setInternalRevisionDialogOpen] = useState(false);
  const [internalRevisionText, setInternalRevisionText] = useState('');
  const [revisionPriority, setRevisionPriority] = useState<'low' | 'medium' | 'high'>('medium');

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

  // Cancel order
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Hold order
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  // Fine/Bonus dialogs
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [fineAmount, setFineAmount] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [fineType, setFineType] = useState<'client_complaint' | 'late_delivery' | 'quality_issue' | 'policy_violation' | 'other'>('other');
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');

  // Internal revision management
  const [internalRevisionManagementOpen, setInternalRevisionManagementOpen] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(null);
  const [revisionAction, setRevisionAction] = useState<'complete' | 'return' | 'reassign'>('complete');
  const [revisionNotes, setRevisionNotes] = useState('');

  // Upload popup for manager
  const [uploadPopupOpen, setUploadPopupOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string; name: string; size: number; mimeType: string; classification: FileClassification}>>([]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetchJob();
      fetchFreelancers();
      fetchBids();
      fetchMessages();
      fetchAttachments();
      fetchRevisions();
    }
  }, [user, jobId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchJob(); // Refresh order details
      fetchMessages();
      fetchAttachments();
      fetchBids();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/v2/orders/${jobId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // Map v2 response to Job type
        // 🔴 FIX: Use actual payment amount if available, otherwise use estimated amount
        const actualAmount = data.payment?.amount ?? data.order.actualPaymentAmount ?? data.order.amount;
        
        const mappedJob: Job = {
          id: data.order.id,
          clientId: data.client?.id || 0,
          clientName: data.client?.name,
          clientEmail: data.client?.email,
          clientPhone: '', // Add if available
          title: data.order.title,
          instructions: data.order.instructions || '',
          workType: data.order.workType || 'standard',
          pages: data.order.pages,
          slides: data.order.slides,
          amount: actualAmount || 0, // Use actual payment amount instead of calculated
          deadline: data.order.deadline || '',
          actualDeadline: data.order.actualDeadline || data.order.deadline || '',
          freelancerDeadline: data.order.freelancerDeadline || data.order.actualDeadline || data.order.deadline || '',
          status: data.order.status,
          assignedFreelancerId: data.order.assignedFreelancerId || null,
          assignedFreelancerName: data.writer?.name,
          assignedFreelancerEmail: data.writer?.email,
          assignedFreelancerPhone: '', // Add if available
          adminApproved: data.order.adminApproved || false,
          clientApproved: data.order.clientApproved || false,
          paymentConfirmed: data.order.paymentConfirmed || false,
          createdAt: data.order.createdAt || new Date().toISOString(),
          displayId: data.order.displayId || data.order.orderNumber,
          hasOpenInternalRevision: false, // Add if available
          internalRevisionCount: 0, // Add if available
          clientRequestedRevision: false, // Add if available
        };
        setJob(mappedJob);
        
        // Fetch online status for client and freelancer
        fetchOnlineStatus(data.client?.id, data.order.assignedFreelancerId);
      } else {
        toast.error('Failed to load job');
        router.push(fallbackOrdersPath);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Error loading job');
      router.push(fallbackOrdersPath);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOnlineStatus = async (clientId?: number, freelancerId?: number | null) => {
    try {
      // Fetch client online status
      if (clientId) {
        const clientRes = await fetch(`/api/v2/users/online?userId=${clientId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (clientRes.ok) {
          const data = await clientRes.json();
          setClientOnline(data.users?.[0]?.presenceStatus === 'online');
        }
      }
      
      // Fetch freelancer online status
      if (freelancerId) {
        const freelancerRes = await fetch(`/api/v2/users/online?userId=${freelancerId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (freelancerRes.ok) {
          const data = await freelancerRes.json();
          setFreelancerOnline(data.users?.[0]?.presenceStatus === 'online');
        }
      }
    } catch (error) {
      console.error('Failed to fetch online status:', error);
    }
  };

  const fetchFreelancers = async () => {
    try {
      const response = await fetch('/api/users?role=freelancer&status=approved');
      if (response.ok) {
        const data = await response.json();
        setFreelancers(data);
      }
    } catch (error) {
      console.error('Failed to fetch freelancers:', error);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/v2/bids/freelancers?jobId=${jobId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Map v2 response to Bid type
        const mappedBids: Bid[] = (data.bidders || []).map((bidder: any) => ({
          id: bidder.bidId,
          jobId: parseInt(jobId),
          freelancerId: bidder.freelancerId,
          bidAmount: bidder.bidAmount,
          message: bidder.bidMessage || null,
          status: bidder.bidStatus || 'pending',
          createdAt: bidder.bidCreatedAt,
          freelancerName: bidder.freelancerName,
          freelancerEmail: bidder.freelancerEmail,
          freelancerRating: bidder.freelancerRating,
          freelancerCompletedJobs: 0, // Add if available
        }));
        setBids(mappedBids);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  };

  const fetchMessages = async () => {
    // Messages are now handled by OrderChat component
    // This function is kept for backward compatibility if needed
  };

  const fetchRevisions = async () => {
    try {
      const response = await fetch(`/api/v2/orders/${jobId}/revisions/internal`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setInternalRevisions(data.revisions || []);
      }
    } catch (error) {
      console.error('Failed to fetch internal revisions:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const roleQuery = fileAccessRole;
      const userIdParam = user?.id ?? '';
      const [v2Res, legacyRes] = await Promise.all([
        fetch(`/api/v2/orders/${jobId}/files?role=${roleQuery}&userId=${userIdParam}&includeDrafts=true`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/jobs/${jobId}/attachments`, {
          credentials: 'include',
          cache: 'no-store',
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
          notes: f.notes || null, // Include notes for delivery file detection
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

  const handleApprove = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'accepted',
          adminApproved: true,
          changedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('Order accepted! Ready for freelancer assignment.');
        fetchJob();
        fetchBids(); // Refresh bids list
        setAssignDialogOpen(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to accept order'));
        console.error('Accept order failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to accept order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!job || !selectedFreelancerId || !freelancerDeadline) {
      toast.error('Please select a freelancer and set a deadline');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/assign`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          freelancerId: parseInt(selectedFreelancerId),
          freelancerDeadline: new Date(freelancerDeadline).toISOString(),
          changedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('Freelancer assigned successfully!');
        setAssignDialogOpen(false);
        setSelectedFreelancerId('');
        setFreelancerDeadline('');
        fetchJob();
        fetchBids();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to assign freelancer'));
        console.error('Assign freelancer failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('Failed to assign freelancer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignBid = (bid: Bid) => {
    setSelectedFreelancerId(bid.freelancerId.toString());
    // Default deadline to 24 hours before client deadline or 48 hours from now, whichever is sooner
    if (job) {
      const clientDeadline = new Date(job.actualDeadline).getTime();
      const now = new Date().getTime();
      const timeUntilDeadline = clientDeadline - now;
      
      // If deadline is far (more than 48h), give 24h buffer
      // If deadline is close, give 80% of remaining time
      let writerTime;
      if (timeUntilDeadline > 48 * 60 * 60 * 1000) {
        writerTime = clientDeadline - (24 * 60 * 60 * 1000);
      } else {
        writerTime = now + (timeUntilDeadline * 0.8);
      }
      
      setFreelancerDeadline(new Date(writerTime).toISOString().slice(0, 16));
    }
    setAssignDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!job || !newStatus) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status: newStatus,
          changedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast.success(`Status changed to ${newStatus}!`);
        setStatusChangeOpen(false);
        setNewStatus('');
        fetchJob();
        fetchMessages();
        fetchAttachments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to change status'));
        console.error('Status change failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to change status:', error);
      toast.error('Failed to change status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!job || !user) return;
    setActionLoading(true);

    try {
      // First, get the payment record for this order
      const paymentResponse = await fetch(`/api/payments?jobId=${job.id}`, {
        credentials: 'include',
      });
      
      let paymentId = null;
      if (paymentResponse.ok) {
        const payments = await paymentResponse.json();
        if (Array.isArray(payments) && payments.length > 0) {
          paymentId = payments[0].id;
        }
      }

      // Use v2 payment endpoint to confirm payment and distribute balances
      // Note: Order must be in 'approved' status for this to work
      const response = await fetch(`/api/v2/orders/${job.id}/payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          adminId: user.id,
          transactionId: mpesaCode.trim() || 'ADMIN_CONFIRMED',
          paymentMethod: 'mpesa',
          phoneNumber: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Payment confirmed! Balances distributed: Writer KSh ${data.distribution?.writer || 0}, Manager KSh ${data.distribution?.manager || 0}`,
          { duration: 5000 }
        );
        setPaymentDialogOpen(false);
        setMpesaCode('');
        fetchJob();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to confirm payment'));
        console.error('Payment confirmation failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('Failed to confirm payment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInternalRevision = async () => {
    if (!job || !internalRevisionText.trim()) {
      toast.error('Please describe what needs to be revised');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`/api/v2/orders/${job.id}/revisions/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          description: internalRevisionText.trim(),
          priority: revisionPriority,
        }),
      });

      if (response.ok) {
        toast.success('Internal QC revision created. Freelancer notified.');
        setInternalRevisionDialogOpen(false);
        setInternalRevisionText('');
        setRevisionPriority('medium');
        fetchJob();
        fetchRevisions();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to create revision'));
      }
    } catch (error) {
      console.error('Failed to create internal revision:', error);
      toast.error('Failed to create internal revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!job || !user) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/resume`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          adminId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Order resumed successfully!');
        fetchJob();
        fetchMessages();
        fetchAttachments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to resume order'));
        console.error('Resume failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to resume order:', error);
      toast.error('Failed to resume order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Order deleted!');
        router.push(fallbackOrdersPath);
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

  const handleCancel = async () => {
    if (!job || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setActionLoading(true);

    try {
      const response = await fetch(`/api/v2/orders/${job.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      if (response.ok) {
        toast.success('Order cancelled successfully');
        setCancelDialogOpen(false);
        setCancelReason('');
        fetchJob();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to cancel order'));
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      toast.error('Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          adminId: user?.id,
          reason: holdReason.trim() || 'Order put on hold by admin',
        }),
      });

      if (response.ok) {
        toast.success('Order put on hold');
        setHoldDialogOpen(false);
        setHoldReason('');
        fetchJob();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to put order on hold'));
      }
    } catch (error) {
      console.error('Failed to hold:', error);
      toast.error('Failed to put order on hold');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/v2/orders/${job.id}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Unassigned by admin' }),
      });

      if (response.ok) {
        toast.success('Freelancer unassigned successfully');
        fetchJob();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to unassign freelancer'));
      }
    } catch (error) {
      console.error('Failed to unassign:', error);
      toast.error('Failed to unassign freelancer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverToClient = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      // Use the proper admin deliver endpoint which handles manager delivery fee calculation
      const response = await fetch(`/api/v2/orders/${job.id}/admin/deliver`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
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

  // Handler for manager upload completion
  const handleManagerUploadComplete = async (files: Array<{url: string; name: string; size: number; mimeType: string; classification: FileClassification}>) => {
    if (!user) return;
    
    try {
      const filesWithTypes = files.map(f => ({
        ...f,
        resolvedType: resolveFileTypeForClassification(f.classification),
      }));

      const unsupported = filesWithTypes.filter(f => !f.resolvedType);
      if (unsupported.length > 0) {
        toast.error('One or more files use an unsupported classification for client delivery');
        return;
      }

      const payloadFiles = filesWithTypes.map(f => ({
        url: f.url,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        fileType: f.resolvedType!,
        fileClassification: normalizeIdentifier(f.classification) || f.classification,
      }));

      const endpoint = `/api/v2/orders/${jobId}/upload/delivery`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId: user.id,
          notes: '[DELIVERY] Manager uploaded for client delivery',
          files: payloadFiles,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save delivery files';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parse errors and stick with default message
        }
        throw new Error(errorMessage);
      }

      setUploadedFiles(prev => [...prev, ...files]);
      toast.success('Files uploaded successfully!');
      await fetchAttachments();
      await handleDeliverToClient();
    } catch (error) {
      console.error('Failed to save uploaded files:', error);
      toast.error(error instanceof Error ? error.message : 'Files uploaded but failed to save. Please try again.');
    }
  };

  const handleApproveOnBehalfOfClient = async () => {
    if (!job) return;
    
    // Confirm action
    if (!confirm('Are you sure you want to approve this order on behalf of the client? This will trigger financial calculations and update balances.')) {
      return;
    }

    setActionLoading(true);

    try {
      // Use status change endpoint - note: this may not trigger full financial calculations
      // For full financial processing, the client should approve via their own endpoint
      // This is a status change that marks the order as approved
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'approved',
          clientApproved: true,
          changedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('Order approved on behalf of client! Note: For full financial processing, client should approve via their interface.');
        fetchJob();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to approve order'));
        console.error('Approve failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestClientRevision = async () => {
    if (!job) return;
    
    const reason = prompt('Please describe what needs to be revised:');
    if (!reason?.trim()) {
      toast.error('Revision reason is required');
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`/api/v2/orders/${job.id}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          clientId: job.clientId,
          revisionNotes: reason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Client revision requested. Freelancer will be notified.');
        fetchJob();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to request revision'));
      }
    } catch (error) {
      console.error('Failed to request revision:', error);
      toast.error('Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'completed',
          changedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast.success('Order marked as completed!');
        fetchJob();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to mark order as completed'));
      }
    } catch (error) {
      console.error('Failed to mark completed:', error);
      toast.error('Failed to mark order as completed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueFine = async () => {
    if (!job || !fineAmount || !fineReason.trim()) {
      toast.error('Please provide amount and reason');
      return;
    }

    const amount = parseFloat(fineAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setActionLoading(true);

    try {
      // Determine which user to fine (freelancer or client)
      const targetUserId = job.assignedFreelancerId || job.clientId;
      if (!targetUserId) {
        toast.error('No user found to apply fine');
        return;
      }

      const response = await fetch('/api/v2/admin/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: targetUserId,
          fineAmount: amount,
          fineType: fineType,
          reason: fineReason.trim(),
          jobId: job.id,
        }),
      });

      if (response.ok) {
        toast.success(`Fine of KSh ${amount.toFixed(2)} applied successfully`);
        setFineDialogOpen(false);
        setFineAmount('');
        setFineReason('');
        setFineType('other');
        fetchJob();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to apply fine'));
      }
    } catch (error) {
      console.error('Failed to apply fine:', error);
      toast.error('Failed to apply fine');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueBonus = async () => {
    if (!job || !bonusAmount || !bonusReason.trim()) {
      toast.error('Please provide amount and reason');
      return;
    }

    const amount = parseFloat(bonusAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setActionLoading(true);

    try {
      // Use adjustments endpoint for bonus
      const response = await fetch(`/api/jobs/${job.id}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          changeType: 'client_bonus',
          amount: amount,
          notes: bonusReason.trim(),
        }),
      });

      if (response.ok) {
        toast.success(`Bonus of KSh ${amount.toFixed(2)} applied successfully`);
        setBonusDialogOpen(false);
        setBonusAmount('');
        setBonusReason('');
        fetchJob();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to apply bonus'));
      }
    } catch (error) {
      console.error('Failed to apply bonus:', error);
      toast.error('Failed to apply bonus');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteInternalRevision = async (revisionId: number) => {
    if (!job) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/v2/internal-revisions/${revisionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'accept',
          reviewNotes: revisionNotes.trim() || 'Internal revision completed',
        }),
      });

      if (response.ok) {
        toast.success('Internal revision completed');
        setInternalRevisionManagementOpen(false);
        setSelectedRevisionId(null);
        setRevisionNotes('');
        fetchJob();
        fetchRevisions();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to complete revision'));
      }
    } catch (error) {
      console.error('Failed to complete revision:', error);
      toast.error('Failed to complete revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnInternalRevision = async (revisionId: number) => {
    if (!job || !revisionNotes.trim()) {
      toast.error('Please provide notes for returning the revision');
      return;
    }
    setActionLoading(true);

    try {
      const response = await fetch(`/api/v2/internal-revisions/${revisionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'request_more',
          additionalChanges: revisionNotes.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Revision returned to freelancer');
        setInternalRevisionManagementOpen(false);
        setSelectedRevisionId(null);
        setRevisionNotes('');
        fetchJob();
        fetchRevisions();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to return revision'));
      }
    } catch (error) {
      console.error('Failed to return revision:', error);
      toast.error('Failed to return revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (file: AttributedFile) => {
    try {
      const userIdParam = user?.id ?? '';
      const url = `/api/files/download/${file.id}?role=${fileAccessRole}&userId=${userIdParam}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeliverMessage = async (messageId: number, recipientRole: 'client' | 'freelancer') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/messages/${messageId}/deliver`, {
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

  if (!user || (!isAdmin && !isManager)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unauthorized access</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Link href={fallbackOrdersPath}>
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Use role-specific status label
  const displayStatus = getStatusLabel(job.status as OrderStatus, fileAccessRole);
  const statusColorClasses = getStatusColorClasses(job.status as OrderStatus);

  const pendingMessages = (messages || []).filter(m => m.isApproved && !m.isDelivered);
  const deliveredMessages = (messages || []).filter(m => m.isDelivered);

  return (
    <div className="order-container min-h-screen py-2">
      <div className="">
        <Link href={fallbackDashboardPath}>
          <Button variant="ghost" size="sm" className="mb-2 h-7 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </Button>
        </Link>

        {/* DUAL COUNTDOWN TIMER - Compact */}
        <div className="mb-2">
          <DualCountdownTimer
            clientDeadline={job.actualDeadline || job.deadline}
            freelancerDeadline={job.freelancerDeadline}
            orderStatus={job.status}
            size="sm"
          />
        </div>

        {/* ORDER SUMMARY CARD */}
        <Card className="mb-2 border rounded-lg shadow-sm">
          <CardHeader className="py-2 px-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold mb-0.5 break-words">{job.title}</CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                  <span>ID: <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">{job.displayId}</Badge></span>
                  <span>•</span>
                  <span>{format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <Badge 
                className={`${statusColorClasses} text-[10px] px-1.5 py-0.5 capitalize`}
              >
                {displayStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-3">
            {/* Order Details Grid */}
            <div className="order-detail-grid mb-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">Work Type</Label>
                <p className="font-semibold text-[11px] capitalize">{job.workType}</p>
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Quantity</Label>
                <p className="font-semibold text-[11px]">
                  {job.pages ? `${job.pages}p` : ''}{job.pages && job.slides ? '+' : ''}{job.slides ? `${job.slides}s` : ''}
                </p>
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Client Deadline</Label>
                <p className="font-semibold text-[11px]">
                  {format(new Date(job.actualDeadline), 'MMM dd, HH:mm')}
                </p>
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Amount</Label>
                <p className="font-bold text-xs text-green-600">KSh {job.amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="order-section mb-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <Label className="text-[9px] text-muted-foreground">Client</Label>
              <div className="mt-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-[11px]">{job.clientName || 'Client'}</p>
                  <div className={`w-2 h-2 rounded-full ${clientOnline ? 'bg-green-500' : 'bg-red-500'}`} title={clientOnline ? 'Online' : 'Offline'}></div>
                </div>
                {job.clientEmail && <p className="text-[10px] text-muted-foreground">{job.clientEmail}</p>}
              </div>
            </div>

            {/* Freelancer Info (if assigned) */}
            {job.assignedFreelancerId && (
              <div className="order-section mb-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <Label className="text-[9px] text-muted-foreground">Assigned Writer</Label>
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[11px]">{job.assignedFreelancerName || 'Freelancer'}</p>
                      <div className={`w-2 h-2 rounded-full ${freelancerOnline ? 'bg-green-500' : 'bg-red-500'}`} title={freelancerOnline ? 'Online' : 'Offline'}></div>
                    </div>
                    {job.assignedFreelancerEmail && (
                      <p className="text-[10px] text-muted-foreground">{job.assignedFreelancerEmail}</p>
                    )}
                    {job.freelancerDeadline && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Deadline: {format(new Date(job.freelancerDeadline), 'MMM dd, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-2">
              <Label className="text-[9px] text-muted-foreground">Instructions</Label>
              <div className="mt-0.5 p-4 bg-muted rounded-lg text-[11px] whitespace-pre-wrap max-h-20 overflow-y-auto">
                {job.instructions}
              </div>
            </div>

            {/* STATUS-SPECIFIC ACTION BUTTONS */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t">
              {job.status === 'pending' && (
                <>
                  <Button onClick={handleApprove} disabled={actionLoading} className="gap-1.5 h-7 text-xs">
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Approve & Assign
                  </Button>
                  <Button onClick={() => setAssignDialogOpen(true)} variant="outline" className="gap-3">
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setHoldDialogOpen(true)}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4" />
                    Hold
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                    className="gap-3"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
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

              {job.status === 'accepted' && (
                <>
                  <Button onClick={() => setAssignDialogOpen(true)} className="gap-3">
                    <UserPlus className="w-4 h-4" />
                    Assign Freelancer
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setHoldDialogOpen(true)}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4" />
                    Hold
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                    className="gap-3"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}

              {job.status === 'approved' && !job.assignedFreelancerId && (
                <Button onClick={() => setAssignDialogOpen(true)} className="gap-3">
                  <UserPlus className="w-4 h-4" />
                  Assign Freelancer
                </Button>
              )}

              {job.status === 'in_progress' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleUnassign}
                    disabled={actionLoading}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                    Unassign
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setHoldDialogOpen(true)}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4" />
                    Hold
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                    className="gap-3"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}

              {['pending', 'accepted', 'assigned', 'editing', 'submitted', 'in_progress', 'internal_revision', 'on_hold', 'revision'].includes(job.status) && (
                <>
                  {/* Primary deliver button - Manager reviews freelancer's work and delivers to client */}
                  <Button 
                    onClick={handleDeliverToClient}
                    disabled={actionLoading}
                    className="gap-3 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Deliver to Client
                  </Button>
                  {job.assignedFreelancerId && !job.hasOpenInternalRevision && ['editing', 'in_progress'].includes(job.status) && (
                    <Button 
                      onClick={() => setInternalRevisionDialogOpen(true)} 
                      variant="outline" 
                      className="gap-3 border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Internal Revision
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setHoldDialogOpen(true)}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4" />
                    Hold
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                    className="gap-3"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}

              {job.status === 'delivered' && (
                <>
                  <Button 
                    onClick={handleApproveOnBehalfOfClient}
                    disabled={actionLoading}
                    className="gap-3 bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve (on behalf of client)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleRequestClientRevision}
                    disabled={actionLoading}
                    className="gap-3"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Client Revision
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setHoldDialogOpen(true)}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4" />
                    Hold
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                    className="gap-3"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}

              {job.status === 'internal_revision' && job.hasOpenInternalRevision && (
                <>
                  {(internalRevisions || []).filter(r => r.status === 'submitted' || r.status === 'open').length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const openRevision = (internalRevisions || []).find(r => r.status === 'submitted' || r.status === 'open');
                        if (openRevision) {
                          setSelectedRevisionId(openRevision.id);
                          setRevisionAction('complete');
                          setInternalRevisionManagementOpen(true);
                        }
                      }}
                      className="gap-3 border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Internal Revision
                    </Button>
                  )}
                  {(internalRevisions || []).filter(r => r.status === 'submitted').length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const submittedRevision = (internalRevisions || []).find(r => r.status === 'submitted');
                        if (submittedRevision) {
                          setSelectedRevisionId(submittedRevision.id);
                          setRevisionAction('return');
                          setInternalRevisionManagementOpen(true);
                        }
                      }}
                      className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Return to Freelancer
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setAssignDialogOpen(true)}
                    className="gap-3"
                  >
                    <UserPlus className="w-4 h-4" />
                    Reassign
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setHoldDialogOpen(true)}
                    className="gap-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4" />
                    Hold
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setCancelDialogOpen(true)}
                    className="gap-3"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}

              {(job.status === 'approved' || job.status === 'paid') && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setFineDialogOpen(true)}
                    className="gap-3 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <MinusCircle className="w-4 h-4" />
                    Fine
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setBonusDialogOpen(true)}
                    className="gap-3 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <Award className="w-4 h-4" />
                    Bonus
                  </Button>
                </>
              )}

              {job.status === 'paid' && (
                <Button 
                  onClick={handleMarkCompleted}
                  disabled={actionLoading}
                  className="gap-3 bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Mark Completed
                </Button>
              )}

              {/* Internal QC Revision Button */}
              {job.assignedFreelancerId && ['editing', 'in_progress'].includes(job.status) && !job.hasOpenInternalRevision && (
                <Button 
                  onClick={() => setInternalRevisionDialogOpen(true)} 
                  variant="outline" 
                  className="gap-3 border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <AlertCircle className="w-4 h-4" />
                  Request Internal QC Revision
                </Button>
              )}

              {job.hasOpenInternalRevision && (
                <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    ⚠️ Internal QC revision pending (hidden from client)
                  </AlertDescription>
                </Alert>
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

              {job.status === 'on_hold' && (
                <Button 
                  onClick={handleResume} 
                  disabled={actionLoading}
                  className="gap-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Resume Order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* EARNINGS CARD */}
        {job && (
          <div className="mb-4">
            <UserEarningsCard orderId={parseInt(jobId)} userRole="manager" />
          </div>
        )}

        {/* INTERNAL QC REVISIONS SECTION */}
        {internalRevisions.length > 0 && (
          <Card className="mb-4 border border-amber-500/30 shadow-sm bg-amber-50/30 dark:bg-amber-950/10 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Internal QC Revisions ({internalRevisions.length}) - Hidden from Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {internalRevisions.map((revision) => (
                  <div key={revision.id} className="p-4 bg-background rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={revision.status === 'completed' ? 'default' : 'secondary'}
                          className={revision.status === 'completed' ? 'bg-green-600' : 'bg-amber-500'}
                        >
                          {revision.status.toUpperCase()}
                        </Badge>
                        {revision.priority && (
                          <Badge variant="outline" className={
                            revision.priority === 'high' ? 'border-red-500 text-red-600' :
                            revision.priority === 'medium' ? 'border-amber-500 text-amber-600' :
                            'border-gray-400 text-gray-600'
                          }>
                            {revision.priority}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(revision.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground">Instructions:</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{revision.description}</p>
                    </div>
                    {revision.freelancerResponse && (
                      <div className="mt-3 p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                        <Label className="text-xs text-green-700 dark:text-green-300">Freelancer Response:</Label>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1 whitespace-pre-wrap">{revision.freelancerResponse}</p>
                        {revision.submittedAt && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            Submitted: {format(new Date(revision.submittedAt), 'MMM dd, HH:mm')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* BIDS SECTION */}
        {bids.length > 0 && !job.assignedFreelancerId && (
          <Card className="mb-4 border border-purple-500/30 shadow-sm rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Writer Bids ({bids.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted/50 rounded-lg border gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold">{bid.freelancerName}</span>
                        <Badge variant="outline" className="text-xs">
                          ★ {bid.freelancerRating?.toFixed(1) || 'N/A'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({bid.freelancerCompletedJobs} jobs)
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Bid Amount: <span className="font-semibold text-green-600">KSh {bid.bidAmount.toFixed(2)}</span>
                      </div>
                      {bid.message && (
                        <p className="text-sm italic text-muted-foreground bg-background p-4 rounded border">
                          "{bid.message}"
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(bid.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAssignBid(bid)}
                      className="shrink-0 bg-purple-600 hover:bg-purple-700"
                    >
                      Accept & Assign
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Instructions | All Files | Messages */}
        <Tabs defaultValue="instructions">
          <TabsList>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="files">All Files</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Instructions Tab */}
          <TabsContent value="instructions">
            <Card className="mb-2 border rounded-lg shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-semibold">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="mt-0.5 p-4 bg-muted rounded-lg text-[11px] whitespace-pre-wrap">
                  {job?.instructions || 'No instructions provided.'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Files Tab */}
          <TabsContent value="files">
            <Card className="flex flex-col shadow-sm border rounded-lg">
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
                    📁 All Files
                    <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Group: Client's Uploads (includes admin/manager/client/account_owner) */}
                <div>
                  <h3 className="text-xs font-semibold mb-2">Client's Uploads</h3>
                  <div className="space-y-2">
                    {attachments.filter(a => ['client','account_owner','admin','manager'].includes((a.uploaderRole||'').toLowerCase())).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-[11px] text-muted-foreground">{file.uploaderRole} • {file.createdAt ? format(new Date(file.createdAt), 'MMM dd, HH:mm') : ''}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>⬇️</Button>
                      </div>
                    ))}
                    {attachments.filter(a => ['client','account_owner','admin','manager'].includes((a.uploaderRole||'').toLowerCase())).length === 0 && (
                      <p className="text-xs text-muted-foreground">No uploads</p>
                    )}
                  </div>
                </div>

                {/* Group: Freelancer Uploads */}
                <div className="border-t pt-3">
                  <h3 className="text-xs font-semibold mb-2">Freelancer Uploads</h3>
                  <div className="space-y-2">
                    {attachments.filter(a => (a.uploaderRole||'').toLowerCase() === 'freelancer').map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-[11px] text-muted-foreground">{file.uploaderRole} • {file.createdAt ? format(new Date(file.createdAt), 'MMM dd, HH:mm') : ''}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>⬇️</Button>
                      </div>
                    ))}
                    {attachments.filter(a => (a.uploaderRole||'').toLowerCase() === 'freelancer').length === 0 && (
                      <p className="text-xs text-muted-foreground">No uploads</p>
                    )}
                  </div>
                </div>

                {/* Upload + Deliver Controls */}
                {job && ['editing', 'in_progress', 'submitted', 'internal_revision'].includes(job.status) && (
                  <div className="border-t pt-3 space-y-2">
                    <Button onClick={() => setUploadPopupOpen(true)} variant="outline" size="sm" className="w-full border-dashed border-blue-600 text-blue-600 hover:bg-blue-50">
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload Files for Delivery
                    </Button>
                    <Button onClick={handleDeliverToClient} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Deliver to Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            {user && (
              <Card className="shadow-sm border rounded-lg">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-semibold">Messages</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <OrderChat
                    orderId={parseInt(jobId)}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                    orderClientId={job?.clientId || 0}
                    orderFreelancerId={job?.assignedFreelancerId || null}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select freelancer" />
                </SelectTrigger>
                <SelectContent>
                  {freelancers.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name} {f.rating ? `(★ ${f.rating.toFixed(1)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* INTERNAL QC REVISION DIALOG */}
      <Dialog open={internalRevisionDialogOpen} onOpenChange={setInternalRevisionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Internal QC Revision</DialogTitle>
            <DialogDescription>
              Create quality control revision for freelancer. <strong>This is hidden from the client.</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={revisionPriority} onValueChange={(v: any) => setRevisionPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor changes</SelectItem>
                  <SelectItem value="medium">Medium - Normal QC</SelectItem>
                  <SelectItem value="high">High - Major issues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Revision Instructions *</Label>
              <Textarea
                placeholder="Describe what needs to be fixed or improved..."
                value={internalRevisionText}
                onChange={(e) => setInternalRevisionText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what needs to be changed. The freelancer will see this but the client will not.
              </p>
            </div>

            {internalRevisions.length > 0 && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  This order has {(internalRevisions || []).filter(r => r.status === 'pending').length} pending internal revision(s)
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInternalRevisionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInternalRevision} disabled={actionLoading || !internalRevisionText.trim()}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create QC Revision
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

      {/* CANCEL ORDER DIALOG */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Provide a reason for cancelling this order. This action will notify all parties.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Cancellation *</Label>
              <Textarea
                placeholder="e.g., Client requested cancellation, Quality issues, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCancelDialogOpen(false);
              setCancelReason('');
            }}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading || !cancelReason.trim()}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HOLD ORDER DIALOG */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Put Order On Hold</DialogTitle>
            <DialogDescription>
              Temporarily pause this order. You can resume it later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="e.g., Waiting for client response, Quality review needed, etc."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setHoldDialogOpen(false);
              setHoldReason('');
            }}>Cancel</Button>
            <Button onClick={handleHold} disabled={actionLoading} className="bg-orange-600 hover:bg-orange-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Put On Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FINE DIALOG */}
      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Fine</DialogTitle>
            <DialogDescription>
              Apply a fine to the freelancer or client for this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fine Type *</Label>
              <Select value={fineType} onValueChange={(v: any) => setFineType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_complaint">Client Complaint</SelectItem>
                  <SelectItem value="late_delivery">Late Delivery</SelectItem>
                  <SelectItem value="quality_issue">Quality Issue</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (KSh) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Explain why this fine is being applied..."
                value={fineReason}
                onChange={(e) => setFineReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFineDialogOpen(false);
              setFineAmount('');
              setFineReason('');
              setFineType('other');
            }}>Cancel</Button>
            <Button onClick={handleIssueFine} disabled={actionLoading || !fineAmount || !fineReason.trim()} className="bg-red-600 hover:bg-red-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Apply Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BONUS DIALOG */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Bonus</DialogTitle>
            <DialogDescription>
              Apply a bonus payment for exceptional work on this order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (KSh) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Explain why this bonus is being awarded..."
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBonusDialogOpen(false);
              setBonusAmount('');
              setBonusReason('');
            }}>Cancel</Button>
            <Button onClick={handleIssueBonus} disabled={actionLoading || !bonusAmount || !bonusReason.trim()} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Apply Bonus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INTERNAL REVISION MANAGEMENT DIALOG */}
      <Dialog open={internalRevisionManagementOpen} onOpenChange={setInternalRevisionManagementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {revisionAction === 'complete' ? 'Complete Internal Revision' : 
               revisionAction === 'return' ? 'Return to Freelancer' : 
               'Manage Internal Revision'}
            </DialogTitle>
            <DialogDescription>
              {revisionAction === 'complete' 
                ? 'Mark this internal revision as complete and ready for delivery.'
                : 'Return this revision to the freelancer with additional feedback.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRevisionId && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Revision ID: {selectedRevisionId}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>{revisionAction === 'complete' ? 'Completion Notes (Optional)' : 'Additional Changes Required *'}</Label>
              <Textarea
                placeholder={revisionAction === 'complete' 
                  ? 'Add any notes about completing this revision...'
                  : 'Describe what additional changes are needed...'}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setInternalRevisionManagementOpen(false);
              setSelectedRevisionId(null);
              setRevisionNotes('');
            }}>Cancel</Button>
            {revisionAction === 'complete' && selectedRevisionId && (
              <Button onClick={() => handleCompleteInternalRevision(selectedRevisionId)} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Complete Revision
              </Button>
            )}
            {revisionAction === 'return' && selectedRevisionId && (
              <Button onClick={() => handleReturnInternalRevision(selectedRevisionId)} disabled={actionLoading || !revisionNotes.trim()} className="bg-orange-600 hover:bg-orange-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Return to Freelancer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs: Instructions | All Files | Messages */}
      <div className="container mx-auto px-2 py-2">
        <Tabs defaultValue="instructions">
          <TabsList>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="files">All Files</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Instructions Tab */}
          <TabsContent value="instructions">
            <Card className="mb-2 border rounded-lg shadow-sm">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-semibold">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="mt-0.5 p-4 bg-muted rounded-lg text-[11px] whitespace-pre-wrap">
                  {job?.instructions || 'No instructions provided.'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Files Tab */}
          <TabsContent value="files">
            <Card className="flex flex-col shadow-sm border rounded-lg">
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-3">
                    📁 All Files
                    <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Group: Client's Uploads (includes admin/manager/client/account_owner) */}
                <div>
                  <h3 className="text-xs font-semibold mb-2">Client's Uploads</h3>
                  <div className="space-y-2">
                    {attachments.filter(a => ['client','account_owner','admin','manager'].includes((a.uploaderRole||'').toLowerCase())).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-[11px] text-muted-foreground">{file.uploaderRole} • {file.createdAt ? format(new Date(file.createdAt), 'MMM dd, HH:mm') : ''}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.open(file.fileUrl, '_blank')}>⬇️</Button>
                      </div>
                    ))}
                    {attachments.filter(a => ['client','account_owner','admin','manager'].includes((a.uploaderRole||'').toLowerCase())).length === 0 && (
                      <p className="text-xs text-muted-foreground">No uploads</p>
                    )}
                  </div>
                </div>

                {/* Group: Freelancer Uploads */}
                <div className="border-t pt-3">
                  <h3 className="text-xs font-semibold mb-2">Freelancer Uploads</h3>
                  <div className="space-y-2">
                    {attachments.filter(a => (a.uploaderRole||'').toLowerCase() === 'freelancer').map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <p className="text-[11px] text-muted-foreground">{file.uploaderRole} • {file.createdAt ? format(new Date(file.createdAt), 'MMM dd, HH:mm') : ''}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.open(file.fileUrl, '_blank')}>⬇️</Button>
                      </div>
                    ))}
                    {attachments.filter(a => (a.uploaderRole||'').toLowerCase() === 'freelancer').length === 0 && (
                      <p className="text-xs text-muted-foreground">No uploads</p>
                    )}
                  </div>
                </div>

                {/* Upload + Deliver Controls */}
                {job && ['editing', 'in_progress', 'submitted', 'internal_revision'].includes(job.status) && (
                  <div className="border-t pt-3 space-y-2">
                    <Button onClick={() => setUploadPopupOpen(true)} variant="outline" size="sm" className="w-full border-dashed border-blue-600 text-blue-600 hover:bg-blue-50">
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload Files for Delivery
                    </Button>
                    <Button onClick={handleDeliverToClient} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Deliver to Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            {user && (
              <Card className="shadow-sm border rounded-lg">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-semibold">Messages</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <OrderChat
                    orderId={parseInt(jobId)}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                    orderClientId={job?.clientId || 0}
                    orderFreelancerId={job?.assignedFreelancerId || null}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* FILE UPLOAD POPUP FOR MANAGER */}
      <FileUploadPopup
        open={uploadPopupOpen}
        onOpenChange={setUploadPopupOpen}
        onUploadComplete={handleManagerUploadComplete}
        jobId={parseInt(jobId)}
        title="Upload & Deliver to Client"
        userRole="manager"
        allowedClassifications={FINAL_ALLOWED_CLASSIFICATIONS}
      />
    </div>
  );
}
