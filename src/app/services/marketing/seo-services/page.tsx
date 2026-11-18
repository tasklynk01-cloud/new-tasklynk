import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, BarChart3, Globe, TrendingUp, FileText, ShieldCheck, Clock, Users } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional SEO Services | Improve Your Google Rankings',
  'Professional SEO services for keyword research, on-page optimization, content strategy, link building, and local SEO. Hire vetted SEO specialists for improved search engine rankings and organic traffic.',
  '/services/marketing/seo-services'
);

const faqs = [
  {
    question: 'What does SEO involve?',
    answer: 'SEO (Search Engine Optimization) involves keyword research and analysis, on-page optimization (titles, meta descriptions, header tags, content optimization), technical SEO (site speed, mobile optimization, crawlability, structured data), content strategy and creation, link building and outreach, local SEO optimization, and ongoing performance monitoring and reporting. We also handle competitor analysis and content gap analysis.',
  },
  {
    question: 'How long does it take to see SEO results?',
    answer: 'SEO is a long-term strategy. Typically, you can expect to see initial improvements in crawlability and indexing within 1-2 months, ranking improvements for low-competition keywords within 2-4 months, and significant ranking and traffic improvements within 4-6 months. Competitive keywords may take 6-12 months. We provide transparent monthly reporting so you can track progress throughout.',
  },
  {
    question: 'Do you provide SEO for local businesses?',
    answer: 'Yes. We provide comprehensive local SEO services including Google Business Profile optimization, local citation building, local keyword targeting, review management, and location-based content creation. We specialize in local SEO for businesses in Kenya and other African markets, understanding local search behavior and directory landscapes.',
  },
  {
    question: 'Can you help with content strategy for SEO?',
    answer: 'Yes. We develop data-driven content strategies based on keyword research, competitor analysis, and audience insights. We create content calendars, topic clusters, and pillar content strategies. We also provide content creation services through our <Link href="/services/marketing/content-writing">content writing service</Link> for SEO-optimized articles, blog posts, and web page content.',
  },
  {
    question: 'Do you provide SEO audit and reporting?',
    answer: 'Yes. We conduct comprehensive SEO audits covering technical issues, on-page elements, content quality, backlink profiles, and competitor analysis. We provide monthly or quarterly reports with key metrics, ranking improvements, traffic growth, and actionable recommendations. Reports are available in PDF, Google Data Studio, or dashboard formats.',
  },
  {
    question: 'How do you measure SEO success?',
    answer: 'We measure success through multiple KPIs: keyword rankings, organic traffic growth, conversion rate improvements, click-through rates (CTR), bounce rate reduction, backlink profile quality and quantity, page load speed improvements, and ultimately revenue or lead generation from organic search. We provide transparent reporting on all relevant metrics. For content-related SEO needs, we also offer <Link href="/services/marketing/content-writing">professional content writing services</Link>.',
  },
];

