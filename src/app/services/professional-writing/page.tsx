import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  FileSignature,
  Presentation,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional Writing, Corporate Profiles & Executive Presentations | TaskLynk',
  'Executive CVs, corporate capability statements, service contracts, NDAs, annual reports, and investor presentation decks written and edited by accredited communications specialists.',
  '/services/professional-writing'
);

const faqs = [
  {
    question: 'How do you guarantee executive writing quality and tone of voice?',
    answer:
      'Every draft is prepared by experienced corporate copywriters and reviewed by senior editors who evaluate clarity, persuasive impact, industry terminology, and grammatical precision.',
  },
  {
    question: 'Are executive CVs and resumes optimized for Applicant Tracking Systems (ATS)?',
    answer:
      'Yes. Our career suite documents are engineered with keyword mapping, clean formatting architectures, and ATS-compliant typography that pass automated corporate screening software.',
  },
  {
    question: 'Can you draft commercial contracts, agreements, and NDAs?',
    answer:
      'Yes. We draft clear, standard commercial contracts, Non-Disclosure Agreements, memoranda of understanding (MOUs), and service-level agreements (SLAs) tailored to your operational relationships.',
  },
];

const relatedServices = [
  { label: 'Business Research & Intelligence', href: '/services/business-research' },
  { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
  { label: 'Academic Support & Thesis', href: '/services/academic-support' },
  { label: 'Virtual Assistance Support', href: '/services/virtual-assistance' },
];

const deliverables = [
  {
    title: 'Executive CVs, Resumes & Cover Letters',
    description: 'Bespoke executive career suites engineered for C-suite, board-level, and international organizational appointments.',
    icon: FileText,
  },
  {
    title: 'Corporate Profiles & Capability Statements',
    description: 'Compelling company profiles crafted to win government tenders, corporate vendor approvals, and international partnerships.',
    icon: BookOpen,
  },
  {
    title: 'Commercial Contracts, NDAs & Agreements',
    description: 'Service-level contracts, bilateral non-disclosure agreements, partnership MOUs, and terms of service drafted with absolute precision.',
    icon: FileSignature,
  },
  {
    title: 'Executive Presentations & Board Decks',
    description: 'Story-driven PowerPoint and Keynote slide decks that articulate complex corporate strategy with clarity and visual punch.',
    icon: Presentation,
  },
];

export default async function ProfessionalWritingPage() {
  const specialists = await getPublishedSpecialists({ category: 'writing', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/professional-writing"
      serviceSchemaName="Professional Writing, Corporate Profiles and Presentations"
      serviceSchemaDescription="Executive corporate writing, commercial contracts, company profiles, and presentation design."
      heroEyebrow="Research & Professional Writing"
      heroTitle="Professional Writing, Profiles & Presentations"
      heroIntro="Communicate with authority, clarity, and persuasive impact. TaskLynk coordinates veteran corporate copywriters, editors, and presentation designers to craft high-stakes company profiles, executive CVs, contracts, and board decks."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Professional+Writing"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Editorial Precision
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Words That Win Tenders, Attract Capital &amp; Elevate Authority
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Poorly written documents undermine professional credibility. Our editorial team refines your messaging into clear, persuasive, and impeccably styled documentation.
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
        title="Accredited Professional Writers & Editors"
        subtitle="Meet verified writers and senior editors from TaskLynk."
        specialists={specialists}
        serviceCategory="Professional Writing"
      />
    </ServicePageShell>
  );
}
