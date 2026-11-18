import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Search, Users, FileText, ClipboardCheck, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Hire Research Assistants | Literature Review & Data Collection Experts',
  'Access vetted research assistants for literature reviews, data collection, systematic reviews, and research support. Secure milestone payments and expert guidance for academic projects.',
  '/services/research/research-assistance'
);

const faqs = [
  {
    question: 'What tasks can a research assistant help with?',
    answer: 'Our research assistants provide comprehensive support including literature searches and reviews, systematic and scoping reviews, data collection (surveys, interviews, focus groups), data entry and coding, preliminary data analysis, reference management, research design consultation, protocol development, and administrative tasks like scheduling interviews or transcribing recordings. We match you with assistants who have subject-matter expertise relevant to your research domain.',
  },
  {
    question: 'Are your research assistants graduate students or professionals?',
    answer: 'Our network includes graduate students, early-career PhD researchers, postdoctoral fellows, and experienced research professionals. When you post a project, you can specify the education level and experience you prefer. Every assistant has verifiable academic credentials and has completed a competency assessment in their area of specialization.',
  },
  {
    question: 'How do you handle confidentiality of research materials?',
    answer: 'All research assistants sign our standard NDA before accessing any project materials. We use encrypted file transfer, secure cloud storage with audit logs, and role-based access control. Research data and intellectual property remain exclusively yours throughout the engagement. For particularly sensitive research, we offer air-gapped workflows and on-premises coordination options.',
  },
  {
    question: 'Can research assistants help with literature reviews?',
    answer: 'Absolutely. Our research assistants specialize in systematic literature searches, database querying (PubMed, Scopus, Web of Science, JSTOR, Google Scholar), reference management (EndNote, Zotero, Mendeley), and structured literature synthesis. We can produce annotated bibliographies, systematic review matrices, evidence maps, and full literature review chapters organized by themes, chronology, or methodology.',
  },
  {
    question: 'Do you help with research methodology and study design?',
    answer: 'Yes. Many of our research assistants and senior analysts provide research design consultation, including study type selection (qualitative, quantitative, mixed methods), sampling strategy, instrument design, ethical approval guidance, and data collection protocol development. We also help you develop research proposals, conceptual frameworks, and analytical plans before data collection begins.',
  },
  {
    question: 'What is the typical turnaround for research assistance tasks?',
    answer: 'Simple tasks like literature searches or data entry can be completed within 24–48 hours. Ongoing support arrangements (weekly research assistance) are available on retainer. Complex tasks like systematic reviews or full data collection protocols typically take 1–2 weeks. You set the deadline when posting your project, and we match you with assistants who can commit to your timeline.',
  },
];

