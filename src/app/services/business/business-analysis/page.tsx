import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, ClipboardCheck, Users, FileText, Search, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Business Analysis Services | Requirements & Process Optimization',
  'Professional business analysis services for requirements gathering, process mapping, workflow optimization, stakeholder analysis, and strategic planning. Hire vetted business analysts.',
  '/services/business/business-analysis'
);

const faqs = [
  {
    question: 'What does a business analyst do for my project?',
    answer: 'Our business analysts handle requirements gathering and documentation, stakeholder analysis and management, process mapping and workflow optimization, gap analysis, data analysis and interpretation, solution evaluation, and change management support. We translate business needs into clear, actionable requirements for technical teams and provide strategic recommendations based on data-driven insights.',
  },
  {
    question: 'Which industries do your business analysts specialize in?',
    answer: 'Our analysts have experience across technology, healthcare, finance, retail, manufacturing, logistics, education, telecommunications, government, and non-profit sectors. We match you with analysts who have domain expertise in your industry, ensuring they understand sector-specific challenges, regulations, and best practices.',
  },
  {
    question: 'What business analysis tools do you use?',
    answer: 'We use industry-standard tools including Microsoft Visio for process mapping, Lucidchart for collaborative diagrams, Jira and Confluence for requirements management, Trello and Monday.com for project tracking, Tableau and Power BI for data visualization, SQL for data querying, and various BPMN and UML modeling tools for process documentation.',
  },
  {
    question: 'Can you help with process improvement and optimization?',
    answer: 'Yes. We conduct process mapping to visualize current state workflows, identify bottlenecks, waste, and inefficiencies, and design improved future state processes. We use Lean Six Sigma methodologies, value stream mapping, root cause analysis, and change management frameworks to ensure sustainable process improvements with measurable benefits.',
  },
  {
    question: 'What documentation do you provide?',
    answer: 'We provide comprehensive documentation including business requirements documents (BRD), functional specifications, process maps, stakeholder analysis matrices, gap analysis reports, data flow diagrams, user stories, acceptance criteria, and implementation plans. All documentation follows industry standards and is tailored to your organization\'s needs.',
  },
  {
    question: 'How do you ensure requirements are complete and testable?',
    answer: 'We use SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound) for requirements definition, employ requirements traceability matrices, create detailed acceptance criteria for each requirement, and validate requirements with stakeholders through reviews and workshops. This ensures requirements are unambiguous, testable, and aligned with business objectives.',
  },
];

