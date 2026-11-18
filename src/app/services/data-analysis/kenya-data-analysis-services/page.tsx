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
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/kenya-data-analysis-services",
  {
    title: "Data Analysis Services in Kenya | Hire Local Statistics Experts | TaskLynk",
    description:
      "Hire vetted Kenyan data analysts for SPSS, Excel, R, Python, Power BI, Stata, JASP, jamovi across Nairobi, Mombasa, Kisumu, Eldoret. Same time zone, M-Pesa payments. Secure escrow, project managers.",
    openGraph: {
      title: "Data Analysis Services in Kenya | Hire Local Statistics Experts | TaskLynk",
      description:
        "Hire vetted Kenyan data analysts across all major tools. Same time zone, M-Pesa payments. Secure escrow. Covering Nairobi, Mombasa, Kisumu, Eldoret.",
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
      name: "Which Kenyan cities do TaskLynk data analysts cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our network spans Nairobi, Mombasa, Kisumu, Eldoret, Nakuru, Thika, Nyeri, Meru, and Kakamega — plus remote analysts serving all 47 counties. Most collaborate remotely via our platform, so location is rarely a barrier.",
      },
    },
    {
      "@type": "Question",
      name: "What data analysis tools do Kenyan freelancers support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SPSS, Excel, R, Python (pandas, scikit-learn), Power BI, Stata, JASP, and jamovi. Many are multilingual and recommend the best tool for your data rather than pushing one software.",
      },
    },
    {
      "@type": "Question",
      name: "Do you serve Kenyan universities for dissertation/thesis analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We support UoN, Kenyatta, Strathmore, JKUAT, Moi, Egerton, USIU-Africa, Daystar, and others with APA 7th formatted Chapter 4 results, .spv/.sps files, and plain-English interpretation aligned to each institution&apos;s requirements.",
      },
    },
    {
      "@type": "Question",
      name: "How do Kenyan payments work on TaskLynk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "M-Pesa, bank transfer (KES), Visa/Mastercard, PayPal. Escrow holds KES until you approve each milestone. No international wire fees, no currency conversion surprises.",
      },
    },
    {
      "@type": "Question",
      name: "What industries do Kenyan data analysts serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fintech & banking (risk, fraud, credit), NGOs/development (MEL, impact evaluation), agriculture (yield, value chains), health (DHIS2, epidemiology), e-commerce (cohorts, LTV), real estate, logistics, and academic research.",
      },
    },
    {
      "@type": "Question",
      name: "How fast can I hire a Kenyan data analyst?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most clients get 3–5 matched proposals within 24 hours. Urgent needs: on-call analysts respond via WhatsApp (+254 701 066 845) within minutes. Standard turnaround 2–5 days; urgent same-week available.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Data Analysis Services in Kenya",
  provider: {
    "@type": "Organization",
    name: "TaskLynk",
    url: "https://www.tasklynk.co.ke",
  },
  areaServed: { "@type": "Country", name: "Kenya" },
  description:
    "Hire vetted Kenyan data analysts for SPSS, Excel, R, Python, Power BI, Stata, JASP, jamovi. Same time zone, M-Pesa payments. Covering Nairobi, Mombasa, Kisumu, Eldoret. Secure escrow.",
};

