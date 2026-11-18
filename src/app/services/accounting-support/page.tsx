import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator,
  Receipt,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Building,
  ArrowRight,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Accounting, Bookkeeping & Financial Reporting Services Kenya | TaskLynk',
  'Professional bookkeeping, bank reconciliation, P&L statements, balance sheet preparation, payroll support, and QuickBooks/Xero management by accredited Kenyan accountants under TaskLynk oversight.',
  '/services/accounting-support'
);

const faqs = [
  {
    question: 'Which accounting software do your specialists use?',
    answer:
      'Our team is certified in QuickBooks Online, Xero, Zoho Books, Sage, Wave, and Microsoft Excel financial models.',
  },
  {
    question: 'Can you bring my delinquent or overdue books up to date?',
    answer:
      'Yes. We offer catch-up and cleanup bookkeeping services, matching months or years of bank statements and M-Pesa statements with accurate expense categories and vendor bills.',
  },
  {
    question: 'Do you prepare management accounts and financial statements?',
    answer:
      'Yes. We generate monthly and quarterly Profit & Loss (Income) statements, Balance Sheets, Cash Flow statements, and variance analysis reports ready for executive leadership and bank audits.',
  },
];

const relatedServices = [
  { label: 'Virtual Assistance Support', href: '/services/virtual-assistance' },
  { label: 'Data Analytics & Statistics', href: '/services/data-analytics' },
  { label: 'Data Processing & Productivity', href: '/services/data-processing' },
  { label: 'Business Research & Intelligence', href: '/services/business-research' },
];

const deliverables = [
  {
    title: 'Routine Bookkeeping & Reconciliation',
    description: 'Accurate categorization of bank, credit card, and M-Pesa paybill/till statements to maintain a clean general ledger.',
    icon: Receipt,
  },
  {
    title: 'Monthly & Annual Financial Statements',
    description: 'Auditor-ready Profit & Loss statements, Balance Sheets, and Cash Flow summaries formatted to IFRS for SMEs.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Accounts Payable & Receivable Management',
    description: 'Timely client invoice dispatch, aging debtor tracking, vendor bill management, and payment verification.',
    icon: Calculator,
  },
  {
    title: 'Payroll Preparation & Tax Filing Schedules',
    description: 'Staff payroll computations, statutory deduction summaries (PAYE, NSSF, SHA, Housing Levy), and remittance schedules.',
    icon: Building,
  },
];

export default async function AccountingSupportPage() {
  const specialists = await getPublishedSpecialists({ category: 'finance', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/accounting-support"
      serviceSchemaName="Accounting and Financial Support Services"
      serviceSchemaDescription="Professional bookkeeping, bank reconciliation, and management accounting services by TaskLynk."
      heroEyebrow="Business Support"
      heroTitle="Accounting, Bookkeeping & Financial Support"
      heroIntro="Maintain pristine financial records without the overhead of an in-house accounting department. TaskLynk coordinates accredited CPA accountants and financial analysts to deliver accurate bookkeeping, financial reports, and reconciliation."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Accounting+Support"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Financial Integrity
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Pristine Financial Books That Empower Better Business Decisions
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Messy financial records lead to cash flow blindspots and compliance penalties. Our certified finance team keeps your numbers precise and up to date.
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
        title="Accredited Accounting & Financial Specialists"
        subtitle="Meet certified CPA accountants and financial analysts from TaskLynk."
        specialists={specialists}
        serviceCategory="Accounting Support"
      />
    </ServicePageShell>
  );
}
