import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { DashboardIllustration } from '@/components/blog-guides/business-reporting/dashboard-illustration';
import { blogMeta } from './meta';

const PATH = '/blog/business-data-analysis-reporting-kenya-guide';
const SITE = 'https://www.tasklynk.co.ke';
const TITLE = 'Business Data Analysis and Reporting in Kenya: A Guide';
const DESCRIPTION =
  'Practical guide to business data analysis in Kenya: Excel data cleaning, Power BI dashboards, KPI tracking, forecasting and report automation for SMEs and NGOs.';

export const metadata = generateCanonicalMetadata(PATH, {
  title: TITLE,
  description: DESCRIPTION,
  keywords: blogMeta.keywords,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    publishedTime: '2026-10-29',
    siteName: 'TaskLynk',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
});

const faqs = [
  {
    q: 'What is the difference between Excel data cleaning and data analysis?',
    a: 'Data cleaning prepares the raw records by fixing spelling, formats, duplicates and gaps. Data analysis comes afterwards and answers business questions using the clean records. Skipping the first step usually leads to wrong answers in the second.',
  },
  {
    q: 'Should a small business use Power BI or Excel for dashboards?',
    a: 'Excel is often enough when one person maintains a modest workbook. Power BI becomes useful when data comes from several files or systems, when many people need to view the same figures, or when the refresh should happen with little manual effort.',
  },
  {
    q: 'Can M-Pesa statements be used for sales analysis?',
    a: 'Yes, many Kenyan businesses export M-Pesa statements or till reports and combine them with their own sales records. The data must be cleaned and matched carefully, and only the fields needed for analysis should be shared with any outside specialist.',
  },
  {
    q: 'How do NGOs use data analysis for donor reporting?',
    a: 'NGOs usually track indicators from a logframe or results framework, clean field data, and present progress in tables and charts that match the donor template. A consistent data process makes each reporting cycle faster and easier to defend.',
  },
  {
    q: 'How much does a dashboard or report project cost?',
    a: 'Pricing depends on the scope, the condition of the data, the number of sources and the deadline. A quotation is confirmed after the requirements are reviewed, so there is no fixed price that fits every project.',
  },
  {
    q: 'Is it safe to share business data with an outside analyst?',
    a: 'Share only what is needed, remove personal identifiers where possible, and agree on how files will be handled before work begins. Confidential financial and customer records deserve the same care you would give them internally.',
  },
];

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: blogMeta.title,
  description: DESCRIPTION,
  datePublished: blogMeta.date,
  dateModified: blogMeta.date,
  mainEntityOfPage: `${SITE}${PATH}`,
  author: { '@type': 'Organization', name: 'TaskLynk' },
  publisher: { '@type': 'Organization', name: 'TaskLynk', url: SITE },
  keywords: blogMeta.keywords.join(', '),
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
    { '@type': 'ListItem', position: 3, name: blogMeta.title, item: `${SITE}${PATH}` },
  ],
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const takeaways = [
  { label: 'Clean data first', note: 'Reliable charts start with tidy records.' },
  { label: 'One source of truth', note: 'Every report should draw from the same figures.' },
  { label: 'Few KPIs, well chosen', note: 'Track what drives decisions, not everything.' },
  { label: 'Automate the routine', note: 'Save manual effort for interpretation.' },
];

const steps = [
  { n: '1', t: 'Define the question', d: 'Agree what decision the report supports.' },
  { n: '2', t: 'Collect and clean', d: 'Gather sources, fix errors, remove duplicates.' },
  { n: '3', t: 'Model and analyse', d: 'Build measures, trends and comparisons.' },
  { n: '4', t: 'Visualise', d: 'Design the dashboard or report layout.' },
  { n: '5', t: 'Review and refresh', d: 'Check results, then automate updates.' },
];

const checklist = [
  'The decision the report supports is written down',
  'Every data source is named and dated',
  'Duplicates and blanks have been handled',
  'Dates, currency and units are consistent',
  'KPIs have clear definitions and owners',
  'Totals reconcile with the source records',
  'Charts have titles, labels and units',
  'Confidential fields have been removed or masked',
];