export default function KenyaDataAnalysisServicesPage() {
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
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <MapPin className="w-3 h-3" />
                <span>Kenya · Nationwide</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Data Analysis Services in Kenya <br />
                <span className="text-gradient-orange">Hire Local Statistics Experts</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                From Nairobi boardrooms to Mombasa NGOs and Eldoret universities — hire vetted Kenyan data analysts across every tool. Same time zone, M-Pesa payments, secure escrow, and project managers who understand your context.
              </p>
            </div>
          </div>
        </section>

        {/* Why Kenya */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                  Why Hire Data Analysts in Kenya?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Kenya is East Africa&apos;s data and tech hub. Whether you&apos;re a student at UoN, an NGO evaluating a USAID project, a fintech building risk models, or an SME tracking customers — local analysts understand your data, your institutions, and your currency.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/5">
                    <Clock className="w-6 h-6 text-orange-600 mb-2" />
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-1">Aligned Time Zones</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">EAT (UTC+3). Collaborate during your day, not at midnight.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/5">
                    <DollarSign className="w-6 h-6 text-orange-600 mb-2" />
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-1">Affordable Rates</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">40–70% lower than Western agencies, same quality.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/5">
                    <MapPin className="w-6 h-6 text-orange-600 mb-2" />
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-1">Local Context</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Universities, NGOs, agriculture, finance, health — all understood.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/5">
                    <Phone className="w-6 h-6 text-orange-600 mb-2" />
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-1">Local Payments</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">M-Pesa, bank transfer (KES). No forex fees.</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Cities We Serve</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {[
                    "Nairobi (CBD, Westlands, Kilimani, Karen, Runda, Embakasi)",
                    "Mombasa (Nyali, Bamburi, Likoni, CBD)",
                    "Kisumu (Milimani, CBD, Kondele)",
                    "Eldoret (Town, Annex, Elgon View)",
                    "Nakuru (Section 58, Lakeview)",
                    "Thika, Nyeri, Meru, Kakamega, Kisii",
                    "Remote analysts serving all 47 counties",
                  ].map((city) => (
                    <div key={city} className="p-3 rounded-lg border border-border bg-card text-sm text-foreground">
                      {city}
                    </div>
                  ))}
                </div>
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
                  Data Analysis Services Across Kenya
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  One marketplace, every tool, every region.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">By Tool</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">By Sector</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li><strong>Academic:</strong> dissertation/thesis Chapter 4, proposal power analysis, journal stats</li>
                  <li><strong>NGO / Development:</strong> MEL dashboards, impact evaluation, RCT analysis, donor reports</li>
                  <li><strong>Fintech / Banking:</strong> credit scoring, fraud detection, risk models, churn</li>
                  <li><strong>Agriculture:</strong> yield modeling, value-chain analysis, climate data</li>
                  <li><strong>Health:</strong> DHIS2 analysis, epidemiology, program evaluation</li>
                  <li><strong>E-commerce / SME:</strong> cohort, LTV, funnel, inventory analytics</li>
                  <li><strong>Real Estate / Logistics:</strong> pricing, route, demand forecasting</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Why TaskLynk Kenya?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Building Kenya&apos;s Data Freelance Network
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "National Pool", desc: "Analysts in Nairobi, Mombasa, Kisumu, Eldoret & beyond." },
                { icon: ShieldCheck, title: "M-Pesa Escrow", desc: "Pay in KES. Release only when satisfied." },
                { icon: MessageSquare, title: "WhatsApp Support", desc: "24/7 local support, real humans." },
                { icon: Globe, title: "Local + Global", desc: "Kenyan rates, international-quality output." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Hire a Kenyan Analyst in 3 Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Post Your Project", desc: "Describe data, tool, deliverables, timeline, KES budget. Free." },
                { step: "02", icon: Users, title: "Meet Kenyan Analysts", desc: "Get 3–5 matched proposals within 24h. Chat on WhatsApp." },
                { step: "03", icon: CheckCircle2, title: "Pay via M-Pesa", desc: "Fund escrow in KES. Approve results. Release payment." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-orange-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About Data Analysis in Kenya?
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
        <section className="py-16 bg-gradient-to-br from-orange-500 via-orange-500/95 to-orange-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Hire Kenya&apos;s Best Data Analysts Today
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your project free. Get matched with local experts in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-white/90 font-bold rounded-full px-8">
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
                City-specific pages:{" "}
                <Link href="/services/data-analysis/spss-analysts-kenya" className="text-primary font-semibold hover:underline">SPSS Analysts Kenya</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/data-analysts-nairobi" className="text-primary font-semibold hover:underline">Data Analysts Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/excel-experts-nairobi" className="text-primary font-semibold hover:underline">Excel Experts Nairobi</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/power-bi-consultants-nairobi" className="text-primary font-semibold hover:underline">Power BI Nairobi</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}