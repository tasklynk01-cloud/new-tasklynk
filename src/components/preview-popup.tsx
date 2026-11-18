"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Download, Star, Lock, Eye, FileText, Loader2, AlertCircle, FileLock2 } from 'lucide-react';
import { toast } from 'sonner';
import { AttributedFile } from '@/components/attributed-file-display';

// react-pdf/pdfjs-dist reference browser-only globals (DOMMatrix, Path2D, etc.)
// at module-evaluation time, which crashes Next.js's SSR pass for any page that
// pulls this component in. Load it client-only.
const PDFViewerWithBlur = dynamic(
  () => import('@/components/pdf-viewer-with-blur').then((mod) => mod.PDFViewerWithBlur),
  { ssr: false }
);

interface PreviewPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: number;
    title: string;
    instructions: string;
    workType: string;
    pages?: number;
    slides?: number;
    amount: number;
    status: string;
    deadline: string;
  };
  files: AttributedFile[];
  onPayNow: () => void;
  userPaymentTerms: 'pod' | 'poa';
}

export function PreviewPopup({ 
  open, 
  onOpenChange, 
  order, 
  files, 
  onPayNow,
  userPaymentTerms 
}: PreviewPopupProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (open) {
      fetchPreviewContent();
    }
  }, [open, order.id]);
  
  // Prevent keyboard shortcuts for copy/select all when preview is restricted
  useEffect(() => {
    if (!open || previewData?.hasFullAccess) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+A, Ctrl+X, Cmd+C, Cmd+A, Cmd+X
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Keyboard shortcuts disabled in preview. Complete payment for full access.');
        return false;
      }
      
      // Prevent F12, Ctrl+Shift+I (dev tools)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        toast.error('Developer tools disabled in preview mode.');
        return false;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, previewData?.hasFullAccess]);
  
  const fetchPreviewContent = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v2/orders/${order.id}/preview`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document preview');
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setError('Failed to load document preview');
      toast.error('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyAttempt = (e: React.ClipboardEvent) => {
    if (!previewData?.hasFullAccess) {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Copy feature disabled. Please complete payment to access full content.');
    }
  };
  
  const handleCutAttempt = (e: React.ClipboardEvent) => {
    if (!previewData?.hasFullAccess) {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Cut feature disabled. Please complete payment to access full content.');
    }
  };
  
  const handleTextSelection = (e: React.MouseEvent) => {
    if (!previewData?.hasFullAccess) {
      e.preventDefault();
      return false;
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!previewData?.hasFullAccess) {
      e.preventDefault();
      toast.error('Right-click disabled in preview mode. Complete payment for full access.');
      return false;
    }
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    if (!previewData?.hasFullAccess) {
      e.preventDefault();
      return false;
    }
  };
  
  const handleSelectStart = (e: React.SyntheticEvent) => {
    if (!previewData?.hasFullAccess) {
      e.preventDefault();
      return false;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Loading document preview...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Preview Unavailable</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const hasDocuments = previewData?.documents?.length > 0;
  const isRestricted = !previewData?.hasFullAccess;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Eye className="w-5 h-5" />
            Preview: {order.title}
            {isRestricted && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Lock className="w-3 h-3 mr-1" />
                Limited Preview
              </Badge>
            )}
            {previewData?.hasFullAccess && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Full Access
              </Badge>
            )}
          </DialogTitle>
          {previewData?.accessReason && (
            <p className="text-sm text-muted-foreground">
              {previewData.accessReason}
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Work Type</p>
                  <p className="font-semibold capitalize">{order.workType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="capitalize">{order.status}</Badge>
                </div>
                {order.pages && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pages</p>
                    <p className="font-semibold">{order.pages}</p>
                  </div>
                )}
                {order.slides && (
                  <div>
                    <p className="text-sm text-muted-foreground">Slides</p>
                    <p className="font-semibold">{order.slides}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">KSh {order.amount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Preview Content */}
          {hasDocuments ? (
            <div className="space-y-6">
              {previewData.documents.map((document: any, index: number) => (
                <Card key={document.id}>
                  <CardContent className="pt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {document.fileName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {document.canExtractText && (
                          <Badge variant="outline" className="text-green-600">
                            {document.previewPercentage}% Preview
                          </Badge>
                        )}
                        {isRestricted && (
                          <Badge variant="outline" className="text-orange-600">
                            Limited Access
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Check if document is PDF and show PDF viewer with blur */}
                    {document.fileType?.toLowerCase().includes('pdf') && document.fileUrl ? (
                      <div className="h-[600px] border rounded-lg overflow-hidden">
                        <PDFViewerWithBlur
                          fileUrl={document.fileUrl}
                          fileName={document.fileName}
                          hasFullAccess={previewData.hasFullAccess}
                          previewPercentage={document.previewPercentage || 40}
                          startPage={1}
                          onPayNow={onPayNow}
                          orderAmount={order.amount}
                        />
                      </div>
                    ) : (
                      <div 
                        className={`relative max-h-96 overflow-y-auto ${
                          isRestricted 
                            ? 'select-none pointer-events-auto [&_*]:select-none [&_*]:pointer-events-auto' 
                            : ''
                        }`}
                        style={isRestricted ? {
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          WebkitTouchCallout: 'none'
                        } : {}}
                        onCopy={handleCopyAttempt}
                        onCut={handleCutAttempt}
                        onMouseDown={handleTextSelection}
                        onContextMenu={handleContextMenu}
                        onDragStart={handleDragStart}
                        {...{ onSelectStart: handleSelectStart as any }}
                      >
                        <div 
                          className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg"
                          style={isRestricted ? {
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                          } : {}}
                        >
                          {document.canExtractText ? (
                            <div 
                              className="whitespace-pre-wrap text-sm leading-relaxed"
                              {...(isRestricted ? {
                                'unselectable': 'on',
                                'onMouseDown': (e: any) => e.preventDefault()
                              } : {})}
                            >
                              {document.previewContent}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                              <p className="text-muted-foreground mb-3">
                                {document.previewContent}
                              </p>
                              {previewData.hasFullAccess ? (
                                document.fileUrl ? (
                                  <Button 
                                    asChild 
                                    className="mt-3" 
                                    size="sm"
                                  >
                                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-3 h-3 mr-1" />
                                      Download File to View
                                    </a>
                                  </Button>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-2">File URL not available</p>
                                )
                              ) : (
                                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200 inline-block">
                                  <Lock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                  <p className="text-sm font-medium text-orange-900 mb-2">
                                    Payment Required
                                  </p>
                                <Button onClick={onPayNow} size="sm" className="bg-orange-500 hover:bg-orange-600">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Pay KSh {order.amount.toLocaleString()}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {isRestricted && document.canExtractText && (
                          <div className="mt-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent z-10 rounded-lg"></div>
                            <div className="pt-8 pb-4 text-center relative z-20">
                              <Lock className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                              <h4 className="font-semibold text-lg mb-2">
                                {100 - document.previewPercentage}% More Content Available
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                You're viewing a limited preview. Complete payment to unlock:
                              </p>
                              <ul className="text-xs text-left max-w-xs mx-auto mb-4 space-y-1 text-muted-foreground">
                                <li>✓ Full document access ({document.wordCount.toLocaleString()} words)</li>
                                <li>✓ Download capability for all files</li>
                                <li>✓ Unrestricted viewing and copying</li>
                              </ul>
                              <div className="flex items-center justify-center gap-3">
                                <div className="text-left">
                                  <p className="text-xs text-muted-foreground">Amount Due:</p>
                                  <p className="text-lg font-bold text-orange-600">KSh {order.amount.toLocaleString()}</p>
                                </div>
                                <Button onClick={onPayNow} className="bg-orange-500 hover:bg-orange-600">
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Pay Now to Unlock
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {document.wordCount > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Words: {document.visibleWords || 0} of {document.wordCount} 
                          ({document.previewPercentage}% visible)
                        </div>
                      )}
                    </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileLock2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Preview Available Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {order.status === 'delivered' || order.status === 'approved' 
                      ? 'The final document has been submitted but preview generation is still in progress.'
                      : 'The final document hasn\'t been submitted yet.'}
                  </p>
                  {(order.status === 'delivered' || order.status === 'approved') && userPaymentTerms === 'pod' && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Lock className="h-10 w-10 mx-auto mb-3 text-orange-600" />
                      <p className="text-sm font-medium text-orange-900 mb-2">
                        Payment Required for Full Access
                      </p>
                      <p className="text-xs text-orange-700 mb-4">
                        Complete your payment of <strong>KSh {order.amount.toLocaleString()}</strong> to download the final deliverables
                      </p>
                      <Button onClick={onPayNow} className="bg-orange-500 hover:bg-orange-600">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
