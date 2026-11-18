import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calculator,
  Percent,
  Clock,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HeroCalculator } from '@/components/site/hero-calculator';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';

export const metadata: Metadata = {
  title: 'TaskLynk Pricing & Calculator — Transparent Service Rates in Kenya',
  description: 'Explore TaskLynk’s transparent rates and custom project pricing across web development, data analytics, design, video, business support, and academic writing in KSh.',
  ...generateCanonicalMetadata('/pricing'),
};

const pricingTiers = [
  {
    name: 'College / High School',
    rate: 'KSh 220',
    per: 'per page (~275 words)',
    desc: 'Standard high school & diploma assignments, summaries, and short reflective essays.',
    features: ['Plagiarism Report Included', 'APA / MLA / Harvard Style', 'Standard 3-5 Day Delivery', 'Free Title & Bibliography'],
    popular: false,
  },
  {
    name: 'Undergraduate',
    rate: 'KSh 250',
    per: 'per page (~275 words)',
    desc: 'University term papers, literature reviews, lab reports, and case study analyses.',
    features: ['Plagiarism Report Included', 'Peer-Reviewed Scholarly Sources', 'Senior Editor QA Check', '3-Hour Rush Options Available'],
    popular: true,
  },
  {
    name: "Master's / Postgraduate",
    rate: 'KSh 320',
    per: 'per page (~275 words)',
    desc: 'Postgraduate research proposals, comprehensive literature reviews, and critical essays.',
    features: ['Domain Specialist Matching', 'Advanced Theoretical Frameworks', 'Turnitin Similarity Audit', 'Direct WhatsApp with PM'],
    popular: false,
  },
  {
    name: 'PhD / Technical & SPSS',
    rate: 'KSh 420',
    per: 'per page / section',
    desc: 'Doctoral dissertations, statistical data modeling (SPSS, R), and journal publication drafts.',
    features: ['PhD-Level Analyst Assignment', 'Data Cleaning & Syntax Output', 'Defensible Chapter 4 & 5 Writeup', 'Priority 24/7 PM Support'],
    popular: false,
  },
];

const freeInclusions = [
  'Turnitin Plagiarism & Similarity Report',
  'Title / Cover Page in Any Format',
  'Formatted Bibliography & Reference List',
  'Unlimited Free Revisions (within 14 days)',
  'Formatting in APA 7th, MLA 9th, Harvard, or Chicago',
  '24/7 Dedicated Project Manager Support',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-transparent border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
          <StripeGradientMesh
            mode="hero"
            heightClass="h-[1200px]"
            className="inset-x-0 top-0 opacity-100 dark:opacity-90 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">100% Transparent CPP Pricing</span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              Fair, Transparent Pricing with <span className="text-[#FF7A3D]">Zero Hidden Fees</span>
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              Our Cost-Per-Page (CPP) model guarantees that you only pay for what you need, with free Turnitin reports and unlimited revisions included.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`linen-card relative p-7 rounded-3xl flex flex-col justify-between ${
                    tier.popular
                      ? 'border-2 border-[#FF7A3D] shadow-xl shadow-[#FF7A3D]/15 md:scale-105 z-10 bg-gradient-to-b from-[#FAF8FD] via-white to-[#FAF8FD] dark:from-[#271E42] dark:to-[#1D1533]'
                      : 'hover:border-[#5B3594]'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF7A3D] text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md shadow-[#FF7A3D]/25">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-black text-[#22183D] dark:text-white mb-1.5">{tier.name}</h3>
                    <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mb-5 leading-relaxed">{tier.desc}</p>
                    
                    <div className="mb-6 pb-6 border-b border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                      <span className="text-4xl font-black text-[#22183D] dark:text-white tracking-tight">{tier.rate}</span>
                      <span className="text-xs font-semibold text-[#6B627A] dark:text-[#DDD3E9]/70 block mt-1">{tier.per}</span>
                    </div>

                    <ul className="space-y-3 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90 mb-8">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 font-bold" />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button asChild size="lg" className={`w-full font-bold rounded-xl h-12 ${
                    tier.popular 
                      ? 'bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-lg shadow-[#FF7A3D]/25' 
                      : 'bg-[#5B3594] hover:bg-[#48267A] text-white'
                  }`}>
                    <Link href="/register/client">Order This Level</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Calculator Section */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9] dark:border-[#3A2F5B]" id="calculator">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B]">
                  Custom Estimate
                </span>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#22183D] dark:text-white tracking-tight">
                  Calculate the Exact Cost of Your Project
                </h2>
                <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  Use our live estimator to check pricing based on your page count, academic level, and delivery urgency.
                </p>

                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-bold text-[#22183D] dark:text-white">Everything Included with Every Order at No Extra Charge:</h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-[#6B627A] dark:text-[#DDD3E9]/90">
                    {freeInclusions.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#1D1533] border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                        <Check className="w-3.5 h-3.5 text-emerald-500 font-bold shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <HeroCalculator />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-3xl relative z-10">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#EFE8F8] text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42] dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#22183D] dark:text-white tracking-tight">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              <div className="linen-card p-6 sm:p-7 rounded-xl">
                <h3 className="text-base font-black text-[#22183D] dark:text-white">How are pages calculated?</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">One standard academic page equals 275 words, double-spaced with standard 1-inch margins in 12pt Times New Roman or Arial.</p>
              </div>
              <div className="linen-card p-6 sm:p-7 rounded-xl">
                <h3 className="text-base font-black text-[#22183D] dark:text-white">Are there extra fees for Turnitin reports?</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">No! Every completed paper includes a free Turnitin similarity report generated upon final editorial review.</p>
              </div>
              <div className="linen-card p-6 sm:p-7 rounded-xl">
                <h3 className="text-base font-black text-[#22183D] dark:text-white">What payment methods are supported in Kenya?</h3>
                <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1.5 leading-relaxed">We accept M-Pesa, debit/credit cards, and direct bank transfers via our secure escrow checkout.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