const relatedServices = [
  { label: 'Content Writing', href: '/services/marketing/content-writing' },
  { label: 'Digital Advertising', href: '/services/marketing/digital-advertising' },
  { label: 'Social Media Management', href: '/services/marketing/social-media-management' },
  { label: 'Graphic Design', href: '/services/marketing/graphic-design' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire SEO Experts', href: '/register/client' },
];

export default function SeoServicesPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/marketing/seo-services"
      serviceSchemaName="Professional SEO Services"
      serviceSchemaDescription="Professional SEO services for keyword research, on-page optimization, technical SEO, link building, local SEO, and content strategy. Hire vetted SEO specialists to improve search rankings."
      heroEyebrow="SEO Services"
      heroTitle="Professional SEO Services | Improve Your Google Rankings"
      heroIntro="If you're not on the first page of Google, you might as well not exist. Most consumers never scroll past the first page of search results, and businesses on page two or beyond miss the vast majority of organic traffic. But effective SEO requires more than sprinkling keywords on a page—it demands technical expertise, content strategy, link building, and constant adaptation to search engine algorithm updates. TaskLynk connects you with vetted SEO specialists—experts in keyword research, on-page optimization, technical SEO, link building, and content strategy—who improve your search rankings and drive organic traffic. With secure milestone payments, NDA protection, and dedicated project management, your SEO strategy is in expert hands."
      faqs={faqs}
      relatedServices={relatedServices}
    >
      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Who This Service Is For
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                This service is for businesses and organizations that need professional SEO to drive organic growth. <strong>Local businesses in Kenya</strong>—restaurants, retail shops, service providers, and professionals in Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret who need local SEO to attract nearby customers and appear in local search results. <strong>E-commerce stores</strong> that need product page optimization, category page SEO, and content strategies to drive organic traffic and increase sales. <strong>Content publishers and bloggers</strong> who need keyword research, content optimization, and link building to grow their organic readership and monetization. <strong>SaaS companies</strong> and <strong>tech startups</strong> that need SEO for product pages, blog content, and competitive keyword targeting in competitive markets. <strong>Professional services firms</strong> (law firms, accounting firms, consulting practices) that need local and professional services SEO to attract high-value clients. <strong>Online course creators and educators</strong> who need SEO for course landing pages, educational content, and lead generation. <strong>Non-profit organizations</strong> that need SEO to increase visibility for their cause and attract supporters, donors, and volunteers.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need professional SEO services—keyword research, on-page optimization, technical SEO improvements, link building, or content strategy—our marketplace connects you with vetted SEO specialists. We also support complementary services including <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">SEO-optimized content writing</Link>, <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">PPC advertising</Link>, and <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link> for comprehensive digital marketing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                What We Offer: Comprehensive SEO Strategy and Execution
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our SEO service provides end-to-end search engine optimization, from initial audit and strategy development through implementation, content creation, link building, and ongoing monitoring. We begin with a <strong>comprehensive SEO audit</strong>—analyzing your website's technical health, on-page elements, content quality, backlink profile, and competitor positioning. Our specialists use industry-leading tools including SEMrush, Ahrefs, Moz, Screaming Frog, Google Search Console, and Google Analytics to identify opportunities, diagnose issues, and benchmark performance against competitors. This audit produces a prioritized action plan with specific recommendations ranked by potential impact and implementation difficulty.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>keyword research and strategy</strong>, our specialists conduct thorough analysis of your target keywords, search volume, keyword difficulty, and commercial intent. We identify high-opportunity keywords that your competitors aren't ranking for, analyze long-tail keyword opportunities, and develop content strategies aligned with search demand. We also perform <strong>technical SEO optimization</strong>—improving page load speed, implementing mobile optimization, fixing crawl errors, optimizing XML sitemaps, implementing structured data markup, and ensuring indexability. For <strong>on-page optimization</strong>, we refine title tags, meta descriptions, header tags, URL structures, internal linking, image alt text, and content optimization to match search intent.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Keyword Research &amp; Strategy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive keyword analysis using SEMrush, Ahrefs, and Google tools. Search intent mapping and content strategy development for maximum organic traffic.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Technical SEO</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Site speed optimization, mobile optimization, crawlability, XML sitemaps, structured data, and indexability improvements.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Link Building</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  White-hat link building through guest posting, directory submissions, influencer outreach, and content marketing for authoritative backlinks.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Monitoring &amp; Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monthly SEO reports with ranking improvements, traffic growth, keyword performance, and actionable recommendations for continuous improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Local and International SEO Expertise
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our SEO specialists have expertise in both local and international SEO, understanding the distinct strategies and best practices required for each approach. For <strong>local SEO</strong>, our specialists optimize Google Business Profiles, manage local citations across directories, acquire local reviews, create location-specific content, and implement local schema markup. We understand the unique challenges of local search in Kenya and other African markets, including local directory landscapes, Swahili-language search behavior, and regional search engine preferences. Our specialists have successfully ranked local businesses in Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret for competitive local keywords.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>international SEO</strong>, our specialists handle hreflang implementation for multilingual sites, international targeting, cross-border keyword research, and global link building strategies. We also specialize in <strong>e-commerce SEO</strong> with product page optimization, category page SEO, faceted navigation management, and structured data for rich snippets. For <strong>content-driven SEO</strong>, we collaborate with our <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing specialists</Link> to create SEO-optimized articles, blog posts, and web content that ranks well and attracts targeted traffic. For businesses needing paid search alongside organic SEO, we recommend <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">PPC advertising services</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures measurable results. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your SEO project</Link> today to be matched with a specialist within hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for SEO Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Effective SEO requires more than tools and tactics—it demands strategic thinking, content expertise, and the ability to adapt to search engine algorithm changes that happen hundreds of times per year. TaskLynk's marketplace connects you with SEO specialists who combine technical expertise with content strategy and data analysis. Every SEO specialist in our network has a proven track record of ranking websites in competitive niches, with verifiable case studies showing measurable ranking improvements and traffic growth. Our specialists use legitimate, white-hat techniques that build long-term authority, not short-term tricks that risk Google penalties.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each SEO phase before payment. <strong>Dedicated project managers</strong> coordinate between you and the specialist, track progress against deliverables, and ensure transparency throughout. <strong>NDA protection</strong> safeguards your business strategies and competitive intelligence. We also offer complementary services including <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">PPC advertising</Link>, and <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality SEO delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your SEO project</Link> today. For SEO professionals, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link> to connect with businesses needing your expertise.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
