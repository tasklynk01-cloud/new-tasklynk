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
  Layers,
  Sparkles,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/jamovi-statistical-analysis",
  {
    title: "Hire jamovi Statistical Analysis Freelancers | Modern SPSS Alternative | TaskLynk",
    description:
      "Hire vetted jamovi freelancers on TaskLynk for statistical analysis with a modern, spreadsheet-like interface. Frequentist & Bayesian tests, GAMLJ modules, reproducible .omv files. Secure payments, project managers.",
    openGraph: {
      title: "Hire jamovi Statistical Analysis Freelancers | Modern SPSS Alternative | TaskLynk",
      description:
        "Hire vetted jamovi freelancers for statistical analysis with a modern interface. Frequentist & Bayesian tests, GAMLJ modules, reproducible files.",
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
      name: "What is jamovi and how does it differ from SPSS and JASP?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "jamovi is a free, open-source statistical spreadsheet built on R. It combines a modern, intuitive spreadsheet interface (like Excel) with R&apos;s statistical power. Unlike SPSS (expensive, dated GUI) and JASP (more traditional layout), jamovi uses a spreadsheet-style data view and a modular system (GAMLJ, scatr, etc.) for extensibility. It&apos;s ideal for users who want a modern workflow and easy transition to R.",
      },
    },
    {
      "@type": "Question",
      name: "Can jamovi handle advanced analyses like mixed models and SEM?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, through modules. The GAMLJ module provides generalized linear mixed models, mediation/moderation, and more. The scatr module adds structural equation modeling (lavaan). The jmvconnect module lets you run R code directly. Our freelancers know which modules to use for your specific analysis needs.",
      },
    },
    {
      "@type": "Question",
      name: "Do jamovi freelancers provide R syntax for reproducibility?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. jamovi generates R syntax (via the &apos;Syntax Mode&apos; or jmvconnect) for every analysis. Our freelancers provide the .omv jamovi file, the generated R script, and plain-English interpretation — giving you full reproducibility and a pathway to R if you want to extend the analysis later.",
      },
    },
    {
      "@type": "Question",
      name: "What analyses are available in jamovi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core: t-tests, ANOVA (including repeated measures & mixed), regression, correlation, chi-square, factor analysis, reliability, descriptive stats, contingency tables. Modules add: GAMLJ (mixed models, mediation, power analysis), scatr (SEM, lavaan), Visiostat (visualization), R integration, and 20+ more. Our freelancers work across the full ecosystem.",
      },
    },
    {
      "@type": "Question",
      name: "How much does jamovi analysis cost on TaskLynk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "jamovi freelance rates typically range from $30–$80 per hour or $200–$2,000 per project. Since jamovi is free and runs on R, there are no licensing costs. Post your project with your budget and receive competitive bids from vetted specialists.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "jamovi Statistical Analysis",
  provider: {
    "@type": "Organization",
    name: "TaskLynk",
    url: "https://www.tasklynk.co.ke",
  },
  areaServed: { "@type": "Country", name: "Kenya" },
  description:
    "Hire vetted jamovi freelancers for modern statistical analysis. Spreadsheet interface, R-powered engine, GAMLJ modules, reproducible .omv files. Secure escrow payments and project management.",
};

