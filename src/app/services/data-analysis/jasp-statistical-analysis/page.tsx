import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  BarChart3,
  Users,
  ShieldCheck,
  Zap,
  DollarSign,
  Clock,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Brain,
  BookOpen,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/jasp-statistical-analysis",
  {
    title: "Hire JASP Statistical Analysis Freelancers | Free SPSS Alternative | TaskLynk",
    description:
      "Hire vetted JASP freelancers on TaskLynk for Bayesian and frequentist statistical analysis. Frequentist & Bayesian t-tests, ANOVA, regression, correlation, and more. Secure payments, project managers.",
    openGraph: {
      title: "Hire JASP Statistical Analysis Freelancers | Free SPSS Alternative | TaskLynk",
      description:
        "Hire vetted JASP freelancers for Bayesian and frequentist statistical analysis. Secure payments, project managers, fast delivery.",
      type: "website",
    },
  }
);

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is JASP and why should I use it instead of SPSS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JASP (Jeffreys&apos;s Amazing Statistics Program) is a free, open-source statistical software with a user-friendly GUI similar to SPSS. It excels at Bayesian statistics and produces publication-ready APA tables automatically. It&apos;s ideal for students and researchers on a budget who need both frequentist and Bayesian analysis.",
      },
    },
    {
      "@type": "Question",
      name: "Can JASP handle the same analyses as SPSS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JASP covers most common analyses: t-tests, ANOVA, regression, correlation, chi-square, factor analysis, reliability, and more. It has excellent Bayesian alternatives. However, SPSS has more advanced options for complex survey designs, mixed models, and specialized procedures. Our freelancers can advise which tool fits your needs.",
      },
    },
    {
      "@type": "Question",
      name: "Do your JASP freelancers provide both frequentist and Bayesian analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Our JASP specialists are proficient in both frameworks. They can run traditional p-value-based tests alongside Bayesian alternatives (Bayes Factors, credible intervals), helping you present robust evidence regardless of your committee or journal&apos;s preferences.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get the JASP output files (.jasp) for reproducibility?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Every analysis includes the complete .jasp file so you can reproduce, modify, or extend the analysis yourself. This is a key advantage of JASP&apos;s open format — your analysis isn&apos;t locked in proprietary output.",
      },
    },
    {
      "@type": "Question",
      name: "How much does JASP analysis cost on TaskLynk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JASP freelance rates typically range from $30–$80 per hour or $200–$2,000 per project. Since JASP is free software, you save on licensing costs compared to SPSS. Post your project with your budget and receive competitive bids.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "JASP Statistical Analysis",
  provider: {
    "@type": "Organization",
    name: "TaskLynk",
    url: "https://www.tasklynk.co.ke",
  },
  areaServed: { "@type": "Country", name: "Kenya" },
  description:
    "Hire vetted JASP freelancers for Bayesian and frequentist statistical analysis. Free SPSS alternative with APA-ready output. Secure escrow payments and project management.",
};

export default function JASPStatisticalAnalysisPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <MainHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-20 md:pt-28 pb-16 lg:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/50">
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Brain className="w-3 h-3" />
                <span>Free Statistical Software</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire JASP Statistical Analysis Freelancers <br />
                <span className="text-gradient-orange">Free SPSS Alternative with Bayesian Power</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                SPSS licenses cost thousands per year. JASP is free, open-source, and adds Bayesian statistics that SPSS lacks. Hire vetted JASP freelancers on TaskLynk for publication-ready frequentist and Bayesian analysis — without the licensing fees.
              </p>
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  Who Hires JASP Freelancers on TaskLynk?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  JASP is rapidly gaining adoption in academia because it removes cost barriers while adding modern Bayesian capabilities. Our freelancers serve clients who need rigorous analysis without proprietary software lock-in.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li><strong>Graduate Students</strong> on tight budgets needing thesis/dissertation analysis</li>
                  <li><strong>Academic Researchers</strong> submitting to journals requiring Bayesian evidence</li>
                  <li><strong>Psychology & Social Science Labs</strong> adopting open science practices</li>
                  <li><strong>Researchers Without Institutional SPSS Licenses</strong> (common in developing regions)</li>
                  <li><strong>Early-Career Researchers</strong> building reproducible workflows from the start</li>
                  <li><strong>Kenyan Universities & NGOs</strong> seeking cost-effective statistical support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  What Our JASP Freelancers Deliver
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  JASP&apos;s strength is its dual framework: every frequentist test has a Bayesian counterpart. Our freelancers leverage this to give you the most complete statistical picture possible.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Frequentist Analysis (Classic NHST)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Independent & paired samples t-tests, one-sample t-tests</li>
                  <li>One-way, two-way, repeated measures ANOVA / ANCOVA</li>
                  <li>Linear regression (simple, multiple, hierarchical)</li>
                  <li>Correlation: Pearson, Spearman, Kendall&apos;s tau</li>
                  <li>Chi-square tests: goodness-of-fit, independence</li>
                  <li>Factor analysis (EFA) and reliability analysis (Cronbach&apos;s α, McDonald&apos;s ω)</li>
                  <li>Non-parametric: Mann-Whitney, Wilcoxon, Kruskal-Wallis, Friedman</li>
                  <li>Binomial test, multinomial test</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Bayesian Analysis (JASP&apos;s Superpower)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Bayesian t-tests (independent, paired, one-sample) with Bayes Factors</li>
                  <li>Bayesian ANOVA with model comparison and inclusion Bayes Factors</li>
                  <li>Bayesian regression with posterior distributions for coefficients</li>
                  <li>Bayesian correlation with credible intervals</li>
                  <li>Bayesian binomial and multinomial tests</li>
                  <li>Bayesian factor analysis and structural equation modeling (SEM)</li>
                  <li>Prior sensitivity analysis: robustness across prior specifications</li>
                  <li>Sequential analysis: monitor evidence as data accumulates</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Publication-Ready Output</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>APA 7th edition formatted tables (automatically generated)</li>
                  <li>Annotated output with plain-English interpretation</li>
                  <li>Effect sizes with confidence/credible intervals</li>
                  <li>Assumption checking: normality, homogeneity, sphericity</li>
                  <li>Complete .jasp files for full reproducibility</li>
                  <li>Figures: raincloud plots, posterior distributions, Bayes Factor robustness plots</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Data Handling & Preprocessing</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Import from CSV, Excel, SPSS (.sav), Stata (.dta), SAS, R, jamovi</li>
                  <li>Data cleaning: missing value analysis, outlier detection</li>
                  <li>Variable transformation, recoding, compute variables</li>
                  <li>Reliability analysis with item-total statistics</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Why TaskLynk for JASP?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                The Marketplace Advantage for Open-Source Statistics
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                JASP expertise is niche. We&apos;ve vetted the specialists so you don&apos;t have to.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Brain, title: "Bayesian Specialists", desc: "Freelancers with demonstrated Bayesian analysis experience — not just frequentist." },
                { icon: BookOpen, title: "Open Science Advocates", desc: "Experts who prioritize reproducibility, pre-registration, and open data practices." },
                { icon: ShieldCheck, title: "Secure Escrow", desc: "Pay only when the .jasp file and interpretation meet your requirements." },
                { icon: DollarSign, title: "No License Fees", desc: "JASP is free. You pay only for expertise, not software subscriptions." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                From Research Question to Bayesian Evidence in 3 Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Describe Your Analysis", desc: "Share your research questions, hypotheses, data (or design), and preferred framework (frequentist/Bayesian/both)." },
                { step: "02", icon: Users, title: "Get Matched with JASP Experts", desc: "Receive proposals from freelancers who specialize in your exact analysis type within 24 hours." },
                { step: "03", icon: CheckCircle2, title: "Receive Reproducible Results", desc: "Get APA tables, annotated interpretation, and the complete .jasp file. Approve to release payment." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-blue-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About JASP Analysis on TaskLynk?
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqSchema.mainEntity.map((faq, index) => (
                <details key={index} className="group bg-card border border-border rounded-xl p-6">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-foreground">
                    {faq.name}
                    <span className="text-primary transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-blue-500 via-blue-500/95 to-blue-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready for Free, Reproducible Statistics?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your JASP project today. Get Bayesian and frequentist analysis from vetted experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90 font-bold rounded-full px-8">
                  <Link href="/register/client">Post a Project Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/30 hover:bg-white/10 text-white font-bold rounded-full px-8">
                  <Link href="/services/data-analysis">View All Data Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Internal Links */}
        <section className="py-12 bg-background border-t border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="prose prose-slate dark:prose-invert max-w-none max-w-3xl mx-auto text-center">
              <p className="text-sm text-muted-foreground">
                Need a different tool? Explore{" "}
                <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/jamovi-statistical-analysis" className="text-primary font-semibold hover:underline">jamovi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">Stata</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}