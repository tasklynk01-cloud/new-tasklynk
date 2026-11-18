import type { Metadata } from 'next';
import Link from 'next/link';
import { Megaphone, Target, BarChart3, Users, Globe, Search, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Digital Advertising Services | PPC & Social Media Ads',
  'Professional digital advertising services including Google Ads, Facebook/Instagram ads, LinkedIn ads, TikTok ads, and social media advertising. Hire vetted PPC specialists and ad campaign managers.',
  '/services/marketing/digital-advertising'
);

const faqs = [
  {
    question: 'Which advertising platforms do you manage?',
    answer: 'We manage Google Ads (Search, Display, Shopping, Video, Performance Max), Facebook Ads, Instagram Ads, LinkedIn Ads, Twitter/X Ads, TikTok Ads, Snapchat Ads, YouTube Ads, and programmatic advertising networks. We also handle native advertising on platforms like Taboola and Outbrain.',
  },
  {
    question: 'What is included in a typical ad campaign?',
    answer: 'Our service includes campaign strategy and planning, account setup and configuration, keyword research for Google Ads, audience targeting setup, ad creative development or guidance, landing page optimization, bid management, performance monitoring, conversion tracking setup, A/B testing, and monthly performance reporting with optimization recommendations.',
  },
  {
    question: 'How do you optimize campaigns for better results?',
    answer: 'We continuously optimize using A/B testing of ad copy and creative, keyword refinement and expansion, audience targeting adjustments, bid optimization based on conversion data, landing page improvements, and budget reallocation to top-performing campaigns. We provide weekly check-ins and monthly deep-dive reports with actionable insights.',
  },
  {
    question: 'Do you handle ad creative development?',
    answer: 'Yes. We create compelling ad copy for search ads, display banners, social media ads, and video scripts. We also coordinate with our <Link href="/services/marketing/graphic-design">graphic design</Link> and <Link href="/services/marketing/video-editing">video editing</Link> specialists for visual creative. We ensure all ad creative aligns with your brand and is optimized for platform best practices and audience engagement.',
  },
  {
    question: 'What is your approach to budget management?',
    answer: 'We implement budget allocation strategies based on your goals and performance data. We set daily and monthly budgets, implement automated bidding strategies (target CPA, target ROAS, Maximize Conversions), and adjust bids in real-time based on conversion signals. We provide transparent reporting on budget utilization and cost per result.',
  },
  {
    question: 'What metrics do you track and report?',
    answer: 'We track click-through rates (CTR), conversion rates, cost per conversion (CPA), cost per acquisition (CPA), return on ad spend (ROAS), quality scores, impression share, and overall campaign performance against your KPIs. We provide weekly quick reports and comprehensive monthly reports with trend analysis, optimization insights, and strategic recommendations.',
  },
];

