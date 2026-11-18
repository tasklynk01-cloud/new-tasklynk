"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Lock, CreditCard, Eye, FileText, Download, 
  AlertCircle, Loader2, CheckCircle, Star
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

type PreviewData = {
  success: boolean;
  orderId: number;
  displayId: string;
  orderStatus: string;
  paymentTerms: 'pod' | 'poa';
  hasFullAccess: boolean;
  accessReason: string;
  canDownload: boolean;
  documents: Array<{
    id: number;
    fileName: string;
    fileType: string;
    fileUrl: string | null;
    uploadedAt: string;
    previewContent: string;
    previewPercentage: number;
    hasFullAccess: boolean;
    wordCount: number;
    visibleWords: number;
    canExtractText: boolean;
  }>;
};

type Order = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  status: string;
  deadline: string;
};

export default function ClientOrderPreviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, loading, router, orderId]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      setError('');

      // Fetch order details
      const orderRes = await safeApiFetch(`/api/v2/orders/${orderId}`, {
        credentials: 'include'
      });

      if (!orderRes.ok) {
        throw new Error('Failed to fetch order details');
      }

      const orderData = await orderRes.json();
      const orderObj = orderData?.order ?? orderData;
      setOrder(orderObj);

      // Fetch preview content
      const previewRes = await safeApiFetch(`/api/v2/orders/${orderId}/preview`, {
        credentials: 'include'
      });

      if (!previewRes.ok) {
        throw new Error('Failed to fetch document preview');
      }

      const previewContent = await previewRes.json();
      setPreviewData(previewContent);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load preview');
      toast.error('Failed to load preview');
    } finally {
      setLoadingData(false);
    }
  };

  const handlePayNow = () => {
    router.push(`/client/orders/${orderId}/payment`);
  };

  const handleDownloadDocument = async (documentId: number) => {
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/download/${documentId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const reason = err?.reason || err?.error || 'Download not authorized';
        toast.error(reason);
        return;
      }

      const data = await response.json().catch(() => null);
      const url = data?.fileUrl;
      if (!url) {
        toast.error('Download link unavailable');
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Download failed:', e);
      toast.error('Failed to download file');
    }
  };

  const handleBackToOrder = () => {
    router.push(`/client/orders/${orderId}`);
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Loading document preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !previewData || !order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Preview Unavailable</h3>
                <p className="text-muted-foreground mb-6">
                  {error || 'Failed to load document preview'}
                </p>
                <Button onClick={handleBackToOrder} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasDocuments = previewData.documents.length > 0;
  const isRestricted = !previewData.hasFullAccess;
  const previewPercent = previewData.documents[0]?.previewPercentage ?? 40;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleBackToOrder}
              variant="ghost"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Order
            </Button>
            
            <div className="flex items-center gap-3">
              {isRestricted ? (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-4 py-2">
                  <Lock className="w-3 h-3 mr-2" />
                  Limited Preview ({previewPercent}%)
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
                  <CheckCircle className="w-3 h-3 mr-2" />
                  Full Access
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Order Info Card */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{order.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {order.displayId}
                  </span>
                  <span className="capitalize">{order.workType}</span>
                  {order.pages && <span>{order.pages} pages</span>}
                  {order.slides && <span>{order.slides} slides</span>}
                  <Badge variant="outline" className="capitalize">
                    {order.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  KSh {order.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Preview Content */}
        {hasDocuments ? (
          <div className="space-y-6">
            {previewData.documents.map((document, index) => (
              <Card key={document.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{document.fileName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(document.uploadedAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                    {document.canExtractText && (
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {document.visibleWords.toLocaleString()} of {document.wordCount.toLocaleString()} words
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.previewPercentage}% visible
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {document.canExtractText ? (
                    <div className="relative">
                      {/* Visible Content */}
                      <div 
                        className={`p-8 ${isRestricted ? 'select-none' : ''}`}
                        style={isRestricted ? {
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none'
                        } : {}}
                        onCopy={(e) => {
                          if (isRestricted) {
                            e.preventDefault();
                            toast.error('Copy disabled in preview mode. Complete payment for full access.');
                          }
                        }}
                        onContextMenu={(e) => {
                          if (isRestricted) {
                            e.preventDefault();
                            toast.error('Right-click disabled. Complete payment for full access.');
                          }
                        }}
                      >
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-base leading-relaxed">
                            {document.previewContent}
                          </div>
                        </div>
                      </div>

                      {/* Course Hero Style Blur Overlay for Restricted Content */}
                      {isRestricted && (
                        <div className="relative">
                          {/* Blurred "Hidden" Content Preview */}
                          <div 
                            className="p-8 relative overflow-hidden"
                            style={{
                              filter: 'blur(8px)',
                              WebkitFilter: 'blur(8px)',
                              pointerEvents: 'none'
                            }}
                          >
                            <div className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-600">
                                {/* Simulated blurred content */}
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                              </div>
                            </div>
                          </div>

                          {/* Gradient Overlay */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.95) 60%, white 100%)'
                            }}
                          />

                          {/* Call-to-Action Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                            <Card className="max-w-lg w-full mx-4 shadow-2xl border-2 border-orange-200 bg-white/95 backdrop-blur-sm">
                              <CardContent className="p-8 text-center">
                                <div className="mb-6">
                                  <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                                  <h3 className="text-2xl font-bold mb-2">
                                    {100 - document.previewPercentage}% More Content Available
                                  </h3>
                                  <p className="text-muted-foreground mb-4">
                                    You're viewing a limited preview. Complete payment to unlock full access.
                                  </p>
                                </div>

                                <div className="space-y-4 mb-6">
                                  <div className="flex items-start gap-3 text-left p-3 bg-green-50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-green-900">Full Document Access</p>
                                      <p className="text-sm text-green-700">{document.wordCount.toLocaleString()} words total</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 text-left p-3 bg-blue-50 rounded-lg">
                                    <Download className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-blue-900">Download Capability</p>
                                      <p className="text-sm text-blue-700">Save and access offline anytime</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 text-left p-3 bg-purple-50 rounded-lg">
                                    <Eye className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-purple-900">Unrestricted Viewing</p>
                                      <p className="text-sm text-purple-700">Copy, print, and share freely</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                  <p className="text-sm text-orange-800 mb-2">Payment Required</p>
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-bold text-orange-600">
                                      KSh {order.amount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                <Button 
                                  onClick={handlePayNow}
                                  size="lg"
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg py-6 shadow-lg"
                                >
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Unlock Full Document
                                </Button>

                                <p className="text-xs text-muted-foreground mt-4">
                                  Secure payment • Instant access • Download included
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}

                      {/* Full Access - Show Complete Content */}
                      {!isRestricted && (
                        <div className="p-6 bg-gray-50 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">You have full access to this document</span>
                            </div>
                            <Button
                              variant="default"
                              onClick={() => handleDownloadDocument(document.id)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download File
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">
                        {document.previewContent}
                      </p>
                      {!isRestricted && (
                        <Button onClick={() => handleDownloadDocument(document.id)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download to View
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
              <p className="text-muted-foreground mb-6">
                The final document hasn't been submitted yet.
              </p>
              <Button onClick={handleBackToOrder} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Bottom CTA (for restricted access) */}
      {isRestricted && hasDocuments && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-4">
                <Lock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="font-semibold">Limited Preview Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Unlock full document for KSh {order.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handlePayNow}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Complete Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
