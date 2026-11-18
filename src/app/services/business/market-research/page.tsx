import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Search, PieChart, TrendingUp, Users, Database, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Market Research Services | Data-Driven Business Insights',
  'Professional market research services including customer surveys, competitive analysis, market sizing, segmentation, and consumer insights. Hire vetted market research analysts for actionable business intelligence.',
  '/services/business/market-research'
);

const faqs = [
  {
    question: 'What types of market research do you conduct?',
    answer: 'We conduct both quantitative research (surveys, polling, market sizing, segmentation analysis, customer satisfaction studies) and qualitative research (focus groups, in-depth interviews, ethnographic studies, concept testing, usability testing). We also perform competitive analysis, brand tracking, pricing research, product development research, and customer journey mapping. Each study uses appropriate methodologies for your research objectives.',
  },
  {
    question: 'How do you select the right sample size?',
    answer: 'Our research specialists calculate sample sizes using statistical power analysis, confidence intervals, and margin of error requirements. We consider your population size, desired confidence level (typically 95%), acceptable margin of error, and expected response distribution. For qualitative research, we use saturation-based sampling to determine when enough responses have been collected to identify themes.',
  },
  {
    question: 'Can you analyze our existing survey data?',
    answer: 'Yes. We analyze existing survey data from any platform including Qualtrics, SurveyMonkey, Google Forms, and custom survey tools. We perform cross-tabulations, regression analysis, segmentation, and produce actionable insights reports with recommendations. See our related <Link href="/services/data-analysis/survey-data-analysis">survey data analysis</Link> service for statistical analysis of survey responses.',
  },
  {
    question: 'How do you ensure research quality and accuracy?',
    answer: 'We follow industry best practices including pre-testing survey instruments, using validated scales, implementing quality control measures during data collection, conducting statistical validation, and cross-checking findings. For qualitative research, we use inter-coder reliability checks, triangulation across data sources, and member checking to validate interpretations.',
  },
  {
    question: 'Can you help with competitor research?',
    answer: 'Yes. We conduct competitive analysis including product benchmarking, pricing analysis, market share assessment, SWOT analysis, positioning analysis, and go-to-market strategy review. We gather data from public sources, customer interviews, and primary research to provide actionable competitive intelligence.',
  },
  {
    question: 'What deliverables do you provide?',
    answer: 'Deliverables include a comprehensive market research report with executive summary, methodology, findings, data visualizations, and actionable recommendations. We also provide raw data files, survey instruments, presentation slides for stakeholders, and implementation roadmaps for acting on insights. All deliverables are formatted for board presentations and strategic planning.',
  },
];

