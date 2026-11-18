import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Calendar, Mail, FileText, Users, Search, ShieldCheck, BarChart3 } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Virtual Assistant Services | Admin & Business Support',
  'Professional virtual assistant services for administrative tasks, email management, calendar scheduling, data entry, customer support, and business operations. Hire vetted virtual assistants.',
  '/services/business/virtual-assistance'
);

const faqs = [
  {
    question: 'What tasks can a virtual assistant help with?',
    answer: 'Our virtual assistants handle a wide range of administrative and business tasks including email management, calendar scheduling, data entry, travel booking, document preparation, social media management, customer support, research, invoice processing, project coordination, lead generation, and online data research. We match you with assistants who have expertise in your specific task areas.',
  },
  {
    question: 'What time zones do your virtual assistants cover?',
    answer: 'We have virtual assistants across multiple time zones including East Africa (EAT), West Africa (WAT), Europe (GMT/CET/EEST), and North America (EST/PST). You can specify your preferred working hours and time zone overlap when posting a project, and we match you with assistants who can accommodate your schedule.',
  },
  {
    question: 'Do you provide ongoing support or just one-off tasks?',
    answer: 'Both. We offer project-based support for specific tasks, as well as ongoing retainer arrangements for regular support. Many clients retain virtual assistants on a part-time or full-time equivalent basis for 10-40 hours per week of administrative support. We handle both short-term projects and long-term partnerships.',
  },
  {
    question: 'How do you ensure quality and confidentiality?',
    answer: 'All virtual assistants sign our comprehensive confidentiality agreement before starting any work. We use secure file sharing, encrypted communication channels, and role-based access control. We also implement quality control measures including task checklists, review processes, and regular performance monitoring to ensure consistent quality standards.',
  },
  {
    question: 'What software and tools do your assistants use?',
    answer: 'Our assistants are proficient in professional software including Microsoft Office Suite (Word, Excel, PowerPoint, Outlook), Google Workspace (Docs, Sheets, Slides, Gmail), project management tools (Asana, Trello, Monday.com, ClickUp), CRM systems (Salesforce, HubSpot), communication tools (Slack, Zoom), and specialized tools relevant to specific tasks. We can work with your preferred tools or recommend appropriate solutions.',
  },
  {
    question: 'Do you handle sensitive or confidential information?',
    answer: 'Yes. All assistants handling sensitive information have enhanced background checks and sign additional confidentiality agreements. We implement secure data handling protocols, encrypted storage, access controls, and audit trails. For highly sensitive work, we offer air-gapped workflows and on-premises coordination options.',
  },
];

