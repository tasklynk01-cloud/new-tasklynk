import type { Metadata } from 'next';
import Link from 'next/link';
import { Cog, Workflow, BarChart3, Database, ShieldCheck, Clock, Users, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Process Automation Services | RPA & Workflow Automation',
  'Hire vetted automation specialists for RPA (UiPath, Automation Anywhere, Blue Prism), workflow automation, business process automation, and data pipeline development. Secure milestone payments.',
  '/services/technical/automation-services'
);

const faqs = [
  {
    question: 'What automation platforms do you specialize in?',
    answer: 'Our specialists work with UiPath, Automation Anywhere, Blue Prism, Microsoft Power Automate, Zapier, Make (Integromat), n8n, and custom Python/RPA scripts. We also handle workflow automation using tools like Airflow, Prefect, and custom orchestrators. We select the best platform based on your requirements, infrastructure, and budget.',
  },
  {
    question: 'What processes can be automated?',
    answer: 'We automate repetitive digital tasks including data entry and form filling, email processing and routing, invoice generation and processing, report generation and distribution, file transfers and conversions, system monitoring and alerting, customer onboarding workflows, inventory updates, and data synchronization across multiple systems. Any repetitive, rule-based digital process is a candidate for automation.',
  },
  {
    question: 'Do you handle integration between different systems?',
    answer: 'Yes. We integrate with ERP systems (SAP, Oracle, NetSuite), CRM platforms (Salesforce, HubSpot), email platforms (Outlook, Gmail), cloud storage (Google Drive, SharePoint, Dropbox), databases, APIs, and legacy systems. We build connectors and workflows that synchronize data across platforms, automate cross-system processes, and provide unified dashboards for monitoring.',
  },
  {
    question: 'How do you measure ROI from automation?',
    answer: 'We establish baseline metrics before automation (time spent, error rate, cost per task) and track improvements after deployment. Typical ROI metrics include time savings (hours reclaimed per week), error reduction (accuracy improvement), cost savings (labor cost reduction), and throughput increase (tasks processed per hour). Most clients see ROI within 3-6 months of deployment.',
  },
  {
    question: 'Do you provide ongoing maintenance and support?',
    answer: 'Yes. We provide post-deployment support including process monitoring, error handling and recovery, performance optimization, and updates for changing business requirements. We offer retainer-based support packages, on-demand troubleshooting, and training for your team to manage and maintain automated processes independently.',
  },
  {
    question: 'Is automation secure?',
    answer: 'We follow security best practices including credential management using vaults or encrypted storage, least-privilege access control, audit logging, compliance with data protection regulations (GDPR, HIPAA), and secure deployment configurations. All automation workflows are designed with security as a fundamental requirement, not an afterthought.',
  },
];

