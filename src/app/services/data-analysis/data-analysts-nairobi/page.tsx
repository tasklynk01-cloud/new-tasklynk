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
  Globe,
  MapPin,
  Phone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { UniversityCurriculumBadges } from "@/components/site/university-curriculum-badges";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";
import { generateRichServiceSchema } from "@/lib/rich-snippets";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/data-analysts-nairobi",
  {
    title: "Hire Data Analysts in Nairobi | Kenya's Top Analytics Talent | TaskLynk",
    description:
      "Hire vetted Nairobi data analysts for SPSS, Excel, R, Python, Power BI, Stata, JASP, and jamovi. Same time zone, local market knowledge, M-Pesa payments. Secure escrow, project managers.",
    openGraph: {
      title: "Hire Data Analysts in Nairobi | Kenya's Top Analytics Talent | TaskLynk",
      description:
        "Hire vetted Nairobi data analysts across all major tools. Same time zone, local market knowledge, M-Pesa payments. Secure escrow.",
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
      name: "What data analysis tools do Nairobi freelancers on TaskLynk cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Nairobi analysts cover the full toolkit: SPSS, Excel, R, Python (pandas, NumPy, scikit-learn), Power BI, Stata, JASP, and jamovi. Many are multilingual across tools, so they recommend the best fit for your data rather than forcing one software.",
      },
    },
    {
      "@type": "Question",
      name: "Can I hire a Nairobi analyst for ongoing monthly support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Many clients retain Nairobi analysts for monthly dashboards, recurring survey analysis, or continuous research support. You can set up a recurring project with milestone billing and a dedicated analyst who learns your data over time.",
      },
    },
    {
      "@type": "Question",
      name: "How fast can I get matched with a Nairobi data analyst?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most clients receive 3–5 matched proposals within 24 hours. For urgent needs, our on-call Nairobi analysts respond via WhatsApp (+254 701 066 845) within minutes. Standard turnaround for a dashboard or analysis is 2–5 days; urgent same-week available.",
      },
    },
    {
      "@type": "Question",
      name: "What industries do Nairobi data analysts specialize in?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nairobi is East Africa's tech and business hub. Our analysts serve: fintech & banking (risk, fraud, credit scoring), NGOs/development (MEL, impact evaluation), agriculture (yield modeling, value chains), health (DHIS2, epidemiology), e-commerce (Cohort analysis, LTV), real estate, logistics, and academic research (UoN, Strathmore, Kenyatta, JKUAT).",
      },
    },
    {
      "@type": "Question",
      name: "How do I pay Nairobi freelancers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We support M-Pesa, bank transfer (KES), Visa/Mastercard, and PayPal. Escrow holds KES until you approve each milestone. No international wire fees, no currency conversion surprises.",
      },
    },
  ],
};

const serviceSchema = generateRichServiceSchema({
  name: "Data Analysts in Nairobi",
  serviceType: "Data Analysis and Business Intelligence in Nairobi",
  description:
    "Hire vetted Nairobi data analysts across SPSS, Excel, R, Python, Power BI, Stata, JASP, and jamovi. Same time zone, local market knowledge, M-Pesa payments. Secure escrow.",
  canonicalPath: "/services/data-analysis/data-analysts-nairobi",
  areaServed: ["Nairobi", "Kenya"],
  aggregateRating: {
    ratingValue: 4.9,
    reviewCount: 245,
    bestRating: 5,
    worstRating: 1,
  },
  offers: {
    lowPrice: 2000,
    highPrice: 40000,
    priceCurrency: "KES",
    offerCount: 12,
  },
});

