import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Users, FileText, Globe, Layout, ShieldCheck, Clock, Smartphone } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Social Media Management Services | Grow Your Audience',
  'Professional social media management services for content creation, community management, advertising, and growth strategy across Facebook, Instagram, Twitter, LinkedIn, and TikTok. Hire vetted social media managers.',
  '/services/marketing/social-media-management'
);

const faqs = [
  {
    question: 'Which social media platforms do you manage?',
    answer: 'We manage Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, and Pinterest. We also handle platform-specific strategies, content formats, and community engagement. We can manage all your platforms or focus on specific ones where your audience is most active.',
  },
  {
    question: 'What is included in social media management?',
    answer: 'Our service includes content strategy and calendar creation, content creation (posts, stories, reels, videos), community management (responding to comments and messages), social media advertising campaign management, analytics reporting with key metrics and insights, competitor analysis, hashtag research, and growth strategies. We also handle crisis management and brand reputation monitoring.',
  },
  {
    question: 'How often do you post on social media?',
    answer: 'Posting frequency varies by platform and strategy. For Instagram, we typically recommend 1-2 posts per day plus 3-5 stories. For Facebook, 1-2 posts per day. For Twitter/X, 3-10 tweets per day depending on audience activity. For LinkedIn, 1-2 posts per day. For TikTok, 1-3 videos per day. We customize frequency based on your audience behavior, content type, and business objectives.',
  },
  {
    question: 'Do you handle paid social media advertising?',
    answer: 'Yes. We manage paid social media campaigns across all major platforms including Facebook Ads, Instagram Ads, LinkedIn Ads, Twitter Ads, TikTok Ads, and YouTube Ads. We handle campaign setup, targeting, ad creative, budget management, performance optimization, and reporting. For comprehensive digital advertising, see our <Link href="/services/marketing/digital-advertising">digital advertising services</Link>.',
  },
  {
    question: 'Can you provide social media content creation?',
    answer: 'Yes. We create visual content including graphics, carousel posts, infographics, short videos, reels, stories, and animations. We also source and curate relevant content. For professional graphic design, we work with our <Link href="/services/marketing/graphic-design">graphic design specialists</Link>. For video content, we collaborate with <Link href="/services/marketing/video-editing">video editing specialists</Link>.',
  },
  {
    question: 'How do you measure social media success?',
    answer: 'We track engagement rate, reach, impressions, follower growth, click-through rate, conversion rate, sentiment analysis, and ROI from social media-driven actions. We provide monthly reports with key metrics, trend analysis, and actionable recommendations. We also conduct competitive benchmarking to show how your performance compares to industry standards.',
  },
];

