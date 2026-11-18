import type { Metadata } from 'next';
import Link from 'next/link';
import { PenTool, FileText, CheckCircle, Clock, ShieldCheck, Award, BookOpen, Users } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Research Paper Proofreading | Polish Your Manuscript',
  'Professional research paper proofreading by accredited editors. Grammar, punctuation, academic tone, citation accuracy, and formatting compliance. Secure NDA protection and fast turnaround.',
  '/services/research/proofreading'
);

const faqs = [
  {
    question: 'What does your proofreading service include?',
    answer: 'Our proofreading service covers grammar, spelling, punctuation, and syntax correction. We also check academic tone consistency, sentence flow, clarity of expression, citation and reference accuracy (APA, MLA, Chicago, Harvard, IEEE), formatting compliance (margins, fonts, headings, spacing), figure and table labeling, and overall readability. We provide both a tracked-changes document showing every edit and a clean submission-ready copy. For more extensive developmental editing, we offer separate editing services.',
  },
  {
    question: 'How do you ensure my paper stays confidential?',
    answer: 'Confidentiality is our top priority. All editors sign our comprehensive non-disclosure agreement before accessing any client materials. We use secure file transfer with end-to-end encryption, access files only on our secure platform, and never store papers on personal devices. Your research remains exclusively yours throughout the process.',
  },
  {
    question: 'What is the difference between proofreading and editing?',
    answer: 'Proofreading is the final stage of the editorial process, focusing on surface-level errors: grammar, spelling, punctuation, syntax, and formatting consistency. Editing is more comprehensive, addressing structural issues, argument clarity, paragraph organization, tone, flow, and citation accuracy. We offer both services—proofreading for nearly-final drafts and editing for drafts that need more substantial revision.',
  },
  {
    question: 'Which citation styles do you support?',
    answer: 'We support all major citation styles including APA (7th edition), MLA (9th edition), Chicago (17th edition), Harvard, IEEE, OSCOLA, Vancouver, and AMA. Our editors are trained in the specific requirements of each style and cross-check every in-text citation against the bibliography and vice versa. We also verify that figure captions, table notes, and reference lists follow the style guide consistently.',
  },
  {
    question: 'How quickly can you proofread my paper?',
    answer: 'We offer flexible turnaround options. Standard service takes 3-5 days for most papers. Express service (24-48 hours) is available for urgent submissions. Super-express service (3-12 hours) is available for emergencies, subject to editor availability. You choose your preferred turnaround when submitting your project.',
  },
  {
    question: 'Do you provide tracked changes or a clean copy?',
    answer: 'We provide both. The tracked-changes version shows every edit, correction, suggestion, and comment we\'ve made, allowing you to review and accept or reject individual changes. The clean copy is the final, polished version ready for submission. Some clients prefer both versions; others request only the clean copy for final submission.',
  },
];

const relatedServices = [
  { label: 'Research Assistance', href: '/services/research/research-assistance' },
  { label: 'Data Editing & Cleaning', href: '/services/research/data-editing' },
  { label: 'Literature Research', href: '/services/research/literature-research' },
  { label: 'Academic Writing Services', href: '/services/academic-writing' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Data Collection Services', href: '/services/research/data-collection' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Join as Editor', href: '/register/freelancer' },
];

