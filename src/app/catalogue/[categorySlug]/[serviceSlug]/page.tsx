import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  FileText, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Sparkles, 
  FileCheck, 
  HelpCircle, 
  Award, 
  Package, 
  Layers, 
  ChevronRight,
  BookOpen,
  Lock
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { 
  getServiceBySlug, 
  getCategory, 
  getAllServices, 
  getRelatedServices,
  getBundlesForService,
  getServiceWhatsAppUrl,
  getServiceOrderUrl
} from '@/lib/catalogue';
import { BundleCard } from '@/components/catalogue/bundle-card';
import type { CategorySlug } from '@/lib/catalogue/types';

interface ServicePageProps {
  params: Promise<{
    categorySlug: string;
    serviceSlug: string;
  }>;
}

export async function generateStaticParams() {
  const allServices = getAllServices();
  return allServices.map((svc) => ({
    categorySlug: svc.categorySlug,
    serviceSlug: svc.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { categorySlug, serviceSlug } = await params;
  const service = getServiceBySlug(serviceSlug);
  if (!service) return {};

  return {
    title: `${service.name} | TaskLynk Kenya Specialist Services`,
    description: service.summary,
    keywords: service.keywords,
    ...generateCanonicalMetadata(`/catalogue/${categorySlug}/${serviceSlug}`),
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { categorySlug, serviceSlug } = await params;
  const service = getServiceBySlug(serviceSlug);

  if (!service || service.categorySlug !== categorySlug) {
    notFound();
  }

  const category = getCategory(service.categorySlug);
  if (!category) {
    notFound();
  }

  const relatedServices = getRelatedServices(service, 4);
  const relevantBundles = getBundlesForService(service.slug);
  const whatsAppUrl = getServiceWhatsAppUrl(service);
  const orderUrl = getServiceOrderUrl(service);

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.summary,
    url: `https://www.tasklynk.co.ke/catalogue/${category.slug}/${service.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'TaskLynk Academic & Business Solutions',
      url: 'https://www.tasklynk.co.ke',
      telephone: '+254701066845',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
    },
    areaServed: {
      '@type': 'Country',
      name: 'Kenya',
    },
    offers: {
      '@type': 'Offer',
      price: service.startingPrice || 0,
      priceCurrency: 'KES',
      availability: 'https://schema.org/InStock',
      url: `https://www.tasklynk.co.ke/catalogue/${category.slug}/${service.slug}`,
    },
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.tasklynk.co.ke',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalogue',
        item: 'https://www.tasklynk.co.ke/catalogue',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.shortName,
        item: `https://www.tasklynk.co.ke/catalogue/${category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: service.name,
        item: `https://www.tasklynk.co.ke/catalogue/${category.slug}/${service.slug}`,
      },
    ],
  };

  const pricingDisplay = service.startingPrice
    ? `From KSh ${service.startingPrice.toLocaleString()}`
    : service.pricingModel === 'per_session'
    ? 'Per Session Rate'
    : service.pricingModel === 'hourly'
    ? 'Hourly Rate'
    : service.pricingModel === 'milestone'
    ? 'Milestone-Based'
    : 'Scope-Based Quotation';

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1400px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <MainHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="pt-28 pb-4 bg-transparent border-b border-[#E8E0F0]/50 dark:border-[#261B42]/50 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/catalogue" className="hover:text-foreground">Catalogue</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/catalogue/${category.slug}`} className="hover:text-foreground">{category.shortName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#FF7A3D] font-medium truncate">{service.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Header with Transparent Glass & Flowing 3D Wave */}
      <section className="relative py-10 sm:py-14 bg-transparent border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 overflow-hidden z-10">
        {/* Ambient Blur Spheres */}
        <div className="absolute top-10 left-1/4 w-[520px] h-[520px] bg-[#EFE8F8]/60 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[460px] h-[460px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Service Title & Overview */}
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE8F8]/90 dark:bg-[#271E42]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-[#EFE8F8] text-xs font-bold mb-3 shadow-sm backdrop-blur-sm">
                <span>{category.name}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#22183D] dark:text-white tracking-tight leading-tight">
                {service.name}
              </h1>

              <p className="text-base sm:text-lg text-[#554D66] dark:text-[#C6BFD4] mt-3 leading-relaxed">
                {service.summary}
              </p>

              {/* Description Paragraphs */}
              <div className="mt-4 space-y-3 text-sm text-[#463D56] dark:text-[#B6AFC4] leading-relaxed">
                {service.description.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Tools Supported */}
              {service.tools && service.tools.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#E4DDF0] dark:border-[#31254E]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A6F8F] dark:text-[#9A8FB2] block mb-2">
                    Supported Tools &amp; Software Environments:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {service.tools.map((tool, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-3 py-1 rounded-xl bg-white dark:bg-[#20183B] border border-[#DDD3E9] dark:border-[#3C2E5D] font-semibold text-[#533A7B] dark:text-[#D1C2EE]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Pricing & Fast Action Card - Linen Card */}
            <div className="linen-card lg:col-span-1 rounded-2xl p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-xs bg-[#FAF5FE] text-[#5B3A8C] border-[#DDD3E9] font-bold">
                  {service.pricingModel.replace('_', ' ').toUpperCase()}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#FF7A3D]" />
                  <span>Turnaround: <strong>{service.turnaround.split('.')[0]}</strong></span>
                </div>
              </div>

              <div className="mb-5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">Estimated Investment</span>
                <span className="text-2xl font-black text-[#22183D] dark:text-white">
                  {pricingDisplay}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exact price confirmed by quotation following project review. No hidden costs.
                </p>
              </div>

              <div className="space-y-2.5">
                <Button
                  asChild
                  className="w-full font-bold bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-sm rounded-xl h-10"
                  size="lg"
                >
                  <Link href={orderUrl}>
                    {service.orderable ? 'Order This Service' : 'Request a Free Quotation'}
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full font-semibold border-[#DDD3E9] dark:border-[#3C2E5D] text-[#25D366] hover:bg-[#25D366]/10 rounded-xl h-10"
                  size="lg"
                >
                  <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Direct Enquiry</span>
                  </a>
                </Button>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F1EAF8] dark:border-[#261B42] space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF7A3D] shrink-0" />
                  <span>Vetted specialist assigned &amp; coordinated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#5B3A8C] dark:text-[#A78BE8] shrink-0" />
                  <span>Confidentiality &amp; data security guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>{service.revisionPolicy.split('.')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details Section */}
      <section className="py-14 bg-white/90 dark:bg-[#140E24]/90 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Use Cases, Inputs, Deliverables, QA, Training info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Common Use Cases */}
              <div className="linen-card rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#FF7A3D]" />
                  <span>Common Use Cases &amp; Applications</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.useCases.map((useCase, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF8FD] dark:bg-[#20183B] border border-[#EBE3F5] dark:border-[#352758] flex items-start gap-2 text-xs text-[#3E3650] dark:text-[#D5CDE4]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#FF7A3D] shrink-0 mt-0.5" />
                      <span>{useCase}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables Section */}
              <div className="linen-card rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white flex items-center gap-2 mb-4">
                  <FileCheck className="w-5 h-5 text-[#25D366]" />
                  <span>What You Will Receive (Deliverables)</span>
                </h2>
                <ul className="space-y-2.5">
                  {service.deliverables.map((deliv, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#463D56] dark:text-[#C5BED4]">
                      <div className="w-5 h-5 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Customer Inputs */}
              <div className="linen-card rounded-2xl p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-[#5B3A8C] dark:text-[#A78BE8]" />
                  <span>Information &amp; Files Required from You</span>
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  To ensure rapid and accurate delivery, please have these items ready when requesting your quote or placing your order:
                </p>
                <div className="space-y-2">
                  {service.requiredInputs.map((inputItem, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF8FD] dark:bg-[#20183B] text-xs text-[#443C54] dark:text-[#C5BDE0]"
                    >
                      <span className="font-bold text-[#FF7A3D] shrink-0">{idx + 1}.</span>
                      <span>{inputItem}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specific Training Details if applicable */}
              {service.training && (
                <div className="linen-card rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#FAF5FE] to-[#F1E7FC] dark:from-[#20183C] dark:to-[#18112C]">
                  <h2 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-[#FF7A3D]" />
                    <span>Curriculum &amp; Learning Specifications</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#17102B]/80">
                      <strong className="block text-foreground mb-0.5">Target Learner:</strong>
                      <span className="text-muted-foreground">{service.training.targetLearner}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#17102B]/80">
                      <strong className="block text-foreground mb-0.5">Prerequisites:</strong>
                      <span className="text-muted-foreground">{service.training.prerequisites}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#17102B]/80">
                      <strong className="block text-foreground mb-0.5">Session Duration:</strong>
                      <span className="text-muted-foreground">{service.training.sessionDuration}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#17102B]/80">
                      <strong className="block text-foreground mb-0.5">Format &amp; Materials:</strong>
                      <span className="text-muted-foreground">{service.training.format} ({service.training.materials})</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B3A8C] dark:text-[#C5B3E6] block mb-2">
                    Target Learning Outcomes:
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#443C54] dark:text-[#C5BDE0]">
                    {service.training.outcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7A3D] shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specialist Profile & Revision Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="linen-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-[#5B3A8C] dark:text-[#C5B3E6]">
                    <Award className="w-4 h-4" />
                    <h3 className="text-sm font-bold">Specialist Qualifications</h3>
                  </div>
                  <p className="text-xs text-[#554E63] dark:text-[#B8B1C6] leading-relaxed">
                    {service.specialistProfile}
                  </p>
                </div>

                <div className="linen-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-[#FF7A3D]">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="text-sm font-bold">Revision &amp; Correction Policy</h3>
                  </div>
                  <p className="text-xs text-[#554E63] dark:text-[#B8B1C6] leading-relaxed">
                    {service.revisionPolicy}
                  </p>
                </div>
              </div>

              {/* Service FAQs Accordion */}
              {service.faqs && service.faqs.length > 0 && (
                <div className="linen-card rounded-2xl p-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-[#FF7A3D]" />
                    <span>Frequently Asked Questions</span>
                  </h2>
                  <div className="space-y-2.5">
                    {service.faqs.map((faq, idx) => (
                      <details 
                        key={idx}
                        className="group rounded-xl border border-[#ECE4F5] dark:border-[#2E224A] bg-[#FAF8FD] dark:bg-[#20183B] p-3.5 text-xs open:bg-white dark:open:bg-[#231A40]"
                      >
                        <summary className="font-bold text-[#22183D] dark:text-white cursor-pointer list-none flex items-center justify-between">
                          <span>{faq.question}</span>
                          <span className="text-[#FF7A3D] group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <p className="text-[#554E63] dark:text-[#B8B1C6] mt-2 leading-relaxed pt-2 border-t border-[#F0E8F8] dark:border-[#2F234D]">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Category Context, Related Services & Quick Order */}
            <div className="space-y-6">
              {/* Category Card */}
              <div className="linen-card rounded-2xl p-5 sm:p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A3D] block">
                  Category Hub
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#22183D] dark:text-white mt-1">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                  {category.description}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs mt-4 rounded-xl border-[#DDD3E9] dark:border-[#3C2E5D]">
                  <Link href={`/catalogue/${category.slug}`}>
                    View All {category.shortName} Listings
                  </Link>
                </Button>
              </div>

              {/* Category Guide Blog Link */}
              {category.blogSlug && (
                <div className="linen-card rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#22183D] to-[#362160] text-white">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF7A3D] uppercase tracking-wider mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>In-Depth Educational Guide</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold">
                    Need Help Understanding Methodologies or Pricing?
                  </h4>
                  <p className="text-xs text-[#D8CEEA] mt-2 leading-relaxed">
                    Read our complete 3,000+ words article explaining step-by-step best practices, sample tables, and avoidable mistakes.
                  </p>
                  <Button asChild size="sm" className="w-full mt-4 text-xs font-bold bg-[#FF7A3D] hover:bg-[#E9662F] text-white rounded-xl">
                    <Link href={`/blog/${category.blogSlug}`}>
                      Read Complete Guide
                    </Link>
                  </Button>
                </div>
              )}

              {/* Related Services */}
              {relatedServices.length > 0 && (
                <div className="linen-card rounded-2xl p-5 sm:p-6">
                  <h3 className="text-sm font-bold text-[#22183D] dark:text-white mb-3">
                    Related Services
                  </h3>
                  <div className="space-y-2.5">
                    {relatedServices.map((rel) => (
                      <Link
                        key={rel.slug}
                        href={`/catalogue/${rel.categorySlug}/${rel.slug}`}
                        className="block p-3 rounded-xl bg-[#FAF8FD] dark:bg-[#20183B] hover:border-[#FF7A3D]/40 border border-[#EAE3F4] dark:border-[#322554] transition-all"
                      >
                        <h4 className="text-xs font-bold text-[#22183D] dark:text-white hover:text-[#FF7A3D] transition-colors">
                          {rel.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {rel.summary}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Connected Bundles if any */}
      {relevantBundles.length > 0 && (
        <section className="py-14 bg-white dark:bg-[#140E24] border-t border-[#E8E1F2] dark:border-[#2A2045] relative z-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A3D]">Connected Package</span>
              <h2 className="text-2xl font-black text-[#22183D] dark:text-white mt-1 tracking-tight">
                This Service Is Also Included in a Bundle
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Save on your total project cost by ordering this service together with related statistical, reporting, or review modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relevantBundles.map((b) => (
                <BundleCard key={b.slug} bundle={b} />
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
