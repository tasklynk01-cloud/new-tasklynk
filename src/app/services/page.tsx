import { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  BarChart3,
  GraduationCap,
  Building2,
  PenTool,
  Presentation,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Cloud,
  Cpu,
  Server,
  ExternalLink,
  FileText,
  FileSignature,
  FileCheck,
  FileSpreadsheet,
  Award,
  Zap,
  Briefcase,
  Code2,
  Palette,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/site/main-header';
import { SiteFooter } from '@/components/site/site-footer';
import { StripeGradientMesh } from '@/components/ui/stripe-animated-gradient';
import { generateCanonicalMetadata } from '@/lib/canonical-metadata';

export const metadata: Metadata = {
  title: 'Managed Professional Services Directory — TaskLynk Kenya',
  description: 'Explore TaskLynk’s comprehensive academic writing and managed professional services: Academic Writing Services (essays, theses, dissertations), Technology & Web Development, Data Analytics (SPSS/R), Graphic Design, Virtual Assistance, Accounting, and Business Research.',
  ...generateCanonicalMetadata('/services'),
};

const serviceGroups = [
  {
    category: 'Technology & Development',
    badge: 'Tech & Engineering',
    icon: Code2,
    description: 'Custom corporate websites, e-commerce storefronts, software systems, and API integrations engineered for scalability.',
    links: [
      { name: 'Website & Web Development', href: '/services/website-development', desc: 'Corporate websites, landing pages, e-commerce, and Next.js applications.' },
      { name: 'Software Development & Systems', href: '/services/software-development', desc: 'Custom backend APIs, database engineering, and microservices.' },
      { name: 'Systems & API Integration', href: '/services/systems-integration', desc: 'Connect CRM, ERP, M-Pesa Daraja, and automated business workflows.' },
    ],
  },
  {
    category: 'Data & Analytics',
    badge: 'Data & Insights',
    icon: BarChart3,
    description: 'Statistical consulting, econometric modeling, interactive business intelligence dashboards, and clean data processing.',
    links: [
      { name: 'Statistical Data Analytics', href: '/services/data-analytics', desc: 'SPSS, R, Python, and Stata analysis with defensible APA results writeups.' },
      { name: 'Data Processing & Productivity', href: '/services/data-processing', desc: 'Data entry, survey coding, outlier cleaning, and Excel spreadsheet automation.' },
      { name: 'SPSS Analysis Nairobi Hub', href: '/services/data-analysis/spss-data-analysis-services-nairobi', desc: 'Local Nairobi consultants for university dissertation Chapter 4 writeups.' },
    ],
  },
  {
    category: 'Design & Creative',
    badge: 'Creative & Media',
    icon: Palette,
    description: 'Distinctive visual identities, corporate profiles, high-converting video edits, and investor presentation decks.',
    links: [
      { name: 'Graphic Design & Branding', href: '/services/graphic-design', desc: 'Brand identities, vector logos, brochures, and company capability profiles.' },
      { name: 'Video Production & Editing', href: '/services/video-production', desc: 'Corporate brand stories, vertical social reels, and motion graphics.' },
    ],
  },
  {
    category: 'Business Support',
    badge: 'Operations',
    icon: Briefcase,
    description: 'Executive administrative leverage, bookkeeping, financial statement preparation, and calendar management.',
    links: [
      { name: 'Virtual Assistance Support', href: '/services/virtual-assistance', desc: 'Inbox triage, calendar coordination, CRM updates, and customer support.' },
      { name: 'Accounting & Bookkeeping Support', href: '/services/accounting-support', desc: 'Bank reconciliation, P&L statements, payroll schedules, and tax filings.' },
    ],
  },
  {
    category: 'Research & Professional Writing',
    badge: 'Strategy',
    icon: FileSpreadsheet,
    description: 'Commercial feasibility studies, bank-ready business plans, executive CVs, contracts, and board presentations.',
    links: [
      { name: 'Business Research & Intelligence', href: '/services/business-research', desc: 'Commercial feasibility studies, market sizing, and competitor audits.' },
      { name: 'Professional Writing & Profiles', href: '/services/professional-writing', desc: 'Executive CVs, commercial agreements, NDAs, and corporate presentations.' },
      { name: 'Business Plan Cost Kenya', href: '/pricing/how-much-does-a-business-plan-cost-in-kenya', desc: 'Transparent local pricing guide for bank and investor business plans.' },
    ],
  },
  {
    category: 'Academic Writing & Support',
    badge: 'Academic Writing',
    icon: BookOpen,
    description: 'Academic writing services including essays, research papers, postgraduate dissertation guidance, literature reviews, methodology design, and APA/Harvard formatting.',
    links: [
      { name: 'Academic Writing Services', href: '/services/academic-writing', desc: 'Custom essays, research papers, theses, dissertations, case studies, and coursework.' },
      { name: 'Academic Support & Thesis', href: '/services/academic-support', desc: 'Master’s and PhD dissertation guidance with Turnitin originality assurance.' },
      { name: 'MBA Thesis Proofreading Kenya', href: '/services/academic-writing/mba-thesis-proofreading-kenya', desc: 'Dedicated thesis editing aligned to UoN, Strathmore, and KU formats.' },
    ],
  },
];

const templateSuites = [
  {
    category: 'CV & Career Suite',
    icon: FileText,
    color: 'from-[#5B3594] to-[#7B4ABF]',
    landingUrl: 'https://app.tasklynk.co.ke/services/cv-professional-documents',
    templates: [
      { name: 'Executive CV / Resume', url: 'https://app.tasklynk.co.ke/documents?template=cv', icon: FileText, desc: 'ATS-tailored executive & professional CV layout' },
      { name: 'Job Cover Letter', url: 'https://app.tasklynk.co.ke/documents?template=cover-letter', icon: FileSignature, desc: 'High-conversion narrative tailored to job descriptions' },
      { name: 'Employment Letter', url: 'https://app.tasklynk.co.ke/documents?template=employment-letter', icon: FileCheck, desc: 'Formal job offer and appointment confirmation letter' },
      { name: 'Employment Contract', url: 'https://app.tasklynk.co.ke/documents?template=employment-contract', icon: Briefcase, desc: 'Legally compliant employment agreement & terms' },
      { name: 'Certificate of Achievement', url: 'https://app.tasklynk.co.ke/documents?template=certificate', icon: Award, desc: 'Professional certification and recognition document' },
    ]
  },
  {
    category: 'Business & Enterprise Suite',
    icon: Building2,
    color: 'from-[#FF7A3D] to-[#E9662F]',
    landingUrl: 'https://app.tasklynk.co.ke/services/business-documents',
    templates: [
      { name: 'Strategic Business Plan', url: 'https://app.tasklynk.co.ke/documents?template=business-plan', icon: FileSpreadsheet, desc: 'Bank-ready 5-year financial models & market analysis' },
      { name: 'Commercial Proposal', url: 'https://app.tasklynk.co.ke/documents?template=proposal', icon: FileCheck, desc: 'Client-winning project pitch and commercial bids' },
      { name: 'Non-Disclosure Agreement (NDA)', url: 'https://app.tasklynk.co.ke/documents?template=nda', icon: ShieldCheck, desc: 'Binding mutual & unilateral confidentiality contract' },
      { name: 'Company Profile', url: 'https://app.tasklynk.co.ke/documents?template=company-profile', icon: Building2, desc: 'Corporate overview and credentials portfolio' },
      { name: 'Financial Report', url: 'https://app.tasklynk.co.ke/documents?template=financial-report', icon: BarChart3, desc: 'Executive quarterly & annual financial reporting' },
    ]
  }
];

export default async function ServicesPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const rawQuery = searchParams?.q || '';
  const query = rawQuery.trim().toLowerCase();

  const filteredGroups = query
    ? serviceGroups.filter(
        (group) =>
          group.category.toLowerCase().includes(query) ||
          group.description.toLowerCase().includes(query) ||
          group.badge.toLowerCase().includes(query) ||
          group.links.some(
            (link) =>
              link.name.toLowerCase().includes(query) ||
              link.desc.toLowerCase().includes(query)
          )
      )
    : serviceGroups;

  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />

      <main className="flex-1">
        {/* Header / Hero */}
        <section className="relative pt-32 sm:pt-40 pb-16 lg:pb-24 bg-transparent border-b border-[#DDD3E9] dark:border-[#3A2F5B] text-center overflow-hidden">
          {/* Active 3D Glowing Purple Silk Wave Engine */}
          <StripeGradientMesh
            mode="hero"
            heightClass="h-[1400px]"
            className="inset-x-0 top-0 opacity-100 dark:opacity-90 pointer-events-none"
          />

          <div className="container mx-auto px-4 lg:px-8 max-w-4xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/95 dark:bg-[#1D1533]/90 border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-5 shadow-xs">
              <Briefcase className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#22183D] dark:text-white">
                Professional Services Directory
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-[#22183D] dark:text-white leading-[1.08]">
              Managed Professional Services. <span className="text-[#FF7A3D]">One Trusted Platform.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#6B627A] dark:text-[#DDD3E9]/90 mt-5 leading-relaxed max-w-2xl mx-auto">
              From technology and data to research, design, and business support, TaskLynk coordinates the right expertise under dedicated project management.
            </p>

            {/* In-page Active Search Bar */}
            <form action="/services" method="GET" className="relative flex items-center max-w-lg mx-auto mt-6">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B627A] dark:text-[#DDD3E9]/60" />
                <input
                  type="text"
                  name="q"
                  defaultValue={rawQuery}
                  placeholder="Search by keyword, software, or deliverable (e.g. SPSS, Web, Design)..."
                  className="w-full pl-11 pr-24 py-3.5 bg-white/95 dark:bg-[#1D1533]/95 border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A3D] text-[#22183D] dark:text-white placeholder-[#6B627A]/70 shadow-md"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#5B3594] hover:bg-[#48267A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Query Badge */}
            {query && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80">
                  Showing results matching: <strong className="text-[#FF7A3D]">"{rawQuery}"</strong> ({filteredGroups.length} categories)
                </span>
                <Link
                  href="/services"
                  className="text-xs text-[#5B3594] dark:text-[#FFA06E] font-bold underline hover:opacity-80"
                >
                  Clear filter
                </Link>
              </div>
            )}

            {/* Quick Hub Launchers */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
              <Link
                href="/professionals"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B3594] text-white text-xs font-bold shadow-md hover:bg-[#48267A] hover:scale-[1.02] transition-all"
              >
                <Users className="w-4 h-4 text-[#FF7A3D]" />
                <span>Meet Our Accredited Specialists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/client/new-job"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7A3D] text-white text-xs font-bold shadow-md hover:bg-[#E9662F] hover:scale-[1.02] transition-all"
              >
                <span>Place an Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 6 Core Service Groups Navigation Grid */}
        <section className="py-16 sm:py-24 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8] dark:bg-[#271E42] px-3.5 py-1 rounded-full border border-[#DDD3E9] dark:border-[#3A2F5B] inline-block mb-3">
                Service Groups
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#22183D] dark:text-white tracking-tight">
                Explore Dedicated Service Categories
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-2">
                Click any service below to review deliverables, team specialists, transparent pricing guidance, and FAQs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(filteredGroups.length > 0 ? filteredGroups : serviceGroups).map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div
                    key={group.category}
                    className="linen-card rounded-xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#FF7A3D] transition-all shadow-sm hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center">
                          <GroupIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-bold text-[#5B3594] dark:text-[#EFE8F8] bg-[#EFE8F8] dark:bg-[#271E42] px-3 py-1 rounded-full border border-[#DDD3E9]/60 dark:border-[#3A2F5B]">
                          {group.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#22183D] dark:text-white mb-2">
                        {group.category}
                      </h3>
                      <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 mb-5 leading-relaxed">
                        {group.description}
                      </p>

                      <div className="space-y-3 pt-3 border-t border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
                        {group.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="group/link block p-2.5 rounded-xl hover:bg-[#EFE8F8]/60 dark:hover:bg-[#271E42]/60 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#22183D] dark:text-white group-hover/link:text-[#FF7A3D]">
                              <span>{link.name}</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/70 mt-0.5 line-clamp-1">
                              {link.desc}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#DDD3E9]/40 dark:border-[#3A2F5B]/40">
                      <Button asChild size="sm" className="w-full bg-[#5B3594] hover:bg-[#48267A] text-white text-xs font-bold rounded-xl">
                        <Link href={group.links[0].href}>
                          <span>Explore {group.category}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Public Professional Directory Callout Banner */}
        <section className="py-16 relative overflow-hidden bg-gradient-to-r from-[#5B3594] via-[#482A78] to-[#2D1750] text-white border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
          <StripeGradientMesh
            mode="purple-section"
            heightClass="h-full"
            className="inset-0 opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A3D] bg-white/10 px-3 py-1 rounded-full">
                Accredited Team
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold">
                Meet the Professionals Behind TaskLynk
              </h3>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Every specialist on TaskLynk is tested, accredited, and managed under our triple-check delivery standards. Browse approved profiles, credentials, and work history.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-extrabold px-6 rounded-2xl shrink-0 shadow-lg"
            >
              <Link href="/professionals">
                <span>View Specialist Directory</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ONE-CLICK DOCUMENT TEMPLATES SUITE SECTION */}
        <section className="py-16 sm:py-24 relative bg-transparent overflow-hidden border-b border-[#DDD3E9]/50 dark:border-[#3A2F5B]/50">
          <StripeGradientMesh
            mode="light-section"
            heightClass="h-full"
            className="inset-0 opacity-80 dark:opacity-70 pointer-events-none"
          />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 bg-[#EFE8F8] dark:bg-[#271E42] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-full px-4 py-1.5 mb-3">
                <Zap className="w-3.5 h-3.5 text-[#FF7A3D]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B3594] dark:text-[#EFE8F8]">Instant Studio Launch</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#22183D] dark:text-white tracking-tight">
                One-Click Document Templates
              </h2>
              <p className="text-sm sm:text-base text-[#6B627A] dark:text-[#DDD3E9]/90 mt-3 leading-relaxed">
                Launch directly into our intelligent writing studio on <code className="font-mono text-xs font-bold text-[#5B3594] dark:text-[#FF7A3D]">app.tasklynk.co.ke/documents</code> with pre-configured templates.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {templateSuites.map((suite) => {
                const SuiteIcon = suite.icon;
                return (
                  <div
                    key={suite.category}
                    className="linen-card rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-6 border-b border-[#DDD3E9] dark:border-[#3A2F5B]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#EFE8F8] dark:bg-[#271E42] text-[#5B3594] dark:text-[#EFE8F8] flex items-center justify-center shrink-0">
                            <SuiteIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#22183D] dark:text-white">{suite.category}</h3>
                            <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70">5 Pre-configured production templates</p>
                          </div>
                        </div>

                        <a
                          href={suite.landingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#FF7A3D] hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Overview Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="space-y-3 pt-6">
                        {suite.templates.map((tpl) => {
                          const TplIcon = tpl.icon;
                          return (
                            <a
                              key={tpl.name}
                              href={tpl.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8FD] dark:bg-[#1D1533] hover:bg-[#EFE8F8] dark:hover:bg-[#271E42] border border-[#DDD3E9]/70 dark:border-[#3A2F5B]/70 transition-all hover:scale-[1.01]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#140E24] text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center shrink-0 shadow-sm">
                                  <TplIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[#22183D] dark:text-white group-hover:text-[#5B3594] dark:text-white group-hover:text-[#FF7A3D] truncate">
                                    {tpl.name}
                                  </p>
                                  <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 truncate">
                                    {tpl.desc}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1 text-xs font-extrabold text-[#5B3594] dark:text-[#FF7A3D] pl-3">
                                <span className="hidden sm:inline">Launch</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-[#DDD3E9] dark:border-[#3A2F5B] flex items-center justify-between">
                      <span className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 font-medium">Ready to write?</span>
                      <Button asChild size="sm" className="bg-[#5B3594] hover:bg-[#4A2B7A] text-white font-bold rounded-xl px-4 text-xs">
                        <a href={suite.landingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          <span>View Suite Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Global CTA */}
        <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#683FA8] via-[#5B3A8C] to-[#3E2068] border-t border-[#8B5CF6]/40 py-20 sm:py-28 text-white text-center">
          {/* Active 3D Glowing Silk Wave Engine Embedded in Final CTA */}
          <StripeGradientMesh
            mode="purple-section"
            heightClass="h-full"
            className="inset-0 opacity-85 pointer-events-none"
          />

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
                Ready to Get Your Work Done?
              </h2>
              <p className="text-sm sm:text-base text-[#DDD3E9]/90 leading-relaxed mb-8 max-w-2xl mx-auto">
                We coordinate the expertise. We manage the process. You get the work done. Place an order today or consult with our project managers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold rounded-xl px-9 h-12 sm:h-14 shadow-xl shadow-[#FF7A3D]/25 hover:scale-[1.02] transition-all min-w-[200px]">
                  <Link href="/client/new-job" className="flex items-center justify-center gap-2">
                    <span>Place an Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-transparent border-2 border-white/40 hover:border-white text-white font-bold rounded-xl px-8 h-12 sm:h-14 hover:bg-white/10 transition-all min-w-[200px]">
                  <Link href="/professionals" className="flex items-center justify-center gap-2">
                    <span>Explore Specialists</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
