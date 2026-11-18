"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

// Configure PDF.js worker - use HTTPS for production
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerWithBlurProps {
  fileUrl: string;
  fileName: string;
  hasFullAccess: boolean;
  previewPercentage: number; // 20 for POD clients
  startPage: number; // 2 for POD clients (skip page 1)
  onPayNow: () => void;
  orderAmount: number;
}

export function PDFViewerWithBlur({
  fileUrl,
  fileName,
  hasFullAccess,
  previewPercentage,
  startPage,
  onPayNow,
  orderAmount
}: PDFViewerWithBlurProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(startPage);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Calculate which pages are visible based on preview percentage
  const calculateVisiblePages = () => {
    if (hasFullAccess) {
      return { start: 1, end: numPages };
    }
    
    // For POD clients: skip first page, show 20% from page 2
    const totalPreviewPages = Math.max(2, Math.ceil(numPages * (previewPercentage / 100)));
    const endPage = Math.min(startPage + totalPreviewPages - 1, numPages);
    
    return { start: startPage, end: endPage };
  };

  const visiblePages = calculateVisiblePages();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    console.log(`[PDF Viewer] Successfully loaded PDF with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('[PDF Viewer] Error loading PDF:', error);
    console.error('[PDF Viewer] File URL:', fileUrl);
    setError('Failed to load document. The file may be corrupted or unavailable.');
    setLoading(false);
    toast.error('Failed to load document. Please try refreshing the page.');
  };

  const isPageBlurred = (pageNum: number): boolean => {
    if (hasFullAccess) return false;
    return pageNum < visiblePages.start || pageNum > visiblePages.end;
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(2.0, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  // Prevent copy, selection, and other breaches
  const securityHandlers = !hasFullAccess ? {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click disabled. Complete payment for full access.');
      return false;
    },
    onCopy: (e: React.ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Copy disabled. Complete payment for full access.');
    },
    onCut: (e: React.ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Cut disabled. Complete payment for full access.');
    },
    onDragStart: (e: React.DragEvent) => {
      e.preventDefault();
      return false;
    },
    onSelectStart: (e: React.SyntheticEvent) => {
      e.preventDefault();
      return false;
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      return false;
    }
  } : {};

  // Keyboard shortcut prevention
  useEffect(() => {
    if (hasFullAccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+P
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('Keyboard shortcuts disabled. Complete payment for full access.');
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [hasFullAccess]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{fileName}</span>
          {!hasFullAccess && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Lock className="w-3 h-3 mr-1" />
              Limited Preview
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Page Navigation */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {numPages || '...'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        className={`flex-1 overflow-auto bg-gray-100 p-4 ${!hasFullAccess ? 'select-none' : ''}`}
        style={!hasFullAccess ? {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        } : {}}
        {...securityHandlers}
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading document...</span>
          </div>
        )}

        <div className="flex justify-center">
          <div className="relative inline-block">
            <Document
              file={{
                url: fileUrl
              }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              options={{
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
              }}
            >
              <div className="relative">
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={hasFullAccess}
                  renderAnnotationLayer={hasFullAccess}
                />
                
                {/* Blur Overlay for Restricted Pages */}
                {isPageBlurred(currentPage) && (
                  <div className="absolute inset-0 backdrop-blur-xl bg-white/80 flex items-center justify-center">
                    <div className="text-center p-6 max-w-md">
                      <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                      <h3 className="text-xl font-bold mb-2">
                        {currentPage < visiblePages.start 
                          ? 'Page 1 Hidden - Premium Content'
                          : 'Premium Content Locked'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {currentPage < visiblePages.start
                          ? 'The first page contains premium content. Complete payment to access.'
                          : `You're viewing page ${currentPage}. Only pages ${visiblePages.start}-${visiblePages.end} are available in preview.`}
                      </p>
                      <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
                        <p className="text-sm font-medium text-orange-900 mb-2">
                          Complete payment to unlock:
                        </p>
                        <ul className="text-xs text-left text-orange-700 space-y-1 mb-3">
                          <li>✓ All {numPages} pages (including page 1)</li>
                          <li>✓ Full download capability</li>
                          <li>✓ Print access</li>
                          <li>✓ Copy & selection enabled</li>
                        </ul>
                        <p className="text-lg font-bold text-orange-600 mb-3">
                          KSh {orderAmount.toLocaleString()}
                        </p>
                        <Button 
                          onClick={onPayNow} 
                          className="w-full bg-orange-500 hover:bg-orange-600"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Now to Unlock
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Preview includes pages {visiblePages.start}-{visiblePages.end} of {numPages}
                      </p>
                    </div>
                  </div>
                )}

                {/* Watermark for Preview Pages */}
                {!hasFullAccess && !isPageBlurred(currentPage) && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className="text-gray-400 text-4xl font-bold opacity-20 transform rotate-45"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      PREVIEW ONLY
                    </div>
                  </div>
                )}
              </div>
            </Document>

            {/* Footer Info */}
            {!hasFullAccess && !isPageBlurred(currentPage) && (
              <div className="mt-2 text-center">
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Preview: Pages {visiblePages.start}-{visiblePages.end} of {numPages}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
