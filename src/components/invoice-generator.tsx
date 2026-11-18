"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  payment: {
    id: number;
    amount: number;
    mpesaCode: string | null;
    status: string;
    createdAt: string;
  };
  job: {
    title: string;
    workType: string;
    pages: number | null;
    slides: number | null;
  };
  client: {
    name: string;
    email: string;
    phone: string;
  };
  freelancer: {
    name: string;
    email: string;
    phone: string;
  };
  subtotal: number;
  tax: number;
  total: number;
};

// Company branding information - TaskLynk Brand Colors (UPDATED)
const COMPANY_INFO = {
  name: 'TaskLynk',
  tagline: 'Professional Academic Writing Platform',
  address: 'Nairobi, Kenya',
  email: 'tasklynk01@gmail.com',
  phone: '+254701066845',
  website: 'www.tasklynk.co.ke',
  logoPath: '/tasklynk-logo.png',
};

// TaskLynk Brand Colors
const BRAND_COLORS = {
  // Navy Blue - Primary
  navyBlue: { r: 27, g: 58, b: 95 },      // #1B3A5F
  navyBlueHex: '1B3A5F',
  // Golden Yellow - Accent  
  golden: { r: 245, g: 166, b: 35 },       // #F5A623
  goldenHex: 'F5A623',
  // Light variants
  lightNavy: { r: 45, g: 85, b: 130 },     // #2D5582
  lightGold: { r: 255, g: 210, b: 120 },   // #FFD278
  // Background variants
  creamBg: { r: 255, g: 251, b: 245 },     // #FFFBF5
  lightBlueBg: { r: 240, g: 245, b: 250 }, // #F0F5FA
};

