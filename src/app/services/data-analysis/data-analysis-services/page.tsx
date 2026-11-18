import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Database, ShieldCheck, Clock, Users, FileCheck } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Hire Top Data Analysis Freelancers | TaskLynk Marketplace',
  'Access vetted data analysts skilled in SPSS, R, Python, Excel, and STATA. Secure milestone payments, real-time collaboration, and defensible statistical insights for research, business, and policy projects.',
  '/services/data-analysis/data-analysis-services'
);

const faqs = [
  {
    question: 'What statistical tools do your data analysts specialize in?',
    answer: 'Our vetted freelancers are proficient in SPSS, STATA, R, Python (pandas, NumPy, SciPy), Excel, JASP, Jamovi, SAS, and SQL. Every specialist has passed a tool-specific competency test and has a portfolio of completed projects in their area of expertise.',
  },
  {
    question: 'How do I protect my sensitive data and research findings?',
    answer: 'Security is non-negotiable. We offer NDA signing, encrypted file transfer, role-based access controls, and secure milestone escrow. Data is never stored on personal devices outside our platform, and freelancers only see the information needed to complete your specific task.',
  },
  {
    question: 'What deliverables can I expect from a data analysis project?',
    answer: 'Most projects include a statistical output report (APA-formatted tables and figures), cleaned datasets, syntax or script files for reproducibility, and a written interpretation of findings. Some projects also include visual dashboards, executive summaries, and methodology documentation.',
  },
  {
    question: 'How long does data analysis typically take?',
    answer: 'Timeline depends on data complexity and scope. Simple Excel analysis can be completed in 12–24 hours. SPSS or R regression models typically take 3–5 days. Large-scale dissertational datasets may require 1–2 weeks. You set the deadline, and we match you with freelancers who can meet it.',
  },
  {
    question: 'Can I get ongoing support after the project is complete?',
    answer: 'Yes. Every freelancer on TaskLynk provides complimentary clarification support for 14 days after delivery. For extended support, retainer packages are available. Your dedicated project manager also remains available to facilitate any follow-up work.',
  },
  {
    question: 'Do you offer revision if the analysis does not meet my requirements?',
    answer: 'Absolutely. Our 100% satisfaction guarantee means free revisions until the deliverables match your specifications. If the freelancer cannot meet the requirements after revisions, we will reassign your project to a different specialist at no additional cost.',
  },
];

const relatedServices = [
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'Data Visualization Services', href: '/services/data-analysis/data-visualization-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'R Statistical Analysis', href: '/services/data-analysis/r-statistical-analysis' },
  { label: 'Power BI Dashboard Development', href: '/services/data-analysis/power-bi-dashboard' },
];