const sampleRows = [
  { before: 'jane wanjiru ', after: 'Jane Wanjiru', bn: '0712 345 678', an: '254712345678', bd: '3/4/25', ad: '2025-04-03', ba: 'Ksh 12,500', aa: '12500' },
  { before: 'JANE  WANJIRU', after: 'Jane Wanjiru (duplicate removed)', bn: '+254712345678', an: '254712345678', bd: '03-04-2025', ad: '2025-04-03', ba: '12500.00', aa: '12500' },
  { before: 'peter otieno', after: 'Peter Otieno', bn: '(blank)', an: 'Flagged for follow up', bd: 'April 5', ad: '2025-04-05', ba: 'KES 8,200', aa: '8200' },
];

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-base leading-8 text-[#3b3350] dark:text-[#d9d0ee]">{children}</p>;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 mt-12 scroll-mt-24 border-l-4 border-[#FF7A3D] pl-4 text-2xl font-bold text-[#22183D] dark:text-white sm:text-3xl">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-8 text-xl font-semibold text-[#2a0e74] dark:text-[#e3d8ff]">{children}</h3>;
}

const linkCls = 'font-semibold text-[#2a0e74] underline decoration-[#FF7A3D] underline-offset-4 hover:text-[#E9662F] dark:text-[#e3d8ff]';

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
      {children}
    </a>
  );
}

