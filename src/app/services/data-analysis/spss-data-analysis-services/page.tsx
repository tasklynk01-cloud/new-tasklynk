import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, BarChart3, FileCheck, Sigma, Users, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'SPSS Data Analysis Services | Hire Expert SPSS Analysts',
  'Professional SPSS data analysis services with syntax files, output interpretation, and APA-formatted results. Hire vetted SPSS analysts for descriptive stats, regression, ANOVA, and factor analysis.',
  '/services/data-analysis/spss-data-analysis-services'
);

const faqs = [
  {
    question: 'What SPSS analysis do you provide?',
    answer: 'We provide descriptive statistics, cross-tabulations, reliability analysis (Cronbach\'s alpha), correlation analysis, t-tests (independent, paired, one-sample), ANOVA (one-way, two-way, MANOVA), multiple regression, logistic regression, factor analysis (EFA and CFA), cluster analysis, chi-square tests, normality testing, and non-parametric tests. We also provide SPSS syntax files and clean output logs for all analyses.',
  },
  {
    question: 'Do you provide syntax files?',
    answer: 'Yes. Every SPSS analysis includes the corresponding .sps syntax file that reproduces every step of the analysis, allowing your supervisor to verify reproducibility. We also provide the .sav data file (cleaned and labeled) and .spv output file with all results. This transparency is essential for academic and research validation.',
  },
  {
    question: 'Can you write Chapter 4 results for dissertations?',
    answer: 'Yes. We produce complete Chapter 4 (Results and Discussion) writeups with APA-formatted tables, figures, and interpretation of statistical findings. We also write Chapter 5 (Discussion) with theoretical implications, study limitations, and recommendations. Our specialists are experienced with APA 7th edition formatting for all statistical outputs.',
  },
  {
    question: 'How do you handle missing data in SPSS?',
    answer: 'We assess missing data patterns using Little\'s MCAR test, then apply appropriate treatment: listwise deletion, mean substitution, regression imputation, or multiple imputation using the MULTIPLE IMPUTATION procedure. We document the chosen method and its rationale in the syntax file and output.',
  },
  {
    question: 'Do you perform assumption testing?',
    answer: 'Yes. We conduct comprehensive assumption testing including Shapiro-Wilk and Kolmogorov-Smirnov normality tests, Levene\'s test for homogeneity of variance, Box\'s test for homogeneity of covariance, multicollinearity diagnostics (VIF, tolerance), linearity checks, and outlier detection (Mahalanobis distance, leverage, Cook\'s distance). All assumption tests are documented in the output with interpretations and remediation recommendations.',
  },
  {
    question: 'What is your typical turnaround time?',
    answer: 'Simple descriptive analysis is typically delivered within 24-48 hours. Regression and ANOVA analyses take 3-5 days. Factor analysis and complex multivariate procedures take 5-10 days. Full Chapter 4 writeups take 7-14 days depending on complexity. Express service (12-24 hours) is available for urgent analyses. You specify your deadline, and we match you with an SPSS analyst who can commit to it.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'STATA Statistical Analysis', href: '/services/data-analysis/stata-statistical-analysis' },
  { label: 'R Statistical Analysis', href: '/services/data-analysis/r-statistical-analysis' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function SpssDataAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/spss-data-analysis-services"
      serviceSchemaName="SPSS Data Analysis Services"
      serviceSchemaDescription="Professional SPSS data analysis services with syntax files, output interpretation, and APA-formatted results for descriptive statistics, regression, ANOVA, factor analysis, and dissertation Chapter 4 writing."
      heroEyebrow="SPSS Analysis"
      heroTitle="SPSS Data Analysis Services | Hire Expert SPSS Analysts"
      heroIntro="SPSS is the gold standard for statistical analysis in academia, but mastering its syntax, output interpretation, and assumption testing requires expertise that many students lack. A single misapplied command or missed assumption can invalidate your entire analysis. TaskLynk connects you with vetted SPSS analysts—experts who not only run the right procedures but also interpret results accurately, write syntax files for reproducibility, and produce APA-formatted output ready for your dissertation or publication. With secure milestone payments, NDA protection, and dedicated project management, your SPSS analysis is handled by specialists who understand both the technical and academic requirements."
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
                This service is for researchers who need expert SPSS analysis. <strong>Undergraduate students</strong> in Kenya and internationally who need help with basic SPSS assignments, lab reports, or research project analysis involving descriptive statistics, t-tests, ANOVA, or correlation. <strong>Master's candidates</strong> conducting dissertations that require multiple regression, factor analysis, MANOVA, or reliability testing using SPSS, with results chapters ready for supervisor review. <strong>PhD researchers</strong> conducting complex multivariate analyses, structural equation modeling with AMOS, or large-scale survey data analysis that requires advanced SPSS procedures and custom syntax. <strong>Academic researchers</strong> who need SPSS analysis for journal submissions with APA-formatted output and reproducibility documentation. <strong>Lecturers and teaching assistants</strong> who need to verify student SPSS work or require analysis for their own research projects. <strong>Research assistants</strong> who need to learn or refine SPSS skills for ongoing projects. <strong>Clinical researchers</strong> in healthcare who need SPSS for biostatistics, epidemiology, and patient outcome analysis. <strong>Social scientists</strong> conducting survey research, experimental studies, or secondary data analysis with SPSS.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you have data ready for SPSS analysis—or need help with data entry, variable labeling, and setup—our service provides expert-level SPSS specialists. We also support complementary services including <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link>, <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis</Link>, and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link>.
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
                What We Offer: Complete SPSS Analysis with Reproducibility
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our SPSS data analysis service covers the complete analytical pipeline, ensuring that every analysis is methodologically sound, technically accurate, and properly documented for academic or professional use. We begin with <strong>data preparation and setup</strong>—importing your dataset from any format (Excel, CSV, SAS, Stata, R), defining variable properties (width, decimals, type), assigning value labels, setting missing value definitions, configuring measure scales (scale, nominal, ordinal), and ensuring data integrity before analysis. Our specialists also handle data transformations, recoding, computing new variables, aggregating data, and restructuring datasets (restricting cases, selecting variables) as needed for your specific analytical requirements.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next, we conduct <strong>comprehensive assumption testing</strong> for every statistical procedure. This includes normality testing (Shapiro-Wilk, Kolmogorov-Smirnov, skewness and kurtosis), homogeneity of variance (Levene's test), homogeneity of covariance (Box's test), multicollinearity diagnostics (VIF, tolerance, condition indices), linearity assessment, and outlier detection using Mahalanobis distance, leverage values, and Cook's distance. Every assumption that is tested is also interpreted, and if violations are found, our specialists recommend appropriate remedies such as data transformations (log, square root, Box-Cox), alternative non-parametric tests, or robust estimation methods. We also produce <strong>clean SPSS output</strong> with APA-formatted tables, annotated interpretations, and syntax files that reproduce every step of the analysis—essential for supervisor verification and academic integrity.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Sigma className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Descriptive &amp; Inferential Stats</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Frequencies, descriptives, cross-tabulations, t-tests, ANOVA, MANOVA, correlation, and chi-square tests with full interpretation and APA tables.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Regression &amp; Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Linear, multiple, hierarchical, logistic regression with diagnostics, model assumption testing, and APA-formatted results chapters.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Factor &amp; Reliability</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EFA, CFA with AMOS, Cronbach's alpha, composite reliability, KMO, Bartlett's test, and scree plots with interpretation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Syntax &amp; Reproducibility</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full .sps syntax files, .sav data files, .spv output, and documented cleaning log ensuring reproducible, supervisor-verifiable analysis.</p>
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
                SPSS Procedures and Statistical Techniques We Cover
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our SPSS specialists handle the complete range of IBM SPSS Statistics procedures, from basic descriptive statistics through advanced multivariate analysis. For <strong>descriptive statistics</strong>, we use FREQUENCIES, DESCRIPTIVES, and CROSSTABS procedures to generate measures of central tendency, dispersion, distributions, and cross-tabulations with custom tables. For <strong>comparison of means</strong>, we conduct independent samples t-tests, paired samples t-tests, one-sample t-tests using T-TEST procedure, and one-way, two-way, and multivariate ANOVA using UNIANOVA and MANOVA procedures. For <strong>predictive modeling</strong>, we build linear regression models using REGRESSION and LINEAR REGRESSION, logistic regression using LOGISTIC REGRESSION, hierarchical regression with custom model specifications, and stepwise regression with proper validation. For <strong>factor analysis</strong>, we conduct exploratory factor analysis using FACTOR procedure with KMO and Bartlett's test, scree plots, and VARIMAX rotation, as well as confirmatory factor analysis using AMOS for structural equation modeling.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                We also perform <strong>cluster analysis</strong> using the TwoStep Cluster and Hierarchical Cluster procedures, <strong>non-parametric tests</strong> including Mann-Whitney U, Kruskal-Wallis, and Wilcoxon signed-rank tests, <strong>reliability analysis</strong> with Cronbach's alpha and split-half reliability, <strong>correlation analysis</strong> using CORRELATIONS and PARTIAL CORRELATIONS, <strong>chi-square tests</strong> of independence and goodness-of-fit, <strong>crosstabulation analysis</strong> with custom table requests, and <strong>graph creation</strong> using CHART BUILDER and legacy graph commands. For advanced users, we handle <strong>complex samples analysis</strong> using the Complex Samples procedure for survey data with stratification and clustering, <strong>generalized linear models</strong> (GENLIN) for non-normal distributions, and <strong>multilevel modeling</strong> using MIXED procedure for hierarchical data structures. All analyses include proper syntax documentation, assumption testing, and APA-formatted output. <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">For broader quantitative analysis</Link>, including <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">STATA</Link> and <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R analysis</Link>, we offer tool-specific specialists as well.
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
                Why TaskLynk for SPSS Data Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                SPSS is the dominant statistical tool in academia, particularly for dissertations and theses in Kenya and internationally. But SPSS's point-and-click interface can mask critical analytical decisions—assumption testing, variable definition, missing data handling, and output interpretation all require deep statistical knowledge. TaskLynk's marketplace connects you with SPSS analysts who not only operate the software proficiently but also understand the underlying statistical theory, methodological requirements, and academic standards. Every SPSS analyst in our network has a graduate degree in statistics, psychology, economics, education, or a related field, and has produced SPSS analyses for academic research with verifiable supervisor approval. We also ensure they can write and interpret SPSS syntax—a critical skill for reproducibility that many students lack.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve the analysis output before payment. <strong>Dedicated project managers</strong> coordinate between you and the analyst, ensure timeline adherence, and verify that deliverables meet your supervisor's requirements. <strong>NDA protection</strong> safeguards your research data and academic work. For broader analytical needs, we also offer <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link>, <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">STATA analysis</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R statistical analysis</Link>, and <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality analysis delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your SPSS project</Link> today to be matched with an expert analyst within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
