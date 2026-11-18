import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Search, Database, FileText, ClipboardCheck, Award, Users, ShieldCheck } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Literature Research Services | Systematic Reviews & Source Gathering',
  'Professional literature research including systematic reviews, scoping reviews, meta-analyses, reference management, and annotated bibliographies. Hire vetted research professionals.',
  '/services/research/literature-research'
);

const faqs = [
  {
    question: 'What types of literature reviews do you conduct?',
    answer: 'We conduct systematic reviews (following PRISMA guidelines), scoping reviews (following Arksey & O\'Malley or Levac frameworks), narrative literature reviews, critical literature reviews, annotated bibliographies, and meta-analyses. We also perform rapid reviews, umbrella reviews, and integrative reviews. Each type follows established methodological standards appropriate to your research question and field.',
  },
  {
    question: 'Which databases and sources do you search?',
    answer: 'Our specialists search across major academic databases including PubMed/MEDLINE, Scopus, Web of Science, JSTOR, Google Scholar, Cochrane Library, CINAHL, ERIC, EconLit, PsycINFO, IEEE Xplore, and discipline-specific databases. We also search grey literature sources including government reports, conference proceedings, dissertations (ProQuest), preprint servers (bioRxiv, SSRN, arXiv), and institutional repositories. We can also search proprietary databases relevant to your field.',
  },
  {
    question: 'Do you provide PRISMA flow diagrams and documentation?',
    answer: 'Yes. For systematic reviews, we provide complete PRISMA documentation including the PRISMA flow diagram showing study identification, screening, eligibility, and inclusion numbers. We also document search strategies with exact search strings for each database, reasons for study exclusion, and quality assessment of included studies using tools like CASP, Cochrane Risk of Bias, or JBI checklists as appropriate.',
  },
  {
    question: 'What reference management software do you use?',
    answer: 'Our literature specialists are proficient in EndNote, Zotero, and Mendeley. We can organize, deduplicate, and format references from any database export. We also provide formatted reference lists in APA, MLA, Chicago, Harvard, IEEE, or any custom style required by your institution or journal.',
  },
  {
    question: 'How do you handle large-scale literature reviews with thousands of articles?',
    answer: 'For large-scale reviews, we employ systematic screening protocols with inter-rater reliability checks. Two independent reviewers screen titles and abstracts, with a third reviewer resolving conflicts. For full-text screening, we use standardized extraction forms with clear inclusion/exclusion criteria. We can also use AI-assisted screening tools (Rayyan, Covidence) to accelerate the process while maintaining rigor.',
  },
  {
    question: 'Can you help write the literature review chapter for my thesis?',
    answer: 'Yes. We produce full literature review chapters organized by themes, chronology, methodology, or theoretical framework—whichever structure best suits your research. We also write journal article literature review sections, conference paper background sections, and grant proposal literature sections. All work includes proper citation and integration of findings across studies.',
  },
];

