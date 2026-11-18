import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Star,
  Clock,
  ArrowRight,
  UserCheck,
  TrendingUp,
  BadgeCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Quote,
  Check,
  Headphones,
  RotateCcw,
  Lock,
  UserPlus,
  Send,
  BookOpen,
  HeartHandshake,
  Sparkles,
  Cloud,
  Cpu,
  Layers,
  ExternalLink,
  BarChart3,
  Building2,
  Code2,
  Palette,
  Briefcase,
  FileSpreadsheet,
  Search,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HeroCalculator } from '@/components/site/hero-calculator';
import { RoleSelectionDialog } from '@/components/auth/role-selection-dialog';
import { InteractiveServicesPreview } from '@/components/site/interactive-services-preview';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { SpecialistAvatar } from '@/components/site/specialist-avatar';
import { siteConfig } from '@/lib/seo-config';
import { blogArticles } from '@/lib/blog-data';
import { getPublishedSpecialists, getPublicPlatformMetrics } from '@/lib/public-specialist-dto';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'TaskLynk — Professional Services. One Trusted Platform.',
  description: 'Get professional work done without managing it all yourself. TaskLynk coordinates verified specialists in technology, data analytics, graphic design, business support, research, and academic writing under dedicated project management.',
  keywords: 'professional services Kenya, SPSS data analysis Nairobi, web development Kenya, business plans Nairobi, graphic design Kenya, managed writing platform, academic research Kenya, virtual assistance Nairobi',
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: 'TaskLynk — Professional Services. One Trusted Platform.',
    description: 'We coordinate the expertise. We manage the process. You get the work done. Professional technology, data, creative, and business services.',
    url: siteConfig.url,
    siteName: 'TaskLynk Managed Professional Services',
    images: [
      {
        url: '/how-hero-should-look-like.png',
        width: 1200,
        height: 630,
        alt: 'TaskLynk Professional Team',
      },
    ],
    locale: 'en_KE',
    type: 'website',
  },
};

const serviceCategories = [
  {
    title: 'Technology & Development',
    description: 'Bespoke business websites, custom web applications, API integrations, and robust database architecture.',
    icon: Code2,
    href: '/services/website-development',
    subservices: ['Website Development', 'Software Systems', 'Systems Integration'],
    badge: 'Tech & Engineering',
  },
  {
    title: 'Data & Analytics',
    description: 'Quantitative and qualitative statistical analysis, SPSS, R, Python, interactive Power BI dashboards, and data cleaning.',
    icon: BarChart3,
    href: '/services/data-analytics',
    subservices: ['Statistical Analysis (SPSS/R)', 'Power BI Dashboards', 'Data Processing'],
    badge: 'Data & Insights',
  },
  {
    title: 'Design & Creative',
    description: 'Distinctive brand identities, logos, executive pitch decks, corporate video production, and motion graphics.',
    icon: Palette,
    href: '/services/graphic-design',
    subservices: ['Brand Identity & Logos', 'Video Production', 'Presentation Design'],
    badge: 'Creative & Media',
  },
  {
    title: 'Business Support',
    description: 'Virtual assistance, document management, bookkeeping, financial reporting, and executive administration.',
    icon: Briefcase,
    href: '/services/virtual-assistance',
    subservices: ['Virtual Assistance', 'Bookkeeping & Reconciliation', 'Office Productivity'],
    badge: 'Operations',
  },
  {
    title: 'Research & Professional Writing',
    description: 'Commercial feasibility studies, investor-ready business plans, industry intelligence, and corporate communications.',
    icon: FileSpreadsheet,
    href: '/services/business-research',
    subservices: ['Market Research', 'Business Plans', 'Professional Writing'],
    badge: 'Strategy',
  },
  {
    title: 'Academic Writing & Support',
    description: 'Essays, research papers, theses, dissertations, methodology design, literature reviews, and APA/Harvard formatting.',
    icon: BookOpen,
    href: '/services/academic-writing',
    subservices: ['Academic Writing Services', 'Theses & Dissertations', 'Research Papers & Essays'],
    badge: 'Academic Writing',
  },
];

