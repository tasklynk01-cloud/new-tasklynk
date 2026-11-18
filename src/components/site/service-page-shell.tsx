import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  FileCheck,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { UniversityCurriculumBadges } from '@/components/site/university-curriculum-badges';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { siteConfig, generateBreadcrumbSchema } from '@/lib/seo-config';
import { generateRichServiceSchema } from '@/lib/rich-snippets';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedService {
  label: string;
  href: string;
}

export interface ServicePageShellProps {
  canonicalPath: string;
  serviceSchemaName: string;
  serviceSchemaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  faqs: FAQItem[];
  relatedServices: RelatedService[];
  children: ReactNode;
  ctaHref?: string;
}

const howItWorksSteps = [
  {
    step: '1',
    icon: FileCheck,
    title: 'Post Your Project',
    desc: 'Share your requirements, budget, and timeline. We vet the brief and match you with qualified specialists.',
  },
  {
    step: '2',
    icon: Users,
    title: 'Dedicated Manager Assignment',
    desc: 'Receive matched proposals from vetted specialists. Compare profiles, portfolios, and reviews in real time.',
  },
  {
    step: '3',
    icon: CheckCircle,
    title: 'Approve & Pay',
    desc: 'Approve milestones and release payments securely. We hold funds in escrow until every deliverable meets your standards.',
  },
];

const trustBadges = [
  { icon: ShieldCheck, label: 'Vetted & Certified Specialists', color: 'text-emerald-500' },
  { icon: Clock, label: '24/7 Dedicated Project Managers', color: 'text-[#5B3594] dark:text-[#EFE8F8]' },
  { icon: FileCheck, label: 'Secure Milestone Escrow', color: 'text-[#FF7A3D]' },
  { icon: Users, label: 'NDA & IP Protection', color: 'text-[#5B3594] dark:text-[#EFE8F8]' },
];

export function generateServicePageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  return {
    title,
    description,
    ...generateCanonicalMetadata(path, {
      openGraph: {
        title,
        description,
        siteName: siteConfig.name,
        locale: 'en_KE',
      },
      twitter: {
        title,
        description,
        card: 'summary_large_image',
      },
    }),
  };
}

