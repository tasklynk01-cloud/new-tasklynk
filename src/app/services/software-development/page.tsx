import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  Terminal,
  Code2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Software Development & Systems Engineering | TaskLynk Kenya',
  'Custom software engineering, cloud APIs, microservices, database architecture, and automation systems delivered by accredited engineers under managed quality assurance.',
  '/services/software-development'
);

const faqs = [
  {
    question: 'What types of software does TaskLynk develop?',
    answer:
      'We engineer custom business software, REST & GraphQL APIs, internal operation tools, CRM/ERP extensions, background automation workers, database synchronization pipelines, and software integrations.',
  },
  {
    question: 'How do you guarantee software quality and security?',
    answer:
      'Every codebase is built with strict TypeScript type-checking, comprehensive integration tests, parameterized SQL queries to prevent injections, and peer-reviewed by senior technical leads before staging deployment.',
  },
  {
    question: 'Who owns the intellectual property (IP)?',
    answer:
      'You retain 100% full intellectual property and ownership of the source code, documentation, and database assets upon project completion and milestone release.',
  },
  {
    question: 'How does milestone-based delivery work?',
    answer:
      'We divide the software architecture into measurable sprint milestones (e.g. Schema & Auth -> Business Logic & APIs -> UI Integration & QA). Funds are held in TaskLynk escrow and released only upon your approval.',
  },
];

const relatedServices = [
  { label: 'Website & Web Development', href: '/services/website-development' },
  { label: 'Systems & API Integration', href: '/services/systems-integration' },
  { label: 'Data Analytics & Statistics', href: '/services/data-analytics' },
  { label: 'Data Processing & Productivity', href: '/services/data-processing' },
];

const deliverables = [
  {
    title: 'Custom Backend & REST/GraphQL APIs',
    description: 'High-performance API backends built on Node.js, Python, or Go with secure authentication and granular role-based access control.',
    icon: Terminal,
  },
  {
    title: 'Relational & Distributed Database Design',
    description: 'Normalized PostgreSQL, MySQL, and Supabase database architectures optimized with indexing, triggers, and automated backups.',
    icon: Database,
  },
  {
    title: 'Internal Admin Tools & Portals',
    description: 'Tailored operational dashboards, order processing panels, and administrative tools that reduce manual staff overhead.',
    icon: Layers,
  },
  {
    title: 'Cloud Infrastructure & Microservices',
    description: 'Containerized Docker deployments, serverless functions, and distributed worker queues with Redis and Cloudflare Workers.',
    icon: Cpu,
  },
];

export default async function SoftwareDevelopmentPage() {
  const specialists = await getPublishedSpecialists({ category: 'software', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/software-development"
      serviceSchemaName="Software Development and Systems Engineering"
      serviceSchemaDescription="Enterprise custom software engineering, API development, and distributed systems by accredited TaskLynk engineers."
      heroEyebrow="Technology & Development"
      heroTitle="Software Development & Systems Engineering"
      heroIntro="Build reliable, scalable software systems tailored to your business operations. Our accredited software engineers and technical leads handle end-to-end architecture, API design, database modeling, and automated testing under milestone escrow."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Software+Development"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Engineering Disciplines
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Software Solutions Built for Robustness &amp; Longevity
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              We manage the entire software development lifecycle so you don’t have to wrangle independent freelancers or compromise on security.
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
        title="Accredited Software Engineering Specialists"
        subtitle="Vetted backend and full-stack software engineers from the TaskLynk technical team."
        specialists={specialists}
        serviceCategory="Software Development"
      />

      <section className="py-16 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="linen-card rounded-3xl p-8 max-w-3xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-black text-foreground">Ready to Build Your Software System?</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Share your technical brief or requirements document. A dedicated technical project manager will review your specifications and assign an accredited engineering team.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-2xl px-8">
                <Link href="/client/new-job?service=Software+Development">
                  <span>Submit Software Brief</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
