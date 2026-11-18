import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Code, Database, FileText, Sigma, ShieldCheck, Clock, Users } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'R Statistical Analysis Services | Hire Expert R Analysts',
  'Professional R statistical analysis services using ggplot2, dplyr, tidyr, and advanced modeling. Hire vetted R analysts for statistical computing, data visualization, and reproducible research with R Markdown.',
  '/services/data-analysis/r-statistical-analysis'
);

const faqs = [
  {
    question: 'What R analysis do you provide?',
    answer: 'We provide data manipulation with dplyr and tidyr, statistical modeling (regression, ANOVA, GLM, mixed-effects models), machine learning (random forest, SVM, clustering), time series analysis, Bayesian analysis with Stan and brms, factor analysis, structural equation modeling, ggplot2 visualization, Shiny app development, and reproducible reporting with R Markdown and Quarto.',
  },
  {
    question: 'Can you create publication-ready visualizations in R?',
    answer: 'Yes. Our R specialists use ggplot2, plotly, lattice, and other visualization packages to create publication-ready figures. We produce APA-compliant charts, interactive visualizations, multi-panel figures, and custom graphics that meet journal requirements. We also provide the complete R code for reproducibility.',
  },
  {
  question: 'Do you provide reproducible analysis with R Markdown?',
    answer: 'Yes. We deliver complete R Markdown (.Rmd) documents or Quarto files that combine narrative text, embedded R code, and output (tables, figures) into a single reproducible document. This allows supervisors and collaborators to verify every analytical step and reproduce results exactly. We also provide .R scripts for all analyses.',
  },
  {
    question: 'What statistical packages and libraries do you use?',
    answer: 'We use core R packages including dplyr, tidyr, ggplot2, broom, modelr, and caret, as well as specialized packages for specific analyses: lme4 for mixed models, survival for survival analysis, psych for psychometrics, lavaan for SEM, forecast for time series, tidytext for text analysis, and shiny for interactive apps.',
  },
  {
    question: 'Can you help with dissertation analysis using R?',
    answer: 'Yes. We produce complete Chapter 4 (Results) and Chapter 5 (Discussion) writeups using R and R Markdown, with interpretation of statistical findings, APA-formatted tables and figures, and discussion of theoretical implications. We also handle data cleaning, assumption testing, and advanced modeling as needed.',
  },
  {
    question: 'How does R compare to SPSS or STATA for analysis?',
    answer: 'R is particularly strong in data visualization (ggplot2), reproducible reporting (R Markdown), machine learning and statistical learning, Bayesian analysis, and custom statistical methods. While SPSS is more user-friendly for point-and-click analysis, R provides greater flexibility and reproducibility. We match you with analysts who excel in your chosen tool—see our <Link href="/services/data-analysis/spss-data-analysis-services">SPSS services</Link> and <Link href="/services/data-analysis/stata-statistical-analysis">STATA services</Link> as well.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'STATA Statistical Analysis', href: '/services/data-analysis/stata-statistical-analysis' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function RStatisticalAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/r-statistical-analysis"
      serviceSchemaName="R Statistical Analysis Services"
      serviceSchemaDescription="Professional R statistical analysis services using ggplot2, dplyr, and advanced modeling packages. Hire vetted R analysts for reproducible research, data visualization, and statistical computing with R Markdown."
      heroEyebrow="R Analysis"
      heroTitle="R Statistical Analysis Services | Hire Expert R Analysts"
      heroIntro="R is the powerhouse of modern statistical computing—offering unparalleled flexibility, cutting-edge analytical packages, and reproducible research capabilities that SPSS and STATA simply cannot match. But R's power comes with a steep learning curve: mastering packages like dplyr, ggplot2, tidyr, and lme4, writing clean reproducible code, and interpreting results correctly requires deep expertise. TaskLynk connects you with vetted R analysts—experts in statistical computing, data visualization, reproducible reporting, and machine learning—who deliver accurate, reproducible R analysis with full code documentation. With secure milestone payments, NDA protection, and dedicated project management, your R analysis meets the highest standards."
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
                This service is for researchers and analysts who need expert R analysis. <strong>Master's and PhD candidates</strong> in statistics, biostatistics, data science, psychology, economics, and related fields who need R analysis for dissertations and theses. <strong>Academic researchers</strong> conducting statistical analysis, data visualization, or reproducible research projects requiring R, particularly those involving machine learning, Bayesian analysis, or publication-ready graphics. <strong>Data scientists and analysts</strong> who need help writing R code, creating visualizations, or implementing statistical models using R packages. <strong>Biostatisticians and epidemiologists</strong> who need R for clinical trials analysis, survival analysis, or epidemiological modeling. <strong>Political scientists and sociologists</strong> conducting quantitative analysis, text analysis, or survey data analysis using R. <strong>Researchers who prefer reproducible workflows</strong> using R Markdown and Quarto for integrated analysis and reporting. <strong>Students learning R</strong> who need assistance with assignments, projects, or thesis analysis using specific R packages.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need R analysis—whether for ggplot2 visualization, statistical modeling, machine learning, or reproducible reporting—this service provides expert-level R specialists. We also support complementary services including <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">STATA analysis</Link>, and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link>.
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
                What We Offer: Reproducible Statistical Computing with R
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our R statistical analysis service covers the complete data science and statistical computing workflow, ensuring reproducible, transparent, and well-documented analysis. We begin with <strong>integrated data manipulation and cleaning</strong> using the tidyverse ecosystem—dplyr for data transformation, tidyr for reshaping, stringr for text processing, lubridate for date/time handling, and readr for data import from CSV, Excel, databases, APIs, and various file formats. Our specialists handle missing value imputation, outlier detection, variable recoding, data merging and joining, and dataset restructuring—all documented with clean, readable R code that follows best practices.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>statistical modeling and analysis</strong>, we implement a wide range of techniques including linear and generalized linear models (lm, glm), mixed-effects models (lme4), time series analysis (forecast, fable), survival analysis (survival, survminer), Bayesian analysis (Stan, brms, rstanarm), and machine learning (caret, tidymodels, randomForest, SVM). For <strong>data visualization</strong>, we create publication-ready graphics using ggplot2 with custom themes, scales, and layers, plus interactive visualizations with plotly. For <strong>reproducible reporting</strong>, we deliver complete R Markdown (.Rmd) or Quarto documents that combine narrative text, embedded code, and output into a single reproducible document—allowing supervisors and collaborators to verify every analytical step. This reproducible workflow is essential for academic research, collaborative projects, and regulatory compliance.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Manipulation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  tidyverse manipulation with dplyr, tidyr, data import from any format, cleaning, recoding, merging, and transformation with documented code.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Sigma className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Statistical Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Linear, GLM, mixed models, Bayesian analysis, machine learning, survival analysis, and time series with full diagnostics.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">ggplot2 Visualization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Publication-ready charts, APA-compliant figures, interactive plotly visualizations, and custom themes with reproducible code.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">R Markdown Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Reproducible .Rmd and Quarto documents with narrative text, embedded code, and output. Full code transparency for verification.</p>
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
                Why TaskLynk for R Statistical Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                R requires not just knowledge of packages and functions, but understanding of statistical theory, reproducible research principles, and the programming mindset that makes R powerful. A researcher who knows a few R commands but doesn't understand underlying statistical assumptions can produce misleading results. TaskLynk's marketplace connects you with R analysts who have both statistical training and R programming expertise. Every R analyst in our network has a graduate degree in statistics, data science, biostatistics, or a quantitative field, and has produced R analyses for academic research with verifiable code repositories and reproducible reports.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve the analysis before payment. <strong>Dedicated project managers</strong> coordinate between you and the analyst, ensure timeline adherence, and verify deliverables meet your requirements. <strong>NDA protection</strong> safeguards your research data and intellectual property. For broader analytical needs, we also offer <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link>, <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your R project</Link> today to be matched with an expert within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