const relatedServices = [
  { label: 'Financial Analysis', href: '/services/business/financial-analysis' },
  { label: 'Market Research', href: '/services/business/market-research' },
  { label: 'Business Plan Writing', href: '/services/business/business-plans' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function BusinessAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/business/business-analysis"
      serviceSchemaName="Business Analysis Services"
      serviceSchemaDescription="Professional business analysis services for requirements gathering, process mapping, workflow optimization, stakeholder analysis, gap analysis, and strategic planning. Hire vetted business analysts."
      heroEyebrow="Business Analysis"
      heroTitle="Business Analysis Services | Requirements & Process Optimization"
      heroIntro="Every successful project starts with one thing: getting the requirements right. But unclear requirements, misaligned stakeholders, and poorly mapped processes are the silent killers of projects—causing delays, cost overruns, and solutions that miss the mark. TaskLynk connects you with vetted business analysts—experts in requirements gathering, process mapping, stakeholder management, and workflow optimization—who ensure your projects deliver real business value. With secure milestone payments, NDA protection, and dedicated project management, your business transformation is guided by analytical rigor."
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
                This service is for organizations initiating or managing change projects. <strong>Project managers</strong> who need business analysis support to define requirements, manage stakeholders, and ensure project deliverables align with business objectives. <strong>Department heads</strong> implementing new systems or processes who need process mapping and requirements analysis to ensure successful adoption. <strong>CEOs and executives</strong> driving digital transformation initiatives who need strategic analysis and change management support. <strong>IT teams</strong> working on software development projects who need clear, well-documented functional and technical requirements. <strong>Consulting firms</strong> who need business analysis augmentation for client engagements. <strong>SaaS companies</strong> developing new features or products who need user research, requirements gathering, and process optimization. <strong>Non-profit organizations</strong> implementing new program management systems or process improvements. <strong>Government agencies</strong> undergoing digital service transformation or process modernization initiatives.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need expert business analysis to define requirements, optimize processes, or manage stakeholder alignment, our service provides certified business analysts. We also support complementary services including <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">process automation</Link>, <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis</Link>, and <Link href="/services/data-analysis/data-analysis-services" className="text-primary font-semibold hover:underline">data analysis</Link> for comprehensive business optimization.
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
                What We Offer: Strategic Business Analysis and Process Optimization
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our business analysis service covers the complete project lifecycle from initial stakeholder engagement through requirements documentation to solution implementation and evaluation. We begin with <strong>stakeholder analysis and requirements elicitation</strong>—identifying all affected parties, understanding their needs and constraints, and conducting structured interviews, workshops, surveys, and observation sessions to gather comprehensive requirements. Our specialists use proven techniques including root cause analysis, SWOT analysis, and current state assessment to ensure all requirements are captured and validated against business objectives. This phase produces a stakeholder matrix, requirements traceability framework, and communication plan that aligns all parties around shared goals.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next, we conduct <strong>process mapping and analysis</strong>. Our specialists visualize current state workflows using BPMN notation, identify bottlenecks, redundancies, and inefficiencies, and design optimized future state processes that eliminate waste and improve throughput. We use Lean Six Sigma methodologies for process improvement, value stream mapping to identify non-value-added activities, and root cause analysis to address systemic issues rather than symptoms. For <strong>requirements documentation</strong>, we produce comprehensive Business Requirements Documents (BRD), functional specifications, user stories with acceptance criteria, and traceable requirement matrices. We also conduct <strong>gap analysis</strong> to identify discrepancies between current capabilities and desired outcomes, and <strong>solution evaluation</strong> to recommend options with cost-benefit analysis and implementation recommendations.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Requirements Gathering</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stakeholder interviews, workshops, surveys, and observation sessions to capture complete, unambiguous, testable business requirements.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Process Mapping</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Current state workflow visualization using BPMN, bottleneck identification, and future state process design with Lean Six Sigma methods.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Documentation &amp; Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  BRDs, functional specifications, user stories, gap analysis, and requirements traceability matrices with acceptance criteria.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Solution Evaluation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cost-benefit analysis, ROI estimation, feasibility assessment, and implementation roadmap with change management support.
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
                Industries and Methodologies We Apply
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our business analysts bring industry-specific expertise and proven methodologies to every engagement. In <strong>technology and software development</strong>, our specialists use Agile and Scrum methodologies, conduct user story mapping, facilitate sprint planning and retrospectives, and apply design thinking for product development. They hold certifications including CBAP (Certified Business Analysis Professional), PMI-PBA (Professionals for Management), and Agile Analysis certifications (IIBA-AEC, PMI-ACP).
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                In <strong>healthcare and life sciences</strong>, our analysts understand regulatory requirements (HIPAA, GDPR), clinical workflows, patient data management, and healthcare-specific process challenges. In <strong>financial services</strong>, we bring knowledge of compliance (SOX, Basel III, PCI-DSS), risk management frameworks, and financial process optimization. In <strong>manufacturing and supply chain</strong>, we apply Lean Six Sigma methodologies for process improvement and value stream mapping for operational efficiency. For <strong>non-profit and government</strong> organizations, we understand public sector processes, grant management, and social impact measurement. Our analysts use tools including JIRA, Confluence, Visio, Lucidchart, Power BI, Tableau, SQL, and specialized BPM tools. For projects requiring technical implementation, we collaborate with our <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web development</Link>, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link>, and <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">process automation</Link> teams to ensure requirements translate into successful delivery.
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
                Why TaskLynk for Business Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Poor requirements are cited as the primary cause of project failure in over 60% of business initiatives. The cost of fixing requirements errors increases exponentially the later they are discovered—up to 100x more expensive after deployment than during the requirements phase. TaskLynk's marketplace connects you with certified business analysts who have not only the credentials (CBAP, PMI-PBA, IIBA certifications) but also proven track records of successful project delivery across diverse industries. Every business analyst in our network has completed at least 15 major projects, with verifiable references and case studies demonstrating measurable business impact.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each deliverables phase before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the analyst, ensuring communication stays effective and deadlines are met. <strong>NDA protection</strong> safeguards your business strategies, processes, and confidential information. For comprehensive business optimization, we also offer <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis and modeling</Link>, <Link href="/services/business/market-research" className="text-primary font-semibold hover:underline">market research</Link>, and <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">process automation</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality business analysis delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your business analysis project</Link> today to be matched with a qualified analyst within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
