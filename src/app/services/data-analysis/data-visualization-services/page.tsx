import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, PieChart, TrendingUp, LayoutDashboard, ShieldCheck, Clock, Database } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Hire Data Visualization Freelancers | Dashboards & Analytics',
  'Transform your data into interactive dashboards and compelling visualizations. Hire vetted freelancers skilled in Power BI, Tableau, Python, and Google Data Studio for real-time business intelligence.',
  '/services/data-analysis/data-visualization-services'
);

const faqs = [
  {
    question: 'Which visualization tools do your freelancers specialize in?',
    answer: 'Our specialists are proficient in Power BI, Tableau, Python (matplotlib, seaborn, plotly), R (ggplot2), Google Data Studio, Looker, D3.js, Excel, and Qlik Sense. Every freelancer has passed a tool-specific portfolio review demonstrating their dashboard design and data storytelling capabilities.',
  },
  {
    question: 'Can you integrate live data sources into the dashboard?',
    answer: 'Yes. Our freelancers connect to databases, APIs, cloud storage (Google Sheets, Snowflake, BigQuery, PostgreSQL, MySQL), and real-time streams. Dashboards can be published to Power BI Service, Tableau Online, or embedded directly into your web application via secure iframe or API.',
  },
  {
    question: 'What is included in a typical data visualization project?',
    answer: 'Projects typically include data source connection, data model design (star/schema or flattened tables), interactive dashboards with drill-down capabilities, KPI scorecards, custom visualizations, and explanatory documentation. We also provide source files, published dashboard links, and usage training notes.',
  },
  {
    question: 'How do you ensure my data stays secure during the project?',
    answer: 'We use encrypted file transfer, NDA agreements, and role-based access. Freelancers only see the data needed for visualization. For sensitive datasets, we support air-gapped workflows where you provide aggregated extracts rather than raw transactional data.',
  },
  {
    question: 'Can you design visualizations for dissertations and academic reports?',
    answer: 'Yes. We produce APA-compliant figures, conference-ready charts, publication-quality plots, and thesis defense slides. Our academic visualization specialists understand statistical conventions and can create visualizations that meet journal or university formatting requirements.',
  },
  {
    question: 'What does the revision process look like?',
    answer: 'We include two rounds of revisions for all visualization projects. During the first round, you review draft dashboards and request changes to layout, color schemes, or additional metrics. The second round addresses fine-tuning. Major redesigns after the second round incur a small fee.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'Power BI Dashboard Developers', href: '/services/data-analysis/power-bi-dashboard' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'Research Data Analysis Services', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function DataVisualizationServicesPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/data-visualization-services"
      serviceSchemaName="Data Visualization Services"
      serviceSchemaDescription="Professional data visualization and dashboard development using Power BI, Tableau, Python, R, and Google Data Studio. Hire vetted freelancers for interactive dashboards, KPI scorecards, and publication-ready charts."
      heroEyebrow="Data Visualization"
      heroTitle="Hire Data Visualization Freelancers | Dashboards & Analytics"
      heroIntro="Raw data without context is just numbers in a spreadsheet. The real value emerges when those numbers are transformed into clear, compelling visual stories that drive decisions. TaskLynk connects you with vetted data visualization specialists—experts in Power BI, Tableau, Python, R, and Google Data Studio—who build interactive dashboards, KPI scorecards, and publication-ready charts. With secure milestone payments, NDA protection, and real-time collaboration, you get enterprise-grade visualization without the enterprise-grade price tag."
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
                This service is for anyone who needs to communicate data insights through visual means. Business leaders and executives who need live dashboards to track KPIs and spot trends. Marketing teams who need campaign performance reports that tell a clear story. Researchers and academics who need publication-ready figures for papers, dissertations, or conference presentations. Students who need to transform statistical output into compelling visuals for thesis defenses. Non-profit organizations that need dashboards to track program impact. Government agencies and NGOs that need data storytelling for public reporting. Anyone who has data but lacks the design skills or tool proficiency to visualize it effectively.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Many clients fall into two camps: those who have powerful analytics tools installed but don't know how to design effective dashboards, and those who know their data well but struggle to present it visually. Both groups benefit from our marketplace because we match you with freelancers whose primary skill is data visualization—not generalist analysts who treat visualization as an afterthought. Our specialists have backgrounds in information design, business intelligence, journalism, and data science, and they understand how humans perceive and process visual information.
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
                What We Offer: From Raw Data to Insightful Dashboards
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our data visualization service covers the full spectrum of visual data communication. We begin by understanding your data sources—whether that's a CSV export, a database query, an API feed, or a live data stream. Our specialists then design a data model that structures the information correctly for visualization, handling data type conversions, relationship mapping, time-zone alignment, and calculated fields. This foundational step ensures your dashboard updates automatically and displays accurate, consistent results.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Once the data model is in place, we move to the <strong>dashboard design phase</strong>. Here, our specialists apply principles of visual perception—using appropriate chart types, color palettes, and layout hierarchies—to ensure your audience can quickly grasp key insights. We build interactive dashboards with drill-down capabilities, slicers, tooltips, and dynamic filters that let users explore data at multiple levels of granularity. For recurring reporting needs, we design parameterized templates that automatically refresh with new data, eliminating the need for manual updates each month or quarter.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Interactive Dashboards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Live, clickable dashboards with drill-down, filters, and real-time data connections in Power BI, Tableau, or Google Data Studio.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Publication-Ready Charts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  APA-compliant figures, conference slides, and journal-quality visualizations with export in vector format.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">KPI Scorecards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Executive-level dashboards tracking critical metrics with targets, trends, and automated alerts.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Secure &amp; Private</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  NDA agreements, encrypted transfers, and role-based access protect your sensitive business and research data.
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
                Tools and Technologies We Support
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our freelancer network covers the complete data visualization stack. For enterprise-grade dashboards, our specialists use <strong>Microsoft Power BI</strong>—building dataflows, semantic models, and paginated reports with DAX calculations and custom visuals. For data science teams and analysts, we support <strong>Tableau</strong> including Tableau Desktop, Server, and Online, with expertise in complex calculated fields, parameters, and embedded analytics. For Python-based visualization, our freelancers use matplotlib, seaborn, plotly, and dash to create both static figures for publications and interactive web applications. For R users, we specialize in ggplot2 and shiny for publication-ready plots and interactive dashboards. We also support <strong>Google Data Studio</strong> for marketing analytics, <strong>Looker</strong> for enterprise data platforms, and <strong>D3.js</strong> for custom web-based visualizations.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <PieChart className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground mb-1">Power BI &amp; Tableau</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enterprise dashboards, dataflows, embedded analytics
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground mb-1">Python &amp; R</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ggplot2, matplotlib, plotly, dash, shiny
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-center">
                <Database className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground mb-1">GDS &amp; Custom</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Google Data Studio, Looker, D3.js, Qlik Sense
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Real-World Visualization Projects
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Our freelancers have delivered dashboards and visualizations across numerous industries. For a <strong>telecommunications company in Nairobi</strong>, a specialist built a Power BI dashboard tracking customer churn, network uptime, and revenue per user—connecting to live SQL Server data and refreshed daily, reducing the client's manual reporting time from 8 hours to 30 minutes per week. For a <strong>Master's student in public health</strong>, a freelancer created publication-ready R visualizations of vaccination coverage trends across Kenyan counties, producing 15 ggplot2 figures that met journal formatting standards and were accepted for publication in a regional health journal.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                A <strong>marketing agency</strong> needed real-time campaign performance dashboards across Facebook, Google Ads, and LinkedIn. Our specialist built a Google Data Studio dashboard aggregating API data from all three platforms, with drill-down capabilities by campaign, region, and channel—this dashboard became the agency's primary client reporting tool. For a <strong>microfinance institution</strong>, a freelancer designed Tableau dashboards tracking loan portfolio performance, default rates, and branch-level metrics, with row-level security ensuring branch managers only see their own data. These projects demonstrate how our vetting process ensures you're matched with specialists who have relevant domain experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for Data Visualization Freelancers
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Data visualization is fundamentally about communication, not just tool proficiency. That's why TaskLynk's marketplace is built around finding freelancers who combine technical mastery with design intuition and storytelling ability. Every visualization specialist in our network has passed a design portfolio review, demonstrating their ability to choose appropriate chart types, apply effective color theory, and structure information for maximum clarity. We've seen too many dashboards ruined by analysts who know Excel but not Edward Tufte.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Beyond design skills, our managed marketplace provides <strong>secure milestone escrow</strong> so you only release payment after approving deliverables, <strong>d dedicated project managers</strong> who coordinate revisions and timeline tracking, and <strong>NDA protection</strong> for sensitive business or research data. For dissertational work, our specialists understand academic conventions and can produce <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS-integrated visualizations</Link>, <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python-based research figures</Link>, or <Link href="/services/data-analysis/power-bi-dashboard" className="text-primary font-semibold hover:underline">Power BI academic dashboards</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">See how our workflow</Link> ensures quality from the first wireframe to final delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your visualization project</Link> today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
