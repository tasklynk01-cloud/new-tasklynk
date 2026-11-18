import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, BarChart3, PieChart, Calculator, ShieldCheck, Clock, Users, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Financial Analysis Services | Financial Modeling & Reports',
  'Professional financial analysis services including financial modeling, valuation, investment analysis, cash flow forecasting, and financial reporting. Hire vetted financial analysts for data-driven decisions.',
  '/services/business/financial-analysis'
);

const faqs = [
  {
    question: 'What financial analysis services do you provide?',
    answer: 'We provide financial modeling (DCF, three-statement models, merger models), business valuation, investment analysis, cash flow forecasting, break-even analysis, ratio analysis, financial reporting, budget variance analysis, and scenario planning. We also handle loan covenant analysis, credit risk assessment, and financial due diligence for M&A transactions.',
  },
  {
    question: 'Which Excel and modeling tools do you use?',
    answer: 'We use Excel with advanced functions (INDEX-MATCH, OFFSET, DSUM), VBA automation, Power Query, Power Pivot, and financial modeling best practices. We also use specialized tools including Python (pandas, NumPy), R, Power BI for visualization, Tableau, and Google Sheets for collaborative modeling.',
  },
  {
    question: 'Can you help with investment analysis and valuation?',
    answer: 'Yes. We conduct comparable company analysis (comps), precedent transaction analysis, discounted cash flow (DCF) modeling, net asset value (NAV) analysis, and sum-of-the-parts valuation. We also perform sensitivity analysis, scenario modeling, and provide detailed investment memoranda with recommendations. All valuations follow industry-standard methodologies and include supporting documentation.',
  },
  {
    question: 'How do you ensure financial data confidentiality?',
    answer: 'We handle all financial data with strict confidentiality. Our specialists sign NDAs before accessing any financial information, we use encrypted file transfer, and we never share financial details with third parties. Financial models and analyses remain exclusively yours throughout the engagement.',
  },
  {
    question: 'What financial reports do you prepare?',
    answer: 'We prepare income statements, balance sheets, cash flow statements, variance reports, ratio analysis reports, break-even analysis, and executive summaries with key financial metrics. We also create investor presentation materials, board meeting packages, and regulatory reporting documents as needed.',
  },
  {
    question: 'How quickly can you complete a financial analysis project?',
    answer: 'Simple financial analysis projects (ratio analysis, basic modeling) can be completed in 24-48 hours. Comprehensive financial models with three-statement projections typically take 3-7 days. Complex valuations or investment analyses may take 1-2 weeks. We offer express 12-hour service for urgent deadlines. You set the timeline when posting your project.',
  },
];