const relatedServices = [
  { label: 'SEO Services', href: '/services/marketing/seo-services' },
  { label: 'Content Writing', href: '/services/marketing/content-writing' },
  { label: 'Social Media Management', href: '/services/marketing/social-media-management' },
  { label: 'Graphic Design', href: '/services/marketing/graphic-design' },
  { label: 'Video Editing', href: '/services/marketing/video-editing' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Ad Specialists', href: '/register/client' },
];

export default function DigitalAdvertisingPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/marketing/digital-advertising"
      serviceSchemaName="Digital Advertising Services"
      serviceSchemaDescription="Professional digital advertising services including Google Ads, Facebook/Instagram ads, LinkedIn ads, TikTok ads, and social media advertising. Hire vetted PPC specialists and campaign managers."
      heroEyebrow="Digital Advertising"
      heroTitle="Digital Advertising Services | PPC &amp; Social Media Ads"
      heroIntro="Organic reach alone won't scale your business—paid advertising is how you reach the right customers at the right moment. But digital advertising is complex, with constantly changing algorithms, competitive bidding landscapes, and a maze of platforms, targeting options, and optimization strategies. Waste a budget on the wrong clicks, and you burn through resources without results. TaskLynk connects you with vetted digital advertising specialists—experts in Google Ads, Facebook/Instagram ads, LinkedIn ads, and social media advertising—who maximize your ad spend ROI. With secure milestone payments, NDA protection, and dedicated project management, your advertising budget drives real results."
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
                This service is for businesses that need professional advertising management. <strong>Startups</strong> launching products and needing to drive initial awareness, trials, and conversions through targeted digital advertising. <strong>E-commerce businesses</strong> that need product campaigns, shopping ads, retargeting, and seasonal promotions to drive sales with profitable customer acquisition costs. <strong>B2B service providers</strong> (consultants, agencies, SaaS companies) who need LinkedIn and Google Ads campaigns targeting decision-makers and professionals. <strong>Local businesses in Kenya</strong> who need Facebook and Instagram ads targeting specific geographic areas, demographics, and interests for local customer acquisition. <strong>Real estate agents</strong> who need property listing ads, lead generation campaigns, and retargeting for buyers and sellers. <strong>Healthcare providers</strong> who need patient acquisition campaigns, service promotion, and awareness building for medical services. <strong>Educational institutions</strong> that need student recruitment campaigns, course promotion, and enrollment-driven advertising. <strong>Non-profits</strong> that need awareness campaigns, donation drives, and advocacy advertising. <strong>Professional services firms</strong> (lawyers, accountants, consultants) who need targeted campaigns for high-value client acquisition.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need expert digital advertising management—whether Google Ads, Facebook/Instagram ads, LinkedIn ads, or social media advertising—our marketplace connects you with vetted specialists. We also support complementary services including <Link href="/services/marketing/seo-services" className="text-primary font-semibold hover:underline">SEO services</Link>, <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>, and <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link> for ad creative.
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
                What We Offer: Data-Driven Advertising Strategy and Execution
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our digital advertising service provides comprehensive campaign management, from initial strategy and setup through ongoing optimization and performance reporting. We begin with a <strong>campaign strategy and audit</strong>—analyzing your business objectives, target audience, competitive landscape, current marketing performance, and advertising goals (awareness, leads, sales, or brand building). Our specialists conduct thorough keyword research for search campaigns, competitor analysis, and audience research to identify high-opportunity targeting segments. This strategy phase produces a detailed campaign plan with platform selection, budget allocation, targeting parameters, bidding strategy, and success metrics.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>Google Ads management</strong>, we set up Search campaigns (keyword research, ad copy, landing page alignment), Display campaigns (banner ads, audience targeting), Shopping campaigns (product listing ads, feed optimization), Video campaigns (YouTube ads), and Performance Max campaigns (AI-powered cross-channel advertising). For <strong>Facebook and Instagram ads</strong>, we create campaigns targeting Facebook and Instagram audiences with custom audiences, lookalike audiences, interest targeting, and behavioral targeting. We also manage LinkedIn ads for B2B targeting, TikTok ads for younger demographics, Snapchat ads for Gen Z, and YouTube ads for video advertising. Every campaign includes <strong>conversion tracking setup</strong>, <strong>A/B testing of ad copy and creative</strong>, <strong>bid optimization</strong>, and <strong>performance monitoring</strong> with transparent, data-driven reporting.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Google Ads Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Search, Display, Shopping, Video, and Performance Max campaigns with keyword research, ad copy, and landing page optimization.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Social Media Ads</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Facebook, Instagram, LinkedIn, TikTok, and Snapchat advertising with precise audience targeting and creative optimization.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Targeting &amp; Retargeting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Custom audiences, lookalike audiences, demographic targeting, interest targeting, behavioral targeting, and dynamic retargeting for maximum ROI.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Optimization &amp; Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A/B testing, bid optimization, performance monitoring, conversion tracking, and transparent reporting with ROAS and CPA metrics.
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
                Platform Expertise and Industry Specialization
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our advertising specialists have deep expertise across all major advertising platforms and have managed millions in ad spend across diverse industries. For <strong>Google Ads</strong>, our specialists handle Search campaigns with advanced keyword research and negative keyword management, Display campaigns with retargeting and audience expansion, Shopping campaigns with optimized product feeds, and YouTube campaigns with in-stream and discovery ad formats. They also implement smart bidding strategies (Target CPA, Target ROAS, Maximize Conversions) and use Google's AI features effectively. For <strong>Facebook and Instagram Ads</strong>, our specialists master the Facebook Ads Manager, create custom audiences from customer lists, build lookalike audiences for expansion, and use Facebook's automated targeting and bidding. They also excel at Instagram-specific formats including Reels ads, Stories ads, and Shopping ads. For <strong>LinkedIn Ads</strong>, our specialists target by job title, company size, industry, skills, and seniority level for B2B lead generation. For <strong>TikTok Ads</strong>, we create platform-native content that leverages TikTok's viral algorithm and creative trends.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our specialists also have industry-specific expertise. For <strong>e-commerce</strong>, they understand product feed optimization, retargeting funnels, and conversion rate optimization. For <strong>B2B services</strong>, they know how to target decision-makers with LinkedIn and Google Ads using account-based marketing approaches. For <strong>local businesses in Kenya</strong>, they understand local search behavior, currency considerations, and mobile-first advertising trends. For <strong>real estate</strong>, they create property-specific campaigns with geofencing and retargeting. For <strong>healthcare</strong>, they navigate HIPAA-compliant advertising and sensitive targeting requirements. We coordinate with our <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writers</Link>, <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic designers</Link>, and <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editors</Link> to ensure your ad creative is compelling and on-brand. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures measurable ROI. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your advertising project</Link> today.
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
                Why TaskLynk for Digital Advertising
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Digital advertising wastes millions of dollars each year on poorly managed campaigns, incorrect targeting, and suboptimal creative. The difference between profitable and unprofitable advertising often comes down to platform expertise, continuous optimization, and strategic targeting—all of which require experience and skill. TaskLynk's marketplace connects you with advertising specialists who have managed campaigns with combined spend exceeding hundreds of thousands of dollars across Google Ads, Facebook, Instagram, and LinkedIn. Every specialist in our network has verifiable performance data showing measurable ROI improvements for previous clients.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond platform expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each campaign phase before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the specialist, track performance against KPIs, and ensure transparency throughout. <strong>NDA protection</strong> safeguards your advertising strategies and budget information. For comprehensive digital marketing, we also offer <Link href="/services/marketing/seo-services" className="text-primary font-semibold hover:underline">SEO services</Link>, <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>, <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>, and <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editing</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality advertising delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your advertising project</Link> today. For advertising professionals, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
