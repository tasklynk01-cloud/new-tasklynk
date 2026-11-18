import type { Metadata } from 'next';
import Link from 'next/link';
import { Presentation, Layout, BarChart3, FileText, Images, Smartphone, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Professional Presentation Design Services | PowerPoint & Pitch Decks',
  'Professional presentation design services including PowerPoint decks, pitch decks, investor presentations, and slide design. Hire vetted presentation designers for compelling visual storytelling.',
  '/services/business/presentation-design'
);

const faqs = [
  {
    question: 'What presentation design services do you offer?',
    answer: 'We offer PowerPoint presentation design, pitch deck creation, investor presentation slides, executive summary decks, training presentation materials, conference talk slides, webinar presentations, and report-to-presentation conversion. We also create custom visual templates, data visualization charts, infographics, and branded slide decks that align with your visual identity.',
  },
  {
    question: 'How many slides do you need for a typical pitch deck?',
    answer: 'A standard investor pitch deck typically has 10-15 slides covering problem, solution, market size, product, business model, traction, competition, team, financials, and ask. We can customize the length based on your audience and objectives. We also provide guidance on optimal content density and visual hierarchy for maximum impact.',
  },
  {
    question: 'Do you create presentations from scratch or improve existing ones?',
    answer: 'Both. We design presentations from scratch based on your content and requirements, and we also overhaul existing presentations with improved design, structure, and visual appeal. We work with your existing brand guidelines or create a new visual identity for your presentation. We also convert written reports, research papers, or business plans into compelling presentation formats.',
  },
  {
    question: 'What file formats do you deliver?',
    answer: 'We deliver in multiple formats: PowerPoint (.pptx) for full editability, PDF for presentation and sharing, Google Slides for collaborative editing, Keynote for Apple users, and high-resolution PNG images of individual slides for use in other materials. We also provide speaker notes and presentation scripts as needed.',
  },
  {
    question: 'Can you incorporate my brand colors and fonts?',
    answer: 'Yes. We create presentations that match your brand identity, incorporating your colors, fonts, logo, and visual style. If you don\'t have brand guidelines, we can develop a clean, professional visual identity for your presentation that aligns with your industry and audience expectations.',
  },
  {
    question: 'How quickly can you design a presentation?',
    answer: 'Standard presentation design takes 2-5 business days depending on complexity and length. We offer express 24-hour service for urgent presentations, and even 3-hour service for emergency requests. You choose your preferred timeline, and we match you with a designer who can commit to your deadline.',
  },
];

const relatedServices = [
  { label: 'Business Plan Writing', href: '/services/business/business-plans' },
  { label: 'Financial Analysis', href: '/services/business/financial-analysis' },
  { label: 'Market Research', href: '/services/business/market-research' },
  { label: 'Graphic Design', href: '/services/marketing/graphic-design' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'Business Analysis', href: '/services/business/business-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Designers', href: '/register/client' },
];

