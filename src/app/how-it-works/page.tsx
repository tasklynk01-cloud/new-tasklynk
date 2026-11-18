import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  UserCheck,
  FileCheck,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  MessageSquare,
  Award,
  Check,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';

export const metadata: Metadata = {
  title: 'How TaskLynk Works — Managed Professional Services Workflow',
  description: 'Understand how TaskLynk manages orders from brief submission and specialist matching to quality assurance review and secure escrow delivery.',
  ...generateCanonicalMetadata('/how-it-works'),
};

const clientSteps = [
  {
    step: '01',
    title: 'Submit Order Brief & Attachments',
    desc: 'Fill out the order form specifying your academic level, formatting style (APA, MLA, Harvard, Chicago), page count, and deadline. Attach all prompt instructions and reference files.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'Dedicated Manager Assigns Specialist',
    desc: 'Your dedicated project manager audits your brief and assigns a vetted specialist with proven expertise in your specific topic area.',
    icon: UserCheck,
  },
  {
    step: '03',
    title: 'Writer Drafting & Interim Milestones',
    desc: 'The specialist crafts your document following strict academic conventions. For larger projects (theses, dissertations), you receive draft chapters for feedback.',
    icon: Clock,
  },
  {
    step: '04',
    title: 'Senior Human Editor Review',
    desc: 'Before delivery, our senior editorial team verifies academic grammar, citation correctness, structure, and runs a comprehensive Turnitin similarity audit.',
    icon: FileCheck,
  },
  {
    step: '05',
    title: 'Download & Request Free Revisions',
    desc: 'Review your deliverable. If any adjustments are needed, request free revisions. Once satisfied, approve the order.',
    icon: CheckCircle2,
  },
];

const writerSteps = [
  {
    step: '01',
    title: 'Apply & Complete Skill Assessment',
    desc: 'Register as a freelance writer, submit your academic samples, and pass our grammar and citation formatting evaluation.',
    icon: Award,
  },
  {
    step: '02',
    title: 'Admin Verification & Tier Placement',
    desc: 'Our academic review board verifies your credentials and places you in an initial CPP earning tier based on your domain expertise.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Receive Matched Orders from Managers',
    desc: 'Accept assignments tailored to your subject area and schedule. Communicate directly with project managers for clarifications.',
    icon: MessageSquare,
  },
  {
    step: '04',
    title: 'Submit Work & Earn Reliable Payouts',
    desc: 'Deliver quality work on time, receive editor feedback, advance to higher CPP tiers, and withdraw your earnings via secure M-Pesa / Bank transfer.',
    icon: CreditCard,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-transparent border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
          <StripeGradientMesh
            mode="hero"
            heightClass="h-[1200px]"
            className="inset-x-0 top-0 opacity-90 dark:opacity-80 pointer-events-none"
          />
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#EFE8F8]/80 dark:bg-[#271E42]/40 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-[#FF7A3D]/8 dark:bg-[#FF7A3D]/10 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">Transparent Managed Process</span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              How TaskLynk Guarantees <span className="text-[#FF7A3D]">Flawless Delivery</span>
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              A step-by-step breakdown of how our managed marketplace delivers publication-quality work for clients and rewarding opportunities for specialists.
            </p>
          </div>
        </section>

        {/* Client Workflow */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                For Clients &amp; Students
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight">
                The Client Experience: From Brief to Final Grade
              </h2>
              <p className="text-[#6B627A] dark:text-[#DDD3E9]/90 text-sm sm:text-base mt-3">
                Every order follows our structured 5-stage pipeline to ensure zero errors and guaranteed satisfaction.
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {clientSteps.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="linen-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="w-10 h-10 rounded-xl bg-[#5B3594] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#5B3594]/20">
                          {s.step}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-[#EFE8F8] text-[#5B3594] dark:bg-[#271E42] dark:text-[#EFE8F8] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-black text-[#22183D] dark:text-white mb-2">{s.title}</h3>
                      <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 p-6 sm:p-8 rounded-xl bg-gradient-to-r from-[#FAF8FD] via-[#F5EEFB] to-[#FAF8FD] dark:from-[#1D1533] dark:via-[#271E42] dark:to-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div>
                <h4 className="text-xl font-black text-[#22183D] dark:text-white">Ready to place your first order?</h4>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1">Get an instant quote and have a specialist assigned within 15 minutes.</p>
              </div>
              <Button asChild size="lg" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl px-8 h-12 min-w-[200px] shadow-lg shadow-[#FF7A3D]/25 shrink-0 hover:scale-[1.02] transition-all">
                <Link href="/register/client" className="flex items-center justify-center gap-2">
                  <span>Start an Order</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Writer Workflow */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#FF7A3D]/10 text-[#FF7A3D] border border-[#FF7A3D]/25 mb-3">
                For Academic Specialists
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight">
                The Specialist Journey: Build a Rewarding Freelance Career
              </h2>
              <p className="text-[#6B627A] dark:text-[#DDD3E9]/90 text-sm sm:text-base mt-3">
                Join Kenya&apos;s most reliable academic writing platform with transparent CPP tiers and bi-weekly M-Pesa payouts.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {writerSteps.map((w) => {
                const Icon = w.icon;
                return (
                  <div key={w.step} className="linen-card rounded-xl p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="w-10 h-10 rounded-xl bg-[#FF7A3D] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#FF7A3D]/20">
                          {w.step}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-[#FF7A3D]/15 text-[#FF7A3D] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-black text-[#22183D] dark:text-white mb-2">{w.title}</h3>
                      <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">{w.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div>
                <h4 className="text-xl font-black text-[#22183D] dark:text-white">Are you an expert in academic or data analysis writing?</h4>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1">Applications are open for verified Kenyan graduates and subject matter specialists.</p>
              </div>
              <Button asChild size="lg" className="bg-[#5B3594] hover:bg-[#48267A] text-white font-bold rounded-xl px-8 h-12 min-w-[220px] shadow-lg shadow-[#5B3594]/25 shrink-0 hover:scale-[1.02] transition-all">
                <Link href="/register/freelancer" className="flex items-center justify-center gap-2">
                  <span>Apply as a Specialist</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Guarantees */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />
          <div className="container mx-auto px-4 lg:px-8 text-center max-w-4xl relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-[#22183D] dark:text-white tracking-tight mb-12">Our Ironclad Service Guarantees</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="linen-card p-6 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="text-base font-black text-[#22183D] dark:text-white">100% Originality</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">Official Turnitin report with every order showing 0% unoriginal text.</p>
              </div>
              <div className="linen-card p-6 rounded-xl">
                <RotateCcw className="w-8 h-8 text-[#5B3594] mb-3" />
                <h3 className="text-base font-black text-[#22183D] dark:text-white">Unlimited Revisions</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">Free revisions within 14 days if any instructions were not fulfilled.</p>
              </div>
              <div className="linen-card p-6 rounded-xl">
                <CreditCard className="w-8 h-8 text-[#FF7A3D] mb-3" />
                <h3 className="text-base font-black text-[#22183D] dark:text-white">Secure Escrow Payment</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">Your funds are protected until you review and approve the final deliverable.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

