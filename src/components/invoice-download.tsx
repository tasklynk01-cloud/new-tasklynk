"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Company branding information - TaskLynk Brand Colors
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

export interface InvoiceItem {
  orderId: string;
  title: string;
  client?: string;
  freelancer?: string;
  manager?: string;
  workType?: string;
  pages?: number;
  slides?: number;
  amount: number;
  date: string;
  status?: string;
}

interface InvoiceDownloadProps {
  items: InvoiceItem[];
  title?: string;
  subtitle?: string;
  totalAmount?: number;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

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

export function InvoiceDownload({
  items,
  title = 'Invoice Statement',
  subtitle,
  totalAmount,
  userName,
  userEmail,
  userRole,
  className = '',
  variant = 'outline',
  size = 'sm',
}: InvoiceDownloadProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  const calculatedTotal = totalAmount ?? items.reduce((sum, item) => sum + item.amount, 0);

  const handleDownloadPDF = async () => {
    setDownloading('pdf');
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

      yPosition = 65;

      // ====== INVOICE TITLE SECTION ======
      // Large "INVOICE" title with golden accent
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('INVOICE', 14, yPosition);
      
      // Golden underline accent
      doc.setDrawColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.setLineWidth(3);
      doc.line(14, yPosition + 4, 70, yPosition + 4);

      // Invoice number and date on the right
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Invoice Date:', pageWidth - 60, yPosition - 8);
      doc.text('Invoice #:', pageWidth - 60, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(format(new Date(), 'MMM dd, yyyy'), pageWidth - 14, yPosition - 8, { align: 'right' });
      doc.text(`INV-${format(new Date(), 'yyyyMMdd')}`, pageWidth - 14, yPosition, { align: 'right' });

      yPosition += 20;

      // ====== RECIPIENT INFO BOX ======
      // Light cream background box
      doc.setFillColor(BRAND_COLORS.creamBg.r, BRAND_COLORS.creamBg.g, BRAND_COLORS.creamBg.b);
      doc.roundedRect(14, yPosition, pageWidth - 28, 35, 4, 4, 'F');
      
      // Left border accent
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.rect(14, yPosition, 4, 35, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('BILL TO:', 24, yPosition + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      if (userName) {
        doc.text(userName, 24, yPosition + 18);
        if (userRole) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(userRole.charAt(0).toUpperCase() + userRole.slice(1), 24, yPosition + 25);
        }
        if (userEmail) {
          doc.setFontSize(9);
          doc.text(userEmail, 24, yPosition + 31);
        }
      } else if (subtitle) {
        doc.text(subtitle, 24, yPosition + 18);
      }

      // Statement title on the right
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text(title, pageWidth - 20, yPosition + 15, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Total Orders: ${items.length}`, pageWidth - 20, yPosition + 24, { align: 'right' });

      yPosition += 45;

      // ====== ITEMS TABLE ======
      const tableData = items.map(item => [
        item.orderId,
        item.title?.substring(0, 28) + (item.title && item.title.length > 28 ? '...' : '') || 'N/A',
        item.client || '-',
        item.workType || '-',
        item.pages ? `${item.pages}` : '-',
        item.date ? format(new Date(item.date), 'MMM dd') : 'N/A',
        `KSh ${item.amount.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Order ID', 'Title', 'Client', 'Type', 'Pages', 'Date', 'Amount']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 5,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [60, 60, 60],
        },
        alternateRowStyles: {
          fillColor: [BRAND_COLORS.lightBlueBg.r, BRAND_COLORS.lightBlueBg.g, BRAND_COLORS.lightBlueBg.b],
        },
        columnStyles: {
          0: { cellWidth: 22, fontStyle: 'bold' },
          1: { cellWidth: 48 },
          2: { cellWidth: 28 },
          3: { cellWidth: 22 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 22 },
          6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
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
      doc.roundedRect(pageWidth - 90, finalY, 76, 28, 4, 4, 'F');
      
      // Golden accent on top of total box
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.roundedRect(pageWidth - 90, finalY, 76, 5, 4, 4, 'F');
      doc.rect(pageWidth - 90, finalY + 2, 76, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 210, 220);
      doc.text('Total Amount:', pageWidth - 85, finalY + 14);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text(`KSh ${calculatedTotal.toFixed(2)}`, pageWidth - 85, finalY + 24);

      // ====== FOOTER SECTION ======
      // Golden accent line above footer
      doc.setDrawColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.setLineWidth(1);
      doc.line(14, pageHeight - 35, pageWidth - 14, pageHeight - 35);

      // Thank you message
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Thank you for choosing TaskLynk!', pageWidth / 2, pageHeight - 28, { align: 'center' });

      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(130, 130, 130);
      doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text(`© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved. | ${COMPANY_INFO.website}`, pageWidth / 2, pageHeight - 14, { align: 'center' });

      // Save the PDF
      const filename = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading('excel');
    try {
      // Dynamic import to avoid SSR issues
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = COMPANY_INFO.name;
      workbook.lastModifiedBy = COMPANY_INFO.name;
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('Invoice Statement');

      // Set column widths
      worksheet.columns = [
        { key: 'orderId', width: 15 },
        { key: 'title', width: 40 },
        { key: 'client', width: 20 },
        { key: 'freelancer', width: 20 },
        { key: 'manager', width: 20 },
        { key: 'workType', width: 15 },
        { key: 'pages', width: 10 },
        { key: 'slides', width: 10 },
        { key: 'date', width: 15 },
        { key: 'status', width: 12 },
        { key: 'amount', width: 15 },
      ];

      // Title row - Navy Blue with Golden text
      worksheet.mergeCells('A1:K1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = COMPANY_INFO.name;
      titleCell.font = { size: 22, bold: true, color: { argb: `FF${BRAND_COLORS.goldenHex}` } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND_COLORS.navyBlueHex}` },
      };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 35;

      // Tagline row
      worksheet.mergeCells('A2:K2');
      const taglineCell = worksheet.getCell('A2');
      taglineCell.value = COMPANY_INFO.tagline;
      taglineCell.font = { size: 11, italic: true, color: { argb: 'FFFFFFFF' } };
      taglineCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND_COLORS.navyBlueHex}` },
      };
      taglineCell.alignment = { horizontal: 'center' };

      // Contact row with golden accent
      worksheet.mergeCells('A3:K3');
      const contactCell = worksheet.getCell('A3');
      contactCell.value = `${COMPANY_INFO.address} | ${COMPANY_INFO.email} | ${COMPANY_INFO.phone}`;
      contactCell.font = { size: 10, color: { argb: `FF${BRAND_COLORS.navyBlueHex}` } };
      contactCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND_COLORS.goldenHex}` },
      };
      contactCell.alignment = { horizontal: 'center' };

      // Empty row for spacing
      worksheet.getRow(4).height = 10;

      // Document title row
      worksheet.mergeCells('A5:K5');
      const docTitleCell = worksheet.getCell('A5');
      docTitleCell.value = title;
      docTitleCell.font = { size: 16, bold: true, color: { argb: `FF${BRAND_COLORS.navyBlueHex}` } };
      docTitleCell.alignment = { horizontal: 'left' };

      // User info (if provided)
      let startRow = 6;
      if (userName) {
        worksheet.mergeCells(`A${startRow}:K${startRow}`);
        const userCell = worksheet.getCell(`A${startRow}`);
        userCell.value = `Prepared for: ${userName}${userRole ? ` (${userRole})` : ''}${userEmail ? ` - ${userEmail}` : ''}`;
        userCell.font = { size: 10, color: { argb: 'FF666666' } };
        startRow++;
      }

      // Generated date
      worksheet.mergeCells(`A${startRow}:K${startRow}`);
      const dateCell = worksheet.getCell(`A${startRow}`);
      dateCell.value = `Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`;
      dateCell.font = { size: 10, color: { argb: 'FF999999' } };
      startRow += 2;

      // Header row - Navy Blue background
      const headerRow = worksheet.getRow(startRow);
      headerRow.values = ['Order ID', 'Title', 'Client', 'Freelancer', 'Manager', 'Work Type', 'Pages', 'Slides', 'Date', 'Status', 'Amount (KSh)'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND_COLORS.navyBlueHex}` },
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 28;

      // Data rows
      items.forEach((item, index) => {
        const row = worksheet.getRow(startRow + 1 + index);
        row.values = [
          item.orderId,
          item.title || 'N/A',
          item.client || '-',
          item.freelancer || '-',
          item.manager || '-',
          item.workType || '-',
          item.pages || '-',
          item.slides || '-',
          item.date ? format(new Date(item.date), 'MMM dd, yyyy') : 'N/A',
          item.status || '-',
          item.amount.toFixed(2),
        ];

        // Alternate row colors - Light cream/blue
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F8FA' },
          };
        }

        // Format amount column
        row.getCell(11).numFmt = '#,##0.00';
        row.getCell(11).alignment = { horizontal: 'right' };
        row.getCell(11).font = { bold: true };
      });

      // Total row - Golden background
      const totalRowNum = startRow + 1 + items.length + 1;
      worksheet.mergeCells(`A${totalRowNum}:J${totalRowNum}`);
      const totalLabelCell = worksheet.getCell(`A${totalRowNum}`);
      totalLabelCell.value = 'TOTAL AMOUNT';
      totalLabelCell.font = { bold: true, color: { argb: `FF${BRAND_COLORS.navyBlueHex}` } };
      totalLabelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND_COLORS.goldenHex}` },
      };
      totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

      const totalAmountCell = worksheet.getCell(`K${totalRowNum}`);
      totalAmountCell.value = calculatedTotal;
      totalAmountCell.numFmt = '#,##0.00';
      totalAmountCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      totalAmountCell.alignment = { horizontal: 'right', vertical: 'middle' };
      totalAmountCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND_COLORS.navyBlueHex}` },
      };
      worksheet.getRow(totalRowNum).height = 25;

      // Footer
      const footerRowNum = totalRowNum + 2;
      worksheet.mergeCells(`A${footerRowNum}:K${footerRowNum}`);
      const footerCell = worksheet.getCell(`A${footerRowNum}`);
      footerCell.value = `© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved. | ${COMPANY_INFO.website}`;
      footerCell.font = { size: 9, italic: true, color: { argb: 'FF999999' } };
      footerCell.alignment = { horizontal: 'center' };

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Excel generation failed:', error);
      toast.error('Failed to generate Excel file');
    } finally {
      setDownloading(null);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={downloading !== null}>
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {downloading ? 'Downloading...' : 'Download'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownloadPDF} disabled={downloading !== null}>
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadExcel} disabled={downloading !== null}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Download as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Single invoice download component (for individual order invoices)
interface SingleInvoiceDownloadProps {
  orderId: string;
  title: string;
  client?: string;
  freelancer?: string;
  amount: number;
  date: string;
  workType?: string;
  pages?: number;
  slides?: number;
  mpesaCode?: string;
  status?: string;
  className?: string;
}

