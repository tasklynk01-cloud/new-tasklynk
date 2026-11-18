"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Lock, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  CreditCard,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { cn } from '@/lib/utils';

type DocumentPreview = {
  id: number;
  fileName: string;
  fileType: string | null;
  fileUrl: string | null;
  uploadedAt: string;
  previewContent: string;
  previewPercentage: number;
  hasFullAccess: boolean;
  wordCount: number;
  error?: string;
};

type PreviewData = {
  success: boolean;
  orderId: number;
  displayId: string;
  orderStatus: string;
  paymentTerms: 'poa' | 'pod';
  hasFullAccess: boolean;
  accessReason: string;
  canDownload: boolean;
  documents: DocumentPreview[];
};

type DocumentPreviewerProps = {
  orderId: number;
  onPaymentRequired?: () => void;
};

export default function DocumentPreviewer({ orderId, onPaymentRequired }: DocumentPreviewerProps) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPreview();
  }, [orderId]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/v2/orders/${orderId}/preview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load document preview');
        toast.error('Failed to load document preview');
      }
    } catch (err) {
      console.error('Failed to fetch document preview:', err);
      setError('Failed to load document preview');
      toast.error('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: DocumentPreview) => {
    if (!previewData?.canDownload) {
      toast.error('Download not authorized. Payment required.');
      if (onPaymentRequired) {
        onPaymentRequired();
      }
      return;
    }

    try {
      setDownloadingFiles(prev => new Set(prev).add(document.id));

      const token = localStorage.getItem('bearer_token');
      const response = await fetch(
        `/api/v2/orders/${orderId}/download/${document.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Open file URL in new tab for download
        window.open(data.fileUrl, '_blank');
        toast.success('Download started');
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Download failed'));
        
        if (error.requiresPayment && onPaymentRequired) {
          onPaymentRequired();
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const handlePaymentAction = () => {
    if (onPaymentRequired) {
      onPaymentRequired();
    } else {
      toast.info('Please contact admin to process payment');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading document preview...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !previewData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">Failed to Load Preview</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPreview}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { hasFullAccess, canDownload, paymentTerms, accessReason, documents } = previewData;
  const previewPercent = documents[0]?.previewPercentage ?? 40;

  return (
    <div className="space-y-6">
      {/* Access Status Banner */}
      <Card className={cn(
        "border-2",
        hasFullAccess ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-amber-500 bg-amber-50 dark:bg-amber-950"
      )}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {hasFullAccess ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  {hasFullAccess ? 'Full Access Granted' : 'Limited Preview Mode'}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {accessReason}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={paymentTerms === 'poa' ? 'default' : 'secondary'}>
                    {paymentTerms === 'poa' ? 'Pay on Approval' : 'Pay on Delivery'}
                  </Badge>
                  {!hasFullAccess && (
                    <Badge variant="outline" className="bg-white dark:bg-gray-900">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview: {previewPercent}% Visible
                    </Badge>
                  )}
                  {canDownload && (
                    <Badge variant="outline" className="bg-white dark:bg-gray-900">
                      <Download className="h-3 w-3 mr-1" />
                      Download Enabled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!hasFullAccess && (
              <Button onClick={handlePaymentAction} size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay to Unlock
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Previews */}
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{doc.fileName}</CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    <span>{doc.wordCount.toLocaleString()} words</span>
                    {doc.fileType && (
                      <>
                        <span>•</span>
                        <span className="uppercase">{doc.fileType}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => handleDownload(doc)}
                disabled={!canDownload || downloadingFiles.has(doc.id)}
                variant={canDownload ? 'default' : 'secondary'}
                size="sm"
              >
                {downloadingFiles.has(doc.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : canDownload ? (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Locked
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {doc.error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{doc.error}</p>
              </div>
            ) : (
              <div className="relative">
                {/* Document Content */}
                <div className={cn(
                  "prose prose-sm dark:prose-invert max-w-none p-6 bg-white dark:bg-gray-900 rounded-lg border min-h-[400px]",
                  !hasFullAccess && "max-h-[500px] overflow-hidden"
                )}>
                  <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                    {doc.previewContent}
                  </div>
                </div>

                {/* Blur Overlay for Limited Access */}
                {!hasFullAccess && (
                  <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
                    {/* Gradient blur effect */}
                    <div 
                      className="absolute inset-0 backdrop-blur-sm"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.95) 100%)',
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)',
                      }}
                    />
                    
                    {/* Lock message */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-auto">
                      <div className="bg-white dark:bg-gray-900 border-2 border-primary rounded-lg p-6 shadow-xl max-w-md text-center">
                        <Lock className="h-12 w-12 text-primary mx-auto mb-3" />
                        <h4 className="font-bold text-lg mb-2">Document Locked</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {Math.round(100 - doc.previewPercentage)}% of this document is hidden. 
                          Complete payment to unlock full access and download.
                        </p>
                        <Button onClick={handlePaymentAction} className="w-full">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay to Unlock ({100 - doc.previewPercentage}% Remaining)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview indicator */}
                {!hasFullAccess && (
                  <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>
                      Showing {doc.previewPercentage}% of document 
                      ({Math.round(doc.wordCount * (doc.previewPercentage / 100)).toLocaleString()} of {doc.wordCount.toLocaleString()} words)
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Bottom CTA for locked documents */}
      {!hasFullAccess && documents.length > 0 && (
        <Card className="border-2 border-primary">
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Unlock Full Document Access</h3>
              <p className="text-muted-foreground mb-4">
                Complete payment to download and view the complete document with all {documents.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()} words.
              </p>
              <Button onClick={handlePaymentAction} size="lg">
                <CreditCard className="h-5 w-5 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