const relatedServices = [
  { label: 'Business Plan Writing', href: '/services/business/business-plans' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'Market Research', href: '/services/business/market-research' },
  { label: 'Excel Data Analysis', href: '/services/data-analysis/excel-data-analysis' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function VirtualAssistancePage() {
  return (
    <ServicePageShell
      canonicalPath="/services/business/virtual-assistance"
      serviceSchemaName="Virtual Assistant Services"
      serviceSchemaDescription="Professional virtual assistant services for administrative tasks, email management, calendar scheduling, data entry, customer support, and business operations. Hire vetted virtual assistants."
      heroEyebrow="Virtual Assistants"
      heroTitle="Virtual Assistant Services | Admin &amp; Business Support"
      heroIntro="Time spent on routine administrative tasks is time stolen from strategic work—the activities that actually drive growth, innovation, and value creation. But finding reliable, skilled virtual assistants who understand your business context, communicate professionally, and handle confidential information with discretion is a challenge. TaskLynk connects you with vetted virtual assistants—professionals skilled in administrative support, email management, calendar coordination, data entry, customer support, and business operations—who free up your time for what matters most. With secure milestone payments, NDA protection, and dedicated project management, your administrative tasks are handled professionally and reliably."
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
                This service is for professionals and businesses that need reliable administrative support. <strong>Busy entrepreneurs and startup founders</strong> who need to delegate administrative tasks like email management, calendar scheduling, travel booking, and data entry to free up time for strategic activities. <strong>Executives and senior managers</strong> who need executive-level virtual support for correspondence, report preparation, meeting coordination, and stakeholder communication. <strong>Small business owners</strong> who don't have full-time administrative staff but need consistent support for daily operations, customer inquiries, and administrative tasks. <strong>Consultants and freelancers</strong> who need project coordination, invoicing support, proposal preparation, and client communication management. <strong>Remote teams</strong> and <strong>distributed organizations</strong> that need virtual administrative support across time zones. <strong>Real estate agents</strong> who need client communication, appointment scheduling, document preparation, and listing management support. <strong>Healthcare professionals</strong> who need appointment scheduling, patient communication, and records management support. <strong>E-commerce businesses</strong> needing order processing, customer support, inventory tracking, and product listing management.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need reliable, professional virtual assistance for administrative and business support tasks, our service provides vetted talent matched to your specific needs. We also support complementary services including <Link href="/services/business/business-analysis" className="text-primary font-semibold hover:underline">business analysis</Link>, <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">process automation</Link> for routine tasks, and <Link href="/services/data-analysis/excel-data-analysis" className="text-primary font-semibold hover:underline">Excel data analysis</Link> for spreadsheet-based support. For ongoing virtual assistant support, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our freelancer network</Link> to connect with clients needing regular assistance.
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
                What We Offer: Professional Administrative and Business Support
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our virtual assistant service provides comprehensive administrative and business support across all major operational areas. We begin with a <strong>detailed onboarding process</strong> to understand your specific requirements, preferred tools, communication style, working hours, and quality standards. Our specialists then provide <strong>email and communication management</strong>—handling inbox organization, email drafting and response, correspondence triage, and professional communication with clients, suppliers, and stakeholders. We also manage <strong>calendar and scheduling</strong> including meeting coordination, appointment booking, travel logistics, and event planning with attention to time zone coordination and conflict resolution.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>data management and entry</strong>, our assistants handle spreadsheet creation and formatting, database entry, data cleansing and validation, report generation, and document preparation using Microsoft Office and Google Workspace. We also provide <strong>customer support</strong> including email and chat response, order processing, complaint resolution, and CRM system updates. For <strong>research and administrative tasks</strong>, our assistants conduct online research, compile information summaries, prepare presentations, and manage project documentation. All virtual assistants are matched to your specific needs based on their demonstrated expertise, tool proficiency, and communication skills. We also offer <strong>ongoing support arrangements</strong> for regular weekly or monthly assistance, with dedicated assistants who become familiar with your systems and preferences over time.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Email &amp; Communication</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Inbox management, professional email drafting, correspondence triage, and stakeholder communication with brand-consistent tone.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Calendar &amp; Scheduling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Meeting coordination, appointment booking, travel logistics, and event planning with time zone coordination and conflict resolution.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data &amp; Document Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Data entry, spreadsheet management, report generation, document preparation, and file organization across cloud platforms.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Research &amp; Support</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Online research, information compilation, customer support, CRM updates, and administrative task execution with quality assurance.
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
                Ongoing Support and Retainer Options
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For clients who need regular administrative support, we offer flexible retainer arrangements that provide consistent, reliable assistance. <strong>Part-time retainers</strong> (10-20 hours per week) are ideal for solopreneurs, small business owners, and busy professionals who need regular administrative support without the cost of a full-time employee. <strong>Full-time equivalent retainers</strong> (20-40 hours per week) are perfect for growing businesses, remote teams, and organizations that need dedicated administrative coverage. <strong>Project-based arrangements</strong> are suitable for specific initiatives like event planning, data cleanup projects, or one-time administrative tasks.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Retainer clients benefit from a <strong>deduplicated workflow</strong> where the same virtual assistant becomes familiar with your systems, preferences, and communication style over time. This familiarity improves efficiency and quality, as the assistant learns your processes and anticipates your needs. We also provide <strong>backup coverage</strong> for illness or vacation, ensuring continuity of support. For businesses needing <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">process automation</Link> alongside virtual assistance, we can also recommend automation specialists who handle routine tasks through RPA and workflow tools. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures quality virtual assistance with transparent communication. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your virtual assistant project</Link> today to be matched with a qualified assistant within hours. For virtual assistants seeking opportunities, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link>.
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
                Why TaskLynk for Virtual Assistant Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Generic virtual assistant platforms often match you with generalists who lack industry knowledge or communication skills. TaskLynk's marketplace takes a different approach—connecting you with vetted virtual assistants who have demonstrated expertise in your specific task areas, whether that's executive support, customer service, data management, or research. Every virtual assistant in our network has passed a rigorous screening process including skills assessments, communication evaluations, tool proficiency tests, and reference verification. We also match based on industry experience, ensuring your assistant understands the context of your work.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond quality vetting, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each task or period before payment is released. <strong>Dedicated project managers</strong> monitor quality, facilitate communication, and ensure your requirements are met. <strong>NDA protection</strong> safeguards your business information, client data, and confidential materials. We also offer <strong>ongoing retainer support</strong> for consistent, reliable assistance that grows more efficient over time. For complementary business services, see our <Link href="/services/business/business-analysis" className="text-primary font-semibold hover:underline">business analysis</Link>, <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link>, and <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">process automation</Link> services. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality virtual assistance, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your virtual assistant project</Link> today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