// Convert image to base64 for PDF embedding
const getLogoBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch('/tasklynk-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export function InvoiceGenerator({ paymentId, onClose }: { paymentId: number; onClose: () => void }) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(true);

  const generateInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Network error while generating invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on open so totals are always computed
    generateInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async () => {
    if (!invoice) return;
    
    setDownloading(true);
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 0;

      // Try to load logo
      const logoBase64 = await getLogoBase64();

      // ====== HEADER SECTION - Navy Blue Banner ======
      // Top banner with gradient effect (navy blue)
      doc.setFillColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Golden accent stripe under the navy banner
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.rect(0, 50, pageWidth, 4, 'F');

      // Logo on the left (if available)
      if (logoBase64) {
        try {
          // White background circle for logo
          doc.setFillColor(255, 255, 255);
          doc.circle(35, 25, 18, 'F');
          doc.addImage(logoBase64, 'PNG', 17, 7, 36, 36);
        } catch {
          // If logo fails, show text instead
          doc.setFontSize(28);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
          doc.text('TL', 28, 30);
        }
      } else {
        // Fallback: Show stylized TL
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
        doc.text('TL', 28, 30);
      }

      // Company Name - Golden on Navy
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text(COMPANY_INFO.name, pageWidth - 14, 22, { align: 'right' });

      // Tagline - White on Navy
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(COMPANY_INFO.tagline, pageWidth - 14, 32, { align: 'right' });
      
      // Contact info - Light text
      doc.setFontSize(9);
      doc.setTextColor(200, 210, 220);
      doc.text(`${COMPANY_INFO.email} | ${COMPANY_INFO.phone}`, pageWidth - 14, 42, { align: 'right' });

      yPosition = 68;

      // ====== INVOICE TITLE SECTION ======
      // Large "INVOICE" title with golden accent
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
      
      // Golden underline accent
      doc.setDrawColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.setLineWidth(3);
      doc.line(pageWidth / 2 - 35, yPosition + 5, pageWidth / 2 + 35, yPosition + 5);

      yPosition += 25;

      // ====== INVOICE INFO BOX ======
      // Light blue background box
      doc.setFillColor(BRAND_COLORS.lightBlueBg.r, BRAND_COLORS.lightBlueBg.g, BRAND_COLORS.lightBlueBg.b);
      doc.roundedRect(14, yPosition, pageWidth - 28, 35, 4, 4, 'F');
      
      // Left golden accent
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.rect(14, yPosition, 4, 35, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Invoice #:', 24, yPosition + 12);
      doc.text('Date:', 24, yPosition + 22);
      doc.text('Payment ID:', 24, yPosition + 32);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(invoice.invoiceNumber, 60, yPosition + 12);
      doc.text(format(new Date(invoice.invoiceDate), 'MMMM dd, yyyy'), 60, yPosition + 22);
      doc.text(`#${invoice.payment.id}`, 60, yPosition + 32);

      // Status and M-Pesa code on right
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Status:', pageWidth - 75, yPosition + 12);
      if (invoice.payment.mpesaCode) {
        doc.text('M-Pesa:', pageWidth - 75, yPosition + 22);
      }

      doc.setFont('helvetica', 'normal');
      // Status color
      if (invoice.payment.status === 'confirmed' || invoice.payment.status === 'paid') {
        doc.setTextColor(34, 139, 34); // Green
      } else {
        doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      }
      doc.text((invoice.payment.status || 'N/A').toUpperCase(), pageWidth - 20, yPosition + 12, { align: 'right' });
      
      if (invoice.payment.mpesaCode) {
        doc.setTextColor(60, 60, 60);
        doc.text(invoice.payment.mpesaCode, pageWidth - 20, yPosition + 22, { align: 'right' });
      }

      yPosition += 50;

      // ====== BILL TO & FROM SECTIONS ======
      // Bill To section
      doc.setFillColor(BRAND_COLORS.creamBg.r, BRAND_COLORS.creamBg.g, BRAND_COLORS.creamBg.b);
      doc.roundedRect(14, yPosition, (pageWidth - 28) / 2 - 5, 35, 4, 4, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text('BILL TO', 20, yPosition + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text(invoice.client.name, 20, yPosition + 20);
      
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(invoice.client.email, 20, yPosition + 27);
      doc.text(invoice.client.phone, 20, yPosition + 33);

      // FROM section (Freelancer)
      doc.setFillColor(BRAND_COLORS.creamBg.r, BRAND_COLORS.creamBg.g, BRAND_COLORS.creamBg.b);
      doc.roundedRect(pageWidth / 2 + 5, yPosition, (pageWidth - 28) / 2 - 5, 35, 4, 4, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text('FREELANCER', pageWidth / 2 + 11, yPosition + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text(invoice.freelancer.name, pageWidth / 2 + 11, yPosition + 20);
      
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(invoice.freelancer.email, pageWidth / 2 + 11, yPosition + 27);
      doc.text(invoice.freelancer.phone, pageWidth / 2 + 11, yPosition + 33);

      yPosition += 50;

      // ====== ORDER DETAILS TABLE ======
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Order Details', 14, yPosition);
      yPosition += 8;

      const tableData = [[
        invoice.job.title?.substring(0, 35) + (invoice.job.title && invoice.job.title.length > 35 ? '...' : '') || 'N/A',
        invoice.job.workType || 'N/A',
        invoice.job.pages ? `${invoice.job.pages}p` : '' + (invoice.job.pages && invoice.job.slides ? '/' : '') + (invoice.job.slides ? `${invoice.job.slides}s` : '') || '-',
        `KSh ${invoice.payment.amount.toFixed(2)}`
      ]];

      autoTable(doc, {
        startY: yPosition,
        head: [['Description', 'Type', 'Qty', 'Amount']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 5,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [60, 60, 60],
          fillColor: [BRAND_COLORS.lightBlueBg.r, BRAND_COLORS.lightBlueBg.g, BRAND_COLORS.lightBlueBg.b],
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 47, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1,
      });

      // Get final Y position after table
      const finalY = (doc as any).lastAutoTable.finalY + 15;

      // ====== TOTAL SECTION ======
      // Navy blue background for total
      doc.setFillColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.roundedRect(pageWidth - 100, finalY, 86, 30, 4, 4, 'F');
      
      // Golden accent on top of total box
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.roundedRect(pageWidth - 100, finalY, 86, 6, 4, 4, 'F');
      doc.rect(pageWidth - 100, finalY + 3, 86, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 210, 220);
      doc.text('Total Amount', pageWidth - 95, finalY + 15);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text(`KSh ${invoice.total.toFixed(2)}`, pageWidth - 95, finalY + 26);

      // ====== PAYMENT CONFIRMATION (if exists) ======
      if (invoice.payment.mpesaCode) {
        const paymentY = finalY + 45;
        doc.setFillColor(232, 245, 233); // Light green
        doc.roundedRect(14, paymentY, pageWidth - 28, 30, 4, 4, 'F');
        
        // Green left accent
        doc.setFillColor(76, 175, 80); // Green
        doc.rect(14, paymentY, 4, 30, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 125, 50); // Dark green
        doc.text('✓ Payment Confirmed', 24, paymentY + 12);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(`M-Pesa Code: ${invoice.payment.mpesaCode}`, 24, paymentY + 20);
        doc.text(`Date: ${format(new Date(invoice.payment.createdAt), 'MMMM dd, yyyy - HH:mm')}`, 24, paymentY + 27);
      }

      // ====== FOOTER SECTION ======
      // Golden line
      doc.setDrawColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.setLineWidth(1);
      doc.line(14, pageHeight - 40, pageWidth - 14, pageHeight - 40);

      // Thank you
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Thank you for choosing TaskLynk!', pageWidth / 2, pageHeight - 32, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(130, 130, 130);
      doc.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, pageHeight - 22, { align: 'center' });
      doc.text(`© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved. | ${COMPANY_INFO.website}`, pageWidth / 2, pageHeight - 14, { align: 'center' });

      // Save the PDF
      doc.save(`Invoice_${invoice.invoiceNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            Invoice Generator
          </DialogTitle>
          <DialogDescription>
            Generate and download invoice for payment #{paymentId}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Generating invoice...</p>
          </div>
        ) : !invoice ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load invoice data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invoice Preview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-6 rounded-lg border-2 border-blue-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {format(new Date(invoice.invoiceDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  invoice.payment.status === 'confirmed' || invoice.payment.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.payment.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">BILL TO</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{invoice.client.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{invoice.client.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">FREELANCER</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{invoice.freelancer.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{invoice.freelancer.email}</p>
                </div>
              </div>

              <div className="border-t border-blue-300 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{invoice.job.title}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {invoice.job.workType} • {invoice.job.pages && `${invoice.job.pages}p`}
                      {invoice.job.pages && invoice.job.slides && ' / '}
                      {invoice.job.slides && `${invoice.job.slides}s`}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    KSh {invoice.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {invoice.payment.mpesaCode && (
                <div className="mt-4 bg-green-50 dark:bg-green-950/30 border border-green-300 rounded p-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300">✓ PAYMENT CONFIRMED</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    M-Pesa: {invoice.payment.mpesaCode} • {format(new Date(invoice.payment.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full"
              size="lg"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice PDF
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
