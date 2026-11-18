import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Shield,
  Star,
  FileText,
  Clock,
  BookOpen,
  Award,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  HeartHandshake,
  CheckCircle2,
  Check,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';

export const metadata: Metadata = {
  title: 'About TaskLynk — Managed Professional Services Platform',
  description: 'Operating since October 2025 with over KSh 800,000+ in completed service volume. Learn how TaskLynk coordinates technology, data, research, design, and business solutions under dedicated project management.',
  ...generateCanonicalMetadata('/about'),
};

const companyValues = [
  {
    title: 'Managed Quality & Accountability',
    desc: 'TaskLynk operates as the service provider, not an unvetted freelance marketplace. We manage the process, supervise delivery, and remain fully accountable.',
    icon: ShieldCheck,
  },
  {
    title: 'Domain Specialist Matching',
    desc: 'Every project is assigned to verified team specialists with tested credentials in software engineering, statistics, corporate finance, or research.',
    icon: Users,
  },
  {
    title: 'Triple-Check Editorial & QA Rigour',
    desc: 'Work is inspected by dedicated editors and project managers before delivery to guarantee precision, integrity, and strict adherence to requirements.',
    icon: GraduationCap,
  },
  {
    title: 'Transparent Escrow Protection',
    desc: 'Funds remain securely protected in milestone escrow until the client reviews and approves the deliverable.',
    icon: HeartHandshake,
  },
];

