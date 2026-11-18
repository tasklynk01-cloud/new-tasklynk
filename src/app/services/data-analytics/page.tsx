import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  LineChart,
  PieChart,
  FileSpreadsheet,
  Database,
  Sigma,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Statistical Data Analysis & Business Intelligence Services | TaskLynk Kenya',
  'Expert SPSS, R, Python, Stata, and Power BI data analysis for postgraduate dissertations, business intelligence dashboards, and market research. Rigorous APA tables, hypothesis testing, and narrative interpretation.',
  '/services/data-analytics'
);

const faqs = [
  {
    question: 'Which statistical software packages do your analysts support?',
    answer:
      'Our senior data specialists are accredited in IBM SPSS Statistics, R / RStudio, Python (Pandas/Scikit-Learn), Stata, Jamovi, JASP, and Microsoft Power BI / Excel Power Query.',
  },
  {
    question: 'Do you provide the complete dataset (.sav/.csv) and syntax files?',
    answer:
      'Yes. Every delivered analysis includes the fully cleaned and coded dataset (.sav/.csv), reproducible syntax scripts (.sps/.R), output logs, and an editable Word report formatted with APA 7th tables and comprehensive narrative interpretation.',
  },
  {
    question: 'Can you handle postgraduate Chapter 4 results & discussion writeups?',
    answer:
      'Yes. We have supported hundreds of Master’s and PhD researchers across Kenyan universities (UoN, Strathmore, KU, USIU) as well as UK and international universities. Every writeup is strictly aligned to your supervisory guidelines.',
  },
  {
    question: 'How fast can a data analysis project be completed?',
    answer:
      'Standard turnaround for a complete statistical chapter or business dashboard is 3 to 5 business days. Express turnaround (24–48 hours) is available for urgent deadlines.',
  },
];

const relatedServices = [
  { label: 'SPSS Analysis Nairobi Hub', href: '/services/data-analysis/spss-data-analysis-services-nairobi' },
  { label: 'Data Processing & Entry', href: '/services/data-processing' },
  { label: 'Power BI Consultants Nairobi', href: '/services/data-analysis/power-bi-consultants-nairobi' },
  { label: 'Business Research & Intelligence', href: '/services/business-research' },
  { label: 'Accounting & Financial Support', href: '/services/accounting-support' },
];

const deliverables = [
  {
    title: 'Descriptive & Inferential Statistics (SPSS / Stata)',
    description: 'Hypothesis testing, Multiple Regression, ANOVA/MANOVA, Chi-Square, Cronbach’s Alpha reliability, Factor Analysis (EFA/CFA), and mediation analysis.',
    icon: Sigma,
  },
  {
    title: 'Interactive Power BI & Executive Dashboards',
    description: 'Custom business intelligence reports connected to your databases or Excel sheets with automated daily data refreshes and executive KPIs.',
    icon: BarChart3,
  },
  {
    title: 'Advanced R & Python Statistical Modeling',
    description: 'Predictive modeling, econometrics, time-series forecasting, panel data regressions, and publication-ready ggplot2 visualizations.',
    icon: LineChart,
  },
  {
    title: 'Advanced Excel & Financial Modeling',
    description: 'Dynamic financial models with automated formulas, scenario analysis, sensitivity matrices, pivot dashboards, and macro automation.',
    icon: FileSpreadsheet,
  },
];

export default async function DataAnalyticsPage() {
  const specialists = await getPublishedSpecialists({ category: 'data', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/data-analytics"
      serviceSchemaName="Statistical Data Analysis and Business Intelligence Services"
      serviceSchemaDescription="Comprehensive quantitative and qualitative statistical consulting across SPSS, R, Python, and Power BI."
      heroEyebrow="Data & Analytics"
      heroTitle="Statistical Data Analysis & Business Intelligence"
      heroIntro="Transform raw data into defensible research insights and executive decision tools. Our accredited statisticians and BI consultants deliver publication-grade Chapter 4 results writeups, interactive dashboards, and econometric models backed by TaskLynk quality assurance."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Data+Analytics"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Methodological Rigour
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Rigorous Statistical Methodologies &amp; Defensible Reporting
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Whether you are preparing a thesis defense before an academic panel or presenting quarterly performance to a corporate board, our analysis is reproducible, transparent, and strictly verified.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.title}
                className="linen-card rounded-2xl p-6 hover:border-[#FF7A3D] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceTeamShowcase
        title="Accredited Data Statisticians & BI Analysts"
        subtitle="Meet verified data science professionals from the TaskLynk team specializing in SPSS, R, and Power BI."
        specialists={specialists}
        serviceCategory="Data Analytics"
      />

      <section className="py-16 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="linen-card rounded-3xl p-8 max-w-3xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-black text-foreground">Need Your Dataset Cleaned or Analyzed?</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Upload your dataset and research objectives. A senior statistical lead will audit your data structure and assign an accredited analyst under milestone escrow.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-2xl px-8">
                <Link href="/client/new-job?service=Data+Analytics">
                  <span>Start Data Analysis Brief</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