export default function JamoviStatisticalAnalysisPage() {
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
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Layers className="w-3 h-3" />
                <span>Modern Statistical Spreadsheet</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire jamovi Statistical Analysis Freelancers <br />
                <span className="text-gradient-orange">Modern SPSS Alternative Powered by R</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                jamovi combines a spreadsheet interface you already know with R&apos;s statistical engine underneath. No licensing fees. Modular extensibility. Reproducible .omv files. Hire vetted jamovi freelancers on TaskLynk for analyses that bridge the gap between point-and-click and programming.
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
                  Who Hires jamovi Freelancers on TaskLynk?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  jamovi appeals to researchers who want a modern, intuitive interface without sacrificing analytical power. Its spreadsheet paradigm makes data manipulation feel familiar, while its R foundation ensures no ceiling on what you can analyze.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li><strong>Researchers Transitioning from SPSS</strong> wanting a modern, free alternative</li>
                  <li><strong>Students Learning Statistics</strong> who benefit from the spreadsheet metaphor</li>
                  <li><strong>R Beginners</strong> using jamovi as a stepping stone to R programming</li>
                  <li><strong>Teams Needing Collaborative Analysis</strong> with human-readable .omv files</li>
                  <li><strong>Applied Researchers</strong> needing mixed models, SEM, or mediation via GAMLJ/scatr</li>
                  <li><strong>East African Institutions</strong> adopting open-source statistical workflows</li>
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
                  What Our jamovi Freelancers Deliver
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  jamovi&apos;s modular architecture means the right freelancer knows which modules to load for your specific problem. Our specialists work across the full jamovi ecosystem.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Core Statistical Analyses (jmv)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Descriptives, frequencies, explore</li>
                  <li>T-tests: independent, paired, one-sample</li>
                  <li>ANOVA: one-way, two-way, repeated measures, ANCOVA</li>
                  <li>Regression: linear, binomial, multinomial, ordinal</li>
                  <li>Correlation: Pearson, Spearman, Kendall, partial</li>
                  <li>Chi-square: goodness-of-fit, independence</li>
                  <li>Factor analysis (EFA) and reliability (α, ω, split-half)</li>
                  <li>Non-parametric: Mann-Whitney, Wilcoxon, Kruskal-Wallis, Friedman</li>
                  <li>Proportions: binomial test, multinomial test</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Advanced Analyses via Modules</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li><strong>GAMLJ:</strong> Generalized linear mixed models, mediation/moderation (PROCESS-style), power analysis, G*Power integration</li>
                  <li><strong>scatr:</strong> Structural equation modeling (lavaan), CFA, path analysis</li>
                  <li><strong>Visiostat:</strong> Advanced visualizations, raincloud plots, violin plots</li>
                  <li><strong>jmvconnect / Rj:</strong> Run arbitrary R code within jamovi</li>
                  <li><strong>Meta-analysis:</strong> Meta-analysis module for systematic reviews</li>
                  <li><strong>Bayesian:</strong> Bayesian t-tests, regression, ANOVA via JASP integration</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Data Management & Reproducibility</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Spreadsheet-style data editing: filter, sort, transform, compute variables</li>
                  <li>Import: CSV, Excel, SPSS (.sav), Stata (.dta), SAS, R, JASP, jamovi (.omv)</li>
                  <li>Export: .omv (full analysis + data), CSV, Excel, PDF, HTML reports</li>
                  <li>R syntax generation for every analysis (Syntax Mode / jmvconnect)</li>
                  <li>Version control friendly: .omv files are human-readable JSON</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Teaching & Learning Support</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Annotated output with step-by-step interpretation for students</li>
                  <li>Walkthrough guides for replicating analyses</li>
                  <li>Transition paths: jamovi → R syntax → full R scripts</li>
                  <li>Workshop and training materials for research teams</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Why TaskLynk for jamovi?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                The Marketplace for Modern, Module-Powered Statistics
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                jamovi&apos;s module system means expertise is fragmented. We&apos;ve curated freelancers who know the ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Layers, title: "Module Experts", desc: "Freelancers proficient in GAMLJ, scatr, Visiostat, and niche modules." },
                { icon: Sparkles, title: "Modern Workflow", desc: "Spreadsheet interface + R power = faster iteration, fewer errors." },
                { icon: ShieldCheck, title: "Secure Escrow", desc: "Milestone payments released only when .omv file and report meet your standards." },
                { icon: DollarSign, title: "Zero Licensing Cost", desc: "jamovi is free forever. You pay only for expertise." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                From Data to Reproducible Analysis in 3 Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Post Your Analysis Needs", desc: "Share research questions, data format, preferred modules (GAMLJ, scatr, etc.), and timeline." },
                { step: "02", icon: Users, title: "Match with jamovi Specialists", desc: "Receive proposals from freelancers experienced with your exact analysis type within 24 hours." },
                { step: "03", icon: CheckCircle2, title: "Get Reproducible Results", desc: "Receive .omv file, R syntax, annotated interpretation, and visualizations. Approve to pay." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-purple-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About jamovi Analysis on TaskLynk?
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
        <section className="py-16 bg-gradient-to-br from-purple-500 via-purple-500/95 to-purple-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready for Modern, Reproducible Statistics?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your jamovi project today. Get spreadsheet-simple workflows with R-powered depth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-white/90 font-bold rounded-full px-8">
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
                <Link href="/services/data-analysis/jasp-statistical-analysis" className="text-primary font-semibold hover:underline">JASP</Link>{" "}
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