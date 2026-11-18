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
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/power-bi-consultants-nairobi",
  {
    title: "Hire Power BI Consultants in Nairobi | Dashboard & BI Experts | TaskLynk",
    description:
      "Hire vetted Nairobi Power BI consultants for interactive dashboards, DAX, data modeling, and BI reporting. Same time zone, M-Pesa payments. Secure escrow, project managers.",
    openGraph: {
      title: "Hire Power BI Consultants in Nairobi | Dashboard & BI Experts | TaskLynk",
      description:
        "Hire vetted Nairobi Power BI consultants for interactive dashboards, DAX, data modeling, and BI reporting. Same time zone, M-Pesa payments.",
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
      name: "What Power BI consulting services do Nairobi freelancers offer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Nairobi Power BI consultants deliver: data modeling (star schemas, composite models), DAX measures & calculation groups, Power Query (M) ETL, interactive dashboards, executive KPI boards, RLS security, Power BI Service deployment, paginated reports, and Power BI Embedded integration. Many also bridge from Excel.",
      },
    },
    {
      "@type": "Question",
      name: "Can a Nairobi consultant connect Power BI to my local systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. They connect to SQL Server, PostgreSQL, MySQL, Azure, AWS, Google BigQuery, Excel/CSV, REST APIs, SharePoint, Dynamics 365, SAP, Oracle, QuickBooks, and Xero. For on-premise Kenyan systems they set up on-premises data gateways.",
      },
    },
    {
      "@type": "Question",
      name: "How fast can I get a Power BI consultant in Nairobi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most clients receive 3–5 matched proposals within 24 hours. For urgent board decks, our on-call Nairobi consultants respond on WhatsApp (+254 701 066 845). Standard dashboard: 3–7 days; enterprise model: 2–4 weeks.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide training for my Nairobi team?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Consultants offer knowledge transfer: live walkthroughs, Loom recordings, and documentation so your team can maintain dashboards post-handover. Some offer ongoing monthly retainer support.",
      },
    },
    {
      "@type": "Question",
      name: "How do I pay Nairobi Power BI consultants?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "M-Pesa, bank transfer (KES), Visa/Mastercard, PayPal. Escrow holds KES until you approve each milestone. No forex fees.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Power BI Consulting in Nairobi",
  provider: {
    "@type": "Organization",
    name: "TaskLynk",
    url: "https://www.tasklynk.co.ke",
  },
  areaServed: { "@type": "Place", name: "Nairobi, Kenya" },
  description:
    "Hire vetted Nairobi Power BI consultants for interactive dashboards, DAX, data modeling, and BI reporting. Same time zone, M-Pesa payments. Secure escrow.",
};

export default function PowerBIConsultantsNairobiPage() {
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
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 dark:bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <LineChart className="w-3 h-3" />
                <span>Power BI · Nairobi</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire Power BI Consultants in Nairobi <br />
                <span className="text-gradient-orange">Dashboard & BI Experts</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Replace static Excel reports with live, interactive dashboards. Hire vetted Nairobi Power BI consultants for DAX, data modeling, and BI reporting. Same time zone, M-Pesa payments, real-time collaboration.
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
                  Why Hire Power BI Consultants in Nairobi?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  Nairobi&apos;s enterprises, NGOs, and fintechs are adopting Power BI fast — but local expertise is scarce. TaskLynk connects you with Nairobi consultants who understand Kenyan data systems (IFMIS, DHIS2, M-Pesa APIs, local ERPs) and can deploy same-week.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                    <Clock className="w-6 h-6 text-yellow-600 mb-2" />
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Real-Time (EAT)</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Same working hours for demos, reviews, and training.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                    <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Cost-Effective</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Nairobi rates vs expensive Western BI consultancies.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                    <LineChart className="w-6 h-6 text-yellow-600 mb-2" />
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Local Systems</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Connect to Kenyan ERPs, DHIS2, M-Pesa, IFMIS.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                    <Phone className="w-6 h-6 text-yellow-600 mb-2" />
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1">Local Payments</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">M-Pesa, bank transfer (KES). No forex fees.</p>
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
                  What Our Nairobi Power BI Consultants Deliver
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {[
                    "Data modeling: star/snowflake schemas, composite models",
                    "Power Query (M): cleaning, merging, append, ETL",
                    "Incremental refresh for large datasets",
                    "DAX: measures, calc groups, time intelligence",
                    "Executive KPI dashboards with drill-through",
                    "Operational real-time streaming boards",
                    "Financial: P&L, balance sheet, cash flow",
                    "Row-level security (RLS) for multi-tenant",
                    "Power BI Service workspace setup",
                    "Paginated reports (SSRS/RDL)",
                    "Power BI Embedded for portals",
                    "On-premises data gateway config",
                  ].map((item) => (
                    <div key={item} className="p-3 rounded-lg border border-border bg-card text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Deliverables</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>.pbix file with documented model and DAX</li>
                  <li>Deployment to Power BI Service (your tenant)</li>
                  <li>Training session / Loom walkthrough</li>
                  <li>Optional monthly retainer for maintenance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">Why TaskLynk Nairobi?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Nairobi&apos;s Power BI Delivery Partner
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Vetted Consultants", desc: "Tested on real DAX & modeling scenarios." },
                { icon: ShieldCheck, title: "M-Pesa Escrow", desc: "Pay in KES. Release on approval." },
                { icon: MessageSquare, title: "WhatsApp Support", desc: "24/7 local support, real humans." },
                { icon: Globe, title: "Scale Ready", desc: "From one dashboard to enterprise BI." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">How It Works</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Launch Your Dashboard in 3 Steps
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Describe the Dashboard", desc: "Share data sources, KPIs, audience, KES budget. Free post." },
                { step: "02", icon: Users, title: "Meet Nairobi Consultants", desc: "3–5 matched proposals in 24h. WhatsApp chat before hiring." },
                { step: "03", icon: CheckCircle2, title: "Pay via M-Pesa", desc: "Fund escrow in KES. Approve .pbix. Release payment." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm text-center">
                  <span className="text-2xl font-black text-yellow-500/40 mb-3 block">{s.step}</span>
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center mx-auto mb-4">
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
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Questions About Nairobi Power BI Consultants?
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
        <section className="py-16 bg-gradient-to-br from-yellow-500 via-yellow-500/95 to-yellow-500/90 text-white">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready for Live Dashboards?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your Power BI project free. Get matched with Nairobi consultants in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-yellow-600 hover:bg-white/90 font-bold rounded-full px-8">
                  <Link href="/register/client">Post a Project Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/30 hover:bg-white/10 text-white font-bold rounded-full px-8">
                  <Link href="/services/data-analysis/power-bi-dashboard">View Power BI Services</Link>
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
                <Link href="/services/data-analysis/excel-experts-nairobi" className="text-primary font-semibold hover:underline">Excel Experts Nairobi</Link>{" "}
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