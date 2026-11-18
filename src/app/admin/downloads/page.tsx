"use client";

import { useState } from 'react';
import { Download, FileText, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

// TaskLynk Brand Colors
const BRAND_COLORS = {
  navyBlue: '#1B3A5F',
  golden: '#F5A623',
  lightNavy: '#2D5582',
  lightGold: '#FFD278',
};

const COMPANY_INFO = {
  name: 'TaskLynk',
  website: 'www.tasklynk.co.ke',
  email: 'support@tasklynk.co.ke',
  phone: '+254 701 066 845',
  address: 'Nairobi, Kenya',
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export default function AdminDownloadsPage() {
  const [generating, setGenerating] = useState(false);

  const generateIntroductionLetter = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
      const marginLeft = 25;
      const marginRight = 25;
      const contentWidth = pageWidth - marginLeft - marginRight;
      
      // Line height for body text (11pt font)
      const lineHeight = 5.5;
      const paragraphSpacing = 4;
      
      let y = 0;

      // ===== HEADER SECTION =====
      // Navy blue header background (expanded to fit logo, name, and contact)
      const headerHeight = 45;
      doc.setFillColor(27, 58, 95);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');

      // Logo placeholder circle (left side)
      doc.setFillColor(245, 166, 35);
      doc.circle(20, 15, 8, 'F');
      
      // "TL" text in logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(27, 58, 95);
      doc.text('TL', 20, 17.5, { align: 'center' });

      // Company name (right of logo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('TaskLynk', 35, 16);

      // Tagline below company name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const golden = hexToRgb(BRAND_COLORS.golden);
      doc.setTextColor(golden.r, golden.g, golden.b);
      doc.text('Professional Academic Writing Platform', 35, 23);

      // Contact details in header (white text)
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      
      // Line 1: Website and Email
      doc.text(`${COMPANY_INFO.website}  •  ${COMPANY_INFO.email}`, 35, 31);
      
      // Line 2: Phone and Address
      doc.text(`${COMPANY_INFO.phone}  •  ${COMPANY_INFO.address}`, 35, 37);

      // Golden accent line below header
      doc.setDrawColor(245, 166, 35);
      doc.setLineWidth(1);
      doc.line(0, headerHeight, pageWidth, headerHeight);

      // ===== DATE =====
      y = headerHeight + 10;
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(dateStr, pageWidth - marginRight, y, { align: 'right' });

      // ===== LETTER BODY =====
      y = headerHeight + 20;
      
      // Salutation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text('Dear Sir/Madam,', marginLeft, y);
      y += lineHeight * 2;

      // Paragraph 1
      const para1 = 'I hope this message finds you well.';
      doc.text(para1, marginLeft, y);
      y += lineHeight + paragraphSpacing;

      // Paragraph 2
      const para2 = 'I am writing to formally introduce TaskLynk (www.tasklynk.co.ke) and to invite you to consider our platform as a reliable partner for sourcing high-quality academic, professional, and technical work.';
      const para2Lines = doc.splitTextToSize(para2, contentWidth);
      doc.text(para2Lines, marginLeft, y);
      y += (para2Lines.length * lineHeight) + paragraphSpacing;

      // Paragraph 3
      const para3 = 'TaskLynk was created to address a growing challenge faced by employers and account owners: the difficulty of consistently accessing skilled, dependable, and well-managed talent under tight deadlines. Our platform bridges this gap by offering a structured, manager-led system that ensures every task is handled professionally from start to finish.';
      const para3Lines = doc.splitTextToSize(para3, contentWidth);
      doc.text(para3Lines, marginLeft, y);
      y += (para3Lines.length * lineHeight) + paragraphSpacing;

      // Paragraph 4
      const para4 = 'What distinguishes TaskLynk is our hands-on quality assurance model. Every project is overseen by a dedicated human manager, assigned to an experienced specialist, and thoroughly reviewed by an editor before delivery. This multi-layered approach guarantees accuracy, originality, proper formatting, and timely completion, allowing our partners to focus on growth rather than supervision.';
      const para4Lines = doc.splitTextToSize(para4, contentWidth);
      doc.text(para4Lines, marginLeft, y);
      y += (para4Lines.length * lineHeight) + paragraphSpacing + 2;

      // Benefits header
      doc.setFont('helvetica', 'bold');
      const navyBlue = hexToRgb(BRAND_COLORS.navyBlue);
      doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      doc.text('By joining TaskLynk, you gain access to:', marginLeft, y);
      y += lineHeight + 2;

      // Benefits list
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const benefits = [
        'A vetted pool of skilled writers, editors, and technical experts',
        'Managed workflows that reduce risk and save time',
        'Consistent quality control and plagiarism-checked deliverables',
        'Flexible turnaround times, including urgent projects',
        'A professional support team available 24/7'
      ];

      const bulletIndent = 8;
      benefits.forEach(benefit => {
        // Golden bullet
        doc.setFillColor(245, 166, 35);
        doc.circle(marginLeft + 2, y - 1.2, 1, 'F');
        
        // Benefit text
        doc.setTextColor(30, 30, 30);
        const benefitLines = doc.splitTextToSize(benefit, contentWidth - bulletIndent);
        doc.text(benefitLines, marginLeft + bulletIndent, y);
        y += (benefitLines.length * lineHeight) + 1.5;
      });

      y += paragraphSpacing;

      // Paragraph 5
      const para5 = 'We understand that trust and reliability are critical when choosing a platform. For this reason, TaskLynk emphasizes professional ethics, confidentiality, and long-term collaboration. Our goal is not simply to complete tasks, but to build sustainable partnerships that add measurable value to your operations.';
      const para5Lines = doc.splitTextToSize(para5, contentWidth);
      doc.text(para5Lines, marginLeft, y);
      y += (para5Lines.length * lineHeight) + paragraphSpacing;

      // Paragraph 6
      const para6 = 'We would be honored to have you explore TaskLynk and experience firsthand how our platform can streamline your workload and enhance productivity. Should you wish to learn more, our team is readily available to guide you through the process and answer any questions.';
      const para6Lines = doc.splitTextToSize(para6, contentWidth);
      doc.text(para6Lines, marginLeft, y);
      y += (para6Lines.length * lineHeight) + paragraphSpacing;

      // Closing paragraph
      const closing = 'Thank you for your time and consideration. We look forward to the opportunity to work with you.';
      const closingLines = doc.splitTextToSize(closing, contentWidth);
      doc.text(closingLines, marginLeft, y);
      y += (closingLines.length * lineHeight) + lineHeight * 2;

      // ===== SIGNATURE BLOCK =====
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text('Yours faithfully,', marginLeft, y);
      y += lineHeight * 3;

      // Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      doc.text('Maxwell O. Ochieng', marginLeft, y);
      y += lineHeight;

      // Title
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Founder / Director', marginLeft, y);
      y += lineHeight;

      // Company
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      doc.text('TaskLynk', marginLeft, y);
      y += lineHeight + 2;

      // Contact details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(COMPANY_INFO.website, marginLeft, y);
      y += 4;
      doc.text(COMPANY_INFO.email, marginLeft, y);

      // ===== FOOTER SECTION =====
      const footerHeight = 30;
      const footerStartY = pageHeight - footerHeight;
      
      // Golden/Navy gradient footer background
      doc.setFillColor(245, 166, 35);
      doc.rect(0, footerStartY, pageWidth, footerHeight, 'F');

      // Navy bottom stripe
      doc.setFillColor(27, 58, 95);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

      // Tagline (white text on golden)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('TaskLynk — Linking Talent. Delivering Results.', pageWidth / 2, footerStartY + 8, { align: 'center' });

      // Contact info line 1
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(27, 58, 95);
      doc.text(`${COMPANY_INFO.website}  •  ${COMPANY_INFO.email}`, pageWidth / 2, footerStartY + 15, { align: 'center' });

      // Contact info line 2
      doc.text(`${COMPANY_INFO.phone}  •  ${COMPANY_INFO.address}`, pageWidth / 2, footerStartY + 21, { align: 'center' });

      // Save PDF
      const fileName = `TaskLynk_Introduction_Letter_${dateStr.replace(/\s/g, '_')}.pdf`;
      doc.save(fileName);

      toast.success('PDF generated successfully!', {
        description: fileName
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateBlankTemplate = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 25;
      const marginRight = 25;

      // ===== HEADER =====
      const headerHeight = 45;
      doc.setFillColor(27, 58, 95);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');

      // Logo placeholder circle
      doc.setFillColor(245, 166, 35);
      doc.circle(20, 15, 8, 'F');
      
      // "TL" text in logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(27, 58, 95);
      doc.text('TL', 20, 17.5, { align: 'center' });

      // Company name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('TaskLynk', 35, 16);

      // Tagline
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(245, 166, 35);
      doc.text('Professional Academic Writing Platform', 35, 23);

      // Contact details in header
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`${COMPANY_INFO.website}  •  ${COMPANY_INFO.email}`, 35, 31);
      doc.text(`${COMPANY_INFO.phone}  •  ${COMPANY_INFO.address}`, 35, 37);

      // Golden accent line
      doc.setDrawColor(245, 166, 35);
      doc.setLineWidth(1);
      doc.line(0, headerHeight, pageWidth, headerHeight);

      // Date
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(dateStr, pageWidth - marginRight, headerHeight + 10, { align: 'right' });

      // Salutation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text('Dear Sir/Madam,', marginLeft, headerHeight + 20);

      // Placeholder lines for content area
      const footerHeight = 30;
      const footerStartY = pageHeight - footerHeight;
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      for (let i = 0; i < 25; i++) {
        const lineY = (headerHeight + 35) + (i * 7);
        if (lineY < footerStartY - 10) {
          doc.setLineDashPattern([2, 2], 0);
          doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
        }
      }
      doc.setLineDashPattern([], 0);

      // ===== FOOTER =====
      doc.setFillColor(245, 166, 35);
      doc.rect(0, footerStartY, pageWidth, footerHeight, 'F');

      // Navy bottom stripe
      doc.setFillColor(27, 58, 95);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

      // Tagline
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('TaskLynk — Linking Talent. Delivering Results.', pageWidth / 2, footerStartY + 8, { align: 'center' });

      // Contact info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(27, 58, 95);
      doc.text(`${COMPANY_INFO.website}  •  ${COMPANY_INFO.email}`, pageWidth / 2, footerStartY + 15, { align: 'center' });
      doc.text(`${COMPANY_INFO.phone}  •  ${COMPANY_INFO.address}`, pageWidth / 2, footerStartY + 21, { align: 'center' });

      doc.save(`TaskLynk_Letterhead_Template_${dateStr.replace(/\s/g, '_')}.pdf`);
      toast.success('Blank template generated!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate template');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Downloads</h1>
        <p className="text-muted-foreground">Generate professional documents with TaskLynk branding</p>
      </div>

      <Tabs defaultValue="introduction" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="introduction">Introduction Letter</TabsTrigger>
          <TabsTrigger value="templates">Blank Templates</TabsTrigger>
        </TabsList>

        {/* Introduction Letter Tab */}
        <TabsContent value="introduction" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#1B3A5F] to-[#2D5582] shadow-md">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Company Introduction Letter</CardTitle>
                  <CardDescription className="mt-1">
                    Professional letter for potential clients, partners, and collaborators
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Letter Preview */}
              <div className="bg-muted/20 border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-3 text-sm uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-[#1B3A5F]" />
                  Letter Preview
                </h3>
                <div className="bg-card rounded-lg border border-border p-5 shadow-sm max-h-[400px] overflow-y-auto">
                  <div className="text-sm text-foreground space-y-3">
                    <p className="font-medium text-foreground">Dear Sir/Madam,</p>
                    <p className="leading-relaxed">I hope this message finds you well.</p>
                    <p className="leading-relaxed">
                      I am writing to formally introduce <strong className="text-[#1B3A5F]">TaskLynk</strong> (www.tasklynk.co.ke) 
                      and to invite you to consider our platform as a reliable partner for sourcing high-quality academic, 
                      professional, and technical work.
                    </p>
                    <p className="leading-relaxed text-muted-foreground">
                      TaskLynk was created to address a growing challenge faced by employers and account owners: 
                      the difficulty of consistently accessing skilled, dependable, and well-managed talent under tight deadlines...
                    </p>
                    
                    {/* Benefits Section */}
                    <div className="border-l-4 border-[#F5A623] pl-4 py-3 my-4 bg-amber-50/50 rounded-r-lg">
                      <p className="font-semibold text-[#1B3A5F] mb-3">By joining TaskLynk, you gain access to:</p>
                      <ul className="space-y-2">
                        {[
                          'A vetted pool of skilled writers, editors, and technical experts',
                          'Managed workflows that reduce risk and save time',
                          'Consistent quality control and plagiarism-checked deliverables',
                          'Flexible turnaround times, including urgent projects',
                          'A professional support team available 24/7'
                        ].map((benefit, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <p className="text-muted-foreground italic text-sm">... continues with closing remarks and signature by Maxwell O. Ochieng, Founder/Director</p>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={generateIntroductionLetter}
                  disabled={generating}
                  className="bg-gradient-to-r from-[#1B3A5F] to-[#2D5582] hover:from-[#2D5582] hover:to-[#1B3A5F] text-white shadow-md hover:shadow-lg transition-all"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Introduction Letter
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">PDF format • A4 size • Print-ready</span>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="text-blue-600 text-lg">📄</div>
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-semibold mb-1">Professional Letterhead Included</p>
                    <p className="text-blue-800 dark:text-blue-200">
                      This PDF features TaskLynk branded letterhead with company colors, contact details, 
                      and a professional footer. Perfect for client outreach and partnership proposals.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Blank Template Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#FFD278] shadow-md">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Blank Letterhead</CardTitle>
                    <CardDescription className="mt-1">
                      Template for custom letters and documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Download a blank template with TaskLynk letterhead and footer. Use this for writing custom letters, 
                  proposals, contracts, or other professional documents.
                </p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-gray-500 font-medium mb-2">INCLUDES:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Branded header with company name</li>
                    <li>• Contact information bar</li>
                    <li>• Professional footer design</li>
                    <li>• Guideline marks for writing area</li>
                  </ul>
                </div>
                <Button
                  onClick={generateBlankTemplate}
                  disabled={generating}
                  variant="outline"
                  className="w-full border-[#F5A623] text-[#1B3A5F] hover:bg-[#F5A623]/10 hover:border-[#F5A623]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Blank Template
                </Button>
              </CardContent>
            </Card>

            {/* Brand Guidelines Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#1B3A5F] to-[#2D5582] shadow-md">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Brand Reference</CardTitle>
                    <CardDescription className="mt-1">
                      TaskLynk branding standards and colors
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Color Palette */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Primary Colors</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div 
                        className="h-14 rounded-lg shadow-inner border border-slate-200" 
                        style={{ backgroundColor: BRAND_COLORS.navyBlue }}
                      />
                      <p className="text-xs text-gray-600 mt-2 font-medium">Navy Blue</p>
                      <p className="text-xs text-gray-400">{BRAND_COLORS.navyBlue}</p>
                    </div>
                    <div className="flex-1">
                      <div 
                        className="h-14 rounded-lg shadow-inner border border-slate-200" 
                        style={{ backgroundColor: BRAND_COLORS.golden }}
                      />
                      <p className="text-xs text-gray-600 mt-2 font-medium">Golden</p>
                      <p className="text-xs text-gray-400">{BRAND_COLORS.golden}</p>
                    </div>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Details</p>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-1.5">
                    <p className="text-sm text-gray-700 flex items-center gap-3">
                      <span className="text-gray-400">🌐</span> {COMPANY_INFO.website}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-3">
                      <span className="text-gray-400">📧</span> {COMPANY_INFO.email}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-3">
                      <span className="text-gray-400">📞</span> {COMPANY_INFO.phone}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-3">
                      <span className="text-gray-400">📍</span> {COMPANY_INFO.address}
                    </p>
                  </div>
                </div>

                {/* Tagline */}
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tagline</p>
                  <p className="text-sm text-[#1B3A5F] font-medium italic">
                    "TaskLynk — Linking Talent. Delivering Results."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