export default function DataAnalystsNairobiPage() {
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
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <MapPin className="w-3 h-3" />
                <span>Nairobi · Kenya</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire Data Analysts in Nairobi <br />
                <span className="text-gradient-orange">Kenya&apos;s Top Analytics Talent</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Nairobi is East Africa&apos;s data hub. Hire vetted local analysts across every tool — SPSS, Excel, R, Python, Power BI, Stata, JASP, jamovi — for research, business intelligence, and MEL. Same time zone, M-Pesa payments, real-time collaboration.
              </p>
            </div>
          </div>
        </section>

        {/* Why Nairobi */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  Why Hire Data Analysts in Nairobi?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Nairobi hosts Kenya&apos;s densest concentration of data talent: graduates from UoN, Strathmore, Kenyatta, JKUAT, and international universities; analysts at fintechs, NGOs, and multinationals; and a thriving freelance community. TaskLynk connects you to this pool without agency overhead.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <Clock className="w-6 h-6 text-indigo-600 mb-2" />
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-1">Real-Time (EAT)</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Collaborate during your workday. No overnight delays, no missed calls.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-1">Industry Depth</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Fintech, NGO/MEL, agriculture, health, e-commerce, real estate, academia.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <DollarSign className="w-6 h-6 text-indigo-600 mb-2" />
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-1">Affordable Rates</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Nairobi talent at 40–70% lower cost than Western agencies, same quality.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <Phone className="w-6 h-6 text-indigo-600 mb-2" />
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-1">Local Support</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">M-Pesa, bank transfer, 24/7 WhatsApp on +254 701 066 845.</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Nairobi Neighborhoods We Serve</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6 columns-2 md:columns-3">
                  <li>CBD / Upper Hill</li>
                  <li>Westlands / Parklands</li>
                  <li>Kilimani / Yaya</li>
                  <li>Karen / Langata</li>
                  <li>Runda / Gigiri</li>
                  <li>Lavington / Kileleshwa</li>
                  <li>Ngong Road / Adams</li>
                  <li>Embakasi / Donholm</li>
                  <li>Remote across Nairobi County</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  Tools Our Nairobi Analysts Master
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Need a specific tool? Filter by expertise when you post your project.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    "SPSS (Base + Advanced + AMOS)",
                    "Excel (Power Query, VBA, PivotTables)",
                    "R (tidyverse, ggplot2, lme4, lavaan)",
                    "Python (pandas, scipy, statsmodels, sklearn)",
                    "Power BI (DAX, M, Service)",
                    "Stata (xt, ml, sem)",
                    "JASP (Bayesian + frequentist)",
                    "jamovi (GAMLJ, scatr, Rj)",
                  ].map((tool) => (
                    <div key={tool} className="p-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground">
                      {tool}
                    </div>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Common Project Types</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Dissertation/thesis data analysis for Nairobi universities</li>
                  <li>NGO MEL dashboards (USAID, FCDO, Gates-funded)</li>
                  <li>Fintech risk, fraud, and credit models</li>
                  <li>E-commerce cohort, LTV, and churn analysis</li>
                  <li>Agriculture yield and value-chain modeling</li>
                  <li>Health program evaluation (DHIS2 exports)</li>
                  <li>Executive KPI dashboards (Power BI / Excel)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Why TaskLynk Nairobi?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Nairobi&apos;s Trusted Data Freelance Marketplace
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Curated Local Pool", desc: "Vetted Nairobi analysts, not random global bids." },
                { icon: ShieldCheck, title: "M-Pesa Escrow", desc: "Pay in KES. Release only when satisfied." },
                { icon: MessageSquare, title: "WhatsApp Support", desc: "24/7 local support, real humans." },
                { icon: Globe, title: "Global Standards", desc: "Local rates, international-quality output." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Hire a Nairobi Analyst in 3 Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Post Your Project", desc: "Describe data, tool, deliverables, timeline, KES budget. Free." },
                { step: "02", icon: Users, title: "Meet Nairobi Analysts", desc: "Get 3–5 matched proposals within 24h. Chat on WhatsApp." },
                { step: "03", icon: CheckCircle2, title: "Pay via M-Pesa", desc: "Fund escrow in KES. Approve results. Release payment." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-indigo-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* University & Institutional Compliance Badges */}
        <UniversityCurriculumBadges />

        {/* FAQ */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About Nairobi Data Analysts?
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
        <section className="py-16 bg-gradient-to-br from-indigo-500 via-indigo-500/95 to-indigo-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Hire Nairobi&apos;s Best Data Analysts Today
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your project free. Get matched with local experts in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-bold rounded-full px-8">
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
                Looking for a specific tool in Nairobi?{" "}
                <Link href="/services/data-analysis/spss-analysts-kenya" className="text-primary font-semibold hover:underline">SPSS Analysts Kenya</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/excel-experts-nairobi" className="text-primary font-semibold hover:underline">Excel Experts Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/power-bi-consultants-nairobi" className="text-primary font-semibold hover:underline">Power BI Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/kenya-data-analysis-services" className="text-primary font-semibold hover:underline">All Kenya Data Services</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}