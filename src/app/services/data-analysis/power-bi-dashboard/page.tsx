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
  Database,
  Cpu,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";
import { generateCanonicalMetadata } from "@/lib/canonical-metadata";

export const metadata: Metadata = generateCanonicalMetadata(
  "/services/data-analysis/power-bi-dashboard",
  {
    title: "Hire Power BI Data Analysts | Interactive Dashboard Development | TaskLynk",
    description:
      "Hire vetted Power BI freelancers on TaskLynk for interactive dashboard development, DAX optimization, data modeling, and business intelligence reporting. Secure payments, project managers, fast delivery.",
    openGraph: {
      title: "Hire Power BI Data Analysts | Interactive Dashboard Development | TaskLynk",
      description:
        "Hire vetted Power BI freelancers on TaskLynk for interactive dashboard development, DAX optimization, data modeling, and business intelligence reporting.",
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
      name: "How much does it cost to hire a Power BI freelancer on TaskLynk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Power BI freelance rates on TaskLynk typically range from $50–$150 per hour or $500–$5,000 per project depending on complexity. You set your budget when posting a project and freelancers bid competitively.",
      },
    },
    {
      "@type": "Question",
      name: "Can I hire a Power BI expert for a one-time dashboard build?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Many clients hire freelancers for one-time dashboard projects — executive KPI dashboards, sales tracking boards, financial reporting, or operational metrics. You can also hire for ongoing maintenance and updates.",
      },
    },
    {
      "@type": "Question",
      name: "What data sources can TaskLynk Power BI freelancers connect to?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our freelancers work with SQL Server, PostgreSQL, MySQL, Azure, AWS, Google BigQuery, Snowflake, Excel/CSV files, REST APIs, OData feeds, SharePoint, Dynamics 365, and 100+ other connectors.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide DAX formula optimization and performance tuning?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Many of our Power BI specialists focus specifically on DAX optimization, query folding, reducing refresh times, and building performant data models that scale to millions of rows.",
      },
    },
    {
      "@type": "Question",
      name: "How does the escrow payment system protect me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Funds are held securely in escrow until you approve each milestone deliverable. You only release payment when the dashboard meets your requirements — no risk of paying for incomplete or incorrect work.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Power BI Dashboard Development",
  provider: {
    "@type": "Organization",
    name: "TaskLynk",
    url: "https://www.tasklynk.co.ke",
  },
  areaServed: {
    "@type": "Country",
    name: "Kenya",
  },
  description:
    "Hire vetted Power BI freelancers for interactive dashboards, DAX optimization, data modeling, and BI reporting. Secure escrow payments and project management included.",
};

