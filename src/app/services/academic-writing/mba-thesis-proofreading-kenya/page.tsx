import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  FileCheck2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  Search,
  PenTool,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'MBA Thesis Proofreading Kenya | SBS, UoN, USIU, KU Defense-Ready',
  'Professional MBA thesis proofreading and editing in Kenya. Expert APA 7th & Harvard formatting, Turnitin plagiarism audit under 10%, rubric alignment, and supervisor revision support. Strathmore, UoN, USIU experts.',
  '/services/academic-writing/mba-thesis-proofreading-kenya'
);

const faqs = [
  {
    question: 'What is the difference between proofreading and substantive thesis editing?',
    answer:
      'Proofreading focuses on correcting typographical, grammatical, punctuation, and typographical formatting errors. Our MBA substantive editing goes deeper: we audit logical flow between research objectives and Chapter 4 findings, eliminate passive voice, ensure academic rigor, verify all citations against your bibliography in APA 7th or Harvard, and ensure compliance with your postgraduate school manual.',
  },
  {
    question: 'Which Kenyan business schools do you have specific experience with?',
    answer:
      'We have audited hundreds of MBA, EMBA, and MSc dissertations for Strathmore Business School (SBS), University of Nairobi (UoN School of Business & CHSS), USIU-Africa Chandaria School of Business, Kenyatta University (KU Graduate School), JKUAT, Daystar University, and Catholic University of Eastern Africa (CUEA).',
  },
  {
    question: 'Will I receive a Turnitin similarity report with my edited thesis?',
    answer:
      'Yes. Every MBA thesis audited by TaskLynk includes an official Turnitin similarity and AI-detection inspection report. We guarantee similarity below your university threshold (typically < 10% or < 15%), ensuring zero risk of academic integrity flags.',
  },
  {
    question: 'How fast can you proofread a 60 to 100-page MBA thesis?',
    answer:
      'Standard turnaround for a full 80-100 page MBA dissertation is 4 to 6 business days. For students with impending defense submission deadlines, our express academic editing team can complete the comprehensive review in 48 to 72 hours.',
  },
  {
    question: 'How are citations and references audited?',
    answer:
      'Every in-text citation (Author, Year) is cross-checked against your reference list. We identify orphaned references, missing citations, incorrect DOIs, and faulty journal formatting, ensuring 100% adherence to APA 7th edition, Harvard SBS style, or Chicago/Turabian guidelines.',
  },
  {
    question: 'What if my supervisor requests further corrections after proofreading?',
    answer:
      'We provide free, unlimited revisions aligned with your supervisor’s written rubric comments. Simply share the track-changes document from your defense committee, and your dedicated editor will update the manuscript within 48 hours at no additional charge.',
  },
];