const relatedServices = [
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'API Development', href: '/services/technical/api-development' },
  { label: 'AI Development Services', href: '/services/technical/ai-development' },
  { label: 'Database Services', href: '/services/technical/database-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function AutomationServicesPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/technical/automation-services"
      serviceSchemaName="Process Automation Services"
      serviceSchemaDescription="RPA and workflow automation services using UiPath, Automation Anywhere, Power Automate, Zapier, and custom scripts. Business process automation, data pipeline development, and system integration with secure milestone payments."
      heroEyebrow="Process Automation"
      heroTitle="Process Automation Services | RPA & Workflow Automation"
      heroIntro="Time spent on repetitive tasks is time stolen from strategic work, innovation, and growth. Every manual data entry, email routing, report generation, and form filling wastes hours that could be invested in higher-value activities. TaskLynk connects you with vetted automation specialists—experts in RPA (UiPath, Automation Anywhere, Blue Prism), workflow automation, and business process automation—who eliminate the busywork and accelerate your operations. With secure milestone payments, real-time collaboration, and dedicated project management, your processes are automated with reliability and security."
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
                This service is for businesses and teams burdened by repetitive digital tasks. <strong>Finance teams</strong> dealing with invoice processing, report generation, reconciliation, and expense tracking that consume countless hours. <strong>HR departments</strong> managing employee onboarding, benefits enrollment, payroll data entry, and candidate screening workflows. <strong>Customer service teams</strong> handling ticket routing, response generation, and data entry from customer communications. <strong>IT operations</strong> teams performing system monitoring, log analysis, user account provisioning, and routine maintenance tasks. <strong>E-commerce businesses</strong> managing order processing, inventory updates, price synchronization, and shipping label generation. <strong>Marketing teams</strong> running social media posting, email campaign setup, lead data entry, and analytics report generation. <strong>Administrative assistants</strong> performing document formatting, file organization, calendar management, and data transfer between systems. <strong>Small business owners</strong> who spend too much time on operational tasks that could be automated.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you have repetitive, rule-based digital processes that consume time and introduce error risk, our automation service provides the expertise to eliminate the busywork. We also support complementary services including <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web development</Link> for custom workflow tools, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link> for system integration, and <Link href="/services/business/business-analysis" className="text-primary font-semibold hover:underline">business analysis</Link> for process mapping and optimization.
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
                What We Offer: End-to-End Automation from Discovery to Deployment
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our automation service follows a structured approach that ensures measurable ROI and sustainable results. We begin with a <strong>process discovery and assessment</strong> phase—mapping your current workflows, identifying automation opportunities, quantifying time and cost savings, and prioritizing processes for automation. Our specialists conduct stakeholder interviews, observe current processes firsthand, and measure baseline metrics (hours spent, error rates, cost per transaction). This phase produces a detailed automation roadmap with ROI projections, timeline estimates, and technology recommendations tailored to your infrastructure and budget.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next, we design the <strong>automation architecture</strong>—selecting the appropriate platform (RPA, workflow automation, custom scripting) based on your processes, choosing integration methods for connecting disparate systems, designing error handling and exception management workflows, and planning for scalability. For <strong>RPA (Robotic Process Automation)</strong> projects, our specialists use UiPath, Automation Anywhere, or Blue Prism to automate rule-based tasks like data entry, form filling, email processing, and report generation by mimicking human interactions with digital systems. For <strong>workflow automation</strong>, we use Microsoft Power Automate, Zapier, Make, or n8n to create automated workflows that connect applications, route approvals, and trigger actions based on events. For <strong>data pipeline automation</strong>, we use Apache Airflow, Prefect, or custom scripts to schedule, orchestrate, and monitor data processing workflows that move and transform data across systems.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Cog className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">RPA Automation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  UiPath, Automation Anywhere, Blue Prism for automating repetitive UI-based tasks with bots that mimic human actions.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Workflow Automation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Power Automate, Zapier, n8n for connecting apps and automating multi-step business processes with triggers and approvals.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Pipelines</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Airflow, Prefect for scheduling and orchestrating data ETL/ELT workflows with monitoring and alerting.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Secure Implementation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Credential vaults, audit logging, least-privilege access, and compliance with GDPR/HIPAA data protection standards.
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
                Industries and Use Cases We've Automated
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our automation specialists have delivered solutions across diverse industries. For <strong>financial services</strong>, we've automated loan application processing, invoice reconciliation, report generation, and compliance monitoring—reducing processing time from 3 days to 3 hours. For <strong>healthcare</strong>, we've automated patient appointment reminders, medical report generation, insurance claim processing, and inventory tracking for medical supplies. For <strong>retail and e-commerce</strong>, we've automated order processing, inventory synchronization across platforms, price updates, shipping label generation, and return processing. For <strong>manufacturing</strong>, we've automated production report generation, quality control data entry, supplier onboarding workflows, and equipment maintenance scheduling.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>professional services</strong> including law firms, we've automated client intake processing, document assembly, time tracking, and billing workflows. For <strong>education</strong>, we've automated student enrollment processing, grade posting, transcript generation, and course scheduling. For <strong>NGOs</strong>, we've automated grant reporting, beneficiary registration, donation processing, and impact measurement data collection. These real-world projects demonstrate measurable ROI—typically 50-80% time savings and 90%+ error reduction. For teams needing <Link href="/services/business/business-analysis" className="text-primary font-semibold hover:underline">business analysis support</Link> to identify automation opportunities, or <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API integration services</Link> for connecting disparate systems, our network includes specialists who can assess and automate complex cross-system workflows.
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
                Why TaskLynk for Process Automation
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Automation projects fail not because the technology is difficult, but because the process understanding, change management, and post-deployment support are inadequate. TaskLynk's marketplace connects you with automation specialists who have deep experience in both the technical implementation and the organizational change management required for successful automation. Every automation specialist in our network has completed at least 5 end-to-end RPA or workflow automation projects in production environments, with verifiable client references and ROI documentation.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each phase (discovery, design, implementation, testing, deployment) before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the specialist, track progress against milestones, and ensure the automation meets your business requirements. <strong>Secure credential management</strong> ensures sensitive login credentials and API keys are handled with enterprise-grade security. For complex projects, we can also provide <Link href="/services/business/business-analysis" className="text-primary font-semibold hover:underline">business process analysis</Link>, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API integration</Link>, and <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">custom web applications</Link> to support your automation infrastructure. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures successful deployment, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your automation project</Link> today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