export default function BusinessDataAnalysisReportingGuidePage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine - matching landing page */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1200px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <MainHeader />
      <main>
        <header className="border-b border-[#DDD3E9]/40 bg-transparent text-[#22183D] dark:text-white relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20 relative z-10">
            <div>
              <nav aria-label="Breadcrumb" className="mb-5 text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 font-medium">
                <Link href="/" className="hover:text-[#5B3594] dark:hover:text-white transition-colors">Home</Link> / <Link href="/blog" className="hover:text-[#5B3594] dark:hover:text-white transition-colors">Blog</Link> / <span>Data and reporting</span>
              </nav>
              <p className="mb-3 inline-block rounded-full bg-[#5B3594] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                {blogMeta.category}
              </p>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl tracking-tight text-[#22183D] dark:text-white">
                Business Data Analysis and Reporting in Kenya: A Practical Guide
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#6B627A] dark:text-[#DDD3E9]/90 font-normal">
                How SMEs, NGOs, consultants and researchers turn messy spreadsheets into clear dashboards, trusted KPIs and management reports that support real decisions.
              </p>
              <p className="mt-4 text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">
                Published 29 October 2026 &middot; {blogMeta.readTime}
              </p>
            </div>
            <div className="mx-auto w-full max-w-lg">
              <DashboardIllustration />
            </div>
          </div>
        </header>

        <section aria-label="Key takeaways" className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {takeaways.map((t) => (
              <li key={t.label} className="rounded-2xl border border-[#e4d9f6] bg-white p-5 shadow-lg dark:border-[#3a2c63] dark:bg-[#1d1535]">
                <p className="text-lg font-bold text-[#2a0e74] dark:text-[#e3d8ff]">{t.label}</p>
                <p className="mt-1 text-sm text-[#4a4160] dark:text-[#cfc4e8]">{t.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article>
            <P>
              Most Kenyan organisations already collect plenty of data. A shop records daily sales in a notebook and an M-Pesa till statement. A cooperative keeps member contributions in several Excel files. An NGO gathers survey responses from field officers using phones. A researcher exports results from three different tools. The difficulty is rarely a lack of data. The difficulty is turning scattered, inconsistent records into numbers that a manager, a board or a donor can trust.
            </P>
            <P>
              This guide explains how business data analysis and reporting works in practice, from the first cleaning pass in Excel to a finished Power BI dashboard and an automated monthly report. It is written for owners of small and medium enterprises, programme and finance officers in NGOs, consultants who prepare client deliverables, and researchers who need tidy data before analysis. If you would like help with a specific project, you can browse the <Link href="/catalogue/business-data-analysis-reporting" className={linkCls}>business data analysis and reporting services on TaskLynk</Link>.
            </P>

            <H2 id="why-it-matters">Why business data analysis matters for Kenyan organisations</H2>
            <P>
              Decisions made without evidence tend to be expensive. An owner who restocks based on memory may overbuy slow items and run out of fast ones. A programme manager who cannot show indicator progress may struggle to defend a budget. A consultant who delivers a report with unexplained totals loses credibility with the client. Good analysis does not remove judgement, but it gives judgement a firm base.
            </P>
            <H3>From records to decisions</H3>
            <P>
              Think of reporting as a chain. Records are captured, cleaned, combined, summarised and finally presented. If one link is weak, the final chart can look convincing and still be wrong. That is why experienced analysts spend more time on preparation than on charts. The visual layer is the last and most visible step, but it only works when the earlier steps were done with care.
            </P>
            <H3>What changes when data is reliable</H3>
            <P>
              Meetings become shorter because people stop arguing about whose spreadsheet is correct. Month end closes faster because figures reconcile. Funding conversations improve because results are traceable to source records. These benefits come from discipline and consistent method rather than from expensive software.
            </P>

            <H2 id="what-it-covers">What business data analysis and reporting covers</H2>
            <P>
              The category is broader than many people expect. It includes data cleaning and validation, data entry, deduplication, Excel and Power BI dashboards, KPI tracking, sales and revenue analysis, customer satisfaction analysis, market research, financial modelling and forecasting, management reports and report automation. Each of these supports a different question, yet they share the same foundations: clear definitions, tidy data and honest presentation.
            </P>
            <P>
              If your work leans towards statistical testing, academic datasets or training, related support is available through <Link href="/catalogue/data-analysis-statistics" className={linkCls}>data analysis and statistics help</Link> and <Link href="/catalogue/data-analysis-training-tutoring" className={linkCls}>data analysis training and tutoring</Link>. For an overview of the wider service, see the <Link href="/services/data-analysis" className={linkCls}>data analysis services page</Link>.
            </P>

            <H2 id="excel-cleaning">Excel data cleaning and validation</H2>
            <P>
              Excel data cleaning is the most valuable skill in the whole workflow. Microsoft documents many of the relevant tools, such as text functions, Remove Duplicates, data validation and Power Query, in its <Ext href="https://support.microsoft.com/excel">Excel support library</Ext>. The tools are available to almost everyone, so the real difference lies in knowing the common problems and handling them in a repeatable way.
            </P>
            <H3>Common problems in Kenyan business spreadsheets</H3>
            <P>
              Names appear in different cases and with extra spaces. Phone numbers are typed as 0712, +254712 or 254712 in the same column. Dates mix day first and month first formats, which is especially risky when a value such as 3/4/25 could mean two different days. Amounts include the text Ksh or KES, commas, and sometimes trailing spaces, which makes Excel treat them as text rather than numbers. Branch names are spelled three ways. Each of these will quietly break a pivot table or a formula.
            </P>
            <H3>Before and after example</H3>
            <P>
              The table below uses clearly fictional sample rows to show what a cleaning pass does. The goal is consistency: one format for each field, one row per real transaction, and a flag where information is missing instead of a silent guess.
            </P>
            <div className="mb-6 overflow-x-auto rounded-2xl border border-[#e4d9f6] bg-white dark:border-[#3a2c63] dark:bg-[#1d1535]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5a99] dark:text-[#b9a4ee]">
                  Example only: fictional sample rows
                </caption>
                <thead className="bg-[#F5EEFB] text-[#22183D] dark:bg-[#2a1f4a] dark:text-white">
                  <tr>
                    <th scope="col" className="px-3 py-2">Field</th>
                    <th scope="col" className="px-3 py-2">Before</th>
                    <th scope="col" className="px-3 py-2">After</th>
                  </tr>
                </thead>
                <tbody className="text-[#3b3350] dark:text-[#d9d0ee]">
                  {sampleRows.map((r, i) => (
                    <tr key={i} className="border-t border-[#eee5fa] align-top dark:border-[#34285a]">
                      <th scope="row" className="px-3 py-2 font-semibold">Row {i + 1}</th>
                      <td className="px-3 py-2">
                        {r.before} | {r.bn} | {r.bd} | {r.ba}
                      </td>
                      <td className="px-3 py-2">
                        {r.after} | {r.an} | {r.ad} | {r.aa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <H3>Data validation prevents the problem</H3>
            <P>
              Cleaning is reactive, while validation is preventive. Drop down lists for branch and product names, date rules that reject text, and number rules that limit entries to sensible ranges stop errors at the moment of entry. For teams that use shared files or mobile forms, a short data entry guide and a locked template are often worth more than any later repair.
            </P>

            <H2 id="dedup-entry">Data entry and deduplication</H2>
            <P>
              Duplicate records inflate sales, double count beneficiaries and distort customer lists. They usually appear when two staff capture the same transaction, when a file is merged twice, or when the same person is registered under slightly different names.
            </P>
            <H3>A careful approach to removing duplicates</H3>
            <P>
              Start by deciding what makes a record unique. For a sale it might be the receipt number plus the date. For a beneficiary it might be the national ID or phone number. Standardise the key fields first, then identify duplicates, review them, and only then remove them. Keep a log of what was removed so the process can be explained later. Deleting automatically without review can remove legitimate repeat purchases.
            </P>
            <H3>When manual data entry still makes sense</H3>
            <P>
              Paper registers, handwritten stock books and scanned forms still exist across retail, health outreach and agribusiness. Typing these into a structured template is slow work, and accuracy matters more than speed. Double entry on a sample, spot checks and consistent codes help catch mistakes before they reach a dashboard.
            </P>

            <H2 id="dashboards">Power BI and Excel dashboards</H2>
            <P>
              A dashboard is a single page that answers a few important questions at a glance. Both tools can do this well. <Ext href="https://www.microsoft.com/en-us/power-platform/products/power-bi">Power BI</Ext> is designed for connecting several sources, building a data model and sharing interactive reports. Excel dashboards use pivot tables, slicers and charts and are easier to maintain when one person owns the file.
            </P>
            <H3>Choosing between the two</H3>
            <P>
              Choose Excel when the data lives in one workbook, the audience is small and the layout is simple. Choose Power BI when you combine sales files with stock lists and finance exports, when many users need access, or when you want scheduled refresh. Many organisations in Kenya start in Excel and move to Power BI as reporting needs grow. A well designed Power BI dashboard in Kenya still depends on the same clean source data described above.
            </P>
            <H3>Design principles that keep dashboards useful</H3>
            <P>
              Put the most important figures at the top. Limit each page to a handful of visuals. Use one colour to highlight the item that needs attention. Always label units, such as Ksh or number of customers, and always show the period covered. A dashboard that needs a long explanation has too much on it.
            </P>

            <H2 id="kpis">KPI tracking for SMEs</H2>
            <P>
              A KPI dashboard for SMEs does not need dozens of measures. The best ones are few, clearly defined and connected to action. If nobody changes behaviour when a number moves, the number probably should not be on the page.
            </P>
            <H3>Choosing KPIs that fit your business</H3>
            <P>
              A retailer might watch daily sales, gross margin by category and stock turnover. A service business might watch new enquiries, quotations accepted and average payment time. An agribusiness might track yield per acre, input costs and delivery losses. Whatever you choose, write down the formula, the data source, the owner and the review frequency.
            </P>
            <H3>Common KPI mistakes</H3>
            <P>
              The first mistake is tracking vanity numbers that look impressive but guide nothing. The second is changing definitions halfway through the year so trends cannot be compared. The third is mixing cash received with sales invoiced without saying which one a chart shows. Clear definitions solve most of these problems.
            </P>

            <H2 id="sales-customers">Sales, revenue and customer satisfaction analysis</H2>
            <H3>Sales and revenue analysis</H3>
            <P>
              Sales analysis looks at what sold, where, when and to whom. Useful views include sales by product, branch, salesperson and month, along with the share of revenue from the best customers. For businesses that receive payments through M-Pesa, matching till or paybill statements to the sales ledger helps reveal missing entries and timing gaps. Seasonal patterns, such as school opening periods or harvest months, become visible once several months of clean data are placed side by side.
            </P>
            <H3>Customer satisfaction analysis</H3>
            <P>
              Survey results are only helpful when they are summarised honestly. Group comments into themes, compare ratings across branches or services, and report the number of responses so readers can judge how much weight to give the findings. Open text answers in English, Kiswahili or Sheng may need careful reading before coding. Avoid presenting small samples as if they described every customer.
            </P>

            <H2 id="research-forecasting">Market research, financial modelling and forecasting</H2>
            <H3>Market research</H3>
            <P>
              Market research combines your own records with published sources. The <Ext href="https://www.knbs.or.ke">Kenya National Bureau of Statistics</Ext> publishes economic and demographic data that can frame market size and household patterns, while the <Ext href="https://www.worldbank.org">World Bank</Ext> offers broader country and sector indicators. Always cite the source and the year, and be clear about which numbers are your own estimates.
            </P>
            <H3>Financial modelling and forecasting in Excel</H3>
            <P>
              A financial model turns assumptions into projected income, costs and cash flow. Financial forecasting in Excel works best when assumptions sit on one clearly labelled sheet, calculations are separate, and outputs are summarised on a final page. Include a base case and at least one cautious case so decision makers can see how results change when sales are lower or costs are higher.
            </P>
            <H3>Keep tax and compliance in view</H3>
            <P>
              Forecasts for a Kenyan business should consider tax obligations and filing dates. The <Ext href="https://www.kra.go.ke">Kenya Revenue Authority</Ext> publishes current guidance, and any figure that affects tax should be confirmed with a qualified accountant. A model is a planning tool, not a legal or tax opinion.
            </P>

            <H2 id="management-reports">Management reports and report automation</H2>
            <H3>What a good management report contains</H3>
            <P>
              A management report should open with a short summary, followed by the main KPIs, the reasons behind major movements, risks and the actions proposed. Boards rarely want every table. They want to know what happened, why it happened and what should be done next.
            </P>
            <H3>Reporting for NGOs and donors</H3>
            <P>
              Data analysis for NGOs often involves indicator tracking against a results framework, disaggregation by gender, age or county, and narrative explanation of variances. Donor templates differ, but the discipline is the same: traceable numbers, consistent definitions and clear notes on limitations. When field data is cleaned and stored in one structure, each quarterly report takes far less effort to compile.
            </P>
            <H3>Report automation</H3>
            <P>
              Report automation means the monthly pack updates from fresh data with minimal manual work. In Excel this can be achieved with Power Query connections and pivot tables that refresh on demand. In Power BI it can involve scheduled refresh and shared workspaces. Automation saves time only when the source data stays consistent, so the cleaning rules should be built into the process rather than repeated by hand.
            </P>

            <H2 id="workflow">A step by step reporting workflow</H2>
            <P>
              Whether the project is a small Excel summary or a full dashboard, the same sequence applies. The strip below shows the order of work. Notice that visualisation sits fourth, not first.
            </P>
            <ol className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((s) => (
                <li key={s.n} className="rounded-2xl border border-[#e4d9f6] bg-white p-4 dark:border-[#3a2c63] dark:bg-[#1d1535]">
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF7A3D] text-sm font-bold text-[#22183D]">
                    {s.n}
                  </span>
                  <p className="font-semibold text-[#22183D] dark:text-white">{s.t}</p>
                  <p className="mt-1 text-sm text-[#4a4160] dark:text-[#cfc4e8]">{s.d}</p>
                </li>
              ))}
            </ol>
            <P>
              Writing the brief is the step people skip most often. A good brief states the audience, the decision, the data sources, the reporting period, the required format and the deadline. With that in place, a specialist can start quickly and you can judge the result against clear expectations.
            </P>

            <H3>Reviewing the result before it is shared</H3>
            <P>
              Before a dashboard or report reaches a board, a donor or a client, check that the totals match the source records, that filters are not hiding important rows, and that every chart title says what period and unit it shows. Ask a colleague who did not build the report to read it and explain the main message back to you. If they struggle, simplify the layout. A final review of this kind catches the small errors that damage trust, such as a wrong date range or a currency label that was left out.
            </P>

            <H2 id="confidentiality">Protecting confidential business data</H2>
            <div className="mb-6 flex gap-3 rounded-2xl border border-[#FF7A3D]/40 bg-[#FFF3EC] p-5 dark:bg-[#2a1f2f]">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#E9662F]" aria-hidden="true" />
              <p className="text-base leading-7 text-[#3b3350] dark:text-[#f1e6ee]">
                Share only the data that is needed for the task. Remove names, ID numbers and phone numbers where they are not required, and avoid sending passwords or full bank details in any file.
              </p>
            </div>
            <P>
              Sales records, payroll files, donor data and beneficiary lists are sensitive. Before sharing anything, ask whether the analysis truly needs personal identifiers. Often a coded customer number is enough. Keep a copy of the original file untouched, send a reduced version, and agree how the files will be stored and deleted when the work ends. For NGOs, beneficiary information may also be covered by data protection duties and donor agreements, so check those rules first.
            </P>

            <H2 id="tasklynk">How TaskLynk supports data and reporting projects</H2>
            <P>
              TaskLynk is a managed platform. You submit your requirements, a project manager reviews the brief and coordinates a vetted specialist, and communication stays organised inside the platform. This structure helps when a project has several moving parts, such as cleaning three files, building a dashboard and writing a short management summary.
            </P>
            <P>
              You can explore <Link href="/catalogue/business-data-analysis-reporting" className={linkCls}>Excel, Power BI and management reporting support</Link> to see the types of work available. Pricing depends on the scope, the condition of the data and the timeline, and it is confirmed by quotation after your requirements are reviewed. You can read how this works on the <Link href="/pricing" className={linkCls}>pricing page</Link> or <Link href="/contact" className={linkCls}>contact the team</Link> with questions. More learning resources are available on the <Link href="/blog" className={linkCls}>TaskLynk blog</Link>.
            </P>
            <H3>What to prepare before you start</H3>
            <P>
              Collect the files you plan to use, write two or three sentences about the decision the report supports, note any format required by a donor or board, and mention your deadline. If you already know which KPIs matter, list them with their formulas. A little preparation shortens the back and forth and leads to a better result.
            </P>

            <H2 id="faq">Frequently asked questions</H2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-[#e4d9f6] bg-white p-5 dark:border-[#3a2c63] dark:bg-[#1d1535]">
                  <summary className="cursor-pointer list-none font-semibold text-[#22183D] marker:hidden dark:text-white">
                    {f.q}
                  </summary>
                  <p className="mt-3 leading-7 text-[#3b3350] dark:text-[#d9d0ee]">{f.a}</p>
                </details>
              ))}
            </div>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#e4d9f6] bg-[#F5EEFB] p-6 dark:border-[#3a2c63] dark:bg-[#1d1535]">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#22183D] dark:text-white">
                <ClipboardCheck className="h-5 w-5 text-[#E9662F]" aria-hidden="true" />
                Report checklist
              </h2>
              <ul className="space-y-3">
                {checklist.map((c) => (
                  <li key={c} className="flex gap-2 text-sm leading-6 text-[#3b3350] dark:text-[#d9d0ee]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2a0e74] dark:text-[#b9a4ee]" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
              <Link
                href="/catalogue/business-data-analysis-reporting"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A3D] px-4 py-3 font-semibold text-[#22183D] hover:bg-[#E9662F]"
              >
                View reporting services <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>

        <section className="bg-gradient-to-br from-[#22183D] to-[#2a0e74] px-4 py-14 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to turn your data into a clear report?</h2>
            <p className="mt-3 text-[#e8defc]">
              Share your brief and receive a quotation based on your scope. A project manager will coordinate a vetted specialist for your dashboard, analysis or management report.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/catalogue/business-data-analysis-reporting" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF7A3D] px-6 py-3 font-semibold text-[#22183D] hover:bg-[#E9662F]">
                Explore reporting services <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">
                Contact TaskLynk
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
