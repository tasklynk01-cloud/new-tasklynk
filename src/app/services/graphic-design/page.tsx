import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Palette,
  Sparkles,
  Layout,
  FileImage,
  Award,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';
import { ServiceTeamShowcase } from '@/components/site/service-team-showcase';
import { getPublishedSpecialists } from '@/lib/public-specialist-dto';

export const metadata: Metadata = generateServicePageMetadata(
  'Graphic Design & Brand Identity Services Kenya | TaskLynk Managed Creative',
  'Distinctive corporate branding, logo design, company profiles, investor pitch decks, and marketing collateral designed by accredited visual artists under managed quality assurance.',
  '/services/graphic-design'
);

const faqs = [
  {
    question: 'What design deliverables are included in a brand identity project?',
    answer:
      'A full brand identity package includes primary and secondary vector logos (.ai, .svg, .eps, .png), color palettes (HEX, RGB, CMYK), typography hierarchy, brand guidelines documentation, business card designs, and social media brand kits.',
  },
  {
    question: 'How many design revisions are permitted?',
    answer:
      'Every project includes multiple conceptual iterations and unlimited minor revisions within the agreed brief scope until you are 100% satisfied before final sign-off.',
  },
  {
    question: 'Do I receive full commercial rights and vector source files?',
    answer:
      'Yes. Upon milestone release, you receive complete intellectual property rights along with all native editable vector source files (Adobe Illustrator, Photoshop, InDesign, or Figma).',
  },
];

const relatedServices = [
  { label: 'Video Production & Editing', href: '/services/video-production' },
  { label: 'Website & Web Development', href: '/services/website-development' },
  { label: 'Professional Writing & Profiles', href: '/services/professional-writing' },
  { label: 'Business Research & Intelligence', href: '/services/business-research' },
];

const deliverables = [
  {
    title: 'Brand Identity & Logo Systems',
    description: 'Iconic, memorable visual identities with comprehensive brand guidelines, color theory, and multi-format vector assets.',
    icon: Palette,
  },
  {
    title: 'Corporate Profiles & Annual Reports',
    description: 'High-impact multi-page corporate capability profiles, brochures, and financial annual reports tailored for institutional clients.',
    icon: Layout,
  },
  {
    title: 'Investor Pitch Decks & Presentations',
    description: 'Visually compelling PowerPoint and Keynote slide decks engineered to captivate angel investors, venture funds, and board members.',
    icon: Eye,
  },
  {
    title: 'Marketing Collateral & Social Media Kits',
    description: 'Banners, flyers, roll-up banners, product catalogs, and branded social templates formatted for print and digital channels.',
    icon: FileImage,
  },
];

export default async function GraphicDesignPage() {
  const specialists = await getPublishedSpecialists({ category: 'design', limit: 3 });

  return (
    <ServicePageShell
      canonicalPath="/services/graphic-design"
      serviceSchemaName="Graphic Design and Brand Identity Services"
      serviceSchemaDescription="Custom corporate graphic design, brand identity systems, company profiles, and presentation design."
      heroEyebrow="Design & Creative"
      heroTitle="Graphic Design & Brand Identity Services"
      heroIntro="Elevate your company image with distinctive visual branding. TaskLynk coordinates accredited graphic designers and art directors to create memorable logos, corporate profiles, and pitch decks backed by dedicated creative management."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/client/new-job?service=Graphic+Design"
    >
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF7A3D] mb-2 block">
              Visual Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Design That Commands Attention &amp; Inspires Confidence
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              In a crowded market, premium aesthetics signal credibility and professionalism. Our design team translates your core mission into polished visual assets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {deliverables.map((item) => (
              <div
                key={item.title}
                className="linen-card rounded-2xl p-6 hover:border-[#FF7A3D] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceTeamShowcase
        title="Accredited Visual & Brand Designers"
        subtitle="Meet verified brand designers from TaskLynk’s creative department."
        specialists={specialists}
        serviceCategory="Graphic Design"
      />
    </ServicePageShell>
  );
}
