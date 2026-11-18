import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  BarChart3, 
  GraduationCap, 
  Briefcase, 
  Presentation, 
  MessageSquare, 
  Cpu, 
  ShieldCheck, 
  CheckCircle, 
  Lock, 
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  HelpCircle
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';
import { CATEGORIES, getAllServices, getAllBundles } from '@/lib/catalogue';
import { BundleCard } from '@/components/catalogue/bundle-card';
import { CatalogueBrowser } from '@/components/catalogue/catalogue-browser';

export const metadata: Metadata = {
  title: 'TaskLynk Service Catalogue | Managed Professional & Academic Data Services Kenya',
  description: 'Explore TaskLynk comprehensive catalogue: SPSS data analysis, thesis and dissertation support, Power BI dashboards, qualitative NVivo research, training, and technical engineering in Kenya.',
  ...generateCanonicalMetadata('/catalogue'),
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'data-analysis-statistics': BarChart3,
  'thesis-dissertation-research-support': GraduationCap,
  'business-data-analysis-reporting': Briefcase,
  'data-analysis-training-tutoring': Presentation,
  'qualitative-mixed-methods-research': MessageSquare,
  'technical-services': Cpu,
};

export default function CatalogueIndexPage() {
  const allServices = getAllServices();
  const allBundles = getAllBundles();

  const catalogueJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'TaskLynk Managed Professional Services Catalogue',
    description: 'Comprehensive catalogue of statistical data analysis, thesis support, business intelligence, research methodology, training, and technical development services in Kenya.',
    url: 'https://www.tasklynk.co.ke/catalogue',
    numberOfItems: allServices.length,
    itemListElement: allServices.slice(0, 30).map((svc, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Service',
        name: svc.name,
        description: svc.summary,
        url: `https://www.tasklynk.co.ke/catalogue/${svc.categorySlug}/${svc.slug}`,
        provider: {
          '@type': 'Organization',
          name: 'TaskLynk Kenya',
          url: 'https://www.tasklynk.co.ke',
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      {/* 1. HERO 3D SILK GRADIENT WAVE ENGINE (Flows right from the topmost edge behind transparent header) */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[1800px]"
        className="inset-x-0 top-0 opacity-95 dark:opacity-85 pointer-events-none"
      />

      <MainHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogueJsonLd) }}
      />

      {/* Hero Section with Transparent Glass & Flowing 3D Wave */}
      <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-20 bg-transparent border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 overflow-hidden text-center z-10">
        {/* Ambient Blur Spheres */}
        <div className="absolute top-10 left-1/4 w-[520px] h-[520px] bg-[#EFE8F8]/60 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-20 right-10 w-[460px] h-[460px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE8F8]/90 dark:bg-[#271E42]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] text-[#5B3594] dark:text-[#EFE8F8] text-xs font-bold mb-4 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span>Managed Professional Services Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#22183D] dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Specialized Data Analysis, Research Support &amp; <span className="text-[#FF7A3D]">Technical Services</span>
          </h1>

          <p className="text-base sm:text-lg text-[#5E566F] dark:text-[#C1BACF] max-w-3xl mx-auto mt-4 leading-relaxed">
            Browse our expanded catalogue of verified specialists. Every order is coordinated by a dedicated project manager with strict quality assurance, transparent quotations, and robust academic integrity standards.
          </p>

          {/* Key Trust Pillars - Linen Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-8">
            <div className="linen-card p-3.5 rounded-xl flex items-center gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 text-[#FF7A3D] shrink-0" />
              <div>
                <span className="text-xs font-bold block text-[#22183D] dark:text-white">Vetted Specialists</span>
                <span className="text-[10px] text-muted-foreground">Competence verified</span>
              </div>
            </div>

            <div className="linen-card p-3.5 rounded-xl flex items-center gap-2.5 text-left">
              <Lock className="w-5 h-5 text-[#5B3A8C] dark:text-[#A78BE8] shrink-0" />
              <div>
                <span className="text-xs font-bold block text-[#22183D] dark:text-white">Confidential Data</span>
                <span className="text-[10px] text-muted-foreground">Authorized access only</span>
              </div>
            </div>

            <div className="linen-card p-3.5 rounded-xl flex items-center gap-2.5 text-left">
              <CheckCircle className="w-5 h-5 text-[#25D366] shrink-0" />
              <div>
                <span className="text-xs font-bold block text-[#22183D] dark:text-white">Academic Integrity</span>
                <span className="text-[10px] text-muted-foreground">Honest research guidance</span>
              </div>
            </div>

            <div className="linen-card p-3.5 rounded-xl flex items-center gap-2.5 text-left">
              <Layers className="w-5 h-5 text-[#FF7A3D] shrink-0" />
              <div>
                <span className="text-xs font-bold block text-[#22183D] dark:text-white">Fair Quotations</span>
                <span className="text-[10px] text-muted-foreground">Zero hidden surcharges</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Hub Cards */}
      <section className="py-12 bg-white/90 dark:bg-[#140E24]/90 backdrop-blur-md border-b border-[#E8E1F2] dark:border-[#2A2045] relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-black text-[#22183D] dark:text-white tracking-tight">
              Six Specialized Service Categories
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select a category to explore complete service listings, workflows, tools, and dedicated guides.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || BarChart3;
              const count = allServices.filter((s) => s.categorySlug === cat.slug).length;

              return (
                <Link
                  key={cat.slug}
                  href={`/catalogue/${cat.slug}`}
                  className="linen-card group rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FF7A3D]/10 text-[#FF7A3D] flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0E8F9] dark:bg-[#251A40] text-[#5B3A8C] dark:text-[#C5B3E6]">
                        {count} Services
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#22183D] dark:text-white group-hover:text-[#FF7A3D] transition-colors leading-snug">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-[#5C536B] dark:text-[#B3ACC1] mt-2 line-clamp-3 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EDE5F6] dark:border-[#2C2147] flex items-center justify-between text-xs font-bold text-[#5B3A8C] dark:text-[#C1A8EC]">
                    <span>Explore Category</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Catalogue Browser */}
      <section className="py-14 bg-[#FAF8FD] dark:bg-[#17102B] relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF7A3D]/10 text-[#FF7A3D] text-xs font-bold mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>All {allServices.length} Individual Listings</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white tracking-tight">
                Explore All Services
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Filter by category, search by statistical technique or software, and request quotations.
              </p>
            </div>

            <Button
              asChild
              className="bg-[#5B3A8C] hover:bg-[#482A73] text-white text-xs font-bold rounded-xl h-10 px-5 shrink-0 self-start md:self-auto shadow-sm"
            >
              <Link href="/catalogue/order">
                Request Custom Quotation
              </Link>
            </Button>
          </div>

          <CatalogueBrowser 
            categories={CATEGORIES} 
            services={allServices} 
          />
        </div>
      </section>

      {/* Connected Service Bundles Section */}
      <section className="py-14 bg-white dark:bg-[#140E24] border-t border-[#E8E1F2] dark:border-[#2A2045] relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B3A8C]/10 text-[#5B3A8C] dark:text-[#C5B3E6] text-xs font-bold mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Connected Service Bundles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white tracking-tight">
              Pre-Packaged Multi-Service Solutions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              Save up to 20% by combining interrelated statistical, research, reporting, and training services into a single coordinated project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allBundles.map((bundle) => (
              <BundleCard key={bundle.slug} bundle={bundle} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Academic Integrity Banner */}
      <section className="py-14 bg-[#FAF8FD] dark:bg-[#17102B] border-t border-[#E8E1F2] dark:border-[#2A2045] relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="linen-card rounded-2xl p-7 sm:p-10 bg-gradient-to-r from-[#22183D] to-[#362160] text-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A3D] block mb-2">
                  TaskLynk Quality &amp; Integrity Guarantee
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                  Managed Quality, Authentic Understanding &amp; Strict Confidentiality
                </h2>
                <p className="text-xs sm:text-sm text-[#DDD3E9] mt-3 leading-relaxed">
                  Every order is managed end-to-end by an experienced project manager. Statistical outputs include clear explanations, syntax scripts, and presentation tables so you can defend and present your findings with full confidence. We uphold strict academic ethics and never claim dishonest authorship.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Button
                  asChild
                  className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold h-11 px-6 rounded-xl shadow-md text-sm"
                >
                  <Link href="/catalogue/order">
                    Submit Project Brief
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-bold h-11 px-6 rounded-xl text-sm"
                >
                  <a
                    href="https://wa.me/254701066845?text=Hello%20TaskLynk,%20I%20have%20an%20inquiry%20regarding%20your%20service%20catalogue."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
