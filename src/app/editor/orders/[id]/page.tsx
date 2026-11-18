"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, FileText, Download, DollarSign, Calendar, User, MessageSquare,
  UploadCloud, CheckCircle, AlertCircle, XCircle, Clock, Loader2, Eye, 
  Edit, Save, Flag, Upload
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileListSection, AttributedFile } from '@/components/attributed-file-display';
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
    'approved',
    'paid',
    'completed',
    'on_hold',
    'cancelled',
  ];
  return (allowed as string[]).includes(value) ? (value as OrderStatus) : 'editing';
}

type Order = {
  id: number;
  displayId: string;
  orderNumber?: string;
  clientId?: number;
  clientName?: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount?: number | null;
  deadline: string;
  status: string;
  assignedFreelancerId?: number | null;
  freelancerName?: string;
  assignedEditorId?: number | null;
  editorName?: string;
  managerId?: number | null;
  managerName?: string;
  createdAt: string;
  updatedAt?: string;
  editorNotes?: string;
  editorStatus?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'PPp');
  } catch {
    return '—';
  }
}

async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return payload?.error || payload?.message || fallback;
  } catch {
    return fallback;
  }
}

function EditorOrderDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [attachments, setAttachments] = useState<AttributedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editorNotes, setEditorNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchOrder();
    fetchFiles();
  }, [user, orderId]);

  const fetchOrder = async () => {
    try {
      // Editors must use editor-specific endpoints (the general orders endpoint blocks editor role).
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/review`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      const orderObj = data?.order ?? data;

      const mappedOrder: Order = {
        id: Number(orderObj?.id) || 0,
        displayId: orderObj?.displayId || orderObj?.orderNumber || `TL-${orderObj?.id ?? orderId}`,
        orderNumber: orderObj?.orderNumber,
        clientId: Number(orderObj?.clientId) || undefined,
        clientName: orderObj?.clientName,
        title: orderObj?.title || 'Untitled Order',
        instructions: orderObj?.instructions || orderObj?.description || '',
        workType: orderObj?.workType || orderObj?.academicLevel || 'writing',
        pages: orderObj?.pages ?? null,
        slides: orderObj?.slides ?? null,
        amount: typeof orderObj?.amount === 'number' ? orderObj.amount : (Number(orderObj?.amount) || null),
        deadline: orderObj?.deadline || new Date().toISOString(),
        status: orderObj?.status || 'editing',
        assignedFreelancerId: orderObj?.assignedFreelancerId ?? null,
        freelancerName: orderObj?.freelancerName,
        assignedEditorId: orderObj?.assignedEditorId ?? null,
        createdAt: orderObj?.createdAt || new Date().toISOString(),
        updatedAt: orderObj?.updatedAt,
        editorNotes: orderObj?.editorNotes,
        editorStatus: orderObj?.editorStatus,
      };

      setOrder(mappedOrder);
      setEditorNotes(typeof orderObj?.editorNotes === 'string' ? orderObj.editorNotes : '');

      // Prefer attachments from editor review endpoint (includes access checks)
      if (Array.isArray(orderObj?.attachments)) {
        const files = orderObj.attachments.map((f: any) => ({
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
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      // Files are returned by the editor review endpoint and are access-checked.
      // Keep this as a no-op fallback to avoid extra endpoints and permissions mismatches.
      return;
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleDownload = async (file: AttributedFile) => {
    try {
      // For editor review, files are typically hosted (e.g., Cloudinary). Open directly.
      if (file.fileUrl) {
        window.open(file.fileUrl, '_blank');
        return;
      }
      throw new Error('Missing file url');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleClaimOrder = async () => {
    if (!confirm('Are you sure you want to claim this order for editing?')) return;
    
    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/claim`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to claim order'));
      }

      toast.success('Order claimed successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error claiming order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to claim order');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveWork = async () => {
    const approvalNotes = prompt('Add approval notes (required):', editorNotes || '');
    if (!approvalNotes?.trim()) return;
    
    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approvalNotes: approvalNotes.trim() })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to approve work'));
      }

      toast.success('Work approved and sent for admin review');
      fetchOrder();
    } catch (error) {
      console.error('Error approving work:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve work');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    const revisionNotes = prompt('Please provide details about what needs to be revised:');
    if (!revisionNotes?.trim()) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: revisionNotes.trim(),
          issueType: 'quality',
          detailedNotes: revisionNotes.trim(),
        })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to request revision'));
      }

      toast.success('Revision requested successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request revision');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveNotes = async () => {
    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: editorNotes.trim() })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to save notes'));
      }

      toast.success('Notes saved successfully');
      setEditingNotes(false);
      fetchOrder();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save notes');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlagIssue = async () => {
    const issueDescription = prompt('Please describe the issue you want to flag:');
    if (!issueDescription?.trim()) return;

    setProcessing(true);
    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/flag`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to flag issue'));
      }

      toast.success('Issue flagged successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error flagging issue:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to flag issue');
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
            <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/editor/orders')} variant="outline">
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
  const adminFiles = attachments.filter(f => ['admin', 'manager', 'editor'].includes(f.uploaderRole));

  const canClaim = order.status === 'editing' && order.editorStatus === 'pending_editing' && order.assignedEditorId === user?.id;
  const canReview = order.status === 'editing' && ['editing_in_progress', 'awaiting_revision'].includes(order.editorStatus || '') && order.assignedEditorId === user?.id;
  const isMyAssignment = order.assignedEditorId === user?.id;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/editor/orders')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.title}</h1>
            <p className="text-sm text-muted-foreground">Order #{order.displayId}</p>
            {isMyAssignment && <Badge variant="outline" className="mt-1">Assigned to You</Badge>}
          </div>
        </div>
        <Badge variant="secondary" className={getStatusColorClasses(coerceOrderStatus(order.status))}>
          {getStatusLabel(coerceOrderStatus(order.status), 'editor')}
        </Badge>
      </div>

      {/* Editor Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Edit className="w-5 h-5" />
            Editor Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {canClaim && (
              <Button 
                onClick={handleClaimOrder} 
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                Claim for Editing
              </Button>
            )}
            
            {canReview && (
              <>
                <Button 
                  onClick={handleApproveWork} 
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve & Deliver
                </Button>
                <Button 
                  onClick={handleRequestRevision} 
                  disabled={processing}
                  variant="outline"
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  Request Revision
                </Button>
                <Button 
                  onClick={handleFlagIssue} 
                  disabled={processing}
                  variant="destructive"
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
                  Flag Issue
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Notification */}
      {canReview && (
        <Card className="mb-6 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-900">
              <Eye className="w-5 h-5" />
              Work Ready for Editing Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This order is ready for final editing review. Please review all files and either approve for delivery or request revisions.
            </p>
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
                  <p className="text-sm font-medium text-muted-foreground">Freelancer</p>
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

          {/* Editor Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Editor Notes</CardTitle>
              {!editingNotes && (
                <Button 
                  onClick={() => setEditingNotes(true)} 
                  variant="outline" 
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Notes
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-3">
                  <Label htmlFor="editorNotes">Notes for this order</Label>
                  <Textarea
                    id="editorNotes"
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    placeholder="Add your editing notes here..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveNotes} 
                      disabled={processing}
                      size="sm"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Notes
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingNotes(false);
                        setEditorNotes(order.editorNotes || '');
                      }} 
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {order.editorNotes || 'No editor notes yet.'}
                  </p>
                </div>
              )}
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
              {/* Client Files */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-blue-600">Client Instructions ({clientFiles.length})</h3>
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
                <h3 className="text-sm font-semibold mb-3 text-green-600">Freelancer Work ({freelancerFiles.length})</h3>
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

              {/* Admin/Manager/Editor Files */}
              {adminFiles.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">Administrative Files</h3>
                  <FileListSection
                    title=""
                    files={adminFiles}
                    onDownload={handleDownload}
                    showAttribution={true}
                    colorScheme="purple"
                    emptyMessage="No administrative files"
                  />
                </div>
              )}
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
                currentUserRole={user?.role || 'editor'}
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

export default function EditorOrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <EditorOrderDetailContent />
    </Suspense>
  );
}