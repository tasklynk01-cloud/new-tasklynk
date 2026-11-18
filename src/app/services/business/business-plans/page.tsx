import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, TrendingUp, BarChart3, Layout, ShieldCheck, Clock, Users, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional Business Plan Writing Services | Strategic Plans',
  'Professional business plan writing services including strategic plans, investor pitch decks, feasibility studies, and market analysis. Hire vetted business strategists for funding readiness.',
  '/services/business/business-plans'
);

const faqs = [
  {
    question: 'What is included in a business plan?',
    answer: 'A comprehensive business plan includes an executive summary, company description, market analysis, competitive analysis, product/services description, marketing and sales strategy, organizational structure, management team profiles, financial projections (3-5 years), funding requirements, and implementation timeline. We also include risk analysis, SWOT analysis, and appendices with supporting documents.',
  },
  {
    question: 'Can you write a business plan for any industry?',
    answer: 'Yes. We have specialists across industries including technology, healthcare, agriculture, retail, manufacturing, finance, education, real estate, hospitality, and consulting. We match you with a writer who has industry expertise and experience with business plans for your specific sector, ensuring the plan addresses relevant market dynamics, regulatory requirements, and competitive landscapes.',
  },
  {
    question: 'What types of financial projections do you provide?',
    answer: 'We provide 3-5 year financial projections including income statements (profit and loss), cash flow statements, balance sheets, and break-even analysis. We also include monthly projections for the first year and quarterly or annual projections thereafter. All projections are based on realistic assumptions backed by market research and industry benchmarks.',
  },
  {
    question: 'Can you help me secure funding?',
    answer: 'Yes. Our business plans are formatted for funding readiness, whether you\'re seeking bank loans, angel investment, venture capital, or grant funding. We include investor-focused executive summaries, clear value propositions, realistic financial projections, and detailed use of funds breakdowns. We also help prepare pitch decks and investor Q&A materials.',
  },
  {
    question: 'How long does a business plan take to complete?',
    answer: "Standard business plans are typically completed in 7-14 days. Complex plans requiring extensive market research or specialized industry knowledge may take 2-3 weeks. We offer express 3-day service for urgent funding deadlines. The timeline depends on your requirements, the complexity of your business model, and the availability of information you provide.",
  },
  {
    question: 'Do you handle confidentiality and NDAs?',
    answer: 'Yes. We provide NDA protection for all business plans. Our specialists sign confidentiality agreements before accessing your business information. We handle sensitive data—including financial projections, market strategies, and intellectual property—with strict confidentiality. All communications are encrypted and stored securely.',
  },
];

