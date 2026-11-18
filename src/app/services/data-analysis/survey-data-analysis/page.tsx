import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, BarChart3, PieChart, FileSpreadsheet, TrendingUp, ShieldCheck, Clock, Users } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Survey Data Analysis Services | Clean Survey Responses Into Insights',
  'Transform raw survey responses into statistically valid insights. Hire vetted survey data analysts for cross-tabulation, regression, factor analysis, and survey weighting. Secure and confidential.',
  '/services/data-analysis/survey-data-analysis'
);

const faqs = [
  {
    question: 'What does survey data analysis include?',
    answer: 'Our service covers the complete survey analysis pipeline: data import and cleaning from any survey platform, variable recoding and labeling, missing value treatment, survey weighting and post-stratification, descriptive statistics with cross-tabulations, reliability analysis (Cronbach\'s alpha), exploratory and confirmatory factor analysis, correlation analysis, regression modeling (linear, logistic, ordinal), segmentation analysis, and results interpretation. All deliverables include APA-formatted tables and figures, syntax files, and plain-language summaries suitable for reports and dissertations.',
  },
  {
    question: 'Which survey platforms do you support?',
    answer: 'We support data from all major survey platforms including Qualtrics, SurveyMonkey, Google Forms, Typeform, LimeSurvey, SurveyGizmo (now Alchemer), and custom survey applications. We can also work with data exported from paper-based surveys and telephone interviews. If your survey was administered in a non-standard format, our specialists can still extract and process the responses.',
  },
  {
    question: 'Can you help with survey design and questionnaire development?',
    answer: 'Yes. We offer comprehensive survey design services including questionnaire construction, scale development and validation, sampling strategy design, pilot testing, and survey administration setup. Our survey methodology specialists ensure your instrument produces valid, reliable, and unbiased measurements. See our dedicated <Link href="/services/research/survey-design">survey and questionnaire design services</Link> for more details.',
  },
  {
    question: 'How do you handle survey weighting and representativeness?',
    answer: 'We apply post-stratification weighting to align your sample with population benchmarks when demographic or geographic weighting variables are available. We also calculate design effects, conduct sensitivity analyses on weighting, and report confidence intervals adjusted for the survey design. For complex sample surveys, we can implement Taylor series linearization or bootstrap variance estimation.',
  },
  {
    question: 'Do you provide scale construction and validation?',
    answer: 'Yes. We conduct reliability analysis (Cronbach\'s alpha, composite reliability, McDonald\'s omega), exploratory factor analysis (EFA) to identify scale structure, confirmatory factor analysis (CFA) to test theoretical factor models, convergent and discriminant validity assessment, and item analysis (item-total correlations, Cronbach\'s alpha if item deleted). All scale development follows established psychometric standards.',
  },
  {
    question: 'How quickly can you analyze my survey data?',
    answer: 'Simple descriptive cross-tabulation reports are typically completed within 24–48 hours. More complex analyses involving regression modeling, factor analysis, or segmentation typically take 3–7 days. Large-scale survey datasets with multiple constructs and complex sampling designs may take 1–2 weeks. You specify your deadline, and we match you with analysts who can commit to it.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Survey & Questionnaire Design', href: '/services/research/survey-design' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'Data Collection Services', href: '/services/research/data-collection' },
  { label: 'Market Research Services', href: '/services/business/market-research' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function SurveyDataAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/survey-data-analysis"
      serviceSchemaName="Survey Data Analysis Services"
      serviceSchemaDescription="Professional survey data analysis from Qualtrics, SurveyMonkey, and Google Forms. Cross-tabulation, regression, factor analysis, survey weighting, scale validation, and interpretation reports."
      heroEyebrow="Survey Data Analysis"
      heroTitle="Survey Data Analysis Services | Clean Survey Responses Into Insights"
      heroIntro="Survey data is the backbone of market research, academic studies, and policy evaluation. But raw survey responses—thousands of rows of checkboxes, rating scales, and open-text fields—are just the starting point. Transforming that data into clear, actionable insights that answer your research questions requires expertise in survey methodology, statistical software, scale validation, and interpretation. TaskLynk connects you with vetted survey data analysts—experts in SPSS, R, Python, and Qualtrics—who specialize in cleaning, analyzing, and interpreting survey data. With secure milestone payments, NDA protection, and dedicated project management, your survey insights are in expert hands."
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
                This service is for anyone who has collected survey data and needs to extract meaningful insights from it. <strong>Undergraduate and postgraduate students</strong> analyzing survey data for research projects, theses, and dissertations—particularly in social sciences, psychology, education, marketing, and public policy. <strong>Market researchers</strong> who need to analyze customer satisfaction surveys, brand awareness studies, product feedback, or employee engagement surveys. <strong>Academic researchers</strong> conducting large-scale survey-based studies that require advanced statistical analysis, scale validation, and survey weighting. <strong>NGOs and government agencies</strong> evaluating program impact through household or community surveys. <strong>Business consultants</strong> analyzing employee surveys, customer feedback, or organizational climate assessments. <strong>Healthcare professionals</strong> analyzing patient satisfaction surveys, treatment outcome measures, or epidemiological survey data.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                If you have survey data from any platform—Qualtrics, SurveyMonkey, Google Forms, or proprietary systems—and need to analyze responses, validate measurement scales, test hypotheses, or produce cross-tabulation reports, our survey data analysis service provides the expertise. We also support researchers who need <strong>survey design and questionnaire development</strong> services—see our dedicated <Link href="/services/research/survey-design" className="text-primary font-semibold hover:underline">survey design service</Link> for instrument construction and sampling strategy. For teams conducting <Link href="/services/business/market-research" className="text-primary font-semibold hover:underline">market research</Link>, we provide end-to-end analysis including segmentation, positioning, and competitive intelligence from survey data.
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
                What We Offer: From Raw Responses to Actionable Insights
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our survey data analysis service covers the complete analytical pipeline, ensuring that every phase—from data import to results interpretation—is handled with methodological rigor. We begin with <strong>data import and cleaning</strong>: extracting responses from any survey platform, handling missing data through appropriate imputation or exclusion strategies, recoding open-ended responses into categorical variables, detecting and addressing straight-lining or careless responding, and applying survey weights to align your sample with population benchmarks. This step alone often requires significant expertise, as survey data quality varies widely across platforms and collection methods.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Next, we conduct <strong>descriptive analysis</strong>: generating frequency distributions, cross-tabulations, mean comparisons, and visualizations that summarize response patterns across key demographic and behavioral segments. We then move to <strong>scale validation</strong>—conducting reliability analysis (Cronbach's alpha, composite reliability, McDonald's omega), exploratory factor analysis (EFA) to identify underlying constructs, confirmatory factor analysis (CFA) to test theoretical models, and item analysis to refine measurement instruments. Finally, we perform <strong>inferential analysis</strong> including correlation analysis, simple and multiple regression, logistic regression, ordinal regression, ANOVA for group comparisons, and advanced techniques like mediation/moderation analysis or segmentation clustering. Every analysis is accompanied by a plain-language interpretation of what the results mean for your specific research questions.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Cleaning &amp; Weighting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Missing data treatment, response validation, outlier detection, and post-stratification weighting from any survey platform.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Cross-Tab &amp; Segmentation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cross-tabulations, means comparisons, segment profiling, and demographic breakdowns with significance testing.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Scale Validation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cronbach's alpha, EFA, CFA, item analysis, and construct validity testing following psychometric best practices.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Regression &amp; Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Linear, logistic, and ordinal regression with diagnostics, mediation/moderation, and segmentation clustering.
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
                Survey Platforms and Statistical Tools We Support
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                We have extensive experience with survey data from all major platforms. For <strong>Qualtrics</strong> data, our specialists handle complex branching logic, embedded data fields, display logic, and the QSF export format, including survey flow reconstruction. For <strong>SurveyMonkey</strong>, we process large-scale exports with custom categories and weighted responses. For <strong>Google Forms</strong>, we handle spreadsheet exports, form response validation, and chained question logic. We also support <strong>LimeSurvey</strong>, <strong>Typeform</strong>, <strong>Alchemer/SurveyGizmo</strong>, and custom-built survey applications. Beyond platform support, our analysts are proficient in the statistical software your analysis requires: <strong>SPSS</strong> (including complex samples procedures), <strong>STATA</strong> (svy commands for complex survey designs), <strong>R</strong> (survey package, lavaan, lme4), <strong>Python</strong> (pandas, statsmodels, scipy), and <strong>Excel</strong> for simpler analyses.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                For researchers needing comprehensive support, we also offer <Link href="/services/research/survey-design" className="text-primary font-semibold hover:underline">survey design and questionnaire development</Link> services, including instrument construction, scale development, pilot testing, and sampling strategy. For dissertational work requiring tool-specific analysis, see our <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS data analysis services</Link> and <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link> service pages. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our managed workflow</Link> ensures your survey analysis is completed with methodological rigor and delivered with clear interpretation. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your project</Link> to connect with a survey data analyst today, or explore <Link href="/services/business/market-research" className="text-primary font-semibold hover:underline">market research services</Link> for business survey analysis.
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
                Why TaskLynk for Survey Data Analysis
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Survey analysis requires specialized expertise that goes beyond running software commands. A survey data analyst must understand sampling theory, questionnaire design, measurement error, weighting strategies, and the specific statistical considerations that arise from survey methodology. Generic freelancers often miss these nuances, leading to misinterpreted results and flawed conclusions. TaskLynk's marketplace connects you with analysts who have deep experience in survey methodology—many hold advanced degrees in statistics, social research, or quantitative psychology—and who have analyzed hundreds of survey datasets across diverse domains.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond methodological expertise, our managed marketplace provides <strong>secure milestone escrow</strong> ensuring you only pay after approving deliverables, <strong>dedicated project managers</strong> who coordinate between you and the analyst, and <strong>NDA protection</strong> for your survey data and research findings. All freelancers sign our confidentiality agreements before accessing any client data. For academic researchers, our specialists produce results chapters formatted to APA or your institution's requirements, complete with syntax files and documented analytical decisions. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your survey analysis project</Link> to be matched with a vetted specialist within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
