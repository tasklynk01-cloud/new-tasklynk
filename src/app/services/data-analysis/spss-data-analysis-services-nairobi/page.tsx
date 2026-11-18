import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Database,
  BarChart3,
  FileCheck,
  Sigma,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle,
  MapPin,
  Sparkles,
  PhoneCall,
  ArrowRight,
  Calculator,
  Laptop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'SPSS Data Analysis Services Nairobi | Hire Vetted Statistical Analysts',
  'Premier SPSS data analysis services in Nairobi, Kenya. Expert Chapter 4 dissertation writeups, hypothesis testing, regression, ANOVA, and factor analysis. Local Nairobi analysts, APA 7th format, M-Pesa payments.',
  '/services/data-analysis/spss-data-analysis-services-nairobi'
);

const faqs = [
  {
    question: 'How fast can a Nairobi SPSS analyst complete my thesis Chapter 4?',
    answer:
      'Standard turnaround for a complete Chapter 4 (Results & Interpretation) with APA 7th tables and figures is 3 to 5 business days. For urgent deadlines, our express Nairobi team delivers within 24 to 48 hours without compromising methodological rigor.',
  },
  {
    question: 'Do you provide the SPSS syntax (.sps) and cleaned dataset (.sav)?',
    answer:
      'Yes. Every analysis delivered includes the cleaned, labeled SPSS dataset (.sav), the reproducible syntax file (.sps), the full output log (.spv), and an editable Word document with APA 7th formatted tables and narrative interpretation ready for your supervisor.',
  },
  {
    question: 'Are your analysts familiar with UoN, Strathmore, and KU thesis formats?',
    answer:
      'Absolutely. Our statistical team is composed of postgraduates and faculty researchers from top Nairobi institutions including University of Nairobi (UoN), Strathmore Business School (SBS), Kenyatta University (KU), USIU-Africa, and JKUAT. Every report adheres to your specific institutional rubric.',
  },
  {
    question: 'What statistical tests can you perform in SPSS?',
    answer:
      'We handle the full statistical pipeline: reliability testing (Cronbach’s Alpha), descriptive statistics, normality diagnostics (Shapiro-Wilk), Pearson & Spearman correlations, Independent/Paired t-tests, One-way & Two-way ANOVA/MANOVA, Multiple Linear & Logistic Regression, Exploratory & Confirmatory Factor Analysis (EFA/CFA), and Hayes PROCESS Macro (mediation and moderation models).',
  },
  {
    question: 'How much does SPSS data analysis cost in Nairobi?',
    answer:
      'Pricing is transparent and based on dataset size and test complexity. Simple descriptive analysis and t-tests start from KES 2,500. Full postgraduate Chapter 4 writeups (regression, ANOVA, factor analysis, hypothesis testing) typically range from KES 6,500 to KES 15,000 with milestone-based M-Pesa payments.',
  },
  {
    question: 'Is my research data kept confidential?',
    answer:
      'Yes. All projects are safeguarded under strict Non-Disclosure Agreements (NDA). Your raw datasets, research instruments, and findings are stored in encrypted environments and permanently expunged upon your final supervisor sign-off.',
  },
];

