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
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/excel-experts-nairobi",
  {
    title: "Hire Excel Experts in Nairobi | Spreadsheet & Data Analysis Gurus | TaskLynk",
    description:
      "Hire vetted Nairobi Excel freelancers for formulas, dashboards, Power Query, VBA automation, financial models, and data cleaning. Same time zone, M-Pesa payments. Secure escrow, project managers.",
    openGraph: {
      title: "Hire Excel Experts in Nairobi | Spreadsheet & Data Analysis Gurus | TaskLynk",
      description:
        "Hire vetted Nairobi Excel freelancers for formulas, dashboards, Power Query, VBA automation, financial models. Same time zone, M-Pesa payments.",
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
      name: "What Excel skills do Nairobi freelancers on TaskLynk have?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Nairobi Excel experts cover: advanced formulas (XLOOKUP, INDEX/MATCH, SUMIFS, dynamic arrays), PivotTables & PivotCharts, Power Query (Get & Transform) for ETL, Power Pivot / Data Models, DAX measures, VBA macros for automation, dashboards with slicers, financial modeling, and scenario analysis. Many also bridge to Power BI.",
      },
    },
    {
      "@type": "Question",
      name: "Can an Excel expert build an automated dashboard for my business?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Nairobi freelancers build interactive Excel dashboards with PivotTables, Power Query refresh, slicers, and KPI cards. For heavier needs they recommend Power BI. Common deliverables: sales trackers, financial dashboards, inventory managers, MEL trackers for NGOs.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide VBA automation to save manual work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. VBA macros eliminate repetitive tasks: bulk data cleaning, report generation, email automation, PDF export, form processing. Our freelancers write documented, maintainable VBA so your team can run automations with one click.",
      },
    },
    {
      "@type": "Question",
      name: "How fast can I get an Excel freelancer in Nairobi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most clients get 3–5 matched proposals within 24 hours. For urgent fixes, our on-call Nairobi Excel experts respond on WhatsApp (+254 701 066 845) within minutes. Simple dashboards: 1–3 days; complex financial models: 1–2 weeks.",
      },
    },
    {
      "@type": "Question",
      name: "How do I pay Nairobi Excel freelancers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "M-Pesa, bank transfer (KES), Visa/Mastercard, PayPal. Escrow holds KES until you approve the workbook. No forex fees.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Excel Data Analysis in Nairobi",
  provider: {
    "@type": "Organization",
    name: "TaskLynk",
    url: "https://www.tasklynk.co.ke",
  },
  areaServed: { "@type": "Place", name: "Nairobi, Kenya" },
  description:
    "Hire vetted Nairobi Excel freelancers for formulas, dashboards, Power Query, VBA automation, financial models, and data cleaning. Same time zone, M-Pesa payments. Secure escrow.",
};

export default function ExcelExpertsNairobiPage() {
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
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <FileSpreadsheet className="w-3 h-3" />
                <span>Excel · Nairobi</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire Excel Experts in Nairobi <br />
                <span className="text-gradient-orange">Spreadsheet & Data Analysis Gurus</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Stop fighting broken formulas at 2 AM. Hire vetted Nairobi Excel freelancers for dashboards, Power Query, VBA automation, financial models, and clean data. Same time zone, M-Pesa payments, real-time collaboration.
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
                  Why Hire Excel Experts in Nairobi?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Excel is the default tool for most Kenyan businesses, NGOs, and universities — but few people use it to its full potential. A Nairobi Excel expert turns your messy workbook into an automated, decision-ready system.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <Clock className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">Real-Time (EAT)</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Same working hours. No overnight waits for a formula fix.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <DollarSign className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">Affordable Rates</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Nairobi talent at a fraction of Western consultant rates.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">Business-Ready</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Dashboards, models, MEL trackers that work for Kenyan orgs.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <Phone className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">Local Payments</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">M-Pesa, bank transfer (KES). No forex fees.</p>
                  </div>
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
                  What Our Nairobi Excel Freelancers Deliver
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {[
                    "Advanced formulas: XLOOKUP, INDEX/MATCH, dynamic arrays (FILTER, SORT, UNIQUE)",
                    "PivotTables & PivotCharts with calculated fields",
                    "Power Query (Get & Transform) ETL pipelines",
                    "Power Pivot data models & DAX measures",
                    "Interactive dashboards with slicers & timelines",
                    "VBA macros for automation & reporting",
                    "Financial models: 3-statement, DCF, budgeting",
                    "What-If analysis: Goal Seek, Scenario Manager, Data Tables",
                    "Data cleaning: de-duplication, text parsing, validation",
                    "Inventory, CRM, and MEL trackers for NGOs",
                    "Survey coding & frequency analysis",
                    "PDF/CSV/API data import automation",
                  ].map((item) => (
                    <div key={item} className="p-3 rounded-lg border border-border bg-card text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Deliverables</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Working .xlsx with documented formulas and notes</li>
                  <li>Automated refresh (Power Query / VBA)</li>
                  <li>User guide / Loom walkthrough for your team</li>
                  <li>Optional Power BI migration plan for scale-up</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Why TaskLynk Nairobi?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Nairobi&apos;s Spreadsheet Problem-Solvers
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Vetted Excel Pros", desc: "Tested on real scenarios, not just certifications." },
                { icon: ShieldCheck, title: "M-Pesa Escrow", desc: "Pay in KES. Release on approval." },
                { icon: MessageSquare, title: "WhatsApp Support", desc: "24/7 local support, real humans." },
                { icon: Globe, title: "Scalable Path", desc: "Upgrade Excel → Power BI when you outgrow it." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Fix Your Spreadsheets in 3 Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Share Your Workbook", desc: "Describe the problem, desired output, and KES budget. Free post." },
                { step: "02", icon: Users, title: "Meet Nairobi Experts", desc: "3–5 matched proposals in 24h. Chat on WhatsApp before hiring." },
                { step: "03", icon: CheckCircle2, title: "Pay via M-Pesa", desc: "Fund escrow in KES. Approve workbook. Release payment." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-emerald-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About Nairobi Excel Experts?
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
        <section className="py-16 bg-gradient-to-br from-emerald-500 via-emerald-500/95 to-emerald-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Tame Your Spreadsheets?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your Excel project free. Get matched with Nairobi experts in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-white/90 font-bold rounded-full px-8">
                  <Link href="/register/client">Post a Project Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/30 hover:bg-white/10 text-white font-bold rounded-full px-8">
                  <Link href="/services/data-analysis/excel-data-analysis">View Excel Services</Link>
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
                More Nairobi data talent:{" "}
                <Link href="/services/data-analysis/spss-analysts-kenya" className="text-primary font-semibold hover:underline">SPSS Analysts Kenya</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/data-analysts-nairobi" className="text-primary font-semibold hover:underline">Data Analysts Nairobi</Link>{" "}
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