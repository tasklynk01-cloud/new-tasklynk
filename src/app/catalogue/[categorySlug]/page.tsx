import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  GraduationCap, 
  Briefcase, 
  Presentation, 
  MessageSquare, 
  Cpu, 
  ArrowRight, 
  BookOpen, 
  CheckCircle, 
  HelpCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { CATEGORIES, getCategory, getServicesByCategory, getAllBundles } from '@/lib/catalogue';
import { ServiceCard } from '@/components/catalogue/service-card';
import { BundleCard } from '@/components/catalogue/bundle-card';
import type { CategorySlug } from '@/lib/catalogue/types';

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = getCategory(categorySlug as CategorySlug);
  if (!category) return {};

  return {
    title: `${category.name} | TaskLynk Kenya Specialist Marketplace`,
    description: category.metaDescription,
    keywords: category.keywords,
    ...generateCanonicalMetadata(`/catalogue/${category.slug}`),
  };
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'data-analysis-statistics': BarChart3,
  'thesis-dissertation-research-support': GraduationCap,
  'business-data-analysis-reporting': Briefcase,
  'data-analysis-training-tutoring': Presentation,
  'qualitative-mixed-methods-research': MessageSquare,
  'technical-services': Cpu,
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const category = getCategory(categorySlug as CategorySlug);

  if (!category) {
    notFound();
  }

  const services = getServicesByCategory(category.slug);
  const bundles = getAllBundles();
  const Icon = CATEGORY_ICONS[category.slug] || BarChart3;

  const categoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://www.tasklynk.co.ke/catalogue/${category.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'TaskLynk Academic',
      url: 'https://www.tasklynk.co.ke',
    },
    hasPart: services.map((s) => ({
      '@type': 'Service',
      name: s.name,
      description: s.summary,
      url: `https://www.tasklynk.co.ke/catalogue/${category.slug}/${s.slug}`,
    })),
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
        name: 'Service Catalogue',
        item: 'https://www.tasklynk.co.ke/catalogue',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://www.tasklynk.co.ke/catalogue/${category.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 3D Silk Gradient Wave Engine */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1600px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <MainHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="pt-28 pb-4 bg-transparent border-b border-[#E8E0F0]/50 dark:border-[#261B42]/50 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/catalogue" className="hover:text-foreground">Catalogue</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#FF7A3D] font-medium">{category.shortName}</span>
          </nav>
        </div>
      </div>

      {/* Hero Header with Transparent Glass & Flowing 3D Wave */}
      <section className="relative py-12 lg:py-16 bg-transparent border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 overflow-hidden z-10">
        {/* Ambient Blur Spheres */}
        <div className="absolute top-10 left-1/4 w-[520px] h-[520px] bg-[#EFE8F8]/60 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[460px] h-[460px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE8F8]/90 dark:bg-[#271E42]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-[#EFE8F8] text-xs font-bold mb-3 shadow-sm backdrop-blur-sm">
              <Icon className="w-4 h-4 text-[#FF7A3D]" />
              <span>Specialist Category Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#22183D] dark:text-white tracking-tight leading-tight">
              {category.name}
            </h1>

            <p className="text-base sm:text-lg text-[#554D66] dark:text-[#C5BED4] mt-3 leading-relaxed">
              {category.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="linen-card px-3.5 py-1.5 rounded-xl">
                <strong className="text-foreground">Audience: </strong>
                <span className="text-muted-foreground">{category.audience}</span>
              </div>

              <div className="linen-card px-3.5 py-1.5 rounded-xl">
                <strong className="text-foreground">Listings: </strong>
                <span className="text-[#FF7A3D] font-bold">{services.length} individual services</span>
              </div>
            </div>

            {/* Link to Dedicated SEO Guide */}
            {category.blogSlug && (
              <div className="mt-8 linen-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5B3A8C]/10 text-[#5B3A8C] dark:text-[#C2AFF0] flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#22183D] dark:text-white">
                      Comprehensive Practical Guide &amp; Industry Insights
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Read our in-depth 3,000+ words resource on workflows, software best practices, and pricing standards in Kenya.
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="shrink-0 text-xs font-semibold rounded-xl border-[#DDD3E9] dark:border-[#403166] text-[#5B3A8C] dark:text-[#C5B3E6]">
                  <Link href={`/blog/${category.blogSlug}`} className="inline-flex items-center gap-1.5">
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-14 bg-white/90 dark:bg-[#140E24]/90 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#22183D] dark:text-white tracking-tight">
                Individual Service Offerings ({services.length})
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Each listing includes required inputs, deliverables, turnaround estimates, and quotation actions.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs rounded-xl border-[#DDD3E9] dark:border-[#3A2D5C]">
              <Link href="/catalogue">
                Browse Other Categories
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <ServiceCard key={svc.slug} service={svc} />
            ))}
          </div>
        </div>
      </section>

      {/* Relevant Bundles */}
      <section className="py-14 bg-[#F8F3FC] dark:bg-[#160F28] border-t border-b border-[#E8E0F0] dark:border-[#2C2147] relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A3D]">Connected Offers</span>
            <h2 className="text-2xl font-black text-[#22183D] dark:text-white mt-1 tracking-tight">
              Popular Service Packages
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Combine multiple related services into a coordinated package with integrated milestones and bundle discounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <BundleCard key={bundle.slug} bundle={bundle} />
            ))}
          </div>
        </div>
      </section>

      {/* Category FAQs */}
      {category.faqs && category.faqs.length > 0 && (
        <section className="py-14 bg-white dark:bg-[#18112C] relative z-10">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <div className="text-center mb-8">
              <HelpCircle className="w-8 h-8 text-[#FF7A3D] mx-auto mb-2" />
              <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white tracking-tight">
                Frequently Asked Questions about {category.shortName}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Everything you need to know about workflows, software access, and project coordination.
              </p>
            </div>

            <div className="space-y-3.5">
              {category.faqs.map((faq, idx) => (
                <div 
                  key={idx}
                  className="linen-card rounded-2xl p-5"
                >
                  <h3 className="text-sm sm:text-base font-bold text-[#22183D] dark:text-white">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5B5469] dark:text-[#B6B0C4] mt-2 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
