import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Search,
  FileSpreadsheet,
  Building2,
  PieChart,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Market Research, Business Plans & Feasibility Studies Kenya | TaskLynk',
  'Bank-ready business plans with 5-year pro-forma financials, commercial feasibility studies, competitor intelligence, and market sizing reports prepared by verified business researchers.',
  '/services/business-research'
);

const faqs = [
  {
    question: 'Are your business plans accepted by Kenyan commercial banks and venture investors?',
    answer:
      'Yes. Our business plans include complete market analyses, operational roadmaps, risk matrices, and 5-year financial models (P&L, Cash Flow, Balance Sheet, Break-even analysis) formatted to standards required by commercial banks and angel investors.',
  },
  {
    question: 'What methodology do you use for market research and feasibility studies?',
    answer:
      'We combine primary data collection (interviews, surveys, target customer questionnaires) with robust secondary intelligence (industry reports, KNBS macroeconomic data, regulatory filings, and competitor audits).',
  },
  {
    question: 'How fast can a business plan or feasibility study be drafted?',
    answer:
      'Standard turnaround for a comprehensive commercial business plan or feasibility report is 5 to 7 business days. Express delivery is available for urgent bank or grant applications.',
  },
];

const relatedServices = [
  { label: 'Business Plan Cost in Kenya', href: '/pricing/how-much-does-a-business-plan-cost-in-kenya' },
  { label: 'Statistical Data Analytics', href: '/services/data-analytics' },
  { label: 'Accounting & Financial Support', href: '/services/accounting-support' },
  { label: 'Professional Writing & Presentations', href: '/services/professional-writing' },
];

const deliverables = [
  {
    title: 'Bank-Ready Strategic Business Plans',
    description: 'Comprehensive business plans with 5-year financial forecasts, market sizing, competitive analysis, and operational plans.',
    icon: Building2,
  },
  {
    title: 'Commercial Feasibility Studies',
    description: 'De-risk new business ventures and capital investments with deep demographic analysis, regulatory landscape reviews, and sensitivity modeling.',
    icon: Target,
  },
  {
    title: 'Competitor Intelligence & Market Sizing',
    description: 'Actionable intelligence on direct and indirect competitors, pricing structures, customer pain points, and addressable market opportunity (TAM/SAM/SOM).',
    icon: Search,
  },
  {
    title: 'Grant Proposals & Investment Memos',
    description: 'High-converting donor grant proposals, angel investment memorandums, and executive summaries crafted to secure financing.',
    icon: TrendingUp,
  },
];

export default async function BusinessResearchPage() {
  const specialists = await getPublishedSpecialists({ category: 'research', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/business-research"
      serviceSchemaName="Business Research and Market Intelligence Services"
      serviceSchemaDescription="Commercial feasibility studies, investor-ready business plans, and market intelligence by TaskLynk."
      heroEyebrow="Research & Strategy"
      heroTitle="Business Research & Market Intelligence"
      heroIntro="Make high-stakes business moves backed by hard evidence. TaskLynk coordinates veteran business researchers and financial modelers to deliver bank-ready business plans, feasibility studies, and competitor intelligence."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Business+Research"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Strategic Insight
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Evidence-Based Intelligence to Secure Capital &amp; Outmaneuver Rivals
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Whether you are applying for commercial debt financing, pitching angel investors, or validating market expansion, our reports provide clear, rigorous analysis.
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
        title="Accredited Business & Market Researchers"
        subtitle="Vetted management consultants and researchers from TaskLynk."
        specialists={specialists}
        serviceCategory="Business Research"
      />
    </ServicePageShell>
  );
}