export function ServicePageShell({
  canonicalPath,
  serviceSchemaName,
  serviceSchemaDescription,
  heroEyebrow,
  heroTitle,
  heroIntro,
  faqs,
  relatedServices,
  children,
  ctaHref = '/register/client',
}: ServicePageShellProps) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  const serviceJsonLd = generateRichServiceSchema({
    name: serviceSchemaName,
    serviceType: serviceSchemaName,
    description: serviceSchemaDescription,
    canonicalPath,
    areaServed: ['Nairobi', 'Kenya'],
    aggregateRating: {
      ratingValue: 4.9,
      reviewCount: 218,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      lowPrice: 1500,
      highPrice: 35000,
      priceCurrency: 'KES',
      offerCount: 8,
    },
  });

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: heroTitle,
    description: serviceSchemaDescription,
    url: `${siteConfig.url}${canonicalPath}`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  };

  const breadcrumbJsonLd = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: heroEyebrow, url: canonicalPath },
  ]);

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      {/* JSON-LD Structured Data */}
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-transparent border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
          {/* Active 3D Glowing Silk Wave Engine */}
          <StripeGradientMesh
            mode="hero"
            heightClass="h-[1400px]"
            className="inset-x-0 top-0 opacity-100 dark:opacity-90 pointer-events-none"
          />

          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">{heroEyebrow}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              {heroIntro}
            </p>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 bg-white dark:bg-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="linen-card flex items-center justify-center gap-2.5 p-3.5 rounded-2xl"
                >
                  <badge.icon className={`w-5 h-5 ${badge.color} shrink-0`} />
                  <span className="text-xs sm:text-sm font-bold text-[#22183D] dark:text-white">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content (page-specific) */}
        <div className="border-b border-[#DDD3E9] dark:border-[#3A2F5B]">{children}</div>

        {/* University & Global Standards Compliance */}
        <UniversityCurriculumBadges />

        {/* How It Works */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                  Simple & Secure
                </span>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                  How TaskLynk Works
                </h2>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {howItWorksSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.step}
                      className="linen-card p-8 rounded-3xl text-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF7A3D] block mb-2">
                        Step {step.step}
                      </span>
                      <h3 className="text-xl font-bold text-[#22183D] dark:text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 text-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl px-8 h-12 min-w-[200px] shadow-lg shadow-[#FF7A3D]/25 hover:scale-[1.02] transition-all"
                >
                  <Link href={ctaHref} className="flex items-center justify-center gap-2">
                    <span>Get Started Today</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 sm:py-28 bg-white dark:bg-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                  Frequently Asked Questions
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#22183D] dark:text-white tracking-tight">
                  Questions About This Service
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="linen-card p-6 sm:p-7 rounded-xl"
                  >
                    <h3 className="text-lg font-bold text-[#22183D] dark:text-white mb-2 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#FF7A3D] shrink-0 mt-1" />
                      {faq.question}
                    </h3>
                    <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed pl-6.5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mb-4 font-medium">
                  Still have questions about hiring specialists for this service?
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl px-8 h-12 min-w-[200px] shadow-lg shadow-[#FF7A3D]/25 hover:scale-[1.02] transition-all">
                    <Link href="/register/client" className="flex items-center justify-center gap-2">
                      <span>Hire a Specialist</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="bg-transparent hover:bg-[#5B3594] border-2 border-[#5B3594] text-[#5B3594] hover:text-white font-bold rounded-xl px-8 h-12 min-w-[200px] hover:scale-[1.02] transition-all"
                  >
                    <Link href="/contact" className="flex items-center justify-center gap-2">
                      <span>Contact Our Team</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Services / Internal Links */}
        <section className="py-20 sm:py-28 bg-[#FAF8FD] dark:bg-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                  Related Services
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#22183D] dark:text-white tracking-tight">
                  More Specialized Capabilities
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedServices.map((svc) => (
                  <Link
                    key={svc.href}
                    href={svc.href}
                    className="linen-card p-4.5 rounded-2xl group flex items-center gap-3 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D] group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-bold text-[#22183D] dark:text-white group-hover:text-[#5B3594] dark:group-hover:text-[#FF7A3D] transition-colors">
                      {svc.label}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/services"
                  className="linen-card p-4.5 rounded-2xl group flex items-center gap-3 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D] group-hover:translate-x-1 transition-transform" />
                  <span className="text-sm font-bold text-[#22183D] dark:text-white group-hover:text-[#5B3594] dark:group-hover:text-[#FF7A3D] transition-colors">
                    View All Services
                  </span>
                </Link>
                <Link
                  href="/how-it-works"
                  className="linen-card p-4.5 rounded-2xl group flex items-center gap-3 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D] group-hover:translate-x-1 transition-transform" />
                  <span className="text-sm font-bold text-[#22183D] dark:text-white group-hover:text-[#5B3594] dark:group-hover:text-[#FF7A3D] transition-colors">
                    How It Works Guide
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#683FA8] via-[#5B3A8C] to-[#3E2068] border-t border-[#8B5CF6]/40 py-20 sm:py-28 text-white text-center">
          <StripeGradientMesh
            mode="purple-section"
            heightClass="h-full"
            className="inset-0 opacity-85 pointer-events-none"
          />

          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-[#FF7A3D]" />
                <span className="text-xs font-bold text-[#EFE8F8] uppercase tracking-wider">
                  Verified Specialists Ready
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                Ready to Work with Verified Specialists?
              </h2>
              <p className="text-base sm:text-lg text-[#DDD3E9]/90 leading-relaxed mb-8 max-w-2xl mx-auto">
                Join thousands of clients who have accelerated their academic and research goals through TaskLynk&apos;s managed marketplace.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-2xl px-9 h-14 shadow-xl shadow-[#FF7A3D]/25 hover:scale-105 transition-all"
                >
                  <Link href={ctaHref} className="flex items-center gap-2">
                    Start Your Project
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 bg-transparent hover:bg-white/10 text-white font-bold rounded-2xl px-8 h-14 hover:border-white transition-all"
                >
                  <Link href="/about">Learn More About TaskLynk</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

