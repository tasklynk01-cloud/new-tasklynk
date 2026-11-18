import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calendar,
  Mail,
  Headphones,
  CheckCircle,
  Clock,
  ShieldCheck,
  Briefcase,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Virtual Assistance & Business Administration Services Kenya | TaskLynk',
  'Executive virtual assistance, calendar management, inbox zero, customer support desk, document preparation, and CRM administration handled by verified professionals under TaskLynk supervision.',
  '/services/virtual-assistance'
);

const faqs = [
  {
    question: 'How do you assign a virtual assistant to my business?',
    answer:
      'We assess your operational requirements, preferred working hours, and software stack, then match you with a vetted executive VA. A TaskLynk account manager supervises their onboarding and ongoing performance.',
  },
  {
    question: 'Can your virtual assistants manage my email and scheduling?',
    answer:
      'Yes. Our VAs are trained in executive inbox management, calendar coordination across global time zones (EAT, GMT, EST, PST), meeting minute drafting, and priority follow-ups.',
  },
  {
    question: 'Is my company data and client communication secure?',
    answer:
      'Yes. All virtual assistants operate under strict non-disclosure agreements and password managers (1Password / Bitwarden) ensuring zero exposure of your primary credentials.',
  },
];

const relatedServices = [
  { label: 'Accounting & Financial Support', href: '/services/accounting-support' },
  { label: 'Data Processing & Productivity', href: '/services/data-processing' },
  { label: 'Business Research & Intelligence', href: '/services/business-research' },
  { label: 'Professional Writing & Presentations', href: '/services/professional-writing' },
];

const deliverables = [
  {
    title: 'Executive Calendar & Schedule Management',
    description: 'Proactive meeting scheduling, buffer time planning, timezone conversion, and conflict resolution across Google Calendar and Outlook.',
    icon: Calendar,
  },
  {
    title: 'Email Inbox Management & Filtering',
    description: 'Achieve Inbox Zero with smart triage, automated labels, spam filtering, and drafting professional email responses.',
    icon: Mail,
  },
  {
    title: 'Customer Inquiries & Helpdesk Support',
    description: 'Courteous multi-channel client support via email, Zendesk, WhatsApp Business, and live chat desks.',
    icon: Headphones,
  },
  {
    title: 'CRM Maintenance & Operational Coordination',
    description: 'Keep contact records, sales pipelines, and task boards up to date in HubSpot, Salesforce, Notion, or Asana.',
    icon: Briefcase,
  },
];

export default async function VirtualAssistancePage() {
  const specialists = await getPublishedSpecialists({ category: 'admin', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/virtual-assistance"
      serviceSchemaName="Virtual Assistance and Business Administration Services"
      serviceSchemaDescription="Executive virtual assistance, calendar management, inbox triage, and CRM administrative support."
      heroEyebrow="Business Support"
      heroTitle="Virtual Assistance & Business Administration"
      heroIntro="Reclaim your time and scale your business operations without hiring full-time staff. TaskLynk provides accredited executive virtual assistants managed under strict reliability and confidentiality standards."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Virtual+Assistance"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Executive Leverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Focus on High-Value Growth While We Handle the Routine
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Administrative friction burns valuable leadership energy. Our dedicated virtual assistants keep your calendar, correspondence, and client inquiries moving seamlessly.
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
        title="Accredited Executive Virtual Assistants"
        subtitle="Meet verified executive assistants and administrative specialists from TaskLynk."
        specialists={specialists}
        serviceCategory="Virtual Assistance"
      />
    </ServicePageShell>
  );
}