export default function PresentationDesignPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/business/presentation-design"
      serviceSchemaName="Professional Presentation Design Services"
      serviceSchemaDescription="Professional presentation design services including PowerPoint decks, pitch decks, investor presentations, and slide design with compelling visual storytelling. Hire vetted presentation designers."
      heroEyebrow="Presentation Design"
      heroTitle="Professional Presentation Design Services | PowerPoint &amp; Pitch Decks"
      heroIntro="In business, how you present is as important as what you present. A compelling idea delivered through a cluttered, poorly designed PowerPoint can fall flat. But the same idea—presented with clear visual hierarchy, professional design, and strategic storytelling—can secure funding, win clients, and inspire teams. TaskLynk connects you with vetted presentation designers—experts in PowerPoint, pitch deck creation, data visualization, and visual storytelling—who transform your content into compelling presentations that command attention. With secure milestone payments, NDA protection, and dedicated project management, your story gets the professional delivery it deserves."
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
                This service is for professionals and organizations that need to present ideas compellingly. <strong>Startup founders</strong> preparing investor pitch decks, seed funding presentations, or demo day slides who need designs that communicate urgency, potential, and competitive advantage. <strong>Sales professionals</strong> who need client presentation decks, proposal presentations, or sales enablement materials that win deals. <strong>Academic researchers</strong> presenting findings at conferences, thesis defenses, or departmental seminars who need slides that clarify complex data and arguments. <strong>Consultants</strong> who need client presentation materials with professional design that reinforces their expertise and recommendations. <strong>Executives and managers</strong> presenting to boards of directors, leadership teams, or company-wide meetings who need polished slides that communicate with authority and clarity. <strong>Marketing teams</strong> creating campaign presentations, product launches, or customer-facing materials that need compelling visual storytelling. <strong>Students</strong> preparing class presentations, project demonstrations, or competition entries who need professional-quality slides. <strong>Non-profit organizations</strong> creating donor presentations, impact reports, or advocacy materials that need compelling visual narratives.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you have content that needs to be transformed into a compelling presentation—whether a pitch deck, business review, conference talk, or training session—our presentation design service provides expert-level design talent. We also support complementary services including <Link href="/services/business/business-plans" className="text-primary font-semibold hover:underline">business plan writing</Link>, <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis and modeling</Link> with <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link>, and <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link> for broader visual identity.
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
                What We Offer: Strategic Visual Storytelling
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our presentation design service goes beyond making slides look pretty—it focuses on strategic visual storytelling that guides your audience through your narrative with clarity and impact. We begin with a <strong>content strategy session</strong> to understand your audience, objectives, key messages, and preferred narrative structure. Our designers work with your existing content (written materials, research findings, business plans, or raw data) to identify the most compelling story arcs and logical flow. We then create a <strong>slide structure outline</strong> that organizes your content into a logical progression—typically following a problem-solution-evidence-action framework—that builds momentum and guides your audience toward your desired conclusion.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>pitch deck creation</strong>, our specialists follow proven frameworks like the Sequoia pitch deck guide, designing slides that address the key questions investors ask: What problem are you solving? How big is the opportunity? What is your solution? How do you make money? Who is on your team? We create data visualizations that make complex financials and metrics accessible, design product screenshots that showcase value, and structure competitive analyses that highlight your differentiation. For <strong>data-heavy presentations</strong>, our designers transform tables, spreadsheets, and statistical output into clear charts, graphs, and infographics using principles of visual perception and information design. We ensure every data point is visible, comparable, and meaningful—replacing dense Excel screenshots with purpose-built visualizations that communicate insights at a glance.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Presentation className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Pitch Deck Design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Investor-ready pitch decks with compelling narratives, data visualization, market analysis, and clear calls to action for funding rounds.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Images className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Visualization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transformation of spreadsheets and reports into clear charts, graphs, and infographics optimized for presentation clarity.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Visual Identity</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Brand-aligned templates with your colors, fonts, and logo. Professional design systems for consistent presentation quality.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Multiple Formats</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Delivery in PowerPoint, Google Slides, Keynote, PDF, and PNG formats with speaker notes and presentation scripts.
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
                Presentation Types and Audiences We Serve
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our presentation designers specialize in creating compelling materials for diverse audiences and contexts. For <strong>investor pitch decks</strong>, we design presentations following Sequoia, Y Combinator, and 500 Startups frameworks—10-15 slides covering problem, solution, market, traction, team, competition, product, business model, financials, and ask. Our designers ensure financial slides are clear and compelling, market analysis is data-backed, and the ask is specific and justified. For <strong>academic conference presentations</strong>, we create slides that distill complex research into clear narratives, with effective data visualization, readable figures, and speaker notes that guide the presentation flow. For <strong>executive board presentations</strong>, we design boardroom-ready decks with strategic insights, KPI dashboards, risk assessments, and clear recommendations. For <strong>sales presentations</strong>, we create client-facing materials with compelling value propositions, case studies, testimonials, and persuasive closing arguments.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>training and workshop materials</strong>, we design engaging slide decks with interactive elements, exercises, and visual aids that facilitate learning. For <strong>annual reports and stakeholder communications</strong>, we create corporate presentations with annual results, strategic updates, and forward-looking statements. For <strong>student projects</strong>, we help develop academic presentation materials that clearly communicate research findings and analysis. Our designers work with Microsoft PowerPoint, Google Slides, Apple Keynote, and specialized tools like Figma and Adobe Creative Suite for custom graphics. For complex data presentations, we integrate with <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization specialists</Link> to ensure charts and dashboards are presentation-ready. For full business documentation, we collaborate with <Link href="/services/business/business-plans" className="text-primary font-semibold hover:underline">business plan writers</Link> and <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysts</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures your presentation tells a compelling story. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your presentation project</Link> today.
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
                Why TaskLynk for Presentation Design
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                A presentation is only as good as the story it tells and the impression it leaves. Poor design—cluttered slides, illegible fonts, confusing data visualizations, and weak narrative flow—can undermine even the best content and cause your message to be lost. TaskLynk's marketplace connects you with presentation designers who combine visual design expertise with storytelling intuition and audience psychology. Every presentation designer in our network has a minimum of 5 years of professional design experience, with portfolios demonstrating expertise in visual hierarchy, color theory, typography, and information design. We also evaluate their ability to translate complex content—financial data, research findings, technical concepts—into clear, compelling visuals.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond design expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve the design direction before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the designer, manage revision rounds, and ensure the presentation meets your audience and objectives. <strong>NDA protection</strong> safeguards your business strategies, financial data, and confidential information. For comprehensive business documentation, we also offer <Link href="/services/business/business-plans" className="text-primary font-semibold hover:underline">business plan writing</Link>, <Link href="/services/business/financial-analysis" className="text-primary font-semibold hover:underline">financial analysis</Link>, and <Link href="/services/marketing/graphic-design" className="text-primary font-semibold hover:underline">graphic design</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures presentation quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your presentation project</Link> today to be matched with a designer within hours. For designers seeking opportunities, <Link href="/register/freelancer" className="text-primary font-semibold hover:underline">join our freelancer network</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
