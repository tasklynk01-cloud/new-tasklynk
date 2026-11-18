import type { Metadata } from 'next';
import Link from 'next/link';
import { PenTool, FileText, Search, BarChart3, BookOpen, Users, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional Content Writing Services | SEO-Optimized Content',
  'Professional content writing services for blogs, articles, website copy, SEO content, product descriptions, and marketing copy. Hire vetted content writers for engaging, conversion-focused content.',
  '/services/marketing/content-writing'
);

const faqs = [
  {
    question: 'What types of content do you write?',
    answer: 'We write blogs and articles, website copy (landing pages, about pages, product pages), SEO-optimized content, product descriptions, email newsletters, social media posts, marketing copy, white papers, case studies, press releases, academic abstracts, and technical documentation. We match you with writers who specialize in your industry and content type.',
  },
  {
    question: 'Do you provide SEO-optimized content?',
    answer: 'Yes. Our SEO content writers conduct keyword research, implement on-page SEO best practices (proper heading structure, keyword placement, internal linking), and create content that balances search engine optimization with engaging, human-readable storytelling. We also provide content optimization audits for existing content. For comprehensive SEO strategy, we work with our <Link href="/services/marketing/seo-services">SEO specialists</Link>.',
  },
  {
    question: 'What industries and topics do your writers cover?',
    answer: 'Our content writers cover diverse industries including technology, healthcare, finance, education, real estate, legal, e-commerce, travel, food and beverage, automotive, construction, non-profit, and more. We also handle specialized topics including B2B software, medical devices, financial products, educational technology, and sustainability. We match you with writers who have domain expertise in your field.',
  },
  {
    question: 'How do you ensure content quality and originality?',
    answer: 'All content is written from scratch with no AI-generated or spun content. We conduct plagiarism checks using Copyscape and Turnitin to verify originality. Our quality process includes a primary writer draft, a senior editor review for accuracy and clarity, and a final proofreading pass. We also match content complexity and tone to your target audience.',
  },
  {
    question: 'Can you write content in different tones and styles?',
    answer: 'Yes. We adapt to your brand voice—whether formal, conversational, authoritative, friendly, or persuasive. We also adjust content complexity for different audience levels (consumer, professional, technical, academic). We can match your existing brand guidelines or develop a consistent voice across all content.',
  },
  {
    question: 'How quickly can you deliver content?',
    answer: 'We offer flexible turnaround options. Blog posts and articles are typically delivered within 24-48 hours. Longer content like white papers, case studies, or website copy may take 3-7 days. We also offer express 3-12 hour service for urgent content needs, subject to writer availability. You choose your preferred timeline when posting your project.',
  },
];

