import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, FileText, ClipboardCheck, Search, BarChart3, ShieldCheck, Clock, Users } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Research Data Editing & Cleaning Services | Prepare Your Dataset',
  'Professional data cleaning and editing services for research datasets. Handle missing values, outliers, variable recoding, format conversion, and validation across SPSS, R, Python, STATA, and Excel.',
  '/services/research/data-editing'
);

const faqs = [
  {
    question: 'What does data cleaning include?',
    answer: 'Our data cleaning service covers data import from any format (CSV, Excel, SPSS, Stata, R, JSON, SQL databases), missing value identification and treatment, outlier detection and handling, variable type correction, value recoding and relabeling, duplicate removal, consistency checks across variables, logical validation, and dataset restructuring. We also provide a detailed cleaning log documenting every change made, ensuring full reproducibility and transparency.',
  },
  {
    question: 'Which file formats and software do you support?',
    answer: 'We support all major data formats including CSV, Excel (.xlsx, .xls), SPSS (.sav), Stata (.dta), R (.rds, .RData), SAS (.sas7bdat), JSON, SQL dumps, and Access databases. We can deliver cleaned data in any format you need, along with accompanying syntax or script files that document the cleaning process for full reproducibility.',
  },
  {
    question: 'How do you handle missing data?',
    answer: 'We assess the pattern and mechanism of missingness (MCAR, MAR, MNAR) and apply appropriate strategies: listwise deletion for complete-case analysis, mean/mode imputation for single-valued variables, regression imputation for predicted values, or multiple imputation (MICE) for complex missing data patterns. We always document the proportion of missing data, the method applied, and the potential impact on your analysis.',
  },
  {
    question: 'What about outlier detection and treatment?',
    answer: 'We use multiple approaches for outlier detection: statistical methods (Z-scores, IQR method, Mahalanobis distance), visualization (boxplots, scatterplots), and domain-knowledge-based review. Outliers are investigated rather than automatically removed, and we document whether each outlier represents a data entry error, a legitimate extreme value, or a different population. Treatment options include winsorization, transformation, or retaining with robust analysis methods.',
  },
  {
    question: 'Can you merge datasets from multiple sources?',
    answer: 'Yes. We handle dataset merging including one-to-one matching, appending/stacking, many-to-many relationships, cross-database joins, and longitudinal data restructuring. We ensure variable consistency, key matching accuracy, and documentation of merge logic. For complex merges, we provide match rates, unmatched records reports, and duplicate identification.',
  },
  {
    question: 'Do you provide a data cleaning log?',
    answer: 'Yes. Every data cleaning project includes a detailed cleaning log or data cleaning report that documents every transformation, recoding, imputation, or removal applied. This report includes before-and-after summaries, variable descriptions, value labels, and syntax/script files. This documentation ensures reproducibility and allows supervisors or collaborators to verify and understand all data preparation steps.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Data Collection Services', href: '/services/research/data-collection' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Register as Freelancer', href: '/register/freelancer' },
];

export default function DataEditingPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/research/data-editing"
      serviceSchemaName="Research Data Editing & Cleaning Services"
      serviceSchemaDescription="Professional data cleaning and editing services for research datasets. Handle missing values, outliers, variable recoding, format conversion, and validation across SPSS, R, Python, STATA, and Excel with full documentation."
      heroEyebrow="Data Cleaning"
      heroTitle="Research Data Editing & Cleaning Services | Prepare Your Dataset"
      heroIntro="Raw research data is rarely analysis-ready. Missing values, inconsistent coding, duplicate entries, incorrect variable types, outliers, and format incompatibilities can all silently corrupt your analysis, waste time, and produce misleading conclusions. TaskLynk connects you with vetted data cleaning specialists—experts in SPSS, R, Python, STATA, and Excel—who prepare your dataset for rigorous analysis with documented, reproducible methods. With secure milestone payments, NDA protection, and a full cleaning log for transparency, your data is transformed from messy to analysis-ready."
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
                This service is for researchers who have collected or acquired data but need it cleaned and structured for analysis. <strong>Undergraduate students</strong> analyzing survey data for assignments or honors projects who encounter messy datasets with missing values, inconsistent formatting, or incorrect variable types. <strong>Master's candidates</strong> working with dissertational data that requires extensive cleaning, validation, merging of multiple data sources, or transformation for statistical analysis. <strong>PhD researchers</strong> handling large, complex datasets from multiple waves of data collection, administrative records, or secondary sources that need systematic cleaning and documentation. <strong>Academic faculty</strong> who need data preparation support for research projects, particularly when working with student-collected data that requires quality assurance. <strong>Research assistants</strong> who need to standardize datasets from multiple collectors or sources. <strong>Clinical researchers</strong> managing patient data that requires de-identification, validation, and format standardization. <strong>Social scientists</strong> working with survey data from multiple waves or multiple countries that need harmonization and cleaning.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If your dataset has missing values, outliers, inconsistent coding, duplicate records, incorrect variable types, or needs to be merged from multiple sources, our data cleaning service provides the expertise. We also support <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS data analysis</Link>, <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative analysis</Link>, and <Link href="/services/research/data-collection" className="text-primary font-semibold hover:underline">data collection</Link> for full end-to-end research support.
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
                What We Offer: Systematic Data Cleaning and Validation
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our data cleaning service follows a systematic, documented approach that ensures your dataset is not only clean but also transparent and reproducible. We begin with a <strong>comprehensive data audit</strong>—examining your dataset's structure, variable types, coding schemes, missing value patterns, outlier distributions, and consistency across variables. We identify potential issues such as duplicate records, inconsistent labeling, mismatched variable types, and logical errors in the data. This audit phase produces a detailed report of all issues found, prioritized by severity and potential impact on your analysis.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Next, we implement <strong>corrective measures</strong> based on the audit findings and your project requirements. For missing data, we assess the pattern of missingness (MCAR, MAR, MNAR) and apply appropriate treatment—listwise deletion for complete-case analysis, mean/mode imputation for single-valued variables, regression imputation for predicted values, or multiple imputation using chained equations (MICE) for complex patterns. For outliers, we investigate each case to determine whether it represents a data entry error, a legitimate extreme value, or a different population, then apply appropriate treatment (correction, transformation, winsorization, or retention with robust methods). For variable issues, we recode categorical variables, standardize formatting, assign value labels, and ensure consistent coding across all related variables.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Audit &amp; Profiling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive examination of data structure, variable types, missing patterns, outliers, and consistency issues with a prioritized issue report.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Missing Data Treatment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pattern analysis, imputation strategies, multiple imputation (MICE), and documentation of all missing data decisions.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Outlier Detection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Statistical and visualization-based outlier identification with investigation, treatment recommendations, and transparency.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Cleaning Log &amp; Code</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full documentation with cleaning log, syntax/script files, and variable dictionary for complete reproducibility.
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
                Software and Format Support
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our data cleaning specialists work with all major statistical software and data formats, ensuring your dataset is cleaned and structured in the tool you need. For <strong>SPSS users</strong>, we handle .sav files, variable and value labels, missing value definitions, measure scales, and produce well-documented syntax files that reproduce every cleaning step. For <strong>STATA users</strong>, we clean .dta files, assign variable labels and value labels, handle extended missing values, and produce .do files that document the entire process. For <strong>R users</strong>, we work with data frames, tibbles, and various R data formats, producing clean scripts that follow reproducible research principles and can be integrated into R Markdown workflows. For <strong>Python users</strong>, we use pandas, NumPy, and pyjanitor to clean data and produce Jupyter notebooks that document every transformation step. For <strong>Excel users</strong>, we clean .xlsx files with formula-based and VBA-based approaches, producing clean workbooks with documented formulas and data validation.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For researchers who need to merge datasets from multiple sources, we handle cross-format merging, join operations, and longitudinal data restructuring. We also support data export to any format you need for subsequent analysis. Our specialists have experience with complex data structures including repeated measures, panel data, hierarchical/nested data, and survey data with sampling weights. Every cleaning project includes a comprehensive cleaning report documenting all changes, decisions, and justifications. <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">For SPSS-specific cleaning</Link> or <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative analysis</Link> needs, our specialists provide tool-specific expertise. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures your data is cleaned with full documentation. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your data cleaning project</Link> today.
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
                Why TaskLynk for Data Editing and Cleaning
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Data cleaning is often the most time-consuming and error-prone phase of any research project. A single mistake in data preparation can cascade through your entire analysis, producing misleading results and invalidating conclusions. TaskLynk's marketplace connects you with data cleaning specialists who have deep experience in research data management, statistical software, and reproducible analysis workflows. Every data cleaning specialist in our network has completed graduate-level coursework in data management or quantitative methods, has cleaned datasets for at least 10 major research projects, and has demonstrable proficiency in multiple software tools. We also verify their ability to produce well-documented, reproducible cleaning workflows that supervisors and collaborators can trust.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each cleaning phase before payment, <strong>dedicated project managers</strong> who coordinate between you and the specialist, and <strong>NDA protection</strong> for your research data. For academic researchers, we also offer <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link>, <Link href="/services/data-analysis/research-data-analysis-services" className="text-primary font-semibold hover:underline">research data analysis</Link>, and <Link href="/services/research/data-collection" className="text-primary font-semibold hover:underline">data collection services</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures data quality and documentation, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your data cleaning project</Link> today to be matched with a qualified specialist.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
