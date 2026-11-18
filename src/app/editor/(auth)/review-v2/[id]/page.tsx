"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle, XCircle, FileText, AlertTriangle, RefreshCw, Download, 
  Calendar, Clock, User, ChevronDown, ChevronRight, Eye, MessageSquare,
  CheckSquare, Square, FileCheck, AlertCircle, ArrowLeft, Flag
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EditorNote {
  note: string;
  timestamp: string;
  editorId: number;
  editorName: string;
}

interface QualityChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
}

interface OrderReview {
  id: number;
  orderId: string;
  displayId: string;
  title: string;
  description: string;
  status: string;
  editorStatus: string;
  deadline: string;
  pages?: number;
  slides?: number;
  workType: string;
  academicLevel: string;
  subject: string;
  instructions: string;
  clientName: string;
  freelancerName: string;
  editorNotes?: EditorNote[];
  editorRevisionNotes?: string;
  attachments: any[];
}

const DEFAULT_CHECKLIST: QualityChecklistItem[] = [
  { id: 'grammar', label: 'Grammar and spelling checked', checked: false, required: true },
  { id: 'formatting', label: 'Formatting matches requirements', checked: false, required: true },
  { id: 'citations', label: 'Citations and references verified', checked: false, required: true },
  { id: 'plagiarism', label: 'Plagiarism check completed', checked: false, required: true },
  { id: 'instructions', label: 'All instructions followed', checked: false, required: true },
  { id: 'wordCount', label: 'Word/page count meets requirements', checked: false, required: true },
  { id: 'structure', label: 'Document structure is logical', checked: false, required: false },
  { id: 'quality', label: 'Content quality is satisfactory', checked: false, required: false },
  { id: 'readability', label: 'Readability and flow are good', checked: false, required: false },
];