const relatedServices = [
  { label: 'SPSS Data Analysis Nairobi', href: '/services/data-analysis/spss-data-analysis-services-nairobi' },
  { label: 'Academic Writing Kenya', href: '/services/academic-writing' },
  { label: 'Data Analysts Nairobi', href: '/services/data-analysis/data-analysts-nairobi' },
  { label: 'How Much Does a Business Plan Cost', href: '/pricing/how-much-does-a-business-plan-cost-in-kenya' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'SPSS Analysts Kenya', href: '/services/data-analysis/spss-analysts-kenya' },
  { label: 'Catalogue of Services', href: '/catalogue' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function MbaThesisProofreadingKenyaPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/academic-writing/mba-thesis-proofreading-kenya"
      serviceSchemaName="MBA Thesis Proofreading Kenya"
      serviceSchemaDescription="Comprehensive MBA thesis proofreading, developmental editing, APA 7th formatting, and Turnitin plagiarism reduction for Kenyan postgraduate students."
      heroEyebrow="Postgraduate Defense Preparation"
      heroTitle="MBA Thesis Proofreading Kenya | SBS, UoN, USIU, KU Defense-Ready"
      heroIntro="Has your supervisor returned your thesis draft with red ink, citation flags, or vague requests to 'improve academic tone and clarity'? TaskLynk provides senior postgraduate editors and PhD-credentialed researchers who refine your MBA thesis to perfection. We eliminate structural flaws, ensure strict APA 7th / Harvard compliance, and deliver an official Turnitin similarity report under 10%—getting your manuscript approved for final oral defense."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/register/client"
    >
      {/* Overview & Academic Scope */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF7A3D] mb-3">
                <GraduationCap className="w-4 h-4" />
                Tailored for Executive &amp; Regular MBA Candidates
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                Stop Revisions in Their Tracks. Get Defense Approval on First Submission.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Balancing a demanding executive career with writing a 20,000-word MBA dissertation is overwhelming. In Kenya, over 65% of thesis delays occur not because the student’s business ideas are flawed, but because of poor academic syntax, inconsistent citation styles, broken alignment between research objectives and Chapter 4 findings, and high Turnitin similarity scores.
              </p>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                TaskLynk pairs you with a dedicated editor who holds a Master&apos;s or PhD in Business Administration, Finance, or Strategic Management. We don&apos;t just run spell-check; we perform a deep structural and grammatical overhaul tailored to your institution&apos;s exact post-graduate manual.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#FF7A3D]" />
                What We Fix in Your Manuscript
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Objective-Result Alignment:</strong> Verifying that every research objective in Chapter 1 is rigorously answered in Chapters 4 &amp; 5.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>APA 7th &amp; Harvard Referencing:</strong> Fixing orphan citations, missing page numbers in direct quotes, and malformed DOI links.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Turnitin Plagiarism Audit:</strong> Rewording accidental overlap and match clusters to drive similarity reliably below 10%.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Executive Academic Tone:</strong> Removing colloquial phrases, unnecessary first-person pronouns, and convoluted passive sentences.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Audit Process Grid */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Comprehensive Audit Pipeline</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              Our 4-Stage MBA Dissertation Review
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-foreground text-sm sm:text-base mb-1">1. Diagnostic Scan</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Initial Turnitin plagiarism inspection, AI content detection, and rubrics gap analysis against your university guidelines.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-foreground text-sm sm:text-base mb-1">2. Line &amp; Copy Editing</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sentence restructuring, eliminating tautologies, tightening argumentation, and standardizing academic terminology.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-foreground text-sm sm:text-base mb-1">3. Citation Cross-Check</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Line-by-line verification of all in-text citations against reference entries using APA 7th or Harvard SBS manuals.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-foreground text-sm sm:text-base mb-1">4. Defense Certificate</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Track-changes manuscript, clean submission copy, digital Turnitin report (&lt;10%), and defense preparation notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Tiering */}
      <section className="py-16 sm:py-20 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Transparent Kenyan Rates</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-2">
              MBA Editing Packages &amp; Pricing
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Flexible options whether you need single-chapter polishing or a complete soup-to-nuts dissertation audit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Chapter-Level Polish</span>
                <h3 className="text-xl font-black text-foreground mt-1">Single Chapter / Proposal</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KES 3,500</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Up to 25 pages • 48h turnaround</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Proposal (Chapters 1-3) or Chapter 4 audit</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Full grammar &amp; syntax line editing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Citation check in APA 7th / Harvard</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Track-changes + clean final document</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#5B3594] hover:bg-[#482A77] text-white font-bold rounded-xl">
                <Link href="/register/client">Order Proposal Polish</Link>
              </Button>
            </div>

            <div className="bg-card border-2 border-[#FF7A3D] rounded-2xl p-6 shadow-md relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF7A3D] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Full Dissertation</span>
                <h3 className="text-xl font-black text-foreground mt-1">Comprehensive Defense Audit</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-[#FF7A3D]">KES 9,500</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">50 - 90 pages • 3-5 days delivery</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Complete Chapters 1 to 5 structural review</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Turnitin similarity audit report (&lt;10%)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Full reference bibliography reconciliation</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Formatting to UoN, Strathmore, USIU manuals</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Free supervisor revision support</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl shadow-md shadow-[#FF7A3D]/25">
                <Link href="/register/client">Get Defense-Ready Now</Link>
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Executive Express</span>
                <h3 className="text-xl font-black text-foreground mt-1">Urgent 48-Hour Defense Audit</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KES 14,500</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Express 48h turnaround • Priority Senior Editor</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Assigned to Senior PhD Business Editor</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 48-Hour expedited delivery</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Direct WhatsApp communication with editor</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Turnitin official PDF certificate included</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Defense oral slide deck formatting (10 slides)</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#5B3594] hover:bg-[#482A77] text-white font-bold rounded-xl">
                <Link href="/register/client">Book Express Audit</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