const relatedServices = [
  { label: 'Business Plan Writing', href: '/services/business/business-plans' },
  { label: 'Financial Analysis', href: '/services/business/financial-analysis' },
  { label: 'Survey Data Analysis', href: '/services/data-analysis/survey-data-analysis' },
  { label: 'Research Data Analysis', href: '/services/data-analysis/research-data-analysis-services' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function MarketResearchPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/business/market-research"
      serviceSchemaName="Market Research Services"
      serviceSchemaDescription="Professional market research services including customer surveys, competitive analysis, market sizing, segmentation, and consumer insights. Hire vetted market research analysts for actionable business intelligence."
      heroEyebrow="Market Research"
      heroTitle="Market Research Services | Data-Driven Business Insights"
      heroIntro="Every business decision—whether entering a new market, launching a product, or refining your marketing strategy—relies on one thing: accurate, actionable market intelligence. But conducting quality market research requires specialized skills in survey design, data collection, statistical analysis, and insight interpretation. Many businesses struggle to gather reliable customer feedback, understand their competition, or quantify market opportunities. TaskLynk connects you with vetted market research specialists—experts in qualitative research, quantitative surveys, competitive analysis, and consumer insights—who deliver data-driven intelligence that drives strategic decisions. With secure milestone payments, NDA protection, and dedicated project management, your market research is in expert hands."
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
                This service is for businesses that need data-driven market intelligence. <strong>Startups</strong> entering new markets or launching products who need market sizing, customer discovery research, and competitive analysis to validate their business model. <strong>Established businesses</strong> planning product expansions, market entries, or marketing campaigns that require customer insights, brand tracking, or pricing research. <strong>Marketing teams</strong> needing customer segmentation, campaign effectiveness studies, or customer satisfaction surveys. <strong>Product managers</strong> conducting concept testing, feature prioritization, or usability studies for product development. <strong>Investors and venture capitalists</strong> who need due diligence research on target markets and competitive landscapes. <strong>NGOs and government agencies</strong> conducting social impact assessments, policy evaluation research, or community needs assessments. <strong>Retailers and e-commerce businesses</strong> seeking customer behavior analysis, price sensitivity studies, and purchase journey mapping. <strong>Real estate developers</strong> needing location analysis, demand forecasting, and market feasibility studies.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need to understand your market—customer preferences, competitive landscape, market size, or growth opportunities—our market research service provides expert-level insights. We also support complementary services including <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">survey data analysis</Link>, <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis</Link>, and <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link> for investor-ready deliverables.
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
                What We Offer: Actionable Market Intelligence
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our market research service provides end-to-end research capabilities, from initial consultation and study design through data collection, analysis, and strategic recommendations. We begin with a <strong>research strategy consultation</strong> to understand your business objectives, decision context, and success metrics. Our specialists help you define research questions, select appropriate methodologies (quantitative, qualitative, or mixed methods), design study protocols, and establish timelines and budgets that deliver actionable insights within your constraints.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>quantitative research</strong>, we design and execute customer surveys, market sizing studies, segmentation analyses, and customer satisfaction research. We handle sample design and recruitment, questionnaire design with validated scales, survey deployment across online and offline channels, and statistical analysis producing cross-tabulations, regression models, and segmentation profiles. For <strong>qualitative research</strong>, we conduct in-depth interviews, focus groups, ethnographic studies, and concept testing sessions. Our specialists use professional moderation guides, conduct interviews in multiple languages, transcribe recordings, and perform thematic analysis to uncover deep consumer insights and behavioral patterns. For <strong>competitive analysis</strong>, we assess competitor positioning, pricing strategies, product features, marketing messaging, and go-to-market approaches, producing SWOT analysis and benchmarking reports.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Quantitative Research</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Surveys, market sizing, segmentation, customer satisfaction studies, and statistical analysis with actionable insights.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Qualitative Research</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Focus groups, in-depth interviews, ethnographic studies, concept testing, and thematic analysis for deep insights.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Competitive Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Competitor benchmarking, pricing analysis, positioning review, SWOT analysis, and go-to-market strategy assessment.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Consumer Insights</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Customer segmentation, journey mapping, preference analysis, and behavioral insights for data-driven decisions.
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
                Industries and Markets We've Researched
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our market research specialists have conducted studies across diverse industries and markets. For <strong>Kenyan financial services</strong>, we've conducted customer satisfaction surveys for banks, mobile money adoption studies, and microfinance market analysis across urban and rural populations. For <strong>agricultural markets</strong>, we've performed value chain analysis for coffee, tea, and horticultural exports, farmer behavior studies, and input market research across multiple regions. For <strong>retail and e-commerce</strong>, we've executed customer journey mapping for online shoppers, pricing sensitivity studies, and brand awareness tracking across Nairobi, Mombasa, and Kisumu markets. For <strong>healthcare</strong>, we've conducted patient satisfaction surveys for hospitals, healthcare access studies in rural communities, and telemedicine adoption research. For <strong>education technology</strong>, we've performed student and teacher needs assessments, EdTech adoption studies, and learning outcome evaluations. For <strong>hospitality and tourism</strong>, we've conducted visitor satisfaction surveys, destination branding research, and tourism impact assessments for Kenyan national parks and coastal regions.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For our research projects, we also provide <Link href="/services/data-analysis/survey-data-analysis" className="text-primary font-semibold hover:underline">statistical analysis of existing survey data</Link> and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link> for compelling insight presentation. For businesses needing ongoing market intelligence, we offer retainer-based research support through our <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">freelancer network</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures actionable insights, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your market research project</Link> today to be matched with a qualified specialist within hours.
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
                Why TaskLynk for Market Research
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Market research requires both methodological rigor and deep industry insight. A researcher who excels at statistical analysis may lack knowledge of Kenyan consumer behavior. A strategist with great industry intuition may not understand proper sampling or data validation. TaskLynk's marketplace connects you with market research specialists who combine rigorous methodology with domain expertise. Every research specialist in our network has completed at least 10 major market research projects, with verifiable client references and case studies demonstrating measurable business impact.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond methodological expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each research phase before payment. <strong>Dedicated project managers</strong> coordinate between you and the researcher, track progress against deliverables, and ensure insights align with your business objectives. <strong>NDA protection</strong> safeguards your market strategies and competitive intelligence. We also support complementary services including <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis</Link>, <Link href="/services/business/business-plans" className="text-primary font-semibold hover:underline">business plan writing</Link>, and <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link> for investor-ready market intelligence packages. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality research delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your market research project</Link> today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
