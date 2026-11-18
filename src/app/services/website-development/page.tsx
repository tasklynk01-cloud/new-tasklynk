import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Code2,
  Globe,
  Smartphone,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Website & Web Development Services Kenya | Managed Engineering | TaskLynk',
  'Custom corporate websites, high-converting landing pages, e-commerce stores, and Next.js web applications engineered for speed, SEO, and security. Handled by verified Kenyan engineers under dedicated project management.',
  '/services/website-development'
);

const faqs = [
  {
    question: 'What types of websites does TaskLynk build?',
    answer:
      'We develop responsive corporate websites, high-converting lead generation landing pages, e-commerce storefronts (Shopify, WooCommerce, custom Next.js), customer portals, and full-stack web applications with modern tech stacks including Next.js, React, Node.js, and Tailwind CSS.',
  },
  {
    question: 'How does the TaskLynk managed delivery process work for web projects?',
    answer:
      'You submit your project requirements and receive a scoped brief with fixed milestone pricing. TaskLynk assigns an accredited full-stack engineer and pairs the project with a dedicated technical manager who verifies code quality, UI responsiveness, security, and mobile performance before every milestone release.',
  },
  {
    question: 'Are SEO and mobile responsiveness included?',
    answer:
      'Yes. Every web project adheres to modern technical SEO best practices, including semantic HTML5, Core Web Vitals optimization, Open Graph tags, JSON-LD Schema markup, and fully responsive layouts tested across mobile, tablet, and desktop viewports.',
  },
  {
    question: 'How are payments handled?',
    answer:
      'Payments are held securely in milestone escrow. You only release funds after testing and approving the staging site for each agreed development sprint.',
  },
  {
    question: 'Do you provide hosting and post-launch maintenance?',
    answer:
      'Yes. We provide complete domain DNS configuration, SSL provisioning, Vercel/Cloudflare/AWS hosting setup, and ongoing website maintenance contracts for software updates, backups, and performance monitoring.',
  },
];

const relatedServices = [
  { label: 'Software Development & Systems', href: '/services/software-development' },
  { label: 'Systems & API Integration', href: '/services/systems-integration' },
  { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
  { label: 'Data Analytics & Dashboards', href: '/services/data-analytics' },
  { label: 'Virtual Assistance Support', href: '/services/virtual-assistance' },
];

const deliverables = [
  {
    title: 'Corporate & Business Websites',
    description: 'Bespoke multi-page company websites engineered to establish market authority, communicate value propositions, and drive inbound business inquiries.',
    icon: Globe,
  },
  {
    title: 'High-Converting Landing Pages',
    description: 'Fast, lightweight single-page funnels optimized for Google Ads, social campaigns, and maximum visitor lead capture.',
    icon: Zap,
  },
  {
    title: 'E-Commerce Platforms & M-Pesa Stores',
    description: 'Complete online storefronts with seamless Daraja M-Pesa STK push, card payments, inventory management, and automated receipting.',
    icon: Smartphone,
  },
  {
    title: 'Custom Web Applications',
    description: 'Dynamic database-driven web platforms, user portals, administrative dashboards, and SaaS MVPs with Next.js and PostgreSQL.',
    icon: Code2,
  },
  {
    title: 'Website Redesigns & Speed Audits',
    description: 'Modernize legacy websites with clean UI/UX, sub-second load times, mobile-first layouts, and WCAG accessibility standards.',
    icon: Layers,
  },
  {
    title: 'Continuous Maintenance & DevOps',
    description: 'Proactive security patching, automated daily backups, uptime monitoring, and managed cloud deployments.',
    icon: Server,
  },
];

export default async function WebsiteDevelopmentPage() {
  const specialists = await getPublishedSpecialists({ category: 'web', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/website-development"
      serviceSchemaName="Website and Web Development Services"
      serviceSchemaDescription="Enterprise web development and custom business websites engineered by vetted developers under TaskLynk managed delivery."
      heroEyebrow="Technology & Development"
      heroTitle="Website & Web Development Services"
      heroIntro="Get custom business websites, e-commerce storefronts, and full-stack web applications engineered for speed, search visibility, and conversions. Handled by accredited developers with dedicated project management and milestone escrow protection."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Website+Development"
    >
      {/* Deliverables Section */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Web Solutions Engineered for Measurable Business Growth
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              We manage every phase of web development from technical scoping and interface architecture to database engineering, payment integration, and cloud deployment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Team Showcase */}
      <ServiceTeamShowcase
        title="Accredited Software & Web Specialists"
        subtitle="Meet verified software engineers from the TaskLynk team assigned to web and systems development."
        specialists={specialists}
        serviceCategory="Website Development"
      />

      {/* Tech Stack & Standards */}
      <section className="py-16 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#5B3594] dark:text-[#FF7A3D] mb-2 block">
                Engineering Standards
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Modern Architectures Built for Scalability
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We avoid fragile legacy builders and outdated plugins. Our web solutions are developed using modern TypeScript, Next.js, and serverless backends designed for enterprise reliability and peak traffic performance.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>TypeScript &amp; Next.js 14+ Server Components</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>M-Pesa Daraja API &amp; Stripe Payment Gateways</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sub-second page speeds with Core Web Vitals passing 95+</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated CI/CD deployments and SSL certificates</span>
                </div>
              </div>
            </div>

            <div className="linen-card rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Project Pricing Guidance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every project is scoped transparently before development commences. Fixed-price milestone contracts ensure zero budget surprises.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-border/40 text-xs sm:text-sm">
                  <span className="font-semibold">Landing Page &amp; Funnel</span>
                  <span className="font-bold text-[#FF7A3D]">From KSh 15,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40 text-xs sm:text-sm">
                  <span className="font-semibold">Corporate Website (5-8 pages)</span>
                  <span className="font-bold text-[#FF7A3D]">From KSh 35,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40 text-xs sm:text-sm">
                  <span className="font-semibold">E-Commerce &amp; M-Pesa Store</span>
                  <span className="font-bold text-[#FF7A3D]">From KSh 55,000</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs sm:text-sm">
                  <span className="font-semibold">Custom Web Portal / SaaS</span>
                  <span className="font-bold text-[#FF7A3D]">Custom Scope</span>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl">
                  <Link href="/client/new-job?service=Website+Development">
                    <span>Submit Your Web Project Brief</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