const relatedServices = [
  { label: 'Business Plan Writing', href: '/services/business/business-plans' },
  { label: 'Market Research', href: '/services/business/market-research' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'Excel Data Analysis', href: '/services/data-analysis/excel-data-analysis' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Analysts', href: '/register/client' },
];

export default function FinancialAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/business/financial-analysis"
      serviceSchemaName="Financial Analysis Services"
      serviceSchemaDescription="Professional financial analysis and modeling services including DCF valuation, investment analysis, cash flow forecasting, ratio analysis, and financial reporting. Hire vetted financial analysts."
      heroEyebrow="Financial Analysis"
      heroTitle="Financial Analysis Services | Financial Modeling & Reports"
      heroIntro="Numbers tell a story—but only if you know how to read them. A profit and loss statement without context is just figures on a page. A balance sheet without analysis misses the underlying risks and opportunities. Whether you're seeking investment, applying for a loan, evaluating a business opportunity, or simply making strategic decisions, you need financial analysis that transforms raw numbers into clear, actionable insights. TaskLynk connects you with vetted financial analysts—experts in financial modeling, valuation, investment analysis, and forecasting—who deliver data-driven insights backed by rigorous analysis. With secure milestone payments, NDA protection, and dedicated project management, your financial decisions are supported by reliable intelligence."
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
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                This service is for businesses and individuals who need expert financial analysis and modeling. <strong>Startup founders</strong> preparing financial models for investor pitch decks, seed funding rounds, or Series A preparations who need professional financial projections and valuation analysis. <strong>SME owners</strong> in Kenya and beyond who need financial analysis for bank loan applications, investment proposals, or strategic planning, including cash flow forecasting and break-even analysis. <strong>Investors and private equity firms</strong> conducting due diligence on potential investment opportunities, requiring detailed financial modeling, valuation, and risk assessment. <strong>Business consultants</strong> who need financial analyst support for client engagements, including market analysis, profitability assessment, and strategic recommendations. <strong>Real estate developers</strong> requiring pro forma cash flow models, feasibility analysis, and investment return calculations for property development projects. <strong>Financial analysts and accountants</strong> who need to augment their capacity for complex modeling or specialized analysis. <strong>Students and researchers</strong> conducting financial research, business analytics projects, or investment analysis coursework.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need financial modeling, valuation, investment analysis, cash flow forecasting, or financial reporting done by expert-level financial analysts, our service provides vetted talent. We also support complementary services including <Link href="/services/data-analysis/excel-data-analysis" className="text-primary font-semibold hover:underline">Excel data analysis</Link>, <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">financial data visualization</Link>, and <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design for investor decks</Link>.
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
                What We Offer: Expert Financial Modeling and Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our financial analysis service covers the complete spectrum of financial modeling and analytical services, from basic ratio analysis to complex multi-scenario valuations. We begin with a <strong>project scoping and data collection phase</strong>—understanding your specific requirements, timeline, and deliverable needs. Our specialists work with your financial statements, market data, operational metrics, and business plans to build models that accurately reflect your business realities. We handle all major financial modeling types including <strong>three-statement models</strong> (integrating income statement, balance sheet, and cash flow statement with proper linkages and drivers), <strong>discounted cash flow (DCF) models</strong> with detailed forecasting assumptions, <strong>merger and acquisition models</strong> (M&A), <strong>leveraged buyout (LBO) models</strong>, <strong>sum-of-the-parts valuations</strong>, and <strong>project finance models</strong> for capital budgeting decisions.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>business valuation</strong>, we employ multiple methodologies including comparable company analysis (trading multiples, EV/Revenue, P/E ratios), precedent transaction analysis (acquisition multiples, control premiums), net asset value calculations, and DCF-based valuations with sensitivity analysis. Our specialists prepare detailed investment memoranda with executive summaries, methodology explanations, sensitivity tables, and clear recommendations. For <strong>cash flow forecasting</strong> and <strong>budget variance analysis</strong>, we build rolling forecasts, analyze actual-vs-budget performance, and identify key drivers of financial performance. All financial models follow best practices including clear documentation, error checks, sensitivity analysis, scenario tabs, and audit trails. Deliverables include Excel files with source tabs, summary presentations, and written analysis reports.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Financial Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Three-statement, DCF, LBO, M&A, and project finance models with scenario analysis, sensitivity tables, and audit-ready documentation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Valuation &amp; Investment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  DCF, comparable company analysis, precedent transactions, investment memoranda, and recommendation reports with sensitivity analysis.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Forecasting &amp; Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cash flow forecasting, break-even analysis, ratio analysis, variance reports, and executive summary dashboards.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Visualization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Financial dashboards, charts, and interactive visualizations using Power BI, Tableau, or Excel for clear insight communication.
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
                Tools and Industries We Serve
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our financial analysts are proficient in the tools and methodologies used by professional finance teams. We use advanced Excel with INDEX-MATCH, OFFSET, DSUM, pivot tables, Power Query, Power Pivot, and VBA automation for financial modeling. We also work with Python (pandas, NumPy, SciPy) for statistical analysis and automation, R for advanced statistical modeling, Power BI and Tableau for interactive financial dashboards, and Google Sheets for collaborative modeling. Our specialists hold industry-recognized certifications including CFA, CPA, CA, ACCA, or MBA degrees, with demonstrated experience in financial modeling and analysis.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                We serve industries including <strong>financial services</strong> (banking, insurance, investment firms), <strong>real estate and property development</strong>, <strong>agriculture and agri-business</strong>, <strong>healthcare and pharmaceuticals</strong>, <strong>technology and SaaS</strong>, <strong>manufacturing and production</strong>, <strong>retail and consumer goods</strong>, and <strong>non-profit and development organizations</strong>. For businesses preparing funding proposals, we also offer <Link href="/services/business/business-plans" className="text-primary font-semibold hover:underline">business plan writing</Link> with integrated financial projections. For data-driven presentations, our <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design services</Link> create investor-ready decks. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures financial analysis meets professional standards. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your financial analysis project</Link> today.
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
                Why TaskLynk for Financial Analysis Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Financial analysis requires not just spreadsheet proficiency, but deep understanding of financial principles, industry dynamics, and valuation methodologies. A model built by someone without proper training can contain fundamental errors that undermine credibility with investors or lenders. TaskLynk's marketplace connects you with certified financial analysts—CFA charterholders, CPAs, CAs, and MBAs—who have years of experience in investment banking, corporate finance, consulting, and equity research. Every financial analyst in our network has verifiable credentials and portfolio of completed financial models that have supported real investment and lending decisions.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each analysis deliverable before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the analyst, track progress against milestones, and ensure the analysis meets your business objectives. <strong>NDA protection</strong> safeguards your financial data, business strategies, and confidential information. We also offer <Link href="/services/business/business-plans" className="text-primary font-semibold hover:underline">business plan writing with financial projections</Link>, <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design for investor decks</Link>, and <Link href="/services/data-analysis/excel-data-analysis" className="text-primary font-semibold hover:underline">Excel data analysis</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality financial analysis, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your project</Link> today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
