"use client";

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, FileText, Download, DollarSign, Calendar, User, MessageSquare,
  UploadCloud, CheckCircle, AlertCircle, XCircle, Clock, Loader2, Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileListSection, AttributedFile } from '@/components/attributed-file-display';
import { OrderChat } from '@/components/order-chat';
import { getStatusLabel, getStatusColorClasses } from '@/lib/status-display';

type Job = {
  id: number;
  displayId: string;
  orderNumber?: string;
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
  estimatedAmount?: number;
  actualPaymentAmount?: number | null;
  deadline: string;
  actualDeadline: string;
  freelancerDeadline?: string;
  status: string;
  assignedFreelancerId: number | null;
  assignedFreelancerName?: string;
  assignedFreelancerEmail?: string;
  assignedFreelancerRating?: number | null;
  managerId?: number | null;
  managerName?: string;
  adminApproved: boolean;
  clientApproved: boolean;
  paymentConfirmed: boolean;
  revisionRequested?: boolean;
  revisionNotes?: string;
  requiresReports?: boolean;
  createdAt: string;
  updatedAt?: string;
};

type OrderRevision = {
  id: number;
  orderId: number;
  revisionType: 'client' | 'internal';
  description: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  requestedByName: string | null;
};

type OrderAdjustment = {
  id: number;
  type: string;
  amount: number;
  previousTotal: number;
  newTotal: number;
  reason: string;
  status: string;
  requestedBy: string;
  requestedByRole: string;
  appliedAt: string | null;
  createdAt: string;
  statusDescription: string;
};


const SERVICE_CATALOG: Record<string, { rate: number; type: string; name: string }> = {
  'essay': { name: 'Essay', rate: 240, type: 'page' },
  'assignment': { name: 'Assignment', rate: 240, type: 'page' },
  'research-proposal': { name: 'Research Proposal', rate: 240, type: 'page' },
  'presentation': { name: 'Presentation', rate: 150, type: 'slide' },
  'data-analysis': { name: 'Data Analysis', rate: 270, type: 'dataset' },
  'other': { name: 'Other', rate: 240, type: 'page' },
};

