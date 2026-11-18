"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  CheckCircle, 
  XCircle, 
  FileText,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  BookOpen,
  Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OrderChat } from '@/components/order-chat';

interface OrderDetails {
  id: number;
  title: string;
  displayId?: string | null;
  orderNumber?: string | null;
  status: string;
  editorStatus?: string | null;
  description?: string | null;
  pages?: number | null;
  slides?: number | null;
  subject?: string | null;
  deadline?: string | null;
  instructions?: string | null;
  academicLevel?: string | null;
  createdAt?: string | null;
  workType?: string | null;
  editorNotes?: string | null;
  editorRevisionNotes?: string | null;
}

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadType: string;
  uploaderName: string;
  uploaderRole: string;
  createdAt: string;
}

export default function EditorReviewPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  
  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requiredRevisions, setRequiredRevisions] = useState('');

  const fetchOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('bearer_token');
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
        : { 'Cache-Control': 'no-cache' };

      const [orderResponse, attachmentsResponse] = await Promise.all([
        safeApiFetch(`/api/v2/editor/orders/${orderId}`, {
          credentials: 'include',
          headers,
        }),
        safeApiFetch(`/api/jobs/${orderId}/attachments?limit=100`, {
          credentials: 'include',
          headers,
        }),
      ]);

      if (!orderResponse.ok) {
        const errorPayload = await orderResponse.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Failed to fetch order details');
      }

      const orderPayload = await orderResponse.json();
      setOrder(orderPayload.order || orderPayload);

      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json();
        setAttachments(Array.isArray(attachmentsData) ? attachmentsData : []);
      } else {
        setAttachments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleApprove = async () => {
    if (!user?.id || !orderId) return;
    
    setApproving(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/editor/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          editorId: user.id,
          approvalNotes: approvalNotes || 'Work quality meets standards',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve');
      }

      toast.success('Order approved successfully');
      setShowApproveDialog(false);
      router.push('/editor/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve order');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id || !orderId || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setRejecting(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/editor/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          editorId: user.id,
          rejectionReason,
          requiredRevisions: requiredRevisions || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject');
      }

      toast.success('Order sent back for revision');
      setShowRejectDialog(false);
      router.push('/editor/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject order');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error || 'Order not found'}</p>
        <Link href="/editor/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const canReview = order.status === 'editing';

  return (
    <div className="space-y-4">
      {/* Header - COMPACT */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/editor/assignments">
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold">Review Order</h1>
            <p className="text-xs text-muted-foreground">
              {order.displayId || order.orderNumber || `#${order.id}`}
            </p>
          </div>
        </div>
        {canReview && (
          <div className="flex gap-3">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Request Revision
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowApproveDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Order Status Banner - COMPACT */}
      {!canReview && (
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-yellow-700">
                Not in editing stage. Current status: <strong>{order.status}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          {/* Order Details - COMPACT */}
          <Card>
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-semibold">{order.title || 'Untitled Order'}</CardTitle>
              <CardDescription className="text-[10px]">
                Order #{order.displayId || order.orderNumber || order.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">
                    <span className="text-muted-foreground">Subject:</span> {order.subject || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">
                    <span className="text-muted-foreground">Pages:</span> {order.pages ?? 'N/A'}
                    {typeof order.slides === 'number' && order.slides > 0 && ` + ${order.slides} slides`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">
                    <span className="text-muted-foreground">Deadline:</span> {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">
                    <span className="text-muted-foreground">Academic Level:</span> {order.academicLevel || 'Not specified'}
                  </span>
                </div>
              </div>
              
              {order.description && (
                <div className="pt-3 border-t">
                  <h4 className="text-xs font-medium mb-1.5">Description</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{order.description}</p>
                </div>
              )}
              
              {order.instructions && (
                <div className="pt-3 border-t">
                  <h4 className="text-xs font-medium mb-1.5">Instructions</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{order.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Instructions | Files | Messages */}
          <Tabs defaultValue="instructions">
            <TabsList>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="files">Submitted Files</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            {/* Instructions Tab */}
            <TabsContent value="instructions">
              <Card className="mt-3">
                <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
                  <CardTitle className="text-xs font-semibold">Instructions</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="p-4 bg-muted rounded text-xs whitespace-pre-wrap">
                    {order.instructions || 'No instructions provided.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <Card className="mt-3">
                <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
                  <CardTitle className="text-xs font-semibold">Submitted Files</CardTitle>
                  <CardDescription className="text-[10px]">Files submitted by the writer for review</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Group: Client's Uploads */}
                  <div>
                    <h3 className="text-xs font-semibold mb-2">Client's Uploads</h3>
                    <div className="space-y-2">
                      {attachments.filter(a => ['client','account_owner','admin','manager'].includes((a.uploaderRole||'').toLowerCase())).map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.fileName}</p>
                            <p className="text-[11px] text-muted-foreground">{file.uploaderRole} • {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                          <Button asChild variant="ghost" size="sm">
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">⬇️</a>
                          </Button>
                        </div>
                      ))}
                      {attachments.filter(a => ['client','account_owner','admin','manager'].includes((a.uploaderRole||'').toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground">No uploads</p>
                      )}
                    </div>
                  </div>

                  {/* Group: Writer Uploads */}
                  <div className="border-t pt-3">
                    <h3 className="text-xs font-semibold mb-2">Writer Uploads</h3>
                    <div className="space-y-2">
                      {attachments.filter(a => (a.uploaderRole||'').toLowerCase() === 'freelancer').map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.fileName}</p>
                            <p className="text-[11px] text-muted-foreground">{file.uploaderRole} • {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                          <Button asChild variant="ghost" size="sm">
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">⬇️</a>
                          </Button>
                        </div>
                      ))}
                      {attachments.filter(a => (a.uploaderRole||'').toLowerCase() === 'freelancer').length === 0 && (
                        <p className="text-xs text-muted-foreground">No uploads</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              {user && (
                <Card className="mt-3">
                  <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
                    <CardTitle className="text-xs font-semibold">Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <OrderChat 
                      orderId={parseInt(orderId)} 
                      currentUserId={user.id} 
                      currentUserRole={user.role}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - COMPACT */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-semibold">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Badge 
                variant={order.status === 'editing' ? 'default' : 'outline'}
                className="w-full justify-center py-1.5 text-xs"
              >
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {order.editorStatus && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Editor Stage: {order.editorStatus.replace(/_/g, ' ')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Client Info - COMPACT */}
          <Card>
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-semibold">Client</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Client details are hidden from editor view.
              </p>
            </CardContent>
          </Card>

          {/* Freelancer Info - COMPACT */}
          <Card>
            <CardHeader className="py-2.5 px-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-semibold">Writer</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Writer identity is hidden for editor workflows.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order</DialogTitle>
            <DialogDescription>
              Confirm that this order meets quality standards and is ready for delivery to the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about the quality of work..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={approving}
              className="bg-green-600 hover:bg-green-700"
            >
              {approving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Send this order back to the writer for revision. Please provide clear feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this work needs revision..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="required-revisions">Required Revisions (Optional)</Label>
              <Textarea
                id="required-revisions"
                placeholder="List specific changes that need to be made..."
                value={requiredRevisions}
                onChange={(e) => setRequiredRevisions(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={rejecting || !rejectionReason}
              variant="destructive"
            >
              {rejecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Request Revision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