const enterpriseModules = [
  {
    id: 'dashboard',
    title: 'Executive Command Center & Pulse',
    badge: 'CEO Digital Twin',
    icon: Building2,
    desc: 'Real-time multi-branch operations, revenue velocity, and executive telemetry in a unified digital headquarters.',
    routeUrl: 'https://app.tasklynk.co.ke/dashboard',
    tag: 'app.tasklynk.co.ke/dashboard',
  },
  {
    id: 'automation',
    title: '80% Autonomous AI Workflow Engine',
    badge: 'Autonomous OS',
    icon: Zap,
    desc: 'Automated event-to-action triggers, autonomous billing, order routing, and intelligent document parsing.',
    routeUrl: 'https://app.tasklynk.co.ke/automation',
    tag: 'app.tasklynk.co.ke/automation',
  },
  {
    id: 'company-health',
    title: '4-Pillar Company Health Diagnostic',
    badge: 'Biometric Index',
    icon: TrendingUp,
    desc: 'Automated diagnostic index evaluating Financial Vitality, Operational Friction, Workforce Efficiency & Market Momentum.',
    routeUrl: 'https://app.tasklynk.co.ke/company-health',
    tag: 'app.tasklynk.co.ke/company-health',
  },
  {
    id: 'finance',
    title: 'Real-Time Financial & Cashflow OS',
    badge: 'Financial Engine',
    icon: BarChart3,
    desc: 'Live multi-currency invoicing, automated P&L statement computation, balance tracking, and cash runway modeling.',
    routeUrl: 'https://app.tasklynk.co.ke/finance',
    tag: 'app.tasklynk.co.ke/finance',
  },
  {
    id: 'cloud-ops',
    title: 'Enterprise Cloud Migration & Ops',
    badge: 'Cloud Infra',
    icon: Cloud,
    desc: 'Production cloud architecture, Terraform Infrastructure as Code, and 99.99% high-availability SLA uptime.',
    routeUrl: 'https://app.tasklynk.co.ke/services',
    tag: 'app.tasklynk.co.ke/services',
  },
  {
    id: 'security',
    title: '24/7 Managed IT Support & Security',
    badge: 'SOC Defense',
    icon: ShieldCheck,
    desc: 'Real-time vulnerability scanning, Tier-3 engineer incident response desk, and automated offsite backups.',
    routeUrl: 'https://app.tasklynk.co.ke/security',
    tag: 'app.tasklynk.co.ke/security',
  },
];

const roadmapSteps = [
  {
    step: '01',
    title: 'Submit Brief',
    tagline: 'Simple Onboarding',
    desc: 'Share your requirements, deliverables, timeline, and specifications in our structured brief form.',
  },
  {
    step: '02',
    title: 'Team Assignment',
    tagline: 'Managed Matching',
    desc: 'TaskLynk assigns qualified domain specialists and pairs your project with dedicated management oversight.',
  },
  {
    step: '03',
    title: 'Quality Execution',
    tagline: 'Multi-Tier QA',
    desc: 'Our team completes the work to your specifications, followed by internal quality review and standard audits.',
  },
  {
    step: '04',
    title: 'Review & Approval',
    tagline: 'Secure Escrow',
    desc: 'Inspect your finished deliverables, request revisions if required, and release payment only when satisfied.',
  },
];



const testimonials = [
  {
    name: 'Grace Wanjiku',
    role: 'Operations Director, Nairobi',
    rating: 5,
    quote: 'TaskLynk delivered our corporate presentation and market analysis in 48 hours. The quality was outstanding and saved our leadership team dozens of hours. Having a dedicated manager made all the difference.',
    service: 'Business Research & Presentation',
  },
  {
    name: 'David Kipchoge',
    role: 'Postgraduate Researcher',
    rating: 5,
    quote: 'I needed complex statistical analysis for my thesis. TaskLynk assigned a senior data specialist who verified every model and provided clean, defensible APA tables. Methodologically sound from start to finish.',
    service: 'SPSS Data Analysis',
  },
  {
    name: 'Amina Hassan',
    role: 'Tech Startup Founder',
    rating: 5,
    quote: 'Their business plan and financial modeling specialists understood our business model immediately. We successfully secured seed interest with the deck and model they produced.',
    service: 'Business Planning & Financial Modeling',
  },
];

const featuredPosts = blogArticles.slice(0, 3).map((post) => ({
  title: post.title,
  slug: post.slug,
  category: post.category,
  readTime: post.readTime,
}));

