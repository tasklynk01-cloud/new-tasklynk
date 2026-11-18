import type { Metadata } from 'next';
import Link from 'next/link';
import { Palette, Layout, Images, PenTool, Smartphone, Gift, BarChart3, ShieldCheck } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional Graphic Design Services | Brand Identity & More',
  'Professional graphic design services including brand identity, logos, marketing materials, infographics, social media graphics, and packaging design. Hire vetted graphic designers.',
  '/services/marketing/graphic-design'
);

const faqs = [
  {
    question: 'What design services do you offer?',
    answer: 'We offer brand identity design (logos, color palettes, typography, brand guidelines), marketing materials (brochures, flyers, business cards, posters), digital graphics (social media posts, website graphics, email headers), infographics, presentation design, packaging design, signage, merchandise design, UI/UX design, and print design. We also provide design system creation and brand audit services.',
  },
  {
    question: 'Which design software do you use?',
    answer: 'Our designers are proficient in Adobe Creative Suite (Photoshop, Illustrator, InDesign, XD), Figma, Sketch, Canva, and other design tools. We deliver files in all common formats including vector (AI, EPS, SVG), raster (PSD, PNG, JPEG), print-ready PDF, and editable source files for ongoing modifications.',
  },
  {
    question: 'Do you create brand identity from scratch?',
    answer: 'Yes. We design complete brand identity systems including logo design, color palette selection, typography choices, brand guidelines, and visual language development. We also provide brand audits to update or refine existing identities. We work closely with you to ensure the brand reflects your values, targets your audience, and stands out from competitors.',
  },
  {
    question: 'How many revisions are included?',
    answer: 'We include two rounds of revisions for all design projects. The first round addresses major changes to layout, concept, and direction. The second round covers refinements and fine-tuning. Additional revision rounds incur a small fee. We believe in getting the design right rather than rushing to completion.',
  },
  {
    question: 'Can you match my existing brand colors and fonts?',
    answer: 'Yes. We can work with your existing brand guidelines, matching your colors, fonts, logo usage, and visual style. If you don\'t have brand guidelines, we can create a consistent visual identity based on your preferences and brand personality.',
  },
  {
    question: 'What file formats do you deliver?',
    answer: 'We deliver in multiple formats depending on the project needs: vector files (AI, EPS, SVG) for logos that need scaling, high-resolution raster files (PNG, JPEG) for digital use, print-ready PDFs for printing, and editable source files (PSD, AI, INDD) for ongoing modifications. We also provide brand guidelines in PDF format for reference.',
  },
];

