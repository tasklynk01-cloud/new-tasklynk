import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  Users,
  Search,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Star,
  Award,
  Layers,
  Clock,
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { SpecialistAvatar } from '@/components/site/specialist-avatar';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';
import { siteConfig } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Our Professionals | Meet the Team Behind TaskLynk',
  description:
    'Discover the verified qualifications, technical expertise, and completed work of the professionals delivering managed services through TaskLynk. Technology, data, design, finance, and research specialists.',
  alternates: {
    canonical: `${siteConfig.url}/professionals`,
  },
  openGraph: {
    title: 'Meet the Professionals Behind TaskLynk',
    description:
      'Explore the verified qualifications, credentials, and portfolios of the specialists who deliver services through TaskLynk.',
    url: `${siteConfig.url}/professionals`,
    siteName: 'TaskLynk',
    type: 'website',
  },
};

export const revalidate = 60; // ISR cache for 1 minute

export default async function ProfessionalsDirectoryPage() {
  const specialists = await getPublishedSpecialists(30);

  const directorySchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'TaskLynk Professional Team Directory',
    description: 'Verified specialists delivering managed professional services through TaskLynk.',
    itemListElement: specialists.map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Person',
        name: s.displayName,
        jobTitle: s.headline,
        description: s.bio,
        url: `${siteConfig.url}/professionals/${s.slug}`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-20 bg-transparent border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
          {/* Active 3D Silk Wave Engine */}
          <StripeGradientMesh
            mode="hero"
            heightClass="h-[1400px]"
            className="inset-x-0 top-0 opacity-100 dark:opacity-90 pointer-events-none"
          />

          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">
                TaskLynk Professional Team
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              Meet the Professionals Behind TaskLynk.
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              Discover the verified qualifications, expertise, and completed work of the professionals who deliver services through TaskLynk. We coordinate the team, manage quality, and ensure on-time delivery.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Badge variant="outline" className="px-3 py-1 bg-white dark:bg-[#1E1636] border-[#DDD3E9] text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                Vetted Academic &amp; Technical Credentials
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white dark:bg-[#1E1636] border-[#DDD3E9] text-xs font-medium">
                <Award className="w-3.5 h-3.5 text-[#FF7A3D] mr-1.5" />
                Quality Reviewed by Senior Editors
              </Badge>
              <Badge variant="outline" className="px-3 py-1 bg-white dark:bg-[#1E1636] border-[#DDD3E9] text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-[#5B3594] mr-1.5" />
                Dedicated Project Management
              </Badge>
            </div>
          </div>
        </section>

        {/* Directory Grid */}
        <section className="py-16 sm:py-24 relative bg-transparent overflow-hidden">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white tracking-tight">
                  Verified Team Members
                </h2>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-gray-400 mt-1">
                  Browse our accredited specialists across development, statistics, finance, design, and research.
                </p>
              </div>
              <div className="text-xs font-bold bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] px-3.5 py-1.5 rounded-full">
                {specialists.length} Specialists Displayed
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialists.map((specialist) => (
                <div
                  key={specialist.slug}
                  className="group rounded-xl p-6 flex flex-col justify-between hover:border-[#FF7A3D] dark:hover:border-[#FF7A3D] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 relative bg-white dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448]"
                >
                  <div>
                    {/* Top row: Avatar, Specialist Badge, Rating */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
<SpecialistAvatar
                          avatarUrl={specialist.avatarUrl}
                          name={specialist.displayName}
                          headline={specialist.headline}
                          size="lg"
                          className="shadow-sm ring-2 ring-white/60 dark:ring-white/10 shrink-0 rounded-full"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-extrabold text-[#22183D] dark:text-white group-hover:text-[#FF7A3D] transition-colors truncate">
                            {specialist.displayName}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Verified Specialist
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8] dark:bg-[#271E42] px-2 py-0.5 rounded-md border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70">
                          ★ {specialist.ratingAverage ? Number(specialist.ratingAverage).toFixed(1) : "4.9"}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <p className="text-xs font-bold text-[#FF7A3D] mb-2.5 leading-snug line-clamp-1">
                      {specialist.headline}
                    </p>

                    {/* Bio */}
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 line-clamp-3 leading-relaxed mb-4">
                      {specialist.bio}
                    </p>

                    {/* Education Badge */}
                    {specialist.education && specialist.education.length > 0 && (
                      <div className="mb-4 p-2 rounded-lg bg-[#FAF8FD] dark:bg-[#1E1636] border border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 text-xs flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#5B3594] dark:text-[#FF7A3D] shrink-0" />
                        <span className="font-semibold text-[#22183D] dark:text-white line-clamp-1 text-[11px]">
                          {specialist.education[0].qualification} • {specialist.education[0].institution}
                        </span>
                      </div>
                    )}

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {specialist.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-semibold bg-[#FAF8FD] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] px-2.5 py-0.5 rounded-md border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70"
                        >
                          {skill}
                        </span>
                      ))}
                      {specialist.skills.length > 3 && (
                        <span className="text-[11px] font-semibold text-[#6B627A] dark:text-gray-400 self-center">
                          +{specialist.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Link & Availability */}
                  <div className="pt-3.5 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {specialist.availability || "Available Now"}
                    </span>
                    <Button asChild size="sm" className="bg-[#5B3594] hover:bg-[#48267A] text-white font-bold rounded-lg text-xs shadow-sm transition-all group-hover:bg-[#FF7A3D]">
                      <Link href={`/professionals/${specialist.slug}`} className="flex items-center gap-1.5">
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Managed Platform Notice */}
            <div className="mt-16 p-8 rounded-xl bg-gradient-to-r from-[#FAF8FD] to-[#F5EEFB] dark:from-[#18112C] dark:to-[#140E24] border border-[#DDD3E9] dark:border-[#3A2F5B] text-center max-w-3xl mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8 text-[#FF7A3D] mx-auto mb-3" />
              <h3 className="text-lg font-black text-[#22183D] dark:text-white">
                How Hiring Works at TaskLynk
              </h3>
              <p className="text-xs sm:text-sm text-[#6B627A] dark:text-gray-300 mt-2 leading-relaxed">
                TaskLynk is a managed professional service company, not an unvetted freelance board. When you select a preferred specialist, your order is received and triaged by TaskLynk project managers. Our human editors supervise quality, and payments are protected by milestone escrow.
              </p>
              <div className="mt-5">
                <Button asChild className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl px-7">
                  <Link href="/client/new-job">Start a New Project</Link>
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