const milestones = [
  { year: 'Oct 2025', title: 'TaskLynk Founded', desc: 'Launched in Nairobi to eliminate inconsistency in freelance delivery by introducing dedicated project managers and senior editorial oversight.' },
  { year: 'Late 2025', title: 'KSh 500,000+ Delivery Milestone', desc: 'Coordinated hundreds of successful academic, statistical, and business projects with verified 4.9/5 client satisfaction.' },
  { year: 'Early 2026', title: 'Multi-Service Expansion', desc: 'Expanded into Technology & Development, Data Analytics, Design & Creative, and Business Support while preserving our established academic standards.' },
  { year: 'Present', title: 'KSh 800,000+ Cumulative Volume', desc: 'Over KSh 800,000+ in completed service volume delivered, with an accredited public specialist directory and automated escrow security.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      <main className="flex-1">
        {/* Header / Hero */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#EEE5F8] dark:from-[#140E24] dark:via-[#18112C] dark:to-[#1D1533] border-b border-[#DDD3E9] dark:border-[#3A2F5B] overflow-hidden">
          {/* Active 3D Glowing Purple Silk Wave Engine */}
          <StripeGradientMesh
            mode="purple-section"
            heightClass="h-full"
            className="inset-0 opacity-40 pointer-events-none"
          />
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#EFE8F8]/80 dark:bg-[#271E42]/40 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-[#FF7A3D]/8 dark:bg-[#FF7A3D]/10 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="container mx-auto px-4 lg:px-8 text-center max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">About TaskLynk</span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              Get professional work done. <span className="text-[#FF7A3D]">Without managing it all yourself.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              From technology and data to research, design and business support, TaskLynk brings the right professional expertise together under dedicated project management.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B]">
                  Our Story &amp; Operating Record
                </span>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight leading-tight">
                  A Managed Platform Built on Accountability &amp; Trust
                </h2>
                <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  TaskLynk has been serving customers continuously since October 2025. Originally founded to eliminate unreliability and inconsistency in academic and statistical consulting, TaskLynk has successfully delivered over <strong>KSh 800,000+</strong> in cumulative service volume.
                </p>
                <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  Today, TaskLynk is expanding into a comprehensive managed professional services platform. Whether your business requires web development, complex SPSS data analysis, corporate branding, or administrative support, we manage the entire project lifecycle—from scope definition to final quality assurance.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="linen-card rounded-2xl p-5">
                    <p className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KSh 800K+</p>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-bold mt-1">Delivered Project Volume</p>
                  </div>
                  <div className="linen-card rounded-2xl p-5">
                    <p className="text-3xl font-black text-[#FF7A3D]">Oct 2025</p>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-bold mt-1">Continuous Operating History</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-gradient-to-br from-[#5B3594]/20 via-[#FF7A3D]/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="relative w-full aspect-[16/10] flex items-center justify-center">
                  <Image
                    src="/other-section.png"
                    alt="TaskLynk professional team reviewing research papers"
                    fill
                    className="object-contain object-bottom drop-shadow-[0_25px_45px_rgba(34,24,61,0.14)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.65)] transform hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Vision & Purpose */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#FAF8FD] dark:from-[#1D1533]/40 dark:via-[#140E24] dark:to-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                  Mission, Vision &amp; Purpose
                </span>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight">
                  Why TaskLynk Exists and Where We Are Heading
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-16">
                <div className="linen-card rounded-3xl p-7 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#22183D] dark:text-white mb-3">Our Mission</h3>
                    <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                      To democratize access to world-class academic and technical support by connecting students and researchers with verified, highly qualified specialists through a transparent, managed platform.
                    </p>
                  </div>
                </div>
                <div className="linen-card rounded-3xl p-7 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#22183D] dark:text-white mb-3">Our Vision</h3>
                    <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                      To become East Africa&apos;s most trusted academic excellence network, where every client achieves their full potential through ethical, verified, high-quality support.
                    </p>
                  </div>
                </div>
                <div className="linen-card rounded-3xl p-7 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#22183D] dark:text-white mb-3">Our Purpose</h3>
                    <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                      TaskLynk exists to eliminate the anxiety and inconsistency of unmanaged freelance boards by enforcing strict verification, triple-check editorial reviews, and dedicated project management.
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none text-[#6B627A] dark:text-[#DDD3E9]/90">
                <h3 className="text-2xl font-black text-[#22183D] dark:text-white mt-8 mb-4">Transforming Academic Support in Kenya and Beyond</h3>
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  The landscape of academic assistance in Kenya has evolved dramatically. What was once an informal network of unregulated online freelancers has transformed into a structured industry requiring professionalism, accountability, and measurable outcomes. TaskLynk Academic Solutions stands at the forefront of this transformation.
                </p>
                <p className="text-sm sm:text-base leading-relaxed mb-4">
                  Our approach differs fundamentally from open freelance platforms. On typical freelance boards, clients post orders and hope for the best. At TaskLynk, we have eliminated these risks by implementing a rigorous three-tier verification process for every specialist who joins our network.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                What We Stand For
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight">
                Our Core Principles &amp; Standards
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companyValues.map((val) => {
                const Icon = val.icon;
                return (
                  <div key={val.title} className="linen-card rounded-3xl p-7 flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center mb-5 border border-[#5B3594]/20">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-black text-[#22183D] dark:text-white mb-2">{val.title}</h3>
                      <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">{val.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Milestones / Timeline */}
        <section className="py-20 sm:py-28 bg-gradient-to-b from-[#FAF8FD] via-[#F5EEFB] to-[#FAF8FD] dark:from-[#140E24] dark:via-[#18112C] dark:to-[#140E24] border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                Our Journey
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight">
                Growth &amp; Platform Milestones
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {milestones.map((m) => (
                <div key={m.year} className="linen-card rounded-3xl p-7">
                  <span className="text-3xl font-black text-[#FF7A3D]">{m.year}</span>
                  <h3 className="text-base font-black text-[#22183D] dark:text-white mt-3 mb-1.5">{m.title}</h3>
                  <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#683FA8] via-[#5B3A8C] to-[#3E2068] border-t border-[#8B5CF6]/40 py-20 sm:py-28 text-white text-center">
          <StripeGradientMesh
            mode="purple-section"
            heightClass="h-full"
            className="inset-0 opacity-85 pointer-events-none"
          />
          <div className="container mx-auto px-4 max-w-3xl relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Ready to Partner With TaskLynk?</h2>
            <p className="text-base sm:text-lg text-[#DDD3E9] max-w-xl mx-auto leading-relaxed">
              Experience the difference of dedicated management and triple-check editorial oversight. Join 15,000+ successful clients today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <Button asChild size="lg" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold px-8 h-12 rounded-xl shadow-xl shadow-[#FF7A3D]/30 transition-all hover:scale-[1.02] min-w-[200px]">
                <Link href="/register/client" className="flex items-center justify-center gap-2">
                  <span>Place an Order</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-transparent hover:bg-white/10 border-2 border-white/40 text-white font-bold px-8 h-12 rounded-xl transition-all hover:scale-[1.02] min-w-[200px]">
                <Link href="/contact" className="flex items-center justify-center gap-2">
                  <span>Contact Our Team</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