export default function PowerBIDashboardPage() {
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
                <BarChart3 className="w-3 h-3" />
                <span>Data Visualization & BI</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Hire Power BI Data Analysts <br />
                <span className="text-gradient-orange">Interactive Dashboard Development</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Excel is limited. Static reports are outdated the moment they&apos;re sent. Hire vetted Power BI freelancers on TaskLynk to connect your data sources, build DAX-powered models, and design interactive dashboards that update in real time — so your team makes decisions on live data, not last week&apos;s spreadsheet.
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
                  Who Hires Power BI Freelancers on TaskLynk?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  Power BI is the go-to business intelligence tool for organizations that need more than Excel can offer — but don&apos;t want the complexity and cost of enterprise BI platforms like Tableau or Qlik.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li><strong>SMEs & Startups</strong> tracking KPIs, sales pipelines, and cash flow in real time</li>
                  <li><strong>Finance & Operations Teams</strong> replacing manual Excel reporting with automated refresh</li>
                  <li><strong>Marketing Agencies</strong> building client-facing dashboards for campaign performance</li>
                  <li><strong>Healthcare & NGO Analysts</strong> visualizing program impact and donor reporting</li>
                  <li><strong>Academic Researchers</strong> creating interactive data explorations for publications</li>
                  <li><strong>Kenyan Enterprises</strong> needing local timezone support and M-Pesa/bank transfer payments</li>
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
                  What Our Power BI Freelancers Deliver
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                  When you post a Power BI project on TaskLynk, you&apos;re not just hiring someone who &ldquo;knows Power BI.&rdquo; You get matched with specialists who have proven experience in the exact capabilities your project needs.
                </p>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Data Modeling & Architecture</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Star schema and snowflake schema design for performance</li>
                  <li>Power Query (M) transformations: cleaning, shaping, merging, appending</li>
                  <li>Incremental refresh policies for large datasets</li>
                  <li>Composite models (DirectQuery + Import) for real-time + historical analysis</li>
                  <li>Row-level security (RLS) implementation for multi-tenant dashboards</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">DAX Development & Optimization</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Complex calculated columns, measures, and calculation groups</li>
                  <li>Time intelligence: YTD, QTD, MTD, YoY, rolling averages</li>
                  <li>Advanced patterns: parent-child hierarchies, many-to-many, virtual relationships</li>
                  <li>Performance tuning: DAX Studio analysis, query plan optimization, reducing CB transitions</li>
                  <li>Calculation groups for reusable time intelligence logic</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Dashboard Design & Visualization</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Executive KPI dashboards with drill-through and drill-down</li>
                  <li>Operational monitoring boards with real-time streaming datasets</li>
                  <li>Financial reporting: P&L, balance sheet, cash flow waterfall charts</li>
                  <li>Sales funnel, pipeline velocity, and cohort analysis visuals</li>
                  <li>Custom visuals (Deneb, Vega-Lite, custom R/Python visuals)</li>
                  <li>Mobile-optimized layouts and responsive design</li>
                  <li>Report themes, branding, and accessibility compliance</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Data Source Connectivity</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>SQL: SQL Server, PostgreSQL, MySQL, MariaDB, Azure SQL</li>
                  <li>Cloud: Snowflake, BigQuery, Redshift, Synapse, Databricks</li>
                  <li>Files: Excel, CSV, JSON, XML, PDF, SharePoint, OneDrive</li>
                  <li>APIs: REST, GraphQL, OData, Web.Contents custom connectors</li>
                  <li>ERP/CRM: Dynamics 365, Salesforce, SAP, Oracle, QuickBooks, Xero</li>
                </ul>

                <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Deployment & Governance</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Power BI Service workspace setup and permission management</li>
                  <li>App distribution, subscription emails, and data alerts</li>
                  <li>Paginated reports (SSRS/RDL) for pixel-perfect printing</li>
                  <li>Power BI Embedded integration for customer-facing portals</li>
                  <li>Data lineage, sensitivity labels, and compliance auditing</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why TaskLynk */}
        <section className="py-16 sm:py-24 bg-background border-b border-border/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600">Why TaskLynk for Power BI?</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
                Marketplace Advantages You Won&apos;t Find on Upwork or Fiverr
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                We combine freelance flexibility with agency-grade oversight.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "Pre-Vetted Talent", desc: "Every freelancer passes a Power BI skills assessment and portfolio review before joining." },
                { icon: ShieldCheck, title: "Secure Escrow", desc: "Milestone-based payments released only when you approve deliverables." },
                { icon: MessageSquare, title: "Dedicated Manager", desc: "Your project manager handles scope, timeline, and quality — you focus on outcomes." },
                { icon: DollarSign, title: "Transparent Pricing", desc: "No hidden fees. Freelancers bid on your budget; you choose the best value." },
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
                From Project Post to Live Dashboard in 3 Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: "01", icon: MessageSquare, title: "Post Your Project", desc: "Describe your data sources, dashboard requirements, timeline, and budget. Free to post." },
                { step: "02", icon: Users, title: "Review Matched Freelancers", desc: "Receive 3–5 vetted Power BI experts within 24 hours. Review portfolios, ratings, and proposals." },
                { step: "03", icon: CheckCircle2, title: "Approve & Pay Securely", desc: "Fund escrow, collaborate via our workspace, and release payment only when satisfied." },
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
                Questions About Hiring Power BI Freelancers?
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
                Ready to Turn Data Into Decisions?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Post your Power BI project today and get matched with vetted freelancers within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-yellow-600 hover:bg-white/90 font-bold rounded-full px-8">
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
                Need a different data service? Explore our{" "}
                <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS Analysis</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R Programming</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python Data Science</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/excel-data-analysis" className="text-primary font-semibold hover:underline">Excel Analytics</Link>{" "}
                |{" "}
                <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">Stata Econometrics</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}