export default async function HomePage() {
  const [publishedSpecialists, metrics] = await Promise.all([
    getPublishedSpecialists(12),
    getPublicPlatformMetrics(),
  ]);

  const credibilityStats = [
    { value: `${metrics.verifiedSpecialists}+`, label: 'Verified Specialists', subtext: 'Approved across all disciplines' },
    { value: `KSh ${metrics.totalVolumeKes.toLocaleString('en-KE')}`, label: 'Order Volume', subtext: 'Tracked platform transactions' },
    { value: `${metrics.managersAndEditors}`, label: 'Managers & Editors', subtext: 'Dedicated oversight & QA' },
    { value: `${metrics.registeredClients}+`, label: 'Registered Clients', subtext: 'Businesses, teams & individuals' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#241B3F] dark:text-[#F8F5FC] flex flex-col relative selection:bg-[#FF7A3D]/20 selection:text-[#FF7A3D]">
      
      {/* 1. HERO 3D SILK GRADIENT WAVE ENGINE (Fitted right from the topmost edge y=0 behind transparent header) */}
      <StripeGradientMesh
        mode="hero"
        heightClass="h-[2600px]"
        className="inset-x-0 top-0 opacity-100 dark:opacity-90 pointer-events-none"
      />

      <MainHeader />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: 'TaskLynk Kenya',
            description: 'Managed professional services platform for businesses, researchers, and students in Kenya.',
            url: siteConfig.url,
            telephone: '+254701066845',
            priceRange: 'KSh 300 - KSh 150,000',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Nairobi',
              addressCountry: 'KE',
            },
          }),
        }}
      />

      <main className="flex-1 overflow-x-hidden">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION - Transparent Glass with 3D Wave Flowing to the Topmost */}
        {/* ========================================================================= */}
        <section className="relative pt-28 sm:pt-32 pb-10 bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          {/* Ambient Glows */}
          <div className="absolute top-10 left-1/4 w-[520px] h-[520px] bg-[#EFE8F8]/60 dark:bg-[#271E42]/30 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute top-20 right-10 w-[460px] h-[460px] bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-4 sm:pt-6">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-4 items-center min-h-[580px]">
              
              {/* Left Column: Bold Typography, Brand Positioning, Search, Actions */}
              <div className="lg:col-span-5 space-y-5 lg:space-y-6 z-10">
                {/* Executive Eyebrow */}
                <div className="inline-flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF7A3D] ring-4 ring-[#FF7A3D]/20 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#5B3594] dark:text-[#FFA06E]">
                    Kenya&apos;s Managed Professional Services Platform
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl xl:text-[50px] font-bold tracking-tight text-[#22183D] dark:text-white leading-[1.12]">
                  Find the expertise you need.<br />
                  <span className="text-[#FF7A3D]">Get the results you deserve.</span>
                </h1>

                {/* Subtext Body */}
                <div className="space-y-2.5 max-w-xl text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  <p>
                    From website development and software solutions to data analysis, graphic design, video production, research, writing, and business support, TaskLynk brings diverse professional expertise together under one roof.
                  </p>
                  <p>
                    Whether you are an individual, a growing business, or an organisation, we make it easier to access the right skills, manage your projects, and get quality work delivered.
                  </p>
                  <p className="font-bold text-[#5B3594] dark:text-[#FFA06E] text-sm sm:text-base pt-1">
                    One company. Multiple services. Professional results.
                  </p>
                </div>

                {/* Search Bar for Service Discovery */}
                <form action="/services" method="GET" className="relative flex items-center max-w-md w-full">
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B627A] dark:text-[#DDD3E9]/60" />
                    <input
                      type="text"
                      name="q"
                      required
                      placeholder="What do you need done? Search for a service..."
                      className="w-full pl-10 pr-24 py-3 bg-white/95 dark:bg-[#1D1533]/95 border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A3D] text-[#22183D] dark:text-white placeholder-[#6B627A]/70 shadow-sm"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-[#5B3594] hover:bg-[#48267A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* Dual Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <RoleSelectionDialog
                    trigger={
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold px-6 h-12 rounded-2xl shadow-md shadow-[#FF7A3D]/25 hover:shadow-lg hover:shadow-[#FF7A3D]/35 transition-all text-xs sm:text-sm whitespace-nowrap hover:scale-[1.02]"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span>Get Started</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </span>
                      </Button>
                    }
                  />

                  <Button
                    asChild
                    size="lg"
                    className="bg-transparent hover:bg-[#5B3594] border-2 border-[#5B3594] text-[#5B3594] hover:text-white font-bold px-6 h-12 rounded-xl shadow-sm text-xs sm:text-sm whitespace-nowrap transition-all hover:scale-[1.02]"
                  >
                    <Link href="/services" className="flex items-center justify-center gap-2">
                      <span>Explore Our Services</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Center & Right: Cutout Photo of Specialist & Floating Badges */}
              <div className="lg:col-span-7 relative flex items-end justify-center min-h-[380px] sm:min-h-[480px] lg:min-h-[580px]">
                {/* Main Specialist Image */}
                <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[580px] flex items-end justify-center">
                  <Image
                    src="/hero-main.png"
                    alt="TaskLynk professional team specialist"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-contain object-bottom scale-105 lg:scale-110 translate-y-2 lg:translate-y-4"
                    priority
                  />
                </div>

                {/* Floating Cards Stack on Right Column */}
                <div className="hidden lg:flex absolute top-4 right-2 flex-col gap-3.5 z-20 max-w-[280px]">
                  {/* Floating Card 1: TaskLynk Team Specialist */}
                  <div className="linen-card rounded-2xl p-3.5 shadow-xl flex items-center gap-3 hover:scale-[1.03] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#22183D] dark:text-white">TaskLynk Team Specialist</p>
                      <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">Accredited Domain Expert</p>
                    </div>
                  </div>

                  {/* Floating Card 2: Dedicated Manager */}
                  <div className="linen-card rounded-2xl p-3.5 shadow-xl flex items-center gap-3 hover:scale-[1.03] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-[#FF7A3D]/20 text-[#FF7A3D] flex items-center justify-center shrink-0 border border-[#FF7A3D]/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#22183D] dark:text-white">Dedicated Manager</p>
                      <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">Overseeing Your Deliverables</p>
                    </div>
                  </div>

                  {/* Floating Card 3: Quality Verified */}
                  <div className="linen-card rounded-2xl p-3.5 shadow-xl flex items-center gap-3 hover:scale-[1.03] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-[#5B3594]/20 text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0 border border-[#5B3594]/30">
                      <BadgeCheck className="w-5 h-5 text-[#5B3594] dark:text-[#FF7A3D]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#22183D] dark:text-white">Quality Verified</p>
                      <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">Triple-Check Audit</p>
                    </div>
                  </div>

                  {/* Floating Card 4: Managed Order State */}
                  <div className="linen-card rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform">
                    <div className="pb-2 mb-2 border-b border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                      <span className="text-xs font-bold tracking-wide text-[#22183D] dark:text-white">PROJECT #TL-MANAGED</span>
                    </div>
                    
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2 text-[#22183D] dark:text-[#EFE8F8] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                        <span>Brief Scoped &amp; Verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#22183D] dark:text-[#EFE8F8] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                        <span>Specialist Assigned</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#22183D] dark:text-[#EFE8F8] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                        <span>Project Manager Reviewing</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#22183D] dark:text-[#EFE8F8] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                        <span>Approved &amp; Ready for Delivery</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Trust Quick Badges */}
                <div className="lg:hidden absolute bottom-2 inset-x-2 flex items-center justify-around gap-1.5 bg-white/90 dark:bg-[#1D1533]/90 backdrop-blur-md rounded-2xl p-2.5 border border-[#DDD3E9] dark:border-[#3A2F5B] shadow-lg text-[11px] font-bold">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Vetted Team</span>
                  </div>
                  <span className="text-[#5B3A8C]/30">|</span>
                  <div className="flex items-center gap-1 text-[#FF7A3D]">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Dedicated PM</span>
                  </div>
                  <span className="text-[#5B3A8C]/30">|</span>
                  <div className="flex items-center gap-1 text-[#5B3594] dark:text-[#EFE8F8]">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Escrow Protected</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Hero Credibility Banner */}
            <div className="mt-8 sm:mt-12 linen-card rounded-[28px] sm:rounded-[36px] shadow-2xl p-6 sm:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#DDD5E8]/60 dark:divide-[#3A2F5B]/60">
                {credibilityStats.map((stat, idx) => (
                  <div key={stat.label} className={`flex items-center gap-4 sm:px-4 ${idx > 0 ? 'pt-4 lg:pt-0' : ''}`}>
                    <div className="w-12 h-12 rounded-2xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center shrink-0 border border-[#5B3594]/30">
                      {idx === 0 && <Clock className="w-6 h-6" />}
                      {idx === 1 && <TrendingUp className="w-6 h-6" />}
                      {idx === 2 && <ShieldCheck className="w-6 h-6" />}
                      {idx === 3 && <Star className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-[#241B3F] dark:text-white tracking-tight">{stat.value}</p>
                      <p className="text-xs sm:text-sm font-bold text-[#6F687A] dark:text-[#DDD5E8]/90">{stat.label}</p>
                      <p className="text-[11px] text-[#6F687A]/80 dark:text-[#DDD5E8]/60">{stat.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CORE SERVICE DISCOVERY GRID (6 MAJOR CATEGORIES) */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-24 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-14 text-center mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFE8F8]/80 text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42]/80 dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                Service Taxonomy
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                Explore Our Managed Professional Services
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-3 max-w-2xl mx-auto">
                TaskLynk coordinates accredited team specialists across technology, data, creative, business, and research disciplines—managed end-to-end for guaranteed quality.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceCategories.map((cat) => (
                <div
                  key={cat.title}
                  className="linen-card group rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#FF7A3D] transition-all duration-300 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center border border-[#5B3594]/25 group-hover:bg-[#FF7A3D] group-hover:text-white transition-colors">
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8] dark:bg-[#271E42] px-3 py-1 rounded-full border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                        {cat.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#22183D] dark:text-white mb-2 group-hover:text-[#FF7A3D] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed mb-4">
                      {cat.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
                      {cat.subservices.map((sub) => (
                        <div key={sub} className="flex items-center gap-2 text-xs text-[#22183D]/80 dark:text-white/80">
                          <Check className="w-3.5 h-3.5 text-[#FF7A3D] shrink-0" />
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B] flex items-center justify-between">
                    <Link
                      href={cat.href}
                      className="text-xs sm:text-sm font-bold text-[#5B3594] dark:text-[#FF7A3D] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
                    >
                      <span>View Service Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button
                asChild
                size="lg"
                className="bg-[#5B3594] hover:bg-[#48267A] text-white font-bold px-8 h-12 rounded-2xl shadow-lg shadow-[#5B3594]/20 transition-all hover:scale-[1.02]"
              >
                <Link href="/services">
                  <span>Browse All Service Offerings</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. BUSINESS CREDIBILITY: "EXPERIENCE YOU CAN BUILD ON" */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-24 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#EEE7FA]/80 dark:bg-[#271E42]/80 text-[#5B3594] dark:text-[#EEE7FA] px-3.5 py-1 rounded-full text-xs font-bold border border-[#DDD3E9] dark:border-[#3A2F5B]">
                  <Award className="w-4 h-4 text-[#FF7A3D]" />
                  <span>Business Credibility &amp; Track Record</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-[#241B3F] dark:text-white tracking-tight leading-tight">
                  Experience You Can Build On.<br />
                  <span className="text-[#FF7A3D]">Serving Clients Continuously Since October 2025.</span>
                </h2>

                <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  TaskLynk has served clients since October 2025, coordinating over <strong>KSh 800,000+</strong> in completed professional deliverables. We have grown from a premier academic writing provider into a multi-discipline professional services firm trusted by students, businesses, and institutional researchers across Kenya and beyond.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                      <ShieldCheck className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22183D] dark:text-white">Accountability as the Service Provider</h4>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">TaskLynk owns the customer relationship and remains fully accountable for quality, deadlines, and milestone completion. Our professionals operate as cohesive team members, not unmonitored freelance sellers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#5B3594]/20 text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0 mt-0.5 border border-[#5B3594]/30">
                      <Users className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22183D] dark:text-white">Dedicated Project Management</h4>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">Every assignment is paired with a dedicated project manager who verifies requirements, coordinates specialized talent, and manages delivery timelines.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#FF7A3D]/20 text-[#FF7A3D] flex items-center justify-center shrink-0 mt-0.5 border border-[#FF7A3D]/30">
                      <Lock className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22183D] dark:text-white">Secure Milestone Escrow &amp; M-Pesa Integration</h4>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">Your funds remain safely held in milestone escrow. You review and verify the completed deliverable before releasing payment.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    asChild
                    variant="outline"
                    className="linen-card border-[#5B3594] text-[#5B3594] dark:text-[#EFE8F8] font-bold px-6 rounded-2xl"
                  >
                    <Link href="/about">
                      <span>Read Our Company History &amp; Mission</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Hero Calculator / Investment estimator */}
              <div className="lg:col-span-6">
                <HeroCalculator />
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FOUR-STEP MANAGED PIPELINE ("HOW TASKLYNK WORKS") */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-16 text-center mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFE8F8]/80 text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42]/80 dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                Managed Execution Model
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                How TaskLynk Works
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-3 max-w-2xl mx-auto">
                We coordinate the expertise. We manage the process. You get the work done.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {roadmapSteps.map((s, idx) => (
                <div 
                  key={s.step} 
                  className="linen-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#FF7A3D] transition-all duration-300 z-10"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#5B3594] text-white font-bold text-base flex items-center justify-center shadow-lg shadow-[#5B3594]/25 group-hover:bg-[#FF7A3D] group-hover:shadow-[#FF7A3D]/25 transition-all duration-300">
                        {s.step}
                      </div>

                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8]/80 dark:bg-[#271E42]/80 px-3 py-1 rounded-full border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                        {s.tagline}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#22183D] dark:text-white mb-2.5 group-hover:text-[#FF7A3D] transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B] flex items-center justify-between text-xs font-semibold text-[#5B3594] dark:text-[#EFE8F8]">
                    <span>Stage 0{idx + 1}</span>
                    {idx < 3 ? (
                      <ArrowRight className="w-4 h-4 text-[#FF7A3D] group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-500 font-bold" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. MEET THE PROFESSIONALS BEHIND TASKLYNK (SHOWCASE) */}
        {/* ========================================================================= */}
        {publishedSpecialists.length > 0 && (
          <section className="py-20 sm:py-24 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
            <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />
  
            <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
              <div className="max-w-3xl mb-14 text-center mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFE8F8]/80 text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42]/80 dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                  TaskLynk Professional Team
                </span>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                  Meet the Professionals Behind TaskLynk
                </h2>
                <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-3 max-w-2xl mx-auto">
                  Every specialist is fully vetted, accredited, and managed under TaskLynk’s rigorous service delivery standards.
                </p>
              </div>

              <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
                <div className="animate-specialists-marquee gap-6">
                  {[...publishedSpecialists, ...publishedSpecialists].map((specialist, idx) => (
                    <div
                      key={`${specialist.slug}-${idx}`}
                      className="linen-card group rounded-xl p-5 flex flex-col justify-between hover:border-[#FF7A3D] transition-all duration-300 hover:shadow-xl w-[285px] sm:w-[310px] shrink-0"
                    >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
<SpecialistAvatar
                          avatarUrl={specialist.avatarUrl}
                          name={specialist.displayName}
                          headline={specialist.headline}
                          size="md"
                          className="shadow-md ring-2 ring-[#FF7A3D]/20 shrink-0 rounded-full"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-base text-[#22183D] dark:text-white truncate">
                            {specialist.displayName}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Team Specialist
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-[#FF7A3D] line-clamp-1 mb-2">
                        {specialist.headline}
                      </p>

                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 line-clamp-3 mb-4 leading-relaxed">
                        {specialist.bio}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50 mb-4">
                        {specialist.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B]">
                      <Button
                        asChild
                        size="sm"
                        className="w-full bg-[#5B3594] hover:bg-[#48267A] text-white text-xs font-bold rounded-xl"
                      >
                        <Link href={`/professionals/${specialist.slug}`}>
                          <span>View Profile &amp; Portfolio</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 text-center">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="linen-card border-2 border-[#5B3594] text-[#5B3594] dark:text-[#EFE8F8] font-bold px-8 h-12 rounded-2xl"
                >
                  <Link href="/professionals">
                    <span>Explore Complete Professional Directory</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. ASYMMETRIC QUALITY SHOWCASE */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Asymmetric Cutout Photo */}
              <div className="lg:col-span-6 relative">
                <div className="relative w-full aspect-[16/10] flex items-center justify-center">
                  <Image
                    src="/other-section.png"
                    alt="TaskLynk senior editors and project managers reviewing deliverables"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    loading="lazy"
                    className="object-contain object-bottom drop-shadow-[0_25px_45px_rgba(34,24,61,0.14)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.7)] transform hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                {/* Floating Seal */}
                <div className="absolute -bottom-3 left-2 sm:bottom-0 sm:left-4 linen-card rounded-2xl p-4 shadow-2xl max-w-xs z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5B3594]/20 text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0">
                      <BadgeCheck className="w-6 h-6 text-[#FF7A3D]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#22183D] dark:text-white">Triple-Check Assurance</p>
                      <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70">Specialist + Editor + Manager Verification</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Feature Callouts */}
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B3594] dark:text-[#FF7A3D]">The Managed Difference</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#22183D] dark:text-white tracking-tight leading-tight">
                  Human Oversight &amp; Uncompromising Standards
                </h2>
                <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed">
                  Unlike generic freelance marketplaces where you are left alone to negotiate and check quality, TaskLynk inserts experienced editors, domain specialists, and a dedicated project manager on every project.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-1 border border-emerald-500/30">
                      <Check className="w-4 h-4 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22183D] dark:text-white">Strict Quality &amp; Originality Audit</h4>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">Every technical deliverable, report, and analysis is audited against industry benchmarks before client release.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#5B3594]/20 text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0 mt-1 border border-[#5B3594]/30">
                      <Check className="w-4 h-4 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22183D] dark:text-white">Direct Project Management</h4>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">Your manager handles assignment, questions, and timelines so you stay focused on your core work.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#FF7A3D]/20 text-[#FF7A3D] flex items-center justify-center shrink-0 mt-1 border border-[#FF7A3D]/30">
                      <Check className="w-4 h-4 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22183D] dark:text-white">100% Escrow Milestone Protection</h4>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mt-0.5">Funds remain securely held in escrow until you review and approve the finalized deliverable.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[#5B3594] hover:bg-[#48267A] text-white font-bold px-7 h-12 rounded-2xl shadow-lg shadow-[#5B3594]/20 transition-all hover:scale-[1.02]"
                  >
                    <Link href="/services">
                      <span>Explore Our Service Standards</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. INTERACTIVE SERVICES CONSOLE */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-14 text-center mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFE8F8]/80 text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42]/80 dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                Disciplines &amp; Expertise
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                Verified Coverage Across Every Field
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-3 max-w-2xl mx-auto">
                Explore our specialized technical, academic, data, and business tracks. Click any category to preview our deliverables.
              </p>
            </div>

            <InteractiveServicesPreview />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5.5 ENTERPRISE DIGITAL OS PLATFORM SHOWCASE (app.tasklynk.co.ke) */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-14 text-center mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-[#FF7A3D]/15 border border-[#FF7A3D]/30 rounded-full px-4 py-1.5 text-xs font-bold text-[#FF7A3D]">
                <Layers className="w-4 h-4 text-[#FF7A3D]" />
                <span>Enterprise Digital Ecosystem • app.tasklynk.co.ke</span>
              </div>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                Connected Enterprise OS &amp; Autonomous Workspaces
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 max-w-2xl mx-auto leading-relaxed">
                Beyond managed services, explore TaskLynk&apos;s digital enterprise operating system hosted on <a href="https://app.tasklynk.co.ke" target="_blank" rel="noopener noreferrer" className="text-[#FF7A3D] font-bold hover:underline">app.tasklynk.co.ke</a> for automated company operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enterpriseModules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.id}
                    className="linen-card group rounded-2xl p-7 flex flex-col justify-between hover:border-[#FF7A3D] transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-[#5B3594]/20 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center font-bold">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#EFE8F8]/80 text-[#5B3594] dark:bg-[#271E42]/80 dark:text-[#FF7A3D] border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                          {m.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#22183D] dark:text-white group-hover:text-[#FF7A3D] transition-colors leading-snug">
                        {m.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#DDD3E9]/50 dark:border-[#3A2F5B] flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#6B627A] dark:text-[#DDD3E9]/60">
                        {m.tag}
                      </span>
                      <a
                        href={m.routeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7A3D] hover:underline"
                      >
                        <span>Launch</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="bg-[#5B3594] hover:bg-[#48267A] text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-[#5B3594]/20 transition-all hover:scale-[1.02]">
                <a href="https://app.tasklynk.co.ke" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <span>Visit Enterprise Platform Landing (app.tasklynk.co.ke)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. VERIFIED TESTIMONIALS */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-14 text-center mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFE8F8]/80 text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42]/80 dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                Client Experiences
              </span>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                Loved by Students, Founders &amp; Analysts
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="linen-card rounded-3xl p-7 flex flex-col justify-between relative group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 text-[#FF7A3D]">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>

                    <p className="text-sm text-[#6B627A] dark:text-[#DDD3E9]/90 leading-relaxed italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#22183D] dark:text-white">{t.name}</p>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">{t.role}</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8]/80 dark:bg-[#271E42]/80 px-2.5 py-1 rounded-full border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                      {t.service}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. BLOG & ACADEMIC GUIDES */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
          <StripeGradientMesh mode="light-section" heightClass="h-full" className="inset-0 opacity-80 dark:opacity-70 pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFE8F8]/80 text-[#5B3594] border border-[#DDD3E9] dark:bg-[#271E42]/80 dark:text-[#EFE8F8] dark:border-[#3A2F5B] mb-3">
                  Academic Insights
                </span>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-[#22183D] dark:text-white tracking-tight">
                  Guides, Rubrics &amp; Market Insights
                </h2>
              </div>
              <Button
                asChild
                variant="outline"
                className="linen-card rounded-2xl px-6 h-12 self-start md:self-auto"
              >
                <Link href="/blog" className="flex items-center gap-2">
                  <span>View All Articles</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {featuredPosts.map((post) => (
                <Link
                  key={post.title}
                  href={`/blog/${post.slug}`}
                  className="linen-card group rounded-3xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6 sm:p-7 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8]/80 dark:bg-[#271E42]/80 px-3 py-1 rounded-full border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                        {post.category}
                      </span>
                      <span className="text-[#6B627A] dark:text-[#DDD3E9]/70 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#22183D] dark:text-white group-hover:text-[#FF7A3D] transition-colors leading-snug pt-1">
                      {post.title}
                    </h3>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex items-center text-xs font-bold text-[#5B3594] dark:text-[#EFE8F8] group-hover:text-[#FF7A3D] transition-colors">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. FINAL CONVERSION BANNER: AIRY, CRISP & PREMIUM */}
        {/* ========================================================================= */}
        <section className="w-full relative overflow-hidden bg-[#FAF8FD] dark:bg-[#120B20] border-t border-[#DDD3E9]/60 dark:border-[#3A2F5B]/60 py-20 sm:py-24 text-[#22183D] dark:text-white">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-70 pointer-events-none"
          />

          <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center max-w-4xl space-y-7">
            <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 text-xs font-bold text-[#5B3594] dark:text-[#EFE8F8] shadow-sm">
              <Award className="w-4 h-4 text-[#FF7A3D]" />
              <span>Ready for Premium Results?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-[#22183D] dark:text-white">
              Get Your Project Done by <span className="text-[#FF7A3D]">Verified Specialists</span> Today.
            </h2>

            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 max-w-2xl mx-auto leading-relaxed">
              Submit your project brief, receive transparent pricing, and have a dedicated manager oversee your delivery from assignment to final quality review.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <RoleSelectionDialog
                trigger={
                  <Button
                    size="lg"
                    className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold px-8 h-12 rounded-xl shadow-xl shadow-[#FF7A3D]/25 transition-all text-sm sm:text-base hover:scale-[1.02] min-w-[200px]"
                  >
                    <span className="flex items-center gap-2">
                      <span>Get Started Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                }
              />

              <Button
                asChild
                size="lg"
                className="bg-transparent hover:bg-[#5B3594] border-2 border-[#5B3594] text-[#5B3594] hover:text-white font-bold px-8 h-12 rounded-xl text-sm sm:text-base transition-all hover:scale-[1.02] min-w-[200px]"
              >
                <Link href="/services" className="flex items-center gap-2">
                  <span>Explore Our Services</span>
                  <ArrowRight className="w-4 h-4 opacity-80" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <SiteFooter />
    </div>
  );
}