const relatedServices = [
  { label: 'Literature Research Services', href: '/services/research/literature-research' },
  { label: 'Data Collection Services', href: '/services/research/data-collection' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Data Editing & Cleaning Services', href: '/services/research/data-editing' },
  { label: 'Survey Design Services', href: '/services/research/survey-design' },
  { label: 'Research Proposal Writing', href: '/services/academic-writing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Join as Research Freelancer', href: '/register/freelancer' },
];

export default function ResearchAssistancePage() {
  return (
    <ServicePageShell
      canonicalPath="/services/research/research-assistance"
      serviceSchemaName="Research Assistance Services"
      serviceSchemaDescription="Hire vetted research assistants for literature reviews, data collection, systematic reviews, reference management, and research design support for academic projects."
      heroEyebrow="Research Assistance"
      heroTitle="Hire Research Assistants | Literature Review & Data Collection Experts"
      heroIntro="Research moves faster when you have the right support. Whether you're conducting a systematic literature review, collecting survey data from hundreds of respondents, or managing the administrative burden of a multi-phase study, research assistants can accelerate your progress. But finding qualified help—someone who understands academic standards, research ethics, and your specific methodology—is challenging. TaskLynk connects you with vetted research assistants from graduate students to postdoctoral fellows, all verified for their domain expertise and research skills. With secure milestone payments, NDA protection, and dedicated project management, your research support is handled professionally from start to finish."
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
                This service is for researchers and academics who need assistance with specific aspects of their research projects. <strong>PhD students</strong> who are overwhelmed by the breadth of a systematic literature review or need help managing data collection across multiple sites. <strong>Master's candidates</strong> who need support with literature searches, reference management, data entry, or preliminary analysis to meet tight thesis deadlines. <strong>Faculty researchers</strong> who need research assistants for grant-funded projects, especially during data collection phases that require interviewing, transcribing, or coding large volumes of qualitative or quantitative data. <strong>Undergraduate honors students</strong> conducting research projects who need guidance on literature search strategies, database querying, or research design. <strong>Independent researchers</strong> and <strong>policy analysts</strong> who need ad-hoc research support for evidence-based reports or white papers. <strong>Academic departments</strong> that need to scale their research capacity for collaborative projects without hiring permanent staff.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you have a research task that a competent assistant could handle—literature review, data collection, reference management, transcription, or administrative research—you can likely benefit from our research assistance service. For more specialized analytical work, see our <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis services</Link>, our <Link href="/services/research/literature-research" className="text-primary font-semibold hover:underline">literature research services</Link> for systematic reviews, and our <Link href="/services/research/data-collection" className="text-primary font-semibold hover:underline">data collection services</Link> for survey and interview coordination. <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">Freelance research assistants</Link> on our platform also offer ongoing retainer support for sustained research projects.
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
                What We Offer: Comprehensive Research Support Across the Research Lifecycle
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our research assistance service covers the full spectrum of research tasks, organized to match your project's phase and complexity. During the <strong>planning phase</strong>, our research assistants help develop conceptual frameworks, conduct preliminary literature scoping, identify relevant databases and keywords for systematic searching, design research protocols, and assist with ethics application preparation. During the <strong>execution phase</strong>, assistants handle data collection activities—administering online surveys, conducting interviews, facilitating focus groups, extracting data from archival sources, and managing reference libraries. During the <strong>analysis phase</strong>, assistants support data coding, preliminary descriptive analysis, qualitative thematically coding, and preparing draft findings for your review. Throughout, assistants provide administrative support like scheduling, transcription, file organization, and progress tracking.
              </p>
              <p className="text-sm sm:text:base text-muted-foreground leading-relaxed mb-4">
                What distinguishes TaskLynk's research assistance is the <strong>quality and verification</strong> of our assistant network. Every research assistant in our platform has verifiable academic credentials—transcripts, publications, or references from faculty supervisors—and has completed a competency assessment demonstrating their research skills. We also verify their subject-matter expertise, matching you with assistants who have relevant experience in your field. Whether you need someone with expertise in qualitative research methods, quantitative analysis, systematic review protocols, or domain-specific knowledge (psychology, sociology, economics, public health, engineering), our marketplace ensures you're paired with an assistant who understands both the research process and your specific domain.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Literature Reviews</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Systematic searches, reference management, annotated bibliographies, and full literature synthesis across multiple databases.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Collection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Survey administration, interview coordination, focus groups, transcription, and data entry with quality assurance.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Reference Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EndNote, Zotero, and Mendeley organization with citation formatting and duplicate removal across 10,000+ references.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Research Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Protocol development, sampling strategy, methodology consultation, and ethics application support.
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
                Working With Vetted Research Assistants Across Disciplines
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our research assistant network spans dozens of academic disciplines, ensuring you can find help regardless of your research domain. <strong>Health sciences</strong> assistants provide clinical literature searches, epidemiological data management, and patient survey coordination. <strong>Social sciences</strong> assistants specialize in qualitative coding, interview transcription, and systematic review methodology. <strong>Business and economics</strong> assistants help with market research data collection, financial data extraction, and economic literature synthesis. <strong>Engineering and computer science</strong> assistants support technical literature reviews, patent searches, and data processing for computational research. <strong>Education</strong> assistants help with educational research design, student data analysis, and pedagogical literature reviews. <strong>Environmental and agricultural sciences</strong> assistants provide field data collection support, environmental monitoring protocols, and climate data analysis.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond discipline-specific expertise, our assistants are trained in research best practices including data ethics, informed consent procedures, GDPR and local data protection compliance, and rigorous quality control. For teams conducting <strong>systematic reviews</strong>, our assistants follow PRISMA guidelines for search strategy, study selection, and data extraction. For <strong>qualitative research</strong>, assistants are trained in thematic analysis, grounded theory coding, and phenomenological inquiry. For <strong>quantitative research</strong>, assistants support survey design, data collection protocols, and preliminary statistical analysis. This depth of training means you can trust that the research support you receive meets academic and professional standards.
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
                Why TaskLynk for Research Assistance
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Finding a competent research assistant requires more than matching skills to tasks—you need someone who understands your methodology, respects your research ethics, and communicates effectively about progress and challenges. TaskLynk's marketplace eliminates the guesswork. Every research assistant in our network has passed a rigorous verification process including credential checks, competency assessments, and sample work reviews. We also maintain discipline-specific pools so you can be confident that an assistant in your field has relevant experience. Additionally, our platform provides project management tools, secure file sharing, milestone-based payments, and real-time communication channels that keep your research on schedule.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond the talent, our managed marketplace adds critical layers of protection and support. <strong>Secure milestone escrow</strong> ensures you only release payment after approving deliverables. <strong>Dedicated project managers</strong> coordinate between you and the assistant, track milestones, and ensure communication stays on track. <strong>NDA protection</strong> safeguards your research data and intellectual property from the very first interaction. For students, we also offer specialized support through our <Link href="/services/academic-writing" className="text-primary font-semibold hover:underline">academic writing services</Link> for manuscript preparation and <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">data analysis services</Link> for statistical interpretation. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality research assistance, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your research project</Link> today to be matched with a qualified assistant within hours. For research professionals, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our freelancer network</Link> to connect with researchers worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