async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return payload?.error || payload?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function EnhancedEditorReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<QualityChecklistItem[]>(DEFAULT_CHECKLIST);
  const [internalNote, setInternalNote] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // UI states
  const [showChecklist, setShowChecklist] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/review`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklist(checklist.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const allRequiredChecked = () => {
    return checklist.filter(item => item.required).every(item => item.checked);
  };

  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: internalNote })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to add note'));
      }

      toast.success('Internal note added');
      setInternalNote('');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add note');
    }
  };

  const handleApprove = async () => {
    if (!allRequiredChecked()) {
      toast.error('Please complete all required checklist items');
      return;
    }

    if (!approvalNotes.trim()) {
      toast.error('Please provide approval notes');
      return;
    }

    try {
      setActionLoading(true);
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          approvalNotes,
          checklist: checklist.filter(item => item.checked).map(item => item.label)
        })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to approve order'));
      }

      toast.success('Order approved successfully');
      router.push('/editor/queue');
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve order');
    } finally {
      setActionLoading(false);
      setShowApproveDialog(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim() || revisionNotes.length < 20) {
      toast.error('Please provide detailed revision notes (minimum 20 characters)');
      return;
    }

    try {
      setActionLoading(true);
      const response = await safeApiFetch(`/api/v2/editor/orders/${orderId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: revisionNotes.trim(),
          issueType: 'quality',
          detailedNotes: [
            revisionNotes.trim(),
            ...checklist.filter(item => !item.checked && item.required).map(item => `Missing checklist item: ${item.label}`),
          ].join('\n')
        })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Failed to request revision'));
      }

      toast.success('Revision requested successfully');
      router.push('/editor/queue');
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request revision');
    } finally {
      setActionLoading(false);
      setShowRevisionDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600">Order not found</p>
        <button
          onClick={() => router.push('/editor/queue')}
          className="px-4 py-2 bg-[#ff8c42] hover:bg-[#e67a32] text-white rounded-lg transition-colors"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  const canEdit = order.editorStatus === 'editing_in_progress' || order.editorStatus === 'awaiting_revision';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/editor/queue')}
              className="p-4 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Order</h1>
              <p className="text-gray-600">{order.displayId} - {order.title}</p>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevisionDialog(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-3"
              >
                <XCircle className="h-4 w-4" />
                Request Revision
              </button>
              <button
                onClick={() => setShowApproveDialog(true)}
                disabled={!allRequiredChecked()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Order
              </button>
            </div>
          )}
        </div>

        {/* Status Alert */}
        {!canEdit && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              This order is not currently available for editing. Status: <strong>{order.editorStatus}</strong>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold text-gray-900">{order.displayId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.editorStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-semibold text-gray-900">{order.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Freelancer</p>
                  <p className="font-semibold text-gray-900">{order.freelancerName || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Work Type</p>
                  <p className="font-semibold text-gray-900">{order.workType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Academic Level</p>
                  <p className="font-semibold text-gray-900">{order.academicLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-semibold text-gray-900">{order.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-semibold text-red-600">
                    {format(new Date(order.deadline), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
                {order.pages && (
                  <div>
                    <p className="text-sm text-gray-600">Pages</p>
                    <p className="font-semibold text-gray-900">{order.pages}</p>
                  </div>
                )}
                {order.slides && (
                  <div>
                    <p className="text-sm text-gray-600">Slides</p>
                    <p className="font-semibold text-gray-900">{order.slides}</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{order.description || 'No description provided'}</p>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Instructions</p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {order.instructions || 'No specific instructions provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Files & Attachments */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setShowFiles(!showFiles)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#ff8c42]" />
                  <h2 className="text-xl font-bold text-gray-900">Files & Attachments</h2>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    {order.attachments.length}
                  </span>
                </div>
                {showFiles ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
              </button>
              
              {showFiles && (
                <div className="px-6 pb-6">
                  {order.attachments.length === 0 ? (
                    <p className="text-sm text-gray-500">No files attached</p>
                  ) : (
                    <div className="space-y-2">
                      {order.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {file.uploadType} • Uploaded by {file.uploaderName} ({file.uploaderRole})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-4 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <a
                              href={file.fileUrl}
                              download
                              className="p-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quality Checklist */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-[#ff8c42]" />
                  <h2 className="text-xl font-bold text-gray-900">Quality Checklist</h2>
                  <span className="text-sm text-gray-600">
                    ({checklist.filter(item => item.checked).length}/{checklist.length} completed)
                  </span>
                </div>
                {showChecklist ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
              </button>
              
              {showChecklist && (
                <div className="px-6 pb-6 space-y-3">
                  {checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleChecklistToggle(item.id)}
                      disabled={!canEdit}
                      className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.checked ? (
                        <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${item.checked ? 'text-green-900' : 'text-gray-900'}`}>
                          {item.label}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                      </div>
                    </button>
                  ))}
                  
                  {!allRequiredChecked() && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-xs text-yellow-800">
                        All required items (*) must be checked before approving
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Internal Notes */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-[#ff8c42]" />
                  <h2 className="text-lg font-bold text-gray-900">Internal Notes</h2>
                </div>
                {showNotes ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
              </button>
              
              {showNotes && (
                <div className="px-6 pb-6">
                  {canEdit && (
                    <div className="mb-4">
                      <textarea
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Add internal note (visible only to editors and admins)..."
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent text-sm"
                        rows={3}
                      />
                      <button
                        onClick={handleAddInternalNote}
                        disabled={!internalNote.trim()}
                        className="mt-2 w-full px-4 py-2 bg-[#ff8c42] hover:bg-[#e67a32] text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Note
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {order.editorNotes && order.editorNotes.length > 0 ? (
                      order.editorNotes.map((note, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-900 mb-2">{note.note}</p>
                          <p className="text-xs text-gray-500">
                            {note.editorName} • {format(new Date(note.timestamp), 'MMM dd, hh:mm a')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No internal notes yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Summary */}
            {canEdit && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Action Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Checklist Progress</span>
                    <span className="font-semibold text-gray-900">
                      {checklist.filter(item => item.checked).length}/{checklist.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Required Items</span>
                    <span className={`font-semibold ${allRequiredChecked() ? 'text-green-600' : 'text-red-600'}`}>
                      {allRequiredChecked() ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Internal Notes</span>
                    <span className="font-semibold text-gray-900">
                      {order.editorNotes?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approve Dialog */}
        {showApproveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Order</h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to approve this order. Please provide approval notes summarizing your review.
              </p>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Enter approval notes (e.g., 'All quality checks passed, work meets standards')..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveDialog(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || !approvalNotes.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Dialog */}
        {showRevisionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Request Revision</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide detailed notes explaining what needs to be revised. Be specific about the issues found.
              </p>
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Enter revision requirements (minimum 20 characters)..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm mb-2"
                rows={6}
              />
              <p className="text-xs text-gray-500 mb-4">
                {revisionNotes.length}/20 characters minimum
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevisionDialog(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestRevision}
                  disabled={actionLoading || revisionNotes.length < 20}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Request Revision
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
