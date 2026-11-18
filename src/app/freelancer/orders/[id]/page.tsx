"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Send, Loader2, Upload, CheckCircle, AlertCircle, XCircle,
  Clock, FileText, Download, DollarSign, Calendar, User, MessageSquare,
  HelpCircle, UploadCloud
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { getFreelancerEarnings } from '@/lib/order-pricing';
import { ProminentCountdownTimer } from '@/components/prominent-countdown-timer';
import { FileListSection, AttributedFile } from '@/components/attributed-file-display';
import { OrderChat } from '@/components/order-chat';
import { FileUploadPopup, FileClassification } from '@/components/file-upload-popup';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ============================================
// TYPE DEFINITIONS
// ============================================

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
  freelancerEarnings?: number;
  deadline: string;
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  managerId?: number | null;
  adminApproved: boolean;
  clientApproved: boolean;
  paymentConfirmed: boolean;
  createdAt: string;
  updatedAt?: string;
  requiresReports?: boolean;
  freelancerAccepted?: boolean;
  freelancerRejected?: boolean;
  freelancerResponsePending?: boolean;
  revisionRequested?: boolean;
  revisionNotes?: string;
  editorStatus?: string;
  hasOpenInternalRevision?: boolean;
};

// ============================================
// STATUS CLASSIFICATION HELPERS
// ============================================

// Status where freelancer can bid
const BIDDING_STATUSES = ['accepted'];

// Status where freelancer needs to accept/reject assignment - REMOVED (auto-assigned now)
const ASSIGNMENT_PENDING_STATUSES: string[] = []; // Empty - no pending assignment state

// Status where freelancer can work and upload files
const WORKING_STATUSES = ['in_progress', 'revision', 'internal_revision', 'client_revision'];

// Status where work is submitted and awaiting review
const REVIEW_STATUSES = ['editing'];

// Status where work is delivered or complete
const COMPLETED_STATUSES = ['delivered', 'approved', 'completed', 'paid'];

// Final classification file identifiers
const FINAL_CLASSIFICATION_IDENTIFIERS = new Set([
  'final_work', 'final_paper', 'completed_paper', 'completed_smart_paper',
  'final_document', 'final_submission',
]);

const PLAGIARISM_CLASSIFICATION_IDENTIFIERS = new Set([
  'plagiarism_report', 'plag_report', 'turnitin_report',
]);

const AI_CLASSIFICATION_IDENTIFIERS = new Set([
  'ai_report', 'ai_detection_report',
]);

// Allowed file classifications
const FINAL_ALLOWED_CLASSIFICATIONS = [
  'completed_paper', 'completed_smart_paper', 'plagiarism_report', 'ai_report',
  'abstract', 'detailed_outline', 'graphics_tables', 'printable_source',
] satisfies FileClassification[];

const REVISION_ALLOWED_CLASSIFICATIONS = [
  'revision_file', ...FINAL_ALLOWED_CLASSIFICATIONS,
] satisfies FileClassification[];

// ============================================
// HELPER FUNCTIONS
// ============================================

const normalizeIdentifier = (value?: string | null) => (value ? value.toLowerCase().trim() : '');

const getDisplayStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'accepted': 'Available for Bidding',
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'in-progress': 'In Progress',
    'editing': 'Under Review',
    'revision': 'Revision Required',
    'internal_revision': 'Revision Required',
    'client_revision': 'Client Revision',
    'delivered': 'Delivered',
    'approved': 'Approved',
    'completed': 'Completed',
    'paid': 'Paid',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
    'on_hold': 'On Hold',
    'on-hold': 'On Hold',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getStatusColor = (status: string): string => {
  if (BIDDING_STATUSES.includes(status)) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (ASSIGNMENT_PENDING_STATUSES.includes(status)) return 'bg-purple-100 text-purple-800 border-purple-300';
  if (WORKING_STATUSES.includes(status)) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (REVIEW_STATUSES.includes(status)) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (COMPLETED_STATUSES.includes(status)) return 'bg-green-100 text-green-800 border-green-300';
  if (['cancelled', 'canceled'].includes(status)) return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function FreelancerOrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  // Core state
  const [order, setOrder] = useState<Order | null>(null);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Earnings calculation
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);

  // Bidding state
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [hasExistingBid, setHasExistingBid] = useState(false);

  // File upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [hasFinalFiles, setHasFinalFiles] = useState(false);
  const [hasPlagiarismReport, setHasPlagiarismReport] = useState(false);
  const [hasAiReport, setHasAiReport] = useState(false);

  // Submission checklist
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklist, setChecklist] = useState({
    finalDocument: false,
    reportsIncluded: false,
    qualityChecked: false,
    formattingCorrect: false,
    deadlineMet: false,
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchOrder = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return;
    
    const silent = options?.silent || false;
    
    try {
      const response = await safeApiFetch(`/api/v2/orders/${jobId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load order' }));
        console.error('[Freelancer Order Detail] Failed to load:', response.status, errorData);
        if (!silent) {
          toast.error(extractErrorMessage(errorData, 'Failed to load order'));
          router.push('/freelancer/dashboard');
        }
        return;
      }

      const data = await response.json();
      if (!data?.order) {
        if (!silent) {
          toast.error('Order not found');
          router.push('/freelancer/dashboard');
        }
        return;
      }

      const orderObj = data.order;
      const clientData = data.client;
      
      // Map API response to Order type with proper null handling
      const mappedOrder: Order = {
        id: orderObj.id,
        displayId: orderObj.displayId || orderObj.orderNumber || `TL-${orderObj.id}`,
        orderNumber: orderObj.orderNumber,
        clientId: clientData?.id || orderObj.clientId || 0,
        clientName: clientData?.name || 'Client',
        title: orderObj.title || 'Untitled Order',
        instructions: orderObj.instructions || 'No instructions provided',
        workType: orderObj.workType || 'writing',
        pages: orderObj.pages ?? null,
        slides: orderObj.slides ?? null,
        amount: Number(orderObj.amount) || 0,
        freelancerEarnings: orderObj.freelancerEarnings,
        deadline: orderObj.deadline || new Date().toISOString(),
        actualDeadline: orderObj.actualDeadline || orderObj.deadline || new Date().toISOString(),
        freelancerDeadline: orderObj.freelancerDeadline || orderObj.actualDeadline || orderObj.deadline || new Date().toISOString(),
        status: orderObj.status || 'pending',
        assignedFreelancerId: orderObj.assignedFreelancerId ?? null,
        managerId: orderObj.managerId,
        adminApproved: Boolean(orderObj.adminApproved),
        clientApproved: Boolean(orderObj.clientApproved),
        paymentConfirmed: Boolean(orderObj.paymentConfirmed),
        createdAt: orderObj.createdAt || new Date().toISOString(),
        updatedAt: orderObj.updatedAt,
        requiresReports: Boolean(orderObj.requiresReports),
        freelancerAccepted: Boolean(orderObj.freelancerAccepted),
        freelancerRejected: Boolean(orderObj.freelancerRejected),
        freelancerResponsePending: Boolean(orderObj.freelancerResponsePending),
        revisionRequested: Boolean(orderObj.revisionRequested),
        revisionNotes: orderObj.revisionNotes || '',
        editorStatus: orderObj.editorStatus,
        hasOpenInternalRevision: Boolean(orderObj.hasOpenInternalRevision),
      };

      setOrder(mappedOrder);

      // Check for existing bid if order is available
      if (orderObj.status === 'accepted' && !orderObj.assignedFreelancerId) {
        try {
          const bidRes = await safeApiFetch(`/api/bids?freelancerId=${user.id}&jobId=${jobId}`, {
            credentials: 'include',
          });
          if (bidRes.ok) {
            const bids = await bidRes.json();
            setHasExistingBid(Array.isArray(bids) && bids.length > 0);
          }
        } catch (err) {
          console.warn('Failed to check existing bids:', err);
        }
      }

    } catch (error) {
      console.error('Failed to fetch order:', error);
      if (!silent) {
        toast.error('Error loading order');
        router.push('/freelancer/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [user, jobId, router]);

  const fetchAttachments = useCallback(async () => {
    if (!user) return;

    try {
      const [v2Res, legacyRes] = await Promise.all([
        safeApiFetch(`/api/v2/orders/${jobId}/files?role=freelancer&userId=${user.id}`, {
          credentials: 'include',
        }),
        safeApiFetch(`/api/jobs/${jobId}/attachments`, {
          credentials: 'include',
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
          createdAt: f.uploadedAt || f.createdAt,
          fileClassification: f.category || f.fileClassification || null,
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
          fileClassification: f.fileClassification || null,
        }));
        allFiles = [...allFiles, ...legacyFiles];
      }

      // Deduplicate by id
      const uniqueFiles = Array.from(new Map(allFiles.map(f => [f.id, f])).values());
      setAttachments(uniqueFiles);

      // Check for required files
      const myFiles = uniqueFiles.filter(f => f.uploadedBy === user.id);
      
      // Debug logging to help diagnose upload detection issues
      console.log('[Freelancer Order] Checking files:', {
        totalFiles: uniqueFiles.length,
        myFilesCount: myFiles.length,
        myFiles: myFiles.map(f => ({
          id: f.id,
          name: f.fileName,
          uploadType: f.uploadType,
          fileClassification: f.fileClassification,
          uploadedBy: f.uploadedBy,
          userId: user.id,
        }))
      });
      
      const classification = (f: AttributedFile) => normalizeIdentifier(f.fileClassification);
      const uploadType = (f: AttributedFile) => normalizeIdentifier(f.uploadType);

      // ✅ IMPROVED: Comprehensive file detection across all possible classifications
      // Check uploadType, fileClassification, and even filename patterns
      const finalDocPatterns = [
        'final_document', 'completed_paper', 'completed_smart_paper', 
        'final_paper', 'final', 'final_work', 'final_submission',
      ];
      
      const hasFinal = myFiles.some(f => {
        const classVal = classification(f);
        const uploadVal = uploadType(f);
        const rawClass = (f.fileClassification || '').toLowerCase();
        const rawUpload = (f.uploadType || '').toLowerCase();
        
        const isFinal = 
          FINAL_CLASSIFICATION_IDENTIFIERS.has(classVal) ||
          FINAL_CLASSIFICATION_IDENTIFIERS.has(uploadVal) ||
          FINAL_CLASSIFICATION_IDENTIFIERS.has(rawClass) ||
          FINAL_CLASSIFICATION_IDENTIFIERS.has(rawUpload) ||
          finalDocPatterns.some(pattern => rawUpload.includes(pattern)) ||
          finalDocPatterns.some(pattern => rawClass.includes(pattern));
        
        if (isFinal) {
          console.log('[Freelancer Order] ✅ Found final file:', f.fileName, '(', rawUpload, '/', rawClass, ')');
        }
        return isFinal;
      });
      
      const plagPatterns = ['plagiarism_report', 'plag_report', 'turnitin_report', 'plagiarism'];
      const hasPlag = myFiles.some(f => {
        const classVal = classification(f);
        const uploadVal = uploadType(f);
        const rawClass = (f.fileClassification || '').toLowerCase();
        const rawUpload = (f.uploadType || '').toLowerCase();
        
        const isPlag = 
          PLAGIARISM_CLASSIFICATION_IDENTIFIERS.has(classVal) ||
          PLAGIARISM_CLASSIFICATION_IDENTIFIERS.has(uploadVal) ||
          plagPatterns.some(pattern => rawUpload.includes(pattern)) ||
          plagPatterns.some(pattern => rawClass.includes(pattern));
        
        if (isPlag) {
          console.log('[Freelancer Order] ✅ Found plagiarism report:', f.fileName);
        }
        return isPlag;
      });
      
      const aiPatterns = ['ai_report', 'ai_detection_report', 'ai_detection', 'gptzero'];
      const hasAi = myFiles.some(f => {
        const classVal = classification(f);
        const uploadVal = uploadType(f);
        const rawClass = (f.fileClassification || '').toLowerCase();
        const rawUpload = (f.uploadType || '').toLowerCase();
        
        const isAi = 
          AI_CLASSIFICATION_IDENTIFIERS.has(classVal) ||
          AI_CLASSIFICATION_IDENTIFIERS.has(uploadVal) ||
          aiPatterns.some(pattern => rawUpload.includes(pattern)) ||
          aiPatterns.some(pattern => rawClass.includes(pattern));
        
        if (isAi) {
          console.log('[Freelancer Order] ✅ Found AI report:', f.fileName);
        }
        return isAi;
      });

      console.log('[Freelancer Order] Detection results:', { hasFinal, hasPlag, hasAi, myFilesCount: myFiles.length });

      setHasFinalFiles(hasFinal);
      setHasPlagiarismReport(hasPlag);
      setHasAiReport(hasAi);

      // Auto-update checklist
      setChecklist(prev => ({
        ...prev,
        finalDocument: hasFinal,
        reportsIncluded: order?.requiresReports ? (hasPlag && hasAi) : true,
      }));

    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  }, [user, jobId, order?.requiresReports]);

  const fetchCompletedJobs = useCallback(async () => {
    if (!user) return;
    try {
      const response = await safeApiFetch(`/api/freelancers/${user.id}/completed-jobs`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCompletedJobs(data.completedJobs || 0);
      }
    } catch (error) {
      console.error('Failed to fetch completed jobs:', error);
    }
  }, [user]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/login');
        return;
      }
      fetchOrder();
      fetchCompletedJobs();
    }
  }, [user, authLoading, router, fetchOrder, fetchCompletedJobs]);

  useEffect(() => {
    if (order) {
      fetchAttachments();
    }
  }, [order, fetchAttachments]);

  useEffect(() => {
    if (order) {
      // Use stored earnings if available, otherwise calculate estimate
      const earnings = getFreelancerEarnings(order, completedJobs);
      setEstimatedEarnings(earnings);
    }
  }, [order, completedJobs]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrder();
      fetchAttachments();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [fetchOrder, fetchAttachments]);

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handlePlaceBid = async () => {
    if (!order || !bidAmount) return;
    
    setShowBidConfirm(false);
    setProcessing(true);

    try {
      const response = await safeApiFetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobId: order.id,
          freelancerId: user?.id,
          bidAmount: parseFloat(bidAmount),
          message: '',
        }),
      });

      if (response.ok) {
        setBidDialogOpen(false);
        setHasExistingBid(true);
        toast.success('Bid placed successfully!');
      } else if (response.status === 409) {
        toast.info("You've already placed a bid for this job");
        setHasExistingBid(true);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(data, 'Failed to place bid'));
      }
    } catch (error) {
      console.error('Failed to place bid:', error);
      toast.error('Failed to place bid');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!order) return;
    setProcessing(true);

    try {
      const response = await safeApiFetch(`/api/v2/orders/${order.id}/freelancer/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Order accepted successfully!');
        await fetchOrder();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to accept order' }));
        toast.error(extractErrorMessage(error, 'Failed to accept order'));
      }
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Failed to accept order');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!order) return;
    
    if (!confirm('Are you sure you want to reject this order? This action cannot be undone.')) {
      return;
    }

    setProcessing(true);

    try {
      const response = await safeApiFetch(`/api/v2/orders/${order.id}/freelancer/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Freelancer rejected assignment' }),
      });

      if (response.ok) {
        toast.success('Order rejected');
        router.push('/freelancer/dashboard');
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to reject order'));
      }
    } catch (error) {
      console.error('Failed to reject order:', error);
      toast.error('Failed to reject order');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!order) return;

    console.log('[Freelancer Submit] Attempting submission. State:', {
      hasFinalFiles,
      hasPlagiarismReport,
      hasAiReport,
      requiresReports: order.requiresReports,
      checklist,
      attachmentsCount: attachments.length,
    });

    if (!hasFinalFiles) {
      toast.error('Please upload your final work before submitting');
      setChecklistOpen(false);
      // Refresh attachments in case state is stale
      await fetchAttachments();
      return;
    }

    const requiresReports = order.requiresReports ?? false;
    if (requiresReports && (!hasPlagiarismReport || !hasAiReport)) {
      toast.error('Please upload both plagiarism and AI reports before submitting');
      setChecklistOpen(false);
      return;
    }

    const allChecked = Object.values(checklist).every(v => v);
    if (!allChecked) {
      toast.error('Please complete all checklist items before submitting');
      return;
    }

    setProcessing(true);

    try {
      console.log('[Freelancer Submit] Sending submit request for order:', order.id);
      
      const response = await safeApiFetch(`/api/v2/orders/${order.id}/freelancer/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Order submitted with final files' }),
      });

      const responseData = await response.json().catch(() => ({ error: 'Failed to parse response' }));
      console.log('[Freelancer Submit] Response:', { ok: response.ok, status: response.status, data: responseData });

      // ✅ FIX: Check for success field or response.ok, not just presence of error
      if (response.ok || responseData?.success) {
        console.log('[Freelancer Submit] ✅ Submission successful');
        toast.success('Work submitted for review! Admin/manager will review shortly.', { duration: 5000 });
        setChecklistOpen(false);
        setChecklist({
          finalDocument: false,
          reportsIncluded: false,
          qualityChecked: false,
          formattingCorrect: false,
          deadlineMet: false,
        });
        // Refresh order to show new status - use silent mode to prevent error toasts
        try {
          await fetchOrder({ silent: true });
          await fetchAttachments();
        } catch (refreshError) {
          console.warn('[Freelancer Submit] Refresh failed (submission was successful):', refreshError);
          // Don't show error toast - submission was successful
        }
      } else {
        console.error('[Freelancer Submit] ❌ Submission failed:', responseData);
        toast.error(extractErrorMessage(responseData, 'Failed to submit order'));
      }
    } catch (error) {
      console.error('[Freelancer Submit] ❌ Exception during submit:', error);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadComplete = async (
    files: Array<{ url: string; name: string; size: number; mimeType: string; classification: FileClassification }>
  ) => {
    if (!user || !order) {
      console.error('[Freelancer Upload] Missing user or order');
      toast.error('Unable to process upload: missing user or order data');
      return;
    }

    console.log('[Freelancer Upload] Starting metadata save for files:', files.map(f => ({
      name: f.name,
      classification: f.classification,
    })));

    try {
      const isRevisionUpload = ['revision', 'internal_revision', 'client_revision'].includes(order.status);
      const endpoint = isRevisionUpload
        ? `/api/v2/orders/${jobId}/upload/revision`
        : `/api/v2/orders/${jobId}/upload/final`;

      const payloadFiles = files.map(f => ({
        url: f.url,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        fileType: f.classification || 'completed_paper',
        fileClassification: f.classification || 'completed_paper',
      }));
      
      console.log('[Freelancer Upload] Saving metadata to endpoint:', endpoint);
      console.log('[Freelancer Upload] Payload files:', payloadFiles);

      const response = await safeApiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uploaderId: user.id,
          notes: isRevisionUpload ? 'Revision submission' : 'Final submission',
          files: payloadFiles,
        }),
      });

      let parsedBody: any = null;
      try {
        const raw = await response.text();
        parsedBody = raw ? JSON.parse(raw) : null; // Avoid JSON errors on empty bodies
      } catch (parseErr) {
        console.warn('[Freelancer Upload] Response parse warning:', parseErr);
      }

      console.log('[Freelancer Upload] API Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        body: parsedBody,
      });

      // ✅ FIX: Check for success in response body, not just response.ok
      // The API returns { success: true, ... } on success, or { error: "..." } on failure
      const isSuccess = response.ok && (parsedBody?.success === true || (parsedBody?.files && Array.isArray(parsedBody.files)));
      
      if (!isSuccess) {
        console.error('[Freelancer Upload] API error response:', {
          status: response.status,
          error: parsedBody,
        });
        const errorMsg = parsedBody?.error || parsedBody?.message || 'Failed to save file metadata to database';
        throw new Error(errorMsg);
      }

      // ✅ Success confirmed - parsedBody should have success: true or files array
      console.log('[Freelancer Upload] ✅ Metadata saved successfully:', parsedBody);

      // Show success message
      toast.success(
        isRevisionUpload 
          ? `Revision files uploaded successfully!` 
          : `${files.length} file(s) uploaded successfully!`,
        { duration: 3000 }
      );
      
      // ✅ Refresh attachments to update state with slight delay to allow DB to settle
      console.log('[Freelancer Upload] Refreshing attachments list...');
      setTimeout(async () => {
        await fetchAttachments();
        await fetchOrder(); // Also refresh order data
        console.log('[Freelancer Upload] ✅ Attachments and order refreshed');
      }, 500);
      
    } catch (error) {
      console.error('[Freelancer Upload] ❌ Error saving metadata:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save file metadata';
      toast.error(`Upload failed: ${errorMessage}`, {
        duration: 7000
      });
    }
  };

  const handleDownload = (file: AttributedFile) => {
    window.open(file.fileUrl, '_blank');
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const isAssignedToMe = order?.assignedFreelancerId === user?.id;
  const canBid = order && BIDDING_STATUSES.includes(order.status) && !order.assignedFreelancerId;
  const needsAcceptance = order && ASSIGNMENT_PENDING_STATUSES.includes(order.status) && 
    isAssignedToMe && order.freelancerResponsePending && !order.freelancerAccepted;
  const canWork = order && WORKING_STATUSES.includes(order.status) && isAssignedToMe;
  const isUnderReview = order && REVIEW_STATUSES.includes(order.status);
  const isCompleted = order && COMPLETED_STATUSES.includes(order.status);
  const isCancelled = order && ['cancelled', 'canceled'].includes(order.status);
  const isRevisionPhase = order && ['revision', 'internal_revision', 'client_revision'].includes(order.status);
  const requiresReports = order?.requiresReports ?? false;
  const missingReports = requiresReports && (!hasPlagiarismReport || !hasAiReport);

  // Categorize files
  const clientFiles = attachments.filter(a => 
    ['client', 'account_owner', 'admin', 'manager'].includes(a.uploaderRole?.toLowerCase() || '')
  );
  const myFiles = attachments.filter(a => a.uploadedBy === user?.id);

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Loading Order Details...</p>
            <p className="text-xs text-muted-foreground">Please wait while we fetch your order information</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'freelancer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-sm text-muted-foreground">This page is only accessible to freelancers. Please log in with a freelancer account.</p>
            </div>
            <Link href="/login" className="block">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Order Not Found</h2>
              <p className="text-sm text-muted-foreground">This order doesn't exist or you don't have permission to view it.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/freelancer/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Dashboard</Button>
              </Link>
              <Link href="/freelancer/orders" className="flex-1">
                <Button className="w-full">View All Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Enhanced */}
      <div className="sticky top-0 z-10 border-b bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <Link href="/freelancer/orders">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-8 text-xs hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Orders
            </Button>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Order Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs px-2 h-5 border-2">{order.displayId}</Badge>
                <Badge className={`${getStatusColor(order.status)} hover:opacity-90 text-xs px-2.5 py-0.5 font-medium shadow-sm`}>
                  {getDisplayStatus(order.status)}
                </Badge>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">{order.title}</h1>
            </div>
            
            {/* Right: Key Metrics */}
            <div className="flex items-center gap-4 lg:gap-6 text-sm flex-wrap lg:flex-nowrap">
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">Your Earnings</p>
                  <p className="text-base font-bold text-green-700 dark:text-green-400">KSh {estimatedEarnings.toFixed(0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide">Volume</p>
                  <p className="text-sm font-semibold">{order.pages ? `${order.pages}p` : ''}{order.pages && order.slides ? ' + ' : ''}{order.slides ? `${order.slides}s` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide">Due Date</p>
                  <p className="text-sm font-semibold">{format(new Date(order.deadline), 'MMM dd, HH:mm')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 py-2">
        {/* Countdown Timer - Only for working orders - Compact */}
        {(canWork || needsAcceptance) && (
          <div className="mb-2">
            <ProminentCountdownTimer
              deadline={order.freelancerDeadline || order.actualDeadline}
              label="Your Deadline"
              size="sm"
              colorScheme="green"
              orderStatus={order.status}
            />
          </div>
        )}

        {/* ================================================ */}
        {/* SECTION: BIDDING (Available Orders) */}
        {/* ================================================ */}
        {canBid && (
          <Card className="mb-3 border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
                <Send className="w-5 h-5" />
                Available for Bidding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This order is available for freelancers to bid on. Place your bid to compete for this assignment.
              </p>
              
              {hasExistingBid ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    You have already placed a bid on this order. Admin will review and assign shortly.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button onClick={() => setBidDialogOpen(true)} className="w-full md:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  Place Your Bid
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ================================================ */}
        {/* SECTION: ASSIGNMENT PENDING (Accept/Reject) */}
        {/* ================================================ */}
        {needsAcceptance && (
          <Card className="mb-4 border-purple-200 bg-purple-50/30 dark:bg-purple-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-purple-900 dark:text-purple-100">
                <AlertCircle className="w-5 h-5" />
                Action Required: Accept or Reject Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have been assigned this order. Please accept to start working, or reject if you cannot complete it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAcceptOrder} 
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Accept Assignment
                </Button>
                <Button 
                  onClick={handleRejectOrder} 
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================ */}
        {/* SECTION: REVISION ALERT */}
        {/* ================================================ */}
        {isRevisionPhase && (
          <Alert className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-900 dark:text-orange-100">
              <strong>Revision Required:</strong> {order.revisionNotes || 'Please review the feedback and upload revised files.'}
            </AlertDescription>
          </Alert>
        )}

        {/* ================================================ */}
        {/* SECTION: UNDER REVIEW (Editing status) */}
        {/* ================================================ */}
        {isUnderReview && (
          <Card className="mb-4 border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-900 dark:text-orange-100">
                <Clock className="w-5 h-5" />
                Work Submitted - Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your work has been submitted and is being reviewed by the admin/manager. 
                You will be notified if any revisions are needed.
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  const message = prompt('Need clarification? Enter your message:');
                  if (message?.trim()) {
                    try {
                      const response = await safeApiFetch(`/api/v2/orders/${jobId}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ message: `❓ CLARIFICATION: ${message.trim()}` }),
                      });
                      if (response.ok) toast.success('Message sent');
                      else toast.error('Failed to send message');
                    } catch {
                      toast.error('Failed to send message');
                    }
                  }
                }}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Request Clarification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ================================================ */}
        {/* SECTION: COMPLETED/DELIVERED STATUS */}
        {/* ================================================ */}
        {isCompleted && (
          <Card className="mb-4 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-900 dark:text-green-100">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold">
                    {order.status === 'delivered' ? 'Delivered to Client ✓' : 
                     order.status === 'approved' ? 'Client Approved! 🎉' : 
                     order.status === 'paid' ? 'Payment Confirmed! 💰' : 'Order Completed! ⭐'}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 font-normal mt-0.5">
                    {order.status === 'delivered' && 'Awaiting client review'}
                    {order.status === 'approved' && 'Payment processing in progress'}
                    {order.status === 'paid' && `KSh ${estimatedEarnings.toFixed(0)} added to your balance`}
                    {order.status === 'completed' && 'Successfully completed and paid'}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm text-foreground">
                  {order.status === 'delivered' && '✓ Your work has been delivered to the client and is currently under review. You will be notified once approved.'}
                  {order.status === 'approved' && '✓ Excellent work! The client has approved your submission. Your earnings will be processed and added to your balance shortly.'}
                  {order.status === 'paid' && '✓ Payment confirmed! Your earnings of KSh ' + estimatedEarnings.toFixed(0) + ' have been successfully added to your account balance.'}
                  {order.status === 'completed' && '✓ Congratulations! This order has been completed successfully and payment has been processed. Keep up the great work!'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================================================ */}
        {/* SECTION: CANCELLED STATUS */}
        {/* ================================================ */}
        {isCancelled && (
          <Card className="mb-4 border-red-200 bg-red-50/30 dark:bg-red-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-900 dark:text-red-100">
                <XCircle className="w-5 h-5" />
                Order Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This order has been cancelled. Please check the messages for more information.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabbed Layout: Instructions | Files | Messages */}
        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-12">
            <TabsTrigger value="instructions" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Instructions</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Files</span>
              <span className="sm:hidden">Files</span>
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{attachments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* Instructions Tab */}
          <TabsContent value="instructions" className="space-y-4">
            {/* Order Details Card - Enhanced */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Work Type</p>
                    <p className="text-sm font-semibold capitalize bg-muted/50 px-2 py-1 rounded">{order.workType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pages</p>
                    <p className="text-sm font-semibold bg-muted/50 px-2 py-1 rounded">{order.pages || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Slides</p>
                    <p className="text-sm font-semibold bg-muted/50 px-2 py-1 rounded">{order.slides || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Your Earnings</p>
                    <p className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded">KSh {estimatedEarnings.toFixed(0)}</p>
                  </div>
                </div>

                {requiresReports && (
                  <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                      <strong className="font-semibold">⚠️ Reports Required:</strong> This order requires both plagiarism and AI detection reports.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Instructions Card - Enhanced */}
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Client Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-border/60">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-normal">
                    {order.instructions || 'No specific instructions provided by the client.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pre-submission Actions: Bidding & Assignment */}
            {canBid && (
              <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
                    <Send className="w-5 h-5" />
                    Available for Bidding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This order is available for freelancers to bid on. Place your bid to compete for this assignment.
                  </p>
                  {hasExistingBid ? (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        You have already placed a bid on this order. Admin will review and assign shortly.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button onClick={() => setBidDialogOpen(true)} className="w-full md:w-auto">
                      <Send className="w-4 h-4 mr-2" />
                      Place Your Bid
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {needsAcceptance && (
              <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-purple-900 dark:text-purple-100">
                    <AlertCircle className="w-5 h-5" />
                    Action Required: Accept or Reject Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have been assigned this order. Please accept to start working, or reject if you cannot complete it.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleAcceptOrder} disabled={processing} className="flex-1 bg-green-600 hover:bg-green-700">
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Accept Assignment
                    </Button>
                    <Button onClick={handleRejectOrder} disabled={processing} variant="destructive" className="flex-1">
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject Assignment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab - Enhanced */}
          <TabsContent value="files" className="space-y-4 mt-0">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-muted/50 to-muted/30 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  <CardTitle className="text-sm font-semibold">All Files</CardTitle>
                  <Badge variant="secondary" className="ml-2">{attachments.length} total</Badge>
                </div>
                {attachments.length > 0 && (
                  <Button 
                    onClick={() => {
                      attachments.forEach((file, index) => {
                        setTimeout(() => handleDownload(file), index * 500);
                      });
                      toast.success(`Downloading ${attachments.length} files...`);
                    }} 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-primary hover:text-primary-foreground"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Client Uploads: client, account_owner, admin, manager */}
                <div>
                  <h3 className="text-xs font-semibold mb-2">Client Instructions & Administrative Files</h3>
                  <FileListSection
                    title=""
                    files={clientFiles}
                    onDownload={handleDownload}
                    showAttribution={true}
                    colorScheme="blue"
                    emptyMessage="No instructions or administrative files"
                  />
                </div>

                {/* My Uploads */}
                <div className="border-t pt-3">
                  <h3 className="text-xs font-semibold mb-2">My Uploads</h3>
                  <FileListSection
                    title=""
                    files={myFiles}
                    onDownload={handleDownload}
                    showAttribution={false}
                    showUploadType={true}
                    colorScheme="green"
                    emptyMessage="No files uploaded yet"
                    compact={true}
                  />
                </div>

                {/* Upload Controls - Enhanced */}
                {canWork && (
                  <div className="border-t pt-4 space-y-3">
                    <Button 
                      onClick={() => setUploadDialogOpen(true)} 
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {isRevisionPhase ? 'Upload Revision Files' : 'Upload Your Work'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      {isRevisionPhase 
                        ? 'Upload revised documents and updated reports' 
                        : 'Upload final document, reports (if required), and supporting files'
                      }
                    </p>

                    {/* Upload Status Indicators - Enhanced */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upload Requirements</p>
                      <div className="grid gap-2">
                        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          hasFinalFiles 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' 
                            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 animate-pulse'
                        }`}>
                          {hasFinalFiles ? (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow">
                              <AlertCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{hasFinalFiles ? '✓ ' : ''}Final Document</p>
                            <p className="text-xs text-muted-foreground">{hasFinalFiles ? 'Successfully uploaded' : 'Required before submission'}</p>
                          </div>
                          <Badge variant={hasFinalFiles ? 'default' : 'secondary'} className={hasFinalFiles ? 'bg-green-600' : ''}>
                            {hasFinalFiles ? 'Complete' : 'Pending'}
                          </Badge>
                        </div>
                        {requiresReports && (
                          <>
                            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              hasPlagiarismReport 
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' 
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            }`}>
                              {hasPlagiarismReport ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow">
                                  <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{hasPlagiarismReport ? '✓ ' : ''}Plagiarism Report</p>
                                <p className="text-xs text-muted-foreground">{hasPlagiarismReport ? 'Successfully uploaded' : 'Required for this order'}</p>
                              </div>
                              <Badge variant={hasPlagiarismReport ? 'default' : 'secondary'} className={hasPlagiarismReport ? 'bg-green-600' : ''}>
                                {hasPlagiarismReport ? 'Complete' : 'Pending'}
                              </Badge>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              hasAiReport 
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' 
                                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            }`}>
                              {hasAiReport ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow">
                                  <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{hasAiReport ? '✓ ' : ''}AI Detection Report</p>
                                <p className="text-xs text-muted-foreground">{hasAiReport ? 'Successfully uploaded' : 'Required for this order'}</p>
                              </div>
                              <Badge variant={hasAiReport ? 'default' : 'secondary'} className={hasAiReport ? 'bg-green-600' : ''}>
                                {hasAiReport ? 'Complete' : 'Pending'}
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status message when upload not available - Enhanced */}
                {!canWork && !canBid && (
                  <div className="border-t pt-4">
                    <div className="text-center py-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border-2 border-dashed border-muted">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {needsAcceptance ? 'Accept Assignment First' :
                         isUnderReview ? 'Work Under Review' :
                         isCompleted ? 'Order Complete' :
                         isCancelled ? 'Order Cancelled' :
                         'Upload Not Available'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        {needsAcceptance ? 'Accept the order assignment to start uploading files' :
                         isUnderReview ? 'Your work has been submitted and is being reviewed' :
                         isCompleted ? 'This order has been completed successfully' :
                         isCancelled ? 'This order has been cancelled' :
                         'File uploads are not available for this order status'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Work Card - Enhanced */}
            {canWork && (
              <Card className="border-2 border-green-300 dark:border-green-800 shadow-lg">
                <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Ready to Submit?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <p className="text-sm text-foreground mb-2">
                      Before submitting, ensure:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>All required files are uploaded</li>
                      <li>Work meets quality standards</li>
                      <li>Formatting is correct</li>
                      <li>Submitting before deadline</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => setChecklistOpen(true)}
                    disabled={!hasFinalFiles || missingReports || processing}
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    Submit for Review
                  </Button>
                  {!hasFinalFiles && (
                    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                        Upload final document before submitting
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasFinalFiles && missingReports && (
                    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                        Upload required plagiarism and AI reports before submitting
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab - Enhanced */}
          <TabsContent value="messages" className="mt-0">
            {isAssignedToMe ? (
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Order Communication
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Chat with admin, manager, and client about this order</p>
                </CardHeader>
                <CardContent className="p-4">
                  <OrderChat
                    orderId={order.id}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                    orderClientId={order.clientId}
                    orderFreelancerId={order.assignedFreelancerId}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Messages Unavailable</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Order communication will be available once this order is assigned to you. Win the bid or wait for assignment to start messaging.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ================================================ */}
      {/* DIALOGS */}
      {/* ================================================ */}

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Place Your Bid</DialogTitle>
            <DialogDescription>
              Enter your bid amount. Competitive pricing increases your chances of winning.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order</p>
                  <p className="font-semibold">{order?.title}</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">{order?.displayId}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Base Earnings</p>
                  <p className="text-lg font-bold text-green-600">KSh {estimatedEarnings.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-sm font-medium">{format(new Date(order?.deadline || ''), 'MMM dd, HH:mm')}</p>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bidAmount" className="text-sm font-semibold mb-2 block">Your Bid Amount (KSh)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="bidAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`e.g., ${estimatedEarnings.toFixed(2)}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-3 mt-4">
            <Button variant="outline" onClick={() => setBidDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => setShowBidConfirm(true)} 
              disabled={processing || !bidAmount || parseFloat(bidAmount) <= 0}
            >
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bid Confirmation Dialog */}
      <ConfirmationDialog
        open={showBidConfirm}
        onOpenChange={setShowBidConfirm}
        title="Confirm Bid"
        description={`Place a bid of KSh ${parseFloat(bidAmount || '0').toFixed(2)} for this order?`}
        confirmText="Yes, Place Bid"
        cancelText="Cancel"
        onConfirm={handlePlaceBid}
      />

      {/* Submission Checklist Dialog */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Order</DialogTitle>
            <DialogDescription>Confirm all requirements before submitting.</DialogDescription>
          </DialogHeader>

          {!hasFinalFiles && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Missing:</strong> Upload your final work before submitting.
              </AlertDescription>
            </Alert>
          )}

          {hasFinalFiles && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                Final files uploaded. Complete the checklist to submit.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Checkbox id="finalDocument" checked={checklist.finalDocument} 
                onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, finalDocument: !!checked }))}
                disabled={!hasFinalFiles} />
              <Label htmlFor="finalDocument" className="text-sm cursor-pointer">Final document uploaded</Label>
            </div>

            {requiresReports && (
              <div className="flex items-center gap-3">
                <Checkbox id="reportsIncluded" checked={checklist.reportsIncluded}
                  onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, reportsIncluded: !!checked }))}
                  disabled={!hasPlagiarismReport || !hasAiReport} />
                <Label htmlFor="reportsIncluded" className="text-sm cursor-pointer">Reports included</Label>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Checkbox id="qualityChecked" checked={checklist.qualityChecked}
                onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, qualityChecked: !!checked }))} />
              <Label htmlFor="qualityChecked" className="text-sm cursor-pointer">Quality checked</Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox id="formattingCorrect" checked={checklist.formattingCorrect}
                onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, formattingCorrect: !!checked }))} />
              <Label htmlFor="formattingCorrect" className="text-sm cursor-pointer">Formatting correct</Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox id="deadlineMet" checked={checklist.deadlineMet}
                onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, deadlineMet: !!checked }))} />
              <Label htmlFor="deadlineMet" className="text-sm cursor-pointer">Submitting before deadline</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={processing || !Object.values(checklist).every(v => v)}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Submit Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Popup */}
      <FileUploadPopup
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
        jobId={order?.id || 0}
        title={isRevisionPhase ? "Upload Revision Files" : "Upload Your Work"}
        userRole="freelancer"
        allowedClassifications={isRevisionPhase ? REVISION_ALLOWED_CLASSIFICATIONS : FINAL_ALLOWED_CLASSIFICATIONS}
      />
    </div>
  );
}
