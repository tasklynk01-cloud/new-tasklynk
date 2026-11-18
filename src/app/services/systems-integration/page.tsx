import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Network,
  Workflow,
  Share2,
  ShieldCheck,
  Zap,
  RefreshCw,
  Database,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Systems Integration & API Automation Services | TaskLynk Kenya',
  'Connect your disparate CRM, ERP, M-Pesa, accounting, and cloud databases with reliable automated workflows and API pipelines managed by TaskLynk.',
  '/services/systems-integration'
);

const faqs = [
  {
    question: 'What systems and software can TaskLynk integrate?',
    answer:
      'We integrate CRMs (HubSpot, Salesforce, Zoho), ERP platforms, M-Pesa Daraja APIs, accounting software (QuickBooks, Xero), payment gateways, Google Workspace, Zapier/Make automation engines, and custom databases.',
  },
  {
    question: 'How do you handle data security during system integrations?',
    answer:
      'All integrations follow strict security protocols including OAuth 2.0, encrypted webhooks (HMAC verification), token rotation, rate-limiting, and zero logging of confidential client payload data.',
  },
  {
    question: 'What happens if an third-party API service goes down?',
    answer:
      'Our engineers implement resilient retry mechanisms with exponential backoff, dead-letter queues, and real-time failure alerts to prevent data loss during third-party platform downtime.',
  },
];

const relatedServices = [
  { label: 'Software Development & APIs', href: '/services/software-development' },
  { label: 'Website & Web Development', href: '/services/website-development' },
  { label: 'Data Analytics & Statistics', href: '/services/data-analytics' },
  { label: 'Virtual Assistance Support', href: '/services/virtual-assistance' },
];

const deliverables = [
  {
    title: 'Payment & M-Pesa Daraja Integrations',
    description: 'Instant STK push, automated C2B confirmation, B2C disbursements, and seamless reconciliation with your central ledger.',
    icon: Zap,
  },
  {
    title: 'CRM & ERP Synchronization',
    description: 'Bi-directional data sync between lead management, sales funnels, inventory systems, and customer communication channels.',
    icon: Share2,
  },
  {
    title: 'Automated Business Workflows',
    description: 'Eliminate repetitive manual tasks by automating invoice dispatch, document generation, onboarding triggers, and email sequences.',
    icon: Workflow,
  },
  {
    title: 'Database ETL & Data Pipelines',
    description: 'Scheduled batch sync and streaming pipelines that extract, transform, and load business data into central reporting data warehouses.',
    icon: Database,
  },
];

export default async function SystemsIntegrationPage() {
  const specialists = await getPublishedSpecialists({ category: 'software', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/systems-integration"
      serviceSchemaName="Systems Integration and API Automation"
      serviceSchemaDescription="Enterprise systems integration, automated data workflows, and custom API pipelines by TaskLynk."
      heroEyebrow="Technology & Development"
      heroTitle="Systems & API Integration Services"
      heroIntro="Connect your business software into a synchronized ecosystem. TaskLynk engineers build custom API bridges, automate data synchronization between platforms, and eliminate manual data entry with guaranteed reliability."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Systems+Integration"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Automated Connectivity
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Unify Your Software Stack &amp; Automate Manual Work
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Disjointed software slows down operations and introduces human error. We integrate your tools so your data flows accurately in real time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.title}
                className="linen-card rounded-2xl p-6 hover:border-[#FF7A3D] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceTeamShowcase
        title="Integration & DevOps Specialists"
        subtitle="Vetted technical specialists from TaskLynk who design and maintain reliable software integrations."
        specialists={specialists}
        serviceCategory="Systems Integration"
      />
    </ServicePageShell>
  );
}
