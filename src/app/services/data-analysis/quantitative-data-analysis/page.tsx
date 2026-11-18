import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, TrendingUp, BarChart3, Sigma, ShieldCheck, Clock, FileCheck } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Quantitative Data Analysis Services | Hire Expert Analysts',
  'Hire vetted quantitative data analysts for regression, ANOVA, factor analysis, hypothesis testing, and statistical modeling. Secure milestone payments and NDA protection.',
  '/services/data-analysis/quantitative-data-analysis'
);

const faqs = [
  {
    question: 'What types of quantitative analysis do you specialize in?',
    answer: 'Our analysts handle descriptive statistics, hypothesis testing (t-tests, chi-square, z-tests), correlation and regression analysis (linear, logistic, multiple, hierarchical), ANOVA (one-way, two-way, MANOVA), factor analysis (EFA and CFA), reliability analysis (Cronbach\'s alpha), cluster analysis, discriminant analysis, time-series analysis, and meta-analysis. We also perform advanced modeling including structural equation modeling (SEM), mediation and moderation analysis, and multilevel/hierarchical linear modeling.',
  },
  {
    question: 'Do you handle assumption testing before analysis?',
    answer: 'Yes. Every quantitative analysis begins with assumption testing—normality (Shapiro-Wilk, Kolmogorov-Smirnov), homoscedasticity, multicollinearity (VIF), independence of observations, and linearity checks. We report any violations and recommend appropriate remedies or alternative non-parametric tests, documenting all decisions transparently.',
  },
  {
    question: 'What statistical software do your analysts use?',
    answer: 'Our specialists are proficient in SPSS, R, STATA, Python (SciPy, StatsModels, scikit-learn), SAS, JASP, Jamovi, and Excel. When you place an order, we match you with an analyst who specializes in your preferred tool, or we can recommend the best tool for your specific analytical needs.',
  },
  {
    question: 'Can you help me decide which analysis is appropriate for my research?',
    answer: 'Absolutely. Our project managers and senior analysts review your research design, data structure, and hypotheses to recommend the most appropriate analytical approach. We explain the rationale, expected outputs, and how the results will address your research questions before beginning any work.',
  },
  {
    question: 'Do you provide interpretation along with the statistical output?',
    answer: 'Yes. All quantitative analysis deliverables include a plain-language interpretation of results, APA-formatted tables and figures, effect size calculations, confidence intervals, and guidance on how to present findings in your report, dissertation, or publication. We explain not just what the statistics say, but what they mean in the context of your research questions.',
  },
  {
    question: 'How do you handle missing data?',
    answer: 'We apply industry-standard approaches including listwise deletion, mean imputation, regression imputation, or multiple imputation (MICE), depending on the pattern and proportion of missingness. We always document the method used and its potential impact on your results.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'STATA Statistical Analysis', href: '/services/data-analysis/stata-statistical-analysis' },
  { label: 'R Statistical Analysis', href: '/services/data-analysis/r-statistical-analysis' },
  { label: 'Data Visualization Services', href: '/services/data-analysis/data-visualization-services' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function QuantitativeDataAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/quantitative-data-analysis"
      serviceSchemaName="Quantitative Data Analysis Services"
      serviceSchemaDescription="Quantitative statistical analysis including regression, ANOVA, factor analysis, hypothesis testing, and modeling using SPSS, R, Python, STATA, and JASP with interpretation reports."
      heroEyebrow="Quantitative Analysis"
      heroTitle="Quantitative Data Analysis Services | Hire Expert Analysts"
      heroIntro="Numbers without meaning are just noise. Transforming raw quantitative data into statistically valid, defensible conclusions requires not just software proficiency, but deep understanding of statistical theory, research methodology, and analytical reasoning. TaskLynk connects you with vetted quantitative analysts—experts in regression modeling, hypothesis testing, ANOVA, factor analysis, and advanced statistical techniques—who deliver rigorous analysis backed by clear interpretation. With secure milestone payments, NDA protection, and dedicated project management, you get enterprise-level quantitative expertise at a fraction of traditional consulting costs."
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
                This service serves researchers, students, and analysts who work with numerical data and need rigorous statistical analysis. Undergraduate students conducting quantitative assignments and lab reports. Master's and PhD candidates analyzing survey data, experimental results, or archival datasets for dissertations. Academic researchers preparing manuscripts with quantitative findings for journal publication. Business analysts evaluating market research data, customer satisfaction surveys, or operational metrics. Healthcare professionals analyzing clinical trial data or epidemiological studies. Social scientists examining census data, educational assessment results, or behavioral study outcomes. Policy analysts evaluating program effectiveness through quantitative metrics.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you have numerical data, research questions that can be tested statistically, and hypotheses that require inferential analysis, our quantitative data analysis service provides the expertise you need. This includes projects using survey data collected through <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link>, experimental datasets from controlled studies, secondary data from government databases, or organizational metrics from business operations. The key is that your project involves quantifiable variables and statistical inference—the core domain of our vetted analyst network.
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
                What We Offer: Rigorous Statistical Analysis from Hypothesis to Conclusion
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our quantitative data analysis service follows a systematic methodology that ensures statistical rigor at every step. First, we conduct a <strong>data audit</strong>—reviewing your dataset for completeness, variable types, coding schemes, outliers, and missing values. Next, we verify <strong>assumption testing</strong> for whatever statistical procedure you plan to use: normality of distribution, linearity, homoscedasticity, independence of observations, multicollinearity, and sphericity where applicable. These checks are critical because violating assumptions can invalidate your conclusions, yet they are frequently skipped by analysts working under tight deadlines.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                After assumption testing, we proceed to the <strong>core analysis phase</strong>. For hypothesis testing, we conduct t-tests (independent, paired, one-sample), chi-square tests of independence and goodness-of-fit, ANOVA (one-way, two-way, three-way, repeated measures), and MANOVA for multivariate designs. For predictive modeling, we build and validate linear regression, logistic regression, hierarchical regression, ridge/lasso regression, and multinomial logistic models. For exploratory analysis, we employ factor analysis (EFA and CFA), cluster analysis (k-means, hierarchical), discriminant analysis, and reliability testing. All analyses include effect sizes, confidence intervals, and power calculations where appropriate.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Sigma className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Assumption Testing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Normality, linearity, homoscedasticity, multicollinearity, and independence checks before every analysis to ensure valid results.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Regression &amp; Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Linear, logistic, multiple, hierarchical, and regularized regression models with diagnostics and validation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">ANOVA &amp; MANOVA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  One-way, two-way, repeated measures, and multivariate designs with post-hoc and contrast analyses.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Defensible Output</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  APA-formatted tables, syntax files, and interpretation reports ready for direct inclusion in your research document.
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
                Statistical Methods and Techniques We Cover
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our analyst network provides comprehensive coverage of quantitative methodologies. For <strong>correlational analysis</strong>, we handle Pearson, Spearman, and Kendall correlations with scatterplots and significance testing. For <strong>comparative analysis</strong>, we conduct independent samples t-tests, paired samples t-tests, one-sample t-tests, z-tests for proportions, and effect size calculations (Cohen's d, Hedge's g). For <strong>experimental and quasi-experimental designs</strong>, we perform one-way through three-way ANOVA, MANOVA, ANCOVA, repeated measures ANOVA, and non-parametric alternatives (Mann-Whitney U, Kruskal-Wallis, Friedman test) when assumptions are violated.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For <strong>predictive modeling</strong>, we build and validate linear regression, logistic regression, ordinal regression, multinomial regression, hierarchical regression, stepwise selection procedures, and regularized models (ridge, lasso, elastic net). For <strong>dimensionality reduction</strong>, we conduct exploratory factor analysis, confirmatory factor analysis, principal component analysis, and reliability analysis with Cronbach's alpha and composite reliability. For <strong>advanced analytics</strong>, we perform mediation and moderation analysis, structural equation modeling, cluster analysis, discriminant analysis, time-series analysis, and meta-analysis. We also provide power analysis and sample size calculations using G*Power methodologies.
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
                Software Proficiency Across the Quantitative Stack
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our quantitative analysts are tool-agnostic—they match the right software to your requirements. <strong>SPSS users</strong> receive syntax files (.spv, .sps), annotated output logs, and datasets ready for supervisor review. <strong>R specialists</strong> provide fully reproducible R scripts, R Markdown documents, and ggplot2 visualizations with detailed interpretation. <strong>Python analysts</strong> deliver Jupyter notebooks, pandas data pipelines, StatsModels or scikit-learn results, and matplotlib/seaborn figures. <strong>STATA experts</strong> produce .do files and .dta datasets with comprehensive output. For <strong>JASP and Jamovi</strong> users, we provide .jasp and .omv project files with annotated outputs. <strong>Excel-based</strong> analysis includes pivot tables, formulas, and formatted reports. When you place your order, we match you with an analyst whose primary tool aligns with your needs—or we can recommend the optimal tool for your specific analytical requirements.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For students and researchers who need tool-specific support, we offer dedicated services for <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS data analysis</Link>, <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">STATA statistical analysis</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R statistical analysis</Link>, and <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures that assumption testing precedes analysis, interpretation accompanies every result, and deliverables are formatted according to APA or your institution's requirements. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your project</Link> to be matched with a quantitative analyst within hours.
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
                Why TaskLynk for Quantitative Data Analysis
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Quantitative analysis demands precision—not just in computation, but in methodology, assumption testing, and interpretation. A single violated assumption or misapplied test can invalidate an entire dissertation chapter. That is why TaskLynk's marketplace is built around verified quantitative specialists who don't just know software—they understand statistical theory, research design, and the practical realities of academic and applied research. Our analysts are matched based on their specific methodological expertise, not just their claimed software proficiency.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond the analytical expertise, our managed marketplace adds critical layers of protection and support. <strong>Secure milestone escrow</strong> ensures you only release payment after approving results. <strong>Dedicated project managers</strong> coordinate between you and the analyst, track milestones, and ensure communication stays on track. <strong>NDA protection</strong> safeguards your research data and intellectual property. Our <strong>100% satisfaction guarantee</strong> includes free revisions if the analysis doesn't meet your specifications, and re-matching with a different specialist if needed. For dissertational work, we offer <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">integrated research data analysis</Link> that combines quantitative and qualitative analysis under one project manager, ensuring consistency across your entire findings chapter.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