const relatedServices = [
  { label: 'SEO Services', href: '/services/marketing/seo-services' },
  { label: 'Digital Advertising', href: '/services/marketing/digital-advertising' },
  { label: 'Social Media Management', href: '/services/marketing/social-media-management' },
  { label: 'Graphic Design', href: '/services/marketing/graphic-design' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'Academic Writing', href: '/services/academic-writing' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Writers', href: '/register/client' },
];

export default function ContentWritingPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/marketing/content-writing"
      serviceSchemaName="Professional Content Writing Services"
      serviceSchemaDescription="Professional content writing services for blogs, articles, website copy, SEO content, product descriptions, and marketing copy. Hire vetted content writers for engaging, conversion-focused content."
      heroEyebrow="Content Writing"
      heroTitle="Professional Content Writing Services | SEO-Optimized Content"
      heroIntro="Content is the foundation of digital marketing—but generic, keyword-stuffed, or poorly written content does more harm than good. Great content educates, engages, and converts. But finding writers who can craft compelling content that ranks well in search engines, speaks to your audience's needs, and drives action requires more than just grammar skills. TaskLynk connects you with vetted content writers—experts in SEO content, blog writing, website copy, product descriptions, and marketing content—who create content that performs. With secure milestone payments, NDA protection, and dedicated project management, your content strategy is in expert hands."
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
                This service is for businesses and organizations that need professional, engaging content. <strong>Online content creators and bloggers</strong> who need regular blog posts, articles, and SEO content to grow their audience and organic traffic. <strong>E-commerce businesses</strong> requiring compelling product descriptions, category page copy, and promotional content that drives sales. <strong>Startups and tech companies</strong> needing website copy, landing page content, technical documentation, and thought leadership content that establishes credibility. <strong>Marketing agencies</strong> who need high-quality content creation for client campaigns across multiple industries. <strong>SaaS companies</strong> requiring product copy, feature descriptions, use case content, and customer success stories. <strong>Healthcare practices</strong> needing patient education content, blog posts about medical topics, and website copy that builds trust. <strong>Real estate professionals</strong> who need property descriptions, neighborhood guides, and marketing content that attracts buyers and sellers. <strong>Financial advisors and consultants</strong> requiring thought leadership content, educational articles, and client communication materials.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need professional, original content—whether blog posts, website copy, product descriptions, or marketing content—our service provides vetted writers matched to your industry and content needs. We also support complementary services including <Link href="/services/marketing/seo-services" className="text-primary font-semibold hover:underline">SEO services</Link> for comprehensive search strategies, <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">digital advertising</Link>, and <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media content creation</Link>.
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
                What We Offer: Professional Content Tailored to Your Audience
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our content writing service covers a comprehensive range of content types, each crafted to meet specific business objectives. We begin with a <strong>briefing and strategy consultation</strong> to understand your target audience, content goals, brand voice, preferred tone, and key messages. Our content strategists then develop a content plan that maps to your business objectives, whether that's driving organic traffic, generating leads, building brand awareness, or supporting the customer journey from awareness to conversion. We create content that balances three critical elements: search engine optimization, audience engagement, and business goal alignment.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>SEO content and blog writing</strong>, our writers conduct keyword research using SEMrush, Ahrefs, and Google tools, then create content that naturally incorporates target keywords while maintaining readability and engagement. We structure content with proper heading hierarchies, internal linking opportunities, and call-to-action elements that guide readers toward conversion. For <strong>website copy</strong>, our writers craft compelling landing pages, about pages, product pages, and service descriptions that communicate value propositions clearly and drive action. We apply persuasive copywriting techniques including benefit-focused messaging, social proof integration, urgency creation, and conversion rate optimization principles. For <strong>product descriptions</strong>, we create compelling, SEO-optimized descriptions that highlight features, benefits, and unique selling propositions—written to drive sales while avoiding duplicate content penalties.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">SEO Content &amp; Blog Posts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Keyword-optimized articles and blog posts that rank in search engines and engage readers with valuable, original insights.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Website Copy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Compelling landing pages, service pages, and brand messaging that communicates value and drives conversions through persuasive copywriting.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Marketing Copy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Email campaigns, social media content, ad copy, case studies, white papers, and press releases optimized for engagement and conversion.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Technical &amp; Academic</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Technical documentation, academic abstracts, research summaries, and specialized content requiring subject-matter expertise.
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
                Quality Assurance and Originality Guarantee
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Quality is non-negotiable for content that represents your brand and drives your marketing results. Every piece of content we deliver undergoes our rigorous three-step quality assurance process. First, the primary writer drafts the content following your brief, incorporating your brand voice, target audience considerations, and content objectives. Second, a senior editor reviews the content for accuracy, clarity, structure, keyword integration, and engagement—verifying that the content meets both your requirements and industry best practices. Third, a proofreader conducts a final check for grammar, spelling, punctuation, and formatting consistency. For SEO content, we also verify keyword placement, heading structure, internal linking opportunities, and content length relative to competitors.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                All content is checked for originality using industry-standard plagiarism detection tools (Copyscape, Turnitin, Grammarly). We guarantee 100% original content—no AI-generated text, no spun content, no duplicate submissions. Each writer signs our confidentiality agreement, and all projects are handled with strict NDA protection. For content marketing strategies, we also offer ongoing support through our <Link href="/services/marketing/seo-services" className="text-primary font-semibold hover:underline">SEO services</Link> and <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>. For businesses needing <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation content</Link> or <Link href="/services/academic-writing" className="text-primary font-semibold hover:underline">academic writing</Link>, our network includes specialists in those areas as well. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures quality and consistency. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your content writing project</Link> today.
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
                Why TaskLynk for Content Writing Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Generic content writing—content produced without understanding your audience, industry, or objectives—wastes your marketing budget and can actually harm your brand. TaskLynk's marketplace connects you with vetted content writers who have not only excellent writing skills but also deep expertise in your industry and content type. Every writer in our network has passed a rigorous screening process including writing samples, subject-matter expertise verification, and plagiarism checks. We also match writers to projects based on their industry experience, ensuring your fintech content is written by someone who understands financial regulations, your healthcare content by someone familiar with medical terminology, and your legal content by someone versed in legal writing standards.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond writer expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve content before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the writer, track progress, and ensure content meets your specifications. <strong>NDA protection</strong> safeguards your brand strategies and content plans. For comprehensive digital marketing, we also offer <Link href="/services/marketing/seo-services" className="text-primary font-semibold hover:underline">SEO services</Link>, <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">digital advertising</Link>, <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>, and <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality content delivery, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your content project</Link> today to be matched with a qualified writer within hours. For writers seeking opportunities, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