export default function ProofreadingPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/research/proofreading"
      serviceSchemaName="Research Paper Proofreading"
      serviceSchemaDescription="Professional research paper proofreading by accredited editors. Grammar, punctuation, academic tone, citation accuracy, and formatting compliance with NDA protection and fast turnaround."
      heroEyebrow="Proofreading"
      heroTitle="Research Paper Proofreading | Polish Your Manuscript"
      heroIntro="Even the strongest research can be undermined by a single typo, a misplaced comma, or a citation error. Examiners, journal reviewers, and supervisors notice these details—and they judge your professionalism by them. TaskLynk connects you with accredited proofreaders and senior academic editors who polish your manuscript to the highest standards. With secure NDA protection, tracked changes for full transparency, and fast turnaround options including 3-hour express service, your paper gets the final polish it deserves before submission."
      faqs={faqs}
      relatedServices={relatedServices}
    >
      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Who This Service Is For
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                This service is for researchers and academics who have a completed or near-complete draft and need professional proofreading and editorial review. <strong>Undergraduate students</strong> who have completed assignments, essays, or research papers and need a final check for grammar, punctuation, and formatting before submission. <strong>Master's candidates</strong> preparing theses or capstone projects for final review, needing checks on citation accuracy, reference list consistency, and overall document formatting. <strong>PhD students</strong> who have completed dissertation chapters or full dissertations and need professional proofreading for grammar, academic tone, and formatting compliance before submission or defense. <strong>Academic faculty</strong> preparing manuscripts for journal submission who want a final editorial check before sending to co-authors or submitting to publications. <strong>Researchers</strong> preparing conference papers, working papers, or policy briefs that require professional editing. <strong>Graduate teaching assistants</strong> who need help checking papers they are grading or reviewing. <strong>Non-native English speakers</strong> who need additional support with language, grammar, and academic expression.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you have a draft that is content-complete but needs professional polish—grammar checks, citation verification, formatting compliance, and academic tone refinement—our proofreading service provides expert-level support. We also offer complementary services including <Link href="/services/research/data-editing" className="text-primary font-semibold hover:underline">data editing and cleaning</Link> for research datasets, <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis</Link> for statistical interpretation, and <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">research assistance</Link> for ongoing support. For authors who need more extensive developmental editing, our <Link href="/services/academic-writing" className="text-primary font-semibold hover:underline">academic editing services</Link> provide comprehensive revision support.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                What We Offer: Multi-Layer Editorial Review by Accredited Editors
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our proofreading service provides a comprehensive, multi-layer editorial review conducted by accredited academic editors who possess both linguistic expertise and deep familiarity with disciplinary conventions. The first layer of review focuses on <strong>surface-level corrections</strong>: grammar, spelling, punctuation, syntax, and sentence structure. Our editors use a systematic approach—checking each sentence for grammatical accuracy, identifying typos and spelling errors, ensuring punctuation follows standard conventions, and verifying that sentence logic flows clearly. We also check for common issues such as subject-verb agreement, article usage, tense consistency, pronoun reference clarity, and redundancy.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                The second layer addresses <strong>academic style and tone</strong>. Our editors ensure your writing maintains a consistent academic register, uses discipline-appropriate terminology, and communicates with precision and authority. We check paragraph structure for logical flow, verify that transitions between ideas are smooth, and ensure that complex concepts are explained clearly without oversimplification. For non-native English speakers, we provide particular attention to common ESL writing patterns, helping refine phrasing and expression to meet native-level academic standards. We also verify that your argument progression is coherent and that each paragraph contributes to your overall thesis or research narrative.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Grammar &amp; Mechanics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive correction of grammar, spelling, punctuation, syntax, and sentence structure errors with detailed comments.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Citation Accuracy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  In-text citation and bibliography verification across APA, MLA, Chicago, Harvard, IEEE, and other styles.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Formatting Compliance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Verification of margins, fonts, headings, spacing, page numbering, and institutional formatting requirements.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Tracked Changes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dual delivery with tracked-changes document and clean submission-ready copy, allowing you to review every edit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Our Editorial Process and Quality Assurance
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Every manuscript undergoes our rigorous three-step quality assurance process before delivery. First, a qualified editor conducts the initial proofreading pass, applying systematic corrections to grammar, punctuation, citation formatting, and academic tone. Second, a senior reviewer performs a quality check—a second editor reviews the changes for consistency, accuracy, and completeness, verifying that no errors were missed and that the academic voice remains consistent throughout. Third, a project manager conducts a final review to ensure all your specific requirements were met, including formatting guidelines, citation style compliance, and institutional standards.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>dissertation-level work</strong>, we offer an enhanced review process that includes subject-matter expertise verification. Our editors for doctoral-level projects have advanced degrees in relevant fields and understand both the technical and formal requirements of dissertation submission. We also provide <strong>specialized services</strong> for journal manuscript preparation, conference paper review, thesis defense slide proofreading, and reference list formatting. For papers requiring <strong>citation accuracy verification</strong>, we cross-check every in-text citation against the bibliography and vice versa, ensuring no citations are missing, no references are uncited, and all formatting follows the required style guide. This meticulous approach is why our clients maintain a <strong>4.8/5 satisfaction rating</strong> across thousands of proofread manuscripts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for Research Paper Proofreading
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Academic proofreading requires more than linguistic accuracy—it demands understanding of disciplinary conventions, citation standards, institutional formatting requirements, and the nuanced expectations of examiners and reviewers. A generalist editor may correct grammar but miss discipline-specific terminology misuse, citation format errors, or formatting inconsistencies that signal carelessness. TaskLynk's marketplace connects you with accredited academic editors who possess advanced degrees in relevant fields and have demonstrated expertise in scholarly publishing and academic writing standards. Every editor has passed our certification process, which includes grammar and style assessments, citation accuracy tests, and sample editing evaluations.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond editorial expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve edits before payment, <strong>track changes transparency</strong> so you can review every modification, and <strong>NDA protection</strong> for your research and intellectual property. For academic researchers, we also offer <Link href="/services/research/data-editing" className="text-primary font-semibold hover:underline">data editing and cleaning</Link>, <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis</Link>, and <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">research assistance</Link>. For writers seeking to join our editorial network, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">register as a freelancer</Link> to connect with researchers worldwide. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">submit your manuscript</Link> today for professional proofreading with fast turnaround options including 3-hour express service.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
