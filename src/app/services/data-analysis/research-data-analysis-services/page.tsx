import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, BarChart3, Database, Users, FileText, ClipboardCheck, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Research Data Analysis Services | From Data Collection to Publication',
  'End-to-end research data analysis including data collection, cleaning, statistical analysis, visualization, and publication-ready reporting. Hire vetted research analysts.',
  '/services/data-analysis/research-data-analysis-services'
);

const faqs = [
  {
    question: 'What does end-to-end research data analysis include?',
    answer: 'Our service covers the complete research data lifecycle: research design consultation, data collection (surveys, interviews, secondary sources), data cleaning and coding, descriptive and inferential statistical analysis, qualitative coding and thematic analysis, data visualization, results interpretation, and final report writing formatted for academic publication. Every phase is documented for transparency and reproducibility.',
  },
  {
    question: 'Can you help with both quantitative and qualitative research data?',
    answer: 'Yes. Our research analysts are proficient in both paradigms. For quantitative research, we handle survey design, statistical analysis using SPSS, R, Python, or STATA, and quantitative result interpretation. For qualitative research, we conduct thematic analysis, grounded theory coding, content analysis, and narrative analysis using NVivo, Atlas.ti, or manual coding, producing rich, theory-driven insights.',
  },
  {
    question: 'Do you handle mixed-methods research?',
    answer: 'Absolutely. Mixed-methods analysis—where quantitative and qualitative components are integrated—is a core strength of our network. We ensure proper data integration, triangulation of findings, and coherent narrative that connects both strands of evidence to address your research questions comprehensively.',
  },
  {
    question: 'What data collection methods do you support?',
    answer: 'We support survey administration (online platforms like Qualtrics, Google Forms, SurveyMonkey), interview transcription and coding, focus group facilitation and analysis, archival data extraction, web scraping for secondary data, experimental data processing, and field data collection. We also help design data collection instruments that produce reliable and valid measurements.',
  },
  {
    question: 'Can you write the results and discussion chapter for me?',
    answer: 'Yes. We produce full Chapter 4 (Results) and Chapter 5 (Discussion) writeups for dissertations, including APA-formatted tables and figures, interpretation of findings, comparison with existing literature, theoretical implications, and practical recommendations. We also write journal article results sections formatted to specific publication guidelines.',
  },
  {
    question: 'How do you ensure my data is kept confidential?',
    answer: 'Data confidentiality is paramount. We use encrypted file transfer, NDA agreements, secure cloud storage with access logs, and role-based permissions. Freelancers only access the data necessary for their specific task. You retain full ownership of all data and findings throughout the process.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Data Visualization Services', href: '/services/data-analysis/data-visualization-services' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'Research Assistance', href: '/services/research/research-assistance' },
  { label: 'Survey Design Services', href: '/services/research/survey-design' },
  { label: 'Register as Freelancer', href: '/register/freelancer' },
];

export default function ResearchDataAnalysisServicesPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/research-data-analysis-services"
      serviceSchemaName="Research Data Analysis Services"
      serviceSchemaDescription="Complete research data analysis from collection through publication. Quantitative, qualitative, and mixed-methods analysis with visualization, interpretation, and publication-ready reporting."
      heroEyebrow="Research Data Analysis"
      heroTitle="Research Data Analysis Services | From Data Collection to Publication"
      heroIntro="Research doesn't end when data collection is complete. The real value emerges from rigorous analysis, clear interpretation, and compelling presentation of findings. But managing the entire analytical pipeline—from data cleaning to statistical modeling to publication-ready reporting—can be overwhelming, especially when you're also navigating research design, literature reviews, and dissertation deadlines. TaskLynk connects you with vetted research data analysts who handle the full analytical lifecycle, delivering statistically sound, publication-ready results. With secure milestone payments, NDA protection, and dedicated project management, your research reaches its full potential."
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
                This service is designed for researchers at every stage of their academic and professional journey. <strong>Undergraduate students</strong> conducting final-year research projects and honors theses who need help analyzing survey or experimental data. <strong>Master's candidates</strong> working on dissertations that require sophisticated statistical analysis, qualitative coding, or mixed-methods integration. <strong>PhD students</strong> conducting large-scale studies that demand advanced modeling techniques, reproducible analysis pipelines, and publication-ready results chapters. <strong>Academic faculty and postdocs</strong> who need specialized analytical support for grant-funded research, journal submissions, or conference presentations. <strong>Independent researchers</strong> and <strong>consulting firms</strong> that need to outsource specific analytical tasks without hiring full-time staff. <strong>NGOs and government agencies</strong> producing evidence-based reports, program evaluations, and policy briefs that require rigorous quantitative or qualitative analysis.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If your research involves data—whether quantitative survey responses, qualitative interview transcripts, archival records, or secondary datasets—and you need to transform it into credible, publishable findings, our research data analysis service provides the expertise. This includes projects in social sciences, healthcare, business and economics, education, psychology, political science, development studies, environmental science, and engineering. We also specialize in supporting <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link> for dissertations, <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative analysis</Link> for experimental studies, and <Link href="/services/research/data-collection" className="text-primary font-semibold hover:underline">data collection services</Link> for field research projects.
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
                What We Offer: Complete Analytical Lifecycle Management
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our research data analysis service manages the complete analytical lifecycle, ensuring no step is skipped and every decision is documented. We begin with a <strong>methodology consultation</strong>—reviewing your research design, data structure, and analytical needs to recommend the most appropriate statistical or qualitative approach. Our specialists then handle <strong>data preparation</strong>: importing datasets from any format (SPSS .sav, Stata .dta, R .rds, Excel .xlsx, CSV, JSON), cleaning missing values and outliers, recoding variables, merging datasets, and creating derived variables. This phase is critical because poorly prepared data undermines even the most sophisticated analysis.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For <strong>quantitative research</strong>, we conduct comprehensive statistical analysis including descriptive statistics, reliability analysis, assumption testing, hypothesis testing, regression modeling, ANOVA/MANOVA, factor analysis, cluster analysis, and advanced techniques like structural equation modeling or multilevel modeling. Every analysis includes effect sizes, confidence intervals, and power considerations. For <strong>qualitative research</strong>, we perform thematic analysis, grounded theory coding, content analysis, narrative analysis, and discourse analysis using both software (NVivo, Atlas.ti) and manual coding approaches. We produce coded transcript sets, theme maps, illustrative quotes, and theory-development narratives. For <strong>mixed-methods projects</strong>, we ensure proper integration of both paradigms, producing triangulated findings that leverage the strengths of each approach.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Methodology Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Research design consultation, instrument design, and sampling strategy to ensure your data collection produces analyzable, valid results.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Cleaning &amp; Coding</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Data import from any format, missing value treatment, outlier detection, variable recoding, and dataset merging with full documentation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Statistical &amp; Qualitative Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Inferential statistics, regression modeling, thematic coding, content analysis, and mixed-methods integration with assumption testing.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Publication-Ready Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  APA-formatted results chapters, journal article sections, conference abstracts, and presentation slides with full interpretation.
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
                Data Collection and Management We Support
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                A significant portion of research data analysis projects also require help with data collection and management. We support the full data collection pipeline: designing survey instruments and questionnaires that produce valid and reliable measurements, administering online surveys through platforms like Qualtrics, Google Forms, and SurveyMonkey, conducting and transcribing interviews, facilitating focus groups, extracting data from archival sources, and collecting field data. Our specialists also handle data management best practices including version control, backup strategies, metadata documentation, and secure storage protocols.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For researchers who need <strong>survey data analysis services</strong>, we provide end-to-end support from questionnaire design through cross-tabulation, weighting, and significance testing. For those conducting <strong>qualitative interviews</strong>, we handle transcription, coding, theme development, and narrative synthesis. For <strong>experimental studies</strong>, we assist with data entry verification, randomization checks, and analysis of treatment effects. For <strong>secondary data analysis</strong>, we work with government databases, organizational records, or published datasets, handling data extraction and re-analysis protocols. This comprehensive support means you don't need to coordinate multiple providers—your research data analyst handles collection, cleaning, analysis, and reporting under one roof.
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
                Why TaskLynk for Research Data Analysis
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Research data analysis requires deep expertise across multiple domains: statistical methodology, software proficiency, subject-matter knowledge, and academic writing. A single analyst who is strong in SPSS may not be equally capable in NVivo or R. That is why TaskLynk's marketplace connects you with specialists who have demonstrated expertise in your specific analytical needs—whether that's <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R programming</Link>, <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python analysis</Link>, or <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative modeling</Link>. Each freelancer's profile includes verifiable credentials, completed project samples, and client reviews.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond analytical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so payments are released only after you approve deliverables, <strong>dicated project managers</strong> who coordinate between you and the analyst, and <strong>NDA protection</strong> for your research data and intellectual property. For dissertational work, we also offer <Link href="/services/research/research-assistance" className="text-primary font-semibold hover:underline">research assistance services</Link> that cover literature review, proposal writing, and editing alongside data analysis. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures methodological rigor and timely delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your research project</Link> today to be matched with a qualified analyst within hours. For freelancers who specialize in research analysis, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link> to connect with researchers worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