const relatedServices = [
  { label: 'Research Assistance', href: '/services/research/research-assistance' },
  { label: 'Data Collection Services', href: '/services/research/data-collection' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Proofreading Services', href: '/services/research/proofreading' },
  { label: 'Academic Writing Services', href: '/services/academic-writing' },
  { label: 'Data Editing & Cleaning', href: '/services/research/data-editing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Register as Freelancer', href: '/register/freelancer' },
];

export default function LiteratureResearchPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/research/literature-research"
      serviceSchemaName="Literature Research Services"
      serviceSchemaDescription="Professional literature research including systematic reviews, scoping reviews, meta-analyses, reference management, and annotated bibliographies following PRISMA guidelines."
      heroEyebrow="Literature Research"
      heroTitle="Literature Research Services | Systematic Reviews & Source Gathering"
      heroIntro="A well-conducted literature review is the foundation of credible academic research. But navigating thousands of academic articles, applying rigorous selection criteria, and synthesizing findings across dozens or hundreds of sources is a task that can take weeks or months—even for experienced researchers. TaskLynk connects you with vetted literature research specialists who have mastered systematic review methodology, database searching, reference management, and scholarly synthesis. Whether you need a full systematic review following PRISMA guidelines, a scoping review to map evidence landscapes, or a targeted literature synthesis for your thesis, our marketplace delivers expert-level literature research with secure milestone payments and NDA protection."
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
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                This service is for researchers who need comprehensive, systematic literature research support. <strong>PhD candidates</strong> conducting dissertations that require systematic literature reviews with PRISMA documentation, meta-analyses, or evidence synthesis across hundreds of sources. <strong>Master's students</strong> who need literature reviews for theses or capstone projects, particularly those using systematic or scoping review methodologies. <strong>Faculty researchers</strong> preparing grant applications, journal manuscripts, or systematic review protocols that require up-to-date evidence mapping. <strong>Academic departments</strong> conducting program reviews or policy analyses that require evidence synthesis. <strong>Clinical researchers</strong> and <strong>health scientists</strong> who need Cochrane-style systematic reviews or evidence-based practice reviews. <strong>Policy analysts</strong> who need scoping reviews or rapid evidence assessments to inform policy decisions. <strong>Literature review coordinators</strong> who need screening and extraction support for multi-researcher projects.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If your project requires a structured, methodologically sound literature review—or if you're simply overwhelmed by the volume of literature in your field—our literature research service provides the expertise. We also support complementary services including <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">general research assistance</Link>, <Link href="/services/research/data-editing" className="text-primary font-semibold hover:underline">data editing and cleaning</Link>, <Link href="/services/research/proofreading" className="text-primary font-semibold hover:underline">proofreading services</Link>, and <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis</Link>.
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
                What We Offer: Systematic Literature Research with Full Transparency
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our literature research service follows established methodological frameworks to ensure rigor and reproducibility. We begin with <strong>protocol development</strong>, working with you to define research questions, inclusion/exclusion criteria, search strategy, and analysis approach. Our specialists follow the appropriate reporting guideline—PRISMA for systematic reviews, PRISMA-ScR for scoping reviews, MOOSE for observational studies, ENTREQ for qualitative evidence synthesis, or SWiM for qualitative systematic reviews. This protocol development phase ensures that your literature review will be defensible and complete.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Next, we conduct <strong>comprehensive database searches</strong> across all relevant academic databases. Our specialists craft search strings using controlled vocabulary (MeSH terms, Emtree, Thesaurus terms) and free-text keywords, combining them with Boolean operators to capture maximum relevant literature. We document search results from each database, remove duplicates using reference management software with manual verification, and provide a complete search log with date searched, number of results, and exact search strings. For systematic reviews, we also search grey literature sources including conference proceedings, dissertations, preprint servers, and government reports to minimize publication bias.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Comprehensive Database Search</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-database searches with documented strategies, MeSH terms, and Boolean logic for reproducible results.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Dual Screening &amp; Selection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Two independent reviewers for title/abstract and full-text screening with conflict resolution and PRISMA flow tracking.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Quality Assessment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Risk of bias assessment, CASP, Cochrane tool, JBI checklists, and quality ratings with standardized scoring.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Synthesis &amp; Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thematic synthesis, narrative integration, meta-analysis support, and full reporting in APA or journal format.
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
                Literature Review Types and Methodologies
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our specialists are trained in multiple literature review methodologies, each suited to different research questions and contexts. <strong>Systematic reviews</strong> follow a predefined protocol to identify, select, appraise, and synthesize all relevant studies, minimizing review bias through comprehensive searches and dual reviewer processes. We produce full PRISMA flow diagrams, risk-of-bias assessments, and, where appropriate, meta-analyses using RevMan, Stata, or R metafor packages. <strong>Scoping reviews</strong> map evidence landscapes across broad research areas, identifying gaps, examining how research is conducted, and clarifying conceptual definitions—ideal for emerging fields or topics with heterogeneous literature. We follow Arksey & O'Malley's five-stage framework or Levac et al.'s enhanced framework.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                <strong>Narrative or traditional literature reviews</strong> provide comprehensive thematic syntheses organized by conceptual themes, theoretical frameworks, methodological approaches, or chronological development. These are ideal for theses, grant proposals, and journal articles where a broad conceptual overview is needed rather than a narrow systematic synthesis. <strong>Meta-analyses</strong> combine quantitative results from multiple studies using statistical methods, and our specialists use Comprehensive Meta-Analysis, RevMan, or R-meta for effect size calculation, heterogeneity testing (I-squared, Q-statistics), publication bias assessment (funnel plots, Egger's test), and sensitivity analysis. <strong>Annotated bibliographies</strong> provide concise summaries and critical assessments of key sources, organized alphabetically or thematically, with proper APA or MLA citations.
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
                Why TaskLynk for Literature Research
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Literature research is methodologically demanding. A single missed database, an overly narrow search string, or an incomplete screening process can undermine an entire review's validity. That is why TaskLynk's marketplace connects you with literature specialists who have not just research experience, but proven expertise in systematic review methodology. Every literature specialist in our network has completed at least one full systematic review or scoping review as lead or co-investigator, with verifiable publication history or institutional affiliation. Our specialists are also trained in the latest review software including Covidence, Rayyan, DistillerSR, and EPPI-Center tools.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond methodological expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each phase before payment, <strong>dedicated project managers</strong> who track progress and coordinate revisions, and <strong>NDA protection</strong> for your research protocols and data. For students, we also offer <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">general research assistance</Link> for complementary tasks, <Link href="/services/research/proofreading" className="text-primary font-semibold hover:underline">professional proofreading</Link> for final manuscripts, and <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">data analysis services</Link> for studies that combine literature review with empirical components. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures methodological rigor, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your literature research project</Link> today to be matched with a qualified specialist within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