const relatedServices = [
  { label: 'Market Research Services', href: '/services/business/market-research' },
  { label: 'Financial Analysis Services', href: '/services/business/financial-analysis' },
  { label: 'Business Analysis Services', href: '/services/business/business-analysis' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Strategists', href: '/register/client' },
];

export default function BusinessPlansPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/business/business-plans"
      serviceSchemaName="Professional Business Plan Writing Services"
      serviceSchemaDescription="Professional business plan writing services including strategic plans, investor pitch decks, feasibility studies, and market analysis for funding readiness. Hire vetted business strategists."
      heroEyebrow="Business Plans"
      heroTitle="Professional Business Plan Writing Services | Strategic Plans"
      heroIntro="A business plan is more than a document—it's your roadmap to funding, growth, and strategic clarity. Whether you're seeking a bank loan, angel investment, or venture capital, or simply need to align your team around a clear strategy, your business plan must convince stakeholders that your vision is viable, scalable, and profitable. TaskLynk connects you with vetted business strategists—experts in business plan writing, financial modeling, market analysis, and investor pitching—who craft compelling, bank-ready, investment-grade business plans. With secure milestone payments, NDA protection, and dedicated project management, your business vision gets the strategic documentation it deserves."
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
                This service is for entrepreneurs and businesses at every stage who need professional business planning support. <strong>First-time entrepreneurs</strong> preparing to pitch to investors, apply for loans, or enter accelerator programs who need a professionally written business plan. <strong>Growing businesses</strong> seeking expansion capital, entering new markets, or pivoting their business model who need updated strategic plans. <strong>SME owners</strong> in Kenya and beyond who need bank-ready business plans for commercial loans from KCB, Equity Bank, or other financial institutions. <strong>Startup founders</strong> preparing for angel investment rounds or venture capital funding who need investment-grade business plans and pitch decks. <strong>Business consultants</strong> who need professional plan writing support for client engagements. <strong>Real estate developers</strong> requiring feasibility studies and development pro formas. <strong>Agri-business entrepreneurs</strong> needing agricultural business plans with crop modeling and market analysis. <strong>Tech startups</strong> requiring scalable business models with SaaS metrics and go-to-market strategies.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need a compelling, professionally written business plan—with realistic financial projections, thorough market analysis, and investor-ready presentation—this service provides expert strategic writing talent. We also support complementary services including <Link href="/services/business/market-research" className="text-primary font-semibold hover:underline">market research</Link>, <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis and modeling</Link>, and <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">professional presentation design</Link> for pitch decks.
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
                What We Offer: Comprehensive Business Strategy Documentation
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our business plan service covers every component required for a professional, fundable, and strategically sound business plan. We begin with a <strong>deep-dive consultation</strong> to understand your business concept, target market, competitive positioning, revenue model, and funding requirements. Our specialists then conduct <strong>comprehensive market research</strong>—analyzing industry trends, market size and growth projections, target customer demographics and behaviors, competitive landscape, and market entry barriers. This research is documented with sources and presented in clear, data-driven sections that demonstrate market opportunity and validate your business concept.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Next, we develop <strong>strategic content</strong> including your company description, value proposition, product or service descriptions, go-to-market strategy, sales and marketing plans, organizational structure, and management team profiles. Our specialists ensure every section builds a compelling narrative that demonstrates your understanding of the market and your capability to execute. We also include <strong>SWOT analysis</strong> (strengths, weaknesses, opportunities, threats), risk assessment with mitigation strategies, and detailed implementation timelines with milestones. For funding-focused plans, we craft investor-friendly executive summaries, clearly articulate use of funds, and present compelling traction and growth projections.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Market Research &amp; Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Industry analysis, competitive landscape, target market segmentation, customer personas, and market sizing with data-backed projections.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Financial Projections</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  3-5 year income statements, cash flow, balance sheets, break-even analysis, and funding requirements with realistic assumptions.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Growth Strategy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Go-to-market plans, sales strategies, scaling roadmap, KPI frameworks, and expansion timing for sustainable growth.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Investor-Ready Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional formatting, executive summary, use-of-funds breakdown, and pitch deck alignment for funding readiness.
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
                Industries and Business Models We've Planned For
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our business strategists have written plans across diverse industries, each with sector-specific insights and funding requirements. For <strong>agri-tech and agriculture</strong>, we've crafted plans for vertical farming operations, agri-processing ventures, and farm management services—with crop modeling, supply chain analysis, and buyer-seller network mapping. For <strong>fintech and financial services</strong>, we've written plans for mobile money solutions, micro-insurance platforms, and lending services—with regulatory compliance frameworks, risk management strategies, and scalability models. For <strong>healthcare and health tech</strong>, we've developed clinic business plans, telemedicine platforms, and diagnostic center proposals—with patient acquisition strategies, regulatory pathways, and healthcare-specific financial modeling. For <strong>ecommerce and retail</strong>, we've written plans for online marketplaces, direct-to-consumer brands, and brick-and-mortar expansions—with logistics optimization, customer retention strategies, and inventory management plans.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>technology and SaaS startups</strong>, we've crafted plans with subscription revenue models, customer acquisition cost (CAC) analysis, lifetime value (LTV) calculations, and scalable go-to-market strategies. For <strong>real estate and property development</strong>, we've written feasibility studies with pro forma cash flows, market comparables, and development timelines. For <strong>hospitality and tourism</strong>, we've developed resort, hotel, and tour operation plans with seasonality analysis, occupancy forecasting, and revenue management strategies. These projects have successfully secured funding from Kenyan banks, angel investors, and international development organizations. For financial modeling support specifically, see our <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis services</Link>, and for investor presentations, our <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design services</Link>.
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
                Why TaskLynk for Business Plan Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                A business plan written by someone without industry knowledge or financial modeling experience can damage your credibility with investors and lenders. TaskLynk's marketplace connects you with business strategists who have not only written successful business plans but have also founded companies, raised capital, and operated businesses themselves. Every business plan specialist in our network has a minimum of 5 years of experience in business strategy, consulting, or entrepreneurship, with verifiable case studies of funded plans. We also ensure industry expertise—matching you with writers who understand your sector's dynamics, regulatory environment, and funding landscape.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond domain expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve the executive summary, financial projections, and final plan before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the strategist, track progress against milestones, and ensure the plan meets your funding or strategic objectives. <strong>NDA protection</strong> safeguards your business concept, strategies, and financial information. We also offer complementary services including <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis and modeling</Link>, <Link href="/services/business/market-research" className="text-primary font-semibold hover:underline">market research</Link>, and <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">professional presentation design</Link> for complete investor-ready packages. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your business plan project</Link> today to be matched with a qualified strategist within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
