import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, BarChart3, FileText, Sigma, Code, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'STATA Statistical Analysis Services | Hire Expert STATA Analysts',
  'Professional STATA statistical analysis services for econometrics, panel data analysis, time series, regression modeling, and survey data. Hire vetted STATA analysts with .do files and interpretation.',
  '/services/data-analysis/stata-statistical-analysis'
);

const faqs = [
  {
    question: 'What STATA analysis do you provide?',
    answer: 'We provide descriptive statistics, hypothesis testing, regression analysis (linear, logistic, Poisson, negative binomial), panel data analysis (fixed effects, random effects, dynamic models), time series analysis (ARIMA, VAR, GARCH), survival analysis, causal inference (difference-in-differences, instrumental variables, regression discontinuity), survey data analysis, and post-estimation diagnostics. We provide .do files and full interpretation for all analyses.',
  },
  {
    question: 'Can you analyze panel data?',
    answer: 'Yes. Our STATA specialists handle panel data analysis using xtreg, xtmixed, xtlogit, and other panel data commands. We conduct fixed effects, random effects, and between-effects models, with Hausman tests to determine model specification, and robust standard error estimation (clustered, heteroskedasticity-robust). We also perform dynamic panel models using Arellano-Bond estimation and system GMM.',
  },
  {
    question: 'Do you provide .do files with the analysis?',
    answer: 'Yes. Every STATA analysis includes the complete .do file that reproduces every step of the analysis, along with the .dta dataset file (cleaned and labeled) and the .log file with full output. This ensures reproducibility and allows supervisors or collaborators to verify every analytical decision.',
  },
  {
    question: 'Can you help with dissertation Chapter 4 using STATA?',
    answer: 'Yes. We produce complete Chapter 4 (Results and Discussion) writeups using STATA output, with APA-formatted tables, interpretation of statistical findings, and discussion of theoretical implications. We also handle Chapter 5 (Conclusions) with recommendations, limitations, and future research directions. All work follows APA 7th edition formatting.',
  },
  {
    question: 'What is STATA commonly used for in academia?',
    answer: 'STATA is widely used in economics, econometrics, finance, epidemiology, political science, sociology, and public policy research. It is particularly strong for econometric analysis, panel data, time series, causal inference methods, and survey data analysis. Many Master\'s and PhD programs in these fields require STATA proficiency, and our specialists have used it extensively in academic research and consulting.',
  },
  {
    question: 'How quickly can you complete a STATA analysis?',
    answer: 'Simple regression analysis is typically completed within 24-48 hours. Panel data and time series analysis take 3-5 days. Complex econometric modeling with causal inference methods may take 5-10 days. Full dissertation Chapter 4 writeups take 7-14 days. Express 12-hour service is available for urgent analyses. You specify your deadline, and we match you with an analyst who can commit to it.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'R Statistical Analysis', href: '/services/data-analysis/r-statistical-analysis' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function StataAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/stata-statistical-analysis"
      serviceSchemaName="STATA Statistical Analysis Services"
      serviceSchemaDescription="Professional STATA statistical analysis services for econometrics, panel data analysis, time series, regression modeling, and survey data. Hire vetted STATA analysts with .do files and interpretation."
      heroEyebrow="STATA Analysis"
      heroTitle="STATA Statistical Analysis Services | Hire Expert STATA Analysts"
      heroIntro="STATA is the go-to tool for rigorous econometric analysis, but mastering its commands, syntax, and statistical interpretations requires deep expertise that many researchers lack. A single misapplied model or misinterpreted output can undermine years of research effort. TaskLynk connects you with vetted STATA analysts—experts in econometrics, panel data analysis, time series, causal inference, and survey methods—who deliver accurate, reproducible STATA analysis with full .do files and clear interpretation. With secure milestone payments, NDA protection, and dedicated project management, your STATA analysis meets the highest academic and professional standards."
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
                This service is for researchers who need expert STATA analysis. <strong>Master's and PhD candidates</strong> in economics, econometrics, finance, public policy, political science, epidemiology, and development studies who need advanced STATA analysis for dissertations and theses. <strong>Academic researchers</strong> conducting econometric studies, policy evaluation, impact analysis, and empirical research requiring sophisticated statistical modeling. <strong>Economists and policy analysts</strong> who need causal inference analysis, difference-in-differences estimation, instrumental variable methods, or regression discontinuity designs using STATA. <strong>Business and finance professionals</strong> who need financial data analysis, time series forecasting, or portfolio analysis using STATA. <strong>Public health researchers</strong> conducting epidemiological analysis, survival analysis, or survey data analysis. <strong>Lecturers and teaching assistants</strong> who need STATA support for coursework, assignments, or their own research. <strong>Research assistants</strong> who need to learn or refine STATA skills for ongoing projects.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need STATA analysis—whether for panel data, time series, causal inference, or regression modeling—our service provides expert-level STATA specialists. We also support complementary services including <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R statistical analysis</Link>, and <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>.
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
                What We Offer: Advanced Econometric Analysis with STATA
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our STATA analysis service covers the complete range of econometric procedures, ensuring methodological rigor and proper interpretation. We begin with <strong>data preparation and management</strong>—importing datasets from CSV, Excel, or database sources, inspecting and cleaning data using STATA's data management commands, creating and tagging variables, generating new variables through computation, handling missing values, recoding categorical variables, and merging or appending datasets. Our specialists also handle complex survey data using STATA's svy commands for proper variance estimation, stratification, and clustering.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>regression analysis</strong>, we implement linear regression with diagnostic tests, logistic regression for binary outcomes, multinomial and ordinal logistic regression, Poisson and negative binomial regression for count data, and Cox proportional hazards models for survival analysis. We conduct comprehensive model diagnostics including residual analysis, influence statistics, variance inflation factors (VIF), and goodness-of-fit tests. For <strong>panel data analysis</strong>, we estimate fixed effects, random effects, and between-effects models using xtreg, conduct Hausman specification tests, implement robust and clustered standard errors, and perform dynamic panel estimation using Arellano-Bond and system GMM. For <strong>time series analysis</strong>, we handle ARIMA models, vector autoregression (VAR), GARCH models for volatility clustering, unit root tests (ADF, PP, KPSS), cointegration analysis, and forecast error variance decomposition. For <strong>causal inference</strong>, we implement difference-in-differences, instrumental variable estimation, regression discontinuity designs, propensity score matching, and synthetic control methods.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Sigma className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Econometric Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Regression, panel data, time series, causal inference (DiD, IV, RDD) with diagnostics, robust standard errors, and interpretation reports.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Reproducible Workflow</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Complete .do files, .dta datasets, .log outputs, and documented syntax ensuring every step is reproducible for supervisor verification.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Causal Inference</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Difference-in-differences, instrumental variables, regression discontinuity, propensity score matching, and synthetic control with STATA.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Academic Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chapter 4 and 5 writeups, APA-formatted tables, interpretation of results, and discussion of theoretical and practical implications.</p>
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
                Why TaskLynk for STATA Statistical Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                STATA is the preferred tool in economics, econometrics, and policy research, but its power comes with complexity that requires both statistical knowledge and programming expertise. A single error in model specification, a missed assumption check, or an incorrect interpretation can invalidate your entire analysis. TaskLynk's marketplace connects you with STATA analysts who have deep training in econometric theory, causal inference methods, and STATA programming. Every STATA analyst in our network has a graduate degree in economics, statistics, econometrics, finance, or a related field, and has produced STATA analyses for academic research with verifiable results. We also ensure they can write and interpret STATA syntax—a critical skill for reproducibility that many researchers lack.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve the analysis output before payment. <strong>Dedicated project managers</strong> coordinate between you and the analyst, ensure timeline adherence, and verify that deliverables meet your academic or professional requirements. <strong>NDA protection</strong> safeguards your research data and intellectual property. For broader analytical needs, we also offer <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R statistical analysis</Link>, and <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality analysis delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your STATA project</Link> today to be matched with an expert analyst within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