export default function ClientJobDetailPageRedesigned() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<OrderRevision[]>([]);
  const [adjustments, setAdjustments] = useState<OrderAdjustment[]>([]);

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pesapal' | 'till'>('pesapal');
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [mpesaCode, setMpesaCode] = useState(''); // For Till payment confirmation
  const [unifiedPaymentOpen, setUnifiedPaymentOpen] = useState(false);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    instructions: '',
    workType: '',
    pages: '',
    slides: '',
    amount: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);

  // Cancel order dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/login');
        return;
      }
    }
  }, [user, authLoading, router]);

  const orderRole = user?.role === 'account_owner' ? 'account_owner' : 'client';

  const {
    order: liveOrder,
    client: liveClient,
    writer: liveWriter,
    attachments: liveAttachments,
    payments: livePayments,
    loading: orderDataLoading,
    refresh: refreshOrderData,
  } = useOrderData(jobId, { role: orderRole, pollInterval: 5000 });

  useEffect(() => {
    if (orderDataLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [orderDataLoading]);

  // Fetch order revisions (only client-requested ones are visible to client)
  useEffect(() => {
    const fetchRevisions = async () => {
      if (!jobId || !user) return;
      
      try {
        const token = localStorage.getItem('bearer_token');
        const response = await fetch(`/api/v2/revisions?orderId=${jobId}&type=client`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setRevisions(data.revisions || []);
        }
      } catch (error) {
        console.error('Failed to fetch revisions:', error);
      }
    };

    fetchRevisions();
  }, [jobId, user]);

  // Fetch order adjustments (price changes visible to client)
  useEffect(() => {
    const fetchAdjustments = async () => {
      if (!jobId || !user) return;
      
      try {
        const token = localStorage.getItem('bearer_token');
        const response = await fetch(`/api/v2/orders/${jobId}/adjustments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setAdjustments(data.adjustments || []);
        }
      } catch (error) {
        console.error('Failed to fetch adjustments:', error);
      }
    };

    fetchAdjustments();
  }, [jobId, user]);

  useEffect(() => {
    if (!liveOrder) return;
    if (!liveClient) return;

    // Access check: Client can only see their own orders, account_owner can see all
    if (
      user &&
      user.role !== 'account_owner' &&
      liveClient.id !== user.id
    ) {
      toast.error('Order not found or access denied');
      router.push('/client/dashboard');
      return;
    }

    const orderObj = liveOrder || {};
    
    // Determine the correct amount to display:
    // Priority: actual payment -> estimated amount -> fallback 0
    const actualAmount = orderObj?.actualPaymentAmount 
      ?? livePayments?.[0]?.amount 
      ?? orderObj?.amount 
      ?? 0;
    
    const mappedJob: Job = {
      id: orderObj.id,
      displayId: orderObj.displayId || orderObj.orderNumber || `TL-${orderObj.id}`,
      orderNumber: orderObj.orderNumber,
      clientId: liveClient.id,
      clientName: liveClient.name,
      clientEmail: liveClient.email,
      title: orderObj.title || 'Untitled Order',
      instructions: orderObj.instructions || 'No instructions provided',
      workType: orderObj.workType || 'writing',
      pages: orderObj.pages ?? null,
      slides: orderObj.slides ?? null,
      amount: Number(actualAmount) || 0,
      estimatedAmount: orderObj.estimatedAmount ?? orderObj.amount,
      actualPaymentAmount: orderObj.actualPaymentAmount,
      deadline: orderObj.deadline || new Date().toISOString(),
      actualDeadline: orderObj.actualDeadline || orderObj.deadline || new Date().toISOString(),
      freelancerDeadline: orderObj.freelancerDeadline,
      status: orderObj.status || 'pending',
      assignedFreelancerId: liveWriter?.id || orderObj.assignedFreelancerId || null,
      assignedFreelancerName: liveWriter?.name || orderObj.assignedFreelancerName,
      assignedFreelancerEmail: liveWriter?.email || orderObj.assignedFreelancerEmail,
      assignedFreelancerRating: liveWriter?.rating ?? orderObj.assignedFreelancerRating ?? null,
      managerId: orderObj.managerId,
      adminApproved: Boolean(orderObj.adminApproved),
      clientApproved: Boolean(orderObj.clientApproved),
      paymentConfirmed: Boolean(orderObj.paymentConfirmed),
      revisionRequested: Boolean(orderObj.revisionRequested),
      revisionNotes: orderObj.revisionNotes,
      requiresReports: Boolean(orderObj.requiresReports),
      createdAt: orderObj.createdAt || new Date().toISOString(),
      updatedAt: orderObj.updatedAt,
    };
    setJob(mappedJob);
  }, [liveOrder, liveClient, livePayments, liveWriter, router, user]);

  useEffect(() => {
    if (!Array.isArray(liveAttachments)) {
      setAttachments([]);
      return;
    }
    
    // Normalize file attachments with proper type handling
    const normalized: AttributedFile[] = liveAttachments.map((file: any) => ({
      id: file.id || Math.random().toString(36).substr(2, 9),
      fileName: file.fileName || file.name || 'Unknown File',
      fileUrl: file.fileUrl || file.url || '',
      fileSize: Number(file.fileSize || file.size) || 0,
      fileType: file.fileType || file.mimeType || 'application/octet-stream',
      uploadedBy: file.uploadedBy || file.uploaderId || 0,
      uploaderName: file.uploaderName || file.uploader || 'Unknown',
      uploaderRole: (file.uploaderRole || file.role || 'unknown').toLowerCase(),
      uploadType: file.uploadType || file.fileClassification || 'additional',
      createdAt: file.createdAt || file.uploadedAt || new Date().toISOString(),
      fileClassification: file.fileClassification || file.uploadType || null,
    }));
    
    // Remove duplicates by id
    const uniqueFiles = Array.from(new Map(normalized.map(f => [f.id, f])).values());
    setAttachments(uniqueFiles);
  }, [liveAttachments]);


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include', // 🔴 CRITICAL: Include auth cookies
        });

        if (!uploadResponse.ok) throw new Error(`Failed to upload ${file.name}`);

        const uploadData = await uploadResponse.json();

        const attachmentResponse = await fetch(`/api/jobs/${jobId}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: parseInt(jobId),
            uploadedBy: user?.id,
            fileName: file.name,
            fileUrl: uploadData.url,
            fileSize: file.size,
            fileType: file.type,
            uploadType: 'initial',
          }),
        });

        if (!attachmentResponse.ok) throw new Error(`Failed to save ${file.name} metadata`);
        
        const savedFile = await attachmentResponse.json();
        uploadedFiles.push(savedFile);
      }

      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`);
      
      // Force immediate refresh with a small delay to ensure DB write is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshOrderData();
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };


  const handleDownload = (file: AttributedFile) => {
    try {
      const url = `/api/files/download/${file.id}?role=client&userId=${user?.id}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  // Calculate total amount including bonus
  const totalPaymentAmount = job ? Math.round(job.amount) + (bonusAmount || 0) : 0;

  const handlePaymentInitiate = async () => {
    if (!job) return;
    
    const inputPhone = phoneNumber?.trim();
    if (!inputPhone) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    setPaymentProcessing(true);

    try {
      // Format phone number
      const raw = inputPhone.replace(/[\s-]/g, '').replace(/^\+/, '');
      let formattedPhone = raw;
      
      if (/^0[17]\d{8}$/.test(raw)) {
        formattedPhone = '254' + raw.slice(1);
      } else if (/^[17]\d{8}$/.test(raw)) {
        formattedPhone = '254' + raw;
      } else if (/^254[17]\d{8}$/.test(raw)) {
        formattedPhone = raw;
      } else {
        setPaymentProcessing(false);
        toast.error('Please enter a valid Kenyan phone number');
        return;
      }

      if (paymentMethod === 'pesapal') {
        // Pesapal STK Push (primary method)
        const response = await fetch('/api/v2/payments/pesapal/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phoneNumber: formattedPhone,  // Match API expected field name
            amount: Math.round(job.amount),
            bonusAmount: bonusAmount || 0,
            jobId: job.id,
            type: 'order', // Payment for order
            description: `Payment for Order ${job.displayId}`,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success('Payment request sent! Check your phone to complete M-Pesa payment.', {
            duration: 10000,
          });
          
          // Poll for payment status
          setTimeout(() => {
            refreshOrderData();
            setPaymentProcessing(false);
          }, 30000);
        } else {
          toast.error(extractErrorMessage(data, 'Failed to initiate Pesapal payment'));
          setPaymentProcessing(false);
        }
      } else if (paymentMethod === 'till') {
        // Till payment (manual M-Pesa confirmation)
        if (!mpesaCode?.trim()) {
          setPaymentProcessing(false);
          toast.error('Please enter the M-Pesa confirmation code');
          return;
        }

        const response = await fetch('/api/v2/payments/till/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phoneNumber: formattedPhone,  // Match API expected field name
            amount: Math.round(job.amount),
            bonusAmount: bonusAmount || 0,
            jobId: job.id,
            mpesaCode: mpesaCode.trim().toUpperCase(),
            type: 'order',
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success('Payment recorded! Admin will verify your M-Pesa payment.', {
            duration: 8000,
          });
          setMpesaCode('');
          setTimeout(() => {
            refreshOrderData();
            setPaymentProcessing(false);
          }, 3000);
        } else {
          toast.error(extractErrorMessage(data, 'Failed to record Till payment'));
          setPaymentProcessing(false);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!job) return;
    
    // Payment check is now handled by the backend based on client's payment terms (POA vs POD)
    // POA clients must pay first, POD clients can approve then pay

    try {
      const response = await fetch(`/api/v2/orders/${job.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
      });

      if (response.ok) {
        toast.success('Work approved! Order completed. Freelancer and manager balances updated.');
        await refreshOrderData();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to approve work'));
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve work');
    }
  };

  const handleRequestRevision = async () => {
    if (!job || !user) return;
    
    const reason = prompt('Please describe what needs to be revised:');
    if (!reason?.trim()) {
      toast.error('Revision reason is required');
      return;
    }

    try {
      const response = await fetch(`/api/v2/orders/${job.id}/request-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({ 
          clientId: user.id,
          revisionNotes: reason.trim() 
        }),
      });

      if (response.ok) {
        toast.success('Revision requested. Freelancer will be notified.');
        await refreshOrderData();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to request revision'));
      }
    } catch (error) {
      console.error('Failed to request revision:', error);
      toast.error('Failed to request revision');
    }
  };

  // Compute client-facing status display from actual status
  const displayStatus = job ? getClientFacingStatus(job.status as any, !!job.clientApproved) : 'Loading...';

  const handleOpenEditDialog = () => {
    if (!job) return;
    
    setEditFormData({
      title: job.title,
      instructions: job.instructions,
      workType: job.workType,
      pages: job.pages?.toString() || '',
      slides: job.slides?.toString() || '',
      amount: job.amount.toString(),
      deadline: job.actualDeadline ? new Date(job.actualDeadline).toISOString().slice(0, 16) : '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!job) return;

    if (!editFormData.title.trim() || !editFormData.instructions.trim()) {
      toast.error('Title and instructions are required');
      return;
    }

    const amount = parseFloat(editFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!editFormData.deadline) {
      toast.error('Deadline is required');
      return;
    }

    setSaving(true);

    try {
      const updatePayload: any = {
        title: editFormData.title.trim(),
        instructions: editFormData.instructions.trim(),
        workType: editFormData.workType,
        amount: parseFloat(editFormData.amount),
        deadline: new Date(editFormData.deadline).toISOString(),
      };

      const service = SERVICE_CATALOG[editFormData.workType.toLowerCase().replace(/\s+/g, '-')];
      if (service?.type === 'page') {
        updatePayload.pages = editFormData.pages ? parseFloat(editFormData.pages) : null;
        updatePayload.slides = null;
      } else if (service?.type === 'slide') {
        updatePayload.slides = editFormData.slides ? parseInt(editFormData.slides) : null;
        updatePayload.pages = null;
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        toast.success('Order updated successfully!');
        setEditDialogOpen(false);
        await refreshOrderData();
      } else {
        const errorData = await response.json();
        toast.error(extractErrorMessage(errorData, 'Failed to update order'));
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!job || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setCancelling(true);

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
        await refreshOrderData();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to cancel order'));
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // Show loading state while auth or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Check authentication after loading
  if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unauthorized access</p>
          <Link href="/client/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Link href="/client/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = ['pending', 'editing'].includes(job.status) || job.status === 'editing';

  const clientFiles = (attachments || []).filter(a => 
    ['client', 'account_owner'].includes(a.uploaderRole?.toLowerCase() || '')
  );
  
  // Filter writer files - ONLY show files uploaded by admin/manager to clients
  // Clients should never see direct freelancer uploads for privacy/quality control
  const writerFiles = (attachments || []).filter(a => {
    const uploaderRole = a.uploaderRole?.toLowerCase() || '';
    // Only show admin/manager uploads - they verify and deliver work to clients
    return ['admin', 'manager'].includes(uploaderRole);
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-2 sm:px-3 py-3 max-w-7xl">
        <Link href="/client/dashboard">
          <Button variant="ghost" size="sm" className="mb-2 h-7 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </Button>
        </Link>

        {/* COUNTDOWN TIMER - Compact */}
        <div className="mb-2">
          <ProminentCountdownTimer
            deadline={job.actualDeadline || job.deadline}
            label="Order Deadline"
            size="sm"
            orderStatus={job.status}
          />
        </div>

        {/* ORDER DETAILS CARD */}
        <Card className="mb-2 border rounded-lg shadow-sm">
          <CardHeader className="py-2 px-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold mb-0.5 break-words">{job.title}</CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                  <span>ID: <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">{job.displayId}</Badge></span>
                  <span>•</span>
                  <span>{format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge 
                  variant={displayStatus === 'completed' ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 py-0.5 capitalize"
                >
                  {displayStatus}
                </Badge>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenEditDialog}
                    className="gap-1 h-6 text-[10px] px-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
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
                <Label className="text-[9px] text-muted-foreground">Deadline</Label>
                <p className="font-semibold text-[11px]">
                  {format(new Date(job.actualDeadline), 'MMM dd, HH:mm')}
                </p>
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Amount</Label>
                <p className="font-bold text-xs text-green-600">KSh {job.amount.toFixed(2)}</p>
              </div>
            </div>
            
            {job.assignedFreelancerId && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-2">
                <Label className="text-[9px] text-muted-foreground">Assigned Writer</Label>
                <div className="mt-0.5 flex items-center justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[11px] truncate">{job.assignedFreelancerName || 'Professional Writer'}</p>
                  </div>
                  {job.assignedFreelancerRating && (
                    <Badge className="bg-yellow-500 text-white flex-shrink-0 text-[9px] px-1">
                      ★ {job.assignedFreelancerRating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-[9px] text-muted-foreground">Instructions</Label>
              <div className="mt-0.5 p-3 bg-muted rounded-lg text-[11px] whitespace-pre-wrap leading-relaxed">
                {job.instructions}
              </div>
            </div>

            {/* PROMINENT PAYMENT CARD - Shows for all active orders until paid */}
            {!job.paymentConfirmed && ['in_progress', 'submitted', 'editing', 'delivered', 'approved'].includes(job.status) && (
              <div className="mt-2 pt-2 border-t">
                <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/30 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground mb-0.5">
                        {job.status === 'delivered' ? 'Work Delivered - Complete Payment' : 'Order Payment'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {job.status === 'delivered' 
                          ? 'Payment required before approving work' 
                          : 'Pay now to ensure smooth order processing'}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary whitespace-nowrap">
                      KSh {Math.round(job.amount).toLocaleString()}
                    </p>
                  </div>
                  
                  {job.status === 'delivered' && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-[10px]">Add Bonus/Tip (Optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          placeholder="0"
                          value={bonusAmount || ''}
                          onChange={(e) => setBonusAmount(parseInt(e.target.value) || 0)}
                          className="text-center mt-1 h-8 text-sm"
                        />
                      </div>
                      {bonusAmount > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground">Total:</p>
                          <p className="text-sm font-bold text-primary">
                            KSh {(Math.round(job.amount) + bonusAmount).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => setUnifiedPaymentOpen(true)}
                    size="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Now - KSh {(Math.round(job.amount) + bonusAmount).toLocaleString()}
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Confirmed Badge */}
            {job.paymentConfirmed && (
              <div className="mt-3 pt-3 border-t">
                <div className="p-2.5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-300 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-semibold text-green-900 dark:text-green-100">Payment Confirmed</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">KSh {Math.round(job.amount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* STATUS-SPECIFIC ACTIONS */}
            {(job.status === 'pending' || job.status === 'accepted') && (
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  size="default"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            )}

            {/* Cancel button for in_progress orders */}
            {job.status === 'in_progress' && (
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(true)}
                  size="default"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Request Cancellation
                </Button>
              </div>
            )}

            {/* Delivered Status Actions */}
            {job.status === 'delivered' && !job.clientApproved && (
              <div className="mt-3 pt-3 border-t">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Review the delivered work and choose an action:
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleApprove} size="default" className="flex-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Work
                    </Button>
                    <Button onClick={handleRequestRevision} size="default" variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Request Revision
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Status - Can still request revision */}
            {job.status === 'approved' && !job.paymentConfirmed && (
              <div className="mt-3 pt-3 border-t">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-300 dark:border-amber-700 space-y-2">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                    Order Approved - Complete Payment to Finalize
                  </p>
                  <Button
                    onClick={() => setUnifiedPaymentOpen(true)}
                    size="default"
                    className="w-full"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay KSh {Math.round(job.amount).toLocaleString()}
                  </Button>
                </div>
              </div>
            )}

            {/* Completed Order Info */}
            {(job.status === 'completed' || job.status === 'paid') && (
              <div className="mt-3 pt-3 border-t">
                <div className="p-2.5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-300 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                      {job.status === 'completed' ? 'Order Completed Successfully!' : 'Payment Confirmed - Order Finalizing'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment button for on-hold orders */}
            {job.status === 'on_hold' && !job.paymentConfirmed && (
              <div className="mt-4 pt-4 border-t">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-300 dark:border-amber-700 space-y-3">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Order On Hold - Payment Required
                  </p>
                  <Button
                    onClick={() => setUnifiedPaymentOpen(true)}
                    size="lg"
                    className="w-full"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pay KSh {Math.round(job.amount).toLocaleString()}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FINANCIALS CARD */}
        <div className="mb-6">
          <OrderFinancialsCard orderId={parseInt(jobId)} userRole="client" variant="compact" />
        </div>

        {/* REVISION HISTORY TIMELINE - COMPACT */}
        {revisions.length > 0 && (
          <Card className="mb-4 shadow-sm">
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">Revisions</CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{revisions.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4.5">
              <div className="relative pl-4">
                {/* Timeline line */}
                <div className="absolute left-1 top-1 bottom-1 w-px bg-border" />
                
                {/* Revision items */}
                <div className="space-y-2">
                  {revisions.map((revision, index) => (
                    <div key={revision.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-3 top-1 w-2 h-2 rounded-full ${
                        revision.status === 'completed' 
                          ? 'bg-green-500' 
                          : revision.status === 'in_progress'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      }`} />
                      
                      {/* Revision content - compact */}
                      <div className="bg-muted/40 rounded-lg p-4.5 border border-border/50">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-xs">#{revisions.length - index}</span>
                            <Badge variant={
                              revision.status === 'completed' ? 'default' :
                              revision.status === 'in_progress' ? 'secondary' :
                              'outline'
                            } className="text-[10px] px-1.5 py-0 h-4 capitalize">
                              {revision.status === 'completed' ? '✓ Done' : revision.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(revision.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{revision.description}</p>
                        {revision.completedAt && (
                          <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Completed {format(new Date(revision.completedAt), 'MMM dd, HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PRICE ADJUSTMENT HISTORY - COMPACT */}
        {adjustments.length > 0 && (
          <Card className="mb-4 shadow-sm">
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">Adjustments</CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{adjustments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4.5">
              <div className="space-y-1.5">
                {adjustments.map((adjustment) => (
                  <div 
                    key={adjustment.id} 
                    className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        adjustment.type === 'discount' || adjustment.type === 'refund'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                          : adjustment.type === 'additional'
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                      }`}>
                        {adjustment.type === 'discount' || adjustment.type === 'refund' ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : adjustment.type === 'additional' ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : (
                          <Minus className="w-2.5 h-2.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-xs capitalize">
                            {adjustment.type.replace('_', ' ')}
                          </span>
                          <Badge variant={
                            adjustment.status === 'applied' ? 'default' :
                            adjustment.status === 'pending' ? 'secondary' :
                            adjustment.status === 'rejected' ? 'destructive' :
                            'outline'
                          } className="text-[9px] px-1 py-0 h-3.5">
                            {adjustment.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{adjustment.reason}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`font-semibold text-xs ${
                        adjustment.type === 'discount' || adjustment.type === 'refund'
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {adjustment.type === 'discount' || adjustment.type === 'refund' ? '-' : '+'}
                        KSh {Math.abs(adjustment.amount).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CHAT & FILES - TWO COLUMN LAYOUT */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* CHAT SECTION */}
          {user && (
            <OrderChat
              orderId={parseInt(jobId)}
              currentUserId={user.id}
              currentUserRole={user.role}
              orderClientId={job.clientId}
              orderFreelancerId={job.assignedFreelancerId}
            />
          )}

          {/* FILES SECTION - COMPACT */}
          <Card className="h-[500px] flex flex-col shadow-sm">
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-semibold">Files</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4.5 space-y-3">
              {/* Your Files Section */}
              <FileListSection
                title="Your Files"
                files={clientFiles}
                onDownload={handleDownload}
                showAttribution={false}
                colorScheme="blue"
                emptyMessage="No files uploaded yet"
              />

              {/* Upload Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-primary mb-3">Upload Files</h3>
                
                {selectedFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-2">Selected ({selectedFiles.length}/10)</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 text-xs bg-muted p-4 rounded border">
                          <Paperclip className="w-4 h-4" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(index)}
                            className="h-5 w-5 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 10 || uploading}
                    className="flex-1"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Select ({selectedFiles.length}/10)
                  </Button>
                  
                  <Button
                    onClick={handleUploadFiles}
                    disabled={selectedFiles.length === 0 || uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Delivered Files Section */}
              <div className="border-t pt-4">
                <FileListSection
                  title="Delivered Files"
                  files={writerFiles}
                  onDownload={handleDownload}
                  showAttribution={true}
                  showUploadType={true}
                  colorScheme="green"
                  emptyMessage="No files delivered yet"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT ORDER DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Update your order details. All fields are required.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Order title"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-workType">Work Type *</Label>
              <Select
                value={editFormData.workType}
                onValueChange={(value) => setEditFormData({ ...editFormData, workType: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Essay">Essay</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Research Proposal">Research Proposal</SelectItem>
                  <SelectItem value="Presentation">Presentation</SelectItem>
                  <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pages">Pages</Label>
                <Input
                  id="edit-pages"
                  type="number"
                  min="0"
                  step="0.1"
                  value={editFormData.pages}
                  onChange={(e) => setEditFormData({ ...editFormData, pages: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slides">Slides</Label>
                <Input
                  id="edit-slides"
                  type="number"
                  min="0"
                  value={editFormData.slides}
                  onChange={(e) => setEditFormData({ ...editFormData, slides: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (KSh) *</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline *</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={editFormData.deadline}
                onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Instructions *</Label>
              <Textarea
                id="edit-instructions"
                rows={6}
                value={editFormData.instructions}
                onChange={(e) => setEditFormData({ ...editFormData, instructions: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="gap-3">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4" />Save Changes</>
              )}
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
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Cancellation *</Label>
              <Textarea
                placeholder="Please explain why you're cancelling this order..."
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
            }} disabled={cancelling}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling || !cancelReason.trim()}>
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Payment Dialog */}
      {job && (
        <UnifiedPaymentDialog
          open={unifiedPaymentOpen}
          onOpenChange={setUnifiedPaymentOpen}
          orderId={job.id}
          orderDisplayId={job.displayId}
          amount={Math.round(job.amount)}
          bonusAmount={bonusAmount}
          description={`Payment for Order ${job.displayId}`}
          type="order"
          defaultPhoneNumber={user?.phone || ''}
          customerName={user?.name || ''}
          customerEmail={user?.email || ''}
          clientId={user?.clientId || String(user?.id || '')}
          onSuccess={() => {
            refreshOrderData();
            setBonusAmount(0);
          }}
        />
      )}
    </div>
  );
}