const relatedServices = [
  { label: 'Content Writing', href: '/services/marketing/content-writing' },
  { label: 'Social Media Management', href: '/services/marketing/social-media-management' },
  { label: 'Video Editing', href: '/services/marketing/video-editing' },
  { label: 'SEO Services', href: '/services/marketing/seo-services' },
  { label: 'Presentation Design', href: '/services/business/presentation-design' },
  { label: 'Digital Advertising', href: '/services/marketing/digital-advertising' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Designers', href: '/register/client' },
];

export default function GraphicDesignPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/marketing/graphic-design"
      serviceSchemaName="Professional Graphic Design Services"
      serviceSchemaDescription="Professional graphic design services including brand identity, logos, marketing materials, infographics, social media graphics, and packaging design. Hire vetted graphic designers."
      heroEyebrow="Graphic Design"
      heroTitle="Professional Graphic Design Services | Brand Identity &amp; More"
      heroIntro="First impressions happen in milliseconds—and your visual identity determines whether potential customers see you as professional, trustworthy, and worth their attention. But creating a cohesive brand identity, compelling marketing materials, and engaging digital graphics requires creative expertise, design tools proficiency, and an understanding of how visuals influence perception. TaskLynk connects you with vetted graphic designers—experts in brand identity, logo design, marketing materials, infographics, and digital graphics—who create visually stunning designs that communicate your message and build your brand. With secure milestone payments, NDA protection, and dedicated project management, your visual identity is in expert hands."
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
                This service is for businesses and organizations that need professional visual design. <strong>Startups</strong> launching their brand who need logo design, brand identity, and initial marketing materials to establish professional credibility. <strong>Established businesses</strong> refreshing their visual identity, updating marketing materials, or creating new brand guidelines. <strong>E-commerce businesses</strong> needing product photography, social media graphics, website banners, and promotional materials that drive sales. <strong>Non-profit organizations</strong> that need advocacy materials, donor brochures, awareness campaigns, and social media graphics for their cause. <strong>Academic researchers</strong> who need conference posters, presentation slides, publication figures, and research visualization that communicates complex data clearly. <strong>Real estate agents</strong> who need property marketing materials, social media graphics, and presentation decks. <strong>Event organizers</strong> requiring invitations, posters, signage, and promotional materials. <strong>Small businesses</strong> who need regular design support without hiring a full-time designer. <strong>Agencies</strong> that need design augmentation for client projects and campaigns.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need professional graphic design—brand identity, logos, marketing materials, infographics, or digital graphics—our service provides vetted designers matched to your specific needs. We also support complementary services including <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>, <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editing</Link>, and <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link>.
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
                What We Offer: Strategic Visual Design Solutions
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our graphic design service covers the complete spectrum of visual design needs, from foundational brand identity to specialized marketing materials and digital graphics. We begin with a <strong>design brief and strategy consultation</strong> to understand your brand personality, target audience, competitive positioning, messaging priorities, and design preferences. Our specialists work with your existing brand guidelines or develop a new visual identity that reflects your values and resonates with your target audience. This phase produces a mood board, color palette exploration, typography recommendations, and initial concept directions.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>brand identity design</strong>, we create comprehensive visual systems including primary and secondary logos, color palettes with CMYK, RGB, and HEX values, typography selections, brand guidelines documenting usage rules, and visual assets for consistent brand application. For <strong>marketing materials</strong>, we design brochures, business cards, letterheads, flyers, posters, banners, and signage with print-ready specifications and bleed margins. For <strong>digital graphics</strong>, we create social media posts, website banners, email headers, infographics, and digital advertisements optimized for web and mobile viewing. For <strong>infographic design</strong>, we transform complex data and processes into clear, engaging visual narratives using information design principles, custom illustrations, and data visualization best practices. For <strong>packaging design</strong>, we create shelf-ready packaging with structural considerations, regulatory compliance, and visual appeal that attracts customers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Brand Identity Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Logo design, color palettes, typography, brand guidelines, and visual identity systems with consistent application rules.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Marketing Materials</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Brochures, flyers, business cards, posters, banners, and signage with print-ready specifications and professional quality.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Images className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Digital &amp; Infographic Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Social media graphics, website banners, infographics, and digital ads optimized for web, mobile, and social platform specifications.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Print Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Print-ready designs with proper bleed, CMYK color profiles, font embedding, and professional specifications for commercial printing.
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
                Industries and Design Specializations
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our graphic designers have expertise across diverse industries, each with unique visual languages and communication requirements. For <strong>tech startups and SaaS companies</strong>, our designers create modern, minimalist brand identities with clean typography, intuitive iconography, and digital-first design approaches that appeal to tech-savvy audiences. For <strong>healthcare and medical practices</strong>, designers create professional, trustworthy visuals with appropriate color psychology, clear communication, and compliance with healthcare advertising regulations. For <strong>financial services</strong>, we design professional, credible visuals with conservative color schemes, formal typography, and trust-building visual elements. For <strong>non-profit organizations</strong>, our designers create advocacy-focused visuals that communicate mission-driven messages with emotional resonance and professional credibility. For <strong>food and beverage businesses</strong>, we design appetizing, vibrant visuals with appropriate color palettes and imagery that evoke taste and appetite.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our designers also specialize in <strong>academic and educational design</strong>—creating conference posters, research figures, educational materials, and academic presentations with data visualization and information design expertise. For <strong>e-commerce businesses</strong>, designers create product-focused visuals, social media graphics, and promotional materials that drive conversions. For <strong>real estate professionals</strong>, we design property marketing materials, social media content, and presentation decks that showcase properties effectively. Our designers use Adobe Creative Suite (Photoshop, Illustrator, InDesign), Figma, Sketch, and other professional tools, delivering both source files and export-ready formats. For businesses needing <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media content</Link> alongside design, or <Link href="/services/business/presentation-design" className="text-primary font-semibold hover:underline">presentation design</Link> for investor decks, we offer integrated packages. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures design quality. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your design project</Link> today.
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
                Why TaskLynk for Graphic Design Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Visual design is not just aesthetics—it's communication. A well-designed brand identity builds trust, a compelling marketing material drives engagement, and professional-quality graphics signal credibility to your audience. TaskLynk's marketplace connects you with graphic designers who combine creative talent with strategic thinking and industry knowledge. Every designer in our network has a verified portfolio of completed projects, proficiency in professional design tools, and experience working with clients across diverse industries. Our screening process evaluates not just technical skill but also understanding of design principles, color theory, typography, brand psychology, and the ability to translate business objectives into effective visual solutions.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond design expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each design phase before payment is released, ensuring you're satisfied with the work. <strong>Dedicated project managers</strong> coordinate between you and the designer, manage revision rounds, and ensure the design meets your brand objectives. <strong>NDA protection</strong> safeguards your business concepts and design specifications. For comprehensive marketing solutions, we also offer <Link href="/services/marketing/content-writing" className="text-primary font-semibold hover:underline">content writing</Link>, <Link href="/services/marketing/social-media-management" className="text-primary font-semibold hover:underline">social media management</Link>, <Link href="/services/marketing/video-editing" className="text-primary font-semibold hover:underline">video editing</Link>, and <Link href="/services/marketing/digital-advertising" className="text-primary font-semibold hover:underline">digital advertising</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures design quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your design project</Link> today. For designers, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our network</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