const relatedServices = [
  { label: 'MBA Thesis Proofreading Kenya', href: '/services/academic-writing/mba-thesis-proofreading-kenya' },
  { label: 'SPSS Analysts Kenya', href: '/services/data-analysis/spss-analysts-kenya' },
  { label: 'Data Analysts Nairobi', href: '/services/data-analysis/data-analysts-nairobi' },
  { label: 'Business Plan Cost in Kenya', href: '/pricing/how-much-does-a-business-plan-cost-in-kenya' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Excel Data Analysis', href: '/services/data-analysis/excel-data-analysis' },
  { label: 'Power BI Dashboard Nairobi', href: '/services/data-analysis/power-bi-dashboard' },
];

export default function SpssDataAnalysisNairobiPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/spss-data-analysis-services-nairobi"
      serviceSchemaName="SPSS Data Analysis Services Nairobi"
      serviceSchemaDescription="Professional SPSS data analysis services in Nairobi, Kenya. Statistical testing, hypothesis evaluation, regression, ANOVA, and dissertation Chapter 4 results writeup with reproducible syntax."
      heroEyebrow="Nairobi Statistical Consulting Hub"
      heroTitle="SPSS Data Analysis Services Nairobi | Hire Vetted Statistical Analysts"
      heroIntro="Struggling with SPSS syntax, assumption violations, or Chapter 4 dissertation writeups? TaskLynk connects postgraduate students, university faculty, and NGO researchers in Nairobi with vetted statistical consultants. From survey coding and reliability testing to multivariate regression and Hayes PROCESS mediation models, get publication-grade statistical analysis formatted to UoN, Strathmore, USIU, and KU guidelines—backed by M-Pesa escrow."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/register/client"
    >
      {/* Local Nairobi Context & Scope */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF7A3D] mb-2">
                <MapPin className="w-4 h-4" />
                Nairobi • Westlands • Upper Hill • Kilimani • CBD
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Why Nairobi Researchers Choose TaskLynk SPSS Consultants
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Nairobi is the academic and research capital of East Africa, housing premier universities and international NGOs. Yet statistical data analysis remains the primary roadblock in thesis defense approvals. At TaskLynk, our analysts work in your time zone, understand the exact expectations of Kenyan university supervisory boards, and provide transparent milestone billing via M-Pesa STK push.
              </p>
            </div>
            <div className="w-full md:w-80 bg-card border border-border rounded-2xl p-6 shadow-sm shrink-0">
              <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
                <Clock className="w-4 h-4 text-[#FF7A3D]" />
                Nairobi Turnaround Times
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex justify-between pb-1 border-b border-border/40">
                  <span>Data Cleaning &amp; Coding:</span>
                  <strong className="text-foreground">24 Hours</strong>
                </li>
                <li className="flex justify-between pb-1 border-b border-border/40">
                  <span>Descriptives &amp; T-Tests:</span>
                  <strong className="text-foreground">24 - 48 Hours</strong>
                </li>
                <li className="flex justify-between pb-1 border-b border-border/40">
                  <span>Regression / ANOVA Models:</span>
                  <strong className="text-foreground">48 - 72 Hours</strong>
                </li>
                <li className="flex justify-between">
                  <span>Full Chapter 4 &amp; 5 Writeup:</span>
                  <strong className="text-foreground">3 - 5 Days</strong>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-border/60">
                <Button asChild size="sm" className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl">
                  <Link href="/register/client">Book An Analyst Today</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Data Preparation &amp; Coding</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Transform raw survey questionnaires into clean SPSS (.sav) files. Variable naming, value labeling, missing value imputation (Little&apos;s MCAR test), reverse scoring, and composite index formulation.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Sigma className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Assumption Diagnostics</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Never fail an oral defense due to unverified assumptions. Rigorous testing for Normality (Shapiro-Wilk), Multicollinearity (VIF/Tolerance), Homoscedasticity (Levene&apos;s), and Outlier detection (Cook&apos;s Distance).
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Hypothesis &amp; Model Testing</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Hierarchical regression, binary/multinomial logistic regression, exploratory factor analysis (EFA), Cronbach&apos;s alpha reliability analysis, and mediation/moderation via Andrew Hayes PROCESS Macro.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Chapter 4 APA Results Writeup</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Complete results narrative ready for insertion into your dissertation. Includes APA 7th edition tables, high-resolution statistical charts, and clear interpretations linking findings back to your research objectives.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Reproducible Syntax (.sps)</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Every delivery comes with documented SPSS syntax files. When your supervisor or external examiner requests verification, run the script in one click to reproduce 100% of the numbers.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Supervisor Defense Coaching</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Don&apos;t just receive tables—understand what they mean. Our Nairobi consultants provide bulleted oral defense speaking notes explaining p-values, R-squared values, and statistical significance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Table */}
      <section className="py-16 sm:py-20 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Transparent Nairobi Rates</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-2">
              Affordable SPSS Packages for Kenyan Scholars
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Pay securely in Kenya Shillings (KES) via M-Pesa. Escrow holds funds until you inspect and approve the analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Undergraduate Package</span>
                <h3 className="text-xl font-black text-foreground mt-1">Basic Statistical Analysis</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KES 3,500</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Average delivery: 2-3 Days</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Dataset cleaning &amp; coding (up to 150 cases)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Descriptives (mean, frequencies, charts)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Reliability (Cronbach&apos;s alpha)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Correlation &amp; basic t-tests</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Clean .sav &amp; .sps syntax files</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#5B3594] hover:bg-[#482A77] text-white font-bold rounded-xl">
                <Link href="/register/client">Select Basic Package</Link>
              </Button>
            </div>

            <div className="bg-card border-2 border-[#FF7A3D] rounded-2xl p-6 shadow-md relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF7A3D] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                Most Popular for Masters
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Postgraduate / MBA</span>
                <h3 className="text-xl font-black text-foreground mt-1">Full Chapter 4 Results</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-[#FF7A3D]">KES 8,500</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Average delivery: 3-5 Days</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Full sample data cleaning &amp; reverse coding</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Assumption diagnostics (Normality, VIF, Levene&apos;s)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Factor analysis (EFA) &amp; construct validity</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Multiple regression &amp; hypothesis testing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Complete Chapter 4 APA writeup in Word</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Supervisor revision guarantee</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl shadow-md shadow-[#FF7A3D]/25">
                <Link href="/register/client">Select Postgraduate Package</Link>
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">PhD &amp; Corporate</span>
                <h3 className="text-xl font-black text-foreground mt-1">Advanced Multivariate &amp; SEM</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KES 16,500</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Average delivery: 5-7 Days</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Complex large-scale survey datasets</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Structural Equation Modeling (AMOS / SEM)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Mediation &amp; Moderation (Hayes PROCESS)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Publication-ready peer-review figures</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 1-on-1 virtual defense walkthrough</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#5B3594] hover:bg-[#482A77] text-white font-bold rounded-xl">
                <Link href="/register/client">Select PhD Package</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
