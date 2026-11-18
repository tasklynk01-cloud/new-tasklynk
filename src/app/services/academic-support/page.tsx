import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  FileCheck,
  ShieldCheck,
  CheckCircle,
  Award,
  ArrowRight,
  Library,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Academic Support, Postgraduate Thesis & Dissertation Assistance Kenya | TaskLynk',
  'Master’s and PhD dissertation guidance, conceptual frameworks, methodology design, APA 7th / Harvard referencing, and official Turnitin similarity reports overseen by senior academic editors.',
  '/services/academic-support'
);

const faqs = [
  {
    question: 'How do you guarantee 0% plagiarism and academic integrity?',
    answer:
      'All deliverables are drafted from scratch strictly according to your university instructions. Every project undergoes automated scanning via official Turnitin similarity engines with zero repository storage, and a certified report is provided upon delivery.',
  },
  {
    question: 'Are your editors familiar with Kenyan university thesis guidelines?',
    answer:
      'Yes. Our academic editorial team includes postgraduates and faculty researchers from leading universities including University of Nairobi (UoN), Kenyatta University (KU), Strathmore, USIU-Africa, JKUAT, as well as UK, US, and Australian universities.',
  },
  {
    question: 'What citation styles do you support?',
    answer:
      'We support APA 7th Edition, Harvard, MLA 9th, Chicago/Turabian, IEEE, Vancouver, and OSCOLA for legal research.',
  },
  {
    question: 'Can you assist with specific chapters like Methodology or Literature Review?',
    answer:
      'Yes. You can request chapter-by-chapter milestones (e.g. Chapter 1: Introduction, Chapter 2: Literature Review, Chapter 3: Research Methodology, Chapter 4: Data Analysis, or Chapter 5: Conclusions).',
  },
];

const relatedServices = [
  { label: 'MBA Thesis Proofreading Kenya', href: '/services/academic-writing/mba-thesis-proofreading-kenya' },
  { label: 'SPSS Data Analysis Nairobi', href: '/services/data-analysis/spss-data-analysis-services-nairobi' },
  { label: 'Statistical Data Analytics', href: '/services/data-analytics' },
  { label: 'Professional Writing & Formatting', href: '/services/professional-writing' },
];

const deliverables = [
  {
    title: 'Postgraduate Thesis & Dissertation Support',
    description: 'Methodological guidance from concept paper to final defence preparation across Master’s and PhD academic disciplines.',
    icon: GraduationCap,
  },
  {
    title: 'Theoretical & Empirical Literature Reviews',
    description: 'Synthesizing recent peer-reviewed journal papers (2020–2026), identifying knowledge gaps, and establishing rigorous conceptual frameworks.',
    icon: Library,
  },
  {
    title: 'Research Methodology & Instrument Design',
    description: 'Sampling technique formulation, questionnaire design, validity testing (Cronbach’s alpha), and research ethics compliance.',
    icon: BookOpen,
  },
  {
    title: 'Turnitin Verification & Citation Auditing',
    description: 'Exhaustive line-by-line citation verification, reference list formatting (APA 7th, Harvard, IEEE), and similarity index eradication.',
    icon: FileCheck,
  },
];

export default async function AcademicSupportPage() {
  const specialists = await getPublishedSpecialists({ category: 'academic', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/academic-support"
      serviceSchemaName="Academic Support and Postgraduate Thesis Services"
      serviceSchemaDescription="Rigorous academic research assistance, postgraduate dissertation methodology, and citation auditing."
      heroEyebrow="Academic Support"
      heroTitle="Academic Support, Thesis & Dissertation Assistance"
      heroIntro="Navigate demanding academic research requirements with guidance from accredited subject specialists and senior editors. We assist postgraduates and university researchers with literature reviews, methodology design, and citation precision backed by Turnitin verification."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Academic+Writing"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Academic Integrity
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Rigorous Academic Standards Aligned with Top Universities
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Supervisors demand methodological precision, valid sampling, and flawless referencing. Our academic specialists guide your research to meet demanding institutional rubrics.
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
        title="Accredited Academic Researchers & Senior Editors"
        subtitle="Meet verified academic scholars and senior editors from TaskLynk."
        specialists={specialists}
        serviceCategory="Academic Support"
      />
    </ServicePageShell>
  );
}