export default function DataAnalysisServicesPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/data-analysis-services"
      serviceSchemaName="Data Analysis Services"
      serviceSchemaDescription="Professional data analysis using SPSS, R, Python, Excel, and STATA with interpretation reports, visualization, and secure milestone-based hiring of vetted freelancers."
      heroEyebrow="Data Analysis"
      heroTitle="Hire Top Data Analysis Freelancers | TaskLynk Marketplace"
      heroIntro="Your raw data holds answers. But without the right expertise, those answers stay buried in spreadsheets and statistical software you may not know how to use. TaskLynk connects you to vetted data analysts—experts in SPSS, R, Python, Excel, and STATA—who transform your datasets into clear, defensible insights. With secure milestone payments, real-time collaboration, and NDA protection, you get professional-grade analysis without the risk of hiring through generic freelance platforms."
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
                If you have collected data but lack the statistical expertise to analyze it confidently, our data analysis service is built for you. This includes undergraduate and postgraduate students working on research projects, dissertations, and theses; academic researchers conducting survey or experimental studies; business professionals needing customer or market data interpreted; NGOs and government agencies producing evidence-based reports; and startups validating product-market fit through quantitative research. If your project involves descriptive statistics, hypothesis testing, regression modeling, ANOVA, factor analysis, or any other quantitative technique—and you need results that are statistically sound, clearly interpreted, and presentation-ready—our marketplace matches you with specialists who can deliver exactly that.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                We also serve teams that already have internal data science capacity but need to scale quickly for a specific project. A marketing agency might need a one-off customer segmentation analysis. A research lab might need help processing a large batch of experimental data. An academic department might need additional analytical capacity to support multiple concurrent student projects. Whatever your situation, TaskLynk's freelance model means you pay only for the expertise you need, when you need it—no long-term contracts, no recruitment overhead, no onboarding delays.
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
                What We Offer: End-to-End Data Analysis You Can Trust
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our data analysis service covers the complete analytical pipeline. We begin with <strong>data cleaning and preparation</strong>—identifying missing values, handling outliers, recoding variables, and ensuring your dataset is structured correctly for analysis. Next comes <strong>descriptive statistics</strong>—generating frequency tables, measures of central tendency, dispersion metrics, and cross-tabulations that summarize your data clearly. From there, our specialists apply <strong>inferential statistical techniques</strong> including t-tests, ANOVA, MANOVA, correlation analysis, multiple regression, logistic regression, chi-square tests, factor analysis, and reliability testing (Cronbach's alpha), selecting the appropriate method based on your research design, variable types, and hypothesis structure.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                What sets our service apart is the <strong>interpretation and presentation</strong> layer. We don't just output raw software results—we translate statistical findings into actionable insights written in clear, non-technical language that your supervisor, stakeholders, or clients can understand. Every analysis is delivered with APA-formatted tables and figures, a written results section suitable for direct inclusion in your report or dissertation, syntax or script files for transparency and reproducibility, and a clean dataset file. For dissertational work, we also provide Chapter 4 (Results and Discussion) writeups that integrate statistical findings with theoretical implications.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Secure &amp; Confidential</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  NDA agreements, encrypted transfers, and role-based access control protect your sensitive datasets and research findings at every stage.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Reproducible Output</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Receive syntax files, cleaned datasets, and full documentation so your supervisor or team can verify every analytical step.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Tool-Specific Experts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hire specialists who excel in SPSS, R, Python, Excel, STATA, JASP, Jamovi—no generalists, no mismatched tool expertise.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">On-Time Delivery</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Set your deadline and our platform matches you with analysts who can commit to it. From 12-hour turnarounds to multi-week projects.
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
                Statistical Techniques and Methods We Cover
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our network of vetted data analysts covers a broad spectrum of statistical methodologies. For undergraduate-level work, we handle basic hypothesis testing, crosstabulation, simple and multiple linear regression, ANOVA, chi-square tests, and reliability analysis. For Master's and doctoral-level research, our specialists are proficient in multilevel modeling, structural equation modeling (SEM), advanced regression diagnostics, MANCOVA, discriminant analysis, cluster analysis, exploratory and confirmatory factor analysis, mediation and moderation analysis, time-series analysis, and non-parametric alternatives. We also support qualitative data analysis using NVivo, thematic coding, and content analysis for mixed-methods projects.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground mb-1">SPSS &amp; STATA</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Syntax files, output interpretation, APA tables
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <Database className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground mb-1">Python &amp; R</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pandas, NumPy, ggplot2, regression, ML integration
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground mb-1">Excel &amp; JASP</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pivot tables, dashboards, accessible statistics
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Real-World Applications Across Industries
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our data analysts have supported projects across diverse sectors. In <strong>academic research</strong>, analysts have processed survey data for dissertations on topics ranging from student motivation in Kenyan secondary schools to consumer behavior in Nairobi's retail sector. In <strong>market research</strong>, specialists have analyzed customer satisfaction surveys for telecommunications companies, producing segmentation dashboards and churn prediction models. In <strong>public health</strong>, analysts have processed epidemiological data for Ministry of Health reports, calculating risk ratios and conducting logistic regression on vaccination coverage. In <strong>finance</strong>, specialists have built credit-risk scoring models and performed time-series forecasting for microfinance institutions. In <strong>agriculture</strong>, analysts have analyzed yield data from field experiments, running ANOVA and regression models to identify factors affecting crop productivity.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                A recent project involved a Master's student in economics who needed to analyze household survey data from 1,200 respondents across three Kenyan counties. Our matched analyst cleaned the dataset, ran descriptive statistics, performed multicollinearity diagnostics, and built a multiple regression model to identify determinants of household income. The deliverable included Stata .dta and .do files, a formatted results chapter with APA tables, and a plain-language summary of findings—all completed within 4 days for KSh 8,500, a fraction of what an agency would charge.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for Data Analysis Freelance Services
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Choosing TaskLynk means choosing a marketplace designed for results, not just connections. Every data analyst in our network has passed a rigorous verification process that tests both technical competency and communication skills. We review portfolios, verify credentials, and conduct sample analyses before approving specialists. This means you can hire with confidence, knowing that your project will be handled by someone who truly understands the analytical technique you need.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond the talent, our managed marketplace adds layers of protection and support that generic freelance platforms cannot match. <strong>Secure milestone escrow</strong> means your payment is held by TaskLynk until you approve each deliverable, eliminating the risk of paying upfront and receiving substandard work. <strong>Dedicated project managers</strong> coordinate communication, track deadlines, and ensure scope alignment throughout the project lifecycle. <strong>NDA and IP protection</strong> safeguards your data and research ideas. And our <strong>100% satisfaction guarantee</strong> includes free revisions and re-matching if the initial analyst cannot meet your requirements.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For students and researchers at <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R</Link>, or <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>, TaskLynk offers specialized talent pools for each tool. For teams needing ongoing analytical capacity, our <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">freelancer network</Link> includes full-time data professionals available for retainer arrangements. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality and transparency, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your project today</Link> to receive bids from qualified analysts within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