const relatedServices = [
  { label: 'Content Writing', href: '/services/marketing/content-writing' },
  { label: 'SEO Services', href: '/services/marketing/seo-services' },
  { label: 'Digital Advertising', href: '/services/marketing/digital-advertising' },
  { label: 'Graphic Design', href: '/services/marketing/graphic-design' },
  { label: 'Video Editing', href: '/services/marketing/video-editing' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Managers', href: '/register/client' },
];

export default function SocialMediaManagementPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/marketing/social-media-management"
      serviceSchemaName="Social Media Management Services"
      serviceSchemaDescription="Professional social media management services for content creation, community management, advertising, and growth strategy across Facebook, Instagram, Twitter, LinkedIn, and TikTok. Hire vetted social media managers."
      heroEyebrow="Social Media"
      heroTitle="Social Media Management Services | Grow Your Audience"
      heroIntro="Social media is where your customers live, work, and make decisions about your brand. But managing social presence effectively requires constant content creation, community engagement, strategic advertising, and data-driven optimization—all while staying up-to-date with platform changes and trends. TaskLynk connects you with vetted social media managers—experts in content strategy, community building, paid advertising, and analytics—who grow your audience and drive engagement across all major platforms. With secure milestone payments, NDA protection, and dedicated project management, your social media presence is professionally managed."
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
                This service is for businesses and organizations that need professional social media management. <strong>Local businesses in Kenya</strong>—restaurants, retail shops, salons, fitness studios, and service providers in Nairobi, Mombasa, Kisumu, and other cities who need local social media presence to attract nearby customers. <strong>E-commerce stores</strong> that need regular product promotion, customer engagement, influencer collaboration, and community building to drive sales. <strong>Tech startups and SaaS companies</strong> who need brand awareness, thought leadership content, customer community management, and lead generation through social channels. <strong>Professional services firms</strong> (law firms, accounting practices, consulting firms) that need LinkedIn-focused content strategy, thought leadership, and professional brand building. <strong>Content creators and influencers</strong> who need content strategy, audience growth, and monetization support. <strong>Non-profit organizations</strong> that need community engagement, advocacy content, donor awareness, and cause marketing campaigns. <strong>Real estate agencies</strong> that need property promotion, client engagement, and neighborhood content. <strong>Healthcare providers</strong> who need patient education content, community health awareness, and professional brand building.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need social media management—content creation, community engagement, advertising, or growth strategy—our marketplace connects you with vetted specialists. We also support complementary services including <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>, <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editing</Link>, and <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">paid advertising</Link>.
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
                What We Offer: Strategic Social Media Management
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our social media management service covers the complete spectrum of social media marketing, from strategy and content creation through community engagement and paid advertising. We begin with a <strong>social media audit and strategy development</strong>—analyzing your current presence, audience demographics, competitor positioning, and content performance. Our specialists conduct platform-specific analysis (Facebook Insights, Instagram Analytics, LinkedIn Analytics, Twitter Analytics) to identify growth opportunities, engagement patterns, and content gaps. This audit produces a customized social media strategy with platform recommendations, content themes, posting schedules, and KPI targets aligned to your business objectives.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next comes <strong>content creation and curation</strong>. Our specialists design visually compelling content—including graphics, carousel posts, infographics, short videos, reels, and stories—that aligns with your brand identity and resonates with your target audience. For <strong>community management</strong>, we monitor and respond to comments, messages, and mentions in a timely, brand-appropriate manner, fostering engagement and building relationships with your audience. We also handle <strong>social media advertising</strong>—creating, launching, and optimizing paid campaigns across all platforms with precise targeting, compelling ad creative, and data-driven budget allocation. For <strong>analytics and reporting</strong>, we provide monthly reports with engagement metrics, reach and impressions, follower growth, conversion tracking, sentiment analysis, and competitive benchmarking.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Content Strategy &amp; Creation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Custom content calendars, visual content creation, caption writing, and brand-aligned messaging across all social platforms.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Community Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time comment and message response, brand engagement, community building, and reputation management across platforms.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Paid Advertising</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Campaign setup, targeting, ad creative, budget optimization, and performance reporting across Facebook, Instagram, and LinkedIn.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Analytics &amp; Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monthly performance reports with KPIs, trend analysis, competitor benchmarking, and actionable recommendations for improvement.
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
                Platform Expertise and Content Specialization
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our social media specialists have deep expertise across all major platforms, understanding each platform's unique algorithms, content formats, audience behaviors, and best practices. For <strong>Instagram</strong>, our specialists excel at visual storytelling through photos, carousel posts, Reels, Stories, and IGTV, with expertise in hashtag strategy, influencer collaboration, and Instagram Shopping integration. For <strong>Facebook</strong>, they manage business pages, create engaging posts and Stories, run Facebook Ads campaigns, and build community through Groups. For <strong>LinkedIn</strong>, they focus on B2B content strategy, thought leadership, company page optimization, and LinkedIn Ads for professional services and B2B marketing. For <strong>TikTok</strong>, our specialists understand the platform's fast-paced, entertainment-first culture, creating viral content, trends, and challenges that authentically engage younger audiences.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>Twitter/X</strong>, our specialists manage real-time engagement, trending topic participation, brand voice consistency, and customer service responses with the platform's fast-paced conversation style. For <strong>YouTube</strong>, they handle video strategy, channel optimization, content creation, SEO for video, and community engagement. For <strong>Pinterest</strong>, they create pin-worthy content, optimize for search, and drive traffic to websites and online stores. Our specialists also create platform-specific visual content through our <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design partners</Link> and <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editing specialists</Link>. For businesses needing <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">paid social advertising</Link> alongside management, we offer integrated packages. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures consistent brand presence. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your project</Link> today.
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
                Why TaskLynk for Social Media Management
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Social media management requires a unique combination of creative talent, strategic thinking, analytical skills, and real-time responsiveness. Unlike other marketing channels, social media demands constant engagement, rapid response to trends and comments, and content that is visually compelling and culturally relevant. TaskLynk's marketplace connects you with social media specialists who have not only creative and strategic skills but also proven track records of growing audiences and driving engagement across multiple platforms. Every social media manager in our network has demonstrated expertise through measurable results—including follower growth, engagement rate improvements, and conversions driven from social channels—and has verifiable case studies from previous client work.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond creative and strategic expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve each month's work before payment. <strong>Dedicated project managers</strong> coordinate between you and the specialist, ensure consistent brand voice, and track performance against your objectives. <strong>NDA protection</strong> safeguards your marketing strategies and brand information. We also offer complementary services including <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>, <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editing</Link>, <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">paid advertising</Link>, and <Link href="/services/marketing/seo-services" className="text-primary font-semibold hover:underline">SEO services</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality social media management, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your project</Link> today. For social media professionals, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
