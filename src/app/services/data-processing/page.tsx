import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileSpreadsheet,
  CheckCheck,
  FileText,
  Filter,
  ShieldCheck,
  Database,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Data Processing, Data Entry & Office Productivity Services | TaskLynk Kenya',
  'Fast, accurate data entry, survey data cleaning, Excel spreadsheet formatting, PDF-to-Word conversion, and document preparation handled by verified specialists under TaskLynk quality control.',
  '/services/data-processing'
);

const faqs = [
  {
    question: 'How do you guarantee 100% data entry accuracy?',
    answer:
      'We use double-entry verification protocols and automated validation scripts to check data types, detect outlier values, and audit against source scans or survey sheets before delivery.',
  },
  {
    question: 'Can you handle large backlogs of physical paper forms or survey questionnaires?',
    answer:
      'Yes. Our team regularly digitizes handwritten survey responses, invoices, medical records, and inventory logbooks into structured Excel, CSV, or database formats.',
  },
  {
    question: 'Is client confidential information protected?',
    answer:
      'Yes. All datasets and source files are processed under enforceable Non-Disclosure Agreements (NDAs). Uploaded files are transmitted securely and deleted permanently upon milestone sign-off.',
  },
];

const relatedServices = [
  { label: 'Statistical Data Analytics', href: '/services/data-analytics' },
  { label: 'Virtual Assistance Support', href: '/services/virtual-assistance' },
  { label: 'Accounting & Financial Support', href: '/services/accounting-support' },
  { label: 'Professional Writing & Formatting', href: '/services/professional-writing' },
];

const deliverables = [
  {
    title: 'Survey Coding & Questionnaire Digitization',
    description: 'Transform paper questionnaires and online survey forms into clean, labeled datasets (.sav, .csv, .xlsx) ready for statistical testing.',
    icon: ClipboardList,
  },
  {
    title: 'Data Cleaning & Outlier Diagnostics',
    description: 'Deduplication, missing-value imputation, text standardization, and format normalization to make your data trustworthy.',
    icon: Filter,
  },
  {
    title: 'Excel Spreadsheet Automation & Formatting',
    description: 'Custom formula construction, VLOOKUP/XLOOKUP, conditional formatting rules, dynamic dropdowns, and printable presentation layouts.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Document Conversion & Precision Formatting',
    description: 'Convert scanned PDFs into editable, perfectly styled Word and PowerPoint presentations formatted to institutional rubrics.',
    icon: FileText,
  },
];

export default async function DataProcessingPage() {
  const specialists = await getPublishedSpecialists({ category: 'data', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/data-processing"
      serviceSchemaName="Data Processing and Office Productivity Services"
      serviceSchemaDescription="High-accuracy data entry, cleaning, spreadsheet automation, and document formatting by TaskLynk."
      heroEyebrow="Data & Analytics"
      heroTitle="Data Processing & Office Productivity Services"
      heroIntro="Eliminate administrative data bottlenecks with rapid, audit-verified data entry, survey coding, spreadsheet automation, and document formatting delivered by TaskLynk’s managed team."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Data+Processing"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Operational Efficiency
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Clean, Accurate Data Ready for Analysis &amp; Decision-Making
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Don’t let messy spreadsheets or unentered surveys slow your progress. Our team handles the heavy lifting with meticulous attention to detail.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.title}
                className="linen-card rounded-2xl p-6 hover:border-[#FF7A3D] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceTeamShowcase
        title="Data Processing & Operations Specialists"
        subtitle="Accredited data clerks and spreadsheet specialists from TaskLynk."
        specialists={specialists}
        serviceCategory="Data Processing"
      />
    </ServicePageShell>
  );
}
