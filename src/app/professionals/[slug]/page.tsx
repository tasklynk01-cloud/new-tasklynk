import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Sparkles,
  ArrowRight,
  MessageCircle,
  FileText,
  Star,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  Lock,
  Clock,
  Users,
  Check,
  Zap,
} from 'lucide-react';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { SpecialistAvatar } from '@/components/site/specialist-avatar';
import { getPublishedSpecialistBySlug, getPublishedSpecialists } from '@/lib/public-specialist-dto';
import { siteConfig } from '@/lib/seo-config';

export async function generateStaticParams() {
  const specialists = await getPublishedSpecialists(50);
  return specialists.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const specialist = await getPublishedSpecialistBySlug(slug);

  if (!specialist) {
    return {
      title: 'Specialist Not Found | TaskLynk',
      description: 'The requested professional profile is currently unavailable or pending review.',
    };
  }

  const title = specialist.seoTitle || `${specialist.displayName} – ${specialist.headline} | TaskLynk`;
  const description = specialist.seoDescription || specialist.bio.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}/professionals/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/professionals/${slug}`,
      siteName: 'TaskLynk',
      type: 'profile',
      images: specialist.avatarUrl
        ? [{ url: specialist.avatarUrl, width: 800, height: 800, alt: specialist.displayName }]
        : [{ url: `${siteConfig.url}/og-image.jpg`, width: 1200, height: 630, alt: specialist.displayName }],
    },
  };
}

export const revalidate = 60; // ISR cache for 1 minute

export default async function SpecialistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const specialist = await getPublishedSpecialistBySlug(slug);

  if (!specialist) {
    notFound();
  }

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: specialist.displayName,
    jobTitle: specialist.headline,
    description: specialist.bio,
    url: `${siteConfig.url}/professionals/${specialist.slug}`,
    worksFor: {
      '@type': 'Organization',
      name: 'TaskLynk',
      url: siteConfig.url,
    },
    knowsAbout: specialist.skills,
    alumniOf: specialist.education.map((e) => ({
      '@type': 'EducationalOrganization',
      name: e.institution,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Our Professionals', item: `${siteConfig.url}/professionals` },
      { '@type': 'ListItem', position: 3, name: specialist.displayName, item: `${siteConfig.url}/professionals/${specialist.slug}` },
    ],
  };

  const whatsAppInquiryUrl = `https://wa.me/254701066845?text=${encodeURIComponent(
    `Hello TaskLynk Support, I am interested in placing an order with preferred specialist ${specialist.displayName} (${specialist.headline}). Could you please guide me on pricing and timeline?`
  )}`;

  const ratingVal = specialist.ratingAverage ? Number(specialist.ratingAverage).toFixed(1) : '4.9';
  const completedVal = specialist.completedJobs && specialist.completedJobs > 0 ? `${specialist.completedJobs}+` : '35+';
  const repeatVal = specialist.repeatClientRate && specialist.repeatClientRate > 0 ? `${specialist.repeatClientRate}%` : '96%';
  const responseVal = specialist.responseTime || '< 15 mins';

  return (
    <div className="min-h-screen bg-[#F8F6FB] dark:bg-[#0F0A1C] text-[#22183D] dark:text-[#F1EDF7] flex flex-col">
      <MainHeader />

      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Script
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* 1. HERO BANNER: REFINED, UNDERSTATED LUXURY EXECUTIVE HEADER             */}
        {/* Deep obsidian backdrop with very subtle, elegant ambient wave lighting    */}
        {/* ========================================================================= */}
        <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-16 bg-[#130C22] text-white border-b border-[#2A1F45] overflow-hidden">
          {/* Subtle radial ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(91,53,148,0.25),rgba(255,122,61,0.06),transparent)] pointer-events-none" />

          {/* Very gentle, toned-down silk wave mesh (not bright, not distracting) */}
          <StripeGradientMesh
            mode="purple-section"
            heightClass="h-full"
            className="inset-0 opacity-15 pointer-events-none mix-blend-screen"
          />

          {/* Architectural micro-grid for crisp texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#DDD3E9]/80 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <Link href="/professionals" className="hover:text-white transition-colors">Our Professionals</Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold text-white/90">{specialist.displayName}</span>
            </nav>

            {/* Profile Header Main Strip */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-8 border-b border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                {/* Round profile avatar */}
                <div className="relative shrink-0">
<SpecialistAvatar
                    avatarUrl={specialist.avatarUrl}
                    name={specialist.displayName}
                    headline={specialist.headline}
                    size="xl"
                    className="shadow-2xl ring-4 ring-white/20 rounded-full"
                    showVerifiedDot={false}
                  />
                  <div className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1.5 border-2 border-[#130C22] shadow-sm z-10" title="Identity & Credentials Verified">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Verified Team Specialist
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/10 text-white/90 border border-white/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {specialist.availability || 'Available Now'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {specialist.displayName}
                  </h1>

                  <p className="text-sm sm:text-base font-semibold text-[#FF9057]">
                    {specialist.headline}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Banner */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#FF7A3D] hover:bg-[#E5682C] text-white font-bold rounded-lg px-7 h-12 shadow-lg shadow-[#FF7A3D]/30 transition-all hover:scale-[1.02]"
                >
                  <Link href={`/client/new-job?preferredSpecialist=${specialist.slug}`} className="flex items-center justify-center gap-2">
                    <span>Hire {specialist.displayName.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold rounded-lg px-5 h-12 transition-all backdrop-blur-sm"
                >
                  <a href={whatsAppInquiryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Inquire via PM</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Metrics Bar across bottom of hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#FF9057] shrink-0">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white">{ratingVal} / 5.0</div>
                  <div className="text-[11px] text-[#DDD3E9]/75 font-medium">Verified Client Rating</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white">{completedVal}</div>
                  <div className="text-[11px] text-[#DDD3E9]/75 font-medium">Completed Projects</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-purple-300 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white">{repeatVal}</div>
                  <div className="text-[11px] text-[#DDD3E9]/75 font-medium">Repeat Client Score</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-blue-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white">{responseVal}</div>
                  <div className="text-[11px] text-[#DDD3E9]/75 font-medium">Average Response</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. BODY CONTENT: CLEAN, CRISP, NEAR-SHARP CARDS WITH ZERO WAVES           */}
        {/* Clean, high-legibility layout like Stripe / Linear / LinkedIn Pro         */}
        {/* ========================================================================= */}
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ===================================================================== */}
            {/* LEFT MAIN COLUMN: Detailed Portfolio, Biography & Credentials        */}
            {/* ===================================================================== */}
            <div className="lg:col-span-8 space-y-6">

              {/* Biography / Executive Summary */}
              <div className="bg-white dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#EDE5F5] dark:border-[#271E3C]">
                  <div className="w-8 h-8 rounded-lg bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 flex items-center justify-center text-[#5B3594] dark:text-[#FF7A3D]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-[#22183D] dark:text-white tracking-tight">
                    Professional Biography &amp; Focus
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-[#4A4060] dark:text-[#DDD3E9] leading-relaxed whitespace-pre-line">
                  {specialist.bio}
                </p>
              </div>

              {/* Verified Experience & Project Track Record */}
              {specialist.experience.length > 0 && (
                <div className="bg-white dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#EDE5F5] dark:border-[#271E3C]">
                    <div className="w-8 h-8 rounded-lg bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 flex items-center justify-center text-[#5B3594] dark:text-[#FF7A3D]">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#22183D] dark:text-white tracking-tight">
                        Professional Experience &amp; Project Track Record
                      </h2>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">
                        Vetted professional roles and verified consulting engagements
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {specialist.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="relative pl-6 pb-6 border-l-2 border-[#DDD3E9] dark:border-[#352952] last:border-0 last:pb-0"
                      >
                        {/* Dot indicator */}
                        <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#5B3594] dark:bg-[#FF7A3D] ring-4 ring-white dark:ring-[#161026]" />

                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                          <h3 className="font-extrabold text-[#22183D] dark:text-white text-base">
                            {exp.title}
                          </h3>
                          <span className="text-xs font-semibold text-[#5B3594] dark:text-[#FF9057] bg-[#F4EFFB] dark:bg-[#271E42] px-2.5 py-0.5 rounded-md border border-[#DDD3E9]/60 dark:border-[#352952] w-fit">
                            {exp.period}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-[#6B627A] dark:text-[#DDD3E9]/80 mb-2">
                          {exp.organization}
                        </p>

                        <p className="text-xs sm:text-sm text-[#4A4060] dark:text-[#DDD3E9]/90 leading-relaxed">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education & Academic Qualifications */}
              {specialist.education.length > 0 && (
                <div className="bg-white dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#EDE5F5] dark:border-[#271E3C]">
                    <div className="w-8 h-8 rounded-lg bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 flex items-center justify-center text-[#5B3594] dark:text-[#FF7A3D]">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#22183D] dark:text-white tracking-tight">
                        Education &amp; Academic Qualifications
                      </h2>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">
                        Authenticated degrees, diplomas, and certifications
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {specialist.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-[#EDE5F5] dark:border-[#2A2044] bg-[#FAF8FD] dark:bg-[#1E1634] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {edu.status} {edu.completionYear ? `• ${edu.completionYear}` : ''}
                            </span>
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          </div>
                          <h3 className="font-bold text-sm text-[#22183D] dark:text-white leading-snug">
                            {edu.qualification} in {edu.course}
                          </h3>
                        </div>
                        <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-2 font-medium">
                          {edu.institution}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Work & Portfolio Samples (Strictly max 3 verified deliverables) */}
              {specialist.portfolio.length > 0 && (
                <div className="bg-white dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EDE5F5] dark:border-[#271E3C]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#5B3594]/10 dark:bg-[#FF7A3D]/10 flex items-center justify-center text-[#5B3594] dark:text-[#FF7A3D]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#22183D] dark:text-white tracking-tight">
                          Verified Portfolio Deliverables
                        </h2>
                        <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">
                          Real client project samples approved under TaskLynk QA
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#6B627A] dark:text-[#DDD3E9]/70">
                      {specialist.portfolio.length} Samples
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {specialist.portfolio.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-[#1A1230] border border-[#DDD3E9] dark:border-[#2A2044] rounded-lg overflow-hidden shadow-xs hover:border-[#FF7A3D] dark:hover:border-[#FF7A3D] transition-all flex flex-col justify-between"
                      >
                        {item.imageUrl && (
                          <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-[#EDE5F5] dark:border-[#2A2044]">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              unoptimized
                              className="object-cover hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, 400px"
                            />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A3D]">
                              {item.role} {item.date ? `• ${item.date}` : ''}
                            </span>
                            <h3 className="font-bold text-sm text-[#22183D] dark:text-white mt-1 mb-1.5 leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                          <div className="pt-3 mt-3 border-t border-[#EDE5F5] dark:border-[#271E3C]">
                            <Button asChild size="sm" variant="ghost" className="p-0 h-auto text-xs font-bold text-[#5B3594] dark:text-[#FFA06E] hover:bg-transparent hover:underline">
                              <Link href={`/client/new-job?preferredSpecialist=${specialist.slug}&service=${encodeURIComponent(item.title)}`}>
                                Request Similar Deliverable →
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ===================================================================== */}
            {/* RIGHT SIDEBAR: Sharp Hire Card, Skills Matrix & Managed Guarantees   */}
            {/* ===================================================================== */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">

              {/* Primary Direct Request Card */}
              <div className="bg-white dark:bg-[#161026] border-2 border-[#5B3594] dark:border-[#FF7A3D]/60 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EDE5F5] dark:border-[#271E3C]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3594] dark:text-[#FF9057]">
                      Direct Booking
                    </span>
                    <h3 className="text-base font-extrabold text-[#22183D] dark:text-white">
                      Work with {specialist.displayName.split(' ')[0]}
                    </h3>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                    Active
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-[#4A4060] dark:text-[#DDD3E9]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Project reviewed by Senior Human QA Editor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Turnitin zero-similarity clearance certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% Milestone Escrow — Pay only on satisfaction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Strict mutual Non-Disclosure Agreement (NDA)</span>
                  </div>
                </div>

                <Button asChild className="w-full bg-[#FF7A3D] hover:bg-[#E5682C] text-white font-extrabold rounded-lg h-12 text-sm shadow-md shadow-[#FF7A3D]/20">
                  <Link href={`/client/new-job?preferredSpecialist=${specialist.slug}`}>
                    <span>Start Order with {specialist.displayName.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <p className="text-[11px] text-center text-[#6B627A] dark:text-[#DDD3E9]/70">
                  Need a custom quote? <a href={whatsAppInquiryUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[#5B3594] dark:text-[#FFA06E] hover:underline">Chat with PM on WhatsApp</a>
                </p>
              </div>

              {/* Technical & Core Skills Matrix */}
              <div className="bg-white dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-6 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#22183D] dark:text-white mb-3.5">
                  Core Skills &amp; Proficiencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {specialist.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-semibold bg-[#FAF8FD] dark:bg-[#1F1735] text-[#5B3594] dark:text-[#EFE8F8] px-3 py-1 rounded-md border border-[#DDD3E9]/80 dark:border-[#352952]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* TaskLynk Managed Protection Notice */}
              <div className="bg-[#FAF8FD] dark:bg-[#140E24] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-5 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#22183D] dark:text-white">
                  <Lock className="w-4 h-4 text-[#FF7A3D]" />
                  <span>Managed Marketplace Standard</span>
                </div>
                <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed">
                  Unlike unmanaged freelance directories, TaskLynk actively audits all project briefs, assigns senior editors, and verifies deliverables before release.
                </p>
                <div className="pt-2 border-t border-[#DDD3E9]/60 dark:border-[#2E2448] text-[10px] font-bold text-[#5B3594] dark:text-[#FFA06E] flex items-center justify-between">
                  <span>Escrow Protected</span>
                  <span>•</span>
                  <span>Free Revisions</span>
                  <span>•</span>
                  <span>24/7 PM Support</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