export function SingleInvoiceDownload({
  orderId,
  title,
  client,
  freelancer,
  amount,
  date,
  workType,
  pages,
  slides,
  mpesaCode,
  status,
  className = '',
}: SingleInvoiceDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 0;

      // Try to load logo
      const logoBase64 = await getLogoBase64();

      // ====== HEADER SECTION - Navy Blue Banner ======
      doc.setFillColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Golden accent stripe
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.rect(0, 50, pageWidth, 4, 'F');

      // Logo
      if (logoBase64) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.circle(35, 25, 18, 'F');
          doc.addImage(logoBase64, 'PNG', 17, 7, 36, 36);
        } catch {
          doc.setFontSize(28);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
          doc.text('TL', 28, 30);
        }
      }

      // Company Name - Golden on Navy
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text(COMPANY_INFO.name, pageWidth - 14, 22, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(COMPANY_INFO.tagline, pageWidth - 14, 32, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setTextColor(200, 210, 220);
      doc.text(`${COMPANY_INFO.email} | ${COMPANY_INFO.phone}`, pageWidth - 14, 42, { align: 'right' });

      yPosition = 68;

      // ====== INVOICE TITLE ======
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
      
      // Golden underline
      doc.setDrawColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.setLineWidth(3);
      doc.line(pageWidth / 2 - 35, yPosition + 5, pageWidth / 2 + 35, yPosition + 5);

      yPosition += 25;

      // ====== INVOICE INFO BOX ======
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
      doc.text('Order ID:', 24, yPosition + 32);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`INV-${orderId}`, 60, yPosition + 12);
      doc.text(format(new Date(), 'MMMM dd, yyyy'), 60, yPosition + 22);
      doc.text(orderId, 60, yPosition + 32);

      // Status and M-Pesa code on right
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Status:', pageWidth - 75, yPosition + 12);
      if (mpesaCode) {
        doc.text('M-Pesa:', pageWidth - 75, yPosition + 22);
      }

      doc.setFont('helvetica', 'normal');
      // Status color
      if (status === 'paid' || status === 'completed') {
        doc.setTextColor(34, 139, 34); // Green
      } else {
        doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      }
      doc.text((status || 'N/A').toUpperCase(), pageWidth - 20, yPosition + 12, { align: 'right' });
      
      if (mpesaCode) {
        doc.setTextColor(60, 60, 60);
        doc.text(mpesaCode, pageWidth - 20, yPosition + 22, { align: 'right' });
      }

      yPosition += 50;

      // ====== BILL TO SECTION ======
      doc.setFillColor(BRAND_COLORS.creamBg.r, BRAND_COLORS.creamBg.g, BRAND_COLORS.creamBg.b);
      doc.roundedRect(14, yPosition, (pageWidth - 28) / 2 - 5, 30, 4, 4, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text('BILL TO', 20, yPosition + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text(client || 'Client', 20, yPosition + 22);

      // FROM section
      doc.setFillColor(BRAND_COLORS.creamBg.r, BRAND_COLORS.creamBg.g, BRAND_COLORS.creamBg.b);
      doc.roundedRect(pageWidth / 2 + 5, yPosition, (pageWidth - 28) / 2 - 5, 30, 4, 4, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text('FROM', pageWidth / 2 + 11, yPosition + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text(COMPANY_INFO.name, pageWidth / 2 + 11, yPosition + 22);

      yPosition += 45;

      // ====== ORDER DETAILS TABLE ======
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text('Order Details', 14, yPosition);
      yPosition += 8;

      // Table header
      doc.setFillColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.rect(14, yPosition, pageWidth - 28, 12, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Description', 20, yPosition + 8);
      doc.text('Type', 100, yPosition + 8);
      doc.text('Qty', 135, yPosition + 8);
      doc.text('Amount', pageWidth - 25, yPosition + 8, { align: 'right' });
      yPosition += 12;

      // Table row
      doc.setFillColor(BRAND_COLORS.lightBlueBg.r, BRAND_COLORS.lightBlueBg.g, BRAND_COLORS.lightBlueBg.b);
      doc.rect(14, yPosition, pageWidth - 28, 18, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      const truncatedTitle = title.length > 35 ? title.substring(0, 35) + '...' : title;
      doc.text(truncatedTitle, 20, yPosition + 11);
      doc.text(workType || 'N/A', 100, yPosition + 11);
      
      let quantity = '';
      if (pages) quantity += `${pages}p`;
      if (pages && slides) quantity += '/';
      if (slides) quantity += `${slides}s`;
      doc.text(quantity || '-', 135, yPosition + 11);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.text(`KSh ${amount.toFixed(2)}`, pageWidth - 25, yPosition + 11, { align: 'right' });
      yPosition += 25;

      // ====== TOTAL BOX ======
      doc.setFillColor(BRAND_COLORS.navyBlue.r, BRAND_COLORS.navyBlue.g, BRAND_COLORS.navyBlue.b);
      doc.roundedRect(pageWidth - 100, yPosition, 86, 30, 4, 4, 'F');
      
      // Golden top accent
      doc.setFillColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.roundedRect(pageWidth - 100, yPosition, 86, 6, 4, 4, 'F');
      doc.rect(pageWidth - 100, yPosition + 3, 86, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 210, 220);
      doc.text('Total Amount', pageWidth - 95, yPosition + 15);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_COLORS.golden.r, BRAND_COLORS.golden.g, BRAND_COLORS.golden.b);
      doc.text(`KSh ${amount.toFixed(2)}`, pageWidth - 95, yPosition + 26);

      yPosition += 45;

      // Freelancer info (if available)
      if (freelancer) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Completed by: ${freelancer}`, 14, yPosition);
        if (date) {
          doc.text(`Completion Date: ${format(new Date(date), 'MMMM dd, yyyy')}`, 14, yPosition + 8);
        }
      }

      // ====== FOOTER ======
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

      // Save
      doc.save(`Invoice_${orderId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={downloading}
      className={className}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-1" />
      )}
      Invoice
    </Button>
  );
}
